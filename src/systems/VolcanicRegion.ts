import Phaser from 'phaser';
import { VOLCANIC,type VolcanicArea } from '../config/volcanic';
import { ChapterPortal } from './ChapterPortal';
import type { Obstacle } from './Movement';
import { EnvironmentPainter,trackEnvironmentOcclusion } from '../visual/EnvironmentArt';

export class VolcanicRegion {
 readonly config;readonly bounds;readonly obstacles:Obstacle[];
 readonly back:ChapterPortal;readonly onward:ChapterPortal;
 private readonly pulse:Phaser.GameObjects.Ellipse;
 constructor(scene:Phaser.Scene,readonly id:VolcanicArea,recorded:boolean){
  const c=this.config=VOLCANIC[id];this.bounds={...c.bounds};this.obstacles=c.rocks.map(r=>({...r}));
  scene.add.image(0,0,c.texture).setOrigin(0).setDisplaySize(c.width,c.height).setDepth(-10002);
  for(let top=0;top<c.height;top+=600){
   const cache=scene.add.renderTexture(0,Math.max(0,top-140),c.width,Math.min(880,c.height-top+140)).setOrigin(0).setDepth(-9900+top/600);
   const painter=new EnvironmentPainter(scene,cache);
   for(const r of c.rocks.filter(r=>Math.floor(r.y/600)===top/600))painter.rock(r.x,r.y,r.radius,id==='cinder'?0xb0a38c:0x969a9e,true);
   for(const cluster of c.clusters.filter(p=>Math.floor(p.y/600)===top/600)){
    painter.apron(cluster.x,cluster.y+15,cluster.w,0x8f7754);
    painter.stamp({key:cluster.key,x:cluster.x,y:cluster.y,width:cluster.w,height:cluster.h,tint:id==='cinder'?0xb3a083:0x9e9296});
   }
   painter.destroy();
  }
  const relay=scene.add.image(c.relay.x,c.relay.y-12,'deep-relay').setOrigin(.5,.94).setDisplaySize(140,125).setTint(id==='cinder'?0xc4ac8a:0xa399af).setDepth(c.relay.y-28);
  trackEnvironmentOcclusion(scene,relay);
  this.pulse=scene.add.ellipse(c.relay.x,c.relay.y-35,46,12,0xa98cff,recorded?.6:.12).setDepth(c.relay.y-25);
  this.back=new ChapterPortal(scene,c.back,true);this.onward=new ChapterPortal(scene,c.exit,recorded);
 }
 respond():void{this.pulse.setAlpha(.7);this.onward.activate();}
}
