import Phaser from 'phaser';
import {addQuestProp} from './QuestProps';
import {SIGNAL_LOG,SIGNAL_RECEIVER,signalAligned} from '../config/signalExpedition';
import type {Missions} from '../systems/Missions';
import type {JourneyArea} from '../systems/LocalJourney';
import type {Obstacle} from '../systems/Movement';
import type {Vec2} from '../utils/math';

// Existing whole equipment art. Cached light pieces only change transforms;
// neither the approved ground nor the old landmark is repainted.
export class SignalSurvey{
 private case?:Phaser.GameObjects.Image;
 private ray?:Phaser.GameObjects.Image;
 private target?:Phaser.GameObjects.Image;
 private label?:Phaser.GameObjects.Text;
 private archived=false;
 private placed=false;
 private archiveLabel?:Phaser.GameObjects.Text;
 private compared=false;
 constructor(private scene:Phaser.Scene,private area:JourneyArea,private obstacles:Obstacle[]){
  if(!scene.textures.exists('signal-survey-light')){const t=scene.textures.createCanvas('signal-survey-light',64,8)!;const g=t.context.createLinearGradient(0,0,0,8);g.addColorStop(0,'#b2e4db00');g.addColorStop(.5,'#b2e4db');g.addColorStop(1,'#b2e4db00');t.context.fillStyle=g;t.context.fillRect(0,0,64,8);t.refresh();}
  if(area==='valley'){
   const{x,y,target}=SIGNAL_RECEIVER;
   this.case=addQuestProp(scene,'receiver',x+50,y+42,88).setVisible(false).setName('signal-receiver-case');

   this.ray=scene.add.image(x+50,y-10,'signal-survey-light').setOrigin(0,.5).setDisplaySize(480,5).setDepth(10999).setVisible(false).setName('signal-aim');
   this.target=scene.add.image(target.x,target.y,'deep-mineral').setDisplaySize(44,38).setTint(0xc9e6d4).setDepth(target.y+2).setVisible(false).setName('signal-target');
   this.label=scene.add.text(target.x,target.y+38,'NERVURA · PULSO LONGO',{fontFamily:'Barlow Condensed',fontSize:'14px',color:'#cde2d0',stroke:'#14251a',strokeThickness:3}).setOrigin(.5).setDepth(11000).setVisible(false);
  }
 }
 update(m:Missions,player:Vec2,aim:number,now:number):void{
  const active=m.status('settle-signal')==='active',reading=active&&m.has('ps-ridge')&&!m.has('ps-align'),near=Math.hypot(player.x-SIGNAL_RECEIVER.x,player.y-SIGNAL_RECEIVER.y)<SIGNAL_RECEIVER.radius;
  const installed=m.has('ps-ridge');this.case?.setVisible(installed);
  if(this.area==='valley'&&installed&&!this.placed){this.placed=true;this.obstacles.push({x:SIGNAL_RECEIVER.x+50,y:SIGNAL_RECEIVER.y+15,radius:18},{...SIGNAL_RECEIVER.target,radius:16});}
  this.target?.setVisible(installed).setAlpha(reading?.65+.25*Math.sin(now*.003):1);this.label?.setVisible(reading);
  this.ray?.setVisible(reading&&near).setRotation(aim).setTint(signalAligned(player,aim)?0xd7edb5:0xa6c8d3).setAlpha(.4);
  if(this.area==='springs'&&m.has('ps-record')&&!this.archived){
   this.archived=true;const x=SIGNAL_LOG.x+10,y=SIGNAL_LOG.y+75;
   addQuestProp(this.scene,'archive',x,y,78).setName('signal-archive-case');

   this.obstacles.push({x,y:y-18,radius:18});
   this.archiveLabel=this.scene.add.text(x,y+22,'REGISTRO ISOLADO',{fontFamily:'Barlow Condensed',fontSize:'14px',color:'#cde2d0',stroke:'#14251a',strokeThickness:3}).setOrigin(.5).setDepth(11000).setName('signal-archive-label');
  }
  if(this.archiveLabel&&m.has('pv-store')&&!this.compared){this.compared=true;this.archiveLabel.setText('FREQUÊNCIA E VENTO');}
 }
}
