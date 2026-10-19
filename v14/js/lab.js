/* v12 interactive lab: gears, draggable four-bar, cam, mobility, quiz */
(function(){
'use strict';
const TM=window.TMM=window.TMM||{};
const EN=document.documentElement.lang==='en';
const L=(b,e)=>EN?e:b;
const $=(s,r)=>(r||document).querySelector(s),$$=(s,r)=>[...(r||document).querySelectorAll(s)];
const reduce=matchMedia('(prefers-reduced-motion:reduce)').matches;
const V=n=>getComputedStyle(document.documentElement).getPropertyValue(n).trim();
const store={get(k){try{return localStorage.getItem(k)}catch(e){return null}},set(k,v){try{localStorage.setItem(k,v)}catch(e){}}};
const TAU=Math.PI*2;
const col=()=>({navy:V('--navy')||'#182b6b',blue:V('--blue')||'#2b59e0',acc:V('--gold')||'#0a8f9f',accd:V('--gold-d')||'#066878',bt:V('--blue-t')||'#e8eefc',bg2:V('--bg2')||'#eaeffa',mut:V('--mut')||'#586079',line:V('--line')||'#dfe4f0'});

function cv(canvas){
  const o={c:canvas,ctx:canvas.getContext('2d'),w:0,h:0};
  function fit(){const r=canvas.getBoundingClientRect(),d=Math.min(devicePixelRatio||1,2);o.w=r.width;o.h=r.height;canvas.width=Math.max(1,Math.round(r.width*d));canvas.height=Math.max(1,Math.round(r.height*d));o.ctx.setTransform(d,0,0,d,0,0)}
  fit();new ResizeObserver(fit).observe(canvas);return o;
}
function run(el,fn){
  let vis=false,last=0,raf=0;
  const tick=t=>{raf=0;if(!vis)return;const dt=Math.min((t-last)/1000,.05);last=t;fn(dt);raf=requestAnimationFrame(tick)};
  new IntersectionObserver(es=>{vis=es[0].isIntersecting;if(vis&&!raf){last=performance.now();raf=requestAnimationFrame(tick)}}).observe(el);
}
function bind(root,state,onChange){
  $$('input[data-k]',root).forEach(i=>{
    const k=i.dataset.k,out=i.parentElement.querySelector('output');
    const set=()=>{state[k]=i.type==='checkbox'?i.checked:+i.value;if(out)out.textContent=i.value;onChange&&onChange(k)};
    i.addEventListener('input',set);set();
  });
}
const fmt=(x,d)=>x.toFixed(d).replace('.',EN?'.':',');

/* ───────── gears ───────── */
function gearLab(root){
  const canvas=$('canvas',root),c=cv(canvas),st={z1:20,z2:40,rpm:60,idler:false,play:true};
  let phi=0;const info={};$$('[data-o]',root).forEach(e=>info[e.dataset.o]=e);
  const play=$('.lab-play',root);
  if(play)play.addEventListener('click',()=>{st.play=!st.play;play.textContent=st.play?L('Пауза','Pause'):L('Старт','Play');play.setAttribute('aria-pressed',!st.play)});
  bind(root,st,upd);
  function upd(){
    const i=st.z2/st.z1;
    info.ratio.textContent=fmt(i,2)+' : 1';
    info.n2.textContent=fmt(st.rpm*st.z1/st.z2,1)+' '+L('об/мин','rpm');
    info.t2.textContent='×'+fmt(i,2);
    info.dir.textContent=st.idler?L('същата като на водещото','same as the driver'):L('обратна на водещото','opposite to the driver');
    info.kind.textContent=i>1.001?L('редуктор (бавно, с по-голям момент)','reducer (slower, more torque)'):i<.999?L('мултипликатор (по-бързо, с по-малък момент)','multiplier (faster, less torque)'):L('еднакви колела (1 : 1)','equal gears (1 : 1)');
  }
  const al=z=>TAU/z;
  run(root,dt=>{
    if(st.play)phi+=st.rpm*TAU/60*dt*.22;
    draw();
  });
  function draw(){
    const k=col(),ctx=c.ctx;ctx.clearRect(0,0,c.w,c.h);
    const zs=[st.z1].concat(st.idler?[16]:[]).concat([st.z2]);
    // module units: radius = z/2; centres in a row
    const xs=[0];for(let i=1;i<zs.length;i++)xs.push(xs[i-1]+zs[i-1]/2+zs[i]/2);
    const left=-zs[0]/2-1.2,right=xs[xs.length-1]+zs[zs.length-1]/2+1.2,span=right-left,maxd=Math.max.apply(null,zs)+2.6;
    const m=Math.min((c.w-30)/span,(c.h-44)/maxd,13),ox=c.w/2-(left+span/2)*m,oy=c.h/2;
    let p=phi,th=0;
    const cols=[[k.bt,k.navy],[k.bg2,k.mut],[V('--gold-t')||'#dff3f5',k.accd]];
    for(let i=0;i<zs.length;i++){
      const last=i===zs.length-1,mid=st.idler&&i===1,cc=i===0?cols[0]:mid?cols[1]:cols[2];
      if(i>0){const fp=(0-p)/al(zs[i-1]);p=0+Math.PI-al(zs[i])*(.5-fp)}
      TM.gear(ctx,ox+xs[i]*m,oy,zs[i]/2*m,zs[i],p,{fill:cc[0],stroke:cc[1],lw:1.8});
      ctx.fillStyle=cc[1];ctx.font='600 13px Plus Jakarta Sans,Inter,sans-serif';ctx.textAlign='center';
      ctx.fillText((i===0?'z₁=':last?'z₂=':'zп=')+zs[i],ox+xs[i]*m,oy+zs[i]/2*m+m+16);
    }
  }
  upd();
}

/* ───────── four-bar (drag the crank) ───────── */
function barLab(root){
  const canvas=$('canvas',root),c=cv(canvas),st={a:1,b:3.5,c:3,d:4};
  let th=1.0,dir=1,motor=true,drag=false,trace=[],box=null,touched=false;
  const info={};$$('[data-o]',root).forEach(e=>info[e.dataset.o]=e);
  const inputs=$$('input[data-k]',root);
  function solve(t,s){
    s=s||st;const ax=s.a*Math.cos(t),ay=s.a*Math.sin(t),dx=s.d-ax,dy=-ay,Ld=Math.hypot(dx,dy);
    if(Ld>s.b+s.c||Ld<Math.abs(s.b-s.c)||Ld<1e-6)return null;
    const x=(s.b*s.b-s.c*s.c+Ld*Ld)/(2*Ld),h=Math.sqrt(Math.max(0,s.b*s.b-x*x)),ux=dx/Ld,uy=dy/Ld;
    const bx=ax+x*ux-h*uy,by=ay+x*uy+h*ux;
    const vx=bx-ax,vy=by-ay,pk=.5,ph=.55;
    return{A:[ax,ay],B:[bx,by],P:[ax+pk*vx-ph*vy,ay+pk*vy+ph*vx]};
  }
  function fitBox(){
    let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9,n=0;
    const add=p=>{x0=Math.min(x0,p[0]);x1=Math.max(x1,p[0]);y0=Math.min(y0,p[1]);y1=Math.max(y1,p[1])};
    for(let i=0;i<180;i++){const s=solve(i/180*TAU);if(s){n++;add(s.A);add(s.B);add(s.P)}}
    add([0,0]);add([st.d,0]);
    box={x0:x0-.5,x1:x1+.5,y0:y0-.5,y1:y1+.5};
  }
  function ensure(){
    if(solve(th))return;
    for(let i=1;i<=180;i++){for(const sgn of[1,-1]){const t=th+sgn*i/180*TAU/2;if(solve(t)){th=t;return}}}
  }
  function classify(){
    const arr=[['a',st.a],['b',st.b],['c',st.c],['d',st.d]].sort((p,q)=>p[1]-q[1]);
    const s=arr[0],l=arr[3],pq=arr[1][1]+arr[2][1],gr=s[1]+l[1]<=pq+1e-9;
    info.gr.textContent=gr?L('да','yes'):L('не','no');
    info.gr2.textContent='s + l = '+fmt(s[1]+l[1],1)+(gr?' ≤ ':' > ')+'p + q = '+fmt(pq,1);
    let tp;
    if(!gr)tp=L('тройна люлка (никое звено не се върти пълно)','triple rocker (no link turns fully)');
    else if(s[0]==='a')tp=L('кривошип–люлка (входът се върти пълно)','crank–rocker (the input turns fully)');
    else if(s[0]==='d')tp=L('двойна манивела (двете подвижни рамена се въртят пълно)','double crank (both side links turn fully)');
    else if(s[0]==='b')tp=L('двойна люлка (свързващият лост се върти пълно)','double rocker (the coupler turns fully)');
    else tp=L('люлка–манивела (изходът се върти пълно)','rocker–crank (the output turns fully)');
    info.type.textContent=tp;
  }
  function onChange(){fitBox();ensure();trace=[];classify()}
  inputs.forEach(i=>{const k=i.dataset.k,out=i.parentElement.querySelector('output');const set=()=>{st[k]=+i.value;out.textContent=fmt(+i.value,1);onChange()};i.addEventListener('input',set);set()});
  const PRE={cr:[1,3.5,3,4],dc:[3,3.5,3,1],tr:[3,2.5,2.5,4]};
  $$('[data-pre]',root).forEach(b=>b.addEventListener('click',()=>{
    const v=PRE[b.dataset.pre];['a','b','c','d'].forEach((k,i)=>{const inp=$('input[data-k='+k+']',root);inp.value=v[i];st[k]=v[i];inp.parentElement.querySelector('output').textContent=fmt(v[i],1)});onChange();
    $$('[data-pre]',root).forEach(x=>x.classList.toggle('on',x===b));
  }));
  $('[data-act=clear]',root).addEventListener('click',()=>{trace=[]});
  const mb=$('[data-act=motor]',root);
  mb.addEventListener('click',()=>{motor=!motor;mb.setAttribute('aria-pressed',motor);mb.textContent=motor?L('Спри мотора','Stop motor'):L('Пусни мотора','Start motor')});
  // coordinates
  function map(){const sx=(c.w-40)/(box.x1-box.x0),sy=(c.h-40)/(box.y1-box.y0),s=Math.min(sx,sy);return{s:s,ox:c.w/2-(box.x0+box.x1)/2*s,oy:c.h/2+(box.y0+box.y1)/2*s}}
  const X=(m,p)=>[m.ox+p[0]*m.s,m.oy-p[1]*m.s];
  function pt(e){const r=canvas.getBoundingClientRect();return[e.clientX-r.left,e.clientY-r.top]}
  canvas.addEventListener('pointerdown',e=>{
    const m=map(),s=solve(th);if(!s)return;const a=X(m,s.A),p=pt(e);
    if(Math.hypot(a[0]-p[0],a[1]-p[1])<30){drag=true;touched=true;motor=false;mb.setAttribute('aria-pressed',false);mb.textContent=L('Пусни мотора','Start motor');canvas.setPointerCapture(e.pointerId);canvas.style.cursor='grabbing';e.preventDefault()}
  });
  canvas.addEventListener('pointermove',e=>{
    const m=map();
    if(!drag){const s=solve(th);if(s){const a=X(m,s.A),p=pt(e);canvas.style.cursor=Math.hypot(a[0]-p[0],a[1]-p[1])<30?'grab':'default'}return}
    const p=pt(e),wx=(p[0]-m.ox)/m.s,wy=-(p[1]-m.oy)/m.s,t=Math.atan2(wy,wx),s=solve(t);
    if(s){th=t;trace.push(s.P)}
  });
  const end=()=>{drag=false;canvas.style.cursor='default'};
  canvas.addEventListener('pointerup',end);canvas.addEventListener('pointercancel',end);
  canvas.addEventListener('keydown',e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){const t=th+(e.key==='ArrowRight'?-1:1)*.06;if(solve(t)){th=t;motor=false}e.preventDefault()}});
  let tm=0;
  run(root,dt=>{
    if(motor&&!drag){const t=th+dir*1.1*dt;if(solve(t))th=t;else dir=-dir}
    const s=solve(th);if(s&&(motor||drag)){trace.push(s.P);if(trace.length>420)trace.shift()}
    tm+=dt;draw(s);
  });
  function draw(s){
    const k=col(),ctx=c.ctx,m=map();ctx.clearRect(0,0,c.w,c.h);
    if(!s)return;
    const O2=X(m,[0,0]),O4=X(m,[st.d,0]),A=X(m,s.A),B=X(m,s.B),P=X(m,s.P);
    // trace
    ctx.lineJoin='round';
    if(trace.length>1){ctx.beginPath();trace.forEach((q,i)=>{const z=X(m,q);i?ctx.lineTo(z[0],z[1]):ctx.moveTo(z[0],z[1])});ctx.strokeStyle=k.acc;ctx.lineWidth=2;ctx.globalAlpha=.85;ctx.stroke();ctx.globalAlpha=1}
    // coupler plate
    ctx.beginPath();ctx.moveTo(A[0],A[1]);ctx.lineTo(P[0],P[1]);ctx.lineTo(B[0],B[1]);ctx.closePath();ctx.fillStyle=k.bt;ctx.globalAlpha=.8;ctx.fill();ctx.globalAlpha=1;ctx.strokeStyle=k.blue;ctx.lineWidth=1.5;ctx.stroke();
    // ground
    ctx.setLineDash([5,5]);ctx.beginPath();ctx.moveTo(O2[0],O2[1]);ctx.lineTo(O4[0],O4[1]);ctx.strokeStyle=k.mut;ctx.lineWidth=1.2;ctx.stroke();ctx.setLineDash([]);
    const link=(p,q,w,cl)=>{ctx.beginPath();ctx.moveTo(p[0],p[1]);ctx.lineTo(q[0],q[1]);ctx.strokeStyle=cl;ctx.lineWidth=w;ctx.lineCap='round';ctx.stroke()};
    link(A,B,7,k.blue);link(O2,A,9,k.navy);link(O4,B,9,k.navy);
    const pin=(p,r,f)=>{ctx.beginPath();ctx.arc(p[0],p[1],r,0,TAU);ctx.fillStyle=f;ctx.fill();ctx.strokeStyle=k.navy;ctx.lineWidth=2;ctx.stroke()};
    [O2,O4].forEach(q=>{ctx.beginPath();ctx.moveTo(q[0]-14,q[1]+22);ctx.lineTo(q[0],q[1]+4);ctx.lineTo(q[0]+14,q[1]+22);ctx.closePath();ctx.fillStyle=k.bg2;ctx.fill();ctx.strokeStyle=k.navy;ctx.lineWidth=1.6;ctx.stroke()});
    pin(O2,6,'#fff');pin(O4,6,'#fff');pin(B,6,'#fff');
    pin(P,5,k.acc);
    // handle
    const pulse=touched?0:(Math.sin(tm*4)+1)/2;
    ctx.beginPath();ctx.arc(A[0],A[1],13+pulse*6,0,TAU);ctx.strokeStyle=k.acc;ctx.lineWidth=2;ctx.globalAlpha=touched?.55:.35+pulse*.5;ctx.stroke();ctx.globalAlpha=1;
    pin(A,9,drag?k.acc:'#fff');
    ctx.fillStyle=k.mut;ctx.font='600 12px Plus Jakarta Sans,Inter,sans-serif';ctx.textAlign='left';
    ctx.fillText(touched?"":L("← хванете и завъртете","← grab and turn"),A[0]+18,A[1]+4);
  }
  onChange();
}

