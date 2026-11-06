import * as T from 'three';
import {GLTFLoader,type GLTF}from'three/addons/loaders/GLTFLoader.js';
import {clone}from'three/addons/utils/SkeletonUtils.js';
import {WARDEN as W,WARDEN_PATTERNS,type WardenAttack,type WardenPhase}from'../../config/warden';
import {WARDEN_ARENA as A}from'../../config/wardenArena';
import type{ArrivalWorld}from'./World';
export type WardenVisual='original'|'proposal';
const sources=new Map<WardenVisual,{gltf:GLTF;visual:WardenVisual;message:string}>(),pending=new Map<WardenVisual,Promise<void>>();
export function wardenArtStatus(visual:WardenVisual){const s=sources.get(visual);return{requested:visual,active:s?.visual??null,message:s?.message??''};}
export function loadWarden(visual:WardenVisual='original'):Promise<void>{
 if(sources.has(visual))return Promise.resolve();const existing=pending.get(visual);if(existing)return existing;
 const p=(async()=>{try{const gltf=await new GLTFLoader().loadAsync('/assets/arrival-3d/warden-'+(visual==='proposal'?'197':'196')+'.glb');sources.set(visual,{gltf,visual,message:''});}
 catch(error){if(visual==='original')throw error;await loadWarden('original');sources.set(visual,{...sources.get('original')!,message:'A proposta não carregou; Warden 0.1.196 ativo.'});}})();pending.set(visual,p);return p;
}
type State='DORMANT'|'INTRO'|'IDLE'|'TELEGRAPH'|'EXECUTE'|'RECOVER'|'PHASE'|'DEATH'|'DEFEATED';
const circle=(r:number,width=.055,color='#e0aa67',fill=false)=>new T.Mesh(new T.RingGeometry(fill?0:r-width,r,64).rotateX(-Math.PI/2),new T.MeshBasicMaterial({color,transparent:true,opacity:fill?.12:.9,depthWrite:false,side:T.DoubleSide}));
const seconds=(ms:number)=>ms/1000;
function sector(r:number,half:number){const p=[0,.035,0];for(let i=0;i<=40;i++){const a=-half+2*half*i/40;p.push(Math.sin(a)*r,.035,Math.cos(a)*r);}const index=[];for(let i=1;i<=40;i++)index.push(0,i,i+1);const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setIndex(index);return new T.Mesh(g,new T.MeshBasicMaterial({color:'#dc9658',transparent:true,opacity:.24,side:T.DoubleSide,depthWrite:false}));}
export class Warden{
 readonly root=new T.Group();readonly position=new T.Vector3(A.home.x/40,0,A.home.y/40);hp:number=W.maxHp;state:State='DORMANT';phase:WardenPhase=1;attack:WardenAttack|null=null;yaw=-Math.PI/2;
 private model:T.Object3D;private bones=new Map<string,T.Bone>();private pose=new Map<string,T.Quaternion>();private core:T.MeshStandardMaterial[]=[];
 private artGeometry={triangles:0,meshes:0,materials:0};
 private elapsed=0;private until=0;private active=0;private pattern=0;private guardYaw=this.yaw;private connected=false;private pressure=0;private pressureAt=-100;private blockUntil=0;private origin=this.position.clone();private direction=new T.Vector3();private travelled=0;private fired=new Set<number>();private victims=new Set<number>();private lastWave=W.slam.waveStart/40;
 private warning=new T.Group();private sweep=sector(W.sweep.range/40,W.sweep.halfAngle);private slam=circle(W.slam.radius/40,.07,'#efac68',true);private slamEdge=circle(W.slam.radius/40);private lane=new T.Mesh(new T.PlaneGeometry(W.rush.halfWidth/20,W.rush.distance/40).rotateX(-Math.PI/2),new T.MeshBasicMaterial({color:'#e8ac68',transparent:true,opacity:.24,side:T.DoubleSide,depthWrite:false}));private wave=circle(1,.025,'#cfb2ef');private guard=new T.Mesh(new T.RingGeometry(1.87,1.94,48,1,-Math.PI/2-W.guardHalfAngle,W.guardHalfAngle*2).rotateX(-Math.PI/2),new T.MeshBasicMaterial({color:'#c0a2df',side:T.DoubleSide}));private rear=sector(1.95,Math.PI-W.guardHalfAngle);
 private marks=Array.from({length:3},()=>{const root=new T.Group();root.add(circle(W.echoes.radius/40),circle(W.echoes.radius/40,.03,'#e5ad65',true));return root;});
 private bolts=Array.from({length:6},()=>({mesh:new T.Mesh(new T.IcosahedronGeometry(.23,1),new T.MeshBasicMaterial({color:'#e5b281'})),p:new T.Vector3(),dir:new T.Vector3(),distance:0,active:false,pulse:0}));
 constructor(readonly world:ArrivalWorld,defeated:boolean,private victory:()=>void,private impact:(p:T.Vector3)=>void,readonly visual:WardenVisual='original'){
  const source=sources.get(visual);if(!source)throw Error('Warden ainda não carregado');this.model=clone(source.gltf.scene);this.root.add(this.model);this.model.traverse(o=>{if(o instanceof T.Bone){this.bones.set(o.name,o);this.pose.set(o.name,o.quaternion.clone());}if(o instanceof T.Mesh){o.castShadow=true;o.receiveShadow=true;o.frustumCulled=false;const materials=Array.isArray(o.material)?o.material:[o.material];const owned=materials.map(m=>{const c=m.clone();if(c instanceof T.MeshStandardMaterial&&c.emissiveIntensity>0)this.core.push(c);return c;});o.material=Array.isArray(o.material)?owned:owned[0];}});
  const artMaterials=new Set<T.Material>();this.model.traverse(o=>{if(o instanceof T.Mesh){this.artGeometry.triangles+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3;this.artGeometry.meshes++;for(const m of Array.isArray(o.material)?o.material:[o.material])artMaterials.add(m);}});this.artGeometry.materials=artMaterials.size;
  this.warning.add(this.sweep,this.slam,this.slamEdge,this.lane);this.rear.rotation.y=Math.PI;this.root.add(this.guard,this.rear);this.guard.position.y=.04;this.rear.position.y=.02;
  world.groups.warden.add(this.root,this.warning,this.wave,...this.marks,...this.bolts.map(b=>b.mesh));this.reset(defeated);
 }
 get solid(){return this.state!=='DEFEATED'&&this.state!=='DEATH';}
 get exposed(){return this.state==='RECOVER'&&!this.connected;}
 get fighting(){return !['DORMANT','DEATH','DEFEATED'].includes(this.state);}
 reset(defeated=false){this.hp=defeated?0:W.maxHp;this.pressure=0;this.pressureAt=-100;this.connected=false;this.active=0;this.phase=1;this.pattern=0;this.state=defeated?'DEFEATED':'DORMANT';this.position.set(A.home.x/40,0,A.home.y/40);this.yaw=-Math.PI/2;this.guardYaw=this.yaw;this.attack=null;this.clear();this.animate(0);}
 private clear(){this.warning.visible=false;this.wave.visible=false;for(const m of this.marks)m.visible=false;for(const b of this.bolts)b.mesh.visible=b.active=false;}
 private set(state:State,duration:number){this.state=state;this.active=0;this.until=this.elapsed+duration;}
 strike(damage:number,from:T.Vector3){
  if(['DORMANT','INTRO','PHASE','EXECUTE','DEATH','DEFEATED'].includes(this.state))return 0;
  let factor=1;if(this.state==='RECOVER'){if(!this.exposed)return 0;factor=W.openingDamage;}else{const d=from.clone().sub(this.position),a=Math.atan2(d.x,d.z),delta=Math.abs(Math.atan2(Math.sin(a-this.guardYaw),Math.cos(a-this.guardYaw)));if(delta<=W.guardHalfAngle){this.blockUntil=this.elapsed+.14;this.pressure=this.elapsed-this.pressureAt>W.pressureWindowMs/1000?1:this.pressure+1;this.pressureAt=this.elapsed;if(this.pressure>=W.pressureHits&&this.state==='IDLE')this.until=Math.min(this.until,this.elapsed+W.pressureCounterDelayMs/1000);return 0;}}
  const actual=Math.min(this.hp,damage*factor);this.hp-=actual;if(!this.hp){this.clear();this.set('DEATH',W.deathMs/1000);this.victory();}return actual;
 }
 private begin(attack:WardenAttack,player:T.Vector3){this.clear();this.attack=attack;this.origin.copy(this.position);this.direction.copy(player).sub(this.position).setY(0).normalize();this.guardYaw=this.yaw=Math.atan2(this.direction.x,this.direction.z);this.connected=false;this.fired.clear();this.victims.clear();this.travelled=0;this.lastWave=W.slam.waveStart/40;this.set('TELEGRAPH',seconds(W[attack].telegraphMs));
  this.warning.position.copy(this.origin);this.warning.rotation.y=this.yaw;this.warning.visible=attack!=='echoes';this.sweep.visible=attack==='sweep';this.slam.visible=this.slamEdge.visible=attack==='slam';this.lane.visible=attack==='rush'||attack==='signal';this.lane.position.set(0,.04,W.rush.distance/80);this.lane.scale.x=attack==='signal'?2:1;
  if(attack==='echoes')for(let i=0;i<3;i++){const side=i===0?0:i===1?-1:1,m=this.marks[i];m.position.copy(player).add(new T.Vector3(this.direction.z,0,-this.direction.x).multiplyScalar(side*W.echoes.spacing/40));m.position.x=T.MathUtils.clamp(m.position.x,14.3,39.7);m.position.z=T.MathUtils.clamp(m.position.z,11.8,25.7);m.position.y=.04;m.visible=true;}
 }
 update(dt:number,player:T.Vector3,invincible:boolean,hurt:(damage:number)=>boolean){
  this.elapsed+=dt;this.active+=dt;
  const hit=(key:number,damage:number,contact:boolean)=>{if(!contact||this.victims.has(key))return;this.victims.add(key);if(!invincible&&hurt(damage))this.connected=true;};
  if(this.state==='DORMANT'&&player.x>=A.introductionX/40)this.set('INTRO',seconds(W.introMs));
  else if(this.state==='INTRO'&&this.elapsed>=this.until)this.set('IDLE',seconds(W.idleMs[0]));
  else if(this.state==='DEATH'&&this.elapsed>=this.until)this.state='DEFEATED';
  else if(this.state==='IDLE'||this.state==='RECOVER'){
   const phase:WardenPhase=this.hp/W.maxHp<=W.phaseThreeAt?3:this.hp/W.maxHp<=W.phaseTwoAt?2:1;
   if(phase>this.phase){this.phase=phase;this.pattern=0;this.clear();this.attack=null;this.set('PHASE',seconds(W.phaseMs));}
   else if(this.state==='IDLE'){
    const d=player.clone().sub(this.position).setY(0),gap=d.length();this.guardYaw=this.yaw=Math.atan2(d.x,d.z);if(gap>W.standOff/40){d.normalize();this.move(d,W.speed/40*dt);}
    if(this.elapsed>=this.until){const p=WARDEN_PATTERNS[this.phase];let next=p[this.pattern++%p.length];if(this.pressure>=W.pressureHits){this.pressure=0;next=gap>5.75?'rush':'slam';}else if(gap>8&&next==='sweep')next='rush';this.begin(next,player);}
   }else if(this.elapsed>=this.until){this.attack=null;this.set('IDLE',seconds(W.idleMs[this.phase-1]));}
  }else if(this.state==='PHASE'&&this.elapsed>=this.until)this.set('IDLE',seconds(W.idleMs[this.phase-1]));
  else if(this.state==='TELEGRAPH'&&this.elapsed>=this.until){this.set('EXECUTE',seconds(W[this.attack!].executeMs));if(this.attack==='signal')this.warning.visible=false;}
  else if(this.state==='EXECUTE'){
   const a=this.attack!,t=this.active,delta=player.clone().sub(this.origin).setY(0),gap=delta.length();
   if(a==='sweep')for(let i=0;i<2;i++){const at=seconds(i?W.sweep.returnMs:W.sweep.strikeMs);if(t>=at&&!this.fired.has(i)){this.fired.add(i);this.impact(this.origin);const dir=this.direction.clone().multiplyScalar(i?-1:1);hit(i,W.sweep.damage,gap<=W.sweep.range/40+.35&&delta.normalize().dot(dir)>=Math.cos(W.sweep.halfAngle));}}
   if(a==='slam'){
    if(t>=seconds(W.slam.strikeMs)&&!this.fired.has(0)){this.fired.add(0);this.impact(this.origin);hit(0,W.slam.damage,gap<=W.slam.radius/40+.35);}
    if(t>=seconds(W.slam.waveMs)){const progress=Math.min(1,(t-seconds(W.slam.waveMs))/seconds(W.slam.waveDurationMs)),r=T.MathUtils.lerp(W.slam.waveStart/40,W.slam.waveRadius/40,progress);this.wave.visible=progress<1;this.wave.position.copy(this.origin).setY(.07);this.wave.scale.setScalar(r);hit(1,W.slam.waveDamage,gap>=this.lastWave-W.slam.waveWidth/40-.35&&gap<=r+W.slam.waveWidth/40+.35);this.lastWave=r;}
   }
   if(a==='rush'){const before=this.position.clone();this.move(this.direction,Math.min(W.rush.speed/40*dt,W.rush.distance/40-this.travelled));const moved=before.distanceTo(this.position);this.travelled+=moved;const d=player.clone().sub(before),along=d.dot(this.direction);hit(0,W.rush.damage,along>=-W.radius/40&&along<=moved+W.radius/40&&Math.abs(d.x*this.direction.z-d.z*this.direction.x)<=W.rush.halfWidth/40+.35);if(moved<.01||this.travelled>=W.rush.distance/40)this.until=this.elapsed;}
   if(a==='signal')for(let volley=0;volley<2;volley++)if(t>=seconds(volley?W.signal.secondMs:W.signal.firstMs)&&!this.fired.has(volley)){this.fired.add(volley);this.impact(this.position);for(let i=0;i<3;i++){const b=this.bolts[volley*3+i];b.dir.copy(this.direction).applyAxisAngle(new T.Vector3(0,1,0),(i-1+(volley?.5:0))*W.signal.spread);b.p.copy(this.position).addScaledVector(b.dir,W.radius/40+.2);b.p.y=.85;b.distance=0;b.active=true;b.pulse=volley;b.mesh.visible=true;}}
   if(a==='echoes')for(let i=0;i<3;i++)if(t>=seconds(W.echoes.strikeMs+i*W.echoes.intervalMs)&&!this.fired.has(i)){this.fired.add(i);this.impact(this.marks[i].position);hit(i,W.echoes.damage,this.marks[i].position.clone().setY(0).distanceTo(player)<=W.echoes.radius/40+.35);this.marks[i].visible=false;}
   for(const b of this.bolts){if(!b.active)continue;const step=W.signal.speed/40*dt,delta=player.clone().sub(b.p).setY(0),along=delta.dot(b.dir);if(along>=-.55&&along<=step+.55&&Math.abs(delta.x*b.dir.z-delta.z*b.dir.x)<W.signal.radius/40+.35){hit(b.pulse,W.signal.damage,true);b.active=b.mesh.visible=false;continue;}b.p.addScaledVector(b.dir,step);b.distance+=step;b.mesh.position.copy(b.p);if(b.distance>=W.signal.range/40||this.world.blocked('warden',b.p.x,b.p.z,.1))b.active=b.mesh.visible=false;}
   if(this.elapsed>=this.until){this.clear();this.set('RECOVER',seconds(this.connected?W.closedRecoverMs:W[a].recoverMs));}
  }
  this.animate(dt);
 }
 private move(direction:T.Vector3,distance:number){const steps=Math.max(1,Math.ceil(distance/.15));for(let i=0;i<steps;i++){const next=this.position.clone().addScaledVector(direction,distance/steps);if(!this.world.blocked('warden',next.x,next.z,W.radius/40))this.position.copy(next);}}
 private animate(dt:number){
  for(const [name,bone]of this.bones)bone.quaternion.copy(this.pose.get(name)!);
  const turn=(name:string,x=0,y=0,z=0)=>this.bones.get(name)?.quaternion.multiply(new T.Quaternion().setFromEuler(new T.Euler(x,y,z)));
  const wind=this.state==='TELEGRAPH'?Math.min(1,this.active/seconds(W[this.attack!].telegraphMs)):0,execute=this.state==='EXECUTE',t=this.active;
  turn('Torso',['DEATH','DEFEATED'].includes(this.state)?0:Math.sin(this.elapsed*1.8)*.025+(this.exposed?.16:0));
  if(this.state==='IDLE'){turn('LegL',Math.sin(this.elapsed*5)*.12);turn('LegR',-Math.sin(this.elapsed*5)*.12);turn('ArmL',Math.sin(this.elapsed*5)*.06);turn('ArmR',-Math.sin(this.elapsed*5)*.06);}
  if(this.attack==='slam'){const raised=wind*.9+(execute?(t<.28?.9*(1-t/.28):-.30*Math.exp(-(t-.28)*4)):0);turn('ArmL',-raised,0,-raised*.32);turn('ArmR',-raised,0,raised*.32);turn('Torso',execute&&t>.28?-.20:wind*.12);}
  if(this.attack==='sweep'){const swing=wind*.7+(execute?Math.sin(Math.min(1,t/.42)*Math.PI*1.5)*1.15:0);turn('ArmR',-.1,0,-swing);turn('ClawR',-.25,0,-swing*.4);if(execute&&t>.65)turn('ArmL',-.12,0,Math.sin((t-.65)*5)*.95);turn('Torso',0,execute?Math.sin(t*6)*.2:wind*-.12);}
  if(this.attack==='rush'){turn('Torso',-.18-wind*.15);turn('ArmL',.25,0,.25);turn('ArmR',.25,0,-.25);if(execute){turn('LegL',Math.sin(t*19)*.3);turn('LegR',-Math.sin(t*19)*.3);}}
  if(this.attack==='signal'||this.attack==='echoes'){turn('ArmL',-.5*wind,0,-.32*wind);turn('ArmR',-.5*wind,0,.32*wind);turn('Crown',0,0,Math.sin(t*5)*.04);}
  const death=this.state==='DEATH'?Math.min(1,this.active/seconds(W.deathMs)):this.state==='DEFEATED'?1:0;turn('Torso',death*.72);turn('ArmL',death*.4);turn('ArmR',death*.4);this.model.position.y=-death*.55;
  this.root.position.copy(this.position);this.root.rotation.y=this.yaw;this.guard.visible=['IDLE','TELEGRAPH'].includes(this.state);this.guard.rotation.y=this.guardYaw-this.yaw;this.rear.visible=this.exposed;for(const m of this.core)m.emissiveIntensity=death?.08:this.exposed?1.6:this.state==='PHASE'?1.2:.5;
  // A visible locked facing and real skeletal windup accompany every damage event.
  this.guard.material.color.set(this.elapsed<this.blockUntil?'#ffe0a7':'#c0a2df');if(dt)this.root.updateMatrixWorld(true);
 }
 inspect(){return{art:{...wardenArtStatus(this.visual),geometry:{...this.artGeometry}},hp:this.hp,maxHp:W.maxHp,state:this.state,phase:this.phase,attack:this.attack,exposed:this.exposed,connected:this.connected,yaw:this.yaw,position:this.position.toArray(),elapsed:this.elapsed,active:this.active,until:this.until,marks:this.marks.filter(m=>m.visible).map(m=>m.position.toArray()),bolts:this.bolts.filter(b=>b.active).map(b=>b.p.toArray()),bones:this.bones.size,pose:[...this.bones.values()].reduce((sum,b,i)=>sum+(i+1)*(b.quaternion.x+b.quaternion.y*.7+b.quaternion.z*.3+b.quaternion.w*.1),0)};}
 // Offline visual workshop only: no gameplay event, damage, save or victory callback.
 preview(attack:WardenAttack|'Idle'|'Death',time:number){this.position.set(0,0,0);this.yaw=0;this.elapsed=time;this.active=attack==='Death'?Math.min(time,seconds(W.deathMs)):time%2;this.attack=attack==='Idle'||attack==='Death'?null:attack;this.state=attack==='Death'?'DEATH':attack==='Idle'?'IDLE':this.active<.8?'TELEGRAPH':'EXECUTE';if(this.state==='EXECUTE')this.active-=.8;this.animate(0);this.guard.visible=false;this.rear.visible=false;}
 dispose(){this.clear();this.guard.geometry.dispose();this.rear.geometry.dispose();this.root.traverse(o=>{if(o instanceof T.SkinnedMesh)o.skeleton.dispose();if(o instanceof T.Mesh)for(const m of Array.isArray(o.material)?o.material:[o.material])m.dispose();});const objects=[this.root,this.warning,this.wave,...this.marks,...this.bolts.map(b=>b.mesh)];for(const o of objects){o.removeFromParent();if(o!==this.root)o.traverse(m=>{if(m instanceof T.Mesh){m.geometry.dispose();(m.material as T.Material).dispose();}});}}
}
