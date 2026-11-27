import * as T from 'three';
import {RARITY_COLORS} from '../config/equipment';

// Garments and armour fitted to the body, after the 2D wardrobe. Each piece reads the body vertices driven by one
// bone, measures the body's radius per slice and angle around that bone, and builds a thick shell slightly outside it.
// The shell is parented to the bone, so it moves with it without skinning. Shapes are cached per body (sex).

export type Finish='plate'|'cloth'|'leather'|'camo'|'steel';
// emit: a lit strip in its own colour (glow lines of the better sets), drawn with an emissive material
export interface Wrap{bone:string;also?:string[];t0?:number;t1?:number;a0?:number;a1?:number;pad?:number;flare?:number;th?:number;rows?:number;cols?:number;
 finish:Finish;color:string;trim?:string;key?:string;emit?:number;up?:boolean}
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
 // up: turn the window so its centre faces the body's up direction (rest pose), whatever the side of the limb
 const upA=w.up?(()=>{const u=new T.Vector3(0,1,0).transformDirection(inv);return Math.atan2(u.dot(R),u.dot(F));})():0;
 const RW=w.rows??8,CW=w.cols??18,a0=(w.a0??-180)*Math.PI/180+upA,a1=(w.a1??180)*Math.PI/180+upA,full=a1-a0>=Math.PI*2-1e-3;
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
 // Rows and columns of the mesh, as fractions of the piece. With a trim, a narrow band runs along each edge with a hard
 // colour change (a doubled row at the same place) and stands slightly proud of the plate, like a rolled edge.
 type Line={u:number;edge:boolean};
 const lines=(n:number,open:boolean):Line[]=>{const L:Line[]=[];const e=Math.min(.3,.55/Math.max(1,n-1));
  if(!w.trim||!open){for(let k=0;k<n;k++)L.push({u:k/(n-1),edge:false});return L;}
  L.push({u:0,edge:true},{u:e,edge:true},{u:e,edge:false});for(let k=1;k<n-1;k++){const u=k/(n-1);if(u>e&&u<1-e)L.push({u,edge:false});}L.push({u:1-e,edge:false},{u:1-e,edge:true},{u:1,edge:true});return L;};
 const RL=lines(RW,true),CL=full?Array.from({length:CW+1},(_,k)=>({u:k/CW,edge:false})):lines(CW,true);
 const NR=RL.length,NC=CL.length;
 const radAt=(t:number,u:number)=>{const fi=t*(RW-1),i0=Math.min(RW-2,Math.floor(fi)),fr=fi-i0,i1=i0+1;
  let j0:number,j1:number,fc:number;if(full){const fj=u*CW;j0=Math.floor(fj)%CW;j1=(j0+1)%CW;fc=fj-Math.floor(fj);}else{const fj=u*(CW-1);j0=Math.min(CW-2,Math.floor(fj));j1=j0+1;fc=fj-j0;}
  const r0=rad[i0][j0]*(1-fc)+rad[i0][j1]*fc,r1=rad[i1][j0]*(1-fc)+rad[i1][j1]*fc;return{r:r0*(1-fr)+r1*fr,cx:cen[i0].x*(1-fr)+cen[i1].x*fr,cz:cen[i0].y*(1-fr)+cen[i1].y*fr};};
 const pt=(i:number,j:number,off:number)=>{const t=RL[i].u,u=CL[j].u,ang=full?a0+u*Math.PI*2:a0+(a1-a0)*u,y=y0+(y1-y0)*t;const q=radAt(t,u);
  const r=q.r+pad+flare*t*t+off;return new T.Vector3().addScaledVector(R,q.cx+Math.sin(ang)*r).addScaledVector(F,q.cz+Math.cos(ang)*r).addScaledVector(Y,y);};
 const isEdge=(i:number,j:number)=>!!w.trim&&(RL[i].edge||CL[j].edge);
 const colOf=(i:number,j:number,p:T.Vector3)=>{let c=isEdge(i,j)?trim:base;
  if(w.finish==='camo'){const q=p.clone().divideScalar(U),n=vn(q.x*9+3,q.y*9,q.z*9),m=vn(q.x*4,q.y*4+7,q.z*4);c=n>.55?new T.Color('#5a5a32'):m>.5?new T.Color('#7a6a44'):new T.Color('#3a4a2c');}
  return c;};
 // outer skin (edges raised a little), inner skin (offset in by the thickness) and the lip between them
 for(const layer of[0,1])for(let i=0;i<NR;i++)for(let j=0;j<NC;j++){const p=pt(i,j,layer?-th:isEdge(i,j)?th*.45:0);P.push(p.x,p.y,p.z);const c=colOf(i,j,p).clone().multiplyScalar(layer?.6:1);C.push(c.r,c.g,c.b);}
 const id=(l:number,i:number,j:number)=>l*NR*NC+i*NC+j;
 for(let i=0;i<NR-1;i++)for(let j=0;j<NC-1;j++){I.push(id(0,i,j),id(0,i,j+1),id(0,i+1,j),id(0,i,j+1),id(0,i+1,j+1),id(0,i+1,j));I.push(id(1,i,j),id(1,i+1,j),id(1,i,j+1),id(1,i,j+1),id(1,i+1,j),id(1,i+1,j+1));}
 const lip=(a:[number,number],b:[number,number])=>{I.push(id(0,...a),id(1,...a),id(0,...b),id(0,...b),id(1,...a),id(1,...b));};
 for(let j=0;j<NC-1;j++){lip([0,j+1],[0,j]);lip([NR-1,j],[NR-1,j+1]);}
 if(!full)for(let i=0;i<NR-1;i++){lip([i,0],[i+1,0]);lip([i+1,NC-1],[i,NC-1]);}
 g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(P,3));g.setAttribute('color',new T.Float32BufferAttribute(C,3));g.setIndex(I);g.computeVertexNormals();
 geos.set(key,g);return g;
}
const MAT:Record<Finish,T.MeshStandardMaterial>={
 steel:new T.MeshStandardMaterial({vertexColors:true,roughness:.2,metalness:.8,side:T.DoubleSide,envMapIntensity:1.5}),
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
const GLOW=new Map<string,T.MeshStandardMaterial>();
const glowMat=(c:string,e:number)=>{const k=c+e;let m=GLOW.get(k);if(!m){m=new T.MeshStandardMaterial({color:c,emissive:c,emissiveIntensity:e,roughness:.3,side:T.DoubleSide});GLOW.set(k,m);}return m;};
// build every piece of a kit on the bones of this model; returns the meshes so the caller can remove them later
export function dress(model:T.Object3D,sexKey:string,kit:Wrap[]){
 const S=sample(model,sexKey);if(!S)return[];const out:T.Mesh[]=[];
 for(const w of kit){const g=wrapGeo(S,w,sexKey),bone=model.getObjectByName(w.bone);if(!g||!bone)continue;
  const m=new T.Mesh(g,w.emit?glowMat(w.color,w.emit):MAT[w.finish]);m.castShadow=true;m.frustumCulled=false;bone.add(m);out.push(m);}
 return out;
}

// ---------- kits after the 2D wardrobe ----------
const LR=(f:(s:'l'|'r')=>Wrap[])=>[...f('l'),...f('r')];
// field boots: shaft over the ankle and a shell over the foot
const boots=(c:string,trim='#4a4038'):Wrap[]=>LR(s=>[{bone:'calf_'+s,t0:.8,t1:1,finish:'leather',color:c,trim,pad:.016,th:.012,rows:3,cols:16},
 {bone:'foot_'+s,also:['ball_'+s],finish:'leather',color:c,pad:.012,th:.012,rows:5,cols:16}]);
// The armour is split in the parts of the 2D equipment look (config/appearance: torso, legs, boots, gloves; the
// helmet is rigid gear in character.ts). Each part is worn at one level: basic (tier 1 pieces) or reinforced
// (tier 2 and 3). Equipped pieces of tier 2 and 3 carry the trim of their rarity (config/equipment RARITY_COLORS).
export type Part='torso'|'legs'|'boots'|'gloves';
export const PARTS:Part[]=['torso','legs','boots','gloves'];
export type Level='basic'|'reinforced';
/** what is worn per part; parts left out follow the outfit picked in the creator */
export type Armour=Partial<Record<Part|'helmet'|'accessory',1|2|3>>;
export const TIER_TRIM:Record<number,string|undefined>={2:RARITY_COLORS.aprimorado,3:RARITY_COLORS.raro};
type Spec=Partial<Record<Part,{level:Level;trim?:string}>>;
// shoulder cap, bracer, knee and shin: the shared armour silhouette of the 2D basic tier
function armour(plate:string,trim:string,spec:Spec,finish:Finish='plate'):Wrap[]{
 const k:Wrap[]=[];
 const t=(p:Part)=>spec[p]?.trim??trim,on=(p:Part)=>!!spec[p],rf=(p:Part)=>spec[p]?.level==='reinforced';
 if(on('torso')){const tr=t('torso');k.push(
  {bone:'spine_03',also:['clavicle_l','clavicle_r'],t0:.08,t1:.95,a0:-78,a1:78,finish,color:plate,trim:tr,pad:.03,th:.02,rows:7,cols:16},
  ...LR(s=>[{bone:'upperarm_'+s,t0:0,t1:.34,finish,color:plate,trim:tr,pad:.035,flare:.05,th:.018,rows:5,cols:16}]),
  {bone:'pelvis',t0:.55,t1:.8,finish:'leather',color:'#3a2c20',trim:'#8a6030',pad:.022,th:.012,rows:3,cols:20});
  if(rf('torso'))k.push({bone:'spine_03',t0:.08,t1:.95,a0:110,a1:250,finish,color:plate,trim:tr,pad:.03,th:.02,rows:6,cols:12},
   {bone:'spine_02',a0:-70,a1:70,finish,color:plate,trim:tr,pad:.03,th:.016,rows:4,cols:12},
   ...LR(s=>[{bone:'upperarm_'+s,t0:.38,t1:.9,finish,color:plate,trim:tr,pad:.02,th:.014,rows:5,cols:14}]));}
 if(on('gloves'))k.push(...LR(s=>[{bone:'lowerarm_'+s,t0:.4,t1:.97,finish,color:plate,trim:t('gloves'),pad:.018,th:.014,rows:5,cols:14}]));
 if(on('legs')){const tr=t('legs');k.push(...LR(s=>[{bone:'calf_'+s,t0:0,t1:.16,a0:-80,a1:80,finish,color:plate,trim:tr,pad:.03,th:.018,rows:4,cols:10},
   {bone:'calf_'+s,t0:.22,t1:.82,a0:-70,a1:70,finish,color:plate,trim:tr,pad:.022,th:.014,rows:6,cols:10}]));
  if(rf('legs'))k.push(...LR(s=>[{bone:'thigh_'+s,t0:.15,t1:.72,a0:-58,a1:58,finish,color:plate,trim:tr,pad:.018,th:.016,rows:6,cols:10}]));}
 if(on('boots'))k.push(...boots('#2a2622',spec.boots?.trim));
 return k;
}
// the parts worn: the creator outfit gives every part its level, equipped pieces replace their own part
function specOf(outfit:string,worn:Armour={}):Spec{
 const sp:Spec={};const lv=outfit==='basic'||outfit==='reinforced'?outfit as Level:null;
 for(const p of PARTS)if(!worn[p]&&lv)sp[p]={level:lv};
 return sp;
}
export function classKit(weapon:string,outfit:string,worn:Armour={}):Wrap[]{
 // pieces shared by both sides (the waist under a pair of legs) are listed once
 const seen=new Set<string>();return[...outfitKit(weapon,outfit,worn),...setKit(weapon,worn)].filter(w=>{const k=JSON.stringify(w);if(seen.has(k))return false;seen.add(k);return true;});
}
function outfitKit(weapon:string,outfit:string,worn:Armour):Wrap[]{
 const sp=specOf(outfit,worn);
 if(weapon==='saber')return armour('#cfccc2','#c8902a',sp);
 if(weapon==='gauntlet')return armour('#ebe5d6','#d0a040',sp);
 if(weapon==='conductor')return armour('#ffffff','#ffffff',sp,'camo').map(w=>w.finish==='camo'?{...w,trim:undefined,pad:(w.pad??.02)+.012,flare:w.bone.startsWith('upperarm')?.02:w.flare}:w);
 // hunter: leather harness over the suit, dark pads; the reinforced torso adds a dark chest plate, reinforced legs thigh guards
 const k:Wrap[]=[],tr=(p:Part)=>sp[p]?.trim??'#c07a2a';
 if(sp.torso)k.push(
  {bone:'spine_03',t0:.05,t1:1,a0:12,a1:30,finish:'leather',color:'#b8742e',pad:.018,th:.01,rows:6,cols:3},
  {bone:'spine_03',t0:.05,t1:1,a0:-30,a1:-12,finish:'leather',color:'#b8742e',pad:.018,th:.01,rows:6,cols:3},
  {bone:'spine_02',a0:-80,a1:80,t0:.3,t1:.7,finish:'leather',color:'#8a5424',pad:.02,th:.01,rows:2,cols:12},
  {bone:'pelvis',t0:.55,t1:.8,finish:'leather',color:'#5a3a20',trim:'#c07a2a',pad:.022,th:.012,rows:3,cols:20},
  ...LR(s=>[{bone:'upperarm_'+s,t0:0,t1:.3,a0:-100,a1:100,finish:'plate',color:'#2a2e36',trim:tr('torso'),pad:.03,flare:.03,th:.016,rows:4,cols:12} as Wrap]));
 if(sp.torso?.level==='reinforced')k.push({bone:'spine_03',also:['clavicle_l','clavicle_r'],t0:.1,t1:.92,a0:-70,a1:70,finish:'plate',color:'#2c3038',trim:tr('torso'),pad:.035,th:.02,rows:7,cols:14});
 if(sp.gloves)k.push(...LR(s=>[{bone:'lowerarm_'+s,t0:.55,t1:.97,finish:'leather',color:'#3a2a1e',trim:sp.gloves?.trim,pad:.016,th:.012,rows:4,cols:12} as Wrap]));
 if(sp.legs){k.push(...LR(s=>[{bone:'calf_'+s,t0:0,t1:.18,a0:-80,a1:80,finish:'plate',color:'#24272e',trim:sp.legs?.trim,pad:.03,th:.02,rows:4,cols:10} as Wrap]));
  if(sp.legs.level==='reinforced')k.push(...LR(s=>[{bone:'thigh_'+s,t0:.15,t1:.7,a0:-55,a1:55,finish:'plate',color:'#2a2e36',trim:sp.legs?.trim,pad:.018,th:.016,rows:5,cols:10} as Wrap]));}
 if(sp.boots)k.push(...boots('#1e1e22',sp.boots.trim));
 return k;
}
// ---------- equipment sets (equipped pieces, 2D catalogue tiers) ----------
// Each tier is its own outfit, not the next one with parts missing, and each covers the back as well as the front:
//  1 Expedição  (forest): field vest, collar, leather pads, gaiters and belt, in the class field colour
//  2 Âmbar      (sirocco): segmented sand carapace over dark chitin, double pauldrons, lit amber lines
//  3 Boreal     (glacier): polished frost steel over deep blue, layered pauldrons, gorget, tassets, violet lines
export const SET_LOOK={
 1:{name:'Expedição',plate:'#8a7c5a',under:'#4a3626',glow:'#cad4ca'},
 2:{name:'Âmbar',plate:'#b47a36',under:'#3e2614',glow:'#ffb347'},
 3:{name:'Boreal',plate:'#dbe4ee',under:'#26304c',glow:'#b090ff'},
} as const;
// field colour of the expedition vest per class (2D work clothes): khaki, brown, slate; the Domador wears camouflage
const FIELD:Record<string,string>={saber:'#8a7c5a',carbine:'#6e5438',gauntlet:'#5e6c80',conductor:'#5a5a40'};
// a run of overlapping bands along a bone: segmented plates (each band a bit wider than the one under it)
function bands(w:Omit<Wrap,'t0'|'t1'>,t0:number,t1:number,n:number,grow=.004):Wrap[]{
 const step=(t1-t0)/n;return Array.from({length:n},(_,i)=>({...w,t0:t0+step*i,t1:Math.min(1,t0+step*(i+1)+step*.18),pad:(w.pad??.02)+grow*(n-1-i)}));
}
function setKit(weapon:string,worn:Armour):Wrap[]{
 const k:Wrap[]=[];
 const camo=weapon==='conductor',field=FIELD[weapon]??FIELD.saber,f1:Finish=camo?'camo':'cloth',dk='#3a2c20';
 // ----- tier 1: expedition -----
 const t1=(p:Part)=>worn[p]===1;
 if(t1('torso'))k.push(
  {bone:'spine_03',also:['clavicle_l','clavicle_r'],t0:.04,t1:.98,finish:f1,color:field,trim:camo?undefined:dk,pad:.024,th:.012,rows:8,cols:26},
  {bone:'spine_02',finish:f1,color:field,pad:.026,th:.012,rows:4,cols:24},
  {bone:'spine_01',t0:.25,finish:f1,color:field,pad:.028,th:.012,rows:3,cols:24},
  {bone:'neck_01',t0:0,t1:.4,finish:'cloth',color:dk,pad:.022,flare:.018,th:.012,rows:3,cols:18},
  // padded shoulders, short sleeves and the field belt
  ...LR(s=>[{bone:'upperarm_'+s,up:true,a0:-115,a1:115,t0:0,t1:.28,finish:'leather',color:'#5a4230',trim:dk,pad:.03,flare:.014,th:.014,rows:4,cols:16} as Wrap,
   {bone:'upperarm_'+s,t0:.3,t1:.62,finish:f1,color:field,pad:.014,th:.008,rows:3,cols:14} as Wrap]),
  {bone:'pelvis',t0:.5,t1:.82,finish:'leather',color:'#3a2a1c',trim:'#9a7040',pad:.026,th:.014,rows:3,cols:24});
 if(t1('gloves'))k.push(...LR(s=>[{bone:'lowerarm_'+s,t0:.58,t1:.98,finish:'leather',color:'#4a3424',trim:'#2a1e14',pad:.018,flare:.012,th:.012,rows:4,cols:16} as Wrap]));
 if(t1('legs'))k.push(...LR(s=>[
  // field trousers with a strap over the thigh
  {bone:'thigh_'+s,t0:.04,t1:.96,finish:f1,color:camo?field:'#4e4a38',pad:.012,th:.008,rows:6,cols:18} as Wrap,
  {bone:'thigh_'+s,t0:.42,t1:.5,finish:'leather',color:'#3a2a1c',pad:.022,th:.01,rows:2,cols:16} as Wrap,
  {bone:'pelvis',t0:0,t1:.55,finish:f1,color:camo?field:'#4e4a38',pad:.014,th:.008,rows:4,cols:20} as Wrap,
  {bone:'calf_'+s,t0:0,t1:.17,a0:-80,a1:80,finish:'leather',color:'#4a3626',trim:'#2a1e14',pad:.03,th:.018,rows:4,cols:12} as Wrap,
  {bone:'calf_'+s,t0:.3,t1:.8,finish:f1,color:field,trim:camo?undefined:dk,pad:.016,th:.01,rows:5,cols:16} as Wrap]));
 if(t1('boots'))k.push(...boots('#4a3626','#2a1e14'));
 // ----- tier 2: amber carapace -----
 const t2=(p:Part)=>worn[p]===2,A=SET_LOOK[2];
 if(t2('torso'))k.push(
  {bone:'spine_03',also:['clavicle_l','clavicle_r'],t0:.06,t1:.97,a0:-84,a1:84,finish:'plate',color:A.plate,trim:A.under,pad:.034,th:.02,rows:8,cols:20},
  {bone:'spine_03',also:['clavicle_l','clavicle_r'],t0:.06,t1:.97,a0:96,a1:264,finish:'plate',color:A.plate,trim:A.under,pad:.034,th:.02,rows:8,cols:20},
  // chitin under the gaps and down the sides
  {bone:'spine_03',t0:.1,t1:.9,finish:'leather',color:A.under,pad:.012,th:.01,rows:6,cols:24},
  ...bands({bone:'spine_02',finish:'plate',color:A.plate,trim:A.under,pad:.03,th:.016,rows:3,cols:24},0,1,2),
  ...bands({bone:'spine_01',finish:'plate',color:A.plate,trim:A.under,pad:.03,th:.016,rows:3,cols:24},.2,1,2),
  {bone:'spine_03',t0:.52,t1:.57,a0:-62,a1:62,finish:'plate',color:A.glow,emit:1.6,pad:.056,th:.006,rows:2,cols:14},
  {bone:'spine_03',t0:.52,t1:.57,a0:122,a1:238,finish:'plate',color:A.glow,emit:1.6,pad:.056,th:.006,rows:2,cols:14},
  ...LR(s=>[{bone:'upperarm_'+s,up:true,a0:-115,a1:115,t0:0,t1:.28,finish:'plate',color:A.plate,trim:A.under,pad:.038,flare:.026,th:.018,rows:5,cols:18} as Wrap,
   {bone:'upperarm_'+s,up:true,a0:-105,a1:105,t0:.22,t1:.42,finish:'plate',color:A.plate,trim:A.under,pad:.028,flare:.014,th:.016,rows:4,cols:18} as Wrap,
   {bone:'upperarm_'+s,t0:.5,t1:.9,finish:'leather',color:A.under,pad:.014,th:.01,rows:4,cols:14} as Wrap]),
  {bone:'pelvis',t0:.48,t1:.82,finish:'plate',color:A.under,trim:A.plate,pad:.03,th:.016,rows:3,cols:24});
 if(t2('gloves'))k.push(...LR(s=>[...bands({bone:'lowerarm_'+s,finish:'plate',color:A.plate,trim:A.under,pad:.02,flare:.01,th:.014,rows:4,cols:16},.28,.98,2),
  {bone:'lowerarm_'+s,t0:.6,t1:.64,finish:'plate',color:A.glow,emit:1.6,pad:.04,th:.005,rows:2,cols:16} as Wrap]));
 if(t2('legs'))k.push(...LR(s=>[
  {bone:'pelvis',t0:0,t1:.55,finish:'leather',color:A.under,pad:.016,th:.01,rows:4,cols:20} as Wrap,
  {bone:'thigh_'+s,t0:.12,t1:.78,finish:'leather',color:A.under,pad:.016,th:.01,rows:5,cols:16} as Wrap,
  {bone:'thigh_'+s,t0:.12,t1:.78,a0:-66,a1:66,finish:'plate',color:A.plate,trim:A.under,pad:.022,th:.016,rows:6,cols:12} as Wrap,
  {bone:'calf_'+s,t0:0,t1:.17,a0:-90,a1:90,finish:'plate',color:A.plate,trim:A.under,pad:.036,flare:.01,th:.02,rows:4,cols:14} as Wrap,
  ...bands({bone:'calf_'+s,finish:'plate',color:A.plate,trim:A.under,pad:.022,th:.016,rows:4,cols:18},.2,.82,2),
  {bone:'calf_'+s,t0:.48,t1:.52,a0:-50,a1:50,finish:'plate',color:A.glow,emit:1.6,pad:.04,th:.005,rows:2,cols:10} as Wrap]));
 if(t2('boots'))k.push(...LR(s=>[{bone:'calf_'+s,t0:.8,t1:1,finish:'plate',color:A.plate,trim:A.under,pad:.022,flare:.008,th:.014,rows:3,cols:18} as Wrap,
  {bone:'foot_'+s,also:['ball_'+s],finish:'leather',color:A.under,pad:.014,th:.012,rows:5,cols:16} as Wrap,
  {bone:'foot_'+s,t0:0,t1:.6,a0:-70,a1:70,finish:'plate',color:A.plate,trim:A.under,pad:.022,th:.012,rows:4,cols:10} as Wrap]));
 // ----- tier 3: boreal plate -----
 const t3=(p:Part)=>worn[p]===3,B=SET_LOOK[3];
 if(t3('torso'))k.push(
  {bone:'spine_03',also:['clavicle_l','clavicle_r'],t0:.04,t1:.98,a0:-86,a1:86,finish:'steel',color:B.plate,trim:B.under,pad:.044,th:.024,rows:9,cols:22},
  {bone:'spine_03',also:['clavicle_l','clavicle_r'],t0:.04,t1:.98,a0:94,a1:266,finish:'steel',color:B.plate,trim:B.under,pad:.044,th:.024,rows:9,cols:22},
  {bone:'spine_03',t0:.06,t1:.94,finish:'plate',color:B.under,pad:.016,th:.012,rows:6,cols:26},
  {bone:'neck_01',t0:0,t1:.55,finish:'steel',color:B.plate,trim:B.under,pad:.03,flare:.03,th:.016,rows:4,cols:22},
  ...bands({bone:'spine_02',finish:'steel',color:B.plate,trim:B.under,pad:.034,th:.016,rows:3,cols:24},0,1,3,.003),
  ...bands({bone:'spine_01',finish:'steel',color:B.plate,trim:B.under,pad:.034,th:.016,rows:3,cols:24},.1,1,2,.003),
  // violet lines: across the chest, down the back
  {bone:'spine_03',t0:.6,t1:.645,a0:-70,a1:70,finish:'plate',color:B.glow,emit:2.2,pad:.07,th:.006,rows:2,cols:16},
  {bone:'spine_03',t0:.2,t1:.9,a0:174,a1:186,finish:'plate',color:B.glow,emit:2.2,pad:.07,th:.006,rows:6,cols:3},
  ...LR(s=>[
   {bone:'upperarm_'+s,up:true,a0:-115,a1:115,t0:0,t1:.26,finish:'steel',color:B.plate,trim:B.under,pad:.048,flare:.034,th:.02,rows:5,cols:20} as Wrap,
   {bone:'upperarm_'+s,up:true,a0:-108,a1:108,t0:.2,t1:.38,finish:'steel',color:B.plate,trim:B.under,pad:.038,flare:.022,th:.018,rows:4,cols:20} as Wrap,
   {bone:'upperarm_'+s,up:true,a0:-100,a1:100,t0:.34,t1:.5,finish:'steel',color:B.plate,trim:B.under,pad:.03,flare:.012,th:.016,rows:4,cols:20} as Wrap,
   {bone:'upperarm_'+s,t0:.52,t1:.92,finish:'plate',color:B.under,pad:.018,th:.012,rows:4,cols:16} as Wrap]),
  {bone:'pelvis',t0:.46,t1:.84,finish:'steel',color:B.plate,trim:B.under,pad:.034,th:.018,rows:3,cols:26});
 if(t3('gloves'))k.push(...LR(s=>[...bands({bone:'lowerarm_'+s,finish:'steel',color:B.plate,trim:B.under,pad:.024,flare:.016,th:.016,rows:4,cols:18},.2,.99,3),
  {bone:'lowerarm_'+s,t0:.46,t1:.5,finish:'plate',color:B.glow,emit:2.2,pad:.048,th:.005,rows:2,cols:18} as Wrap]));
 if(t3('legs'))k.push(...LR(s=>[
  {bone:'pelvis',t0:0,t1:.55,finish:'plate',color:B.under,pad:.018,th:.01,rows:4,cols:20} as Wrap,
  // tassets hanging from the waist over the thighs, front and back
  {bone:'thigh_'+s,t0:0,t1:.36,a0:-74,a1:74,finish:'steel',color:B.plate,trim:B.under,pad:.044,flare:.03,th:.018,rows:4,cols:14} as Wrap,
  {bone:'thigh_'+s,t0:0,t1:.3,a0:106,a1:254,finish:'steel',color:B.plate,trim:B.under,pad:.04,flare:.025,th:.018,rows:4,cols:14} as Wrap,
  {bone:'thigh_'+s,t0:.3,t1:.84,finish:'plate',color:B.under,pad:.022,th:.014,rows:5,cols:18} as Wrap,
  {bone:'calf_'+s,t0:0,t1:.18,a0:-96,a1:96,finish:'steel',color:B.plate,trim:B.under,pad:.044,flare:.012,th:.022,rows:5,cols:16} as Wrap,
  ...bands({bone:'calf_'+s,finish:'steel',color:B.plate,trim:B.under,pad:.026,th:.018,rows:4,cols:20},.18,.84,3,.003),
  {bone:'calf_'+s,t0:.2,t1:.78,a0:-6,a1:6,finish:'plate',color:B.glow,emit:2.2,pad:.05,th:.005,rows:5,cols:3} as Wrap]));
 if(t3('boots'))k.push(...LR(s=>[{bone:'calf_'+s,t0:.8,t1:1,finish:'steel',color:B.plate,trim:B.under,pad:.028,flare:.012,th:.016,rows:3,cols:20} as Wrap,
  {bone:'foot_'+s,also:['ball_'+s],finish:'plate',color:B.under,pad:.016,th:.014,rows:5,cols:16} as Wrap,
  ...bands({bone:'foot_'+s,also:['ball_'+s],a0:-80,a1:80,finish:'steel',color:B.plate,trim:B.under,pad:.026,th:.012,rows:3,cols:10},0,1,3,.002)]));
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
