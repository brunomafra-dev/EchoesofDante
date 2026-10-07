import Phaser from 'phaser';
import { Health } from '../combat/Health';
import { inMeleeArc, inShockwaveSweep } from '../combat/HitDetection';
import { PLAYER } from '../config/game';
import { SOTERRADO as B, type SoterradoAttack, type SoterradoState } from '../config/soterrado';
import { moveWithCollisions, type MovementBounds, type Obstacle } from '../systems/Movement';
import { clamp, distance, type Vec2 } from '../utils/math';
import { createEnemyName } from '../ui/EnemyName';
import { SoterradoBurrow } from '../visual/SoterradoBurrow';
import type { Enemy, EnemyImpact } from './Enemy';

export type SoterradoCue = 'intro' | 'warning' | 'strike' | 'phase' | 'death';
type Mark = { x:number; y:number; spent:boolean; graphic:Phaser.GameObjects.Graphics };

// An encounter-specific Enemy: the existing saber, charge, health and damage paths apply.
export class Soterrado implements Enemy {
  readonly position: Vec2;
  readonly health = new Health(B.maxHp);
  readonly radius = B.radius;
  readonly attackRange = B.sweep.range;
  readonly attackDamage = B.sweep.damage;
  readonly body: Phaser.GameObjects.Image;
  readonly shadow: Phaser.GameObjects.Ellipse;
  readonly telegraph: Phaser.GameObjects.Graphics;
  private readonly name: Phaser.GameObjects.Text;
  private readonly marks: Mark[];
  private readonly burrowVisual: SoterradoBurrow;
  private readonly origin: Vec2 = { x:0,y:0 };
  private readonly velocity: Vec2 = { x:0,y:0 };
  state: SoterradoState = 'DORMANT';
  phase: 1|2 = 1;
  attackName: SoterradoAttack|null = null;
  isDead = false;
  private stateAt=0;
  private stateUntil=0;
  private angle=0;
  private patternIndex=0;
  private travelled=0;
  private gait=0;
  private activationHit=false;
  private stopped=false;
  private facingLeft=true;
  private hurtUntil=0;

  constructor(private readonly scene:Phaser.Scene,x:number,y:number,private readonly bounds:MovementBounds,
    private readonly onCue:(cue:SoterradoCue,attack?:SoterradoAttack)=>void,private readonly onDefeated:()=>void) {
    this.position={x,y};
    this.shadow=scene.add.ellipse(x,y+5,160,46,0x4d291d,.55).setDepth(y-2);
    this.body=scene.add.image(x,y+14,'soterrado-motion',0).setOrigin(.5,.93).setDisplaySize(B.artSize,B.artSize).setDepth(y).setAlpha(0);
    this.name=createEnemyName(scene,x,y-145,'O SOTERRADO').setVisible(false);
    this.telegraph=scene.add.graphics().setVisible(false);
    this.marks=Array.from({length:3},()=>({x,y,spent:true,graphic:scene.add.graphics().setVisible(false)}));
    this.burrowVisual=new SoterradoBurrow(scene);
  }

  get submerged():boolean { return this.attackName==='burrow'&&this.state==='TELEGRAPH'&&this.scene.time.now-this.stateAt>350; }
  get canBeHit():boolean { return !this.isDead&&!this.stopped&&this.state!=='DORMANT'&&this.state!=='INTRO'&&this.state!=='PHASE'&&!this.submerged; }
  get solid():boolean { return !this.isDead&&!this.submerged&&this.state!=='INTRO'&&this.state!=='DORMANT'; }
  beginIntro(now:number):void {
    if(this.state!=='DORMANT'||this.stopped||this.isDead)return;
    this.setState('INTRO',now,B.introMs);this.burrowVisual.intro(now,this.position);this.onCue('intro');
  }
  private setState(state:SoterradoState,now:number,duration:number):void {
    this.state=state;this.stateAt=now;this.stateUntil=now+duration;
  }