/* ───────── cam ───────── */
function camLab(root){
  const cc=cv($('canvas.cam',root)),dc=cv($('canvas.dia',root)),st={type:'har',h:12,r0:30,rpm:60,play:true};
  let phi=0;const info={};$$('[data-o]',root).forEach(e=>info[e.dataset.o]=e);
  const play=$('.lab-play',root);
  play.addEventListener('click',()=>{st.play=!st.play;play.textContent=st.play?L('Пауза','Pause'):L('Старт','Play');play.setAttribute('aria-pressed',!st.play)});
  $$('[data-type]',root).forEach(b=>b.addEventListener('click',()=>{st.type=b.dataset.type;$$('[data-type]',root).forEach(x=>x.classList.toggle('on',x===b));upd()}));
  bind(root,st,upd);
  const f={har:x=>.5*(1-Math.cos(Math.PI*x)),cyc:x=>x-Math.sin(TAU*x)/TAU,uni:x=>x};
  function s(deg){
    deg=((deg%360)+360)%360;const g=f[st.type];
    if(deg<120)return st.h*g(deg/120);
    if(deg<180)return st.h;
    if(deg<300)return st.h*(1-g((deg-180)/120));
    return 0;
  }
  function upd(){
    const w=st.rpm*TAU/60,b=TAU/3,k={har:Math.PI/2,cyc:2,uni:1}[st.type];
    info.v.textContent=fmt(k*st.h*w/b,0)+' '+L('мм/с','mm/s');
    info.note.textContent=st.type==='har'?L('Плавно, но ускорението скача в началото и края на фазите.','Smooth, but the acceleration jumps at the ends of the phases.')
      :st.type==='cyc'?L('Най-плавното от трите: ускорението няма скокове.','The smoothest of the three: no jumps in acceleration.')
      :L('Постоянна скорост, но в краищата има удар (теоретично безкрайно ускорение).','Constant speed, but with an impact at the ends (theoretically infinite acceleration).');
    info.lift.textContent=st.h+' '+L('мм','mm');
  }
  run(root,dt=>{
    if(st.play)phi+=dt*360*.2;
    drawCam();drawDia();
  });
  function drawCam(){
    const k=col(),ctx=cc.ctx,w=cc.w,h=cc.h;ctx.clearRect(0,0,w,h);
    const R=st.r0+st.h,sc=Math.min(w,h*.78)/2/(R+6),cx=w/2,cy=h*.62;
    const ph=((phi%360)+360)%360;
    // profile
    ctx.beginPath();
    for(let a=0;a<=360;a+=2){
      const rad=(st.r0+s(a-90))*sc,wa=(a-ph)*Math.PI/180,x=cx+rad*Math.cos(wa),y=cy-rad*Math.sin(wa);
      a?ctx.lineTo(x,y):ctx.moveTo(x,y);
    }
    ctx.closePath();ctx.fillStyle=k.bt;ctx.fill();ctx.strokeStyle=k.navy;ctx.lineWidth=2.4;ctx.stroke();
    ctx.setLineDash([4,5]);ctx.beginPath();ctx.arc(cx,cy,st.r0*sc,0,TAU);ctx.strokeStyle=k.mut;ctx.lineWidth=1;ctx.stroke();ctx.setLineDash([]);
    // rotation marker
    ctx.beginPath();ctx.moveTo(cx,cy);const ma=(90-ph)*Math.PI/180;ctx.lineTo(cx+st.r0*.7*sc*Math.cos(ma+Math.PI/2-Math.PI/2),cy-st.r0*.7*sc*Math.sin(ma));ctx.strokeStyle=k.accd;ctx.lineWidth=1.6;ctx.stroke();
    ctx.beginPath();ctx.arc(cx,cy,4,0,TAU);ctx.fillStyle=k.navy;ctx.fill();
    // follower
    const sv=s(ph),ty=cy-(st.r0+sv)*sc;
    ctx.fillStyle=k.bg2;ctx.strokeStyle=k.navy;ctx.lineWidth=2;
    ctx.beginPath();ctx.rect(cx-9,4,18,Math.max(0,ty-4));ctx.fill();ctx.stroke();
    ctx.beginPath();ctx.moveTo(cx-9,ty);ctx.lineTo(cx,ty+11);ctx.lineTo(cx+9,ty);ctx.closePath();ctx.fillStyle=k.acc;ctx.fill();ctx.stroke();
    info.s.textContent=fmt(sv,1)+' '+L('мм','mm');
  }
  function drawDia(){
    const k=col(),ctx=dc.ctx,w=dc.w,h=dc.h;ctx.clearRect(0,0,w,h);
    const L0=36,T=14,W=w-L0-14,H=h-T-30,mx=st.h+2;
    const X=d=>L0+d/360*W,Y=v=>T+H-v/mx*H;
    ctx.strokeStyle=k.line;ctx.lineWidth=1;ctx.fillStyle=k.mut;ctx.font='11px Plus Jakarta Sans,Inter,sans-serif';ctx.textAlign='center';
    for(let d=0;d<=360;d+=60){ctx.beginPath();ctx.moveTo(X(d),T);ctx.lineTo(X(d),T+H);ctx.stroke();ctx.fillText(d+'°',X(d),T+H+16)}
    ctx.textAlign='right';for(let v=0;v<=st.h;v+=Math.max(2,Math.round(st.h/4/2)*2)){ctx.beginPath();ctx.moveTo(L0,Y(v));ctx.lineTo(L0+W,Y(v));ctx.stroke();ctx.fillText(v,L0-6,Y(v)+4)}
    ctx.beginPath();for(let d=0;d<=360;d+=2){const x=X(d),y=Y(s(d));d?ctx.lineTo(x,y):ctx.moveTo(x,y)}ctx.strokeStyle=k.navy;ctx.lineWidth=2.4;ctx.stroke();
    const ph=((phi%360)+360)%360;ctx.beginPath();ctx.moveTo(X(ph),T);ctx.lineTo(X(ph),T+H);ctx.strokeStyle=k.acc;ctx.lineWidth=1.4;ctx.stroke();
    ctx.beginPath();ctx.arc(X(ph),Y(s(ph)),6,0,TAU);ctx.fillStyle=k.acc;ctx.fill();
    ctx.fillStyle=k.mut;ctx.textAlign='left';ctx.fillText(L('s, мм','s, mm'),L0+4,T+10);
  }
  upd();
}

