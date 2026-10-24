import {createCreatureShadow,type CreatureShadow} from '../visual/CreatureArt';
import Phaser from 'phaser';
import { Health } from '../combat/Health';
import { inShockwaveSweep } from '../combat/HitDetection';
import { VOLCANIC_CREATURES,type VolcanicKind } from '../config/volcanic';
import { PLAYER } from '../config/game';
import { moveWithCollisions,type MovementBounds,type Obstacle } from '../systems/Movement';
import { distance,normalized,type Vec2 } from '../utils/math';
import { createEnemyName } from '../ui/EnemyName';
import type { Enemy,EnemyImpact } from './Enemy';

// Three volcanic anatomies, explicit rush/shot/impact states; existing combat contracts.
export class VolcanicCreature implements Enemy {
 readonly position:Vec2;readonly health:Health;readonly radius:number;readonly attackRange:number;readonly attackDamage:number;
 readonly view:Phaser.GameObjects.Container;readonly shadow:CreatureShadow;
 readonly telegraph:Phaser.GameObjects.Ellipse;readonly projectile:Phaser.GameObjects.Image;
 readonly healthBack:Phaser.GameObjects.Rectangle;readonly healthFill:Phaser.GameObjects.Rectangle;
 private readonly body:Phaser.GameObjects.Image;private readonly name:Phaser.GameObjects.Text;
 private readonly home:Vec2;private readonly aimGuide:Phaser.GameObjects.Line;
 isDead=false;state:'IDLE'|'CHASE'|'WINDUP'|'EXECUTE'|'RECOVER'|'HURT'|'DEAD'='IDLE';
 private until=0;private attackAt=-Infinity;private attackAngle=0;private gait=0;private hurtUntil=0;
 private push={x:0,y:0};private victims=new Set<Vec2>();
 private shot?:{x:number;y:number;angle:number;distance:number};
 constructor(private scene:Phaser.Scene,readonly kind:VolcanicKind,x:number,y:number){
  const s=VOLCANIC_CREATURES[kind];this.position={x,y};this.home={x,y};this.health=new Health(s.hp);this.radius=s.radius;this.attackRange=s.range;this.attackDamage=s.damage;
  this.body=scene.add.image(0,14,s.texture,0).setOrigin(.5,244/256).setDisplaySize(s.size,s.size);
  this.view=scene.add.container(x,y,[this.body]);
  this.shadow=createCreatureShadow(scene,x,y+10,s.size*.64,22,0x080c10,.55);
  const diameter=s.style==='slam'?s.range*2:60;
  this.telegraph=scene.add.ellipse(x,y,diameter,s.style==='slam'?diameter:28,0xff6a4a,.17).setStrokeStyle(2,0xffbd54,.95).setVisible(false);
  this.aimGuide=scene.add.line(0,0,0,0,s.style==='rush'?190:350,0,0xffbd54,.8).setOrigin(0).setLineWidth(2).setVisible(false);
  this.projectile=scene.add.image(x,y,'world-rock').setTint(0xffbd54).setDisplaySize(28,23).setVisible(false);
  this.healthBack=scene.add.rectangle(x,y-60,44,6,0x10252b).setDepth(15010).setVisible(true);
  this.healthFill=scene.add.rectangle(x-20,y-60,40,4,0xffbd54).setOrigin(0,.5).setDepth(15011).setVisible(true);
  this.name=createEnemyName(scene,x,y-78,s.name);
 }
 update(now:number,dt:number,player:Vec2,dead:boolean,obstacles:readonly Obstacle[],onAttack:(impact?:EnemyImpact)=>void,bounds?:MovementBounds,participants?:readonly Vec2[]):void{
  if(this.isDead)return;dt=Math.min(dt,.04);const s=VOLCANIC_CREATURES[this.kind],gap=distance(this.position,player),direction=normalized(player.x-this.position.x,player.y-this.position.y);
  this.updateShot(dt,player,dead,obstacles,onAttack,bounds);
  let velocity={x:0,y:0};
  if(now<this.hurtUntil){this.state='HURT';velocity={...this.push};this.push.x*=Math.max(0,1-dt*10);this.push.y*=Math.max(0,1-dt*10);}
  else if(dead||gap>s.detection&&this.state!=='EXECUTE'&&this.state!=='WINDUP'){
   this.state='IDLE';if(distance(this.position,this.home)>18){const d=normalized(this.home.x-this.position.x,this.home.y-this.position.y);velocity={x:d.x*45,y:d.y*45};}
  }else if(this.state==='WINDUP'){
   if(now>=this.until){this.state='EXECUTE';this.until=now+(s.style==='rush'?430:280);this.victims.clear();
    if(s.style==='shot'&&!this.shot)this.shot={...this.position,angle:this.attackAngle,distance:0};
   }
  }else if(this.state==='EXECUTE'){
   if(s.style==='rush')velocity={x:Math.cos(this.attackAngle)*300,y:Math.sin(this.attackAngle)*300};
   if(s.style!=='shot')for(const p of participants??(dead?[]:[player])){
    const radius=s.style==='slam'?s.range:this.radius+PLAYER.radius+10;
    if(!this.victims.has(p)&&distance(this.position,p)<radius){this.victims.add(p);onAttack({damage:s.damage,ranged:s.style==='slam',victim:p});}
   }
   if(now>=this.until){this.state='RECOVER';this.until=now+(s.style==='slam'?1100:s.style==='rush'?900:600);}
  }else if(this.state==='RECOVER'){if(now>=this.until)this.state='CHASE';}
  else if(gap<s.range&&now-this.attackAt>s.cooldown&&!this.shot){this.state='WINDUP';this.attackAt=now;this.until=now+s.windup;this.attackAngle=Math.atan2(direction.y,direction.x);}
  else{this.state='CHASE';const forward=s.style==='shot'&&gap<170?-1:gap>(s.style==='shot'?260:55)?1:0;velocity={x:direction.x*s.speed*forward,y:direction.y*s.speed*forward};}
  const before={...this.position};moveWithCollisions(this.position,velocity,dt,this.radius,obstacles,bounds);
  const travel=distance(before,this.position);this.gait+=travel/20;
  const frame=this.state==='HURT'?5:this.state==='WINDUP'?3:this.state==='EXECUTE'?4:travel>.1?1+Math.floor(this.gait)%2:0;
  const facing=this.state==='WINDUP'||this.state==='EXECUTE'?Math.cos(this.attackAngle):direction.x;
  if(Math.abs(facing)>.08)this.body.setFlipX(facing<0);
  this.body.setFrame(frame);if(now<this.hurtUntil)this.body.setTintFill(0xffe2b4);else this.body.clearTint();
  this.view.setPosition(this.position.x,this.position.y).setDepth(this.position.y).setRotation(0);
  this.shadow.setPosition(this.position.x,this.position.y+10).setDepth(this.position.y-2);
  const warning=this.state==='WINDUP';this.telegraph.setPosition(this.position.x,this.position.y).setDepth(this.position.y-3).setRotation(0).setVisible(warning);
  this.aimGuide.setPosition(this.position.x,this.position.y).setRotation(this.attackAngle).setDepth(this.position.y-2).setVisible(warning&&s.style!=='slam');
  this.healthBack.setPosition(this.position.x,this.position.y-60).setVisible(true);
  this.healthFill.setPosition(this.position.x-20,this.position.y-60).setDisplaySize(40*this.health.current/this.health.max,4).setVisible(true);
  this.name.setPosition(this.position.x,this.position.y-78).setVisible(true);
 }
 private updateShot(dt:number,player:Vec2,dead:boolean,obstacles:readonly Obstacle[],attack:(impact?:EnemyImpact)=>void,bounds?:MovementBounds):void{
  if(!this.shot||dead){this.shot=undefined;this.projectile.setVisible(false);return;}
  const s=this.shot,from={x:s.x,y:s.y},step=210*dt;s.x+=Math.cos(s.angle)*step;s.y+=Math.sin(s.angle)*step;s.distance+=step;
  const blocked=obstacles.some(o=>inShockwaveSweep(from,s.angle,o,0,step,10,0,o.radius));
  const hit=!blocked&&inShockwaveSweep(from,s.angle,player,0,step,10,0,PLAYER.radius);
  if(hit)attack({damage:this.attackDamage,ranged:true});
  if(blocked||hit||s.distance>580||bounds&&(s.x<bounds.left||s.x>bounds.right||s.y<bounds.top||s.y>bounds.bottom)){this.shot=undefined;this.projectile.setVisible(false);}
  else this.projectile.setPosition(s.x,s.y).setRotation(s.angle).setDepth(s.y+3).setVisible(true);
 }
 hurt(now:number,from:Vec2,force=300):void{this.state='HURT';this.hurtUntil=now+170;const d=normalized(this.position.x-from.x,this.position.y-from.y);this.push={x:d.x*force,y:d.y*force};}
 die():void{if(this.isDead)return;this.isDead=true;this.state='DEAD';this.shot=undefined;this.telegraph.destroy();this.aimGuide.destroy();this.projectile.destroy();this.name.destroy();this.healthBack.destroy();this.healthFill.destroy();this.scene.tweens.add({targets:[this.view,this.shadow],alpha:0,duration:350,onComplete:()=>{this.view.destroy();this.shadow.destroy()}});}
}
