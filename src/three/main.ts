import * as T from 'three';
import './style.css';
import {Character,DEFAULT_LOOK,HAIR,HAIR_COLORS,BROWS,CLOTH,OUTFITS,SKINS,type Look,type Sex} from './character';
import {CLASSES,CLASS_ORDER,WEAPON_CLASS,ELEMENTS,ELEMENT_NAMES,ELEMENT_COLORS,type ClassId,type Element} from './classes';
import {World} from './world';
import {VFX,type Kind} from './vfx';

// Echoes of Dante — new 3D track, slice S1: character creator + first playable ARPG loop.
const q=new URLSearchParams(location.search);
const app=document.getElementById('app')!;
const renderer=new T.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
const MAX_PR=Math.min(devicePixelRatio,1.25);let pr=MAX_PR;renderer.setPixelRatio(pr);renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFShadowMap;
renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.45;
app.appendChild(renderer.domElement);
const camera=new T.PerspectiveCamera(40,1,.1,200);
const world=new World(renderer,camera);
const hero=new Character();world.scene.add(hero.root);
const torch=new T.PointLight('#ffb070',16,10,1.7);world.scene.add(torch);
const rim=new T.DirectionalLight('#6f8fd8',.8);world.scene.add(rim,rim.target);
const key=new T.DirectionalLight('#ffd9b0',2.4);world.scene.add(key,key.target);   // soft portrait key that follows the hero

// ---------- state ----------
type Mode='creator'|'play';
let mode:Mode='creator';let look:Look=loadLook();
const pos=hero.root.position;let heading=0,hp=100,hpMax=100,mana=100,kills=0,dead=false;
const keys=new Set<string>();let moveTarget:T.Vector3|null=null;let mouseDown=false;const mouse=new T.Vector2();const aimPoint=new T.Vector3(0,0,-5);
let atkUntil=0,atkImpact=0,atkPending:null|(()=>void)=null,rollUntil=0,rollDir=new T.Vector3(),stunUntil=0,comboIdx=0,invulnUntil=0,camBlend=0;
let focusEnemy:Enemy|null=null;void focusEnemy;
function loadLook():Look{try{const s=localStorage.getItem('dante3d.look');if(s){const l={...DEFAULT_LOOK,...JSON.parse(s)};if(!OUTFITS.some(o=>o[0]===l.outfit))l.outfit=DEFAULT_LOOK.outfit;return l;}}catch{/* private mode */}return{...DEFAULT_LOOK};}
function saveLook(){try{localStorage.setItem('dante3d.look',JSON.stringify(look));}catch{/* ignore */}}

// ---------- class kit ----------
const cls=():ClassId=>WEAPON_CLASS[look.weapon];
const kit=()=>CLASSES[cls()];
let element:Element='energy',skillReady=0,dashReady=0,chargeStart=0;

