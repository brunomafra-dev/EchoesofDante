import Phaser from 'phaser';
import {addQuestProp} from '../visual/QuestProps';
import {BASE_WORKERS,NPC_SHEETS,SECOND_SETTLERS,firstSettlers,serviceFrameAt,type NpcDefinition,type NpcId,type NpcPose} from '../config/settlementLife';
import type {JourneyArea} from './LocalJourney';
import type {Missions} from './Missions';
import type {Vec2} from '../utils/math';
import type {MovementBounds,Obstacle} from './Movement';
import {safeExpeditionPosition} from './ExpeditionReturn';
import {ResidentMotion,ResidentPresentation} from './SettlementMotion';
import {OUTPOST_SETTLERS} from '../config/outpost';

export function preloadSettlementLife(scene:Phaser.Scene):void{
 for(const[id,file]of Object.entries(NPC_SHEETS))if(!scene.textures.exists('life-'+id))scene.load.spritesheet('life-'+id,`${import.meta.env.BASE_URL}assets/settlement-life/${file}.webp`,{frameWidth:256,frameHeight:256});
 if(!scene.cache.json.exists('life-frames-r3'))scene.load.json('life-frames-r3',`${import.meta.env.BASE_URL}assets/settlement-life/frames-r3.json`);
}
type Person={definition:NpcDefinition;position:Vec2;image:Phaser.GameObjects.Image;shadow:Phaser.GameObjects.Image;label:Phaser.GameObjects.Text;speech:Phaser.GameObjects.Text;solid?:Obstacle;props:{image:Phaser.GameObjects.Image;solid:Obstacle}[];target:number;waitUntil:number;talkUntil:number;frame:number;flip:boolean;motion:ResidentMotion;presentation:ResidentPresentation};
type ArtMetadata={scale:number;anchors:{x:number;y:number}[]};
const GUI_REPAIR={duration:5100,beats:[[12,1400],[13,900],[12,1900],[13,900]]} as const;
const MARA_REPAIR={duration:6200,beats:[[12,1200],[13,800],[14,1100],[15,1300],[14,900],[13,900]]} as const;
const SIGNAL_MARA_TEXT='Guardei o pulso longo no receptor independente. Ele continua desligado da energia e da água do posto; Ivo vai comparar o registro com o arquivo da fissura.';

