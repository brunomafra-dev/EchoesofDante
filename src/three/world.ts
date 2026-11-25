import * as T from 'three';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {UnrealBloomPass} from 'three/addons/postprocessing/UnrealBloomPass.js';
import {ShaderPass} from 'three/addons/postprocessing/ShaderPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';

// Dark action-RPG graveyard camp: cold moon, warm fires, heavy fog, bloom and grading.
export interface Collider{x:number;z:number;r:number}
export const ARENA=40;
const rng=(seed:number)=>()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};

function glowTex(inner:string,outer:string){
 const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d')!;
 const r=g.createRadialGradient(32,32,0,32,32,32);r.addColorStop(0,inner);r.addColorStop(.35,outer);r.addColorStop(1,'rgba(0,0,0,0)');
 g.fillStyle=r;g.fillRect(0,0,64,64);const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;return t;
}
function groundTex(){
 const c=document.createElement('canvas');c.width=c.height=512;const g=c.getContext('2d')!;
 g.fillStyle='#3a3832';g.fillRect(0,0,512,512);const r=rng(7);
 for(let i=0;i<9000;i++){const v=20+r()*40|0;g.fillStyle=`rgba(${v+8},${v+4},${v-2},${.25+r()*.4})`;g.fillRect(r()*512,r()*512,1+r()*5,1+r()*4);}
 for(let i=0;i<40;i++){g.fillStyle=`rgba(20,22,18,${.12+r()*.18})`;g.beginPath();g.ellipse(r()*512,r()*512,15+r()*50,10+r()*30,r()*3,0,6.3);g.fill();}
 const t=new T.CanvasTexture(c);t.wrapS=t.wrapT=T.RepeatWrapping;t.repeat.set(26,26);t.colorSpace=T.SRGBColorSpace;t.anisotropy=4;return t;
}

const GRADE={
 uniforms:{tDiffuse:{value:null},time:{value:0}},
 vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
 fragmentShader:`uniform sampler2D tDiffuse;uniform float time;varying vec2 vUv;
 float hash(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}
 void main(){
  vec4 c=texture2D(tDiffuse,vUv);float l=dot(c.rgb,vec3(.2126,.7152,.0722));
  vec3 g=mix(vec3(l),c.rgb,.78);
  g=mix(g*vec3(.86,.96,1.1),g*vec3(1.14,1.0,.84),smoothstep(.05,.5,l));
  g=pow(max(g,0.),vec3(1.1))*1.14;
  vec2 d=vUv-.5;float v=smoothstep(.9,.25,length(d*vec2(1.,.9)));g*=mix(.3,1.,v);
  g+=(hash(vUv*vec2(1920.,1080.)+time)-.5)*.02;
  gl_FragColor=vec4(max(g,0.),c.a);}`,
};