  update(now:number,dt:number,player:Vec2,playerDead:boolean,obstacles:readonly Obstacle[],onAttack:(impact?:EnemyImpact)=>void):void {
    if(this.isDead||this.stopped)return;
    if(playerDead){this.suspend();return;}
    dt=Math.min(dt,.04);
    this.velocity.x=this.velocity.y=0;
    this.burrowVisual.update(now);
    const previous={...this.position};
    if(this.state==='DORMANT'){this.render(now,0);return;}
    if(this.state==='INTRO') {
      if(now>=this.stateUntil)this.setState('IDLE',now,1000);
      this.render(now,0);return;
    }
    if(this.phase===1&&this.health.current<=this.health.max*.48&&this.state!=='TELEGRAPH'&&this.state!=='EXECUTE') {
      this.phase=2;this.attackName=null;this.clearWarnings();this.setState('PHASE',now,B.phaseMs);this.onCue('phase');
    }
    if(this.state==='PHASE') {if(now>=this.stateUntil)this.setState('IDLE',now,900);}
    else if(this.state==='IDLE') {
      const gap=distance(player,this.position);
      if(Math.abs(player.x-this.position.x)>10)this.facingLeft=player.x<this.position.x;
      if(gap>B.standOff) {
        this.velocity.x=(player.x-this.position.x)/gap*B.speed;
        this.velocity.y=(player.y-this.position.y)/gap*B.speed;
      }
      if(now>=this.stateUntil) {
        const pattern=B.patterns[this.phase];
        const attack=pattern[this.patternIndex++%pattern.length];
        this.beginAttack(now,attack==='sweep'&&gap>310?'rush':attack,player,obstacles);
        this.velocity.x=this.velocity.y=0;
      }
    } else if(this.state==='TELEGRAPH'&&now>=this.stateUntil) {
      if(this.attackName==='burrow') {this.position.x=this.marks[0].x;this.position.y=this.marks[0].y;}
      this.setState('EXECUTE',now,this.attackName?B[this.attackName].execute:220);this.onCue('strike',this.attackName??undefined);
    }
    if(this.state==='EXECUTE'&&this.attackName) {
      const attack=this.attackName, elapsed=now-this.stateAt;
      if(attack==='rush') {
        const before={...this.position};
        moveWithCollisions(this.position,{x:Math.cos(this.angle)*B.rush.speed,y:Math.sin(this.angle)*B.rush.speed},dt,this.radius,obstacles,this.bounds);
        const step=distance(before,this.position);this.travelled+=step;
        if(inShockwaveSweep(before,this.angle,player,0,step,B.rush.halfWidth,this.radius*2,PLAYER.radius))this.hit(onAttack);
        if(this.travelled>=B.rush.distance||step<B.rush.speed*dt*.3)this.stateUntil=now;
      } else if(attack==='sweep'&&elapsed<180) {
        if(inMeleeArc(this.origin,this.angle,player,B.sweep.range,B.sweep.halfAngle,PLAYER.radius))this.hit(onAttack);
      } else if(attack==='burrow'&&elapsed<180) {
        if(distance(this.position,player)<B.burrow.radius+PLAYER.radius)this.hit(onAttack);
      } else if(attack==='fissure') {
        for(let i=0;i<this.marks.length;i++) {
          const mark=this.marks[i];
          if(!mark.spent&&elapsed>=i*B.fissure.interval) {
            mark.spent=true;
            if(distance(mark,player)<B.fissure.radius+PLAYER.radius)this.hit(onAttack);
            mark.graphic.setAlpha(.8);
          }
          if(mark.spent)mark.graphic.setAlpha(Math.max(0,1-(elapsed-i*B.fissure.interval)/250));
        }
      }
      if(now>=this.stateUntil){this.clearWarnings();this.setState('RECOVER',now,B[attack].recover);}
    } else moveWithCollisions(this.position,this.velocity,dt,this.radius,obstacles,this.bounds);
    if(this.state==='RECOVER'&&now>=this.stateUntil){this.attackName=null;this.setState('IDLE',now,this.phase===1?900:650);}
    this.render(now,distance(previous,this.position));
  }

  private hit(onAttack:(impact?:EnemyImpact)=>void):void {
    if(this.activationHit||!this.attackName)return;
    this.activationHit=true;onAttack({damage:B[this.attackName].damage,ranged:true});
  }

  private safeMark(x:number,y:number,obstacles:readonly Obstacle[]):Vec2 {
    const point={x:clamp(x,this.bounds.left+150,this.bounds.right-150),y:clamp(y,this.bounds.top+145,this.bounds.bottom-145)};
    // Use the existing physical solver to keep an emergence off solid bases.
    moveWithCollisions(point,{x:0,y:0},0,this.radius+12,obstacles,this.bounds);
    return point;
  }

