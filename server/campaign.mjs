import {createHash} from 'node:crypto';
const id=v=>typeof v==='string'&&/^[a-zA-Z0-9-]{1,64}$/.test(v);
const hash=v=>typeof v==='string'&&/^[a-f0-9]{64}$/.test(v);
const classes=['warrior','hunter','astral','xenobinder'];
export function campaignCredentials(raw,profile) {
 if(!raw||raw.mode!=='coop'||!id(raw.id)||!id(raw.hostId)||!id(raw.memberId)||profile.characterId!==raw.memberId||![2,3,4].includes(raw.size)||!['easy','normal','hard'].includes(raw.difficulty)||typeof raw.memberKey!=='string'||!/^[a-f0-9]{48}$/.test(raw.memberKey)||raw.introSeen!==true)return;
 const crew=Array.isArray(raw.crew)?raw.crew.map(m=>({id:m?.id,name:m?.name,classId:m?.classId,sex:m?.sex,keyHash:m?.keyHash})):[];
 if(crew.length&& (crew.length!==raw.size||new Set(crew.map(m=>m.id)).size!==crew.length||new Set(crew.map(m=>m.classId)).size!==crew.length||!crew.some(m=>m.id===raw.hostId)||crew.some(m=>!id(m.id)||typeof m.name!=='string'||m.name.length>24||!classes.includes(m.classId)||!['male','female'].includes(m.sex)||!hash(m.keyHash))))return;
 const fingerprint=createHash('sha256').update(raw.memberKey).digest('hex');
 if(crew.length&&!crew.some(m=>m.id===raw.memberId&&m.keyHash===fingerprint&&m.classId===profile.classId))return;
 return {id:raw.id,hostId:raw.hostId,difficulty:raw.difficulty,size:raw.size,crew,memberId:raw.memberId,fingerprint};
}
export const sameCampaign=(campaign,credentials)=>campaign.id===credentials.id&&campaign.hostId===credentials.hostId&&campaign.size===credentials.size&&campaign.difficulty===credentials.difficulty;
export const crewIdentity=seat=>({id:seat.profile.characterId,name:seat.profile.name,classId:seat.profile.classId,sex:seat.profile.sex,keyHash:seat.fingerprint});
export function canJoinCampaign(campaign,credentials,profile) {
 return sameCampaign(campaign,credentials)&&(!campaign.crew.length||campaign.crew.some(m=>m.id===credentials.memberId&&m.keyHash===credentials.fingerprint&&m.classId===profile.classId));
}
export const campaignRunning=room=>room.started===true&&[room.host,...room.guests.values()].length===room.campaign.size&&[room.host,...room.guests.values()].every(m=>!!m.ws&&m.ready!==false);
export const campaignState=room=>({...room.campaign,started:room.started===true,running:campaignRunning(room)});
