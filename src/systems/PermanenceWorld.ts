import Phaser from 'phaser';
import {PERMANENCE_SITES,type PermanenceSite,type PermanencePose} from '../config/permanence';
import {HABITAT,HABITAT_SOLIDS} from '../config/colonization';
import {OUTPOST,OUTPOST_SOLIDS,OUTPOST_SUPPORT} from '../config/outpost';
import {trackEnvironmentOcclusion} from '../visual/EnvironmentArt';
import type {Missions} from './Missions';
import {missionById} from '../config/missions';
import type {JourneyArea} from './LocalJourney';
import type {Vec2} from '../utils/math';
import {addSurveyProp} from '../visual/MissionProps';
import {addQuestProp,GOAL_PROPS} from '../visual/QuestProps';
import {SignalSurvey} from '../visual/SignalSurvey';
import {EchoCircuit} from '../visual/EchoCircuit';
import type {CircuitNode} from '../config/echoCircuit';
import {WindSurvey} from '../visual/WindSurvey';
import type {SurveyPusher} from '../config/windSurvey';
import {moveWithCollisions,type Obstacle} from './Movement';

// Authored chapter interactions share the journal, durable evidence and host
// authority. Static props/pipework are drawn once; pulses only change alpha.
export class PermanenceWorld {
 private sites:{site:PermanenceSite;image:Phaser.GameObjects.Image;label:Phaser.GameObjects.Text}[]=[];
 private jet?:Phaser.GameObjects.Rectangle;
 private installed:Phaser.GameObjects.GameObject[]=[];
 private online=false;
 private stocked=false;
 private supplied=false;
 private haul?:{position:Vec2;solid:Obstacle;image:Phaser.GameObjects.Image};
 private haulLeader?:{actor:{position:Vec2;isDead:boolean};movingAt:number};
 private haulActors=new Map<object,Vec2>();
 private lastAt=0;
 private power?:Phaser.GameObjects.Graphics;
 private powerBeat=-1;
 private powered=false;
 private housed=false;
 private established=false;
 private outpost=false;
 private outpostDepot=false;
 private supportReady=false;
 private signal:SignalSurvey;
 private circuit:EchoCircuit;
 private wind:WindSurvey;
 constructor(private scene:Phaser.Scene,private area:JourneyArea,private obstacles:Obstacle[],private warn:()=>void=()=>{}){
  this.signal=new SignalSurvey(scene,area,obstacles);
  this.circuit=new EchoCircuit(scene,area,obstacles);
  this.wind=new WindSurvey(scene,area,obstacles);
  for(const site of PERMANENCE_SITES.filter(s=>s.area===area)){
   const prop=site.reject&&site.id==='pf-sample'?'contaminatedRoots':GOAL_PROPS[site.id];
   const image=(prop?addQuestProp(scene,prop,site.x,site.y+30,76):prop===null?scene.add.image(site.x,site.y,'quest-research',0).setData('world-only',true):site.art==='mineral'||site.art==='record'?scene.add.image(site.x,site.y,site.art==='mineral'?'deep-mineral':'ancient-remnant').setDisplaySize(95,68).setDepth(site.y-2):addSurveyProp(scene,site.art as Parameters<typeof addSurveyProp>[1],site.x,site.y)).setName(site.id).setVisible(false);
   if(site.choice){
    // Whole existing botanical stamps, tinted only by the observed residue.
    scene.add.image(site.x,site.y-8,'root-growth').setDisplaySize(110,46).setTint(site.reject?0x73a9c4:0xb0bf79).setDepth(-18);
    scene.add.image(site.x-12,site.y-17,'dante-canopy-green').setDisplaySize(82,50).setTint(site.reject?0x719fb8:0xb5c58c).setDepth(-17);
   }
   const label=scene.add.text(site.x,site.y+48,site.name,{fontFamily:'Barlow Condensed',fontSize:'14px',color:'#dfd6b1',stroke:'#14251a',strokeThickness:3}).setOrigin(.5).setDepth(11000).setVisible(false);
   this.sites.push({site,image,label});
  }
  if(area==='springs'){
   const g=scene.add.graphics().setDepth(-20).setVisible(false).setName('water-return-pipe');
   g.lineStyle(10,0x595c4b,.9).beginPath().moveTo(1550,1010).lineTo(1660,1010).lineTo(1660,1070).strokePath();
   this.installed.push(g);
   this.jet=scene.add.rectangle(1550,1010,250,38,0x84d9d2,.65).setDepth(-19).setVisible(false).setName('water-pressure');
  }
  if(area==='terraces'){
   this.power=scene.add.graphics().setPosition(1650,930).setDepth(-18).setVisible(false).setName('settlement-power-front');
   this.power.fillStyle(0xb69af5,.3).lineStyle(3,0xd3c3ff,.95).beginPath().moveTo(0,0).arc(0,0,190,-.42,.42,false).closePath().fillPath().strokePath();
   this.power.fillStyle(0xc4afff,.8).fillCircle(0,0,9).lineStyle(2,0xd3c3ff,.65).strokeCircle(0,0,19);
  }
 }
 update(missions:Missions,player:Vec2,now:number,actors:readonly SurveyPusher[]=[],authority=true,remote?:PermanencePose):'circuit'|'wind'|undefined{
  const circuitCompleted=this.circuit.update(missions,player,now,authority,remote?.circuit);
  const windCompleted=this.wind.update(missions,now,actors,authority,remote?.wind);
  this.signal.update(missions,player,actors[0]?.rotation??0,now);
  this.updateHaul(missions,now,actors,authority,remote);
  for(const {site,image,label}of this.sites){
   const active=['active','ready'].includes(missions.status(site.mission));
   image.setVisible(active&&!missions.has(site.id)&&!site.aimAt&&!site.circuit&&!image.getData('world-only'));
   const near=Math.hypot(player.x-site.x,player.y-site.y)<240;
   const guided=missions.current===site.mission&&missionById(site.mission).goals.find(g=>!missions.has(g.id))?.id===site.id;
   label.setVisible(active&&near&&!missions.has(site.id)&&!site.circuit&&(!guided||!!site.choice)&&site.id!=='pr-read'&&site.id!=='pv-read');
   const ready=!site.needs?.some(id=>!missions.has(id));
   label.setColor(ready?'#dfd6b1':'#a8aaa1');
  }
  const water=missions.status('settle-water')==='active';
  if(this.area==='springs'){
   this.installed.forEach(o=>(o as Phaser.GameObjects.Graphics).setVisible(water||missions.has('pw-valve')));
   const phase=now%3200;
   this.jet?.setVisible(water&&!missions.has('pw-valve')).setAlpha(phase<1100?.12+phase/1100*.18:phase<1800?.7:.06);
  }
  if(missions.has('pw-online')&&!this.online){this.online=true;this.addWaterStation();}
  if(missions.has('pf-stock')&&!this.stocked){this.stocked=true;this.addFoodReserve();}
  if(missions.has('pt-deliver')&&!this.supplied){this.supplied=true;this.addDepot();}
  const powerActive=this.area==='terraces'&&missions.status('settle-energy')==='active'&&!missions.has('pe-isolate'),beat=Math.floor(now/1900),phase=now%1900;
  this.power?.setVisible(powerActive).setRotation(beat%4*Math.PI/2).setAlpha(phase<1000?.12+phase/1000*.28:phase<1550?.9:.04);
  if(powerActive&&beat!==this.powerBeat){this.powerBeat=beat;if(phase<1000&&Math.hypot(player.x-1650,player.y-930)<500)this.warn();}
  if(missions.has('pe-online')&&!this.powered){this.powered=true;this.addPowerStation();}
  if(missions.has('pc-shelter')&&!this.housed){this.housed=true;this.addSecondHabitat();}
  if(missions.has('pc-home')&&!this.established){this.established=true;this.addReception();}
  if(missions.has('po-deliver')&&!this.outpostDepot){this.outpostDepot=true;this.addOutpostDepot();}
  if(missions.has('po-module')&&!this.outpost){this.outpost=true;this.addOutpost();}
  if(this.area==='springs'&&!this.supportReady&&missions.status('settle-outpost')==='completed'){
   this.supportReady=true;this.scene.add.text(OUTPOST_SUPPORT.x,1190,'APOIO · CURA E COFRE',{fontFamily:'Barlow Condensed',fontSize:'15px',color:'#d4dfc4',stroke:'#14251a',strokeThickness:3}).setOrigin(.5).setDepth(11000).setName('outpost-support-sign');
  }
  return windCompleted?'wind':circuitCompleted?'circuit':undefined;
 }
 private addOutpostDepot():void{
  if(this.area!=='springs')return;
  addQuestProp(this.scene,'supplyRack',2040,1155,100).setName('outpost-depot');
  this.obstacles.push({x:2040,y:1135,radius:26});
 }
 private addOutpost():void{
  if(this.area!=='springs')return;
  const building=this.scene.add.image(OUTPOST.x,OUTPOST.y,'first-habitat').setDisplaySize(OUTPOST.width,OUTPOST.height).setOrigin(.5,1).setDepth(OUTPOST.y-20).setName('outpost-habitat');trackEnvironmentOcclusion(this.scene,building);
  this.obstacles.push(...OUTPOST_SOLIDS.map(o=>({...o})));
  this.scene.add.text(OUTPOST.x,OUTPOST.y+30,OUTPOST.name.toLocaleUpperCase('pt-BR'),{fontFamily:'Barlow Condensed',fontSize:'16px',color:'#dfd5b5',stroke:'#14251a',strokeThickness:3}).setOrigin(.5).setDepth(11000).setName('outpost-name');
  // The same prefab carries a sealed reservoir and canopy. Independent power
  // is represented with the existing whole regulator asset, not ancient tech.
  addQuestProp(this.scene,'powerCell',1990,939,63).setName('outpost-regulator');
 }
 private addSecondHabitat():void{
  if(this.area!=='terraces')return;
  const x=550,y=635,width=280,height=198;
  const building=this.scene.add.image(x,y,'first-habitat').setDisplaySize(width,height).setOrigin(.5,1).setDepth(y-20).setName('settlement-second-habitat');trackEnvironmentOcclusion(this.scene,building);
  for(const o of HABITAT_SOLIDS)this.obstacles.push({x:x+(o.x-HABITAT.x)*width/HABITAT.width,y:y+(o.y-HABITAT.y)*height/HABITAT.height,radius:o.radius*width/HABITAT.width});
 }
 private addReception():void{
  if(this.area!=='base')return;
  addQuestProp(this.scene,'manifest',1120,640,72).setName('settlement-arrival-manifest');this.obstacles.push({x:1120,y:624,radius:22});
  this.scene.add.text(1120,665,'SEGUNDA EQUIPE EM TERRA',{fontFamily:'Barlow Condensed',fontSize:'14px',color:'#d4dac0',stroke:'#14251a',strokeThickness:3}).setOrigin(.5).setDepth(11000);
 }
 private addPowerStation():void{
  if(this.area!=='base'&&this.area!=='terraces')return;
  const x=this.area==='base'?910:1770,y=this.area==='base'?900:770;
  const building=addQuestProp(this.scene,'worklight',x,y,112).setName('settlement-power-station');trackEnvironmentOcclusion(this.scene,building);
  this.obstacles.push({x,y:y-24,radius:32});
  const lamp=this.scene.add.graphics().setDepth(y+1);lamp.fillStyle(0xffd898,.12).fillCircle(x+48,y-74,20).fillStyle(0xffdeb1,.8).fillCircle(x+48,y-74,3);
  this.scene.add.text(x,y+20,'REDE ISOLADA',{fontFamily:'Barlow Condensed',fontSize:'14px',color:'#ebd8b6',stroke:'#122123',strokeThickness:3}).setOrigin(.5).setDepth(y+1);
 }
 snapshot():PermanencePose{return{...(this.haul?{haul:{...this.haul.position,kind:'cargo' as const}}:{}),circuit:this.circuit.snapshot(),wind:this.wind.snapshot()};}
 interactCircuit(node:CircuitNode,missions:Missions,now:number):string{return this.circuit.interact(node,missions,now);}
 get haulPosition():Vec2|undefined{return this.haul?.position;}
 // The cached minimap describes permanent geometry. Moving cargo stays in
 // physical collision, while its travel never rebakes the static grid.
 get navigationObstacles():readonly Obstacle[]{const wind=this.wind.movingSolid;return this.haul||wind?this.obstacles.filter(o=>o!==this.haul?.solid&&o!==wind):this.obstacles;}
 private updateHaul(missions:Missions,now:number,actors:readonly {position:Vec2;isDead:boolean}[],authority:boolean,remote?:PermanencePose):void{
  const dt=Math.min(.04,Math.max(0,(now-this.lastAt)/1000));this.lastAt=now;
  const outpost=this.area==='springs',load=outpost?'po-load':'pt-load',deliver=outpost?'po-deliver':'pt-deliver',mission=outpost?'settle-outpost':'settle-transport';
  const active=(outpost||this.area==='terraces')&&missions.has(load)&&!missions.has(deliver)&&missions.status(mission)==='active';
  if(!active){if(this.haul){const i=this.obstacles.indexOf(this.haul.solid);if(i>=0)this.obstacles.splice(i,1);this.haul.image.destroy();this.haul=undefined;}this.haulLeader=undefined;this.haulActors.clear();return;}
  const start=remote?.haul??(outpost?{x:480,y:1080}:{x:850,y:1070});
  if(!this.haul){const solid={x:start.x,y:start.y,radius:22};this.obstacles.push(solid);this.haul={position:{x:start.x,y:start.y},solid,image:addQuestProp(this.scene,'cargoSled',start.x,start.y+25,90).setOrigin(.5,.65).setName('permanence-haul')};}
  const h=this.haul;
  if(!authority){if(remote?.haul&&Number.isFinite(remote.haul.x)&&Number.isFinite(remote.haul.y))Object.assign(h.position,remote.haul);}
  else{
   // A nearby idle ally must not pull the load back from its moving guide.
   // Keep the guide until another actor moves nearby or the leash breaks.
   const candidates=actors.filter(p=>!p.isDead).map(p=>{const previous=this.haulActors.get(p);return{p,d:Math.hypot(p.position.x-h.position.x,p.position.y-h.position.y),moving:!!previous&&Math.hypot(p.position.x-previous.x,p.position.y-previous.y)>.1}}).filter(v=>v.d<280);
   for(const actor of actors)this.haulActors.set(actor,{...actor.position});
   let leader=candidates.find(c=>c.p===this.haulLeader?.actor);
   if(leader?.moving)this.haulLeader!.movingAt=now;
   if(!leader||now-(this.haulLeader?.movingAt??0)>350){const next=candidates.filter(c=>c.moving&&c.d>70).sort((a,b)=>a.d-b.d)[0];if(next){leader=next;this.haulLeader={actor:next.p,movingAt:now};}else if(!leader)this.haulLeader=undefined;}
   if(leader&&leader.d>70){const dx=leader.p.position.x-h.position.x,dy=leader.p.position.y-h.position.y;moveWithCollisions(h.position,{x:dx/leader.d*165,y:dy/leader.d*165},dt,22,this.obstacles.filter(o=>o!==h.solid),{left:105,right:2490,top:350,bottom:1245});}
  }
  h.solid.x=h.position.x;h.solid.y=h.position.y;h.image.setPosition(h.position.x,h.position.y).setDepth(h.position.y);
 }
 private addDepot():void{
  if(this.area!=='base'&&this.area!=='terraces')return;
  const x=this.area==='base'?650:1780,y=this.area==='base'?900:1160;
  addQuestProp(this.scene,'supplyRack',x,y,110).setName('settlement-supply-depot');this.obstacles.push({x,y:y-22,radius:30});
  this.scene.add.text(x,y+20,'DEPÓSITO DE SUPRIMENTOS',{fontFamily:'Barlow Condensed',fontSize:'14px',color:'#d9d5af',stroke:'#122123',strokeThickness:3}).setOrigin(.5).setDepth(y+1);
 }
 private addFoodReserve():void{
  if(this.area!=='base'&&this.area!=='terraces')return;
  const x=this.area==='base'?440:2010,y=this.area==='base'?910:1100;
  addQuestProp(this.scene,'foodReserve',x,y,90).setName('settlement-food-reserve');
  this.obstacles.push({x,y:y-17,radius:25});
  this.scene.add.text(x,y+20,'RESERVA IDENTIFICADA',{fontFamily:'Barlow Condensed',fontSize:'14px',color:'#d9d5af',stroke:'#122123',strokeThickness:3}).setOrigin(.5).setDepth(y+1);
 }
 private addWaterStation():void{
  if(this.area!=='base'&&this.area!=='terraces')return;
  const x=this.area==='base'?200:1950,y=this.area==='base'?570:990;
  this.scene.add.image(x,y,'material-water').setDisplaySize(110,79).setDepth(y-2).setName('settlement-treated-water');
  addQuestProp(this.scene,'sealedWater',x+48,y-6,78);
  this.obstacles.push({x:x+48,y:y-18,radius:23});
  this.scene.add.text(x,y+48,'ÁGUA TRATADA',{fontFamily:'Barlow Condensed',fontSize:'14px',color:'#b1d5c7',stroke:'#122123',strokeThickness:3}).setOrigin(.5).setDepth(y+1);
 }
 at(position:Vec2,missions:Missions):PermanenceSite|undefined{
  const circuit=this.circuit.at(position,missions);if(circuit)return circuit;
  const site=this.sites.map(s=>s.site).find(s=>missions.status(s.mission)==='active'&&!missions.has(s.id)&&!s.needs?.some(id=>!missions.has(id))&&Math.hypot(position.x-s.x,position.y-s.y)<s.radius);
  if(site?.haul&&(!this.haul||Math.hypot(this.haul.position.x-site.x,this.haul.position.y-site.y)>105))return{...site,reject:'A carga ainda não chegou. Volte ao estrado e conduza-o para perto do depósito.'};
  return site;
 }
 pressureAt(position:Vec2,missions:Missions,now:number):boolean{
  return this.area==='springs'&&missions.status('settle-water')==='active'&&!missions.has('pw-valve')&&now%3200>=1100&&now%3200<1800&&Math.abs(position.x-1550)<135&&Math.abs(position.y-1010)<32;
 }
 hazardAt(position:Vec2,missions:Missions,now:number):{position:Vec2;damage:number}|undefined{
  if(this.pressureAt(position,missions,now))return{position:{x:1550,y:1010},damage:18};
  if(this.area!=='terraces'||missions.status('settle-energy')!=='active'||missions.has('pe-isolate')||now%1900<1000||now%1900>=1550)return;
  const dx=position.x-1650,dy=position.y-930,d=Math.hypot(dx,dy),angle=Math.atan2(dy,dx)-Math.floor(now/1900)%4*Math.PI/2;
  if(d<208&&(d<18||Math.abs(Math.atan2(Math.sin(angle),Math.cos(angle)))<.42+Math.asin(Math.min(1,18/d))))return{position:{x:1650,y:930},damage:22};
 }
}
