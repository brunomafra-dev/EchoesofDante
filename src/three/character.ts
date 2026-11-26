import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {Grip,MUZZLE} from './grip';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {dress,classKit,garbKit} from './outfit';

// Character of the new 3D track: one rigged human per sex, every customisable part is a
// separate skinned mesh sharing the same skeleton (built by scripts/asset-tools/3d-new/build_character.py).
export type Sex='male'|'female';
export type WeaponId='saber'|'carbine'|'gauntlet'|'conductor';
export interface Look{sex:Sex;skin:number;hair:string;hairColor:number;brows:string;outfit:string;cloth:number;weapon:WeaponId;helmet?:boolean;tint?:string;garb?:string}

export const SKINS=['#ffffff','#f1d2bd','#d8a98a','#b47d58','#8a5a3b','#5a3a28'];
export const HAIR_COLORS:[string,[number,number,number]][]=[
 ['Preto',[.32,.32,.36]],['Castanho',[1,1,1]],['Ruivo',[2.4,.95,.55]],['Loiro',[3.4,2.7,1.4]],['Prata',[3.2,3.3,3.6]],['Azul',[.5,1.1,3]],
];
export const HAIR:Record<Sex,[string,string][]>={
 male:[['short02','Curto'],['short04','Repicado'],['cortu_short_messy_hair','Bagunçado'],['ponytail01','Rabo de cavalo'],['long01','Longo'],['afro01','Black power']],
 female:[['long01','Longo'],['bob01','Chanel'],['ponytail01','Rabo de cavalo'],['braid01','Trança'],['toigo_blunt_bob','Chanel reto'],['short03','Curto']],
};
export const CLOTH:[string,string][]=[['Da classe','linear-gradient(135deg,#e8e0d0 50%,#e07a2a 50%)'],['Original','#ffffff'],['Grafite','#5c5d62'],['Floresta','#587a4f'],['Marinho','#4b5f94'],['Vinho','#9c4a56'],['Ocre','#c59a52']];
export const BROWS:[string,string][]=[['eyebrow001','Fina'],['eyebrow005','Média'],['eyebrow009','Grossa']];
// equipment tiers of the 2D wardrobe: no protection, basic, reinforced (+ ship crew uniform)
export const OUTFITS:[string,string][]=[['work','Sem proteção'],['basic','Básico'],['reinforced','Reforçado'],['fleet','Tripulação']];
// 2D class palettes: suit underlayer, armour plates, work clothes, visor/accent
const PALETTE:Record<WeaponId,{suit:string;plate:string;work:string;accent:string}>={
 saber:{suit:'#3a3a42',plate:'#ece4d4',work:'#6e6c4a',accent:'#e07a2a'},
 carbine:{suit:'#2c3a5c',plate:'#d8ccb0',work:'#6a6848',accent:'#e0782a'},
 gauntlet:{suit:'#33436c',plate:'#eef2f6',work:'#3c4c6c',accent:'#4fe6ff'},
 conductor:{suit:'#3a3f2c',plate:'#9a9a78',work:'#5a5a40',accent:'#7dff9e'},
};
export const WEAPONS:[WeaponId,string,string][]=[
 ['saber','Sabre de plasma','Corpo a corpo, golpes amplos'],['carbine','Carabina','Tiro à distância'],
 ['gauntlet','Manopla','Socos rápidos'],['conductor','Condutor','Descargas de energia'],
];
export const DEFAULT_LOOK:Look={sex:'male',skin:1,hair:'short02',hairColor:1,brows:'eyebrow005',outfit:'basic',cloth:0,weapon:'saber',helmet:false};

const clean=(s:string)=>s.replace(/[\[\].:/]/g,'');
const loader=new GLTFLoader();
const cache=new Map<string,Promise<{scene:T.Group;animations:T.AnimationClip[]}>>();
const load=(url:string)=>{let p=cache.get(url);if(!p){p=loader.loadAsync(url) as never;cache.set(url,p);}return p;};
const base=import.meta.env.BASE_URL;

