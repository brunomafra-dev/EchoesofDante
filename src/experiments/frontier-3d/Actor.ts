import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {jumpLift} from './jumpLift';

export class Actor {
 readonly root=new T.Group();
 readonly model:T.Group;
 readonly mixer:T.AnimationMixer;
 private actions=new Map<string,T.AnimationAction>();
 private current?:T.AnimationAction;
 private actionName='';
 private lock=0;
 private constructor(gltf:Awaited<ReturnType<GLTFLoader['loadAsync']>>,height:number,palette:boolean,creature:boolean){
  this.model=gltf.scene;this.root.add(this.model);
  const bounds=new T.Box3().setFromObject(this.model),size=bounds.getSize(new T.Vector3());this.model.scale.setScalar(height/size.y);this.model.position.y=-bounds.min.y*height/size.y;
  const crew=this.model.userData.frontierCrew===true;
  this.model.traverse(o=>{if(o instanceof T.Mesh){o.castShadow=true;o.receiveShadow=true;const materials=(Array.isArray(o.material)?o.material:[o.material]) as T.MeshStandardMaterial[];for(const m of materials){if(crew){if(m.map)m.map.anisotropy=4;continue;}m.roughness=.8;m.metalness=.05;if(m.name==='Skin')m.color.set(palette?'#b98b68':'#caa78a');if(palette&&m.name==='Main')m.color.set('#a18d66');if(palette&&m.name==='DarkGreen')m.color.set('#647458');if(!palette&&m.name==='Grey')m.color.set('#767f79');if(!palette&&m.name==='Helmet')m.color.set('#526e73');}}});
  if(creature){const colors:Record<string,string>={Main:'#5c6650',White:'#abaf97',Eyes:'#292720',Stripe:'#343b2c',Nails:'#c3b38f'};this.model.traverse(o=>{if(o instanceof T.Mesh)for(const m of Array.isArray(o.material)?o.material:[o.material])if(colors[m.name])(m as T.MeshStandardMaterial).color.set(colors[m.name]);});}
  if(crew){
   const spine=this.model.getObjectByName('spine_03');
   if(spine){
    const equipment=new T.Group(),fabric=new T.MeshStandardMaterial({color:palette?'#3d4c3e':'#48565a',roughness:.95}),trim=new T.MeshStandardMaterial({color:'#b08a57',metalness:.35,roughness:.65}),screen=new T.MeshStandardMaterial({color:'#79c8ba',emissive:'#366e67',emissiveIntensity:.4,metalness:.25,roughness:.35});
    const piece=(w:number,h:number,d:number,x:number,y:number,z:number,m:T.Material)=>{const mesh=new T.Mesh(new RoundedBoxGeometry(w,h,d,2,Math.min(w,h,d)*.16),m);mesh.position.set(x,y,z);mesh.castShadow=mesh.receiveShadow=true;equipment.add(mesh);};
    piece(.36,.45,.19,0,1.32,-.22,fabric);piece(.29,.08,.21,0,1.55,-.22,trim);
    for(const x of [-.15,.15])piece(.045,.48,.035,x,1.35,.14,fabric);
    piece(.18,.12,.045,.07,1.42,.18,trim);piece(.13,.06,.01,.07,1.43,.208,screen);
    for(const material of [fabric,trim,screen]){
     const parts=equipment.children.filter(o=>o instanceof T.Mesh&&o.material===material) as T.Mesh[];
     const baked=parts.map(o=>{o.updateMatrix();return o.geometry.clone().applyMatrix4(o.matrix);}),merged=mergeGeometries(baked);baked.forEach(g=>g.dispose());
     for(const o of parts){equipment.remove(o);o.geometry.dispose();}
     if(merged){const mesh=new T.Mesh(merged,material);mesh.castShadow=mesh.receiveShadow=true;equipment.add(mesh);}
    }
    this.root.add(equipment);this.root.updateMatrixWorld(true);spine.attach(equipment);
   }
   this.model.traverse(o=>{if(o instanceof T.Mesh)for(const m of Array.isArray(o.material)?o.material:[o.material])if(m.name==='MI_Hair_1')(m as T.MeshStandardMaterial).color.set(palette?'#49372a':'#68635b');});
  }
  this.mixer=new T.AnimationMixer(this.model);
  for(const source of gltf.animations){const name=source.name.split('|').pop()!.replace(/^Alien_/,'');let clip=source;
   if(palette&&!crew&&name==='Jump'){
    clip=source.clone();clip.tracks.push(new T.NumberKeyframeTrack('.position[y]',jumpLift.map(p=>p[0]),jumpLift.map(p=>this.model.position.y-p[1]*height)));
   }
   this.actions.set(name,this.mixer.clipAction(clip));
  }
  this.play('Idle');
 }
 static async load(file:string,height=1.9,palette=false){return new Actor(await new GLTFLoader().loadAsync('/assets/frontier-3d/'+file),height,palette,file==='alien.glb');}
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