/* ───────── mobility (Grübler) ───────── */
function mobLab(root){
  const st={n:4,p5:4,p4:0},info={};$$('[data-o]',root).forEach(e=>info[e.dataset.o]=e);
  const badge=$('.mob-f',root);
  const PRE={fb:[4,4,0],sc:[4,4,0],cam:[3,2,1],gear:[3,2,1],five:[5,5,0],truss:[3,3,0],over:[4,5,0]};
  $$('[data-pre]',root).forEach(b=>b.addEventListener('click',()=>{
    const v=PRE[b.dataset.pre];['n','p5','p4'].forEach((k,i)=>{const inp=$('input[data-k='+k+']',root);inp.value=v[i];st[k]=v[i];inp.parentElement.querySelector('output').textContent=v[i]});upd();
    $$('[data-pre]',root).forEach(x=>x.classList.toggle('on',x===b));
  }));
  bind(root,st,upd);
  function upd(){
    const F=3*(st.n-1)-2*st.p5-st.p4;
    info.eq.textContent='F = 3·('+st.n+'−1) − 2·'+st.p5+' − '+st.p4+' = '+String(F).replace('-','−');
    badge.textContent=F;badge.className='mob-f '+(F>0?'ok':F===0?'zero':'neg');
    badge.classList.remove('pop');void badge.offsetWidth;badge.classList.add('pop');
    info.msg.textContent=F>0?L('Механизъм със '+F+(F===1?' степен':' степени')+' на свобода: нужни са '+F+(F===1?' входно движение':' входни движения')+' (задвижвания).','A mechanism with '+F+(F===1?' degree':' degrees')+' of freedom: it needs '+F+' input motion'+(F===1?'':'s')+' (actuators).')
      :F===0?L('Статично определима структура (ферма): няма относително движение.','A statically determinate structure (truss): no relative motion.')
      :L('Свръхограничена верига (F < 0): има излишни връзки — на практика движението изисква специални размери или хлабини.','An over-constrained chain (F < 0): there are redundant constraints — in practice motion needs special dimensions or clearances.');
  }
  upd();
}

