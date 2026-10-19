(function(){
'use strict';
const TM=window.TMM=window.TMM||{};
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const reduce=matchMedia('(prefers-reduced-motion:reduce)').matches;
TM.lang=TM.lang||'bg';TM.onLang=TM.onLang||[];
const html=document.documentElement;

/* ───────── header state ───────── */
const hdr=$('#hdr');
const onScroll=()=>{hdr.classList.toggle('scrolled',scrollY>8);const m=document.documentElement.scrollHeight-innerHeight;$('#progress').style.width=(m>0?scrollY/m*100:0)+'%'};
addEventListener('scroll',onScroll,{passive:true});onScroll();
$('#yr').textContent=new Date().getFullYear();

/* ───────── mobile menu ───────── */
const burger=$('#burger');
burger.onclick=()=>{const o=hdr.classList.toggle('open');burger.setAttribute('aria-expanded',o)};
$$('#nav a').forEach(a=>a.addEventListener('click',()=>{hdr.classList.remove('open');burger.setAttribute('aria-expanded',false)}));

/* ───────── motion switch ───────── */
const mo=$('#motion');
function setMotion(on,save){
  TM.motion=on;html.dataset.motion=on?'on':'off';mo.setAttribute('aria-pressed',on);
  stagesDirty();if(save){try{localStorage.setItem('tmm-motion',on?'1':'0')}catch(e){}}
}
function stagesDirty(){if(TM.viewer)TM.viewer.o().dirty=true}
let saved=null;try{saved=localStorage.getItem('tmm-motion')}catch(e){}
setMotion(saved===null?!reduce:saved==='1',false);
mo.onclick=()=>setMotion(!TM.motion,true);

/* ───────── language ───────── */
const langEls=$$('[data-en]');
langEls.forEach(el=>{el._bg=el.tagName==='TITLE'?el.textContent:el.innerHTML;if(el.hasAttribute('data-en-ph'))el._bgph=el.getAttribute('placeholder')});
function setLang(l){
  TM.lang=l;html.lang=l==='en'?'en':'bg';
  langEls.forEach(el=>{const v=l==='en'?el.getAttribute('data-en'):el._bg;if(el.tagName==='TITLE')document.title=v;else el.innerHTML=v});
  $$('[data-en-ph]').forEach(el=>el.setAttribute('placeholder',l==='en'?el.getAttribute('data-en-ph'):el._bgph));
  $$('.lang button').forEach(b=>b.classList.toggle('on',b.dataset.lang===l));
  TM.onLang.forEach(f=>f());buildSearch();updateMail();
  try{localStorage.setItem('tmm-lang',l)}catch(e){}
}
$$('.lang button').forEach(b=>b.addEventListener('click',()=>setLang(b.dataset.lang)));

/* ───────── reveal + counters ───────── */
function count(b){
  const to=+b.dataset.count,from=+(b.dataset.from||0),suf=b.dataset.suffix||'';
  if(!TM.motion){b.textContent=to+suf;return}
  const t=performance.now();(function f(n){const p=Math.min((n-t)/1400,1),e=1-Math.pow(1-p,3);b.textContent=Math.round(from+(to-from)*e)+(p===1?suf:'');if(p<1)requestAnimationFrame(f)})(t);
}
const io=new IntersectionObserver(es=>es.forEach(e=>{
  if(!e.isIntersecting)return;e.target.classList.add('in');io.unobserve(e.target);
  e.target.querySelectorAll('[data-count]').forEach(count);
}),{threshold:.12,rootMargin:'0px 0px -5% 0px'});
$$('.rv').forEach((el,i)=>{el.style.setProperty('--d',(i%4*.06)+'s');io.observe(el)});

/* ───────── "mechanisms around you" → atlas ───────── */
$$('[data-mech]').forEach(c=>c.addEventListener('click',()=>{
  if(TM.viewer)TM.viewer.select(c.dataset.mech);
  $('#atlas').scrollIntoView({behavior:TM.motion?'smooth':'auto',block:'start'});
}));

/* ───────── contact: subject chips → mailto ───────── */
const mail=$('#mailBtn');let subj='a';
const SUBJ={a:['Въпрос от кандидат-студент','Prospective student enquiry'],s:['Въпрос от студент','Student enquiry'],p:['Предложение за сътрудничество','Partnership proposal'],r:['Въпрос от колега-изследовател','Enquiry from a fellow researcher']};
function updateMail(){const i=TM.lang==='en'?1:0;mail.href='mailto:nickn@tu-sofia.bg?cc=yast@tu-sofia.bg&subject='+encodeURIComponent(SUBJ[subj][i])}
$$('#who button').forEach(b=>b.addEventListener('click',()=>{subj=b.dataset.s;$$('#who button').forEach(x=>x.setAttribute('aria-pressed',x===b));updateMail()}));
updateMail();

/* ───────── search palette (Ctrl/⌘ K or /) ───────── */
const IDX=[
  ['#nakratko','Накратко: какво е ТММ','At a glance: what is TMM','накратко факти университет катедра ттм tmm какво е'],
  ['#study','Какво ще изучавам','What will I study','дисциплини програма учебен план магистър избираеми изучавам обучение'],
  ['#apply','Къде се прилага','Where it is applied','работа кариера роботика машиностроене автоматизация приложение'],
  ['#around','Механизмите около теб','Mechanisms around you','велосипед багер двигател робот кинопроектор ежедневие'],
  ['#atlas','Опитай механизъм (атлас)','Try a mechanism (atlas)','атлас механизъм симулация опитай'],
  ['mech:fourbar','Четиризвенен механизъм','Four-bar linkage','четиризвенник манивела люлка грасхоф'],
  ['mech:slider','Колянно-плъзгачен механизъм','Slider-crank','бутало колянов вал двигател'],
  ['mech:geneva','Малтийски механизъм','Geneva drive','малтийски кръст прекъснато въртене'],
  ['mech:cam','Гърбичен механизъм','Cam and follower','гърбица клапан разпределителен вал'],
  ['mech:planet','Планетна предавка','Planetary gear set','редуктор слънчево колело сателити'],
  ['mech:yoke','Кулисен механизъм','Scotch yoke','кулиса ярем хармонично'],
  ['mech:gears','Зъбна двойка','Gear pair','зъбни колела предавателно отношение'],
  ['#missions-wrap','Мисии (изпробвай умението си)','Missions (test your skill)','мисия предизвикателство игра'],
  ['#research','Наука и изследвания','Research','изследвания синтез роботика мехатроника динамика вибрации предавки патенти проекти публикации'],
  ['#history','История на катедрата','Department history','история 1945 1974 константинов основател'],
  ['#team','Ръководство и екип','Leadership and people','николов стоянова ръководител заместник преподаватели'],
  ['#contact','Контакти','Contact','контакт имейл телефон адрес карта връзка']
];
let results=[],sel=0;
const dlg=$('#search'),qi=$('#q'),list=$('#qList');
function buildSearch(){render(qi.value)}
function norm(s){return s.toLowerCase()}
function render(q){
  q=norm(q.trim());const en=TM.lang==='en';
  results=IDX.filter(r=>!q||norm(r[1]+' '+r[2]+' '+r[3]).includes(q)).slice(0,8);sel=0;
  list.innerHTML=results.length?results.map((r,i)=>'<li role="option" data-i="'+i+'" class="'+(i===0?'on':'')+'"><span class="mono">'+(r[0].startsWith('mech:')?(en?'Mechanism':'Механизъм'):(en?'Section':'Раздел'))+'</span><b>'+(en?r[2]:r[1])+'</b></li>').join(''):'<li class="none">'+(en?'No results. Try “gear”, “contact” or “programme”.':'Няма резултати. Опитайте „зъбно“, „контакт“ или „програма“.')+'</li>';
}
function openS(){dlg.hidden=false;document.body.classList.add('lock');qi.value='';render('');qi.focus()}
function closeS(){dlg.hidden=true;document.body.classList.remove('lock')}
function go(r){
  closeS();
  if(r[0].startsWith('mech:')){TM.viewer&&TM.viewer.select(r[0].slice(5));$('#atlas').scrollIntoView({behavior:TM.motion?'smooth':'auto'})}
  else{$(r[0]).scrollIntoView({behavior:TM.motion?'smooth':'auto'})}
}
$('#searchBtn').onclick=openS;$('#qClose').onclick=closeS;dlg.addEventListener('click',e=>{if(e.target===dlg)closeS()});
qi.addEventListener('input',()=>render(qi.value));
list.addEventListener('click',e=>{const li=e.target.closest('li[data-i]');if(li)go(results[+li.dataset.i])});
function hl(){[...list.children].forEach((li,i)=>li.classList.toggle('on',i===sel));const on=list.children[sel];on&&on.scrollIntoView({block:'nearest'})}
addEventListener('keydown',e=>{
  const typing=/INPUT|TEXTAREA/.test((document.activeElement||{}).tagName);
  if((e.key==='k'&&(e.ctrlKey||e.metaKey))||(e.key==='/'&&!typing)){e.preventDefault();dlg.hidden?openS():closeS();return}
  if(dlg.hidden)return;
  if(e.key==='Escape')closeS();
  else if(e.key==='ArrowDown'){e.preventDefault();sel=Math.min(sel+1,results.length-1);hl()}
  else if(e.key==='ArrowUp'){e.preventDefault();sel=Math.max(sel-1,0);hl()}
  else if(e.key==='Enter'&&results[sel]){e.preventDefault();go(results[sel])}
});
buildSearch();

/* ───────── restore saved language ───────── */
try{if(localStorage.getItem('tmm-lang')==='en')setLang('en')}catch(e){}
})();
