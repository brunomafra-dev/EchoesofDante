import * as T from 'three';
import {GLTFLoader,type GLTF}from'three/addons/loaders/GLTFLoader.js';
import {clone}from'three/addons/utils/SkeletonUtils.js';
import {Batches,box,tube,material}from'./Art';
import type{Appearance,ClassId,Gender}from'./model';
const cache=new Map<Gender,Promise<GLTF>>();
export class Avatar{
 readonly root=new T.Group();readonly model:T.Group;readonly mixer:T.AnimationMixer;
 private actions=new Map<string,T.AnimationAction>();private current?:T.AnimationAction;private name='';private lock=0;private gear=new T.Group();
 private constructor(asset:GLTF,readonly appearance:Appearance,private readonly npc=false){
  this.model=clone(asset.scene) as T.Group;this.root.add(this.model);const bounds=new T.Box3().setFromObject(this.model),scale=1.9/(bounds.max.y-bounds.min.y);this.model.scale.setScalar(scale);this.model.position.y=-bounds.min.y*scale;
  const hairs=appearance.gender==='male'?['Hair_Buzzed','Hair_SimpleParted','Hair_Long']:['Hair_BuzzedFemale','Hair_Buns','Hair_Long'];
  this.model.traverse(o=>{const hair=o.userData.arrivalHair;if(hair){o.visible=hair==='Hair_Beard'?appearance.gender==='male'&&appearance.beard:appearance.hair>0&&hair===hairs[appearance.hair-1];}if(o instanceof T.Mesh){o.castShadow=true;o.receiveShadow=true;const apply=(source:T.Material)=>{const m=source.clone() as T.MeshStandardMaterial;if(/Peasant/.test(m.name))m.color.set(appearance.cloth);if(/Regular|Superhero/i.test(m.name))m.color.set(appearance.skin);if(/Hair/.test(m.name))m.color.set(appearance.hairColor);if(m.map)m.map.anisotropy=4;return m;};o.material=Array.isArray(o.material)?o.material.map(apply):apply(o.material);if(/Eyes|Eyebrow/i.test(o.name))o.castShadow=false;}});
  this.mixer=new T.AnimationMixer(this.model);for(const clip of asset.animations){const action=this.mixer.clipAction(clip);if(npc)action.timeScale=clip.name==='Walk'?.5:clip.name==='PickUp'?.7:1;this.actions.set(clip.name,action);}this.play('Idle');this.mixer.update(.01);
  if(!npc)this.equip(appearance.classId);
 }
 static async create(appearance:Appearance,npc=false){let promise=cache.get(appearance.gender);if(!promise){promise=new GLTFLoader().loadAsync('/assets/arrival-3d/crew-'+appearance.gender+'.glb');cache.set(appearance.gender,promise);promise.catch(()=>cache.delete(appearance.gender));}return new Avatar(await promise,{...appearance},npc);}
 private equip(id:ClassId){
  const fabric=material('#3e4d45'),metal=material('#8f9b94',.45,.5),trim=material('#a77d43',.35,.55),light=material(id==='astral'?'#64cdbf':id==='xenobinder'?'#83b964':'#9bcbd1',.3,.35);light.emissive.copy(light.color);light.emissiveIntensity=.4;
  const batch=new Batches();batch.add(box,fabric,0,1.32,-.20,.33,.42,.18);for(const x of[-.14,.14])batch.add(box,fabric,x,1.33,.14,.045,.46,.035);batch.add(box,trim,.07,1.42,.18,.17,.11,.04);batch.add(box,light,.07,1.43,.21,.11,.05,.01);batch.flush(this.gear,[]);this.gear.traverse(o=>o.userData.arrivalOwned=true);this.root.add(this.gear);this.root.updateMatrixWorld(true);this.model.getObjectByName('spine_03')?.attach(this.gear);
  const weapon=new T.Group(),w=new Batches();
  if(id==='warrior'){w.add(box,metal,0,0,0,.065,.07,.72);w.add(box,trim,0,0,-.38,.22,.1,.08);w.add(box,fabric,0,0,-.5,.07,.07,.2);w.add(box,light,.045,.02,0,.012,.025,.63);}
  else if(id==='hunter'){w.add(box,metal,0,0,0,.12,.15,.65);w.add(box,fabric,0,-.08,-.25,.09,.22,.12);w.add(box,trim,0,0,.1,.55,.04,.1);w.add(tube,light,0,.12,.1,.035,.17,.035);}
  else if(id==='astral'){w.add(tube,metal,0,0,0,.11,.25,.11);w.add(new T.TorusGeometry(.12,.02,6,18).rotateX(Math.PI/2),light,0,.16,0);}
  else{w.add(tube,metal,0,0,0,.07,.52,.07);w.add(new T.IcosahedronGeometry(.12,1),light,0,.3,0);}
  w.flush(weapon,[]);weapon.traverse(o=>o.userData.arrivalOwned=true);weapon.position.set(.13,-.05,.05);weapon.rotation.x=Math.PI/2;this.model.getObjectByName('hand_r')?.add(weapon);
 }
 play(name:string,once=false,lock=0){if(this.lock>0&&!once)return;const next=this.actions.get(name)??this.actions.get('Idle');if(!next||this.name===name&&!once)return;next.reset().setLoop(once?T.LoopOnce:T.LoopRepeat,once?1:Infinity);next.clampWhenFinished=once;next.enabled=true;next.fadeIn(.17).play();this.current?.fadeOut(.17);this.current=next;this.name=name;this.lock=lock;}
 strike(lock=.28){this.play(this.appearance.classId==='warrior'?'Sword':this.appearance.classId==='hunter'?'Shoot':'Cast',true,lock);}
 update(dt:number,moving=false,airborne=false){this.lock=Math.max(0,this.lock-dt);if(!this.lock&&!airborne)this.play(moving?(this.npc?'Walk':'Run'):'Idle');this.mixer.update(dt);}
 face(dir:T.Vector3,dt:number){if(dir.lengthSq()<.0001)return;const target=new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),Math.atan2(dir.x,dir.z));this.root.quaternion.slerp(target,1-Math.exp(-dt*14));}
 get animation(){return this.name;}
 dispose(){this.mixer.stopAllAction();this.mixer.uncacheRoot(this.model);this.root.traverse(o=>{if(o instanceof T.Mesh){if(o.userData.arrivalOwned)o.geometry.dispose();for(const m of Array.isArray(o.material)?o.material:[o.material])m.dispose();}});}
}