/* ───────── quiz ───────── */
function quiz(root){
  const base=root.dataset.root||'';
  const OPT=[['gear',L('Зъбни колела','Gears')],['link',L('Лостов механизъм','Linkage')],['slider',L('Колянно-плъзгачен механизъм','Slider-crank')],['cam',L('Гърбичен механизъм','Cam mechanism')],['geneva',L('Малтийски механизъм','Geneva drive')]];
  const Q=[
    ['geneva','projector',L('Превръща равномерното въртене в движение на скокове — кадър по кадър.','It turns steady rotation into stepwise motion — frame by frame.'),L('Малтийският механизъм задържа филма неподвижен, докато кадърът се показва, и го придвижва за миг.','A Geneva drive holds the film still while a frame is shown and advances it in an instant.')],
    ['cam','camshaft',L('Профилът му определя кога и колко се отваря клапанът.','Its profile decides when and how far the valve opens.'),L('Профилът на гърбицата задава закона на движение на последователя — точно като кривите, които начертахте по-горе.','The cam profile sets the follower’s law of motion — just like the curves you plotted above.')],
    ['gear','bike',L('Променя скоростта и въртящия момент между два вала.','It changes speed and torque between two shafts.'),L('Зъбните колела (тук — веригата и зъбните колела на велосипеда) задават предавателно отношение i = z₂/z₁.','Gears (here a bicycle chain and sprockets) set a ratio i = z₂/z₁.')],
    ['slider','crank',L('Превръща възвратно-постъпателното движение на буталото във въртене на вала.','It turns the piston’s back-and-forth motion into shaft rotation.'),L('Колянно-плъзгачният механизъм е основата на буталните двигатели.','The slider-crank is the basis of piston engines.')],
    ['link','excavator',L('Рамо от звена на шарнири, което проследява зададена траектория.','An arm of links on pivots that follows a designed path.'),L('Лостовите механизми предават движение и сила чрез звена, свързани с шарнири — като четиризвенника в лабораторията.','Linkages transmit motion and force through pivoted links — like the four-bar in the lab.')]
  ];
  let order,i,score,answered;
  const q=$('.qz-q',root),opts=$('.qz-o',root),fb=$('.qz-f',root),img=$('.qz-img',root),pr=$('.qz-p',root),sc=$('.qz-s',root),nx=$('.qz-n',root);
  const best=+(store.get('tmm-quiz-best')||0);
  function start(){order=Q.map((_,k)=>k).sort(()=>Math.random()-.5);i=0;score=0;show()}
  function show(){
    answered=false;fb.hidden=true;nx.hidden=true;img.hidden=true;img.removeAttribute('src');
    if(i>=Q.length){
      const b=Math.max(best,score);store.set('tmm-quiz-best',b);
      q.textContent=L('Резултат: '+score+' от '+Q.length,'Score: '+score+' of '+Q.length);
      opts.innerHTML='';fb.hidden=false;fb.className='qz-f ok';fb.textContent=score===Q.length?L('Всичко е вярно — отлично!','All correct — excellent!'):L('Опитайте пак — въпросите се разбъркват.','Try again — the questions are shuffled.');
      nx.hidden=false;nx.textContent=L('Нова игра','Play again');nx.onclick=start;pr.style.setProperty('--p','100%');sc.textContent=L('Най-добър резултат: ','Best score: ')+b+'/'+Q.length;return;
    }
    const d=Q[order[i]];
    pr.style.setProperty('--p',(i/Q.length*100)+'%');sc.textContent=L('Въпрос ','Question ')+(i+1)+' / '+Q.length;
    q.textContent=d[2];
    opts.innerHTML=OPT.map(o=>'<button type="button" data-v="'+o[0]+'">'+o[1]+'</button>').join('');
    $$('button',opts).forEach(b=>b.addEventListener('click',()=>{
      if(answered)return;answered=true;const ok=b.dataset.v===d[0];if(ok)score++;
      $$('button',opts).forEach(x=>{x.disabled=true;if(x.dataset.v===d[0])x.classList.add('right');else if(x===b)x.classList.add('wrong')});
      fb.hidden=false;fb.className='qz-f '+(ok?'ok':'no');fb.textContent=(ok?L('Вярно! ','Correct! '):L('Не съвсем. ','Not quite. '))+d[3];
      img.src=base+'assets/v9/'+d[1]+'.webp';img.alt=L('Илюстрация (генерирано изображение)','Illustration (generated image)');img.hidden=false;
      nx.hidden=false;nx.textContent=i===Q.length-1?L('Виж резултата','See the score'):L('Следващ въпрос →','Next question →');nx.onclick=()=>{i++;show()};nx.focus();
    }));
  }
  start();
}

function init(){
  $$('[data-lab=gear]').forEach(gearLab);$$('[data-lab=bar]').forEach(barLab);$$('[data-lab=cam]').forEach(camLab);$$('[data-lab=mob]').forEach(mobLab);$$('[data-lab=quiz]').forEach(quiz);
  $$('.seg [data-pre]').forEach(()=>{});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
