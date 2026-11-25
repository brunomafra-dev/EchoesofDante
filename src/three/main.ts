import * as T from 'three';
import './style.css';
import {Character,DEFAULT_LOOK,HAIR,HAIR_COLORS,BROWS,CLOTH,OUTFITS,SKINS,WEAPONS,type Look,type Sex,type WeaponId} from './character';
import {World} from './world';

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
const pos=hero.root.position;let heading=0,hp=100,mana=100,kills=0,dead=false;
const keys=new Set<string>();let moveTarget:T.Vector3|null=null;let mouseDown=false;const mouse=new T.Vector2();const aimPoint=new T.Vector3(0,0,-5);
let atkUntil=0,atkImpact=0,atkPending:null|(()=>void)=null,rollUntil=0,rollDir=new T.Vector3(),stunUntil=0,comboIdx=0,invulnUntil=0,camBlend=0;
let focusEnemy:Enemy|null=null;void focusEnemy;
function loadLook():Look{try{const s=localStorage.getItem('dante3d.look');if(s)return{...DEFAULT_LOOK,...JSON.parse(s)};}catch{/* private mode */}return{...DEFAULT_LOOK};}
function saveLook(){try{localStorage.setItem('dante3d.look',JSON.stringify(look));}catch{/* ignore */}}

// ---------- weapons ----------
interface WDef{idle:string;attacks:string[];speed:number;dmg:number;range:number;arc:number;proj?:{color:string;speed:number};impact:number;cd:number}
const WDEF:Record<WeaponId,WDef>={
 saber:{idle:'Sword_Idle',attacks:['Sword_Attack'],speed:1.5,dmg:24,range:2.7,arc:2.3,impact:.42,cd:.0},
 gauntlet:{idle:'Idle_Loop',attacks:['Punch_Jab','Punch_Cross'],speed:1.7,dmg:15,range:2.1,arc:2.0,impact:.4,cd:0},
 carbine:{idle:'Pistol_Idle_Loop',attacks:['Pistol_Shoot'],speed:1.6,dmg:14,range:14,arc:.3,proj:{color:'#6fe4ff',speed:34},impact:.25,cd:.0},
 conductor:{idle:'Spell_Simple_Idle_Loop',attacks:['Spell_Simple_Shoot'],speed:1.6,dmg:13,range:11,arc:.3,proj:{color:'#6dff9a',speed:26},impact:.35,cd:0},
};
const wd=()=>WDEF[look.weapon];

// ---------- enemies (placeholder husks, real monsters come in S4) ----------
class Enemy{
 g=new T.Group();hp=60;state:'idle'|'chase'|'wind'|'dead'='idle';cd=0;wind=0;t=Math.random()*9;vel=new T.Vector3();deadT=0;flash=0;arms:T.Mesh[]=[];body:T.Mesh;
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
 hit(d:number,from:T.Vector3){
  if(this.state==='dead')return;
  this.hp-=d;this.flash=.15;const dir=this.pos.clone().sub(from).setY(0).normalize();this.vel.addScaledVector(dir,5);
  popText(this.pos.clone().setY(2.3),String(Math.round(d)),'#ffd27a');
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
   (e.body.material as T.MeshStandardMaterial).emissive.setRGB(e.flash*6,e.flash*2,e.flash);
   if(e.state==='dead'){e.deadT+=dt;e.g.rotation.x=Math.min(1.4,e.deadT*3);e.g.position.y=Math.max(-.7,-(e.deadT-1.2)*.5);if(e.deadT>3){world.scene.remove(e.g);enemies.splice(i,1);}continue;}
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
   const sp=e.vel.length();if(sp>2.9)e.vel.multiplyScalar(2.9/sp);
   e.vel.multiplyScalar(Math.exp(-dt*5));
   e.pos.addScaledVector(e.vel,dt);world.collide(e.pos,.4);
   for(const o of enemies)if(o!==e&&o.state!=='dead'){const d=e.pos.clone().sub(o.pos).setY(0),l=d.length();if(l<.8&&l>1e-4)e.pos.addScaledVector(d.normalize(),(.8-l)*.5);}
   e.body.position.y=1.05+Math.sin(e.t*6)*.03;
  }
}