export class World{
 scene=new T.Scene();colliders:Collider[]=[];moon=new T.DirectionalLight('#9bb2e6',2.3);
 fireLight=new T.PointLight('#ff8a3c',60,22,1.5);private flames:T.Mesh[]=[];private torches:T.PointLight[]=[];
 private embers!:T.Points;private emberV=new Float32Array(120*2);
 composer!:EffectComposer;private bloom!:UnrealBloomPass;private grade!:ShaderPass;private rp!:RenderPass;
 readonly fire=new T.Vector3(-3.4,0,-2.2);
 // where real flames burn (filled by the VFX system)
 flameSpots:{p:T.Vector3;s:number}[]=[];
 constructor(renderer:T.WebGLRenderer,camera:T.PerspectiveCamera){
  const sc=this.scene;sc.background=new T.Color('#10151d');sc.fog=new T.FogExp2('#10151d',.03);
  sc.add(new T.HemisphereLight('#7f93bd','#2a2a22',1.25));
  this.moon.position.set(-14,26,10);this.moon.castShadow=true;
  const sh=this.moon.shadow;sh.mapSize.set(1024,1024);sh.camera.left=-22;sh.camera.right=22;sh.camera.top=22;sh.camera.bottom=-22;sh.camera.near=1;sh.camera.far=70;sh.bias=-.0006;sh.normalBias=.04;
  sc.add(this.moon,this.moon.target);
  // scanned burned ground (Poly Haven, CC0) with a procedural fallback while it loads
  const gmat=new T.MeshStandardMaterial({map:groundTex(),roughness:1,color:'#c4beb0'});
  const ground=new T.Mesh(new T.CircleGeometry(150,64).rotateX(-Math.PI/2),gmat);
  const tl=new T.TextureLoader(),nb=import.meta.env.BASE_URL+'assets/3d-new/nature/';
  const tex=(n:string,srgb:boolean)=>{const t=tl.load(nb+n);t.wrapS=t.wrapT=T.RepeatWrapping;t.repeat.set(34,34);t.anisotropy=8;if(srgb)t.colorSpace=T.SRGBColorSpace;return t;};
  Object.assign(gmat,{map:tex('burned_ground_01_diff.jpg',true),normalMap:tex('burned_ground_01_nor.jpg',false),roughnessMap:tex('burned_ground_01_rough.jpg',false),color:new T.Color('#8a8378'),roughness:1});
  gmat.normalScale.set(.85,.85);gmat.needsUpdate=true;
  ground.receiveShadow=true;sc.add(ground);
  this.buildProps();this.buildFire();
  this.composer=new EffectComposer(renderer);
  const size=renderer.getSize(new T.Vector2());this.composer.setPixelRatio(renderer.getPixelRatio());this.composer.setSize(size.x,size.y);
  this.rp=new RenderPass(sc,camera);this.composer.addPass(this.rp);
  this.bloom=new UnrealBloomPass(new T.Vector2(size.x,size.y),.34,.5,.8);this.composer.addPass(this.bloom);
  this.grade=new ShaderPass(GRADE);this.composer.addPass(this.grade);this.composer.addPass(new OutputPass());
 }
 private buildProps(){
  const r=rng(11),sc=this.scene;
  const stone=new T.MeshStandardMaterial({color:'#4a4945',roughness:.95,flatShading:true});
  const dark=new T.MeshStandardMaterial({color:'#2a1d14',roughness:.95});
  const m4=new T.Matrix4(),q=new T.Quaternion(),e=new T.Euler();void stone;void dark;
  // scanned nature from Poly Haven (CC0): placements are decided now (colliders), meshes arrive async
  const place:Record<string,{x:number;z:number;s:number;ry:number;tilt:number}[]>={};
  const put=(kind:string,x:number,z:number,s:number,tilt=0)=>{(place[kind]??=[]).push({x,z,s,ry:r()*6.283,tilt});};
  for(let i=0;i<10;i++){const a=r()*6.283,d=13+r()*ARENA*1.15,x=Math.cos(a)*d,z=Math.sin(a)*d;put(r()<.6?'tree_a':'tree_b',x,z,.8+r()*.5);this.colliders.push({x,z,r:.5});}
  // living alien trees (quiver trees: swollen trunks and spiky crowns)
  for(let i=0;i<16;i++){const a=r()*6.283,d=10+r()*ARENA*1.1,x=Math.cos(a)*d,z=Math.sin(a)*d;put(r()<.55?'alive_a':'alive_b',x,z,.8+r()*.6);this.colliders.push({x,z,r:.6});}
  for(let i=0;i<10;i++){const a=r()*6.283,d=9+r()*ARENA,x=Math.cos(a)*d,z=Math.sin(a)*d;put(r()<.5?'stump_a':'stump_b',x,z,.9+r()*.5);this.colliders.push({x,z,r:.45});}
  for(let i=0;i<8;i++){const a=r()*6.283,d=11+r()*ARENA,x=Math.cos(a)*d,z=Math.sin(a)*d;put(i%2?'log':'log_big',x,z,.9+r()*.3);this.colliders.push({x,z,r:1});}
  for(let i=0;i<26;i++){const a=r()*6.283,d=5+r()*ARENA*1.1;put(r()<.5?'branches':'branch',Math.cos(a)*d,Math.sin(a)*d,.8+r()*.6);}
  const rockKinds=['rock_a','rock_b','rock_c','rock_d','set_1','set_2'];
  for(let i=0;i<70;i++){const a=r()*6.283,d=7+Math.sqrt(r())*ARENA*1.1,x=Math.cos(a)*d,z=Math.sin(a)*d,s=.5+Math.pow(r(),2)*2.2;
   put(rockKinds[Math.floor(r()*rockKinds.length)],x,z,s,(r()-.5)*.4);if(s>1.3)this.colliders.push({x,z,r:s*.55});}
  // big boulders framing the arena edge
  for(let i=0;i<14;i++){const a=i/14*6.283+r()*.3,d=ARENA*(.95+r()*.2);put('boulder',Math.cos(a)*d,Math.sin(a)*d,3+r()*3);}
  this.loadNature(place,m4,q,e);
  // alien flora of Dante: glowing crystal clusters, bulb stalks and fungi
  const gm=new T.MeshStandardMaterial({color:'#5a5953',roughness:.9,flatShading:true});
  const crystal=new T.MeshStandardMaterial({color:'#1d6f86',emissive:'#2fd8ff',emissiveIntensity:.85,roughness:.15,metalness:.2,flatShading:true});
  const crystal2=new T.MeshStandardMaterial({color:'#5a2a86',emissive:'#a45cff',emissiveIntensity:.8,roughness:.15,metalness:.2,flatShading:true});
  const cg=new T.OctahedronGeometry(.35,0);cg.scale(.6,2.4,.6);cg.translate(0,.75,0);
  const spots:{x:number;z:number}[]=[];
  for(let i=0;i<16;i++){const a=r()*6.283,d=7+r()*28,x=Math.cos(a)*d,z=Math.sin(a)*d;if(Math.hypot(x-this.fire.x,z-this.fire.z)<5)continue;spots.push({x,z});this.colliders.push({x,z,r:.7});}
  for(const [mat,offset] of [[crystal,0],[crystal2,1]] as const){
   const mine=spots.filter((_,k)=>k%2===offset),n=mine.length*5,im=new T.InstancedMesh(cg,mat,n);let c=0;
   for(const sp of mine)for(let k=0;k<5;k++){const s=.5+r()*.9;e.set((r()-.5)*.9,r()*6.28,(r()-.5)*.9);q.setFromEuler(e);
    m4.compose(new T.Vector3(sp.x+(r()-.5)*1.1,-.1,sp.z+(r()-.5)*1.1),q,new T.Vector3(s,s*(.8+r()*.6),s));im.setMatrixAt(c++,m4);}
   im.castShadow=true;sc.add(im);
  }
  const stalkG=new T.CylinderGeometry(.025,.05,1,6);stalkG.translate(0,.5,0);const bulbG=new T.SphereGeometry(.13,10,8);
  const stalkM=new T.MeshStandardMaterial({color:'#24302a',roughness:.8}),bulbM=new T.MeshStandardMaterial({color:'#3dffb0',emissive:'#3dffb0',emissiveIntensity:1.4,roughness:.3});
  const N=90,stalks=new T.InstancedMesh(stalkG,stalkM,N),bulbs=new T.InstancedMesh(bulbG,bulbM,N);
  for(let i=0;i<N;i+=0){const a=r()*6.283,d=5+r()*ARENA*1.05,cx=Math.cos(a)*d,cz=Math.sin(a)*d;
   for(let k=0;k<6&&i<N;k++,i++){const h=.5+r()*1.4,x=cx+(r()-.5)*2,z=cz+(r()-.5)*2,lean=(r()-.5)*.5;e.set(lean,r()*6.28,(r()-.5)*.5);q.setFromEuler(e);
    m4.compose(new T.Vector3(x,0,z),q,new T.Vector3(1,h,1));stalks.setMatrixAt(i,m4);
    const top=new T.Vector3(0,h,0).applyQuaternion(q).add(new T.Vector3(x,0,z));const b=.7+r()*.8;m4.compose(top,q,new T.Vector3(b,b*1.3,b));bulbs.setMatrixAt(i,m4);}}
  stalks.castShadow=true;sc.add(stalks,bulbs);
  const capG=new T.SphereGeometry(.5,14,8,0,Math.PI*2,0,Math.PI/2);capG.scale(1,.45,1);const stemG=new T.CylinderGeometry(.07,.1,1,8);stemG.translate(0,.5,0);
  const capM=new T.MeshStandardMaterial({color:'#3a2448',emissive:'#7a3cff',emissiveIntensity:.35,roughness:.6,side:T.DoubleSide}),stemM=new T.MeshStandardMaterial({color:'#bdb3a0',roughness:.8});
  const F=40,caps=new T.InstancedMesh(capG,capM,F),stems=new T.InstancedMesh(stemG,stemM,F);
  for(let i=0;i<F;i+=0){const a=r()*6.283,d=6+r()*ARENA,cx=Math.cos(a)*d,cz=Math.sin(a)*d;
   for(let k=0;k<4&&i<F;k++,i++){const h=.3+r()*.9,s=.5+r()*1.1,x=cx+(r()-.5)*1.6,z=cz+(r()-.5)*1.6;e.set((r()-.5)*.3,r()*6.28,(r()-.5)*.3);q.setFromEuler(e);
    m4.compose(new T.Vector3(x,0,z),q,new T.Vector3(s*.6,h*s,s*.6));stems.setMatrixAt(i,m4);m4.compose(new T.Vector3(x,h*s,z),q,new T.Vector3(s,s,s));caps.setMatrixAt(i,m4);}}
  caps.castShadow=stems.castShadow=true;sc.add(caps,stems);
  for(let i=0;i<7;i++){
   const a=i/7*6.283+.4,d=19+r()*3,x=Math.cos(a)*d,z=Math.sin(a)*d,h=2+r()*2.6;
   const p=new T.Mesh(new T.CylinderGeometry(.5,.62,h,9),gm);p.position.set(x,h/2,z);p.rotation.z=(r()-.5)*.06;p.castShadow=p.receiveShadow=true;sc.add(p);
   const cap=new T.Mesh(new T.BoxGeometry(1.4,.3,1.4),gm);cap.position.set(x,h+.1,z);cap.rotation.y=r();cap.castShadow=true;sc.add(cap);this.colliders.push({x,z,r:.7});
  }

  // torches on posts
  const lampTex=glowTex('rgba(255,225,170,1)','rgba(255,150,60,.4)');
  for(let i=0;i<5;i++){
   const a=i/5*6.283+.2,x=Math.cos(a)*15,z=Math.sin(a)*15;
   const post=new T.Mesh(new T.CylinderGeometry(.06,.08,2.6,6),dark);post.position.set(x,1.3,z);post.castShadow=true;sc.add(post);
   const fl=new T.Mesh(new T.ConeGeometry(.16,.5,6,1,true),new T.MeshBasicMaterial({color:'#ffb050',transparent:true,opacity:.9,blending:T.AdditiveBlending,depthWrite:false}));fl.position.set(x,2.85,z);fl.visible=false;sc.add(fl);this.flames.push(fl);this.flameSpots.push({p:new T.Vector3(x,2.62,z),s:.32});
   const sp=new T.Sprite(new T.SpriteMaterial({map:lampTex,blending:T.AdditiveBlending,depthWrite:false,transparent:true}));sp.scale.set(1.8,1.8,1);sp.position.set(x,2.85,z);sc.add(sp);
   const l=new T.PointLight('#ff9a48',12,12,1.8);l.position.set(x,3,z);sc.add(l);this.torches.push(l);
   this.colliders.push({x,z,r:.2});
  }
 }
 // asset -> how it is used: target size (height for trees/stumps, footprint for rocks) per unit scale
 private async loadNature(place:Record<string,{x:number;z:number;s:number;ry:number;tilt:number}[]>,m4:T.Matrix4,q:T.Quaternion,e:T.Euler){
  const SRC:Record<string,{file:string;size:number;by:'h'|'w';mesh?:number;sink?:number}>={
   tree_a:{file:'dead_quiver_trunk',size:5.8,by:'h'},alive_a:{file:'quiver_tree_01',size:6,by:'h'},alive_b:{file:'quiver_tree_02',size:4.2,by:'h'},tree_b:{file:'dead_quiver_trunk',size:4.2,by:'h'},log_big:{file:'dead_tree_trunk_02',size:4.6,by:'w',sink:.12},
   stump_a:{file:'tree_stump_01',size:.8,by:'h'},stump_b:{file:'tree_stump_02',size:.9,by:'h'},log:{file:'dead_tree_trunk',size:3.2,by:'w',sink:.05},
   branches:{file:'dry_branches_medium_01',size:1.6,by:'w'},branch:{file:'dead_quiver_branch_01',size:1.4,by:'w'},
   rock_a:{file:'rock_07',size:1,by:'w',sink:.15},rock_b:{file:'rock_09',size:1,by:'w',sink:.15},rock_c:{file:'stone_01',size:.9,by:'w',sink:.1},rock_d:{file:'namaqualand_boulder_04',size:1.2,by:'w',sink:.2},
   set_1:{file:'rock_moss_set_01',size:1,by:'w',sink:.15},set_2:{file:'rock_moss_set_02',size:1,by:'w',sink:.15},boulder:{file:'namaqualand_boulder_04',size:1,by:'w',sink:.25},
  };
  const loader=new GLTFLoader(),base=import.meta.env.BASE_URL+'assets/3d-new/nature/',cache=new Map<string,Promise<T.Group>>();
  const load=(f:string)=>{let p=cache.get(f);if(!p){p=loader.loadAsync(base+f+'.glb').then(g=>g.scene);cache.set(f,p);}return p;};
  for(const [kind,list] of Object.entries(place)){
   const src=SRC[kind];if(!src)continue;
   let sceneRoot:T.Group;try{sceneRoot=await load(src.file);}catch{continue;}
   sceneRoot.updateMatrixWorld(true);
   // each mesh of the file becomes a variant: geometry baked to its node transform, centred, base at y=0
   const variants:{geo:T.BufferGeometry;mat:T.Material;size:number;h:number}[]=[];
   sceneRoot.traverse(o=>{const m=o as T.Mesh;if(!m.isMesh)return;const g=m.geometry.clone().applyMatrix4(m.matrixWorld);g.computeBoundingBox();const bb=g.boundingBox!;
    const c=bb.getCenter(new T.Vector3());g.translate(-c.x,-bb.min.y,-c.z);const sz=bb.getSize(new T.Vector3());
    const mat=m.material as T.MeshStandardMaterial;mat.envMapIntensity=.4;
    variants.push({geo:g,mat,size:src.by==='h'?sz.y:Math.max(sz.x,sz.z),h:sz.y});});
   if(!variants.length)continue;
   const per=new Map<number,typeof list>();list.forEach((p,i)=>{const v=i%variants.length;if(!per.has(v))per.set(v,[]);per.get(v)!.push(p);});
   for(const [v,ps] of per){
    const va=variants[v],im=new T.InstancedMesh(va.geo,va.mat,ps.length);
    ps.forEach((p,i)=>{const k=src.size/va.size*p.s;e.set(p.tilt,p.ry,p.tilt*.6);q.setFromEuler(e);
     m4.compose(new T.Vector3(p.x,-(src.sink??0)*va.h*k,p.z),q,new T.Vector3(k,k,k));im.setMatrixAt(i,m4);});
    im.castShadow=true;im.receiveShadow=true;this.scene.add(im);
   }
  }
 }
 private buildFire(){
  const F=this.fire,sc=this.scene;
  const stone=new T.MeshStandardMaterial({color:'#3b3a38',roughness:.95,flatShading:true}),wood=new T.MeshStandardMaterial({color:'#2a1c12',roughness:.9});
  for(let i=0;i<9;i++){const a=i/9*6.283,m=new T.Mesh(new T.DodecahedronGeometry(.16+.05*((i*7)%3)),stone);m.position.set(F.x+Math.cos(a)*.65,.1,F.z+Math.sin(a)*.65);m.rotation.set(a,a*2,0);m.castShadow=true;sc.add(m);}
  for(let i=0;i<4;i++){const a=i/4*Math.PI+.4,m=new T.Mesh(new T.CylinderGeometry(.07,.08,.9,6),wood);m.position.set(F.x,.14,F.z);m.rotation.set(Math.PI/2.3,a,0);m.castShadow=true;sc.add(m);}
  const fm=new T.MeshBasicMaterial({color:'#ff9a3a',transparent:true,opacity:.9,blending:T.AdditiveBlending,depthWrite:false});
  const f1=new T.Mesh(new T.ConeGeometry(.34,1.15,8,1,true),fm);f1.position.set(F.x,.7,F.z);f1.visible=false;sc.add(f1);this.flames.push(f1);this.flameSpots.push({p:new T.Vector3(F.x,.12,F.z),s:1});
  const f2=new T.Mesh(new T.ConeGeometry(.17,.7,8,1,true),new T.MeshBasicMaterial({color:'#ffe9a8',transparent:true,opacity:.95,blending:T.AdditiveBlending,depthWrite:false}));f2.position.set(F.x,.5,F.z);f2.visible=false;sc.add(f2);
  const gl=new T.Sprite(new T.SpriteMaterial({map:glowTex('rgba(255,170,80,.95)','rgba(255,110,30,.35)'),blending:T.AdditiveBlending,depthWrite:false,transparent:true}));gl.scale.set(5.5,5.5,1);gl.position.set(F.x,.9,F.z);sc.add(gl);
  this.fireLight.position.set(F.x,1.3,F.z);sc.add(this.fireLight);this.colliders.push({x:F.x,z:F.z,r:.9});
  const N=120,pos=new Float32Array(N*3);for(let i=0;i<N;i++){pos[i*3]=F.x;pos[i*3+1]=Math.random()*5;pos[i*3+2]=F.z;this.emberV[i*2]=.4+Math.random()*1.1;this.emberV[i*2+1]=Math.random()*6.28;}
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.BufferAttribute(pos,3));
  this.embers=new T.Points(geo,new T.PointsMaterial({color:'#ffb060',size:.07,transparent:true,opacity:.9,blending:T.AdditiveBlending,depthWrite:false}));sc.add(this.embers);
 }
 update(t:number,dt:number,focus:T.Vector3){
  this.fireLight.intensity=58+Math.sin(t*7.1)*7+Math.sin(t*17.3)*5;
  this.flames.forEach((f,i)=>f.scale.set(1+Math.sin(t*11+i)*.08,1+Math.sin(t*9.3+i)*.14+Math.sin(t*21+i)*.06,1+Math.cos(t*10+i)*.08));
  this.torches.forEach((l,i)=>l.intensity=11+Math.sin(t*5.3+i*2.1)*1.6+Math.sin(t*13+i)*.8);
  const pos=this.embers.geometry.attributes.position as T.BufferAttribute,F=this.fire;
  for(let i=0;i<120;i++){let y=pos.getY(i)+dt*this.emberV[i*2];if(y>5.5){y=.5;pos.setX(i,F.x+(Math.random()-.5)*.6);pos.setZ(i,F.z+(Math.random()-.5)*.6);}pos.setY(i,y);pos.setX(i,pos.getX(i)+Math.sin(t*1.7+this.emberV[i*2+1])*dt*.35);}
  pos.needsUpdate=true;
  this.moon.target.position.copy(focus);this.moon.position.set(focus.x-14,26,focus.z+10);
 }
 resize(w:number,h:number,pr=1){this.composer.setPixelRatio(pr);this.composer.setSize(w,h);this.bloom.resolution.set(w*pr/2,h*pr/2);}
 render(camera:T.PerspectiveCamera,t:number){this.rp.camera=camera;(this.grade.uniforms.time as {value:number}).value=t%100;this.composer.render();}
 // push a point out of every solid prop
 collide(p:T.Vector3,rad:number){
  for(const c of this.colliders){const dx=p.x-c.x,dz=p.z-c.z,d=Math.hypot(dx,dz),m=c.r+rad;if(d<m&&d>1e-4){p.x=c.x+dx/d*m;p.z=c.z+dz/d*m;}}
  const d=Math.hypot(p.x,p.z);if(d>ARENA){p.x*=ARENA/d;p.z*=ARENA/d;}
 }
}
