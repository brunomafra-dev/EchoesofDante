import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';

export class Actor {
 readonly root=new T.Group();
 readonly model:T.Group;
 readonly mixer:T.AnimationMixer;
 private actions=new Map<string,T.AnimationAction>();
 private current?:T.AnimationAction;
 private actionName='';
 private lock=0;
 private constructor(gltf:Awaited<ReturnType<GLTFLoader['loadAsync']>>,height:number,palette:boolean){
  this.model=gltf.scene;this.root.add(this.model);
  const bounds=new T.Box3().setFromObject(this.model),size=bounds.getSize(new T.Vector3());this.model.scale.setScalar(height/size.y);this.model.position.y=-bounds.min.y*height/size.y;
  this.model.traverse(o=>{if(o instanceof T.Mesh){o.castShadow=true;o.receiveShadow=true;const materials=(Array.isArray(o.material)?o.material:[o.material]) as T.MeshStandardMaterial[];for(const m of materials){m.roughness=.8;m.metalness=.05;if(m.name==='Skin')m.color.set(palette?'#b98b68':'#caa78a');if(palette&&m.name==='Main')m.color.set('#a18d66');if(palette&&m.name==='DarkGreen')m.color.set('#647458');if(!palette&&m.name==='Grey')m.color.set('#767f79');if(!palette&&m.name==='Helmet')m.color.set('#526e73');}}});
  this.mixer=new T.AnimationMixer(this.model);
  for(const clip of gltf.animations){const name=clip.name.split('|').pop()!.replace(/^Alien_/,'');this.actions.set(name,this.mixer.clipAction(clip));}
  this.play('Idle');
 }
 static async load(file:string,height=1.9,palette=false){return new Actor(await new GLTFLoader().loadAsync('/assets/frontier-3d/'+file),height,palette);}
 play(name:string,once=false,lock=0){
  if(this.lock>0&&!once)return;
  const next=this.actions.get(name)??this.actions.get('Idle');if(!next||this.actionName===name&&!once)return;
  next.reset().setLoop(once?T.LoopOnce:T.LoopRepeat,once?1:Infinity);next.clampWhenFinished=once;next.enabled=true;next.setEffectiveTimeScale(1);next.setEffectiveWeight(1);next.fadeIn(.18).play();this.current?.fadeOut(.18);this.current=next;this.actionName=name;this.lock=lock;
 }
 update(dt:number,moving=false,airborne=false){this.lock=Math.max(0,this.lock-dt);if(this.lock===0&&!airborne)this.play(moving?'Run':'Idle');this.mixer.update(dt);}
 face(direction:T.Vector3,dt:number){if(direction.lengthSq()<.001)return;const q=new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),Math.atan2(direction.x,direction.z));this.root.quaternion.slerp(q,1-Math.exp(-dt*14));}
 dispose(){this.mixer.stopAllAction();this.mixer.uncacheRoot(this.model);}
 get animation(){return this.actionName;}
}
