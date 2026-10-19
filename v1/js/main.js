(function(){
'use strict';
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const reduce=matchMedia('(prefers-reduced-motion:reduce)').matches;
const dpr=Math.min(devicePixelRatio||1,2);
function fit(c){const r=c.getBoundingClientRect();c.width=r.width*dpr;c.height=r.height*dpr;const x=c.getContext('2d');x.setTransform(dpr,0,0,dpr,0,0);return {x,w:r.width,h:r.height}}

/* hero headline split */
$$('[data-split]').forEach(h=>{
  let i=0;
  const walk=n=>{[...n.childNodes].forEach(c=>{
    if(c.nodeType===3){
      const f=document.createDocumentFragment();
      c.textContent.split(/(\s+)/).forEach(t=>{
        if(!t.trim()){f.appendChild(document.createTextNode(t));return}
        const w=document.createElement('span');w.className='w';
        const s=document.createElement('span');s.textContent=t;s.style.animationDelay=(.15+i++*.09)+'s';
        w.appendChild(s);f.appendChild(w);
      });c.replaceWith(f);
    } else if(c.nodeType===1&&c.tagName!=='BR')walk(c);
  })};walk(h);
});

/* reveal */
$$('.reveal').forEach((el,i)=>{const p=el.parentElement;const k=[...p.children].indexOf(el);el.style.setProperty('--d',(k%4*0.08)+'s')});
const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target);
  const b=e.target.querySelector('[data-count]');if(b)count(b)}}),{threshold:.15});
$$('.reveal').forEach(el=>io.observe(el));
function count(b){const to=+b.dataset.count,suf=b.dataset.suffix||'';const t0=performance.now(),D=1800;
  (function f(t){const p=Math.min((t-t0)/D,1),e=1-Math.pow(1-p,4);b.textContent=Math.round(to*e)+suf;if(p<1)requestAnimationFrame(f)})(t0)}

/* nav + progress */
const nav=$('#nav'),prog=$('#progress');
addEventListener('scroll',()=>{
  nav.classList.toggle('scrolled',scrollY>40);
  const m=document.documentElement.scrollHeight-innerHeight;prog.style.width=(scrollY/m*100)+'%';
},{passive:true});
$('#burger').onclick=()=>nav.classList.toggle('open');
$$('.nav nav a').forEach(a=>a.onclick=()=>nav.classList.remove('open'));
$('#yr').textContent=new Date().getFullYear();

/* card tilt */
if(!reduce&&matchMedia('(hover:hover)').matches)$$('.tilt').forEach(c=>{
  c.addEventListener('mousemove',e=>{const r=c.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;
    c.style.transform=`perspective(900px) rotateY(${x*9}deg) rotateX(${-y*9}deg) translateY(-6px)`});
  c.addEventListener('mouseleave',()=>c.style.transform='');
});

/* optional hero video */
const hv=$('#heroVideo');
fetch('assets/video/hero.mp4',{method:'HEAD'}).then(r=>{if(r.ok&&!reduce){hv.src='assets/video/hero.mp4';hv.play().then(()=>hv.classList.add('on')).catch(()=>{})}}).catch(()=>{});

/* background particle network */
(function(){
  if(reduce)return;
  const c=$('#bgfx');let {x,w,h}=fit(c);
  const N=70,P=Array.from({length:N},()=>({x:Math.random()*w,y:Math.random()*h,vx:(Math.random()-.5)*.25,vy:(Math.random()-.5)*.25}));
  addEventListener('resize',()=>{({x,w,h}=fit(c))});
  (function f(){x.clearRect(0,0,w,h);
    for(const p of P){p.x+=p.vx;p.y+=p.vy;if(p.x<0||p.x>w)p.vx*=-1;if(p.y<0||p.y>h)p.vy*=-1;
      x.fillStyle='rgba(62,230,255,.7)';x.beginPath();x.arc(p.x,p.y,1.2,0,7);x.fill()}
    for(let i=0;i<N;i++)for(let j=i+1;j<N;j++){const dx=P[i].x-P[j].x,dy=P[i].y-P[j].y,d=dx*dx+dy*dy;
      if(d<14000){x.strokeStyle=`rgba(62,230,255,${.18*(1-d/14000)})`;x.beginPath();x.moveTo(P[i].x,P[i].y);x.lineTo(P[j].x,P[j].y);x.stroke()}}
    requestAnimationFrame(f)})();
})();

/* gear drawing */
function gearPath(x,cx,cy,r,z,rot,hh){
  const step=Math.PI*2/z;x.beginPath();
  for(let i=0;i<z;i++){const a=rot+i*step;
    const pts=[[a-step*.27,r-hh],[a-step*.16,r+hh],[a+step*.16,r+hh],[a+step*.27,r-hh]];
    pts.forEach((p,k)=>{const px=cx+Math.cos(p[0])*p[1],py=cy+Math.sin(p[0])*p[1];(i===0&&k===0)?x.moveTo(px,py):x.lineTo(px,py)});}
  x.closePath();
}

