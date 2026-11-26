import * as T from 'three';

// Garments and armour fitted to the body, after the 2D wardrobe. Each piece reads the body vertices driven by one
// bone, measures the body's radius per slice and angle around that bone, and builds a thick shell slightly outside it.
// The shell is parented to the bone, so it moves with it without skinning. Shapes are cached per body (sex).

export type Finish='plate'|'cloth'|'leather'|'camo';
export interface Wrap{bone:string;also?:string[];t0?:number;t1?:number;a0?:number;a1?:number;pad?:number;flare?:number;th?:number;rows?:number;cols?:number;
 finish:Finish;color:string;trim?:string;key?:string}
interface Samples{world:Map<string,T.Vector3[]>;inv:Map<string,T.Matrix4>;front:T.Vector3}
const samples=new Map<string,Samples>(),geos=new Map<string,T.BufferGeometry>();

// rest-pose body, sorted by the bone that drives each vertex most
function sample(model:T.Object3D,key:string){
 let S=samples.get(key);if(S)return S;
 // the visible surface: what is left of the body plus the base suit currently worn (hair, lashes, boots and armour excluded)
 const meshes:T.SkinnedMesh[]=[];
 model.traverse(o=>{const m=o as T.SkinnedMesh;if(!m.isSkinnedMesh||!m.visible)return;const mn=((m.material as T.Material).name||'').toLowerCase();
  if(/^(hair|eyebrows|eyelash)/i.test(m.name)||/scifi-armor|boots|eyelash|eyebrow|teeth|tongue|eye/.test(mn))return;meshes.push(m);});
 if(!meshes.length)return null;
 model.updateMatrixWorld(true);
 const world=new Map<string,T.Vector3[]>(),inv=new Map<string,T.Matrix4>();
 for(const bone of meshes[0].skeleton.bones){world.set(bone.name,[]);inv.set(bone.name,bone.matrixWorld.clone().invert());}
 const v=new T.Vector3();
 for(const b of meshes){b.skeleton.update();
  const pos=b.geometry.attributes.position,si=b.geometry.attributes.skinIndex,sw=b.geometry.attributes.skinWeight;
  for(let i=0;i<pos.count;i++){
   v.fromBufferAttribute(pos,i);b.applyBoneTransform(i,v);v.applyMatrix4(b.matrixWorld);
   let best=0,bw=-1;for(let k=0;k<4;k++){const w=sw.getComponent(i,k);if(w>bw){bw=w;best=si.getComponent(i,k);}}
   world.get(b.skeleton.bones[best].name)?.push(v.clone());
  }}
 const front=new T.Vector3(0,0,1).applyQuaternion(model.getWorldQuaternion(new T.Quaternion()));
 S={world,inv,front};samples.set(key,S);return S;
}
const hash=(x:number,y:number,z:number)=>{const h=Math.sin(x*127.1+y*311.7+z*74.7)*43758.5453;return h-Math.floor(h);};
function vn(x:number,y:number,z:number){const ix=Math.floor(x),iy=Math.floor(y),iz=Math.floor(z),fx=x-ix,fy=y-iy,fz=z-iz;const u=fx*fx*(3-2*fx),v=fy*fy*(3-2*fy),w=fz*fz*(3-2*fz);const L=(a:number,b:number,t:number)=>a+(b-a)*t;
 return L(L(L(hash(ix,iy,iz),hash(ix+1,iy,iz),u),L(hash(ix,iy+1,iz),hash(ix+1,iy+1,iz),u),v),L(L(hash(ix,iy,iz+1),hash(ix+1,iy,iz+1),u),L(hash(ix,iy+1,iz+1),hash(ix+1,iy+1,iz+1),u),v),w);}

