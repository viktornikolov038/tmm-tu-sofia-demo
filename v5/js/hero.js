/* Hero toy: a four-bar linkage you can grab and turn */
(function(){
'use strict';
const TM=window.TMM=window.TMM||{};
const PI=Math.PI,TAU=PI*2;
document.addEventListener('DOMContentLoaded',()=>{
  const cv=document.getElementById('heroCv');if(!cv||!TM.stage)return;
  const D=TM.draw,P={a:1,b:2.7,c:2.1,d:2.9,u:.5,v:.7};
  const curve=[];for(let i=0;i<=360;i++){const S=TM.solve4(P.a,P.b,P.c,P.d,i/360*TAU);curve.push(TM.coupler(S,P.u,P.v))}
  const all=[[0,0],[P.d,0]];for(let i=0;i<360;i++){const S=TM.solve4(P.a,P.b,P.c,P.d,i/360*TAU);all.push(S.A,S.B,TM.coupler(S,P.u,P.v))}
  const bb={x0:Math.min(...all.map(q=>q[0])),x1:Math.max(...all.map(q=>q[0])),y0:Math.min(...all.map(q=>q[1])),y1:Math.max(...all.map(q=>q[1]))};
  let th=.6,dragging=false,idle=0,view=null,hint=document.getElementById('heroHint');
  function tr(w,h){const bw=bb.x1-bb.x0,bh=bb.y1-bb.y0,sc=Math.min(w*.8/bw,h*.74/bh);return{sc,ox:w/2-(bb.x0+bw/2)*sc,oy:h*.52+(bb.y0+bh/2)*sc}}
  const o=TM.stage(cv,(x,w,h,dt,st)=>{
    if(!dragging){idle+=dt;if(idle>1.2&&TM.motion)th+=dt*.55}
    const {sc,ox,oy}=tr(w,h);view={sc,ox,oy};
    const Tp=q=>[ox+q[0]*sc,oy-q[1]*sc];
    const S=TM.solve4(P.a,P.b,P.c,P.d,th),O2=Tp([0,0]),O4=Tp([P.d,0]),A=Tp(S.A),B=Tp(S.B),Pt=Tp(TM.coupler(S,P.u,P.v));
    D.dashedCircle(x,O2[0],O2[1],P.a*sc,st);D.axis(x,[O2[0]-sc*.5,O2[1]],[O4[0]+sc*.5,O4[1]],st);
    x.beginPath();curve.forEach((q,i)=>{const p=Tp(q);i?x.lineTo(p[0],p[1]):x.moveTo(p[0],p[1])});x.closePath();D.stroke(x,st.acc,1.6,[2,5]);
    x.beginPath();x.moveTo(...A);x.lineTo(...Pt);x.lineTo(...B);D.stroke(x,st.dim,1,[3,3]);
    [[O2,A],[A,B],[O4,B]].forEach(([s0,e0],i)=>{D.bar(x,s0,e0,sc*.1);x.fillStyle=i===0?'rgba(36,71,245,.12)':'rgba(255,255,255,.9)';x.fill();D.stroke(x,i===0?st.acc:st.line,i===0?2:1.3)});
    D.ground(x,O2,9,st);D.ground(x,O4,9,st);[O2,O4,A,B].forEach(q=>D.pin(x,q,5.5,st));
    // grab handle on the crank end
    x.beginPath();x.arc(A[0],A[1],dragging?17:13,0,TAU);x.fillStyle=st.acc;x.fill();x.beginPath();x.arc(A[0],A[1],dragging?25:21,0,TAU);D.stroke(x,st.acc,1.2);
    x.beginPath();x.arc(Pt[0],Pt[1],5,0,TAU);x.fillStyle=st.line;x.fill();
    D.label(x,'P',Pt[0]+16,Pt[1]-12,st);
    o.th=th;
  },TM.DARK);
  const ang=e=>{const r=cv.getBoundingClientRect(),px=e.clientX-r.left,py=e.clientY-r.top,Tp=q=>[view.ox+q[0]*view.sc,view.oy-q[1]*view.sc],O=Tp([0,0]);return Math.atan2(-(py-O[1]),px-O[0])};
  const setTh=a=>{th=a;if(TM.solve4(P.a,P.b,P.c,P.d,th)==null)return;idle=0;o.dirty=true;if(hint)hint.classList.add('gone')};
  cv.addEventListener('pointerdown',e=>{dragging=true;cv.setPointerCapture(e.pointerId);setTh(ang(e));cv.classList.add('grab')});
  cv.addEventListener('pointermove',e=>{if(dragging)setTh(ang(e))});
  const end=()=>{dragging=false;cv.classList.remove('grab')};
  cv.addEventListener('pointerup',end);cv.addEventListener('pointercancel',end);
  cv.addEventListener('keydown',e=>{if(e.key==='ArrowRight'||e.key==='ArrowUp'){setTh(th-.12);e.preventDefault()}if(e.key==='ArrowLeft'||e.key==='ArrowDown'){setTh(th+.12);e.preventDefault()}});
});
})();