/* hero canvas: large rotating gear pair, right side */
(function(){
  const c=$('#heroCanvas');let {x,w,h}=fit(c);addEventListener('resize',()=>{({x,w,h}=fit(c))});
  let t=0,mx=0,my=0;addEventListener('mousemove',e=>{mx=e.clientX/innerWidth-.5;my=e.clientY/innerHeight-.5},{passive:true});
  (function f(){
    x.clearRect(0,0,w,h);t+=reduce?0:.004;
    const R=Math.min(w,h)*.3,m=.12*R/ 6;
    const cx=w*.78+mx*-30,cy=h*.46+my*-30;
    const z1=24,z2=14,r1=R,r2=R*z2/z1,tooth=R*.06;
    const c2x=cx+Math.cos(-.5)*(r1+r2),c2y=cy+Math.sin(-.5)*(r1+r2);
    x.lineWidth=1.4;
    gearPath(x,cx,cy,r1,z1,t,tooth);x.strokeStyle='rgba(62,230,255,.55)';x.stroke();
    x.beginPath();x.arc(cx,cy,r1*.62,0,7);x.strokeStyle='rgba(62,230,255,.25)';x.stroke();
    x.beginPath();x.arc(cx,cy,r1*.12,0,7);x.stroke();
    for(let i=0;i<6;i++){const a=t+i*Math.PI/3;x.beginPath();x.moveTo(cx+Math.cos(a)*r1*.12,cy+Math.sin(a)*r1*.12);x.lineTo(cx+Math.cos(a)*r1*.62,cy+Math.sin(a)*r1*.62);x.stroke()}
    const rot2=-t*z1/z2+Math.PI/z2+(-.5+Math.PI)*0;
    gearPath(x,c2x,c2y,r2,z2,-t*z1/z2+Math.PI/z2+(Math.PI/z2)*0+(-.5)*(1+z1/z2)+0,tooth);
    x.strokeStyle='rgba(255,179,71,.6)';x.stroke();
    x.beginPath();x.arc(c2x,c2y,r2*.5,0,7);x.strokeStyle='rgba(255,179,71,.3)';x.stroke();
    requestAnimationFrame(f)})();
})();

