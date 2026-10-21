import Phaser from 'phaser';
import {BASE} from '../config/base';
import {SURVEY_POINTS,missionById,type MissionNpc} from '../config/missions';
import type {Missions} from '../systems/Missions';
import type {Vec2} from '../utils/math';

// Fixed, bounded world markers. Raster roots use the existing environment family.
export class MissionWorld{
 private npc=new Map<MissionNpc,Phaser.GameObjects.Text>();
 private sites:{id:'water'|'biology';image:Phaser.GameObjects.Image;label:Phaser.GameObjects.Text}[]=[];
 constructor(scene:Phaser.Scene,area:string){
  if(area==='base')for(const service of BASE.services){
   this.npc.set(service.id,scene.add.text(service.x,service.y-120,'!',{fontFamily:'Barlow Condensed',fontSize:'29px',fontStyle:'bold',color:'#ffbd54',stroke:'#091610',strokeThickness:4}).setOrigin(.5).setDepth(11001));
  }
  if(area==='forest')for(const p of SURVEY_POINTS)if(p.kind==='scan'){
   scene.add.image(p.x,p.y+10,'world-shadow','ground-contact').setDisplaySize(90,28).setAlpha(.55).setDepth(p.y-3);
   const image=scene.add.image(p.x,p.y,'root-growth').setDisplaySize(105,30).setOrigin(.5,.8).setDepth(p.y-2);
   const label=scene.add.text(p.x,p.y+28,'◇ '+p.name,{fontFamily:'Barlow Condensed',fontSize:'14px',color:'#f2d7a3',stroke:'#091610',strokeThickness:3}).setOrigin(.5).setDepth(11000).setVisible(false);
   this.sites.push({id:p.id,image,label});
  }
 }
 update(missions:Missions,position:Vec2):void{
  const guided=missions.current==='survival'?missionById('survival').goals.find(g=>!missions.has(g.id))?.id:undefined;
  for(const[id,label]of this.npc){const state=missions.npcState(id);label.setVisible(!!state);if(state)label.setText(state==='ready'?'✓':'!').setColor(state==='ready'?'#9bd58e':'#ffbd54');}
  for(const site of this.sites){const near=Math.hypot(position.x-site.image.x,position.y-site.image.y)<230;
   const active=['active','ready'].includes(missions.status('survival'));
   site.label.setVisible(active&&near&&site.id!==guided);site.label.setColor(missions.has(site.id)?'#9bd58e':'#f2d7a3');}
 }
}
