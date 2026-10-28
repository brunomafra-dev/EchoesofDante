import Phaser from 'phaser';
import {BASE_WORKERS,NPC_SHEETS,SECOND_SETTLERS,firstSettlers,type NpcDefinition,type NpcId,type NpcPose} from '../config/settlementLife';
import type {JourneyArea} from './LocalJourney';
import type {Missions} from './Missions';
import type {Vec2} from '../utils/math';
import {moveWithCollisions,type MovementBounds,type Obstacle} from './Movement';
import {safeExpeditionPosition} from './ExpeditionReturn';

export function preloadSettlementLife(scene:Phaser.Scene):void{
 for(const[id,file]of Object.entries(NPC_SHEETS))if(!scene.textures.exists('life-'+id))scene.load.spritesheet('life-'+id,`${import.meta.env.BASE_URL}assets/settlement-life/${file}.webp`,{frameWidth:256,frameHeight:256});
 if(!scene.cache.json.exists('life-frames'))scene.load.json('life-frames',`${import.meta.env.BASE_URL}assets/settlement-life/frames.json`);
}
type Person={definition:NpcDefinition;position:Vec2;image:Phaser.GameObjects.Image;shadow:Phaser.GameObjects.Image;label:Phaser.GameObjects.Text;speech:Phaser.GameObjects.Text;solid?:Obstacle;target:number;waitUntil:number;talkUntil:number;frame:number;flip:boolean};
type ArtMetadata={scale:number;anchors:{x:number;y:number}[]};