/* four-bar lab */
(function(){
  const c=$('#linkCanvas');let {x,w,h}=fit(c);addEventListener('resize',()=>{({x,w,h}=fit(c))});
  const g=id=>$('#'+id), ids=['a','b','c','d','s'];
  const out=()=>ids.forEach(k=>g('o'+k).textContent=g('r'+k).value+(k==='s'?'%':''));
  ids.forEach(k=>g('r'+k).addEventListener('input',()=>{out();trace=[]}));out();
  let th=0,dir=1,trace=[],blocked=false;
  function solve(a,b,cc,d,th){
    const Ax=a*Math.cos(th),Ay=a*Math.sin(th),Ox=d,dx=Ox-Ax,dy=-Ay,L=Math.hypot(dx,dy);
    if(L>b+cc||L<Math.abs(b-cc)||L===0)return null;
    const k=(b*b-cc*cc+L*L)/(2*L),hh=Math.sqrt(Math.max(b*b-k*k,0));
    const ux=dx/L,uy=dy/L;
    return {A:[Ax,Ay],B:[Ax+ux*k-uy*hh,Ay+uy*k+ux*hh]};
  }
  function grashof(a,b,cc,d){const s=[a,b,cc,d].sort((p,q)=>p-q);const ok=s[0]+s[3]<=s[1]+s[2];
    return ok?(a===s[0]?'Грасхоф: манивела–люлка (пълно въртене на манивелата)':'Грасхоф: допустимо пълно въртене на едно звено'):'Не-Грасхоф: само люлеещи звена';}
  let last=performance.now();
  function frame(now){
    const dt=Math.min((now-last)/1000,.05);last=now;
    const a=+g('ra').value,b=+g('rb').value,cc=+g('rc').value,d=+g('rd').value,sp=+g('rs').value/100;
    const gr=grashof(a,b,cc,d);const gn=g('grashof');gn.textContent=gr;gn.classList.toggle('bad',gr.startsWith('Не'));
    if(!reduce||sp>0){
      let nt=th+dir*dt*1.6*sp;
      if(solve(a,b,cc,d,nt)){th=nt;blocked=false}else{dir*=-1;blocked=true}
    }
    const S=solve(a,b,cc,d,th)||solve(a,b,cc,d,th-dir*.02);
    x.clearRect(0,0,w,h);
    // grid
    x.strokeStyle='rgba(140,170,220,.06)';x.lineWidth=1;
    for(let i=0;i<w;i+=40){x.beginPath();x.moveTo(i,0);x.lineTo(i,h);x.stroke()}
    for(let i=0;i<h;i+=40){x.beginPath();x.moveTo(0,i);x.lineTo(w,i);x.stroke()}
    const span=Math.max(a+b+d, 320),sc=Math.min(w*.62/(d+Math.max(a,cc)*1.2),h*.62/(Math.max(a+b*.6,cc+b*.3,b)*.9)),
          ox=w/2-d*sc/2,oy=h*.74;
    const T=p=>[ox+p[0]*sc,oy-p[1]*sc];
    if(S){
      const O2=T([0,0]),O4=T([d,0]),A=T(S.A),B=T(S.B);
      // coupler point
      const vx=S.B[0]-S.A[0],vy=S.B[1]-S.A[1];
      const P=[S.A[0]+vx*.5-vy*.55,S.A[1]+vy*.5+vx*.55];
      const Pp=T(P);
      trace.push(Pp);if(trace.length>420)trace.shift();
      // trace
      x.lineWidth=2;
      for(let i=1;i<trace.length;i++){x.strokeStyle=`rgba(255,179,71,${i/trace.length*.9})`;x.beginPath();x.moveTo(trace[i-1][0],trace[i-1][1]);x.lineTo(trace[i][0],trace[i][1]);x.stroke()}
      // coupler triangle
      x.fillStyle='rgba(62,230,255,.07)';x.strokeStyle='rgba(62,230,255,.35)';x.beginPath();x.moveTo(...A);x.lineTo(...B);x.lineTo(...Pp);x.closePath();x.fill();x.stroke();
      // links
      const link=(p,q,col,wd)=>{x.strokeStyle=col;x.lineWidth=wd;x.lineCap='round';x.beginPath();x.moveTo(...p);x.lineTo(...q);x.stroke()};
      link(O2,O4,'rgba(140,170,220,.35)',3);
      link(O2,A,'#3ee6ff',7);link(A,B,'#9fc3ff',6);link(O4,B,'#ffb347',7);
      const pin=(p,r)=>{x.fillStyle='#050912';x.strokeStyle='#e9eef7';x.lineWidth=2;x.beginPath();x.arc(p[0],p[1],r,0,7);x.fill();x.stroke()};
      [O2,O4].forEach(p=>{x.fillStyle='rgba(140,170,220,.25)';x.beginPath();x.moveTo(p[0],p[1]);x.lineTo(p[0]-14,p[1]+24);x.lineTo(p[0]+14,p[1]+24);x.closePath();x.fill();pin(p,7)});
      pin(A,6);pin(B,6);
      x.fillStyle='#ffb347';x.shadowColor='#ffb347';x.shadowBlur=18;x.beginPath();x.arc(Pp[0],Pp[1],6,0,7);x.fill();x.shadowBlur=0;
      g('readout').textContent=`θ₂ = ${((th*180/Math.PI)%360+360)%360|0}°   ·   a:b:c:d = ${a}:${b}:${cc}:${d}${blocked?'   ·   достигнат е краен ход':''}`;
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  // gear pair
  const gc=$('#gearCanvas');let G=fit(gc);addEventListener('resize',()=>{G=fit(gc)});
  const z1=g('z1'),z2=g('z2');
  const upd=()=>{g('oz1').textContent=z1.value;g('oz2').textContent=z2.value;
    const i=(z2.value/z1.value);g('ratio').textContent=`Предавателно отношение u = z₂/z₁ = ${i.toFixed(2)} · ${i>1?'редуциране':'мултипликиране'}`};
  z1.oninput=z2.oninput=upd;upd();
  let gt=0;
  (function gf(){
    const {x:X,w:W,h:H}=G;X.clearRect(0,0,W,H);gt+=reduce?0:.02*(+g('rs').value/100);
    const a=+z1.value,b=+z2.value,m=Math.min(H*.42/ (Math.max(a,b)/2+1.5),(W*.9)/(a/2+b/2+4)/ 2)*1;
    const r1=a*m/2,r2=b*m/2,tot=r1+r2,cx1=W/2-tot/2,cx2=cx1+tot,cy=H/2,hh=m*.7;
    gearPath(X,cx1,cy,r1,a,gt,hh);X.fillStyle='rgba(62,230,255,.12)';X.fill();X.strokeStyle='#3ee6ff';X.lineWidth=1.6;X.stroke();
    gearPath(X,cx2,cy,r2,b,-gt*a/b+Math.PI/b,hh);X.fillStyle='rgba(255,179,71,.12)';X.fill();X.strokeStyle='#ffb347';X.stroke();
    [[cx1,r1],[cx2,r2]].forEach(([px,r])=>{X.beginPath();X.arc(px,cy,Math.max(r*.18,3),0,7);X.fillStyle='#050912';X.fill();X.strokeStyle='#e9eef7';X.stroke()});
    requestAnimationFrame(gf)})();
})();
})();
