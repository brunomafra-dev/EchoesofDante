import {createCreatureShadow,type CreatureShadow} from '../visual/CreatureArt';
import Phaser from 'phaser';
import { Health } from '../combat/Health';
import { inMeleeArc, inShockwaveSweep } from '../combat/HitDetection';
import { PLAYER } from '../config/game';
import { VESPER as B, type IceAttack } from '../config/glacier';
import { moveWithCollisions, type Obstacle } from '../systems/Movement';
import { clamp, distance, type Vec2 } from '../utils/math';
import { VesperFrost } from '../visual/VesperFrost';
import type { Enemy, EnemyImpact } from './Enemy';

export type IceCue = 'intro' | 'warning' | 'strike' | 'break' | 'phase' | 'death';

// Combat is authoritative; six floor crusts survive attack transitions. Every
// visual quad is finite and uses the existing BossVisual presentation contract.
export class Vesper implements Enemy {
  readonly health=new Health(B.hp);
  readonly radius=B.radius;
  readonly position={...B.spawn};
  readonly body:Phaser.GameObjects.Image;
  readonly shadow:CreatureShadow;
  readonly telegraph:Phaser.GameObjects.Graphics;
  readonly attackRange=B.breath.range;
  state:'DORMANT'|'INTRO'|'IDLE'|'TELEGRAPH'|'EXECUTE'|'RECOVER'|'PHASE'|'DEATH'='DORMANT';
  phase:1|2|3=1;
  attackName:IceAttack|null=null;
  isDead=false;
  get coopObjects():Phaser.GameObjects.GameObject[]{return [this.shadow,this.body,this.telegraph,...this.marks.map(m=>m.image),...this.ice,...this.frost.coopObjects];}
  private victims=new Set<Vec2>();
  private participants?:readonly Vec2[];
  private readonly frostVictims=new WeakMap<Vec2,number>();
  private readonly frost:VesperFrost;
  private at=0;
  private until=0;
  private index=0;
  private angle=0;
  private facingAngle=Math.PI;
  private hitSpent=false;
  private fired=[false,false];
  private tailShattered=false;
  private tailCracked=false;
  private tailConnected=false;
  private travelled=0;
  private gait=0;
  private left=true;
  private hurtUntil=0;
  private guardedUntil=0;
  private stopped=false;
  private origin={x:0,y:0};
  private readonly marks:{x:number;y:number;spent:boolean;image:Phaser.GameObjects.Graphics}[];
  private readonly ice:Phaser.GameObjects.Image[];

