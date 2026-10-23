import Phaser from 'phaser';

/** Six complete raster poses. No disconnected limbs, generated runtime art or
 * independent scaling of anatomy. The original Hollow still owns all combat. */
export class ForestCrawlerArt{
 private readonly body:Phaser.GameObjects.Image;
 private readonly contact:Phaser.GameObjects.Image;
 private lastState='IDLE';
 private struckAt=-Infinity;
 constructor(scene:Phaser.Scene,private view:Phaser.GameObjects.Container){
  if(!scene.textures.exists('finish-contact')){const canvas=scene.textures.createCanvas('finish-contact',96,96)!,c=canvas.context,g=c.createRadialGradient(48,48,0,48,48,46);g.addColorStop(0,'rgba(8,20,16,.7)');g.addColorStop(.45,'rgba(8,20,16,.3)');g.addColorStop(1,'rgba(8,20,16,0)');c.fillStyle=g;c.fillRect(0,0,96,96);canvas.refresh();}
  // Retain the common impact flash as the top child; replace only old artwork.
  for(const child of view.list.slice(0,-1)){child.setActive(false);(child as Phaser.GameObjects.Image).setVisible(false);}
  this.contact=scene.add.image(0,0,'finish-contact').setDisplaySize(78,43).setAlpha(.8);
  this.body=scene.add.image(0,0,'finish-hollow',0).setDisplaySize(112,112).setName('finish-whole-hollow');
  view.addAt(this.body,view.length-1);
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN,()=>this.contact.destroy());
 }
 update(now:number,phase:number,moving:boolean,state:string,recoil:number,position:{x:number;y:number},windup:number):void{
  if(this.lastState==='ATTACK'&&state==='CHASE')this.struckAt=now;
  this.lastState=state;
  const striking=now-this.struckAt<145;
  const frame=state==='ATTACK'?4:striking?5:moving?Math.floor(phase/(Math.PI*2)*4)%4:0;
  this.body.setFrame(frame).setPosition(recoil*-2,0);
  // Almost no vertical lift: feet stay in contact; the shell breathes subtly.
  const breath=state==='ATTACK'?1+Math.max(0,1-windup/330)*.012:1+Math.sin(now*.0025)*.003;
  this.view.setScale(breath*(1-recoil*.035),breath*(1+recoil*.025));
  this.view.y=position.y;
  this.contact.setPosition(position.x+7,position.y+16).setDepth(position.y-3);
 }
 die(scene:Phaser.Scene):void{
  scene.tweens.add({targets:this.contact,alpha:0,duration:300,onComplete:()=>this.contact.destroy()});
 }
}
