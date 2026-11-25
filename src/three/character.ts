import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {Grip,MUZZLE} from './grip';

// Character of the new 3D track: one rigged human per sex, every customisable part is a
// separate skinned mesh sharing the same skeleton (built by scripts/asset-tools/3d-new/build_character.py).
export type Sex='male'|'female';
export type WeaponId='saber'|'carbine'|'gauntlet'|'conductor';
export interface Look{sex:Sex;skin:number;hair:string;hairColor:number;brows:string;outfit:string;cloth:number;weapon:WeaponId}

export const SKINS=['#ffffff','#f1d2bd','#d8a98a','#b47d58','#8a5a3b','#5a3a28'];
export const HAIR_COLORS:[string,[number,number,number]][]=[
 ['Preto',[.32,.32,.36]],['Castanho',[1,1,1]],['Ruivo',[2.4,.95,.55]],['Loiro',[3.4,2.7,1.4]],['Prata',[3.2,3.3,3.6]],['Azul',[.5,1.1,3]],
];
export const HAIR:Record<Sex,[string,string][]>={
 male:[['short02','Curto'],['short04','Repicado'],['cortu_short_messy_hair','Bagunçado'],['ponytail01','Rabo de cavalo'],['long01','Longo'],['afro01','Black power']],
 female:[['long01','Longo'],['bob01','Chanel'],['ponytail01','Rabo de cavalo'],['braid01','Trança'],['toigo_blunt_bob','Chanel reto'],['short03','Curto']],
};
export const CLOTH:[string,string][]=[['Original','#ffffff'],['Grafite','#5c5d62'],['Floresta','#587a4f'],['Marinho','#4b5f94'],['Vinho','#9c4a56'],['Ocre','#c59a52']];
export const BROWS:[string,string][]=[['eyebrow001','Fina'],['eyebrow005','Média'],['eyebrow009','Grossa']];
export const OUTFITS:[string,string][]=[['expedition','Expedição'],['armored','Blindado'],['fleet','Frota'],['pilot','Piloto']];
export const WEAPONS:[WeaponId,string,string][]=[
 ['saber','Sabre de plasma','Corpo a corpo, golpes amplos'],['carbine','Carabina','Tiro à distância'],
 ['gauntlet','Manopla','Socos rápidos'],['conductor','Condutor','Descargas de energia'],
];
export const DEFAULT_LOOK:Look={sex:'male',skin:1,hair:'short02',hairColor:1,brows:'eyebrow005',outfit:'expedition',cloth:0,weapon:'saber'};

const clean=(s:string)=>s.replace(/[\[\].:/]/g,'');
const loader=new GLTFLoader();
const cache=new Map<string,Promise<{scene:T.Group;animations:T.AnimationClip[]}>>();
const load=(url:string)=>{let p=cache.get(url);if(!p){p=loader.loadAsync(url) as never;cache.set(url,p);}return p;};
const base=import.meta.env.BASE_URL;

export class Character{
 root=new T.Group();model!:T.Group;mixer!:T.AnimationMixer;clips=new Map<string,T.AnimationClip>();
 current:T.AnimationAction|null=null;currentName='';look:Look=DEFAULT_LOOK;private outfitMats:T.MeshStandardMaterial[]=[];
 hand:T.Object3D|null=null;weapon:T.Object3D|null=null;private weaponId:WeaponId|null=null;private grip:Grip|null=null;
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
     if(/body$/.test(n))this.bodyMats.push(mine);
     let g:T.Object3D|null=m,grp='';while(g&&!grp){if(g.name.startsWith('hair'))grp='hair';else if(g.name.startsWith('eyebrows'))grp='brow';else if(g.name.startsWith('outfit'))grp='outfit';g=g.parent;}
     if(grp==='hair')this.hairMats.push(mine);else if(grp==='brow')this.browMats.push(mine);else if(grp==='outfit'){this.outfitMats.push(mine);mine.userData.out=g?.name;}
     mine.envMapIntensity=.3;mine.metalness=0;mine.roughness=/body$/.test(n)?.62:Math.max(.88,mine.roughness);
    });
   }
  });
  this.hand=model.getObjectByName('hand_r')??null;this.weaponId=null;this.weapon=null;this.grip=new Grip(model);
  this.look={...this.look,sex};
 }
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
  const cl=new T.Color(CLOTH[look.cloth]?.[1]??'#fff');this.outfitMats.forEach(m=>{if(!/boots/i.test(m.name))m.color.copy(cl);});
  const hc=HAIR_COLORS[look.hairColor]??HAIR_COLORS[1];
  this.hairMats.forEach(m=>m.color.setRGB(hc[1][0],hc[1][1],hc[1][2]));
  this.browMats.forEach(m=>m.color.setRGB(hc[1][0]*.8,hc[1][1]*.8,hc[1][2]*.8));
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
