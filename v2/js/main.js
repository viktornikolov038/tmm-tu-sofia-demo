(function(){
'use strict';
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const reduce=matchMedia('(prefers-reduced-motion:reduce)').matches;
const dpr=Math.min(window.devicePixelRatio||1,2);
const PI=Math.PI,TAU=PI*2;
const DARK={line:'#efe9dc',dim:'rgba(239,233,220,.32)',faint:'rgba(239,233,220,.12)',acc:'#d3b27c',fill:'rgba(239,233,220,.05)',bg:'#09121f',txt:'rgba(239,233,220,.6)'};
const LIGHT={line:'#121a26',dim:'rgba(18,26,38,.34)',faint:'rgba(18,26,38,.1)',acc:'#a47b3c',fill:'rgba(18,26,38,.035)',bg:'#ebe6d9',txt:'rgba(18,26,38,.55)'};
const MONO="11px 'IBM Plex Mono',monospace";

/* ───────── canvas stage manager ───────── */
const stages=[];let T=0;
function stage(cv,draw,st){
  const o={cv,draw,st,x:cv.getContext('2d'),w:0,h:0,vis:false,mx:0,my:0};
  const rs=()=>{const r=cv.getBoundingClientRect();o.w=r.width;o.h=r.height;cv.width=Math.max(1,r.width*dpr);cv.height=Math.max(1,r.height*dpr);o.x.setTransform(dpr,0,0,dpr,0,0)};
  new ResizeObserver(rs).observe(cv);rs();
  new IntersectionObserver(e=>{o.vis=e[0].isIntersecting}).observe(cv);
  stages.push(o);return o;
}
let last=performance.now();
function loop(now){
  const dt=reduce?0:Math.min((now-last)/1000,.05);last=now;T+=dt;
  for(const o of stages){if(!o.w||!(o.vis||reduce&&!o.drawn))continue;o.drawn=true;o.x.clearRect(0,0,o.w,o.h);o.draw(o.x,o.w,o.h,reduce?2.2:T,dt,o.st,o)}
  requestAnimationFrame(loop);
}

/* ───────── drawing helpers ───────── */
function stroke(x,col,w,dash){x.strokeStyle=col;x.lineWidth=w||1;x.setLineDash(dash||[]);x.stroke();x.setLineDash([])}
function circ(x,cx,cy,r){x.beginPath();x.arc(cx,cy,r,0,TAU)}
function bar(x,p,q,w){
  const a=Math.atan2(q[1]-p[1],q[0]-p[0]);
  x.beginPath();x.arc(p[0],p[1],w,a+PI/2,a+PI*1.5);x.arc(q[0],q[1],w,a-PI/2,a+PI/2);x.closePath();
}
function pin(x,p,r,st){circ(x,p[0],p[1],r);x.fillStyle=st.bg;x.fill();stroke(x,st.line,1.1);circ(x,p[0],p[1],r*.32);x.fillStyle=st.line;x.fill()}
function ground(x,p,s,st){
  x.beginPath();x.moveTo(p[0],p[1]);x.lineTo(p[0]-s,p[1]+s*1.5);x.lineTo(p[0]+s,p[1]+s*1.5);x.closePath();stroke(x,st.line,1);
  x.beginPath();x.moveTo(p[0]-s*1.5,p[1]+s*1.5);x.lineTo(p[0]+s*1.5,p[1]+s*1.5);stroke(x,st.line,1);
  x.beginPath();for(let i=-1.5;i<=1.5;i+=.5){x.moveTo(p[0]+i*s,p[1]+s*1.5);x.lineTo(p[0]+i*s-s*.4,p[1]+s*1.5+s*.5)}stroke(x,st.dim,1);
}
function label(x,t,px,py,st,al){x.font=MONO;x.fillStyle=st.txt;x.textAlign=al||'center';x.fillText(t,px,py)}
function cross(x,px,py,s,col){x.beginPath();x.moveTo(px-s,py);x.lineTo(px+s,py);x.moveTo(px,py-s);x.lineTo(px,py+s);stroke(x,col,.8)}
function dashedCircle(x,cx,cy,r,st){circ(x,cx,cy,r);stroke(x,st.faint.replace(/[\d.]+\)$/,'.28)'),.8,[3,5])}
function gearPath(x,cx,cy,r,z,rot,hh){
  const step=TAU/z;x.beginPath();
  for(let i=0;i<z;i++){const a=rot+i*step;
    [[a-step*.28,r-hh],[a-step*.15,r+hh],[a+step*.15,r+hh],[a+step*.28,r-hh]].forEach((p,k)=>{
      const px=cx+Math.cos(p[0])*p[1],py=cy+Math.sin(p[0])*p[1];(i===0&&k===0)?x.moveTo(px,py):x.lineTo(px,py)});
  }
  x.closePath();
}

/* four-bar kinematics (O2=(0,0), O4=(d,0), y up) */
function solve4(a,b,c,d,th){
  const Ax=a*Math.cos(th),Ay=a*Math.sin(th),dx=d-Ax,dy=-Ay,L=Math.hypot(dx,dy);
  if(L>b+c||L<Math.abs(b-c)||L<1e-9)return null;
  const k=(b*b-c*c+L*L)/(2*L),hh=Math.sqrt(Math.max(b*b-k*k,0)),ux=dx/L,uy=dy/L;
  return{A:[Ax,Ay],B:[Ax+ux*k-uy*hh,Ay+uy*k+ux*hh]};
}
function coupler(S,u,v){const vx=S.B[0]-S.A[0],vy=S.B[1]-S.A[1];return[S.A[0]+vx*u-vy*v,S.A[1]+vy*u+vx*v]}

/* ═════════ HERO ═════════ */
(function(){
  const cv=$('#heroCv');const P={a:1,b:2.7,c:2.15,d:2.9,u:.55,v:.78};
  const curve=[];for(let i=0;i<=360;i++){const S=solve4(P.a,P.b,P.c,P.d,i/360*TAU);if(S)curve.push(coupler(S,P.u,P.v))}
  let mx=0,my=0,tx=0,ty=0;
  addEventListener('mousemove',e=>{tx=e.clientX/innerWidth-.5;ty=e.clientY/innerHeight-.5},{passive:true});
  stage(cv,(x,w,h,t)=>{
    mx+=(tx-mx)*.04;my+=(ty-my)*.04;
    const st=DARK,narrow=w<820;
    const sc=narrow?Math.min(w*.62/5.4,h*.34/4):Math.min(w*.5/5.4,h*.7/4);
    const ox=(narrow?w*.5:w*.62)-1.5*sc-mx*22,oy=(narrow?h*.34:h*.46)+1.2*sc-my*22;
    const Tp=p=>[ox+p[0]*sc,oy-p[1]*sc];
    x.save();x.globalAlpha=narrow?.5:1;
    // construction circles & axes
    const O2=Tp([0,0]),O4=Tp([P.d,0]);
    dashedCircle(x,O2[0],O2[1],P.a*sc,st);dashedCircle(x,O4[0],O4[1],P.c*sc,st);
    x.beginPath();x.moveTo(ox-1.3*sc,oy);x.lineTo(ox+(P.d+1.3)*sc,oy);stroke(x,st.faint,.8,[10,4,2,4]);
    cross(x,O2[0],O2[1],9,st.dim);cross(x,O4[0],O4[1],9,st.dim);
    // coupler curve
    x.beginPath();curve.forEach((p,i)=>{const q=Tp(p);i?x.lineTo(q[0],q[1]):x.moveTo(q[0],q[1])});x.closePath();stroke(x,st.acc,.9,[2,4]);
    const th=t*.55,S=solve4(P.a,P.b,P.c,P.d,th);
    if(S){
      const A=Tp(S.A),B=Tp(S.B),Pt=Tp(coupler(S,P.u,P.v)),w2=Math.max(7,sc*.09);
      // coupler plate
      x.beginPath();x.moveTo(...A);x.lineTo(...Pt);x.lineTo(...B);stroke(x,st.dim,.9,[3,3]);
      [[O2,A],[A,B],[O4,B]].forEach(([p,q])=>{bar(x,p,q,w2);x.fillStyle=st.fill;x.fill();stroke(x,st.line,1)});
      ground(x,O2,10,st);ground(x,O4,10,st);
      pin(x,O2,5.5,st);pin(x,O4,5.5,st);pin(x,A,5.5,st);pin(x,B,5.5,st);
      circ(x,Pt[0],Pt[1],4.5);x.fillStyle=st.acc;x.fill();circ(x,Pt[0],Pt[1],11);stroke(x,st.acc,.8);
      // crank angle arc
      x.beginPath();x.arc(O2[0],O2[1],sc*.52,-th,0);stroke(x,st.acc,.9);
      label(x,'θ₂',O2[0]+sc*.66,O2[1]-8,st);
      label(x,'a',(O2[0]+A[0])/2-12,(O2[1]+A[1])/2-4,st);label(x,'b',(A[0]+B[0])/2,(A[1]+B[1])/2-14,st);label(x,'c',(O4[0]+B[0])/2+14,(O4[1]+B[1])/2,st);
      // dimension d
      const yy=oy+sc*.62;x.beginPath();x.moveTo(O2[0],yy);x.lineTo(O4[0],yy);x.moveTo(O2[0],yy-5);x.lineTo(O2[0],yy+5);x.moveTo(O4[0],yy-5);x.lineTo(O4[0],yy+5);stroke(x,st.dim,.8);
      label(x,'d',(O2[0]+O4[0])/2,yy-8,st);
      label(x,'P',Pt[0]+18,Pt[1]-14,st);
    }
    // ruler along right edge
    if(!narrow){x.beginPath();const rx=w-40;for(let i=0;i<=40;i++){const y=h*.12+i*(h*.76/40);x.moveTo(rx,y);x.lineTo(rx-(i%5?5:11),y)}stroke(x,st.faint.replace(/[\d.]+\)$/,'.35)'),.8)}
    x.restore();
  },DARK);
})();

