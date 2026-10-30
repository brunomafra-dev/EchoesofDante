import Phaser from 'phaser';
import {addQuestProp} from './QuestProps';
import {WIND_SURVEY as C,pushSurvey,surveyDocked,surveyContact,type SurveyPusher} from '../config/windSurvey';
import type {Missions} from '../systems/Missions';
import type {Obstacle} from '../systems/Movement';
import type {Vec2} from '../utils/math';

// Existing whole platform/equipment images. Floor rail and wind strokes are
// baked once; movement, cable and meter only update transforms.
export class WindSurvey{
 private board?:{image:Phaser.GameObjects.Image;position:Vec2;solid:Obstacle};
 private dock?:Phaser.GameObjects.Image;
 private rail?:Phaser.GameObjects.Image;
 private meter?:Phaser.GameObjects.Rectangle;
 private label?:Phaser.GameObjects.Text;
 private dust:Phaser.GameObjects.Image[]=[];
 private at=0;
 private locked=false;
 constructor(private scene:Phaser.Scene,private area:string,private solids:Obstacle[]){
  if(area!=='arid')return;
  if(!scene.textures.exists('wind-survey-floor')){const t=scene.textures.createCanvas('wind-survey-floor',420,190)!;const g=t.context;g.strokeStyle='#b8aa86';g.globalAlpha=.45;g.lineWidth=2;g.setLineDash([8,12]);g.strokeRect(5,5,410,180);g.setLineDash([]);g.beginPath();g.moveTo(50,115);g.lineTo(340,75);g.stroke();t.refresh();}
  if(!scene.textures.exists('wind-survey-dock')){const t=scene.textures.createCanvas('wind-survey-dock',96,72)!;const g=t.context;g.strokeStyle='#d7e0af';g.lineWidth=3;g.beginPath();g.ellipse(48,36,40,25,0,0,Math.PI*2);g.stroke();g.lineWidth=1;g.strokeRect(20,19,56,34);t.refresh();}
  if(!scene.textures.exists('wind-survey-dust')){const t=scene.textures.createCanvas('wind-survey-dust',90,20)!;const g=t.context;const gradient=g.createLinearGradient(0,0,90,0);gradient.addColorStop(0,'#dbbb8600');gradient.addColorStop(.5,'#dbbb86aa');gradient.addColorStop(1,'#dbbb8600');g.fillStyle=gradient;g.fillRect(0,9,90,2);g.fillRect(12,15,66,1);t.refresh();}
  this.rail=scene.add.image(2565,795,'wind-survey-floor').setDepth(-16).setAlpha(.35).setVisible(false).setName('wind-survey-field');
  this.dock=scene.add.image(C.dock.x,C.dock.y+32,'wind-survey-dock').setDepth(-15).setVisible(false).setName('wind-survey-dock');
  this.label=scene.add.text(C.dock.x,C.dock.y+73,'POSIÇÃO PROTEGIDA',{fontFamily:'Barlow Condensed',fontSize:'14px',color:'#e2d8b5',stroke:'#261f15',strokeThickness:3}).setOrigin(.5).setDepth(11000).setVisible(false);
  this.meter=scene.add.rectangle(C.start.x,C.start.y-50,50,4,0xf1c28c).setOrigin(0,.5).setDepth(11000).setVisible(false).setName('wind-survey-meter');
  for(let i=0;i<4;i++)this.dust.push(scene.add.image(C.start.x,C.start.y,'wind-survey-dust').setDepth(-14).setVisible(false));
 }
 update(m:Missions,now:number,actors:readonly SurveyPusher[],authority:boolean,remote?:Vec2):boolean{
  for(const actor of actors)actor.walkSpeedLimit=Infinity;
  const dt=Math.max(0,Math.min(.04,(now-this.at)/1000));this.at=now;if(this.area!=='arid')return false;
  const installed=m.has('pv-mount'),docked=m.has('pv-dock');
  this.locked=docked;
  this.rail?.setVisible(installed);this.dock?.setVisible(installed);this.label?.setVisible(installed&&!docked&&m.current!=='settle-wind');this.meter?.setVisible(installed);
  if(!installed)return false;
  if(!this.board){const position={...(docked?C.dock:C.start)},solid={...position,radius:C.radius};this.solids.push(solid);
   this.board={position,solid,image:addQuestProp(this.scene,'windSled',position.x,position.y+39,96).setDepth(position.y+38).setName('wind-survey-platform')};
  }
  const b=this.board;let completed=false;
  if(docked)Object.assign(b.position,C.dock);
  else if(!authority){if(remote&&Number.isFinite(remote.x)&&Number.isFinite(remote.y)&&remote.x>=C.bounds.left&&remote.x<=C.bounds.right&&remote.y>=C.bounds.top&&remote.y<=C.bounds.bottom)Object.assign(b.position,remote);}
  else if(m.status('settle-wind')==='active'){
   // Match the contact pace so a round character collider does not slide
   // sideways around a slower support. Slow analog input keeps its own speed.
   for(const actor of actors)if(surveyContact(b.position,actor))actor.walkSpeedLimit=C.speed;
   pushSurvey(b.position,actors,dt,this.solids.filter(o=>o!==b.solid));
   if(surveyDocked(b.position)){Object.assign(b.position,C.dock);m.record('pv-dock');this.locked=true;completed=true;}
  }
  Object.assign(b.solid,b.position);b.image.setPosition(b.position.x,b.position.y+39).setDepth(b.position.y+38);
  this.meter?.setPosition(b.position.x-25,b.position.y-48).setScale(docked?1:.2+.45*(.5+.5*Math.sin(now*.012)),1).setFillStyle(docked?0xc7e2ab:0xe5b98b);
  for(const[i,d]of this.dust.entries())d.setVisible(!docked).setPosition(C.start.x+110-((now*.065+i*67)%350),C.start.y-50+i*23).setAlpha(.22);
  return completed;
 }
 get movingSolid():Obstacle|undefined{return this.locked?undefined:this.board?.solid;}
 snapshot():Vec2|undefined{return this.board?{...this.board.position}:undefined;}
}
