import * as T from 'three';
import {GLTFLoader,type GLTF}from'three/addons/loaders/GLTFLoader.js';
import {clone}from'three/addons/utils/SkeletonUtils.js';
export type CreaturePose={position:T.Vector3;yaw:number;step:number;wind:number;dead:boolean};
type Motion='Idle'|'Walk'|'Attack'|'Death';
type Actor={root:T.Group;mixer:T.AnimationMixer;actions:Record<Motion,T.AnimationAction>;state:Motion;step:number;seen:boolean};
const sources=new Map<string,GLTF>();let loading:Promise<void>|undefined;
/** Whole, rigged Flare models. Cached buffers/materials, independent skeletons. */
export function loadCreatures(){return loading??=Promise.all(['antlion','wyvern'].map(async name=>{
 const gltf=await new GLTFLoader().loadAsync('/assets/arrival-3d/creature-'+name+'-187.glb');
 gltf.scene.traverse(o=>{if(o instanceof T.Mesh){o.castShadow=true;o.receiveShadow=true;for(const m of Array.isArray(o.material)?o.material:[o.material]){m.userData.arrivalSharedCreature=true;for(const value of Object.values(m))if(value instanceof T.Texture)value.anisotropy=4;}}});sources.set(name,gltf);
})).then(()=>{});}
export class Creatures{
 readonly root=new T.Group();private actors:Actor[]=[];
 constructor(readonly capacity:number,readonly companion=false){
  const source=sources.get(companion?'wyvern':'antlion');if(!source)throw Error('Criaturas ainda não carregadas');
  const original=source.animations[0],clips:Record<Motion,T.AnimationClip>=companion?{
   Idle:source.animations.find(a=>a.name==='Hover')!,Walk:source.animations.find(a=>a.name==='Fly')!,Attack:source.animations.find(a=>a.name==='Sting')!,Death:source.animations.find(a=>a.name==='Die')!
  }:{Idle:T.AnimationUtils.subclip(original,'Idle',0,4,8),Walk:T.AnimationUtils.subclip(original,'Walk',4,12,8),Attack:T.AnimationUtils.subclip(original,'Attack',12,16,8),Death:T.AnimationUtils.subclip(original,'Death',18,24,8)};
  for(let i=0;i<capacity;i++){
   const root=new T.Group(),model=clone(source.scene);model.scale.setScalar(companion?.66:1);root.add(model);this.root.add(root);
   const mixer=new T.AnimationMixer(model),actions=Object.fromEntries(Object.entries(clips).map(([name,clip])=>[name,mixer.clipAction(clip)]))as Record<Motion,T.AnimationAction>;
   for(const name of['Attack','Death']as const){actions[name].setLoop(T.LoopOnce,1);actions[name].clampWhenFinished=true;}
   if(!companion)actions.Idle.setLoop(T.LoopPingPong,Infinity);
   actions.Attack.setDuration(companion?.5:.33);actions.Death.setDuration(.8);
   actions.Idle.play();actions.Idle.time=i*.073;this.actors.push({root,mixer,actions,state:'Idle',step:0,seen:false});
  }
 }
 update(poses:CreaturePose[],dt=1/60){
  for(let i=0;i<this.actors.length;i++){
   const a=this.actors[i],p=poses[i];a.root.visible=!!p;if(!p)continue;
   a.root.position.copy(p.position);a.root.rotation.y=p.yaw;
   const distance=Math.abs(p.step-a.step)/9,moving=a.seen&&distance>.0001;
   const state:Motion=p.dead?'Death':p.wind>0?'Attack':moving?'Walk':'Idle';
   if(state!==a.state){const next=a.actions[state];next.reset().play();a.actions[a.state].fadeOut(state==='Death'?.04:.09);next.fadeIn(state==='Death'?.04:.09);a.state=state;
    // Entering an already cleared map must keep saved corpses down.
    if(p.dead&&!a.seen)next.time=next.getClip().duration;
   }
   if(state==='Walk')a.actions.Walk.setEffectiveTimeScale(this.companion?1:Math.min(2.8,Math.max(.25,distance/Math.max(dt,.001)/1.65)));
   a.mixer.update(dt);a.step=p.step;a.seen=true;
  }
 }
 inspect(){return this.actors.map(a=>{a.root.updateMatrixWorld(true);const bounds=new T.Box3(),point=new T.Vector3();let bones=0,pose=0,meshes=0;
  a.root.traverse(o=>{if(o instanceof T.SkinnedMesh){meshes++;o.computeBoundingBox();bounds.union(o.boundingBox!.clone().applyMatrix4(o.matrixWorld));for(let i=0;i<o.skeleton.bones.length;i++){o.skeleton.bones[i].getWorldPosition(point);pose+=(i+1)*(point.x+point.y*.7+point.z*.3);bones++;}}});
  return{state:a.state,visible:a.root.visible,position:a.root.position.toArray(),time:a.actions[a.state].time,meshes,bones,pose,bounds:{min:bounds.min.toArray(),max:bounds.max.toArray()}};
 });}
 dispose(){for(const a of this.actors){a.mixer.stopAllAction();a.mixer.uncacheRoot(a.mixer.getRoot());a.root.traverse(o=>{if(o instanceof T.SkinnedMesh)o.skeleton.dispose();});}this.root.clear();this.actors=[];}
}
