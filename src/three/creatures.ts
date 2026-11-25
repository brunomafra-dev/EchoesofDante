import * as T from 'three';
import type {VFX} from './vfx';

// Native fauna of Dante for the new 3D, taken from the 2D bestiary (src/config/bestiary.ts).
// Bodies are built procedurally (chitin, plates, glowing organs) and legs walk with a procedural
// gait. Every attack is announced on the ground in amber and its direction is fixed once shown,
// as in the 2D game. Bosses chain several moves.
type Body='crawler'|'skitter'|'spitter'|'carapace'|'hound'|'amphibian'|'thorn'|'golem'|'winged'|'worm'|'warden';
type MoveType='bite'|'dash'|'spit'|'sweep'|'fan'|'lob'|'slam'|'breath'|'marks'|'burrow';
interface Move{type:MoveType;dmg:number;range:number;windup:number;recover:number;arc?:number;count?:number;radius?:number;color?:string;min?:number}
interface Spec{name:string;hp:number;speed:number;radius:number;scale:number;body:Body;pal:{c:string;g:string;s?:string;wet?:boolean};moves:Move[];phase2?:Move[];keep?:number;armor?:number;boss?:boolean;fly?:number}
const P=(c:string,g:string,s?:string,wet?:boolean)=>({c,g,s,wet});
export const SPECIES={
 // arrival forest / depths
 crawler:{name:'Rastejante Hollow',hp:70,speed:3.1,radius:.6,scale:1,body:'crawler',pal:P('#262c33','#3dfcff'),moves:[{type:'bite',dmg:10,range:1.7,windup:.5,recover:.6,arc:1.6}]},
 skitter:{name:'Saltador',hp:45,speed:3.6,radius:.45,scale:1,body:'skitter',pal:P('#4a382a','#ff8a3d'),moves:[{type:'dash',dmg:14,range:7,windup:.7,recover:.9}]},
 spitter:{name:'Cuspidor',hp:55,speed:2.3,radius:.6,scale:1,body:'spitter',pal:P('#33402a','#9dff4a','#7dff3a'),keep:7,moves:[{type:'spit',dmg:12,range:11,windup:.8,recover:.7,color:'#9dff4a',min:3}]},
 carapace:{name:'Casco Errante',hp:230,speed:1.7,radius:1.1,scale:1,body:'carapace',pal:P('#45434c','#ff7a2a'),armor:.75,moves:[{type:'sweep',dmg:22,range:3,windup:1.05,recover:1.4,arc:2.2}]},
 // springs & terraces
 bankGrazer:{name:'Vigia das Margens',hp:110,speed:2.4,radius:.8,scale:1,body:'amphibian',pal:P('#2f5a52','#7dfcd0',undefined,true),moves:[{type:'bite',dmg:16,range:2.6,windup:.8,recover:1,arc:1.1}]},
 reedSpitter:{name:'Fole dos Juncos',hp:60,speed:2.2,radius:.6,scale:1,body:'spitter',pal:P('#3a5a3e','#6fd8ff','#5fc8ff'),keep:7,moves:[{type:'spit',dmg:12,range:11,windup:.9,recover:.8,color:'#6fd8ff',min:3}]},
 // resonance valley
 thorn:{name:'Espinhante',hp:80,speed:2,radius:.7,scale:1,body:'thorn',pal:P('#4a3a5a','#d07dff'),keep:6,moves:[{type:'fan',dmg:11,range:10,windup:.85,recover:.9,color:'#e0a0ff',count:3,min:2.5}]},
 // ash coast, obsidian and caldera
 emberHound:{name:'Rasga-brasa',hp:75,speed:3.8,radius:.7,scale:1,body:'hound',pal:P('#2a2422','#ff5a1a'),moves:[{type:'dash',dmg:16,range:8,windup:.65,recover:.9}]},
 fumarole:{name:'Fole de Magma',hp:95,speed:2,radius:.8,scale:1.15,body:'spitter',pal:P('#2c2624','#ff6a20','#ff7a2a'),keep:7,moves:[{type:'lob',dmg:18,range:12,windup:1,recover:1,radius:1.6,color:'#ff7a2a',min:3}]},
 slagback:{name:'Dorso de Basalto',hp:260,speed:1.5,radius:1.2,scale:1.1,body:'carapace',pal:P('#2b2a2e','#ff6a20'),armor:.7,moves:[{type:'slam',dmg:26,range:2.6,windup:1.1,recover:1.6,radius:3.2}]},
 titan:{name:'O Incandescente',hp:1400,speed:1.6,radius:1.6,scale:1,body:'golem',pal:P('#2a2626','#ff7a20'),armor:.8,boss:true,moves:[
  {type:'slam',dmg:30,range:3.2,windup:1.1,recover:1.3,radius:3.6},{type:'lob',dmg:22,range:16,windup:1.2,recover:1.2,radius:1.8,count:3,color:'#ff7a2a',min:4},{type:'bite',dmg:26,range:3.4,windup:.8,recover:1,arc:1.4}]},
 // thaw galleries & boreal fracture
 iceCarapace:{name:'Casco Glacial',hp:240,speed:1.6,radius:1.1,scale:1,body:'carapace',pal:P('#9fb7c8','#7fe8ff'),armor:.75,moves:[{type:'sweep',dmg:22,range:3.2,windup:1.15,recover:1.5,arc:2.2}]},
 frostPouncer:{name:'Rasga-gelo',hp:60,speed:3.6,radius:.5,scale:1.1,body:'skitter',pal:P('#c8d8e8','#6fd8ff'),moves:[{type:'dash',dmg:15,range:7.5,windup:.7,recover:.9}]},
 frostSpitter:{name:'Cuspidor Boreal',hp:60,speed:2.2,radius:.6,scale:1,body:'spitter',pal:P('#7f93a8','#a8f0ff','#bff6ff'),keep:7,moves:[{type:'spit',dmg:13,range:11,windup:.85,recover:.8,color:'#bff6ff',min:3}]},
 vesper:{name:'Vésper, o Sopro Branco',hp:1300,speed:2.4,radius:1.4,scale:1,body:'winged',pal:P('#d8e4ee','#8fe8ff'),boss:true,fly:1.6,moves:[
  {type:'breath',dmg:24,range:9,windup:1.1,recover:1.2,arc:.9,color:'#cff6ff'},{type:'dash',dmg:22,range:10,windup:.9,recover:1.1},{type:'marks',dmg:20,range:14,windup:1.2,recover:1,radius:1.6,count:3}]},
 // sirocco basin
 dunePouncer:{name:'Rasga-areia',hp:60,speed:3.7,radius:.5,scale:1.1,body:'skitter',pal:P('#8a6a42','#ffcf6a'),moves:[{type:'dash',dmg:15,range:7.5,windup:.7,recover:.9}]},
 glassSpitter:{name:'Cuspidor vítreo',hp:60,speed:2.2,radius:.6,scale:1,body:'spitter',pal:P('#7a5a3a','#ffc04a','#ffd06a'),keep:7,moves:[{type:'spit',dmg:13,range:11,windup:.85,recover:.8,color:'#ffd06a',min:3}]},
 soterrado:{name:'O Soterrado',hp:1300,speed:2.2,radius:1.4,scale:1,body:'worm',pal:P('#6a5236','#ffb04a'),boss:true,moves:[
  {type:'burrow',dmg:28,range:20,windup:1.4,recover:1.6,radius:2.2,count:3},{type:'dash',dmg:22,range:10,windup:.9,recover:1.2},{type:'bite',dmg:24,range:3.2,windup:.8,recover:1,arc:1.4}]},
// guardian of the domain: changes pattern when its energy drops (2D: O Warden)
 warden:{name:'O Warden',hp:1800,speed:2,radius:1.5,scale:1,body:'warden',pal:P('#2e3a44','#4ff0ff'),armor:.85,boss:true,moves:[
  {type:'sweep',dmg:26,range:4.2,windup:1.05,recover:1.2,arc:2.6},{type:'slam',dmg:28,range:3.5,windup:1.1,recover:1.3,radius:4.2},{type:'marks',dmg:22,range:16,windup:1.2,recover:1,radius:1.8,count:3}],
  phase2:[{type:'fan',dmg:16,range:14,windup:.8,recover:.8,color:'#8ff4ff',count:5,min:3},{type:'dash',dmg:26,range:11,windup:.75,recover:1},{type:'marks',dmg:24,range:16,windup:.9,recover:.8,radius:1.8,count:5}]},
} satisfies Record<string,Spec>;
export type SpeciesId=keyof typeof SPECIES;

