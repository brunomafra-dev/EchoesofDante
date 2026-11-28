import * as T from 'three';
import './style.css';
import {Character,DEFAULT_LOOK,HAIR,HAIR_COLORS,BROWS,CLOTH,OUTFITS,SKINS,type Look,type Sex} from './character';
import {CLASSES,CLASS_ORDER,WEAPON_CLASS,ELEMENTS,ELEMENT_NAMES,ELEMENT_COLORS,type ClassId,type Element} from './classes';
import {World,ARENA} from './world';
import {Sound,type Sfx} from './audio';
import {VFX,type Kind} from './vfx';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {Creature,MODELS,ANIMS,MODEL_DEF,SPECIES,ink,menace,updateSpits,clearShots,tickTele,teleWarm,petModel,petBody,motion,type Ctx,type SpeciesId,type Motion,type PetLook} from './creatures';
import {PETS,PET_ORDER,isPet,type PetId,type PetDef} from './pets';
import {loadRoster,saveRoster,newId,journalKey,forget,cleanName,NAME_MAX,type HeroSave} from './save';
import {BIOMES,BIOME_ORDER,type BiomeId} from './biomes';
import {Npc,CAMP} from './camp';
import {Journal,MISSIONS,EXPEDITIONS,ALL_MISSIONS,NPCS,NPC_INFO,missionById,type Goal,type NpcId,type Mission} from './missions';
import {ART_NAMES,ART_COLORS,type Art} from './expeditions';
import {Net,type Profile,type NetEvent,type PetState} from './net';
import {Gear,REGION_LOOT,GOAL_XP,POTION_HEAL,POTION_CD,type Stats} from './gear';
import {gearKey} from './save';
import type {Armour} from './outfit';
import {EQUIPMENT,EQUIPMENT_IDS,EQUIPMENT_SLOTS,SLOT_NAMES,RARITY_COLORS,BAG_SIZE,equipmentName,type EquipmentId,type EquipmentSlot} from '../config/equipment';
import {MATERIAL_NAMES,recipe,salePrice,POTION_PRICE} from '../config/economy';

// Echoes of Dante — new 3D track, slice S1: character creator + first playable ARPG loop.
const q=new URLSearchParams(location.search);
const app=document.getElementById('app')!;
const renderer=new T.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
const isTouch=matchMedia('(pointer:coarse)').matches||'ontouchstart' in window;
const MAX_PR=Math.min(devicePixelRatio,1.25);let pr=isTouch?1:MAX_PR;renderer.setPixelRatio(pr);renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFShadowMap;
renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
app.appendChild(renderer.domElement);
const camera=new T.PerspectiveCamera(40,1,.1,200);
const world=new World(renderer,camera);
const hero=new Character();world.scene.add(hero.root);
const sound=new Sound();
const sfx=(n:Sfx,at?:T.Vector3)=>sound.play(n,at?Math.hypot(at.x-hero.root.position.x,at.z-hero.root.position.z):0);
const key=new T.DirectionalLight('#ffd9b0',2.4);world.scene.add(key,key.target);   // soft portrait key that follows the hero

// ---------- state ----------
type Mode='creator'|'play';
let mode:Mode='creator';
// saved characters (name, look, companion) and the one being played or previewed
const roster=loadRoster();let heroRec:HeroSave|null=roster.list.find(h=>h.id===roster.current)??null;let editing:'new'|'edit'='new';
let look:Look=heroRec?{...heroRec.look}:{...DEFAULT_LOOK};let petId:PetId=heroRec?.pet??'symbiont';
let journal=new Journal(heroRec?journalKey(heroRec.id):null);
// level, backpack and wallet of the character (gear.ts, with the rules of the 2D)
let gear=new Gear(null);let gstats:Stats=gear.stats();let potionReady=0;
const qMul=()=>1+gstats.charge;   // equipment bonus to the Q damage
const pos=hero.root.position;let heading=0,hp=100,hpMax=100,mana=100,kills=0,dead=false;
const keys=new Set<string>();let moveTarget:T.Vector3|null=null;let mouseDown=false,rightDown=false;const mouse=new T.Vector2();const aimPoint=new T.Vector3(0,0,-5);
let atkUntil=0,atkImpact=0,atkPending:null|(()=>void)=null,rollUntil=0,rollDir=new T.Vector3(),stunUntil=0,comboIdx=0,invulnUntil=0,camBlend=0;
let focusEnemy:Enemy|null=null;void focusEnemy;


// ---------- class kit ----------
const cls=():ClassId=>WEAPON_CLASS[look.weapon];
const kit=()=>CLASSES[cls()];
let element:Element='energy',skillReady=0,dashReady=0,chargeStart=0,lungeReady=0,lungeSpeed=0,lungeBonus=1;

// ---------- creatures of Dante (bestiary of the 2D game) ----------
type Enemy=Creature;
const enemies:Enemy[]=[];let spawnT=0;
const ctx:Ctx={scene:world.scene,get vfx(){return vfx;},player:pos,playerOk:()=>mode==='play'&&!dead,invuln:()=>now()<invulnUntil||dead,
 damagePlayer:(d,from)=>damage(d,from),collide:(p,r)=>world.collide(p,r),colliders:()=>world.colliders,popText,
 sfx:(n,p)=>sfx(n as Sfx,p),
 onKill:(c)=>{kills++;reward(c);if(c.boss){bossDown(c);}else biomeKills++;hud();},onHit:(c,quiet)=>{if(!quiet)sfx('hit',c.pos);if(cls()==='xenobinder'&&!quiet)mana=Math.min(100,mana+6);},others:enemies,power:()=>1+gstats.damage} as Ctx;
Creature.ctx=ctx;
// residents of the region live in fixed habitats (as in the 2D maps): the same groups at the same places on every
// visit; a cleared habitat is renewed after a while, only when the player is far from it
interface Hab{id:number;x:number;z:number;kinds:SpeciesId[];alive:Enemy[];clearedAt:number}
let habs:Hab[]=[];
const HAB_RENEW=60,HAB_SAFE=20;
function spawnHab(h:Hab){
  h.alive=h.kinds.map((k,i)=>{const a=i*2.4+h.id,r=i?1.8:0;const e=new Creature(k,h.x+Math.cos(a)*r,h.z+Math.sin(a)*r,world.scene);e.habitat=h.id;world.collide(e.pos,e.radius);e.home.copy(e.pos);e.heading=Math.random()*6.28;enemies.push(e);return e;});
  h.clearedAt=-1;
}
function populate(){habs=world.habitats.map(h=>({...h,alive:[],clearedAt:-1}));for(const h of habs)spawnHab(h);}
function renewHabitats(){
  const n=now();
  for(const h of habs){if(h.alive.some(e=>e.state!=='dead'))continue;if(h.clearedAt<0){h.clearedAt=n;continue;}
   if(n-h.clearedAt>HAB_RENEW&&Math.hypot(pos.x-h.x,pos.z-h.z)>HAB_SAFE)spawnHab(h);}
}
// region bosses wake after enough kills in their region
let biomeKills=0,boss:Creature|null=null,bossBeaten=false;
function bossDown(c:Creature){bossBeaten=true;boss=null;const was=nextOpen();journal.beat(c.kind);sealPortals();renderBiomes();if(!was&&nextOpen())later(3,()=>toast(`O portal norte se abriu: ${BIOMES[BIOME_ORDER[BIOME_ORDER.indexOf(world.biome)+1]].name}`));for(const g of journal.open())if(g.kind==='boss'&&g.boss===c.kind)goalDone(g);sound.music(world.biome);banner(`${c.name} foi derrotado`);$('bossbar').classList.remove('on');}
function banner(text:string){const b=$('banner');b.textContent=text;b.classList.remove('on');void b.offsetWidth;b.classList.add('on');}
function updateEnemies(dt:number,now:number){
  const B=BIOMES[world.biome];
  if(mode==='play'&&B.boss&&!boss&&!bossBeaten&&(biomeKills>=(B.bossAfter??10)||journal.bossCalled(world.biome))&&spawnT<=0){const a=Math.random()*6.28,arena=world.biome==='domain';boss=new Creature(B.boss,arena?0:pos.x+Math.cos(a)*16,arena?0:pos.z+Math.sin(a)*16,world.scene);world.collide(boss.pos,boss.radius);enemies.push(boss);banner(`${boss.name} desperta`);sound.music(B.boss);sfx('roar');$('bossname').textContent=boss.name;$('bossbar').classList.add('on');}
  if(boss)$('bossfill').style.width=Math.max(0,boss.hp/boss.spec.hp*100)+'%';
  spawnT-=dt;if(mode==='play')renewHabitats();
  updatePortals();
  for(let i=enemies.length-1;i>=0;i--){const e=enemies[i];e.update(dt,now,ctx);e.g.visible=fixedCam!==null||Math.hypot(e.pos.x-pos.x,e.pos.z-pos.z)<(e.boss?45:30);if(world.biome==='camp'&&e.state!=='dead'){const d=Math.hypot(e.pos.x,e.pos.z);if(d<19&&d>.01){e.pos.x*=19/d;e.pos.z*=19/d;}}if(e.gone)enemies.splice(i,1);}
  updateSpits(dt,ctx);tickTele(dt);
}

// ---------- projectiles & fx ----------
const vfx=new VFX(world.scene);
for(const f of world.flameSpots)vfx.campfire(f.p,f.s);
// ghost: a projectile of another player in the room, only to be seen
interface Proj{o:T.Object3D;kind:Kind;v:T.Vector3;life:number;dmg:number;elem?:Element;mark?:boolean;burst?:{r:number;dmg:number};ghost?:boolean}
const projs:Proj[]=[];
function dispose(o:T.Object3D){o.removeFromParent();o.traverse(c=>{const m=c as T.Mesh;m.geometry?.dispose();const mt=m.material as T.Material|T.Material[]|undefined;if(Array.isArray(mt))mt.forEach(x=>x.dispose());else mt?.dispose();});}
function fire(kind:Kind,from:T.Vector3,dir:T.Vector3,speed:number,dmg:number,o:{elem?:Element;mark?:boolean;burst?:{r:number;dmg:number};life?:number}={}){
  const g=vfx.projectile(kind);g.position.copy(from);g.lookAt(from.clone().add(dir));vfx.muzzle(kind,from,dir);
  projs.push({o:g,kind,v:dir.clone().multiplyScalar(speed),life:o.life??1.2,dmg,elem:o.elem,mark:o.mark,burst:o.burst});
  if(speed>0)net.event({k:'shot',x:from.x,y:from.y,z:from.z,h:Math.atan2(dir.x,dir.z),w:kind,v:speed,l:o.life??1.2});
}
// what another player of the room shoots: the same projectile, only to be seen (each one still fights their own creatures)
function ghostShot(kind:Kind,from:T.Vector3,dir:T.Vector3,speed:number,life:number){
  const g=vfx.projectile(kind);g.position.copy(from);g.lookAt(from.clone().add(dir));vfx.muzzle(kind,from,dir);
  projs.push({o:g,kind,v:dir.clone().multiplyScalar(speed),life,dmg:0,ghost:true});
}
function updateFx(dt:number){
  for(let i=projs.length-1;i>=0;i--){
   const p=projs[i];p.o.position.addScaledVector(p.v,dt);p.life-=dt;let hit:Enemy|null=null;
   p.o.position.y+=(1.15-p.o.position.y)*Math.min(1,dt*4);
   vfx.trail(p.kind,p.o,p.v,dt);
   if(!p.ghost)for(const e of enemies)if(e.state!=='dead'&&Math.hypot(e.pos.x-p.o.position.x,e.pos.z-p.o.position.z)<e.radius+.25){hit=e;break;}
   if(hit){const IMP:Record<string,Sfx>={pulse:'hit',fire:'fire',water:'water',earth:'earth',energy:'energy',filament:'bite'};sfx(IMP[p.kind],p.o.position);applyHit(hit,p.dmg,p.o.position.clone().addScaledVector(p.v,-.05),p.elem);if(p.mark)hit.markUntil=now()+2.2;
    if(p.burst){const c=p.o.position.clone().setY(0);vfx.field('water',c,p.burst.r);vfx.decal(c,'#a8f0ff',p.burst.r,.6,1);vfx.shake=Math.max(vfx.shake,.2);for(const e of enemies)if(e!==hit&&e.state!=='dead'&&Math.hypot(e.pos.x-c.x,e.pos.z-c.z)<p.burst.r+e.radius*.5)applyHit(e,p.burst.dmg,c,'water');}}
   if(hit||p.life<=0){if(hit||p.kind!=='pulse')vfx.impact(p.kind,p.o.position,p.v.clone().normalize());dispose(p.o);projs.splice(i,1);}
  }
  // twisting slash damage ticks
  if(twist){const n=now();if(n>=twist.next){twist.next=n+.16;for(const e of enemies)if(e.state!=='dead'&&e.pos.distanceTo(pos)<twist.r){e.hit(twist.dmg,pos,'#9ff4ff',false,4);if(kit().leech)hp=Math.min(hpMax,hp+twist.dmg*kit().leech!);vfx.hitSpark(e.pos.clone().setY(1.1),e.pos.clone().sub(pos).normalize());}}if(n>=twist.until){twist=null;}}
  vfx.update(dt);
}
let twist:{until:number;next:number;r:number;dmg:number}|null=null,spinUntil=0;
const texts:{el:HTMLElement;p:T.Vector3;t:number}[]=[];
function popText(p:T.Vector3,s:string,color:string){const el=document.createElement('div');el.className='dmg';el.textContent=s;el.style.color=color;ui.appendChild(el);texts.push({el,p,t:0});}
// health bar and name over every creature that is fighting or hurt (bosses keep the big bar on top)
const bars=new Map<Enemy,HTMLElement>();
function updateBars(){
  const v=new T.Vector3();
  for(const [e,el] of bars)if(e.gone||!enemies.includes(e)){el.remove();bars.delete(e);}
  for(const e of enemies){
   const show=mode==='play'&&!e.boss&&e.state!=='dead'&&(e.state!=='idle'&&e.state!=='return'||e.hp<e.spec.hp)&&e.pos.distanceTo(pos)<26;
   let el=bars.get(e);
   if(!show){if(el)el.style.display='none';continue;}
   if(!el){el=document.createElement('div');el.className='ebar';el.innerHTML=`<b></b><i><u></u></i>`;el.querySelector('b')!.textContent=e.name;ui.appendChild(el);bars.set(e,el);}
   v.copy(e.pos);v.y+=e.look.height*e.spec.scale+.35;v.project(camera);
   if(v.z>1){el.style.display='none';continue;}
   el.style.display='';el.style.transform=`translate(${(v.x*.5+.5)*innerWidth}px,${(-v.y*.5+.5)*innerHeight}px) translate(-50%,-100%)`;
   const k=Math.max(0,e.hp/e.spec.hp);(el.querySelector('u') as HTMLElement).style.width=(k*100).toFixed(1)+'%';el.classList.toggle('low',k<.3);
  }
}
function updateTexts(dt:number){
  const v=new T.Vector3();
  for(let i=texts.length-1;i>=0;i--){
   const x=texts[i];x.t+=dt;v.copy(x.p);v.y+=x.t*1.1;v.project(camera);
   x.el.style.transform=`translate(${(v.x*.5+.5)*innerWidth}px,${(-v.y*.5+.5)*innerHeight}px) translate(-50%,-50%)`;x.el.style.opacity=String(Math.max(0,1-x.t/.9));
   if(x.t>.9){x.el.remove();texts.splice(i,1);}
  }
}

