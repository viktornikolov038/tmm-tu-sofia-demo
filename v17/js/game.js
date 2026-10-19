/* v17: the department as an 8-bit side-scroller. Walk to a building, press E to open the section. */
(function(){
'use strict';
const root=document.getElementById('game');if(!root)return;
const EN=document.documentElement.lang==='en';
const L=(b,e)=>EN?e:b;
const $=(s,r)=>(r||document).querySelector(s),$$=(s,r)=>[...(r||document).querySelectorAll(s)];
const reduce=matchMedia('(prefers-reduced-motion:reduce)').matches;
const store={get(k){try{return localStorage.getItem(k)}catch(e){return null}},set(k,v){try{localStorage.setItem(k,v)}catch(e){}}};
const TAU=Math.PI*2,LW=320,LH=180,WW=2500,GY=150;
const PAL=['#1a1c2c','#5d275d','#b13e53','#ef7d57','#ffcd75','#a7f070','#38b764','#257179','#29366f','#3b5dc9','#41a6f6','#73eff7','#f4f4f4','#94b0c2','#566c86','#333c57'];
const cv=$('#gcv',root),ctx=cv.getContext('2d');ctx.imageSmoothingEnabled=false;
let night=(()=>{const h=new Date().getHours();return h>=20||h<6})();
const nightSaved=store.get('tmm-night');if(nightSaved!==null)night=nightSaved==='1';

/* ---------- stations ---------- */
const ST=[
  {id:'students',x:430,w:100,h:70,sign:L('СТУДЕНТИ','STUDENTS'),href:'students.html',col:[2,3],t:L('За студенти','For students'),d:L('Какво се изучава, къде се прилага и отговори на най-честите въпроси на кандидат-студенти и студенти.','What is studied, where it is applied and answers to the most common questions from prospective and current students.')},
  {id:'research',x:780,w:70,h:100,sign:L('НАУКА','RESEARCH'),href:'research.html',col:[9,10],t:L('Наука','Research'),d:L('Научноизследователската дейност: синтез на механизми, роботика, динамика и предавки.','Research activity: synthesis of mechanisms, robotics, dynamics and gearing.')},
  {id:'business',x:1130,w:120,h:70,sign:L('БИЗНЕС','BUSINESS'),href:'business.html',col:[7,6],t:L('За бизнеса','For business'),d:L('Договори, консултации, патенти и внедряване на разработки.','Contracts, consulting, patents and implementation of developments.')},
  {id:'lab',x:1490,w:100,h:78,sign:L('ЛАБОРАТОРИЯ','LAB'),href:'lab.html',col:[1,2],t:L('Интерактивна лаборатория','Interactive lab'),d:L('Пет инструмента, които можете да пипате: зъбни предавки, четиризвенник, гърбица, степени на свобода и тест.','Five tools you can touch: gear trains, a four-bar, a cam, degrees of freedom and a quiz.')},
  {id:'history',x:1850,w:60,h:105,sign:L('ИСТОРИЯ','HISTORY'),href:'history.html',col:[14,13],t:L('История','History'),d:L('Корените на дисциплината са от 1945 г. През юни 1974 г. катедрата става самостоятелна. Основател е проф. Михаил Константинов (1921–1991).','The roots of the discipline date from 1945. In June 1974 the department became independent. Its founder is Prof. Mihail Konstantinov (1921–1991).')},
  {id:'contacts',x:2220,w:90,h:64,sign:L('КОНТАКТИ','CONTACT'),href:'contacts.html',col:[8,9],t:L('Контакти','Contact'),d:L('Ръководител: проф. Николай Николов, 02 965 2770, nickn@tu-sofia.bg. Заместник-ръководител: доц. Яна Стоянова, 02 965 2938.','Head: Prof. Nikolay Nikolov, 02 965 2770, nickn@tu-sofia.bg. Deputy head: Assoc. Prof. Yana Stoyanova, 02 965 2938.')}
];
const WELCOME={t:L('Добре дошли в катедра ТММ!','Welcome to the TMM department!'),d:L('Ходете със стрелките ← →, скачайте с интервал и влизайте в сградите с E. Събирайте зъбните колела — има 10.','Walk with the arrow keys ← →, jump with Space and enter buildings with E. Collect the cogs — there are 10.')};
const COGX=[[250,128],[330,96],[560,126],[700,92],[905,126],[1010,104],[1260,100],[1390,128],[1700,96],[2060,126]];
const cogs=COGX.map(p=>({x:p[0],y:p[1],got:false,ph:Math.random()*6}));
const crates=[{x:315,y:GY-16,w:16,h:16},{x:331,y:GY-16,w:16,h:16},{x:323,y:GY-32,w:16,h:16},{x:690,y:GY-14,w:18,h:14},{x:1000,y:GY-20,w:20,h:20},{x:1380,y:GY-14,w:18,h:14},{x:1695,y:GY-20,w:20,h:20}];

/* ---------- pixel gears ---------- */
function gearFrames(size,z,c,hole,frames,spokes){
  const out=[],R0=size*.34,h=size*.1,cx=size/2;
  for(let f=0;f<frames;f++){
    const rot=f/frames*TAU/z,cc=document.createElement('canvas');cc.width=cc.height=size;const x=cc.getContext('2d');x.fillStyle=c;
    for(let py=0;py<size;py++)for(let px=0;px<size;px++){
      const dx=px+.5-cx,dy=py+.5-cx,r=Math.hypot(dx,dy),a=Math.atan2(dy,dx),tooth=Math.cos(z*(a-rot))>.15?h:0;
      if(r<=R0+tooth&&r>hole){
        if(spokes&&r<R0*.74){const s=Math.abs(Math.sin(spokes*(a-rot)));if(s>.26)continue}
        x.fillRect(px,py,1,1);
      }
    }
    out.push(cc);
  }
  return out;
}
const G={
  big:gearFrames(64,12,PAL[13],3,8,3),bigN:gearFrames(64,12,PAL[14],3,8,3),
  mid:gearFrames(36,10,PAL[13],2,8,0),
  roof:gearFrames(28,8,PAL[4],2,8,0),
  cog:gearFrames(9,6,PAL[4],1,6,0),cogS:gearFrames(9,6,PAL[3],1,6,0),
  face:gearFrames(44,12,PAL[12],4,8,3),faceD:gearFrames(44,12,PAL[13],4,8,3)
};

/* ---------- state ---------- */
const pl={x:150,y:GY-14,vx:0,vy:0,dir:1,on:true,t:0};
(function(){const m=location.search.match(/[?&]at=(\w+)/);if(m){const st=ST.find(x=>x.id===m[1]);if(st){pl.x=st.x-5}}})();
let cam=0,time=0,near=-1,open=false,collected=0,best=+(store.get('tmm-cogs')||0),msg='',msgT=0,smoke=[],clouds=[{x:30,y:24,w:30},{x:140,y:40,w:24},{x:240,y:18,w:34},{x:90,y:60,w:18}];
cam=Math.max(0,Math.min(WW-LW,pl.x-LW/2));
const keys={l:0,r:0,j:0};let jumpLatch=false;
const stars=Array.from({length:50},()=>({x:Math.random()*LW,y:Math.random()*90,t:Math.random()*6}));
// deterministic skyline
const sky=[];(function(){let seed=7;const rnd=()=>(seed=(seed*9301+49297)%233280)/233280;let x=-10;while(x<1400){const w=18+Math.floor(rnd()*30),h=24+Math.floor(rnd()*50);sky.push({x:x,w:w,h:h,ch:rnd()<.45,win:Math.floor(rnd()*3)});x+=w+2+Math.floor(rnd()*6)}})();

/* ---------- drawing helpers ---------- */
const R=(x,y,w,h,c)=>{ctx.fillStyle=PAL[c];ctx.fillRect(Math.round(x),Math.round(y),w,h)};
const col=(d,n)=>night?n:d;
function text(s,x,y,c,size,align){ctx.font=(size||8)+'px "Press Start 2P",monospace';ctx.textAlign=align||'left';ctx.textBaseline='top';ctx.fillStyle=PAL[c];ctx.fillText(s,Math.round(x),Math.round(y))}
function drawSky(){
  const bands=night?[8,8,8,15,15,15,8,1]:[10,10,11,11,11,12,12,12];
  const bh=Math.ceil(GY/bands.length);bands.forEach((c,i)=>R(0,i*bh,LW,bh+1,c));
  if(night){stars.forEach(s=>{if(((time*2+s.t)|0)%7!==0)R(s.x,s.y,1,1,12)});R(268,18,10,10,12);R(271,16,4,2,12);R(271,28,4,2,12);R(266,21,2,4,12);R(266,21,2,4,12);R(274,20,3,6,15)}
  else{R(262,16,12,12,4);R(264,14,8,2,4);R(264,28,8,2,4);R(260,18,2,8,4);R(274,18,2,8,4)}
  clouds.forEach(c=>{const x=((c.x+time*(reduce?0:3)-cam*.08)%(LW+60)+LW+60)%(LW+60)-30;const cc=night?14:12;R(x,c.y,c.w,5,cc);R(x+4,c.y-3,c.w*.6|0,3,cc);R(x+c.w*.3,c.y+5,c.w*.5|0,2,cc)});
}
function drawFar(){
  const fr=(time*(reduce?0:6)|0)%8,g=night?G.bigN:G.big;
  [[40,GY-62,0],[150,GY-80,3],[260,GY-56,5],[350,GY-72,1],[470,GY-60,4]].forEach(p=>{const x=p[0]-cam*.2;if(x>-70&&x<LW+10)ctx.drawImage(g[(fr+p[2])%8],Math.round(x),Math.round(p[1]))});
}
function drawSkyline(){
  const c=night?15:14,w=night?4:13;
  sky.forEach(b=>{const x=b.x-cam*.4;if(x>LW||x+b.w<0)return;R(x,GY-b.h,b.w,b.h,c);
    if(b.ch){R(x+3,GY-b.h-12,5,12,c);R(x+2,GY-b.h-12,7,2,night?14:13)}
    for(let wy=GY-b.h+5;wy<GY-5;wy+=8)for(let wx=x+3;wx<x+b.w-3;wx+=6){if(night?((wx*7+wy*3)|0)%5<3:false)R(wx,wy,2,3,4);else if(!night)R(wx,wy,2,3,w)}});
  // smoke from a few chimneys
  smoke.forEach(s=>{const c2=night?14:12;R(s.x-cam*.4,s.y,s.r,s.r,c2)});
}
function drawGround(){
  R(0,GY,LW,LH-GY,col(14,15));R(0,GY,LW,2,col(13,14));
  for(let x=-(cam%16);x<LW;x+=16){R(x,GY+2,1,LH-GY,col(13,14))}
  R(0,GY+10,LW,1,col(13,14));
  // conveyor strips between stations
  [[170,260],[560,700],[890,1040],[1260,1420],[1620,1760],[1930,2150]].forEach(c=>{const x0=c[0]-cam,x1=c[1]-cam;if(x1<0||x0>LW)return;
    R(x0,GY+12,x1-x0,6,col(15,1));for(let x=x0-((time*(reduce?0:30))%12);x<x1;x+=12){if(x>x0)R(x,GY+14,6,2,col(4,3))}R(x0,GY+18,x1-x0,2,col(14,15))});
}
function drawStation(s,i){
  const x=s.x-cam-s.w/2,y=GY-s.h;if(x>LW||x+s.w<-10)return;
  const body=col(13,14),dark=col(14,15),A=s.col[0],B=s.col[1];
  const lit=(wx,wy)=>R(wx,wy,5,6,night?4:11);
  if(s.id==='students'){
    R(x,y+14,s.w,s.h-14,col(12,13));R(x-4,y+8,s.w+8,8,A);R(x+2,y,s.w-4,8,B);R(x+s.w/2-2,y-14,2,14,1);R(x+s.w/2,y-14,10,6,2);
    for(let k=0;k<4;k++){lit(x+8+k*22,y+26);lit(x+8+k*22,y+44)}
  }else if(s.id==='research'){
    R(x+10,y+22,s.w-20,s.h-22,col(13,14));R(x,y+10,s.w,14,A);R(x+s.w/2-1,y-18,2,28,1);
    const fr=(time*(reduce?0:8)|0)%8;ctx.drawImage(G.roof[fr],Math.round(x+s.w/2-14),Math.round(y-12));
    if(((time*2)|0)%2===0||reduce)R(x+s.w/2-1,y-22,3,3,2);
    for(let k=0;k<4;k++){lit(x+16,y+30+k*16);lit(x+s.w-23,y+30+k*16)}
  }else if(s.id==='business'){
    R(x,y+16,s.w,s.h-16,col(13,14));
    for(let k=0;k<3;k++){R(x+k*40,y+8,40,10,A);R(x+k*40,y+4,20,6,A)}
    R(x+16,y-14,10,22,dark);R(x+14,y-14,14,3,col(14,15));R(x+80,y-6,10,14,dark);
    for(let k=0;k<5;k++){lit(x+10+k*20,y+30)}
    R(x+s.w-30,y+48,24,22,B);
  }else if(s.id==='lab'){
    R(x,y+10,s.w,s.h-10,col(1,15));R(x-2,y+6,s.w+4,6,A);
    const fr=(time*(reduce?0:10)|0)%8;ctx.drawImage(G.roof[fr],Math.round(x+8),Math.round(y+16));ctx.drawImage(G.roof[(8-fr)%8],Math.round(x+s.w-36),Math.round(y+26));
    R(x+s.w/2-3,y+50,8,s.h-50,0);
  }else if(s.id==='history'){
    R(x,y+24,s.w,s.h-24,col(13,14));R(x+6,y,s.w-12,28,B);R(x+s.w/2-1,y-14,2,14,2);R(x+s.w/2-12,y+2,24,2,A);
    // clock with real time
    ctx.drawImage((night?G.faceD:G.face)[0],Math.round(x+s.w/2-22),Math.round(y+30-8));
    const d=new Date(),mm=d.getMinutes()+d.getSeconds()/60,hh=(d.getHours()%12)+mm/60,cx=x+s.w/2,cy=y+30+14;
    ctx.strokeStyle=PAL[0];ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(cx+Math.sin(mm/60*TAU)*11,cy-Math.cos(mm/60*TAU)*11);ctx.stroke();
    ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(cx+Math.sin(hh/12*TAU)*7,cy-Math.cos(hh/12*TAU)*7);ctx.stroke();
    lit(x+s.w/2-3,y+82);
  }else if(s.id==='contacts'){
    R(x,y+10,s.w,s.h-10,col(12,13));R(x-3,y+4,s.w+6,8,A);R(x+8,y+22,s.w-16,6,B);
    R(x+s.w-16,y+30,10,s.h-30,2);R(x+s.w-18,y+28,14,4,2);R(x+s.w-12,y+36,2,6,0);
    lit(x+14,y+34);
  }
  // door
  R(x+s.w/2-5,GY-18,10,18,col(15,0));R(x+s.w/2-5,GY-18,10,2,4);
  // sign
  const sw=Math.max(34,s.sign.length*8+8);R(x+s.w/2-sw/2,y-2+ (s.id==='research'||s.id==='history'?24:12),sw,12,0);R(x+s.w/2-sw/2+1,y-1+(s.id==='research'||s.id==='history'?24:12),sw-2,10,15);
  text(s.sign,x+s.w/2,y+0+(s.id==='research'||s.id==='history'?26:14),4,6,'center');
}
function drawCrates(){crates.forEach(c=>{const x=c.x-cam;if(x>LW||x<-30)return;R(x,c.y,c.w,c.h,col(3,2));R(x,c.y,c.w,2,col(4,3));R(x,c.y,2,c.h,col(2,1));R(x+c.w-2,c.y,2,c.h,col(2,1));R(x+2,c.y+c.h/2-1,c.w-4,2,col(2,1))})}
function drawCogs(){cogs.forEach(c=>{if(c.got)return;const x=c.x-cam,y=c.y+Math.sin(time*3+c.ph)*2;if(x<-10||x>LW+10)return;ctx.drawImage((night?G.cogS:G.cog)[(time*(reduce?0:8)+c.ph|0)%6],Math.round(x-4),Math.round(y-4))})}
function drawSign(){ // welcome signpost
  const x=70-cam;if(x<-40||x>LW)return;R(x+10,GY-32,3,32,col(3,2));R(x,GY-38,26,12,col(4,3));R(x+1,GY-37,24,10,col(3,2));text('>',x+13,GY-35,4,8,'center')
}
function drawPlayer(){
  const x=Math.round(pl.x-cam),y=Math.round(pl.y),f=pl.on&&Math.abs(pl.vx)>6?((pl.t*10)|0)%2:0,d=pl.dir;
  const px=(ox,w)=>d>0?x+ox:x+10-ox-w;
  R(px(2,6),y,6,3,3);R(px(1,8),y+2,8,1,3);R(px(3,4),y+3,4,3,4);R(px(d>0?6:3,1),y+4,1,1,0);
  R(px(2,6),y+6,6,5,9);R(px(3,4),y+7,4,4,8);R(px(d>0?7:0,3),y+7,3,2,4);R(px(d>0?9:-2,3),y+6,1,1,13);
  if(!pl.on){R(px(1,3),y+11,3,3,0);R(px(6,3),y+10,3,3,0)}
  else if(f===0){R(px(2,3),y+11,3,3,0);R(px(5,3),y+11,3,3,0)}else{R(px(1,3),y+11,3,3,0);R(px(6,3),y+10,3,3,0)}
}
function drawHud(){
  if(msgT>0){const w=Math.min(LW-20,msg.length*5+10);R((LW-w)/2,10,w,14,0);R((LW-w)/2+1,11,w-2,12,15);text(msg,LW/2,14,4,5,'center')}
  if(near>=0&&!open){const s=ST[near],x=s.x-cam,w=64;R(x-w/2,GY-34-(s.h>90?0:0)-0,0,0,0);const by=GY-24;R(x-w/2,by-14,w,14,0);R(x-w/2+1,by-13,w-2,12,12);text(L('E ВЛЕЗ','E ENTER'),x,by-10,0,6,'center');R(x-2,by,4,3,0)}
}

/* ---------- logic ---------- */
function solidTop(px,py,pw,vy){ // land on crates from above
  for(const c of crates){if(px+pw>c.x&&px<c.x+c.w&&py<=c.y&&py+vy>=c.y-.01)return c.y}
  return null;
}
function update(dt){
  time+=dt;pl.t+=dt;
  if(msgT>0)msgT-=dt;
  // smoke
  if(!reduce&&Math.random()<dt*5){const ch=sky.filter(b=>b.ch)[(Math.random()*8)|0];if(ch)smoke.push({x:ch.x+5,y:GY-ch.h-12,r:2,t:0})}
  smoke.forEach(s=>{s.t+=dt;s.y-=dt*10;s.x+=dt*3;s.r=2+s.t*2|0});smoke=smoke.filter(s=>s.t<3);
  if(open)return;
  const sp=62,ax=360;let want=(keys.r-keys.l)*sp;
  pl.vx+=Math.max(-ax*dt,Math.min(ax*dt,want-pl.vx));
  if(want!==0)pl.dir=want>0?1:-1;
  if((keys.j||jumpLatch)&&pl.on){pl.vy=-150;pl.on=false;jumpLatch=false}
  pl.vy+=480*dt;
  const nx=pl.x+pl.vx*dt;pl.x=Math.max(8,Math.min(WW-18,nx));
  const ny=pl.y+pl.vy*dt;
  let land=null;if(pl.vy>=0)land=solidTop(pl.x+1,pl.y+14,8,ny-pl.y);
  if(land!==null){pl.y=land-14;pl.vy=0;pl.on=true}
  else if(ny>=GY-14){pl.y=GY-14;pl.vy=0;pl.on=true}
  else{pl.y=ny;pl.on=false}
  // cogs
  cogs.forEach(c=>{if(!c.got&&Math.abs(c.x-(pl.x+5))<9&&Math.abs(c.y-(pl.y+7))<12){c.got=true;collected++;say(L('Зъбно колело ','Cog ')+collected+'/'+cogs.length);hud();if(collected===cogs.length)win()}});
  // nearest station
  near=-1;ST.forEach((s,i)=>{if(Math.abs(s.x-(pl.x+5))<s.w/2-6&&pl.on)near=i});
  const target=Math.max(0,Math.min(WW-LW,pl.x-LW/2+pl.dir*14));cam+=(target-cam)*Math.min(1,dt*5);
}
function say(m){msg=m;msgT=2.2}
function win(){
  best=Math.max(best,collected);store.set('tmm-cogs',best);
  openDlg({t:L('Всички зъбни колела!','All the cogs!'),d:L('Браво — събрахте и десетте. Две колела в зацепване се въртят в противоположни посоки, а отношението на оборотите им е обратно на отношението на зъбите им. Пробвайте го в лабораторията.','Well done — you collected all ten. Two meshing gears turn in opposite directions, and the ratio of their speeds is the inverse of the ratio of their teeth. Try it in the lab.'),href:L('lab.html','lab.html')});
}
function frame(now){
  requestAnimationFrame(frame);
  const dt=Math.min((now-last)/1000,.05);last=now;
  if(vis){update(dt);render()}
}
function render(){
  ctx.clearRect(0,0,LW,LH);
  drawSky();drawFar();drawSkyline();drawGround();drawSign();
  ST.forEach((s,i)=>drawStation(s,i));
  drawCrates();drawCogs();drawPlayer();drawHud();
  // end-of-world arrows hint
  if(!reduce&&pl.x<110&&time<12)text('>',LW-14,GY-70+Math.sin(time*6)*2,4,10,'center');
}
let last=performance.now(),vis=true;
new IntersectionObserver(es=>{vis=es[0].isIntersecting;last=performance.now()}).observe(root);

/* ---------- dialog ---------- */
const dlg=$('.gdlg',root),dT=$('.gdlg-t',dlg),dD=$('.gdlg-d',dlg),dA=$('.gdlg-go',dlg),dX=$('.gdlg-x',dlg);
let lastFocus=null;
function openDlg(s){open=true;lastFocus=document.activeElement;dT.textContent=s.t;dD.textContent=s.d;if(s.href){dA.href=s.href;dA.hidden=false}else dA.hidden=true;dlg.hidden=false;dX.focus();keys.l=keys.r=0}
function closeDlg(){open=false;dlg.hidden=true;if(lastFocus&&lastFocus.focus)lastFocus.focus();else cv.focus()}
dX.addEventListener('click',closeDlg);
dlg.addEventListener('click',e=>{if(e.target===dlg)closeDlg()});
function enter(){if(open)return;if(near>=0)openDlg(ST[near]);else if(pl.x<200)openDlg(WELCOME)}
cv.addEventListener('click',e=>{const r=cv.getBoundingClientRect(),lx=(e.clientX-r.left)/r.width*LW+cam;ST.forEach((s,i)=>{if(Math.abs(lx-s.x)<s.w/2){if(Math.abs(s.x-(pl.x+5))<s.w/2+10)openDlg(s);else{say(L('Приближете се до сградата','Walk up to the building'))}}})});

/* ---------- input ---------- */
const K={ArrowLeft:'l',a:'l',A:'l',ArrowRight:'r',d:'r',D:'r'};
addEventListener('keydown',e=>{
  if(open){if(e.key==='Escape'||e.key==='e'||e.key==='E'){closeDlg();e.preventDefault()}return}
  if(!vis&&document.activeElement!==cv)return;
  const tag=(document.activeElement||{}).tagName;if(/INPUT|TEXTAREA|SELECT/.test(tag))return;
  if(K[e.key]){keys[K[e.key]]=1;e.preventDefault()}
  else if(e.key===' '||e.key==='ArrowUp'||e.key==='w'||e.key==='W'){if(vis&&(document.activeElement===cv||tag!=='BUTTON'&&tag!=='A')){keys.j=1;e.preventDefault()}}
  else if(e.key==='e'||e.key==='E'||(e.key==='Enter'&&document.activeElement===cv)){if(vis){enter();e.preventDefault()}}
});
addEventListener('keyup',e=>{if(K[e.key])keys[K[e.key]]=0;if(e.key===' '||e.key==='ArrowUp'||e.key==='w'||e.key==='W')keys.j=0});
addEventListener('blur',()=>{keys.l=keys.r=keys.j=0});
$$('[data-pad]',root).forEach(b=>{
  const k=b.dataset.pad,on=e=>{e.preventDefault();if(k==='e'){enter();return}if(k==='j')jumpLatch=true;keys[k]=1;b.classList.add('down')},off=e=>{e.preventDefault();if(k!=='e'&&k!=='j')keys[k]=0;if(k==='j')keys.j=0;b.classList.remove('down')};
  b.addEventListener('pointerdown',on);b.addEventListener('pointerup',off);b.addEventListener('pointerleave',off);b.addEventListener('pointercancel',off);
});
const tg=$('[data-act=night]',root);function syncNight(){tg.textContent=night?L('Ден','Day'):L('Нощ','Night');tg.setAttribute('aria-pressed',night)}
tg.addEventListener('click',()=>{night=!night;store.set('tmm-night',night?'1':'0');syncNight()});syncNight();
function hud(){$('[data-o=cogs]',root).textContent=collected+' / '+cogs.length;$('[data-o=best]',root).textContent=best}
hud();
$('[data-act=help]',root).addEventListener('click',()=>openDlg(WELCOME));
cv.addEventListener('pointerdown',()=>{try{cv.focus({preventScroll:true})}catch(e){}});

/* ---------- start (wait for the pixel font) ---------- */
function go(){requestAnimationFrame(t=>{last=t;frame(t)})}
if(document.fonts&&document.fonts.load){Promise.race([document.fonts.load('8px "Press Start 2P"'),new Promise(r=>setTimeout(r,1500))]).then(go,go)}else go();
})();
