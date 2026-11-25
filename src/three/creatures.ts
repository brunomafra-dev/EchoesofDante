import * as T from 'three';
import type {VFX} from './vfx';

// Native fauna of Dante for the new 3D, taken from the 2D bestiary (src/config/bestiary.ts).
// Bodies are built procedurally (chitin, plates, glowing organs) and legs walk with a procedural
// gait; every attack is announced on the ground in amber, as in the 2D game.
export type SpeciesId='crawler'|'skitter'|'spitter'|'carapace';
interface Spec{name:string;hp:number;speed:number;radius:number;attack:'bite'|'dash'|'spit'|'sweep';dmg:number;range:number;windup:number;recover:number;keep?:number}
export const SPECIES:Record<SpeciesId,Spec>={
 crawler:{name:'Rastejante Hollow',hp:70,speed:3.1,radius:.6,attack:'bite',dmg:10,range:1.7,windup:.5,recover:.6},
 skitter:{name:'Saltador',hp:45,speed:3.6,radius:.45,attack:'dash',dmg:14,range:7,windup:.7,recover:.9},
 spitter:{name:'Cuspidor',hp:55,speed:2.3,radius:.6,attack:'spit',dmg:12,range:11,windup:.8,recover:.7,keep:7},
 carapace:{name:'Casco Errante',hp:230,speed:1.7,radius:1.1,attack:'sweep',dmg:22,range:3,windup:1.05,recover:1.4},
};
export interface Ctx{
 scene:T.Scene;vfx:VFX;player:T.Vector3;playerOk:()=>boolean;invuln:()=>boolean;
 damagePlayer:(d:number,from:T.Vector3)=>void;collide:(p:T.Vector3,r:number)=>void;colliders:{x:number;z:number;r:number}[];
 popText:(p:T.Vector3,s:string,c:string)=>void;onKill:(c:Creature)=>void;onHit:(c:Creature,quiet:boolean)=>void;others:Creature[];
}
const rnd=(a:number,b:number)=>a+Math.random()*(b-a);
const UP=new T.Vector3(0,1,0),tmp=new T.Vector3(),tmp2=new T.Vector3();
const segGeo=new T.CylinderGeometry(1,1,1,7);segGeo.translate(0,.5,0);
function orient(m:T.Mesh,a:T.Vector3,b:T.Vector3,r:number){const d=tmp.copy(b).sub(a),l=d.length();m.position.copy(a);m.quaternion.setFromUnitVectors(UP,d.normalize());m.scale.set(r,l,r);}

interface Leg{hip:T.Vector3;out:T.Vector3;len:number;phase:number;up:T.Mesh;low:T.Mesh;r:number;knee:number}
interface Look{chitin:T.MeshStandardMaterial;glow:T.MeshStandardMaterial;body:T.Group;legs:Leg[];sac?:T.Mesh;mandibles?:T.Mesh[];height:number}

function chitin(color:string,emissive='#000000'){return new T.MeshStandardMaterial({color,roughness:.42,metalness:.25,emissive,emissiveIntensity:1});}
function glowMat(color:string,i=1.6){return new T.MeshStandardMaterial({color,emissive:color,emissiveIntensity:i,roughness:.3});}
function ball(r:number,m:T.Material,p:[number,number,number],s:[number,number,number]=[1,1,1]){const b=new T.Mesh(new T.SphereGeometry(r,18,12),m);b.position.set(...p);b.scale.set(...s);b.castShadow=true;return b;}
function addLegs(g:T.Group,m:T.Material,defs:[number,number,number,number,number][],r:number,knee:number):Leg[]{
 // def: hip x,y,z, outward angle (rad from +x), length
 return defs.map(([x,y,z,ang,len],i)=>{const up=new T.Mesh(segGeo,m),low=new T.Mesh(segGeo,m);up.castShadow=low.castShadow=true;g.parent!.add(up,low);
  return {hip:new T.Vector3(x,y,z),out:new T.Vector3(Math.cos(ang),0,Math.sin(ang)),len,phase:(i%2)*Math.PI+(i>2?Math.PI:0),up,low,r,knee};});
}

