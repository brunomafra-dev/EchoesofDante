import permanenceCatalogue from '../config/permanence-catalog.json';
import {MISSIONS,MISSION_IDS,MISSION_EVIDENCE,missionById,type MissionId,type MissionEvidence,type MissionNpc} from '../config/missions';

export type MissionSnapshot={schema:1;accepted:MissionId[];completed:MissionId[];evidence:MissionEvidence[]};
export type MissionStatus='locked'|'available'|'active'|'ready'|'completed';
export type MissionAction='accept'|'deliver';
export function validMissions(raw:unknown):MissionSnapshot{
 const v=raw as Partial<MissionSnapshot>|undefined;
 const rawAccepted=Array.isArray(v?.accepted)?v.accepted:[],rawCompleted=Array.isArray(v?.completed)?v.completed:[];
 const accepted:MissionId[]=[],completed:MissionId[]=[];
 for(const def of MISSIONS){
  if(def.requires&&!completed.includes(def.requires))continue;
  if(rawAccepted.includes(def.id)){accepted.push(def.id);if(rawCompleted.includes(def.id))completed.push(def.id);}
 }
 return {schema:1,accepted,completed,evidence:Array.isArray(v?.evidence)?[...new Set(v.evidence.filter((id):id is MissionEvidence=>(MISSION_EVIDENCE as readonly string[]).includes(id)||permanenceCatalogue.evidence.includes(id)))]:[]};
}
export function validMissionRewards(raw:unknown):MissionId[]{return Array.isArray(raw)?[...new Set(raw.filter((id):id is MissionId=>MISSION_IDS.includes(id)))]:[];}

// Story reports and regional expeditions share the existing journal/receipts.
export class Missions{
 private state=validMissions(undefined);
 tracked?:MissionId;
 version=0;
 restore(raw:unknown):void{const next=validMissions(raw);if(JSON.stringify(next)!==JSON.stringify(this.state)){this.state=next;this.version++;}}
 snapshot():MissionSnapshot{return {schema:1,accepted:[...this.state.accepted],completed:[...this.state.completed],evidence:[...this.state.evidence]};}
 status(id:MissionId):MissionStatus{
  const d=missionById(id);
  if(!d)return 'locked';
  if(this.state.completed.includes(id))return 'completed';
  if(d.requires&&!this.state.completed.includes(d.requires))return 'locked';
  if(d.unlock&&!this.has(d.unlock))return 'locked';
  if(!this.state.accepted.includes(id))return 'available';
  return d.goals.every(g=>this.has(g.id))?'ready':'active';
 }
 has(id:MissionEvidence):boolean{return this.state.evidence.includes(id);}
 record(id:MissionEvidence):boolean{if(this.has(id))return false;this.state.evidence.push(id);this.version++;return true;}
 observe(facts:{echoes:number;passage:boolean;firstEcho:boolean;warden:boolean}):boolean{
  const before=this.version;
  for(const [i,id]of ['echo1','echo2','echo3'].entries())if(facts.echoes>i)this.record(id as MissionEvidence);
  if(facts.passage)this.record('passage');if(facts.firstEcho)this.record('first-echo');if(facts.warden)this.record('warden');
  return before!==this.version;
 }
 act(action:MissionAction,id:MissionId):boolean{
  if(action==='accept'&&this.status(id)==='available'){this.state.accepted.push(id);this.tracked=id;this.version++;return true;}
  if(action==='deliver'&&this.status(id)==='ready'){this.state.completed.push(id);this.tracked=undefined;this.version++;return true;}
  return false;
 }
 get current():MissionId|undefined{return this.tracked&&['available','active','ready'].includes(this.status(this.tracked))?this.tracked:MISSIONS.find(d=>['active','ready'].includes(this.status(d.id)))?.id??MISSIONS.find(d=>this.status(d.id)==='available')?.id;}
 npcState(npc:MissionNpc):'available'|'ready'|undefined{const statuses=MISSIONS.filter(m=>m.npc===npc).map(m=>this.status(m.id));return statuses.includes('ready')?'ready':statuses.includes('available')?'available':undefined;}
 claimable(receipts:readonly MissionId[]):{ids:MissionId[];credits:number}{const ids=this.state.completed.filter(id=>!receipts.includes(id));return {ids,credits:ids.reduce((sum,id)=>sum+missionById(id).credits,0)};}
}