// Whole painted animation frames. Only residents move; mission services keep
// their original interaction anchors. Dynamic footprints never rebake the map.
export class SettlementLife{
 private people=new Map<NpcId,Person>();
 private lastAt=0;
 private garden=false;
 constructor(private scene:Phaser.Scene,private area:JourneyArea,private obstacles:Obstacle[],private bounds:MovementBounds,private warden:()=>boolean){
  if(area==='base')for(const d of BASE_WORKERS){this.obstacles.push({x:d.position.x+42,y:d.position.y+7,radius:24});this.scene.add.image(d.position.x+42,d.position.y+12,'world-shadow','ground-contact').setDisplaySize(72,17).setAlpha(.32).setDepth(d.position.y-3);}
 }
 navigationObstacles(obstacles:readonly Obstacle[]):readonly Obstacle[]{const moving=new Set([...this.people.values()].map(p=>p.solid).filter(Boolean));return obstacles.filter(o=>!moving.has(o));}
 update(missions:Missions,viewer:Vec2,now:number,actors:readonly {position:Vec2;isDead:boolean;radius:number}[],authority:boolean,remote?:readonly NpcPose[]):void{
  const dt=Math.min(.04,Math.max(0,(now-this.lastAt)/1000));this.lastAt=now;
  const settled=missions.has('shelter-built');
  if(this.area==='terraces'&&settled&&!this.garden){this.garden=true;
   this.scene.add.image(2330,1050,'root-growth').setDisplaySize(100,32).setDepth(-17).setTint(0xa6b28a).setName('settlement-nave-seedlings');
   this.scene.add.image(2330,1034,'dante-canopy-green').setDisplaySize(72,33).setDepth(-16).setTint(0xa7bb86);
  }
  const desired:readonly NpcDefinition[]=this.area==='base'?[...BASE_WORKERS,...(this.warden()&&!settled?firstSettlers(true):[])]:this.area==='terraces'?[...(settled?firstSettlers(false):[]),...(missions.has('pc-receive')?SECOND_SETTLERS:[])]:[];
  for(const[id,p]of this.people)if(!desired.some(d=>d.id===id)){this.remove(p);this.people.delete(id);}
  for(const definition of desired)if(!this.people.has(definition.id))this.add(definition,now,authority?actors:[]);
  for(const p of this.people.values()){
   if(!authority){const pose=remote?.find(r=>r.id===p.definition.id);if(pose&&[pose.x,pose.y].every(Number.isFinite)&&pose.x>=this.bounds.left&&pose.x<=this.bounds.right&&pose.y>=this.bounds.top&&pose.y<=this.bounds.bottom){p.position.x=pose.x;p.position.y=pose.y;p.frame=Number.isInteger(pose.frame)&&pose.frame>=0&&pose.frame<6?pose.frame:0;p.flip=pose.flip===true;p.talkUntil=Number.isFinite(pose.talkUntil)?Math.min(now+3500,pose.talkUntil!):0;}}
   else if(p.definition.service){const beats=[1400,450,350,180,180,800];let phase=(now+BASE_WORKERS.findIndex(d=>d.id===p.definition.id)*870)%3360;p.frame=0;for(let i=0;i<beats.length;i++){if(phase<beats[i]){p.frame=i;break}phase-=beats[i];}}
   else if(p.waitUntil>now||p.talkUntil>now){p.frame=p.talkUntil>now?0:4+Math.floor(now/650)%2;if(p.definition.id==='elisa'&&this.area==='terraces'&&p.talkUntil<=now)p.flip=p.position.x>2330;}
   else{
    const route=p.definition.route!,target=route[p.target],dx=target.x-p.position.x,dy=target.y-p.position.y,d=Math.hypot(dx,dy);
    if(d<9){p.target=(p.target+1)%route.length;p.waitUntil=now+4500+(p.target%2)*1300;p.frame=4;}
    else{
     if(Math.abs(dx)>3)p.flip=dx<0;
     const before={...p.position},solids=this.obstacles.filter(o=>o!==p.solid);
     for(const a of actors)if(!a.isDead)solids.push({x:a.position.x,y:a.position.y,radius:a.radius});
     moveWithCollisions(p.position,{x:dx/d*34,y:dy/d*34},dt,14,solids,this.bounds);
     p.frame=Math.hypot(p.position.x-before.x,p.position.y-before.y)>.05?Math.floor(now/180)%4:4;
    }
   }
   this.draw(p,viewer,now);
  }
 }
 private add(definition:NpcDefinition,now:number,actors:readonly {position:Vec2;isDead:boolean;radius:number}[]):void{
  const solids=[...this.obstacles,...actors.filter(a=>!a.isDead).map(a=>({x:a.position.x,y:a.position.y,radius:a.radius}))];
  const position=definition.service?{...definition.position}:safeExpeditionPosition(definition.position,14,solids,this.bounds);if(!position)return;
  const solid=definition.service?undefined:{x:position.x,y:position.y,radius:14};if(solid)this.obstacles.push(solid);
  const image=this.scene.add.image(position.x,position.y,'life-'+definition.id,0).setName(definition.id==='mara'||definition.id==='tomas'?'permanence-resident-'+definition.name:'living-npc-'+definition.id);
  const shadow=this.scene.add.image(position.x,position.y,'world-shadow','ground-contact').setDisplaySize(definition.service?46:35,11).setAlpha(.48);
  const textStyle={fontFamily:'Barlow Condensed',fontSize:'14px',color:'#dddac2',stroke:'#18261c',strokeThickness:3};
  const label=this.scene.add.text(0,0,definition.name+' · '+definition.role,textStyle).setOrigin(.5).setDepth(11000);
  const speech=this.scene.add.text(0,0,definition.text??'',{...textStyle,fontSize:'15px',wordWrap:{width:255},backgroundColor:'#13221de8',padding:{x:10,y:7}}).setOrigin(.5,1).setDepth(11001).setVisible(false);
  this.people.set(definition.id,{definition,position,image,shadow,label,speech,solid,target:1,waitUntil:now+1800,talkUntil:0,frame:0,flip:false});
 }
 private draw(p:Person,viewer:Vec2,now:number):void{
  const metadata=(this.scene.cache.json.get('life-frames') as Record<NpcId,ArtMetadata>|undefined)?.[p.definition.id],anchor=metadata?.anchors[p.frame]??{x:.5,y:.94};
  p.image.setFrame(p.frame).setScale(metadata?.scale??.6).setOrigin(p.flip?1-anchor.x:anchor.x,anchor.y).setFlipX(p.flip).setPosition(p.position.x,p.position.y).setDepth(p.position.y+(p.definition.service?20:0));
  p.shadow.setPosition(p.position.x,p.position.y+1).setDepth(p.position.y-2);
  p.label.setPosition(p.position.x,p.position.y-116).setVisible(!p.definition.service&&Math.hypot(viewer.x-p.position.x,viewer.y-p.position.y)<270&&p.talkUntil<=now);
  p.speech.setPosition(p.position.x,p.position.y-121).setVisible(p.talkUntil>now);
  if(p.solid){p.solid.x=p.position.x;p.solid.y=p.position.y;}
 }
 greetingAt(position:Vec2){return [...this.people.values()].filter(p=>!p.definition.service&&Math.hypot(position.x-p.position.x,position.y-p.position.y)<82).sort((a,b)=>Math.hypot(position.x-a.position.x,position.y-a.position.y)-Math.hypot(position.x-b.position.x,position.y-b.position.y))[0]?.definition;}
 greet(id:NpcId,now:number):void{const p=this.people.get(id);if(p){p.talkUntil=now+3000;p.waitUntil=Math.max(p.waitUntil,p.talkUntil+500);}}
 snapshot():NpcPose[]{return [...this.people.values()].map(p=>({id:p.definition.id,x:Math.round(p.position.x*10)/10,y:Math.round(p.position.y*10)/10,frame:p.frame,flip:p.flip,...(p.talkUntil?{talkUntil:p.talkUntil}:{})}));}
 private remove(p:Person):void{for(const o of [p.image,p.shadow,p.label,p.speech])o.destroy();if(p.solid){const i=this.obstacles.indexOf(p.solid);if(i>=0)this.obstacles.splice(i,1);}}
}
