import Phaser from 'phaser';
import { CALDERA as C, CALDERA_WALL } from '../config/caldera';
import { ChapterPortal } from './ChapterPortal';
import type { Obstacle } from './Movement';
import { EnvironmentPainter, trackEnvironmentOcclusion } from '../visual/EnvironmentArt';

export class CalderaRegion {
 readonly bounds={...C.bounds};
 readonly obstacles:Obstacle[]=[...C.rocks,...CALDERA_WALL].map(p=>({...p}));
 readonly back:ChapterPortal;
 private readonly gate:Phaser.GameObjects.Image;
 private readonly gateObstacle={...C.gate};
 private readonly pulse:Phaser.GameObjects.Ellipse;
 private unlocked=false;
 constructor(scene:Phaser.Scene,recorded:boolean,defeated:boolean){
  scene.add.image(0,0,'caldera-ground').setOrigin(0).setDisplaySize(C.width,C.height).setDepth(-10002);
  for(let top=0;top<C.height;top+=600){
   const cache=scene.add.renderTexture(0,Math.max(0,top-140),C.width,Math.min(880,C.height-top+140)).setOrigin(0).setDepth(-9900+top/600);
   const p=new EnvironmentPainter(scene,cache);
   for(const r of this.obstacles.filter(r=>Math.floor(r.y/600)===top/600))p.rock(r.x,r.y,r.radius,0xa39a88,true);
   if(top===600){
    for(const [x,y,w,h]of[[1050,520,130,90],[1500,1270,160,95],[1870,670,110,70]]){
     p.apron(x,y+25,w,0x8f7754);p.stamp({key:'deep-mineral',x,y,width:w,height:h,tint:0xffbd54});
    }
    p.apron(C.relay.x,C.relay.y,155,0x968675);
    p.stamp({key:'ancient-remnant',x:1790,y:1220,width:145,height:85,tint:0x9d897b,angle:-18});
    p.stamp({key:'root-growth',x:690,y:620,width:160,height:45,tint:0x797960});
   }
   p.destroy();
  }
  const relay=scene.add.image(C.relay.x,C.relay.y-16,'deep-relay').setOrigin(.5,.94).setDisplaySize(150,140).setTint(0xb6a28d).setDepth(C.relay.y-28);
  trackEnvironmentOcclusion(scene,relay);
  this.pulse=scene.add.ellipse(C.relay.x,C.relay.y-37,50,12,0xa98cff,recorded?.65:.15).setDepth(C.relay.y-25);
  this.gate=scene.add.image(C.gate.x,C.gate.y+10,'sealed-threshold').setOrigin(.5,.94).setDisplaySize(200,165).setTint(0xbba28a).setDepth(C.gate.y-20);
  trackEnvironmentOcclusion(scene,this.gate);
  this.back=new ChapterPortal(scene,C.back,true);
  scene.add.image(C.record.x,C.record.y-10,'ancient-remnant').setOrigin(.5,.94).setDisplaySize(145,110).setTint(0xbca393).setDepth(C.record.y-28);
  this.setEncounterActive(false);
  if(recorded)this.respond();if(defeated)this.resolve();
 }
 respond():void{this.unlocked=true;this.pulse.setAlpha(.75);this.setEncounterActive(false);}
 resolve():void{this.unlocked=true;this.pulse.setFillStyle(0xffbd54,.65);this.setEncounterActive(false);}
 setEncounterActive(active:boolean):void{
  const blocked=active||!this.unlocked;
  this.gate.setTexture(blocked?'sealed-threshold':'open-threshold');
  const i=this.obstacles.indexOf(this.gateObstacle);
  if(blocked&&i<0)this.obstacles.push(this.gateObstacle);else if(!blocked&&i>=0)this.obstacles.splice(i,1);
 }
}