// ---------- projectiles & fx ----------
interface Proj{m:T.Mesh;v:T.Vector3;life:number;dmg:number}
const projs:Proj[]=[];
const GLOW=(()=>{const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d')!;const r=g.createRadialGradient(32,32,0,32,32,32);r.addColorStop(0,'rgba(255,255,255,1)');r.addColorStop(.3,'rgba(255,255,255,.35)');r.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=r;g.fillRect(0,0,64,64);const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;return t;})();
function fire(dir:T.Vector3,color:string,speed:number,dmg:number){
  const m=new T.Mesh(new T.SphereGeometry(.11,10,8),new T.MeshBasicMaterial({color}));
  const trail=new T.Mesh(new T.CylinderGeometry(.03,.09,.9,8),new T.MeshBasicMaterial({color,transparent:true,opacity:.6,blending:T.AdditiveBlending,depthWrite:false}));
  trail.rotation.x=Math.PI/2;trail.position.z=-.45;m.add(trail);
  const glow=new T.Sprite(new T.SpriteMaterial({map:GLOW,color,blending:T.AdditiveBlending,depthWrite:false,transparent:true}));glow.scale.set(1.1,1.1,1);m.add(glow);
  const p=pos.clone().add(new T.Vector3(0,1.4,0)).addScaledVector(dir,.8);m.position.copy(p);m.lookAt(p.clone().add(dir));world.scene.add(m);
  projs.push({m,v:dir.clone().multiplyScalar(speed),life:1.1,dmg});
}
const rings:{m:T.Mesh;t:number}[]=[];
function ring(p:T.Vector3,color:string,r:number){
  const m=new T.Mesh(new T.RingGeometry(.86,1,56).rotateX(-Math.PI/2),new T.MeshBasicMaterial({color,transparent:true,opacity:.85,blending:T.AdditiveBlending,depthWrite:false,side:T.DoubleSide}));
  m.position.copy(p).setY(.06);m.userData.r=r;world.scene.add(m);rings.push({m,t:0});
}
function updateFx(dt:number){
  for(let i=projs.length-1;i>=0;i--){
   const p=projs[i];p.m.position.addScaledVector(p.v,dt);p.life-=dt;let hit=false;
   for(const e of enemies)if(e.state!=='dead'&&Math.hypot(e.pos.x-p.m.position.x,e.pos.z-p.m.position.z)<.7&&p.m.position.y<2.4){e.hit(p.dmg,p.m.position.clone().addScaledVector(p.v,-.05));hit=true;break;}
   if(hit||p.life<=0){world.scene.remove(p.m);projs.splice(i,1);}
  }
  for(let i=rings.length-1;i>=0;i--){
   const r=rings[i];r.t+=dt;const k=r.t/.55;r.m.scale.setScalar(.4+k*r.m.userData.r*1.15);(r.m.material as T.MeshBasicMaterial).opacity=.9*(1-k*k);
   if(k>=1){world.scene.remove(r.m);rings.splice(i,1);}
  }
}
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
  hp=Math.max(0,hp-d);popText(pos.clone().setY(2.2),String(Math.round(d)),'#ff6a5a');stunUntil=now()+.28;atkUntil=0;atkPending=null;
  const dir=pos.clone().sub(from).setY(0).normalize();pos.addScaledVector(dir,.35);
  if(hp<=0){dead=true;hero.play('Death01',{once:true,fade:.1});document.body.classList.add('dead');}else hero.play('Hit_Chest',{once:true,fade:.06});
  hud();
}
const now=()=>performance.now()/1000;
function tryAttack(){
  const n=now();if(mode!=='play'||dead||n<atkUntil||n<rollUntil||n<stunUntil)return;
  const w=wd(),clip=w.attacks[comboIdx++%w.attacks.length];
  const dur=hero.duration(clip)/w.speed;
  faceTo(aimPoint);hero.play(clip,{once:true,speed:w.speed,fade:.08});
  atkUntil=n+dur*.88;atkImpact=n+dur*w.impact;moveTarget=null;
  atkPending=()=>{
   const dir=new T.Vector3(Math.sin(heading),0,Math.cos(heading));
   if(w.proj)fire(dir,w.proj.color,w.proj.speed,w.dmg);
   else{
    ring(pos.clone().addScaledVector(dir,1.0),look.weapon==='saber'?'#7fdcff':'#ffd9a0',1.6);
    for(const e of enemies)if(e.state!=='dead'){const d=e.pos.clone().sub(pos).setY(0),l=d.length();
     if(l<w.range&&(l<.9||dir.angleTo(d.normalize())<w.arc/2))e.hit(w.dmg*(.9+Math.random()*.25),pos);}
   }
  };
}
function skill(){
  const n=now();if(mode!=='play'||dead||n<atkUntil||n<rollUntil||mana<30)return;
  mana-=30;const clip='Spell_Simple_Shoot',dur=hero.duration(clip)/1.4;faceTo(aimPoint);hero.play(clip,{once:true,speed:1.4,fade:.08});
  atkUntil=n+dur*.85;atkImpact=n+dur*.45;moveTarget=null;
  atkPending=()=>{ring(pos,'#9a7bff',4.2);for(const e of enemies)if(e.state!=='dead'&&Math.hypot(e.pos.x-pos.x,e.pos.z-pos.z)<4.6)e.hit(34,pos);};
  hud();
}
function roll(){
  const n=now();if(mode!=='play'||dead||n<rollUntil)return;
  const d=inputDir();if(d.lengthSq()<.01)d.set(Math.sin(heading),0,Math.cos(heading));
  rollDir.copy(d.normalize());heading=Math.atan2(rollDir.x,rollDir.z);
  const dur=hero.duration('Roll')/1.35;hero.play('Roll',{once:true,speed:1.35,fade:.06});
  rollUntil=n+dur*.92;invulnUntil=n+dur*.7;atkUntil=0;atkPending=null;moveTarget=null;
}
function inputDir(){
  const d=new T.Vector3();
  if(keys.has('KeyW')||keys.has('ArrowUp'))d.z-=1;if(keys.has('KeyS')||keys.has('ArrowDown'))d.z+=1;
  if(keys.has('KeyA')||keys.has('ArrowLeft'))d.x-=1;if(keys.has('KeyD')||keys.has('ArrowRight'))d.x+=1;
  return d;
}

// ---------- update ----------
const SPEED=4.3;let moving=false,sprinting=false;
function updatePlayer(dt:number){
  const n=now();
  if(atkPending&&n>=atkImpact){const f=atkPending;atkPending=null;f();}
  if(dead)return;
  mana=Math.min(100,mana+dt*6);
  const locked=n<atkUntil||n<stunUntil;
  const v=new T.Vector3();
  if(n<rollUntil){v.copy(rollDir).multiplyScalar(7.2);}
  else if(!locked){
   const d=inputDir();
   if(d.lengthSq()>0){moveTarget=null;d.normalize();}
   else if(moveTarget){const t=moveTarget.clone().sub(pos).setY(0);if(t.length()<.25)moveTarget=null;else d.copy(t.normalize());}
   sprinting=keys.has('ShiftLeft')||keys.has('ShiftRight');
   if(d.lengthSq()>0){v.copy(d).multiplyScalar(SPEED*(sprinting?1.45:1));heading=Math.atan2(d.x,d.z);}
  }
  moving=v.lengthSq()>.01;
  pos.addScaledVector(v,dt);world.collide(pos,.4);
  // turn smoothly
  const cur=hero.model?.rotation.y??0;let dh=heading-cur;dh=Math.atan2(Math.sin(dh),Math.cos(dh));
  if(hero.model)hero.model.rotation.y=cur+dh*Math.min(1,dt*14);
  // pick animation
  if(n>=rollUntil&&n>=atkUntil&&n>=stunUntil){
   const w=wd();
   if(moving)hero.play(sprinting?'Sprint_Loop':(look.weapon==='saber'&&false?'Walk_Loop':'Jog_Fwd_Loop'),{fade:.2});
   else hero.play(hero.has(w.idle)?w.idle:'Idle_Loop',{fade:.25});
  }
  if(mouseDown&&mode==='play'&&!locked){updateAim();const e=enemyAt(aimPoint);if(e){focusEnemy=e;faceTo(e.pos);if(pos.distanceTo(e.pos)<=wd().range*.8)tryAttack();else moveTarget=e.pos.clone();}else{moveTarget=aimPoint.clone();focusEnemy=null;}}
  hp=Math.min(100,hp+dt*.4);
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
  camera.position.copy(camPos);camera.lookAt(camLook);
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
 <div class="grp"><label>Arma</label><div class="row wrap" id="o-weapon"></div></div>
 <button id="go">Entrar no mundo</button><p class="hint">Arraste para girar o personagem</p></div>
<div id="hud"><div class="orb hp"><i id="hp"></i><b id="hpt"></b></div><div class="bar"><div class="sk"><kbd>Botão esq.</kbd>mover / atacar</div><div class="sk"><kbd>J</kbd>ataque</div><div class="sk"><kbd>Q</kbd>onda (30 mana)</div><div class="sk"><kbd>Espaço</kbd>rolar</div><div class="sk"><kbd>Shift</kbd>correr</div></div><div class="orb mp"><i id="mp"></i><b id="mpt"></b></div><div id="kills"></div></div><div id="perf"><span id="fps"></span><button id="qbtn">Qualidade: alta</button></div>
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
  chips('o-weapon',WEAPONS.map(w=>[w[0],w[1]] as [string,string]),()=>look.weapon,id=>void change({weapon:id as WeaponId}));
}
function hud(){
  $('hp').style.height=hp+'%';$('mp').style.height=mana+'%';$('hpt').textContent=String(Math.ceil(hp));$('mpt').textContent=String(Math.floor(mana));
  $('kills').textContent=kills?`Abates: ${kills}`:'';
}
function enter(){
  mode='play';document.body.classList.add('play');document.body.classList.remove('creator');
  pos.set(0,0,0);heading=Math.PI;hp=100;mana=100;dead=false;kills=0;hud();spawnT=1.5;
}
$('go').onclick=enter;
$('qbtn').onclick=()=>setQuality(quality==='high'?'low':'high');
$('respawn').onclick=()=>{document.body.classList.remove('dead');dead=false;hp=100;mana=100;pos.set(0,0,0);hero.play('Idle_Loop',{fade:.2});for(const e of enemies){world.scene.remove(e.g);}enemies.length=0;hud();};
document.body.classList.add('creator');

// ---------- input ----------
addEventListener('keydown',e=>{
  keys.add(e.code);
  if(mode!=='play')return;
  if(e.code==='Space'){e.preventDefault();roll();}
  else if(e.code==='KeyJ'){updateAim();tryAttack();}
  else if(e.code==='KeyQ'){updateAim();skill();}
});
addEventListener('keyup',e=>keys.delete(e.code));
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
let last=performance.now()/1000,time=0,hudT=0;
// adaptive quality: drop resolution, then post-processing and shadows, when frames run long
let quality:'high'|'low'=q.get('q')==='low'?'low':'high',slowT=0,fastT=0,fpsAcc=0,fpsN=0,fpsShown=0;
function setQuality(qv:'high'|'low'){quality=qv;renderer.shadowMap.enabled=qv==='high';world.scene.traverse(o=>{const m=(o as T.Mesh).material as T.Material|undefined;if(m)m.needsUpdate=true;});$('qbtn').textContent=qv==='high'?'Qualidade: alta':'Qualidade: leve';}
function adapt(dt:number){
  fpsAcc+=dt;fpsN++;if(fpsAcc>.5){fpsShown=Math.round(fpsN/fpsAcc);fpsAcc=0;fpsN=0;$('fps').textContent=fpsShown+' fps';}
  if(dt>1/40){slowT+=dt;fastT=0;}else{fastT+=dt;slowT=Math.max(0,slowT-dt*.5);}
  if(slowT>2){slowT=0;if(pr>.75){pr=Math.max(.75,pr-.25);renderer.setPixelRatio(pr);resize();}else if(quality==='high')setQuality('low');}
  else if(fastT>6&&pr<MAX_PR){fastT=0;pr=Math.min(MAX_PR,pr+.25);renderer.setPixelRatio(pr);resize();}
}
function frame(){
  const t=performance.now()/1000,dt=Math.min(.05,t-last);last=t;time+=dt;
  if(mode==='creator'){heading=previewYaw;if(hero.model)hero.model.rotation.y+=(previewYaw-hero.model.rotation.y)*Math.min(1,dt*10);hero.play(hero.has(wd().idle)?wd().idle:'Idle_Loop',{fade:.25});}
  else updatePlayer(dt);
  if(mode==='play'&&!mouseDown&&!('ontouchstart' in window))updateAim();
  hero.update(dt);updateEnemies(dt,t);updateFx(dt);updateTexts(dt);
  torch.position.set(pos.x,pos.y+3,pos.z+.8);torch.intensity=15+Math.sin(time*9)*1.6+Math.sin(time*23)*.9;
  rim.position.set(pos.x+4,5,pos.z-5);rim.target.position.copy(pos);key.position.set(pos.x+3,4.5,pos.z+5);key.target.position.set(pos.x,pos.y+1,pos.z);key.intensity=mode==='creator'?2.6:1.1;
  world.update(time,dt,pos);updateCamera(dt);
  if(quality==='high')world.render(camera,time);else renderer.render(world.scene,camera);
  if(mode==='play'&&(hudT+=dt)>.1){hudT=0;hud();}
  adapt(dt);
  requestAnimationFrame(frame);
}
(async()=>{
  await hero.setSex(look.sex);hero.apply(look);await hero.setWeapon(look.weapon);
  if(q.get('sex'))await change({sex:q.get('sex') as Sex});
  const patch:Partial<Look>={};
  for(const k of['skin','hairColor','cloth'] as const)if(q.get(k))patch[k]=Number(q.get(k));
  for(const k of['hair','brows','outfit','weapon'] as const)if(q.get(k))(patch as Record<string,string>)[k]=q.get(k)!;
  if(Object.keys(patch).length)await change(patch);
  refreshUi();
  // compile every material up front (enemy, projectile, ring) so the first fight doesn't hitch
  const warm=new Enemy(0,-200);fire(new T.Vector3(0,0,1),'#6fe4ff',0,0);ring(new T.Vector3(0,0,-200),'#fff',1);
  renderer.compile(world.scene,camera);world.scene.remove(warm.g);
  for(const p of projs)world.scene.remove(p.m);projs.length=0;for(const r of rings)world.scene.remove(r.m);rings.length=0;
  if(quality==='low')setQuality('low');
  $('loading').remove();
  if(q.get('auto'))enter();
  requestAnimationFrame(frame);
})();
// QA hooks
(window as unknown as {__d3:unknown}).__d3={get state(){return{mode,hp,mana,kills,dead,anim:hero.currentName,pos:pos.toArray(),clips:[...hero.clips.keys()],enemies:enemies.length,look};},enter,change,tryAttack,roll,skill,keys,aim:(x:number,z:number)=>{aimPoint.set(x,0,z);},spawn:(x:number,z:number)=>enemies.push(new Enemy(x,z)),mount:(px:number,py:number,pz:number,rx:number,ry:number,rz:number)=>{if(hero.weapon){hero.weapon.position.set(px,py,pz);hero.weapon.rotation.set(rx,ry,rz);}},zoom:(z:number)=>{zoom=z;},close:(bone:string,x:number,y:number,z:number)=>{close=bone?{bone,off:new T.Vector3(x,y,z)}:null;},calib:(tx:number,ty:number,tz:number)=>{
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
