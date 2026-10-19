/* Reference terminal "TMM-16": a tiny command interpreter that answers questions about the department */
(function(){
'use strict';
const TM=window.TMM=window.TMM||{};
const $=s=>document.querySelector(s);
const L=()=>TM.lang==='en'?'en':'bg';
const dots=(a,b,w)=>{w=w||36;const n=Math.max(2,w-a.length-String(b).length);return a+' '+'.'.repeat(n)+' '+b};

const TXT={
  boot:{bg:['ТММ-16   ВЕРСИЯ 1.0','ПАМЕТ: 64К ....... ПРОВЕРКА ОК','КАТЕДРА „ТЕОРИЯ НА МЕХАНИЗМИТЕ И МАШИНИТЕ“','ТЕХНИЧЕСКИ УНИВЕРСИТЕТ – СОФИЯ','','ВЪВЕДЕТЕ „ПОМОЩ“ ЗА СПИСЪК НА КОМАНДИТЕ.',''],
        en:['TMM-16   VERSION 1.0','MEMORY: 64K ....... CHECK OK','DEPARTMENT OF THEORY OF MECHANISMS AND MACHINES','TECHNICAL UNIVERSITY OF SOFIA','','TYPE “HELP” FOR THE LIST OF COMMANDS.','']},
  help:{bg:['КОМАНДИ:','  ПОМОЩ ........... тази справка','  ФАКТИ ........... основни показатели','  ЕКИП ............ ръководство','  НАУКА ........... направления','  ИСТОРИЯ ......... хронология','  ЧЕРТЕЖ 1..7 ..... отваря кинематична схема','  ЗАДАЧИ .......... състояние на задачите','  КОНТАКТ ......... адрес и телефони','  ЕЗИК EN|BG ...... смяна на езика','  ЧИСТИ ........... изчиства екрана'],
        en:['COMMANDS:','  HELP ............ this reference','  FACTS ........... key indicators','  STAFF ........... leadership','  RESEARCH ........ directions','  HISTORY ......... chronology','  DRAW 1..7 ....... open a kinematic diagram','  TASKS ........... task status','  CONTACT ......... address and phones','  LANG EN|BG ...... switch language','  CLS ............. clear the screen']},
  facts:{bg:['ОСНОВНИ ПОКАЗАТЕЛИ:',dots('НАЧАЛО НА ДИСЦИПЛИНАТА','1945 Г.'),dots('САМОСТОЯТЕЛНА КАТЕДРА','1974 Г. (ЮНИ)'),dots('ПРЕПОДАВАТЕЛИ','15 БР.'),dots('ЗАДЪЛЖИТЕЛНИ ДИСЦИПЛИНИ','10 БР.'),dots('  В МАГИСТЪРСКИ ПРОГРАМИ','2 БР.'),dots('ИЗБИРАЕМИ ДИСЦИПЛИНИ','2 БР.')],
         en:['KEY INDICATORS:',dots('DISCIPLINE STARTS','1945'),dots('INDEPENDENT DEPARTMENT','1974 (JUNE)'),dots('ACADEMIC STAFF','15'),dots('COMPULSORY SUBJECTS','10'),dots('  IN MASTER’S PROGRAMMES','2'),dots('ELECTIVE SUBJECTS','2')]},
  staff:{bg:['РЪКОВОДСТВО:','1. РЪКОВОДИТЕЛ: ПРОФ. ДТН ИНЖ. НИКОЛАЙ НИКОЛОВ','   БЛ.4, ЕТ.5, КАБ.4536 · 02 965 2770','   NICKN@TU-SOFIA.BG','2. ЗАМ.-РЪКОВОДИТЕЛ: ДОЦ. Д-Р ЯНА СТОЯНОВА','   БЛ.4, ЕТ.2, КАБ.4211-А · 02 965 2938','   YAST@TU-SOFIA.BG','ОБЩО ПРЕПОДАВАТЕЛИ: 15. ПЪЛЕН СПИСЪК — TU-SOFIA.BG'],
         en:['LEADERSHIP:','1. HEAD: PROF. NIKOLAY NIKOLOV, DSC, ENG.','   BL.4, FL.5, RM.4536 · 02 965 2770','   NICKN@TU-SOFIA.BG','2. DEPUTY HEAD: ASSOC. PROF. YANA STOYANOVA, PHD','   BL.4, FL.2, RM.4211-A · 02 965 2938','   YAST@TU-SOFIA.BG','TOTAL ACADEMIC STAFF: 15. FULL LIST — TU-SOFIA.BG']},
  research:{bg:['НАУЧНИ НАПРАВЛЕНИЯ:','1. СИНТЕЗ НА МЕХАНИЗМИ','2. РОБОТИКА И МЕХАТРОНИКА','3. ДИНАМИКА И ВИБРАЦИИ','4. ПРЕДАВКИ И РЕДУКТОРИ','ФОРМИ НА РЕАЛИЗАЦИЯ: ПУБЛИКАЦИИ, МЕЖДУНАРОДНИ ПРОЕКТИ, ДОГОВОРИ С ФИРМИ, ПАТЕНТИ, ВНЕДРЯВАНЕ, КОНСУЛТАЦИИ.'],
            en:['RESEARCH DIRECTIONS:','1. SYNTHESIS OF MECHANISMS','2. ROBOTICS AND MECHATRONICS','3. DYNAMICS AND VIBRATION','4. GEARS AND REDUCERS','FORMS OF REALISATION: PUBLICATIONS, INTERNATIONAL PROJECTS, INDUSTRY CONTRACTS, PATENTS, IMPLEMENTATION, CONSULTING.']},
  history:{bg:['ХРОНОЛОГИЯ:','1945 Г. — ПЪРВИ ПРЕПОДАВАТЕЛ: ПРОФ. МИХАИЛ КОНСТАНТИНОВ.','1974 Г. (ЮНИ) — САМОСТОЯТЕЛНА КАТЕДРА. ПЪРВИ РЪКОВОДИТЕЛ И ОСНОВАТЕЛ: ПРОФ. КОНСТАНТИНОВ (1921–1991).','ДНЕС — 15 ПРЕПОДАВАТЕЛИ, МЕЖДУНАРОДНИ ПРОЕКТИ, ВРЪЗКА С ИНДУСТРИЯТА.'],
           en:['CHRONOLOGY:','1945 — FIRST LECTURER: PROF. MIHAIL KONSTANTINOV.','1974 (JUNE) — INDEPENDENT DEPARTMENT. FIRST HEAD AND FOUNDER: PROF. KONSTANTINOV (1921–1991).','TODAY — 15 ACADEMIC STAFF, INTERNATIONAL PROJECTS, TIES WITH INDUSTRY.']},
  contact:{bg:['АДРЕС: ТЕХНИЧЕСКИ УНИВЕРСИТЕТ – СОФИЯ, БУЛ. „СВ. КЛИМЕНТ ОХРИДСКИ“ 8, БЛОК 4, 1756 СОФИЯ','ТЕЛЕФОНИ: 02 965 2770, 02 965 2938','E-MAIL: NICKN@TU-SOFIA.BG, YAST@TU-SOFIA.BG','БЛАНКА ЗА ЗАПИТВАНЕ — ЛИСТ 8.'],
            en:['ADDRESS: TECHNICAL UNIVERSITY OF SOFIA, 8 KLIMENT OHRIDSKI BLVD, BLOCK 4, 1756 SOFIA','PHONES: 02 965 2770, 02 965 2938','E-MAIL: NICKN@TU-SOFIA.BG, YAST@TU-SOFIA.BG','ENQUIRY FORM — SHEET 8.']}
};
const ALIAS={'помощ':'help','help':'help','?':'help','факти':'facts','facts':'facts','екип':'staff','staff':'staff','ръководство':'staff','наука':'research','research':'research','история':'history','history':'history','задачи':'tasks','tasks':'tasks','контакт':'contact','contacts':'contact','contact':'contact','чисти':'cls','cls':'cls','clear':'cls','език':'lang','lang':'lang','чертеж':'draw','draw':'draw'};
const KEYS=[['help','ПОМОЩ','HELP'],['facts','ФАКТИ','FACTS'],['staff','ЕКИП','STAFF'],['research','НАУКА','RESEARCH'],['history','ИСТОРИЯ','HISTORY'],['tasks','ЗАДАЧИ','TASKS'],['contact','КОНТАКТ','CONTACT'],['cls','ЧИСТИ','CLS']];

document.addEventListener('DOMContentLoaded',()=>{
  const out=$('#termOut'),form=$('#termForm'),inp=$('#termIn'),keys=$('#termKeys');
  if(!out)return;
  const hist=[];let hi=-1,busy=false,booted=false;
  function print(lines,fast){
    lines=[].concat(lines);
    return new Promise(res=>{
      let i=0;(function nx(){if(i>=lines.length){res();return}out.textContent+=lines[i++]+'\n';out.scrollTop=out.scrollHeight;(fast||!TM.motion)?nx():setTimeout(nx,28)})();
    });
  }
  async function run(raw){
    const cmd=raw.trim().toLowerCase();if(!cmd)return;
    hist.unshift(raw.trim());hi=-1;
    out.textContent+='ТММ> '+raw.trim().toUpperCase()+'\n';
    const [w,...rest]=cmd.split(/\s+/),k=ALIAS[w];
    if(!k){await print([(L()==='en'?'UNKNOWN COMMAND: ':'НЕПОЗНАТА КОМАНДА: ')+w.toUpperCase()+(L()==='en'?'. TYPE HELP.':'. ВЪВЕДЕТЕ ПОМОЩ.'),'']);return}
    if(k==='cls'){out.textContent='';return}
    if(k==='lang'){const t=(rest[0]||'').toLowerCase();const to=t==='en'?'en':t==='bg'?'bg':(L()==='en'?'bg':'en');document.querySelector('.lang [data-lang='+to+']').click();await print([to==='en'?'LANGUAGE: ENGLISH':'ЕЗИК: БЪЛГАРСКИ','']);return}
    if(k==='draw'){
      const keysV=TM.viewer?TM.viewer.keys():[],n=parseInt(rest[0],10);
      if(!n||n<1||n>keysV.length){await print([(L()==='en'?'USAGE: DRAW 1..':'УПОТРЕБА: ЧЕРТЕЖ 1..')+keysV.length,'']);return}
      TM.viewer.select(keysV[n-1]);const nm=TM.MECH[keysV[n-1]].name[L()==='en'?1:0];
      await print([(L()==='en'?'DRAWING ':'ЧЕРТЕЖ ')+n+': '+nm.toUpperCase(),(L()==='en'?'SEE SHEET 6.':'ВИЖ ЛИСТ 6.'),'']);
      document.getElementById('s6').scrollIntoView({behavior:TM.motion?'smooth':'auto'});return;
    }
    if(k==='tasks'){
      const ms=[...document.querySelectorAll('#missions .ms')];
      await print([(L()==='en'?'TASKS FOR INDEPENDENT WORK:':'ЗАДАЧИ ЗА САМОСТОЯТЕЛНА РАБОТА:'),...ms.map((m,i)=>(i+1)+'. '+m.querySelector('b').textContent.toUpperCase()+'  ['+(m.classList.contains('done')?(L()==='en'?'DONE':'ИЗПЪЛНЕНА'):(L()==='en'?'OPEN':'ОТВОРЕНА'))+']'),(L()==='en'?'SEE SHEET 6.':'ВИЖ ЛИСТ 6.'),'']);return;
    }
    await print(TXT[k][L()].concat(['']));
  }
  keys.innerHTML='';
  function paintKeys(){keys.innerHTML='';KEYS.forEach(([id,bg,en])=>{const b=document.createElement('button');b.type='button';b.textContent=L()==='en'?en:bg;b.onclick=()=>{if(!busy){busy=true;run(L()==='en'?en:bg).then(()=>busy=false)}};keys.appendChild(b)})}
  paintKeys();TM.onLang=TM.onLang||[];TM.onLang.push(paintKeys);
  form.addEventListener('submit',e=>{e.preventDefault();const v=inp.value;inp.value='';if(!busy){busy=true;run(v).then(()=>busy=false)}});
  inp.addEventListener('keydown',e=>{if(e.key==='ArrowUp'&&hist.length){e.preventDefault();hi=Math.min(hi+1,hist.length-1);inp.value=hist[hi]}else if(e.key==='ArrowDown'){e.preventDefault();hi=Math.max(hi-1,-1);inp.value=hi<0?'':hist[hi]}});
  // boot sequence when the sheet first comes into view
  new IntersectionObserver((es,ob)=>{if(es[0].isIntersecting&&!booted){booted=true;ob.disconnect();busy=true;print(TXT.boot[L()]).then(()=>busy=false)}},{threshold:.3}).observe($('#crt'));
  $('#crt').addEventListener('click',()=>inp.focus());
});
})();