function buildCrawler(root:T.Group):Look{
 const ch=chitin('#262c33'),gl=glowMat('#3dfcff'),body=new T.Group();root.add(body);
 body.add(ball(.42,ch,[0,.55,.1],[1,.62,1.15]));
 for(let i=0;i<3;i++)body.add(ball(.36-i*.07,ch,[0,.58-i*.03,-.45-i*.32],[1,.7,1]));
 body.add(ball(.24,ch,[0,.55,.62],[1,.8,1.1]));
 const mand:T.Mesh[]=[];for(const s of[-1,1]){const c=new T.Mesh(new T.ConeGeometry(.05,.38,6),ch);c.position.set(s*.12,.48,.85);c.rotation.set(Math.PI/2,0,s*.5);c.castShadow=true;body.add(c);mand.push(c);
  body.add(ball(.045,gl,[s*.11,.66,.8]));}
 for(let i=0;i<5;i++){const p=new T.Mesh(new T.BoxGeometry(.5-i*.06,.06,.22),ch);p.position.set(0,.86-i*.03,.2-i*.3);p.rotation.x=-.15;p.castShadow=true;body.add(p);
  body.add(ball(.035,gl,[.14,.88-i*.03,.2-i*.3]),ball(.035,gl,[-.14,.88-i*.03,.2-i*.3]));}
 const legs=addLegs(body,ch,[[.3,.5,.4,.45,.8],[.34,.5,.05,0,.88],[.3,.5,-.3,-.45,.8],[-.3,.5,.4,Math.PI-.45,.8],[-.34,.5,.05,Math.PI,.88],[-.3,.5,-.3,Math.PI+.45,.8]],.06,.26);
 return {chitin:ch,glow:gl,body,legs,mandibles:mand,height:1};
}
function buildSkitter(root:T.Group):Look{
 const ch=chitin('#4a382a'),gl=glowMat('#ff8a3d',2),body=new T.Group();root.add(body);
 body.add(ball(.28,ch,[0,.62,0],[1,.75,1.35]));body.add(ball(.18,ch,[0,.66,.42],[1,.85,1.1]));
 for(const s of[-1,1])body.add(ball(.04,gl,[s*.08,.72,.56]));
 const tail=new T.Mesh(new T.ConeGeometry(.08,.7,6),ch);tail.position.set(0,.72,-.55);tail.rotation.x=-1.9;tail.castShadow=true;body.add(tail);
 for(let i=0;i<3;i++){const sp=new T.Mesh(new T.ConeGeometry(.04,.18,5),ch);sp.position.set(0,.85,.15-i*.18);sp.rotation.x=-.4;body.add(sp);}
 const legs=addLegs(body,ch,[[.18,.58,.25,.6,.62],[-.18,.58,.25,Math.PI-.6,.62],[.2,.6,-.18,-.5,1.0],[-.2,.6,-.18,Math.PI+.5,1.0]],.05,.42);
 return {chitin:ch,glow:gl,body,legs,height:.9};
}
function buildSpitter(root:T.Group):Look{
 const ch=chitin('#33402a'),gl=glowMat('#9dff4a',1.3),body=new T.Group();root.add(body);
 body.add(ball(.5,ch,[0,.75,0],[1,.8,1.1]));
 const sacM=new T.MeshStandardMaterial({color:'#7dff3a',emissive:'#5dff2a',emissiveIntensity:.8,roughness:.2,transparent:true,opacity:.85});
 const sac=ball(.34,sacM,[0,1.2,-.1]);body.add(sac);
 for(let i=0;i<4;i++){const rib=new T.Mesh(new T.TorusGeometry(.34,.025,6,20,Math.PI),ch);rib.position.set(0,1.2,-.3+i*.14);rib.rotation.y=Math.PI/2;body.add(rib);}
 const mouth=new T.Mesh(new T.CylinderGeometry(.09,.16,.4,10),ch);mouth.position.set(0,.85,.55);mouth.rotation.x=Math.PI/2.3;mouth.castShadow=true;body.add(mouth);
 body.add(ball(.07,gl,[0,.92,.74]));
 const legs=addLegs(body,ch,[[.34,.6,.3,.5,.85],[-.34,.6,.3,Math.PI-.5,.85],[.34,.6,-.3,-.5,.85],[-.34,.6,-.3,Math.PI+.5,.85]],.06,.4);
 return {chitin:ch,glow:gl,body,legs,sac,height:1.4};
}
function buildCarapace(root:T.Group):Look{
 const ch=chitin('#45434c'),gl=glowMat('#ff7a2a',1.4),body=new T.Group();root.add(body);
 const shell=new T.Mesh(new T.SphereGeometry(1,24,14,0,Math.PI*2,0,Math.PI/2),ch);shell.scale.set(1.05,.75,1.3);shell.position.y=.55;shell.castShadow=true;body.add(shell);
 const under=ball(.9,new T.MeshStandardMaterial({color:'#1a1414',roughness:.8}),[0,.55,0],[1.05,.25,1.25]);body.add(under);
 for(let i=0;i<5;i++){const r=new T.Mesh(new T.TorusGeometry(.95-i*.04,.035,6,28,Math.PI),ch);r.position.set(0,.55,-.8+i*.38);r.scale.set(1.05,.78,1);body.add(r);}
 for(let i=0;i<7;i++){const sp=new T.Mesh(new T.ConeGeometry(.08,.35,6),ch);const a=-.9+i*.3;sp.position.set(Math.sin(a)*.5,1.2-Math.abs(a)*.25,Math.cos(a)*.2-.2);sp.rotation.set(-.3,0,-a*.6);sp.castShadow=true;body.add(sp);}
 for(let i=0;i<6;i++){const a=(i/6)*Math.PI*2;body.add(ball(.06,gl,[Math.cos(a)*.95,.5,Math.sin(a)*1.15]));}
 const head=ball(.32,ch,[0,.55,1.25],[1.2,.7,.9]);body.add(head);
 for(const s of[-1,1]){const p=new T.Mesh(new T.ConeGeometry(.1,.6,7),ch);p.position.set(s*.32,.45,1.55);p.rotation.set(Math.PI/2.2,0,s*.6);p.castShadow=true;body.add(p);body.add(ball(.05,gl,[s*.14,.68,1.48]));}
 const legs=addLegs(body,ch,[[.8,.42,.6,.4,1.05],[.9,.42,0,0,1.1],[.8,.42,-.6,-.4,1.05],[-.8,.42,.6,Math.PI-.4,1.05],[-.9,.42,0,Math.PI,1.1],[-.8,.42,-.6,Math.PI+.4,1.05]],.11,.38);
 return {chitin:ch,glow:gl,body,legs,height:1.5};
}