// Whole painted animation frames. Only residents move; mission services keep
// their original interaction anchors. Dynamic footprints never rebake the map.
export class SettlementLife{
 private people=new Map<NpcId,Person>();
 private lastAt=0;
 private garden=false;
 private signalRecorded=false;
 constructor(private scene:Phaser.Scene,private area:JourneyArea,private obstacles:Obstacle[],private bounds:MovementBounds,private warden:()=>boolean){
  if(area==='base')for(const d of BASE_WORKERS){this.obstacles.push({x:d.position.x+42,y:d.position.y+7,radius:24});this.scene.add.image(d.position.x+42,d.position.y+12,'world-shadow','ground-contact').setDisplaySize(72,17).setAlpha(.32).setDepth(d.position.y-3);}
 }
 navigationObstacles(obstacles:readonly Obstacle[]):readonly Obstacle[]{const moving=new Set([...this.people.values()].filter(p=>p.definition.route).map(p=>p.solid).filter(Boolean));return obstacles.filter(o=>!moving.has(o));}
 update(missions:Missions,viewer:Vec2,now:number,actors:readonly {position:Vec2;isDead:boolean;radius:number}[],authority:boolean,remote?:readonly NpcPose[]):void{
  this.signalRecorded=this.area==='springs'&&missions.has('ps-record');
  const localNow=this.scene.time.now,dt=this.lastAt?Math.min(.05,Math.max(0,(localNow-this.lastAt)/1000)):0;this.lastAt=localNow;
  const settled=missions.has('shelter-built');
  if(this.area==='terraces'&&settled&&!this.garden){this.garden=true;
   this.scene.add.image(2330,1050,'root-growth').setDisplaySize(100,32).setDepth(-17).setTint(0xa6b28a).setName('settlement-nave-seedlings');
   this.scene.add.image(2330,1034,'dante-canopy-green').setDisplaySize(72,33).setDepth(-16).setTint(0xa7bb86);
  }
  const assigned=missions.has('po-crew');
  const desired:readonly NpcDefinition[]=this.area==='base'?[...BASE_WORKERS,...(this.warden()&&!settled?firstSettlers(true):[])]:this.area==='terraces'?[...(settled?firstSettlers(false):[]),...(missions.has('pc-receive')&&!assigned?SECOND_SETTLERS:[])]:this.area==='springs'&&assigned?OUTPOST_SETTLERS:[];
  for(const[id,p]of this.people)if(!desired.some(d=>d.id===id)){this.remove(p);this.people.delete(id);}
  for(const definition of desired)if(!this.people.has(definition.id))this.add(definition,now,authority?actors:[]);
  for(const p of this.people.values()){
   if(!authority){const pose=remote?.find(r=>r.id===p.definition.id);if(pose&&[pose.x,pose.y].every(Number.isFinite)&&pose.x>=this.bounds.left&&pose.x<=this.bounds.right&&pose.y>=this.bounds.top&&pose.y<=this.bounds.bottom){const max=p.definition.service?6:16;p.presentation.push({time:now,x:pose.x,y:pose.y,frame:Number.isInteger(pose.frame)&&pose.frame>=0&&pose.frame<max?pose.frame:0,flip:pose.flip===true},localNow);const shown=p.presentation.at(localNow);if(shown){p.position.x=shown.x;p.position.y=shown.y;p.frame=shown.frame;p.flip=shown.flip;}p.talkUntil=Number.isFinite(pose.talkUntil)?Math.min(now+3500,pose.talkUntil!):0;}}
   else if(p.definition.service)p.frame=serviceFrameAt(p.definition.id,now+p.motion.offset);
   else if(!p.definition.route)this.workResident(p,dt,now);
   else this.moveResident(p,dt,now,actors);
   this.draw(p,viewer,now);
  }
 }
 private workResident(p:Person,dt:number,now:number):void{
  const m=p.motion;
  if(p.talkUntil>now){if(m.mode==='work'||m.mode==='settle'){m.mode='rise';m.phase=0;}if(m.mode==='rise'){m.phase=Math.min(1,m.phase+dt/1.2);if(m.phase>=1)m.mode='talk';}}
  else if(m.mode==='talk'){m.mode='settle';m.phase=0;}
  else if(m.mode==='settle'){m.phase=Math.min(1,m.phase+dt/1.2);if(m.phase>=1){m.mode='work';m.phase=0;}}
  else if(m.mode!=='work'){m.mode='settle';m.phase=0;}
  if(m.mode==='work'){
   const routine=p.definition.id==='caio'?GUI_REPAIR:MARA_REPAIR;
   m.phase+=dt;let beat=(m.phase*1000+m.offset)%routine.duration;p.frame=12;
   for(const[frame,hold]of routine.beats){if(beat<hold){p.frame=frame;break}beat-=hold;}
  }else p.frame=m.frame;
 }
 private moveResident(p:Person,dt:number,now:number,actors:readonly {position:Vec2;isDead:boolean;radius:number}[]):void{
  const m=p.motion,route=p.definition.route!,solids=this.obstacles.filter(o=>o!==p.solid);
  for(const a of actors)if(!a.isDead)solids.push({x:a.position.x,y:a.position.y,radius:a.radius});
  if(p.talkUntil>now){
   m.brake(p.position,dt,solids,this.bounds);
   if(m.mode==='work'||m.mode==='settle'){m.mode='rise';m.phase=0;}
   if(m.mode==='rise'){m.phase=Math.min(1,m.phase+dt/1.05);if(m.phase>=1)m.mode='talk';}else m.mode='talk';
  }else if(m.mode==='walk'){
   const target=route[p.target],stop=p.target===0||p.target===route.length-1;
   m.step(p.position,target,dt,stop,solids,this.bounds,now);
   if(Math.abs(m.velocity.x)>5)p.flip=m.velocity.x<0;
   if(Math.hypot(target.x-p.position.x,target.y-p.position.y)<(stop?3:13)){
    p.target=(p.target+1)%route.length;
    if(stop){m.mode='settle';m.phase=0;p.waitUntil=now+6000+m.offset%2100;}
   }
  }else{
   m.brake(p.position,dt,solids,this.bounds);
   if(m.mode==='settle'){m.phase=Math.min(1,m.phase+dt/1.05);if(m.phase>=1){m.mode='work';m.phase=0;}}
   else if(m.mode==='work'){m.phase+=dt*(.85+(m.offset%7)*.035);if(now>=p.waitUntil){m.mode='rise';m.phase=0;}}
   else if(m.mode==='rise'){m.phase=Math.min(1,m.phase+dt/1.05);if(m.phase>=1&&now>=p.waitUntil){m.mode='walk';m.phase=0;const dx=route[p.target].x-p.position.x;if(Math.abs(dx)>3)p.flip=dx<0;}}
   else {m.mode='rise';m.phase=1;}
  }
  p.frame=m.frame;
 }
 private add(definition:NpcDefinition,now:number,actors:readonly {position:Vec2;isDead:boolean;radius:number}[]):void{
  const solids=[...this.obstacles,...actors.filter(a=>!a.isDead).map(a=>({x:a.position.x,y:a.position.y,radius:a.radius}))];
  const position=definition.service||definition.task==='repair'?{...definition.position}:safeExpeditionPosition(definition.position,14,solids,this.bounds);if(!position)return;
  const solid=definition.service?undefined:{x:position.x,y:position.y,radius:14};if(solid)this.obstacles.push(solid);
  const props:Person['props']=[];
  const sites=definition.task==='repair'?[{x:position.x+37,y:position.y+2}]:definition.task==='inventory'?[definition.route![0],definition.route!.at(-1)!].map(p=>({x:p.x-42,y:p.y+2})):[];
  for(const site of sites){const image=addQuestProp(this.scene,definition.task==='inventory'?'foodReserve':definition.id==='mara'?'powerCell':'tools',site.x,site.y,53).setDepth(site.y-4).setName('npc-worksite-'+definition.id),footprint={x:site.x,y:site.y-9,radius:13};this.obstacles.push(footprint);props.push({image,solid:footprint});}
  const image=this.scene.add.image(position.x,position.y,'life-'+definition.id,0).setName(definition.id==='mara'||definition.id==='tomas'?'permanence-resident-'+definition.name:'living-npc-'+definition.id);
  const shadow=this.scene.add.image(position.x,position.y,'world-shadow','ground-contact').setDisplaySize(definition.service?46:35,11).setAlpha(.48);
  const textStyle={fontFamily:'Barlow Condensed',fontSize:'14px',color:'#dddac2',stroke:'#18261c',strokeThickness:3};
  const label=this.scene.add.text(0,0,definition.name+' · '+definition.role,textStyle).setOrigin(.5).setDepth(11000);
  const speech=this.scene.add.text(0,0,definition.text??'',{...textStyle,fontSize:'15px',wordWrap:{width:255},backgroundColor:'#13221de8',padding:{x:10,y:7}}).setOrigin(.5,1).setDepth(11001).setVisible(false);
  const offset=[...definition.id].reduce((h,c)=>h*7+c.charCodeAt(0),0)%10000;
  const motion=new ResidentMotion(offset);if(definition.task==='repair'){motion.mode='work';motion.phase=0;}
  this.people.set(definition.id,{definition,position,image,shadow,label,speech,solid,props,target:1,waitUntil:now+700+offset%900,talkUntil:0,frame:definition.service?0:definition.task==='repair'?12:8,flip:false,motion,presentation:new ResidentPresentation()});
 }
 private draw(p:Person,viewer:Vec2,now:number):void{
  const metadata=(this.scene.cache.json.get('life-frames-r3') as Record<NpcId,ArtMetadata>|undefined)?.[p.definition.id],anchor=metadata?.anchors[p.frame]??{x:.5,y:.94};
  p.image.setFrame(p.frame).setScale(metadata?.scale??.6).setOrigin(p.flip?1-anchor.x:anchor.x,anchor.y).setFlipX(p.flip).setPosition(p.position.x,p.position.y).setDepth(p.position.y+(p.definition.service?20:0));
  p.shadow.setPosition(p.position.x,p.position.y+1).setDepth(p.position.y-2);
  p.label.setPosition(p.position.x,p.position.y-116).setVisible(!p.definition.service&&Math.hypot(viewer.x-p.position.x,viewer.y-p.position.y)<270&&p.talkUntil<=now);
  if(p.definition.id==='mara'){const text=this.signalRecorded?SIGNAL_MARA_TEXT:p.definition.text??'';if(p.speech.text!==text)p.speech.setText(text);}
  p.speech.setPosition(p.position.x,p.position.y-121).setVisible(p.talkUntil>now);
  if(p.solid){p.solid.x=p.position.x;p.solid.y=p.position.y;}
 }
 greetingAt(position:Vec2){const found=[...this.people.values()].filter(p=>!p.definition.service&&Math.hypot(position.x-p.position.x,position.y-p.position.y)<82).sort((a,b)=>Math.hypot(position.x-a.position.x,position.y-a.position.y)-Math.hypot(position.x-b.position.x,position.y-b.position.y))[0]?.definition;return found&&this.signalRecorded&&found.id==='mara'?{...found,text:SIGNAL_MARA_TEXT}:found;}
 greet(id:NpcId,now:number):void{const p=this.people.get(id);if(p){p.talkUntil=now+3000;p.waitUntil=Math.max(p.waitUntil,p.talkUntil+500);}}
 snapshot():NpcPose[]{return [...this.people.values()].map(p=>({id:p.definition.id,x:Math.round(p.position.x*10)/10,y:Math.round(p.position.y*10)/10,frame:p.frame,flip:p.flip,...(p.talkUntil?{talkUntil:p.talkUntil}:{})}));}
 private remove(p:Person):void{for(const o of [p.image,p.shadow,p.label,p.speech,...p.props.map(p=>p.image)])o.destroy();for(const solid of [p.solid,...p.props.map(p=>p.solid)])if(solid){const i=this.obstacles.indexOf(solid);if(i>=0)this.obstacles.splice(i,1);}}
}
