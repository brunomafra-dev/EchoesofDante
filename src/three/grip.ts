import * as T from 'three';
import type {WeaponId} from './character';

// Anatomical weapon grip for the MPFB game_engine rig.
// Every hand gets a frame built from its own finger bones (D: wrist->knuckles, A: pinky->index,
// N: palm normal, G: point inside the closed fist). Weapons are mounted against that frame,
// fingers are curled around the handle every frame, and the off hand reaches the carbine's
// fore grip with two-bone IK.
type Side='l'|'r';
interface Frame{D:T.Vector3;A:T.Vector3;N:T.Vector3;G:T.Vector3;s:number;basisT:T.Matrix4}
const FINGERS=['index','middle','ring','pinky'];
const X=new T.Vector3(1,0,0),Z=new T.Vector3(0,0,1);
const q1=new T.Quaternion(),q2=new T.Quaternion(),q3=new T.Quaternion(),m1=new T.Matrix4();
const v1=new T.Vector3(),v2=new T.Vector3(),v3=new T.Vector3(),v4=new T.Vector3();
// carbine fore grip in the weapon's own space (three axes: barrel -Z, top +Y)
const FORE_GRIP=new T.Vector3(0,-.085,-.34),PISTOL_GRIP=new T.Vector3(0,-.105,.03),BUTT=new T.Vector3(0,-.02,.385);
// rifle shoulder pocket relative to the upper chest bone, in the character's model space
const SHOULDER=new T.Vector3(-.15,.12,.1);
const HAND_PARTS=/^(hand_plate|knuckle|wrist_core|palm|thumb_guard|shell|rib|fil|sensor)/;
const NO_IK=/Roll|Death|Hit|Interact/;