/* ═════════ ATLAS PLATES ═════════ */
const plates={
  fourbar(x,w,h,t,st,o){
    const P={a:1,b:2.7,c:2.1,d:2.9,u:.5,v:.7};
    if(!o.curve){o.curve=[];for(let i=0;i<=240;i++){const S=solve4(P.a,P.b,P.c,P.d,i/240*TAU);o.curve.push(coupler(S,P.u,P.v))}}
    const sc=Math.min(w/5.8,h/4.1)*.92,ox=w/2-1.5*sc,oy=h/2+1.25*sc,Tp=p=>[ox+p[0]*sc,oy-p[1]*sc];
    const th=t*.9,S=solve4(P.a,P.b,P.c,P.d,th),O2=Tp([0,0]),O4=Tp([P.d,0]),A=Tp(S.A),B=Tp(S.B),Pt=Tp(coupler(S,P.u,P.v)),w2=sc*.1;
    x.beginPath();o.curve.forEach((p,i)=>{const q=Tp(p);i?x.lineTo(q[0],q[1]):x.moveTo(q[0],q[1])});x.closePath();stroke(x,st.acc,.9,[2,3]);
    x.beginPath();x.moveTo(...A);x.lineTo(...Pt);x.lineTo(...B);stroke(x,st.dim,.8,[3,3]);
    [[O2,A],[A,B],[O4,B]].forEach(([p,q])=>{bar(x,p,q,w2);x.fillStyle=st.fill;x.fill();stroke(x,st.line,1)});
    ground(x,O2,8,st);ground(x,O4,8,st);[O2,O4,A,B].forEach(p=>pin(x,p,4.5,st));
    circ(x,Pt[0],Pt[1],3.6);x.fillStyle=st.acc;x.fill();circ(x,Pt[0],Pt[1],8);stroke(x,st.acc,.8);
    label(x,'a',(O2[0]+A[0])/2-10,(O2[1]+A[1])/2,st);label(x,'b',(A[0]+B[0])/2,(A[1]+B[1])/2-11,st);label(x,'c',(O4[0]+B[0])/2+11,(O4[1]+B[1])/2,st);
  },
  slider(x,w,h,t,st){
    const r=1,l=3.2,sc=Math.min(w/7.4,h/3.6)*.92,ox=w/2-1.9*sc,oy=h/2,Tp=p=>[ox+p[0]*sc,oy-p[1]*sc];
    const th=t*1.1,A=[r*Math.cos(th),r*Math.sin(th)],xp=A[0]+Math.sqrt(l*l-A[1]*A[1]),Pp=[xp,0];
    const O=Tp([0,0]),a=Tp(A),p=Tp(Pp);
    // cylinder
    x.beginPath();x.moveTo(...Tp([1.9,.68]));x.lineTo(...Tp([5.1,.68]));x.moveTo(...Tp([1.9,-.68]));x.lineTo(...Tp([5.1,-.68]));stroke(x,st.line,1.2);
    x.beginPath();x.moveTo(...Tp([5.1,.68]));x.lineTo(...Tp([5.1,-.68]));stroke(x,st.line,1.2);
    for(let i=0;i<14;i++){const gx=1.9+i*.23;x.beginPath();x.moveTo(...Tp([gx,.68]));x.lineTo(...Tp([gx-.12,.68+.16]));stroke(x,st.dim,.7);x.beginPath();x.moveTo(...Tp([gx,-.68]));x.lineTo(...Tp([gx-.12,-.68-.16]));stroke(x,st.dim,.7)}
    // axis
    x.beginPath();x.moveTo(...Tp([-1.4,0]));x.lineTo(...Tp([5.4,0]));stroke(x,st.faint,.8,[10,4,2,4]);
    // path of crank pin
    dashedCircle(x,O[0],O[1],r*sc,st);
    // piston
    const pw=.46,ph=.56,pr=[Tp([xp-pw,ph]),Tp([xp+pw,-ph])];
    x.beginPath();x.rect(pr[0][0],pr[0][1],pr[1][0]-pr[0][0],pr[1][1]-pr[0][1]);x.fillStyle=st.fill;x.fill();stroke(x,st.line,1.2);
    x.beginPath();[.3,.4].forEach(k=>{x.moveTo(...Tp([xp+pw*(k===.3?.55:.8),ph]));x.lineTo(...Tp([xp+pw*(k===.3?.55:.8),-ph]))});stroke(x,st.dim,.8);
    bar(x,a,p,sc*.09);x.fillStyle=st.fill;x.fill();stroke(x,st.line,1);
    bar(x,O,a,sc*.11);x.fillStyle=st.fill;x.fill();stroke(x,st.line,1);
    pin(x,O,5,st);pin(x,a,4.5,st);pin(x,p,4.5,st);
    // stroke marks
    const s0=Tp([l-r,-.95]),s1=Tp([l+r,-.95]);x.beginPath();x.moveTo(s0[0],s0[1]);x.lineTo(s1[0],s1[1]);x.moveTo(s0[0],s0[1]-5);x.lineTo(s0[0],s0[1]+5);x.moveTo(s1[0],s1[1]-5);x.lineTo(s1[0],s1[1]+5);stroke(x,st.acc,.9);
    label(x,'ход = 2r',(s0[0]+s1[0])/2,s0[1]+16,st);
    ground(x,O,8,st);
  },
  geneva(x,w,h,t,st){
    const n=4,C=1,r=Math.sin(PI/n),sc=Math.min(w/3.3,h/2.7)*.92,ox=w/2-.45*sc,oy=h/2,Tp=p=>[ox+p[0]*sc,oy-p[1]*sc];
    const tot=t*.9,m=Math.floor((tot+PI/n)/TAU),thp=tot-m*TAU;
    const psi=a=>Math.atan2(r*Math.sin(a),r*Math.cos(a)-C);
    let rot;if(thp<PI/n)rot=-m*PI/2+(psi(thp)-psi(-PI/n));else rot=-m*PI/2-PI/2;
    // normalise start orientation: slots at 225deg+rot+j*90
    const D=Tp([C,0]),Oo=Tp([0,0]);
    // driven body
    const rc=.6,Rb=.92;x.beginPath();
    const rest=225*PI/180;
    for(let k=0;k<=360;k++){
      const ps=k/360*TAU;let rho=Rb;
      for(let j=0;j<4;j++){
        const ca=rot+j*PI/2+PI;// cutout directions in world frame (driver is at angle PI when rot=0)
        const cx_=C*Math.cos(ca),cy_=C*Math.sin(ca),pr=cx_*Math.cos(ps)+cy_*Math.sin(ps),pe=-cx_*Math.sin(ps)+cy_*Math.cos(ps);
        if(Math.abs(pe)<rc&&pr>0){rho=Math.min(rho,pr-Math.sqrt(rc*rc-pe*pe))}
      }
      const px=Math.cos(ps)*rho,py=Math.sin(ps)*rho,q=[D[0]+px*sc,D[1]-py*sc];k?x.lineTo(q[0],q[1]):x.moveTo(q[0],q[1]);
    }
    x.closePath();x.fillStyle=st.fill;x.fill();stroke(x,st.line,1.2);
    // slots
    for(let j=0;j<4;j++){
      const ang=rest+rot+j*PI/2,u=[Math.cos(ang),Math.sin(ang)];
      const p0=[D[0]+(C-r)*u[0]*sc,D[1]-(C-r)*u[1]*sc],p1=[D[0]+.78*u[0]*sc,D[1]-.78*u[1]*sc];
      bar(x,p0,p1,.068*sc);stroke(x,st.line,1);
    }
    pin(x,D,5,st);
    // driver: locking disc with relief + arm + pin
    const rd=.56,Pp=[r*Math.cos(tot),r*Math.sin(tot)],pp=Tp(Pp);
    x.beginPath();x.arc(Oo[0],Oo[1],rd*sc,tot+.95,tot+TAU-.95);stroke(x,st.line,1.2);
    bar(x,Oo,pp,sc*.075);x.fillStyle=st.fill;x.fill();stroke(x,st.line,1);
    circ(x,pp[0],pp[1],sc*.045);x.fillStyle=st.acc;x.fill();
    dashedCircle(x,Oo[0],Oo[1],r*sc,st);
    pin(x,Oo,5,st);
    label(x,'z = 4',D[0],D[1]+Rb*sc+20,st);
  },
  cam(x,w,h,t,st){
    const al=t*.7,r0=Math.min(w*.18,h*.22),hl=r0*.62,cx=w*.32,cy=h*.64;
    const S=f=>{f=((f%TAU)+TAU)%TAU;const k=TAU/3;if(f<k)return(1-Math.cos(PI*f/k))/2;if(f<PI)return 1;if(f<PI+k)return(1+Math.cos(PI*(f-PI)/k))/2;return 0};
    const R=f=>r0+hl*S(f);
    // cam
    x.beginPath();for(let k=0;k<=240;k++){const f=k/240*TAU,rho=R(f),ang=f+al,px=cx+rho*Math.cos(ang),py=cy-rho*Math.sin(ang);k?x.lineTo(px,py):x.moveTo(px,py)}x.closePath();x.fillStyle=st.fill;x.fill();stroke(x,st.line,1.2);
    dashedCircle(x,cx,cy,r0,st);
    circ(x,cx,cy,r0*.22);stroke(x,st.line,1);pin(x,[cx,cy],4,st);
    // spokes
    for(let i=0;i<5;i++){const a=al+i*TAU/5+.4;x.beginPath();x.moveTo(cx+Math.cos(a)*r0*.3,cy-Math.sin(a)*r0*.3);x.lineTo(cx+Math.cos(a)*r0*.62,cy-Math.sin(a)*r0*.62);stroke(x,st.dim,.8)}
    // follower
    const s=R(PI/2-al),top=cy-s;
    x.beginPath();x.moveTo(cx,top);x.lineTo(cx-7,top-12);x.lineTo(cx+7,top-12);x.closePath();x.fillStyle=st.acc;x.fill();
    x.beginPath();x.rect(cx-5,top-h*.34,10,h*.34-12);x.fillStyle=st.fill;x.fill();stroke(x,st.line,1.1);
    // guide
    const gy=cy-r0-hl-h*.1;x.beginPath();x.rect(cx-16,gy-34,32,24);stroke(x,st.line,1.1);x.beginPath();x.moveTo(cx-16,gy-10);x.lineTo(cx+16,gy-10);stroke(x,st.dim,1);
    x.beginPath();x.moveTo(cx-34,cy-r0-hl-h*.1-10);x.lineTo(cx+34,cy-r0-hl-h*.1-10);stroke(x,st.dim,.8);
    x.beginPath();x.moveTo(cx,cy-r0-hl-6);x.lineTo(cx,cy-r0-hl-h*.46);stroke(x,st.faint,.8,[6,4]);
    // s–φ diagram
    const gx=w*.62,gw=w*.32,gh=h*.38,gyb=h*.62;
    x.beginPath();x.moveTo(gx,gyb-gh-12);x.lineTo(gx,gyb);x.lineTo(gx+gw+8,gyb);stroke(x,st.line,1);
    x.beginPath();for(let k=0;k<=120;k++){const a=k/120*TAU,sv=S(PI/2-a),px=gx+a/TAU*gw,py=gyb-sv*gh;k?x.lineTo(px,py):x.moveTo(px,py)}stroke(x,st.acc,1.1);
    const am=((al%TAU)+TAU)%TAU,sv=S(PI/2-am),dx=gx+am/TAU*gw,dy=gyb-sv*gh;
    x.beginPath();x.moveTo(dx,gyb);x.lineTo(dx,dy);x.lineTo(gx,dy);stroke(x,st.dim,.8,[3,3]);circ(x,dx,dy,4);x.fillStyle=st.acc;x.fill();
    label(x,'s',gx-10,gyb-gh-8,st);label(x,'φ',gx+gw+14,gyb+4,st);label(x,'закон на движение',gx+gw/2,gyb+22,st);
  },
  planet(x,w,h,t,st){
    const zs=18,zp=12,zr=42,m=Math.min(w,h)*.43*2/zr/1.06,hh=m*.95;
    const cx=w/2,cy=h/2,fc=t*.32;
    const fp=fc*(1-zr/zp),fs=fc*(1+zr/zs)+PI*(zp-1)/zs,fr=-PI/zr;
    const Rr=zr*m/2;
    // ring
    circ(x,cx,cy,Rr+hh+m*2.2);x.fillStyle=st.fill;x.fill();stroke(x,st.line,1.1);
    gearPath(x,cx,cy,Rr,zr,fr,-hh);stroke(x,st.line,1.1);
    // carrier arms
    const rc=(zs+zp)*m/2;
    for(let k=0;k<3;k++){const a=fc+k*TAU/3;x.beginPath();x.moveTo(cx,cy);x.lineTo(cx+rc*Math.cos(a),cy-rc*Math.sin(a));stroke(x,st.dim,.9,[4,3])}
    // sun
    gearPath(x,cx,cy,zs*m/2,zs,-fs,hh);x.fillStyle=st.fill;x.fill();stroke(x,st.acc,1.2);
    circ(x,cx,cy,zs*m/2*.35);stroke(x,st.dim,.8);pin(x,[cx,cy],3.5,st);
    // planets
    for(let k=0;k<3;k++){const a=fc+k*TAU/3,px=cx+rc*Math.cos(a),py=cy-rc*Math.sin(a);
      gearPath(x,px,py,zp*m/2,zp,-fp,hh);x.fillStyle=st.fill;x.fill();stroke(x,st.line,1.1);
      circ(x,px,py,zp*m/2*.38);stroke(x,st.dim,.8);pin(x,[px,py],3,st)}
    label(x,'z₁=18 · z₂=12 · z₃=42',cx,h-6,st);
  },
  yoke(x,w,h,t,st){
    const r=1,sc=Math.min(w/6.4,h/3.6)*.92,ox=w/2-1.6*sc,oy=h/2,Tp=p=>[ox+p[0]*sc,oy-p[1]*sc];
    const th=t*1.1,px=r*Math.cos(th),py=r*Math.sin(th),O=Tp([0,0]),Pp=Tp([px,py]);
    dashedCircle(x,O[0],O[1],r*sc,st);
    x.beginPath();x.moveTo(...Tp([-1.6,0]));x.lineTo(...Tp([4.6,0]));stroke(x,st.faint,.8,[10,4,2,4]);
    // yoke frame
    const yw=.2,yh=1.45;
    x.beginPath();x.rect(...Tp([px-.42,yh+.15]),.84*sc,(yh+.15)*2*sc);x.fillStyle=st.fill;x.fill();stroke(x,st.line,1.2);
    // slot
    x.beginPath();const a_=Tp([px-yw/2,yh-.2]),b_=Tp([px+yw/2,-yh+.2]);x.rect(a_[0],a_[1],b_[0]-a_[0],b_[1]-a_[1]);x.fillStyle=st.bg;x.fill();stroke(x,st.line,1);
    // rod
    const r0=Tp([px+.42,.14]),r1=Tp([3.6,-.14]);x.beginPath();x.rect(r0[0],r0[1],r1[0]-r0[0],r1[1]-r0[1]);x.fillStyle=st.fill;x.fill();stroke(x,st.line,1.1);
    // guides
    [[2.15],[3.05]].forEach(([gx])=>{const g0=Tp([gx-.14,.6]),g1=Tp([gx+.14,-.6]);x.beginPath();x.rect(g0[0],g0[1],g1[0]-g0[0],g1[1]-g0[1]);stroke(x,st.dim,1)});
    // crank
    bar(x,O,Pp,sc*.1);x.fillStyle=st.fill;x.fill();stroke(x,st.line,1);
    pin(x,O,5,st);circ(x,Pp[0],Pp[1],5.5);x.fillStyle=st.acc;x.fill();
    // displacement marks
    const m0=Tp([-1,-1.7]),m1=Tp([1,-1.7]);x.beginPath();x.moveTo(m0[0],m0[1]);x.lineTo(m1[0],m1[1]);x.moveTo(m0[0],m0[1]-5);x.lineTo(m0[0],m0[1]+5);x.moveTo(m1[0],m1[1]-5);x.lineTo(m1[0],m1[1]+5);stroke(x,st.dim,.8);
    const mk=Tp([px,-1.7]);circ(x,mk[0],mk[1],3);x.fillStyle=st.acc;x.fill();
    label(x,'x = r·cos θ',Tp([0,-1.7])[0],m0[1]+17,st);
    ground(x,O,8,st);
  }
};
$$('.plate').forEach(pl=>{
  const fn=plates[pl.dataset.plate],cv=pl.querySelector('canvas');
  if(fn&&cv)stage(cv,(x,w,h,t,dt,st,o)=>fn(x,w,h,t,st,o),LIGHT);
});

