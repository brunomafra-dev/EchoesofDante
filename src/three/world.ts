import * as T from 'three';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {UnrealBloomPass} from 'three/addons/postprocessing/UnrealBloomPass.js';
import {ShaderPass} from 'three/addons/postprocessing/ShaderPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {BIOMES,BIOME_ORDER,type BiomeId} from './biomes';

// Regions of Dante: scanned ground and nature (Poly Haven, CC0), procedural alien flora,
// lava, water, ice and dunes, ambient particles, plus the dark ARPG post-processing.
export interface Collider{x:number;z:number;r:number}
export const ARENA=40;
const rng=(seed:number)=>()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};
function glowTex(inner:string,outer:string){
 const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d')!;
 const r=g.createRadialGradient(32,32,0,32,32,32);r.addColorStop(0,inner);r.addColorStop(.35,outer);r.addColorStop(1,'rgba(0,0,0,0)');
 g.fillStyle=r;g.fillRect(0,0,64,64);const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;return t;
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
// flowing lava and still water surfaces
const SURF_V='varying vec2 vUv;varying vec3 vW;void main(){vUv=uv;vec4 w=modelMatrix*vec4(position,1.);vW=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}';
const LAVA_F=`uniform float uT;varying vec2 vUv;varying vec3 vW;
float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float n2(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<5;i++){v+=a*n2(p);p*=2.1;a*=.5;}return v;}
void main(){vec2 p=vW.xz*.35;float n=fbm(p+vec2(uT*.08,uT*.05)+fbm(p*1.7-uT*.06));float r=length(vUv-.5)*2.;
 float crust=smoothstep(.45,.62,n);vec3 hot=mix(vec3(1.,.25,.02),vec3(1.,.75,.25),smoothstep(.2,.5,n));vec3 c=mix(hot*.75,vec3(.05,.03,.03),crust);
 float a=smoothstep(1.,.85,r);gl_FragColor=vec4(c,a);}`;
const WATER_F=`uniform float uT;uniform vec3 uC;varying vec2 vUv;varying vec3 vW;
void main(){float r=length(vUv-.5)*2.;float w=sin(vW.x*3.+uT*1.5)*sin(vW.z*2.6-uT*1.2);vec3 c=uC*(.55+.15*w)+vec3(.05,.12,.14)*smoothstep(.75,.95,r);
 float a=smoothstep(1.,.88,r)*.88;gl_FragColor=vec4(c,a);}`;

type Place=Record<string,{x:number;z:number;s:number;ry:number;tilt:number}[]>;
const SRC:Record<string,{file:string;size:number;by:'h'|'w';sink?:number}>={
 tree_a:{file:'dead_quiver_trunk',size:5.8,by:'h'},tree_b:{file:'dead_quiver_trunk',size:4.2,by:'h'},alive_a:{file:'quiver_tree_01',size:6,by:'h'},alive_b:{file:'quiver_tree_02',size:4.2,by:'h'},
 log_big:{file:'dead_tree_trunk_02',size:4.6,by:'w',sink:.12},stump_a:{file:'tree_stump_01',size:.8,by:'h'},stump_b:{file:'tree_stump_02',size:.9,by:'h'},log:{file:'dead_tree_trunk',size:3.2,by:'w',sink:.05},
 branches:{file:'dry_branches_medium_01',size:1.6,by:'w'},branch:{file:'dead_quiver_branch_01',size:1.4,by:'w'},
 rock_a:{file:'rock_07',size:1,by:'w',sink:.15},rock_b:{file:'rock_09',size:1,by:'w',sink:.15},rock_c:{file:'stone_01',size:.9,by:'w',sink:.1},rock_d:{file:'namaqualand_boulder_04',size:1.2,by:'w',sink:.2},
 set_1:{file:'rock_moss_set_01',size:1,by:'w',sink:.15},set_2:{file:'rock_moss_set_02',size:1,by:'w',sink:.15},boulder:{file:'namaqualand_boulder_04',size:1,by:'w',sink:.25},
};
const ROCKS=['rock_a','rock_b','rock_c','rock_d','set_1','set_2'];

export class World{
 scene=new T.Scene();colliders:Collider[]=[];moon=new T.DirectionalLight('#9bb2e6',2.3);hemi=new T.HemisphereLight('#7f93bd','#2a2a22',1.25);
 biome:BiomeId='camp';portals:{pos:T.Vector3;to:BiomeId;dir:1|-1}[]=[];private portalMats:T.ShaderMaterial[]=[];flameSpots:{p:T.Vector3;s:number}[]=[];readonly fire=new T.Vector3(-3.4,0,-2.2);
 composer!:EffectComposer;private bloom!:UnrealBloomPass;private grade!:ShaderPass;private rp!:RenderPass;
 private group=new T.Group();private gmat:T.MeshStandardMaterial;private texCache=new Map<string,T.Texture>();private token=0;
 private fireLight:T.PointLight|null=null;private torches:T.PointLight[]=[];private surfaces:T.ShaderMaterial[]=[];
 private air:T.Points|null=null;private airV:Float32Array|null=null;private airKind='none';
 private loader=new GLTFLoader();private glbCache=new Map<string,Promise<T.Group>>();
 constructor(renderer:T.WebGLRenderer,camera:T.PerspectiveCamera){
  const sc=this.scene;sc.background=new T.Color('#10151d');sc.fog=new T.FogExp2('#10151d',.03);
  sc.add(this.hemi);
  this.moon.position.set(-14,26,10);this.moon.castShadow=true;
  const sh=this.moon.shadow;sh.mapSize.set(1024,1024);sh.camera.left=-22;sh.camera.right=22;sh.camera.top=22;sh.camera.bottom=-22;sh.camera.near=1;sh.camera.far=70;sh.bias=-.0006;sh.normalBias=.04;
  sc.add(this.moon,this.moon.target);
  this.gmat=new T.MeshStandardMaterial({roughness:1,color:'#8a8378'});
  const ground=new T.Mesh(new T.CircleGeometry(150,64).rotateX(-Math.PI/2),this.gmat);ground.receiveShadow=true;sc.add(ground);
  sc.add(this.group);
  this.composer=new EffectComposer(renderer);
  const size=renderer.getSize(new T.Vector2());this.composer.setPixelRatio(renderer.getPixelRatio());this.composer.setSize(size.x,size.y);
  this.rp=new RenderPass(sc,camera);this.composer.addPass(this.rp);
  this.bloom=new UnrealBloomPass(new T.Vector2(size.x,size.y),.34,.5,.8);this.composer.addPass(this.bloom);
  this.grade=new ShaderPass(GRADE);this.composer.addPass(this.grade);this.composer.addPass(new OutputPass());
  this.setBiome('camp');
 }
 private tex(n:string,srgb:boolean){let t=this.texCache.get(n);if(!t){t=new T.TextureLoader().load(import.meta.env.BASE_URL+'assets/3d-new/nature/'+n);t.wrapS=t.wrapT=T.RepeatWrapping;t.repeat.set(34,34);t.anisotropy=8;if(srgb)t.colorSpace=T.SRGBColorSpace;this.texCache.set(n,t);}return t;}
 // rebuild everything that belongs to a region
 setBiome(id:BiomeId){
  this.biome=id;const b=BIOMES[id],tok=++this.token;
  this.group.traverse(o=>{const m=o as T.Mesh;if(m.isMesh&&!(m as T.InstancedMesh).userData.shared){m.geometry?.dispose();}});
  this.group.clear();this.colliders.length=0;this.flameSpots.length=0;this.torches=[];this.fireLight=null;this.surfaces=[];this.portals=[];this.portalMats=[];this.air=null;this.airKind=b.ambient;
  (this.scene.background as T.Color).set(b.bg);const fog=this.scene.fog as T.FogExp2;fog.color.set(b.bg);fog.density=b.fog;
  this.hemi.color.set(b.hemi[0]);this.hemi.groundColor.set(b.hemi[1]);this.hemi.intensity=b.hemi[2];this.moon.color.set(b.moon[0]);this.moon.intensity=b.moon[1];
  Object.assign(this.gmat,{map:this.tex(b.ground+'_diff.jpg',true),normalMap:this.tex(b.ground+'_nor.jpg',false),roughnessMap:this.tex(b.ground+'_rough.jpg',false)});
  this.gmat.color.set(b.groundTint);this.gmat.normalScale.set(.85,.85);this.gmat.needsUpdate=true;
  const r=rng(11+id.length*7),place:Place={};
  const put=(kind:string,x:number,z:number,s:number,tilt=0)=>{(place[kind]??=[]).push({x,z,s,ry:r()*6.283,tilt});};
  const ring=(n:number,dMin:number,dMax:number,f:(x:number,z:number,i:number)=>void)=>{for(let i=0;i<n;i++){const a=r()*6.283,d=dMin+r()*(dMax-dMin),x=Math.cos(a)*d,z=Math.sin(a)*d;if(Math.hypot(x,z)<4)continue;f(x,z,i);}};
  const col=(x:number,z:number,rr:number)=>this.colliders.push({x,z,r:rr});
  const rocks=(n:number)=>ring(n,7,ARENA*1.1,(x,z)=>{const s=.5+Math.pow(r(),2)*2.2;put(ROCKS[Math.floor(r()*ROCKS.length)],x,z,s,(r()-.5)*.4);if(s>1.3)col(x,z,s*.55);});
  const boulders=()=>{for(let i=0;i<14;i++){const a=i/14*6.283+r()*.3,d=ARENA*(.95+r()*.2);put('boulder',Math.cos(a)*d,Math.sin(a)*d,3+r()*3);}};
  if(id==='camp'){
   ring(10,13,ARENA*1.15,(x,z)=>{put(r()<.6?'tree_a':'tree_b',x,z,.8+r()*.5);col(x,z,.5);});
   ring(16,10,ARENA*1.1,(x,z)=>{put(r()<.55?'alive_a':'alive_b',x,z,.8+r()*.6);col(x,z,.6);});
   ring(10,9,ARENA,(x,z)=>{put(r()<.5?'stump_a':'stump_b',x,z,.9+r()*.5);col(x,z,.45);});
   ring(8,11,ARENA,(x,z,i)=>{put(i%2?'log':'log_big',x,z,.9+r()*.3);col(x,z,1);});
   ring(26,5,ARENA*1.1,(x,z)=>put(r()<.5?'branches':'branch',x,z,.8+r()*.6));
   rocks(70);boulders();
   this.crystals(r,16,['#1d6f86','#2fd8ff'],['#5a2a86','#a45cff'],1);this.bulbs(r,90,'#3dffb0');this.fungi(r,40);this.pillars(r,7,'#5a5953');this.camp();
  }else if(id==='springs'){
   ring(24,9,ARENA*1.1,(x,z)=>{put(r()<.6?'alive_a':'alive_b',x,z,.9+r()*.7);col(x,z,.6);});
   ring(8,10,ARENA,(x,z,i)=>{put(i%2?'log':'stump_a',x,z,.9+r()*.4);col(x,z,.6);});
   rocks(55);boulders();
   this.pools(r,9,'#164a52');this.reeds(r,240,'#3f6a3a');this.bulbs(r,70,'#6fe8ff');this.fungi(r,30);
  }else if(id==='valley'){
   ring(10,12,ARENA*1.1,(x,z)=>{put(r()<.5?'tree_a':'alive_b',x,z,.8+r()*.5);col(x,z,.5);});
   rocks(80);boulders();
   this.crystals(r,26,['#2a1d6a','#7a5cff'],['#5a2a86','#d07dff'],1.8);this.monoliths(r,9);this.bulbs(r,40,'#d07dff');
  }else if(id==='caldera'){
   ring(12,10,ARENA*1.1,(x,z)=>{put(r()<.5?'tree_a':'tree_b',x,z,.7+r()*.5);col(x,z,.5);});
   rocks(75);boulders();
   this.lava(r,14);this.obsidian(r,48);
  }else if(id==='frost'){
   ring(12,10,ARENA*1.1,(x,z)=>{put(r()<.5?'tree_a':'tree_b',x,z,.8+r()*.5);col(x,z,.5);});
   rocks(60);boulders();
   this.crystals(r,22,['#6fa8c8','#9ff0ff'],['#a8d8f0','#d0f8ff'],1.4,true);this.mounds(r,26,'#e8f0f8',2.2);
  }else if(id==='domain'){
   rocks(30);boulders();this.domainArena(r);
  }else{
   ring(8,12,ARENA*1.1,(x,z)=>{put('tree_b',x,z,.7+r()*.4);col(x,z,.5);});
   rocks(45);boulders();
   this.mounds(r,22,'#c89a68',5);this.crystals(r,14,['#8a5a1a','#ffb04a'],['#a06a2a','#ffd06a'],1.3);this.bones(r,6);
  }
  // portals to the neighbouring regions: north leads on, south leads back
  const i=BIOME_ORDER.indexOf(id);
  if(i<BIOME_ORDER.length-1)this.portal(new T.Vector3(0,0,-ARENA+5),BIOME_ORDER[i+1],1);
  if(i>0)this.portal(new T.Vector3(0,0,ARENA-5),BIOME_ORDER[i-1],-1);
  for(const pt of this.portals)this.colliders.splice(0,this.colliders.length,...this.colliders.filter(c=>Math.hypot(c.x-pt.pos.x,c.z-pt.pos.z)>4));
  for(const kind of Object.keys(place))place[kind]=place[kind].filter(p=>this.portals.every(pt=>Math.hypot(p.x-pt.pos.x,p.z-pt.pos.z)>5));
  this.loadNature(place,b.rockTint,b.treeTint,tok);
  this.makeAir(b.ambient);
 }
 private async loadNature(place:Place,rockTint:string,treeTint:string,tok:number){
  const m4=new T.Matrix4(),q=new T.Quaternion(),e=new T.Euler(),rc=new T.Color(rockTint),tc=new T.Color(treeTint);
  const load=(f:string)=>{let p=this.glbCache.get(f);if(!p){p=this.loader.loadAsync(import.meta.env.BASE_URL+'assets/3d-new/nature/'+f+'.glb').then(g=>g.scene);this.glbCache.set(f,p);}return p;};
  for(const [kind,list] of Object.entries(place)){
   const src=SRC[kind];if(!src)continue;
   let root:T.Group;try{root=await load(src.file);}catch{continue;}
   if(tok!==this.token)return;
   root.updateMatrixWorld(true);
   const variants:{geo:T.BufferGeometry;mat:T.Material;size:number;h:number}[]=[];
   root.traverse(o=>{const m=o as T.Mesh;if(!m.isMesh)return;
    let g=m.userData.baked as T.BufferGeometry|undefined;
    if(!g){g=m.geometry.clone().applyMatrix4(m.matrixWorld);g.computeBoundingBox();const bb=g.boundingBox!;const c=bb.getCenter(new T.Vector3());g.translate(-c.x,-bb.min.y,-c.z);g.computeBoundingBox();m.userData.baked=g;}
    const sz=g.boundingBox!.getSize(new T.Vector3());(m.material as T.MeshStandardMaterial).envMapIntensity=.4;
    variants.push({geo:g,mat:m.material as T.Material,size:src.by==='h'?sz.y:Math.max(sz.x,sz.z),h:sz.y});});
   if(!variants.length)continue;
   const tint=kind.startsWith('rock')||kind.startsWith('set')||kind==='boulder'?rc:tc;
   const per=new Map<number,typeof list>();list.forEach((p,i)=>{const v=i%variants.length;if(!per.has(v))per.set(v,[]);per.get(v)!.push(p);});
   for(const [v,ps] of per){
    const va=variants[v],im=new T.InstancedMesh(va.geo,va.mat,ps.length);im.userData.shared=true;
    ps.forEach((p,i)=>{const k=src.size/va.size*p.s;e.set(p.tilt,p.ry,p.tilt*.6);q.setFromEuler(e);
     m4.compose(new T.Vector3(p.x,-(src.sink??0)*va.h*k,p.z),q,new T.Vector3(k,k,k));im.setMatrixAt(i,m4);im.setColorAt(i,tint);});
    im.castShadow=true;im.receiveShadow=true;this.group.add(im);
   }
  }
 }
 // ---------- procedural pieces ----------
 private inst(geo:T.BufferGeometry,mat:T.Material,n:number,f:(i:number,m:T.Matrix4)=>void,shadow=true){const im=new T.InstancedMesh(geo,mat,n),m=new T.Matrix4();for(let i=0;i<n;i++){f(i,m);im.setMatrixAt(i,m);}im.castShadow=shadow;im.receiveShadow=true;this.group.add(im);return im;}
 private spot(r:()=>number,dMin:number,dMax:number){for(let k=0;k<20;k++){const a=r()*6.283,d=dMin+r()*(dMax-dMin),x=Math.cos(a)*d,z=Math.sin(a)*d;if(Math.hypot(x-this.fire.x,z-this.fire.z)>5&&Math.hypot(x,z)>5)return{x,z};}return{x:dMax,z:0};}
 private crystals(r:()=>number,n:number,a:[string,string],b:[string,string],big:number,ice=false){
  const mk=([c,e]:[string,string])=>new T.MeshStandardMaterial({color:c,emissive:e,emissiveIntensity:ice?.35:.85,roughness:ice?.05:.15,metalness:.2,flatShading:true,transparent:ice,opacity:ice?.82:1});
  const geo=new T.OctahedronGeometry(.35,0);geo.scale(.6,2.4,.6);geo.translate(0,.75,0);
  const spots:{x:number;z:number}[]=[];for(let i=0;i<n;i++){const s=this.spot(r,7,ARENA*.95);spots.push(s);this.colliders.push({x:s.x,z:s.z,r:.7*big});}
  const q=new T.Quaternion(),e=new T.Euler();
  for(const [mat,off] of [[mk(a),0],[mk(b),1]] as const){const mine=spots.filter((_,k)=>k%2===off);
   this.inst(geo,mat,mine.length*5,(i,m)=>{const sp=mine[Math.floor(i/5)],s=(.5+r()*.9)*big;e.set((r()-.5)*.9,r()*6.28,(r()-.5)*.9);q.setFromEuler(e);m.compose(new T.Vector3(sp.x+(r()-.5)*1.1*big,-.1,sp.z+(r()-.5)*1.1*big),q,new T.Vector3(s,s*(.8+r()*.6),s));});}
 }
 private bulbs(r:()=>number,N:number,color:string){
  const stalkG=new T.CylinderGeometry(.025,.05,1,6);stalkG.translate(0,.5,0);const bulbG=new T.SphereGeometry(.13,10,8);
  const sm=new T.MeshStandardMaterial({color:'#24302a',roughness:.8}),bm=new T.MeshStandardMaterial({color,emissive:color,emissiveIntensity:1.4,roughness:.3});
  const q=new T.Quaternion(),e=new T.Euler(),pts:{x:number;z:number;h:number;q:T.Quaternion}[]=[];
  let c=this.spot(r,5,ARENA);for(let i=0;i<N;i++){if(i%6===0)c=this.spot(r,5,ARENA);e.set((r()-.5)*.5,r()*6.28,(r()-.5)*.5);pts.push({x:c.x+(r()-.5)*2,z:c.z+(r()-.5)*2,h:.5+r()*1.4,q:q.setFromEuler(e).clone()});}
  this.inst(stalkG,sm,N,(i,m)=>{const p=pts[i];m.compose(new T.Vector3(p.x,0,p.z),p.q,new T.Vector3(1,p.h,1));});
  this.inst(bulbG,bm,N,(i,m)=>{const p=pts[i],top=new T.Vector3(0,p.h,0).applyQuaternion(p.q).add(new T.Vector3(p.x,0,p.z)),b=.7+r()*.8;m.compose(top,p.q,new T.Vector3(b,b*1.3,b));},false);
 }
 private fungi(r:()=>number,F:number){
  const capG=new T.SphereGeometry(.5,14,8,0,Math.PI*2,0,Math.PI/2);capG.scale(1,.45,1);const stemG=new T.CylinderGeometry(.07,.1,1,8);stemG.translate(0,.5,0);
  const capM=new T.MeshStandardMaterial({color:'#3a2448',emissive:'#7a3cff',emissiveIntensity:.35,roughness:.6,side:T.DoubleSide}),stemM=new T.MeshStandardMaterial({color:'#bdb3a0',roughness:.8});
  const q=new T.Quaternion(),e=new T.Euler(),pts:{x:number;z:number;h:number;s:number;q:T.Quaternion}[]=[];
  let c=this.spot(r,6,ARENA);for(let i=0;i<F;i++){if(i%4===0)c=this.spot(r,6,ARENA);e.set((r()-.5)*.3,r()*6.28,(r()-.5)*.3);pts.push({x:c.x+(r()-.5)*1.6,z:c.z+(r()-.5)*1.6,h:.3+r()*.9,s:.5+r()*1.1,q:q.setFromEuler(e).clone()});}
  this.inst(stemG,stemM,F,(i,m)=>{const p=pts[i];m.compose(new T.Vector3(p.x,0,p.z),p.q,new T.Vector3(p.s*.6,p.h*p.s,p.s*.6));});
  this.inst(capG,capM,F,(i,m)=>{const p=pts[i];m.compose(new T.Vector3(p.x,p.h*p.s,p.z),p.q,new T.Vector3(p.s,p.s,p.s));});
 }
 private pillars(r:()=>number,n:number,color:string){
  const gm=new T.MeshStandardMaterial({color,roughness:.9,flatShading:true});
  for(let i=0;i<n;i++){const a=i/n*6.283+.4,d=19+r()*3,x=Math.cos(a)*d,z=Math.sin(a)*d,h=2+r()*2.6;
   const p=new T.Mesh(new T.CylinderGeometry(.5,.62,h,9),gm);p.position.set(x,h/2,z);p.castShadow=p.receiveShadow=true;this.group.add(p);
   const cap=new T.Mesh(new T.BoxGeometry(1.4,.3,1.4),gm);cap.position.set(x,h+.1,z);cap.rotation.y=r();cap.castShadow=true;this.group.add(cap);this.colliders.push({x,z,r:.7});}
 }
 // resonance stones: tall monoliths with glowing bands that pulse
 private monoliths(r:()=>number,n:number){
  const stone=new T.MeshStandardMaterial({color:'#3a3442',roughness:.85,flatShading:true}),band=new T.MeshStandardMaterial({color:'#b88cff',emissive:'#a070ff',emissiveIntensity:1.6});
  for(let i=0;i<n;i++){const s=this.spot(r,9,ARENA*.9),h=3+r()*3;
   const m=new T.Mesh(new T.BoxGeometry(1,h,.7),stone);m.position.set(s.x,h/2-.2,s.z);m.rotation.set((r()-.5)*.15,r()*6,(r()-.5)*.15);m.castShadow=m.receiveShadow=true;this.group.add(m);
   for(let k=0;k<3;k++){const b=new T.Mesh(new T.BoxGeometry(1.04,.06,.74),band);b.position.y=-h/2+h*(.3+k*.22);m.add(b);}
   this.colliders.push({x:s.x,z:s.z,r:.8});}
 }
 private pools(r:()=>number,n:number,color:string){
  for(let i=0;i<n;i++){const s=this.spot(r,8,ARENA*.9),rad=2+r()*3.5;
   const mat=new T.ShaderMaterial({vertexShader:SURF_V,fragmentShader:WATER_F,uniforms:{uT:{value:0},uC:{value:new T.Color(color)}},transparent:true,depthWrite:false});this.surfaces.push(mat);
   const m=new T.Mesh(new T.CircleGeometry(rad,40).rotateX(-Math.PI/2),mat);m.position.set(s.x,.04,s.z);m.renderOrder=1;this.group.add(m);
   this.colliders.push({x:s.x,z:s.z,r:rad*.85});}
 }
 private reeds(r:()=>number,N:number,color:string){
  const g=new T.ConeGeometry(.03,1,4);g.translate(0,.5,0);const mat=new T.MeshStandardMaterial({color,roughness:.8});
  const q=new T.Quaternion(),e=new T.Euler();let c=this.spot(r,6,ARENA);
  this.inst(g,mat,N,(i,m)=>{if(i%12===0)c=this.spot(r,6,ARENA);e.set((r()-.5)*.4,r()*6,(r()-.5)*.4);q.setFromEuler(e);const h=.8+r()*1.6;m.compose(new T.Vector3(c.x+(r()-.5)*2.4,0,c.z+(r()-.5)*2.4),q,new T.Vector3(1,h,1));},false);
 }
 private lava(r:()=>number,n:number){
  for(let i=0;i<n;i++){const s=this.spot(r,6,ARENA*.85),rx=2+r()*4,rz=1.2+r()*2.4;
   const mat=new T.ShaderMaterial({vertexShader:SURF_V,fragmentShader:LAVA_F,uniforms:{uT:{value:r()*50}},transparent:true,depthWrite:false});this.surfaces.push(mat);
   const m=new T.Mesh(new T.CircleGeometry(1,48).rotateX(-Math.PI/2),mat);m.scale.set(rx,1,rz);m.rotation.y=r()*6;m.position.set(s.x,.05,s.z);m.renderOrder=1;this.group.add(m);
   this.colliders.push({x:s.x,z:s.z,r:Math.min(rx,rz)*.9});
   const gl=new T.Sprite(new T.SpriteMaterial({map:glowTex('rgba(255,120,40,.28)','rgba(255,60,10,.08)'),blending:T.AdditiveBlending,depthWrite:false,transparent:true}));gl.scale.set(rx*3,rx*1.5,1);gl.position.set(s.x,.8,s.z);this.group.add(gl);}
 }
 private obsidian(r:()=>number,n:number){
  const mat=new T.MeshStandardMaterial({color:'#0c0a10',roughness:.12,metalness:.6,flatShading:true});
  const g=new T.ConeGeometry(.4,1,5);g.translate(0,.5,0);const q=new T.Quaternion(),e=new T.Euler();let c=this.spot(r,7,ARENA);
  this.inst(g,mat,n,(i,m)=>{if(i%4===0){c=this.spot(r,7,ARENA);this.colliders.push({x:c.x,z:c.z,r:.8});}e.set((r()-.5)*.6,r()*6,(r()-.5)*.6);q.setFromEuler(e);const h=1+r()*2.8,w=.6+r()*1.2;m.compose(new T.Vector3(c.x+(r()-.5)*1.5,-.1,c.z+(r()-.5)*1.5),q,new T.Vector3(w,h,w));});
 }
 private mounds(r:()=>number,n:number,color:string,size:number){
  const map=(this.gmat.map as T.Texture).clone();map.repeat.set(3,3);map.needsUpdate=true;const mat=new T.MeshStandardMaterial({color,roughness:.95,map});const g=new T.SphereGeometry(1,24,12,0,Math.PI*2,0,Math.PI/2);
  this.inst(g,mat,n,(_,m)=>{const s=this.spot(r,8,ARENA*1.1),w=size*(.6+r()*.9);if(w>2.5)this.colliders.push({x:s.x,z:s.z,r:w*.6});m.compose(new T.Vector3(s.x,-.05,s.z),new T.Quaternion().setFromEuler(new T.Euler(0,r()*6,0)),new T.Vector3(w,w*(.18+r()*.2),w*(.6+r()*.6)));});
 }
 // giant ribcages of something that died in the basin long ago
 private bones(r:()=>number,n:number){
  const mat=new T.MeshStandardMaterial({color:'#d8ccb4',roughness:.7});
  for(let i=0;i<n;i++){const s=this.spot(r,10,ARENA*.9),g=new T.Group();g.position.set(s.x,0,s.z);g.rotation.y=r()*6;const size=1.5+r()*1.5;
   for(let k=0;k<6;k++){const rib=new T.Mesh(new T.TorusGeometry(size,.09*size/1.5,6,20,Math.PI*.8),mat);rib.position.set(0,0,k*.7-1.8);rib.rotation.z=Math.PI*.1;rib.castShadow=true;g.add(rib);}
   const spine=new T.Mesh(new T.CylinderGeometry(.12,.12,4.4,6),mat);spine.rotation.x=Math.PI/2;spine.position.set(-size*.2,size*.95,0);g.add(spine);this.group.add(g);this.colliders.push({x:s.x,z:s.z,r:size*.6});}
 }
 private camp(){
  const F=this.fire,g=this.group;
  const stone=new T.MeshStandardMaterial({color:'#3b3a38',roughness:.95,flatShading:true}),wood=new T.MeshStandardMaterial({color:'#2a1c12',roughness:.9});
  for(let i=0;i<9;i++){const a=i/9*6.283,m=new T.Mesh(new T.DodecahedronGeometry(.16+.05*((i*7)%3)),stone);m.position.set(F.x+Math.cos(a)*.65,.1,F.z+Math.sin(a)*.65);m.rotation.set(a,a*2,0);m.castShadow=true;g.add(m);}
  for(let i=0;i<4;i++){const a=i/4*Math.PI+.4,m=new T.Mesh(new T.CylinderGeometry(.07,.08,.9,6),wood);m.position.set(F.x,.14,F.z);m.rotation.set(Math.PI/2.3,a,0);m.castShadow=true;g.add(m);}
  const gl=new T.Sprite(new T.SpriteMaterial({map:glowTex('rgba(255,170,80,.95)','rgba(255,110,30,.35)'),blending:T.AdditiveBlending,depthWrite:false,transparent:true}));gl.scale.set(5.5,5.5,1);gl.position.set(F.x,.9,F.z);g.add(gl);
  this.fireLight=new T.PointLight('#ff8a3c',60,22,1.5);this.fireLight.position.set(F.x,1.3,F.z);g.add(this.fireLight);this.colliders.push({x:F.x,z:F.z,r:.9});this.flameSpots.push({p:new T.Vector3(F.x,.12,F.z),s:1});
  const lampTex=glowTex('rgba(255,225,170,1)','rgba(255,150,60,.4)');
  for(let i=0;i<5;i++){const a=i/5*6.283+.2,x=Math.cos(a)*15,z=Math.sin(a)*15;
   const post=new T.Mesh(new T.CylinderGeometry(.06,.08,2.6,6),wood);post.position.set(x,1.3,z);post.castShadow=true;g.add(post);
   const sp=new T.Sprite(new T.SpriteMaterial({map:lampTex,blending:T.AdditiveBlending,depthWrite:false,transparent:true}));sp.scale.set(1.8,1.8,1);sp.position.set(x,2.85,z);g.add(sp);
   const l=new T.PointLight('#ff9a48',12,12,1.8);l.position.set(x,3,z);g.add(l);this.torches.push(l);this.flameSpots.push({p:new T.Vector3(x,2.62,z),s:.32});this.colliders.push({x,z,r:.2});}
 }
 // a standing ring of stone with a swirling gate tinted like the destination
 private portal(pos:T.Vector3,to:BiomeId,dir:1|-1){
  const g=new T.Group();g.position.copy(pos);this.group.add(g);
  const stone=new T.MeshStandardMaterial({color:'#3a3a40',roughness:.8,flatShading:true});
  const ringM=new T.Mesh(new T.TorusGeometry(2,.32,10,32),stone);ringM.position.y=2.3;ringM.castShadow=true;g.add(ringM);
  for(const s of[-1,1]){const b=new T.Mesh(new T.BoxGeometry(.8,.6,.9),stone);b.position.set(s*2,.3,0);b.castShadow=true;g.add(b);}
  const col=new T.Color(BIOMES[to].hemi[0]);
  const mat=new T.ShaderMaterial({uniforms:{uT:{value:0},uC:{value:col}},transparent:true,depthWrite:false,blending:T.AdditiveBlending,side:T.DoubleSide,
   vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
   fragmentShader:'uniform float uT;uniform vec3 uC;varying vec2 vUv;void main(){vec2 p=vUv-.5;float r=length(p)*2.;if(r>1.)discard;float a=atan(p.y,p.x);float sw=.5+.5*sin(a*5.+r*12.-uT*4.);float c=(1.-r)*.6+sw*(1.-r*.8)*.6+smoothstep(.75,1.,r)*.8;gl_FragColor=vec4(uC*c*1.3,1.);}'});
  const disc=new T.Mesh(new T.CircleGeometry(1.75,40),mat);disc.position.y=2.3;g.add(disc);this.portalMats.push(mat);
  const gl=new T.Sprite(new T.SpriteMaterial({map:glowTex('rgba(255,255,255,.5)','rgba(255,255,255,.12)'),color:col,blending:T.AdditiveBlending,depthWrite:false,transparent:true}));gl.scale.set(7,7,1);gl.position.y=2.3;g.add(gl);
  this.portals.push({pos:pos.clone(),to,dir});
 }
 // the guardian's arena: a rune circle surrounded by tall obelisks
 private domainArena(r:()=>number){
  const stone=new T.MeshStandardMaterial({color:'#2a3238',roughness:.85,flatShading:true}),rune=new T.MeshStandardMaterial({color:'#4ff0ff',emissive:'#4ff0ff',emissiveIntensity:1.8});
  for(let i=0;i<12;i++){const a=i/12*Math.PI*2,x=Math.cos(a)*22,z=Math.sin(a)*22,h=5+r()*3;
   if(Math.abs(x)<5&&Math.abs(z)>15)continue;
   const m=new T.Mesh(new T.BoxGeometry(1.4,h,1.4),stone);m.position.set(x,h/2,z);m.rotation.y=-a;m.castShadow=m.receiveShadow=true;this.group.add(m);
   for(let k=0;k<4;k++){const b=new T.Mesh(new T.BoxGeometry(1.44,.08,1.44),rune);b.position.y=-h/2+1+k*1.1;m.add(b);}
   this.colliders.push({x,z,r:1.1});}
  const mat=new T.ShaderMaterial({uniforms:{uT:{value:0}},transparent:true,depthWrite:false,blending:T.AdditiveBlending,
   vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
   fragmentShader:'uniform float uT;varying vec2 vUv;void main(){vec2 p=vUv-.5;float r=length(p)*2.;float a=atan(p.y,p.x);float rings=smoothstep(.02,0.,abs(r-.95))+smoothstep(.015,0.,abs(r-.7))+smoothstep(.015,0.,abs(r-.4));float spokes=smoothstep(.04,0.,abs(sin(a*6.+uT*.2)))*step(.4,r)*step(r,.95);float glyph=step(.5,fract(a*12./6.2831+uT*.05))*smoothstep(.02,0.,abs(r-.82))*.0+smoothstep(.03,0.,abs(r-.82))*step(.5,fract(a*24./6.2831));float c=(rings+spokes*.5+glyph)*(.6+.4*sin(uT*1.5));gl_FragColor=vec4(vec3(.3,.9,1.)*c*.7,1.);}'});
  const m=new T.Mesh(new T.PlaneGeometry(36,36).rotateX(-Math.PI/2),mat);m.position.y=.04;this.group.add(m);this.portalMats.push(mat);
  for(let i=0;i<24;i++){const d=new T.Mesh(new T.DodecahedronGeometry(.3+r()*.6,0),stone);const a=r()*6.28,rr=8+r()*12;d.position.set(Math.cos(a)*rr,2+r()*5,Math.sin(a)*rr);d.rotation.set(r()*3,r()*3,0);d.castShadow=true;this.group.add(d);}
 }
 // drifting air: spores, glowing motes, ash, snow, blowing sand
 private makeAir(kind:string){
  if(kind==='none')return;
  const N=kind==='snow'?900:kind==='sand'?700:500,pos=new Float32Array(N*3),v=new Float32Array(N);
  for(let i=0;i<N;i++){pos[i*3]=(Math.random()-.5)*50;pos[i*3+1]=Math.random()*12;pos[i*3+2]=(Math.random()-.5)*50;v[i]=Math.random();}
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.BufferAttribute(pos,3));
  const C:Record<string,[string,number,boolean]>={spores:['#9dffcf',.08,true],motes:['#c8a8ff',.09,true],ash:['#8a8580',.09,false],snow:['#f4f8ff',.11,false],sand:['#d8b48a',.06,false]};
  const [c,s,add]=C[kind];
  this.air=new T.Points(geo,new T.PointsMaterial({color:c,size:s,transparent:true,opacity:add?.9:.75,depthWrite:false,blending:add?T.AdditiveBlending:T.NormalBlending}));this.air.frustumCulled=false;this.airV=v;this.group.add(this.air);
 }
 update(t:number,dt:number,focus:T.Vector3){
  if(this.fireLight)this.fireLight.intensity=58+Math.sin(t*7.1)*7+Math.sin(t*17.3)*5;
  this.torches.forEach((l,i)=>l.intensity=11+Math.sin(t*5.3+i*2.1)*1.6+Math.sin(t*13+i)*.8);
  for(const s of this.surfaces)s.uniforms.uT.value+=dt;
  for(const s of this.portalMats)s.uniforms.uT.value+=dt;
  if(this.air&&this.airV){const p=this.air.geometry.attributes.position as T.BufferAttribute,a=p.array as Float32Array,k=this.airKind;
   for(let i=0;i<this.airV.length;i++){const v=this.airV[i];let x=a[i*3],y=a[i*3+1],z=a[i*3+2];
    if(k==='snow'){y-=dt*(.8+v*.8);x+=Math.sin(t*.7+v*9)*dt*.4;}else if(k==='ash'){y-=dt*(.3+v*.4);x+=dt*.3;}else if(k==='sand'){x+=dt*(4+v*5);y+=Math.sin(t*2+v*7)*dt*.3;}else{y+=Math.sin(t*.8+v*9)*dt*.25;x+=Math.cos(t*.6+v*7)*dt*.25;}
    if(y<0)y+=12;if(y>12)y-=12;if(x-focus.x>25)x-=50;if(x-focus.x<-25)x+=50;if(z-focus.z>25)z-=50;if(z-focus.z<-25)z+=50;a[i*3]=x;a[i*3+1]=y;a[i*3+2]=z;}
   p.needsUpdate=true;}
  this.moon.target.position.copy(focus);this.moon.position.set(focus.x-14,26,focus.z+10);
 }
 resize(w:number,h:number,pr=1){this.composer.setPixelRatio(pr);this.composer.setSize(w,h);this.bloom.resolution.set(w*pr/2,h*pr/2);}
 render(camera:T.PerspectiveCamera,t:number){this.rp.camera=camera;(this.grade.uniforms.time as {value:number}).value=t%100;this.composer.render();}
 collide(p:T.Vector3,rad:number){
  for(const c of this.colliders){const dx=p.x-c.x,dz=p.z-c.z,d=Math.hypot(dx,dz),m=c.r+rad;if(d<m&&d>1e-4){p.x=c.x+dx/d*m;p.z=c.z+dz/d*m;}}
  const d=Math.hypot(p.x,p.z);if(d>ARENA){p.x*=ARENA/d;p.z*=ARENA/d;}
 }
}
