/* v16: mechanism builder — joints, links, motors and rails solved with position-based constraint projection */
(function(){
'use strict';
const root=document.getElementById('wb');if(!root)return;
const EN=document.documentElement.lang==='en';
const L=(b,e)=>EN?e:b;
const $=(s,r)=>(r||document).querySelector(s),$$=(s,r)=>[...(r||document).querySelectorAll(s)];
const reduce=matchMedia('(prefers-reduced-motion:reduce)').matches;
const TAU=Math.PI*2;
const css=n=>getComputedStyle(document.documentElement).getPropertyValue(n).trim();
const cv=$('canvas',root),ctx=cv.getContext('2d');
let W=0,H=0,dpr=1;
function fit(){const r=cv.getBoundingClientRect();dpr=Math.min(devicePixelRatio||1,2);W=r.width;H=r.height;cv.width=Math.max(1,W*dpr);cv.height=Math.max(1,H*dpr);ctx.setTransform(dpr,0,0,dpr,0,0)}
new ResizeObserver(fit).observe(cv);fit();

/* ---------- model ---------- */
let P=[],E=[],traces=[],view={x:0,y:0,s:60},preset='fourbar';
const S={tool:'move',run:!reduce,t:0,omega:1.2,mode:'preset',pend:-1,drag:-1,pan:null,res:0,hover:-1,railTurn:{}};
const add=(x,y,o)=>{P.push(Object.assign({x:x,y:y,fixed:false,pen:false,rail:null,drv:null},o||{}));return P.length-1};
const dist=(a,b)=>Math.hypot(P[a].x-P[b].x,P[a].y-P[b].y);
const link=(a,b,len)=>{E.push({a:a,b:b,len:len==null?dist(a,b):len})};
function circleInt(ax,ay,b,dx,dy,c){ // B with |AB|=b, |B-D|=c, elbow "up"
  const ux=dx-ax,uy=dy-ay,Ld=Math.hypot(ux,uy),x=(b*b-c*c+Ld*Ld)/(2*Ld),h=Math.sqrt(Math.max(0,b*b-x*x)),nx=ux/Ld,ny=uy/Ld;
  return[ax+x*nx-h*ny,ay+x*ny+h*nx];
}
const PRE={
  fourbar(){
    const a=1.1,b=3.4,c=3.0,d=4.0,t0=Math.PI/3;
    const o2=add(0,0,{fixed:true}),o4=add(d,0,{fixed:true}),ax=a*Math.cos(t0),ay=a*Math.sin(t0);
    const A=add(ax,ay,{drv:{c:o2,r:a,mode:'rot',a0:t0,amp:0}}),bb=circleInt(ax,ay,b,d,0,c),B=add(bb[0],bb[1]);
    const vx=bb[0]-ax,vy=bb[1]-ay,Pp=add(ax+.5*vx-.55*vy,ay+.5*vy+.55*vx,{pen:true});
    link(o2,A);link(A,B,b);link(o4,B,c);link(A,Pp);link(B,Pp);
    return{bb:[-1.8,5.8,-1.8,5.6]};
  },
  slider(){
    const r=1.2,Lr=4,t0=Math.PI/3,ax=r*Math.cos(t0),ay=r*Math.sin(t0);
    const o=add(0,0,{fixed:true}),A=add(ax,ay,{drv:{c:o,r:r,mode:'rot',a0:t0,amp:0}}),B=add(ax+Math.sqrt(Lr*Lr-ay*ay),0,{rail:{ox:0,oy:0,dx:1,dy:0}});
    const mx=(ax+P[B].x)/2,my=ay/2,vx=P[B].x-ax,vy=-ay,vl=Math.hypot(vx,vy),Pp=add(mx-.9*vy/vl,my+.9*vx/vl,{pen:true});
    link(o,A);link(A,B,Lr);link(A,Pp);link(B,Pp);
    return{bb:[-2,6.8,-2.8,2.8]};
  },
  peaucellier(){
    const Ll=6,s=3,r=2,o=add(0,0,{fixed:true}),q=add(r,0,{fixed:true}),C=add(2*r,0,{drv:{c:q,r:r,mode:'rock',a0:0,amp:1.0}});
    const c=2*r,d=(Ll*Ll-s*s)/c,m=(c+d)/2,h1=(d-c)/2,h2=Math.sqrt(s*s-h1*h1);
    const A=add(m,h2),B=add(m,-h2),D=add(d,0,{pen:true});
    link(o,A,Ll);link(o,B,Ll);link(A,C,s);link(C,B,s);link(B,D,s);link(D,A,s);link(q,C,r);
    return{bb:[-1.5,9,-5.5,5.5]};
  },
  cheb(){
    const a=5,b=2,c=5,d=4,t0=69*Math.PI/180,ax=a*Math.cos(t0),ay=a*Math.sin(t0);
    const o2=add(0,0,{fixed:true}),o4=add(d,0,{fixed:true}),A=add(ax,ay,{drv:{c:o2,r:a,mode:'rock',a0:t0,amp:30*Math.PI/180}});
    const bb=circleInt(ax,ay,b,d,0,c),B=add(bb[0],bb[1]),Pp=add((ax+bb[0])/2,(ay+bb[1])/2,{pen:true});
    link(o2,A);link(A,B,b);link(o4,B,c);link(A,Pp,b/2);link(Pp,B,b/2);
    return{bb:[-2,6.2,-1.4,6.2]};
  }
};
const INFO={
  fourbar:[L('Четиризвенник (кривошип–люлка)','Four-bar (crank–rocker)'),L('Манивелата се върти, люлката се люлее. Точката от свързващия лост (оранжевата) чертае затворена крива.','The crank turns and the rocker swings. The coupler point (orange) draws a closed curve.')],
  slider:[L('Колянно-плъзгачен механизъм','Slider-crank'),L('Плъзгачът B се движи по релса. Точка от свързващата щанга чертае удължена крива.','The slider B moves along a rail. A point on the rod draws an elongated curve.')],
  peaucellier:[L('Клетка на Пасселие–Липкин','Peaucellier–Lipkin cell'),L('Точка D чертае права линия, макар че няма плъзгач — само шарнири. Изобретена е през XIX век.','Point D draws a straight line although there is no slider — only pivots. Invented in the 19th century.')],
  cheb:[L('Ламбда на Чебишев','Chebyshev lambda'),L('Средата на свързващия лост се движи почти по права линия около най-високата си точка. Звена 5 : 2 : 5, стойка 4.','The midpoint of the coupler moves almost along a straight line near its highest point. Links 5 : 2 : 5, frame 4.')]
};
function load(name){
  P=[];E=[];traces=[];S.pend=-1;S.drag=-1;S.t=0;preset=name;
  if(!PRE[name]){view={x:0,y:0,s:60};return}
  const r=PRE[name]();S.bb=r.bb;setBox(r.bb);S.mode='preset';
  $$('[data-pre]',root).forEach(b=>b.classList.toggle('on',b.dataset.pre===name));
  $('[data-o=pname]',root).textContent=INFO[name][0];$('[data-o=pdesc]',root).textContent=INFO[name][1];
  updInfo();
}
function setBox(bb){const sx=W/(bb[1]-bb[0]),sy=H/(bb[3]-bb[2]);view.s=Math.min(sx,sy)*.88;view.x=(bb[0]+bb[1])/2;view.y=(bb[2]+bb[3])/2}
const toS=(x,y)=>[W/2+(x-view.x)*view.s,H/2-(y-view.y)*view.s];
const toW=(sx,sy)=>[(sx-W/2)/view.s+view.x,-(sy-H/2)/view.s+view.y];

/* ---------- solver ---------- */
function motors(){
  const w=S.omega;
  P.forEach(p=>{
    if(!p.drv)return;const d=p.drv,c=P[d.c];if(!c)return;
    const mode=S.mode==='rot'?'rot':S.mode==='rock'?'rock':d.mode,th=mode==='rot'?d.a0+S.t*w:d.a0+(d.amp||.9)*Math.sin(S.t*w);
    p.x=c.x+d.r*Math.cos(th);p.y=c.y+d.r*Math.sin(th);
  });
}
const free=(i)=>{const p=P[i];return !p.fixed&&!p.drv&&i!==S.drag};
function project(iters){
  for(let it=0;it<iters;it++){
    for(let k=0;k<E.length;k++){
      const e=E[k],a=P[e.a],b=P[e.b],wa=free(e.a)?1:0,wb=free(e.b)?1:0,s=wa+wb;if(!s)continue;
      let dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy);if(d<1e-9)continue;
      const f=(d-e.len)/d;a.x+=wa/s*f*dx;a.y+=wa/s*f*dy;b.x-=wb/s*f*dx;b.y-=wb/s*f*dy;
    }
    for(let i=0;i<P.length;i++){const p=P[i];if(p.rail&&free(i)){const r=p.rail,t=(p.x-r.ox)*r.dx+(p.y-r.oy)*r.dy;p.x=r.ox+t*r.dx;p.y=r.oy+t*r.dy}}
  }
}
function residual(){let m=0;E.forEach(e=>{m=Math.max(m,Math.abs(dist(e.a,e.b)-e.len))});return m}
function step(dt){
  if(S.run&&P.some(p=>p.drv)){S.t+=dt;}
  const snap=P.map(p=>[p.x,p.y]);
  motors();project(60);
  S.res=residual();
  if(S.res>.03&&S.run){P.forEach((p,i)=>{p.x=snap[i][0];p.y=snap[i][1]});S.res=residual();S.blocked=true}else S.blocked=S.res>.03;
  if(S.run||S.drag>=0)P.forEach((p,i)=>{if(p.pen){const tr=traces[i]||(traces[i]=[]);const l=tr[tr.length-1];if(!l||Math.hypot(l[0]-p.x,l[1]-p.y)>.01){tr.push([p.x,p.y]);if(tr.length>1800)tr.shift()}}});
}

/* ---------- drawing ---------- */
function draw(){
  const ink=css('--ink')||'#1b2330',acc=css('--blue')||'#1565ff',pen=css('--pen')||'#ff7a00',grid=css('--line')||'#cdd5df',bg2=css('--bg2')||'#e9edf3';
  ctx.clearRect(0,0,W,H);
  // grid
  ctx.lineWidth=1;const step=view.s>34?1:5,x0=toW(0,0)[0],x1=toW(W,0)[0],y1=toW(0,0)[1],y0=toW(0,H)[1];
  for(let gx=Math.floor(x0/step)*step;gx<=x1;gx+=step){const sx=toS(gx,0)[0];ctx.strokeStyle=Math.round(gx)%5===0?'rgba(21,34,55,.16)':'rgba(21,34,55,.07)';ctx.beginPath();ctx.moveTo(sx,0);ctx.lineTo(sx,H);ctx.stroke()}
  for(let gy=Math.floor(y0/step)*step;gy<=y1;gy+=step){const sy=toS(0,gy)[1];ctx.strokeStyle=Math.round(gy)%5===0?'rgba(21,34,55,.16)':'rgba(21,34,55,.07)';ctx.beginPath();ctx.moveTo(0,sy);ctx.lineTo(W,sy);ctx.stroke()}
  // rails
  P.forEach(p=>{if(!p.rail)return;const r=p.rail,a=toS(r.ox-r.dx*60,r.oy-r.dy*60),b=toS(r.ox+r.dx*60,r.oy+r.dy*60);ctx.setLineDash([8,6]);ctx.beginPath();ctx.moveTo(a[0],a[1]);ctx.lineTo(b[0],b[1]);ctx.strokeStyle='rgba(27,35,48,.5)';ctx.lineWidth=1.5;ctx.stroke();ctx.setLineDash([])});
  // traces
  traces.forEach(tr=>{if(!tr||tr.length<2)return;ctx.beginPath();tr.forEach((q,i)=>{const s=toS(q[0],q[1]);i?ctx.lineTo(s[0],s[1]):ctx.moveTo(s[0],s[1])});ctx.strokeStyle=pen;ctx.lineWidth=2.2;ctx.lineJoin='round';ctx.stroke()});
  // links
  const lw=Math.max(5,view.s*.12);
  E.forEach(e=>{const a=toS(P[e.a].x,P[e.a].y),b=toS(P[e.b].x,P[e.b].y);
    ctx.lineCap='round';ctx.beginPath();ctx.moveTo(a[0],a[1]);ctx.lineTo(b[0],b[1]);ctx.strokeStyle=ink;ctx.lineWidth=lw;ctx.stroke();
    ctx.beginPath();ctx.moveTo(a[0],a[1]);ctx.lineTo(b[0],b[1]);ctx.strokeStyle='#cfd8e6';ctx.lineWidth=lw-3.2;ctx.stroke()});
  // joints
  P.forEach((p,i)=>{
    const s=toS(p.x,p.y),r=Math.max(7,view.s*.16);
    if(p.fixed){ctx.beginPath();ctx.moveTo(s[0]-r*1.5,s[1]+r*2.2);ctx.lineTo(s[0],s[1]);ctx.lineTo(s[0]+r*1.5,s[1]+r*2.2);ctx.closePath();ctx.fillStyle=bg2;ctx.fill();ctx.strokeStyle=ink;ctx.lineWidth=2;ctx.stroke();
      ctx.beginPath();ctx.moveTo(s[0]-r*1.9,s[1]+r*2.2);ctx.lineTo(s[0]+r*1.9,s[1]+r*2.2);ctx.stroke()}
    if(p.rail){ctx.fillStyle=bg2;ctx.strokeStyle=ink;ctx.lineWidth=2;ctx.beginPath();ctx.rect(s[0]-r*1.8,s[1]-r*1.1,r*3.6,r*2.2);ctx.fill();ctx.stroke()}
    ctx.beginPath();ctx.arc(s[0],s[1],r,0,TAU);ctx.fillStyle=p.pen?pen:'#fff';ctx.fill();ctx.lineWidth=2.4;ctx.strokeStyle=(i===S.pend||i===S.hover)?acc:ink;ctx.stroke();
    if(p.drv){ctx.beginPath();ctx.arc(s[0],s[1],r+5,0,TAU);ctx.strokeStyle=acc;ctx.lineWidth=2;ctx.setLineDash([4,4]);ctx.stroke();ctx.setLineDash([])}
    if(!p.fixed&&!p.pen&&!p.drv){ctx.beginPath();ctx.arc(s[0],s[1],r*.3,0,TAU);ctx.fillStyle=ink;ctx.fill()}
  });
  if(S.blocked){ctx.fillStyle='rgba(179,38,30,.9)';ctx.font='700 13px IBM Plex Mono,monospace';ctx.textAlign='left';ctx.fillText(L('Конфигурацията е невъзможна — механизмът е блокиран','Impossible configuration — the mechanism is jammed'),14,H-14)}
}
let last=performance.now(),vis=true;new IntersectionObserver(es=>{vis=es[0].isIntersecting}).observe(root);
function frame(now){
  requestAnimationFrame(frame);if(!vis){last=now;return}
  const dt=Math.min((now-last)/1000,.05);last=now;step(dt);draw();
}

/* ---------- info ---------- */
function updInfo(){
  const J=P.filter(p=>!p.fixed).length,Lk=E.length,Sl=P.filter(p=>p.rail).length,F=2*J-Lk-Sl,M=P.filter(p=>p.drv).length;
  const o=n=>$('[data-o='+n+']',root);
  o('j').textContent=J;o('l').textContent=Lk;o('s').textContent=Sl;
  o('f').textContent=F;o('eq').textContent='F = 2·'+J+' − '+Lk+' − '+Sl+' = '+String(F).replace('-','−');
  o('fm').textContent=F>0?L('Механизъм. Задвижвания: '+M+' от необходими '+F+'.','A mechanism. Inputs: '+M+' of the '+F+' needed.'):F===0?L('Статично определима структура — не се движи.','A statically determinate structure — it does not move.'):L('Свръхограничена верига (F < 0) — излишни връзки.','An over-constrained chain (F < 0) — redundant constraints.');
  o('f').className='fbig '+(F>0?'ok':F===0?'zero':'neg');
}
const HELP={
  move:L('Влачете точка, за да я местите. Влачете празно място — за преместване на изгледа; колелцето мащабира.','Drag a point to move it. Drag empty space to pan; the wheel zooms.'),
  pin:L('Кликнете на празно място: неподвижна опора.','Click empty space: a fixed support.'),
  joint:L('Кликнете на празно място: свободен шарнир.','Click empty space: a free pivot.'),
  link:L('Кликнете две точки: твърдо звено между тях.','Click two points: a rigid link between them.'),
  motor:L('Кликнете свободна точка, свързана с опора: тя става манивела (въртене или люлеене).','Click a free point linked to a support: it becomes a crank (turning or rocking).'),
  rail:L('Кликнете точка: плъзгач по хоризонтална, после вертикална релса, после без релса.','Click a point: slider on a horizontal, then vertical rail, then none.'),
  pen:L('Кликнете точка: включва или изключва чертането на следа.','Click a point: switch its trace on or off.'),
  erase:L('Кликнете точка или звено, за да го изтриете.','Click a point or a link to delete it.')
};
function setTool(t){S.tool=t;S.pend=-1;$$('[data-tool]',root).forEach(b=>{b.classList.toggle('on',b.dataset.tool===t);b.setAttribute('aria-pressed',b.dataset.tool===t)});$('[data-o=help]',root).textContent=HELP[t];cv.style.cursor=t==='move'?'grab':'crosshair'}

/* ---------- pointer ---------- */
function pt(e){const r=cv.getBoundingClientRect();return[e.clientX-r.left,e.clientY-r.top]}
function pick(sx,sy){let b=-1,bd=16;P.forEach((p,i)=>{const s=toS(p.x,p.y),d=Math.hypot(s[0]-sx,s[1]-sy);if(d<bd){bd=d;b=i}});return b}
function pickLink(sx,sy){let b=-1,bd=9;E.forEach((e,i)=>{const a=toS(P[e.a].x,P[e.a].y),c=toS(P[e.b].x,P[e.b].y),dx=c[0]-a[0],dy=c[1]-a[1],l2=dx*dx+dy*dy||1,t=Math.max(0,Math.min(1,((sx-a[0])*dx+(sy-a[1])*dy)/l2)),d=Math.hypot(sx-(a[0]+t*dx),sy-(a[1]+t*dy));if(d<bd){bd=d;b=i}});return b}
function edited(){traces=[];preset=null;$$('[data-pre]',root).forEach(b=>b.classList.remove('on'));$('[data-o=pname]',root).textContent=L('Собствена конструкция','Your own build');$('[data-o=pdesc]',root).textContent=L('Добавяйте опори, шарнири и звена. Задайте мотор на точка, свързана с опора, и пуснете.','Add supports, pivots and links. Give a motor to a point linked to a support, then run.');updInfo()}
function removeP(i){E=E.filter(e=>e.a!==i&&e.b!==i);E.forEach(e=>{if(e.a>i)e.a--;if(e.b>i)e.b--});P.forEach(p=>{if(p.drv){if(p.drv.c===i)p.drv=null;else if(p.drv.c>i)p.drv.c--}});P.splice(i,1);traces=[]}
cv.addEventListener('pointerdown',e=>{
  const [sx,sy]=pt(e),i=pick(sx,sy),w=toW(sx,sy);try{cv.setPointerCapture(e.pointerId)}catch(err){}
  const t=S.tool;
  if(t==='move'){if(i>=0&&!P[i].drv){S.drag=i;cv.style.cursor='grabbing'}else if(i<0){S.pan={sx:sx,sy:sy,vx:view.x,vy:view.y};cv.style.cursor='grabbing'}return}
  if(t==='pin'&&i<0){add(w[0],w[1],{fixed:true});edited()}
  else if(t==='joint'&&i<0){add(w[0],w[1]);edited()}
  else if(t==='link'&&i>=0){if(S.pend<0)S.pend=i;else if(S.pend!==i){if(!E.some(x=>(x.a===S.pend&&x.b===i)||(x.a===i&&x.b===S.pend)))link(S.pend,i);S.pend=-1;edited()}else S.pend=-1}
  else if(t==='motor'&&i>=0){const p=P[i];if(p.drv){p.drv=null;edited()}else if(!p.fixed){const f=E.map(x=>x.a===i?x.b:x.b===i?x.a:-1).filter(j=>j>=0&&P[j].fixed)[0];if(f!=null){p.drv={c:f,r:dist(i,f),mode:'rot',a0:Math.atan2(p.y-P[f].y,p.x-P[f].x),amp:.9};S.t=0;edited()}else flash(L('Първо свържете точката със звено към опора.','Link the point to a support first.'))}}
  else if(t==='rail'&&i>=0&&!P[i].fixed&&!P[i].drv){const p=P[i],n=(S.railTurn[i]||0)%3;S.railTurn[i]=n+1;p.rail=n===0?{ox:p.x,oy:p.y,dx:1,dy:0}:n===1?{ox:p.x,oy:p.y,dx:0,dy:1}:null;edited()}
  else if(t==='pen'&&i>=0){P[i].pen=!P[i].pen;if(!P[i].pen)traces[i]=null;edited()}
  else if(t==='erase'){if(i>=0){removeP(i);edited()}else{const k=pickLink(sx,sy);if(k>=0){E.splice(k,1);edited()}}}
});
let toastT=0;function flash(m){const o=$('[data-o=help]',root);o.textContent=m;o.classList.add('warn');clearTimeout(toastT);toastT=setTimeout(()=>{o.classList.remove('warn');o.textContent=HELP[S.tool]},2600)}
cv.addEventListener('pointermove',e=>{
  const [sx,sy]=pt(e);S.hover=pick(sx,sy);
  if(S.drag>=0){
    const w=toW(sx,sy),p=P[S.drag],snap=P.map(q=>[q.x,q.y]);p.x=w[0];p.y=w[1];
    if(p.rail){/* stays on the rail through project() */}
    project(60);S.res=residual();
    if(S.res>.03){P.forEach((q,i)=>{q.x=snap[i][0];q.y=snap[i][1]})}else{S.blocked=false;const tr=traces;P.forEach((q,i)=>{if(q.pen&&S.run===false){const a=traces[i]||(traces[i]=[]);a.push([q.x,q.y])}})}
  }else if(S.pan){view.x=S.pan.vx-(sx-S.pan.sx)/view.s;view.y=S.pan.vy+(sy-S.pan.sy)/view.s}
});
const up=()=>{S.drag=-1;S.pan=null;cv.style.cursor=S.tool==='move'?'grab':'crosshair'};
cv.addEventListener('pointerup',up);cv.addEventListener('pointercancel',up);cv.addEventListener('pointerleave',()=>{S.hover=-1});
cv.addEventListener('wheel',e=>{e.preventDefault();const [sx,sy]=pt(e),w=toW(sx,sy),k=e.deltaY<0?1.12:1/1.12;view.s=Math.max(12,Math.min(220,view.s*k));const w2=toW(sx,sy);view.x+=w[0]-w2[0];view.y+=w[1]-w2[1]},{passive:false});

/* ---------- controls ---------- */
$$('[data-tool]',root).forEach(b=>b.addEventListener('click',()=>setTool(b.dataset.tool)));
$$('[data-pre]',root).forEach(b=>b.addEventListener('click',()=>{load(b.dataset.pre);setTool('move');S.run=true;syncRun()}));
function syncRun(){const b=$('[data-act=run]',root);b.textContent=S.run?L('Пауза','Pause'):L('Пусни','Run');b.setAttribute('aria-pressed',S.run)}
$('[data-act=run]',root).addEventListener('click',()=>{S.run=!S.run;syncRun()});
$('[data-act=clear]',root).addEventListener('click',()=>{P=[];E=[];traces=[];S.railTurn={};preset=null;view={x:0,y:0,s:60};$$('[data-pre]',root).forEach(b=>b.classList.remove('on'));edited();setTool('pin')});
$('[data-act=trace]',root).addEventListener('click',()=>{traces=[]});
$('[data-act=mode]',root).addEventListener('click',e=>{const b=e.currentTarget;S.mode=S.mode==='rot'?'rock':S.mode==='rock'?'preset':'rot';b.textContent=L('Мотор: ','Motor: ')+(S.mode==='rot'?L('въртене','turning'):S.mode==='rock'?L('люлеене','rocking'):L('по примера','as preset'));traces=[]});
const sp=$('input[data-k=speed]',root);sp.addEventListener('input',()=>{S.omega=+sp.value;sp.parentElement.querySelector('output').textContent=(+sp.value).toFixed(1).replace('.',EN?'.':',')});
sp.parentElement.querySelector('output').textContent=(+sp.value).toFixed(1).replace('.',EN?'.':',');
$('[data-act=mode]',root).textContent=L('Мотор: по примера','Motor: as preset');

setTool('move');load('fourbar');syncRun();
if(reduce){/* start paused; the user may press Run */}
requestAnimationFrame(frame);
new ResizeObserver(()=>{if(preset&&S.bb&&S.drag<0)setBox(S.bb)}).observe(cv);
})();
