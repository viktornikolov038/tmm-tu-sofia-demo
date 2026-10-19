(function(){
'use strict';
const TM=window.TMM=window.TMM||{};
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const html=document.documentElement;
TM.lang=TM.lang||'bg';TM.onLang=TM.onLang||[];
const store={get(k){try{return localStorage.getItem(k)}catch(e){return null}},set(k,v){try{localStorage.setItem(k,v)}catch(e){}}};

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

/* language */
const langEls=$$('[data-en]');
langEls.forEach(el=>{el._bg=el.tagName==='TITLE'?el.textContent:el.innerHTML});
$$('[data-en-ph]').forEach(el=>{el._bgph=el.getAttribute('placeholder')});
function setLang(l){
  TM.lang=l;html.lang=l==='en'?'en':'bg';
  langEls.forEach(el=>{const v=l==='en'?el.getAttribute('data-en'):el._bg;if(el.tagName==='TITLE')document.title=v;else el.innerHTML=v});
  $$('[data-en-ph]').forEach(el=>el.setAttribute('placeholder',l==='en'?el.getAttribute('data-en-ph'):el._bgph));
  $$('.lang button').forEach(b=>b.classList.toggle('on',b.dataset.lang===l));
  renderSearch(qi?qi.value:'');updateMail();TM.onLang.forEach(f=>f());store.set('tmm-lang',l);
}
$$('.lang button').forEach(b=>b.addEventListener('click',()=>setLang(b.dataset.lang)));

/* navigation: dropdowns + mobile menu */
const nav=$('#nav'),burger=$('#burger');
function closeAll(except){$$('#nav .it.open').forEach(li=>{if(li!==except){li.classList.remove('open');li.querySelector('button').setAttribute('aria-expanded',false)}})}
$$('#nav .it').forEach(li=>{
  const b=li.querySelector('button');if(!b)return;
  b.addEventListener('click',e=>{e.stopPropagation();const o=!li.classList.contains('open');closeAll(li);li.classList.toggle('open',o);b.setAttribute('aria-expanded',o)});
  let t;li.addEventListener('mouseenter',()=>{if(innerWidth>1000){clearTimeout(t);closeAll(li);li.classList.add('open');b.setAttribute('aria-expanded',true)}});
  li.addEventListener('mouseleave',()=>{if(innerWidth>1000){t=setTimeout(()=>{li.classList.remove('open');b.setAttribute('aria-expanded',false)},160)}});
});
document.addEventListener('click',()=>closeAll());
addEventListener('keydown',e=>{if(e.key==='Escape'){closeAll();if(!dlg.hidden)closeS()}});
burger.onclick=()=>{const o=nav.classList.toggle('open');burger.setAttribute('aria-expanded',o)};

/* print */
const pb=$('#printBtn');if(pb)pb.onclick=()=>window.print();

/* contact: subject → mailto */
const mail=$('#mailBtn');
const SUBJ={a:['Въпрос от кандидат-студент','Prospective student enquiry'],s:['Въпрос от студент','Student enquiry'],p:['Предложение за сътрудничество','Partnership proposal'],r:['Въпрос от колега-изследовател','Enquiry from a fellow researcher']};
function updateMail(){if(!mail)return;const w=($('#who input:checked')||{}).value||'a';mail.href='mailto:nickn@tu-sofia.bg?cc=yast@tu-sofia.bg&subject='+encodeURIComponent(SUBJ[w][TM.lang==='en'?1:0])}
$$('#who input').forEach(i=>i.addEventListener('change',updateMail));

/* search */
const dlg=$('#search'),qi=$('#q'),ql=$('#qList');let results=[],sel=0;
function renderSearch(q){
  const en=TM.lang==='en';q=(q||'').trim().toLowerCase();
  results=(window.TMM_INDEX||[]).filter(r=>!q||(r.b+' '+r.e+' '+r.k).toLowerCase().includes(q)).slice(0,10);sel=0;
  ql.innerHTML=results.length?results.map((r,i)=>'<li><a href="'+r.u+'" class="'+(i===0?'on':'')+'">'+(en?r.e:r.b)+'<small>'+r.u+'</small></a></li>').join(''):'<li class="none">'+(en?'No results. Try “contact”, “staff” or “gears”.':'Няма резултати. Опитайте „контакти“, „ръководство“ или „предавки“.')+'</li>';
}
function openS(){dlg.hidden=false;qi.value='';renderSearch('');qi.focus()}
function closeS(){dlg.hidden=true}
$('#searchBtn').onclick=openS;$('#qClose').onclick=closeS;dlg.addEventListener('click',e=>{if(e.target===dlg)closeS()});
qi.addEventListener('input',()=>renderSearch(qi.value));
function hl(){[...ql.querySelectorAll('a')].forEach((a,i)=>a.classList.toggle('on',i===sel))}
qi.addEventListener('keydown',e=>{if(e.key==='ArrowDown'){e.preventDefault();sel=Math.min(sel+1,results.length-1);hl()}else if(e.key==='ArrowUp'){e.preventDefault();sel=Math.max(sel-1,0);hl()}else if(e.key==='Enter'&&results[sel]){location.href=results[sel].u}});
addEventListener('keydown',e=>{const typing=/INPUT|TEXTAREA/.test((document.activeElement||{}).tagName);if((e.key==='k'&&(e.ctrlKey||e.metaKey))||(e.key==='/'&&!typing)){e.preventDefault();dlg.hidden?openS():closeS()}});

updateMail();
if(store.get('tmm-lang')==='en')setLang('en');
})();
