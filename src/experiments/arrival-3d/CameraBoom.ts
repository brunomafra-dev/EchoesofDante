import * as T from 'three';
/** Trees resolve visibility in their material; never force the player's zoom. */
export class CameraBoom{
 private distance=0;private wanted=0;private allowed=0;
 private direction=new T.Vector3();private offset=new T.Vector3();
 reset(){this.distance=0;}
 update(camera:T.PerspectiveCamera,target:T.Vector3,desired:T.Vector3,obstacles:readonly T.Sphere[],_dt:number){
  const direction=this.direction.copy(desired).sub(target),length=direction.length();direction.normalize();let allowed=length;
  for(const sphere of obstacles){const offset=this.offset.copy(target).sub(sphere.center),radius=sphere.radius+.28,b=offset.dot(direction),c=offset.lengthSq()-radius*radius,d=b*b-c;if(d<=0)continue;const entry=-b-Math.sqrt(d);if(entry>0&&entry<allowed)allowed=Math.max(.85,entry-.18);}
  this.wanted=length;this.allowed=allowed;this.distance=length;
  camera.position.copy(target).addScaledVector(direction,this.distance);camera.lookAt(target);camera.updateMatrixWorld(true);
 }
 inspect(){return{desired:this.wanted,allowed:this.allowed,distance:this.distance,obstructed:this.allowed<this.wanted-.01,mode:'foliage-cutout'};}
}
