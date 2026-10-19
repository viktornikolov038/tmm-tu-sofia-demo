(function(){
'use strict';
const TM=window.TMM=window.TMM||{};
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const reduce=matchMedia('(prefers-reduced-motion:reduce)').matches;
const fine=matchMedia('(hover:hover) and (pointer:fine)').matches;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
TM.lang='bg';TM.onLang=TM.onLang||[];

/* ───────── loader ───────── */
const bar=$('#ldbar'),num=$('#ldnum');let t0=performance.now();
(function tick(now){const p=Math.min(1,(now-t0)/1500);bar.style.width=(p*100)+'%';num.textContent=String(Math.round(p*100)).padStart(3,'0');if(p<1&&document.body.classList.contains('is-loading'))requestAnimationFrame(tick)})(t0);
const wait=new Promise(r=>setTimeout(r,reduce?0:1500));
const loaded=document.readyState==='complete'?Promise.resolve():new Promise(r=>addEventListener('load',r,{once:true}));
const ready=()=>document.body.classList.remove('is-loading');
Promise.all([wait,loaded,document.fonts?document.fonts.ready:Promise.resolve()]).then(ready);
setTimeout(ready,6000);

/* ───────── smooth scroll ───────── */
let lenis=null;
if(window.Lenis&&!reduce){
  lenis=new Lenis({duration:1.2,easing:t=>Math.min(1,1.001-Math.pow(2,-10*t)),smoothWheel:true});
  const raf=t=>{lenis.raf(t);requestAnimationFrame(raf)};requestAnimationFrame(raf);
  document.documentElement.classList.add('lenis');
}
TM.lenisRef=()=>lenis;
const go=el=>lenis?lenis.scrollTo(el,{offset:el.id==='hero'?0:-1,duration:1.8}):el.scrollIntoView({behavior:'smooth'});
$$('a[href^="#"]').forEach(a=>a.addEventListener('click',e=>{const id=a.getAttribute('href');if(id.length<2)return;const el=$(id);if(!el)return;e.preventDefault();document.body.classList.remove('menu-open');document.body.style.overflow='';go(el)}));

/* ───────── menu ───────── */
const mb=$('#menuBtn');
mb.onclick=()=>{const o=document.body.classList.toggle('menu-open');mb.setAttribute('aria-expanded',o);document.body.style.overflow=o?'hidden':'';lenis&&(o?lenis.stop():lenis.start())};
addEventListener('keydown',e=>{if(e.key==='Escape'&&document.body.classList.contains('menu-open'))mb.click()});
$('#yr').textContent=new Date().getFullYear();

/* ───────── language ───────── */
const langEls=$$('[data-en]');
langEls.forEach(el=>{el._bg=el.tagName==='TITLE'?el.textContent:el.innerHTML});
function setLang(l){
  TM.lang=l;document.documentElement.lang=l==='en'?'en':'bg';
  langEls.forEach(el=>{const v=l==='en'?el.getAttribute('data-en'):el._bg;if(el.tagName==='TITLE')document.title=v;else el.innerHTML=v});
  $$('.lang button').forEach(b=>b.classList.toggle('on',b.dataset.lang===l));
  TM.onLang.forEach(f=>f());
  try{localStorage.setItem('tmm-lang',l)}catch(e){}
}
$$('.lang button').forEach(b=>b.addEventListener('click',()=>setLang(b.dataset.lang)));
try{if(localStorage.getItem('tmm-lang')==='en')setLang('en')}catch(e){}

/* ───────── reveal + counters ───────── */
$$('.rv').forEach(el=>{const k=[...el.parentElement.children].indexOf(el);el.style.setProperty('--d',(k%5*.09)+'s')});
function count(b){
  const to=+b.dataset.count,from=+(b.dataset.from||0),suf=b.dataset.suffix||'';
  if(reduce){b.textContent=to+suf;return}
  const t=performance.now(),Dm=2000;(function f(n){const p=Math.min((n-t)/Dm,1),e=1-Math.pow(1-p,4);b.textContent=Math.round(from+(to-from)*e)+(p===1?suf:'');if(p<1)requestAnimationFrame(f)})(t);
}
const io=new IntersectionObserver(es=>es.forEach(e=>{
  if(!e.isIntersecting)return;e.target.classList.add('in');io.unobserve(e.target);
  const b=e.target.querySelector('[data-count]');if(b)count(b);
}),{threshold:.14,rootMargin:'0px 0px -6% 0px'});
$$('.rv').forEach(el=>io.observe(el));

/* ───────── hero: timecode, video, parallax ───────── */
const hero=$('#hero'),heroMedia=$('.hero-media'),hv=$('#heroVideo'),tc=$('#tc');
fetch('assets/v4/hero.mp4',{method:'HEAD'}).then(r=>{if(r.ok&&!reduce){hv.src='assets/v4/hero.mp4';hv.play().then(()=>hv.classList.add('on')).catch(()=>{})}}).catch(()=>{});
const tcStart=performance.now();
setInterval(()=>{const s=(performance.now()-tcStart)/1000,f=Math.floor((s%1)*24),sec=Math.floor(s)%60,m=Math.floor(s/60)%60,h=Math.floor(s/3600);
  tc.textContent=[h,m,sec,f].map(v=>String(v).padStart(2,'0')).join(':')},83);

/* ───────── scenes (chapters) ───────── */
const scenes=TM.scenes?TM.scenes():[];
const bgs=$$('.chap .bg');
/* ───────── horizontal research ───────── */
const hs=$('#research'),track=$('#hsTrack'),hsBar=$('#hsBar');
/* ───────── education steps ───────── */
const stepsEl=$('#steps'),stepLis=stepsEl?[...stepsEl.children]:[];
const where=$('#whereT');
const secs=$$('[data-t],.hero,.chap');

function frame(){
  const vh=innerHeight,y=scrollY;
  document.getElementById('progress').style.width=(y/(document.documentElement.scrollHeight-vh)*100)+'%';
  // hero
  const hp=clamp(y/vh,0,1);heroMedia.style.transform='translateY('+(hp*12)+'%) scale('+(1+hp*.12)+')';heroMedia.style.opacity=1-hp*.9;
  // chapters
  $$('.chap').forEach((sec,i)=>{
    const r=sec.getBoundingClientRect(),total=r.height-vh,p=clamp(-r.top/total,0,1),o=scenes[i];
    const vis=r.top<vh&&r.bottom>0;
    if(o){o.p=p}
    if(vis){
      const s=1.14-p*.1;bgs[i].style.transform='scale('+s+') translateY('+((p-.5)*-4)+'%)';
      sec.classList.toggle('on',p>.05&&p<.97);
      if(o&&o.vis)o.draw();
    }
  });
  // horizontal scroller
  if(hs&&innerWidth>860){
    const r=hs.getBoundingClientRect(),total=r.height-vh,p=clamp(-r.top/total,0,1),dist=Math.max(0,track.scrollWidth-innerWidth+80);
    track.style.transform='translate3d('+(-p*dist)+'px,0,0)';hsBar.style.width=(p*100)+'%';
  }
  // steps
  if(stepsEl){const r=stepsEl.getBoundingClientRect(),line=vh*.58;stepsEl.style.setProperty('--p',clamp((line-r.top)/r.height,0,1).toFixed(3));stepLis.forEach(li=>li.classList.toggle('on',li.getBoundingClientRect().top<line))}
  // where
  let cur='00';const mid=vh*.5;
  document.querySelectorAll('.chap').forEach((s,i)=>{const r=s.getBoundingClientRect();if(r.top<mid&&r.bottom>mid)cur=['I','II','III','IV','V'][i]});
  $$('section[data-t]').forEach(s=>{const r=s.getBoundingClientRect();if(r.top<mid&&r.bottom>mid)cur=s.dataset.t.toUpperCase().slice(0,12)});
  if(where.textContent!==cur)where.textContent=cur;
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

/* ───────── cursor ───────── */
if(fine&&!reduce){
  const cur=$('#cursor');let cx=0,cy=0,tx=0,ty=0;
  addEventListener('mousemove',e=>{tx=e.clientX;ty=e.clientY;cur.classList.add('on')},{passive:true});
  document.addEventListener('mouseleave',()=>cur.classList.remove('on'));
  (function f(){cx+=(tx-cx)*.22;cy+=(ty-cy)*.22;cur.style.transform='translate('+cx+'px,'+cy+'px)';requestAnimationFrame(f)})();
  document.addEventListener('mouseover',e=>{cur.classList.toggle('big',!!e.target.closest('a,button,.pn,.person,[role=tab]'))});
}
})();
