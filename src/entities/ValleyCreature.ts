import Phaser from 'phaser';
import { Health } from '../combat/Health';
import { inShockwaveSweep } from '../combat/HitDetection';
import { PLAYER } from '../config/game';
import { VALLEY_CREATURES, type ValleyKind } from '../config/valley';
import { moveWithCollisions, type MovementBounds, type Obstacle } from '../systems/Movement';
import { distance, normalized, type Vec2 } from '../utils/math';
import type { Enemy, EnemyImpact } from './Enemy';

// Two local state machines on the existing Enemy contract. Old AI is untouched.
export class ValleyCreature implements Enemy {
  readonly position: Vec2;
  readonly health: Health;
  readonly radius: number;
  readonly attackRange: number;
  readonly attackDamage: number;
  readonly view: Phaser.GameObjects.Container;
  readonly warning: Phaser.GameObjects.Graphics;
  readonly shadow: Phaser.GameObjects.Ellipse;
  isDead = false;
  state: 'IDLE' | 'CHASE' | 'WINDUP' | 'RECOVER' | 'HURT' | 'DEAD' = 'IDLE';
  private readonly body: Phaser.GameObjects.Image;
  private readonly flash: Phaser.GameObjects.Ellipse;
  private readonly healthBack: Phaser.GameObjects.Rectangle;
  private readonly healthFill: Phaser.GameObjects.Rectangle;
  private readonly name: Phaser.GameObjects.Text;
  private readonly home: Vec2;
  private readonly shots: { image: Phaser.GameObjects.Image; active: boolean; x: number; y: number; angle: number; distance: number }[] = [];
  private attackAt = -Infinity;
  private windupUntil = 0;
  private recoverUntil = 0;
  private hurtUntil = 0;
  private direction = 0;
  private stride = 0;
  private push = { x: 0, y: 0 };
  private facingLeft = false;

  constructor(private scene: Phaser.Scene, readonly kind: ValleyKind, x: number, y: number) {
    const s = VALLEY_CREATURES[kind];
    this.position = { x, y }; this.home = { x, y };
    this.health = new Health(s.hp); this.radius = s.radius;
    this.attackRange = s.range; this.attackDamage = s.damage;
    this.shadow = scene.add.ellipse(x, y + 10, s.size * 0.6, 20, 0x13291c, 0.5);
    this.body = scene.add.image(0, 13, `dante-${kind}-motion`, 0).setOrigin(0.5,244/256).setDisplaySize(s.size,s.size);
    this.flash = scene.add.ellipse(0,-18,55,30,0xffead5,0);
    this.view = scene.add.container(x,y,[this.body,this.flash]);
    this.warning = scene.add.graphics().setVisible(false);
    if (kind === 'carapace') {
      this.warning.fillStyle(0xffbd54,0.13).beginPath().moveTo(0,0).arc(0,0,112,-0.9,0.9).closePath().fillPath();
      this.warning.lineStyle(3,0xffbd54,0.9).beginPath().moveTo(0,0).lineTo(Math.cos(-0.9)*112,Math.sin(-0.9)*112)
        .arc(0,0,112,-0.9,0.9).closePath().strokePath();
    } else {
      for (const angle of [-0.28,0,0.28]) {
        this.warning.lineStyle(3,0xffbd54,0.65).lineBetween(Math.cos(angle)*24,Math.sin(angle)*24,Math.cos(angle)*320,Math.sin(angle)*320);
        this.shots.push({image:scene.add.image(x,y,'mineral-growth').setDisplaySize(24,17).setVisible(false),active:false,x,y,angle:0,distance:0});
      }
    }
    this.healthBack = scene.add.rectangle(x,y-64,48,6,0x152c2a).setDepth(10000).setVisible(false);
    this.healthFill = scene.add.rectangle(x-22,y-64,44,4,0xc1bd79).setOrigin(0,0.5).setDepth(10001).setVisible(false);
    this.name = scene.add.text(x,y-80,s.name,{fontFamily:'Barlow Condensed, sans-serif',fontSize:'12px',color:'#e2e1c4',stroke:'#172926',strokeThickness:3})
      .setOrigin(0.5).setDepth(10001).setVisible(false);
  }

