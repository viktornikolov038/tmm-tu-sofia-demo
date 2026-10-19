/* v13 cinematic behaviour: video control, scroll story, drag gallery, light follow */
(function(){
'use strict';
const $=(s,r)=>(r||document).querySelector(s),$$=(s,r)=>[...(r||document).querySelectorAll(s)];
const reduce=matchMedia('(prefers-reduced-motion:reduce)').matches;

/* videos play only while visible; reduced motion keeps the poster */
const vids=$$('video[data-v]');
if(vids.length){
  const io=new IntersectionObserver(es=>es.forEach(e=>{
    const v=e.target;
    if(reduce){v.pause();return}
    if(e.isIntersecting){const p=v.play();if(p&&p.catch)p.catch(()=>{})}else v.pause();
  }),{threshold:.15});
  vids.forEach(v=>{v.muted=true;v.setAttribute('playsinline','');if(!v.closest('.sm'))io.observe(v)});
}

/* hero: slow parallax of the video and fading of the text on scroll */
const hero=$('.hero.cine-hero');
if(hero&&!reduce){
  const hv=$('.hero-v',hero),ht=$('.hero-in',hero);
  let tick=false;
  addEventListener('scroll',()=>{
    if(tick)return;tick=true;requestAnimationFrame(()=>{
      tick=false;const y=Math.min(scrollY,innerHeight*1.2),p=y/innerHeight;
      if(hv)hv.style.transform='translate3d(0,'+(y*.25)+'px,0) scale('+(1+p*.06)+')';
      if(ht){ht.style.transform='translate3d(0,'+(y*-.12)+'px,0)';ht.style.opacity=Math.max(0,1-p*1.25)}
    });
  },{passive:true});
}

/* scroll story: the sticky stage follows the step nearest to the viewport centre */
const TM=window.TMM||{};
const WARM={line:'#f3e3bd',dim:'rgba(243,227,189,.5)',faint:'rgba(243,227,189,.13)',acc:'#e0a43a',fill:'rgba(224,166,58,.09)',bg:'#0b1730',txt:'rgba(243,227,189,.8)'};
function mechCanvases(){
  if(!TM.MECH||!TM.stage)return;
  $$('canvas[data-mech]').forEach(c=>{
    const M=TM.MECH[c.dataset.mech];if(!M)return;
    const P={};M.controls.forEach(k=>P[k.k]=k.v);let phase=0,o;
    o=TM.stage(c,(x,w,h,dt,st)=>{phase+=dt*.55;M.draw(x,w,h,phase,st,P,o)},WARM);
    o.cache={};
  });
}
const story=$('.story');
if(story){
  const steps=$$('.story-step',story),media=$$('.sm',story),dots=$$('.story-dots i',story);
  let cur=-1;
  function set(i){
    if(i===cur)return;cur=i;
    steps.forEach((s,k)=>s.classList.toggle('on',k===i));
    media.forEach((m,k)=>m.classList.toggle('on',k===i));
    dots.forEach((d,k)=>d.classList.toggle('on',k===i));
    story.style.setProperty('--i',i);
  }
  const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting)set(steps.indexOf(e.target))}),{rootMargin:'-42% 0px -42% 0px'});
  steps.forEach(s=>io.observe(s));
  set(0);
  mechCanvases();
}

/* gallery: drag to scroll, wheel stays vertical */
$$('.gal').forEach(g=>{
  let down=false,sx=0,sl=0,moved=false;
  g.addEventListener('pointerdown',e=>{if(e.pointerType==='touch')return;down=true;moved=false;sx=e.clientX;sl=g.scrollLeft;g.classList.add('drag')});
  addEventListener('pointermove',e=>{if(!down)return;const dx=e.clientX-sx;if(Math.abs(dx)>4)moved=true;g.scrollLeft=sl-dx});
  addEventListener('pointerup',()=>{down=false;g.classList.remove('drag')});
  g.addEventListener('click',e=>{if(moved){e.preventDefault();moved=false}},true);
  const prev=g.parentElement.querySelector('[data-gal=prev]'),next=g.parentElement.querySelector('[data-gal=next]');
  const by=d=>g.scrollBy({left:d*Math.min(420,g.clientWidth*.8),behavior:reduce?'auto':'smooth'});
  if(prev)prev.addEventListener('click',()=>by(-1));if(next)next.addEventListener('click',()=>by(1));
});

/* light that follows the pointer on dark sections */
if(matchMedia('(pointer:fine)').matches&&!reduce){
  $$('.glow').forEach(s=>s.addEventListener('pointermove',e=>{const r=s.getBoundingClientRect();s.style.setProperty('--gx',(e.clientX-r.left)+'px');s.style.setProperty('--gy',(e.clientY-r.top)+'px')}));
}
})();