export interface Ctx{
 scene:T.Scene;vfx:VFX;player:T.Vector3;playerOk:()=>boolean;invuln:()=>boolean;
 damagePlayer:(d:number,from:T.Vector3)=>void;collide:(p:T.Vector3,r:number)=>void;colliders:()=>{x:number;z:number;r:number}[];
 popText:(p:T.Vector3,s:string,c:string)=>void;onKill:(c:Creature)=>void;onHit:(c:Creature,quiet:boolean)=>void;others:Creature[];
}
const rnd=(a:number,b:number)=>a+Math.random()*(b-a);
const UP=new T.Vector3(0,1,0),tmp=new T.Vector3(),tmp2=new T.Vector3();
const segGeo=new T.CylinderGeometry(1,1,1,7);segGeo.translate(0,.5,0);
function orient(m:T.Mesh,a:T.Vector3,b:T.Vector3,r:number){const d=tmp.copy(b).sub(a),l=d.length();m.position.copy(a);m.quaternion.setFromUnitVectors(UP,d.normalize());m.scale.set(r,l,r);}

interface Leg{hip:T.Vector3;out:T.Vector3;len:number;phase:number;up:T.Mesh;low:T.Mesh;r:number;knee:number}
interface Look{chitin:T.MeshStandardMaterial;glow:T.MeshStandardMaterial;body:T.Group;legs:Leg[];sac?:T.Mesh;mandibles?:T.Mesh[];height:number;wings?:T.Object3D[];arms?:T.Object3D[];segs?:T.Mesh[];halo?:T.Object3D[]}
type Pal=Spec['pal'];
function chitin(p:Pal){return new T.MeshStandardMaterial({color:p.c,roughness:p.wet?.18:.42,metalness:p.wet?.1:.25,emissive:'#000000',emissiveIntensity:1});}
function glowMat(color:string,i=1.6){return new T.MeshStandardMaterial({color,emissive:color,emissiveIntensity:i,roughness:.3});}
function ball(r:number,m:T.Material,p:[number,number,number],s:[number,number,number]=[1,1,1]){const b=new T.Mesh(new T.SphereGeometry(r,18,12),m);b.position.set(...p);b.scale.set(...s);b.castShadow=true;return b;}
function cone(r:number,h:number,m:T.Material,p:[number,number,number],rot:[number,number,number]){const c=new T.Mesh(new T.ConeGeometry(r,h,7),m);c.position.set(...p);c.rotation.set(...rot);c.castShadow=true;return c;}
function addLegs(g:T.Group,m:T.Material,defs:[number,number,number,number,number][],r:number,knee:number):Leg[]{
 return defs.map(([x,y,z,ang,len],i)=>{const up=new T.Mesh(segGeo,m),low=new T.Mesh(segGeo,m);up.castShadow=low.castShadow=true;g.parent!.add(up,low);
  return {hip:new T.Vector3(x,y,z),out:new T.Vector3(Math.cos(ang),0,Math.sin(ang)),len,phase:(i%2)*Math.PI+(i>2?Math.PI:0),up,low,r,knee};});
}
const six=(x:number,y:number,z:number,len:number):[number,number,number,number,number][]=>[[x,y,z,.45,len],[x*1.1,y,0,0,len*1.1],[x,y,-z*.8,-.45,len],[-x,y,z,Math.PI-.45,len],[-x*1.1,y,0,Math.PI,len*1.1],[-x,y,-z*.8,Math.PI+.45,len]];
const four=(x:number,y:number,z:number,len:number,back=len):[number,number,number,number,number][]=>[[x,y,z,.55,len],[-x,y,z,Math.PI-.55,len],[x,y,-z,-.5,back],[-x,y,-z,Math.PI+.5,back]];