// ---------- combat ----------
function faceTo(p:T.Vector3){heading=Math.atan2(p.x-pos.x,p.z-pos.z);}
function damage(d:number,from:T.Vector3){
  d*=1-(kit().guard??0);if(now()<shieldUntil)d*=.6;d*=1-gstats.resistance;
  hp=Math.max(0,hp-d);scan=null;sfx('hurt');popText(pos.clone().setY(2.2),String(Math.round(d)),'#ff6a5a');stunUntil=now()+.28;atkUntil=0;atkPending=null;chargeStart=0;chargeFx(false);
  const dir=pos.clone().sub(from).setY(0).normalize();pos.addScaledVector(dir,.35);
  if(hp<=0){dead=true;hero.play('Death01',{once:true,fade:.1});document.body.classList.add('dead');}else hero.play('Hit_Chest',{once:true,fade:.06});
  hud();
}
// game clock (seconds of simulated time) so slow frames slow everything together
const now=()=>time;
const timers:{at:number;fn:()=>void}[]=[];
const later=(sec:number,fn:()=>void)=>timers.push({at:time+sec,fn});
// elemental hit (astral) or plain hit
function applyHit(e:Enemy,dmg:number,from:T.Vector3,elem?:Element,color='#ffd27a'){
  if(!elem){e.hit(dmg,from,color);return;}
  if(elem==='energy')e.hit(dmg*1.25,from,ELEMENT_COLORS.energy);
  else if(elem==='fire'){e.hit(dmg,from,ELEMENT_COLORS.fire);e.burnUntil=now()+2.2;}
  else if(elem==='water'){e.hit(dmg*.9,from,ELEMENT_COLORS.water);e.slowUntil=now()+2.6;}
  else e.hit(dmg,from,ELEMENT_COLORS.earth,false,12);
}
const fwd=()=>new T.Vector3(Math.sin(heading),0,Math.cos(heading));
// shots fly flat toward the cursor, starting at the weapon's muzzle
function shotDir(from:T.Vector3){const d=aimPoint.clone().sub(from).setY(0);if(d.lengthSq()<.5)return fwd();d.normalize();if(d.dot(fwd())<.6)return fwd();return d;}
// warrior: a target out of reach (but close) is reached with a void lunge, untouchable on the way; the strike lands harder
function lungeTarget(){
  const k=kit();if(!k.lunge||now()<lungeReady)return null;
  const aim=aimPoint.clone().sub(pos).setY(0);const dir=aim.lengthSq()>.5?aim.normalize():fwd();
  let best:Enemy|null=null,bd=1e9;
  for(const e of enemies)if(e.state!=='dead'){const d=e.pos.clone().sub(pos).setY(0),l=d.length();
   if(l>k.primary.range*.85&&l<k.lunge.range&&dir.angleTo(d.normalize())<.75&&l<bd){bd=l;best=e;}}
  return best;
}
function lunge(e:Enemy){
  const n=now(),k=kit();const d=e.pos.clone().sub(pos).setY(0),l=d.length(),travel=Math.max(0,l-e.radius-.9);
  rollDir.copy(d.normalize());heading=Math.atan2(rollDir.x,rollDir.z);lungeSpeed=k.lunge!.speed;
  const dur=travel/lungeSpeed;rollUntil=n+dur;invulnUntil=n+dur+.1;lungeReady=n+k.lunge!.cd;moveTarget=null;atkPending=null;
  hero.play('Sprint_Loop',{fade:.04,speed:1.8});sfx('dash');vfx.decal(pos.clone(),'#7fe8ff',1.4,.35);net.event({k:'dash',x:pos.x,z:pos.z,h:heading});
  later(dur,()=>{lungeSpeed=0;lungeBonus=1.4;vfx.shake=Math.max(vfx.shake,.12);tryAttack();});
}
function tryAttack(){
  const n=now();if(mode!=='play'||dead||n<atkUntil||n<rollUntil||n<stunUntil||chargeStart)return;
  {const t=lungeBonus===1?lungeTarget():null;if(t){const near=enemies.some(e=>e.state!=='dead'&&e.pos.distanceTo(pos)<kit().primary.range*.85);if(!near){lunge(t);return;}}}
  const bonus=lungeBonus;lungeBonus=1;
  const k=kit(),clip=k.attacks[comboIdx++%k.attacks.length];
  const dur=hero.duration(clip)/k.atkSpeed;
  faceTo(aimPoint);hero.play(clip,{once:true,speed:k.atkSpeed,fade:.08});
  atkUntil=n+dur*.85;atkImpact=n+dur*k.impact;moveTarget=null;
  atkPending=()=>{
   const pr=k.primary,dir=fwd();
   if(pr.kind==='shot'){
    const from=hero.muzzle();const d=shotDir(from);
    const kind:Kind=cls()==='astral'?element:cls()==='hunter'?'pulse':'filament';
    sfx(kind==='pulse'?'shot':kind==='filament'?'filament':kind as Sfx);
    fire(kind,from,d,pr.speed!,pr.dmg,{elem:cls()==='astral'?element:undefined,mark:cls()==='xenobinder'});
    if(cls()==='hunter'){hero.recoil();mana=Math.min(100,mana+4);}
   }else{
    vfx.slash(pos,heading,comboIdx%2===0);sfx('swing');net.event({k:'slash',x:pos.x,z:pos.z,h:heading,r:comboIdx%2===0?1:0});let struck=false;
    for(const e of enemies)if(e.state!=='dead'){const d=e.pos.clone().sub(pos).setY(0),l=d.length();
     if(l<pr.range&&(l<.9||dir.angleTo(d.normalize())<pr.arc!/2)){if(!struck){struck=true;sfx('slashHit');}const dmg=pr.dmg*bonus*(.9+Math.random()*.25);e.hit(dmg,pos);vfx.hitSpark(e.pos.clone().setY(1.15),d);mana=Math.min(100,mana+8);if(k.leech)hp=Math.min(hpMax,hp+dmg*k.leech);}}
    // the wind blade keeps cutting in a line in front of the swing
    for(const e of enemies)if(e.state!=='dead'){const r=e.pos.clone().sub(pos).setY(0),along=r.dot(dir);if(along>=pr.range&&along<pr.range+2.2&&r.addScaledVector(dir,-along).length()<1.1)e.hit(pr.dmg*.6,pos,'#bff6ff');}
   }
  };
}
// Q: each class has its own skill
function skillDown(){
  const n=now(),k=kit();if(mode!=='play'||dead||n<atkUntil||n<rollUntil||n<stunUntil||n<skillReady)return;
  if(cls()==='warrior'){sfx('charge');chargeStart=n;moveTarget=null;hero.play('Sword_Idle',{fade:.1});chargeFx(true);return;}
  if(mana<k.skill.cost){popText(pos.clone().setY(2.4),`Sem ${k.resource.toLowerCase()}`,'#9a917f');return;}
  mana-=k.skill.cost;skillReady=n+k.skill.cd;faceTo(aimPoint);moveTarget=null;
  if(cls()==='hunter'){
   // gather energy, then a huge spark beam (Lux-style)
   const dir0=shotDir(hero.muzzle()),charge=.55,L=24;atkUntil=n+charge+.8;moveTarget=null;hero.play('Pistol_Idle_Loop',{fade:.1});
   net.event({k:'beam',x:pos.x,z:pos.z,h:Math.atan2(dir0.x,dir0.z)});
   sfx('charge');vfx.spark(()=>hero.muzzle(),()=>dir0,L,charge,()=>{sfx('beam');
    hero.play('Pistol_Shoot',{once:true,speed:.8,fade:.05});hero.recoil();
    const hitBeam=(dmg:number)=>{const from=hero.muzzle();for(const e of enemies)if(e.state!=='dead'){const r=e.pos.clone().sub(from).setY(0),along=r.dot(dir0);if(along>0&&along<L&&r.addScaledVector(dir0,-along).length()<1.25){e.hit(dmg,from,'#bff6ff',false,6);vfx.hitSpark(e.pos.clone().setY(1.1),dir0,'#bff6ff');}}};
    const qm=qMul();hitBeam(40*qm);later(.22,()=>hitBeam(25*qm));later(.44,()=>hitBeam(25*qm));
   });
  }else if(cls()==='astral'){
   const dur=hero.duration('Spell_Simple_Shoot')/1.4;hero.play('Spell_Simple_Shoot',{once:true,speed:1.4,fade:.08});atkUntil=n+dur*.85;atkImpact=n+dur*.45;
   const at=aimPoint.clone();const off=at.clone().sub(pos).setY(0);if(off.length()>9)at.copy(pos).addScaledVector(off.normalize(),9);
   const el=element;vfx.decal(at,ELEMENT_COLORS[el],2.6,.5);net.event({k:'field',x:at.x,z:at.z,h:0,w:el,l:dur*.45});
   atkPending=()=>{sfx(el as Sfx,at);vfx.field(el,at,2.7);for(const e of enemies)if(e.state!=='dead'&&Math.hypot(e.pos.x-at.x,e.pos.z-at.z)<2.9)applyHit(e,30*qMul(),at,el);};
  }else{
   const dur=hero.duration('Spell_Simple_Shoot')/1.5;hero.play('Spell_Simple_Shoot',{once:true,speed:1.5,fade:.08});atkUntil=n+dur*.7;
   pet?.command(aimPoint.clone());
  }
  hud();
}
// warrior: hold Q to charge, release for a Twisting Slash — the hero spins inside a whirl of blades
function skillUp(){
  if(!chargeStart||cls()!=='warrior')return;
  const n=now(),level=Math.min(1,Math.max(0,(n-chargeStart-.08)/.72));chargeStart=0;chargeFx(false);
  skillReady=n+kit().skill.cd;
  const dur=.75+level*.25,r=2.6+level*1.3;hero.play('Sword_Attack',{once:true,speed:1.2,fade:.05});atkUntil=n+dur;spinUntil=n+dur;
  vfx.twist(()=>pos,r,dur);sfx('twist');net.event({k:'twist',x:pos.x,z:pos.z,h:heading,r,l:dur});vfx.shake=.15+level*.15;
  twist={until:n+dur,next:n+.05,r,dmg:Math.round((50+60*level)/4*qMul())};
}
let chargeRing:T.Mesh|null=null;
function chargeFx(on:boolean){
  if(on&&!chargeRing){chargeRing=new T.Mesh(new T.RingGeometry(.86,1,56).rotateX(-Math.PI/2),new T.MeshBasicMaterial({color:'#7fe8ff',transparent:true,opacity:.8,blending:T.AdditiveBlending,depthWrite:false}));world.scene.add(chargeRing);}
  if(!on&&chargeRing){world.scene.remove(chargeRing);chargeRing=null;}
}
function cycleElement(){if(cls()!=='astral'||mode!=='play')return;element=ELEMENTS[(ELEMENTS.indexOf(element)+1)%ELEMENTS.length];hero.setGlow(ELEMENT_COLORS[element]);popText(pos.clone().setY(2.5),ELEMENT_NAMES[element],ELEMENT_COLORS[element]);hud();}
function roll(){
  const n=now(),k=kit();if(mode!=='play'||dead||n<rollUntil||n<dashReady)return;
  const d=inputDir();if(d.lengthSq()<.01)d.set(Math.sin(heading),0,Math.cos(heading));
  rollDir.copy(d.normalize());heading=Math.atan2(rollDir.x,rollDir.z);sfx('dash');
  const sp=hero.duration('Roll')/k.dash.dur;hero.play('Roll',{once:true,speed:sp,fade:.06});
  lungeSpeed=0;rollUntil=n+k.dash.dur;invulnUntil=n+k.dash.dur*.9;dashReady=n+k.dash.cd;atkUntil=0;atkPending=null;moveTarget=null;chargeStart=0;chargeFx(false);
}
function inputDir(){
  const d=new T.Vector3();
  if(keys.has('KeyW')||keys.has('ArrowUp'))d.z-=1;if(keys.has('KeyS')||keys.has('ArrowDown'))d.z+=1;
  if(keys.has('KeyA')||keys.has('ArrowLeft'))d.x-=1;if(keys.has('KeyD')||keys.has('ArrowRight'))d.x+=1;
  if(joy.id!==-1&&Math.hypot(joy.x,joy.y)>.15){d.x+=joy.x;d.z+=joy.y;}
  return d;
}

// ---------- companion (Domador) ----------
// one of three beasts (pets.ts), chosen when the character is created and traded at the beast pen of the base
let shieldUntil=0;
const shieldDome=new T.Mesh(new T.SphereGeometry(1.15,24,16),new T.MeshBasicMaterial({color:'#ffd27a',transparent:true,opacity:.1,blending:T.AdditiveBlending,depthWrite:false}));shieldDome.scale.set(1,1.35,1);shieldDome.visible=false;world.scene.add(shieldDome);
const rnd=(a:number,b:number)=>a+Math.random()*(b-a);
class Pet{
 g=new T.Group();root=new T.Group();look:PetLook|null;legs2:T.Object3D[]=[];t=0;cd=0;target:Enemy|null=null;def:PetDef;
 leap:{from:T.Vector3;to:T.Vector3;t:number;dur:number}|null=null;busy=0;acting=0;
 constructor(public id:PetId){
  this.def=PETS[id];this.g.add(this.root);
  this.look=petBody(this.root,this.def.model,this.def.glow,this.def.base);
  if(!this.look){const m=petModel();this.root.add(m.g);this.legs2=m.legs;}
  world.scene.add(this.g);
 }
 play(m:Motion,once=false,speed?:number){if(this.look)motion(this.look,m,once,speed);}
 // Q: the companion's own command, as in the 2D (leap, ground slam, glacial shot)
 command(at:T.Vector3){
  const p=this.g.position,n=now();this.target=null;
  if(this.id==='symbiont'){
   const to=at.clone().setY(0),off=to.clone().sub(pos).setY(0);if(off.length()>10)to.copy(pos).addScaledVector(off.normalize(),10);world.collide(to,.35);
   this.leap={from:p.clone(),to,t:0,dur:Math.max(.35,Math.min(.7,to.distanceTo(p)/14))};this.play('jump',true,1.5);sfx('dash',p);
  }else if(this.id==='bulwark'){
   this.busy=n+.8;this.acting=n+.8;this.play('attack',true,1.1);
   later(.35,()=>{const c=this.g.position.clone().setY(0);sfx('earth',c);net.event({k:'pet',x:c.x,z:c.z,h:0,w:'slam'});vfx.shake=Math.max(vfx.shake,.3);vfx.field('earth',c,3);vfx.decal(c,'#ffd27a',3.4,.6,1);
    for(let i=0;i<10;i++)vfx.shard(c.clone().setY(.3),new T.Vector3(rnd(-1,1),rnd(.8,1.6),rnd(-1,1)).normalize().multiplyScalar(rnd(4,8)),1);
    for(const e of enemies)if(e.state!=='dead'&&Math.hypot(e.pos.x-c.x,e.pos.z-c.z)<3.4+e.radius*.5)e.hit((n<e.markUntil?52:40)*qMul(),c,'#ffd27a',false,8);
    if(pos.distanceTo(c)<7){shieldUntil=now()+5;sfx('heal');popText(pos.clone().setY(2.4),'Protegido','#ffd27a');}});
  }else{
   this.busy=n+.55;this.acting=n+.55;const dir=at.clone().sub(p).setY(0);if(dir.lengthSq()<.01)dir.copy(fwd());dir.normalize();this.g.rotation.y=Math.atan2(dir.x,dir.z);this.play('attack',true);
   later(.15,()=>{const from=this.g.position.clone().setY(.75).addScaledVector(dir,.5);sfx('water',from);const qm=qMul();fire('water',from,dir,20,30*qm,{elem:'water',burst:{r:3,dmg:45*qm},life:1});});
  }
 }
 private land(){
  const c=this.g.position.clone().setY(0);sfx('slashHit',c);vfx.decal(c,'#7dff9e',2.8,.7,1);net.event({k:'pet',x:c.x,z:c.z,h:0,w:'land'});vfx.shake=Math.max(vfx.shake,.15);
  vfx.emit({pos:c.clone().setY(.4),n:30,speed:[1.5,4],up:.6,life:[.4,.8],size:[.18,.04],c0:'#e8ffe8',c1:'#2fae5a',a:[1,0],drag:1.5,spread:.8});
  for(const e of enemies)if(e.state!=='dead'&&Math.hypot(e.pos.x-c.x,e.pos.z-c.z)<2.6+e.radius*.5)e.hit((n2(e)?58:45)*qMul(),c,'#7dff9e',false,10);
  if(pos.distanceTo(c)<7){const heal=Math.round(hpMax*.08);hp=Math.min(hpMax,hp+heal);popText(pos.clone().setY(2.4),'+'+heal,'#7dff9e');sfx('heal');
   vfx.emit({pos:pos.clone().setY(1),n:20,speed:[.5,2],up:.8,life:[.5,.9],size:[.16,.03],c0:'#e8ffe8',c1:'#2fae5a',a:[1,0],drag:1,spread:.4});}
  function n2(e:Enemy){return now()<e.markUntil;}
 }
 // the beast beside the hero in the character creator
 preview(dt:number){this.g.position.set(-1.25,0,-1.1);this.g.rotation.y=.45;this.play('idle');this.look?.mixer?.update(dt);}
 update(dt:number,n:number){
  this.t+=dt;const p=this.g.position,d=this.def;let v=new T.Vector3(),moving=false;
  if(this.leap){const L=this.leap;L.t+=dt;const k=Math.min(1,L.t/L.dur);p.lerpVectors(L.from,L.to,k);p.y=Math.sin(k*Math.PI)*1.8;vfx.petTrail(p);
   this.g.rotation.y=Math.atan2(L.to.x-L.from.x,L.to.z-L.from.z);if(k>=1){p.y=0;this.leap=null;this.acting=n+.25;this.land();}}
  else if(n>=this.busy){
   if(!this.target||this.target.state==='dead'||this.target.pos.distanceTo(pos)>9){
    this.target=null;let bd=7;for(const e of enemies)if(e.state!=='dead'){const dd=e.pos.distanceTo(pos)-(n<e.markUntil?4:0);if(dd<bd){bd=dd;this.target=e;}}
   }
   const reach=d.shot?d.shot.range*.8:d.reach+(this.target?.radius??0)*.6;
   const goal=this.target?this.target.pos:pos.clone().add(new T.Vector3(Math.sin(heading+2.2)*1.6,0,Math.cos(heading+2.2)*1.6));
   const dv=goal.clone().sub(p).setY(0),l=dv.length();
   if(this.target&&l<reach){this.g.rotation.y=Math.atan2(dv.x,dv.z);
    if(n>this.cd){this.cd=n+d.biteCd;this.acting=n+.45;this.play('attack',true);const tg=this.target;
     if(d.shot){const sh=d.shot;later(.12,()=>{if(tg.state==='dead')return;const from=this.g.position.clone().setY(.75),dir=tg.pos.clone().sub(from).setY(0).normalize();from.addScaledVector(dir,.4);fire('water',from,dir,sh.speed,n<tg.markUntil?sh.dmg*1.4:sh.dmg,{elem:'water',life:.6});});}
     else{later(.12,()=>{if(tg.state==='dead')return;tg.hit(n<tg.markUntil?d.bite*1.4:d.bite,p,d.glow);sfx('bite',p);});}}}
   else if(l>(this.target?reach*.9:.6)){v=dv.normalize().multiplyScalar(Math.min(d.speed,l*3));moving=true;}
  }
  p.addScaledVector(v,dt);if(!this.leap)world.collide(p,.35);
  if(moving)this.g.rotation.y=Math.atan2(v.x,v.z);
  if(this.look){if(!this.leap&&n>=this.acting){const sp=v.length();if(moving&&sp>.3){this.play(sp>d.speed*.75?'run':'move');const a=this.look.acts?.[this.look.cur as Motion];if(a)a.timeScale=Math.max(.7,Math.min(2,sp/3));}else this.play('idle');}
   this.look.mixer?.update(dt);}
  else{const sw=moving?Math.sin(this.t*14)*.6:0;this.legs2.forEach((l,i)=>l.rotation.x=(i%2?1:-1)*(i<2?1:-1)*sw);if(!this.leap)p.y=moving?Math.abs(Math.sin(this.t*14))*.04:0;}
 }
 remove(){world.scene.remove(this.g);}
}
let pet:Pet|null=null;
function syncPet(){
  const want=cls()==='xenobinder'&&!best;
  if(pet&&(!want||pet.id!==petId)){pet.remove();pet=null;}
  if(want&&!pet){pet=new Pet(petId);if(mode==='play')pet.g.position.copy(pos).add(new T.Vector3(1.2,0,1));}
}

// ---------- update ----------
let moving=false,sprinting=false;
function updatePlayer(dt:number){
  const n=now();
  if(atkPending&&n>=atkImpact){const f=atkPending;atkPending=null;f();}
  if(dead)return;
  mana=Math.min(100,mana+dt*kit().regen);
  const locked=n<atkUntil||n<stunUntil;
  const v=new T.Vector3();
  if(n<rollUntil){v.copy(rollDir).multiplyScalar(lungeSpeed||kit().dash.speed);if(lungeSpeed)vfx.emit({pos:pos.clone().setY(1),n:2,dir:rollDir.clone().negate(),cone:.4,speed:[1,3],life:[.2,.35],size:[.25,.05],c0:'#e8fbff',c1:'#5fd8ff',a:[.8,0],drag:2});}
  else if(!locked){
   const d=inputDir();
   if(d.lengthSq()>0){moveTarget=null;d.normalize();}
   else if(moveTarget){const t=moveTarget.clone().sub(pos).setY(0);if(t.length()<.25)moveTarget=null;else d.copy(t.normalize());}
   sprinting=keys.has('ShiftLeft')||keys.has('ShiftRight');
   if(d.lengthSq()>0){v.copy(d).multiplyScalar(kit().speed*(chargeStart?.35:sprinting?1.45:1));heading=Math.atan2(d.x,d.z);}
  }
  moving=v.lengthSq()>.01;
  pos.addScaledVector(v,dt);world.collide(pos,.4);
  if(world.biome==='camp')for(const n of npcs){const dx=pos.x-n.pos.x,dz=pos.z-n.pos.z,d=Math.hypot(dx,dz);if(d<.8&&d>1e-4){pos.x=n.pos.x+dx/d*.8;pos.z=n.pos.z+dz/d*.8;}}
  // turn smoothly
  const cur=hero.model?.rotation.y??0;let dh=heading-cur;dh=Math.atan2(Math.sin(dh),Math.cos(dh));
  if(hero.model){if(n<spinUntil)hero.model.rotation.y=cur-dt*19;else hero.model.rotation.y=cur+dh*Math.min(1,dt*14);}
  if(chargeStart){const lv=Math.min(1,(n-chargeStart)/.8);for(let i=0;i<2;i++){const a=Math.random()*6.28,rr=1.6-lv*.6;vfx.emit({pos:new T.Vector3(pos.x+Math.cos(a)*rr,.3+Math.random()*1.4,pos.z+Math.sin(a)*rr),n:1,dir:new T.Vector3(-Math.cos(a),0,-Math.sin(a)),cone:.1,speed:[2,3.5],life:[.3,.4],size:[.14,.03],c0:'#ffffff',c1:'#5fd8ff',a:[.2,1],drag:0});}}
  // pick animation
  if(chargeStart){faceTo(aimPoint);if(chargeRing){const lv=Math.min(1,(n-chargeStart)/.8);chargeRing.position.copy(pos).setY(.06);chargeRing.scale.setScalar(.6+lv*1.4);(chargeRing.material as T.MeshBasicMaterial).opacity=.4+lv*.5;}}
  if(n>=rollUntil&&n>=atkUntil&&n>=stunUntil&&!chargeStart){
   const w=kit();
   if(moving)hero.play(sprinting?'Sprint_Loop':(look.weapon==='saber'&&false?'Walk_Loop':'Jog_Fwd_Loop'),{fade:.2});
   else hero.play(scan?'Interact':hero.has(w.idle)?w.idle:'Idle_Loop',{fade:.25});
  }
  if(mouseDown&&mode==='play'&&!locked&&n>=rollUntil){updateAim();const e=enemyAt(aimPoint);if(e){focusEnemy=e;faceTo(e.pos);const l=pos.distanceTo(e.pos),lk=kit().lunge;if(lk&&l>kit().primary.range*.85&&l<lk.range&&n>=lungeReady)lunge(e);else tryAttack();}else{focusEnemy=null;faceTo(aimPoint);tryAttack();}}
  hp=Math.min(hpMax,hp+dt*.4);
  pet?.update(dt,n);
  shieldDome.visible=n<shieldUntil;if(shieldDome.visible){shieldDome.position.copy(pos).setY(1);(shieldDome.material as T.MeshBasicMaterial).opacity=.08+.04*Math.sin(n*6)+(shieldUntil-n<1?-.08*(1-(shieldUntil-n)):0);}
}
function enemyAt(p:T.Vector3){let best:Enemy|null=null,bd=1.4;for(const e of enemies)if(e.state!=='dead'){const d=Math.hypot(e.pos.x-p.x,e.pos.z-p.z);if(d<bd){bd=d;best=e;}}return best;}
const ray=new T.Raycaster(),plane=new T.Plane(new T.Vector3(0,1,0),0);
function updateAim(){ray.setFromCamera(mouse,camera);ray.ray.intersectPlane(plane,aimPoint);}

