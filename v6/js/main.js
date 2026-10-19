(function(){
'use strict';
const TM=window.TMM=window.TMM||{};
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
TM.lang='bg';TM.onLang=TM.onLang||[];
const html=document.documentElement;

/* ───────── language ───────── */
const langEls=$$('[data-en]');
langEls.forEach(el=>{el._bg=el.tagName==='TITLE'?el.textContent:el.innerHTML});
function setLang(l){
  TM.lang=l;html.lang=l==='en'?'en':'bg';
  langEls.forEach(el=>{const v=l==='en'?el.getAttribute('data-en'):el._bg;if(el.tagName==='TITLE')document.title=v;else el.innerHTML=v});
  $$('.lang button').forEach(b=>b.classList.toggle('on',b.dataset.lang===l));
  TM.mode&&TM.mode.label();
  $$('#dots button').forEach((b,k)=>{const t=$$('.ch')[k].querySelector('h1,h2');b.setAttribute('aria-label',(l==='en'?'Page ':'Страница ')+(k+1)+(t?': '+t.textContent:''))});
  TM.onLang.forEach(f=>f());
  try{localStorage.setItem('tmm-lang',l)}catch(e){}
}
$$('.lang button').forEach(b=>b.addEventListener('click',()=>setLang(b.dataset.lang)));

/* ───────── sound ───────── */
const snd=$('#sndBtn');
snd.onclick=()=>{
  const on=!TM.Sfx.on;TM.Sfx.on=on;if(on){TM.Sfx.init();TM.Sfx.clack(1)}
  snd.setAttribute('aria-pressed',on);snd.querySelector('em').textContent=on?(TM.lang==='en'?'on':'вкл'):(TM.lang==='en'?'off':'изкл');
  snd.querySelector('em').setAttribute('data-en',on?'on':'off');
};

/* ───────── mode switch ───────── */
$('#modeBtn').onclick=()=>{
  const want=!TM.mode.on;
  if(want&&(innerWidth<1000||innerHeight<620)){alert(TM.lang==='en'?'The machine needs a larger screen (at least 1000×620).':'Машината иска по-голям екран (поне 1000×620).');return}
  TM.mode.set(want,true);
};
$('#logo').onclick=e=>{e.preventDefault();if(TM.mode.on)TM.goTo(0);else window.scrollTo({top:0,behavior:'smooth'})};

/* ───────── workshop overlay ───────── */
const shop=$('#shop');
let lastFocus=null;
function openShop(){lastFocus=document.activeElement;shop.hidden=false;document.body.style.overflow='hidden';if(TM.viewer){TM.viewer.o().dirty=true}shop.scrollTop=0;$('#shopX').focus()}
function closeShop(){shop.hidden=true;document.body.style.overflow='';if(TM.mode&&TM.mode.on)document.body.style.overflow='hidden';lastFocus&&lastFocus.focus&&lastFocus.focus()}
$('#shopBtn').onclick=openShop;$('#shopX').onclick=closeShop;$('#winClose').onclick=closeShop;
addEventListener('keydown',e=>{if(e.key==='Escape'&&!shop.hidden)closeShop()});

if(location.hash==='#shop')openShop();
/* ───────── restore language ───────── */
try{if(localStorage.getItem('tmm-lang')==='en')setLang('en');else setLang('bg')}catch(e){}
})();
