(function(){
'use strict';
const TM=window.TMM=window.TMM||{};
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
TM.lang='bg';TM.onLang=TM.onLang||[];
const html=document.documentElement;
const TOTAL=8;

/* ───────── title blocks (основен надпис) ───────── */
const TB={bg:{org:'Организация',name:'Наименование',code:'Обозн.',sheet:'Лист',sheets:'Листове',o:'ТУ–СОФИЯ · КАТЕДРА ТММ'},en:{org:'Organisation',name:'Title',code:'Ref.',sheet:'Sheet',sheets:'Sheets',o:'TU-SOFIA · TMM DEPT.'}};
function paintTB(){
  const l=TM.lang==='en'?'en':'bg',t=TB[l];
  $$('.sheet').forEach(sh=>{
    let tb=sh.querySelector('.tb');if(!tb){tb=document.createElement('div');tb.className='tb';tb.setAttribute('aria-hidden','true');sh.appendChild(tb)}
    const n=sh.dataset.n,name=l==='en'?sh.dataset.enName:sh.dataset.name;
    tb.innerHTML='<div class="org-c"><small>'+t.org+'</small><b>'+t.o+'</b></div><div class="name big"><small>'+t.name+'</small><b>'+name+'</b></div><div><small>'+t.code+'</small><b>ТММ-ТД-0'+n+'</b></div><div><small>'+t.sheet+'</small><b>'+n+'</b></div><div><small>'+t.sheets+'</small><b>'+TOTAL+'</b></div>';
  });
}
/* ───────── language ───────── */
const langEls=$$('[data-en]');
langEls.forEach(el=>{el._bg=el.tagName==='TITLE'?el.textContent:el.innerHTML});
function setLang(l){
  TM.lang=l;html.lang=l==='en'?'en':'bg';
  langEls.forEach(el=>{const v=l==='en'?el.getAttribute('data-en'):el._bg;if(el.tagName==='TITLE')document.title=v;else el.innerHTML=v});
  $$('.lang button').forEach(b=>b.classList.toggle('on',b.dataset.lang===l));
  paintTB();updateMail();TM.onLang.forEach(f=>f());
  try{localStorage.setItem('tmm-lang',l)}catch(e){}
}
$$('.lang button').forEach(b=>b.addEventListener('click',()=>setLang(b.dataset.lang)));

/* ───────── seven-segment indicator board ───────── */
const SEG={a:'7,3 33,3 29,9 11,9',b:'36,5 36,32 32,36 32,11',c:'36,38 36,65 32,59 32,42',d:'7,67 33,67 29,61 11,61',e:'4,38 4,65 8,59 8,42',f:'4,5 4,32 8,36 8,11',g:'8,35 12,32 28,32 32,35 28,38 12,38'};
const MAP={0:'abcdef',1:'bc',2:'abdeg',3:'abcdg',4:'bcfg',5:'acdfg',6:'acdefg',7:'abc',8:'abcdefg',9:'abcdfg',' ':''};
function digitSvg(ch){
  const on=MAP[ch]||'';
  return '<svg viewBox="0 0 40 70" aria-hidden="true">'+Object.keys(SEG).map(k=>'<polygon class="'+(on.includes(k)?'on':'off')+'" points="'+SEG[k]+'"/>').join('')+'</svg>';
}
function showNum(el,n){const w=+el.dataset.w||4,s=String(n).padStart(w,' ');el.innerHTML=[...s].map(digitSvg).join('')}
function runBoard(){
  $$('.seg').forEach(el=>{
    const to=+el.dataset.v;if(!TM.motion||matchMedia('(prefers-reduced-motion:reduce)').matches){showNum(el,to);return}
    const t0=performance.now(),D=1400;(function f(t){const p=Math.min((t-t0)/D,1),e=1-Math.pow(1-p,3);showNum(el,Math.round(to*e));if(p<1)requestAnimationFrame(f);else showNum(el,to)})(t0);
  });
}
TM.motion=TM.motion!==undefined?TM.motion:true;
$$('.seg').forEach(el=>showNum(el,0));

/* ───────── reveal, stamps, contents highlight ───────── */
const sheets=$$('.sheet'),tocA=$$('.toc a[data-s]');
let boardDone=false;
const io=new IntersectionObserver(es=>es.forEach(e=>{
  if(e.isIntersecting){e.target.classList.add('in');if(e.target.id==='s3'&&!boardDone){boardDone=true;runBoard()}}
}),{threshold:.18});
sheets.forEach(s=>io.observe(s));
const io2=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){const n=e.target.dataset.n;tocA.forEach(a=>a.classList.toggle('on',a.dataset.s===n))}}),{rootMargin:'-40% 0px -50% 0px'});
sheets.forEach(s=>io2.observe(s));

/* ───────── enquiry form → mailto ───────── */
const SUBJ={a:['Въпрос от кандидат-студент','Prospective student enquiry'],s:['Въпрос от студент','Student enquiry'],p:['Предложение за сътрудничество','Partnership proposal'],r:['Въпрос от колега-изследовател','Enquiry from a fellow researcher']};
function updateMail(){const w=($('#who input:checked')||{}).value||'a';$('#mailBtn').href='mailto:nickn@tu-sofia.bg?cc=yast@tu-sofia.bg&subject='+encodeURIComponent(SUBJ[w][TM.lang==='en'?1:0])}
$$('#who input').forEach(i=>i.addEventListener('change',updateMail));

/* ───────── print ───────── */
$('#printBtn').onclick=()=>window.print();

/* ───────── init ───────── */
paintTB();updateMail();
try{if(localStorage.getItem('tmm-lang')==='en')setLang('en')}catch(e){}
})();