// ---------- camera ----------
const camPos=new T.Vector3(),camLook=new T.Vector3(),cTmp=new T.Vector3();let zoom=1,previewYaw=-.55;let close:{bone:string;off:T.Vector3}|null=null;let fixedCam:[T.Vector3,T.Vector3]|null=null;
function updateCamera(dt:number){
  const target=mode==='play'?1:0;camBlend+=(target-camBlend)*Math.min(1,dt*2.6);
  const k=camBlend*camBlend*(3-2*camBlend);
  // creator: close, side-lit portrait ; play: ARPG three-quarter overhead
  const narrow=innerWidth<700;
  const cp=narrow?cTmp.set(pos.x,pos.y+1.5,pos.z+5.6):cTmp.set(pos.x-.4,pos.y+1.4,pos.z+4.2),cl=narrow?new T.Vector3(pos.x,pos.y+.4,pos.z):new T.Vector3(pos.x-.95,pos.y+1.0,pos.z);
  const pp=new T.Vector3(pos.x,pos.y+10.5*zoom,pos.z+8.6*zoom),pl=new T.Vector3(pos.x,pos.y+.9,pos.z);
  camPos.copy(cp).lerp(pp,k);camLook.copy(cl).lerp(pl,k);
  if(close&&hero.model){const b=hero.model.getObjectByName(close.bone);if(b){hero.model.updateMatrixWorld(true);const c=b.getWorldPosition(new T.Vector3());camLook.copy(c);camPos.copy(c).add(close.off.clone().applyAxisAngle(new T.Vector3(0,1,0),hero.model.rotation.y));}}
  if(vfx.shake>.01){const s=vfx.shake*.35;camPos.x+=(Math.random()-.5)*s;camPos.y+=(Math.random()-.5)*s;camPos.z+=(Math.random()-.5)*s;}
  if(fixedCam){camPos.copy(fixedCam[0]);camLook.copy(fixedCam[1]);}
  camera.position.copy(camPos);camera.lookAt(camLook);
  vfx.setView(renderer.domElement.height,camera.fov);
  camera.fov=T.MathUtils.lerp(32,40,k);camera.updateProjectionMatrix();
}

// ---------- ui ----------
const ui=document.createElement('div');ui.id='ui';app.appendChild(ui);
ui.innerHTML=`
<div id="select"><h1>Seus personagens</h1><p class="sub">Echoes of Dante · nova experiência 3D · salvos neste aparelho</p>
 <div id="s-list"></div><button id="s-play">Entrar no mundo</button>
 <div class="row s-row"><button class="chip" id="s-edit">Editar aparência</button><button class="chip" id="s-del">Excluir</button></div>
 <button class="chip s-new" id="s-new">+ Novo personagem</button><p class="hint">Arraste para girar o personagem</p></div>
<div id="creator"><h1 id="c-title">Crie seu personagem</h1><p class="sub">Echoes of Dante · nova experiência 3D (primeira fatia jogável)</p>
 <div class="grp"><label for="o-name">Nome</label><input id="o-name" maxlength="18" autocomplete="off" spellcheck="false" placeholder="Como vão chamar você em Dante?"></div>
 <div class="grp"><label>Corpo</label><div class="row" id="o-sex"></div></div>
 <div class="grp"><label>Pele</label><div class="row" id="o-skin"></div></div>
 <div class="grp"><label>Cabelo</label><div class="row wrap" id="o-hair"></div></div>
 <div class="grp"><label>Cor do cabelo</label><div class="row" id="o-hcol"></div></div>
 <div class="grp"><label>Sobrancelhas</label><div class="row" id="o-brow"></div></div>
 <div class="grp"><label>Vestimenta</label><div class="row wrap" id="o-outfit"></div></div>
 <div class="grp"><label>Cor da roupa</label><div class="row" id="o-cloth"></div></div>
 <div class="grp"><label>Capacete</label><div class="row" id="o-helmet"></div></div>
 <div class="grp"><label>Classe</label><div class="row wrap" id="o-class"></div><div class="clsinfo" id="o-clsinfo"></div></div>
 <div class="grp" id="g-pet"><label>Fera companheira</label><div class="row wrap" id="o-pet"></div><div class="clsinfo" id="o-petinfo"></div></div>
 <button id="go">Criar e entrar no mundo</button><button class="chip" id="back">Voltar aos personagens</button><p class="hint">Arraste para girar o personagem</p></div>
<div id="hud"><div class="orb hp"><i id="hp"></i><b id="hpt"></b></div><div id="clsname"></div><div class="bar" id="skillbar"></div><div class="orb mp"><i id="mp"></i><b id="mpt"></b></div><div id="kills"></div><div id="xpbar"><i id="xpfill"></i><span id="xpt"></span></div><button id="potbtn" title="Poção de cura (R)"><svg viewBox="0 0 32 32" width="34" height="34" aria-hidden="true"><defs><linearGradient id="potliq" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff5a4a"/><stop offset="1" stop-color="#7a0a0a"/></linearGradient></defs><path d="M12 3h8v2h-1v6.2c4 1.5 7 5.3 7 9.8 0 5.8-4.5 9-10 9S6 26.8 6 21c0-4.5 3-8.3 7-9.8V5h-1z" fill="#1a1512" stroke="#c9a45a" stroke-width="1.4" stroke-linejoin="round"/><path d="M7.6 19.5h16.8c.3.5.4 1 .4 1.5 0 4.7-3.8 7.3-8.8 7.3S7.2 25.7 7.2 21c0-.5.1-1 .4-1.5z" fill="url(#potliq)"/><ellipse cx="12" cy="21.5" rx="1.6" ry="2.4" fill="#ffd0c8" opacity=".55"/><rect x="11.5" y="2" width="9" height="2.6" rx="1" fill="#8a6a3a"/></svg><i id="potcd"></i><b id="pott"></b><kbd>R</kbd></button></div><button id="optbtn" title="Opções">&#9776;</button><button id="bagbtn" title="Equipamento e mochila (I)"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><path d="M8 7V5.5a4 4 0 0 1 8 0V7"/><path d="M5 9a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2z"/><path d="M9 13h6v3H9z"/></svg></button><button id="mapbtn" title="Atlas de Dante (M)"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2z"/><path d="M9 4v14M15 6v14"/></svg></button><div id="perf"><span id="fps"></span></div>
<div id="biomes"></div><div id="portalhint"></div><div id="touch"><button id="t-atk">Atacar</button><button id="t-q">Carga</button><button id="t-dash">Esquiva</button><button id="t-e">Energia</button><button id="t-act">Falar</button></div><div id="joy"><i></i></div><div id="modal"><div class="box"><h2 id="mtitle"></h2><div id="mbody"></div><button id="mclose">Fechar</button></div></div><div id="banner"></div><div id="fade"></div><div id="bossbar"><span id="bossname"></span><div><i id="bossfill"></i></div></div>
<div id="tracker"></div><div id="prompt"></div><div id="guide"><i></i><span></span></div><div id="record"></div><div id="toast"></div>
<div id="deadmsg"><h2>Você caiu</h2><button id="respawn">Levantar</button></div>
<div id="loading">Carregando…</div>`;
const $=(id:string)=>document.getElementById(id)!;
function chips(host:string,items:[string,string][],cur:()=>string,pick:(id:string)=>void){
  const h=$(host);h.innerHTML='';
  for(const [id,label] of items){const b=document.createElement('button');b.className='chip'+(cur()===id?' on':'');b.textContent=label;b.onclick=()=>{sfx('ui');pick(id);refreshUi();};h.appendChild(b);}
}
function swatches(host:string,cols:string[],cur:()=>number,pick:(i:number)=>void){
  const h=$(host);h.innerHTML='';
  cols.forEach((c,i)=>{const b=document.createElement('button');b.className='sw'+(cur()===i?' on':'');b.style.background=c;b.onclick=()=>{pick(i);refreshUi();};h.appendChild(b);});
}
const hexOf=(c:[number,number,number])=>'#'+c.map(v=>Math.round(Math.min(1,v/3.5*1.1)*255).toString(16).padStart(2,'0')).join('');
async function change(patch:Partial<Look>){
  const next={...look,...patch};
  if(patch.sex&&patch.sex!==look.sex){next.hair=HAIR[patch.sex][0][0];}
  look=next;
  if(patch.sex)await hero.setSex(look.sex);
  hero.apply(look);if(patch.weapon||patch.sex)await hero.setWeapon(look.weapon);
}
function refreshUi(){
  chips('o-sex',[['male','Masculino'],['female','Feminino']],()=>look.sex,id=>void change({sex:id as Sex}).then(refreshUi));
  swatches('o-skin',SKINS,()=>look.skin,i=>void change({skin:i}));
  chips('o-hair',HAIR[look.sex],()=>look.hair,id=>void change({hair:id}));
  swatches('o-hcol',HAIR_COLORS.map(c=>hexOf(c[1])),()=>look.hairColor,i=>void change({hairColor:i}));
  chips('o-brow',BROWS,()=>look.brows,id=>void change({brows:id}));
  chips('o-outfit',OUTFITS,()=>look.outfit,id=>void change({outfit:id}));
  swatches('o-cloth',CLOTH.map(c=>c[1]),()=>look.cloth,i=>void change({cloth:i}));
  chips('o-helmet',[['0','Sem'],['1','Com visor']],()=>look.helmet?'1':'0',id=>void change({helmet:id==='1'}));
  // the class is chosen once, when the character is created
  if(editing==='new')chips('o-class',CLASS_ORDER.map(c=>[c,CLASSES[c].name] as [string,string]),()=>cls(),id=>void change({weapon:CLASSES[id as ClassId].weapon}).then(()=>{syncPet();refreshUi();}));
  else $('o-class').innerHTML=`<span class="fixed">${kit().name}</span>`;
  const k=kit();$('o-clsinfo').innerHTML=`<b>${k.role}</b><span>${k.fantasy}</span><i>${k.kit}</i>`;
  $('g-pet').style.display=cls()==='xenobinder'?'':'none';
  chips('o-pet',PET_ORDER.map(id=>[id,PETS[id].name] as [string,string]),()=>petId,id=>{petId=id as PetId;syncPet();});
  const pd=PETS[petId];$('o-petinfo').innerHTML=`<b>${pd.role} · ${pd.command}</b><span>${pd.desc}</span><i>Pode ser trocada depois no abrigo das feras, no acampamento.</i>`;
  $('c-title').textContent=editing==='new'?'Crie seu personagem':'Editar aparência';
  $('go').textContent=editing==='new'?'Criar e entrar no mundo':'Salvar e entrar no mundo';
  $('back').style.display=roster.list.length?'':'none';
}
function hud(){
  const k=kit();
  $('hp').style.height=(hp/hpMax*100)+'%';$('mp').style.height=mana+'%';$('hpt').textContent=String(Math.ceil(hp));$('mpt').textContent=String(Math.floor(mana));
  const col=cls()==='astral'?ELEMENT_COLORS[element]:k.resColor;$('mp').style.background=`radial-gradient(circle at 40% 30%,${col},#0b1420 75%)`;
  const n=now(),cdq=Math.max(0,skillReady-n),cdd=Math.max(0,dashReady-n);
  const sb=`<div class="sk"><kbd>Botão esq. / J</kbd>${k.primary.kind==='melee'?'golpe':'disparo'}</div><div class="sk${cdq?' cd':''}"><kbd>Dir. / Q</kbd>${skillName()}${k.skill.cost?` · ${k.skill.cost}`:''}${cdq?` (${cdq.toFixed(1)})`:''}</div>${cls()==='astral'?`<div class="sk"><kbd>E</kbd><span style="color:${ELEMENT_COLORS[element]}">${ELEMENT_NAMES[element]}</span></div>`:''}${k.lunge?`<div class="sk${n<lungeReady?' cd':''}"><kbd>Alvo longe</kbd>Investida</div>`:''}<div class="sk${cdd?' cd':''}"><kbd>Espaço</kbd>${k.dash.name}</div><div class="sk"><kbd>Shift</kbd>correr</div>`;
  if($('skillbar').innerHTML!==sb)$('skillbar').innerHTML=sb;
  const cn=`<b class="lvl">Nv ${gear.level}</b> <b class="hname"></b>${k.name} · <span style="color:${col}">${k.resource}</span>`;if($('clsname').dataset.k!==cn+heroName()){$('clsname').dataset.k=cn+heroName();$('clsname').innerHTML=cn;($('clsname').querySelector('.hname') as HTMLElement).textContent=heroName()?heroName()+' · ':'';}
  $('kills').textContent=kills?`Abates: ${kills}`:'';
  const nx=gear.levelNext,fl=gear.levelFloor;$('xpfill').style.width=(nx?Math.min(1,(gear.xp-fl)/(nx-fl))*100:100)+'%';
  const xt=nx?`Nível ${gear.level} · ${gear.xp-fl} / ${nx-fl} XP`:`Nível ${gear.level} · máximo`;if($('xpt').textContent!==xt)$('xpt').textContent=xt;
  const pt=String(gear.potions);if($('pott').textContent!==pt)$('pott').textContent=pt;$('potbtn').classList.toggle('cd',n<potionReady||!gear.potions);$('potbtn').classList.toggle('empty',!gear.potions);$('potbtn').style.setProperty('--cd',String(n<potionReady?Math.min(1,(potionReady-n)/POTION_CD):0));
}
const heroName=()=>heroRec?.name??'';
const skillName=()=>cls()==='xenobinder'?PETS[petId].command:kit().skill.name;
// ---------- saved characters: list, create, edit, delete ----------
async function applyLook(l:Look){
  const prev=look;look={...l};
  if(prev.sex!==look.sex)await hero.setSex(look.sex);
  hero.apply(look);if(prev.sex!==look.sex||prev.weapon!==look.weapon)await hero.setWeapon(look.weapon);
}
async function previewHero(h:HeroSave){heroRec=h;petId=h.pet;hero.setArmour(wornArmour(new Gear(gearKey(h.id),new Journal(journalKey(h.id)).credits)));await applyLook(h.look);syncPet();renderSelect();}
function renderSelect(){
  const host=$('s-list');host.innerHTML='';
  for(const h of roster.list){const j=new Journal(journalKey(h.id)),g=new Gear(gearKey(h.id),j.credits),c=CLASSES[WEAPON_CLASS[h.look.weapon]];
   const b=document.createElement('button');b.className='card'+(heroRec?.id===h.id?' on':'');
   b.innerHTML=`<b></b><span>${c.name}${WEAPON_CLASS[h.look.weapon]==='xenobinder'?' · '+PETS[h.pet].name:''}</span><i>Nível ${g.level} · ${j.done.size} de ${MISSIONS.length} missões · ${g.economy.credits} créditos</i>`;
   b.querySelector('b')!.textContent=h.name;b.onclick=()=>{sfx('ui');void previewHero(h);};host.appendChild(b);}
  ($('s-play') as HTMLButtonElement).disabled=!heroRec;
}
function showSelect(){
  editing='edit';document.body.classList.add('selecting');
  if(heroRec)void previewHero(heroRec);else renderSelect();
}
function openCreator(kind:'new'|'edit'){
  editing=kind;document.body.classList.remove('selecting');hero.setArmour({});   // the creator shows the base outfit
  const inp=$('o-name') as HTMLInputElement;
  if(kind==='new'){inp.value='';petId='symbiont';void applyLook({...DEFAULT_LOOK,weapon:look.weapon}).then(()=>{syncPet();refreshUi();});}
  else{inp.value=heroRec?.name??'';refreshUi();}
  refreshUi();
}
function confirmCreator(){
  const inp=$('o-name') as HTMLInputElement,name=cleanName(inp.value);
  if(!name){inp.classList.remove('bad');void inp.offsetWidth;inp.classList.add('bad');inp.focus();toast('Dê um nome ao seu personagem');return;}
  let h:HeroSave;
  let fresh=false;
  if(editing==='new'||!heroRec){h={id:newId(),name,look:{...look},pet:petId,created:Date.now(),played:Date.now()};roster.list.push(h);fresh=!q.get('auto');}
  else{h=heroRec;h.name=name;h.look={...look};h.pet=petId;}
  enterAs(h);if(fresh)playPrologue();
}
function enterAs(h:HeroSave){
  heroRec=h;h.played=Date.now();roster.current=h.id;saveRoster(roster);
  journal=new Journal(journalKey(h.id));gear=new Gear(gearKey(h.id),journal.credits);gstats=gear.stats();clearDrops();petId=h.pet;document.body.classList.remove('selecting');
  // progress from before the journey order: a mission waiting in a region that is still closed goes back to its giver
  {const act=journal.current();if(act&&act.goals.some(g=>!journal.goals.has(g.id)&&!reachable(g.biome))){journal.active=null;journal.save();}
   const sd=journal.sideCurrent();if(sd&&sd.goals.some(g=>!journal.goals.has(g.id)&&!reachable(g.biome))){journal.side=null;journal.save();}}
  if(!reachable(world.biome))goBiome('camp');
  enter();
}
$('s-play').onclick=()=>{if(heroRec)enterAs(heroRec);};
$('s-edit').onclick=()=>{if(heroRec)openCreator('edit');};
$('s-new').onclick=()=>openCreator('new');
$('s-del').onclick=()=>{
  if(!heroRec||!confirm(`Excluir ${heroRec.name}? As missões e o progresso deste personagem serão apagados deste aparelho.`))return;
  const id=heroRec.id;roster.list=roster.list.filter(h=>h.id!==id);forget(id);roster.current=roster.list[0]?.id??null;saveRoster(roster);
  heroRec=roster.list[0]??null;if(heroRec)showSelect();else openCreator('new');
};
$('back').onclick=()=>{const h=roster.list.find(x=>x.id===roster.current)??roster.list[0];if(h){heroRec=h;showSelect();}};
($('o-name') as HTMLInputElement).maxLength=NAME_MAX;
$('o-name').addEventListener('keydown',e=>{e.stopPropagation();if(e.key==='Enter')confirmCreator();});
function enter(){
  mode='play';document.body.classList.add('play');document.body.classList.remove('creator');
  document.body.classList.toggle('astral',cls()==='astral');
  if(!enemies.length)populate();
  placeSites();if(world.biome==='springs'&&journal.goals.has('shelter-built'))settle();pos.set(0,0,0);heading=Math.PI;gstats=gear.stats();hero.setArmour(wornArmour(gear));hpMax=gear.maxHp(kit().hp);hp=hpMax;potionReady=0;mana=cls()==='xenobinder'?35:100;dead=false;kills=0;element='energy';hero.setGlow(ELEMENT_COLORS.energy);syncPet();if(pet)pet.g.position.set(1.2,0,1);shieldUntil=0;sealPortals();renderBiomes();hud();spawnT=1.5;labelButtons();firstHelp();refreshMarkers();renderTracker();maybeAutoJoin();if(net.on)net.profile(myProfile());sound.music(world.biome);sound.ambient(world.biome);
}
$('go').onclick=confirmCreator;
// walking into a portal carries the expedition to the neighbouring region
let portalLock=0;
// regions open in journey order: each guardian (Warden, Soterrado, Vésper) opens the way onward. ?livre opens all (tests)
const FREE=q.has('livre');
function reachable(id:BiomeId){if(FREE)return true;const i=BIOME_ORDER.indexOf(id);for(let k=0;k<i;k++){const b=BIOMES[BIOME_ORDER[k]];if(b.boss&&!journal.beaten(b.boss))return false;}return true;}
function nextOpen(){const i=BIOME_ORDER.indexOf(world.biome);return i<BIOME_ORDER.length-1&&reachable(BIOME_ORDER[i+1]);}
function sealPortals(){const i=BIOME_ORDER.indexOf(world.biome);world.seal(1,i<BIOME_ORDER.length-1&&!nextOpen());}
function lockReason(id:BiomeId){const i=BIOME_ORDER.indexOf(id);for(let k=0;k<i;k++){const b=BIOMES[BIOME_ORDER[k]];if(b.boss&&!journal.beaten(b.boss))return`derrote ${SPECIES[b.boss].name} (${b.name})`;}return'';}
let sealT=0;
function updatePortals(){
  if(mode!=='play'||dead){$('portalhint').classList.remove('on');return;}
  let near:typeof world.portals[number]|null=null;
  for(const pt of world.portals){const d=Math.hypot(pos.x-pt.pos.x,pos.z-pt.pos.z);if(d<6)near=pt;
   if(d<1.7&&now()>portalLock){
    if(reachable(pt.to)){goBiome(pt.to,pt.dir);return;}
    // sealed: the stone pushes the hero back
    const back=pos.clone().sub(pt.pos).setY(0);if(back.lengthSq()<1e-4)back.set(0,0,1);pos.copy(pt.pos).addScaledVector(back.normalize(),1.75);
    if(now()>sealT){sealT=now()+3;toast(`Portal selado · ${lockReason(pt.to)}`);sfx('ui');}}}
  const h=$('portalhint');if(near){const open=reachable(near.to);h.textContent=open?`Portal: ${BIOMES[near.to].name}`:`Portal selado · ${lockReason(near.to)}`;h.classList.toggle('sealed',!open);h.classList.add('on');}else h.classList.remove('on');
}
let fading=false;
function goBiome(id:BiomeId,from:0|1|-1=0){
  if(from&&!fading){fading=true;const f=$('fade');f.classList.add('on');setTimeout(()=>{goBiome(id,from);fading=true;setTimeout(()=>{f.classList.remove('on');fading=false;},60);},380);return;}
  collectDrops();world.setBiome(id);sealPortals();if(from)sfx('portal');if(mode==='play'){sound.music(id);sound.ambient(id);}vfx.clearEmitters();for(const f of world.flameSpots)vfx.campfire(f.p,f.s);
  for(const e of enemies)e.dispose();enemies.length=0;clearShots();boss=null;bossBeaten=false;biomeKills=0;$('bossbar').classList.remove('on');populate();
  placeSites();if(id==='springs'&&journal.goals.has('shelter-built'))settle();guarded.clear();pos.set(0,0,from===1?ARENA-10:from===-1?-ARENA+10:0);heading=from===-1?0:Math.PI;portalLock=now()+2;scan=null;refreshMarkers();if(pet)pet.g.position.set(pos.x+1.2,0,pos.z+1);spawnT=2;banner(BIOMES[id].name);renderBiomes();
}
// touch devices: left thumb joystick to walk, right-hand buttons; the skill button can be dragged to aim
const touch=matchMedia('(pointer:coarse)').matches||'ontouchstart' in window;
if(touch)document.body.classList.add('touch');
function renderBiomes(){const h=$('biomes');h.innerHTML='';
  const go=(id:BiomeId)=>{if(id===world.biome)return;if(!reachable(id)){toast(`Região fechada · ${lockReason(id)}`);renderBiomes();return;}goBiome(id);};
  if(touch){const sel=document.createElement('select');sel.className='chip';for(const id of BIOME_ORDER){const o=document.createElement('option');o.value=id;o.textContent=(reachable(id)?'':'🔒 ')+BIOMES[id].name;o.selected=world.biome===id;sel.appendChild(o);}sel.onchange=()=>go(sel.value as BiomeId);h.appendChild(sel);return;}
  for(const id of BIOME_ORDER){const b=document.createElement('button'),open=reachable(id);b.className='chip'+(world.biome===id?' on':'')+(open?'':' locked');b.textContent=(open?'':'🔒 ')+BIOMES[id].name;b.title=open?BIOMES[id].sub:`Fechada · ${lockReason(id)}`;b.onclick=()=>go(id);h.appendChild(b);}
}
renderBiomes();
function autoAim(){let best:Enemy|null=null,bd=16;for(const e of enemies)if(e.state!=='dead'){const d=e.pos.distanceTo(pos);if(d<bd){bd=d;best=e;}}aimPoint.copy(best?best.pos:pos.clone().add(fwd().multiplyScalar(5)));}
const SKILL_SHORT:Record<ClassId,string>={warrior:'Carga',hunter:'Feixe',astral:'Campo',xenobinder:'Fera'};
const PET_SHORT:Record<PetId,string>={symbiont:'Salto',bulwark:'Abalo',frostling:'Sopro'};
function labelButtons(){$('t-q').textContent=cls()==='xenobinder'?PET_SHORT[petId]:SKILL_SHORT[cls()];$('t-dash').textContent='Esquiva';$('t-e').textContent=ELEMENT_NAMES[element];($('t-e') as HTMLElement).style.borderColor=ELEMENT_COLORS[element];}
// joystick
const joy={id:-1,ox:0,oy:0,x:0,y:0};
function joyShow(on:boolean,x=0,y=0){const j=$('joy');j.classList.toggle('on',on);if(on){j.style.left=x+'px';j.style.top=y+'px';}}
cvJoy();
function cvJoy(){
  const cv=renderer.domElement;
  cv.addEventListener('pointerdown',e=>{if(!touch||mode!=='play'||joy.id!==-1)return;if(e.clientX>innerWidth*.6)return;joy.id=e.pointerId;joy.ox=e.clientX;joy.oy=e.clientY;joy.x=joy.y=0;joyShow(true,e.clientX,e.clientY);});
  addEventListener('pointermove',e=>{if(e.pointerId!==joy.id)return;let dx=e.clientX-joy.ox,dy=e.clientY-joy.oy;const l=Math.hypot(dx,dy),m=60;if(l>m){dx*=m/l;dy*=m/l;}joy.x=dx/m;joy.y=dy/m;($('joy').firstElementChild as HTMLElement).style.transform=`translate(${dx}px,${dy}px)`;});
  const end=(e:PointerEvent)=>{if(e.pointerId!==joy.id)return;joy.id=-1;joy.x=joy.y=0;joyShow(false);($('joy').firstElementChild as HTMLElement).style.transform='';};
  addEventListener('pointerup',end);addEventListener('pointercancel',end);
}
// skill button: tap = cast at the nearest creature, drag = aim (direction, or spot for the astral field)
const aimRing=new T.Mesh(new T.RingGeometry(.7,1,40).rotateX(-Math.PI/2),new T.MeshBasicMaterial({color:'#ffd27a',transparent:true,opacity:.7,blending:T.AdditiveBlending,depthWrite:false}));aimRing.visible=false;world.scene.add(aimRing);
const qd={id:-1,sx:0,sy:0,moved:false};
function qAim(dx:number,dy:number){
  const l=Math.hypot(dx,dy);if(l<14){autoAim();qd.moved=false;}else{qd.moved=true;const dir=new T.Vector3(dx/l,0,dy/l),dist=cls()==='astral'?T.MathUtils.clamp(l/90*9,2,9):7;aimPoint.copy(pos).addScaledVector(dir,dist);}
  aimRing.position.copy(aimPoint).setY(.06);aimRing.scale.setScalar(cls()==='astral'?2.7:.8);
}
{
  const b=$('t-q');
  b.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();qd.id=e.pointerId;qd.sx=e.clientX;qd.sy=e.clientY;qAim(0,0);aimRing.visible=cls()!=='warrior';if(cls()==='warrior')skillDown();});
  addEventListener('pointermove',e=>{if(e.pointerId!==qd.id)return;qAim(e.clientX-qd.sx,e.clientY-qd.sy);});
  const up=(e:PointerEvent)=>{if(e.pointerId!==qd.id)return;qd.id=-1;aimRing.visible=false;if(cls()==='warrior')skillUp();else{if(!qd.moved)autoAim();faceTo(aimPoint);skillDown();}};
  addEventListener('pointerup',up);addEventListener('pointercancel',up);
}
const tb=(id:string,down:()=>void)=>{const b=$(id);b.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();autoAim();down();});};
tb('t-atk',()=>tryAttack());$('t-act').addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();interact();});tb('t-dash',()=>roll());tb('t-e',()=>{cycleElement();labelButtons();});
// options & help: one closable panel; controls are explained there, shown once on the first run
function openModal(kind:'options'|'help'){
  const m=$('modal'),body=$('mbody');m.classList.remove('talking');talking=null;$('mtitle').textContent=kind==='help'?'Controles':'Opções';
  const pc=`<h3>Computador</h3><ul><li><b>WASD</b> ou <b>setas</b>: andar · <b>Shift</b>: correr</li><li><b>Botão esquerdo</b> (segure para continuar) ou <b>J</b>: atacar na direção do cursor · Guerreiro: clique num inimigo distante para a investida</li><li><b>Botão direito</b> ou <b>Q</b>: habilidade da classe (Guerreiro: segure e solte)</li><li><b>E</b>: trocar elemento (Astral)</li><li><b>Espaço</b>: esquiva · roda do mouse: zoom</li><li><b>F</b>: falar com alguém da base ou analisar um ponto da missão</li><li><b>R</b>: poção de cura · <b>I</b>: equipamento e mochila</li></ul>`;
  const mob=`<h3>Celular</h3><ul><li>Toque e arraste no lado esquerdo da tela: <b>andar</b></li><li><b>Atacar</b>: mira sozinho no inimigo mais próximo</li><li>Botão da <b>habilidade</b>: toque para usar no mais próximo ou <b>arraste para mirar</b> e solte</li><li><b>Esquiva</b> e <b>elemento</b> (Astral) nos botões menores</li><li>Perto de alguém ou de um ponto da missão aparece o botão <b>Falar</b> / <b>Analisar</b></li><li>Botão <b>R</b> ao lado da vida: poção · botão da <b>mochila</b> no canto: equipamento</li></ul>`;
  const help=(touch?mob+pc:pc+mob)+`<p class="note">Portais de pedra levam às outras regiões: norte avança, sul volta. A seta dourada aponta o próximo objetivo da missão.</p>`;
  body.innerHTML=kind==='help'?help:`<div class="opts"><button id="o-help">Ver controles</button><button id="o-quality">${quality==='high'?'Qualidade: alta':'Qualidade: leve'}</button><button id="o-music">${sound.musicOn?'Música: ligada':'Música: desligada'}</button><button id="o-sfx">${sound.sfxOn?'Efeitos: ligados':'Efeitos: desligados'}</button><button id="o-journal">Diário de missões</button><button id="o-atlas">Atlas de Dante</button><button id="o-coop">Jogar junto (online)</button><button id="o-prologue">Rever a chegada a Dante</button><button id="o-gear">Equipamento e mochila</button><button id="o-creator">Trocar de personagem</button><p class="note" id="o-fps">${fpsShown?fpsShown+' quadros por segundo':''}</p></div>`;
  m.classList.add('on');
  if(kind==='options'){
   $('o-help').onclick=()=>openModal('help');$('o-journal').onclick=()=>openJournal();$('o-atlas').onclick=()=>openAtlas();$('o-coop').onclick=()=>openCoop();$('o-prologue').onclick=()=>{closeModal();playPrologue();};$('o-gear').onclick=openGear;
   $('o-music').onclick=()=>{sound.toggleMusic();$('o-music').textContent=sound.musicOn?'Música: ligada':'Música: desligada';};
   $('o-sfx').onclick=()=>{sound.toggleSfx();$('o-sfx').textContent=sound.sfxOn?'Efeitos: ligados':'Efeitos: desligados';};
   $('o-quality').onclick=()=>{setQuality(quality==='high'?'low':'high');($('o-quality')).textContent=quality==='high'?'Qualidade: alta':'Qualidade: leve';};
   $('o-creator').onclick=()=>{m.classList.remove('on');clearDrops();mode='creator';document.body.classList.remove('play','dead');document.body.classList.add('creator');if(world.biome!=='camp')goBiome('camp');for(const e of enemies)e.dispose();enemies.length=0;clearShots();boss=null;$('bossbar').classList.remove('on');if(pet){pet.remove();pet=null;}pos.set(0,0,0);shieldUntil=0;refreshUi();showSelect();};
  }
}
$('optbtn').onclick=()=>openModal('options');
const closeModal=()=>{$('modal').classList.remove('on');$('modal').classList.remove('talking','wide');talking=null;};
$('mclose').onclick=closeModal;
$('modal').addEventListener('pointerdown',e=>{if(e.target===$('modal'))closeModal();});
function firstHelp(){try{if(localStorage.getItem('dante3d.help'))return;localStorage.setItem('dante3d.help','1');}catch{/* ignore */}openModal('help');}
$('respawn').onclick=()=>{document.body.classList.remove('dead');dead=false;hp=hpMax;mana=100;pos.set(0,0,0);hero.play('Idle_Loop',{fade:.2});if(pet)pet.g.position.set(1.2,0,1);for(const e of enemies)e.dispose();enemies.length=0;populate();hud();};
document.body.classList.add('creator');