// ---------- telegraphs (amber, fixed once announced) ----------
const TELE_F=`uniform float uK;uniform vec3 uColor;varying vec2 vUv;void main(){float pulse=.6+.4*sin(uK*40.);gl_FragColor=vec4(uColor*(.12+uK*.42)*pulse,1.);}`;
function teleMat(){return new T.ShaderMaterial({vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:TELE_F,uniforms:{uK:{value:0},uColor:{value:new T.Color('#ff8a1a')}},transparent:true,depthWrite:false,blending:T.AdditiveBlending});}

interface Spit{m:T.Mesh;v:T.Vector3;life:number;dmg:number}
const spits:Spit[]=[];

export class Creature{
 g=new T.Group();spec:Spec;look:Look;hp:number;state:'idle'|'chase'|'wind'|'act'|'recover'|'dead'='idle';
 t=Math.random()*9;timer=0;vel=new T.Vector3();deadT=0;flash=0;gone=false;
 slowUntil=0;burnUntil=0;burnAcc=0;markUntil=0;heading=Math.random()*6.28;
 private tele:T.Mesh|null=null;private dir=new T.Vector3();private hitDone=false;private gait=0;
 constructor(public kind:SpeciesId,x:number,z:number,private scene:T.Scene){
  this.spec=SPECIES[kind];this.hp=this.spec.hp;this.g.position.set(x,0,z);scene.add(this.g);
  const root=new T.Group();this.g.add(root);
  this.look=kind==='crawler'?buildCrawler(root):kind==='skitter'?buildSkitter(root):kind==='spitter'?buildSpitter(root):buildCarapace(root);
  // legs are parented to the root group, re-oriented every frame
 }
 get pos(){return this.g.position;}
 get radius(){return this.spec.radius;}
 static ctx:Ctx;
 hit(d:number,from:T.Vector3,color='#ffd27a',quiet=false,push=5){
  const ctx=Creature.ctx;if(this.state==='dead')return;
  const k=this.kind==='carapace'?.75:1;this.hp-=d*k;this.flash=.15;
  if(!quiet){const dir=this.pos.clone().sub(from).setY(0).normalize();this.vel.addScaledVector(dir,push*(this.kind==='carapace'?.3:1));}
  ctx.popText(this.pos.clone().setY(this.look.height+.9),String(Math.round(d*k)),color);ctx.onHit(this,quiet);
  if(this.state==='idle')this.state='chase';
  if(this.hp<=0)this.die(ctx);
 }
 private die(ctx:Ctx){this.state='dead';this.clearTele();ctx.onKill(this);
  ctx.vfx.emit({pos:this.pos.clone().setY(.6),n:24,speed:[1,4],up:.6,life:[.4,.8],size:[.14,.03],c0:'#ffffff',c1:'#'+this.look.glow.color.getHexString(),a:[1,0],grav:6,drag:1.5,spread:.3});}
 private clearTele(){if(this.tele){this.tele.removeFromParent();this.tele.geometry.dispose();(this.tele.material as T.Material).dispose();this.tele=null;}}
 private announce(){
  const s=this.spec;let geo:T.BufferGeometry;
  if(s.attack==='dash'){geo=new T.PlaneGeometry(1.1,s.range).rotateX(-Math.PI/2).translate(0,.05,s.range/2);}
  else if(s.attack==='sweep'){geo=new T.CircleGeometry(s.range,40,Math.PI/2-1.1,2.2).rotateX(-Math.PI/2).translate(0,.05,0);}
  else if(s.attack==='spit'){geo=new T.PlaneGeometry(.35,s.range).rotateX(-Math.PI/2).translate(0,.05,s.range/2);}
  else{geo=new T.CircleGeometry(s.range*.8,28,Math.PI/2-.8,1.6).rotateX(-Math.PI/2).translate(0,.05,0);}
  // circle sectors are built around +y; after the -90° x rotation they open towards -z, so flip to face +z (forward)
  if(s.attack==='sweep'||s.attack==='bite')geo.rotateY(Math.PI);
  this.tele=new T.Mesh(geo,teleMat());this.tele.renderOrder=3;this.tele.position.copy(this.pos);this.tele.rotation.y=this.heading;this.scene.add(this.tele);
 }
 update(dt:number,now:number,ctx:Ctx){
  this.t+=dt;this.flash=Math.max(0,this.flash-dt);
  const L=this.look;L.chitin.emissive.setRGB(this.flash*4,this.flash*2.4,this.flash*1.6);
  if(this.state==='dead'){this.deadT+=dt;L.body.rotation.z=Math.min(2.6,this.deadT*5)*(this.kind==='carapace'?.35:1);this.g.position.y=Math.max(-1,-(this.deadT-1.5)*.5);this.pose(dt,true);if(this.deadT>3.5){this.g.removeFromParent();this.gone=true;}return;}
  if(now<this.burnUntil){this.burnAcc+=dt*7;ctx.vfx.burning(this.pos);if(this.burnAcc>=4){this.hit(this.burnAcc,this.pos,'#ff8a50',true,0);this.burnAcc=0;if((this.state as string)==='dead')return;}}
  if(now<this.slowUntil)ctx.vfx.wet(this.pos);if(now<this.markUntil)ctx.vfx.marked(this.pos);
  const s=this.spec,to=tmp2.copy(ctx.player).sub(this.pos).setY(0),dist=to.length();
  const slow=now<this.slowUntil?.45:1;let want=0;
  if(this.state==='idle'){if(dist<14&&ctx.playerOk())this.state='chase';else{this.heading+=Math.sin(this.t*.7)*dt*.6;want=.25;}}
  if(this.state==='chase'){
   const face=Math.atan2(to.x,to.z);this.turn(face,dt,4);
   const inRange=s.attack==='bite'?dist<s.range:s.attack==='sweep'?dist<s.range*.9:dist<s.range&&dist>(s.keep??0)*.6;
   if(inRange&&ctx.playerOk()){this.state='wind';this.timer=s.windup;this.heading=face;this.dir.set(Math.sin(face),0,Math.cos(face));this.announce();}
   else if(s.keep&&dist<s.keep){want=-.8;}else want=1;
  }else if(this.state==='wind'){
   this.timer-=dt*slow;const k=1-this.timer/s.windup;
   if(this.tele)((this.tele.material as T.ShaderMaterial).uniforms.uK.value=k);
   if(s.attack==='bite'){L.glow.emissiveIntensity=1.6+k*5;L.mandibles?.forEach((m,i)=>m.rotation.z=(i?1:-1)*(.5+k*.6));this.turn(Math.atan2(to.x,to.z),dt,3);this.heading=Math.atan2(to.x,to.z);this.dir.set(Math.sin(this.heading),0,Math.cos(this.heading));if(this.tele)this.tele.rotation.y=this.heading;}
   if(s.attack==='spit'&&L.sac){const sc=1+k*.55;L.sac.scale.set(sc,sc,sc);}
   if(s.attack==='dash'){L.body.position.y=-k*.15;}
   if(s.attack==='sweep'){L.body.rotation.y=-k*.5;}
   if(this.tele)this.tele.position.copy(this.pos);
   if(this.timer<=0){this.state='act';this.hitDone=false;this.clearTele();
    this.timer=s.attack==='dash'?.36:s.attack==='sweep'?.35:.15;
    if(s.attack==='spit'){this.spit(ctx);if(L.sac)L.sac.scale.set(1,1,1);}
    L.glow.emissiveIntensity=1.6;}
  }else if(this.state==='act'){
   this.timer-=dt;
   if(s.attack==='dash'){this.vel.copy(this.dir).multiplyScalar(14);L.body.position.y=.1;
    ctx.vfx.emit({pos:this.pos.clone().setY(.2),n:1,dir:this.dir.clone().negate(),cone:.6,speed:[.5,1.5],life:[.3,.5],size:[.3,.6],c0:'#6a5a48',c1:'#3a3028',a:[.4,0],drag:2});}
   if(!this.hitDone){
    if(s.attack==='bite'&&dist<s.range+.3){this.hitDone=true;if(!ctx.invuln())ctx.damagePlayer(s.dmg+rnd(0,3),this.pos);}
    if(s.attack==='dash'&&dist<this.radius+.6){this.hitDone=true;if(!ctx.invuln())ctx.damagePlayer(s.dmg,this.pos);}
    if(s.attack==='sweep'&&this.timer<.2){this.hitDone=true;L.body.rotation.y=.6;ctx.vfx.decal(this.pos.clone().addScaledVector(this.dir,1.2),'#ffae3a',s.range,.4);ctx.vfx.shake=Math.max(ctx.vfx.shake,.2);
     const ang=this.dir.angleTo(to.clone().normalize());if(dist<s.range+.4&&ang<1.15&&!ctx.invuln())ctx.damagePlayer(s.dmg,this.pos);}
   }
   if(this.timer<=0){this.state='recover';this.timer=s.recover;this.vel.multiplyScalar(.2);L.body.position.y=0;L.mandibles?.forEach((m,i)=>m.rotation.z=(i?1:-1)*.5);}
  }else if(this.state==='recover'){
   this.timer-=dt;L.body.rotation.y*=Math.exp(-dt*6);if(this.timer<=0)this.state='chase';
  }
  if(want!==0){const f=tmp.set(Math.sin(this.heading),0,Math.cos(this.heading));this.vel.addScaledVector(f,dt*s.speed*6*want);}
  const vmax=(this.state==='act'&&s.attack==='dash'?14:s.speed)*slow,sp=this.vel.length();if(sp>vmax)this.vel.multiplyScalar(vmax/sp);
  if(!(this.state==='act'&&s.attack==='dash'))this.vel.multiplyScalar(Math.exp(-dt*4));
  this.pos.addScaledVector(this.vel,dt);ctx.collide(this.pos,this.radius);
  for(const o of ctx.others)if(o!==this&&o.state!=='dead'){const d=tmp.copy(this.pos).sub(o.pos).setY(0),l=d.length(),m=this.radius+o.radius;if(l<m&&l>1e-4)this.pos.addScaledVector(d.normalize(),(m-l)*.5);}
  this.g.rotation.y=this.heading;
  this.gait+=this.vel.length()*dt*(this.kind==='carapace'?1.6:3);
  this.pose(dt,false);
  L.body.position.y=(this.state==='wind'&&s.attack==='dash')?L.body.position.y:Math.sin(this.gait*2)*.02;
 }
 private turn(target:number,dt:number,rate:number){let d=target-this.heading;d=Math.atan2(Math.sin(d),Math.cos(d));this.heading+=d*Math.min(1,dt*rate);}
 // procedural legs: feet step in a wave, knees bend up and out
 private pose(dt:number,dead:boolean){
  void dt;const L=this.look;L.body.updateMatrixWorld(true);
  for(const leg of L.legs){
   const hip=L.body.localToWorld(leg.hip.clone());
   const ph=this.gait+leg.phase,step=dead?0:Math.sin(ph)*.32*leg.len,lift=dead?0:Math.max(0,Math.cos(ph))*.18*leg.len;
   const reach=dead?.35:.78;
   const footL=leg.hip.clone().addScaledVector(leg.out,leg.len*reach).add(new T.Vector3(0,0,step));footL.y=dead?leg.hip.y+.1:lift;
   const foot=L.body.localToWorld(footL);if(!dead)foot.y=lift;
   const knee=hip.clone().lerp(foot,.45);knee.y=Math.max(hip.y,foot.y)+leg.knee*(dead?.3:1);
   orient(leg.up,this.g.worldToLocal(hip.clone()),this.g.worldToLocal(knee.clone()),leg.r);
   orient(leg.low,this.g.worldToLocal(knee.clone()),this.g.worldToLocal(foot.clone()),leg.r*.75);
  }
 }
 private spit(ctx:Ctx){
  const from=this.pos.clone().setY(.95).addScaledVector(this.dir,.75);
  const m=new T.Mesh(new T.SphereGeometry(.16,12,10),new T.MeshStandardMaterial({color:'#9dff4a',emissive:'#7dff2a',emissiveIntensity:2}));m.position.copy(from);this.scene.add(m);
  spits.push({m,v:this.dir.clone().multiplyScalar(11),life:1.4,dmg:this.spec.dmg});
  ctx.vfx.emit({pos:from,n:10,dir:this.dir,cone:.4,speed:[2,5],life:[.15,.3],size:[.15,.03],c0:'#eaffc0',c1:'#5dff2a',a:[1,0],drag:3});
 }
 dispose(){this.clearTele();this.g.removeFromParent();}
}
// acid globs: blocked by rocks and props, hurt the hero on contact
export function updateSpits(dt:number,ctx:Ctx){
 for(let i=spits.length-1;i>=0;i--){
  const s=spits[i];s.m.position.addScaledVector(s.v,dt);s.life-=dt;const p=s.m.position;let end=s.life<=0;
  ctx.vfx.emit({pos:p,n:1,dir:s.v.clone().negate(),cone:.4,speed:[.3,1],life:[.25,.4],size:[.12,.03],c0:'#d8ff9a',c1:'#3aa81a',a:[.9,0],grav:3});
  for(const c of ctx.colliders)if(Math.hypot(p.x-c.x,p.z-c.z)<c.r){end=true;break;}
  if(!end&&Math.hypot(p.x-ctx.player.x,p.z-ctx.player.z)<.55){end=true;if(!ctx.invuln())ctx.damagePlayer(s.dmg,p);}
  if(end){ctx.vfx.emit({pos:p,n:18,speed:[1.5,4],up:.6,life:[.3,.6],size:[.14,.04],c0:'#eaffc0',c1:'#3aa81a',a:[1,0],grav:9});ctx.vfx.decal(p,'#7dff3a',.7,.6);
   s.m.removeFromParent();s.m.geometry.dispose();(s.m.material as T.Material).dispose();spits.splice(i,1);}
 }
}