// ---------- enemies (placeholder husks, real monsters come in S4) ----------
class Enemy{
 g=new T.Group();hp=60;slowUntil=0;burnUntil=0;burnAcc=0;markUntil=0;state:'idle'|'chase'|'wind'|'dead'='idle';cd=0;wind=0;t=Math.random()*9;vel=new T.Vector3();deadT=0;flash=0;arms:T.Mesh[]=[];body:T.Mesh;
 constructor(x:number,z:number){
  const skin=new T.MeshStandardMaterial({color:'#30352f',roughness:.9,emissive:'#0a0000'}),bone=new T.MeshStandardMaterial({color:'#5a564b',roughness:.85});
  this.body=new T.Mesh(new T.CapsuleGeometry(.32,.75,4,10),skin);this.body.position.set(0,1.05,0);this.body.rotation.x=.35;this.body.castShadow=true;this.g.add(this.body);
  const head=new T.Mesh(new T.SphereGeometry(.24,12,10),bone);head.position.set(0,1.78,.28);head.scale.set(.9,1.1,1);head.castShadow=true;this.g.add(head);
  for(const s of[-1,1]){
   const eye=new T.Mesh(new T.SphereGeometry(.045,8,6),new T.MeshBasicMaterial({color:'#ff3a2a'}));eye.position.set(s*.09,1.82,.5);this.g.add(eye);
   const arm=new T.Mesh(new T.CylinderGeometry(.09,.06,.95,7),skin);arm.geometry.translate(0,-.47,0);arm.position.set(s*.42,1.5,.1);arm.rotation.x=-.5;arm.castShadow=true;this.g.add(arm);this.arms.push(arm);
   const leg=new T.Mesh(new T.CylinderGeometry(.09,.06,.8,6),skin);leg.position.set(s*.17,.4,0);leg.castShadow=true;this.g.add(leg);
  }
  this.g.position.set(x,0,z);world.scene.add(this.g);
 }
 get pos(){return this.g.position;}
 hit(d:number,from:T.Vector3,color='#ffd27a',quiet=false,push=5){
  if(this.state==='dead')return;
  this.hp-=d;this.flash=.15;if(!quiet){const dir=this.pos.clone().sub(from).setY(0).normalize();this.vel.addScaledVector(dir,push);}
  popText(this.pos.clone().setY(2.3),String(Math.round(d)),color);if(cls()==='xenobinder'&&!quiet)mana=Math.min(100,mana+6);
  if(this.state==='idle')this.state='chase';
  if(this.hp<=0){this.state='dead';kills++;hud();}
 }
}
const enemies:Enemy[]=[];let spawnT=0;
function spawnEnemy(){
  const a=Math.random()*6.28,d=16+Math.random()*14;
  const e=new Enemy(Math.cos(a)*d+pos.x*.3,Math.sin(a)*d+pos.z*.3);world.collide(e.pos,.4);enemies.push(e);
}
function updateEnemies(dt:number,now:number){
  spawnT-=dt;if(mode==='play'&&spawnT<=0&&enemies.filter(e=>e.state!=='dead').length<5){spawnEnemy();spawnT=5;}
  for(let i=enemies.length-1;i>=0;i--){
   const e=enemies[i];e.t+=dt;e.flash=Math.max(0,e.flash-dt);
   if(e.state!=='dead'){if(now<e.burnUntil)vfx.burning(e.pos);if(now<e.slowUntil)vfx.wet(e.pos);if(now<e.markUntil)vfx.marked(e.pos);}
   (e.body.material as T.MeshStandardMaterial).emissive.setRGB(e.flash*6,e.flash*2,e.flash);
   if(e.state==='dead'){e.deadT+=dt;e.g.rotation.x=Math.min(1.4,e.deadT*3);e.g.position.y=Math.max(-.7,-(e.deadT-1.2)*.5);if(e.deadT>3){world.scene.remove(e.g);enemies.splice(i,1);}continue;}
   if(now<e.burnUntil){e.burnAcc+=dt*7;if(e.burnAcc>=4){e.hit(e.burnAcc,e.pos,'#ff8a50',true);e.burnAcc=0;}if((e.state as string)==='dead')continue;}
   const to=pos.clone().sub(e.pos).setY(0),dist=to.length();
   if(e.state==='idle'&&dist<13&&mode==='play'&&!dead)e.state='chase';
   if(e.state==='chase'){
    if(dist>1.7){to.normalize();e.vel.addScaledVector(to,dt*14);}
    else if(now>e.cd&&!dead){e.state='wind';e.wind=.55;}
    e.g.rotation.y=Math.atan2(to.x,to.z);
    e.arms.forEach((a,k)=>a.rotation.x=-.5+Math.sin(e.t*7+k*3)*.35);
   }else if(e.state==='wind'){
    e.wind-=dt;e.arms.forEach(a=>a.rotation.x=-2.2+(.55-e.wind)*3);
    if(e.wind<=0){
     if(dist<2.3&&now>invulnUntil&&!dead)damage(9+Math.random()*3,e.pos);
     e.cd=now+1.3;e.state='chase';
    }
   }
   const vmax=now<e.slowUntil?1.2:2.9,sp=e.vel.length();if(sp>vmax)e.vel.multiplyScalar(vmax/sp);
   e.vel.multiplyScalar(Math.exp(-dt*5));
   e.pos.addScaledVector(e.vel,dt);world.collide(e.pos,.4);
   for(const o of enemies)if(o!==e&&o.state!=='dead'){const d=e.pos.clone().sub(o.pos).setY(0),l=d.length();if(l<.8&&l>1e-4)e.pos.addScaledVector(d.normalize(),(.8-l)*.5);}
   e.body.position.y=1.05+Math.sin(e.t*6)*.03;
  }
}