// ---------- the arrival film and the Atlas of Dante (both from the 2D) ----------
// The 2D opening film (evacuation of the Earth and the landing on Dante, docs/cinematic-opening), with its Portuguese
// subtitles. A new character sees it once on entering; the options menu plays it again.
function playPrologue(){
  if($('prologue'))return;
  const el=document.createElement('div');el.id='prologue';const B=import.meta.env.BASE_URL+'assets/cinematic-opening/';
  el.innerHTML=`<video playsinline preload="auto"><source src="${B}arrival-compatible-v1.webm" type="video/webm"><source src="${B}arrival-compatible-v1.mp4" type="video/mp4"><track kind="subtitles" srclang="pt-BR" label="Português" src="${B}arrival.pt-BR.vtt" default></video><button class="skip">Pular</button><p class="hint">Toque para começar</p>`;
  document.body.appendChild(el);const v=el.querySelector('video')!;sound.hush(true);
  const end=()=>{if(!el.isConnected)return;el.classList.add('out');sound.hush(false);setTimeout(()=>el.remove(),500);};
  v.onended=end;el.querySelector<HTMLButtonElement>('.skip')!.onclick=e=>{e.stopPropagation();end();};
  v.onerror=end;
  const go=()=>{void v.play().then(()=>el.classList.add('playing')).catch(()=>{/* waits for a tap */});};
  el.onclick=()=>{if(v.paused)go();};go();
  for(const t of Array.from(v.textTracks))t.mode='showing';
}
// Atlas: the painted chart of the 2D expedition, with the 3D regions where their 2D areas lie. Open regions are
// revealed, the closed ones stay under fog; the story mission and the expedition are marked; a tap travels.
const ATLAS_AT:Record<BiomeId,[number,number]>={camp:[185,600],domain:[420,300],dunes:[930,520],frost:[900,215],caldera:[330,150],springs:[700,345],valley:[560,460]};
function openAtlas(){
  const m=$('modal'),body=$('mbody');m.classList.remove('talking');talking=null;$('mtitle').textContent='Atlas de Dante';
  const open=BIOME_ORDER.filter(b=>reachable(b)),story=journal.open().filter(g=>!g.finding).map(g=>g.biome),side=journal.open().filter(g=>g.finding).map(g=>g.biome);
  const reveal=open.map(b=>`<circle cx="${ATLAS_AT[b][0]}" cy="${ATLAS_AT[b][1]}" r="150" fill="black"/>`).join('');
  const route=BIOME_ORDER.slice(1).map((b,i)=>{const [x,y]=ATLAS_AT[BIOME_ORDER[i]],[a,c]=ATLAS_AT[b];const known=reachable(b);return`<path d="M ${x} ${y} Q ${(x+a)/2+26} ${(y+c)/2-18} ${a} ${c}" class="${known?'known':'unknown'}"/>`;}).join('');
  const nodes=BIOME_ORDER.map(b=>{const [x,y]=ATLAS_AT[b],here=b===world.biome,ok=reachable(b);
   const marks=(story.includes(b)?'<i class="m-story">◆ Missão</i>':'')+(side.includes(b)?'<i class="m-side">◆ Expedição</i>':'');
   return`<button class="node${here?' here':''}${ok?'':' locked'}" data-b="${b}" style="left:${x/1120*100}%;top:${y/748*100}%" ${here||!ok?'disabled':''}><span class="dot">${here?'◆':ok?'●':'?'}</span><b>${ok?BIOMES[b].name:'Não explorado'}</b>${here?'<small>Você está aqui</small>':ok?`<small>${BIOMES[b].sub}</small>`:`<small>${lockReason(b)}</small>`}${marks}</button>`;}).join('');
  body.innerHTML=`<div class="atlas"><img src="${import.meta.env.BASE_URL}assets/base/dante-expedition-atlas.webp" alt="" draggable="false"><svg viewBox="0 0 1120 748" aria-hidden="true"><defs><filter id="afog"><feGaussianBlur stdDeviation="24"/></filter><mask id="amask"><rect width="1120" height="748" fill="white"/><g filter="url(#afog)">${reveal}</g></mask></defs><rect width="1120" height="748" fill="#091820" fill-opacity=".7" mask="url(#amask)"/>${route}</svg>${nodes}</div><p class="note">◆ você está aqui · ● região aberta · ? fechada até o guardião anterior cair · toque numa região aberta para viajar até ela</p>`;
  m.classList.add('on','wide');sfx('ui');
  body.querySelectorAll<HTMLButtonElement>('.node[data-b]').forEach(b=>b.onclick=()=>{const id=b.dataset.b as BiomeId;if(!reachable(id)||id===world.biome)return;closeModal();goBiome(id,BIOME_ORDER.indexOf(id)>BIOME_ORDER.indexOf(world.biome)?1:-1);});
}
$('mapbtn').onclick=()=>openAtlas();

