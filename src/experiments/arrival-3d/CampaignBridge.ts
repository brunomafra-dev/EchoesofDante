import {PLAYABLE_CLASSES,type PlayableClass}from'../../config/classes';
import {characterSex}from'../../config/appearance';
import {ECHO_COUNT,FOREST_ECHOES}from'../../config/discovery';
import type{Appearance,Trial}from'./model';
export type CampaignIdentity={id:string;name:string;classId:PlayableClass;gender:'male'|'female'};
/** Read-only projection. Never construct CharacterProfiles (its legacy
 * initialization may write), and never write a partial 3D trial over a journey. */
export function campaignIdentities(storage:Pick<Storage,'getItem'>):CampaignIdentity[]{
 try{const r=JSON.parse(storage.getItem('echoes-of-dante.characters.v1')??'null');
  if(r?.schema!==1||!Array.isArray(r.characters))return[];
  const seen=new Set<string>();return r.characters.flatMap((p:Record<string,unknown>)=>{
   if(!p||typeof p.id!=='string'||!/^[-a-zA-Z0-9]{1,64}$/.test(p.id)||seen.has(p.id)||typeof p.name!=='string'||!p.name.trim()||p.name.length>24||!Number.isFinite(p.createdAt)||!PLAYABLE_CLASSES.includes(p.classId as PlayableClass))return[];
   seen.add(p.id);return[{id:p.id,name:p.name.replace(/[\x00-\x1f<>]/g,''),classId:p.classId as PlayableClass,gender:characterSex(p.classId as PlayableClass,p.sex)}];
  }).slice(0,6);
 }catch{return[];}
}
export function campaignPassage(storage:Pick<Storage,'getItem'>,id:string){
 try{if(!campaignIdentities(storage).some(p=>p.id===id))return false;
  const raw=JSON.parse(storage.getItem(id==='legacy-warrior'?'echoes-of-dante.journey.v1':'echoes-of-dante.journey.v1.character.'+id)??'null'),p=raw?.progression;
  if(raw?.schema!==1||!p||!Array.isArray(p.echoes)||!Array.isArray(p.rewardedHollows)||!Number.isSafeInteger(p.xp)||p.xp<0||p.xp>1e9||!Number.isSafeInteger(raw.hp)||raw.hp<0||raw.hp>10000||!raw.flags||typeof raw.flags!=='object'||Array.isArray(raw.flags))return false;
  const allowed=['northern-ruin',FOREST_ECHOES.mineral.id,FOREST_ECHOES.trace.id];
  return new Set(p.echoes.filter((e:unknown)=>typeof e==='string'&&allowed.includes(e))).size===ECHO_COUNT&&p.sourceLocated===true&&p.passageOpen===true;
 }catch{return false;}
}
export const linkedAppearance=(profile:CampaignIdentity,look:Appearance):Appearance=>({...look,name:profile.name,classId:profile.classId,gender:profile.gender,beard:profile.gender==='male'&&look.beard});
export const trialKey=(trial:Trial)=>trial.profileId?'dante.arrival3d.profile.'+trial.profileId:'dante.arrival3d.independent.v1';
