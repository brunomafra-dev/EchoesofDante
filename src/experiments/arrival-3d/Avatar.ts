import * as T from 'three';
import {GLTFLoader,type GLTF}from'three/addons/loaders/GLTFLoader.js';
import {clone}from'three/addons/utils/SkeletonUtils.js';
import {Batches,box,material}from'./Art';
import {identity,loadIdentity}from'./Identity';
import {HandGrip}from'./HandGrip';
import type{Appearance,ClassId}from'./model';
const cache=new Map<string,Promise<GLTF>>();
export class Avatar{
 readonly root=new T.Group();readonly model:T.Group;readonly mixer:T.AnimationMixer;
 private actions=new Map<string,T.AnimationAction>();private current?:T.AnimationAction;private name='';private lock=0;private gear=new T.Group();
 private role='';private taskTool?:T.Object3D;private toolRest=new T.Quaternion();private instrument?:T.Object3D;private energy:T.MeshStandardMaterial[]=[];private element=-1;
 private grip:HandGrip;private supportActive=false;private aimWeight=0;private relaxWeight=1;private bracer?:T.Object3D;
 private constructor(asset:GLTF,readonly appearance:Appearance,private readonly npc=false,readonly equipment:'current'|'previous'='current',readonly backpack:'current'|'previous'='current',readonly figure:'current'|'previous'='current'){
  this.model=clone(asset.scene) as T.Group;this.grip=new HandGrip(this.model);this.root.add(this.model);const bounds=new T.Box3().setFromObject(this.model),scale=1.9/(bounds.max.y-bounds.min.y);this.model.scale.setScalar(scale);this.model.position.y=-bounds.min.y*scale;
  const hairs=appearance.gender==='male'?['Hair_Buzzed','Hair_SimpleParted','Hair_Long']:['Hair_BuzzedFemale','Hair_Buns','Hair_Long'];
  this.model.traverse(o=>{const hair=o.userData.arrivalHair;if(hair){o.visible=hair==='Hair_Beard'?appearance.gender==='male'&&appearance.beard:appearance.hair>0&&hair===hairs[appearance.hair-1];}if(o instanceof T.Mesh){o.castShadow=true;o.receiveShadow=true;const apply=(source:T.Material)=>{const m=source.clone() as T.MeshStandardMaterial;if(/Peasant/.test(m.name))m.color.set(appearance.cloth);if(/Regular|Superhero/i.test(m.name))m.color.set(appearance.skin);if(/Hair/.test(m.name))m.color.set(appearance.hairColor);if(m.map)m.map.anisotropy=4;return m;};o.material=Array.isArray(o.material)?o.material.map(apply):apply(o.material);if(/Eyes|Eyebrow/i.test(o.name))o.castShadow=false;}});
  this.mixer=new T.AnimationMixer(this.model);for(const clip of asset.animations){const action=this.mixer.clipAction(clip);if(npc)action.timeScale=clip.name==='Walk'?.5:clip.name==='PickUp'?.7:1;this.actions.set(clip.name,action);if(npc&&clip.name==='Idle'){const work=clip.clone();work.name='Work';const a=this.mixer.clipAction(work);a.timeScale=work.duration/4.1;this.actions.set('Work',a);}}this.play('Idle');this.mixer.update(.01);
  if(!npc){this.equip(appearance.classId);if(appearance.classId==='astral')this.setElement(0);}
 }
 static async create(appearance:Appearance,npc=false,equipment:'current'|'previous'='current',backpack:'current'|'previous'='current',figure:'current'|'previous'='current'){await loadIdentity();const key=appearance.gender+figure;let promise=cache.get(key);if(!promise){promise=new GLTFLoader().loadAsync('/assets/arrival-3d/crew-'+appearance.gender+(figure==='current'?'-193':'')+'.glb');cache.set(key,promise);promise.catch(()=>cache.delete(key));}return new Avatar(await promise,{...appearance},npc,equipment,backpack,figure);}
 private equip(id:ClassId){
  if(this.backpack==='previous'){
   const fabric=material('#3e4d45'),trim=material('#a77d43',.35,.55),light=material(id==='astral'?'#64cdbf':id==='xenobinder'?'#83b964':'#9bcbd1',.3,.35);light.emissive.copy(light.color);light.emissiveIntensity=.4;
   const batch=new Batches();batch.add(box,fabric,0,1.32,-.20,.33,.42,.18);for(const x of[-.14,.14])batch.add(box,fabric,x,1.33,.14,.045,.46,.035);batch.add(box,trim,.07,1.42,.18,.17,.11,.04);batch.add(box,light,.07,1.43,.21,.11,.05,.01);batch.flush(this.gear,[]);this.gear.traverse(o=>o.userData.arrivalOwned=true);
  }else{
   const pack=identity('field-backpack');pack.position.set(0,1.30,-.275);if(this.appearance.gender==='female')pack.scale.set(.94,.98,1);
   this.gear.add(pack,identity('field-harness-'+this.appearance.gender));
  }
  this.root.add(this.gear);this.root.updateMatrixWorld(true);this.model.getObjectByName('spine_03')?.attach(this.gear);
  const weapon=identity((this.equipment==='previous'?'previous-':'')+'weapon-'+id);
  if(this.equipment==='previous'){weapon.position.set(0,.03,.015);weapon.rotation.x=id==='hunter'?-Math.PI/2-.4:0;weapon.scale.setScalar(id==='warrior'?.88:.9);}
  else if(id==='astral'){
   // The casting clip leads with the left palm. The armor is authored in the
   // right-hand bind basis and mirrored onto that hand, with a shorter shell
   // for the female rig. No handheld focus remains inside the palm.
   weapon.scale.set(-1,this.appearance.gender==='female'?.78:1,1);
   const bracer=identity('astral-bracer'),hand=this.model.getObjectByName('hand_l')!;
   bracer.scale.copy(weapon.scale);bracer.position.copy(hand.position);hand.parent!.add(bracer);this.bracer=bracer;
  }else{
   weapon.position.copy(this.grip.center('r'));
   if(id==='hunter'){weapon.quaternion.set(0,Math.SQRT1_2,Math.SQRT1_2,0);weapon.scale.set(.72,.9,.78);}
   else weapon.scale.set(.7,.7,id==='warrior'?.88:.9);
  }
  this.model.getObjectByName(id==='astral'&&this.equipment==='current'?'hand_l':'hand_r')?.add(weapon);this.instrument=weapon;
  if(this.equipment==='current')for(const part of [weapon,this.bracer])part?.traverse(o=>{if(o instanceof T.Mesh&&o.material instanceof T.MeshStandardMaterial&&o.material.name.endsWith('energy')){const m=o.material.clone();m.vertexColors=false;m.color.set(id==='hunter'?'#6dcbdf':id==='xenobinder'?'#a8bd72':'#88d2df');m.emissive.copy(m.color);m.emissiveIntensity=.5;o.material=m;this.energy.push(m);}});
 }
 dressForRole(role:string){
  this.role=role;
  const uniform=identity('uniform-'+role);this.root.add(uniform);this.root.updateMatrixWorld(true);this.model.getObjectByName('spine_03')?.attach(uniform);
  const tool=identity('tool-'+role);tool.position.set(0,.03,0);tool.rotation.x=-Math.PI/2;this.model.getObjectByName(role==='nara'||role==='lia'?'hand_l':'hand_r')?.add(tool);this.taskTool=tool;this.toolRest.copy(tool.quaternion);
 }
 play(name:string,once=false,lock=0){if(this.lock>0&&!once)return;const next=this.actions.get(name)??this.actions.get('Idle');if(!next||this.name===name&&!once)return;const fade=this.npc?.17:once?.045:.14;if(this.current&&this.current!==next)this.current.fadeOut(fade);next.reset().setEffectiveWeight(1).setLoop(once?T.LoopOnce:T.LoopRepeat,once?1:Infinity);if(!this.npc)next.setEffectiveTimeScale(once&&lock>0?next.getClip().duration/lock:1);next.clampWhenFinished=once;next.enabled=true;next.fadeIn(fade).play();this.current=next;this.name=name;this.lock=lock;}
 strike(lock=.28){this.play(this.appearance.classId==='warrior'?'Sword':this.appearance.classId==='hunter'?'Shoot':'Cast',true,lock);}
 dodge(){this.play('Roll',true,.50);}
 get evading(){return this.name==='Roll'&&this.lock>.09;}
 rest(){this.lock=0;this.name='';this.play('Idle');}
 weaponOrigin(){this.root.updateMatrixWorld(true);return this.instrument?.getObjectByName('emitter')?.getWorldPosition(new T.Vector3())??(this.instrument?this.instrument.localToWorld(new T.Vector3(0,0,this.appearance.classId==='hunter'?.77:.22)):this.root.position.clone().add(new T.Vector3(0,1,0)));}
 bladeFrame(){this.root.updateMatrixWorld(true);const point=(name:string,z:number)=>this.instrument?.getObjectByName(name)?.getWorldPosition(new T.Vector3())??this.instrument!.localToWorld(new T.Vector3(0,0,z));return{base:point('blade-base',.15),tip:point('blade-tip',1.01)};}
 setElement(element:number){if(this.element===element)return;this.element=element;if(this.appearance.classId==='astral')for(const m of this.energy){m.color.set(['#b49aee','#ef9d43','#65b9dd','#b3a280'][element]);m.emissive.copy(m.color);}}
 update(dt:number,moving=false,airborne=false){
  this.lock=Math.max(0,this.lock-dt);if(!this.npc&&this.name==='Roll'&&this.lock<.09)this.lock=0;if(!this.lock&&!airborne)this.play(moving?(this.npc?'Walk':'Run'):'Idle');this.mixer.update(dt);if(this.role)this.workPose(moving);
  this.supportActive=false;
  if(!this.npc&&this.equipment==='current'&&this.instrument){
   if(this.bracer)this.bracer.position.copy(this.model.getObjectByName('hand_l')!.position);
   const id=this.appearance.classId;
   this.aimWeight=T.MathUtils.damp(this.aimWeight,id==='hunter'&&(this.name==='Idle'||this.name==='Shoot'&&this.lock>0)?1:0,18,dt);
   if(id==='hunter'&&this.aimWeight>.01){
    this.arm('r',new T.Vector3(-.20,1.25,.10),this.aimWeight);
    this.orientHand('r',new T.Quaternion(0,Math.SQRT1_2,Math.SQRT1_2,0),this.aimWeight);
    this.root.updateMatrixWorld(true);
    const support=this.instrument.getObjectByName('support')!.getWorldPosition(new T.Vector3());
    const q=new T.Quaternion().setFromAxisAngle(new T.Vector3(0,0,1),Math.PI/2),offset=this.grip.center('l').multiplyScalar(this.model.scale.x).applyQuaternion(q).applyQuaternion(this.root.quaternion);
    this.arm('l',this.root.worldToLocal(support.sub(offset)),this.aimWeight);this.orientHand('l',q,this.aimWeight);this.grip.close('l',true);this.supportActive=true;
   }
   if(id!=='astral')this.grip.close('r',false,id==='hunter');
   else{this.relaxWeight=T.MathUtils.damp(this.relaxWeight,this.name==='Cast'?0:1,18,dt);this.grip.relax('l',this.relaxWeight);}
  }
 }
 private orientHand(side:string,orientation:T.Quaternion,weight=1){
  const hand=this.model.getObjectByName('hand_'+side)!;
  hand.quaternion.slerp(hand.parent!.getWorldQuaternion(new T.Quaternion()).invert().multiply(this.root.getWorldQuaternion(new T.Quaternion())).multiply(orientation),weight);
  hand.updateMatrixWorld(true);
 }
 private arm(side:string,target:T.Vector3,weight:number){
  const upper=this.model.getObjectByName('upperarm_'+side),lower=this.model.getObjectByName('lowerarm_'+side),hand=this.model.getObjectByName('hand_'+side);if(!upper||!lower||!hand||weight<=0)return;
  this.root.updateMatrixWorld(true);target=this.root.localToWorld(target.clone());
  const s=upper.getWorldPosition(new T.Vector3()),e=lower.getWorldPosition(new T.Vector3()),w=hand.getWorldPosition(new T.Vector3()),a=s.distanceTo(e),b=e.distanceTo(w),dir=target.clone().sub(s),d=Math.min(a+b-.015,Math.max(.05,dir.length()));dir.normalize();
  const pole=new T.Vector3(side==='r'?-.8:.8,-.2,.1).applyQuaternion(this.root.quaternion);pole.addScaledVector(dir,-pole.dot(dir)).normalize();
  const along=(a*a-b*b+d*d)/(2*d),height=Math.sqrt(Math.max(0,a*a-along*along)),elbow=s.clone().addScaledVector(dir,along).addScaledVector(pole,height),end=s.clone().addScaledVector(dir,d);
  const rotate=(joint:T.Object3D,child:T.Object3D,goal:T.Vector3)=>{const from=child.getWorldPosition(new T.Vector3()).sub(joint.getWorldPosition(new T.Vector3())).normalize(),to=goal.clone().sub(joint.getWorldPosition(new T.Vector3())).normalize(),q=new T.Quaternion().setFromUnitVectors(from,to).multiply(joint.getWorldQuaternion(new T.Quaternion())),parent=joint.parent!.getWorldQuaternion(new T.Quaternion()).invert();joint.quaternion.slerp(parent.multiply(q),weight);joint.updateMatrixWorld(true);};
  rotate(upper,lower,elbow);rotate(lower,hand,end);
 }
 private workPose(moving:boolean){
  if(this.taskTool)this.taskTool.quaternion.copy(this.toolRest);if(moving)return;
  // Torso idle stays on its original complete rig; only the arms follow actual
  // task positions. Smooth ramps and long rests replace the sped-up pickup loop.
  const active=this.name==='Work'&&this.lock>0,phase=active?1-this.lock/4.1:0,weight=active?Math.min(1,phase*7,(1-phase)*7):0;
  if(weight<=0)return;
  const tapping=this.role==='ivo'||this.role==='gui',stroke=tapping?Math.pow(Math.max(0,Math.sin(phase*Math.PI*4)),3)*.15:Math.sin(phase*Math.PI)*.025;
  this.arm('r',new T.Vector3(-.16,tapping?1.25+stroke:this.role==='elisa'?1.04:1.10,.48),weight);
  this.arm('l',new T.Vector3(.16,this.role==='lia'?1.18:1.06,.48),weight);
  if(this.taskTool){const hand=this.taskTool.parent!,q=hand.getWorldQuaternion(new T.Quaternion()).invert(),axis=new T.Vector3(0,this.role==='nara'?0:-1,this.role==='nara'?1:.25).normalize(),orientation=new T.Quaternion().setFromUnitVectors(new T.Vector3(0,0,1),axis);orientation.premultiply(this.root.quaternion);this.taskTool.quaternion.slerp(q.multiply(orientation),weight);}
  this.root.updateMatrixWorld(true);
 }
 face(dir:T.Vector3,dt:number){if(dir.lengthSq()<.0001)return;const target=new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),Math.atan2(dir.x,dir.z));this.root.quaternion.slerp(target,1-Math.exp(-dt*14));}
 get animation(){return this.name;}
 inspectArt(){
  this.root.updateMatrixWorld(true);const support=this.instrument?.getObjectByName('support'),left=this.model.getObjectByName('hand_l');
  const supportError=support&&left?left.localToWorld(this.grip.center('l')).distanceTo(support.getWorldPosition(new T.Vector3())):undefined;
  const back=new T.Box3().setFromObject(this.gear);
  return{action:this.current?{time:this.current.time,duration:this.current.getClip().duration,timeScale:this.current.getEffectiveTimeScale(),weight:this.current.getEffectiveWeight(),lock:this.lock}:undefined,evading:this.evading,backpack:this.npc?undefined:{style:this.backpack,anchor:this.gear.parent?.name,bounds:{min:back.min.toArray(),max:back.max.toArray()},parts:this.gear.children.map(c=>c.name)},figure:this.figure,role:this.role,animation:this.name,equipment:this.equipment,hand:this.instrument?.parent?.name,bracer:this.bracer?.parent?.name,socket:this.instrument?.position.toArray(),grasp:!this.npc&&this.equipment==='current'?{kind:this.appearance.classId==='astral'?'worn-gauntlet':'closed-grip',right:this.grip.inspect('r'),left:this.grip.inspect('l'),support:this.supportActive,aimWeight:this.aimWeight,supportError}:undefined,hasEmitter:!!this.instrument?.getObjectByName('emitter'),emitterLocal:this.instrument?.getObjectByName('emitter')?.position.toArray(),grip:this.instrument?.getWorldPosition(new T.Vector3()).toArray(),blade:this.instrument&&this.appearance.classId==='warrior'?{base:this.bladeFrame().base.toArray(),tip:this.bladeFrame().tip.toArray()}:undefined,emitter:this.weaponOrigin().toArray(),taskActive:this.name==='Work'&&this.lock>0,hands:['r','l'].map(side=>({side,position:this.model.getObjectByName('hand_'+side)?.getWorldPosition(new T.Vector3()).toArray(),armFound:!!this.model.getObjectByName('upperarm_'+side)})),tool:this.taskTool?.getWorldPosition(new T.Vector3()).toArray()};}
 dispose(){const skeletons=new Set<T.Skeleton>();this.root.traverse(o=>{if(o instanceof T.SkinnedMesh)skeletons.add(o.skeleton);});skeletons.forEach(s=>s.dispose());this.energy.forEach(m=>m.dispose());this.mixer.stopAllAction();this.mixer.uncacheRoot(this.model);this.root.traverse(o=>{if(o instanceof T.Mesh&&!o.userData.arrivalSharedIdentity){if(o.userData.arrivalOwned)o.geometry.dispose();for(const m of Array.isArray(o.material)?o.material:[o.material])m.dispose();}});}
}
