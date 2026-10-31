import Phaser from 'phaser';
import {ICE_TRANSFER as C,cargoWet,iceDocked,pushIceTransfer} from '../config/iceTransfer';
import {surveyContact,type SurveyPusher} from '../config/windSurvey';
import type {Missions} from '../systems/Missions';
import type {Obstacle} from '../systems/Movement';
import type {Vec2} from '../utils/math';
import type {PermanenceSite} from '../config/permanence';
import {addQuestProp} from './QuestProps';

export class IceTransfer{
 private cargo?:{position:Vec2;solid:Obstacle;image:Phaser.GameObjects.Image};
 private field?:Phaser.GameObjects.Image;
 private dock?:Phaser.GameObjects.Image;
 private label?:Phaser.GameObjects.Text;
 private lastAt=0;
 private wetUntil=0;
 private locked=false;
 constructor(private scene:Phaser.Scene,private area:string,private solids:Obstacle[]){
  if(area!=='icecave')return;
  if(!scene.textures.exists('ice-transfer-film')){
   const t=scene.textures.createCanvas('ice-transfer-film',256,128)!,g=t.context;
   const light=g.createRadialGradient(128,64,10,128,64,120);light.addColorStop(0,'#9bbfc64a');light.addColorStop(1,'#527f8900');g.fillStyle=light;g.fillRect(0,0,256,128);g.strokeStyle='#a8ccd34a';g.lineWidth=1;
   for(let i=0;i<6;i++){g.beginPath();g.ellipse(35+i*38,60+(i%2)*20,40,8,-.1,0,Math.PI*2);g.stroke();}t.refresh();
  }
  if(!scene.textures.exists('ice-transfer-dock')){
   const t=scene.textures.createCanvas('ice-transfer-dock',100,70)!,g=t.context;g.strokeStyle='#cbd8bb';g.lineWidth=2;g.setLineDash([8,6]);g.beginPath();g.ellipse(50,35,43,25,0,0,Math.PI*2);g.stroke();g.setLineDash([]);g.beginPath();g.moveTo(20,25);g.lineTo(75,25);g.moveTo(20,45);g.lineTo(75,45);g.stroke();t.refresh();
  }
  const w=C.wet;this.field=scene.add.image((w.left+w.right)/2,(w.top+w.bottom)/2,'ice-transfer-film').setDisplaySize(w.right-w.left,w.bottom-w.top).setDepth(-15).setVisible(false).setName('ice-transfer-film');
  this.dock=scene.add.image(C.dock.x,C.dock.y+30,'ice-transfer-dock').setDepth(-14).setVisible(false).setName('ice-transfer-dock');
  this.label=scene.add.text(C.start.x,C.start.y+70,'',{fontFamily:'Barlow Condensed',fontSize:'14px',color:'#dce2c7',stroke:'#17272d',strokeThickness:3}).setOrigin(.5).setDepth(11000).setVisible(false).setName('ice-transfer-label');
 }
 update(m:Missions,now:number,actors:readonly SurveyPusher[],authority:boolean,remote?:Vec2):boolean{
  const dt=Math.max(0,Math.min(.04,(now-this.lastAt)/1000));this.lastAt=now;if(this.area!=='icecave')return false;
  const loaded=m.has('pi-load'),docked=m.has('pi-dock');this.locked=docked;
  const visible=m.has('pi-kit')&&(m.status('settle-icecave')==='active'||loaded);
  this.field?.setVisible(visible);this.dock?.setVisible(visible);
  if(!visible)return false;
  if(!this.cargo){const position={...(docked?C.dock:C.start)},solid={...position,radius:C.radius};this.solids.push(solid);this.cargo={position,solid,image:addQuestProp(this.scene,'iceSled',position.x,position.y+36,112).setDepth(position.y+3).setName('ice-transfer-cargo')};}
  const c=this.cargo;let completed=false;
  if(docked)Object.assign(c.position,C.dock);
  else if(!authority){if(remote&&[remote.x,remote.y].every(Number.isFinite)&&remote.x>=C.bounds.left&&remote.x<=C.bounds.right&&remote.y>=C.bounds.top&&remote.y<=C.bounds.bottom&&!cargoWet(remote))Object.assign(c.position,remote);}
  else if(loaded&&m.status('settle-icecave')==='active'){
   for(const actor of actors)if(surveyContact(c.position,actor))actor.walkSpeedLimit=C.speed;
   if(pushIceTransfer(c.position,actors,dt,this.solids.filter(o=>o!==c.solid))==='wet')this.wetUntil=now+400;
   if(iceDocked(c.position)){Object.assign(c.position,C.dock);m.record('pi-dock');this.locked=true;completed=true;}
  }
  Object.assign(c.solid,c.position);c.image.setPosition(c.position.x,c.position.y+36).setDepth(c.position.y+3);
  const near=actors.some(a=>!a.isDead&&Math.hypot(a.position.x-c.position.x,a.position.y-c.position.y)<250);
  this.label?.setPosition(c.position.x,c.position.y+65).setVisible(near&&!docked).setText(!loaded?'CARGA RESERVADA':now<this.wetUntil?'PATINS SEM APOIO · DEGELO':'CARGA TÉRMICA · EMPURRE');
  return completed;
 }
 at(p:Vec2,m:Missions):PermanenceSite|undefined{
  if(this.area!=='icecave'||m.status('settle-icecave')!=='active'||!m.has('pi-load')||m.has('pi-dock')||Math.hypot(p.x-C.reset.x,p.y-C.reset.y)>62)return;
  return{id:'pi-load',mission:'settle-icecave',area:'icecave',...C.reset,radius:62,name:'Recolher o estrado ao apoio',art:'cargo',action:'RECOLHER CARGA',finding:'',recoverIce:true};
 }
 recover(m:Missions):string{if(this.cargo&&!m.has('pi-dock')){Object.assign(this.cargo.position,C.start);Object.assign(this.cargo.solid,C.start);}return 'Estrado recolhido ao apoio seco. Carga intacta; nenhum item pessoal foi consumido.';}
 get position():Vec2|undefined{return this.cargo?.position;}
 get movingSolid():Obstacle|undefined{return this.locked?undefined:this.cargo?.solid;}
 snapshot():Vec2|undefined{return this.cargo?{...this.cargo.position}:undefined;}
}
