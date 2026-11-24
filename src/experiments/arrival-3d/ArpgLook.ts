import * as T from 'three';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {UnrealBloomPass} from 'three/addons/postprocessing/UnrealBloomPass.js';
import {ShaderPass} from 'three/addons/postprocessing/ShaderPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
import type {ArrivalWorld} from './World';

// Dark action-RPG presentation (Diablo / Path of Exile mood): low cold ambient,
// a warm light pool that follows the hero, heavy fog, bloom, split-toned grading,
// vignette and grain. Opt-in with ?look=arpg; the default scene is untouched.
export const arpgEnabled=():boolean=>new URLSearchParams(location.search).get('look')==='arpg';

const GRADE={
 uniforms:{tDiffuse:{value:null},time:{value:0}},
 vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
 fragmentShader:`uniform sampler2D tDiffuse;uniform float time;varying vec2 vUv;
 float hash(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}
 void main(){
  vec4 c=texture2D(tDiffuse,vUv);
  float l=dot(c.rgb,vec3(.2126,.7152,.0722));
  vec3 g=mix(vec3(l),c.rgb,.66);
  g=mix(g*vec3(.84,.95,1.12),g*vec3(1.16,1.0,.82),smoothstep(.05,.5,l));
  g=pow(max(g,0.),vec3(1.14))*1.12;
  vec2 d=vUv-.5;float v=smoothstep(.86,.2,length(d*vec2(1.,.92)));
  g*=mix(.22,1.,v);
  g+=(hash(vUv*vec2(1920.,1080.)+time)-.5)*.022;
  gl_FragColor=vec4(max(g,0.),c.a);
 }`,
};

function glowTexture(inner:string,outer:string):T.CanvasTexture{
 const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d')!;
 const r=g.createRadialGradient(32,32,0,32,32,32);r.addColorStop(0,inner);r.addColorStop(.35,outer);r.addColorStop(1,'rgba(0,0,0,0)');
 g.fillStyle=r;g.fillRect(0,0,64,64);const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;return t;
}
const EMBERS=110;

