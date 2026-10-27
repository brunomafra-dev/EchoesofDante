import Phaser from 'phaser';
import {PERMANENCE_SITES,type PermanenceSite,type PermanencePose} from '../config/permanence';
import type {Missions} from './Missions';
import type {JourneyArea} from './LocalJourney';
import type {Vec2} from '../utils/math';
import {addSurveyProp} from '../visual/MissionProps';
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
 private lastAt=0;
 private power?:Phaser.GameObjects.Graphics;
 private powerBeat=-1;
 private powered=false;
 constructor(private scene:Phaser.Scene,private area:JourneyArea,private obstacles:Obstacle[],private warn:()=>void=()=>{}){
  for(const site of PERMANENCE_SITES.filter(s=>s.area===area)){
   const image=(site.art==='cargo'?scene.add.image(site.x,site.y,'item-accessory-2').setDisplaySize(34,44).setDepth(site.y-2):site.art==='mineral'||site.art==='record'?scene.add.image(site.x,site.y,site.art==='mineral'?'deep-mineral':'ancient-remnant').setDisplaySize(95,68).setDepth(site.y-2):addSurveyProp(scene,site.art,site.x,site.y)).setName(site.id).setVisible(false);
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
 update(missions:Missions,player:Vec2,now:number,actors:readonly {position:Vec2;isDead:boolean}[]=[],authority=true,remote?:PermanencePose):void{
  this.updateHaul(missions,now,actors,authority,remote);
  for(const {site,image,label}of this.sites){
   const active=['active','ready'].includes(missions.status(site.mission));
   image.setVisible(active&&!missions.has(site.id));
   const near=Math.hypot(player.x-site.x,player.y-site.y)<240;
   label.setVisible(active&&near&&!missions.has(site.id));
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
 }
 private addPowerStation():void{
  if(this.area!=='base'&&this.area!=='terraces')return;
  const x=this.area==='base'?910:1770,y=this.area==='base'?900:770;
  this.scene.add.image(x,y,'field-shelter').setDisplaySize(130,108).setOrigin(.5,1).setDepth(y-2).setName('settlement-power-station');
  this.obstacles.push({x,y:y-24,radius:32});
  const lamp=this.scene.add.graphics().setDepth(y+1);lamp.fillStyle(0xffd898,.12).fillCircle(x+48,y-74,20).fillStyle(0xffdeb1,.8).fillCircle(x+48,y-74,3);
  this.scene.add.text(x,y+20,'REDE ISOLADA',{fontFamily:'Barlow Condensed',fontSize:'14px',color:'#ebd8b6',stroke:'#122123',strokeThickness:3}).setOrigin(.5).setDepth(y+1);
 }
 snapshot():PermanencePose{return this.haul?{haul:{...this.haul.position,kind:'cargo'}}:{};}
 get haulPosition():Vec2|undefined{return this.haul?.position;}
 // The cached minimap describes permanent geometry. Moving cargo stays in
 // physical collision, while its travel never rebakes the static grid.
 get navigationObstacles():readonly Obstacle[]{return this.haul?this.obstacles.filter(o=>o!==this.haul!.solid):this.obstacles;}
 private updateHaul(missions:Missions,now:number,actors:readonly {position:Vec2;isDead:boolean}[],authority:boolean,remote?:PermanencePose):void{
  const dt=Math.min(.04,Math.max(0,(now-this.lastAt)/1000));this.lastAt=now;
  const active=this.area==='terraces'&&missions.has('pt-load')&&!missions.has('pt-deliver')&&missions.status('settle-transport')==='active';
  if(!active){if(this.haul){const i=this.obstacles.indexOf(this.haul.solid);if(i>=0)this.obstacles.splice(i,1);this.haul.image.destroy();this.haul=undefined;}return;}
  const start=remote?.haul??{x:850,y:1070};
  if(!this.haul){const solid={x:start.x,y:start.y,radius:22};this.obstacles.push(solid);this.haul={position:{x:start.x,y:start.y},solid,image:this.scene.add.image(start.x,start.y,'camp-supplies').setDisplaySize(82,51).setOrigin(.5,.75).setName('permanence-haul')};}
  const h=this.haul;
  if(!authority){if(remote?.haul&&Number.isFinite(remote.haul.x)&&Number.isFinite(remote.haul.y))Object.assign(h.position,remote.haul);}
  else{
   const candidates=actors.filter(p=>!p.isDead).map(p=>({p,d:Math.hypot(p.position.x-h.position.x,p.position.y-h.position.y)})).filter(v=>v.d>70&&v.d<280).sort((a,b)=>a.d-b.d),leader=candidates[0];
   if(leader){const dx=leader.p.position.x-h.position.x,dy=leader.p.position.y-h.position.y;moveWithCollisions(h.position,{x:dx/leader.d*165,y:dy/leader.d*165},dt,22,this.obstacles.filter(o=>o!==h.solid),{left:105,right:2490,top:350,bottom:1245});}
  }
  h.solid.x=h.position.x;h.solid.y=h.position.y;h.image.setPosition(h.position.x,h.position.y).setDepth(h.position.y);
 }
 private addDepot():void{
  if(this.area!=='base'&&this.area!=='terraces')return;
  const x=this.area==='base'?650:1780,y=this.area==='base'?900:1160;
  this.scene.add.image(x,y,'camp-supplies').setDisplaySize(140,87).setOrigin(.5,1).setDepth(y-2).setName('settlement-supply-depot');this.obstacles.push({x,y:y-22,radius:30});
  this.scene.add.text(x,y+20,'DEPÓSITO DE SUPRIMENTOS',{fontFamily:'Barlow Condensed',fontSize:'14px',color:'#d9d5af',stroke:'#122123',strokeThickness:3}).setOrigin(.5).setDepth(y+1);
 }
 private addFoodReserve():void{
  if(this.area!=='base'&&this.area!=='terraces')return;
  const x=this.area==='base'?440:2010,y=this.area==='base'?910:1100;
  this.scene.add.image(x,y,'camp-supplies').setDisplaySize(112,70).setOrigin(.5,1).setDepth(y-2).setName('settlement-food-reserve');
  this.obstacles.push({x,y:y-17,radius:25});
  this.scene.add.text(x,y+20,'RESERVA IDENTIFICADA',{fontFamily:'Barlow Condensed',fontSize:'14px',color:'#d9d5af',stroke:'#122123',strokeThickness:3}).setOrigin(.5).setDepth(y+1);
 }
 private addWaterStation():void{
  if(this.area!=='base'&&this.area!=='terraces')return;
  const x=this.area==='base'?200:1950,y=this.area==='base'?570:990;
  this.scene.add.image(x,y,'material-water').setDisplaySize(110,79).setDepth(y-2).setName('settlement-treated-water');
  this.scene.add.image(x+48,y-6,'camp-supplies').setOrigin(.5,1).setDisplaySize(88,55).setDepth(y-3);
  this.obstacles.push({x:x+48,y:y-18,radius:23});
  this.scene.add.text(x,y+48,'ÁGUA TRATADA',{fontFamily:'Barlow Condensed',fontSize:'14px',color:'#b1d5c7',stroke:'#122123',strokeThickness:3}).setOrigin(.5).setDepth(y+1);
 }
 at(position:Vec2,missions:Missions):PermanenceSite|undefined{
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
