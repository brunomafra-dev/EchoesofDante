import * as T from 'three';
import {Batches,tube,sphere,material,mineralSurface}from'./Art';
export type CreaturePose={position:T.Vector3;yaw:number;step:number;wind:number;dead:boolean};
// Shared shell batches and instanced articulated legs: no geometry is rebuilt in update.
export class Creatures{
 readonly root=new T.Group();private shells:T.InstancedMesh[]=[];private legs:T.InstancedMesh;private eyes:T.InstancedMesh;private pupils:T.InstancedMesh;private matrix=new T.Matrix4();private node=new T.Object3D();private maps:T.Texture[]=[];
 constructor(readonly capacity:number,readonly companion=false){
  const batch=new Batches(),shell=material(companion?'#607858':'#74686e',.08,.9),edge=material(companion?'#b59e73':'#514b59',.12,.85),under=material('#363e36',.05,.95);
  const loader=new T.TextureLoader(),map=mineralSurface(),normal=loader.load('/assets/frontier-3d/Rock035_1K-JPG_NormalGL.webp');map.colorSpace=T.SRGBColorSpace;for(const t of[map,normal]){t.wrapS=t.wrapT=T.RepeatWrapping;t.repeat.set(1.5,1.5);this.maps.push(t);}for(const m of[shell,edge]){m.map=map;m.normalMap=normal;m.normalScale.set(.45,.45);}
  batch.add(sphere,shell,0,.58,0,.56,.36,companion?.92:.73);batch.add(sphere,under,0,.35,.3,.38,.20,.45);
  for(let i=0;i<5;i++){const z=-.5+i*.24;batch.add(new T.DodecahedronGeometry(1),edge,0,.77-Math.abs(i-2)*.035,z,.46,.16,.25,(i%2?1:-1)*.08);if(!companion)for(const side of[-1,1])batch.add(new T.ConeGeometry(.12,.34,5),shell,side*.43,.8,z,1,1,1,side*.3);}
  batch.add(sphere,edge,0,.48,.72,.32,.26,.23);batch.add(sphere,under,0,.49,.91,.19,.16,.06);
  const group=new T.Group();batch.flush(group,[]);group.traverse(o=>{if(o instanceof T.Mesh){const mesh=new T.InstancedMesh(o.geometry,o.material,capacity);mesh.castShadow=true;mesh.receiveShadow=true;mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);mesh.frustumCulled=false;this.shells.push(mesh);this.root.add(mesh);}});
  this.legs=new T.InstancedMesh(tube,edge,capacity*(companion?8:12));this.legs.castShadow=true;this.legs.frustumCulled=false;this.legs.instanceMatrix.setUsage(T.DynamicDrawUsage);this.root.add(this.legs);
  const eye=material(companion?'#7eaa64':'#b28b32',.3,.3);eye.emissive.set('#75481d');eye.emissiveIntensity=.18;this.eyes=new T.InstancedMesh(sphere,eye,capacity);this.eyes.frustumCulled=false;this.pupils=new T.InstancedMesh(sphere,new T.MeshBasicMaterial({color:'#171c15'}),capacity);this.pupils.frustumCulled=false;this.root.add(this.eyes,this.pupils);
 }
 update(poses:CreaturePose[]){
  for(const m of this.shells)m.count=poses.length;this.eyes.count=this.pupils.count=poses.length;let leg=0;const pairs=this.companion?2:3,up=new T.Vector3(0,1,0);
  poses.forEach((p,index)=>{this.node.position.copy(p.position);this.node.position.y+=p.dead?-.05:-p.wind*.12;this.node.rotation.set(0,p.yaw,0);this.node.scale.set(1,p.dead?.45:1,1);this.node.updateMatrix();this.matrix.copy(this.node.matrix);
   for(const mesh of this.shells)mesh.setMatrixAt(index,this.matrix);
   this.node.position.set(0,.49,.95);this.node.rotation.set(0,0,0);this.node.scale.set(.115,.12,.045);this.node.updateMatrix();this.node.matrix.premultiply(this.matrix);this.eyes.setMatrixAt(index,this.node.matrix);
   this.node.position.set(0,.49,.991);this.node.scale.set(.033,.085,.012);this.node.updateMatrix();this.node.matrix.premultiply(this.matrix);this.pupils.setMatrixAt(index,this.node.matrix);
   for(let i=0;i<pairs;i++)for(const side of[-1,1]){const phase=p.dead?0:Math.sin(p.step+i*2+side*Math.PI),z=(i-(pairs-1)*.5)*.48,hip=new T.Vector3(side*.38,.48,z),knee=new T.Vector3(side*(p.dead?.95:.86),p.dead?.08:.48+Math.max(0,phase)*.08,z+.12),foot=new T.Vector3(side*1.04,p.dead?.04:.04+Math.max(0,phase)*.14,z+phase*.18);
    for(const[a,b]of[[hip,knee],[knee,foot]]){this.node.position.copy(a).add(b).multiplyScalar(.5);this.node.quaternion.setFromUnitVectors(up,b.clone().sub(a).normalize());this.node.scale.set(.055,a.distanceTo(b),.055);this.node.updateMatrix();this.node.matrix.premultiply(this.matrix);this.legs.setMatrixAt(leg++,this.node.matrix);}
   }
  });this.legs.count=leg;for(const m of[...this.shells,this.legs,this.eyes,this.pupils])m.instanceMatrix.needsUpdate=true;
 }
 dispose(){for(const m of this.shells){m.geometry.dispose();(m.material as T.Material).dispose();}for(const m of[this.eyes,this.pupils,this.legs])(m.material as T.Material).dispose();this.maps.forEach(t=>t.dispose());}
}
