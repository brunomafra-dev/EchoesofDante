import Phaser from 'phaser';
import { CompleteActorArt } from '../visual/CompleteActorArt';
import { COMPLETE_FRAME,completeKey } from '../visual/CompleteActorFrames';
import { SaberAttack } from '../combat/Attack';
import { KineticCharge } from '../combat/KineticCharge';
import { HunterCombat } from '../combat/HunterCombat';
import { AstralCombat } from '../combat/AstralCombat';
import { XenobinderCombat } from '../combat/XenobinderCombat';
import { EnergySaber } from '../entities/EnergySaber';
import { HollowCrawler } from '../entities/HollowCrawler';
import type { Enemy } from '../entities/Enemy';
import { ASTRAL_ELEMENTS,ELEMENT_NAMES,XENOBINDER,type AstralElement,type PlayableClass } from '../config/classes';
import { KINETIC_CHARGE } from '../config/game';
import type { CharacterSex } from '../config/appearance';

// Bounded showroom using the campaign's actor, combat and visual components.
// No input, profiles, saves, relay or campaign state.
export class CharacterPreviewScene extends Phaser.Scene {
 ready=false;running=false;
 private actor!:CompleteActorArt;private target!:HollowCrawler;
 private targetParts:Phaser.GameObjects.Components.Visible[]=[];
 private saber?:EnergySaber;private hunter?:HunterCombat;private astral?:AstralCombat;private xeno?:XenobinderCombat;
 private attack=new SaberAttack();private charge=new KineticCharge();
 private wave!:Phaser.GameObjects.Ellipse;
 private started=0;private cueMask=0;private element:AstralElement='energy';
 private readonly owner={x:400,y:400,position:{x:400,y:400},health:{current:65,max:100},isDead:false};
 constructor(readonly identity:PlayableClass,readonly sex:CharacterSex,private status:(phase:string,caption:string,frame:number)=>void,private loaded:()=>void){super('Showcase');}
 preload():void{
  const base=import.meta.env.BASE_URL+'assets/visual/';
  this.load.spritesheet(completeKey(this.identity,this.sex,'none'),`${base}complete-actors/${this.identity}-${this.sex}-none.png`,{frameWidth:COMPLETE_FRAME,frameHeight:COMPLETE_FRAME});
  for(const key of ['hollow-body','hollow-forelimbs','hollow-rear-limbs'])this.load.image(key,`${base}characters/${key}.png`);
  if(this.identity==='warrior')this.load.image('warrior-starter-weapon',base+'characters/warrior-starter-weapon.png');
  if(this.identity==='astral')for(const element of ASTRAL_ELEMENTS)for(const [kind,w,h]of [['bolt',128,96],['ground',128,128],['field',192,192]]as const)
   this.load.spritesheet(`astral-${element}-${kind}`,`${base}astral/astral-${element}-${kind}-v2.png`,{frameWidth:w,frameHeight:h});
  if(this.identity==='xenobinder'){
   for(const key of ['xeno-bolt','xeno-link','xeno-pulse'])this.load.image(key,`${base}xenobinder/${key}.png`);
   this.load.spritesheet('dante-symbiont-motion',base+'characters/dante-symbiont-motion.png',{frameWidth:256,frameHeight:256});
  }
  this.load.on('loaderror',()=>this.status('error','PRÉVIA INDISPONÍVEL',0));
 }
 create():void{
  const image=this.textures.get(completeKey(this.identity,this.sex,'none')).getSourceImage() as HTMLImageElement;
  // Initial outfit only: aliases share one source, never load unused wardrobes.
  for(const style of ['basic','reinforced']as const)this.textures.addSpriteSheet(completeKey(this.identity,this.sex,style),image,{frameWidth:192,frameHeight:192});
  this.add.ellipse(400,439,57,16,0x020e14,.4).setDepth(397);
  this.actor=new CompleteActorArt(this,this.add.container(400,400).setDepth(400),400,400,this.sex,this.identity);
  const existing=new Set(this.children.list);
  this.target=new HollowCrawler(this,520,400,undefined,true);this.target.health.max=1000;this.target.health.current=1000;
  this.targetParts=this.children.list.filter(p=>!existing.has(p)) as unknown as Phaser.GameObjects.Components.Visible[];
  this.wave=this.add.ellipse(0,0,20,120,0x5fe6d8,.6).setVisible(false).setDepth(14999);
  if(this.identity==='warrior'){this.saber=new EnergySaber(this,true);this.saber.view.setVisible(false);}
  if(this.identity==='hunter')this.hunter=new HunterCombat(this,()=>0,a=>this.actor.muzzle(a));
  if(this.identity==='astral')this.astral=new AstralCombat(this,()=>0);
  if(this.identity==='xenobinder')this.xeno=new XenobinderCombat(this,()=>0,this.owner);
  this.ready=true;this.idle();this.loaded();
 }
 begin(element:AstralElement='energy'):void{
  if(!this.ready)return;this.running=true;this.started=this.time.now;this.cueMask=0;this.element=element;
  this.attack=new SaberAttack();this.charge=new KineticCharge();this.hunter?.clear();this.astral?.clear();this.xeno?.clear();
  this.owner.health.current=65;
  this.target.health.current=1000;this.target.isDead=false;for(const part of this.targetParts)part.setVisible(true);
  if(this.astral)this.astral.element=element;
  if(this.xeno){this.xeno.bond=XENOBINDER.bondMax;Object.assign(this.xeno.position,{x:355,y:426});}
  this.cameras.main.setZoom(1.3).centerOn(448,380);this.game.loop.wake();
 }
 idle():void{
  if(!this.ready)return;this.running=false;this.charge.stop();this.saber?.clearEffects();this.hunter?.clear();this.astral?.clear();this.xeno?.clear();this.wave.setVisible(false);
  for(const part of this.targetParts)part.setVisible(false);
  this.actor.update(400,400,Math.PI/2,false);
  if(this.xeno){Object.assign(this.xeno.position,{x:455,y:426});this.xeno.render(this.xeno.snapshot());}
  this.cameras.main.setZoom(this.xeno?1.75:2.25).centerOn(this.xeno?415:400,372);
  this.status('idle',({warrior:'FORÇA · RESISTÊNCIA',hunter:'PRECISÃO · MOBILIDADE',astral:'ENERGIA ASTRAL · CONTROLE',xenobinder:'VÍNCULO · SIMBIOSE'})[this.identity],0);
  this.game.events.once(Phaser.Core.Events.POST_RENDER,()=>{if(!this.running)this.game.loop.sleep();});
 }
 update(now:number,delta:number):void{
  if(!this.ready||!this.running)return;
  const elapsed=now-this.started,dt=Math.min(delta/1000,.04),aim=0;
  if(elapsed>=5600){this.idle();return;}
  const hit=(enemy:Enemy,damage:number)=>{enemy.health.current=Math.max(1,enemy.health.current-damage);enemy.hurt(now,this.owner,0);};
  if(elapsed>=250&&!(this.cueMask&1)){this.cueMask|=1;this.basic(now);}
  if(elapsed>=700&&!(this.cueMask&2)){this.cueMask|=2;this.basic(now);}
  if(elapsed>=1500&&!(this.cueMask&4)){this.cueMask|=4;this.charge.start(now);}
  if(elapsed>=2300&&!(this.cueMask&8)){
   this.cueMask|=8;this.charge.release(now,aim,this.owner);
   this.hunter?.fire(now,this.owner,aim,this.charge.damage);this.astral?.cast(now,this.owner,aim,this.charge.level(now));
   this.xeno?.command(now,this.owner,aim,this.charge.level(now),[],{left:280,right:530,top:280,bottom:520});
  }
  this.charge.tick(now);
  const heavy=this.charge.pose(now),pose=this.attack.pose(now,aim),targets=[this.target];
  if(this.saber){for(const e of this.attack.advance(now,this.owner,aim,targets).hits)hit(e,34);
   for(const e of this.charge.takeHits(now,targets))hit(e,this.charge.damage);
   const m=this.actor.muzzle(aim);this.saber.render(this.owner,{x:400+m.x,y:400+m.y},aim,0,pose,heavy,false);this.saber.view.setVisible(false);
   this.wave.setVisible(this.charge.waveVisible(now)).setPosition(400+KINETIC_CHARGE.waveStart+KINETIC_CHARGE.waveTravel*this.charge.waveProgress(now),400);
  }
  this.hunter?.update(dt,this.owner,false,targets,[],{left:220,right:780,top:220,bottom:580},hit);
  this.astral?.update(now,dt,targets,[],{left:220,right:535,top:220,bottom:580},hit,heavy.phase==='CHARGING');
  this.xeno?.update(now,dt,this.owner,aim,false,targets,[],undefined,hit,[this.owner],heavy.phase==='CHARGING');
  this.target.update(now,dt,this.target.position,true,[],()=>{});this.target.view.setRotation(Math.PI);
  const firing=this.hunter?now<this.hunter.firedUntil:this.astral?now<this.astral.firedUntil:this.xeno?now<this.xeno.firedUntil:pose.phase!=='READY';
  this.actor.update(400,400,aim,firing,false,heavy,this.element);
  const phase=heavy.phase==='CHARGING'?'charge':heavy.phase==='RELEASE'||elapsed>=2300?'release':firing?'attack':'idle';
  const title=heavy.phase==='CHARGING'?'Q · SEGURAR E MIRAR':elapsed>=2300?({warrior:'Q · ONDA CINÉTICA',hunter:'Q · FEIXE PERFURANTE',astral:`Q · CAMPO DE ${ELEMENT_NAMES[this.element].toLocaleUpperCase('pt-BR')}`,xenobinder:'Q · INVESTIDA E RECUPERAÇÃO'})[this.identity]:({warrior:'BÁSICO · CORTE DO SABRE',hunter:'BÁSICO · DISPARO DE PULSO',astral:`BÁSICO · ${ELEMENT_NAMES[this.element].toLocaleUpperCase('pt-BR')}`,xenobinder:'BÁSICO · MARCA E ASSISTÊNCIA'})[this.identity];
  this.status(phase,title,Number(this.actor.body.frame.name));
 }
 private basic(now:number):void{
  if(this.saber)this.attack.start(now);
  this.hunter?.fire(now,this.owner,0);this.astral?.fire(now,this.owner,0,this.actor.projectileOffset(0));this.xeno?.fire(now,this.owner,0,this.actor.projectileOffset(0));
 }
}
