/* Hero 3D: a real meshing gear train rendered with three.js (geometry, not imagery) */
(function(){
'use strict';
window.TMM=window.TMM||{};
const TAU=Math.PI*2;

window.TMM.hero3d=function(canvas,host){
  if(!window.THREE){canvas.style.display='none';return}
  const THREE=window.THREE;
  let renderer;
  try{renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true,powerPreference:'high-performance'})}
  catch(e){canvas.style.display='none';return}
  const reduce=matchMedia('(prefers-reduced-motion:reduce)').matches;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
  renderer.outputEncoding=THREE.sRGBEncoding;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure=.95;

  const scene=new THREE.Scene();
  const camera=new THREE.PerspectiveCamera(32,1,.1,200);
  camera.position.set(0,0,34);

  /* studio environment for metal reflections */
  const env=new THREE.Scene();env.background=new THREE.Color(0x07090d);
  const panel=(w,h,col,k,pos,look)=>{
    const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({color:new THREE.Color(col).multiplyScalar(k),side:THREE.DoubleSide}));
    m.position.set(...pos);m.lookAt(...look);env.add(m);
  };
  panel(40,14,0xffffff,5,[0,22,10],[0,0,0]);
  panel(14,40,0xdfe8ff,2.4,[-26,4,8],[0,0,0]);
  panel(8,40,0xff5a1f,5,[24,0,-6],[0,0,0]);
  panel(30,10,0x6a86ff,1.2,[0,-20,12],[0,0,0]);
  panel(40,40,0x1a1f2a,1,[0,0,-30],[0,0,0]);
  const pm=new THREE.PMREMGenerator(renderer);
  scene.environment=pm.fromScene(env,.03).texture;

  scene.add(new THREE.AmbientLight(0xffffff,.18));
  const key=new THREE.DirectionalLight(0xffffff,1.4);key.position.set(-10,16,22);scene.add(key);
  const rim=new THREE.PointLight(0xff5a1f,60,70,2);rim.position.set(18,-6,-8);scene.add(rim);

  /* materials: machined, concentric-brushed metal */
  function brushed(){
    const c=document.createElement('canvas');c.width=c.height=1024;const x=c.getContext('2d');
    x.fillStyle='#8a8a8a';x.fillRect(0,0,1024,1024);
    for(let i=0;i<160;i++){const r=Math.random()*520,v=Math.random()>.5?255:0;
      x.strokeStyle='rgba('+v+','+v+','+v+','+(.02+Math.random()*.06)+')';x.lineWidth=.6+Math.random()*1.4;x.beginPath();x.arc(512,512,r,0,TAU);x.stroke()}
    for(let r=60;r<520;r+=60){x.strokeStyle='rgba(0,0,0,.18)';x.lineWidth=2;x.beginPath();x.arc(512,512,r,0,TAU);x.stroke()}
    const t=new THREE.CanvasTexture(c);t.repeat.set(1/13,1/13);t.offset.set(.5,.5);t.anisotropy=8;return t;
  }
  const BR=brushed();
  const mk=(color,metal,rough,ei)=>new THREE.MeshStandardMaterial({color,metalness:metal,roughness:rough,envMapIntensity:ei,roughnessMap:BR});
  const MAT={
    graphite:mk(0x242b36,1,.62,1.3),
    steel:mk(0xd9e0ea,1,.5,1.2),
    orange:mk(0xff4a10,.85,.62,1.1),
    dark:new THREE.MeshStandardMaterial({color:0x10131a,metalness:.9,roughness:.5,envMapIntensity:.8})
  };

  /* gear geometry */
  const M=.25;
  function gearShape(z,bore,holes,holeAt,holeR){
    const r=z*M/2,hh=M*1.0,step=TAU/z,s=new THREE.Shape();let first=true;
    const pt=(a,rad)=>{const x=Math.cos(a)*rad,y=Math.sin(a)*rad;if(first){s.moveTo(x,y);first=false}else s.lineTo(x,y)};
    for(let i=0;i<z;i++){const a=i*step;
      pt(a-step*.28,r-hh);pt(a-step*.15,r+hh);pt(a+step*.15,r+hh);pt(a+step*.28,r-hh);pt(a+step*.39,r-hh);pt(a+step*.5,r-hh);
    }
    s.closePath();
    const hole=new THREE.Path();hole.absarc(0,0,bore,0,TAU,true);s.holes.push(hole);
    for(let k=0;k<holes;k++){const a=k*TAU/holes+TAU/holes/2,h=new THREE.Path();h.absarc(Math.cos(a)*r*holeAt,Math.sin(a)*r*holeAt,r*holeR,0,TAU,true);s.holes.push(h)}
    return s;
  }
  function makeGear(def){
    const r=def.z*M/2,bore=Math.max(r*.13,.2);
    const holes=def.holes||0;
    const shape=gearShape(def.z,bore,holes,.58,Math.min(.2,.9*Math.PI*.58/holes*.5||.2));
    const geo=new THREE.ExtrudeGeometry(shape,{depth:def.th,bevelEnabled:true,bevelThickness:.045,bevelSize:.03,bevelSegments:2,curveSegments:28});
    geo.translate(0,0,-def.th/2);
    const g=new THREE.Group();
    const body=new THREE.Mesh(geo,MAT[def.mat]);g.add(body);
    const hubGeo=new THREE.CylinderGeometry(bore*1.9,bore*1.9,def.th*1.5,40);hubGeo.rotateX(Math.PI/2);
    const hub=new THREE.Mesh(hubGeo,MAT.dark);g.add(hub);
    const capGeo=new THREE.CylinderGeometry(bore*.95,bore*.95,def.th*1.9,24);capGeo.rotateX(Math.PI/2);
    g.add(new THREE.Mesh(capGeo,MAT.steel));
    return g;
  }

  /* layout: each gear meshes with its parent */
  const defs=[
    {z:40,th:1.35,mat:'graphite',holes:9},
    {z:20,parent:0,ang:28,th:1.35,mat:'steel',holes:5},
    {z:30,parent:1,ang:-14,th:1.35,mat:'orange',holes:7},
    {z:16,parent:2,ang:52,th:1.35,mat:'graphite',holes:0},
    {z:24,parent:0,ang:152,th:1.35,mat:'steel',holes:6},
    {z:34,parent:4,ang:214,th:1.35,mat:'graphite',holes:8},
    {z:18,parent:3,ang:8,th:1.35,mat:'orange',holes:4}
  ];
  const world=new THREE.Group();scene.add(world);
  defs.forEach((d,i)=>{
    d.r=d.z*M/2;
    if(d.parent==null){d.x=0;d.y=0}
    else{const p=defs[d.parent],a=d.ang*Math.PI/180,dist=p.r+d.r;d.a=a;d.x=p.x+Math.cos(a)*dist;d.y=p.y+Math.sin(a)*dist}
    d.mesh=makeGear(d);d.mesh.position.set(d.x,d.y,0);world.add(d.mesh);
  });
  /* centre the cluster on its bounding box */
  const box=new THREE.Box3().setFromObject(world);const ctr=box.getCenter(new THREE.Vector3());
  world.children.forEach(c=>{c.position.x-=ctr.x;c.position.y-=ctr.y});
  defs.forEach(d=>{d.x-=ctr.x;d.y-=ctr.y});

  /* kinematics: phase of every gear from the root so that teeth always mesh */
  function pose(t){
    const w0=.11;defs[0].phi=w0*t;
    for(let i=1;i<defs.length;i++){
      const d=defs[i],p=defs[d.parent],a=d.a;
      d.phi=a+Math.PI-Math.PI/d.z+(p.z/d.z)*(a-p.phi);
    }
    defs.forEach(d=>d.mesh.rotation.z=d.phi);
  }

  let mx=0,my=0,tx=0,ty=0,prog=0,vis=true,w=0,h=0,t=0,last=performance.now();
  addEventListener('mousemove',e=>{tx=e.clientX/innerWidth-.5;ty=e.clientY/innerHeight-.5},{passive:true});
  function size(){
    const r=host.getBoundingClientRect();w=Math.max(1,r.width);h=Math.max(1,r.height);
    renderer.setSize(w,h,false);camera.aspect=w/h;
    const wide=w/h>1.25;
    camera.position.z=wide?40:46;
    world.position.x=wide?w/h*5.2:0;
    world.position.y=wide?0:h/w*-3;
    camera.updateProjectionMatrix();
  }
  size();new ResizeObserver(size).observe(host);
  new IntersectionObserver(e=>{vis=e[0].isIntersecting}).observe(host);

  function frame(now){
    requestAnimationFrame(frame);
    if(!vis)return;
    const dt=reduce?0:Math.min((now-last)/1000,.05);last=now;t+=dt;
    mx+=(tx-mx)*.04;my+=(ty-my)*.04;
    const r=host.getBoundingClientRect();
    prog=Math.min(1,Math.max(0,-r.top/Math.max(1,r.height*.9)));
    pose(reduce?2:t);
    world.rotation.y=-.42+mx*.22+prog*.8;
    world.rotation.x=.28+my*.14-prog*.25;
    defs.forEach((d,i)=>{d.mesh.position.z=(i-3)*prog*2.6});
    camera.position.x=-mx*1.2;
    camera.lookAt(0,0,0);
    rim.position.x=18+Math.sin(t*.3)*4;
    renderer.render(scene,camera);
  }
  requestAnimationFrame(frame);
};
})();
