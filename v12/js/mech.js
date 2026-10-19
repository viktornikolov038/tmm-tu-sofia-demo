/* Mechanisms: kinematically exact 2D drawings, the Atlas viewer and the research tiles */
(function(){
'use strict';
const TM=window.TMM=window.TMM||{};
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const PI=Math.PI,TAU=PI*2;
const dpr=Math.min(window.devicePixelRatio||1,2);
const reduce=matchMedia('(prefers-reduced-motion:reduce)').matches;
const tr=(bg,en)=>TM.lang==='en'?en:bg;
const fmt=(n,d)=>n.toFixed(d==null?2:d).replace('.',TM.lang==='en'?'.':',');

const DARK={line:'#182b6b',dim:'rgba(24,43,107,.5)',faint:'rgba(24,43,107,.14)',acc:'#0a8f9f',fill:'rgba(43,89,224,.07)',bg:'#ffffff',txt:'rgba(24,43,107,.7)'};
const LIGHT={line:'#0c0f14',dim:'rgba(12,15,20,.38)',faint:'rgba(12,15,20,.1)',acc:'#ff4b14',fill:'rgba(12,15,20,.04)',bg:'#eef0f3',txt:'rgba(12,15,20,.55)'};
const ORANGE={line:'#0b0e13',dim:'rgba(11,14,19,.5)',faint:'rgba(11,14,19,.22)',acc:'#ffffff',fill:'rgba(11,14,19,.06)',bg:'#ff4b14',txt:'rgba(11,14,19,.7)'};
const MONO="11px 'PT Sans',Arial,sans-serif";
TM.motion=!reduce;

/* ───────── stage manager ───────── */
const stages=[];let T=0;
function stage(cv,draw,st){
  const o={cv,draw,st,x:cv.getContext('2d'),w:0,h:0,vis:false,drawn:false,cache:{}};
  const rs=()=>{const r=cv.getBoundingClientRect();o.w=r.width;o.h=r.height;cv.width=Math.max(1,r.width*dpr);cv.height=Math.max(1,r.height*dpr);o.x.setTransform(dpr,0,0,dpr,0,0);o.drawn=false};
  new ResizeObserver(rs).observe(cv);rs();
  new IntersectionObserver(e=>{o.vis=e[0].isIntersecting}).observe(cv);
  stages.push(o);return o;
}
let last=performance.now();
function loop(now){
  const dt=(reduce||!TM.motion)?0:Math.min((now-last)/1000,.05);last=now;T+=dt;
  for(const o of stages){
    if(!o.w||!o.vis)continue;
    if((reduce||!TM.motion)&&o.drawn&&!o.dirty)continue;
    o.drawn=true;o.dirty=false;o.x.clearRect(0,0,o.w,o.h);o.draw(o.x,o.w,o.h,dt,o.st,o);
  }
  requestAnimationFrame(loop);
}

/* ───────── helpers ───────── */
function stroke(x,col,w,dash){x.strokeStyle=col;x.lineWidth=w||1;x.setLineDash(dash||[]);x.stroke();x.setLineDash([])}
function circ(x,cx,cy,r){x.beginPath();x.arc(cx,cy,r,0,TAU)}
function bar(x,p,q,w){const a=Math.atan2(q[1]-p[1],q[0]-p[0]);x.beginPath();x.arc(p[0],p[1],w,a+PI/2,a+PI*1.5);x.arc(q[0],q[1],w,a-PI/2,a+PI/2);x.closePath()}
function pin(x,p,r,st){circ(x,p[0],p[1],r);x.fillStyle=st.bg;x.fill();stroke(x,st.line,1.1);circ(x,p[0],p[1],r*.32);x.fillStyle=st.line;x.fill()}
function ground(x,p,s,st){
  x.beginPath();x.moveTo(p[0],p[1]);x.lineTo(p[0]-s,p[1]+s*1.5);x.lineTo(p[0]+s,p[1]+s*1.5);x.closePath();stroke(x,st.line,1);
  x.beginPath();x.moveTo(p[0]-s*1.5,p[1]+s*1.5);x.lineTo(p[0]+s*1.5,p[1]+s*1.5);stroke(x,st.line,1);
  x.beginPath();for(let i=-1.5;i<=1.5;i+=.5){x.moveTo(p[0]+i*s,p[1]+s*1.5);x.lineTo(p[0]+i*s-s*.4,p[1]+s*2)}stroke(x,st.dim,1);
}
function label(x,t,px,py,st,al){x.font=MONO;x.fillStyle=st.txt;x.textAlign=al||'center';x.fillText(t,px,py)}
function dashedCircle(x,cx,cy,r,st){circ(x,cx,cy,r);stroke(x,st.faint,.9,[3,5])}
function axis(x,a,b,st){x.beginPath();x.moveTo(a[0],a[1]);x.lineTo(b[0],b[1]);stroke(x,st.faint,.9,[10,4,2,4])}
function gearPath(x,cx,cy,r,z,rot,hh){
  const step=TAU/z;x.beginPath();
  for(let i=0;i<z;i++){const a=rot+i*step;
    [[a-step*.28,r-hh],[a-step*.15,r+hh],[a+step*.15,r+hh],[a+step*.28,r-hh]].forEach((p,k)=>{
      const px=cx+Math.cos(p[0])*p[1],py=cy+Math.sin(p[0])*p[1];(i===0&&k===0)?x.moveTo(px,py):x.lineTo(px,py)});
  }
  x.closePath();
}
function fitBox(w,h,bb,pad){
  const bw=bb.x1-bb.x0,bh=bb.y1-bb.y0,sc=Math.min(w*(1-pad)/bw,h*(1-pad)/bh);
  return{sc,ox:w/2-(bb.x0+bw/2)*sc,oy:h/2+(bb.y0+bh/2)*sc};
}
const bbox=pts=>{const b={x0:1e9,y0:1e9,x1:-1e9,y1:-1e9};pts.forEach(p=>{b.x0=Math.min(b.x0,p[0]);b.y0=Math.min(b.y0,p[1]);b.x1=Math.max(b.x1,p[0]);b.y1=Math.max(b.y1,p[1])});return b};

/* four-bar kinematics (O2=(0,0), O4=(d,0), y up) */
function solve4(a,b,c,d,th){
  const Ax=a*Math.cos(th),Ay=a*Math.sin(th),dx=d-Ax,dy=-Ay,L=Math.hypot(dx,dy);
  if(L>b+c||L<Math.abs(b-c)||L<1e-9)return null;
  const k=(b*b-c*c+L*L)/(2*L),hh=Math.sqrt(Math.max(b*b-k*k,0)),ux=dx/L,uy=dy/L;
  return{A:[Ax,Ay],B:[Ax+ux*k-uy*hh,Ay+uy*k+ux*hh]};
}
const coupler=(S,u,v)=>{const vx=S.B[0]-S.A[0],vy=S.B[1]-S.A[1];return[S.A[0]+vx*u-vy*v,S.A[1]+vy*u+vx*v]};
TM.solve4=solve4;TM.coupler=coupler;

/* ═════════ MECHANISM DEFINITIONS ═════════ */
const MECH={};

MECH.fourbar={
  n:'I',name:['Четиризвенен механизъм','Four-bar linkage'],
  desc:['Манивела, свързващ лост и люлка върху неподвижна стойка. Точка от свързващия лост описва затворена траектория, която инженерите проектират за конкретна задача.','A crank, a coupler and a rocker on a fixed frame. A point on the coupler traces a closed curve that engineers design for a given task.'],
  controls:[{k:'a',l:'a',min:.5,max:1.7,step:.05,v:1,u:'Манивела|Crank'},{k:'b',l:'b',min:1.8,max:3.8,step:.05,v:2.7,u:'Свързващ лост|Coupler'},{k:'c',l:'c',min:1.4,max:3.4,step:.05,v:2.1,u:'Люлка|Rocker'},{k:'d',l:'d',min:1.8,max:3.8,step:.05,v:2.9,u:'Стойка|Frame'}],
  prep(P,o){
    const key=[P.a,P.b,P.c,P.d].join(),C=o.cache;if(C.key===key)return C;C.key=key;
    const N=720,ok=[];for(let i=0;i<N;i++)ok.push(!!solve4(P.a,P.b,P.c,P.d,i/N*TAU));
    C.full=ok.every(Boolean);C.none=!ok.some(Boolean);
    if(!C.full&&!C.none){let best=0,bs=0;for(let s=0;s<N;s++){if(ok[s]&&!ok[(s+N-1)%N]){let l=0;while(ok[(s+l)%N]&&l<N)l++;if(l>best){best=l;bs=s}}}
      C.c=((bs+best/2)%N)/N*TAU;C.amp=Math.max(0,(best/2-3)/N*TAU)}
    const pts=[[0,0],[P.d,0]],curve=[];
    for(let i=0;i<N;i++){const S=ok[i]&&solve4(P.a,P.b,P.c,P.d,i/N*TAU);if(S){const p=coupler(S,.5,.7);curve.push(p);pts.push(S.A,S.B,p)}}
    C.curve=curve;C.bb=bbox(pts);return C;
  },
  draw(x,w,h,ph,st,P,o){
    const C=this.prep(P,o);if(C.none){label(x,tr('Невъзможна конфигурация','Impossible configuration'),w/2,h/2,st);return}
    const th=C.full?ph*.9:C.c+C.amp*Math.sin(ph*.9),S=solve4(P.a,P.b,P.c,P.d,th)||solve4(P.a,P.b,P.c,P.d,C.c);
    const {sc,ox,oy}=fitBox(w,h,C.bb,.2),Tp=p=>[ox+p[0]*sc,oy-p[1]*sc];
    const O2=Tp([0,0]),O4=Tp([P.d,0]),A=Tp(S.A),B=Tp(S.B),Pt=Tp(coupler(S,.5,.7)),w2=sc*.1;
    dashedCircle(x,O2[0],O2[1],P.a*sc,st);axis(x,[O2[0]-sc*.6,O2[1]],[O4[0]+sc*.6,O4[1]],st);
    x.beginPath();C.curve.forEach((p,i)=>{const q=Tp(p);i?x.lineTo(q[0],q[1]):x.moveTo(q[0],q[1])});if(C.full)x.closePath();stroke(x,st.acc,1,[2,4]);
    x.beginPath();x.moveTo(...A);x.lineTo(...Pt);x.lineTo(...B);stroke(x,st.dim,.9,[3,3]);
    [[O2,A],[A,B],[O4,B]].forEach(([p,q])=>{bar(x,p,q,w2);x.fillStyle=st.fill;x.fill();stroke(x,st.line,1.1)});
    ground(x,O2,9,st);ground(x,O4,9,st);[O2,O4,A,B].forEach(p=>pin(x,p,5,st));
    circ(x,Pt[0],Pt[1],4);x.fillStyle=st.acc;x.fill();circ(x,Pt[0],Pt[1],9);stroke(x,st.acc,.9);
    label(x,'a',(O2[0]+A[0])/2-11,(O2[1]+A[1])/2,st);label(x,'b',(A[0]+B[0])/2,(A[1]+B[1])/2-12,st);label(x,'c',(O4[0]+B[0])/2+11,(O4[1]+B[1])/2,st);label(x,'d',(O2[0]+O4[0])/2,O2[1]+30,st);
    o.th=th;
  },
  info(P,o){
    const s=[['a',P.a],['b',P.b],['c',P.c],['d',P.d]].sort((p,q)=>p[1]-q[1]),gr=s[0][1]+s[3][1]<=s[1][1]+s[2][1];
    let type;if(!gr)type=tr('Не-Грасхоф: само люлеещи звена','Non-Grashof: all links rock');
    else if(s[0][0]==='d')type=tr('Двукривошипен (двойна манивела)','Double-crank');
    else if(s[0][0]==='b')type=tr('Двулюлков (Грасхоф)','Double-rocker (Grashof)');
    else type=tr('Манивела–люлка','Crank-rocker');
    return[[tr('Тип','Type'),type],[tr('Условие на Грасхоф','Grashof condition'),(gr?'s + l ≤ p + q ✓':'s + l > p + q ✕')],[tr('Ъгъл на манивелата','Crank angle'),Math.round(((o.th||0)*180/PI%360+360)%360)+'°']];
  }
};

MECH.slider={
  n:'II',name:['Колянно-плъзгачен механизъм','Slider-crank'],
  desc:['Превръща въртеливото движение в праволинейно (и обратно). Основа на двигателите с вътрешно горене, компресорите и помпите.','Converts rotation into linear motion and back. The basis of combustion engines, compressors and pumps.'],
  controls:[{k:'r',l:'r',min:.6,max:1.4,step:.05,v:1,u:'Манивела|Crank'},{k:'l',l:'l',min:2.2,max:4.2,step:.05,v:3.2,u:'Мотовилка|Rod'}],
  draw(x,w,h,ph,st,P){
    const r=P.r,l=P.l,th=ph*1.1,A=[r*Math.cos(th),r*Math.sin(th)],xp=A[0]+Math.sqrt(l*l-A[1]*A[1]);
    const bb={x0:-r-.3,x1:r+l+1.5,y0:-1.4,y1:1.4},{sc,ox,oy}=fitBox(w,h,bb,.16),Tp=p=>[ox+p[0]*sc,oy-p[1]*sc];
    const O=Tp([0,0]),a=Tp(A),p=Tp([xp,0]),cx0=l-r-.5,cx1=r+l+.5;
    x.beginPath();x.moveTo(...Tp([cx0,.7]));x.lineTo(...Tp([cx1,.7]));x.lineTo(...Tp([cx1,-.7]));x.lineTo(...Tp([cx0,-.7]));stroke(x,st.line,1.3);
    for(let i=0;i<16;i++){const gx=cx0+i*(cx1-cx0)/15;[1,-1].forEach(s=>{x.beginPath();x.moveTo(...Tp([gx,.7*s]));x.lineTo(...Tp([gx-.12,.7*s+.17*s]));stroke(x,st.dim,.7)})}
    axis(x,Tp([-r-.4,0]),Tp([cx1+.3,0]),st);dashedCircle(x,O[0],O[1],r*sc,st);
    const pw=.46,ph2=.58,q0=Tp([xp-pw,ph2]),q1=Tp([xp+pw,-ph2]);
    x.beginPath();x.rect(q0[0],q0[1],q1[0]-q0[0],q1[1]-q0[1]);x.fillStyle=st.fill;x.fill();stroke(x,st.line,1.3);
    [.45,.7].forEach(k=>{x.beginPath();x.moveTo(...Tp([xp+pw*k,ph2]));x.lineTo(...Tp([xp+pw*k,-ph2]));stroke(x,st.dim,.8)});
    bar(x,a,p,sc*.09);x.fillStyle=st.fill;x.fill();stroke(x,st.line,1.1);bar(x,O,a,sc*.11);x.fillStyle=st.fill;x.fill();stroke(x,st.line,1.1);
    pin(x,O,5,st);pin(x,a,4.5,st);pin(x,p,4.5,st);ground(x,O,8,st);
    const s0=Tp([l-r,-1.15]),s1=Tp([l+r,-1.15]);x.beginPath();x.moveTo(...s0);x.lineTo(...s1);x.moveTo(s0[0],s0[1]-5);x.lineTo(s0[0],s0[1]+5);x.moveTo(s1[0],s1[1]-5);x.lineTo(s1[0],s1[1]+5);stroke(x,st.acc,1);
    label(x,'s = 2r',(s0[0]+s1[0])/2,s0[1]+17,st);
    const o=arguments[6];o.xp=xp;o.th=th;
  },
  info(P,o){return[[tr('Ход на буталото','Piston stroke'),'s = '+fmt(2*P.r)],[tr('Отношение','Ratio')+' λ = r/l',fmt(P.r/P.l,3)],[tr('Положение на буталото','Piston position'),'x = '+fmt(o.xp||0)]]}
};

MECH.geneva={
  n:'III',name:['Малтийски механизъм','Geneva drive'],
  desc:['Превръща непрекъснатото въртене в прекъснато: задвижваното колело завърта на 360°/n и стои неподвижно, докато щифтът излезе от прореза.','Turns continuous rotation into intermittent motion: the driven wheel indexes by 360°/n and rests while the pin leaves the slot.'],
  controls:[{k:'n',l:'n',min:4,max:8,step:1,v:4,u:'Брой прорези|Slots',list:[4,5,6,8]}],
  draw(x,w,h,ph,st,P){
    const n=P.n,C=1,r=Math.sin(PI/n),beta=PI/2-PI/n,ct=C*Math.cos(PI/n);
    const bb={x0:-.75,x1:C+ct+.35,y0:-1.05,y1:1.05},{sc,ox,oy}=fitBox(w,h,bb,.14),Tp=p=>[ox+p[0]*sc,oy-p[1]*sc];
    const tot=ph*.9,m=Math.floor((tot+beta)/TAU),thp=tot-m*TAU,psi=a=>Math.atan2(r*Math.sin(a),r*Math.cos(a)-C),step=TAU/n;
    const rot=thp<beta?-m*step+psi(thp)-psi(-beta):-m*step-step,base=psi(-beta);
    const D=Tp([C,0]),Oo=Tp([0,0]),rd=r*.78,rc=rd+.04,Rb=ct+.2;
    x.beginPath();
    for(let k=0;k<=360;k++){
      const ps=k/360*TAU;let rho=Rb;
      for(let j=0;j<n;j++){
        const ca=base+rot+j*step-PI/n,cx_=C*Math.cos(ca),cy_=C*Math.sin(ca),pr=cx_*Math.cos(ps)+cy_*Math.sin(ps),pe=-cx_*Math.sin(ps)+cy_*Math.cos(ps);
        if(Math.abs(pe)<rc&&pr>0)rho=Math.min(rho,pr-Math.sqrt(rc*rc-pe*pe));
      }
      const q=[D[0]+Math.cos(ps)*rho*sc,D[1]-Math.sin(ps)*rho*sc];k?x.lineTo(q[0],q[1]):x.moveTo(q[0],q[1]);
    }
    x.closePath();x.fillStyle=st.fill;x.fill();stroke(x,st.line,1.3);
    for(let j=0;j<n;j++){
      const ang=base+rot+j*step,u=[Math.cos(ang),Math.sin(ang)];
      const p0=[D[0]+(C-r)*u[0]*sc,D[1]-(C-r)*u[1]*sc],p1=[D[0]+(ct+.07)*u[0]*sc,D[1]-(ct+.07)*u[1]*sc];
      bar(x,p0,p1,.065*sc);stroke(x,st.line,1);
    }
    pin(x,D,5,st);
    const Pp=Tp([r*Math.cos(tot),r*Math.sin(tot)]);
    x.beginPath();x.arc(Oo[0],Oo[1],rd*sc,tot+.95,tot+TAU-.95);stroke(x,st.line,1.3);
    bar(x,Oo,Pp,sc*.075);x.fillStyle=st.fill;x.fill();stroke(x,st.line,1.1);
    circ(x,Pp[0],Pp[1],sc*.045);x.fillStyle=st.acc;x.fill();dashedCircle(x,Oo[0],Oo[1],r*sc,st);pin(x,Oo,5,st);
    arguments[6].eng=thp<beta;
  },
  info(P,o){const n=P.n;return[[tr('Ъгъл на задвижването','Indexing angle'),'360°/n = '+fmt(360/n,1)+'°'],[tr('Време на движение','Motion fraction'),'k = ½ − 1/n = '+fmt(.5-1/n,3)],[tr('Състояние','State'),o.eng?tr('зацепване','engaged'):tr('покой','dwell')]]}
};

MECH.cam={
  n:'IV',name:['Гърбичен механизъм','Cam & follower'],
  desc:['Профилът на гърбицата задава точния закон на движение на изпълнителното звено — издигане, покой, връщане. Така се управляват клапаните на двигателите.','The cam profile defines the exact motion law of the follower — rise, dwell, return. This is how engine valves are controlled.'],
  controls:[{k:'h',l:'h',min:.25,max:.9,step:.05,v:.6,u:'Издигане|Lift'}],
  draw(x,w,h,ph,st,P){
    const al=ph*.7,r0=Math.min(w*.17,h*.2),hl=r0*P.h,cx=w*.32,cy=h*.62;
    const S=f=>{f=((f%TAU)+TAU)%TAU;const k=TAU/3;if(f<k)return(1-Math.cos(PI*f/k))/2;if(f<PI)return 1;if(f<PI+k)return(1+Math.cos(PI*(f-PI)/k))/2;return 0};
    const R=f=>r0+hl*S(f);
    x.beginPath();for(let k=0;k<=240;k++){const f=k/240*TAU,rho=R(f),ang=f+al,px=cx+rho*Math.cos(ang),py=cy-rho*Math.sin(ang);k?x.lineTo(px,py):x.moveTo(px,py)}x.closePath();x.fillStyle=st.fill;x.fill();stroke(x,st.line,1.3);
    dashedCircle(x,cx,cy,r0,st);circ(x,cx,cy,r0*.22);stroke(x,st.line,1);pin(x,[cx,cy],4,st);
    for(let i=0;i<5;i++){const a=al+i*TAU/5+.4;x.beginPath();x.moveTo(cx+Math.cos(a)*r0*.3,cy-Math.sin(a)*r0*.3);x.lineTo(cx+Math.cos(a)*r0*.62,cy-Math.sin(a)*r0*.62);stroke(x,st.dim,.8)}
    const s=R(PI/2-al),top=cy-s,Hh=h*.3;
    x.beginPath();x.moveTo(cx,top);x.lineTo(cx-7,top-12);x.lineTo(cx+7,top-12);x.closePath();x.fillStyle=st.acc;x.fill();
    x.beginPath();x.rect(cx-5,top-12-Hh,10,Hh);x.fillStyle=st.fill;x.fill();stroke(x,st.line,1.1);
    const gy=cy-r0-hl-h*.08;x.beginPath();x.rect(cx-16,gy-34,32,26);stroke(x,st.line,1.1);
    const gx=w*.62,gw=w*.3,gh=h*.36,gyb=h*.62;
    x.beginPath();x.moveTo(gx,gyb-gh-14);x.lineTo(gx,gyb);x.lineTo(gx+gw+8,gyb);stroke(x,st.line,1);
    x.beginPath();for(let k=0;k<=120;k++){const a=k/120*TAU,sv=S(PI/2-a),px=gx+a/TAU*gw,py=gyb-sv*gh;k?x.lineTo(px,py):x.moveTo(px,py)}stroke(x,st.acc,1.2);
    const am=((al%TAU)+TAU)%TAU,sv=S(PI/2-am),dx=gx+am/TAU*gw,dy=gyb-sv*gh;
    x.beginPath();x.moveTo(dx,gyb);x.lineTo(dx,dy);x.lineTo(gx,dy);stroke(x,st.dim,.8,[3,3]);circ(x,dx,dy,4);x.fillStyle=st.acc;x.fill();
    label(x,'s',gx-10,gyb-gh-8,st);label(x,'φ',gx+gw+14,gyb+4,st);label(x,'s(φ)',gx+gw/2,gyb+22,st);
    arguments[6].sv=sv;
  },
  info(P,o){return[[tr('Закон на движение','Motion law'),tr('косинусоидален','cosine')],[tr('Максимално издигане','Max lift'),'h = '+fmt(P.h*100,0)+'%'],[tr('Текущо издигане','Current lift'),fmt((o.sv||0)*P.h*100,0)+'%']]}
};

const PLAN=[[18,12,42],[12,12,36],[24,12,48],[15,15,45],[21,9,39]];
MECH.planet={
  n:'V',name:['Планетна предавка','Planetary gear set'],
  desc:['Слънчево колело, сателити на водило и вътрешно зъбна корона. Голямо предавателно отношение в малък обем — в роботите и трансмисиите.','A sun gear, planets on a carrier and an internal ring gear. High ratio in a small volume — in robots and transmissions.'],
  controls:[{k:'i',l:'z',min:0,max:4,step:1,v:0,u:'Комбинация зъби|Tooth set',list:[0,1,2,3,4],fmt:v=>PLAN[v].join('·')}],
  draw(x,w,h,ph,st,P){
    const [zs,zp,zr]=PLAN[P.i],m=Math.min(w,h)*.43*2/zr/1.06,hh=m*.95,cx=w/2,cy=h/2,fc=ph*.32;
    const fp=fc*(1-zr/zp),fs=fc*(1+zr/zs)+PI*(zp-1)/zs,fr=-PI/zr,Rr=zr*m/2;
    circ(x,cx,cy,Rr+hh+m*2.2);x.fillStyle=st.fill;x.fill();stroke(x,st.line,1.1);
    gearPath(x,cx,cy,Rr,zr,fr,-hh);stroke(x,st.line,1.1);
    const rc=(zs+zp)*m/2;
    for(let k=0;k<3;k++){const a=fc+k*TAU/3;x.beginPath();x.moveTo(cx,cy);x.lineTo(cx+rc*Math.cos(a),cy-rc*Math.sin(a));stroke(x,st.dim,.9,[4,3])}
    gearPath(x,cx,cy,zs*m/2,zs,-fs,hh);x.fillStyle=st.fill;x.fill();stroke(x,st.acc,1.3);circ(x,cx,cy,zs*m/2*.35);stroke(x,st.dim,.8);pin(x,[cx,cy],3.5,st);
    for(let k=0;k<3;k++){const a=fc+k*TAU/3,px=cx+rc*Math.cos(a),py=cy-rc*Math.sin(a);
      gearPath(x,px,py,zp*m/2,zp,-fp,hh);x.fillStyle=st.fill;x.fill();stroke(x,st.line,1.1);circ(x,px,py,zp*m/2*.38);stroke(x,st.dim,.8);pin(x,[px,py],3,st)}
  },
  info(P){const [zs,zp,zr]=PLAN[P.i];return[['z₁ · z₂ · z₃',zs+' · '+zp+' · '+zr],[tr('Предавателно отношение','Gear ratio'),'u = 1 + z₃/z₁ = '+fmt(1+zr/zs)],[tr('Условие','Condition'),'z₃ = z₁ + 2z₂ ✓']]}
};

MECH.yoke={
  n:'VI',name:['Кулисен механизъм','Scotch yoke'],
  desc:['Щифтът на манивелата се плъзга в прорез на кулисата и я движи с чисто хармонично движение — без наклон на мотовилката.','The crank pin slides in the yoke slot and drives it in pure harmonic motion — with no rod angularity.'],
  controls:[{k:'r',l:'r',min:.6,max:1.4,step:.05,v:1,u:'Манивела|Crank'}],
  draw(x,w,h,ph,st,P){
    const r=P.r,bb={x0:-1.6,x1:4.2,y0:-1.9,y1:1.9},{sc,ox,oy}=fitBox(w,h,bb,.14),Tp=p=>[ox+p[0]*sc,oy-p[1]*sc];
    const th=ph*1.1,px=r*Math.cos(th),py=r*Math.sin(th),O=Tp([0,0]),Pp=Tp([px,py]);
    dashedCircle(x,O[0],O[1],r*sc,st);axis(x,Tp([-1.6,0]),Tp([4.2,0]),st);
    const yh=1.5,f0=Tp([px-.42,yh+.1]),f1=Tp([px+.42,-yh-.1]);
    x.beginPath();x.rect(f0[0],f0[1],f1[0]-f0[0],f1[1]-f0[1]);x.fillStyle=st.fill;x.fill();stroke(x,st.line,1.3);
    const a_=Tp([px-.1,yh-.18]),b_=Tp([px+.1,-yh+.18]);x.beginPath();x.rect(a_[0],a_[1],b_[0]-a_[0],b_[1]-a_[1]);x.fillStyle=st.bg;x.fill();stroke(x,st.line,1);
    const r0=Tp([px+.42,.14]),r1=Tp([3.7,-.14]);x.beginPath();x.rect(r0[0],r0[1],r1[0]-r0[0],r1[1]-r0[1]);x.fillStyle=st.fill;x.fill();stroke(x,st.line,1.1);
    [2.2,3.1].forEach(gx=>{const g0=Tp([gx-.14,.6]),g1=Tp([gx+.14,-.6]);x.beginPath();x.rect(g0[0],g0[1],g1[0]-g0[0],g1[1]-g0[1]);stroke(x,st.dim,1)});
    bar(x,O,Pp,sc*.1);x.fillStyle=st.fill;x.fill();stroke(x,st.line,1.1);pin(x,O,5,st);circ(x,Pp[0],Pp[1],5.5);x.fillStyle=st.acc;x.fill();ground(x,O,8,st);
    const m0=Tp([-r,-1.75]),m1=Tp([r,-1.75]);x.beginPath();x.moveTo(...m0);x.lineTo(...m1);x.moveTo(m0[0],m0[1]-5);x.lineTo(m0[0],m0[1]+5);x.moveTo(m1[0],m1[1]-5);x.lineTo(m1[0],m1[1]+5);stroke(x,st.dim,.8);
    const mk=Tp([px,-1.75]);circ(x,mk[0],mk[1],3.5);x.fillStyle=st.acc;x.fill();label(x,'x = r·cos θ',Tp([0,-1.75])[0],m0[1]+18,st);
    arguments[6].px=px;
  },
  info(P,o){return[[tr('Закон','Law'),'x = r·cos θ'],[tr('Максимална скорост','Max velocity'),'v = r·ω'],[tr('Положение','Position'),'x = '+fmt(o.px||0)]]}
};

MECH.gears={
  n:'VII',name:['Зъбна двойка','Gear pair'],
  desc:['Две зацепени колела: по-голямото върти по-бавно, но с по-голям момент. Предавателното отношение е u = z₂ / z₁.','Two meshing wheels: the larger turns slower but with more torque. The gear ratio is u = z₂ / z₁.'],
  controls:[{k:'z1',l:'z₁',min:8,max:30,step:1,v:12,int:true,u:'Зъби на колело 1|Teeth of wheel 1'},{k:'z2',l:'z₂',min:10,max:40,step:1,v:20,int:true,u:'Зъби на колело 2|Teeth of wheel 2'}],
  draw(x,w,h,ph,st,P){
    const a=P.z1,b=P.z2,m=Math.min(w*.86/((a+b)/2+2),h*.7/(Math.max(a,b)/2+1.6)),r1=a*m/2,r2=b*m/2,tot=r1+r2,cx1=w/2-tot/2,cx2=cx1+tot,cy=h*.46,hh=m*.95,p=ph*.9;
    gearPath(x,cx1,cy,r1,a,p,hh);x.fillStyle=st.fill;x.fill();stroke(x,st.acc,1.5);
    gearPath(x,cx2,cy,r2,b,PI-PI/b-(a/b)*p,hh);x.fillStyle=st.fill;x.fill();stroke(x,st.line,1.3);
    circ(x,cx1,cy,r1);stroke(x,st.faint,.9,[3,4]);circ(x,cx2,cy,r2);stroke(x,st.faint,.9,[3,4]);
    [[cx1,r1,a],[cx2,r2,b]].forEach(([px,r,z],i)=>{circ(x,px,cy,Math.max(r*.18,3));stroke(x,st.dim,1);pin(x,[px,cy],3,st);label(x,'z'+(i?'₂':'₁')+' = '+z,px,cy+Math.max(r1,r2)+hh+26,st)});
    const dir1=1,al=-.9,ar=1.05;
    x.beginPath();x.arc(cx1,cy,r1*.55,al,al+1.0);stroke(x,st.acc,1.6);x.beginPath();x.arc(cx2,cy,r2*.55,PI+al,PI+al-1.0*(a/b),true);stroke(x,st.line,1.6);
    arguments[6].u=b/a;
  },
  info(P){const u=P.z2/P.z1;return[[tr('Предавателно отношение','Gear ratio'),'u = z₂/z₁ = '+fmt(u)],[tr('Скорост на колело 2','Speed of wheel 2'),'n₂ = n₁/u = '+fmt(1/u)+'·n₁'],[tr('Посока','Direction'),tr('обратна','opposite')]]}
};
TM.MECH=MECH;


/* ═════════ ATLAS VIEWER ═════════ */
(function(){
  const root=$('#atlasViewer');if(!root)return;
  const keys=Object.keys(MECH),tabs=$('#atTabs'),cv=$('#atCanvas'),ctl=$('#atControls'),info=$('#atInfo'),title=$('#atTitle'),desc=$('#atDesc'),num=$('#atNum'),speed=$('#atSpeed'),play=$('#atPlay');
  let cur='fourbar',P={},phase=0,paused=false,o;
  keys.forEach((k,i)=>{
    const b=document.createElement('button');b.type='button';b.dataset.k=k;
    b.setAttribute('role','tab');b.innerHTML='<span class="mono">'+MECH[k].n+'</span><b></b>';b.onclick=()=>select(k);tabs.appendChild(b);
  });
  function names(){$$('#atTabs button').forEach(b=>b.querySelector('b').textContent=MECH[b.dataset.k].name[TM.lang==='en'?1:0])}
  function select(k){
    cur=k;const M=MECH[k];P={};
    $$('#atTabs button').forEach(b=>{const on=b.dataset.k===k;b.classList.toggle('on',on);b.setAttribute('aria-selected',on)});
    num.textContent=M.n;title.textContent=M.name[TM.lang==='en'?1:0];desc.textContent=M.desc[TM.lang==='en'?1:0];
    ctl.innerHTML='';
    M.controls.forEach(c=>{
      P[c.k]=c.v;const lab=document.createElement('label');
      lab.innerHTML='<span></span><output></output><input type="range">';
      const inp=lab.querySelector('input'),out=lab.querySelector('output'),sp=lab.querySelector('span');
      inp.min=c.min;inp.max=c.max;inp.step=c.step;inp.value=c.v;
      const setL=()=>{sp.textContent=c.u.split('|')[TM.lang==='en'?1:0]+' · '+c.l;out.textContent=c.fmt?c.fmt(P[c.k]):((c.list||c.int)?P[c.k]:fmt(P[c.k]))};
      lab._set=setL;setL();
      inp.oninput=()=>{let v=+inp.value;if(c.list&&k==='geneva'){v=c.list.reduce((a,b)=>Math.abs(b-v)<Math.abs(a-v)?b:a);inp.value=v}P[c.k]=v;setL();o.cache={};o.dirty=true};
      ctl.appendChild(lab);
    });
    o.cache={};o.dirty=true;
  }
  o=stage(cv,(x,w,h,dt,st)=>{
    if(!paused)phase+=dt*(+speed.value/100);
    const M=MECH[cur];M.draw(x,w,h,phase,st,P,o);
    const rows=M.info(P,o),html=rows.map(r=>'<div><dt class="mono">'+r[0]+'</dt><dd>'+r[1]+'</dd></div>').join('');
    if(info._h!==html){info.innerHTML=html;info._h=html}
  },DARK);
  play.onclick=()=>{paused=!paused;play.classList.toggle('paused',paused);play.setAttribute('aria-pressed',paused);o.dirty=true};
  TM.onLang=TM.onLang||[];TM.onLang.push(()=>{names();select(cur)});
  names();select('fourbar');
  TM.viewer={select,cur:()=>cur,P:()=>P,keys:()=>keys,o:()=>o};
  // keyboard: arrows switch mechanism
  tabs.addEventListener('keydown',e=>{if(e.key==='ArrowRight'||e.key==='ArrowLeft'){const i=keys.indexOf(cur),n=(i+(e.key==='ArrowRight'?1:-1)+keys.length)%keys.length;select(keys[n]);tabs.querySelectorAll('button')[n].focus()}});
})();

/* ═════════ RESEARCH TILES ═════════ */
const TILES={
  synthesis(x,w,h,dt,st,o){
    o.t=(o.t||0)+dt;const t=o.t,P={a:1,b:2.7,c:2.1,d:2.9};
    const bb={x0:-1.2,x1:4.3,y0:-2.6,y1:3.4},{sc,ox,oy}=fitBox(w,h,bb,.18),Tp=p=>[ox+p[0]*sc,oy-p[1]*sc];
    [.15,.45,.75,1.05,1.35].forEach((v,j)=>{
      x.beginPath();let f=true;for(let i=0;i<=180;i++){const S=solve4(P.a,P.b,P.c,P.d,i/180*TAU),q=Tp(coupler(S,.5,v));f?x.moveTo(q[0],q[1]):x.lineTo(q[0],q[1]);f=false}x.closePath();
      stroke(x,j===2?st.acc:st.dim,j===2?1.3:.8,j===2?[]:[2,4]);
    });
    const S=solve4(P.a,P.b,P.c,P.d,t*.8),O2=Tp([0,0]),O4=Tp([P.d,0]),A=Tp(S.A),B=Tp(S.B);
    [[O2,A],[A,B],[O4,B]].forEach(([p,q])=>{x.beginPath();x.moveTo(...p);x.lineTo(...q);stroke(x,st.line,1.6)});
    [.15,.45,.75,1.05,1.35].forEach((v,j)=>{const q=Tp(coupler(S,.5,v));circ(x,q[0],q[1],j===2?4:2.5);x.fillStyle=j===2?st.acc:st.line;x.fill()});
    [O2,O4,A,B].forEach(p=>pin(x,p,3.5,st));
  },
  robot(x,w,h,dt,st,o){
    o.t=(o.t||0)+dt;const t=o.t;o.trail=o.trail||[];
    const L1=.9*Math.min(w,h)*.36,L2=.78*Math.min(w,h)*.36,bx=w*.28,by=h*.78;
    const tx=bx+L1*.2+Math.cos(t*.9)*L1*.95+L2*.35,ty=by-L1*.9-Math.sin(t*1.7)*L1*.45;
    let dx=tx-bx,dy=ty-by,d=Math.min(Math.hypot(dx,dy),L1+L2-1),c2=(d*d-L1*L1-L2*L2)/(2*L1*L2),q2=-Math.acos(Math.max(-1,Math.min(1,c2)));
    const q1=Math.atan2(dy,dx)-Math.atan2(L2*Math.sin(q2),L1+L2*Math.cos(q2));
    const j1=[bx+L1*Math.cos(q1),by+L1*Math.sin(q1)],ee=[j1[0]+L2*Math.cos(q1+q2),j1[1]+L2*Math.sin(q1+q2)];
    o.trail.push(ee);if(o.trail.length>260)o.trail.shift();
    for(let i=1;i<o.trail.length;i++){x.beginPath();x.moveTo(...o.trail[i-1]);x.lineTo(...o.trail[i]);x.strokeStyle='rgba(255,106,58,'+(i/o.trail.length*.9)+')';x.lineWidth=1.4;x.stroke()}
    dashedCircle(x,bx,by,L1+L2,st);
    x.lineCap='round';[[[bx,by],j1],[j1,ee]].forEach(([p,q],i)=>{x.beginPath();x.moveTo(...p);x.lineTo(...q);x.strokeStyle=st.line;x.lineWidth=i?7:9;x.stroke();x.strokeStyle=st.bg;x.lineWidth=i?5:7;x.stroke()});x.lineCap='butt';
    ground(x,[bx,by],9,st);pin(x,[bx,by],6,st);pin(x,j1,5,st);circ(x,ee[0],ee[1],4.5);x.fillStyle=st.acc;x.fill();
  },
  dynamics(x,w,h,dt,st,o){
    o.t=(o.t||0)+dt;const t=o.t,cy=h/2,A=h*.17,k1=9,k2=10.4;
    const line=(f,col,wd,dash)=>{x.beginPath();for(let i=0;i<=w;i+=2){const u=i/w*5-t*1.6,y=cy-f(u);i?x.lineTo(i,y):x.moveTo(i,y)}stroke(x,col,wd,dash)};
    axis(x,[0,cy],[w,cy],st);
    line(u=>A*Math.sin(k1*u),st.dim,.9,[2,3]);line(u=>A*Math.sin(k2*u),st.dim,.9,[2,3]);
    line(u=>A*(Math.sin(k1*u)+Math.sin(k2*u))*.9,st.acc,1.6);
    x.beginPath();for(let i=0;i<=w;i+=3){const u=i/w*5-t*1.6;const e=A*1.8*Math.abs(Math.cos((k2-k1)*u/2));i?x.lineTo(i,cy-e):x.moveTo(i,cy-e)}stroke(x,st.faint,1);
  },
  gears(x,w,h,dt,st,o){
    o.t=(o.t||0)+dt;const t=o.t,a=18,b=27,m=Math.min(w,h*1.3)*.5/((a+b)/2+2),r1=a*m/2,r2=b*m/2,tot=r1+r2,cx1=w/2-tot/2-r2*.0,cx2=cx1+tot,cy=h/2,hh=m*.95,ph=t*.4;
    gearPath(x,cx1,cy,r1,a,ph,hh);x.fillStyle=st.fill;x.fill();stroke(x,st.acc,1.3);
    gearPath(x,cx2,cy,r2,b,PI-PI/b-(a/b)*ph,hh);x.fillStyle=st.fill;x.fill();stroke(x,st.line,1.2);
    const al=20*PI/180;
    const px=cx1+r1,ex=Math.cos(al),ey=Math.sin(al);x.beginPath();x.moveTo(px-ex*r2*.9,cy+ey*r2*.9);x.lineTo(px+ex*r2*.9,cy-ey*r2*.9);stroke(x,st.acc,.9,[5,3]);
    circ(x,cx1,cy,r1);stroke(x,st.faint,.8,[3,4]);circ(x,cx2,cy,r2);stroke(x,st.faint,.8,[3,4]);
    [[cx1,r1],[cx2,r2]].forEach(([px2,r])=>{circ(x,px2,cy,Math.max(r*.2,3));stroke(x,st.dim,.8);pin(x,[px2,cy],2.5,st)});
  }
};
$$('canvas[data-tile]').forEach(c=>{const f=TILES[c.dataset.tile];if(f)stage(c,f,c.dataset.theme==='light'?LIGHT:c.dataset.theme==='orange'?ORANGE:DARK)});

/* hero: standalone mini-lab canvas used in the CTA band */
TM.stage=stage;TM.DARK=DARK;TM.LIGHT=LIGHT;
TM.draw={stroke,circ,bar,pin,ground,label,dashedCircle,axis,gearPath};
requestAnimationFrame(loop);
})();
