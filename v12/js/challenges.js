/* Three short missions that use the atlas viewer. Progress is kept in localStorage (optional). */
(function(){
'use strict';
const TM=window.TMM=window.TMM||{};
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const tr=(bg,en)=>TM.lang==='en'?en:bg;

const M=[
  {id:'m1',mech:'fourbar',start:{a:1.6,b:2,c:2,d:3.4},
   t:['Завърти манивелата','Spin the crank'],
   g:['Нагласи размерите така, че манивелата да може да направи пълен оборот. Подсказка: най-късото звено трябва да е манивела или стойка и s + l ≤ p + q.','Set the sizes so the crank can make a full turn. Hint: the shortest link must be the crank or the frame and s + l ≤ p + q.'],
   test(P){const L=[['a',P.a],['b',P.b],['c',P.c],['d',P.d]].sort((p,q)=>p[1]-q[1]);const gr=L[0][1]+L[3][1]<=L[1][1]+L[2][1];return gr&&(L[0][0]==='a'||L[0][0]==='d')},
   s(P){const L=[P.a,P.b,P.c,P.d].sort((p,q)=>p-q);return 's + l = '+(L[0]+L[3]).toFixed(2)+'   p + q = '+(L[1]+L[2]).toFixed(2)}},
  {id:'m2',mech:'gears',start:{z1:12,z2:20},
   t:['Редуцирай три пъти','Reduce three times'],
   g:['Избери броя зъби така, че второто колело да се върти точно 3 пъти по-бавно от първото: u = z₂ / z₁ = 3.','Choose the tooth counts so the second wheel turns exactly 3 times slower than the first: u = z₂ / z₁ = 3.'],
   test(P){return P.z2===3*P.z1},
   s(P){return 'u = '+(P.z2/P.z1).toFixed(2)}},
  {id:'m3',mech:'geneva',start:{n:4},
   t:['Една шеста от оборота','One sixth of a turn'],
   g:['Нагласи малтийския механизъм така, че задвижваното колело да се завърта на 60° при всеки цикъл.','Set the Geneva drive so the driven wheel indexes by 60° every cycle.'],
   test(P){return P.n===6},
   s(P){return '360°/n = '+(360/P.n).toFixed(0)+'°'}}
];
const KEY='tmm-missions';
let done={};try{done=JSON.parse(localStorage.getItem(KEY)||'{}')}catch(e){}
let active=null;

document.addEventListener('DOMContentLoaded',()=>{
  const box=$('#missions'),bar=$('#mBar'),cnt=$('#mCount'),goal=$('#mGoal'),goalT=$('#mGoalT'),goalS=$('#mGoalS'),win=$('#mWin');
  if(!box||!TM.viewer)return;
  const V=TM.viewer;
  M.forEach((m,i)=>{
    const b=document.createElement('button');b.type='button';b.className='ms';b.dataset.id=m.id;
    b.innerHTML='<i class="ck" aria-hidden="true"></i><span class="mono">'+(i+1)+'/3</span><b></b>';
    b.onclick=()=>start(m);box.appendChild(b);
  });
  function paint(){
    let n=0;$$('#missions .ms').forEach((b,i)=>{const m=M[i];b.querySelector('b').textContent=m.t[TM.lang==='en'?1:0];const d=!!done[m.id];if(d)n++;b.classList.toggle('done',d);b.classList.toggle('on',active===m)});
    cnt.textContent=n+' / 3';bar.style.width=(n/3*100)+'%';win.hidden=n<3;
    if(active){goalT.textContent=active.g[TM.lang==='en'?1:0]}
  }
  function start(m){
    active=m;V.select(m.mech);
    // apply starting parameters through the viewer's own sliders
    const P=V.P();Object.keys(m.start).forEach(k=>{P[k]=m.start[k]});
    $$('#atControls label').forEach(l=>{if(l._set)l._set()});
    $$('#atControls input').forEach((inp,i)=>{const ctl=TMM.MECH[m.mech].controls[i];if(ctl&&m.start[ctl.k]!=null)inp.value=m.start[ctl.k]});
    V.o().cache={};V.o().dirty=true;
    goal.hidden=false;paint();
    document.getElementById('atlasViewer').scrollIntoView({behavior:TM.motion?'smooth':'auto',block:'center'});
  }
  (function check(){
    if(active&&V.cur()===active.mech){
      const P=V.P(),ok=active.test(P);
      goalS.textContent=active.s(P);goal.classList.toggle('ok',ok);
      if(ok&&!done[active.id]){done[active.id]=true;try{localStorage.setItem(KEY,JSON.stringify(done))}catch(e){}goal.classList.add('pop');setTimeout(()=>goal.classList.remove('pop'),900);paint()}
    }else if(active&&V.cur()!==active.mech){goal.classList.remove('ok');goalS.textContent=''}
    requestAnimationFrame(check);
  })();
  TM.onLang=TM.onLang||[];TM.onLang.push(paint);
  $('#mReset')&&($('#mReset').onclick=()=>{done={};try{localStorage.removeItem(KEY)}catch(e){}active=null;goal.hidden=true;paint()});
  paint();
});
})();
