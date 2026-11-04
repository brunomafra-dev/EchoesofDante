import * as T from 'three';
import {GLTFLoader,type GLTF}from'three/addons/loaders/GLTFLoader.js';import{clone}from'three/addons/utils/SkeletonUtils.js';
export type Motion='Idle'|'Walk'|'Run'|'Attack'|'Hit'|'Death';
export type CreaturePose={position:T.Vector3;yaw:number;step:number;wind:number;dead:boolean;hit?:number;motion?:Motion};
type Actor={root:T.Group;mixer:T.AnimationMixer;actions:Partial<Record<Motion,T.AnimationAction>>;state:Motion;step:number;wind:number;hit:number;seen:boolean};
const sources=new Map<string,GLTF>();let loading:Promise<void>|undefined,reason='';
export function hollowStatus(){return{active:sources.has('spider')?'spider':'antlion',reason};}
export function loadCreatures(){return loading??=Promise.all([
 ...['antlion','wyvern'].map(async name=>{sources.set(name,await new GLTFLoader().loadAsync('/assets/arrival-3d/creature-'+name+'-187.glb'));}),
 (async()=>{try{const payload=(await import('virtual:arrival-hollow')).default;if(!payload){reason='Aranha não preparada neste checkout; Hollow anterior em uso.';return;}const bytes=Uint8Array.from(atob(payload.data),c=>c.charCodeAt(0)),gltf=await new GLTFLoader().parseAsync(bytes.buffer,'');for(const name of['Idle','Walk','Run','Bite','Hit','Death'])if(!gltf.animations.some(c=>c.name===name))throw Error('Clipe obrigatório ausente: '+name);sources.set('spider',gltf);}catch{reason='A aranha não carregou; Hollow anterior em uso.';}})()
]).then(()=>{for(const [name,gltf]of sources)gltf.scene.traverse(o=>{if(o instanceof T.Mesh){o.castShadow=true;o.receiveShadow=true;for(const m of Array.isArray(o.material)?o.material:[o.material]){m.userData.arrivalSharedCreature=true;if(name==='spider'&&m instanceof T.MeshStandardMaterial){m.color.setRGB(.86,.91,.80);m.emissiveIntensity=.25;}for(const value of Object.values(m))if(value instanceof T.Texture)value.anisotropy=4;}}});});}
export class Creatures{
 readonly root=new T.Group();readonly visual:string;readonly motions:Motion[];private actors:Actor[]=[];
 constructor(readonly capacity:number,readonly companion=false,previous=false){
  this.visual=companion?'wyvern':!previous&&sources.has('spider')?'spider':'antlion';const source=sources.get(this.visual);if(!source)throw Error('Criaturas ainda não carregadas');const spider=this.visual==='spider',original=source.animations[0];
  const clips:Partial<Record<Motion,T.AnimationClip>>=spider?Object.fromEntries(['Idle','Walk','Run','Hit','Death'].map(n=>[n,source.animations.find(a=>a.name===n)!])):companion?{Idle:source.animations.find(a=>a.name==='Hover')!,Walk:source.animations.find(a=>a.name==='Fly')!,Attack:source.animations.find(a=>a.name==='Sting')!,Death:source.animations.find(a=>a.name==='Die')!}:{Idle:T.AnimationUtils.subclip(original,'Idle',0,4,8),Walk:T.AnimationUtils.subclip(original,'Walk',4,12,8),Attack:T.AnimationUtils.subclip(original,'Attack',12,16,8),Death:T.AnimationUtils.subclip(original,'Death',18,24,8)};
  if(spider)clips.Attack=source.animations.find(a=>a.name==='Bite')!;this.motions=Object.keys(clips)as Motion[];
  for(let i=0;i<capacity;i++){
   const root=new T.Group(),model=clone(source.scene);model.scale.setScalar(spider?.44:companion?.66:1);root.add(model);this.root.add(root);
   const mixer=new T.AnimationMixer(model),actions=Object.fromEntries(Object.entries(clips).map(([name,clip])=>[name,mixer.clipAction(clip)]))as Actor['actions'];
   for(const name of['Attack','Hit','Death']as const)if(actions[name]){actions[name]!.setLoop(T.LoopOnce,1);actions[name]!.clampWhenFinished=true;}
   if(this.visual==='antlion')actions.Idle!.setLoop(T.LoopPingPong,Infinity);
   actions.Attack!.setEffectiveTimeScale(spider?.36/.33:actions.Attack!.getClip().duration/(companion?.5:.33));if(!spider)actions.Death!.setDuration(.8);
   actions.Idle!.play();actions.Idle!.time=i*.137;this.actors.push({root,mixer,actions,state:'Idle',step:0,wind:0,hit:0,seen:false});
  }
 }
 update(poses:CreaturePose[],dt=1/60){for(let i=0;i<this.actors.length;i++){
  const a=this.actors[i],p=poses[i];a.root.visible=!!p;if(!p)continue;a.root.position.copy(p.position);a.root.rotation.y=p.yaw;
  const distance=Math.abs(p.step-a.step)/9,speed=distance/Math.max(dt,.001),moving=a.seen&&distance>.0001,hit=p.hit??0;
  let state:Motion=p.dead?'Death':p.wind>0?'Attack':moving&&speed>1.6&&a.actions.Run?'Run':moving?'Walk':'Idle';
  if(!p.dead&&p.wind<=0){if(hit!==a.hit&&a.actions.Hit)state='Hit';else if(['Attack','Hit'].includes(a.state)&&a.actions[a.state]!.time<a.actions[a.state]!.getClip().duration-.001&&!moving)state=a.state;}
  if(p.motion&&a.actions[p.motion])state=p.motion;
  const restart=state==='Attack'&&p.wind>0&&a.wind<=0||state==='Hit'&&hit!==a.hit;
  if(state!==a.state||restart){const next=a.actions[state]!;next.reset().play();if(state!==a.state)a.actions[a.state]!.fadeOut(state==='Death'?.04:.09);next.fadeIn(state==='Death'?.04:.09);a.state=state;if(p.dead&&!a.seen)next.time=next.getClip().duration;}
  if(state==='Walk'||state==='Run')a.actions[state]!.setEffectiveTimeScale(p.motion?1:this.visual==='spider'?Math.max(.2,Math.min(2.5,speed/((state==='Run'?7.325:2.512)*.44))):this.companion?1:Math.min(2.8,Math.max(.25,speed/1.65)));
  a.mixer.update(dt);a.step=p.step;a.wind=p.wind;a.hit=hit;a.seen=true;
 }}
 inspect(){return this.actors.map(a=>{a.root.updateMatrixWorld(true);const bounds=new T.Box3(),point=new T.Vector3();let bones=0,pose=0,meshes=0;a.root.traverse(o=>{if(o instanceof T.SkinnedMesh){meshes++;o.computeBoundingBox();bounds.union(o.boundingBox!.clone().applyMatrix4(o.matrixWorld));for(let i=0;i<o.skeleton.bones.length;i++){o.skeleton.bones[i].getWorldPosition(point);pose+=(i+1)*(point.x+point.y*.7+point.z*.3);bones++;}}});return{visual:this.visual,state:a.state,visible:a.root.visible,position:a.root.position.toArray(),time:a.actions[a.state]!.time,meshes,bones,pose,bounds:{min:bounds.min.toArray(),max:bounds.max.toArray()}};});}
 dispose(){for(const a of this.actors){a.mixer.stopAllAction();a.mixer.uncacheRoot(a.mixer.getRoot());a.root.traverse(o=>{if(o instanceof T.SkinnedMesh)o.skeleton.dispose();});}this.root.clear();this.actors=[];}
}
