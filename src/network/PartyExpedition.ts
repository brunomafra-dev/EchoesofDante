import Phaser from 'phaser';
import { coopSession as room, NO_INPUT, type PartyWorld, type CreaturePose, type PartyPose } from './CoopSession';
import { PartyActor } from './PartyActor';
import type { Player } from '../entities/Player';
import type { Enemy } from '../entities/Enemy';
import type { Controls } from '../input/Controls';
import type { HunterCombat } from '../combat/HunterCombat';
import type { Hud } from '../ui/Hud';
import type { JourneyArea, JourneyFlags } from '../systems/LocalJourney';
import type { ProgressionSnapshot } from '../systems/Progression';
import type { MovementBounds, Obstacle } from '../systems/Movement';
import type { Vec2 } from '../utils/math';
import { characterProfiles } from '../systems/CharacterProfiles';
import { SPECIES, type SpeciesId } from '../config/bestiary';

export type PartyBridge={
 area:JourneyArea;player:Player;controls:Controls;enemies:readonly Enemy[];obstacles:readonly Obstacle[];bounds?:MovementBounds;hud:Hud;hunter?:HunterCombat;
 progression:ProgressionSnapshot;flags:JourneyFlags;phase:string;chargeLevel:number;firing:boolean;wave?:PartyPose['wave'];
 id:(enemy:Enemy)=>number|undefined;species:(enemy:Enemy)=>SpeciesId|undefined;
 hit:(targets:Enemy[],damage:number,angle:number,from:Vec2,heavy:boolean)=>void;
 prompt:(position:Vec2)=>{available:boolean;action:string};
 sync:(world:PartyWorld)=>boolean;render:(pose:PartyPose)=>void;
};
type Presented=Enemy&{view?:Phaser.GameObjects.Container;body?:Phaser.GameObjects.Image;telegraph?:Phaser.GameObjects.Ellipse;warning?:Phaser.GameObjects.Graphics;direction?:number;attackAngle?:number;projectile?:Phaser.GameObjects.Ellipse;shots?:{active:boolean;x:number;y:number;angle:number}[]};
type Mirror={body:Phaser.GameObjects.Image;shadow:Phaser.GameObjects.Ellipse;warning:Phaser.GameObjects.Ellipse;line:Phaser.GameObjects.Line;hp:Phaser.GameObjects.Rectangle;name:Phaser.GameObjects.Text;layers:Phaser.GameObjects.Image[]};
// Regional host authority. There is no second AI simulation in the visitor browser.
export class PartyExpedition {
 partner?:PartyActor;
 private peerName='';
 private interaction?:Vec2;
 private attackQueued=false;
 private restartQueued=false;
 private queued={dash:false,charge:false,release:false,cancel:false,interact:false,restart:false};
 private sendAt=0;
 private appliedWorld?:PartyWorld;
 private mirrorHost?:PartyActor;
 private mirrors=new Map<number,Mirror>();
 private projectiles:Phaser.GameObjects.Rectangle[]=[];
 private readonly visitorWave:Phaser.GameObjects.Ellipse;
 private status:Phaser.GameObjects.Text;
 private hiddenLocalEnemies=false;
 private readonly localPlayer:Player;
 private ranks:ProgressionSnapshot['abilityUpgrades'];
 constructor(private scene:Phaser.Scene,private access:()=>PartyBridge){
  this.localPlayer=access().player;
  this.visitorWave=scene.add.ellipse(0,0,20,120,0x5fe6d8,.6).setDepth(14999).setVisible(false);
  this.status=scene.add.text(640,42,'',{fontFamily:'Barlow Condensed',fontSize:'14px',color:'#d5e0c7',stroke:'#07120f',strokeThickness:2})
   .setOrigin(.5).setScrollFactor(0).setDepth(22000).setVisible(false);
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN,()=>this.destroy());
 }
 queueAttack():void{this.attackQueued=true;}
 queueRestart():void{this.queued.restart=true;}
 cancelPartnerCharge():void{this.partner?.cancelCharge();}
 takeInteraction():Vec2|undefined{const p=this.interaction;this.interaction=undefined;return p;}
 takeRestart():boolean{const requested=this.restartQueued;this.restartQueued=false;return requested;}
 private safePosition():Vec2{
  const a=this.access(),b=a.bounds;
  for(const [dx,dy]of[[80,0],[-80,0],[0,80],[0,-80],[0,0]]){
   const p={x:a.player.position.x+dx,y:a.player.position.y+dy};
   if((!b||p.x>b.left+18&&p.x<b.right-18&&p.y>b.top+18&&p.y<b.bottom-18)&&a.obstacles.every(o=>Math.hypot(o.x-p.x,o.y-p.y)>o.radius+20))return p;
  }return{...a.player.position};
 }
 updateHost(now:number,dt:number):void{
  if(room.role!=='host'){if(this.partner){this.partner.destroy();this.partner=undefined;this.peerName='';}this.status.setVisible(false);return;}
  const a=this.access();this.ranks=a.progression.abilityUpgrades;this.status.setVisible(true).setText(room.peer?`DUPLA · ${characterProfiles.active.name} + ${room.peer.name}`:`SALA ${room.code} · AGUARDANDO COMPANHEIRO`);
  if(!room.peer&&this.partner){this.partner.destroy();this.partner=undefined;this.peerName='';}
  if(room.peer&&(!this.partner||this.peerName!==room.peer.name)){
   this.partner?.destroy();const hp=Math.round(a.progression.xp>=60?a.player.maxHp/(a.player.classId==='hunter'?.8:1):100);
   this.partner=new PartyActor(this.scene,room.peer,this.safePosition(),Math.round(hp*(room.peer.classId==='hunter'?.8:1)),id=>this.ranks?.[id]??0);this.peerName=room.peer.name;
  }
  const input=performance.now()-room.inputAt<500?room.input:{...NO_INPUT};
  if(this.partner){
   if(a.player.isDead){if(!this.partner.player.isDead)this.partner.player.die();if(input.restart)this.restartQueued=true;}
   else if(input.restart&&this.partner.player.isDead){this.partner.destroy();this.partner=new PartyActor(this.scene,room.peer!,this.safePosition(),Math.round(a.player.maxHp/(a.player.classId==='hunter'?.8:1)*(room.peer!.classId==='hunter'?.8:1)),id=>this.ranks?.[id]??0);}
   const maxHp=Math.round(a.player.maxHp/(a.player.classId==='hunter'?.8:1)*(this.partner.profile.classId==='hunter'?.8:1));
   if(maxHp!==this.partner.player.maxHp){const gain=maxHp-this.partner.player.maxHp;this.partner.player.health.max=maxHp;this.partner.player.health.current=Math.min(maxHp,this.partner.player.hp+gain);}
   this.partner.update(now,dt,input,a.enemies,a.obstacles,a.bounds,a.hit);
   if(input.interact&&!this.partner.player.isDead)this.interaction={...this.partner.player.position};
  }
  room.consumeEdges();
  if(now-this.sendAt<100)return;this.sendAt=now;
  const partner=this.partner?.snapshot(),prompt=partner?a.prompt(partner):{available:false,action:'INVESTIGAR'};
  const host:PartyPose={...a.player.position,aim:a.player.rotation,hp:a.player.hp,maxHp:a.player.maxHp,dead:a.player.isDead,dash:a.player.isDashing,phase:a.phase,level:a.chargeLevel,firing:a.firing,wave:a.wave};
  const enemies:CreaturePose[]=a.enemies.filter(e=>!e.isDead).map((enemy,index)=>{
   const e=enemy as Presented;
   const body=e.body??e.view?.list.find(p=>p instanceof Phaser.GameObjects.Image&&p.texture.key==='hollow-body') as Phaser.GameObjects.Image|undefined
    ??e.view?.list.find(p=>p instanceof Phaser.GameObjects.Image) as Phaser.GameObjects.Image|undefined;
   const warning=e.telegraph?.visible||e.warning?.visible||false;
   // Send the existing painted limb poses, not a flattened floating Hollow.
   const layers=(a.species(enemy)==='crawler'?e.view?.list:[])?.filter((p):p is Phaser.GameObjects.Image=>p instanceof Phaser.GameObjects.Image&&p.visible).slice(0,6).map(p=>{
    const matrix=p.getWorldTransformMatrix(),scale=matrix.decomposeMatrix();
    return{texture:p.texture.key,frame:String(p.frame.name),x:matrix.tx-enemy.position.x,y:matrix.ty-enemy.position.y,width:p.width*Math.abs(scale.scaleX),height:p.height*Math.abs(scale.scaleY),rotation:scale.rotation,flip:p.flipX,depth:e.view!.getIndex(p),originX:p.originX,originY:p.originY};
   });
   return{id:a.id(enemy)??index,species:a.species(enemy)??'crawler',...enemy.position,hp:enemy.health.current,maxHp:enemy.health.max,radius:enemy.radius,
    texture:body?.texture.key??'hollow-body',frame:String(body?.frame.name??0),flip:body?.flipX??false,size:body?.displayWidth??80,
    rotation:e.view?.rotation??0,layers,warning,angle:e.attackAngle??e.direction??e.view?.rotation??0,
    warningX:e.telegraph?.x??e.position.x,warningY:e.telegraph?.y??e.position.y,warningWidth:e.telegraph?.width??100,warningHeight:e.telegraph?.height??45,
    projectile:e.projectile?.visible?{x:e.projectile.x,y:e.projectile.y,rotation:e.projectile.rotation}:undefined};
  });
  const shots:PartyWorld['shots']=[...(a.hunter?.projectilePoses()??[]),...(this.partner?.hunter?.projectilePoses()??[])].map(shot=>({...shot,friendly:true}));
  for(const e of a.enemies as readonly Presented[])for(const shot of e.shots??[])if(shot.active)shots.push({x:shot.x,y:shot.y,rotation:shot.angle});
  const world:PartyWorld={area:a.area,time:now,progression:a.progression,flags:a.flags,host,partner,enemies,
   message:(a.hud as unknown as {discoveryMessage:Phaser.GameObjects.Text}).discoveryMessage.visible?(a.hud as unknown as {discoveryMessage:Phaser.GameObjects.Text}).discoveryMessage.text:'',prompt:prompt.available,action:prompt.action,shots};
  room.send('world',world);
 }
 targetFor(enemy:Enemy):Player{
  const local=this.localPlayer,p=this.partner?.player;
  if(p&&!p.isDead&&(local.isDead||Math.hypot(p.position.x-enemy.position.x,p.position.y-enemy.position.y)<Math.hypot(local.position.x-enemy.position.x,local.position.y-enemy.position.y)))return p;
  return local;
 }
 updateGuest(now:number,dt:number):void{
  const a=this.access(),c=a.controls;
  const interact=c.interactPressed;
  const input={...c.movement(),aim:c.aimFrom(a.player.position),attack:c.attacking||this.attackQueued,dash:c.dashPressed,charge:c.chargePressed,held:c.chargeHeld,
   release:c.chargeReleased,cancel:c.chargeCancelled,interact,restart:c.restartPressed};
  for (const key of Object.keys(this.queued) as (keyof typeof this.queued)[]) {
    this.queued[key] ||= input[key]; input[key] = this.queued[key];
  }
  if(now-this.sendAt>=40){room.send('input',input);this.sendAt=now;this.attackQueued=false;for (const key of Object.keys(this.queued) as (keyof typeof this.queued)[]) this.queued[key]=false;}
  else if(input.attack)this.attackQueued=true;
  const world=room.world;
  this.status.setVisible(true).setText(!world||performance.now()-room.worldAt>1500?'DUPLA · AGUARDANDO ANFITRIÃO':`DUPLA · ${room.peer?.name??'ANFITRIÃO'}`);
  if(!world||!world.partner)return;
  if(world!==this.appliedWorld){if(a.sync(world))return;this.appliedWorld=world;}
  if(!this.hiddenLocalEnemies){
   for(const enemy of a.enemies){
    const e=enemy as Presented;e.view?.setVisible(false);
    for(const key of ['shadow','telegraph','warning','healthBack','healthFill','name','projectile'])(e as unknown as Record<string,Phaser.GameObjects.Components.Visible|undefined>)[key]?.setVisible(false);
    for(const shot of (e as unknown as {shots?:{image:Phaser.GameObjects.Image}[]}).shots??[])shot.image?.setVisible(false);
   }this.hiddenLocalEnemies=true;
  }
  const p=world.partner,delta=Math.hypot(p.x-a.player.position.x,p.y-a.player.position.y),t=delta>300?1:Math.min(1,dt*18);
  a.render({...p,x:Phaser.Math.Linear(a.player.position.x,p.x,t),y:Phaser.Math.Linear(a.player.position.y,p.y,t)});
  if(!this.mirrorHost&&room.peer)this.mirrorHost=new PartyActor(this.scene,room.peer,world.host,world.host.maxHp);
  this.mirrorHost?.render(world.host,now,dt);
  this.visitorWave.setVisible(!!p.wave);if(p.wave)this.visitorWave.setPosition(p.wave.x,p.wave.y).setRotation(p.wave.rotation).setDisplaySize(p.wave.width,p.wave.height);
  a.hud.setHunterMomentum(p.momentum??0);
  a.hud.update(p.hp,p.maxHp,p.dashReady??1,p.chargeReady??1,p.phase as 'READY'|'CHARGING'|'RELEASE',p.level,a.player.dashCooldown);
  c.setDead(p.dead);c.setInteractAvailable(world.prompt,world.action);a.hud.setDiscoveryPrompt(world.prompt,world.action);
  const live=new Set<number>();
  for(const e of world.enemies){
   live.add(e.id);let m=this.mirrors.get(e.id);
   if(!m){
    m={body:this.scene.add.image(e.x,e.y,e.texture),layers:[],shadow:this.scene.add.ellipse(e.x,e.y+12,e.size*.6,20,0x07191b,.5),
     warning:this.scene.add.ellipse(0,0,70,28,0xffbd54,.2).setStrokeStyle(2,0xffbd54,.8),line:this.scene.add.line(0,0,0,0,300,0,0xffbd54,.5).setOrigin(0),
     hp:this.scene.add.rectangle(0,0,40,4,0xb9d299).setOrigin(0,.5),name:this.scene.add.text(0,0,'',{fontFamily:'Barlow Condensed',fontSize:'13px',color:'#d8e4c7',stroke:'#06110d',strokeThickness:2}).setOrigin(.5)};
    this.mirrors.set(e.id,m);
   }
   if(!this.scene.textures.exists(e.texture))continue;
   const flat=e.species==='crawler',damaged=e.hp<e.maxHp;
   const t=Math.hypot(m.shadow.x-e.x,m.shadow.y-12-e.y)>300?1:Math.min(1,dt*18);
   const x=Phaser.Math.Linear(m.shadow.x,e.x,t),y=Phaser.Math.Linear(m.shadow.y-12,e.y,t);
   m.body.setTexture(e.texture,e.frame).setDisplaySize(e.size,flat?64:e.size).setOrigin(.5,flat?.5:244/256)
    .setPosition(x,y+(flat?0:15)).setFlipX(e.flip).setRotation(e.rotation).setDepth(y).setVisible(!e.layers?.length);
   const layers=e.layers??[];
   while(m.layers.length<layers.length)m.layers.push(this.scene.add.image(0,0,'hollow-body'));
   m.layers.forEach((image,i)=>{const layer=layers[i];image.setVisible(!!layer);if(layer)image.setTexture(layer.texture,layer.frame).setDisplaySize(layer.width,layer.height)
    .setOrigin(layer.originX,layer.originY).setPosition(x+layer.x,y+layer.y).setRotation(layer.rotation).setFlipX(layer.flip).setDepth(y+layer.depth*.001);});
   m.shadow.setPosition(x,y+12).setDepth(y-2).setVisible(true);
   m.warning.setPosition(e.warningX,e.warningY).setDisplaySize(e.warningWidth,e.warningHeight).setRotation(e.angle).setDepth(e.y-1).setVisible(e.warning);
   const ranged=e.species.includes('Spitter')||e.species==='thorn';
   m.line.setPosition(e.x,e.y).setRotation(e.angle).setDepth(e.y-1).setVisible(e.warning&&ranged);
   m.hp.setPosition(e.x-20,e.y-62).setDisplaySize(40*e.hp/e.maxHp,4).setDepth(10002).setVisible(damaged);
   m.name.setText(SPECIES[e.species as SpeciesId]?.name??'Criatura').setPosition(e.x,e.y-79).setDepth(10003).setVisible(damaged||e.warning);
  }
  for(const[id,m]of this.mirrors)if(!live.has(id)){for(const key of ['body','shadow','warning','line','hp','name'] as const)m[key].setVisible(false);m.layers.forEach(image=>image.setVisible(false));}
  const shots=[...world.shots,...world.enemies.flatMap(e=>e.projectile?[e.projectile]:[])].slice(0,64);
  while(this.projectiles.length<shots.length)this.projectiles.push(this.scene.add.rectangle(0,0,23,5,0xffbd54,.9));
  this.projectiles.forEach((view,i)=>{const shot=shots[i];view.setVisible(!!shot);if(shot)view.setFillStyle('friendly' in shot&&shot.friendly?0x5fe6d8:0xffbd54,.9).setPosition(shot.x,shot.y).setRotation(shot.rotation).setDepth(shot.y+5);});
 }
 destroy():void{this.partner?.destroy();this.mirrorHost?.destroy();this.visitorWave.destroy();this.status.destroy();}
}