// ---------- playing together online (net.ts, server/relay3d.mjs) ----------
// The others in the room are drawn by this game: their character, equipment and animation, where they are, when they
// are in the same region. Each player keeps their own progress, missions and backpack.
interface Peer{id:string;profile:Profile;char:Character;ready:boolean;biome:BiomeId|'';x:number;z:number;h:number;anim:string;hp:number;label:HTMLDivElement;seen:boolean;pet:Pet|null;ps:PetState|null;spinUntil:number}
const peers=new Map<string,Peer>();
const peerBox=document.createElement('div');peerBox.id='peers';document.body.appendChild(peerBox);
const myProfile=():Profile=>({name:heroName()||'Explorador',cls:cls(),look:{...look},armour:wornArmour(gear),pet:petId,level:gear.level});
async function addPeer(id:string,p:Profile){
  dropPeer(id);
  const char=new Character(),label=document.createElement('div');label.className='peer';peerBox.appendChild(label);
  const peer:Peer={id,profile:p,char,ready:false,biome:'',x:0,z:0,h:0,anim:'Idle_Loop',hp:1,label,seen:false,pet:null,ps:null,spinUntil:0};peers.set(id,peer);renderRoomChip();
  char.root.visible=false;world.scene.add(char.root);
  try{await char.setSex(p.look.sex==='female'?'female':'male');char.setArmour(p.armour??{});char.apply({...DEFAULT_LOOK,...p.look});await char.setWeapon(p.look.weapon??DEFAULT_LOOK.weapon);peer.ready=peers.get(id)===peer;}
  catch{/* a model that fails to load leaves only the name */}
  renderRoomChip();
}
function dropPeer(id:string){const p=peers.get(id);if(!p)return;p.pet?.remove();p.char.root.removeFromParent();p.label.remove();peers.delete(id);renderRoomChip();}
function peerProfile(id:string,p:Profile){const peer=peers.get(id);if(!peer){void addPeer(id,p);return;}
  const relook=JSON.stringify(peer.profile.look)!==JSON.stringify(p.look);peer.profile=p;
  if(relook)void addPeer(id,p);else if(peer.ready)peer.char.setArmour(p.armour??{});}
const net=new Net({
  room:(code,members)=>{for(const id of [...peers.keys()])dropPeer(id);for(const m of members)void addPeer(m.id,m.profile);toast(`Sala ${code} · ${members.length+1} ${members.length?'exploradores':'explorador'}`);renderRoomChip();if(coopShown())openCoop();},
  joined:(id,p)=>{void addPeer(id,p);toast(`${p.name} entrou na sala`);sfx('ui');if(coopShown())openCoop();},
  profile:peerProfile,
  left:id=>{const p=peers.get(id);if(p)toast(`${p.profile.name} saiu da sala`);dropPeer(id);if(coopShown())openCoop();},
  state:(id,s)=>{const p=peers.get(id);if(!p)return;if(p.biome!==s.b)p.seen=false;p.biome=s.b;p.x=s.x;p.z=s.z;p.h=s.h;p.anim=s.a;p.hp=s.hp;p.ps=s.p??null;},
  event:(id,e)=>peerEvent(id,e),
  error:text=>{coopError=text;toast(text);if(coopShown())openCoop();},
  closed:()=>{for(const id of [...peers.keys()])dropPeer(id);toast('Você saiu da sala');renderRoomChip();},
  slow:()=>toast('Acordando o servidor de salas · pode levar até um minuto'),
});
let coopError='';
function updatePeers(dt:number){
  if(!peers.size)return;
  const show=mode==='play',covered=$('modal').classList.contains('on');
  for(const p of peers.values()){
   const here=show&&p.ready&&p.biome===world.biome;p.char.root.visible=here;
   if(!here){p.label.style.display='none';if(p.pet)p.pet.g.visible=false;continue;}
   const r=p.char.root.position;if(!p.seen){r.set(p.x,0,p.z);p.seen=true;}
   const k=Math.min(1,dt*10);r.x+=(p.x-r.x)*k;r.z+=(p.z-r.z)*k;
   if(p.char.model){const m=p.char.model;if(now()<p.spinUntil)m.rotation.y-=dt*19;else{let d=p.h-m.rotation.y;d=Math.atan2(Math.sin(d),Math.cos(d));m.rotation.y+=d*Math.min(1,dt*12);}}
   syncPeerPet(p,dt);
   if(p.char.has(p.anim))p.char.play(p.anim,{fade:.15});
   p.char.update(dt);
   gv.copy(r).setY(2.25);gv.project(camera);
   if(gv.z>1||covered){p.label.style.display='none';continue;}
   p.label.style.display='block';p.label.style.transform=`translate(${(gv.x*.5+.5)*innerWidth}px,${(-gv.y*.5+.5)*innerHeight}px)`;
   const html=`<b>${p.profile.name.replace(/</g,'')}</b><span>Nv ${p.profile.level} · ${CLASSES[p.profile.cls as ClassId]?.name??''}</span><i style="width:${Math.round(p.hp*100)}%"></i>`;
   if(p.label.dataset.k!==html){p.label.dataset.k=html;p.label.innerHTML=html;}
  }
}
function sendState(){if(!net.on||mode!=='play')return;const g=pet?.g;
  net.state({x:pos.x,z:pos.z,h:hero.model?.rotation.y??0,a:hero.currentName||'Idle_Loop',b:world.biome,hp:dead?0:hp/Math.max(1,hpMax),p:g?{x:g.position.x,z:g.position.z,h:g.rotation.y,y:g.position.y,a:pet!.look?.cur??'idle'}:undefined},time);}
// the beast of another tamer: the same creature, following what its owner's game says
const PET_MOTIONS=new Set<string>(['idle','move','run','attack','hit','jump']);
function syncPeerPet(p:Peer,dt:number){
  const id=p.ps&&isPet(p.profile.pet)?p.profile.pet:null;
  if(p.pet&&p.pet.id!==id){p.pet.remove();p.pet=null;}
  if(!id||!p.ps)return;
  const s=p.ps;if(!p.pet){p.pet=new Pet(id);p.pet.g.visible=false;}
  const g=p.pet.g;if(!g.visible){g.position.set(s.x,s.y,s.z);g.rotation.y=s.h;g.visible=true;}
  const k=Math.min(1,dt*10);g.position.x+=(s.x-g.position.x)*k;g.position.z+=(s.z-g.position.z)*k;g.position.y+=(s.y-g.position.y)*Math.min(1,dt*14);
  let d=s.h-g.rotation.y;d=Math.atan2(Math.sin(d),Math.cos(d));g.rotation.y+=d*Math.min(1,dt*12);
  if(PET_MOTIONS.has(s.a))p.pet.play(s.a as Motion);p.pet.look?.mixer?.update(dt);
  if(s.y>.2)vfx.petTrail(g.position);
}
// a moment of another player's fight, drawn here (only when they are in this region)
const SHOT_SFX:Record<Kind,Sfx>={pulse:'shot',filament:'filament',fire:'fire',water:'water',earth:'earth',energy:'energy'};
const isElement=(w:string|undefined):w is Element=>!!w&&w in ELEMENT_COLORS;
function peerEvent(id:string,e:NetEvent){
  const p=peers.get(id);if(!p||!p.char.root.visible)return;
  const at=new T.Vector3(e.x,0,e.z),dir=new T.Vector3(Math.sin(e.h),0,Math.cos(e.h));
  const astral=p.profile.cls==='astral';
  if(e.k==='shot'&&e.w&&e.w in SHOT_SFX){const k=e.w as Kind;ghostShot(k,at.clone().setY(e.y??1.2),dir,e.v??20,e.l??1.2);sfx(SHOT_SFX[k],at);if(astral&&isElement(k))p.char.setGlow(ELEMENT_COLORS[k]);}
  else if(e.k==='slash'){vfx.slash(p.char.root.position,e.h,!!e.r);sfx('swing',at);}
  else if(e.k==='dash'){vfx.decal(at,'#7fe8ff',1.4,.35);sfx('dash',at);}
  else if(e.k==='beam'){const ch=p.char;sfx('charge',at);vfx.spark(()=>ch.muzzle(),()=>dir,24,.55,()=>{sfx('beam',ch.root.position);ch.recoil();});}
  else if(e.k==='field'&&isElement(e.w)){const el=e.w;if(astral)p.char.setGlow(ELEMENT_COLORS[el]);vfx.decal(at,ELEMENT_COLORS[el],2.6,.5);later(e.l??.3,()=>{vfx.field(el,at,2.7);sfx(el as Sfx,at);});}
  else if(e.k==='twist'){const dur=e.l??.8;vfx.twist(()=>p.char.root.position,e.r??3,dur);sfx('twist',at);p.spinUntil=now()+dur;}
  else if(e.k==='pet'&&e.w==='land'){sfx('slashHit',at);vfx.decal(at,'#7dff9e',2.8,.7,1);vfx.emit({pos:at.clone().setY(.4),n:30,speed:[1.5,4],up:.6,life:[.4,.8],size:[.18,.04],c0:'#e8ffe8',c1:'#2fae5a',a:[1,0],drag:1.5,spread:.8});}
  else if(e.k==='pet'&&e.w==='slam'){sfx('earth',at);vfx.field('earth',at,3);vfx.decal(at,'#ffd27a',3.4,.6,1);for(let i=0;i<10;i++)vfx.shard(at.clone().setY(.3),new T.Vector3(rnd(-1,1),rnd(.8,1.6),rnd(-1,1)).normalize().multiplyScalar(rnd(4,8)),1);}
}
// the room window refreshes only while it is on screen (the title stays after it closes)
const coopShown=()=>$('modal').classList.contains('on')&&$('mtitle').textContent==='Jogar junto';
const roomChip=document.createElement('button');roomChip.id='roomchip';roomChip.onclick=()=>openCoop();document.body.appendChild(roomChip);
function renderRoomChip(){roomChip.classList.toggle('on',net.on);if(net.on)roomChip.textContent=`Sala ${net.code} · ${peers.size+1}/4`;}
function openCoop(){
  const m=$('modal'),body=$('mbody');m.classList.remove('talking','wide');talking=null;$('mtitle').textContent='Jogar junto';
  if(net.on){
   const link=`${location.origin}${location.pathname}?sala=${net.code}`;
   body.innerHTML=`<p class="note">Passe o código ou o link para até três amigos. Cada um joga com o próprio personagem e guarda o próprio progresso; vocês se veem na mesma região.</p><div class="roomcode">${net.code}</div><p class="roomlink"><input readonly value="${link}"><button id="c-copy">Copiar link</button></p>`+
    `<ul class="members"><li><b>${heroName()||'Você'}</b> · ${kit().name} · Nv ${gear.level} · ${BIOMES[world.biome].name} <em>você</em></li>${[...peers.values()].map(p=>`<li><b>${p.profile.name.replace(/</g,'')}</b> · ${CLASSES[p.profile.cls as ClassId]?.name??''} · Nv ${p.profile.level} · ${p.biome?BIOMES[p.biome].name:'chegando…'}</li>`).join('')}</ul>`+
    `<p class="note">Nesta etapa os jogadores se veem andando, lutando e equipados. Inimigos, saque e missões ainda são de cada um (próximo passo do coop).</p><button class="act" id="c-leave">Sair da sala</button>`;
   m.classList.add('on');
   $('c-copy').onclick=()=>{void navigator.clipboard?.writeText(link).then(()=>toast('Link copiado'),()=>{});(body.querySelector('.roomlink input') as HTMLInputElement).select();};
   $('c-leave').onclick=()=>{net.close();for(const id of [...peers.keys()])dropPeer(id);renderRoomChip();openCoop();};
   return;
  }
  body.innerHTML=`<p class="note">Jogue com até quatro exploradores, cada um com o próprio personagem. Crie uma sala e passe o código, ou entre com o código de um amigo.</p>${coopError?`<p class="warn">${coopError}</p>`:''}`+
   `<button class="act" id="c-host">Criar sala</button><p class="roomjoin"><input id="c-code" maxlength="4" placeholder="Código" autocomplete="off"><button id="c-join">Entrar</button></p>`;
  m.classList.add('on');coopError='';
  $('c-host').onclick=()=>{body.querySelector('#c-host')!.textContent='Conectando…';void net.connect('host',myProfile());};
  const join=()=>{const c=($('c-code') as HTMLInputElement).value.trim().toUpperCase();if(c.length!==4){toast('O código tem quatro letras');return;}$('c-join').textContent='Conectando…';void net.connect('join',myProfile(),c);};
  $('c-join').onclick=join;($('c-code') as HTMLInputElement).onkeydown=e=>{e.stopPropagation();if(e.key==='Enter')join();};
}
// a shared link (3d.html?sala=CODE) joins the room once the hero is in the world
let autoJoin=q.get('sala')?.toUpperCase()??'';
function maybeAutoJoin(){if(!autoJoin||net.on||FITTING)return;const c=autoJoin;autoJoin='';void net.connect('join',myProfile(),c);}

