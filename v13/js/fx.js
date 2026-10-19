/* v12 effects: progress bar, split headline, pointer parallax, spotlight, magnetic buttons, hero gears, shared gear drawing */
(function(){
'use strict';
const TM=window.TMM=window.TMM||{};
const reduce=matchMedia('(prefers-reduced-motion:reduce)').matches;
const fine=matchMedia('(pointer:fine)').matches;
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];

/* shared: draw a spur gear (pitch radius r, z teeth, rotation rot) */
TM.gear=function(ctx,cx,cy,r,z,rot,o){
  o=o||{};const m=2*r/z,al=2*Math.PI/z,rr=r-1.25*m,ra=r+m;
  ctx.beginPath();
  for(let i=0;i<z;i++){
    const c=rot+i*al,p=[[rr,c-.30*al],[ra,c-.14*al],[ra,c+.14*al],[rr,c+.30*al]];
    for(let k=0;k<4;k++){const x=cx+p[k][0]*Math.cos(p[k][1]),y=cy+p[k][0]*Math.sin(p[k][1]);(i===0&&k===0)?ctx.moveTo(x,y):ctx.lineTo(x,y)}
  }
  ctx.closePath();
  if(o.fill){ctx.fillStyle=o.fill;ctx.fill()}
  ctx.strokeStyle=o.stroke||'#000';ctx.lineWidth=o.lw||1.5;ctx.lineJoin='round';ctx.stroke();
  if(o.hub!==false){
    ctx.beginPath();ctx.arc(cx,cy,Math.max(rr*.2,3),0,7);ctx.stroke();
    ctx.beginPath();ctx.arc(cx,cy,rr*.62,0,7);ctx.globalAlpha=.35;ctx.stroke();ctx.globalAlpha=1;
    ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(cx+rr*.62*Math.cos(rot),cy+rr*.62*Math.sin(rot));ctx.stroke();
  }
};

/* scroll progress */
const bar=document.createElement('div');bar.id='prog';bar.setAttribute('aria-hidden','true');document.body.appendChild(bar);
let sv=0,lastY=scrollY;
function onScroll(){
  const h=document.documentElement.scrollHeight-innerHeight;bar.style.transform='scaleX('+(h>0?scrollY/h:0)+')';
  sv+=Math.abs(scrollY-lastY);lastY=scrollY;
}
addEventListener('scroll',onScroll,{passive:true});onScroll();

/* headline: words rise in */
const h1=$('.hero h1');
if(h1&&!reduce){
  const txt=h1.textContent.trim().split(/\s+/);
  h1.setAttribute('aria-label',h1.textContent.trim());
  h1.innerHTML=txt.map((w,i)=>'<span class="w" aria-hidden="true" style="--i:'+i+'">'+w+'</span>').join(' ');
}

/* pointer parallax on the hero collage + spotlight on tiles + magnetic buttons */
if(fine&&!reduce){
  const hero=$('.hero'),col=$('.collage');
  if(hero&&col)hero.addEventListener('pointermove',e=>{
    const r=hero.getBoundingClientRect();col.style.setProperty('--mx',((e.clientX-r.left)/r.width-.5).toFixed(3));col.style.setProperty('--my',((e.clientY-r.top)/r.height-.5).toFixed(3));
  });
  $$('.au,.ap,.fact').forEach(el=>el.addEventListener('pointermove',e=>{
    const r=el.getBoundingClientRect();el.style.setProperty('--x',(e.clientX-r.left)+'px');el.style.setProperty('--y',(e.clientY-r.top)+'px');
  }));
  $$('.btn.pri,.btn.ghost').forEach(b=>{
    b.addEventListener('pointermove',e=>{const r=b.getBoundingClientRect(),dx=e.clientX-(r.left+r.width/2),dy=e.clientY-(r.top+r.height/2);b.style.transform='translate('+(dx*.18).toFixed(1)+'px,'+(dy*.28).toFixed(1)+'px)'});
    b.addEventListener('pointerleave',()=>{b.style.transform=''});
  });
}

/* hero background: three meshing gears, speed follows scroll */
const hero=$('.hero');
if(hero&&!reduce&&!hero.classList.contains('cine-hero')){
  const c=document.createElement('canvas');c.className='hero-gears';c.setAttribute('aria-hidden','true');hero.insertBefore(c,hero.firstChild);
  const ctx=c.getContext('2d');let w=0,h=0,dpr=1;
  function fit(){const r=hero.getBoundingClientRect();dpr=Math.min(devicePixelRatio||1,2);w=r.width;h=r.height;c.width=w*dpr;c.height=h*dpr;ctx.setTransform(dpr,0,0,1,0,0);ctx.setTransform(dpr,0,0,dpr,0,0)}
  fit();new ResizeObserver(fit).observe(hero);
  let ph=0,vis=true,last=performance.now(),boost=0;
  new IntersectionObserver(e=>{vis=e[0].isIntersecting;if(vis){last=performance.now();requestAnimationFrame(tick)}}).observe(hero);
  const al=(z)=>2*Math.PI/z;
  function child(pc,pr,pz,cz,th){const fp=(th-pr)/al(pz);return th+Math.PI-al(cz)*(.5-fp)}
  function tick(t){
    if(!vis)return;const dt=Math.min((t-last)/1000,.05);last=t;
    boost+=(Math.min(sv,160)/160-boost)*.08;sv*=.8;
    ph+=dt*(.16+boost*2.2);
    ctx.clearRect(0,0,w,h);
    const R=Math.max(w,h)*.19,z1=26,z2=18,z3=34,m=2*R/z1,r2=m*z2/2,r3=m*z3/2;
    // chain: g1 at lower-left, g2 meshes up-right, g3 meshes g1 to the left-up
    const x1=w*.06,y1=h*.92;
    const t12=-.62,x2=x1+(R+r2)*Math.cos(t12),y2=y1+(R+r2)*Math.sin(t12);
    const t13=-2.5,x3=x1+(R+r3)*Math.cos(t13),y3=y1+(R+r3)*Math.sin(t13);
    const p1=ph,p2=child(0,p1,z1,z2,t12),p3=child(0,p1,z1,z3,t13);
    const o={stroke:'rgba(143,227,236,.55)',lw:1.4,fill:'rgba(143,227,236,.05)'};
    TM.gear(ctx,x1,y1,R,z1,p1,o);TM.gear(ctx,x2,y2,r2,z2,p2,o);TM.gear(ctx,x3,y3,r3,z3,p3,o);
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}
})();