function wrapGeo(S:Samples,w:Wrap,sexKey:string){
 const key=sexKey+JSON.stringify(w);let g=geos.get(key);if(g)return g;
 const inv=S.inv.get(w.bone);if(!inv)return null;
 const pts=[w.bone,...(w.also??[])].flatMap(b=>S.world.get(b)??[]).map(p=>p.clone().applyMatrix4(inv));
 if(pts.length<12)return null;
 // bones may be scaled (cm rigs): metres -> bone-local units
 const U=new T.Vector3().setFromMatrixScale(inv).x;
 // frame around the bone: Y along it, F toward the character's front, R to its side
 const Y=new T.Vector3(0,1,0),F=S.front.clone().transformDirection(inv);F.addScaledVector(Y,-F.dot(Y));if(F.lengthSq()<1e-6)F.set(0,0,1);F.normalize();const R=new T.Vector3().crossVectors(Y,F).normalize();
 let ymin=1e9,ymax=-1e9;for(const p of pts){ymin=Math.min(ymin,p.y);ymax=Math.max(ymax,p.y);}
 const t0=w.t0??0,t1=w.t1??1,y0=ymin+(ymax-ymin)*t0,y1=ymin+(ymax-ymin)*t1;
 const RW=w.rows??8,CW=w.cols??18,a0=(w.a0??-180)*Math.PI/180,a1=(w.a1??180)*Math.PI/180,full=a1-a0>=Math.PI*2-1e-3;
 // per row: centre of the slice, then the outermost radius per angle bin
 const band=(y1-y0)/Math.max(1,RW-1)*.75+.01*U;
 const cen:T.Vector2[]=[],rad:number[][]=[];
 for(let i=0;i<RW;i++){const y=y0+(y1-y0)*i/(RW-1);let cx=0,cz=0,n=0;
  for(const p of pts)if(Math.abs(p.y-y)<band){cx+=p.dot(R);cz+=p.dot(F);n++;}
  cen.push(n?new T.Vector2(cx/n,cz/n):new T.Vector2(i?cen[i-1].x:0,i?cen[i-1].y:0));
  const row=new Array(CW).fill(-1);
  for(const p of pts)if(Math.abs(p.y-y)<band){const x=p.dot(R)-cen[i].x,z=p.dot(F)-cen[i].y;let a=Math.atan2(x,z);while(a<a0)a+=Math.PI*2;while(a>=a0+Math.PI*2)a-=Math.PI*2;
   const j=full?Math.floor((a-a0)/(Math.PI*2)*CW)%CW:Math.round((a-a0)/(a1-a0)*(CW-1));if(j<0||j>=CW)continue;row[j]=Math.max(row[j],Math.hypot(x,z));}
  rad.push(row);}
 // fill holes from neighbours, then smooth
 for(let it=0;it<CW;it++){let holes=0;for(let i=0;i<RW;i++)for(let j=0;j<CW;j++)if(rad[i][j]<0){holes++;let s=0,n=0;for(const [di,dj] of[[0,1],[0,-1],[1,0],[-1,0]]){const ii=i+di;let jj=j+dj;if(full)jj=(jj+CW)%CW;if(ii<0||ii>=RW||jj<0||jj>=CW)continue;if(rad[ii][jj]>=0){s+=rad[ii][jj];n++;}}if(n)rad[i][j]=s/n;}if(!holes)break;}
 for(let i=0;i<RW;i++)for(let j=0;j<CW;j++)if(rad[i][j]<0)rad[i][j]=.08*U;
 for(let k=0;k<2;k++){const nr=rad.map(r=>r.slice());for(let i=0;i<RW;i++)for(let j=0;j<CW;j++){let s=rad[i][j]*2,n=2;for(const [di,dj] of[[0,1],[0,-1],[1,0],[-1,0]]){const ii=i+di;let jj=j+dj;if(full)jj=(jj+CW)%CW;if(ii<0||ii>=RW||jj<0||jj>=CW)continue;s+=rad[ii][jj];n++;}nr[i][j]=s/n;}for(let i=0;i<RW;i++)rad[i]=nr[i];}
 const pad=(w.pad??.012)*U,th=(w.th??.012)*U,flare=(w.flare??0)*U,base=new T.Color(w.color),trim=new T.Color(w.trim??w.color);
 const P:number[]=[],C:number[]=[],I:number[]=[];
 const cols=full?CW+1:CW;
 const pt=(i:number,j:number,off:number)=>{const jj=full?j%CW:j,ang=full?a0+(j/CW)*Math.PI*2:a0+(a1-a0)*j/(CW-1),t=i/(RW-1),y=y0+(y1-y0)*t;
  const r=rad[i][jj]+pad+flare*t*t+off;return new T.Vector3().addScaledVector(R,cen[i].x+Math.sin(ang)*r).addScaledVector(F,cen[i].y+Math.cos(ang)*r).addScaledVector(Y,y);};
 const colOf=(i:number,j:number,p:T.Vector3)=>{const edge=w.trim&&(i===0||i===RW-1||(!full&&(j===0||j===cols-1)));let c=edge?trim:base;
  if(w.finish==='camo'){const q=p.clone().divideScalar(U),n=vn(q.x*9+3,q.y*9,q.z*9),m=vn(q.x*4,q.y*4+7,q.z*4);c=n>.55?new T.Color('#5a5a32'):m>.5?new T.Color('#7a6a44'):new T.Color('#3a4a2c');}
  return c;};
 // outer skin, inner skin (offset in by the thickness) and the lip between them
 for(const layer of[0,1])for(let i=0;i<RW;i++)for(let j=0;j<cols;j++){const p=pt(i,j,layer?-th:0);P.push(p.x,p.y,p.z);const c=colOf(i,j,p).clone().multiplyScalar(layer?.6:1);C.push(c.r,c.g,c.b);}
 const id=(l:number,i:number,j:number)=>l*RW*cols+i*cols+j;
 for(let i=0;i<RW-1;i++)for(let j=0;j<cols-1;j++){I.push(id(0,i,j),id(0,i,j+1),id(0,i+1,j),id(0,i,j+1),id(0,i+1,j+1),id(0,i+1,j));I.push(id(1,i,j),id(1,i+1,j),id(1,i,j+1),id(1,i,j+1),id(1,i+1,j),id(1,i+1,j+1));}
 const lip=(a:[number,number],b:[number,number])=>{I.push(id(0,...a),id(1,...a),id(0,...b),id(0,...b),id(1,...a),id(1,...b));};
 for(let j=0;j<cols-1;j++){lip([0,j+1],[0,j]);lip([RW-1,j],[RW-1,j+1]);}
 if(!full)for(let i=0;i<RW-1;i++){lip([i,0],[i+1,0]);lip([i+1,cols-1],[i,cols-1]);}
 g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(P,3));g.setAttribute('color',new T.Float32BufferAttribute(C,3));g.setIndex(I);g.computeVertexNormals();
 geos.set(key,g);return g;
}
const MAT:Record<Finish,T.MeshStandardMaterial>={
 plate:new T.MeshStandardMaterial({vertexColors:true,roughness:.38,metalness:.45,side:T.DoubleSide,envMapIntensity:.9}),
 cloth:new T.MeshStandardMaterial({vertexColors:true,roughness:.92,metalness:0,side:T.DoubleSide}),
 leather:new T.MeshStandardMaterial({vertexColors:true,roughness:.62,metalness:.05,side:T.DoubleSide}),
 camo:new T.MeshStandardMaterial({vertexColors:true,roughness:.7,metalness:.1,side:T.DoubleSide}),
};
// woodland camouflage drawn per pixel (2D Domador armour): three greens and browns in soft blotches
MAT.camo.onBeforeCompile=sh=>{
 sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vCP;').replace('#include <begin_vertex>','#include <begin_vertex>\nvCP=(modelMatrix*vec4(position,1.)).xyz-vec3(modelMatrix[3].xyz);');
 sh.fragmentShader=sh.fragmentShader.replace('#include <common>',`#include <common>
  varying vec3 vCP;float ch(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}
  float cn(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(mix(ch(i),ch(i+vec3(1,0,0)),f.x),mix(ch(i+vec3(0,1,0)),ch(i+vec3(1,1,0)),f.x),f.y),mix(mix(ch(i+vec3(0,0,1)),ch(i+vec3(1,0,1)),f.x),mix(ch(i+vec3(0,1,1)),ch(i+vec3(1,1,1)),f.x),f.y),f.z);}`)
 .replace('#include <color_fragment>',`#include <color_fragment>
  {vec3 q=vCP*7.;float a=cn(q)*.65+cn(q*2.3)*.35,b=cn(q*1.3+5.)*.65+cn(q*2.7+3.)*.35;
   vec3 c=vec3(.06,.09,.04);c=mix(c,vec3(.17,.12,.06),smoothstep(.5,.56,a));c=mix(c,vec3(.11,.12,.05),smoothstep(.56,.62,b));c=mix(c,vec3(.025,.03,.018),smoothstep(.66,.7,a*b*1.6));
   diffuseColor.rgb=c*mix(.7,1.,vColor.r);}`);
};MAT.camo.customProgramCacheKey=()=>'camo';
// build every piece of a kit on the bones of this model; returns the meshes so the caller can remove them later
export function dress(model:T.Object3D,sexKey:string,kit:Wrap[]){
 const S=sample(model,sexKey);if(!S)return[];const out:T.Mesh[]=[];
 for(const w of kit){const g=wrapGeo(S,w,sexKey),bone=model.getObjectByName(w.bone);if(!g||!bone)continue;
  const m=new T.Mesh(g,MAT[w.finish]);m.castShadow=true;m.frustumCulled=false;bone.add(m);out.push(m);}
 return out;
}