// ---------- people of the base, missions and guidance ----------
const npcs=NPCS.map(d=>new Npc(d,world.scene));
let npcHidden=false;let talking:Npc|null=null,scan:{g:Goal;t:number}|null=null;const SCAN_TIME=1.6;
const IDLE:Record<NpcId,string>={nara:'Os civis ficam junto da nave enquanto a equipe explora. Quando houver uma nova rota, eu aviso.',lia:'A enfermaria está aberta. Volte inteira; ainda temos muito a aprender sobre Dante.',ivo:'A oficina fica aqui. Cuidado com os cabos: água e energia continuam em circuitos separados.'};
function interactable():{kind:'npc';n:Npc}|{kind:'scan';g:Goal}|{kind:'pen'}|null{
  if(mode!=='play'||dead)return null;
  if(world.biome==='camp')for(const n of npcs)if(n.ready&&Math.hypot(n.pos.x-pos.x,n.pos.z-pos.z)<2.6)return{kind:'npc',n};
  if(world.biome==='camp'&&Math.hypot(CAMP.pen.x-pos.x,CAMP.pen.z-pos.z)<3.2)return{kind:'pen'};
  for(const g of journal.open())if(g.kind==='scan'&&g.biome===world.biome&&Math.hypot(g.x-pos.x,g.z-pos.z)<2.6)return{kind:'scan',g};
  return null;
}
function interact(){
  const it=interactable();if(!it)return false;
  if(it.kind==='npc')openTalk(it.n);else if(it.kind==='pen')openPen();else if(!scan){scan={g:it.g,t:0};moveTarget=null;sfx('charge');}
  return true;
}
function toast(text:string){const t=$('toast');t.textContent=text;t.classList.remove('on');void t.offsetWidth;t.classList.add('on');}
function goalDone(g:Goal){
  if(!journal.complete(g.id))return;sfx('heal');toast(`Registrado: ${g.label}`);if(g.kind!=='boss')gainXp(g.id.startsWith('echo')?GOAL_XP.echo:GOAL_XP.route,pos);
  if(g.finding)showRecord(g);
  if(g.id==='shelter-built'){settle();banner('O primeiro abrigo de Dante');}
  for(const m of [journal.current(),journal.sideCurrent()])if(m&&m.goals.some(x=>x.id===g.id)&&journal.status(m.id)==='ready')later(g.finding?9:2.6,()=>toast(`Relatório pronto · volte para falar com ${NPC_INFO[m.npc].name}`));
  refreshMarkers();renderTracker();
}
function openTalk(n:Npc,report?:{id:string;credits:number;item?:EquipmentId|null},pick?:string){
  talking=n;const id=n.def.npc,m=$('modal'),body=$('mbody');m.classList.add('talking');
  $('mtitle').textContent=n.def.name;
  const portrait=import.meta.env.BASE_URL+(id?NPC_INFO[id].portrait:n.def.id==='elisa'?'assets/base/base-refugee-a.png':'assets/base/base-refugee-b.png');
  let html=`<div class="talk"><img src="${portrait}" alt=""><div class="say"><p class="role">${n.def.role}</p>`;
  let action='';
  if(report){const done=missionById(report.id),next=id?journal.offersFor(id):[];
   html+=`<h3>${done.title} · concluída</h3>`+done.report.map(l=>`<p>${l}</p>`).join('')+`<p class="reward">Relatório entregue · +${report.credits} créditos${report.item?` · <b style="color:${RARITY_COLORS[EQUIPMENT[report.item].rarity]}">${itemName(report.item)}</b> na mochila`:''}</p>`;
   if(next.length)action=`<button class="act" data-next="1">Próxima conversa</button>`;}
  else if(!id)html+=(n.def.lines??[]).map(l=>`<p>${l}</p>`).join('');
  else{
   // the story first, then the regional expedition; the one with a report ready opens first
   const offers=journal.offersFor(id),mi=offers.find(x=>x.id===pick)??offers.find(x=>journal.status(x.id)==='ready')??offers[0];
   if(!mi)html+=`<p>${IDLE[id]}</p>`;
   else{
    const st=journal.status(mi.id);
    if(offers.length>1)html+=`<div class="topics">${offers.map(o=>`<button data-topic="${o.id}" class="${o===mi?'on':''}">${o.side?'Expedição':'História'} · ${o.title}${journal.status(o.id)==='ready'?' ✓':''}</button>`).join('')}</div>`;
    html+=`<h3>${mi.side?'<small>Expedição regional</small>':''}${mi.title}</h3>`+(st==='ready'?mi.report:mi.offer).map(l=>`<p>${l}</p>`).join('');
    html+=`<ul class="goals">${mi.goals.map(g=>`<li class="${journal.goals.has(g.id)?'done':''}">${journal.goals.has(g.id)?'✓':'◇'} ${g.label}</li>`).join('')}</ul><p class="reward">Recompensa pessoal: ${mi.credits} créditos${mi.side?' e uma peça de equipamento da região':''}</p>`;
    if(st==='available')action=`<button class="act" data-id="${mi.id}" data-do="accept">${mi.side?'Aceitar expedição':'Aceitar missão'}</button>`;
    else if(st==='ready')action=`<button class="act" data-id="${mi.id}" data-do="deliver">Entregar relatório</button>`;
    else html+=`<p class="note">${mi.side?'Expedição em andamento. Os achados aparecem com feixe verde-água na região.':'Missão em andamento. A seta dourada indica o próximo objetivo.'}</p>`;
   }
  }
  if(id&&!report)action+=`<button class="svc">${SVC[id]}</button>`;
  body.innerHTML=html+action+'</div></div>';m.classList.add('on');sfx('ui');
  if(id)body.querySelector<HTMLButtonElement>('.svc')?.addEventListener('click',()=>openService(id,n));
  body.querySelectorAll<HTMLButtonElement>('[data-topic]').forEach(b=>b.onclick=()=>openTalk(n,undefined,b.dataset.topic));
  body.querySelector<HTMLButtonElement>('.act')?.addEventListener('click',e=>{
   const b=e.currentTarget as HTMLButtonElement,mid=b.dataset.id!;
   if(b.dataset.next){openTalk(n);return;}
   if(b.dataset.do==='accept'){if(journal.accept(mid)){const mm=missionById(mid);toast(`${mm.side?'Expedição aceita':'Missão aceita'}: ${mm.title}`);placeSites();closeModal();}}
   else{const mm=missionById(mid),c=journal.deliver(mid);if(c){gear.collect({tier:1,credits:c,amount:0});const item=mm.side?expeditionItem(mm):null;hud();sfx('heal');toast(`Relatório entregue · +${c} créditos`);openTalk(n,{id:mid,credits:c,item});}}
   refreshMarkers();renderTracker();
  });
}
// the piece of equipment an expedition leaves: of the tier of its region, for a slot the hero has no piece of if possible
function expeditionItem(m:Mission):EquipmentId|null{
  const tier=REGION_LOOT[m.region??'camp'].gear,order=['armor','helmet','legs','gloves','boots','accessory','weapon'],pool=EQUIPMENT_IDS.filter(i=>EQUIPMENT[i].tier===tier).sort((a,b)=>order.indexOf(EQUIPMENT[a].slot)-order.indexOf(EQUIPMENT[b].slot));
  const have=new Set<string>([...gear.bag.map(i=>EQUIPMENT[i.id].slot),...Object.keys(gear.slots)]);
  const pick=pool.find(i=>!have.has(EQUIPMENT[i].slot))??pool[Math.floor(Math.random()*pool.length)];
  return pick&&gear.take(pick)?pick:null;
}
// Records of Dante: the finding of a discovery shows on a card and stays in the journal
let recordT=0;
function showRecord(g:Goal){
  const el=$('record'),art=(g.art??'record') as Art;
  el.innerHTML=`<small style="color:${ART_COLORS[art]}">${ART_NAMES[art]} · Registro de Dante</small><b>${g.label}</b><p>${g.finding}</p>`;
  el.classList.remove('on');void el.offsetWidth;el.classList.add('on');clearTimeout(recordT);recordT=window.setTimeout(()=>el.classList.remove('on'),9000);
}
// the finds of an expedition sit on free ground of the region (rocks and trees are placed by seed)
const siteHome=new Map<string,[number,number]>();
function placeSites(){
  const free=(x:number,z:number)=>!world.colliders.some(c=>Math.hypot(x-c.x,z-c.z)<c.r+1.8)&&Math.abs(x)<ARENA-4&&Math.abs(z)<ARENA-4;
  for(const m of ALL_MISSIONS)for(const g of m.goals){if(g.biome!==world.biome||!(g.finding||g.place))continue;
   let base=siteHome.get(g.id);if(!base){base=[g.x,g.z];siteHome.set(g.id,base);}
   let best:[number,number]=base;
   if(!free(...base))search:for(let r=1.5;r<12;r+=1.5)for(let a=0;a<6.28;a+=.5){const x=base[0]+Math.cos(a)*r,z=base[1]+Math.sin(a)*r;if(free(x,z)){best=[x,z];break search;}}
   g.x=best[0];g.z=best[1];}
}
// the module of the first shelter stands where it was installed
function settle(){const g=ALL_MISSIONS.flatMap(m=>m.goals).find(x=>x.id==='shelter-built')!;world.settlement(g.x+2.5,g.z-2.5);}
// each discovery of an expedition is watched by residents of the region, who wake when the hero comes near
const guarded=new Set<string>();
function updateGuards(){
  if(mode!=='play'||dead)return;
  const mix=BIOMES[world.biome].creatures;if(!mix.length)return;
  for(const g of journal.open()){if(!g.finding||g.biome!==world.biome||guarded.has(g.id))continue;
   if(Math.hypot(g.x-pos.x,g.z-pos.z)>17)continue;guarded.add(g.id);
   for(let i=0;i<2;i++){let x=Math.random(),k=mix[0][0];for(const [kk,w] of mix){if(x<w){k=kk;break;}x-=w;}
    const a=i*3.1+Math.random(),e=new Creature(k,g.x+Math.cos(a)*3.2,g.z+Math.sin(a)*3.2,world.scene);world.collide(e.pos,e.radius);e.home.copy(e.pos);e.heading=Math.random()*6.28;enemies.push(e);}
  }
}
// beast pen: the Domador trades the companion that goes on expedition
function openPen(){
  const m=$('modal'),body=$('mbody');m.classList.remove('talking');talking=null;$('mtitle').textContent='Abrigo das feras';
  const xeno=cls()==='xenobinder';
  body.innerHTML=(xeno?`<p class="note">Escolha a fera que segue ${heroName()||'você'} nas expedições. A troca vale até você voltar aqui.</p>`:`<p class="note">As feras ficam aos cuidados do abrigo. Só o Domador de feras leva uma companheira em expedição.</p>`)+
   `<div class="pens">${PET_ORDER.map(id=>{const d=PETS[id];return`<button class="pen${petId===id&&xeno?' on':''}" data-p="${id}" ${xeno?'':'disabled'}><b>${d.name}</b><em>${d.role} · ${d.command}</em><span>${d.desc}</span>${petId===id&&xeno?'<i>Acompanhando você</i>':''}</button>`;}).join('')}</div>`;
  m.classList.add('on');sfx('ui');
  body.querySelectorAll<HTMLButtonElement>('.pen').forEach(b=>b.onclick=()=>{const id=b.dataset.p as PetId;if(id===petId)return;
   petId=id;if(heroRec){heroRec.pet=id;saveRoster(roster);}syncPet();sfx('heal');toast(`${PETS[id].name} agora acompanha você`);openPen();hud();labelButtons();});
}
function openJournal(tab:'story'|'side'|'records'='story'){
  const m=$('modal'),body=$('mbody');m.classList.remove('talking');talking=null;$('mtitle').textContent='Diário da expedição';
  const ST:Record<string,string>={locked:'Bloqueada',available:'Disponível',active:'Em andamento',ready:'Relatório pronto',completed:'Concluída'};
  const row=(mi:Mission)=>{const st=journal.status(mi.id);return`<div class="jm ${st}"><b>${mi.title}</b><span>${NPC_INFO[mi.npc].name}${mi.region?' · '+BIOMES[mi.region].name:''} · ${ST[st]}</span>${st==='active'||st==='ready'?`<ul class="goals">${mi.goals.map(g=>`<li class="${journal.goals.has(g.id)?'done':''}">${journal.goals.has(g.id)?'✓':'◇'} ${g.label}</li>`).join('')}</ul>`:''}</div>`;};
  const recs=journal.records(),total=EXPEDITIONS.reduce((n,x)=>n+x.goals.length,0);
  const tabs=`<div class="topics jtabs"><button data-tab="story" class="${tab==='story'?'on':''}">História</button><button data-tab="side" class="${tab==='side'?'on':''}">Expedições · ${EXPEDITIONS.filter(x=>journal.done.has(x.id)).length}/${EXPEDITIONS.length}</button><button data-tab="records" class="${tab==='records'?'on':''}">Registros · ${recs.length}/${total}</button></div>`;
  let html=`<p class="note">Créditos: ${gear.economy.credits}</p>`+tabs;
  if(tab==='story')html+=MISSIONS.map(row).join('');
  else if(tab==='side')html+=`<p class="note">Expedições regionais correm junto com a história: uma de cada vez. Cada uma tem três achados guardados por criaturas e paga com créditos e uma peça de equipamento da região.</p>`+EXPEDITIONS.map(row).join('');
  else html+=recs.length?recs.map(({mission,goal})=>{const art=(goal.art??'record') as Art;return`<div class="rec"><small style="color:${ART_COLORS[art]}">${ART_NAMES[art]} · ${BIOMES[goal.biome].name}</small><b>${goal.label}</b><p>${goal.finding}</p><span>${mission.title}</span></div>`;}).join(''):`<p class="note">Nenhum registro ainda. Os achados das expedições regionais ficam guardados aqui.</p>`;
  body.innerHTML=html;m.classList.add('on');
  body.querySelectorAll<HTMLButtonElement>('[data-tab]').forEach(b=>b.onclick=()=>openJournal(b.dataset.tab as 'story'));
}
function renderTracker(){
  const t=$('tracker'),mi=journal.current();let html='';
  if(mi){const st=journal.status(mi.id);
   html=`<small>Missão · ${gear.economy.credits} créditos</small><b>${mi.title}</b><ul>${mi.goals.filter(g=>!(g.after??[]).some(a=>!journal.goals.has(a))||journal.goals.has(g.id)).map(g=>`<li class="${journal.goals.has(g.id)?'done':''}">${journal.goals.has(g.id)?'✓':'◇'} ${g.label}</li>`).join('')}</ul>`+(st==='ready'?`<em>Volte para falar com ${NPC_INFO[mi.npc].name}</em>`:'');}
  else{const next=MISSIONS.find(x=>journal.status(x.id)==='available');
   html=next?`<small>Missão · ${gear.economy.credits} créditos</small><b>${next.title}</b><em>! Converse com ${NPC_INFO[next.npc].name} no acampamento</em>`:(()=>{const ex=journal.side?null:EXPEDITIONS.find(x=>journal.status(x.id)==='available');return ex?`<small>História concluída · ${gear.economy.credits} créditos</small><b>${ex.title}</b><em>! Expedição com ${NPC_INFO[ex.npc].name} no acampamento</em>`:`<small>Diário · ${gear.economy.credits} créditos</small><b>Todas as missões concluídas</b>`;})();}
  const sd=journal.sideCurrent();
  if(sd){const st=journal.status(sd.id),left=sd.goals.filter(g=>!journal.goals.has(g.id));
   html+=`<div class="side"><small>Expedição · ${sd.goals.length-left.length}/${sd.goals.length}</small><b>${sd.title}</b>${st==='ready'?`<em>Volte para falar com ${NPC_INFO[sd.npc].name}</em>`:`<span>◇ ${left[0].label} · ${BIOMES[left[0].biome].name}</span>`}</div>`;}
  if(t.innerHTML!==html)t.innerHTML=html;
}
$('tracker').addEventListener('click',()=>openJournal());
// beacons on the open goals of this region
const markers=new T.Group();world.scene.add(markers);
const BEAM=new T.ShaderMaterial({uniforms:{uT:{value:0},uC:{value:new T.Color('#ffc24a')}},transparent:true,depthWrite:false,blending:T.AdditiveBlending,side:T.DoubleSide,
 vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
 fragmentShader:'uniform float uT;uniform vec3 uC;varying vec2 vUv;void main(){float a=pow(1.-vUv.y,1.8)*(.35+.2*sin(vUv.y*24.-uT*3.))*smoothstep(0.,.08,vUv.y+.02);gl_FragColor=vec4(uC*a,a);}'});
const RING=new T.MeshBasicMaterial({color:'#ffc24a',transparent:true,opacity:.75,blending:T.AdditiveBlending,depthWrite:false});
const BEAM_SIDE=BEAM.clone();BEAM_SIDE.uniforms.uC.value=new T.Color('#4fffc8');const RING_SIDE=RING.clone();RING_SIDE.color.set('#4fffc8');
const FIND=new T.MeshStandardMaterial({color:'#b8fff0',emissive:'#3fe8b8',emissiveIntensity:1.5,roughness:.3,flatShading:true});
const GEM=new T.MeshStandardMaterial({color:'#ffd27a',emissive:'#ffb040',emissiveIntensity:1.5,roughness:.3});
const ECHO=new T.MeshStandardMaterial({color:'#9ff4ff',emissive:'#4fe6ff',emissiveIntensity:1.8,roughness:.2,flatShading:true});
function refreshMarkers(){
  for(const c of [...markers.children])c.traverse(o=>(o as T.Mesh).geometry?.dispose());markers.clear();
  for(const g of journal.open()){
   if(g.biome!==world.biome||g.kind==='boss')continue;
   const m=new T.Group();m.position.set(g.x,0,g.z);
   const side=!!g.finding;
   m.add(new T.Mesh(new T.CylinderGeometry(.55,.9,12,20,1,true).translate(0,6,0),side?BEAM_SIDE:BEAM));
   const ring=new T.Mesh(new T.RingGeometry(1.7,1.95,48).rotateX(-Math.PI/2),side?RING_SIDE:RING);ring.position.y=.06;ring.name='ring';m.add(ring);
   const echo=g.id.startsWith('echo')||g.id==='passage'||g.id==='origin';
   const gem=new T.Mesh(echo?new T.OctahedronGeometry(.5,0).scale(.6,1.6,.6):side?new T.IcosahedronGeometry(.32,0):new T.OctahedronGeometry(.3,0),echo?ECHO:side?FIND:GEM);gem.position.y=echo?1.6:1.8;gem.name='gem';gem.castShadow=true;m.add(gem);
   markers.add(m);
  }
}
function updateMarkers(dt:number){
  BEAM.uniforms.uT.value+=dt;BEAM_SIDE.uniforms.uT.value+=dt;
  for(const m of markers.children){const r=m.getObjectByName('ring'),g=m.getObjectByName('gem');if(r){const s=1+Math.sin(time*2.4)*.06;r.scale.setScalar(s);}if(g){g.rotation.y+=dt*1.2;g.position.y=(g.position.y>1.7?1.8:1.6)+Math.sin(time*2)*.08;}}
}
// where to go next: a goal here, a portal toward the goal's region, or the person to report to
function portalTo(b:BiomeId){const dir=BIOME_ORDER.indexOf(b)>BIOME_ORDER.indexOf(world.biome)?1:-1;const pt=world.portals.find(p=>p.dir===dir);return pt?{p:pt.pos,label:`Portal · ${BIOMES[pt.to].name}`}:null;}
function guideTarget():{p:T.Vector3;label:string}|null{
  const mi=journal.current();let who:NpcId|null=null;
  if(!mi){const next=MISSIONS.find(x=>journal.status(x.id)==='available');if(!next)return null;who=next.npc;}
  else if(journal.status(mi.id)==='ready')who=mi.npc;
  if(who){if(world.biome!=='camp')return portalTo('camp');const n=npcs.find(x=>x.def.npc===who);return n?{p:n.pos,label:n.def.name}:null;}
  const sd=journal.sideCurrent(),sideReady=sd&&journal.status(sd.id)==='ready';
  const open=journal.open(),story=open.filter(g=>!g.finding),storyHere=story.filter(g=>g.biome===world.biome);
  const here=storyHere.length||!mi?storyHere:open.filter(g=>g.finding&&g.biome===world.biome);
  if(!here.length&&!story.length&&sideReady){if(world.biome!=='camp')return portalTo('camp');const n=npcs.find(x=>x.def.npc===sd!.npc);return n?{p:n.pos,label:n.def.name}:null;}
  if(here.length){let best=here[0],bd=1e9;for(const g of here){const d=Math.hypot(g.x-pos.x,g.z-pos.z);if(d<bd){bd=d;best=g;}}
   if(best.kind==='boss')return boss?{p:boss.pos,label:boss.name}:null;
   return{p:new T.Vector3(best.x,0,best.z),label:best.label};}
  return story.length?portalTo(story[0].biome):open.length?portalTo(open[0].biome):null;
}
const gv=new T.Vector3();
function updateGuide(){
  const el=$('guide'),tg=mode==='play'&&!dead?guideTarget():null;
  const d=tg?Math.hypot(tg.p.x-pos.x,tg.p.z-pos.z):0;
  if(!tg||d<4){el.classList.remove('on');return;}
  gv.copy(pos).setY(1);gv.project(camera);
  const cx=(gv.x*.5+.5)*innerWidth,cy=(-gv.y*.5+.5)*innerHeight,a=Math.atan2(tg.p.z-pos.z,tg.p.x-pos.x),R=Math.min(innerWidth,innerHeight)*.2;
  el.classList.add('on');el.style.transform=`translate(${cx+Math.cos(a)*R}px,${cy+Math.sin(a)*R}px)`;
  (el.firstElementChild as HTMLElement).style.transform=`rotate(${a}rad)`;
  const txt=`${tg.label} · ${Math.round(d)} m`;const sp=el.lastElementChild as HTMLElement;if(sp.textContent!==txt)sp.textContent=txt;
}
function updatePrompt(){
  const el=$('prompt'),it=talking?null:interactable();let txt='',btn='';
  if(scan){txt=`Analisando ${scan.g.label.toLowerCase()} · ${Math.round(scan.t/SCAN_TIME*100)}%`;}
  else if(it?.kind==='npc'){txt=`${touch?'':'F · '}Falar com ${it.n.def.name}`;btn='Falar';}
  else if(it?.kind==='scan'){txt=`${touch?'':'F · '}Analisar: ${it.g.label}`;btn='Analisar';}
  else if(it?.kind==='pen'){txt=`${touch?'':'F · '}Abrigo das feras`;btn='Abrigo';}
  if(el.textContent!==txt)el.textContent=txt;el.classList.toggle('on',!!txt);
  document.body.classList.toggle('can-act',!!btn&&!scan);if(btn&&$('t-act').textContent!==btn)$('t-act').textContent=btn;
}
let trackT=0;
function updateMissions(dt:number){
  const inCamp=world.biome==='camp';
  for(const n of npcs){const near=Math.hypot(n.pos.x-pos.x,n.pos.z-pos.z)<26;n.char.root.visible=inCamp&&!npcHidden&&near;if(inCamp&&near){n.setMarker(n.def.npc?journal.marker(n.def.npc):'');n.update(dt,pos,talking===n);}}
  if(mode!=='play'||dead){scan=null;$('guide').classList.remove('on');return;}
  for(const g of journal.open())if(g.kind==='visit'&&g.biome===world.biome&&Math.hypot(g.x-pos.x,g.z-pos.z)<3.2)goalDone(g);
  if(scan){
   if(moving||now()<rollUntil||Math.hypot(scan.g.x-pos.x,scan.g.z-pos.z)>3)scan=null;
   else{scan.t+=dt;faceTo(new T.Vector3(scan.g.x,0,scan.g.z));if(scan.t>=SCAN_TIME){const g=scan.g;scan=null;goalDone(g);}}
  }
  if(talking&&Math.hypot(talking.pos.x-pos.x,talking.pos.z-pos.z)>5)closeModal();
  updateGuards();updateMarkers(dt);updatePrompt();updateGuide();
  if((trackT+=dt)>1){trackT=0;renderTracker();}
}

// ---------- level, loot and equipment (gear.ts: the 2D rules) ----------
const pct=(v:number)=>Math.round(v*100)+'%';
// equipment or a new level changes the maximum life; what was gained is added, a loss only caps it
// what is worn shows on the hero: each equipped piece on its part of the body (outfit.ts), the accessory as a pendant
const SLOT_PART=[['helmet','helmet'],['armor','torso'],['legs','legs'],['boots','boots'],['gloves','gloves'],['accessory','accessory']] as const;
function wornArmour(g:Gear):Armour{const a:Armour={},sl=g.slots;for(const [slot,part] of SLOT_PART){const id=sl[slot];if(id)a[part]=EQUIPMENT[id].tier as 1|2|3;}return a;}
function refreshGear(){hero.setArmour(wornArmour(gear));if(net.on)net.profile(myProfile());gstats=gear.stats();const m=gear.maxHp(kit().hp);if(m!==hpMax){hp=Math.max(1,Math.min(m,hp+Math.max(0,m-hpMax)));hpMax=m;}hud();}
function gainXp(xp:number,at:T.Vector3){
  if(mode!=='play'||xp<=0)return;
  popText(at.clone().setY(2.7),`+${xp} XP`,'#d4b8ff');
  const up=gear.award(xp);
  if(up>0){refreshGear();hp=hpMax;banner(`Nível ${gear.level}`);sfx('heal');vfx.decal(pos.clone(),'#ffc24a',2.4,.8,1);
   vfx.emit({pos:pos.clone().setY(.2),n:60,speed:[1,3.5],up:1.4,life:[.6,1.2],size:[.18,.04],c0:'#fff4d0',c1:'#ffc24a',a:[1,0],drag:1,spread:.6});
   later(1.4,()=>toast(`Nível ${gear.level} · vida máxima ${hpMax}`));}
  hud();
}
// a defeated creature leaves material of its region (always), sometimes equipment, and XP
function reward(c:Enemy){
  if(mode!=='play'||best)return;
  const boss=c.boss?c.kind:null,first=boss?gear.bossXp(c.kind):0,at=c.pos.clone();
  dropLoot(at,{mat:gear.material(world.biome,!!boss)});
  const id=gear.drop(world.biome,boss);if(id)dropLoot(at,{item:id});
  gainXp(first||REGION_LOOT[world.biome].xp,at);
}
interface Drop{g:T.Group;body:T.Group;vel:T.Vector3;h:number;t:number;mat?:{tier:number;credits:number;amount:number};item?:EquipmentId;warned?:boolean}
const drops:Drop[]=[];
const MAT_COLORS=['#8adf7a','#ffbd54','#a8f0ff'];
const SHARD=new T.OctahedronGeometry(.15),CASE=new T.BoxGeometry(.44,.28,.3),PILLAR=new T.CylinderGeometry(.04,.2,3.4,10,1,true).translate(0,1.7,0);
const lootMats=new Map<string,T.Material>();
function lootMat(c:string,beam:boolean){const k=(beam?'b':'s')+c;let m=lootMats.get(k);
  if(!m){m=beam?new T.MeshBasicMaterial({color:c,transparent:true,opacity:.26,blending:T.AdditiveBlending,depthWrite:false,side:T.DoubleSide}):new T.MeshStandardMaterial({color:c,emissive:c,emissiveIntensity:1.5,roughness:.35,flatShading:true});lootMats.set(k,m);}
  return m;}