export class Grip{
 private rest=new Map<T.Object3D,T.Quaternion>();private bones=new Map<string,T.Object3D>();
 private frames:Partial<Record<Side,Frame>>={};private chestRest=new T.Quaternion();
 constructor(private model:T.Object3D){
  model.traverse(o=>{if((o as T.Bone).isBone){this.rest.set(o,o.quaternion.clone());this.bones.set(o.name,o);}});
  for(const s of ['l','r'] as Side[]){const f=this.frame(s);if(f)this.frames[s]=f;}
  const c=this.b('spine_03');if(c){model.updateMatrixWorld(true);this.chestRest.copy(this.modelQ(c));}
 }
 private modelQ(o:T.Object3D){return this.model.getWorldQuaternion(new T.Quaternion()).invert().multiply(o.getWorldQuaternion(new T.Quaternion()));}
 private b(n:string){return this.bones.get(n);}
 private frame(s:Side):Frame|undefined{
  const m=this.b('middle_01_'+s),i=this.b('index_01_'+s),p=this.b('pinky_01_'+s);if(!m||!i||!p)return;
  const D=m.position.clone().normalize();
  const N=Z.clone().applyQuaternion(this.rest.get(m)!);N.addScaledVector(D,-N.dot(D)).normalize();
  const A=new T.Vector3().crossVectors(N,D).normalize();if(A.dot(v1.copy(i.position).sub(p.position))<0)A.negate();
  const basis=new T.Matrix4().makeBasis(D,A,N);const sgn=Math.sign(basis.determinant())||1;
  const G=m.position.clone().multiplyScalar(.7).addScaledVector(N,.03);
  return {D,A,N,G,s:sgn,basisT:basis.clone().transpose()};
 }
 // place the weapon so its handle sits inside the right fist (bracers ride the forearm); returns the parent
 mount(id:WeaponId,w:T.Object3D):T.Object3D|null{
  const f=this.frames.r;if(!f)return null;
  if(id==='carbine')return this.model;
  if(id==='gauntlet'||id==='conductor'){
   const h=this.b('hand_r');if(!h)return null;
   // the hand plates must bend with the wrist: move them to a group riding the hand bone
   const hg=new T.Group();hg.name='weapon_hand_part';
   for(const c of [...w.children])if(HAND_PARTS.test(c.name))hg.add(c);
   const Zv=f.D.clone().negate(),Yv=f.N.clone().negate();Yv.addScaledVector(Zv,-Yv.dot(Zv)).normalize();
   hg.quaternion.setFromRotationMatrix(m1.makeBasis(new T.Vector3().crossVectors(Yv,Zv),Yv,Zv));
   hg.position.copy(Yv).multiplyScalar(id==='gauntlet'?-.018:-.01).addScaledVector(Zv,id==='gauntlet'?.045:.03);
   h.add(hg);w.userData.handPart=hg;
   this.bracer(id,w,this.rest.get(h)!);return this.b('lowerarm_r')??null;
  }
  let Yv:T.Vector3,Zv:T.Vector3;const handle=new T.Vector3();let origin:T.Vector3;
  if(id==='saber'){Zv=f.A.clone().negate();Yv=f.D.clone();origin=f.G.clone();}
  else{Zv=f.D.clone().negate();Yv=f.N.clone().negate();origin=f.D.clone().multiplyScalar(-.01);}
  Yv.addScaledVector(Zv,-Yv.dot(Zv)).normalize();const Xv=new T.Vector3().crossVectors(Yv,Zv);
  w.quaternion.setFromRotationMatrix(m1.makeBasis(Xv,Yv,Zv));
  w.position.copy(origin).sub(handle.applyQuaternion(w.quaternion));
  return this.b('hand_r')??null;
 }
 // bracer on the forearm, rolled so its plate follows the back of the (animated) hand
 private bracer(id:WeaponId,w:T.Object3D,handQ:T.Quaternion){
  const f=this.frames.r,h=this.b('hand_r');if(!f||!h)return;
  const Zv=v1.set(0,-1,0),Yv=v2.copy(f.N).negate().applyQuaternion(handQ);
  Yv.addScaledVector(Zv,-Yv.dot(Zv)).normalize();const Xv=v3.crossVectors(Yv,Zv);
  w.quaternion.setFromRotationMatrix(m1.makeBasis(Xv,Yv,Zv));
  w.position.copy(h.position).addScaledVector(Zv,id==='gauntlet'?-.03:-.03).addScaledVector(Yv,-.004);
 }
 private curl(s:Side,amt:number,index=1,thumb=.5){
  for(const f of FINGERS)for(let k=1;k<=3;k++){
   const bn=this.b(`${f}_0${k}_${s}`);if(!bn)continue;
   const a=amt*(k===1?.95:k===2?1.25:.85)*(f==='index'?index:1);
   bn.quaternion.copy(this.rest.get(bn)!).multiply(q1.setFromAxisAngle(X,a));
  }
  for(let k=2;k<=3;k++){const bn=this.b(`thumb_0${k}_${s}`);if(bn)bn.quaternion.copy(this.rest.get(bn)!).multiply(q1.setFromAxisAngle(X,thumb*(k===2?.7:.9)));}
 }
 // call after the mixer has posed the skeleton
 apply(id:WeaponId|null,w:T.Object3D|null,anim:string){
  if(!id){this.curl('r',.3);this.curl('l',.3);return;}
  if(id==='saber'){this.curl('r',1.05,1,.75);this.curl('l',.35);}
  else if(id==='carbine'){this.curl('r',1.0,.45,.6);this.curl('l',.95,1,.6);if(w){this.holdRifle(w,/Shoot/.test(anim));if(!NO_IK.test(anim)){this.reach('r',w,PISTOL_GRIP);this.reach('l',w,FORE_GRIP);}}}
  else if(id==='gauntlet'){this.curl('r',1.15,1,.9);this.curl('l',.9,1,.8);const h=this.b('hand_r');if(w&&h)this.bracer(id,w,h.quaternion);}
  else{this.curl('r',.35,.2,.15);this.curl('l',.3);const h=this.b('hand_r');if(w&&h)this.bracer(id,w,h.quaternion);}
 }
 // rifle rests on the shoulder and follows the chest; barrel low-ready unless shooting
 private pitch=-.4;
 private holdRifle(w:T.Object3D,aim:boolean){
  const c=this.b('spine_03');if(!c)return;this.model.updateMatrixWorld(true);
  this.pitch+=((aim?-.02:-.42)-this.pitch)*.25;
  const delta=this.modelQ(c).multiply(this.chestRest.clone().invert());
  const base=new T.Quaternion().setFromEuler(new T.Euler(0,Math.PI,0)).multiply(new T.Quaternion().setFromAxisAngle(X,-this.pitch));
  w.quaternion.copy(delta).multiply(base);
  const chest=this.model.worldToLocal(c.getWorldPosition(new T.Vector3()));
  const sh=chest.add(SHOULDER.clone().applyQuaternion(delta));
  w.position.copy(sh).sub(BUTT.clone().applyQuaternion(w.quaternion));
  w.updateMatrixWorld(true);
 }
 // hand to a point of the weapon with two-bone IK
 private reach(side:Side,w:T.Object3D,point:T.Vector3){
  const f=this.frames[side],ua=this.b('upperarm_'+side),la=this.b('lowerarm_'+side),h=this.b('hand_'+side);if(!f||!ua||!la||!h)return;
  this.model.updateMatrixWorld(true);
  // target hand orientation: knuckles along the barrel, knuckle line up the grip
  const wq=w.getWorldQuaternion(q1);
  const Dw=v1.set(0,0,-1).applyQuaternion(wq),Aw=v2.set(0,1,0).applyQuaternion(wq),Nw=v3.crossVectors(Dw,Aw).multiplyScalar(f.s);
  const R=m1.makeBasis(Dw,Aw,Nw).multiply(f.basisT);const handQ=new T.Quaternion().setFromRotationMatrix(R);
  const grip=w.localToWorld(point.clone());
  const wrist=grip.sub(f.G.clone().applyQuaternion(handQ).multiplyScalar(h.getWorldScale(v4).x));
  // two-bone IK, elbow kept on the animation's side but biased downwards
  const S=ua.getWorldPosition(new T.Vector3()),E=la.getWorldPosition(new T.Vector3()),W=h.getWorldPosition(new T.Vector3());
  const a=E.distanceTo(S),b=W.distanceTo(E),t=wrist.clone().sub(S),len=t.length();
  if(len<1e-4)return;const dir=t.clone().divideScalar(len),d=Math.min(Math.max(len,Math.abs(a-b)+1e-3),a+b-1e-3);
  const hint=E.clone().sub(S).add(new T.Vector3(0,-.25*a,0));const perp=hint.addScaledVector(dir,-hint.dot(dir));
  if(perp.lengthSq()<1e-8)perp.set(0,-1,0).addScaledVector(dir,-dir.y);perp.normalize();
  const cosA=T.MathUtils.clamp((a*a+d*d-b*b)/(2*a*d),-1,1),sinA=Math.sqrt(1-cosA*cosA);
  const E2=S.clone().addScaledVector(dir,a*cosA).addScaledVector(perp,a*sinA);
  this.rotateTo(ua,E.clone().sub(S).normalize(),E2.clone().sub(S).normalize());
  const E3=la.getWorldPosition(new T.Vector3()),W3=h.getWorldPosition(new T.Vector3()),Wt=S.clone().addScaledVector(dir,d);
  this.rotateTo(la,W3.sub(E3).normalize(),Wt.sub(E3).normalize());
  // hand: absolute orientation in world -> local to the forearm
  la.getWorldQuaternion(q2);h.quaternion.copy(q2.invert().multiply(handQ));
  h.updateMatrixWorld(true);
 }
 private rotateTo(bone:T.Object3D,from:T.Vector3,to:T.Vector3){
  const delta=q1.setFromUnitVectors(from,to);
  const world=bone.getWorldQuaternion(q2);const nw=q3.copy(delta).multiply(world);
  const parent=bone.parent!.getWorldQuaternion(new T.Quaternion()).invert();
  bone.quaternion.copy(parent.multiply(nw));bone.updateMatrixWorld(true);
 }
}
