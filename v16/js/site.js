(function(){
'use strict';
const TM=window.TMM=window.TMM||{};
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const html=document.documentElement;
const EN=html.lang==='en';TM.lang=EN?'en':'bg';
const store={get(k){try{return localStorage.getItem(k)}catch(e){return null}},set(k,v){try{localStorage.setItem(k,v)}catch(e){}}};
const reduce=matchMedia('(prefers-reduced-motion:reduce)').matches;

/* year */
const yr=$('#yr');if(yr)yr.textContent=new Date().getFullYear();

/* text size */
let fs=+(store.get('tmm-fs')||1);
function applyFs(){html.classList.toggle('fs2',fs===2);html.classList.toggle('fs3',fs===3);store.set('tmm-fs',fs)}
$('#fsm').onclick=()=>{fs=Math.max(1,fs-1);applyFs()};$('#fs0').onclick=()=>{fs=1;applyFs()};$('#fsp').onclick=()=>{fs=Math.min(3,fs+1);applyFs()};applyFs();

/* contrast */
const hc=$('#hcb');
function applyHc(on){document.body.classList.toggle('hc',on);hc.setAttribute('aria-pressed',on);store.set('tmm-hc',on?'1':'0')}
hc.onclick=()=>applyHc(!document.body.classList.contains('hc'));applyHc(store.get('tmm-hc')==='1');

/* navigation */
const nav=$('#nav'),burger=$('#burger');
function closeAll(except){$$('#nav .it.open').forEach(li=>{if(li!==except){li.classList.remove('open');li.querySelector('button').setAttribute('aria-expanded',false)}})}
$$('#nav .it').forEach(li=>{
  const b=li.querySelector('button');if(!b)return;
  b.addEventListener('click',e=>{e.stopPropagation();const o=!li.classList.contains('open');closeAll(li);li.classList.toggle('open',o);b.setAttribute('aria-expanded',o)});
  let tm;li.addEventListener('mouseenter',()=>{if(innerWidth>1000){clearTimeout(tm);closeAll(li);li.classList.add('open');b.setAttribute('aria-expanded',true)}});
  li.addEventListener('mouseleave',()=>{if(innerWidth>1000){tm=setTimeout(()=>{li.classList.remove('open');b.setAttribute('aria-expanded',false)},160)}});
});
document.addEventListener('click',()=>closeAll());
burger.onclick=()=>{const o=nav.classList.toggle('open');burger.setAttribute('aria-expanded',o)};

/* print, back to top */
const pb=$('#printBtn');if(pb)pb.onclick=()=>window.print();
const tt=$('#toTop');
addEventListener('scroll',()=>{tt.hidden=scrollY<700},{passive:true});
tt.onclick=()=>scrollTo({top:0,behavior:reduce?'auto':'smooth'});

/* contact: subject → mailto */
const mail=$('#mailBtn');
const SUBJ={a:['Въпрос от кандидат-студент','Prospective student enquiry'],s:['Въпрос от студент','Student enquiry'],p:['Предложение за сътрудничество','Partnership proposal'],r:['Въпрос от колега-изследовател','Enquiry from a fellow researcher']};
function updateMail(){if(!mail)return;const w=($('#who input:checked')||{}).value||mail.dataset.subj||'a';mail.href='mailto:nickn@tu-sofia.bg?cc=yast@tu-sofia.bg&subject='+encodeURIComponent(SUBJ[w][EN?1:0])}
$$('#who input').forEach(i=>i.addEventListener('change',updateMail));updateMail();

/* search */
const dlg=$('#search'),qi=$('#q'),ql=$('#qList');let results=[],sel=0;
function renderSearch(q){
  q=(q||'').trim().toLowerCase();
  results=(window.TMM_INDEX||[]).filter(r=>!q||(r.b+' '+r.k).toLowerCase().includes(q)).slice(0,10);sel=0;
  ql.innerHTML=results.length?results.map((r,i)=>'<li><a href="'+r.u+'" class="'+(i===0?'on':'')+'">'+r.b+'</a></li>').join(''):'<li class="none">'+(EN?'No results. Try “contact”, “students” or “gears”.':'Няма резултати. Опитайте „контакти“, „студенти“ или „предавки“.')+'</li>';
}
function openS(){dlg.hidden=false;qi.value='';renderSearch('');qi.focus()}
function closeS(){dlg.hidden=true}
$('#searchBtn').onclick=openS;$('#qClose').onclick=closeS;dlg.addEventListener('click',e=>{if(e.target===dlg)closeS()});
qi.addEventListener('input',()=>renderSearch(qi.value));
function hl(){[...ql.querySelectorAll('a')].forEach((a,i)=>a.classList.toggle('on',i===sel))}
qi.addEventListener('keydown',e=>{if(e.key==='ArrowDown'){e.preventDefault();sel=Math.min(sel+1,results.length-1);hl()}else if(e.key==='ArrowUp'){e.preventDefault();sel=Math.max(sel-1,0);hl()}else if(e.key==='Enter'&&results[sel]){location.href=results[sel].u}});
addEventListener('keydown',e=>{
  if(e.key==='Escape'){closeAll();if(!dlg.hidden)closeS();return}
  const typing=/INPUT|TEXTAREA/.test((document.activeElement||{}).tagName);
  if((e.key==='k'&&(e.ctrlKey||e.metaKey))||(e.key==='/'&&!typing)){e.preventDefault();dlg.hidden?openS():closeS()}
});

/* in-page contents (right rail) */
(function(){
  const art=$('.art');if(!art)return;const hs=[...art.querySelectorAll('h2')];if(hs.length<3)return;
  const rail=$('#tocR');if(!rail)return;
  rail.innerHTML='<h2>'+(EN?'On this page':'На тази страница')+'</h2>'+hs.map((h,i)=>{if(!h.id)h.id='s'+(i+1);return'<a href="#'+h.id+'">'+h.textContent+'</a>'}).join('');
  rail.hidden=false;$('.page').classList.add('has-toc');
  const links=[...rail.querySelectorAll('a')];
  const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting)links.forEach(a=>a.classList.toggle('on',a.getAttribute('href')==='#'+e.target.id))}),{rootMargin:'-15% 0px -70% 0px'});
  hs.forEach(h=>io.observe(h));
})();

/* counters + reveal (home) */
function count(b){
  const to=+b.dataset.count,from=+(b.dataset.from||0);
  if(reduce){b.textContent=to;return}
  const t0=performance.now();(function f(n){const p=Math.min((n-t0)/1400,1),e=1-Math.pow(1-p,3);b.textContent=Math.round(from+(to-from)*e);if(p<1)requestAnimationFrame(f)})(t0);
}
const cio=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){cio.unobserve(e.target);count(e.target)}}),{threshold:.6});
$$('[data-count]').forEach(b=>cio.observe(b));
if(!reduce){
  const rio=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');rio.unobserve(e.target)}}),{threshold:.1});
  $$('.au,.ap,.fact,.person,.faq,.fig').forEach((el,i)=>{el.classList.add('rv');el.style.transitionDelay=(i%5*.05)+'s';rio.observe(el)});
}

/* deep link: materials#fourbar etc. */
(function(){const m=location.hash.match(/^#(fourbar|slider|geneva|cam|planet|yoke|gears)$/);if(!m)return;let n=0;const iv=setInterval(()=>{if(TM.viewer){TM.viewer.select(m[1]);clearInterval(iv)}else if(++n>40)clearInterval(iv)},100)})();
})();