function dropLoot(at:T.Vector3,o:{mat?:{tier:number;credits:number;amount:number};item?:EquipmentId}){
  const g=new T.Group(),body=new T.Group();g.position.set(at.x,0,at.z);g.add(body);
  if(o.mat){const c=MAT_COLORS[o.mat.tier-1],n=Math.min(3,o.mat.amount);for(let i=0;i<n;i++){const s=new T.Mesh(SHARD,lootMat(c,false));s.position.set((i-(n-1)/2)*.24,i%2*.08,0);s.rotation.y=i;body.add(s);}}
  else if(o.item){const c=RARITY_COLORS[EQUIPMENT[o.item].rarity];const b=new T.Mesh(CASE,lootMat(c,false));b.castShadow=true;body.add(b);g.add(new T.Mesh(PILLAR,lootMat(c,true)));}
  const a=Math.random()*6.28,sp=o.item?1.3:2;world.scene.add(g);
  drops.push({g,body,vel:new T.Vector3(Math.cos(a)*sp,4.4,Math.sin(a)*sp),h:.9,t:0,...o});
}
function removeDrop(i:number){drops[i].g.removeFromParent();drops.splice(i,1);}
function gotMaterial(m:{tier:number;credits:number;amount:number},at:T.Vector3){gear.collect(m);popText(at.clone().setY(1.6),`+${m.amount} ${MATERIAL_NAMES[m.tier-1]} · +${m.credits} cr`,MAT_COLORS[m.tier-1]);}
function updateDrops(dt:number){
  for(let i=drops.length-1;i>=0;i--){
   const d=drops[i],g=d.g;d.t+=dt;
   if(d.t<.75){g.position.x+=d.vel.x*dt;g.position.z+=d.vel.z*dt;d.vel.y-=15*dt;d.h=Math.max(.35,d.h+d.vel.y*dt);if(d.t>.1)world.collide(g.position,.2);}
   else d.h=.38+Math.sin(d.t*3+i)*.07;
   d.body.position.y=d.h;d.body.rotation.y+=dt*(d.item?1.2:2.4);
   if(mode!=='play'||dead||d.t<.6)continue;
   const dx=pos.x-g.position.x,dz=pos.z-g.position.z,l=Math.hypot(dx,dz);
   if(d.mat){if(l<3.6&&l>.01){const k=Math.min(l,dt*(6+12*(1-l/3.6)));g.position.x+=dx/l*k;g.position.z+=dz/l*k;}
    if(l<.7){gotMaterial(d.mat,g.position);sfx('ui');removeDrop(i);hud();}}
   else if(d.item){
    if(l<1.3){if(gear.take(d.item)){toast(`Coletado: ${equipmentName(d.item,cls())}`);sfx('heal');removeDrop(i);hud();}
     else if(!d.warned){d.warned=true;toast(`Mochila cheia · ${BAG_SIZE}/${BAG_SIZE} · venda ou desmonte peças na oficina do Ivo`);}}
    else if(l>2.5)d.warned=false;}
  }
}
// leaving a region brings along what is still on the ground; an item that does not fit stays behind
function collectDrops(){
  let lost=0;for(const d of drops){if(d.mat)gear.collect(d.mat);else if(d.item&&!gear.take(d.item))lost++;}
  clearDrops();if(lost)later(1,()=>toast(`Mochila cheia: ${lost} ${lost>1?'peças ficaram':'peça ficou'} para trás`));
}
function clearDrops(){while(drops.length)removeDrop(drops.length-1);}
function drinkPotion(){
  if(mode!=='play'||dead)return;const at=pos.clone().setY(2.4);
  if(!gear.potions){popText(at,'Sem poções · compre na enfermaria','#9a917f');return;}
  if(hp>=hpMax){popText(at,'Vida cheia','#9a917f');return;}
  if(now()<potionReady){popText(at,`Poção em ${Math.ceil(potionReady-now())} s`,'#9a917f');return;}
  gear.drink();potionReady=now()+POTION_CD;const h=Math.round(hpMax*POTION_HEAL);hp=Math.min(hpMax,hp+h);
  popText(at,'+'+h,'#7dff9e');sfx('heal');vfx.emit({pos:pos.clone().setY(1),n:24,speed:[.5,2],up:.9,life:[.5,.9],size:[.16,.03],c0:'#e8ffe8',c1:'#2fae5a',a:[1,0],drag:1,spread:.4});hud();
}
$('potbtn').addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();drinkPotion();});
$('bagbtn').onclick=()=>openGear();
const itemName=(id:EquipmentId)=>equipmentName(id,cls());
const RARITY:Record<string,string>={comum:'Comum',aprimorado:'Aprimorado',raro:'Raro'};
function itemHead(id:EquipmentId){const it=EQUIPMENT[id];return`<em>${SLOT_NAMES[it.slot]} · ${RARITY[it.rarity]}</em><b style="color:${RARITY_COLORS[it.rarity]}">${itemName(id)}</b><span>${it.description}</span>`;}
const wallet=()=>{const e=gear.economy;return`<p class="wallet"><b>${e.credits}</b> créditos${MATERIAL_NAMES.map((n,i)=>` · <b style="color:${MAT_COLORS[i]}">${e.materials[i]}</b> ${n}`).join('')} · <b>${e.potions}</b> ${e.potions===1?'poção':'poções'}</p>`;};
// fitting room (3d.html?provador=warrior|hunter|astral|xenobinder): a temporary character that is never saved, with the
// 2D sets of every tier in the backpack and one button per set. Saved characters and their progress are not touched.
const FITTING=q.has('provador');
const SET_NAMES=['','Conjunto 1 · comum','Conjunto 2 · aprimorado','Conjunto 3 · raro'];
function enterFitting(){
  heroRec={id:'provador',name:q.get('nome')??'Provador',look:{...look},pet:petId,created:Date.now(),played:Date.now()};   // not in the roster
  journal=new Journal(null);gear=new Gear(null);
  for(const t of [1,2,3])for(const id of EQUIPMENT_IDS)if(EQUIPMENT[id].tier===t)gear.take(id);
  gear.economy.credits=999;gear.economy.materials=[40,40,40];gear.economy.potions=20;gstats=gear.stats();clearDrops();
  document.body.classList.remove('selecting');document.body.classList.add('fitting');try{localStorage.setItem('dante3d.help','1');}catch{/* ignore */}
  enter();zoom=.6;later(.6,openGear);
}
// trial journey (3d.html?teste=fim&cls=...): a temporary character, never saved, with the story done up to the
// caravan and the four guardians beaten, to try the terraces, the first shelter and every regional expedition
const TRIAL=q.get('teste')==='fim';
function enterTrial(){
  heroRec={id:'teste',name:q.get('nome')??'Teste',look:{...look},pet:petId,created:Date.now(),played:Date.now()};   // not in the roster
  journal=new Journal(null);gear=new Gear(null);
  for(const id of ['recon','survival','signal','beyond','dunes','frost','forges','source','caravan'])journal.done.add(id);
  for(const b of ['warden','soterrado','vesper','titan']){journal.bosses.add(b);journal.goals.add(b);gear.bosses.add(b);}
  gear.xp=900;gear.economy.credits=400;gear.economy.potions=6;gstats=gear.stats();clearDrops();
  document.body.classList.remove('selecting');try{localStorage.setItem('dante3d.help','1');}catch{/* ignore */}
  enter();later(1,()=>toast('Personagem de teste · nada é salvo · fale com Ivo (história) ou com Lia, Ivo e Nara (expedições)'));
}
function wearSet(t:number){
  for(const sl of EQUIPMENT_SLOTS)gear.unequip(sl);
  if(t)for(const it of gear.bag.filter(i=>EQUIPMENT[i.id].tier===t))gear.equip(it.uid);
  sfx('heal');refreshGear();
}
// character sheet: level, what is worn (click to take off) and the backpack (click to wear)
function openGear(){
  if(mode!=='play')return;
  const m=$('modal'),body=$('mbody');m.classList.remove('talking');talking=null;$('mtitle').textContent='Equipamento';
  const s=gstats,nx=gear.levelNext;
  const head=`<div class="gstats"><div><b>Nível ${gear.level}</b><span>${nx?`${gear.xp-gear.levelFloor} / ${nx-gear.levelFloor} XP`:'nível máximo'}</span></div><div><b>${hpMax}</b><span>vida máxima</span></div><div><b>+${pct(s.damage)}</b><span>dano</span></div><div><b>+${pct(s.charge)}</b><span>dano do Q</span></div><div><b>${pct(s.resistance)}</b><span>menos dano</span></div></div>`+wallet();
  const slots=EQUIPMENT_SLOTS.map(sl=>{const w=gear.worn(sl);return w?`<button class="item worn" data-un="${sl}">${itemHead(w.id)}<i>Tirar</i></button>`:`<div class="item empty"><em>${SLOT_NAMES[sl]}</em><span>vazio</span></div>`;}).join('');
  const bag=gear.bag;
  const items=bag.length?bag.map(i=>{const cur=gear.slots[EQUIPMENT[i.id].slot];return`<button class="item" data-eq="${i.uid}">${itemHead(i.id)}<i>${cur?`Vestir no lugar de ${itemName(cur)}`:'Vestir'}</i></button>`;}).join('')
   :'<p class="note">Vazia. As criaturas às vezes deixam equipamento (os chefes sempre deixam), e o Ivo fabrica peças na oficina do acampamento.</p>';
  const fit=FITTING?`<p class="note fitnote">Provador: personagem temporário, nada é salvo. Vista um conjunto inteiro ou peça por peça; feche a ficha para ver o herói.</p><div class="sets">${[1,2,3].map(t=>`<button data-set="${t}">${SET_NAMES[t]}</button>`).join('')}<button data-set="0">Tirar tudo</button></div>`:'';
  body.innerHTML=fit+head+`<h3>Vestindo</h3><div class="items">${slots}</div><h3>Mochila · ${bag.length} / ${BAG_SIZE}</h3><div class="items">${items}</div>`;
  m.classList.add('on');sfx('ui');
  body.querySelectorAll<HTMLButtonElement>('[data-un]').forEach(b=>b.onclick=()=>{if(gear.unequip(b.dataset.un as EquipmentSlot)){sfx('ui');refreshGear();openGear();}else toast('Mochila cheia: libere um espaço antes de tirar a peça');});
  body.querySelectorAll<HTMLButtonElement>('[data-eq]').forEach(b=>b.onclick=()=>{if(gear.equip(b.dataset.eq!)){sfx('heal');refreshGear();openGear();}});
  body.querySelectorAll<HTMLButtonElement>('[data-set]').forEach(b=>b.onclick=()=>{const t=Number(b.dataset.set);wearSet(t);closeModal();toast(t?`${SET_NAMES[t]} vestido · I abre a ficha de novo`:'Sem equipamento · I abre a ficha de novo');});
}
// base services, the same as the 2D panel: Lia (potions, free healing), Ivo (craft, sell, dismantle), Nara (vault)
const SVC:Record<NpcId,string>={lia:'Enfermaria · poções e cura',ivo:'Oficina · fabricar, vender e desmontar',nara:'Cofre da base'};
const TIER_NAMES=['Peças da floresta','Peças âmbar (Siroco)','Peças boreais (Geada)'];
function openService(id:NpcId,back?:Npc){
  const m=$('modal'),body=$('mbody'),e=gear.economy;m.classList.remove('talking');talking=back??null;
  let html=wallet();
  if(id==='lia'){$('mtitle').textContent='Enfermaria';
   html+=`<p class="note">Cada poção recupera 35% da vida (tecla R ou o botão ao lado da vida). Até 20 na mochila.</p><div class="opts">
    <button data-a="buy" ${e.credits<POTION_PRICE||e.potions>=20?'disabled':''}>Comprar poção · ${POTION_PRICE} créditos</button>
    <button data-a="heal" ${hp>=hpMax?'disabled':''}>Restaurar a vida · grátis</button></div>`;}
  else if(id==='ivo'){$('mtitle').textContent='Oficina';
   html+=`<h3>Fabricar</h3>`+[1,2,3].map(t=>{const ids=EQUIPMENT_IDS.filter(x=>EQUIPMENT[x].tier===t),r=recipe(ids[0]);
    if(t>1&&!e.materials[r.material])return`<p class="note">${TIER_NAMES[t-1]}: traga ${MATERIAL_NAMES[r.material]} das expedições.</p>`;
    return`<p class="tier">${TIER_NAMES[t-1]} · ${r.credits} créditos e ${r.amount} ${MATERIAL_NAMES[r.material]} cada</p><div class="items">`+ids.map(x=>{const ok=e.credits>=r.credits&&e.materials[r.material]>=r.amount&&gear.free>0;return`<button class="item" data-craft="${x}" ${ok?'':'disabled'}>${itemHead(x)}<i>Fabricar</i></button>`;}).join('')+'</div>';}).join('');
   const bag=gear.bag;
   html+=`<h3>Mochila · ${bag.length} / ${BAG_SIZE}</h3>`+(bag.length?'<div class="items">'+bag.map(i=>`<div class="item">${itemHead(i.id)}<div class="two"><button data-sell="${i.uid}">Vender · +${salePrice(i.id)} cr</button><button data-dis="${i.uid}">Desmontar · +2 ${MATERIAL_NAMES[EQUIPMENT[i.id].tier-1]}</button></div></div>`).join('')+'</div>':'<p class="note">Nada para vender: só as peças da mochila (não as vestidas).</p>');}
  else{$('mtitle').textContent='Cofre da base';
   const st=e.stash,bag=gear.bag;
   html+=`<p class="note">Guarde aqui o que não cabe na mochila. O cofre fica no acampamento e guarda até 48 peças.</p><h3>No cofre · ${st.length} / 48</h3>`+(st.length?'<div class="items">'+st.map(i=>`<button class="item" data-wd="${i.uid}" ${gear.free>0?'':'disabled'}>${itemHead(i.id)}<i>Retirar para a mochila</i></button>`).join('')+'</div>':'<p class="note">Vazio.</p>')+
    `<h3>Mochila · ${bag.length} / ${BAG_SIZE}</h3>`+(bag.length?'<div class="items">'+bag.map(i=>`<button class="item" data-dep="${i.uid}" ${st.length<48?'':'disabled'}>${itemHead(i.id)}<i>Guardar no cofre</i></button>`).join('')+'</div>':'<p class="note">Mochila vazia.</p>');}
  if(back)html+=`<button class="svc" data-back="1">Voltar à conversa</button>`;
  body.innerHTML=html;m.classList.add('on');
  const run=(a:Parameters<Gear['service']>[0],msg:string)=>{if(!gear.service(a)){toast('Não foi possível concluir');return;}if(a.kind==='heal')hp=hpMax;sfx('heal');toast(msg);refreshGear();openService(id,back);};
  body.querySelectorAll<HTMLButtonElement>('[data-a]').forEach(b=>b.onclick=()=>b.dataset.a==='buy'?run({kind:'buy'},'Poção comprada'):run({kind:'heal'},'Vida restaurada'));
  body.querySelectorAll<HTMLButtonElement>('[data-craft]').forEach(b=>b.onclick=()=>run({kind:'craft',id:b.dataset.craft as EquipmentId},`Fabricado: ${itemName(b.dataset.craft as EquipmentId)}`));
  body.querySelectorAll<HTMLButtonElement>('[data-sell]').forEach(b=>b.onclick=()=>run({kind:'sell',uid:b.dataset.sell},'Peça vendida'));
  body.querySelectorAll<HTMLButtonElement>('[data-dis]').forEach(b=>b.onclick=()=>run({kind:'dismantle',uid:b.dataset.dis},'Peça desmontada'));
  body.querySelectorAll<HTMLButtonElement>('[data-dep]').forEach(b=>b.onclick=()=>run({kind:'deposit',uid:b.dataset.dep},'Guardada no cofre'));
  body.querySelectorAll<HTMLButtonElement>('[data-wd]').forEach(b=>b.onclick=()=>run({kind:'withdraw',uid:b.dataset.wd},'Retirada para a mochila'));
  body.querySelector<HTMLButtonElement>('[data-back]')?.addEventListener('click',()=>{if(back)openTalk(back);});
}

// ---------- input ----------
addEventListener('keydown',e=>{
  keys.add(e.code);
  if(mode!=='play')return;
  if(e.code==='Space'){e.preventDefault();roll();}
  else if(e.code==='KeyJ'){updateAim();tryAttack();}
  else if(e.code==='KeyQ'&&!e.repeat){updateAim();skillDown();}
  else if(e.code==='KeyF'&&!e.repeat)interact();
  else if(e.code==='KeyR'&&!e.repeat)drinkPotion();
  else if(e.code==='KeyM'&&!e.repeat&&mode==='play'){if($('modal').classList.contains('on')&&$('mtitle').textContent==='Atlas de Dante')closeModal();else openAtlas();}
  else if(e.code==='KeyI'&&!e.repeat){if($('modal').classList.contains('on')&&$('mtitle').textContent==='Equipamento')closeModal();else openGear();}
  else if(e.code==='KeyE'&&!e.repeat){if(!interact())cycleElement();}
});
addEventListener('keyup',e=>{keys.delete(e.code);if(e.code==='KeyQ'){updateAim();skillUp();}});
const cv=renderer.domElement;
cv.addEventListener('pointermove',e=>{
  mouse.set(e.clientX/innerWidth*2-1,-(e.clientY/innerHeight)*2+1);
  if(mode==='creator'&&(e.buttons&1))previewYaw+=e.movementX*.012;
});
cv.addEventListener('pointerdown',e=>{
  mouse.set(e.clientX/innerWidth*2-1,-(e.clientY/innerHeight)*2+1);
  if(mode!=='play')return;
  if(touch)return;
  updateAim();
  if(e.button===2){rightDown=true;faceTo(aimPoint);skillDown();return;}
  if(e.button===0){mouseDown=true;faceTo(aimPoint);tryAttack();}
});
addEventListener('pointerup',e=>{if(e.button===2&&rightDown){rightDown=false;updateAim();skillUp();}if(e.button===0)mouseDown=false;});
cv.addEventListener('contextmenu',e=>e.preventDefault());
cv.addEventListener('wheel',e=>{zoom=Math.min(1.5,Math.max(.6,zoom+e.deltaY*.0008));},{passive:true});

