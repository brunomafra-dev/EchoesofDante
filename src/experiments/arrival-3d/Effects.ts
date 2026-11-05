import * as T from 'three';
import {identity} from './Identity';
import type {ClassId} from './model';
type Particle={p:T.Vector3;v:T.Vector3;age:number;life:number;size:number;color:T.Color;gravity:number};
type Effect={root:T.Group;age:number;life:number;kind:string;radius:number;element:number;direction:T.Vector3;anchor?:()=>T.Vector3;end?:T.Vector3};
export const ELEMENT_COLORS=['#b49aee','#ef9d43','#65b9dd','#b3a280'];
const PALETTE=ELEMENT_COLORS;
export const projectileStyle=(id:string,element=0)=>id==='hunter'?'plasma':id==='xenobinder'?'bond':['energy','fire','water','earth'][element]??'energy';
function stoneShard(){const vertices:number[]=[],indices:number[]=[];for(let level=0;level<3;level++)for(let i=0;i<7;i++){const a=i/7*Math.PI*2,r=[.27,.21,.09][level]*(.8+Math.sin(i*5+level)*.16);vertices.push(Math.cos(a)*r+level*.035,level*.42+Math.sin(i*3+level)*.045,Math.sin(a)*r);}vertices.push(.13,1.1,-.04);for(let level=0;level<2;level++)for(let i=0;i<7;i++){const a=level*7+i,b=level*7+(i+1)%7;indices.push(a,a+7,b,b,a+7,b+7);}for(let i=0;i<7;i++)indices.push(14+i,21,14+(i+1)%7);for(let i=1;i<6;i++)indices.push(0,i,i+1);const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(vertices,3));g.setIndex(indices);const flat=g.toNonIndexed();g.dispose();flat.computeVertexNormals();const colors:number[]=[];for(let i=0;i<flat.attributes.position.count;i++){const y=flat.attributes.position.getY(i),shade=.72+Math.sin(y*22)*.08+y*.1;colors.push(shade,shade,shade*.92);}flat.setAttribute('color',new T.Float32BufferAttribute(colors,3));return flat;}

