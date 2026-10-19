/* v15: the gear music box — four gears with a different number of teeth share one pinion.
   Every tooth that passes the reed plucks a note; the rhythm repeats after LCM(teeth) steps. */
(function(){
'use strict';
const root=document.getElementById('inst');if(!root)return;
const EN=document.documentElement.lang==='en';
const L=(b,e)=>EN?e:b;
const $=(s,r)=>(r||document).querySelector(s),$$=(s,r)=>[...(r||document).querySelectorAll(s)];
const reduce=matchMedia('(prefers-reduced-motion:reduce)').matches;
const TAU=Math.PI*2,ZP=24;
const css=n=>getComputedStyle(document.documentElement).getPropertyValue(n).trim();
const store={get(k){try{return localStorage.getItem(k)}catch(e){return null}},set(k,v){try{localStorage.setItem(k,v)}catch(e){}}};

/* ---------- state ---------- */
const SCALES={
  pent:{n:L('Пентатоника (мажор)','Pentatonic (major)'),s:[0,2,4,7,9]},
  minor:{n:L('Пентатоника (минор)','Pentatonic (minor)'),s:[0,3,5,7,10]},
  hira:{n:L('Хирайоши','Hirajoshi'),s:[0,2,3,7,8]},
  whole:{n:L('Целотонова','Whole tone'),s:[0,2,4,6,8,10]}
};
const THETA=[-3*Math.PI/4,-Math.PI/4,Math.PI/4,3*Math.PI/4];
const OCT=[-12,0,12,24];                      // bigger gear = lower voice
const st={z:[16,12,9,8],bpm:112,scale:'pent',play:false,mute:false,mask:[],touched:false};
function euclid(z,k){const m=[];for(let i=0;i<z;i++)m.push(Math.floor((i+1)*k/z)-Math.floor(i*k/z)>0);return m}
st.mask=[euclid(16,5),euclid(12,4),euclid(9,3),euclid(8,3)];
const gcd=(a,b)=>b?gcd(b,a%b):a,lcm=(a,b)=>a/gcd(a,b)*b;

/* ---------- audio ---------- */
let ac=null,master=null,uBase=0,tBase=0,nextN=0,nextT=0,timer=0,noiseBuf=null;
const stepDur=()=>60/(st.bpm*2);
const now=()=>ac?ac.currentTime:performance.now()/1000;
function ensureAudio(){
  if(!ac){
    const C=window.AudioContext||window.webkitAudioContext;if(!C)return;
    ac=new C();master=ac.createGain();master.gain.value=st.mute?0:.8;
    const cm=ac.createDynamicsCompressor();master.connect(cm);cm.connect(ac.destination);
    noiseBuf=ac.createBuffer(1,ac.sampleRate*.04,ac.sampleRate);const d=noiseBuf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*(1-i/d.length);
  }
  if(ac.state==='suspended')ac.resume();
}
function pluck(f,t,vel){
  const P=[[1,1],[2.76,.32],[5.4,.1]];
  P.forEach(p=>{
    const o=ac.createOscillator(),g=ac.createGain();o.type='sine';o.frequency.value=f*p[0];
    g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vel*.2*p[1],t+.003);g.gain.exponentialRampToValueAtTime(.0001,t+(p[0]===1?1.5:.5));
    o.connect(g);g.connect(master);o.start(t);o.stop(t+1.6);
  });
}
function tick(t){
  const s=ac.createBufferSource(),g=ac.createGain(),hp=ac.createBiquadFilter();s.buffer=noiseBuf;hp.type='highpass';hp.frequency.value=2500;g.gain.value=.045;
  s.connect(hp);hp.connect(g);g.connect(master);s.start(t);
}
const freq=(k,i)=>{const sc=SCALES[st.scale].s,deg=sc[i%sc.length]+Math.floor(i/sc.length)%2*12;return 220*Math.pow(2,(deg+OCT[k]+(k===0?0:0))/12)};
const events=[];                                  // visual plucks
const cidx=[0,0,0,0];                             // tooth index at the reed for step n: (n + c) mod z
function schedule(){
  while(nextT<ac.currentTime+.14){
    const n=nextN;tick(nextT);
    for(let k=0;k<4;k++){
      const z=st.z[k],i=((n+cidx[k])%z+z)%z;
      if(st.mask[k][i]){pluck(freq(k,i),nextT,.9);}
      events.push({t:nextT,k:k,i:i,on:st.mask[k][i]});
    }
    nextT+=stepDur();nextN++;
  }
}
function curU(){if(!st.play)return uBase;return uBase+(now()-tBase)/stepDur()}
function rebase(){const u=curU();uBase=u;tBase=now();if(ac&&st.play){nextN=Math.max(nextN,Math.ceil(u));nextT=tBase+(nextN-uBase)*stepDur()}}
function start(){
  ensureAudio();tBase=now();
  if(ac){nextN=Math.ceil(uBase);nextT=tBase+(nextN-uBase)*stepDur();clearInterval(timer);timer=setInterval(schedule,25);schedule()}
  st.play=true;upd();
}
function stop(){uBase=curU();st.play=false;clearInterval(timer);upd()}

/* ---------- canvas ---------- */
const cvs=$('canvas',root),ctx=cvs.getContext('2d');let W=0,H=0,dpr=1,geo=[null,null,null,null],defl=[0,0,0,0],flash=[{},{},{},{}];
function fit(){const r=cvs.getBoundingClientRect();dpr=Math.min(devicePixelRatio||1,2);W=r.width;H=r.height;cvs.width=Math.max(1,W*dpr);cvs.height=Math.max(1,H*dpr);ctx.setTransform(dpr,0,0,dpr,0,0)}
new ResizeObserver(fit).observe(cvs);fit();
const al=z=>TAU/z;
function gearPath(x,y,z,m,rot,mask,col){
  const r=z*m/2,a=al(z),rr=r-1.25*m,ra=r+m;
  ctx.beginPath();ctx.arc(x,y,rr+.08*m,0,TAU);ctx.fillStyle=col.body;ctx.fill();ctx.lineWidth=2;ctx.strokeStyle=col.ink;ctx.stroke();
  for(let i=0;i<z;i++){
    const c=rot+i*a,pts=[[rr,c-.30*a],[ra,c-.14*a],[ra,c+.14*a],[rr,c+.30*a]];
    ctx.beginPath();pts.forEach((q,j)=>{const px=x+q[0]*Math.cos(q[1]),py=y+q[0]*Math.sin(q[1]);j?ctx.lineTo(px,py):ctx.moveTo(px,py)});ctx.closePath();
    const fl=flash[0]&&0;ctx.fillStyle=mask[i]?col.on:col.off;ctx.fill();ctx.lineWidth=2;ctx.strokeStyle=col.ink;ctx.lineJoin='round';ctx.stroke();
  }
}
let lastIdx=[-1,-1,-1,-1];
function frame(){
  requestAnimationFrame(frame);
  if(!vis)return;
  const col={ink:css('--ink')||'#14110d',on:css('--gold')||'#ff5a36',off:css('--bg')||'#f4efe4',body:css('--bg2')||'#ebe4d4',acc:css('--blue')||'#1d4ed8'};
  const u=curU(),tNow=now();
  ctx.clearRect(0,0,W,H);
  const cx=W/2,cy=H/2,m=(Math.min(W,H)/2-14)/(ZP/2+2*Math.max(...st.z)/2+2.2),rp=ZP*m/2;
  const phiP=u*al(ZP);
  // pinion
  gearPath(cx,cy,ZP,m,phiP,Array(ZP).fill(true),{ink:col.ink,body:col.ink,on:col.ink,off:col.ink});
  ctx.beginPath();ctx.arc(cx,cy,rp*.5,0,TAU);ctx.fillStyle=col.off;ctx.fill();ctx.lineWidth=2;ctx.strokeStyle=col.ink;ctx.stroke();
  ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(cx+rp*.42*Math.cos(phiP),cy+rp*.42*Math.sin(phiP));ctx.lineWidth=3;ctx.strokeStyle=col.on;ctx.stroke();
  // consume plucks
  while(events.length&&events[0].t<=tNow){const e=events.shift();if(e.on){defl[e.k]=1}flash[e.k]={i:e.i,t:tNow}}
  for(let k=0;k<4;k++){
    const z=st.z[k],r=z*m/2,th=THETA[k],a=al(z),dist=rp+r,gx=cx+dist*Math.cos(th),gy=cy+dist*Math.sin(th);
    const rot0=th+Math.PI-a*(.5-th/al(ZP)),rot=th+Math.PI-a*(.5-(th-phiP)/al(ZP));
    cidx[k]=Math.round((th-rot0)/a);
    geo[k]={x:gx,y:gy,r:r,rot:rot,z:z,m:m};
    gearPath(gx,gy,z,m,rot,st.mask[k],col);
    // hub and label
    ctx.beginPath();ctx.arc(gx,gy,Math.max(3,r*.12),0,TAU);ctx.fillStyle=col.ink;ctx.fill();
    ctx.fillStyle=col.ink;ctx.font='600 '+Math.max(11,m*1.9)+'px IBM Plex Mono,Consolas,monospace';ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillText('z='+z,gx,gy+r*.42);
    // reed at the outer rim, on a tooth centre
    const pa=rot0+cidx[k]*a,ra=r+m;
    defl[k]*=.9;const d=defl[k];
    const bx=gx+(ra+3.4*m)*Math.cos(pa),by=gy+(ra+3.4*m)*Math.sin(pa),tx=gx+(ra+.15*m-d*.9*m)*Math.cos(pa),ty=gy+(ra+.15*m-d*.9*m)*Math.sin(pa);
    ctx.beginPath();ctx.moveTo(bx,by);ctx.lineTo(tx,ty);ctx.lineWidth=Math.max(3,m*.5);ctx.lineCap='round';ctx.strokeStyle=d>.08?col.on:col.ink;ctx.stroke();
    ctx.beginPath();ctx.arc(bx,by,Math.max(3,m*.45),0,TAU);ctx.fillStyle=col.ink;ctx.fill();
    // current tooth index in the pattern matrix
    const idx=((Math.round(u)+cidx[k])%z+z)%z;
    if(idx!==lastIdx[k]){lastIdx[k]=idx;markCells(k,idx)}
  }
}
let vis=true;new IntersectionObserver(es=>{vis=es[0].isIntersecting}).observe(root);

/* click a tooth to mute / unmute it */
cvs.addEventListener('pointerdown',e=>{
  const r=cvs.getBoundingClientRect(),px=e.clientX-r.left,py=e.clientY-r.top;
  for(let k=0;k<4;k++){const g=geo[k];if(!g)continue;const dx=px-g.x,dy=py-g.y,d=Math.hypot(dx,dy);
    if(d<g.r+1.8*g.m&&d>g.r-3*g.m){const a=al(g.z);let i=Math.round((Math.atan2(dy,dx)-g.rot)/a);i=((i%g.z)+g.z)%g.z;st.mask[k][i]=!st.mask[k][i];st.touched=true;cell(k,i);return}}
});
cvs.style.cursor='pointer';

/* ---------- pattern matrix (also the keyboard route) ---------- */
const rows=$('.pat',root);
function buildRows(){
  rows.innerHTML='';
  for(let k=0;k<4;k++){
    const row=document.createElement('div');row.className='prow';row.dataset.k=k;
    const lab=document.createElement('span');lab.className='plab';lab.textContent=(k+1)+' · z='+st.z[k];row.appendChild(lab);
    const cells=document.createElement('span');cells.className='cells';
    for(let i=0;i<st.z[k];i++){
      const b=document.createElement('button');b.type='button';b.setAttribute('aria-pressed',st.mask[k][i]);b.setAttribute('aria-label',L('Зъб ','Tooth ')+(i+1)+', '+L('колело ','gear ')+(k+1));
      b.addEventListener('click',()=>{st.mask[k][i]=!st.mask[k][i];st.touched=true;cell(k,i)});cells.appendChild(b);
    }
    row.appendChild(cells);rows.appendChild(row);
  }
  lastIdx=[-1,-1,-1,-1];
}
function cell(k,i){const b=rows.children[k].querySelectorAll('button')[i];if(b)b.setAttribute('aria-pressed',st.mask[k][i])}
function markCells(k,idx){const bs=rows.children[k]&&rows.children[k].querySelectorAll('button');if(!bs)return;bs.forEach((b,i)=>b.classList.toggle('now',i===idx))}
function syncCells(){rows.children.length&&[0,1,2,3].forEach(k=>rows.children[k].querySelectorAll('button').forEach((b,i)=>b.setAttribute('aria-pressed',!!st.mask[k][i])))}

/* ---------- controls ---------- */
const info={};$$('[data-o]',root).forEach(e=>info[e.dataset.o]=e);
function upd(){
  const l=st.z.reduce(lcm,1),sec=l*stepDur();
  info.lcm.textContent=l+' '+L('стъпки','steps');
  info.time.textContent=(sec<120?sec.toFixed(1).replace('.',EN?'.':','):Math.round(sec/60)+' '+L('мин','min')).toString()+(sec<120?' '+L('с','s'):'');
  info.eq.textContent='НОК('.replace('НОК',EN?'LCM':'НОК')+st.z.join(', ')+') = '+l;
  const pl=$('[data-act=play]',root);pl.textContent=st.play?L('Пауза','Pause'):L('Пусни','Play');pl.setAttribute('aria-pressed',st.play);
  const mu=$('[data-act=mute]',root);mu.setAttribute('aria-pressed',st.mute);mu.textContent=st.mute?L('Звук: изкл.','Sound: off'):L('Звук: вкл.','Sound: on');
}
$('[data-act=play]',root).addEventListener('click',()=>{st.play?stop():start()});
$('[data-act=mute]',root).addEventListener('click',()=>{st.mute=!st.mute;if(master)master.gain.value=st.mute?0:.8;upd()});
$('[data-act=euc]',root).addEventListener('click',()=>{st.mask=st.z.map(z=>euclid(z,2+Math.floor(Math.random()*Math.max(2,z/2.2))));syncCells()});
$('[data-act=rand]',root).addEventListener('click',()=>{st.mask=st.z.map(z=>Array.from({length:z},()=>Math.random()<.35));syncCells()});
$('[data-act=clear]',root).addEventListener('click',()=>{st.mask=st.z.map(z=>Array(z).fill(false));syncCells()});
$('[data-act=reset]',root).addEventListener('click',()=>{st.z=[16,12,9,8];st.mask=[euclid(16,5),euclid(12,4),euclid(9,3),euclid(8,3)];$$('input[data-z]',root).forEach((i,k)=>{i.value=st.z[k];i.parentElement.querySelector('output').textContent=st.z[k]});buildRows();upd()});
$$('input[data-z]',root).forEach((inp,k)=>{
  const out=inp.parentElement.querySelector('output');
  inp.addEventListener('input',()=>{const z=+inp.value,old=st.mask[k],cnt=Math.max(1,old.filter(Boolean).length);st.z[k]=z;st.mask[k]=euclid(z,Math.min(z,Math.max(1,Math.round(cnt*z/old.length))));out.textContent=z;buildRows();upd()});
  out.textContent=inp.value;
});
const bpm=$('input[data-k=bpm]',root);bpm.addEventListener('input',()=>{rebase();st.bpm=+bpm.value;bpm.parentElement.querySelector('output').textContent=bpm.value;upd();rebase()});bpm.parentElement.querySelector('output').textContent=bpm.value;
$$('[data-scale]',root).forEach(b=>b.addEventListener('click',()=>{st.scale=b.dataset.scale;$$('[data-scale]',root).forEach(x=>x.classList.toggle('on',x===b))}));
addEventListener('keydown',e=>{if(e.code==='Space'&&vis&&!/INPUT|TEXTAREA|BUTTON|A|SELECT/.test((document.activeElement||{}).tagName)){e.preventDefault();st.play?stop():start()}});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&st.play)stop()});

buildRows();upd();
if(reduce){/* static picture; the user still can press play */}
requestAnimationFrame(frame);
})();