// ---------- loop ----------
function resize(){const w=innerWidth,h=innerHeight;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();world.resize(w,h,renderer.getPixelRatio());}
addEventListener('resize',resize);resize();
let last=performance.now()/1000,time=0,hudT=0,qaAim=false;
// adaptive quality: drop resolution, then post-processing and shadows, when frames run long
let quality:'high'|'low'=q.get('q')==='low'?'low':'high',slowT=0,fastT=0,fpsAcc=0,fpsN=0,fpsShown=0;
function setQuality(qv:'high'|'low'){quality=qv;renderer.shadowMap.enabled=qv==='high';world.scene.traverse(o=>{const m=(o as T.Mesh).material as T.Material|undefined;if(m)m.needsUpdate=true;});}
function adapt(dt:number){
  fpsAcc+=dt;fpsN++;if(fpsAcc>.5){fpsShown=Math.round(fpsN/fpsAcc);fpsAcc=0;fpsN=0;$('fps').textContent=fpsShown+' fps';}
  if(dt>1/40){slowT+=dt;fastT=0;}else{fastT+=dt;slowT=Math.max(0,slowT-dt*.5);}
  if(slowT>2){slowT=0;if(pr>.75){pr=Math.max(.75,pr-.25);renderer.setPixelRatio(pr);resize();}else if(quality==='high')setQuality('low');}
  else if(fastT>6&&pr<MAX_PR){fastT=0;pr=Math.min(MAX_PR,pr+.25);renderer.setPixelRatio(pr);resize();}
}
function tick(dt:number){
  time+=dt;
  for(let i=timers.length-1;i>=0;i--)if(timers[i].at<=time){const f=timers[i].fn;timers.splice(i,1);f();}
  if(mode==='creator'){heading=previewYaw;if(hero.model)hero.model.rotation.y+=(previewYaw-hero.model.rotation.y)*Math.min(1,dt*10);hero.play(hero.has(kit().idle)?kit().idle:'Idle_Loop',{fade:.25});pet?.preview(dt);}
  else updatePlayer(dt);
  if(mode==='play'&&!mouseDown&&!qaAim&&!('ontouchstart' in window))updateAim();
  if(best)updateBestiary(dt);
  hero.update(dt);updatePeers(dt);sendState();updateEnemies(dt,time);updateMissions(dt);updateFx(dt);updateDrops(dt);updateTexts(dt);updateBars();
  key.position.set(pos.x+3,4.5,pos.z+5);key.target.position.set(pos.x,pos.y+1,pos.z);key.intensity=mode==='creator'?2.4:.35;
  world.update(time,dt,pos);updateCamera(dt);
}
// ---------- bestiary: the creatures alone, one at a time, turning, with their animations (3d.html?bestiario) ----------
const NEW_MONSTERS:SpeciesId[]=['skitter','bankGrazer','reedSpitter','thorn','carapace','emberHound','fumarole','slagback','frostPouncer','iceCarapace'];
const OLDER_MODELS:SpeciesId[]=['crawler','duneAntlion','glassAntlion','dunePouncer','frostWyvern','vesper'];
const ORIGIN:Record<string,string>={q:'Quaternius · Ultimate Monsters (CC0), adaptado ao Dante',antlion:'Flare · Clint Bellanger (CC BY)',wyvern:'Flare · Clint Bellanger e Justin Nichol (CC BY-SA)',spider:'Easyforge · Giant Monster Spiders'};
let best:{list:SpeciesId[];i:number;c:Creature|null;yaw:number;motion:string}|null=null;
function bestiary(all:boolean){
  document.body.classList.add('bestiary');goBiome('springs');for(const e of enemies)e.dispose();enemies.length=0;habs=[];
  hero.root.visible=false;for(const n of npcs)n.char.root.visible=false;if(pet){pet.remove();pet=null;}
  best={list:all?[...NEW_MONSTERS,...OLDER_MODELS]:[...NEW_MONSTERS],i:0,c:null,yaw:0,motion:'idle'};
  const box=document.createElement('div');box.id='bestiary';
  box.innerHTML=`<div class="bt"><button id="b-prev">◀</button><div><b id="b-name"></b><span id="b-info"></span></div><button id="b-next">▶</button></div><div class="bm">${[['idle','Parado'],['move','Andar'],['run','Correr'],['attack','Atacar'],['hit','Dano'],['death','Morrer']].map(([k,l])=>`<button data-m="${k}">${l}</button>`).join('')}</div><div class="bc"><span id="b-count"></span> · arraste para girar · <a href="3d.html?bestiario${all?'':'=todos'}">${all?'só os novos':'ver também aranha, formigas-leão e wyverns'}</a></div>`;
  document.body.appendChild(box);
  $('b-prev').onclick=()=>showMonster(-1);$('b-next').onclick=()=>showMonster(1);
  box.querySelectorAll<HTMLButtonElement>('.bm button').forEach(b=>b.onclick=()=>{if(best){best.motion=b.dataset.m!;playMotion();}});
  addEventListener('keydown',e=>{if(e.code==='ArrowRight')showMonster(1);if(e.code==='ArrowLeft')showMonster(-1);});
  let drag=-1;cv.addEventListener('pointerdown',e=>{drag=e.clientX;});addEventListener('pointerup',()=>{drag=-1;});
  cv.addEventListener('pointermove',e=>{if(drag>=0&&best){best.yaw+=(e.clientX-drag)*.01;drag=e.clientX;}});
  showMonster(0);
}
function showMonster(step:number){
  if(!best)return;best.c?.dispose();best.i=(best.i+step+best.list.length)%best.list.length;
  const k=best.list[best.i],c=new Creature(k,0,0,world.scene);best.c=c;best.motion='idle';
  const file=c.spec.model?MODEL_DEF[c.spec.model].file:'';const src=file.startsWith('q/')?'q':file.startsWith('antlion')?'antlion':file.startsWith('wyvern')?'wyvern':c.spec.model==='spider'?'spider':'';
  $('b-name').textContent=c.name;$('b-info').textContent=(BIOME_ORDER.filter(b=>BIOMES[b].creatures.some(([s])=>s===k)).map(b=>BIOMES[b].name).join(', ')||'Chefe')+' · '+(ORIGIN[src]??'corpo procedural');
  $('b-count').textContent=`${best.i+1} de ${best.list.length}`;playMotion();
}
function playMotion(){
  if(!best?.c)return;best.c.t=0;best.c.anim(best.motion as 'idle',best.motion==='attack'||best.motion==='death'||best.motion==='hit');
  document.querySelectorAll<HTMLButtonElement>('#bestiary .bm button').forEach(b=>b.classList.toggle('on',b.dataset.m===best!.motion));
}
function updateBestiary(dt:number){
  if(!best?.c)return;const c=best.c,L=c.look;best.yaw+=dt*.35;
  c.g.rotation.y=best.yaw;c.g.position.set(0,c.spec.fly??0,0);L.mixer?.update(dt);
  // once an attack, hit or death ends, return to the idle loop after a pause
  const a=L.cur?L.acts?.[L.cur as 'idle']:null;if(a&&!a.isRunning()&&L.cur!=='idle'){c.t+=dt;if(c.t>1.2){c.t=0;best.motion='idle';playMotion();}}
  // portrait phones: farther away and the creature framed above the buttons
  const narrow=camera.aspect<1,h=L.height*c.spec.scale,r=Math.max(3.2,h*2.1)*(narrow?Math.min(2.4,1.15/camera.aspect):1),fy=c.spec.fly??0;
  fixedCam=[new T.Vector3(0,h*.75+r*.32+fy,r),new T.Vector3(0,h*.5+fy-(narrow?r*.16:r*.08),0)];
}
function frame(){
  const t=performance.now()/1000,dt=Math.min(.05,t-last);last=t;
  tick(dt);
  if(quality==='high')world.render(camera,time);else renderer.render(world.scene,camera);
  if(mode==='play'&&(hudT+=dt)>.1){hudT=0;hud();}
  adapt(dt);
  requestAnimationFrame(frame);
}
(async()=>{
  await hero.setSex(look.sex);hero.apply(look);await hero.setWeapon(look.weapon);
  await Promise.all(npcs.map(n=>n.load()));
  if(q.get('sex'))await change({sex:q.get('sex') as Sex});
  if(q.get('cls')&&CLASSES[q.get('cls') as ClassId])await change({weapon:CLASSES[q.get('cls') as ClassId].weapon});
  const patch:Partial<Look>={};
  for(const k of['skin','hairColor','cloth'] as const)if(q.get(k))patch[k]=Number(q.get(k));
  if(q.get('helmet'))patch.helmet=q.get('helmet')==='1';
  for(const k of['hair','brows','outfit','weapon'] as const)if(q.get(k))(patch as Record<string,string>)[k]=q.get(k)!;
  if(Object.keys(patch).length)await change(patch);
  if(q.get('fera')&&PETS[q.get('fera') as PetId])petId=q.get('fera') as PetId;
  refreshUi();
  // compile every material up front (enemy, projectile, ring) so the first fight doesn't hitch
  // sculpted creatures: Warden (ours), Flare antlions and wyverns, and the Easyforge spider (incorporated game module);
  // a species whose model fails keeps its procedural body
  const gl=new GLTFLoader(),put=(k:string,g:{scene:T.Group;animations:T.AnimationClip[]})=>{MODELS[k]=g.scene;ANIMS[k]=g.animations;};
  await Promise.all([
   gl.loadAsync(import.meta.env.BASE_URL+'assets/3d-new/creatures/warden.glb').then(g=>{MODELS.warden=g.scene;}).catch(()=>{}),
   ...Object.entries(MODEL_DEF).filter(([,d])=>d.file).map(([k,d])=>gl.loadAsync(import.meta.env.BASE_URL+'assets/3d-new/creatures/'+d.file+'.glb').then(g=>put(k,g)).catch(()=>{})),
   import('virtual:arrival-hollow').then(async m=>{const p=m.default;if(!p)return;const bytes=Uint8Array.from(atob(p.data),c=>c.charCodeAt(0));put('spider',await gl.parseAsync(bytes.buffer,''));}).catch(()=>{}),
  ]);
  const warm=(Object.keys(SPECIES) as SpeciesId[]).map((k,i)=>new Creature(k,i*3,-200,world.scene));
  const warmPets=PET_ORDER.map((id,i)=>{const g=new T.Group();g.position.set(i*3,0,-206);petBody(g,PETS[id].model,PETS[id].glow,PETS[id].base);world.scene.add(g);return g;});const W=new T.Vector3(0,1,-200),F=new T.Vector3(0,0,1);
  for(const k of ['pulse','fire','water','earth','energy','filament'] as Kind[]){fire(k,W,F,0,0);vfx.impact(k,W,F);}
  vfx.slash(W,0,false);vfx.field('energy',W,1);vfx.field('earth',W,1);vfx.decal(W,'#fff',1,.1);
  const tw=teleWarm();tw.position.copy(W);world.scene.add(tw);const mw=new T.Group();mw.position.copy(W);for(const m of[BEAM,RING,GEM,ECHO])mw.add(new T.Mesh(new T.PlaneGeometry(1,1),m));world.scene.add(mw);
  renderer.compile(world.scene,camera);warm.forEach(w=>w.dispose());warmPets.forEach(g=>g.removeFromParent());for(const p of projs)dispose(p.o);projs.length=0;tw.removeFromParent();mw.removeFromParent();
  renderer.compile(world.scene,camera);warm.forEach(w=>w.dispose());
  if(quality==='low')setQuality('low');
  $('loading').remove();
  if(q.get('biome')&&BIOMES[q.get('biome') as BiomeId])goBiome(q.get('biome') as BiomeId);
  if(FITTING){const c=q.get('provador') as ClassId;if(CLASSES[c])await change({weapon:CLASSES[c].weapon});enterFitting();}
  else if(TRIAL){const c=q.get('cls') as ClassId;if(CLASSES[c])await change({weapon:CLASSES[c].weapon});enterTrial();}
  else if(q.get('auto')){
   // tests: play the current character, or a new one made from the look in the address
   if(!heroRec){heroRec={id:newId(),name:q.get('nome')??'Explorador',look:{...look},pet:(q.get('fera') as PetId)??'symbiont',created:Date.now(),played:Date.now()};roster.list.push(heroRec);}
   enterAs(heroRec);
  }else if(roster.list.length)showSelect();else openCreator('new');
  if(q.has('bestiario'))bestiary(q.get('bestiario')==='todos');
  requestAnimationFrame(frame);
})();
// QA hooks
(window as unknown as {__d3:unknown}).__d3={get state(){return{level:gear.level,xp:gear.xp,hpMax,potions:gear.potions,credits:gear.economy.credits,materials:[...gear.economy.materials],bag:gear.bag.map(i=>i.id),worn:{...gear.slots},drops:drops.length,mode,hp,mana,kills,dead,anim:hero.currentName,pos:pos.toArray(),clips:[...hero.clips.keys()],enemies:enemies.length,look,name:heroName(),pet:pet?.id??null,petPos:pet?pet.g.position.toArray():null,petAnim:pet?.look?.cur??null,shield:now()<shieldUntil,biome:world.biome,roster:roster.list.map(h=>h.name),reachable:BIOME_ORDER.filter(reachable)};},cam:(px:number,py:number,pz:number,tx:number,ty:number,tz:number)=>{fixedCam=px===undefined?null:[new T.Vector3(px,py,pz),new T.Vector3(tx,ty,tz)];},advance:(sec:number)=>{for(let i=0;i<sec*30;i++)tick(1/30);},vfx,goBiome,bossNow:()=>{biomeKills=99;},scene:world.scene,hero,renderer,npcs:(v:boolean)=>{for(const n of npcs)n.char.root.visible=v;npcHidden=!v;},shadows:(v:boolean)=>{renderer.shadowMap.enabled=v;world.scene.traverse(o=>{const m=(o as T.Mesh).material as T.Material|undefined;if(m)m.needsUpdate=true;});},perf:(n=10)=>{const t0=performance.now();for(let i=0;i<n;i++)tick(1/30);const t1=performance.now();renderer.info.autoReset=false;renderer.info.reset();world.render(camera,time);const calls=renderer.info.render.calls,tris=renderer.info.render.triangles;renderer.info.autoReset=true;const t2=performance.now();for(let i=0;i<n;i++){if(quality==='high')world.render(camera,time);else renderer.render(world.scene,camera);}const t3=performance.now();let lights=0,meshes=0,skinned=0;world.scene.traverseVisible(o=>{if((o as T.Light).isLight)lights++;if((o as T.Mesh).isMesh)meshes++;if((o as T.SkinnedMesh).isSkinnedMesh)skinned++;});return{tick:+((t1-t0)/n).toFixed(2),render:+((t3-t2)/n).toFixed(1),calls,tris,programs:renderer.info.programs?.length,lights,meshes,skinned,pr:renderer.getPixelRatio()};},journal:()=>journal,peerInfo:()=>[...peers.values()].map(p=>({name:p.profile.name,cls:p.profile.cls,vis:p.char.root.visible,pet:p.pet?.id??null,petVis:p.pet?.g.visible??false,petPos:p.pet?p.pet.g.position.toArray().map(v=>+v.toFixed(2)):null})),ghosts:()=>projs.filter(x=>x.ghost).length,tp:(x:number,z:number)=>{pos.set(x,0,z);},interact,openPen,pet:()=>pet,beat:(k:string)=>{journal.beat(k);sealPortals();renderBiomes();},gear:()=>gear,xp:(n:number)=>gainXp(n,pos),give:(id:EquipmentId)=>{gear.take(id);hud();},openGear,openService:(id:NpcId)=>openService(id),drink:drinkPotion,refreshGear,hurt:(d:number)=>damage(d,pos.clone().setZ(pos.z+1)),dropAt:()=>drops.map(d=>[d.g.position.x,d.g.position.z,d.item??null]),talkTo:(id:string)=>{const n=npcs.find(x=>x.def.id===id);if(n){pos.set(n.pos.x,0,n.pos.z+1.6);openTalk(n);}},goal:(id:string)=>{const g=journal.open().find(x=>x.id===id);if(g)goalDone(g);},enter,change,tryAttack,roll,skill:(hold=.6)=>{skillDown();later(hold,skillUp);},cycleElement,keys,aim:(x:number,z:number)=>{qaAim=true;aimPoint.set(x,0,z);},qa:{T,ink,menace,glb:(u:string)=>new GLTFLoader().loadAsync(u)},list:()=>enemies,habs:()=>habs,hp:()=>hp,bars:()=>[bars.size,mode],spawn:(x:number,z:number,k:SpeciesId='crawler')=>{const e=new Creature(k,x,z,world.scene);enemies.push(e);return e;},mount:(px:number,py:number,pz:number,rx:number,ry:number,rz:number)=>{if(hero.weapon){hero.weapon.position.set(px,py,pz);hero.weapon.rotation.set(rx,ry,rz);}},zoom:(z:number)=>{zoom=z;},close:(bone:string,x:number,y:number,z:number)=>{close=bone?{bone,off:new T.Vector3(x,y,z)}:null;},calib:(tx:number,ty:number,tz:number)=>{
 const w=hero.weapon,h=hero.hand;if(!w||!h)return null;hero.model.updateMatrixWorld(true);
 const mq=hero.model.getWorldQuaternion(new T.Quaternion()),hq=h.getWorldQuaternion(new T.Quaternion());
 const hm=mq.clone().invert().multiply(hq);const wq=hm.clone().multiply(w.quaternion);
 let dt=new T.Vector3(tx,ty,tz);
 if(dt.lengthSq()<1e-6){const la=hero.model.getObjectByName('lowerarm_r')!,a=la.getWorldPosition(new T.Vector3()),b=h.getWorldPosition(new T.Vector3());dt=b.sub(a).applyQuaternion(mq.clone().invert());}
 dt.normalize();
 const dc=new T.Vector3(0,0,-1).applyQuaternion(wq);let nq=new T.Quaternion().setFromUnitVectors(dc,dt).multiply(wq);
 const up=new T.Vector3(0,1,0);up.addScaledVector(dt,-up.dot(dt)).normalize();
 const z=new T.Vector3(0,1,0).applyQuaternion(nq);z.addScaledVector(dt,-z.dot(dt)).normalize();
 const ang=Math.atan2(new T.Vector3().crossVectors(z,up).dot(dt),z.dot(up));
 nq=new T.Quaternion().setFromAxisAngle(dt,ang).multiply(nq);
 const local=hm.clone().invert().multiply(nq);const e=new T.Euler().setFromQuaternion(local,'XYZ');
 w.quaternion.copy(local);return e.toArray().slice(0,3).map(v=>+(v as number).toFixed(3));},probe:()=>{if(!hero.weapon)return null;hero.model.updateMatrixWorld(true);const m=new T.Matrix4().copy(hero.model.matrixWorld).invert();const d=new T.Vector3(0,0,-1).transformDirection(hero.weapon.matrixWorld).transformDirection(m);const hp=new T.Vector3();hero.hand!.getWorldPosition(hp);hp.applyMatrix4(m);return{blade:d.toArray().map(v=>+v.toFixed(2)),hand:hp.toArray().map(v=>+v.toFixed(2)),t:hero.current?.time};},yaw:(y:number)=>{previewYaw=y;},setHeading:(h:number)=>{heading=h;}};
