import * as T from 'three';
import {sphere,material}from'./Art';
import {identityMeshes}from'./Identity';
export type CreaturePose={position:T.Vector3;yaw:number;step:number;wind:number;dead:boolean};

/** Offline body/scute/limb meshes, shared materials, articulated instance matrices. */
export class Creatures{
 readonly root=new T.Group();
 private body:T.InstancedMesh[]=[];private upper:T.InstancedMesh[]=[];private lower:T.InstancedMesh[]=[];private feet:T.InstancedMesh[]=[];
 private eyes?:T.InstancedMesh;private pupils?:T.InstancedMesh;
 private matrix=new T.Matrix4();private node=new T.Object3D();private up=new T.Vector3(0,1,0);
 constructor(readonly capacity:number,readonly companion=false){
  const name=companion?'pet':'hollow',legs=companion?4:6;
  for(const [part,list,count]of[['body',this.body,capacity],['upper',this.upper,capacity*legs],['lower',this.lower,capacity*legs],['foot',this.feet,capacity*legs]]as const){
   for(const source of identityMeshes(name+'-'+part)){
    const mesh=new T.InstancedMesh(source.geometry,source.material,count);mesh.castShadow=true;mesh.receiveShadow=true;mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);mesh.frustumCulled=false;list.push(mesh);this.root.add(mesh);
   }
  }
  if(!companion){const eye=material('#c39541',.25,.3);eye.emissive.set('#805719');eye.emissiveIntensity=.3;
   this.eyes=new T.InstancedMesh(sphere,eye,capacity);this.pupils=new T.InstancedMesh(sphere,new T.MeshBasicMaterial({color:'#151d15'}),capacity);
   for(const m of[this.eyes,this.pupils]){m.frustumCulled=false;m.instanceMatrix.setUsage(T.DynamicDrawUsage);this.root.add(m);}
  }
 }
 private set(list:T.InstancedMesh[],index:number){this.node.updateMatrix();this.node.matrix.premultiply(this.matrix);for(const mesh of list)mesh.setMatrixAt(index,this.node.matrix);}
 private segment(list:T.InstancedMesh[],index:number,a:T.Vector3,b:T.Vector3){this.node.position.copy(a).add(b).multiplyScalar(.5);this.node.quaternion.setFromUnitVectors(this.up,b.clone().sub(a).normalize());this.node.scale.set(.8,a.distanceTo(b),.8);this.set(list,index);}
 update(poses:CreaturePose[]){
  for(const m of this.body)m.count=poses.length;
  if(this.eyes&&this.pupils)this.eyes.count=this.pupils.count=poses.length;
  let leg=0;const pairs=this.companion?2:3;
  poses.forEach((p,index)=>{
   this.node.position.copy(p.position);this.node.position.y+=p.dead?-.03:-p.wind*.10+(p.step?Math.sin(p.step*2)*.012:0);this.node.rotation.set(0,p.yaw,0);this.node.scale.set(1,p.dead?.45:1,1);this.node.updateMatrix();this.matrix.copy(this.node.matrix);
   for(const mesh of this.body)mesh.setMatrixAt(index,this.matrix);
   if(this.eyes&&this.pupils){
    this.node.position.set(0,.49,.871);this.node.rotation.set(0,0,0);this.node.scale.set(.11,.10,.026);this.set([this.eyes],index);
    this.node.position.set(0,.49,.896);this.node.scale.set(.026,.073,.009);this.set([this.pupils],index);
   }
   for(let i=0;i<pairs;i++)for(const side of[-1,1]){
    const phase=p.dead?0:Math.sin(p.step+i*Math.PI+(side>0?Math.PI:0)),lift=Math.max(0,phase),z=(i-(pairs-1)*.5)*(this.companion?.75:.44);
    const hip=new T.Vector3(side*(this.companion?.23:.38),this.companion?.57:.49,z),knee=new T.Vector3(side*(this.companion?.33:.73),p.dead?.10:(this.companion?.28:.35)+lift*.07,z+(this.companion?-.08:.07));
    const foot=new T.Vector3(side*(this.companion?.36:.94),p.dead?.025:.015+lift*.13,z+phase*.15);
    this.segment(this.upper,leg,hip,knee);this.segment(this.lower,leg,knee,foot);
    this.node.position.copy(foot);this.node.rotation.set(0,side*.3,0);this.node.scale.setScalar(this.companion?.85:.8);this.set(this.feet,leg++);
   }
  });
  for(const m of[...this.upper,...this.lower,...this.feet])m.count=leg;
  for(const m of[...this.body,...this.upper,...this.lower,...this.feet,...(this.eyes&&this.pupils?[this.eyes,this.pupils]:[])])m.instanceMatrix.needsUpdate=true;
 }
 dispose(){for(const m of[...this.body,...this.upper,...this.lower,...this.feet])m.geometry.dispose();if(this.eyes&&this.pupils){(this.eyes.material as T.Material).dispose();(this.pupils.material as T.Material).dispose();}}
}