function buildCrawler(root:T.Group,p:Pal):Look{
 const ch=chitin(p),gl=glowMat(p.g),body=new T.Group();root.add(body);
 body.add(ball(.42,ch,[0,.55,.1],[1,.62,1.15]));
 for(let i=0;i<3;i++)body.add(ball(.36-i*.07,ch,[0,.58-i*.03,-.45-i*.32],[1,.7,1]));
 body.add(ball(.24,ch,[0,.55,.62],[1,.8,1.1]));
 const mand:T.Mesh[]=[];for(const s of[-1,1]){const c=cone(.05,.38,ch,[s*.12,.48,.85],[Math.PI/2,0,s*.5]);body.add(c);mand.push(c);body.add(ball(.045,gl,[s*.11,.66,.8]));}
 for(let i=0;i<5;i++){const pl=new T.Mesh(new T.BoxGeometry(.5-i*.06,.06,.22),ch);pl.position.set(0,.86-i*.03,.2-i*.3);pl.rotation.x=-.15;pl.castShadow=true;body.add(pl);
  body.add(ball(.035,gl,[.14,.88-i*.03,.2-i*.3]),ball(.035,gl,[-.14,.88-i*.03,.2-i*.3]));}
 return {chitin:ch,glow:gl,body,legs:addLegs(body,ch,six(.3,.5,.4,.8),.06,.26),mandibles:mand,height:1};
}
function buildSkitter(root:T.Group,p:Pal):Look{
 const ch=chitin(p),gl=glowMat(p.g,2),body=new T.Group();root.add(body);
 body.add(ball(.28,ch,[0,.62,0],[1,.75,1.35]));body.add(ball(.18,ch,[0,.66,.42],[1,.85,1.1]));
 for(const s of[-1,1])body.add(ball(.04,gl,[s*.08,.72,.56]));
 body.add(cone(.08,.7,ch,[0,.72,-.55],[-1.9,0,0]));
 for(let i=0;i<3;i++)body.add(cone(.04,.18,ch,[0,.85,.15-i*.18],[-.4,0,0]));
 return {chitin:ch,glow:gl,body,legs:addLegs(body,ch,four(.18,.58,.22,.62,1.0),.05,.42),height:.9};
}
function buildSpitter(root:T.Group,p:Pal):Look{
 const ch=chitin(p),gl=glowMat(p.g,1.3),body=new T.Group();root.add(body);
 body.add(ball(.5,ch,[0,.75,0],[1,.8,1.1]));
 const sacM=new T.MeshStandardMaterial({color:p.s??p.g,emissive:p.s??p.g,emissiveIntensity:.4,roughness:.2,transparent:true,opacity:.85});
 const sac=ball(.34,sacM,[0,1.2,-.1]);body.add(sac);
 for(let i=0;i<4;i++){const rib=new T.Mesh(new T.TorusGeometry(.34,.025,6,20,Math.PI),ch);rib.position.set(0,1.2,-.3+i*.14);rib.rotation.y=Math.PI/2;body.add(rib);}
 const mouth=new T.Mesh(new T.CylinderGeometry(.09,.16,.4,10),ch);mouth.position.set(0,.85,.55);mouth.rotation.x=Math.PI/2.3;mouth.castShadow=true;body.add(mouth);
 body.add(ball(.07,gl,[0,.92,.74]));
 return {chitin:ch,glow:gl,body,legs:addLegs(body,ch,four(.34,.6,.3,.85),.06,.4),sac,height:1.4};
}
function buildCarapace(root:T.Group,p:Pal):Look{
 const ch=chitin(p),gl=glowMat(p.g,1.4),body=new T.Group();root.add(body);
 const shell=new T.Mesh(new T.SphereGeometry(1,24,14,0,Math.PI*2,0,Math.PI/2),ch);shell.scale.set(1.05,.75,1.3);shell.position.y=.55;shell.castShadow=true;body.add(shell);
 body.add(ball(.9,new T.MeshStandardMaterial({color:'#1a1414',roughness:.8}),[0,.55,0],[1.05,.25,1.25]));
 for(let i=0;i<5;i++){const r=new T.Mesh(new T.TorusGeometry(.95-i*.04,.035,6,28,Math.PI),ch);r.position.set(0,.55,-.8+i*.38);r.scale.set(1.05,.78,1);body.add(r);}
 for(let i=0;i<7;i++){const a=-.9+i*.3;body.add(cone(.08,.35,ch,[Math.sin(a)*.5,1.2-Math.abs(a)*.25,Math.cos(a)*.2-.2],[-.3,0,-a*.6]));}
 for(let i=0;i<6;i++){const a=(i/6)*Math.PI*2;body.add(ball(.06,gl,[Math.cos(a)*.95,.5,Math.sin(a)*1.15]));}
 body.add(ball(.32,ch,[0,.55,1.25],[1.2,.7,.9]));
 for(const s of[-1,1]){body.add(cone(.1,.6,ch,[s*.32,.45,1.55],[Math.PI/2.2,0,s*.6]));body.add(ball(.05,gl,[s*.14,.68,1.48]));}
 return {chitin:ch,glow:gl,body,legs:addLegs(body,ch,six(.8,.42,.6,1.05),.11,.38),height:1.5};
}
function buildHound(root:T.Group,p:Pal):Look{
 const ch=chitin(p),gl=glowMat(p.g,2.2),body=new T.Group();root.add(body);
 body.add(ball(.42,ch,[0,.62,0],[.9,.6,1.6]));
 body.add(ball(.28,ch,[0,.66,.78],[1,.75,1.2]));
 const jaw=new T.Mesh(new T.BoxGeometry(.3,.1,.36),ch);jaw.position.set(0,.5,.98);jaw.castShadow=true;body.add(jaw);
 body.add(ball(.09,gl,[0,.56,1.02],[1.4,.6,1.4]));
 for(const s of[-1,1])body.add(ball(.04,gl,[s*.12,.74,.98]));
 for(let i=0;i<5;i++){const pl=new T.Mesh(new T.BoxGeometry(.42,.07,.26),ch);pl.position.set(0,.92,.45-i*.28);pl.rotation.x=-.25;pl.castShadow=true;body.add(pl);body.add(ball(.05,gl,[0,.9,.45-i*.28+.12],[1.6,.5,.6]));}
 body.add(cone(.07,.6,ch,[0,.7,-.85],[-1.8,0,0]));
 return {chitin:ch,glow:gl,body,legs:addLegs(body,ch,four(.28,.55,.48,.78),.07,.36),mandibles:[jaw],height:1};
}
function buildAmphibian(root:T.Group,p:Pal):Look{
 const ch=chitin(p),gl=glowMat(p.g,1.2),body=new T.Group();root.add(body);
 body.add(ball(.55,ch,[0,.55,0],[1.15,.55,1.35]));
 const head=ball(.38,ch,[0,.58,.75],[1.3,.6,.9]);body.add(head);
 for(const s of[-1,1]){body.add(ball(.1,ch,[s*.28,.82,.78]));body.add(ball(.06,gl,[s*.3,.86,.84]));}
 for(let i=0;i<4;i++){const pl=new T.Mesh(new T.SphereGeometry(.3,12,8,0,Math.PI*2,0,Math.PI/2),ch);pl.position.set(0,.8,.35-i*.3);pl.scale.set(1.2,.35,.8);pl.castShadow=true;body.add(pl);}
 for(let i=0;i<8;i++)body.add(ball(.04,gl,[Math.sin(i)*.45,.72,.4-i*.12]));
 const arm=cone(.07,.7,ch,[0,.5,1.05],[Math.PI/2.3,0,0]);body.add(arm);
 return {chitin:ch,glow:gl,body,legs:addLegs(body,ch,six(.5,.45,.45,.75),.08,.25),mandibles:[arm],height:1};
}
function buildThorn(root:T.Group,p:Pal):Look{
 const ch=chitin(p),gl=glowMat(p.g,2),body=new T.Group();root.add(body);
 body.add(ball(.55,ch,[0,.9,0],[1,.9,1]));
 for(let i=0;i<26;i++){const a=i*2.4,y=Math.cos(i*.7)*.4;const d=new T.Vector3(Math.cos(a),y+.3,Math.sin(a)).normalize();
  const c=cone(.05,.5,ch,[d.x*.5,.9+d.y*.5,d.z*.5],[0,0,0]);c.quaternion.setFromUnitVectors(UP,d);body.add(c);body.add(ball(.03,gl,[d.x*.78,.9+d.y*.78,d.z*.78]));}
 body.add(ball(.12,gl,[0,.95,.5]));
 return {chitin:ch,glow:gl,body,legs:addLegs(body,ch,four(.3,.6,.3,.7),.06,.3),height:1.6};
}
function buildGolem(root:T.Group,p:Pal):Look{
 const ch=chitin(p),gl=glowMat(p.g,2.4),body=new T.Group();root.add(body);
 const rock=(r:number,pos:[number,number,number],s:[number,number,number])=>{const m=new T.Mesh(new T.DodecahedronGeometry(r,0),ch);m.position.set(...pos);m.scale.set(...s);m.castShadow=true;body.add(m);return m;};
 rock(1,[0,2.6,0],[1.25,1.1,.9]);rock(.55,[0,3.75,.15],[1,.9,1]);rock(.7,[0,1.7,0],[1,.7,.8]);
 body.add(ball(.42,gl,[0,2.6,.55],[1,1,.5]));for(const s of[-1,1])body.add(ball(.08,gl,[s*.18,3.8,.6]));
 for(let i=0;i<10;i++){const a=i*1.7;body.add(ball(.07,gl,[Math.cos(a)*1.05,2.2+Math.sin(i)*.7,Math.sin(a)*.75]));}
 const arms:T.Object3D[]=[];
 for(const s of[-1,1]){const a=new T.Group();a.position.set(s*1.35,3.1,0);body.add(a);
  const up=new T.Mesh(new T.DodecahedronGeometry(.45,0),ch);up.position.y=-.6;up.scale.set(.8,1.4,.8);up.castShadow=true;a.add(up);
  const fist=new T.Mesh(new T.DodecahedronGeometry(.6,0),ch);fist.position.y=-1.6;fist.castShadow=true;a.add(fist);a.add(ball(.15,gl,[0,-1.6,.45]));arms.push(a);}
 return {chitin:ch,glow:gl,body,legs:addLegs(body,ch,[[.6,1.4,0,-.2,1.5],[-.6,1.4,0,Math.PI+.2,1.5]],.32,.2),arms,height:4.3};
}
function buildWinged(root:T.Group,p:Pal):Look{
 const ch=chitin(p),gl=glowMat(p.g,2),body=new T.Group();root.add(body);
 body.add(ball(.6,ch,[0,0,0],[.9,.8,1.6]));
 for(let i=0;i<4;i++)body.add(ball(.3-i*.04,ch,[0,.15+i*.18,.95+i*.3]));
 const head=ball(.3,ch,[0,.75,2.1],[.9,.7,1.4]);body.add(head);
 for(const s of[-1,1]){body.add(ball(.06,gl,[s*.13,.85,2.4]));body.add(cone(.05,.5,ch,[s*.15,1,1.9],[-.8,0,s*.3]));}
 for(let i=0;i<6;i++)body.add(ball(.25-i*.035,ch,[0,-.05-i*.03,-1-i*.38]));
 const wingShape=new T.Shape();wingShape.moveTo(0,0);wingShape.lineTo(3.2,.6);wingShape.lineTo(3.6,-.2);wingShape.lineTo(2.4,-.6);wingShape.lineTo(1.4,-1.1);wingShape.lineTo(0,-.8);
 const wingM=new T.MeshStandardMaterial({color:p.c,roughness:.5,side:T.DoubleSide,transparent:true,opacity:.92,emissive:p.g,emissiveIntensity:.15});
 const wings:T.Object3D[]=[];
 for(const s of[-1,1]){const w=new T.Group();w.position.set(s*.4,.2,.2);const m=new T.Mesh(new T.ShapeGeometry(wingShape),wingM);m.rotation.x=-Math.PI/2;m.scale.x=s;m.castShadow=true;w.add(m);body.add(w);wings.push(w);}
 for(let i=0;i<8;i++)body.add(ball(.05,gl,[Math.sin(i*2)*.4,.45,.6-i*.3]));
 return {chitin:ch,glow:gl,body,legs:[],wings,height:2.6};
}
function buildWorm(root:T.Group,p:Pal):Look{
 const ch=chitin(p),gl=glowMat(p.g,2),body=new T.Group();root.add(body);
 const segs:T.Mesh[]=[];
 for(let i=0;i<9;i++){const r=.75-i*.05;const s=ball(r,ch,[0,0,0],[1,1,.85]);body.add(s);segs.push(s);
  for(let k=0;k<5;k++){const a=k/5*Math.PI*2;s.add(cone(.07,.3,ch,[Math.cos(a)*.95,Math.sin(a)*.95,0],[0,0,a-Math.PI/2]));}}
 const mouth=new T.Mesh(new T.TorusGeometry(.42,.12,8,16),ch);segs[0].add(mouth);mouth.position.z=.6;
 for(let k=0;k<6;k++){const a=k/6*Math.PI*2;segs[0].add(cone(.06,.45,gl,[Math.cos(a)*.35,Math.sin(a)*.35,.75],[Math.PI/2,0,0]));}
 segs[0].add(ball(.2,gl,[0,0,.5]));
 return {chitin:ch,glow:gl,body,legs:[],segs,height:3};
}
function buildWarden(root:T.Group,p:Pal):Look{
 const ch=chitin(p),gl=glowMat(p.g,2.4),body=new T.Group();root.add(body);
 const plate=(w:number,h:number,d:number,pos:[number,number,number],rot:[number,number,number]=[0,0,0])=>{const m=new T.Mesh(new T.BoxGeometry(w,h,d),ch);m.position.set(...pos);m.rotation.set(...rot);m.castShadow=true;body.add(m);return m;};
 // floating construct: no legs, a core of light held by armour plates
 body.add(ball(.55,gl,[0,2.6,0],[1,1.2,1]));
 plate(1.5,1.4,.35,[0,2.7,.45],[.15,0,0]);plate(1.5,1.4,.35,[0,2.7,-.45],[-.15,0,0]);
 for(const s of[-1,1]){plate(.35,1.5,1.1,[s*.82,2.7,0],[0,0,s*.12]);plate(.9,.3,.9,[s*.75,3.5,0],[0,0,s*.4]);}
 plate(1.1,.5,.9,[0,1.7,0],[0,0,0]);body.add(cone(.55,1.2,ch,[0,1,0],[Math.PI,0,0]));
 const head=new T.Mesh(new T.OctahedronGeometry(.45,0),ch);head.position.set(0,3.9,.1);head.scale.set(1,1.3,.9);head.castShadow=true;body.add(head);
 body.add(ball(.12,gl,[0,3.95,.48],[1.6,.6,.5]));
 const arms:T.Object3D[]=[];
 for(const s of[-1,1]){const a=new T.Group();a.position.set(s*1.25,3.2,0);body.add(a);
  const fore=new T.Mesh(new T.BoxGeometry(.35,1.5,.35),ch);fore.position.y=-.75;fore.castShadow=true;a.add(fore);
  const blade=new T.Mesh(new T.ConeGeometry(.18,1.6,4),gl);blade.position.y=-2.1;blade.rotation.x=Math.PI;a.add(blade);arms.push(a);}
 const halo:T.Object3D[]=[];
 for(let i=0;i<3;i++){const t=new T.Mesh(new T.TorusGeometry(1.1+i*.35,.04,8,48),gl);t.position.y=2.6;body.add(t);halo.push(t);}
 for(let i=0;i<8;i++){const sh=new T.Mesh(new T.OctahedronGeometry(.16,0),ch);const a=i/8*Math.PI*2;sh.position.set(Math.cos(a)*1.9,2.6,Math.sin(a)*1.9);body.add(sh);halo.push(sh);}
 return {chitin:ch,glow:gl,body,legs:[],arms,halo,height:4.6};
}
const BUILD:Record<Body,(r:T.Group,p:Pal)=>Look>={warden:buildWarden,crawler:buildCrawler,skitter:buildSkitter,spitter:buildSpitter,carapace:buildCarapace,hound:buildHound,amphibian:buildAmphibian,thorn:buildThorn,golem:buildGolem,winged:buildWinged,worm:buildWorm};

