(function(){
'use strict';
const TM=window.TMM=window.TMM||{};
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const reduce=matchMedia('(prefers-reduced-motion:reduce)').matches;
const fine=matchMedia('(hover:hover) and (pointer:fine)').matches;
TM.lang='bg';TM.onLang=TM.onLang||[];

/* ───────── loader: gear teeth + counter ───────── */
(function(){
  const p=$('#lgteeth');if(!p)return;let d='';const n=16;
  for(let i=0;i<n;i++){const a=i/n*Math.PI*2,s=Math.PI*2/n,pts=[[a-s*.2,30],[a-s*.12,36],[a+s*.12,36],[a+s*.2,30]];
    pts.forEach((q,k)=>{d+=(i===0&&k===0?'M':'L')+(50+Math.cos(q[0])*q[1]).toFixed(2)+' '+(50+Math.sin(q[0])*q[1]).toFixed(2)})}
  p.setAttribute('d',d+'Z');
})();
const num=$('#lgnum');let t0=performance.now();
(function tick(now){const p=Math.min(1,(now-t0)/1300);if(num)num.textContent=Math.round(p*100)+' %';if(p<1&&document.body.classList.contains('is-loading'))requestAnimationFrame(tick)})(t0);
const wait=new Promise(r=>setTimeout(r,reduce?0:1350));
const loaded=document.readyState==='complete'?Promise.resolve():new Promise(r=>addEventListener('load',r,{once:true}));
const ready=()=>document.body.classList.remove('is-loading');
Promise.all([wait,loaded,document.fonts?document.fonts.ready:Promise.resolve()]).then(ready);
setTimeout(ready,5000);

/* ───────── smooth scroll ───────── */
let lenis=null;TM.lenisRef=()=>lenis;
if(window.Lenis&&!reduce){
  lenis=new Lenis({duration:1.15,easing:t=>Math.min(1,1.001-Math.pow(2,-10*t)),smoothWheel:true});
  const raf=t=>{lenis.raf(t);requestAnimationFrame(raf)};requestAnimationFrame(raf);
  document.documentElement.classList.add('lenis');
}
$$('a[href^="#"]').forEach(a=>a.addEventListener('click',e=>{
  const id=a.getAttribute('href');if(id.length<2)return;const el=$(id);if(!el)return;e.preventDefault();
  const off=el.id==='hero'?0:-50;
  lenis?lenis.scrollTo(el,{offset:off,duration:1.6}):el.scrollIntoView({behavior:'smooth'});
}));

/* ───────── header / progress ───────── */
const top=$('#top-bar'),prog=$('#progress'),nav=$('#nav'),burger=$('#burger');
function onScroll(){
  top.classList.toggle('scrolled',scrollY>40);
  const m=document.documentElement.scrollHeight-innerHeight;prog.style.width=(scrollY/m*100)+'%';
  steps();
}
addEventListener('scroll',onScroll,{passive:true});
burger.onclick=()=>{const o=nav.classList.toggle('open');burger.setAttribute('aria-expanded',o);document.body.style.overflow=o?'hidden':''};
$$('#menu a').forEach(a=>a.addEventListener('click',()=>{nav.classList.remove('open');burger.setAttribute('aria-expanded',false);document.body.style.overflow=''}));
$('#yr').textContent=new Date().getFullYear();

/* ───────── reveal + counters ───────── */
$$('.rv').forEach(el=>{const k=[...el.parentElement.children].indexOf(el);el.style.setProperty('--d',(k%5*.08)+'s')});
function count(b){
  const to=+b.dataset.count,from=+(b.dataset.from||0),suf=b.dataset.suffix||'';
  if(reduce){b.textContent=to+suf;return}
  const t0=performance.now(),D=1900;(function f(t){const p=Math.min((t-t0)/D,1),e=1-Math.pow(1-p,4);b.textContent=Math.round(from+(to-from)*e)+(p===1?suf:'');if(p<1)requestAnimationFrame(f)})(t0);
}
const io=new IntersectionObserver(es=>es.forEach(e=>{
  if(!e.isIntersecting)return;e.target.classList.add('in');io.unobserve(e.target);
  const b=e.target.querySelector('[data-count]');if(b)count(b);
}),{threshold:.14,rootMargin:'0px 0px -6% 0px'});
$$('.rv').forEach(el=>io.observe(el));

/* ───────── statement: words light up with scroll ───────── */
const stmt=$('#stmt');let words=[];
function buildStmt(){
  const txt=stmt.textContent.trim().split(/\s+/);
  stmt.innerHTML=txt.map(w=>'<span class="w">'+w+'</span>').join(' ');words=[...stmt.querySelectorAll('.w')];updStmt();
}
function updStmt(){
  const r=stmt.getBoundingClientRect(),p=(innerHeight*.85-r.top)/(r.height+innerHeight*.3),n=Math.round(Math.max(0,Math.min(1,p))*words.length);
  words.forEach((w,i)=>w.classList.toggle('on',i<n));
}
addEventListener('scroll',updStmt,{passive:true});

/* ───────── education steps progress ───────── */
const stepsEl=$('#steps'),stepLis=stepsEl?[...stepsEl.children]:[];
function steps(){
  if(!stepsEl)return;const r=stepsEl.getBoundingClientRect(),line=innerHeight*.58;
  const p=Math.max(0,Math.min(1,(line-r.top)/r.height));stepsEl.style.setProperty('--p',p.toFixed(3));
  stepLis.forEach(li=>li.classList.toggle('on',li.getBoundingClientRect().top<line));
}

/* ───────── language ───────── */
const langEls=$$('[data-en]');
langEls.forEach(el=>{el._bg=el.tagName==='TITLE'?el.textContent:el.innerHTML});
function setLang(l){
  TM.lang=l;document.documentElement.lang=l==='en'?'en':'bg';
  langEls.forEach(el=>{const v=l==='en'?el.getAttribute('data-en'):el._bg;if(el.tagName==='TITLE')document.title=v;else el.innerHTML=v});
  $$('.lang button').forEach(b=>b.classList.toggle('on',b.dataset.lang===l));
  buildStmt();
  TM.onLang.forEach(f=>f());
  try{localStorage.setItem('tmm-lang',l)}catch(e){}
}
$$('.lang button').forEach(b=>b.addEventListener('click',()=>setLang(b.dataset.lang)));
buildStmt();
try{const s=localStorage.getItem('tmm-lang');if(s==='en')setLang('en')}catch(e){}

/* ───────── cursor + magnetic buttons ───────── */
if(fine&&!reduce){
  const cur=$('#cursor');let cx=0,cy=0,tx=0,ty=0;
  addEventListener('mousemove',e=>{tx=e.clientX;ty=e.clientY;cur.classList.add('on')},{passive:true});
  document.addEventListener('mouseleave',()=>cur.classList.remove('on'));
  (function f(){cx+=(tx-cx)*.2;cy+=(ty-cy)*.2;cur.style.transform='translate('+cx+'px,'+cy+'px)';requestAnimationFrame(f)})();
  document.addEventListener('mouseover',e=>{cur.classList.toggle('big',!!e.target.closest('a,button,.tile,.person,[role=tab]'))});
  $$('.magnet').forEach(m=>{
    m.addEventListener('mousemove',e=>{const r=m.getBoundingClientRect(),x=(e.clientX-r.left-r.width/2)*.28,y=(e.clientY-r.top-r.height/2)*.4;m.style.transform='translate('+x+'px,'+y+'px)'});
    m.addEventListener('mouseleave',()=>{m.style.transform='';});
  });
}

/* ───────── hero 3D ───────── */
const hc=$('#hero3d');
if(hc&&TM.hero3d)TM.hero3d(hc,$('#hero'));
onScroll();
})();