// ---------- projectiles & fx ----------
const vfx=new VFX(world.scene);
for(const f of world.flameSpots)vfx.campfire(f.p,f.s);
interface Proj{o:T.Object3D;kind:Kind;v:T.Vector3;life:number;dmg:number;elem?:Element;mark?:boolean}
const projs:Proj[]=[];
function dispose(o:T.Object3D){o.removeFromParent();o.traverse(c=>{const m=c as T.Mesh;m.geometry?.dispose();const mt=m.material as T.Material|T.Material[]|undefined;if(Array.isArray(mt))mt.forEach(x=>x.dispose());else mt?.dispose();});}
function fire(kind:Kind,from:T.Vector3,dir:T.Vector3,speed:number,dmg:number,o:{elem?:Element;mark?:boolean}={}){
  const g=vfx.projectile(kind);g.position.copy(from);g.lookAt(from.clone().add(dir));vfx.muzzle(kind,from,dir);
  projs.push({o:g,kind,v:dir.clone().multiplyScalar(speed),life:1.2,dmg,elem:o.elem,mark:o.mark});
}
function updateFx(dt:number){
  for(let i=projs.length-1;i>=0;i--){
   const p=projs[i];p.o.position.addScaledVector(p.v,dt);p.life-=dt;let hit:Enemy|null=null;
   p.o.position.y+=(1.15-p.o.position.y)*Math.min(1,dt*4);
   vfx.trail(p.kind,p.o,p.v,dt);
   for(const e of enemies)if(e.state!=='dead'&&Math.hypot(e.pos.x-p.o.position.x,e.pos.z-p.o.position.z)<.7){hit=e;break;}
   if(hit){applyHit(hit,p.dmg,p.o.position.clone().addScaledVector(p.v,-.05),p.elem);if(p.mark)hit.markUntil=now()+2.2;}
   if(hit||p.life<=0){if(hit||p.kind!=='pulse')vfx.impact(p.kind,p.o.position,p.v.clone().normalize());dispose(p.o);projs.splice(i,1);}
  }
  // twisting slash damage ticks
  if(twist){const n=now();if(n>=twist.next){twist.next=n+.16;for(const e of enemies)if(e.state!=='dead'&&e.pos.distanceTo(pos)<twist.r){e.hit(twist.dmg,pos,'#9ff4ff',false,4);vfx.hitSpark(e.pos.clone().setY(1.1),e.pos.clone().sub(pos).normalize());}}if(n>=twist.until){twist=null;}}
  vfx.update(dt);
}
let twist:{until:number;next:number;r:number;dmg:number}|null=null,spinUntil=0;
const texts:{el:HTMLElement;p:T.Vector3;t:number}[]=[];
function popText(p:T.Vector3,s:string,color:string){const el=document.createElement('div');el.className='dmg';el.textContent=s;el.style.color=color;ui.appendChild(el);texts.push({el,p,t:0});}
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
  hp=Math.max(0,hp-d);popText(pos.clone().setY(2.2),String(Math.round(d)),'#ff6a5a');stunUntil=now()+.28;atkUntil=0;atkPending=null;chargeStart=0;chargeFx(false);
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
function tryAttack(){
  const n=now();if(mode!=='play'||dead||n<atkUntil||n<rollUntil||n<stunUntil||chargeStart)return;
  const k=kit(),clip=k.attacks[comboIdx++%k.attacks.length];
  const dur=hero.duration(clip)/k.atkSpeed;
  faceTo(aimPoint);hero.play(clip,{once:true,speed:k.atkSpeed,fade:.08});
  atkUntil=n+dur*.85;atkImpact=n+dur*k.impact;moveTarget=null;
  atkPending=()=>{
   const pr=k.primary,dir=fwd();
   if(pr.kind==='shot'){
    const from=hero.muzzle();const d=shotDir(from);
    const kind:Kind=cls()==='astral'?element:cls()==='hunter'?'pulse':'filament';
    fire(kind,from,d,pr.speed!,pr.dmg,{elem:cls()==='astral'?element:undefined,mark:cls()==='xenobinder'});
    if(cls()==='hunter'){hero.recoil();mana=Math.min(100,mana+4);}
   }else{
    vfx.slash(pos,heading,comboIdx%2===0);
    for(const e of enemies)if(e.state!=='dead'){const d=e.pos.clone().sub(pos).setY(0),l=d.length();
     if(l<pr.range&&(l<.9||dir.angleTo(d.normalize())<pr.arc!/2)){e.hit(pr.dmg*(.9+Math.random()*.25),pos);vfx.hitSpark(e.pos.clone().setY(1.15),d);mana=Math.min(100,mana+8);}}
    // the wind blade keeps cutting in a line in front of the swing
    for(const e of enemies)if(e.state!=='dead'){const r=e.pos.clone().sub(pos).setY(0),along=r.dot(dir);if(along>=pr.range&&along<pr.range+2.2&&r.addScaledVector(dir,-along).length()<1.1)e.hit(pr.dmg*.6,pos,'#bff6ff');}
   }
  };
}
// Q: each class has its own skill
function skillDown(){
  const n=now(),k=kit();if(mode!=='play'||dead||n<atkUntil||n<rollUntil||n<stunUntil||n<skillReady)return;
  if(cls()==='warrior'){chargeStart=n;moveTarget=null;hero.play('Sword_Idle',{fade:.1});chargeFx(true);return;}
  if(mana<k.skill.cost){popText(pos.clone().setY(2.4),`Sem ${k.resource.toLowerCase()}`,'#9a917f');return;}
  mana-=k.skill.cost;skillReady=n+k.skill.cd;faceTo(aimPoint);moveTarget=null;
  if(cls()==='hunter'){
   // gather energy, then a huge spark beam (Lux-style)
   const dir0=shotDir(hero.muzzle()),charge=.55,L=24;atkUntil=n+charge+.8;moveTarget=null;hero.play('Pistol_Idle_Loop',{fade:.1});
   vfx.spark(()=>hero.muzzle(),()=>dir0,L,charge,()=>{
    hero.play('Pistol_Shoot',{once:true,speed:.8,fade:.05});hero.recoil();
    const hitBeam=(dmg:number)=>{const from=hero.muzzle();for(const e of enemies)if(e.state!=='dead'){const r=e.pos.clone().sub(from).setY(0),along=r.dot(dir0);if(along>0&&along<L&&r.addScaledVector(dir0,-along).length()<1.25){e.hit(dmg,from,'#bff6ff',false,6);vfx.hitSpark(e.pos.clone().setY(1.1),dir0,'#bff6ff');}}};
    hitBeam(40);later(.22,()=>hitBeam(25));later(.44,()=>hitBeam(25));
   });
  }else if(cls()==='astral'){
   const dur=hero.duration('Spell_Simple_Shoot')/1.4;hero.play('Spell_Simple_Shoot',{once:true,speed:1.4,fade:.08});atkUntil=n+dur*.85;atkImpact=n+dur*.45;
   const at=aimPoint.clone();const off=at.clone().sub(pos).setY(0);if(off.length()>9)at.copy(pos).addScaledVector(off.normalize(),9);
   const el=element;vfx.decal(at,ELEMENT_COLORS[el],2.6,.5);
   atkPending=()=>{vfx.field(el,at,2.7);for(const e of enemies)if(e.state!=='dead'&&Math.hypot(e.pos.x-at.x,e.pos.z-at.z)<2.9)applyHit(e,30,at,el);};
  }else{
   const dur=hero.duration('Spell_Simple_Shoot')/1.5;hero.play('Spell_Simple_Shoot',{once:true,speed:1.5,fade:.08});atkUntil=n+dur*.7;
   pet?.charge(aimPoint.clone());
  }
  hud();
}
// warrior: hold Q to charge, release for a Twisting Slash — the hero spins inside a whirl of blades
function skillUp(){
  if(!chargeStart||cls()!=='warrior')return;
  const n=now(),level=Math.min(1,Math.max(0,(n-chargeStart-.08)/.72));chargeStart=0;chargeFx(false);
  skillReady=n+kit().skill.cd;
  const dur=.75+level*.25,r=2.6+level*1.3;hero.play('Sword_Attack',{once:true,speed:1.2,fade:.05});atkUntil=n+dur;spinUntil=n+dur;
  vfx.twist(()=>pos,r,dur);vfx.shake=.15+level*.15;
  twist={until:n+dur,next:n+.05,r,dmg:Math.round((50+60*level)/4)};
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
  rollDir.copy(d.normalize());heading=Math.atan2(rollDir.x,rollDir.z);
  const sp=hero.duration('Roll')/k.dash.dur;hero.play('Roll',{once:true,speed:sp,fade:.06});
  rollUntil=n+k.dash.dur;invulnUntil=n+k.dash.dur*.8;dashReady=n+k.dash.cd;atkUntil=0;atkPending=null;moveTarget=null;chargeStart=0;chargeFx(false);
}
function inputDir(){
  const d=new T.Vector3();
  if(keys.has('KeyW')||keys.has('ArrowUp'))d.z-=1;if(keys.has('KeyS')||keys.has('ArrowDown'))d.z+=1;
  if(keys.has('KeyA')||keys.has('ArrowLeft'))d.x-=1;if(keys.has('KeyD')||keys.has('ArrowRight'))d.x+=1;
  return d;
}