// ---------- telegraphs (amber, fixed once announced) ----------
const TELE_F=`uniform float uK;uniform vec3 uColor;void main(){float pulse=.6+.4*sin(uK*40.);gl_FragColor=vec4(uColor*(.06+uK*.28)*pulse,1.);}`;
function teleMat(){return new T.ShaderMaterial({vertexShader:'void main(){gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:TELE_F,uniforms:{uK:{value:0},uColor:{value:new T.Color('#ff8a1a')}},transparent:true,depthWrite:false,blending:T.AdditiveBlending});}
const sector=(r:number,arc:number)=>new T.CircleGeometry(r,40,Math.PI/2-arc/2,arc).rotateX(-Math.PI/2).rotateY(Math.PI).translate(0,.05,0);
const strip=(w:number,l:number)=>new T.PlaneGeometry(w,l).rotateX(-Math.PI/2).translate(0,.05,l/2);
const disc=(r:number)=>new T.RingGeometry(r*.12,r,40).rotateX(-Math.PI/2).translate(0,.05,0);

interface Shot{m:T.Mesh;v:T.Vector3;life:number;dmg:number;color:string;arc?:{from:T.Vector3;to:T.Vector3;t:number;dur:number;r:number}}
const shots:Shot[]=[];

export class Creature{
 g=new T.Group();spec:Spec;look:Look;hp:number;state:'idle'|'chase'|'wind'|'act'|'recover'|'dead'='idle';
 t=Math.random()*9;timer=0;vel=new T.Vector3();deadT=0;flash=0;gone=false;
 slowUntil=0;burnUntil=0;burnAcc=0;markUntil=0;heading=Math.random()*6.28;
 private tele:T.Mesh[]=[];private dir=new T.Vector3();private hitDone=false;private gait=0;private mv!:Move;private targets:T.Vector3[]=[];private hidden=0;private moveCd=0;
 static ctx:Ctx;
 constructor(public kind:SpeciesId,x:number,z:number,private scene:T.Scene){
  this.spec=SPECIES[kind] as Spec;this.hp=this.spec.hp;this.g.position.set(x,0,z);this.g.scale.setScalar(this.spec.scale);scene.add(this.g);
  const root=new T.Group();this.g.add(root);this.look=BUILD[this.spec.body](root,this.spec.pal);
  if(this.spec.body==='worm')this.hidden=1;
 }
 get pos(){return this.g.position;}
 get radius(){return this.spec.radius;}
 get boss(){return !!this.spec.boss;}
 get name(){return this.spec.name;}
 hit(d:number,from:T.Vector3,color='#ffd27a',quiet=false,push=5){
  const ctx=Creature.ctx;if(this.state==='dead')return;
  if(this.hidden>.6){ctx.popText(this.pos.clone().setY(1),'Soterrado','#9a917f');return;}
  const k=this.spec.armor??1;this.hp-=d*k;this.flash=.15;
  if(!quiet){const dir=this.pos.clone().sub(from).setY(0).normalize();this.vel.addScaledVector(dir,push*(this.boss?.1:k<1?.3:1));}
  ctx.popText(this.pos.clone().setY(this.look.height*this.spec.scale+.6),String(Math.round(d*k)),color);ctx.onHit(this,quiet);
  if(this.state==='idle')this.state='chase';
  if(this.spec.phase2&&this.phase===1&&this.hp<this.spec.hp*.5){this.phase=2;ctx.popText(this.pos.clone().setY(5.5),'O guardião muda de padrão','#8ff4ff');ctx.vfx.shake=.4;this.look.glow.color.set('#ff5a8a');this.look.glow.emissive.set('#ff5a8a');}
  if(this.hp<=0)this.die(ctx);
 }
 private die(ctx:Ctx){this.state='dead';this.clearTele();ctx.onKill(this);
  ctx.vfx.emit({pos:this.pos.clone().setY(.6),n:this.boss?90:24,speed:[1,this.boss?7:4],up:.6,life:[.4,.9],size:[.14,.03],c0:'#ffffff',c1:'#'+this.look.glow.color.getHexString(),a:[1,0],grav:6,drag:1.5,spread:this.boss?1.2:.3});}
 private clearTele(){for(const m of this.tele){m.removeFromParent();m.geometry.dispose();(m.material as T.Material).dispose();}this.tele=[];}
 private addTele(geo:T.BufferGeometry,at:T.Vector3,rot:number){const m=new T.Mesh(geo,teleMat());m.renderOrder=3;m.position.copy(at).setY(0);m.rotation.y=rot;this.scene.add(m);this.tele.push(m);}
 phase=1;
 private pick(dist:number){
  const pool=this.phase===2&&this.spec.phase2?[...this.spec.moves,...this.spec.phase2]:this.spec.moves;
  const ok=pool.filter(m=>dist<=m.range&&dist>=(m.min??0));
  return ok.length?ok[Math.floor(Math.random()*ok.length)]:null;
 }
 private announce(ctx:Ctx){
  const m=this.mv,s=1/this.spec.scale;void s;this.targets=[];
  if(m.type==='dash')this.addTele(strip(1.1*this.spec.scale,m.range),this.pos,this.heading);
  else if(m.type==='spit')this.addTele(strip(.35,m.range),this.pos,this.heading);
  else if(m.type==='fan'){const n=m.count??3;for(let i=0;i<n;i++)this.addTele(strip(.3,m.range),this.pos,this.heading+(i-(n-1)/2)*.32);}
  else if(m.type==='sweep'||m.type==='bite'||m.type==='breath')this.addTele(sector(m.range*(m.type==='bite'?.95:1),m.arc??1.6),this.pos,this.heading);
  else if(m.type==='slam')this.addTele(disc(m.radius!),this.pos,0);
  else{ // lob, marks, burrow: circles around the hero
   const n=m.count??1;for(let i=0;i<n;i++){const p=ctx.player.clone();if(i>0){const a=Math.random()*6.28,d=rnd(1.8,3.5);p.x+=Math.cos(a)*d;p.z+=Math.sin(a)*d;}this.targets.push(p);this.addTele(disc(m.radius!),p,0);}
  }
 }
 update(dt:number,now:number,ctx:Ctx){
  this.t+=dt;this.flash=Math.max(0,this.flash-dt);this.moveCd-=dt;
  const L=this.look;L.chitin.emissive.setRGB(this.flash*4,this.flash*2.4,this.flash*1.6);
  if(this.state==='dead'){this.deadT+=dt;
   if(this.spec.fly){this.g.position.y=Math.max(-.4,this.g.position.y-dt*4);L.body.rotation.z=Math.min(1.4,this.deadT*2);}
   else{L.body.rotation.z=Math.min(2.6,this.deadT*5)*(this.radius>1?.35:1);this.g.position.y=Math.max(-1.2,-(this.deadT-1.5)*.5);}
   this.pose(true);if(this.deadT>(this.boss?6:3.5)){this.g.removeFromParent();this.gone=true;}return;}
  if(now<this.burnUntil){this.burnAcc+=dt*7;ctx.vfx.burning(this.pos);if(this.burnAcc>=4){this.hit(this.burnAcc,this.pos,'#ff8a50',true,0);this.burnAcc=0;if((this.state as string)==='dead')return;}}
  if(now<this.slowUntil)ctx.vfx.wet(this.pos);if(now<this.markUntil)ctx.vfx.marked(this.pos);
  const s=this.spec,to=tmp2.copy(ctx.player).sub(this.pos).setY(0),dist=to.length();
  const slow=now<this.slowUntil?(this.boss?.7:.45):1;let want=0;
  if(this.state==='idle'){if(dist<(this.boss?22:14)&&ctx.playerOk())this.state='chase';else{this.heading+=Math.sin(this.t*.7)*dt*.6;want=.25;}}
  if(this.state==='chase'){
   const face=Math.atan2(to.x,to.z);this.turn(face,dt,4);
   const mv=this.moveCd<=0&&ctx.playerOk()?this.pick(dist):null;
   const close=s.moves.some(m=>m.type==='bite'||m.type==='sweep'||m.type==='slam')?1.5:0;
   if(mv&&(mv.type!=='bite'&&mv.type!=='sweep'&&mv.type!=='slam'||dist<mv.range*.9)){
    this.mv=mv;this.state='wind';this.timer=mv.windup;this.heading=face;this.dir.set(Math.sin(face),0,Math.cos(face));this.announce(ctx);}
   else if(s.keep&&dist<s.keep)want=-.8;else if(dist>close+this.radius)want=1;
  }else if(this.state==='wind'){
   const m=this.mv;this.timer-=dt*slow*(this.phase===2?1.25:1);const k=1-this.timer/m.windup;
   for(const te of this.tele)(te.material as T.ShaderMaterial).uniforms.uK.value=k;
   if(m.type==='bite'){L.glow.emissiveIntensity=1.6+k*5;L.mandibles?.forEach((mm,i)=>mm.rotation.z=(i?1:-1)*(.5+k*.6));}
   if((m.type==='spit'||m.type==='lob'||m.type==='fan')&&L.sac){const sc=1+k*.55;L.sac.scale.set(sc,sc,sc);}
   if(m.type==='dash')L.body.position.y=-k*.15;
   if(m.type==='sweep')L.body.rotation.y=-k*.5;
   if(m.type==='slam'){L.body.position.y=k*.35;L.arms?.forEach(a=>a.rotation.x=-k*2.4);}
   if(m.type==='breath'){L.body.rotation.x=-k*.25;}
   if(m.type==='burrow'){this.hidden=Math.min(1,k*2);}
   if(m.type==='slam'||m.type==='sweep'||m.type==='bite'||m.type==='breath'){for(const te of this.tele)te.position.set(this.pos.x,0,this.pos.z);}
   if(this.timer<=0){this.state='act';this.hitDone=false;this.release(ctx);}
  }else if(this.state==='act'){
   this.timer-=dt;const m=this.mv;
   if(m.type==='dash'){this.vel.copy(this.dir).multiplyScalar(14);L.body.position.y=.1;
    ctx.vfx.emit({pos:this.pos.clone().setY(.2),n:1,dir:this.dir.clone().negate(),cone:.6,speed:[.5,1.5],life:[.3,.5],size:[.3,.6],c0:'#6a5a48',c1:'#3a3028',a:[.4,0],drag:2});
    if(!this.hitDone&&dist<this.radius+.6){this.hitDone=true;if(!ctx.invuln())ctx.damagePlayer(m.dmg,this.pos);}}
   if(m.type==='breath'){const c=m.color??'#cff6ff';for(let i=0;i<6;i++){const a=this.heading+rnd(-m.arc!/2,m.arc!/2);ctx.vfx.emit({pos:this.pos.clone().setY(1.4).addScaledVector(this.dir,1.6),n:1,dir:tmp.set(Math.sin(a),-.08,Math.cos(a)),cone:.05,speed:[8,13],life:[.4,.7],size:[.4,1.2],c0:'#ffffff',c1:c,a:[.8,0],drag:1});}}
   if(this.timer<=0)this.toRecover();
  }else if(this.state==='recover'){
   this.timer-=dt;L.body.rotation.y*=Math.exp(-dt*6);L.body.rotation.x*=Math.exp(-dt*6);L.arms?.forEach(a=>a.rotation.x*=Math.exp(-dt*5));if(L.body.position.y>0)L.body.position.y*=Math.exp(-dt*8);
   if(this.hidden>0&&this.mv?.type!=='burrow')this.hidden=Math.max(0,this.hidden-dt*2);
   if(this.timer<=0){this.state='chase';this.moveCd=this.boss?.3:0;}
  }
  if(this.spec.body==='worm'&&this.state!=='wind'&&this.state!=='act'&&this.hidden>0&&this.mv?.type==='burrow')this.hidden=Math.max(0,this.hidden-dt*1.5);
  if(want!==0&&!(this.spec.body==='worm'&&this.hidden>.5)){const f=tmp.set(Math.sin(this.heading),0,Math.cos(this.heading));this.vel.addScaledVector(f,dt*s.speed*6*want);}
  const dashing=this.state==='act'&&this.mv?.type==='dash',vmax=(dashing?14:s.speed)*slow,sp=this.vel.length();if(sp>vmax)this.vel.multiplyScalar(vmax/sp);
  if(!dashing)this.vel.multiplyScalar(Math.exp(-dt*4));
  this.pos.addScaledVector(this.vel,dt);ctx.collide(this.pos,this.radius);
  for(const o of ctx.others)if(o!==this&&o.state!=='dead'){const d=tmp.copy(this.pos).sub(o.pos).setY(0),l=d.length(),mm=this.radius+o.radius;if(l<mm&&l>1e-4)this.pos.addScaledVector(d.normalize(),(mm-l)*.5);}
  this.g.rotation.y=this.heading;
  if(s.fly)this.g.position.y=s.fly+Math.sin(this.t*2.2)*.25;
  this.gait+=this.vel.length()*dt*(this.radius>1?1.6:3);
  this.pose(false);
 }
 // the moment a prepared attack goes off
 private release(ctx:Ctx){
  const m=this.mv,L=this.look,to=tmp2.copy(ctx.player).sub(this.pos).setY(0),dist=to.length();
  this.clearTele();this.timer=m.type==='dash'?.36:m.type==='breath'?.5:.15;L.glow.emissiveIntensity=this.spec.body==='golem'?2.4:1.6;
  if(L.sac)L.sac.scale.set(1,1,1);
  const inSector=(r:number,arc:number)=>dist<r+.4&&this.dir.angleTo(to.clone().normalize())<arc/2+.1;
  if(m.type==='bite'){if(inSector(m.range,m.arc??1.6)&&!ctx.invuln())ctx.damagePlayer(m.dmg+rnd(0,3),this.pos);L.mandibles?.forEach((mm,i)=>mm.rotation.z=(i?1:-1)*.5);if(L.arms)L.arms[0].rotation.x=-1.6;}
  if(m.type==='sweep'){L.body.rotation.y=.6;ctx.vfx.decal(this.pos.clone().addScaledVector(this.dir,1.2),'#ffae3a',m.range,.4);ctx.vfx.shake=Math.max(ctx.vfx.shake,.2);if(inSector(m.range,m.arc??2.2)&&!ctx.invuln())ctx.damagePlayer(m.dmg,this.pos);}
  if(m.type==='breath'){if(inSector(m.range,m.arc??.9)&&!ctx.invuln()){ctx.damagePlayer(m.dmg,this.pos);}}
  if(m.type==='slam'){L.body.position.y=-.1;L.arms?.forEach(a=>a.rotation.x=.3);ctx.vfx.shake=Math.max(ctx.vfx.shake,.4);ctx.vfx.decal(this.pos.clone(),'#ffae3a',m.radius!,.5,1);
   for(let i=0;i<10;i++)ctx.vfx.shard(this.pos.clone().setY(.3),tmp.set(rnd(-1,1),rnd(.8,1.6),rnd(-1,1)).normalize().multiplyScalar(rnd(4,8)),1.2);
   ctx.vfx.puff({pos:this.pos.clone().setY(.4),n:16,speed:[1.5,4],up:.2,life:[.7,1.2],size:[.8,2],c0:'#7a6448',c1:'#3a3028',a:[.5,0],drag:2,spread:m.radius!*.5});
   if(dist<m.radius!+.3&&!ctx.invuln())ctx.damagePlayer(m.dmg,this.pos);}
  if(m.type==='spit')this.shoot(ctx,this.dir,m);
  if(m.type==='fan'){const n=m.count??3;for(let i=0;i<n;i++){const a=(i-(n-1)/2)*.32;const d=this.dir.clone().applyAxisAngle(UP,a);this.shoot(ctx,d,m);}}
  if(m.type==='lob')for(const p of this.targets)this.lob(ctx,p,m);
  if(m.type==='marks')for(const p of this.targets){ctx.vfx.field('energy',p,m.radius!*.8);for(let i=0;i<6;i++)ctx.vfx.shard(p.clone().setY(.2),tmp.set(rnd(-1,1),rnd(1,2),rnd(-1,1)).normalize().multiplyScalar(rnd(2,5)),.8);
   if(Math.hypot(p.x-ctx.player.x,p.z-ctx.player.z)<m.radius!&&!ctx.invuln())ctx.damagePlayer(m.dmg,p);}
  if(m.type==='burrow'){const p=this.targets[Math.floor(Math.random()*this.targets.length)];this.pos.set(p.x,0,p.z);this.hidden=0;ctx.vfx.shake=.45;
   for(let i=0;i<14;i++)ctx.vfx.shard(p.clone().setY(.3),tmp.set(rnd(-1,1),rnd(1,2),rnd(-1,1)).normalize().multiplyScalar(rnd(4,8)),1.3);
   ctx.vfx.puff({pos:p.clone().setY(.5),n:20,speed:[1.5,4],up:.3,life:[.8,1.4],size:[.8,2.2],c0:'#a08a62',c1:'#5a4a32',a:[.6,0],drag:2,spread:1});
   for(const q of this.targets)if(Math.hypot(q.x-ctx.player.x,q.z-ctx.player.z)<m.radius!&&q===p&&!ctx.invuln())ctx.damagePlayer(m.dmg,p);}
 }
 private toRecover(){this.state='recover';this.timer=this.mv.recover;this.vel.multiplyScalar(.2);this.look.body.position.y=Math.max(0,this.look.body.position.y);this.look.mandibles?.forEach((m,i)=>m.rotation.z=(i?1:-1)*.5);}
 private turn(target:number,dt:number,rate:number){let d=target-this.heading;d=Math.atan2(Math.sin(d),Math.cos(d));this.heading+=d*Math.min(1,dt*rate);}
 // procedural motion: legs step in a wave, wings beat, the worm undulates out of the ground
 private pose(dead:boolean){
  const L=this.look;
  if(L.halo){L.halo.forEach((h,i)=>{if(i<3){h.rotation.set(Math.PI/2+Math.sin(this.t*.7+i)*.6,this.t*(.8+i*.4),Math.cos(this.t*.5+i)*.5);}else{const a=(i-3)/8*Math.PI*2+this.t*(this.phase===2?1.6:.8);h.position.set(Math.cos(a)*1.9,2.6+Math.sin(this.t*2+i)*.3,Math.sin(a)*1.9);h.rotation.y+=.05;}});L.body.position.y=Math.sin(this.t*1.6)*.15+.3;}
  if(L.wings){const f=Math.sin(this.t*(this.state==='act'?9:5));L.wings.forEach((w,i)=>w.rotation.z=(i?-1:1)*(f*.6+.1));}
  if(L.segs){const h=this.hidden;L.segs.forEach((sg,i)=>{const k=i/(L.segs!.length-1);sg.position.set(Math.sin(this.t*2+i*.7)*.25,(2.4-k*2.6)*(1-h)-h*2.5+ (dead?-1:0),-k*2.2+.6);});}
  if(L.arms&&this.state!=='wind'&&this.state!=='act'&&this.state!=='recover')L.arms.forEach((a,i)=>a.rotation.x=Math.sin(this.gait+i*Math.PI)*.35);
  if(!L.legs.length)return;
  L.body.updateMatrixWorld(true);
  for(const leg of L.legs){
   const hip=L.body.localToWorld(leg.hip.clone());
   const ph=this.gait+leg.phase,step=dead?0:Math.sin(ph)*.32*leg.len,lift=dead?0:Math.max(0,Math.cos(ph))*.18*leg.len;
   const reach=dead?.35:.78;
   const footL=leg.hip.clone().addScaledVector(leg.out,leg.len*reach).add(new T.Vector3(0,0,step));footL.y=dead?leg.hip.y+.1:lift;
   const foot=L.body.localToWorld(footL);if(!dead)foot.y=lift;
   const knee=hip.clone().lerp(foot,.45);knee.y=Math.max(hip.y,foot.y)+leg.knee*this.spec.scale*(dead?.3:1);
   orient(leg.up,this.g.worldToLocal(hip.clone()),this.g.worldToLocal(knee.clone()),leg.r);
   orient(leg.low,this.g.worldToLocal(knee.clone()),this.g.worldToLocal(foot.clone()),leg.r*.75);
  }
 }
 private shoot(ctx:Ctx,dir:T.Vector3,m:Move){
  const from=this.pos.clone().setY(.95*this.spec.scale).addScaledVector(dir,.75*this.spec.scale),c=m.color??'#9dff4a';
  const mesh=new T.Mesh(new T.SphereGeometry(.16,12,10),new T.MeshStandardMaterial({color:c,emissive:c,emissiveIntensity:2}));mesh.position.copy(from);this.scene.add(mesh);
  shots.push({m:mesh,v:dir.clone().multiplyScalar(11),life:1.4,dmg:m.dmg,color:c});
  ctx.vfx.emit({pos:from,n:10,dir,cone:.4,speed:[2,5],life:[.15,.3],size:[.15,.03],c0:'#ffffff',c1:c,a:[1,0],drag:3});
 }
 private lob(_ctx:Ctx,to:T.Vector3,m:Move){
  const from=this.pos.clone().setY(1.6*this.spec.scale),c=m.color??'#ff7a2a';
  const mesh=new T.Mesh(new T.DodecahedronGeometry(.28,0),new T.MeshStandardMaterial({color:'#2a1a12',emissive:c,emissiveIntensity:1.6}));mesh.position.copy(from);this.scene.add(mesh);
  shots.push({m:mesh,v:new T.Vector3(),life:2,dmg:m.dmg,color:c,arc:{from,to:to.clone(),t:0,dur:.75,r:m.radius!}});
  this.addTele(disc(m.radius!),to,0);const te=this.tele[this.tele.length-1];this.tele.pop();(te.material as T.ShaderMaterial).uniforms.uK.value=1;
  setTimeout(()=>{te.removeFromParent();te.geometry.dispose();(te.material as T.Material).dispose();},800);
 }
 dispose(){this.clearTele();this.g.removeFromParent();}
}
// creature projectiles: globs blocked by rocks/props, lobbed magma that bursts where announced
export function updateSpits(dt:number,ctx:Ctx){
 const cols=ctx.colliders();
 for(let i=shots.length-1;i>=0;i--){
  const s=shots[i],p=s.m.position;let end=false;
  if(s.arc){const a=s.arc;a.t+=dt;const k=Math.min(1,a.t/a.dur);p.lerpVectors(a.from,a.to,k);p.y=a.from.y*(1-k)+Math.sin(k*Math.PI)*4;s.m.rotation.x+=dt*8;
   ctx.vfx.fire.add({p,kind:1,w:.7,h:.7,life:.12,grow:-.3});
   if(k>=1){end=true;ctx.vfx.impact('fire',p,UP);ctx.vfx.scorch(p,a.r,1.6);ctx.vfx.shake=Math.max(ctx.vfx.shake,.15);if(Math.hypot(p.x-ctx.player.x,p.z-ctx.player.z)<a.r&&!ctx.invuln())ctx.damagePlayer(s.dmg,p);}}
  else{
   p.addScaledVector(s.v,dt);s.life-=dt;end=s.life<=0;
   ctx.vfx.emit({pos:p,n:1,dir:s.v.clone().negate(),cone:.4,speed:[.3,1],life:[.25,.4],size:[.12,.03],c0:'#ffffff',c1:s.color,a:[.9,0],grav:3});
   for(const c of cols)if(Math.hypot(p.x-c.x,p.z-c.z)<c.r){end=true;break;}
   if(!end&&Math.hypot(p.x-ctx.player.x,p.z-ctx.player.z)<.55){end=true;if(!ctx.invuln())ctx.damagePlayer(s.dmg,p);}
   if(end){ctx.vfx.emit({pos:p,n:18,speed:[1.5,4],up:.6,life:[.3,.6],size:[.14,.04],c0:'#ffffff',c1:s.color,a:[1,0],grav:9});ctx.vfx.decal(p,s.color,.7,.6);}
  }
  if(end){s.m.removeFromParent();s.m.geometry.dispose();(s.m.material as T.Material).dispose();shots.splice(i,1);}
 }
}
export function clearShots(){for(const s of shots){s.m.removeFromParent();}shots.length=0;}