  private beginAttack(now:number,attack:SoterradoAttack,player:Vec2,obstacles:readonly Obstacle[]):void {
    this.clearWarnings();this.attackName=attack;this.activationHit=false;this.travelled=0;
    Object.assign(this.origin,this.position);this.angle=Math.atan2(player.y-this.position.y,player.x-this.position.x);
    if(Math.abs(Math.cos(this.angle))>.1)this.facingLeft=Math.cos(this.angle)<0;
    this.setState('TELEGRAPH',now,B[attack].tell);
    const g=this.telegraph;
    g.clear().setPosition(this.origin.x,this.origin.y).setDepth(this.origin.y-1).setAlpha(1).setRotation(this.angle).setVisible(true);
    g.fillStyle(0xff6a4a,.18).lineStyle(3,0xffe0a3,.95);
    if(attack==='sweep') {
      g.beginPath().moveTo(0,0).arc(0,0,B.sweep.range,-B.sweep.halfAngle,B.sweep.halfAngle,false).closePath().fillPath().strokePath();
    } else if(attack==='rush') {
      g.fillRect(-60,-B.rush.halfWidth,B.rush.distance+120,B.rush.halfWidth*2);
      g.strokeRect(-60,-B.rush.halfWidth,B.rush.distance+120,B.rush.halfWidth*2);
      for(const x of [150,270])g.lineBetween(x-15,-12,x,0).lineBetween(x-15,12,x,0);
    } else {
      g.setVisible(false);
      const count=attack==='burrow'?1:3, radius=attack==='burrow'?B.burrow.radius:B.fissure.radius;
      for(let i=0;i<count;i++) {
        const point=this.safeMark(player.x+(i-1)*(attack==='fissure'?190:0),player.y+(i===1?45:0),obstacles);
        const mark=this.marks[i];Object.assign(mark,point,{spent:false});
        mark.graphic.clear().setPosition(mark.x,mark.y).setDepth(mark.y-1).setAlpha(1).setVisible(true);
        mark.graphic.fillStyle(0xff6a4a,.18).fillCircle(0,0,radius).lineStyle(3,0xffe0a3,.95).strokeCircle(0,0,radius);
        mark.graphic.lineBetween(-15,-15,15,15).lineBetween(15,-15,-15,15);
        for(let n=0;n<=i;n++)mark.graphic.lineBetween(-i*8+n*16,-35,-i*8+n*16,-22);
      }
    }
    if(attack==='burrow')this.burrowVisual.dig(now,this.origin,this.marks[0]);
    this.onCue('warning',attack);
  }

  private render(now:number,moved:number):void {
    const walking=this.state==='IDLE'&&moved>.1;
    if(walking)this.gait+=moved/35;
    const progress=clamp((now-this.stateAt)/Math.max(1,this.stateUntil-this.stateAt),0,1);
    const sinking=this.state==='TELEGRAPH'&&this.attackName==='burrow';
    const emerging=this.state==='INTRO'||(this.state==='EXECUTE'&&this.attackName==='burrow');
    const frame=this.state==='PHASE'?6:emerging?5:this.state==='TELEGRAPH'?3:this.state==='EXECUTE'?4:walking?1+Math.floor(this.gait)%2:0;
    // Translate a full-size pose through the soil plane, cropping the buried
    // portion. The painted foreground lip covers the cut instead of squashing
    // the anatomy. Rendering never moves the physical body or attack origin.
    const reveal=sinking?1-clamp((now-this.stateAt)/350,0,1):this.state==='INTRO'?clamp((progress-.28)/.62,0,1):emerging?clamp(progress*1.2,0,1):1;
    const eased=reveal*reveal*(3-2*reveal),hidden=(1-eased)*B.artSize*.93;
    this.body.setFrame(frame).setFlipX(this.facingLeft).setRotation(0).setScale(B.artSize/384)
      .setPosition(this.position.x,this.position.y+14+hidden-(walking?Math.abs(Math.sin(this.gait*Math.PI))*2:0)).setDepth(this.position.y);
    if(eased<1)this.body.setCrop(0,0,384,Math.max(1,384*.93*eased));else this.body.setCrop();
    this.body.setAlpha(this.state==='DORMANT'||eased<=0?0:1);
    if(now<this.hurtUntil)this.body.setTintFill(0xffe5c1);else this.body.clearTint();
    this.name.setPosition(this.position.x,this.position.y-145).setVisible(this.state!=='DORMANT'&&!this.submerged&&reveal>.6);
    this.shadow.setPosition(this.position.x,this.position.y+5).setDepth(this.position.y-2).setScale(sinking?1-progress*.5:1).setAlpha(this.state==='DORMANT'?.12:.5);
  }

  private clearWarnings():void {this.telegraph.setVisible(false);for(const mark of this.marks){mark.spent=true;mark.graphic.setVisible(false);}}
  suspend():void {this.stopped=true;this.clearWarnings();this.burrowVisual.clear();this.state='DORMANT';this.attackName=null;this.name.setVisible(false);this.body.setCrop().setAlpha(0);}
  hurt(now:number,_from:Vec2):void {if(this.canBeHit)this.hurtUntil=now+120;}
  die():void {
    if(this.isDead)return;
    this.isDead=true;this.health.current=0;this.state='DEATH';this.attackName=null;this.clearWarnings();this.name.setVisible(false);
    this.burrowVisual.clear();
    this.body.setFrame(7).setCrop().setPosition(this.position.x,this.position.y+14).clearTint().setScale(B.artSize/384).setAlpha(1);this.onCue('death');
    this.scene.tweens.add({targets:this.body,alpha:.55,duration:B.deathMs});
    this.scene.time.delayedCall(B.deathMs,()=>this.onDefeated());
  }
}