  constructor(private scene:Phaser.Scene,private cue:(cue:IceCue)=>void,private finish:()=>void){
    this.shadow=createCreatureShadow(scene,this.position.x,this.position.y+10,175,37,0x051219,.3);
    this.body=scene.add.image(this.position.x,this.position.y+15,'vesper-motion',0).setOrigin(.5,244/256).setDisplaySize(B.size,B.size).setFlipX(true);
    this.telegraph=scene.add.graphics().setVisible(false);
    this.marks=Array.from({length:3},()=>({x:0,y:0,spent:true,image:scene.add.graphics().setVisible(false)}));
    this.frost=new VesperFrost(scene);
    this.ice=Array.from({length:9},()=>scene.add.image(0,0,'vesper-breath-mist').setVisible(false));
  }
  get canBeHit():boolean{return !this.isDead&&!this.stopped&&!['DORMANT','INTRO','PHASE'].includes(this.state);}
  get solid():boolean{return !this.isDead;}
  get coreExposed():boolean{const age=this.scene.time.now-this.at;return this.state==='RECOVER'&&this.tailShattered&&age>=B.openingAt&&age<B.openingMs-B.closingMs;}
  receiveStrike(now:number):number{
    if(!this.canBeHit)return 0;
    if(this.coreExposed)return B.openingDamage;
    this.guardedUntil=now+100;return B.armoredDamage;
  }
  beginIntro(now:number):void{if(this.state!=='DORMANT'||this.stopped)return;this.setState('INTRO',now,2200);this.cue('intro');}
  private setState(state:typeof this.state,now:number,ms:number):void{this.state=state;this.at=now;this.until=now+ms;}
  update(now:number,dt:number,player:Vec2,dead:boolean,obstacles:readonly Obstacle[],onAttack:(i?:EnemyImpact)=>boolean|void,_bounds?:unknown,participants?:readonly Vec2[]):void{
    this.participants=participants;
    if(this.isDead||this.stopped)return;
    if(dead){this.suspend();return;}
    dt=Math.min(dt,.04);const before={...this.position};this.frost.update(now);
    if(this.state==='DORMANT'){this.render(now,0);return;}
    if(this.state==='INTRO'||this.state==='PHASE'){
      if(now>=this.until)this.setState('IDLE',now,B.idleMs);
    }else{
      const next=this.health.current<=this.health.max*.3?3:this.health.current<=this.health.max*.65?2:1;
      if(next>this.phase&&this.state==='IDLE'){
        this.phase=(this.phase+1) as 2|3;this.index=0;this.attackName=null;this.clear();this.setState('PHASE',now,B.phaseMs);this.cue('phase');
      }else if(this.state==='IDLE'){
        const attack=B.patterns[this.phase][this.index%B.patterns[this.phase].length],gap=distance(this.position,player);
        // Keep the committed body direction between breath and tail. Turning to
        // the target here made the supposed rear counter always miss its target.
        if(attack!=='tail'){
          this.facingAngle=Math.atan2(player.y-this.position.y,player.x-this.position.x);
          if(Math.abs(player.x-this.position.x)>12)this.left=player.x<this.position.x;
          if(gap>180)moveWithCollisions(this.position,{x:(player.x-this.position.x)/gap*B.speed,y:(player.y-this.position.y)/gap*B.speed},dt,this.radius,obstacles,B.bounds);
        }
        if(now>=this.until){this.index++;this.beginAttack(now,attack,player);}
      }else if(this.state==='TELEGRAPH'&&now>=this.until){
        this.setState('EXECUTE',now,B[this.attackName!].duration);if(this.attackName==='rush')this.cue('strike');
      }else if(this.state==='EXECUTE'&&this.attackName){
        const attack=this.attackName,elapsed=now-this.at;
        if(attack==='rush'){
          const start={...this.position};moveWithCollisions(this.position,{x:Math.cos(this.angle)*B.rush.speed,y:Math.sin(this.angle)*B.rush.speed},dt,this.radius,obstacles,B.bounds);
          const step=distance(start,this.position);this.travelled+=step;
          for(const victim of this.participants??[player])if(inShockwaveSweep(start,this.angle,victim,0,step,B.rush.halfWidth,this.radius*2,PLAYER.radius))this.hit(onAttack,victim,B.rush.damage);
          if(step<B.rush.speed*dt*.3||this.travelled>=B.rush.distance)this.until=now;
        }else if(attack==='eruption'){
          this.marks.forEach((m,i)=>{
            if(!m.spent&&elapsed>=B.eruption.contact+i*B.eruption.interval){
              m.spent=true;this.victims.clear();this.hitSpent=false;this.frost.impact(now,m,i+1);this.cue('strike');
              for(const victim of this.participants??[player])if(distance(m,victim)<B.eruption.radius+PLAYER.radius)this.hit(onAttack,victim,B.eruption.damage);
            }
            m.image.setAlpha(m.spent?Math.max(0,1-(elapsed-B.eruption.contact-i*B.eruption.interval)/350):1);
          });
        }else if(attack==='breath'){
          for(let pulse=0;pulse<2;pulse++)if(!this.fired[pulse]&&elapsed>=(pulse?B.breath.second:B.breath.contact)){
            this.fired[pulse]=true;this.victims.clear();this.hitSpent=false;
            if(pulse===0)this.frost.deposit(now,this.origin,this.angle,obstacles);
            this.frost.impact(now,{x:this.origin.x+Math.cos(this.angle)*155,y:this.origin.y+Math.sin(this.angle)*155},1);
            this.cue('strike');
            for(const victim of this.participants??[player])if(inMeleeArc(this.origin,this.angle,victim,B.breath.range,B.breath.halfAngle,PLAYER.radius))this.hit(onAttack,victim,B.breath.damage);
          }
        }else{
          for(let pulse=0;pulse<2;pulse++)if(!this.fired[pulse]&&elapsed>=(pulse?B.tail.second:B.tail.contact)){
            this.fired[pulse]=true;this.victims.clear();this.hitSpent=false;
            this.frost.impact(now,this.origin,0,this.angle);this.cue('strike');
            for(const victim of this.participants??[player])if(inMeleeArc(this.origin,this.angle,victim,B.tail.range,B.tail.halfAngle,PLAYER.radius))this.hit(onAttack,victim,B.tail.damage);
            if(this.stopped)return;
            this.tailCracked=this.frost.shatter(now,this.origin,this.angle)>0||this.tailCracked;
            if(pulse===0){
              // The return is locked to the opposite sector, never to a moving
              // player. It receives its own 750 ms warning and contact effect.
              this.angle+=Math.PI;this.drawSector('tail');this.cue('warning');
            }else{
              this.telegraph.setVisible(false);
              if(this.tailCracked&&!this.tailConnected){this.tailShattered=true;this.clear();this.setState('RECOVER',now,B.openingMs);this.cue('break');}
            }
          }
        }
        if(this.state==='EXECUTE'&&now>=this.until){this.clear();this.setState('RECOVER',now,B[attack].recovery);}
      }else if(this.state==='RECOVER'&&now>=this.until){this.tailShattered=false;this.attackName=null;this.setState('IDLE',now,B.idleMs);}
    }
    // Overlapping crusts share one contact interval per participant. Existing
    // damage resolution retains Dash, grace and authority over real HP changes.
    for(const victim of this.participants??[player])if(this.frost.covers(victim)&&now>=(this.frostVictims.get(victim)??-Infinity)){
      this.frostVictims.set(victim,now+B.frost.interval);onAttack({damage:B.frost.damage,ranged:true,victim});
    }
    if(this.stopped)return;
    this.frost.update(now);this.render(now,distance(before,this.position));
  }
  private hit(callback:(i?:EnemyImpact)=>boolean|void,victim:Vec2,damage:number):void{
    if((!this.participants&&this.hitSpent)||this.victims.has(victim))return;
    this.victims.add(victim);this.hitSpent=true;
    const applied=callback({damage,ranged:true,victim});
    if(this.attackName==='tail'&&applied===true)this.tailConnected=true;
  }
  private beginAttack(now:number,attack:IceAttack,player:Vec2):void{
    this.clear();this.tailShattered=false;this.tailCracked=false;this.tailConnected=false;this.fired=[false,false];this.attackName=attack;this.hitSpent=false;this.victims.clear();this.travelled=0;Object.assign(this.origin,this.position);
    if(attack!=='tail')this.facingAngle=Math.atan2(player.y-this.position.y,player.x-this.position.x);
    this.angle=this.facingAngle+(attack==='tail'?Math.PI:0);this.left=Math.cos(this.facingAngle)<0;
    this.setState('TELEGRAPH',now,B[attack].tell);this.cue('warning');
    const g=this.telegraph.clear().setPosition(this.origin.x,this.origin.y).setRotation(this.angle).setDepth(this.position.y-3).setVisible(true).setAlpha(1);
    g.fillStyle(0xa5daee,.15).lineStyle(3,0xffd99a,.95);
    if(attack==='breath'||attack==='tail'){
      this.drawSector(attack);
    }else if(attack==='rush'){
      g.fillRect(-55,-B.rush.halfWidth,B.rush.distance+110,B.rush.halfWidth*2).strokeRect(-55,-B.rush.halfWidth,B.rush.distance+110,B.rush.halfWidth*2);
      for(const x of [170,340,510])g.lineBetween(x-25,-15,x,0).lineBetween(x-25,15,x,0);
    }else{
      g.setVisible(false);this.marks.forEach((m,i)=>{
        m.x=clamp(player.x+(i-1)*165,B.bounds.left+B.eruption.radius,B.bounds.right-B.eruption.radius);m.y=clamp(player.y+(i===1?-90:50),B.bounds.top+B.eruption.radius,B.bounds.bottom-B.eruption.radius);m.spent=false;
        m.image.clear().setPosition(m.x,m.y).setDepth(m.y-3).setVisible(true).setAlpha(1).fillStyle(0xa5daee,.18).lineStyle(3,0xffd99a,.95).fillCircle(0,0,B.eruption.radius).strokeCircle(0,0,B.eruption.radius);
        m.image.lineBetween(-12,0,12,0).lineBetween(0,-12,0,12);for(let n=0;n<=i;n++)m.image.lineBetween(-i*8+n*16,-32,-i*8+n*16,-20);
      });
    }
  }
  private drawSector(attack:'breath'|'tail'):void{
    const s=B[attack],g=this.telegraph.clear().setPosition(this.origin.x,this.origin.y).setRotation(this.angle).setDepth(this.position.y-3).setVisible(true).setAlpha(1);
    g.fillStyle(0xa5daee,.15).lineStyle(3,0xffd99a,.95).beginPath().moveTo(0,0).arc(0,0,s.range,-s.halfAngle,s.halfAngle,false).closePath().fillPath().strokePath();
    g.lineBetween(80,-10,110,0).lineBetween(80,10,110,0);
  }
  private render(now:number,travel:number):void{
    this.gait+=travel/30;const age=now-this.at,opened=this.state==='RECOVER'&&this.tailShattered;
    const breath=this.attackName==='breath'&&(this.state==='TELEGRAPH'||this.state==='EXECUTE'),tail=this.attackName==='tail'&&(this.state==='TELEGRAPH'||this.state==='EXECUTE'),reaction=opened||breath||tail;
    const tailWindup=this.state==='TELEGRAPH'||(age>B.tail.contact+180&&age<B.tail.second);
    const frame=opened?(age<650?4:age<B.openingMs-480?5:age<B.openingMs-B.closingMs?6:7):breath?(this.state==='TELEGRAPH'?0:1):tail?(tailWindup?2:3):this.state==='EXECUTE'?(this.attackName==='rush'?5:6):this.state==='TELEGRAPH'?3:travel>.1?1+Math.floor(this.gait)%2:0;
    this.body.setTexture(reaction?'vesper-reaction-motion':'vesper-motion',frame).setFlipX(this.left).setPosition(this.position.x,this.position.y+15).setDepth(this.position.y).setRotation(0).setScale(B.size/(reaction?384:256));
    if(now<this.hurtUntil)this.body.setTintFill(0xe9f2ff);else if(now<this.guardedUntil)this.body.setTint(0xb6e1ed);else this.body.clearTint();
    this.shadow.setPosition(this.position.x,this.position.y+10).setDepth(this.position.y-2);
    const blowing=this.state==='EXECUTE'&&this.attackName==='breath'&&age>=B.breath.contact;
    this.ice.forEach((image,i)=>{
      image.setVisible(blowing);if(!blowing)return;
      const forward=85+((age-B.breath.contact)*.55+i*55)%465,side=Math.sin(i*2.4)*forward*.28;
      image.setPosition(this.origin.x+Math.cos(this.angle)*forward-Math.sin(this.angle)*side,this.origin.y+Math.sin(this.angle)*forward+Math.cos(this.angle)*side).setDisplaySize(55+forward*.22,45+forward*.18).setAlpha(.68).setDepth(this.origin.y+1);
    });
  }
  private clear():void{this.telegraph.setVisible(false);this.marks.forEach(m=>{m.spent=true;m.image.setVisible(false);});this.ice.forEach(image=>image.setVisible(false));}
  hurt(now:number):void{if(this.canBeHit)this.hurtUntil=now+120;}
  suspend():void{this.stopped=true;this.tailShattered=false;this.clear();this.frost.clear();}
  die():void{
    if(this.isDead)return;
    this.isDead=true;this.tailShattered=false;this.health.current=0;this.state='DEATH';this.clear();this.frost.clear();this.body.setTexture('vesper-motion',7).setScale(B.size/256).clearTint();this.cue('death');
    this.scene.tweens.add({targets:this.body,alpha:.6,duration:1800});this.scene.time.delayedCall(1800,this.finish);
  }
}
