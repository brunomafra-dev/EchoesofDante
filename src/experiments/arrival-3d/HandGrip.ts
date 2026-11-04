import * as T from 'three';

/** Hand sockets are measured from the shipped bind rig, not the wrist origin.
 * The imported clips leave fingers open; a held tool needs its own hand pose.
 * This layer runs after the mixer and never changes the source skeleton/GLB. */
export class HandGrip {
 private fingers:{bone:T.Object3D;rest:T.Quaternion;position:T.Vector3;finger:string;joint:number;side:string}[]=[];
 private poses=new Map<string,T.Quaternion[]>();
 constructor(private model:T.Object3D){
  for(const side of ['r','l'])for(const finger of ['index','middle','ring','pinky','thumb'])for(let joint=1;joint<=3;joint++){
   const bone=model.getObjectByName(`${finger}_0${joint}_${side}`);
   if(bone)this.fingers.push({bone,rest:bone.quaternion.clone(),position:bone.position.clone(),finger,joint,side});
  }
 }
 center(side:string){
  const knuckle=this.fingers.find(f=>f.side===side&&f.finger==='middle'&&f.joint===1)!.position;
  return new T.Vector3((side==='r'?-1:1)*(Math.abs(knuckle.x)+.036),knuckle.y+.001,knuckle.z-.004);
 }
 close(side:string,support=false,trigger=false){
  const sign=side==='r'?1:-1,fingers=this.fingers.filter(f=>f.side===side),key=side+support+trigger,cached=this.poses.get(key);
  fingers.forEach((f,i)=>{f.bone.position.copy(f.position);if(cached)f.bone.quaternion.copy(cached[i]);});
  if(cached)return;
  for(const f of fingers){
   f.bone.quaternion.copy(f.rest);
   if(f.finger!=='thumb'){
    const curl=(trigger&&f.finger==='index'?[.3,.7,.5]:support?[.55,.9,.7]:[.75,1.15,.8])[f.joint-1];
    // Both imported finger chains flex around local +X. Their bind bases
    // already mirror the palm normal; negating the left curl bends backwards.
    f.bone.quaternion.multiply(new T.Quaternion().setFromAxisAngle(new T.Vector3(1,0,0),curl));
   }
  }
  // Oppose the thumb to the curled fingers, instead of making a closed fist
  // through the handle. Solve against the actual mirrored hand bind space.
  const hand=this.model.getObjectByName('hand_'+side)!,tip=this.model.getObjectByName('thumb_04_leaf_'+side)!;
  const target=this.center(side).add(new T.Vector3(-sign*.021,-.011,.035));
  hand.updateWorldMatrix(true,true);hand.localToWorld(target);
  for(let pass=0;pass<3;pass++)for(const joint of [3,2,1]){
   const bone=this.model.getObjectByName(`thumb_0${joint}_${side}`)!;
   hand.updateWorldMatrix(true,true);
   const origin=bone.getWorldPosition(new T.Vector3()),from=tip.getWorldPosition(new T.Vector3()).sub(origin).normalize(),to=target.clone().sub(origin).normalize();
   const q=new T.Quaternion().setFromUnitVectors(from,to),angle=q.angleTo(new T.Quaternion());
   if(angle>.4)q.slerp(new T.Quaternion(),1-.4/angle);
   const world=q.multiply(bone.getWorldQuaternion(new T.Quaternion()));
   bone.quaternion.copy(bone.parent!.getWorldQuaternion(new T.Quaternion()).invert().multiply(world));
  }
  this.poses.set(key,fingers.map(f=>f.bone.quaternion.clone()));
 }
 relax(side:string,weight:number){
  if(weight<.001)return;
  const fingers=this.fingers.filter(f=>f.side===side),key=side+'relaxed';
  let pose=this.poses.get(key);
  if(!pose){pose=fingers.map(f=>f.rest.clone().multiply(new T.Quaternion().setFromAxisAngle(new T.Vector3(1,0,0),f.finger==='thumb'?0:[.18,.24,.18][f.joint-1])));this.poses.set(key,pose);}
  fingers.forEach((f,i)=>{f.bone.position.lerp(f.position,weight);f.bone.quaternion.slerp(pose![i],weight);});
 }
 inspect(side:string){
  const hand=this.model.getObjectByName('hand_'+side)!;hand.updateWorldMatrix(true,true);
  return {center:this.center(side).toArray(),fingers:['index','middle','ring','pinky','thumb'].map(finger=>({finger,
   base:hand.worldToLocal(this.model.getObjectByName(finger+'_01_'+side)!.getWorldPosition(new T.Vector3())).toArray(),
   tip:hand.worldToLocal(this.model.getObjectByName(finger+'_04_leaf_'+side)!.getWorldPosition(new T.Vector3())).toArray()}))};
 }
}