// ---------- kits after the 2D wardrobe ----------
const LR=(f:(s:'l'|'r')=>Wrap[])=>[...f('l'),...f('r')];
// field boots: shaft over the ankle and a shell over the foot
const boots=(c:string):Wrap[]=>LR(s=>[{bone:'calf_'+s,t0:.8,t1:1,finish:'leather',color:c,trim:'#4a4038',pad:.016,th:.012,rows:3,cols:16},
 {bone:'foot_'+s,also:['ball_'+s],finish:'leather',color:c,pad:.012,th:.012,rows:5,cols:16}]);
// shoulder cap, bracer, knee and shin: the shared armour silhouette of the 2D basic tier
function armour(plate:string,trim:string,level:'basic'|'reinforced',finish:Finish='plate'):Wrap[]{
 const k:Wrap[]=[
  {bone:'spine_03',also:['clavicle_l','clavicle_r'],t0:.08,t1:.95,a0:-78,a1:78,finish,color:plate,trim,pad:.03,th:.02,rows:7,cols:16},
  ...LR(s=>[{bone:'upperarm_'+s,t0:0,t1:.34,finish,color:plate,trim,pad:.035,flare:.05,th:.018,rows:5,cols:16},
   {bone:'lowerarm_'+s,t0:.4,t1:.97,finish,color:plate,trim,pad:.018,th:.014,rows:5,cols:14},
   {bone:'calf_'+s,t0:0,t1:.16,a0:-80,a1:80,finish,color:plate,trim,pad:.03,th:.018,rows:4,cols:10},
   {bone:'calf_'+s,t0:.22,t1:.82,a0:-70,a1:70,finish,color:plate,trim,pad:.022,th:.014,rows:6,cols:10}]),
  {bone:'pelvis',t0:.55,t1:.8,finish:'leather',color:'#3a2c20',trim:'#8a6030',pad:.022,th:.012,rows:3,cols:20},
  ...boots('#2a2622'),
 ];
 if(level==='reinforced')k.push(
  {bone:'spine_03',t0:.08,t1:.95,a0:110,a1:250,finish,color:plate,trim,pad:.03,th:.02,rows:6,cols:12},
  {bone:'spine_02',a0:-70,a1:70,finish,color:plate,trim,pad:.03,th:.016,rows:4,cols:12},
  ...LR(s=>[{bone:'thigh_'+s,t0:.15,t1:.72,a0:-58,a1:58,finish,color:plate,trim,pad:.018,th:.016,rows:6,cols:10},
   {bone:'upperarm_'+s,t0:.38,t1:.9,finish,color:plate,trim,pad:.02,th:.014,rows:5,cols:14}]));
 return k;
}
export function classKit(weapon:string,outfit:string):Wrap[]{
 if(outfit!=='basic'&&outfit!=='reinforced')return[];
 const lv=outfit as 'basic'|'reinforced';
 if(weapon==='saber')return armour('#cfccc2','#c8902a',lv);
 if(weapon==='gauntlet')return armour('#ebe5d6','#d0a040',lv);
 if(weapon==='conductor')return armour('#ffffff','#ffffff',lv,'camo').map(w=>w.finish==='camo'?{...w,trim:undefined,pad:(w.pad??.02)+.012,flare:w.bone.startsWith('upperarm')?.02:w.flare}:w);
 // hunter: leather harness over the suit, dark pads; the reinforced tier adds a dark chest plate and thigh guards
 const k:Wrap[]=[
  {bone:'spine_03',t0:.05,t1:1,a0:12,a1:30,finish:'leather',color:'#b8742e',pad:.018,th:.01,rows:6,cols:3},
  {bone:'spine_03',t0:.05,t1:1,a0:-30,a1:-12,finish:'leather',color:'#b8742e',pad:.018,th:.01,rows:6,cols:3},
  {bone:'spine_02',a0:-80,a1:80,t0:.3,t1:.7,finish:'leather',color:'#8a5424',pad:.02,th:.01,rows:2,cols:12},
  {bone:'pelvis',t0:.55,t1:.8,finish:'leather',color:'#5a3a20',trim:'#c07a2a',pad:.022,th:.012,rows:3,cols:20},
  ...LR(s=>[{bone:'upperarm_'+s,t0:0,t1:.3,a0:-100,a1:100,finish:'plate',color:'#2a2e36',trim:'#c07a2a',pad:.03,flare:.03,th:.016,rows:4,cols:12},
   {bone:'calf_'+s,t0:0,t1:.18,a0:-80,a1:80,finish:'plate',color:'#24272e',pad:.03,th:.02,rows:4,cols:10},
   {bone:'lowerarm_'+s,t0:.55,t1:.97,finish:'leather',color:'#3a2a1e',pad:.016,th:.012,rows:4,cols:12}]),
  ...boots('#1e1e22'),
 ];
 if(lv==='reinforced')k.push({bone:'spine_03',also:['clavicle_l','clavicle_r'],t0:.1,t1:.92,a0:-70,a1:70,finish:'plate',color:'#2c3038',trim:'#c07a2a',pad:.035,th:.02,rows:7,cols:14},
  ...LR(s=>[{bone:'thigh_'+s,t0:.15,t1:.7,a0:-55,a1:55,finish:'plate',color:'#2a2e36',pad:.018,th:.016,rows:5,cols:10} as Wrap]));
 return k;
}
// clothes of the people of the base (2D portraits): Lia's lab coat, Nara's field jacket and scarf, Ivo's leather apron
export function garbKit(garb:string):Wrap[]{
 if(garb==='coat'){const c='#c4c0b6';return[
  {bone:'spine_03',also:['clavicle_l','clavicle_r'],finish:'cloth',color:c,pad:.02,th:.008,rows:7,cols:22},
  {bone:'spine_02',finish:'cloth',color:c,pad:.022,th:.008,rows:4,cols:22},{bone:'spine_01',finish:'cloth',color:c,pad:.024,th:.008,rows:3,cols:22},
  {bone:'pelvis',t0:.2,finish:'cloth',color:c,pad:.03,th:.008,rows:4,cols:22},
  ...LR(s=>[{bone:'upperarm_'+s,finish:'cloth',color:c,pad:.016,th:.008,rows:5,cols:14},{bone:'lowerarm_'+s,t1:.7,finish:'cloth',color:c,pad:.014,th:.008,rows:4,cols:14},
   {bone:'thigh_'+s,t0:0,t1:.62,a0:-120,a1:200,finish:'cloth',color:c,pad:.03,flare:.04,th:.008,rows:5,cols:14}]),
  {bone:'upperarm_l',t0:.25,t1:.42,finish:'cloth',color:'#d8682a',pad:.024,th:.008,rows:2,cols:14}];}
 if(garb==='jacket'){const c='#a08a62';return[
  {bone:'spine_03',also:['clavicle_l','clavicle_r'],finish:'cloth',color:c,pad:.022,th:.01,rows:7,cols:22},
  {bone:'spine_02',finish:'cloth',color:c,pad:.024,th:.01,rows:4,cols:22},{bone:'spine_01',t1:.6,finish:'cloth',color:c,pad:.026,th:.01,rows:3,cols:22},
  ...LR(s=>[{bone:'upperarm_'+s,finish:'cloth',color:c,pad:.018,th:.01,rows:5,cols:14},{bone:'lowerarm_'+s,t1:.75,finish:'cloth',color:c,pad:.016,th:.01,rows:4,cols:14}]),
  {bone:'neck_01',finish:'cloth',color:'#d8682a',pad:.03,flare:.02,th:.014,rows:3,cols:16},
  {bone:'pelvis',t0:.55,t1:.8,finish:'leather',color:'#4a3424',pad:.026,th:.012,rows:3,cols:20}];}
 if(garb==='apron'){const c='#5a3c26';return[
  {bone:'spine_03',t0:0,t1:.85,a0:-70,a1:70,finish:'leather',color:c,pad:.028,th:.01,rows:6,cols:12},
  {bone:'spine_02',a0:-75,a1:75,finish:'leather',color:c,pad:.03,th:.01,rows:4,cols:12},{bone:'spine_01',a0:-80,a1:80,finish:'leather',color:c,pad:.032,th:.01,rows:3,cols:12},
  {bone:'pelvis',a0:-85,a1:85,finish:'leather',color:c,pad:.035,th:.01,rows:4,cols:12},
  ...LR(s=>[{bone:'thigh_'+s,t0:0,t1:.75,a0:-50,a1:50,finish:'leather',color:c,pad:.04,flare:.02,th:.01,rows:5,cols:8},{bone:'lowerarm_'+s,t0:.5,t1:.97,finish:'leather',color:'#3a2a1e',pad:.016,th:.01,rows:3,cols:12}])];}
 return[];
}