/* ═════════ LAB ═════════ */
(function(){
  const cv=$('#labCv'),g=id=>document.getElementById(id);
  const ids=['a','b','c','d','s'];
  const out=()=>ids.forEach(k=>g('o'+k).textContent=g('r'+k).value+(k==='s'?'%':''));
  let trace=[];ids.forEach(k=>g('r'+k).addEventListener('input',()=>{out();trace=[]}));out();
  let th=0,dir=1,blocked=false;
  function grashof(a,b,c,d){const s=[a,b,c,d].sort((p,q)=>p-q);
    return s[0]+s[3]<=s[1]+s[2]?'Условие на Грасхоф: изпълнено — възможно е пълно въртене на звено':'Условие на Грасхоф: неизпълнено — само люлеещи се звена'}
  stage(cv,(x,w,h,t,dt)=>{
    const st=DARK,a=+g('ra').value,b=+g('rb').value,c=+g('rc').value,d=+g('rd').value,sp=+g('rs').value/100;
    const gn=g('grashof'),txt=grashof(a,b,c,d);gn.textContent=txt;gn.classList.toggle('bad',txt.includes('неизпълнено'));
    if(sp>0){const nt=th+dir*dt*1.6*sp;if(solve4(a,b,c,d,nt)){th=nt;blocked=false}else{dir*=-1;blocked=true}}
    const S=solve4(a,b,c,d,th)||solve4(a,b,c,d,th-dir*.03);if(!S)return;
    const ext=Math.max(a+b*.7,c+b*.35,b*.8);
    const sc=Math.min(w*.78/(d+Math.max(a,c)*1.4),h*.64/ext),ox=w/2-d*sc/2,oy=h*.76,Tp=p=>[ox+p[0]*sc,oy-p[1]*sc];
    const O2=Tp([0,0]),O4=Tp([d,0]),A=Tp(S.A),B=Tp(S.B),Pt=Tp(coupler(S,.5,.55)),w2=Math.max(6,sc*6);
    if(sp>0){trace.push(Pt);if(trace.length>520)trace.shift()}
    for(let i=1;i<trace.length;i++){x.beginPath();x.moveTo(...trace[i-1]);x.lineTo(...trace[i]);x.strokeStyle=`rgba(211,178,124,${i/trace.length})`;x.lineWidth=1.2;x.stroke()}
    dashedCircle(x,O2[0],O2[1],a*sc,st);
    x.beginPath();x.moveTo(O2[0],O2[1]);x.lineTo(O4[0],O4[1]);stroke(x,st.faint.replace(/[\d.]+\)$/,'.3)'),.8,[10,4,2,4]);
    x.beginPath();x.moveTo(...A);x.lineTo(...Pt);x.lineTo(...B);stroke(x,st.dim,.9,[3,3]);
    [[O2,A],[A,B],[O4,B]].forEach(([p,q])=>{bar(x,p,q,w2);x.fillStyle=st.fill;x.fill();stroke(x,st.line,1)});
    ground(x,O2,9,st);ground(x,O4,9,st);[O2,O4,A,B].forEach(p=>pin(x,p,5,st));
    circ(x,Pt[0],Pt[1],4);x.fillStyle=st.acc;x.fill();circ(x,Pt[0],Pt[1],10);stroke(x,st.acc,.8);
    label(x,'a',(O2[0]+A[0])/2-12,(O2[1]+A[1])/2,st);label(x,'b',(A[0]+B[0])/2,(A[1]+B[1])/2-14,st);label(x,'c',(O4[0]+B[0])/2+12,(O4[1]+B[1])/2,st);label(x,'d',(O2[0]+O4[0])/2,O2[1]+30,st);
    g('readout').textContent=`θ₂ = ${(((th*180/PI)%360)+360)%360|0}° · a:b:c:d = ${a}:${b}:${c}:${d}${blocked?' · краен ход':''}`;
  },DARK);
  // gear pair
  const gc=$('#gearCv'),z1=g('z1'),z2=g('z2');
  const upd=()=>{g('oz1').textContent=z1.value;g('oz2').textContent=z2.value;const u=z2.value/z1.value;g('ratio').textContent=`u = z₂/z₁ = ${u.toFixed(2).replace('.',',')} · ${u>1?'редуциране на скоростта':u<1?'мултипликиране':'без промяна'}`};
  z1.oninput=z2.oninput=upd;upd();
  stage(gc,(x,w,h,t)=>{
    const st=DARK,a=+z1.value,b=+z2.value,sp=+g('rs').value/100,ph=t*.9*sp;
    const m=Math.min(h*.8/Math.max(a,b)*1,(w*.9)/((a+b)/2+4)),r1=a*m/2,r2=b*m/2,tot=r1+r2,cx1=w/2-tot/2,cx2=cx1+tot,cy=h/2,hh=m*.9;
    // mesh phase along line of centres (angle 0 from gear1, PI from gear2)
    const f2=PI-PI/b+(a/b)*(0-(ph))*1;
    gearPath(x,cx1,cy,r1,a,ph,hh);x.fillStyle=st.fill;x.fill();stroke(x,st.acc,1.1);
    gearPath(x,cx2,cy,r2,b,PI-PI/b-(a/b)*ph+PI/b*0,hh);x.fillStyle=st.fill;x.fill();stroke(x,st.line,1.1);
    [[cx1,r1],[cx2,r2]].forEach(([px,r])=>{circ(x,px,cy,Math.max(r*.2,3));stroke(x,st.dim,.8);pin(x,[px,cy],2.5,st)});
  },DARK);
})();