// ---------- companion (Domador) ----------
class Pet{
 g=new T.Group();legs:T.Mesh[]=[];t=0;cd=0;target:Enemy|null=null;dash:{to:T.Vector3;t:number;hit:Set<Enemy>}|null=null;
 constructor(){
  const hide=new T.MeshStandardMaterial({color:'#3d4a36',roughness:.8}),glow=new T.MeshBasicMaterial({color:'#7dff9e'});
  const body=new T.Mesh(new T.CapsuleGeometry(.26,.7,4,10).rotateX(Math.PI/2),hide);body.position.y=.62;body.castShadow=true;this.g.add(body);
  const head=new T.Mesh(new T.SphereGeometry(.22,12,10),hide);head.scale.set(1,.85,1.25);head.position.set(0,.78,.55);head.castShadow=true;this.g.add(head);
  for(const s of[-1,1]){const e=new T.Mesh(new T.SphereGeometry(.035,6,5),glow);e.position.set(s*.1,.84,.78);this.g.add(e);
   const horn=new T.Mesh(new T.ConeGeometry(.04,.22,6),hide);horn.position.set(s*.12,.98,.45);horn.rotation.x=-.6;this.g.add(horn);}
  for(let i=0;i<3;i++){const sp=new T.Mesh(new T.SphereGeometry(.04,6,5),glow);sp.position.set(0,.9-i*.02,.15-i*.25);this.g.add(sp);}
  for(const [x,z] of [[-.17,.32],[.17,.32],[-.17,-.3],[.17,-.3]]){const l=new T.Mesh(new T.CylinderGeometry(.06,.045,.5,6),hide);l.geometry.translate(0,-.25,0);l.position.set(x,.5,z);l.castShadow=true;this.g.add(l);this.legs.push(l);}
  const tail=new T.Mesh(new T.ConeGeometry(.07,.6,6),hide);tail.rotation.x=-2;tail.position.set(0,.68,-.62);this.g.add(tail);
  world.scene.add(this.g);
 }
 charge(to:T.Vector3){this.dash={to:to.clone(),t:0,hit:new Set()};}
 update(dt:number,n:number){
  this.t+=dt;const p=this.g.position;let v=new T.Vector3(),moving=false;
  if(this.dash){
   const d=this.dash.to.clone().sub(p).setY(0);this.dash.t+=dt;
   if(d.length()<.4||this.dash.t>.9){vfx.decal(p.clone(),'#7dff9e',2.4,.7,1);vfx.emit({pos:pos.clone().setY(1),n:24,speed:[.5,2],up:.8,life:[.5,.9],size:[.16,.03],c0:'#e8ffe8',c1:'#2fae5a',a:[1,0],drag:1,spread:.4});const heal=Math.round(hpMax*.08);hp=Math.min(hpMax,hp+heal);popText(pos.clone().setY(2.4),'+'+heal,'#7dff9e');this.dash=null;}
   else{v=d.normalize().multiplyScalar(16);moving=true;vfx.petTrail(p);for(const e of enemies)if(e.state!=='dead'&&!this.dash.hit.has(e)&&e.pos.distanceTo(p)<1.1){this.dash.hit.add(e);e.hit(60,p,'#7dff9e',false,10);}}
  }else{
   if(!this.target||this.target.state==='dead'||this.target.pos.distanceTo(pos)>9){
    this.target=null;let bd=7;for(const e of enemies)if(e.state!=='dead'){const d=e.pos.distanceTo(pos)-(n<e.markUntil?4:0);if(d<bd){bd=d;this.target=e;}}
   }
   const goal=this.target?this.target.pos:pos.clone().add(new T.Vector3(Math.sin(heading+2.2)*1.6,0,Math.cos(heading+2.2)*1.6));
   const d=goal.clone().sub(p).setY(0),l=d.length();
   if(this.target&&l<1.2){if(n>this.cd){this.cd=n+.85;this.target.hit(n<this.target.markUntil?28:20,p,'#a6ffbf');}}
   else if(l>(this.target?1:.6)){v=d.normalize().multiplyScalar(Math.min(this.target?7:6.2,l*3));moving=true;}
   if(this.target)this.g.rotation.y=Math.atan2(d.x,d.z);
  }
  p.addScaledVector(v,dt);world.collide(p,.35);
  if(moving)this.g.rotation.y=Math.atan2(v.x,v.z);
  const sw=moving?Math.sin(this.t*14)*.6:0;this.legs.forEach((l,i)=>l.rotation.x=(i%2?1:-1)*(i<2?1:-1)*sw);
  this.g.position.y=moving?Math.abs(Math.sin(this.t*14))*.04:0;
 }
 remove(){world.scene.remove(this.g);}
}
let pet:Pet|null=null;
function syncPet(){if(cls()==='xenobinder'&&mode==='play'){if(!pet){pet=new Pet();pet.g.position.copy(pos).add(new T.Vector3(1.2,0,1));}}else if(pet){pet.remove();pet=null;}}

