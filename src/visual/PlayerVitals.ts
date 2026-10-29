import Phaser from 'phaser';
import type {Player} from '../entities/Player';

// Shared raster pieces: only transforms/tints/alpha change during presentation.
function textures(scene:Phaser.Scene):void{
 if(scene.textures.exists('vitals-track'))return;
 const bake=(key:string,w:number,h:number,draw:(c:CanvasRenderingContext2D)=>void)=>{const t=scene.textures.createCanvas(key,w,h)!;draw(t.context);t.refresh();};
 bake('vitals-track',60,10,c=>{c.fillStyle='#091813';c.fillRect(0,0,60,10);c.strokeStyle='#789182';c.strokeRect(.5,.5,59,9);});
 bake('vitals-fill',1,1,c=>{c.fillStyle='#fff';c.fillRect(0,0,1,1);});
 bake('vitals-ring',96,48,c=>{c.strokeStyle='#bddc9c';c.lineWidth=2;c.beginPath();c.ellipse(48,24,44,19,0,0,Math.PI*2);c.stroke();});
 bake('vitals-mote',16,16,c=>{const g=c.createRadialGradient(8,8,0,8,8,8);g.addColorStop(0,'#e4f5c7');g.addColorStop(.3,'#b5db94');g.addColorStop(1,'#b5db9400');c.fillStyle=g;c.fillRect(0,0,16,16);});
 bake('vitals-vial',24,32,c=>{c.fillStyle='#172d24';c.fillRect(5,9,14,20);c.strokeStyle='#b8cfb0';c.lineWidth=2;c.strokeRect(5,9,14,20);c.fillStyle='#8cbf75';c.fillRect(8,17,8,9);c.fillStyle='#c59c60';c.fillRect(8,3,8,7);c.fillStyle='#e7ecce';c.fillRect(9,12,2,9);});
}

export class PlayerVitals{
 readonly bar:Phaser.GameObjects.Container;
 readonly fill:Phaser.GameObjects.Image;
 readonly recovery:Phaser.GameObjects.Container;
 private readonly ring:Phaser.GameObjects.Image;
 private readonly vial:Phaser.GameObjects.Image;
 private readonly motes:Phaser.GameObjects.Image[];
 private readonly label:Phaser.GameObjects.Text;
 private lastHp:number;
 private lastMax:number;
 private shownUntil=0;
 private recoveryAt=-Infinity;
 private potionCount?:number;
 private disposed=false;
 private ratio:number;
 constructor(private scene:Phaser.Scene,private player:Player){
  textures(scene);this.lastHp=player.hp;this.lastMax=player.maxHp;this.ratio=player.hp/player.maxHp;
  const track=scene.add.image(0,0,'vitals-track');
  this.fill=scene.add.image(-27,0,'vitals-fill').setOrigin(0,.5).setDisplaySize(54,4).setTint(0xa9cc9a);
  this.bar=scene.add.container(0,0,[track,this.fill]).setName('player-vitals').setDepth(22998).setVisible(false);
  this.ring=scene.add.image(0,0,'vitals-ring').setVisible(false);
  this.vial=scene.add.image(0,0,'vitals-vial');
  this.motes=Array.from({length:4},()=>scene.add.image(0,0,'vitals-mote'));
  this.label=scene.add.text(0,0,'POÇÃO',{fontFamily:'Barlow Condensed',fontSize:'14px',color:'#d2e9b4',stroke:'#102219',strokeThickness:3}).setOrigin(.5);
  this.recovery=scene.add.container(0,0,[...this.motes,this.vial,this.label]).setName('potion-recovery').setDepth(22997).setVisible(false);
  scene.events.on(Phaser.Scenes.Events.POST_UPDATE,this.update);
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN,this.destroy);
 }
 potion():void{if(this.player.isDead)return;this.recoveryAt=this.scene.time.now;this.shownUntil=this.recoveryAt+3200;}
 // The first snapshot is a baseline, including rejoin/region change. Old uses
 // must never replay, and multiple render ticks of one packet trigger once.
 observePotion(count?:number):void{
  if(typeof count!=='number'||!Number.isSafeInteger(count)||count<0)return;
  if(this.potionCount!==undefined&&count>this.potionCount)this.potion();
  this.potionCount=count;
 }
 private update=():void=>{
  const p=this.player,now=this.scene.time.now;
  if(p.hp!==this.lastHp||p.maxHp!==this.lastMax){this.shownUntil=now+3200;this.lastHp=p.hp;this.lastMax=p.maxHp;}
  const alive=!p.isDead&&p.hp>0,target=Phaser.Math.Clamp(p.hp/Math.max(1,p.maxHp),0,1);
  this.ratio+=(target-this.ratio)*Math.min(1,this.scene.game.loop.delta/130);
  this.fill.setDisplaySize(Math.max(.001,54*this.ratio),4).setTint(target<=.3?0xe88871:target<=.6?0xd4b57a:0xa9cc9a);
  const visible=alive&&(target<1||now<this.shownUntil);
  const legibility=Math.max(1,.8*this.scene.scale.displayScale.x/Math.max(.3,this.scene.cameras.main.zoom));
  this.bar.setScale(legibility).setPosition(p.position.x,p.position.y-78).setVisible(visible).setAlpha(target<=.3?.82+.18*Math.sin(now*.006):target<1?1:Phaser.Math.Clamp((this.shownUntil-now)/600,0,1));
  const elapsed=now-this.recoveryAt,t=Phaser.Math.Clamp(elapsed/1150,0,1),active=alive&&elapsed>=0&&t<1;
  this.recovery.setVisible(active);this.ring.setVisible(active);
  if(!active)return;
  const alpha=Math.min(1,elapsed/100)*(1-t),ease=1-(1-t)*(1-t);
  this.recovery.setPosition(p.position.x,p.position.y).setAlpha(alpha);
  this.ring.setPosition(p.position.x,p.position.y+36).setDepth(p.position.y-1).setScale(.55+ease*.6).setAlpha(alpha*.8);
  this.vial.setPosition(31,-12-ease*25).setRotation(-.18+ease*.32).setScale(.8*legibility);
  this.label.setPosition(48,-48-ease*21).setScale(legibility);
  for(let i=0;i<this.motes.length;i++){const phase=(t+i*.16)%1;this.motes[i].setPosition(Math.sin(i*2.4+t*2)*24,24-phase*78).setScale(.4+Math.sin(phase*Math.PI)*.35).setAlpha(Math.sin(phase*Math.PI));}
 };
 destroy=():void=>{if(this.disposed)return;this.disposed=true;this.scene.events.off(Phaser.Scenes.Events.POST_UPDATE,this.update);this.scene.events.off(Phaser.Scenes.Events.SHUTDOWN,this.destroy);this.bar.destroy(true);this.recovery.destroy(true);this.ring.destroy();};
}