/* ═════════ TEXT / SCROLL BEHAVIOUR ═════════ */
// statement word highlight
(function(){
  const el=$('#stmt');if(!el)return;
  const words=el.textContent.trim().split(/\s+/);el.innerHTML=words.map(w=>`<span class="w">${w}</span>`).join(' ');
  const ws=$$('#stmt .w');
  const upd=()=>{const r=el.getBoundingClientRect(),p=(innerHeight*.82-r.top)/(r.height+innerHeight*.28);const n=Math.round(Math.max(0,Math.min(1,p))*ws.length);ws.forEach((w,i)=>w.classList.toggle('on',i<n))};
  addEventListener('scroll',upd,{passive:true});upd();
})();
// reveal
$$('.rv').forEach(el=>{const k=[...el.parentElement.children].indexOf(el);el.style.setProperty('--d',(k%4*.09)+'s')});
const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}}),{threshold:.12,rootMargin:'0px 0px -6% 0px'});
$$('.rv').forEach(el=>io.observe(el));
// nav / progress / current section
const nav=$('#nav'),prog=$('#progress');
addEventListener('scroll',()=>{const m=document.documentElement.scrollHeight-innerHeight;prog.style.width=(scrollY/m*100)+'%'},{passive:true});
const burger=$('#burger');
burger.onclick=()=>{const o=nav.classList.toggle('open');burger.setAttribute('aria-expanded',o)};
$$('#menu a').forEach(a=>a.addEventListener('click',()=>{nav.classList.remove('open');burger.setAttribute('aria-expanded',false)}));
const wn=$('#whereN'),wt=$('#whereT');
const sio=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting&&e.target.dataset.n){wn.textContent=e.target.dataset.n;wt.textContent=e.target.dataset.t}}),{rootMargin:'-45% 0px -50% 0px'});
$$('section[data-n]').forEach(s=>sio.observe(s));
$('#yr').textContent=new Date().getFullYear();

// band video: load & play only when visible
(function(){
  const v=$('#bandVideo');if(!v||reduce)return;
  new IntersectionObserver(e=>{
    if(e[0].isIntersecting){if(!v.src){v.src='assets/video/hero.mp4'}v.play().catch(()=>{})}else v.pause();
  },{threshold:.15}).observe(v);
})();

// loader
function ready(){document.body.classList.remove('is-loading')}
const minWait=new Promise(r=>setTimeout(r,reduce?0:1500));
Promise.all([minWait,document.fonts?document.fonts.ready:Promise.resolve()]).then(ready);
setTimeout(ready,4000);
requestAnimationFrame(loop);
})();
