/* Chapter overlays: technical drawings driven by scroll progress */
(function(){
'use strict';
const TM=window.TMM=window.TMM||{};
const PI=Math.PI,TAU=PI*2;
const dpr=Math.min(window.devicePixelRatio||1,2);
const D=TM.draw,M=TM.MECH;
const ST={line:'#f1eee8',dim:'rgba(241,238,232,.36)',faint:'rgba(241,238,232,.13)',acc:'#a8c8ea',bg:'#050607',fill:'rgba(241,238,232,.04)',txt:'rgba(241,238,232,.62)'};
const tr=(bg,en)=>TM.lang==='en'?en:bg;
const fmt=(n,d)=>n.toFixed(d==null?1:d).replace('.',TM.lang==='en'?'.':',');
const ease=t=>t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

function region(w,h){
  const narrow=w<860;
  return narrow?{x:w*.06,y:h*.07,w:w*.88,h:h*.46}:{x:w*.46,y:h*.14,w:w*.5,h:h*.72};
}
function fit(R,bb,pad){
  const bw=bb.x1-bb.x0,bh=bb.y1-bb.y0,sc=Math.min(R.w*(1-pad)/bw,R.h*(1-pad)/bh);
  return{sc,ox:R.x+R.w/2-(bb.x0+bw/2)*sc,oy:R.y+R.h/2+(bb.y0+bh/2)*sc};
}

/* I — four-bar linkage: crank angle follows the scroll, the coupler curve is drawn as you go */
const P1={a:1,b:2.7,c:2.1,d:2.9,u:.5,v:.7};
let bb1=null;
function scene1(x,w,h,p,hud){
  const R=region(w,h),{a,b,c,d,u,v}=P1;
  if(!bb1){const pts=[[0,0],[d,0]];for(let i=0;i<360;i++){const S=TM.solve4(a,b,c,d,i/360*TAU);pts.push(S.A,S.B,TM.coupler(S,u,v))}
    bb1={x0:Math.min(...pts.map(q=>q[0])),x1:Math.max(...pts.map(q=>q[0])),y0:Math.min(...pts.map(q=>q[1])),y1:Math.max(...pts.map(q=>q[1]))}}
  const {sc,ox,oy}=fit(R,bb1,.12),Tp=q=>[ox+q[0]*sc,oy-q[1]*sc];
  const th=p*TAU*2.2,S=TM.solve4(a,b,c,d,th),O2=Tp([0,0]),O4=Tp([d,0]),A=Tp(S.A),B=Tp(S.B),Pt=Tp(TM.coupler(S,u,v));
  D.dashedCircle(x,O2[0],O2[1],a*sc,ST);D.axis(x,[O2[0]-sc*.7,O2[1]],[O4[0]+sc*.7,O4[1]],ST);
  // trace so far
  x.beginPath();const n=Math.max(2,Math.floor(th/.03));for(let i=0;i<=n;i++){const q=TM.solve4(a,b,c,d,i/n*th),pp=Tp(TM.coupler(q,u,v));i?x.lineTo(pp[0],pp[1]):x.moveTo(pp[0],pp[1])}
  D.stroke(x,ST.acc,1.6);
  x.beginPath();x.moveTo(...A);x.lineTo(...Pt);x.lineTo(...B);D.stroke(x,ST.dim,1,[3,3]);
  [[O2,A],[A,B],[O4,B]].forEach(([s,e])=>{D.bar(x,s,e,sc*.09);x.fillStyle='rgba(5,6,7,.55)';x.fill();D.stroke(x,ST.line,1.2)});
  D.ground(x,O2,9,ST);D.ground(x,O4,9,ST);[O2,O4,A,B].forEach(q=>D.pin(x,q,5,ST));
  x.beginPath();x.arc(Pt[0],Pt[1],4.5,0,TAU);x.fillStyle=ST.acc;x.fill();x.beginPath();x.arc(Pt[0],Pt[1],11,0,TAU);D.stroke(x,ST.acc,1);
  hud('θ₂ = '+Math.round(((th*180/PI)%360+360)%360)+'°   ·   '+tr('траектория на точка P','path of point P'));
}

/* II — precision: dial, dimension lines, vernier */
function scene2(x,w,h,p,hud,t){
  const R=region(w,h),cx=R.x+R.w/2,cy=R.y+R.h*.46,r=Math.min(R.w,R.h)*.36;
  const a=ease(clamp(p*3,0,1));
  x.globalAlpha=a;
  // dial
  x.beginPath();x.arc(cx,cy,r,0,TAU);D.stroke(x,ST.line,1.2);x.beginPath();x.arc(cx,cy,r*.82,0,TAU);D.stroke(x,ST.faint,1);
  for(let i=0;i<120;i++){const an=i/120*TAU,l=i%10===0?r*.1:i%5===0?r*.06:r*.03;x.beginPath();x.moveTo(cx+Math.cos(an)*r,cy+Math.sin(an)*r);x.lineTo(cx+Math.cos(an)*(r-l),cy+Math.sin(an)*(r-l));D.stroke(x,i%10===0?ST.line:ST.dim,1)}
  // needle
  const na=-PI/2+p*TAU*1.5;x.beginPath();x.moveTo(cx,cy);x.lineTo(cx+Math.cos(na)*r*.9,cy+Math.sin(na)*r*.9);D.stroke(x,ST.acc,1.8);
  x.beginPath();x.arc(cx,cy,5,0,TAU);x.fillStyle=ST.acc;x.fill();x.beginPath();x.arc(cx,cy,r*.06,0,TAU);D.stroke(x,ST.dim,1);
  // gear section hint
  const z=24,rr=r*.5;D.gearPath(x,cx,cy,rr,z,p*2,rr*.09);D.stroke(x,ST.dim,1);
  // dimension line across
  const yy=cy+r*1.18;x.beginPath();x.moveTo(cx-r,yy);x.lineTo(cx+r,yy);x.moveTo(cx-r,yy-8);x.lineTo(cx-r,yy+8);x.moveTo(cx+r,yy-8);x.lineTo(cx+r,yy+8);D.stroke(x,ST.line,1);
  x.beginPath();x.moveTo(cx-r,cy);x.lineTo(cx-r,yy);x.moveTo(cx+r,cy);x.lineTo(cx+r,yy);D.stroke(x,ST.faint,1,[3,4]);
  const val=24+Math.sin(p*38)*.004+Math.cos(p*91)*.002;
  D.label(x,'Ø '+val.toFixed(3).replace('.',TM.lang==='en'?'.':',')+'  ±0.005',cx,yy+22,ST);
  // vernier
  const vy=R.y+R.h*.97,vx0=R.x,vx1=R.x+R.w;x.beginPath();x.moveTo(vx0,vy);x.lineTo(vx1,vy);D.stroke(x,ST.dim,1);
  for(let i=0;i<=80;i++){const px=vx0+i/80*(vx1-vx0),l=i%10===0?10:i%5===0?7:4;x.beginPath();x.moveTo(px,vy);x.lineTo(px,vy-l);D.stroke(x,ST.dim,1)}
  const mx=vx0+((p*3)%1)*(vx1-vx0);x.beginPath();x.moveTo(mx,vy+2);x.lineTo(mx-5,vy+12);x.lineTo(mx+5,vy+12);x.closePath();x.fillStyle=ST.acc;x.fill();
  x.globalAlpha=1;
  hud('Ø '+val.toFixed(3).replace('.',TM.lang==='en'?'.':',')+' ± 0.005 mm');
}

/* III — planetary gear, driven by scroll */
function scene3(x,w,h,p,hud){
  const R=region(w,h);x.save();x.translate(R.x,R.y);
  M.planet.draw(x,R.w,R.h,p*16,ST,{i:0},{});
  x.restore();
  hud('z₁ · z₂ · z₃ = 18 · 12 · 42   ·   u = 1 + z₃/z₁ = '+(1+42/18).toFixed(2).replace('.',TM.lang==='en'?'.':','));
}

/* IV — manipulator following a path (inverse kinematics) */
function scene4(x,w,h,p,hud,t){
  const R=region(w,h),L1=R.h*.46,L2=R.h*.4,bx=R.x+R.w*.44,by=R.y+R.h*.92;
  const path=s=>[bx+Math.sin(s*TAU*1.0+.6)*L1*.95+L2*.2,by-L1*.95-Math.sin(s*TAU*2)*L1*.38-L2*.15];
  const ik=(tx,ty)=>{const dx=tx-bx,dy=ty-by,d=Math.min(Math.hypot(dx,dy),L1+L2-1),c2=(d*d-L1*L1-L2*L2)/(2*L1*L2),q2=-Math.acos(clamp(c2,-1,1)),q1=Math.atan2(dy,dx)-Math.atan2(L2*Math.sin(q2),L1+L2*Math.cos(q2));return[q1,q2]};
  x.beginPath();for(let i=0;i<=200;i++){const q=path(i/200);i?x.lineTo(q[0],q[1]):x.moveTo(q[0],q[1])}D.stroke(x,ST.faint,1,[4,5]);
  D.dashedCircle(x,bx,by,L1+L2,ST);
  const s=p*1.0;x.beginPath();const n=Math.max(2,Math.floor(s*200));for(let i=0;i<=n;i++){const q=path(i/200);i?x.lineTo(q[0],q[1]):x.moveTo(q[0],q[1])}D.stroke(x,ST.acc,1.6);
  const tg=path(s),[q1,q2]=ik(tg[0],tg[1]),j=[bx+L1*Math.cos(q1),by+L1*Math.sin(q1)],ee=[j[0]+L2*Math.cos(q1+q2),j[1]+L2*Math.sin(q1+q2)];
  x.lineCap='round';[[[bx,by],j,R.h*.034],[j,ee,R.h*.026]].forEach(([s0,e0,wd])=>{x.beginPath();x.moveTo(...s0);x.lineTo(...e0);x.strokeStyle=ST.line;x.lineWidth=wd+2;x.stroke();x.strokeStyle='rgba(5,6,7,.92)';x.lineWidth=wd;x.stroke()});x.lineCap='butt';
  D.ground(x,[bx,by],10,ST);D.pin(x,[bx,by],7,ST);D.pin(x,j,6,ST);
  x.beginPath();x.arc(ee[0],ee[1],5,0,TAU);x.fillStyle=ST.acc;x.fill();x.beginPath();x.arc(ee[0],ee[1],12,0,TAU);D.stroke(x,ST.acc,1);
  hud('q₁ = '+Math.round(q1*180/PI)+'°   q₂ = '+Math.round(-q2*180/PI)+'°   ·   '+tr('обратна кинематика','inverse kinematics'));
}

/* V — timeline 1945 → 2026 */
function scene5(x,w,h,p,hud){
  const R=region(w,h),y0=1945,y1=2026,yy=R.y+R.h*.55,x0=R.x,x1=R.x+R.w;
  const year=y0+(y1-y0)*clamp(p*1.15,0,1);
  x.beginPath();x.moveTo(x0,yy);x.lineTo(x1,yy);D.stroke(x,ST.dim,1);
  for(let y=y0;y<=y1;y++){const px=x0+(y-y0)/(y1-y0)*(x1-x0),l=y%10===0?18:y%5===0?11:5;x.beginPath();x.moveTo(px,yy);x.lineTo(px,yy-l);D.stroke(x,y<=year?ST.line:ST.faint,1);if(y%10===0&&y>y0)D.label(x,String(y),px,yy+20,ST)}
  const ev=[[1945,tr('Началото','The beginning')],[1974,tr('Самостоятелна катедра','Independent department')]];
  ev.forEach(([y,t],i)=>{const px=x0+(y-y0)/(y1-y0)*(x1-x0),on=year>=y;x.beginPath();x.arc(px,yy,on?6:4,0,TAU);x.fillStyle=on?ST.acc:ST.bg;x.fill();D.stroke(x,on?ST.acc:ST.dim,1.2);
    x.globalAlpha=on?1:.25;const ly=yy-R.h*(i?.34:.2);x.beginPath();x.moveTo(px,yy-8);x.lineTo(px,ly+10);D.stroke(x,ST.dim,1);D.label(x,y+' — '+t,px+(i?-6:6),ly,ST,i?'right':'left');x.globalAlpha=1});
  const mx=x0+(year-y0)/(y1-y0)*(x1-x0);x.beginPath();x.moveTo(mx,yy-R.h*.5);x.lineTo(mx,yy+14);D.stroke(x,ST.acc,1);
  x.font="300 "+Math.round(Math.min(R.w*.2,R.h*.3))+"px 'Unbounded',sans-serif";x.fillStyle=ST.line;x.textAlign='right';x.fillText(String(Math.round(year)),x1,R.y+R.h*.13);
  hud(year>=1974?tr('1974 — самостоятелна катедра','1974 — independent department'):tr('1945 — първият преподавател','1945 — the first lecturer'));
}

const SCENES=[scene1,scene2,scene3,scene4,scene5];
TM.scenes=function(){
  const out=[];
  [...document.querySelectorAll('.chap')].forEach((sec,i)=>{
    const cv=sec.querySelector('canvas.ov'),hudEl=sec.querySelector('.hud'),fn=SCENES[i];
    const o={sec,cv,x:cv.getContext('2d'),w:0,h:0,p:0,sp:0,vis:false,last:''};
    const rs=()=>{const r=cv.getBoundingClientRect();o.w=r.width;o.h=r.height;cv.width=Math.max(1,r.width*dpr);cv.height=Math.max(1,r.height*dpr);o.x.setTransform(dpr,0,0,dpr,0,0)};
    new ResizeObserver(rs).observe(cv);rs();
    new IntersectionObserver(e=>{o.vis=e[0].isIntersecting}).observe(sec);
    o.hud=s=>{if(s!==o.last){hudEl.textContent=s;o.last=s}};
    o.draw=()=>{o.sp+=(o.p-o.sp)*.14;o.x.clearRect(0,0,o.w,o.h);fn(o.x,o.w,o.h,o.sp,o.hud,performance.now()/1000)};
    out.push(o);
  });
  return out;
};
})();