/** Small bounded particle buffer and reusable geometry; gameplay remains in Combat. */
export class ArrivalEffects{
 readonly root=new T.Group();private effects:Effect[]=[];private particles:Particle[]=[];private cursor=0;private seed=186;private time=0;
 private projectiles=new Map<string,T.Group[]>();private liveProjectiles=new Set<T.Group>();
 private demoShots:{root:T.Group;direction:T.Vector3;age:number}[]=[];
 private geometry=new T.BufferGeometry();private positions=new Float32Array(192*3);private colors=new Float32Array(192*3);private sizes=new Float32Array(192);
 private pointsMaterial=new T.ShaderMaterial({transparent:true,depthWrite:false,blending:T.AdditiveBlending,vertexColors:true,
  vertexShader:'attribute float pointSize;varying vec3 tint;varying float alive;void main(){tint=color;alive=step(.0001,pointSize);vec4 p=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*p;gl_PointSize=clamp(pointSize*400./max(1.,-p.z),0.,64.);}',
  fragmentShader:'varying vec3 tint;varying float alive;void main(){if(alive<.5)discard;float r=length(gl_PointCoord-.5)*2.;float a=pow(max(0.,1.-r),2.);if(a<.015)discard;gl_FragColor=vec4(tint,a);#include <tonemapping_fragment>\n#include <colorspace_fragment>}' .replace(';#include',';\n#include')});
 private arc=new T.TorusGeometry(1,.035,5,40,Math.PI*.74).rotateX(Math.PI/2).rotateY(-Math.PI*.13);
 private ring=new T.TorusGeometry(1,.018,4,40).rotateX(-Math.PI/2);
 private spike=stoneShard();private line=new T.CylinderGeometry(1,1,1,6).rotateX(Math.PI/2);private flame=new T.PlaneGeometry(1,1,2,6).translate(0,.5,0);
 private resources:T.BufferGeometry[]=[];
 private blade?:()=>{base:T.Vector3;tip:T.Vector3};private bladeLeft=0;private bladeSamples:{base:T.Vector3;tip:T.Vector3;life:number}[]=[];
 private bladeGeometry=new T.BufferGeometry();private bladePositions=new Float32Array(16*6*3);private bladeColors=new Float32Array(16*6*4);private bladeMaterial=new T.MeshBasicMaterial({vertexColors:true,transparent:true,opacity:.30,depthWrite:false,side:T.DoubleSide});private bladeMesh=new T.Mesh(this.bladeGeometry,this.bladeMaterial);
 bindBlade(sample:()=>{base:T.Vector3;tip:T.Vector3}){this.blade=sample;}
 beginBladeTrail(seconds=.24){this.resetTrail();this.bladeLeft=seconds;}
 resetTrail(){this.bladeSamples=[];this.bladeLeft=0;this.bladeGeometry.setDrawRange(0,0);}
 channel(p:T.Vector3,id:string,element=0){const color=id==='astral'?PALETTE[element]:id==='xenobinder'?'#a8bd72':'#d8b477';for(let i=0;i<5;i++){const a=i/5*Math.PI*2;this.mote(p,color,.07,.16,new T.Vector3(Math.cos(a)*.6,.15,Math.sin(a)*.6));}}
 private updateBlade(dt:number){
  for(const s of this.bladeSamples)s.life-=dt;this.bladeSamples=this.bladeSamples.filter(s=>s.life>0);
  if(this.blade&&this.bladeLeft>0){this.bladeLeft-=dt;const sample=this.blade();sample.base.lerp(sample.tip,.65);const previous=this.bladeSamples.at(-1);if(previous&&previous.base.distanceTo(sample.base)>2)this.resetTrail();else{this.bladeSamples.push({...sample,life:.08});if(this.bladeSamples.length>17)this.bladeSamples.shift();}}
  let vertex=0;for(let i=1;i<this.bladeSamples.length;i++){const a=this.bladeSamples[i-1],b=this.bladeSamples[i];for(const [p,life]of[[a.base,a.life],[a.tip,a.life],[b.tip,b.life],[a.base,a.life],[b.tip,b.life],[b.base,b.life]]as const){p.toArray(this.bladePositions,vertex*3);this.bladeColors.set([.43,.79,.87,Math.max(0,life/.11)],vertex*4);vertex++;}}
  this.bladeGeometry.setDrawRange(0,vertex);this.bladeGeometry.attributes.position.needsUpdate=true;this.bladeGeometry.attributes.color.needsUpdate=true;
 }
 inspect(){return{effects:this.effects.length,kinds:this.effects.map(e=>e.kind+(e.kind==='field'?'-'+e.element:'')),particles:this.particles.filter(p=>p.age<p.life).length,bladeVertices:this.bladeGeometry.drawRange.count,bladeSegments:this.bladeSamples.length,projectiles:[...this.liveProjectiles].map(p=>({style:p.userData.projectileStyle,position:p.position.toArray()})),pooledProjectiles:[...this.projectiles.values()].reduce((n,p)=>n+p.length,0)};}
 acquireProjectile(id:string,element=0){const style=projectileStyle(id,element),pool=this.projectiles.get(style)??[];this.projectiles.set(style,pool);const root=pool.pop()??identity('fx-'+style);root.userData.projectileStyle=style;root.scale.setScalar(1);this.liveProjectiles.add(root);return root;}
 releaseProjectile(root:T.Group){root.removeFromParent();this.liveProjectiles.delete(root);const pool=this.projectiles.get(root.userData.projectileStyle)??[];if(pool.length<8)pool.push(root);this.projectiles.set(root.userData.projectileStyle,pool);}
 previewShot(origin:T.Vector3,direction:T.Vector3,id:string,element=0){const root=this.acquireProjectile(id,element);root.position.copy(origin);root.quaternion.setFromUnitVectors(new T.Vector3(0,0,1),direction);this.root.add(root);this.demoShots.push({root,direction:direction.clone(),age:0});this.muzzle(origin,direction,id,element);}
 private model(e:Effect,name:string){const root=identity(name),materials=new Map<T.Material,T.Material>();root.traverse(o=>{if(o instanceof T.Mesh){const use=(source:T.Material)=>{let m=materials.get(source);if(!m){m=source.clone();m.transparent=true;m.depthWrite=false;m.userData.fxOpacity=name==='fx-plasma-beam'?(/shell/i.test(m.name)?.20:.95):name==='fx-water-vortex'?.55:.72;if(name==='fx-plasma-beam')m.blending=T.AdditiveBlending;materials.set(source,m);}return m;};o.material=Array.isArray(o.material)?o.material.map(use):use(o.material);}});e.root.add(root);return root;}
 constructor(){
  this.bladeGeometry.setAttribute('position',new T.BufferAttribute(this.bladePositions,3).setUsage(T.DynamicDrawUsage));this.bladeGeometry.setAttribute('color',new T.BufferAttribute(this.bladeColors,4).setUsage(T.DynamicDrawUsage));this.bladeGeometry.setDrawRange(0,0);this.bladeMesh.frustumCulled=false;this.root.add(this.bladeMesh);
  this.geometry.setAttribute('position',new T.BufferAttribute(this.positions,3).setUsage(T.DynamicDrawUsage));this.geometry.setAttribute('color',new T.BufferAttribute(this.colors,3).setUsage(T.DynamicDrawUsage));this.geometry.setAttribute('pointSize',new T.BufferAttribute(this.sizes,1).setUsage(T.DynamicDrawUsage));
  const points=new T.Points(this.geometry,this.pointsMaterial);points.frustumCulled=false;this.root.add(points);this.resources=[this.geometry,this.arc,this.ring,this.spike,this.line,this.flame];
  for(let i=0;i<192;i++)this.particles.push({p:new T.Vector3(),v:new T.Vector3(),age:1,life:0,size:0,color:new T.Color(),gravity:0});
 }
 private rand(){this.seed=(this.seed*1664525+1013904223)>>>0;return this.seed/4294967296;}
 private mote(p:T.Vector3,color:string,size:number,life:number,v:T.Vector3,gravity=0){const s=this.particles[this.cursor++%this.particles.length];s.p.copy(p);s.color.set(color);s.size=size;s.life=life;s.age=0;s.v.copy(v);s.gravity=gravity;}
 impact(p:T.Vector3,color='#dbcba3',count=7){for(let i=0;i<count;i++){const a=this.rand()*Math.PI*2,speed=.6+this.rand()*1.8;this.mote(p.clone().add(new T.Vector3(0,.45,0)),color,.10+this.rand()*.10,.16+this.rand()*.28,new T.Vector3(Math.cos(a)*speed,.4+this.rand()*1.8,Math.sin(a)*speed),-5);}}
 private add(kind:string,p:T.Vector3,life:number,radius:number,color:string,direction=new T.Vector3(0,0,1),element=0){
  const root=new T.Group();root.position.copy(p);root.position.y+=.08;root.rotation.y=Math.atan2(direction.x,direction.z);this.root.add(root);
  const e:Effect={root,age:0,life,kind,radius,direction:direction.clone(),element};this.effects.push(e);
  const m=new T.MeshBasicMaterial({color,transparent:true,opacity:.55,depthWrite:false,toneMapped:false});
  return{e,m};
 }
 slash(p:T.Vector3,direction:T.Vector3,power=false){const{e,m}=this.add(power?'wave':'slash',p,power?.34:.25,power?2.2:1.6,'#9ee6e8',direction);m.dispose();const arc=this.model(e,'fx-blade-sweep');arc.position.y=power?.2:.85;arc.rotation.z=power?0:-.18;arc.scale.setScalar(power?1.3:1.5);}
 beam(p:T.Vector3,direction:T.Vector3,reach:number,anchor?:()=>T.Vector3){const{e,m}=this.add('beam',p,.52,reach,'#91e4f5',direction);m.dispose();e.anchor=anchor??(()=>p.clone().add(new T.Vector3(0,1.42,0)));e.end=p.clone().addScaledVector(direction,reach);e.end.y=e.anchor().y;this.model(e,'fx-plasma-beam');this.alignBeam(e);this.muzzle(e.anchor(),direction,'hunter',0,true);}
 private alignBeam(e:Effect){if(!e.anchor||!e.end)return;const start=e.anchor(),delta=e.end.clone().sub(start),length=delta.length();e.root.visible=delta.x*e.direction.x+delta.z*e.direction.z>0;if(!e.root.visible)return;e.root.position.copy(start);e.root.quaternion.setFromUnitVectors(new T.Vector3(0,0,1),delta.normalize());const width=Math.min(1,e.age/.035+.3)*Math.min(1,(e.life-e.age)/.18);e.root.children[0].scale.set(width,width,length);}
 muzzle(p:T.Vector3,direction:T.Vector3,id:string,element=0,power=false){const c=id==='hunter'?'#a7efff':id==='astral'?PALETTE[element]:'#b2cb7c';for(let i=0;i<(power?16:5);i++)this.mote(p,c,power?.32:.16,.08+this.rand()*.14,direction.clone().multiplyScalar(1+this.rand()*3));}
 charging(p:T.Vector3,direction:T.Vector3,id:ClassId,element:number,amount:number){if(id!=='hunter'){this.channel(p,id,element);return;}const across=new T.Vector3(direction.z,0,-direction.x),t=(this.time*2.5)%1;for(const side of[-1,1])this.mote(p.clone().addScaledVector(across,side*(1-t)*.22), '#88ddeb',.07+amount*.05,.09,direction.clone().multiplyScalar(.5));}
 field(p:T.Vector3,radius:number,element:number,life:number){
  const{e,m}=this.add('field',p,life,radius,PALETTE[element],new T.Vector3(0,0,1),element);e.root.position.y=p.y+.015;
  if(element===0){m.dispose();this.model(e,'fx-energy-cage').scale.set(radius,1,radius);}
  if(element===1){
   m.dispose();const fire=new T.ShaderMaterial({transparent:true,depthWrite:false,side:T.DoubleSide,toneMapped:false,uniforms:{time:{value:0},opacity:{value:1}},
    vertexShader:'varying vec2 flameUv;varying float phase;uniform float time;void main(){flameUv=uv;phase=instanceMatrix[3].x*7.+instanceMatrix[3].z*3.;vec3 p=position;p.x+=sin(uv.y*8.-time*5.+phase)*uv.y*uv.y*.12;gl_Position=projectionMatrix*modelViewMatrix*instanceMatrix*vec4(p,1.);}',
    fragmentShader:'varying vec2 flameUv;varying float phase;uniform float time;uniform float opacity;void main(){float y=flameUv.y;float sway=sin(y*11.-time*7.+phase)*.08*y;float width=.45*pow(1.-y,.8);float x=abs(flameUv.x-.5-sway);float a=(1.-smoothstep(width*.45,width,x))*smoothstep(0.,.10,y)*opacity*.85;if(a<.015)discard;float core=1.-smoothstep(.0,width*.75,x);vec3 color=mix(vec3(.63,.075,.008),vec3(1.,.39,.025),core);color=mix(color,vec3(1.,.76,.21),core*pow(1.-y,2.));gl_FragColor=vec4(color,a);\n#include <colorspace_fragment>\n}'});
   const cards=new T.InstancedMesh(this.flame,fire,18),node=new T.Object3D();for(let i=0;i<9;i++){const a=i/9*Math.PI*2,r=(i%3===0?.25:.67)*radius;for(let side=0;side<2;side++){node.position.set(Math.cos(a)*r,0,Math.sin(a)*r);node.rotation.y=a+side*Math.PI/2;node.scale.set(.35+this.rand()*.2,.45+this.rand()*.55,1);node.updateMatrix();cards.setMatrixAt(i*2+side,node.matrix);}}cards.frustumCulled=false;e.root.add(cards);
  }
  if(element===2){m.dispose();this.model(e,'fx-water-vortex').scale.set(radius,1.6,radius);}
  if(element===3){
   // Solid transient stone spikes, not glowing cones for every element.
   m.dispose();const stone=new T.MeshStandardMaterial({color:'#807c62',roughness:.95,vertexColors:true});
   for(let i=0;i<7;i++){const a=i/7*Math.PI*2,spike=new T.Mesh(this.spike,stone);spike.position.set(Math.cos(a)*radius*.62,-.05,Math.sin(a)*radius*.62);spike.scale.set(.8+this.rand()*.6,.45+this.rand()*.65,.8+this.rand()*.6);spike.rotation.set(0,a,(this.rand()-.5)*.35);spike.castShadow=true;e.root.add(spike);}
   this.impact(p,'#b5a687',18);
  }
 }
 trail(p:T.Vector3,id:string,element=0){if(this.rand()>.6)return;this.mote(p,id==='hunter'?'#8ad9ed':id==='astral'?PALETTE[element]:'#b1c87e',id==='hunter'?.09:.10,.10+this.rand()*.12,new T.Vector3(0,element===2?-.15:.03,0));}
 update(dt:number){
  this.time+=dt;this.updateBlade(dt);
  for(const shot of [...this.demoShots]){shot.age+=dt;shot.root.position.addScaledVector(shot.direction,dt*6);if(shot.age>.55){this.releaseProjectile(shot.root);this.demoShots.splice(this.demoShots.indexOf(shot),1);}}
  for(const e of [...this.effects]){
   if(e.kind==='beam')this.alignBeam(e);
   e.age+=dt;const t=e.age/e.life,fade=Math.min(1,(1-t)*4);e.root.traverse(o=>{if(o instanceof T.Mesh){const mats=Array.isArray(o.material)?o.material:[o.material];for(const mat of mats){if(mat instanceof T.MeshBasicMaterial||mat instanceof T.MeshStandardMaterial&&mat.transparent)mat.opacity=fade*(mat.userData.fxOpacity??.55);if(mat instanceof T.ShaderMaterial){mat.uniforms.time.value=this.time;mat.uniforms.opacity.value=fade;}}}});
   if(e.kind==='slash'){e.root.rotation.y+=dt*5;e.root.scale.setScalar(.7+t*.6);}
   if(e.kind==='wave'){e.root.position.addScaledVector(e.direction,dt*12);e.root.scale.setScalar(.8+t*.5);}
   if(e.kind==='field'){
    if(e.element<3){e.root.rotation.y+=dt*(e.element===2?1.2:2.5);for(const [i,o]of e.root.children.entries())o.position.y=.08+Math.sin(this.time*3+i)*.035;}
    if(e.element===3)e.root.scale.y=Math.min(1,e.age/.12,Math.max(0,(e.life-e.age)/.18));
    const emission=e.element===1?28:e.element===2?14:10;
    if(Math.floor((e.age-dt)*emission)!==Math.floor(e.age*emission)){
     const a=this.rand()*Math.PI*2,r=Math.sqrt(this.rand())*e.radius*.82,p=e.root.position.clone().add(new T.Vector3(Math.cos(a)*r,.08,Math.sin(a)*r));
     this.mote(p,PALETTE[e.element],e.element===1?.09:.12,.35+this.rand()*.5,new T.Vector3(Math.cos(a)*.25,e.element===1?.7+this.rand():e.element===2?.5:.25,Math.sin(a)*.25),e.element===2?-1.5:0);
    }
   }
   if(t>=1){this.remove(e);this.effects.splice(this.effects.indexOf(e),1);}
  }
  for(let i=0;i<this.particles.length;i++){const p=this.particles[i];p.age+=dt;if(p.age<p.life){p.v.y+=p.gravity*dt;p.p.addScaledVector(p.v,dt);p.p.toArray(this.positions,i*3);p.color.toArray(this.colors,i*3);this.sizes[i]=p.size*Math.min(1,(1-p.age/p.life)*2);}else this.sizes[i]=0;}
  for(const a of Object.values(this.geometry.attributes))a.needsUpdate=true;
 }
 private remove(e:Effect){e.root.removeFromParent();const mats=new Set<T.Material>();e.root.traverse(o=>{if(o instanceof T.Mesh)for(const m of Array.isArray(o.material)?o.material:[o.material])mats.add(m);});mats.forEach(m=>m.dispose());}
 clear(){this.resetTrail();for(const shot of this.demoShots)this.releaseProjectile(shot.root);this.demoShots=[];for(const e of this.effects)this.remove(e);this.effects=[];for(const p of this.particles)p.life=0;this.sizes.fill(0);this.geometry.attributes.pointSize.needsUpdate=true;}
 dispose(){this.clear();for(const p of this.liveProjectiles)p.removeFromParent();this.liveProjectiles.clear();this.projectiles.clear();this.resources.forEach(g=>g.dispose());this.pointsMaterial.dispose();this.bladeGeometry.dispose();this.bladeMaterial.dispose();this.root.removeFromParent();}
}