// ---------- update ----------
let moving=false,sprinting=false;
function updatePlayer(dt:number){
  const n=now();
  if(atkPending&&n>=atkImpact){const f=atkPending;atkPending=null;f();}
  if(dead)return;
  mana=Math.min(100,mana+dt*kit().regen);
  const locked=n<atkUntil||n<stunUntil;
  const v=new T.Vector3();
  if(n<rollUntil){v.copy(rollDir).multiplyScalar(kit().dash.speed);}
  else if(!locked){
   const d=inputDir();
   if(d.lengthSq()>0){moveTarget=null;d.normalize();}
   else if(moveTarget){const t=moveTarget.clone().sub(pos).setY(0);if(t.length()<.25)moveTarget=null;else d.copy(t.normalize());}
   sprinting=keys.has('ShiftLeft')||keys.has('ShiftRight');
   if(d.lengthSq()>0){v.copy(d).multiplyScalar(kit().speed*(chargeStart?.35:sprinting?1.45:1));heading=Math.atan2(d.x,d.z);}
  }
  moving=v.lengthSq()>.01;
  pos.addScaledVector(v,dt);world.collide(pos,.4);
  // turn smoothly
  const cur=hero.model?.rotation.y??0;let dh=heading-cur;dh=Math.atan2(Math.sin(dh),Math.cos(dh));
  if(hero.model){if(n<spinUntil)hero.model.rotation.y=cur-dt*19;else hero.model.rotation.y=cur+dh*Math.min(1,dt*14);}
  if(chargeStart){const lv=Math.min(1,(n-chargeStart)/.8);for(let i=0;i<2;i++){const a=Math.random()*6.28,rr=1.6-lv*.6;vfx.emit({pos:new T.Vector3(pos.x+Math.cos(a)*rr,.3+Math.random()*1.4,pos.z+Math.sin(a)*rr),n:1,dir:new T.Vector3(-Math.cos(a),0,-Math.sin(a)),cone:.1,speed:[2,3.5],life:[.3,.4],size:[.14,.03],c0:'#ffffff',c1:'#5fd8ff',a:[.2,1],drag:0});}}
  // pick animation
  if(chargeStart){faceTo(aimPoint);if(chargeRing){const lv=Math.min(1,(n-chargeStart)/.8);chargeRing.position.copy(pos).setY(.06);chargeRing.scale.setScalar(.6+lv*1.4);(chargeRing.material as T.MeshBasicMaterial).opacity=.4+lv*.5;}}
  if(n>=rollUntil&&n>=atkUntil&&n>=stunUntil&&!chargeStart){
   const w=kit();
   if(moving)hero.play(sprinting?'Sprint_Loop':(look.weapon==='saber'&&false?'Walk_Loop':'Jog_Fwd_Loop'),{fade:.2});
   else hero.play(hero.has(w.idle)?w.idle:'Idle_Loop',{fade:.25});
  }
  if(mouseDown&&mode==='play'&&!locked){updateAim();const e=enemyAt(aimPoint);if(e){focusEnemy=e;faceTo(e.pos);if(pos.distanceTo(e.pos)<=kit().primary.range*.8)tryAttack();else moveTarget=e.pos.clone();}else{moveTarget=aimPoint.clone();focusEnemy=null;}}
  hp=Math.min(hpMax,hp+dt*.4);
  pet?.update(dt,n);
}
function enemyAt(p:T.Vector3){let best:Enemy|null=null,bd=1.4;for(const e of enemies)if(e.state!=='dead'){const d=Math.hypot(e.pos.x-p.x,e.pos.z-p.z);if(d<bd){bd=d;best=e;}}return best;}
const ray=new T.Raycaster(),plane=new T.Plane(new T.Vector3(0,1,0),0);
function updateAim(){ray.setFromCamera(mouse,camera);ray.ray.intersectPlane(plane,aimPoint);}

