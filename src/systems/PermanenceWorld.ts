import Phaser from 'phaser';
import {PERMANENCE_SITES,type PermanenceSite} from '../config/permanence';
import type {Missions} from './Missions';
import type {JourneyArea} from './LocalJourney';
import type {Vec2} from '../utils/math';
import {addSurveyProp} from '../visual/MissionProps';
import type {Obstacle} from './Movement';

// Authored chapter interactions share the journal, durable evidence and host
// authority. Static props/pipework are drawn once; pulses only change alpha.
export class PermanenceWorld {
 private sites:{site:PermanenceSite;image:Phaser.GameObjects.Image;label:Phaser.GameObjects.Text}[]=[];
 private jet?:Phaser.GameObjects.Rectangle;
 private installed:Phaser.GameObjects.GameObject[]=[];
 private online=false;
 private stocked=false;
 constructor(private scene:Phaser.Scene,private area:JourneyArea,private obstacles:Obstacle[]){
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
 }
 update(missions:Missions,player:Vec2,now:number):void{
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
  return this.sites.map(s=>s.site).find(s=>missions.status(s.mission)==='active'&&!missions.has(s.id)&&!s.needs?.some(id=>!missions.has(id))&&Math.hypot(position.x-s.x,position.y-s.y)<s.radius);
 }
 pressureAt(position:Vec2,missions:Missions,now:number):boolean{
  return this.area==='springs'&&missions.status('settle-water')==='active'&&!missions.has('pw-valve')&&now%3200>=1100&&now%3200<1800&&Math.abs(position.x-1550)<135&&Math.abs(position.y-1010)<32;
 }
}
