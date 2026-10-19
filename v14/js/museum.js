/* v14: Museum of Mechanisms — a scroll-driven 3D flythrough (three.js r149) */
(function(){
'use strict';
const root=document.getElementById('museum');if(!root)return;
const EN=document.documentElement.lang==='en';
const reduce=matchMedia('(prefers-reduced-motion:reduce)').matches;
const $=(s,r)=>(r||document).querySelector(s),$$=(s,r)=>[...(r||document).querySelectorAll(s)];
function fail(){root.classList.add('no3d')}
function boot(){
  if(!window.THREE){fail();return}
  const T=window.THREE,TAU=Math.PI*2,PI=Math.PI;
  const canvas=$('#mcv'),stage=$('.m-stage',root);
  let renderer;
  try{renderer=new T.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'})}catch(e){fail();return}
  renderer.outputEncoding=T.sRGBEncoding;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;
  const scene=new T.Scene();scene.background=new T.Color(0x050b1a);scene.fog=new T.FogExp2(0x050b1a,.028);
  const camera=new T.PerspectiveCamera(42,1,.1,200);

  /* environment: a painted studio with soft boxes, turned into reflections */
  (function(){
    const c=document.createElement('canvas');c.width=1024;c.height=512;const x=c.getContext('2d');
    const g=x.createLinearGradient(0,0,0,512);g.addColorStop(0,'#2a3f78');g.addColorStop(.5,'#16254a');g.addColorStop(1,'#3a260c');x.fillStyle=g;x.fillRect(0,0,1024,512);
    const box=(px,py,w,h,col)=>{const gg=x.createRadialGradient(px+w/2,py+h/2,2,px+w/2,py+h/2,Math.max(w,h)*.7);gg.addColorStop(0,col);gg.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=gg;x.fillRect(px-w,py-h,w*3,h*3)};
    box(80,50,220,90,'#ffffff');box(520,30,260,80,'#fff0d0');box(880,100,160,140,'#b5d0ff');box(330,190,130,70,'#ffc070');box(700,220,200,60,'#ffffff');box(220,330,200,40,'#ffe0b0');
    const tx=new T.CanvasTexture(c);tx.mapping=T.EquirectangularReflectionMapping;tx.encoding=T.sRGBEncoding;
    const pm=new T.PMREMGenerator(renderer);scene.environment=pm.fromEquirectangular(tx).texture;tx.dispose();pm.dispose();
  })();
  scene.add(new T.HemisphereLight(0x9db4ff,0x2a1a08,.55));const key=new T.DirectionalLight(0xffe6c0,1.1);key.position.set(-6,8,10);scene.add(key);const fill=new T.DirectionalLight(0x8fb0ff,.45);fill.position.set(8,4,6);scene.add(fill);

  const M={
    brass:new T.MeshStandardMaterial({color:0xe3b45a,metalness:1,roughness:.26,envMapIntensity:1.9}),
    steel:new T.MeshStandardMaterial({color:0xdde3ec,metalness:1,roughness:.3,envMapIntensity:1.9}),
    dark:new T.MeshStandardMaterial({color:0x1b2338,metalness:.75,roughness:.45}),
    plate:new T.MeshStandardMaterial({color:0x0f1830,metalness:.6,roughness:.55}),
    amber:new T.MeshBasicMaterial({color:0xe0a43a}),
    glass:new T.MeshStandardMaterial({color:0x7fb0ff,metalness:.2,roughness:.1,transparent:true,opacity:.14,side:T.DoubleSide}),
    floor:new T.MeshStandardMaterial({color:0x0a1226,metalness:.8,roughness:.28})
  };

  /* ---------- hall ---------- */
  const NEX=6,GAP=10;
  const floor=new T.Mesh(new T.PlaneGeometry(160,40),M.floor);floor.rotation.x=-PI/2;floor.position.set(25,-.01,0);scene.add(floor);
  const grid=new T.GridHelper(160,160,0x1a2a58,0x0e1836);grid.position.set(25,0,0);grid.material.transparent=true;grid.material.opacity=.45;scene.add(grid);
  const wall=new T.Mesh(new T.PlaneGeometry(160,18),new T.MeshStandardMaterial({color:0x070f22,metalness:.4,roughness:.8}));wall.position.set(25,9,-9.5);scene.add(wall);
  for(let i=0;i<9;i++){const s=new T.Mesh(new T.BoxGeometry(.06,12,.06),M.amber);s.position.set(-8+i*GAP*.75,7,-9.4);scene.add(s)}
  const lights=[];

  /* ---------- geometry helpers ---------- */
  function teeth(z,rootR,tipR){const al=TAU/z,p=[];for(let i=0;i<z;i++){const c=i*al;[[rootR,c-.30*al],[tipR,c-.14*al],[tipR,c+.14*al],[rootR,c+.30*al]].forEach(q=>p.push(new T.Vector2(q[0]*Math.cos(q[1]),q[0]*Math.sin(q[1]))))}return p}
  function gearMesh(z,m,thick,mat,opt){
    opt=opt||{};const r=z*m/2,sh=new T.Shape();
    if(opt.internal){
      sh.absarc(0,0,opt.outer,0,TAU,false);
      const hp=new T.Path(teeth(z,r+1.25*m,r-m));sh.holes.push(hp);
    }else{
      sh.setFromPoints(teeth(z,r-1.25*m,r+m));
      const hr=opt.hole!=null?opt.hole:r*.16;const h=new T.Path();h.absarc(0,0,hr,0,TAU,true);sh.holes.push(h);
      if(z>=22){for(let k=0;k<5;k++){const a=k/5*TAU,hh=new T.Path();hh.absarc(Math.cos(a)*r*.56,Math.sin(a)*r*.56,r*.17,0,TAU,true);sh.holes.push(hh)}}
    }
    const g=new T.ExtrudeGeometry(sh,{depth:thick,bevelEnabled:true,bevelSize:m*.12,bevelThickness:m*.12,bevelSegments:1,curveSegments:10});
    g.translate(0,0,-thick/2);const mesh=new T.Mesh(g,mat);mesh.userData={z,r,al:TAU/z};return mesh;
  }
  const childPhase=(pPhi,pAl,th,cAl)=>th+PI-cAl*(.5-(th-pPhi)/pAl);
  function cyl(r,len,mat,seg){const g=new T.Mesh(new T.CylinderGeometry(r,r,len,seg||24),mat);g.rotation.x=PI/2;return g}
  function bar(len,w,d,mat){const g=new T.Mesh(new T.CapsuleGeometry(w/2,len,4,14),mat);g.rotation.z=PI/2;g.scale.z=d/w;return g}
  function rod(len,r,mat){const g=new T.CapsuleGeometry(r,len,4,14);g.rotateZ(-PI/2);g.translate(len/2,0,0);return new T.Mesh(g,mat)}
  function place(b,p,q,z){b.position.set((p[0]+q[0])/2,(p[1]+q[1])/2,z||0);b.rotation.z=Math.atan2(q[1]-p[1],q[0]-p[0])}
  function backplate(w,h){const b=new T.Mesh(new T.BoxGeometry(w,h,.14),M.plate);b.position.z=-.62;
    const rim=new T.Mesh(new T.BoxGeometry(w+.1,.05,.18),M.amber);rim.position.set(0,h/2,-.6);const g=new T.Group();g.add(b,rim);return g}
  function pin(g,x,y,z,r){const p=cyl(r||.13,.7,M.brass,16);p.position.set(x,y,z||0);g.add(p);return p}

  /* ---------- exhibits ---------- */
  const EX=[];
  function addEx(def){def.group=new T.Group();def.group.position.set(def.i*GAP,2.4,0);def.root=new T.Group();def.group.add(def.root);scene.add(def.group);EX.push(def);
    const ped=new T.Mesh(new T.CylinderGeometry(2.6,3,.5,48),M.dark);ped.position.set(def.i*GAP,.25,0);scene.add(ped);
    const ring=new T.Mesh(new T.TorusGeometry(2.62,.03,8,64),M.amber);ring.rotation.x=PI/2;ring.position.set(def.i*GAP,.52,0);scene.add(ring);
    const sp=new T.SpotLight(0xffe2b0,3.2,30,.55,.8,1.2);sp.position.set(def.i*GAP+2,11,6);sp.target.position.set(def.i*GAP,2.2,0);scene.add(sp,sp.target);lights.push(sp);
    const rim=new T.PointLight(0x7aa2ff,.9,14);rim.position.set(def.i*GAP-3,4,-4);scene.add(rim);
    return def}

  /* 1 gears */
  (function(){
    const m=.14,th=.34,e=addEx({i:0}),R=e.root;
    R.add(backplate(8.4,4.8));
    const g1=gearMesh(16,m,th,M.brass),g2=gearMesh(32,m,th,M.steel),g3=gearMesh(12,m,th,M.brass);
    const r1=g1.userData.r,r2=g2.userData.r,r3=g3.userData.r;
    const x1=-r2/2-.2;g1.position.set(x1-.0,-.0,0);g2.position.set(x1+r1+r2,0,0);
    const t3=3.75,c1=g1.position;g3.position.set(c1.x+(r1+r3)*Math.cos(t3),c1.y+(r1+r3)*Math.sin(t3),0);
    [g1,g2,g3].forEach(g=>{R.add(g);const p=cyl(.14,.9,M.dark,16);p.position.copy(g.position);R.add(p)});
    R.position.x=-.3;
    e.update=t=>{const p1=t*.8,p2=childPhase(p1,g1.userData.al,0,g2.userData.al),p3=childPhase(p1,g1.userData.al,t3,g3.userData.al);g1.rotation.z=p1;g2.rotation.z=p2;g3.rotation.z=p3};
  })();

  /* 2 four-bar */
  (function(){
    const e=addEx({i:1}),R=e.root,P={a:1.05,b:3.0,c:2.3,d:3.2};
    R.add(backplate(8.4,4.8));
    function solve(th){const ax=P.a*Math.cos(th),ay=P.a*Math.sin(th),dx=P.d-ax,dy=-ay,L=Math.hypot(dx,dy);if(L>P.b+P.c||L<Math.abs(P.b-P.c))return null;
      const x=(P.b*P.b-P.c*P.c+L*L)/(2*L),h=Math.sqrt(Math.max(0,P.b*P.b-x*x)),ux=dx/L,uy=dy/L;const bx=ax+x*ux-h*uy,by=ay+x*uy+h*ux,vx=bx-ax,vy=by-ay;
      return{A:[ax,ay],B:[bx,by],C:[ax+.5*vx-.62*vy,ay+.5*vy+.62*vx]}}
    const off=[-P.d/2,-.9],O2=[0,0],O4=[P.d,0];
    const w=new T.Group();w.position.set(off[0],off[1],0);R.add(w);
    const crank=rod(P.a,.17,M.brass),rocker=rod(P.c,.17,M.brass);
    const tri=new T.Shape();tri.moveTo(0,0);tri.lineTo(P.b,0);tri.lineTo(P.b*.5,P.b*.62);tri.closePath();
    const coup=new T.Mesh(new T.ExtrudeGeometry(tri,{depth:.18,bevelEnabled:true,bevelSize:.05,bevelThickness:.04,bevelSegments:1}),M.steel);coup.position.z=.12;
    const link=rod(P.b,.1,M.steel);link.position.z=.4;
    w.add(crank,rocker,coup);
    const basebar=rod(P.d,.15,M.dark);basebar.position.z=-.35;w.add(basebar);
    [O2,O4].forEach(o=>{pin(w,o[0],o[1],0,.2)});
    const pa=pin(w,0,0,.2,.15),pb=pin(w,0,0,.2,.15),pc=new T.Mesh(new T.SphereGeometry(.16,16,12),M.amber);w.add(pc);
    const pts=[];for(let i=0;i<=200;i++){const s=solve(i/200*TAU);if(s)pts.push(new T.Vector3(s.C[0],s.C[1],.4))}
    w.add(new T.Line(new T.BufferGeometry().setFromPoints(pts),new T.LineBasicMaterial({color:0xe0a43a})));
    e.update=t=>{const s=solve(t*.9);if(!s)return;
      crank.rotation.z=t*.9;rocker.position.set(O4[0],O4[1],0);rocker.rotation.z=Math.atan2(s.B[1]-O4[1],s.B[0]-O4[0]);
      coup.position.set(s.A[0],s.A[1],.12);coup.rotation.z=Math.atan2(s.B[1]-s.A[1],s.B[0]-s.A[0]);
      pa.position.set(s.A[0],s.A[1],.2);pb.position.set(s.B[0],s.B[1],.2);pc.position.set(s.C[0],s.C[1],.42)};
    e.update(0);
  })();

  /* 3 slider-crank */
  (function(){
    const e=addEx({i:2}),R=e.root,r=1.15,L=3.5;
    R.add(backplate(8.4,4.8));
    const w=new T.Group();w.position.set(-3.6,0,0);R.add(w);
    const crank=new T.Group(),arm=rod(r,.18,M.brass);crank.add(arm);
    const cw=new T.Mesh(new T.CylinderGeometry(.6,.6,.3,32),M.steel);cw.rotation.x=PI/2;cw.position.set(-.55,0,0);crank.add(cw);
    w.add(crank);pin(w,0,0,0,.2);
    const rd=rod(L,.14,M.steel);rd.position.z=.22;w.add(rd);
    const piston=new T.Mesh(new T.BoxGeometry(1.1,1.3,.9),M.brass);w.add(piston);
    const pp=pin(w,0,0,.2,.12),pr=pin(w,0,0,.2,.15);
    const cylG=new T.Mesh(new T.BoxGeometry(5.1,1.6,1.2),M.glass);cylG.position.set(L-r+2.55-.1,0,0);w.add(cylG);
    const edges=new T.LineSegments(new T.EdgesGeometry(cylG.geometry),new T.LineBasicMaterial({color:0x8fb4ff,transparent:true,opacity:.7}));edges.position.copy(cylG.position);w.add(edges);
    e.update=t=>{const th=t*1.1,cx=r*Math.cos(th),cy=r*Math.sin(th),px=cx+Math.sqrt(L*L-(r*Math.sin(th))**2);
      crank.rotation.z=th;pp.position.set(cx,cy,.25);pr.position.set(px,0,.25);piston.position.set(px+.55,0,0);
      rd.position.set(cx,cy,.22);rd.rotation.z=Math.atan2(-cy,px-cx)};
  })();

  /* 4 cam */
  (function(){
    const e=addEx({i:3}),R=e.root,r0=1.0,h=.8;
    R.add(backplate(8.4,4.8));
    const f={har:x=>.5*(1-Math.cos(PI*x))};
    function s(deg){deg=((deg%360)+360)%360;if(deg<120)return h*f.har(deg/120);if(deg<180)return h;if(deg<300)return h*(1-f.har((deg-180)/120));return 0}
    const sh=new T.Shape();for(let a=0;a<360;a+=2){const rr=r0+s(a-90),x=rr*Math.cos(a*PI/180),y=rr*Math.sin(a*PI/180);a?sh.lineTo(x,y):sh.moveTo(x,y)}sh.closePath();
    const hole=new T.Path();hole.absarc(0,0,.22,0,TAU,true);sh.holes.push(hole);
    const gm=new T.ExtrudeGeometry(sh,{depth:.5,bevelEnabled:true,bevelSize:.05,bevelThickness:.05,bevelSegments:1,curveSegments:6});gm.translate(0,0,-.25);
    const cam=new T.Mesh(gm,M.brass);const cg=new T.Group();cg.add(cam);cg.position.y=-1.2;R.add(cg);
    const sh2=cyl(.16,.9,M.steel,16);sh2.position.set(0,-1.2,0);R.add(sh2);
    const fol=new T.Group();R.add(fol);
    const stem=new T.Mesh(new T.CylinderGeometry(.14,.14,1.5,20),M.steel);stem.position.y=.7;fol.add(stem);
    const roller=cyl(.26,.4,M.dark,28);fol.add(roller);const rp=cyl(.07,.55,M.amber,10);fol.add(rp);
    const guide=new T.Mesh(new T.BoxGeometry(.7,1.0,.6),M.dark);guide.position.set(0,1.5,-.1);R.add(guide);
    e.update=t=>{const phi=(t*55)%360,sv=s(phi);cg.rotation.z=-phi*PI/180;fol.position.set(0,-1.2+r0+sv+.26,0)};
  })();

  /* 5 planetary */
  (function(){
    const e=addEx({i:4}),R=e.root,m=.09,th=.3;
    R.add(backplate(8.4,4.8));
    const sun=gearMesh(12,m,th,M.brass,{hole:.12}),planets=[0,1,2].map(()=>gearMesh(12,m,th,M.steel,{hole:.1})),ring=gearMesh(36,m,th,M.dark,{internal:true,outer:2.2});
    const rs=sun.userData.r,rp=planets[0].userData.r,asn=sun.userData.al,ap=planets[0].userData.al,ar=ring.userData.al;
    const a0=childPhase(0,asn,0,ap);const fpl=(0-a0)/ap;ring.rotation.z=0-ar*(fpl+.5);
    R.add(sun,ring,...planets);
    const car=new T.Group();[0,1,2].forEach(i=>{const b=rod(rs+rp,.07,M.amber);b.position.set(0,0,-.3);const gg=new T.Group();gg.add(b);gg.rotation.z=i*TAU/3;car.add(gg)});R.add(car);
    const hub=cyl(.18,.9,M.dark,16);R.add(hub);
    e.update=t=>{const ps=t*.9,pc=ps*12/48;car.rotation.z=pc;sun.rotation.z=ps;
      planets.forEach((p,i)=>{const th0=pc+i*TAU/3;p.position.set((rs+rp)*Math.cos(th0),(rs+rp)*Math.sin(th0),0);p.rotation.z=childPhase(ps,asn,th0,ap)})};
  })();

  /* 6 Geneva drive */
  (function(){
    const e=addEx({i:5}),R=e.root,n=4,ac=2.5,r1=ac*Math.sin(PI/n),Rw=ac*Math.cos(PI/n)-.02,wd=.15,ri=ac-r1-.18;
    R.add(backplate(8.4,4.8));
    function wheelShape(){const sh=new T.Shape(),pts=[],dl=Math.asin(wd/Rw);
      for(let j=0;j<n;j++){const a=j*TAU/n,u=[Math.cos(a),Math.sin(a)],nn=[-Math.sin(a),Math.cos(a)],q=(rad,off)=>new T.Vector2(u[0]*rad+nn[0]*off,u[1]*rad+nn[1]*off);
        const a2=(j+1)*TAU/n;
        // arc from slot j (leaving) to slot j+1 (arriving)
        const s0=a+dl,s1=a2-dl;for(let k=0;k<=10;k++){const aa=s0+(s1-s0)*k/10;pts.push(new T.Vector2(Rw*Math.cos(aa),Rw*Math.sin(aa)))}
        const u2=[Math.cos(a2),Math.sin(a2)],n2=[-Math.sin(a2),Math.cos(a2)],q2=(rad,off)=>new T.Vector2(u2[0]*rad+n2[0]*off,u2[1]*rad+n2[1]*off);
        pts.push(q2(Rw*Math.cos(dl),-wd),q2(ri,-wd),q2(ri,wd),q2(Rw*Math.cos(dl),wd));}
      sh.setFromPoints(pts);const hh=new T.Path();hh.absarc(0,0,.2,0,TAU,true);sh.holes.push(hh);return sh}
    const wm=new T.Mesh(new T.ExtrudeGeometry(wheelShape(),{depth:.26,bevelEnabled:true,bevelSize:.04,bevelThickness:.04,bevelSegments:1,curveSegments:6}),M.steel);
    const wg=new T.Group();wg.add(wm);wg.position.set(ac/2,0,0);R.add(wg);
    const dg=new T.Group();dg.position.set(-ac/2,0,.55);R.add(dg);
    const darm=rod(r1,.14,M.brass);dg.add(darm);
    const dd=cyl(.5,.2,M.brass,32);dg.add(dd);const dpin=cyl(.1,.8,M.amber,12);dg.add(dpin);
    const back=cyl(.15,.9,M.dark,12);back.position.set(-ac/2,0,.1);R.add(back);
    let rot=0,init=false;
    e.update=t=>{const th=t*1.3,thL=Math.atan2(Math.sin(th),Math.cos(th));// driver angle from line of centres, wrapped
      const px=Math.cos(th)*r1,py=Math.sin(th)*r1;
      dpin.position.set(px,py,-.3);darm.rotation.z=th;
      // pin relative to wheel centre
      const wx=px-ac,wy=py;const ang=Math.atan2(wy,wx);const eng=Math.abs(thL)<PI/2-PI/n+1e-6;
      if(eng){const step=TAU/n;let a=ang;// nearest equivalent to previous rotation
        a=a+Math.round((rot-a)/step)*step;rot=a;init=true}
      wg.rotation.z=rot};
    // pin sits at +x towards the wheel when th=0
    dg.position.set(-ac/2,0,.55);wg.position.set(ac/2,0,0);
    R.position.x=-.6;
  })();

  /* ---------- camera path ---------- */
  const K=[];
  K.push({p:[-6,4.2,13],l:[0,2.2,0],w:1});
  EX.forEach((e,i)=>{const x=e.i*GAP,side=i%2?1:-1;K.push({p:[x+side*1.2,2.9,9.6],l:[x,2.4,0],ex:1})});
  K.push({p:[NEX*GAP-4,5,15],l:[NEX*GAP/2-3,2.2,0],w:1});
  const NK=K.length;
  const ease=u=>u*u*(3-2*u);
  const cam={p:new T.Vector3(),l:new T.Vector3()};
  function fr(k){
    const asp=camera.aspect||1.7,f=Math.pow(Math.min(2,Math.max(1,1.78/asp)),.8),p=k.p.slice(),l=k.l.slice();
    p[2]=p[2]*f;
    if(k.ex){if(asp>1.1)l[0]-=asp>1.6?2.2:1.1;else{l[1]-=1.0;p[1]+=.3}}
    return{p:p,l:l};
  }
  function pose(s){
    const i=Math.min(NK-2,Math.max(0,Math.floor(s))),f=s-i,t=ease(Math.min(1,Math.max(0,(f-.22)/.56)));
    const A=fr(K[i]),B=fr(K[i+1]);
    cam.p.set(A.p[0]+(B.p[0]-A.p[0])*t,A.p[1]+(B.p[1]-A.p[1])*t,A.p[2]+(B.p[2]-A.p[2])*t);
    cam.l.set(A.l[0]+(B.l[0]-A.l[0])*t,A.l[1]+(B.l[1]-A.l[1])*t,A.l[2]+(B.l[2]-A.l[2])*t);
  }

  /* ---------- interaction & loop ---------- */
  const cards=$$('.m-card',root),dots=$$('.m-dots button',root),prog=$('.m-prog i',root);
  let pr=0,smooth=0,mx=0,my=0,smx=0,smy=0,cur=-1,drag=false,lx=0,ly=0,vis=true,t0=performance.now();
  const rotT=[];EX.forEach(()=>rotT.push({y:0,x:0}));
  function size(){const w=stage.clientWidth,h=stage.clientHeight;renderer.setPixelRatio(Math.min(devicePixelRatio||1,innerWidth<700?1.5:2));renderer.setSize(w,h,false);camera.aspect=w/h;camera.fov=w/h<.8?58:42;camera.updateProjectionMatrix()}
  new ResizeObserver(size).observe(stage);size();
  function progress(){const r=root.getBoundingClientRect(),h=root.offsetHeight-innerHeight;pr=Math.min(1,Math.max(0,-r.top/Math.max(1,h)))}
  addEventListener('scroll',progress,{passive:true});progress();
  addEventListener('pointermove',e=>{mx=e.clientX/innerWidth-.5;my=e.clientY/innerHeight-.5;if(drag){const dx=e.clientX-lx,dy=e.clientY-ly;lx=e.clientX;ly=e.clientY;const k=cur>=0&&cur<NEX?rotT[cur]:null;if(k){k.y+=dx*.012;k.x=Math.max(-.6,Math.min(.6,k.x+dy*.008))}}});
  stage.addEventListener('pointerdown',e=>{if(e.target.closest('.m-card,.m-dots,a,button'))return;drag=true;lx=e.clientX;ly=e.clientY;stage.classList.add('drag')});
  addEventListener('pointerup',()=>{drag=false;stage.classList.remove('drag')});
  dots.forEach((d,i)=>d.addEventListener('click',()=>{const h=root.offsetHeight-innerHeight,s=(i+1)/(NK-1);scrollTo({top:root.offsetTop+h*s,behavior:reduce?'auto':'smooth'})}));
  new IntersectionObserver(es=>{vis=es[0].isIntersecting;if(vis)requestAnimationFrame(frame)}).observe(root);
  function show(i){
    const k=i===-2?0:i===-3?cards.length-1:i>=0?i+1:-1;
    cards.forEach((c,n)=>c.classList.toggle('on',n===k));dots.forEach((d,n)=>d.classList.toggle('on',n===i));
  }
  function frame(now){
    if(!vis)return;
    const t=(now-t0)/1000;smooth=/snap/.test(location.search)?pr:smooth+(pr-smooth)*.085;smx+=(mx-smx)*.05;smy+=(my-smy)*.05;
    const s=smooth*(NK-1);pose(s);
    camera.position.set(cam.p.x+smx*1.2,cam.p.y-smy*.6,cam.p.z);camera.lookAt(cam.l);
    const near=Math.round(s),idx=near>=1&&near<=NEX&&Math.abs(s-near)<.32?near-1:(near===0&&s<.4?-2:(near>NEX&&s>NK-1.6?-3:-1));
    if(idx!==cur){cur=idx;show(idx)}
    EX.forEach((e,i)=>{
      const d=Math.abs(e.i*GAP-camera.position.x);
      if(d<16){e.update(t);}
      const k=rotT[i];if(i!==cur||!drag){k.y*=.985;k.x*=.97}
      e.root.rotation.y+=(k.y-e.root.rotation.y)*.12;e.root.rotation.x+=(k.x-e.root.rotation.x)*.12;
    });
    if(prog)prog.style.transform='scaleX('+pr+')';
    renderer.render(scene,camera);
    requestAnimationFrame(frame);
  }
  root.classList.add('ready');
  if(reduce){EX.forEach(e=>e.update(1.2));pr=0;}
  requestAnimationFrame(frame);
}
/* three.js is loaded by a deferred <script>; wait for it */
let n=0;(function wait(){if(window.THREE)boot();else if(++n>80)fail();else setTimeout(wait,100)})();
})();