export class ArpgLook{
 private composer:EffectComposer;private bloom:UnrealBloomPass;private grade:ShaderPass;
 private torch=new T.PointLight('#ff9a4d',26,17,1.6);
 private rim=new T.DirectionalLight('#6f8fd8',.9);
 private base=new Map<T.Light,number>();
 private camp=new T.Group();private fire=new T.PointLight('#ff8a3c',70,24,1.5);private flame=new T.Mesh();
 private lamps:T.PointLight[]=[];private portalGlow=new T.PointLight('#58e0ff',22,13,1.7);
 private embers!:T.Points;private emberSeed=new Float32Array(EMBERS*3);private last=performance.now()/1000;private grassDone=false;
 constructor(renderer:T.WebGLRenderer,private world:ArrivalWorld){
  const size=renderer.getSize(new T.Vector2());
  this.composer=new EffectComposer(renderer);
  this.composer.setPixelRatio(renderer.getPixelRatio());
  this.composer.setSize(size.x,size.y);
  this.composer.addPass(new RenderPass(world.scene,new T.PerspectiveCamera()));
  this.bloom=new UnrealBloomPass(new T.Vector2(size.x,size.y),.38,.55,.78);
  this.composer.addPass(this.bloom);
  this.grade=new ShaderPass(GRADE);this.composer.addPass(this.grade);
  this.composer.addPass(new OutputPass());
  world.scene.traverse(o=>{if((o as T.Light).isLight&&!(o as T.DirectionalLight).isDirectionalLight)this.base.set(o as T.Light,(o as T.Light).intensity);});
  world.scene.add(this.torch,this.rim,this.rim.target);
  this.buildCamp();
 }
 private buildCamp(){
  const FIRE=new T.Vector3(15.5,0,14.5);
  this.camp.position.set(0,0,0);
  // stone ring + logs
  const stone=new T.MeshStandardMaterial({color:'#3b3a38',roughness:.95}),wood=new T.MeshStandardMaterial({color:'#2a1c12',roughness:.9});
  for(let i=0;i<9;i++){const a=i/9*Math.PI*2,m=new T.Mesh(new T.DodecahedronGeometry(.16+.05*((i*7)%3)),stone);m.position.set(FIRE.x+Math.cos(a)*.62,.1,FIRE.z+Math.sin(a)*.62);m.rotation.set(a,a*2,0);m.castShadow=true;this.camp.add(m);}
  for(let i=0;i<4;i++){const a=i/4*Math.PI+.4,m=new T.Mesh(new T.CylinderGeometry(.07,.08,.9,6),wood);m.position.set(FIRE.x,.14,FIRE.z);m.rotation.set(Math.PI/2.3,a,0);m.castShadow=true;this.camp.add(m);}
  // flame: three additive cones that flicker
  const fm=new T.MeshBasicMaterial({color:'#ff9a3a',transparent:true,opacity:.9,blending:T.AdditiveBlending,depthWrite:false});
  const flame=new T.Mesh(new T.ConeGeometry(.34,1.15,8,1,true),fm);flame.position.set(FIRE.x,.7,FIRE.z);this.flame=flame;this.camp.add(flame);
  const core=new T.Mesh(new T.ConeGeometry(.17,.7,8,1,true),new T.MeshBasicMaterial({color:'#ffe9a8',transparent:true,opacity:.95,blending:T.AdditiveBlending,depthWrite:false}));core.position.set(FIRE.x,.5,FIRE.z);this.camp.add(core);
  const glow=new T.Sprite(new T.SpriteMaterial({map:glowTexture('rgba(255,170,80,.95)','rgba(255,110,30,.35)'),blending:T.AdditiveBlending,depthWrite:false,transparent:true}));glow.scale.set(5.5,5.5,1);glow.position.set(FIRE.x,.9,FIRE.z);this.camp.add(glow);
  this.fire.position.set(FIRE.x,1.3,FIRE.z);this.fire.castShadow=false;this.camp.add(this.fire);
  // lanterns at the three shelters
  const lampTex=glowTexture('rgba(255,225,170,1)','rgba(255,160,70,.4)');
  for(const [x,z] of [[8,15.0],[19,14.8],[25,9.2]] as const){
   const l=new T.PointLight('#ffb36b',14,11,1.8);l.position.set(x,2.15,z+.2);this.camp.add(l);this.lamps.push(l);
   const bulb=new T.Mesh(new T.SphereGeometry(.09,10,8),new T.MeshBasicMaterial({color:'#ffe2a8'}));bulb.position.copy(l.position);this.camp.add(bulb);
   const sp=new T.Sprite(new T.SpriteMaterial({map:lampTex,blending:T.AdditiveBlending,depthWrite:false,transparent:true}));sp.scale.set(1.6,1.6,1);sp.position.copy(l.position);this.camp.add(sp);
  }
  // cold glow at the portal stelae
  this.portalGlow.position.set(31,1.7,20);this.camp.add(this.portalGlow);
  const ps=new T.Sprite(new T.SpriteMaterial({map:glowTexture('rgba(150,240,255,.9)','rgba(60,200,255,.3)'),blending:T.AdditiveBlending,depthWrite:false,transparent:true}));ps.scale.set(4.2,4.2,1);ps.position.set(31,1.8,20);this.camp.add(ps);
  // rising embers
  const pos=new Float32Array(EMBERS*3);for(let i=0;i<EMBERS;i++){this.emberSeed[i*3]=Math.random()*6.28;this.emberSeed[i*3+1]=.4+Math.random()*1.1;this.emberSeed[i*3+2]=Math.random();pos[i*3]=FIRE.x;pos[i*3+1]=Math.random()*5;pos[i*3+2]=FIRE.z;}
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.BufferAttribute(pos,3));
  this.embers=new T.Points(geo,new T.PointsMaterial({color:'#ffb060',size:.07,transparent:true,opacity:.9,blending:T.AdditiveBlending,depthWrite:false,sizeAttenuation:true}));
  this.embers.userData.fire=FIRE;this.camp.add(this.embers);
  this.world.scene.add(this.camp);
 }
 // darker, cooler, more varied grass than the default flat green
 private recolourGrass(){
  this.world.scene.traverse(o=>{
   const m=o as T.InstancedMesh;
   if(!m.isInstancedMesh||!m.instanceColor||m.geometry.attributes.position.count!==5)return;
   const c=new T.Color();
   for(let i=0;i<m.count;i++){const r=Math.random();c.setHSL(r<.12?.1+Math.random()*.04:.22+Math.random()*.08,.22+Math.random()*.2,.12+Math.random()*.16);m.setColorAt(i,c);}
   m.instanceColor.needsUpdate=true;
  });
  this.grassDone=true;
 }
 resize(w:number,h:number){this.composer.setSize(w,h);this.bloom.resolution.set(w,h);}
 render(scene:T.Scene,camera:T.PerspectiveCamera,hero?:T.Object3D){
  const t=performance.now()/1000,cave=this.world.zone==='cavern'||this.world.zone==='warden';
  const bg=cave?'#0a0c10':'#101517';
  (scene.background as T.Color).set(bg);
  if(scene.fog)(scene.fog as T.FogExp2).color.set(bg),(scene.fog as T.FogExp2).density=cave?.04:.03;
  const sky=(this.world as unknown as {sky?:T.Object3D}).sky;if(sky)sky.visible=false;
  for(const [light,intensity] of this.base)light.intensity=intensity*((light as T.HemisphereLight).isHemisphereLight?.22:.3);
  const now=t,dt=Math.min(.05,now-this.last);this.last=now;
  if(!this.grassDone)this.recolourGrass();
  this.camp.visible=this.world.zone==='base';
  if(this.camp.visible){
   this.fire.intensity=62+Math.sin(t*7.1)*7+Math.sin(t*17.3)*5;
   this.flame.scale.set(1+Math.sin(t*11)*.08,1+Math.sin(t*9.3)*.14+Math.sin(t*21)*.06,1+Math.cos(t*10)*.08);
   this.lamps.forEach((l,i)=>{l.intensity=13+Math.sin(t*5.3+i*2.1)*1.6+Math.sin(t*13+i)*.8;});
   this.portalGlow.intensity=21+Math.sin(t*2.2)*4;
   const pos=this.embers.geometry.attributes.position as T.BufferAttribute,F=this.embers.userData.fire as T.Vector3;
   for(let i=0;i<EMBERS;i++){let y=pos.getY(i)+dt*this.emberSeed[i*3+1];if(y>5.5){y=.5;pos.setX(i,F.x+(Math.random()-.5)*.6);pos.setZ(i,F.z+(Math.random()-.5)*.6);this.emberSeed[i*3]=Math.random()*6.28;}pos.setY(i,y);pos.setX(i,pos.getX(i)+Math.sin(t*1.7+this.emberSeed[i*3])*dt*.35);}
   pos.needsUpdate=true;
  }
  this.world.sun.intensity=cave?.55:1.0;this.world.sun.color.set(cave?'#7f8fbf':'#ff9e5c');
  if(hero){
   hero.getWorldPosition(this.torch.position);this.torch.position.y+=2.5;this.torch.position.z+=.6;
   this.torch.intensity=24+Math.sin(t*9)*2.4+Math.sin(t*23.3)*1.4;
   this.rim.position.set(hero.position.x+4,hero.position.y+5,hero.position.z-5);this.rim.target.position.copy(hero.position);
  }
  (this.grade.uniforms.time as {value:number}).value=t%100;
  (this.composer.passes[0] as RenderPass).camera=camera;
  this.composer.render();
 }
}