// ---------- camera ----------
const camPos=new T.Vector3(),camLook=new T.Vector3(),cTmp=new T.Vector3();let zoom=1,previewYaw=-.55;let close:{bone:string;off:T.Vector3}|null=null;
function updateCamera(dt:number){
  const target=mode==='play'?1:0;camBlend+=(target-camBlend)*Math.min(1,dt*2.6);
  const k=camBlend*camBlend*(3-2*camBlend);
  // creator: close, side-lit portrait ; play: ARPG three-quarter overhead
  const cp=cTmp.set(pos.x-.4,pos.y+1.4,pos.z+4.2),cl=new T.Vector3(pos.x-.95,pos.y+1.0,pos.z);
  const pp=new T.Vector3(pos.x,pos.y+10.5*zoom,pos.z+8.6*zoom),pl=new T.Vector3(pos.x,pos.y+.9,pos.z);
  camPos.copy(cp).lerp(pp,k);camLook.copy(cl).lerp(pl,k);
  if(close&&hero.model){const b=hero.model.getObjectByName(close.bone);if(b){hero.model.updateMatrixWorld(true);const c=b.getWorldPosition(new T.Vector3());camLook.copy(c);camPos.copy(c).add(close.off.clone().applyAxisAngle(new T.Vector3(0,1,0),hero.model.rotation.y));}}
  if(vfx.shake>.01){const s=vfx.shake*.35;camPos.x+=(Math.random()-.5)*s;camPos.y+=(Math.random()-.5)*s;camPos.z+=(Math.random()-.5)*s;}
  camera.position.copy(camPos);camera.lookAt(camLook);
  vfx.setView(renderer.domElement.height,camera.fov);
  camera.fov=T.MathUtils.lerp(32,40,k);camera.updateProjectionMatrix();
}