export class Character{
 root=new T.Group();model!:T.Group;mixer!:T.AnimationMixer;clips=new Map<string,T.AnimationClip>();
 current:T.AnimationAction|null=null;currentName='';look:Look=DEFAULT_LOOK;private outfitMats:T.MeshStandardMaterial[]=[];
 hand:T.Object3D|null=null;weapon:T.Object3D|null=null;private weaponId:WeaponId|null=null;private grip:Grip|null=null;
 private gear=new T.Group();private restHead=new T.Matrix4();private restChest=new T.Matrix4();
 private bodyMats:T.MeshStandardMaterial[]=[];private hairMats:T.MeshStandardMaterial[]=[];private browMats:T.MeshStandardMaterial[]=[];
 async setSex(sex:Sex){
  if(this.model&&this.look.sex===sex)return;
  const set=new URLSearchParams(location.search).get('set')??'';const g=await load(`${base}assets/3d-new/characters/${set}${sex}.glb`);
  if(this.model){this.root.remove(this.model);this.mixer.stopAllAction();this.current=null;this.currentName='';}
  const model=(await import('three/addons/utils/SkeletonUtils.js')).clone(g.scene) as T.Group;
  this.model=model;this.root.add(model);
  this.mixer=new T.AnimationMixer(model);this.clips.clear();
  for(const c of g.animations)this.clips.set(c.name,c);
  this.bodyMats=[];this.hairMats=[];this.browMats=[];this.outfitMats=[];
  model.traverse(o=>{
   const m=o as T.Mesh;
   if(m.isMesh){
    m.castShadow=true;m.frustumCulled=false;
    const mats=(Array.isArray(m.material)?m.material:[m.material]) as T.MeshStandardMaterial[];
    mats.forEach((mat,i)=>{
     const n=(mat.name||'').toLowerCase();const mine=mat.clone();
     if(Array.isArray(m.material))(m.material as T.Material[])[i]=mine;else m.material=mine;
     if(/body$/.test(n)){this.bodyMats.push(mine);this.coverable(m,mine);}
     let g:T.Object3D|null=m,grp='';while(g&&!grp){if(g.name.startsWith('hair'))grp='hair';else if(g.name.startsWith('eyebrows'))grp='brow';else if(g.name.startsWith('outfit'))grp='outfit';g=g.parent;}
     if(grp==='hair')this.hairMats.push(mine);else if(grp==='brow')this.browMats.push(mine);else if(grp==='outfit'){this.outfitMats.push(mine);mine.userData.out=g?.name;}
     mine.envMapIntensity=.3;mine.metalness=0;mine.roughness=/body$/.test(n)?.62:Math.max(.88,mine.roughness);
    });
   }
  });
  this.hand=model.getObjectByName('hand_r')??null;this.weaponId=null;this.weapon=null;this.grip=new Grip(model);
  model.updateMatrixWorld(true);this.restHead.copy(model.getObjectByName('head')!.matrixWorld);this.restChest.copy(model.getObjectByName('spine_03')!.matrixWorld);this.gearKey='';this.fitKey='';this.fitted=[];
  this.look={...this.look,sex};
 }
 // skin under a garment: the body keeps every vertex and hides only what the worn garments cover
 // (per-garment masks exported as _H_<garment> attributes by build_character.py, packed into one bit field here)
 private coverBits=new Map<string,number>();private coverU={value:0};
 private coverable(m:T.Mesh,mat:T.MeshStandardMaterial){
  const g=m.geometry;let bits=g.userData.coverBits as Map<string,number>|undefined;
  if(!bits){bits=new Map();const keys=Object.keys(g.attributes).filter(k=>k.startsWith('_h_'));if(!keys.length)return;
   const packed=new Float32Array(g.attributes.position.count);
   keys.forEach((k,i)=>{const a=g.attributes[k];for(let v=0;v<packed.length;v++)if(a.getX(v)>.5)packed[v]+=1<<i;bits!.set(k.slice(3),1<<i);g.deleteAttribute(k);});
   g.setAttribute('cover',new T.BufferAttribute(packed,1));g.userData.coverBits=bits;}
  this.coverBits=bits;const u=this.coverU;
  mat.onBeforeCompile=sh=>{sh.uniforms.uCover=u;
   sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nattribute float cover;uniform int uCover;varying float vCover;').replace('#include <begin_vertex>','#include <begin_vertex>\nvCover=(int(cover+.5)&uCover)!=0?1.:0.;');
   sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nvarying float vCover;').replace('#include <clipping_planes_fragment>','#include <clipping_planes_fragment>\nif(vCover>.5)discard;');};
  mat.customProgramCacheKey=()=>'coverable';
 }
 private updateCover(){let b=0;this.model.traverse(o=>{if(o.visible&&o.name.startsWith('outfit')){let p:T.Object3D|null=o,vis=true;while(p&&p!==this.model){if(!p.visible)vis=false;p=p.parent;}const n=o.name.toLowerCase(),bit=this.coverBits.get(n)??(n.startsWith('outfitfleet')?this.coverBits.get('outfitbasic0'):0);if(vis&&bit)b|=bit;}});this.coverU.value=b;}
 apply(look:Look){
  this.look=look;
  const hair='hair'+clean(look.hair),brow='eyebrows'+clean(look.brows),out='outfit'+look.outfit;const outEnd=out;
  this.model.traverse(o=>{
   const n=o.name;
   if(n.startsWith('hair'))o.visible=n.startsWith(hair);
   else if(n.startsWith('eyebrows'))o.visible=n.startsWith(brow);
   else if(n.startsWith('outfit'))o.visible=n.startsWith(outEnd)&&!OUTFITS.some(([id])=>id!==look.outfit&&id.startsWith(look.outfit)&&n.startsWith('outfit'+id));
  });
  const skin=new T.Color(SKINS[look.skin]??'#fff');
  this.bodyMats.forEach(m=>m.color.copy(skin));
  // "Da classe" paints suit, plates and work clothes with the 2D class palette; other swatches tint the fabric
  const P=PALETTE[look.weapon],own=look.cloth===0&&!look.tint,cl=new T.Color(look.tint??(own?P.suit:CLOTH[look.cloth]?.[1]??'#fff'));
  this.outfitMats.forEach(m=>{const n=m.name.toLowerCase();if(/boots/.test(n))return;
   // the bodysuits are dark textures: the class colour has to be pushed above 1 to read as the 2D navy/olive
   if(/bodysuit|skinsuit/.test(n)){if(m.userData.map0===undefined)m.userData.map0=m.map;const flat=own&&look.weapon!=='saber';const want=flat?null:m.userData.map0;if(m.map!==want){m.map=want;m.needsUpdate=true;}if(flat){m.color.set(P.suit);return;}}
   if(/armor/.test(n))m.color.set(own?P.plate:'#ffffff');else if(/worksuit/.test(n)){if(m.userData.map0===undefined)m.userData.map0=m.map;const want=look.tint?null:m.userData.map0;if(m.map!==want){m.map=want;m.needsUpdate=true;}m.color.copy(own?new T.Color(P.work):cl);}else m.color.copy(cl);});
  this.equip(look);this.fit(look);this.updateCover();
  const hc=HAIR_COLORS[look.hairColor]??HAIR_COLORS[1];
  this.hairMats.forEach(m=>m.color.setRGB(hc[1][0],hc[1][1],hc[1][2]));
  this.browMats.forEach(m=>m.color.setRGB(hc[1][0]*.8,hc[1][1]*.8,hc[1][2]*.8));
 }
 // rigid expedition gear on the bones: helmet with visor (head), backpack (upper chest)
 private gearKey='';
 private equip(look:Look){
  const helmet=!!look.helmet,pack=look.outfit==='basic'||look.outfit==='reinforced',key=[helmet,pack,look.weapon,look.outfit,look.cloth].join('|');
  const hideHair=()=>this.model.traverse(o=>{if(o.name.startsWith('hair')&&helmet)o.visible=false;});
  if(key===this.gearKey){hideHair();return;}this.gearKey=key;
  this.gear.clear();this.gear.removeFromParent();for(const c of [...this.gearParts])c.removeFromParent();this.gearParts=[];
  const P=PALETTE[look.weapon];
  const shell=new T.MeshStandardMaterial({color:new T.Color(look.outfit==='work'?P.work:P.plate).multiplyScalar(.58),roughness:.62,metalness:.15});
  const dark=new T.MeshStandardMaterial({color:'#1c1d22',roughness:.6,metalness:.4});
  const glow=new T.MeshStandardMaterial({color:P.accent,emissive:P.accent,emissiveIntensity:.7});
  const visor=new T.MeshStandardMaterial({color:'#0a2a33',emissive:look.weapon==='carbine'?'#ff7a2a':'#2fd8ff',emissiveIntensity:.22,roughness:.05,metalness:.7});
  const head=this.model.getObjectByName('head'),chest=this.model.getObjectByName('spine_03');
  const attach=(bone:T.Object3D,rest:T.Matrix4,obj:T.Object3D,off:[number,number,number])=>{
   // place obj in model space (aligned with the model) at rest, then express it in the bone's space
   const want=new T.Matrix4().makeTranslation(...off).premultiply(new T.Matrix4().makeTranslation(new T.Vector3().setFromMatrixPosition(rest).x,new T.Vector3().setFromMatrixPosition(rest).y,new T.Vector3().setFromMatrixPosition(rest).z));
   const local=rest.clone().invert().multiply(want);local.decompose(obj.position,obj.quaternion,obj.scale);bone.add(obj);this.gearParts.push(obj);
  };
  if(helmet&&head){
   const h=new T.Group();
   const dome=new T.Mesh(new T.SphereGeometry(.135,28,18),shell);dome.scale.set(1,1.08,1.12);h.add(dome);
   const vz=look.weapon==='carbine'?[.55,.45]:[.95,.7];
   const v=new T.Mesh(new T.SphereGeometry(.138,28,18,Math.PI/2-vz[0],vz[0]*2,1.1,vz[1]),visor);v.rotation.y=0;v.scale.set(1,1.08,1.12);h.add(v);
   const ring=new T.Mesh(new T.TorusGeometry(.115,.022,10,28),dark);ring.rotation.x=Math.PI/2;ring.position.y=-.12;h.add(ring);
   for(const sx of[-1,1]){const ear=new T.Mesh(new T.CylinderGeometry(.04,.04,.03,16),dark);ear.rotation.z=Math.PI/2;ear.position.set(sx*.135,0,0);h.add(ear);const l=new T.Mesh(new T.SphereGeometry(.01,8,6),glow);l.position.set(sx*.152,0,.02);h.add(l);}
   const fin=new T.Mesh(new RoundedBoxGeometry(.025,.035,.18,2,.01),dark);fin.position.set(0,.145,-.02);h.add(fin);
   h.traverse(o=>{(o as T.Mesh).castShadow=true;});
   attach(head,this.restHead,h,[0,.075,.012]);
  }
  if(pack&&chest){
   const b=new T.Group();
   const body=new T.Mesh(new RoundedBoxGeometry(.3,.38,.15,3,.04),shell);b.add(body);
   const lid=new T.Mesh(new RoundedBoxGeometry(.3,.1,.19,2,.03),dark);lid.position.set(0,.2,0);b.add(lid);
   for(const sx of[-1,1]){const can=new T.Mesh(new T.CylinderGeometry(.045,.045,.34,14),dark);can.position.set(sx*.2,-.02,-.02);b.add(can);const band=new T.Mesh(new T.TorusGeometry(.047,.006,6,16),glow);band.rotation.x=Math.PI/2;band.position.set(sx*.2,.08,-.02);b.add(band);}
   const strip=new T.Mesh(new T.BoxGeometry(.2,.02,.01),glow);strip.position.set(0,.05,-.09);b.add(strip);
   const ant=new T.Mesh(new T.CylinderGeometry(.006,.006,.3,6),dark);ant.position.set(.16,.33,-.06);ant.rotation.z=-.25;b.add(ant);const tip=new T.Mesh(new T.SphereGeometry(.016,8,6),glow);tip.position.set(.2,.48,-.06);b.add(tip);
   b.traverse(o=>{(o as T.Mesh).castShadow=true;});
   attach(chest,this.restChest,b,[0,-.06,-.19]);
  }
  hideHair();
 }
 private gearParts:T.Object3D[]=[];
 // armour and garments of the 2D wardrobe, fitted to this body (outfit.ts); the generic MPFB armour meshes are hidden
 private fitted:T.Object3D[]=[];private fitKey='';
 private fit(look:Look){
  const kit=look.garb?garbKit(look.garb):classKit(look.weapon,look.outfit),key=look.sex+'|'+look.weapon+'|'+look.outfit+'|'+(look.garb??'');
  this.model.traverse(o=>{const m=o as T.Mesh;if(m.isMesh&&/scifi-armor/i.test(((m.material as T.Material).name||'')))m.visible=m.visible&&!kit.length;});
  if(key===this.fitKey)return;this.fitKey=key;
  for(const f of this.fitted)f.removeFromParent();
  const set=new URLSearchParams(location.search).get('set')??'';this.fitted=dress(this.model,set+look.sex+'|'+look.outfit,kit);
 }
 async setWeapon(id:WeaponId){
  if(this.weaponId===id||!this.hand)return;
  const g=await load(`${base}assets/3d-new/weapons/${id}.glb`);
  if(this.weapon){this.weapon.parent?.remove(this.weapon);const hp=this.weapon.userData.handPart as T.Object3D|undefined;hp?.parent?.remove(hp);}
  const w=g.scene.clone(true);
  w.traverse(o=>{const m=o as T.Mesh;if(m.isMesh){m.castShadow=true;}});
  const parent=this.grip?.mount(id,w)??this.hand;
  parent.add(w);this.weapon=w;this.weaponId=id;this.look={...this.look,weapon:id};
 }
 has(name:string){return this.clips.has(name);}
 // world position where this weapon's shots start (falls back to the right hand)
 muzzle(out=new T.Vector3()){
  const id=this.weaponId,w=this.weapon;if(!id||!w){this.hand?.getWorldPosition(out);return out;}
  const m=MUZZLE[id];const host=(w.userData.handPart as T.Object3D|undefined)??w;
  if(!m){this.hand?.getWorldPosition(out);return out;}
  host.updateWorldMatrix(true,false);return host.localToWorld(out.set(...m));
 }
 recoil(){this.grip?.recoil();}
 play(name:string,o:{once?:boolean;fade?:number;speed?:number}={}){
  const clip=this.clips.get(name);if(!clip)return null;
  if(this.currentName===name&&!o.once&&this.current)return this.current;
  const a=this.mixer.clipAction(clip);
  a.reset();a.setEffectiveTimeScale(o.speed??1);a.setEffectiveWeight(1);
  a.setLoop(o.once?T.LoopOnce:T.LoopRepeat,Infinity);a.clampWhenFinished=!!o.once;
  if(this.current&&this.current!==a)a.crossFadeFrom(this.current,o.fade??.18,false);
  a.play();this.current=a;this.currentName=name;return a;
 }
 duration(name:string){return this.clips.get(name)?.duration??1;}
 // tint the astral glow (rings, ridge, palm) with the active element
 setGlow(color:string){this.weapon?.traverse(o=>{const m=(o as T.Mesh).material as T.MeshStandardMaterial|undefined;if(m&&m.name==='astral_glow'){m.color.set(color);m.emissive.set(color);}});const hp=this.weapon?.userData.handPart as T.Object3D|undefined;hp?.traverse(o=>{const m=(o as T.Mesh).material as T.MeshStandardMaterial|undefined;if(m&&m.name==='astral_glow'){m.color.set(color);m.emissive.set(color);}});}
 private ringT=0;
 update(dt:number){if(!this.mixer)return;this.mixer.update(dt);
  if(this.weaponId==='gauntlet'&&this.weapon){this.ringT+=dt;this.weapon.children.forEach(c=>{const m=/^astral_ring(\d)/.exec(c.name);if(m){const i=+m[1];c.rotation.set(Math.PI/2+Math.sin(this.ringT*1.3+i)*.5,this.ringT*(2+i*.7)*(i%2?-1:1),Math.cos(this.ringT*1.1+i*2)*.5);}});}this.grip?.apply(this.weaponId,this.weapon,this.currentName);}
}
