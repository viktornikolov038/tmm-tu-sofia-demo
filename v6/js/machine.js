/* The site is a machine: a crank turns a Geneva drive that indexes a six-face drum. */
(function(){
'use strict';
const TM=window.TMM=window.TMM||{};
const PI=Math.PI,TAU=PI*2,N=6,STEP=TAU/N,BETA=PI/2-PI/N,R_PIN=Math.sin(PI/N),C=1;
const A0=PI,AMAX=PI+(N-1)*TAU;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const reduce=matchMedia('(prefers-reduced-motion:reduce)').matches;
const ST={line:'#f2f0e6',dim:'rgba(242,240,230,.4)',faint:'rgba(242,240,230,.12)',acc:'#ffd000',fill:'rgba(255,208,0,.06)',bg:'#101010',txt:'rgba(242,240,230,.6)'};

/* ───────── kinematics of the Geneva drive ───────── */
const psiU=a=>{let v=Math.atan2(R_PIN*Math.sin(a),R_PIN*Math.cos(a)-C);if(v<0)v+=TAU;return v};
function genRot(tot){
  const m=Math.floor((tot+BETA)/TAU),thp=tot-m*TAU;
  const rot=thp<BETA?-m*STEP+(psiU(thp)-psiU(-BETA)):-m*STEP-STEP;
  return{rot,thp,engaged:thp<BETA};
}
const dwell=k=>k*TAU+PI;
function settle(a){
  const kk=Math.round(a/TAU),c=kk*TAU;
  if(kk>=1&&Math.abs(a-c)<BETA)a=a>=c?c+BETA:c-BETA;
  return clamp(a,A0,AMAX);
}

/* ───────── sound (opt-in, synthesised) ───────── */
const Sfx={on:false,ctx:null,noise:null,
  init(){
    if(!this.ctx){const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;this.ctx=new AC();
      const len=Math.floor(this.ctx.sampleRate*.06),b=this.ctx.createBuffer(1,len,this.ctx.sampleRate),d=b.getChannelData(0);
      for(let i=0;i<len;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/len,3);this.noise=b}
    if(this.ctx.state==='suspended')this.ctx.resume();
  },
  clack(v){
    if(!this.on||!this.ctx)return;const c=this.ctx,t=c.currentTime;
    const s=c.createBufferSource();s.buffer=this.noise;const bp=c.createBiquadFilter();bp.type='bandpass';bp.frequency.value=1500+Math.random()*500;bp.Q.value=1.1;
    const g=c.createGain();g.gain.value=.55*v;s.connect(bp);bp.connect(g);g.connect(c.destination);s.start(t);
    const o=c.createOscillator();o.type='triangle';o.frequency.setValueAtTime(170,t);o.frequency.exponentialRampToValueAtTime(55,t+.09);
    const g2=c.createGain();g2.gain.setValueAtTime(.32*v,t);g2.gain.exponentialRampToValueAtTime(.001,t+.13);o.connect(g2);g2.connect(c.destination);o.start(t);o.stop(t+.14);
  },
  tick(){
    if(!this.on||!this.ctx)return;const c=this.ctx,t=c.currentTime,s=c.createBufferSource();s.buffer=this.noise;
    const hp=c.createBiquadFilter();hp.type='highpass';hp.frequency.value=3200;const g=c.createGain();g.gain.value=.07;s.connect(hp);hp.connect(g);g.connect(c.destination);s.start(t);
  }
};
TM.Sfx=Sfx;

/* ───────── state ───────── */
let alpha=A0,tgt=A0,idx=0,machine=false,dragging=false,lastInput=0,settled=true,prevEng=false,prevTick=0,current=-1,touched=false,revEl=null;
const body=document.body;
let drumEl,wrapEl,chapters,dotsEl,crankCv,genevaCv,bgCv,stages=[];

/* ───────── odometers ───────── */
function buildOdos(){
  $$('.odo').forEach(od=>{
    const v=od.dataset.v;od.innerHTML='';od._d=[];
    [...v].forEach((ch,i)=>{
      if(/\d/.test(ch)){const dg=document.createElement('span');dg.className='dg';const inn=document.createElement('i');inn.style.setProperty('--dl',(i*.14)+'s');
        for(let d=0;d<10;d++){const s=document.createElement('span');s.textContent=d;inn.appendChild(s)}dg.appendChild(inn);od.appendChild(dg);od._d.push([inn,+ch])}
      else{const s=document.createElement('span');s.textContent=ch;s.style.padding='0 .04em';od.appendChild(s)}
    });
  });
}
function odos(on){$$('.odo').forEach(od=>od._d.forEach(([inn,d])=>{inn.style.transform=on?'translateY(-'+(d*1.2)+'em)':'translateY(0)'}))}

/* ───────── drum ───────── */
function sizeDrum(){
  if(!wrapEl)return;const H=wrapEl.clientHeight,R=H/(2*Math.tan(PI/N));chapters.style.setProperty('--R',R.toFixed(1)+'px');drumEl._R=R;
}
function applyDrum(){
  drumEl.style.transform='translateZ('+(-drumEl._R)+'px) rotateX('+(-idx*60).toFixed(3)+'deg)';
  chapters.querySelectorAll('.ch').forEach((ch,k)=>{const d=Math.abs(idx-k);ch.style.opacity=d<.02?1:Math.max(0,1-d*.5).toFixed(2)});
  const cur=clamp(Math.round(idx),0,N-1);
  if(cur!==current){current=cur;
    chapters.querySelectorAll('.ch').forEach((ch,k)=>{if(k===cur)ch.removeAttribute('inert');else ch.setAttribute('inert','')});
    $$('#dots button').forEach((b,k)=>{b.classList.toggle('on',k===cur);b.setAttribute('aria-current',k===cur)});
    crankCv.setAttribute('aria-valuenow',cur+1);
  }
  if(Math.abs(idx-1)<.08)odos(true);else if(Math.abs(idx-1)>.7)odos(false);
}

/* ───────── drawing ───────── */
function drawGeneva(x,w,h){
  x.clearRect(0,0,w,h);
  TM.MECH.geneva.draw(x,w,h,alpha/.9,ST,{n:N},{});
}
function drawCrank(x,w,h){
  const D=TM.draw,cx=w/2,cy=h*.5,R=Math.min(w,h)*.38;
  // flywheel (gear) turning counter-clockwise with the handle
  D.gearPath(x,cx,cy,R,22,-alpha,R*.07);x.fillStyle='rgba(255,208,0,.05)';x.fill();D.stroke(x,ST.dim,1.4);
  x.beginPath();x.arc(cx,cy,R*.78,0,TAU);D.stroke(x,ST.faint,1.2);
  for(let i=0;i<3;i++){const a=-alpha+i*TAU/3;x.beginPath();x.moveTo(cx+Math.cos(a)*R*.16,cy+Math.sin(a)*R*.16);x.lineTo(cx+Math.cos(a)*R*.78,cy+Math.sin(a)*R*.78);D.stroke(x,ST.dim,6);x.strokeStyle='#141414';x.lineWidth=4;x.stroke()}
  // dial ticks
  for(let i=0;i<24;i++){const a=i/24*TAU;x.beginPath();x.moveTo(cx+Math.cos(a)*R*1.12,cy+Math.sin(a)*R*1.12);x.lineTo(cx+Math.cos(a)*R*(i%6?1.17:1.24),cy+Math.sin(a)*R*(i%6?1.17:1.24));D.stroke(x,i%6?ST.faint:ST.dim,1)}
  // handle
  const ha=-alpha,hx=cx+Math.cos(ha)*R*.86,hy=cy+Math.sin(ha)*R*.86;
  D.bar(x,[cx,cy],[hx,hy],R*.075);x.fillStyle='#1a1a1a';x.fill();D.stroke(x,ST.line,1.6);
  x.beginPath();x.arc(cx,cy,R*.13,0,TAU);x.fillStyle='#0c0c0c';x.fill();D.stroke(x,ST.line,1.6);x.beginPath();x.arc(cx,cy,R*.04,0,TAU);x.fillStyle=ST.acc;x.fill();
  const pulse=touched?0:(Math.sin(performance.now()/260)+1)/2;
  x.beginPath();x.arc(hx,hy,R*.12,0,TAU);x.fillStyle=ST.acc;x.fill();x.beginPath();x.arc(hx,hy,R*(.17+.06*pulse),0,TAU);D.stroke(x,ST.acc,2);
  // direction arrow (counter-clockwise)
  const ra=R*1.3;x.beginPath();x.arc(cx,cy,ra,-2.6,-1.55);D.stroke(x,ST.acc,2);
  const ex=cx+Math.cos(-1.55)*ra,ey=cy+Math.sin(-1.55)*ra;x.beginPath();x.moveTo(ex+9,ey-7);x.lineTo(ex,ey);x.lineTo(ex+9,ey+7);D.stroke(x,ST.acc,2);
  if(revEl)revEl.firstChild.textContent=((alpha-A0)/TAU).toFixed(1).replace('.',TM.lang==='en'?'.':',')+' ';
}
/* background gear train: a quiet, always-moving machine behind everything */
const DEFS=[{z:40},{z:20,p:0,a:28},{z:30,p:1,a:-14},{z:16,p:2,a:52},{z:24,p:0,a:152},{z:34,p:4,a:214},{z:18,p:3,a:8}];
function drawBg(x,w,h){
  x.clearRect(0,0,w,h);const D=TM.draw,m=Math.min(w,h)/38;
  const ang=machine?alpha*.3:(performance.now()/1000)*.12+scrollY*.002;
  DEFS.forEach(d=>{d.r=d.z*.5;if(d.p==null){d.x=0;d.y=0}else{const p=DEFS[d.p],a=d.a*PI/180,dist=p.r+d.r;d.th=a;d.x=p.x+Math.cos(a)*dist;d.y=p.y+Math.sin(a)*dist}});
  const xs=DEFS.map(d=>d.x),ys=DEFS.map(d=>d.y),cxm=(Math.min(...xs)+Math.max(...xs))/2,cym=(Math.min(...ys)+Math.max(...ys))/2;
  DEFS[0].phi=ang;for(let i=1;i<DEFS.length;i++){const d=DEFS[i],p=DEFS[d.p];d.phi=d.th+PI-PI/d.z+(p.z/d.z)*(d.th-p.phi)}
  x.lineWidth=1.3;
  DEFS.forEach((d,i)=>{const px=w*.5+(d.x-cxm)*m,py=h*.5-(d.y-cym)*m;
    D.gearPath(x,px,py,d.r*m,d.z,-d.phi,m*.5);x.strokeStyle='rgba(255,208,0,'+(i%2?.1:.15)+')';x.stroke();
    x.beginPath();x.arc(px,py,d.r*m*.22,0,TAU);x.strokeStyle='rgba(255,208,0,.12)';x.stroke()});
}

/* ───────── input ───────── */
function bump(){lastInput=performance.now();settled=false;touched=true;Sfx.init()}
function goTo(k){bump();tgt=clamp(dwell(clamp(k,0,N-1)),A0,AMAX)}
TM.goTo=goTo;
/* one wheel gesture = one page; momentum tails are swallowed by a short lock */
let wheelLock=0;
function onWheel(e){
  if(!machine||document.getElementById('shop').hidden===false)return;
  e.preventDefault();const dy=e.deltaMode===1?e.deltaY*32:e.deltaY,now=performance.now();
  if(Math.abs(dy)<4)return;
  if(now<wheelLock){wheelLock=Math.max(wheelLock,now+220);return}
  goTo(clamp(Math.round(idx),0,N-1)+(dy>0?1:-1));wheelLock=now+850;
}
function onKey(e){
  if(!machine||document.getElementById('shop').hidden===false)return;
  if(/INPUT|TEXTAREA|SELECT/.test((document.activeElement||{}).tagName))return;
  const k=clamp(Math.round(idx),0,N-1);
  if(['ArrowRight','ArrowDown','PageDown',' '].includes(e.key)){e.preventDefault();goTo(k+1)}
  else if(['ArrowLeft','ArrowUp','PageUp'].includes(e.key)){e.preventDefault();goTo(k-1)}
  else if(e.key==='Home'){e.preventDefault();goTo(0)}else if(e.key==='End'){e.preventDefault();goTo(N-1)}
  else if(/^[1-6]$/.test(e.key))goTo(+e.key-1);
}
function crankInput(cv){
  let last=null;
  const ang=e=>{const r=cv.getBoundingClientRect();return Math.atan2(-(e.clientY-(r.top+r.height*.5)),e.clientX-(r.left+r.width*.5))};
  cv.addEventListener('pointerdown',e=>{dragging=true;try{cv.setPointerCapture(e.pointerId)}catch(_){}cv.classList.add('grab');last=ang(e);bump()});
  cv.addEventListener('pointermove',e=>{if(!dragging)return;const a=ang(e);let d=a-last;if(d>PI)d-=TAU;if(d<-PI)d+=TAU;last=a;tgt=clamp(tgt+d,A0,AMAX);bump()});
  const end=()=>{dragging=false;cv.classList.remove('grab');lastInput=performance.now()};
  cv.addEventListener('pointerup',end);cv.addEventListener('pointercancel',end);
  cv.addEventListener('keydown',e=>{if(e.key==='ArrowRight'||e.key==='ArrowUp'){e.preventDefault();e.stopPropagation();goTo(Math.round(idx)+1)}if(e.key==='ArrowLeft'||e.key==='ArrowDown'){e.preventDefault();e.stopPropagation();goTo(Math.round(idx)-1)}});
}
function touchSwipe(el){
  let y0=null;
  el.addEventListener('touchstart',e=>{y0=e.touches[0].clientY},{passive:true});
  el.addEventListener('touchmove',e=>{if(!machine||y0==null)return;const y=e.touches[0].clientY;tgt=clamp(tgt+(y0-y)*.012,A0,AMAX);y0=y;bump()},{passive:true});
}

/* ───────── mode ───────── */
TM.mode={
  get on(){return machine},
  set(on,persist){
    machine=on;body.classList.toggle('machine',on);body.classList.toggle('plain',!on);
    $('#modeBtn').setAttribute('aria-pressed',on);$('#modeTxt').textContent=on?(TM.lang==='en'?'Plain mode':'Обикновен режим'):(TM.lang==='en'?'Machine mode':'Машинен режим');
    $('#modeTxt').dataset.on=on?1:0;
    if(on){window.scrollTo(0,0);sizeDrum();current=-1;applyDrum()}
    else{drumEl.style.transform='';chapters.querySelectorAll('.ch').forEach(ch=>{ch.style.opacity='';ch.removeAttribute('inert')});odos(true)}
    stages.forEach(o=>o.dirty=true);
    if(persist){try{localStorage.setItem('tmm-mode',on?'machine':'plain')}catch(e){}}
  },
  label(){$('#modeTxt').textContent=machine?(TM.lang==='en'?'Plain mode':'Обикновен режим'):(TM.lang==='en'?'Machine mode':'Машинен режим')}
};
const wide=()=>innerWidth>=1000&&innerHeight>=620;

/* ───────── boot ───────── */
document.addEventListener('DOMContentLoaded',()=>{
  drumEl=$('#drum');wrapEl=$('.drum-wrap');chapters=$('#chapters');dotsEl=$('#dots');crankCv=$('#crankCv');genevaCv=$('#genevaCv');bgCv=$('#bgCv');revEl=$('#rev');
  chapters.querySelectorAll('.ch').forEach((ch,k)=>ch.style.setProperty('--k',k));
  buildOdos();odos(true);
  for(let k=0;k<N;k++){const b=document.createElement('button');b.type='button';b.textContent=k+1;b.setAttribute('aria-label','Page '+(k+1));b.onclick=()=>goTo(k);const li=document.createElement('li');li.appendChild(b);dotsEl.appendChild(li)}
  stages=[TM.stage(genevaCv,(x,w,h)=>drawGeneva(x,w,h),ST),TM.stage(crankCv,(x,w,h)=>drawCrank(x,w,h),ST),TM.stage(bgCv,(x,w,h)=>drawBg(x,w,h),ST)];
  new ResizeObserver(sizeDrum).observe(wrapEl);
  crankInput(crankCv);touchSwipe(wrapEl);
  addEventListener('wheel',onWheel,{passive:false});addEventListener('keydown',onKey);
  addEventListener('resize',()=>{if(machine&&!wide())TM.mode.set(false,false)});
  let saved=null;try{saved=localStorage.getItem('tmm-mode')}catch(e){}
  TM.mode.set(saved?saved==='machine'&&wide():(wide()&&!reduce),false);
  const hm=location.hash.match(/^#(?:p(\d)|a=(-?[\d.]+))$/);
  if(hm&&machine){const v=hm[1]!=null?dwell(clamp(+hm[1]-1,0,N-1)):clamp(+hm[2],A0,AMAX);alpha=tgt=v;touched=true}
  let last=performance.now();
  (function frame(now){
    const dt=Math.min((now-last)/1000,.05);last=now;
    if(machine){
      if(!dragging&&!settled&&performance.now()-lastInput>380){tgt=settle(tgt);settled=true}
      const k=1-Math.exp(-dt*(reduce?60:8));alpha+=(tgt-alpha)*k;if(Math.abs(tgt-alpha)<1e-4)alpha=tgt;
      const g=genRot(alpha);idx=-g.rot/STEP-1;
      if(g.engaged!==prevEng){Sfx.clack(g.engaged?.8:1.2);prevEng=g.engaged}
      const t=Math.floor(alpha/(PI/12));if(t!==prevTick){prevTick=t;Sfx.tick()}
      applyDrum();stages.forEach(o=>o.dirty=true);
    }else{stages[2].dirty=true}
    requestAnimationFrame(frame);
  })(last);
});
})();