// ---------- ui ----------
const ui=document.createElement('div');ui.id='ui';app.appendChild(ui);
ui.innerHTML=`
<div id="creator"><h1>Crie seu personagem</h1><p class="sub">Echoes of Dante · nova experiência 3D (primeira fatia jogável)</p>
 <div class="grp"><label>Corpo</label><div class="row" id="o-sex"></div></div>
 <div class="grp"><label>Pele</label><div class="row" id="o-skin"></div></div>
 <div class="grp"><label>Cabelo</label><div class="row wrap" id="o-hair"></div></div>
 <div class="grp"><label>Cor do cabelo</label><div class="row" id="o-hcol"></div></div>
 <div class="grp"><label>Sobrancelhas</label><div class="row" id="o-brow"></div></div>
 <div class="grp"><label>Vestimenta</label><div class="row wrap" id="o-outfit"></div></div>
 <div class="grp"><label>Cor da roupa</label><div class="row" id="o-cloth"></div></div>
 <div class="grp"><label>Classe</label><div class="row wrap" id="o-class"></div><div class="clsinfo" id="o-clsinfo"></div></div>
 <button id="go">Entrar no mundo</button><p class="hint">Arraste para girar o personagem</p></div>
<div id="hud"><div class="orb hp"><i id="hp"></i><b id="hpt"></b></div><div id="clsname"></div><div class="bar" id="skillbar"></div><div class="orb mp"><i id="mp"></i><b id="mpt"></b></div><div id="kills"></div></div><div id="perf"><span id="fps"></span><button id="qbtn">Qualidade: alta</button></div>
<div id="deadmsg"><h2>Você caiu</h2><button id="respawn">Levantar</button></div>
<div id="loading">Carregando…</div>`;
const $=(id:string)=>document.getElementById(id)!;
function chips(host:string,items:[string,string][],cur:()=>string,pick:(id:string)=>void){
  const h=$(host);h.innerHTML='';
  for(const [id,label] of items){const b=document.createElement('button');b.className='chip'+(cur()===id?' on':'');b.textContent=label;b.onclick=()=>{pick(id);refreshUi();};h.appendChild(b);}
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
  saveLook();
}
function refreshUi(){
  chips('o-sex',[['male','Masculino'],['female','Feminino']],()=>look.sex,id=>void change({sex:id as Sex}).then(refreshUi));
  swatches('o-skin',SKINS,()=>look.skin,i=>void change({skin:i}));
  chips('o-hair',HAIR[look.sex],()=>look.hair,id=>void change({hair:id}));
  swatches('o-hcol',HAIR_COLORS.map(c=>hexOf(c[1])),()=>look.hairColor,i=>void change({hairColor:i}));
  chips('o-brow',BROWS,()=>look.brows,id=>void change({brows:id}));
  chips('o-outfit',OUTFITS,()=>look.outfit,id=>void change({outfit:id}));
  swatches('o-cloth',CLOTH.map(c=>c[1]),()=>look.cloth,i=>void change({cloth:i}));
  chips('o-class',CLASS_ORDER.map(c=>[c,CLASSES[c].name] as [string,string]),()=>cls(),id=>void change({weapon:CLASSES[id as ClassId].weapon}));
  const k=kit();$('o-clsinfo').innerHTML=`<b>${k.role}</b><span>${k.fantasy}</span><i>${k.kit}</i>`;
}
function hud(){
  const k=kit();
  $('hp').style.height=(hp/hpMax*100)+'%';$('mp').style.height=mana+'%';$('hpt').textContent=String(Math.ceil(hp));$('mpt').textContent=String(Math.floor(mana));
  const col=cls()==='astral'?ELEMENT_COLORS[element]:k.resColor;$('mp').style.background=`radial-gradient(circle at 40% 30%,${col},#0b1420 75%)`;
  const n=now(),cdq=Math.max(0,skillReady-n),cdd=Math.max(0,dashReady-n);
  const sb=`<div class="sk"><kbd>Botão esq. / J</kbd>${k.primary.kind==='melee'?'golpe':'disparo'}</div><div class="sk${cdq?' cd':''}"><kbd>Q</kbd>${k.skill.name}${k.skill.cost?` · ${k.skill.cost}`:''}${cdq?` (${cdq.toFixed(1)})`:''}</div>${cls()==='astral'?`<div class="sk"><kbd>E</kbd><span style="color:${ELEMENT_COLORS[element]}">${ELEMENT_NAMES[element]}</span></div>`:''}<div class="sk${cdd?' cd':''}"><kbd>Espaço</kbd>${k.dash.name}</div><div class="sk"><kbd>Shift</kbd>correr</div>`;
  if($('skillbar').innerHTML!==sb)$('skillbar').innerHTML=sb;
  const cn=`${k.name} · <span style="color:${col}">${k.resource}</span>`;if($('clsname').innerHTML!==cn)$('clsname').innerHTML=cn;
  $('kills').textContent=kills?`Abates: ${kills}`:'';
}
function enter(){
  mode='play';document.body.classList.add('play');document.body.classList.remove('creator');
  pos.set(0,0,0);heading=Math.PI;hpMax=kit().hp;hp=hpMax;mana=cls()==='xenobinder'?35:100;dead=false;kills=0;element='energy';hero.setGlow(ELEMENT_COLORS.energy);syncPet();hud();spawnT=1.5;
}
$('go').onclick=enter;
$('qbtn').onclick=()=>setQuality(quality==='high'?'low':'high');
$('respawn').onclick=()=>{document.body.classList.remove('dead');dead=false;hp=hpMax;mana=100;pos.set(0,0,0);hero.play('Idle_Loop',{fade:.2});if(pet)pet.g.position.set(1.2,0,1);for(const e of enemies){world.scene.remove(e.g);}enemies.length=0;hud();};
document.body.classList.add('creator');

// ---------- input ----------
addEventListener('keydown',e=>{
  keys.add(e.code);
  if(mode!=='play')return;
  if(e.code==='Space'){e.preventDefault();roll();}
  else if(e.code==='KeyJ'){updateAim();tryAttack();}
  else if(e.code==='KeyQ'&&!e.repeat){updateAim();skillDown();}
  else if(e.code==='KeyE'&&!e.repeat)cycleElement();
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
  if(e.button===2){updateAim();faceTo(aimPoint);tryAttack();return;}
  mouseDown=true;updateAim();
});
addEventListener('pointerup',()=>{mouseDown=false;});
cv.addEventListener('contextmenu',e=>e.preventDefault());
cv.addEventListener('wheel',e=>{zoom=Math.min(1.5,Math.max(.6,zoom+e.deltaY*.0008));},{passive:true});