  update(now: number, dt: number, player: Vec2, dead: boolean, obstacles: readonly Obstacle[], onAttack: (impact?: EnemyImpact) => void, bounds?: MovementBounds): void {
    if (this.isDead) return;
    const s = VALLEY_CREATURES[this.kind], gap = distance(this.position,player);
    this.updateShots(dt,player,dead,obstacles,bounds,onAttack);
    const toward = normalized(player.x-this.position.x,player.y-this.position.y);
    let vx = 0, vy = 0;
    if (dead) { this.state='IDLE'; this.clearShots(); }
    else if (now < this.hurtUntil) {
      this.state='HURT'; vx=this.push.x; vy=this.push.y;
      this.push.x *= Math.max(0,1-dt*10); this.push.y *= Math.max(0,1-dt*10);
    } else if (this.state === 'WINDUP') {
      if (now >= this.windupUntil) {
        if (this.kind === 'carapace') {
          const toPlayer = Math.atan2(toward.y,toward.x);
          if (gap < s.range + PLAYER.radius && Math.abs(Phaser.Math.Angle.Wrap(toPlayer-this.direction)) < 0.9) onAttack({damage:s.damage});
        } else {
          this.shots.forEach((shot,i) => Object.assign(shot,{active:true,x:this.position.x,y:this.position.y,angle:this.direction+(i-1)*0.28,distance:0}));
        }
        this.state='RECOVER'; this.recoverUntil=now+s.recovery;
      }
    } else if (this.state === 'RECOVER' && now < this.recoverUntil) {
      // Visible committed strike and recovery: a real window for Saber/Charge.
    } else if (gap > s.detection) {
      this.state='IDLE';
      if (distance(this.position,this.home)>18) {
        const home=normalized(this.home.x-this.position.x,this.home.y-this.position.y); vx=home.x*45; vy=home.y*45;
      }
    } else if (gap <= s.range && now-this.attackAt >= s.cooldown && !this.shots.some(shot=>shot.active)) {
      this.state='WINDUP'; this.attackAt=now; this.windupUntil=now+s.windup;
      this.direction=Math.atan2(toward.y,toward.x);
    } else {
      this.state='CHASE';
      const forward=this.kind==='thorn' && gap<155 ? -1 : gap>(this.kind==='thorn'?240:75)?1:0;
      vx=toward.x*s.speed*forward; vy=toward.y*s.speed*forward;
    }
    const before={...this.position};
    moveWithCollisions(this.position,{x:vx,y:vy},dt,this.radius,obstacles,bounds);
    const travel=distance(before,this.position);
    if (this.state==='CHASE'||this.state==='IDLE') this.stride+=travel/15;
    const moving=travel>0.1 && this.state!=='HURT';
    const facing=this.state==='WINDUP'||this.state==='RECOVER' ? Math.cos(this.direction) : gap<=s.detection?toward.x:this.position.x-before.x;
    if(Math.abs(facing)>0.08)this.facingLeft=facing<0;
    const frame=this.state==='HURT'?7:this.state==='WINDUP'?5:this.state==='RECOVER'?6:moving?1+Math.floor(this.stride)%4:0;
    this.body.setFrame(frame).setFlipX(this.facingLeft);
    this.view.setPosition(this.position.x,this.position.y).setDepth(this.position.y).setRotation(0);
    this.shadow.setPosition(this.position.x,this.position.y+10).setDepth(this.position.y-2);
    this.warning.setPosition(this.position.x,this.position.y).setRotation(this.direction).setDepth(this.position.y-1)
      .setVisible(this.state==='WINDUP').setAlpha(0.55+0.45*Math.min(1,(now-this.attackAt)/s.windup));
    this.healthBack.setPosition(this.position.x,this.position.y-64);
    this.healthFill.setPosition(this.position.x-22,this.position.y-64);
    this.name.setPosition(this.position.x,this.position.y-80).setVisible(this.state==='WINDUP'||this.health.current<this.health.max);
  }

  private clearShots(): void { this.shots.forEach(shot=>{shot.active=false;shot.image.setVisible(false);}); }
  private updateShots(dt: number, player: Vec2, dead: boolean, obstacles: readonly Obstacle[], bounds: MovementBounds | undefined, onAttack: (impact?: EnemyImpact) => void): void {
    for(const shot of this.shots){
      if(!shot.active)continue;
      const before={x:shot.x,y:shot.y}, travel=260*dt;
      shot.x+=Math.cos(shot.angle)*travel; shot.y+=Math.sin(shot.angle)*travel; shot.distance+=travel;
      const blocked=obstacles.some(o=>inShockwaveSweep(before,shot.angle,o,0,travel,7,0,o.radius));
      const hit=!blocked&&!dead&&inShockwaveSweep(before,shot.angle,player,0,travel,7,0,PLAYER.radius);
      if(hit)onAttack({damage:this.attackDamage,ranged:true});
      if(blocked||hit||dead||shot.distance>=520||(bounds&&(shot.x<bounds.left||shot.x>bounds.right||shot.y<bounds.top||shot.y>bounds.bottom))){
        shot.active=false; shot.image.setVisible(false);
      }else shot.image.setPosition(shot.x,shot.y).setRotation(shot.angle).setDepth(shot.y+2).setVisible(true);
    }
  }
  hurt(now: number, from: Vec2, force = 300): void {
    this.state='HURT'; this.hurtUntil=now+180;
    const away=normalized(this.position.x-from.x,this.position.y-from.y); this.push={x:away.x*force,y:away.y*force};
    this.flash.setAlpha(0.6); this.scene.tweens.killTweensOf(this.flash);
    this.scene.tweens.add({targets:this.flash,alpha:0,duration:110});
    this.healthBack.setVisible(true); this.healthFill.setVisible(true).setDisplaySize(44*this.health.current/this.health.max,4);
  }
  die(): void {
    if(this.isDead)return;
    this.isDead=true; this.state='DEAD'; this.clearShots();
    this.shots.forEach(shot=>shot.image.destroy()); this.warning.destroy(); this.healthBack.destroy(); this.healthFill.destroy(); this.name.destroy();
    this.scene.tweens.add({targets:[this.view,this.shadow],alpha:0,scale:0.65,duration:300,onComplete:()=>{this.view.destroy();this.shadow.destroy();}});
  }
}
