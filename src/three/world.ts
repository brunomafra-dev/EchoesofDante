import * as T from 'three';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {UnrealBloomPass} from 'three/addons/postprocessing/UnrealBloomPass.js';
import {ShaderPass} from 'three/addons/postprocessing/ShaderPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';

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
 constructor(renderer:T.WebGLRenderer,camera:T.PerspectiveCamera){
  const sc=this.scene;sc.background=new T.Color('#10151d');sc.fog=new T.FogExp2('#10151d',.03);
  sc.add(new T.HemisphereLight('#7f93bd','#2a2a22',1.25));
  this.moon.position.set(-14,26,10);this.moon.castShadow=true;
  const sh=this.moon.shadow;sh.mapSize.set(1024,1024);sh.camera.left=-22;sh.camera.right=22;sh.camera.top=22;sh.camera.bottom=-22;sh.camera.near=1;sh.camera.far=70;sh.bias=-.0006;sh.normalBias=.04;
  sc.add(this.moon,this.moon.target);
  const ground=new T.Mesh(new T.CircleGeometry(150,64).rotateX(-Math.PI/2),new T.MeshStandardMaterial({map:groundTex(),roughness:1,color:'#c4beb0'}));
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
  // rocks
  const rg=new T.DodecahedronGeometry(1,0),rocks=new T.InstancedMesh(rg,stone,90),m4=new T.Matrix4(),q=new T.Quaternion(),e=new T.Euler();
  for(let i=0;i<90;i++){
   const a=r()*6.283,d=7+Math.sqrt(r())*ARENA*1.1,s=.25+Math.pow(r(),2.2)*1.6;
   const x=Math.cos(a)*d,z=Math.sin(a)*d;e.set(r()*3,r()*3,r()*3);q.setFromEuler(e);
   m4.compose(new T.Vector3(x,s*.3,z),q,new T.Vector3(s*(1+r()*.5),s*.7,s*(1+r()*.5)));rocks.setMatrixAt(i,m4);
   if(s>.8)this.colliders.push({x,z,r:s*.9});
  }
  rocks.castShadow=rocks.receiveShadow=true;sc.add(rocks);
  // dead trees
  for(let i=0;i<26;i++){
   const a=r()*6.283,d=13+r()*ARENA*1.15,x=Math.cos(a)*d,z=Math.sin(a)*d,h=3.5+r()*3.5,t=new T.Group();
   const trunk=new T.Mesh(new T.CylinderGeometry(.1+.05*r(),.32+.1*r(),h,7),dark);trunk.position.y=h/2;trunk.castShadow=true;t.add(trunk);
   for(let b=0;b<5;b++){const bl=1.2+r()*1.8,br=new T.Mesh(new T.CylinderGeometry(.02,.08,bl,5),dark);const y=h*(.45+r()*.5);
    br.position.set(0,y,0);br.rotation.set((r()-.5)*1.2,r()*6.28,.7+r()*.7);br.translateY(bl/2);br.castShadow=true;t.add(br);}
   t.position.set(x,0,z);t.rotation.y=r()*6.28;sc.add(t);this.colliders.push({x,z,r:.45});
  }
  // gravestones and broken pillars
  const gm=new T.MeshStandardMaterial({color:'#5a5953',roughness:.9,flatShading:true});
  for(let i=0;i<22;i++){
   const a=r()*6.283,d=8+r()*22,x=Math.cos(a)*d,z=Math.sin(a)*d;
   if(Math.hypot(x-this.fire.x,z-this.fire.z)<4)continue;
   const w=.5+r()*.3,h=.7+r()*.8,g=new T.Mesh(new T.BoxGeometry(w,h,.16),gm);g.position.set(x,h/2-.05,z);g.rotation.set((r()-.5)*.25,r()*6.28,(r()-.5)*.25);g.castShadow=g.receiveShadow=true;sc.add(g);
   this.colliders.push({x,z,r:.4});
  }
  for(let i=0;i<7;i++){
   const a=i/7*6.283+.4,d=19+r()*3,x=Math.cos(a)*d,z=Math.sin(a)*d,h=2+r()*2.6;
   const p=new T.Mesh(new T.CylinderGeometry(.5,.62,h,9),gm);p.position.set(x,h/2,z);p.rotation.z=(r()-.5)*.06;p.castShadow=p.receiveShadow=true;sc.add(p);
   const cap=new T.Mesh(new T.BoxGeometry(1.4,.3,1.4),gm);cap.position.set(x,h+.1,z);cap.rotation.y=r();cap.castShadow=true;sc.add(cap);this.colliders.push({x,z,r:.7});
  }
  // dead grass
  const gg=new T.ConeGeometry(.05,.5,4),grass=new T.InstancedMesh(gg,new T.MeshStandardMaterial({color:'#3a4128',roughness:1}),1800);
  for(let i=0;i<1800;i++){const a=r()*6.283,d=Math.sqrt(r())*ARENA*1.3;e.set((r()-.5)*.5,r()*6,(r()-.5)*.5);q.setFromEuler(e);const s=.5+r()*1.3;
   m4.compose(new T.Vector3(Math.cos(a)*d,.2*s,Math.sin(a)*d),q,new T.Vector3(s,s,s));grass.setMatrixAt(i,m4);}
  grass.castShadow=false;grass.receiveShadow=false;sc.add(grass);
  // torches on posts
  const lampTex=glowTex('rgba(255,225,170,1)','rgba(255,150,60,.4)');
  for(let i=0;i<5;i++){
   const a=i/5*6.283+.2,x=Math.cos(a)*15,z=Math.sin(a)*15;
   const post=new T.Mesh(new T.CylinderGeometry(.06,.08,2.6,6),dark);post.position.set(x,1.3,z);post.castShadow=true;sc.add(post);
   const fl=new T.Mesh(new T.ConeGeometry(.16,.5,6,1,true),new T.MeshBasicMaterial({color:'#ffb050',transparent:true,opacity:.9,blending:T.AdditiveBlending,depthWrite:false}));fl.position.set(x,2.85,z);sc.add(fl);this.flames.push(fl);
   const sp=new T.Sprite(new T.SpriteMaterial({map:lampTex,blending:T.AdditiveBlending,depthWrite:false,transparent:true}));sp.scale.set(1.8,1.8,1);sp.position.set(x,2.85,z);sc.add(sp);
   const l=new T.PointLight('#ff9a48',12,12,1.8);l.position.set(x,3,z);sc.add(l);this.torches.push(l);
   this.colliders.push({x,z,r:.2});
  }
 }
 private buildFire(){
  const F=this.fire,sc=this.scene;
  const stone=new T.MeshStandardMaterial({color:'#3b3a38',roughness:.95,flatShading:true}),wood=new T.MeshStandardMaterial({color:'#2a1c12',roughness:.9});
  for(let i=0;i<9;i++){const a=i/9*6.283,m=new T.Mesh(new T.DodecahedronGeometry(.16+.05*((i*7)%3)),stone);m.position.set(F.x+Math.cos(a)*.65,.1,F.z+Math.sin(a)*.65);m.rotation.set(a,a*2,0);m.castShadow=true;sc.add(m);}
  for(let i=0;i<4;i++){const a=i/4*Math.PI+.4,m=new T.Mesh(new T.CylinderGeometry(.07,.08,.9,6),wood);m.position.set(F.x,.14,F.z);m.rotation.set(Math.PI/2.3,a,0);m.castShadow=true;sc.add(m);}
  const fm=new T.MeshBasicMaterial({color:'#ff9a3a',transparent:true,opacity:.9,blending:T.AdditiveBlending,depthWrite:false});
  const f1=new T.Mesh(new T.ConeGeometry(.34,1.15,8,1,true),fm);f1.position.set(F.x,.7,F.z);sc.add(f1);this.flames.push(f1);
  const f2=new T.Mesh(new T.ConeGeometry(.17,.7,8,1,true),new T.MeshBasicMaterial({color:'#ffe9a8',transparent:true,opacity:.95,blending:T.AdditiveBlending,depthWrite:false}));f2.position.set(F.x,.5,F.z);sc.add(f2);
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