// ---------- loop ----------
function resize(){const w=innerWidth,h=innerHeight;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();world.resize(w,h,renderer.getPixelRatio());}
addEventListener('resize',resize);resize();
let last=performance.now()/1000,time=0,hudT=0,qaAim=false;
// adaptive quality: drop resolution, then post-processing and shadows, when frames run long
let quality:'high'|'low'=q.get('q')==='low'?'low':'high',slowT=0,fastT=0,fpsAcc=0,fpsN=0,fpsShown=0;
function setQuality(qv:'high'|'low'){quality=qv;renderer.shadowMap.enabled=qv==='high';world.scene.traverse(o=>{const m=(o as T.Mesh).material as T.Material|undefined;if(m)m.needsUpdate=true;});$('qbtn').textContent=qv==='high'?'Qualidade: alta':'Qualidade: leve';}
function adapt(dt:number){
  fpsAcc+=dt;fpsN++;if(fpsAcc>.5){fpsShown=Math.round(fpsN/fpsAcc);fpsAcc=0;fpsN=0;$('fps').textContent=fpsShown+' fps';}
  if(dt>1/40){slowT+=dt;fastT=0;}else{fastT+=dt;slowT=Math.max(0,slowT-dt*.5);}
  if(slowT>2){slowT=0;if(pr>.75){pr=Math.max(.75,pr-.25);renderer.setPixelRatio(pr);resize();}else if(quality==='high')setQuality('low');}
  else if(fastT>6&&pr<MAX_PR){fastT=0;pr=Math.min(MAX_PR,pr+.25);renderer.setPixelRatio(pr);resize();}
}
function tick(dt:number){
  time+=dt;
  for(let i=timers.length-1;i>=0;i--)if(timers[i].at<=time){const f=timers[i].fn;timers.splice(i,1);f();}
  if(mode==='creator'){heading=previewYaw;if(hero.model)hero.model.rotation.y+=(previewYaw-hero.model.rotation.y)*Math.min(1,dt*10);hero.play(hero.has(kit().idle)?kit().idle:'Idle_Loop',{fade:.25});}
  else updatePlayer(dt);
  if(mode==='play'&&!mouseDown&&!qaAim&&!('ontouchstart' in window))updateAim();
  hero.update(dt);updateEnemies(dt,time);updateFx(dt);updateTexts(dt);
  torch.position.set(pos.x,pos.y+3,pos.z+.8);torch.intensity=15+Math.sin(time*9)*1.6+Math.sin(time*23)*.9;
  rim.position.set(pos.x+4,5,pos.z-5);rim.target.position.copy(pos);key.position.set(pos.x+3,4.5,pos.z+5);key.target.position.set(pos.x,pos.y+1,pos.z);key.intensity=mode==='creator'?2.6:1.1;
  world.update(time,dt,pos);updateCamera(dt);
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
  if(q.get('sex'))await change({sex:q.get('sex') as Sex});
  if(q.get('cls')&&CLASSES[q.get('cls') as ClassId])await change({weapon:CLASSES[q.get('cls') as ClassId].weapon});
  const patch:Partial<Look>={};
  for(const k of['skin','hairColor','cloth'] as const)if(q.get(k))patch[k]=Number(q.get(k));
  for(const k of['hair','brows','outfit','weapon'] as const)if(q.get(k))(patch as Record<string,string>)[k]=q.get(k)!;
  if(Object.keys(patch).length)await change(patch);
  refreshUi();
  // compile every material up front (enemy, projectile, ring) so the first fight doesn't hitch
  const warm=new Enemy(0,-200);const W=new T.Vector3(0,1,-200),F=new T.Vector3(0,0,1);
  for(const k of ['pulse','fire','water','earth','energy','filament'] as Kind[]){fire(k,W,F,0,0);vfx.impact(k,W,F);}
  vfx.slash(W,0,false);vfx.field('energy',W,1);vfx.field('earth',W,1);vfx.decal(W,'#fff',1,.1);
  renderer.compile(world.scene,camera);world.scene.remove(warm.g);for(const p of projs)dispose(p.o);projs.length=0;
  renderer.compile(world.scene,camera);world.scene.remove(warm.g);
  if(quality==='low')setQuality('low');
  $('loading').remove();
  if(q.get('auto'))enter();
  requestAnimationFrame(frame);
})();
// QA hooks
(window as unknown as {__d3:unknown}).__d3={get state(){return{mode,hp,mana,kills,dead,anim:hero.currentName,pos:pos.toArray(),clips:[...hero.clips.keys()],enemies:enemies.length,look};},advance:(sec:number)=>{for(let i=0;i<sec*30;i++)tick(1/30);},vfx,enter,change,tryAttack,roll,skill:(hold=.6)=>{skillDown();later(hold,skillUp);},cycleElement,keys,aim:(x:number,z:number)=>{qaAim=true;aimPoint.set(x,0,z);},spawn:(x:number,z:number)=>enemies.push(new Enemy(x,z)),mount:(px:number,py:number,pz:number,rx:number,ry:number,rz:number)=>{if(hero.weapon){hero.weapon.position.set(px,py,pz);hero.weapon.rotation.set(rx,ry,rz);}},zoom:(z:number)=>{zoom=z;},close:(bone:string,x:number,y:number,z:number)=>{close=bone?{bone,off:new T.Vector3(x,y,z)}:null;},calib:(tx:number,ty:number,tz:number)=>{
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
