import * as T from 'three';
import {mergeVertices,mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
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
 crawler:{name:'Rastejante Hollow',hp:70,speed:3.1,radius:.6,scale:1,body:'crawler',pal:P('#4a4258','#ffa040'),moves:[{type:'bite',dmg:10,range:1.7,windup:.5,recover:.6,arc:1.6}]},
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
 vesper:{name:'Vésper, o Sopro Branco',hp:1300,speed:2.4,radius:1.4,scale:1,body:'winged',pal:P('#d8e4ee','#8fe8ff'),boss:true,fly:.25,moves:[
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
 popText:(p:T.Vector3,s:string,c:string)=>void;sfx?:(name:string,p:T.Vector3)=>void;onKill:(c:Creature)=>void;onHit:(c:Creature,quiet:boolean)=>void;others:Creature[];
}
const rnd=(a:number,b:number)=>a+Math.random()*(b-a);
const UP=new T.Vector3(0,1,0),tmp=new T.Vector3(),tmp2=new T.Vector3();
// limb segment: a lathed, muscled taper (thick near the joint, slim toward the next one)
const segGeo=new T.LatheGeometry([[0,0],[.9,.01],[1.15,.18],[1.1,.4],[.85,.7],[.68,.92],[.55,1],[0,1]].map(([x,y])=>new T.Vector2(x,y)),12);
// ---- sculpt kit: noise-displaced volumes, curved armour scutes, clawed feet ----
const hash3=(x:number,y:number,z:number)=>{const h=Math.sin(x*127.1+y*311.7+z*74.7)*43758.5453;return h-Math.floor(h);};
function vnoise(x:number,y:number,z:number){const ix=Math.floor(x),iy=Math.floor(y),iz=Math.floor(z),fx=x-ix,fy=y-iy,fz=z-iz;const u=fx*fx*(3-2*fx),v=fy*fy*(3-2*fy),w=fz*fz*(3-2*fz);
 const L=(a:number,b:number,t:number)=>a+(b-a)*t;
 return L(L(L(hash3(ix,iy,iz),hash3(ix+1,iy,iz),u),L(hash3(ix,iy+1,iz),hash3(ix+1,iy+1,iz),u),v),L(L(hash3(ix,iy,iz+1),hash3(ix+1,iy,iz+1),u),L(hash3(ix,iy+1,iz+1),hash3(ix+1,iy+1,iz+1),u),v),w);}
const fbm3=(x:number,y:number,z:number)=>vnoise(x,y,z)*.6+vnoise(x*2.1,y*2.1,z*2.1)*.3+vnoise(x*4.3,y*4.3,z*4.3)*.1;
const geoCache=new Map<string,T.BufferGeometry>();
function lumpGeo(r:number,amp:number,freq:number,seed:number){
 const k=[r,amp,freq,seed].join('|');let g=geoCache.get(k);if(g)return g;
 g=new T.IcosahedronGeometry(r,3);g.deleteAttribute('normal');g.deleteAttribute('uv');g=mergeVertices(g);
 const p=g.attributes.position as T.BufferAttribute,v=new T.Vector3();
 for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i);const n=v.clone().normalize();const d=(fbm3(n.x*freq+seed,n.y*freq+seed*.7,n.z*freq-seed)-.5)*2*amp*r;v.addScaledVector(n,d);p.setXYZ(i,v.x,v.y,v.z);}
 g.computeVertexNormals();geoCache.set(k,g);return g;
}
function lump(r:number,m:T.Material,pos:[number,number,number],sc:[number,number,number]=[1,1,1],amp=.14,freq=2.2,seed=1){const b=new T.Mesh(lumpGeo(r,amp,freq,seed),m);b.position.set(...pos);b.scale.set(...sc);b.castShadow=true;return b;}
// one curved armour plate cut from a sphere; vertex colour darkens the middle and lightens the worn rim
function scuteGeo(R:number,phi0:number,phiL:number,th0:number,thL:number,rim:string){
 const k=['sc',R,phi0,phiL,th0,thL,rim].join('|');let g=geoCache.get(k);if(g)return g;
 g=new T.SphereGeometry(R,10,8,phi0,phiL,th0,thL);const uv=g.attributes.uv as T.BufferAttribute,p=g.attributes.position as T.BufferAttribute,c=new T.Color(rim),col:number[]=[],v=new T.Vector3();
 for(let i=0;i<uv.count;i++){const u=uv.getX(i),w=uv.getY(i),e=Math.min(u,1-u,w,1-w);
  // bulge the plate's middle outward so each scute reads as a separate shield
  v.fromBufferAttribute(p,i);v.multiplyScalar(1+Math.sin(Math.min(1,e*2.2)*Math.PI/2)*.13);p.setXYZ(i,v.x,v.y,v.z);
  const seam=Math.min(1,e/.05),band=1-Math.min(1,Math.abs(e-.11)/.07),f=.35+.65*seam;const w2=band*.75;col.push((1+(c.r-1)*w2)*f,(1+(c.g-1)*w2)*f,(1+(c.b-1)*w2)*f);}
 g.setAttribute('color',new T.Float32BufferAttribute(col,3));g.computeVertexNormals();geoCache.set(k,g);return g;
}
// a dome of overlapping scutes (2D carapace / hollow shells)
function shell(body:T.Group,m:T.Material,R:number,pos:[number,number,number],sc:[number,number,number],rows:number,rim:string,seed=0,o:{cover?:number;gap?:number}={}){
 const cover=o.cover??.5,gap=o.gap??1.12,key=['shell',R,rows,rim,seed,cover,gap].join('|');
 let geo=geoCache.get(key);
 if(!geo){
  // every scute slightly turned so the armour never reads as a grid; merged into one mesh per shell
  const parts:T.BufferGeometry[]=[],mt=new T.Matrix4(),e=new T.Euler(),q=new T.Quaternion();let k=0;
  for(let r=0;r<rows;r++){const th0=r/rows*Math.PI*cover,thL=Math.PI*cover/rows*(gap>1?1.2:gap),n=Math.max(1,Math.round(3+Math.min(r,rows-1-r*(cover>.6?1:0))*1.7+(cover>.6?2:0)));
   for(let i=0;i<n;i++){const ph=(i+(r%2)*.5)/n*Math.PI*2+seed,pl=Math.PI*2/n*gap;k++;
    const j=(x:number)=>(hash3(k,seed,x)-.5);e.set(j(1)*.22,j(2)*.3,j(3)*.22);q.setFromEuler(e);mt.compose(new T.Vector3(),q,new T.Vector3(1,1,1));
    parts.push(scuteGeo(R*(1+.02*r),ph,pl,th0,thL,rim).clone().applyMatrix4(mt));}}
  geo=mergeGeometries(parts.map(g=>g.index?g.toNonIndexed():g))!;geoCache.set(key,geo);
 }
 const sm=new T.Mesh(geo,m);sm.position.set(...pos);sm.scale.set(...sc);sm.castShadow=true;sm.receiveShadow=true;body.add(sm);
 return sm;
}
function clawGeo(){let g=geoCache.get('claw');if(g)return g;
 const parts:T.BufferGeometry[]=[];
 const pad=new T.SphereGeometry(1,10,8);pad.scale(1,.55,1.3);pad.translate(0,.3,.15);parts.push(pad);
 for(const x of[-.55,0,.55]){const c=new T.ConeGeometry(.28,1.2,7);c.translate(0,.6,0);c.rotateX(Math.PI/2+.5);c.translate(x,.35,.9);parts.push(c);}
 for(const q of parts){q.deleteAttribute('uv');}
 g=mergeGeometries(parts.map(q=>q.index?q.toNonIndexed():q))!;g.computeVertexNormals();geoCache.set('claw',g);return g;}
// skin: object-space bumps and blotches + a rim of the creature's glow colour so silhouettes read on dark ground
function skin(m:T.MeshStandardMaterial,rim:string,bump=.6,freq=6,o:{veins?:string;lichen?:string}={}){
 m.onBeforeCompile=sh=>{
  sh.uniforms.uRim={value:new T.Color(rim)};sh.uniforms.uBump={value:bump};sh.uniforms.uFreq={value:freq};sh.uniforms.uVein={value:new T.Color(o.veins??'#000000')};sh.uniforms.uLichen={value:new T.Color(o.lichen??'#000000')};
  sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vOP;').replace('#include <begin_vertex>','#include <begin_vertex>\nvOP=position*vec3(length(modelMatrix[0].xyz),length(modelMatrix[1].xyz),length(modelMatrix[2].xyz));');
  sh.fragmentShader=sh.fragmentShader.replace('#include <common>',`#include <common>
   varying vec3 vOP;uniform vec3 uRim;uniform float uBump;uniform float uFreq;uniform vec3 uVein;uniform vec3 uLichen;
   float h3(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}
   float n3(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(mix(h3(i),h3(i+vec3(1,0,0)),f.x),mix(h3(i+vec3(0,1,0)),h3(i+vec3(1,1,0)),f.x),f.y),mix(mix(h3(i+vec3(0,0,1)),h3(i+vec3(1,0,1)),f.x),mix(h3(i+vec3(0,1,1)),h3(i+vec3(1,1,1)),f.x),f.y),f.z);}
   float skinH(vec3 p){return n3(p)*.7+n3(p*2.2)*.3;}`)
  .replace('#include <normal_fragment_maps>',`#include <normal_fragment_maps>
   {float hh=skinH(vOP*uFreq);vec3 vp=-vViewPosition;vec3 dpx=dFdx(vp),dpy=dFdy(vp);float dhx=dFdx(hh),dhy=dFdy(hh);
    vec3 r1=cross(dpy,normal),r2=cross(normal,dpx);float det=dot(dpx,r1);vec3 gr=sign(det)*(dhx*r1+dhy*r2);
    normal=normalize(abs(det)*normal-gr*uBump);
    float blot=n3(vOP*uFreq*.35);diffuseColor.rgb*=mix(.88,1.06,blot)*mix(.84,1.,smoothstep(.25,.6,hh));
    float li=smoothstep(.64,.72,n3(vOP*uFreq*1.1+7.));diffuseColor.rgb=mix(diffuseColor.rgb,uLichen,li*step(.01,uLichen.r+uLichen.g+uLichen.b)*.85);}`)
  .replace('#include <emissivemap_fragment>',`#include <emissivemap_fragment>
   {float fr=1.-abs(dot(normal,normalize(vViewPosition)));totalEmissiveRadiance+=uRim*pow(fr,3.)*.35;
    float vr=1.-abs(n3(vOP*uFreq*.45+3.)*2.-1.);totalEmissiveRadiance+=uVein*pow(vr,10.)*2.2;}`);
 };
 m.customProgramCacheKey=()=>'skin'+bump+freq+(o.veins?'v':'')+(o.lichen?'l':'');return m;
}
function orient(m:T.Mesh,a:T.Vector3,b:T.Vector3,r:number){const d=tmp.copy(b).sub(a),l=d.length();m.position.copy(a);m.quaternion.setFromUnitVectors(UP,d.normalize());m.scale.set(r,l,r);}

interface Leg{hip:T.Vector3;out:T.Vector3;len:number;phase:number;up:T.Mesh;low:T.Mesh;r:number;knee:number;foot:T.Mesh}
interface Look{chitin:T.MeshStandardMaterial;glow:T.MeshStandardMaterial;body:T.Group;legs:Leg[];sac?:T.Mesh;mandibles?:T.Mesh[];height:number;wings?:T.Object3D[];arms?:T.Object3D[];segs?:T.Mesh[];halo?:T.Object3D[];limbs?:T.Object3D[]}
type Pal=Spec['pal'];
function chitin(p:Pal){const m=skin(new T.MeshStandardMaterial({color:p.c,roughness:p.wet?.22:.55,metalness:p.wet?.1:.12,emissive:'#000000',emissiveIntensity:1}),p.g,.3,3.2);m.userData.chitin=true;return m;}
// limbs and claws: a paler, horny tone like the 2D creatures' legs
function horn(c:string){return skin(new T.MeshStandardMaterial({color:c,roughness:.6,metalness:.05}),'#000000',.25,4);}
function plates(c:string,rim:string){const m=skin(new T.MeshStandardMaterial({color:c,roughness:.5,metalness:.15,vertexColors:true}),rim,.2,3);return m;}
function glowMat(color:string,i=1.6){return new T.MeshStandardMaterial({color,emissive:color,emissiveIntensity:i,roughness:.3});}
function ball(r:number,m:T.Material,p:[number,number,number],s:[number,number,number]=[1,1,1]){const b=new T.Mesh(m.userData.chitin?lumpGeo(r,.08,2.4,r*7):new T.SphereGeometry(r,18,12),m);b.position.set(...p);b.scale.set(...s);b.castShadow=true;return b;}
function cone(r:number,h:number,m:T.Material,p:[number,number,number],rot:[number,number,number]){const c=new T.Mesh(new T.ConeGeometry(r,h,7),m);c.position.set(...p);c.rotation.set(...rot);c.castShadow=true;return c;}
function addLegs(g:T.Group,m:T.Material,defs:[number,number,number,number,number][],r:number,knee:number,clawM?:T.Material):Leg[]{
 return defs.map(([x,y,z,ang,len],i)=>{const up=new T.Mesh(segGeo,m),low=new T.Mesh(segGeo,m),foot=new T.Mesh(clawGeo(),clawM??m);up.castShadow=low.castShadow=foot.castShadow=true;foot.scale.setScalar(r*1.1);g.parent!.add(up,low,foot);
  return {hip:new T.Vector3(x,y,z),out:new T.Vector3(Math.cos(ang),0,Math.sin(ang)),len,phase:(i%2)*Math.PI+(i>2?Math.PI:0),up,low,r,knee,foot};});
}
const six=(x:number,y:number,z:number,len:number):[number,number,number,number,number][]=>[[x,y,z,.45,len],[x*1.1,y,0,0,len*1.1],[x,y,-z*.8,-.45,len],[-x,y,z,Math.PI-.45,len],[-x*1.1,y,0,Math.PI,len*1.1],[-x,y,-z*.8,Math.PI+.45,len]];
const four=(x:number,y:number,z:number,len:number,back=len):[number,number,number,number,number][]=>[[x,y,z,.55,len],[-x,y,z,Math.PI-.55,len],[x,y,-z,-.5,back],[-x,y,-z,Math.PI+.5,back]];

// Hollow (2D: hollow-v3): a squat rock-turtle of stacked violet plates, a gold-rimmed socket glowing on its back, pale clawed legs
function buildCrawler(root:T.Group,p:Pal):Look{
 const ch=chitin(p),gl=glowMat(p.g),body=new T.Group();root.add(body);const pl=plates(p.c,'#8a7aa8'),hn=horn('#cdb48c');
 body.add(lump(.55,ch,[0,.55,0],[1,.6,1.15],.12,2,3));
 shell(body,pl,.62,[0,.5,-.05],[1.05,.95,1.2],3,'#b8a8d0',.4);
 const rim=new T.Mesh(new T.TorusGeometry(.2,.055,10,24),new T.MeshStandardMaterial({color:'#c89a50',roughness:.35,metalness:.7}));rim.position.set(.05,1.08,.05);rim.rotation.x=-1.2;body.add(rim);
 body.add(ball(.16,gl,[.05,1.06,.07],[1,.55,1]));
 const head=lump(.22,ch,[0,.5,.78],[1,.75,1],.15,3,5);body.add(head);
 const mand:T.Mesh[]=[];for(const s of[-1,1]){const c=new T.Mesh(clawGeo(),hn);c.scale.setScalar(.12);c.position.set(s*.12,.38,.9);c.rotation.set(0,s*.35,0);body.add(c);mand.push(c);body.add(ball(.04,gl,[s*.1,.6,.95]));}
 body.add(cone(.09,.35,ch,[0,.95,-.55],[-1.2,0,0]));
 return {chitin:ch,glow:gl,body,legs:addLegs(body,hn,four(.45,.45,.42,.62),.15,.22,hn),mandibles:mand,height:1.2};
}
// Saltador (2D: dante-skitter): a lean jumper, segmented back, long hind legs
function buildSkitter(root:T.Group,p:Pal):Look{
 const ch=chitin(p),gl=glowMat(p.g,2),body=new T.Group();root.add(body);const hn=horn('#b8a07a');
 body.add(lump(.28,ch,[0,.62,0],[1,.75,1.35],.15,2.5,31));body.add(lump(.18,ch,[0,.66,.42],[1,.85,1.1],.15,3,32));
 shell(body,plates(p.c,p.g),.3,[0,.62,-.05],[1,.9,1.4],2,p.g,.3);
 for(const s of[-1,1])body.add(ball(.04,gl,[s*.08,.72,.56]));
 body.add(cone(.08,.7,ch,[0,.72,-.55],[-1.9,0,0]));
 return {chitin:ch,glow:gl,body,legs:addLegs(body,hn,four(.18,.58,.22,.62,1.0),.07,.42,hn),height:.9};
}
// Cuspidor (2D: dante-spitter): lumpy hide, a translucent egg-sac on the back studded with crystals, a frilled mouth
function buildSpitter(root:T.Group,p:Pal):Look{
 const ch=chitin(p),gl=glowMat(p.g,1.3),body=new T.Group();root.add(body);const hn=horn('#8a9a6a');
 body.add(lump(.5,ch,[0,.7,.1],[1,.75,1.25],.16,2.4,9));
 const sacM=new T.MeshStandardMaterial({color:p.s??p.g,emissive:p.s??p.g,emissiveIntensity:.18,roughness:.15,transparent:true,opacity:.92});
 const sac=lump(.42,sacM,[0,1.12,-.25],[1,.85,1.2],.12,3,4);body.add(sac);
 const cry=new T.MeshStandardMaterial({color:'#6a4a9a',emissive:'#8a5adf',emissiveIntensity:.5,roughness:.2,flatShading:true});
 for(let i=0;i<7;i++){const a=i*2.1,d=new T.Vector3(Math.cos(a)*.6,.8,Math.sin(a)*.5-.2).normalize();const c=new T.Mesh(new T.OctahedronGeometry(.09,0),cry);c.scale.set(1,2,1);c.position.set(d.x*.42,1.12+d.y*.3,-.25+d.z*.42);c.quaternion.setFromUnitVectors(UP,d);body.add(c);}
 const head=lump(.3,ch,[0,.75,.75],[1,.85,1],.18,3,2);body.add(head);
 for(let i=0;i<6;i++){const a=i/6*Math.PI*2;const f=cone(.06,.26,horn('#e08a6a'),[Math.cos(a)*.16,.78+Math.sin(a)*.14,1.02],[Math.PI/2+Math.sin(a)*.5,0,-Math.cos(a)*.5]);body.add(f);}
 body.add(ball(.08,gl,[0,.78,1.04]));
 return {chitin:ch,glow:gl,body,legs:addLegs(body,hn,four(.42,.52,.34,.7),.15,.25,hn),sac,height:1.5};
}
// Casco Errante (2D: carapace-v1): domed shell of olive scutes with orange seams, pale muscular limbs, two heavy pincers
function buildCarapace(root:T.Group,p:Pal):Look{
 const ch=chitin(p),gl=glowMat(p.g,1.4),body=new T.Group();root.add(body);
 const pl=plates(p.c,p.g),hn=horn('#c8b49a');
 body.add(lump(.85,horn('#8a6a7a'),[0,.62,0],[1.05,.55,1.2],.1,2.5,2));
 shell(body,pl,1,[0,.55,-.1],[1.1,.85,1.3],4,p.g,.2);
 body.add(lump(.34,hn,[0,.55,1.2],[1.1,.8,1],.18,3,7));
 for(const s of[-1,1])body.add(ball(.05,gl,[s*.14,.66,1.5]));
 // pincers: a thick forearm lump and a claw pair
 const arms:T.Object3D[]=[];
 for(const s of[-1,1]){const a=new T.Group();a.position.set(s*.75,.55,.95);body.add(a);
  a.add(lump(.26,hn,[0,0,.25],[1,1,1.6],.15,3,s+4));
  const c=new T.Mesh(clawGeo(),hn);c.scale.set(.42,.42,.55);c.position.set(0,-.15,.55);a.add(c);arms.push(a);}
 return {chitin:ch,glow:gl,body,legs:addLegs(body,hn,four(.78,.42,.5,.85,.9),.24,.26,hn),arms,height:1.6};
}
// Rasga-brasa (2D: ember-hound): a low, muscled beast with black rock plates along its spine, lava glowing in the seams
function buildHound(root:T.Group,p:Pal):Look{
 const ch=chitin(p),gl=glowMat(p.g,2.2),body=new T.Group();root.add(body);const rock=skin(new T.MeshStandardMaterial({color:'#221c1c',roughness:.45,metalness:.2}),p.g,.5,8),hn=horn('#3a2a26');
 body.add(lump(.42,ch,[0,.68,.15],[.95,.75,1.55],.14,2.4,11));
 body.add(lump(.36,ch,[0,.72,.62],[1.05,.85,.9],.14,2.6,12));
 const head=lump(.26,ch,[0,.7,1.05],[.9,.75,1.3],.16,3,13);body.add(head);
 const jaw=lump(.18,hn,[0,.52,1.2],[1,.5,1.4],.12,3,14);body.add(jaw);
 body.add(ball(.08,gl,[0,.58,1.3],[1.6,.5,1.2]));for(const s of[-1,1])body.add(ball(.035,gl,[s*.12,.78,1.32]));
 for(let i=0;i<7;i++){const z=.9-i*.26,h=.18+Math.sin(i/6*Math.PI)*.22;for(const s of[-1,1]){const c=cone(.07,h+.1,rock,[s*.1,.98-Math.abs(i-3)*.02,z],[-.5,0,s*.35]);body.add(c);}body.add(ball(.05,gl,[0,.92,z],[1.2,.5,1.6]));}
 for(let i=0;i<5;i++)body.add(lump(.14-i*.022,ch,[0,.72-i*.02,-.45-i*.24],[1,1,1.3],.15,3,20+i));
 body.add(cone(.05,.3,rock,[0,.7,-1.6],[-1.7,0,0]));
 return {chitin:ch,glow:gl,body,legs:addLegs(body,ch,[[.3,.62,.6,1.35,.55],[-.3,.62,.6,Math.PI-1.35,.55],[.28,.62,-.4,-1.45,.5],[-.28,.62,-.4,Math.PI+1.45,.5]],.16,.06,hn),mandibles:[jaw],height:1.1};
}
// Vigia das Margens: a broad, wet salamander of the river banks with a low crest and glowing spots
function buildAmphibian(root:T.Group,p:Pal):Look{
 const ch=chitin(p),gl=glowMat(p.g,1.2),body=new T.Group();root.add(body);const belly=horn('#c8b890');
 body.add(lump(.5,ch,[0,.45,0],[1.1,.5,1.6],.1,2.2,91));body.add(lump(.4,belly,[0,.32,.05],[1.05,.35,1.4],.08,2,92));
 const head=lump(.36,ch,[0,.48,.82],[1.35,.55,1],.1,2.4,93);body.add(head);
 for(const s of[-1,1]){body.add(lump(.1,ch,[s*.3,.66,.86],[1,1,1],.1,3,94+s));body.add(ball(.055,gl,[s*.31,.7,.92]));}
 for(let i=0;i<7;i++)body.add(cone(.06,.2-Math.abs(i-3)*.02,ch,[0,.7-Math.abs(i-2)*.01,.5-i*.22],[-.3,0,0]));
 for(let i=0;i<10;i++)body.add(ball(.035,gl,[Math.sin(i*2.3)*.38,.62,.45-i*.12]));
 for(let i=0;i<6;i++){const k=i/5;body.add(lump(.22-k*.16,ch,[Math.sin(k*2)*.2,.38-k*.15,-.9-i*.32],[1,.7,1.3],.1,3,98+i));}
 const arm=lump(.12,ch,[0,.36,1.12],[1.6,.4,.8],.1,3,105);body.add(arm);
 return {chitin:ch,glow:gl,body,legs:addLegs(body,ch,four(.5,.42,.45,.62),.13,.18,belly),mandibles:[arm],height:1};
}
// Espinhante (2D: dante-thorn): an upright raptor of olive bark, beaked head, violet throat sac, orange-tipped quills, curled spiked tail
function buildThorn(root:T.Group,p:Pal):Look{
 const ch=chitin(p),gl=glowMat(p.g,2),body=new T.Group();root.add(body);const hn=horn('#d8cfb0'),bark=skin(new T.MeshStandardMaterial({color:'#5a6236',roughness:.7}),p.g,.4,3.5);
 const tip=new T.MeshStandardMaterial({color:'#e8902a',emissive:'#ff8a1a',emissiveIntensity:.6,roughness:.4});
 body.add(lump(.34,bark,[0,1.25,-.05],[1,1.25,.9],.16,2.6,61));
 body.add(lump(.28,bark,[0,.95,-.15],[1.05,.8,1],.16,2.6,62));
 const sac=lump(.2,new T.MeshStandardMaterial({color:'#7a5ad8',emissive:'#8a5aff',emissiveIntensity:.5,roughness:.2,transparent:true,opacity:.9}),[0,1.45,.22],[1,1.2,.8],.1,3,63);body.add(sac);
 body.add(lump(.2,hn,[0,1.78,.18],[.9,.85,1.3],.12,3,64));
 body.add(cone(.08,.32,hn,[0,1.72,.45],[Math.PI/2+.5,0,0]));
 for(const s of[-1,1])body.add(ball(.035,glowMat('#ffb030',2),[s*.1,1.82,.3]));
 for(let i=0;i<7;i++){const a=(i-3)*.28,len=.7+Math.abs(Math.sin(i*1.7))*.3;const d=new T.Vector3(Math.sin(a)*.6,1,-.55).normalize();
  const q=cone(.045,len,bark,[Math.sin(a)*.12+d.x*len*.5,1.5+d.y*len*.5,-.25+d.z*len*.5],[0,0,0]);q.quaternion.setFromUnitVectors(UP,d);body.add(q);
  const t=cone(.05,.16,tip,[Math.sin(a)*.12+d.x*(len+.05),1.5+d.y*(len+.05),-.25+d.z*(len+.05)],[0,0,0]);t.quaternion.setFromUnitVectors(UP,d);body.add(t);}
 for(let i=0;i<9;i++){const k=i/8,a=k*Math.PI*1.4;const x=0,y=.75-Math.sin(a)*.35+k*.25,z=-.4-Math.sin(a*.7)*.9-k*.2;body.add(lump(.13-k*.08,bark,[x,y,z],[1,1,1.2],.15,3,70+i));
  if(i%2===0)body.add(cone(.03,.16,tip,[x,y+.12,z],[-.3,0,0]));}
 const arms:T.Object3D[]=[];for(const s of[-1,1]){const a=new T.Group();a.position.set(s*.25,1.3,.12);body.add(a);a.add(lump(.07,bark,[0,-.15,.05],[1,2.2,1],.15,3,80+s));a.add(cone(.025,.12,hn,[0,-.34,.1],[Math.PI*.7,0,0]));arms.push(a);}
 return {chitin:ch,glow:gl,body,legs:addLegs(body,bark,[[.16,.85,-.1,1.15,.5],[-.16,.85,-.1,Math.PI-1.15,.5]],.11,.12,hn),arms,height:2};
}
function buildGolem(root:T.Group,p:Pal):Look{
 const ch=skin(new T.MeshStandardMaterial({color:'#6e5040',roughness:.85,metalness:.05}),p.g,.45,1.6,{veins:p.g});ch.userData.chitin=true;
 const slab=skin(new T.MeshStandardMaterial({color:'#7a5a46',roughness:.8,metalness:.05,vertexColors:true}),p.g,.5,2.2);
 const gl=glowMat(p.g,2.4),magma=glowMat('#ff5a10',1.6),body=new T.Group();root.add(body);
 const R=(r:number,pos:[number,number,number],sc:[number,number,number],seed:number,to:T.Object3D=body)=>{const m=lump(r,ch,pos,sc,.22,1.5,seed);to.add(m);return m;};
 const molten=(r:number,pos:[number,number,number],sc:[number,number,number],rows:number,to:T.Group=body,seed=0)=>{to.add(lump(r*.9,magma,pos,sc,.1,2,seed+90));shell(to,slab,r,pos,sc,rows,'#3a2a22',seed,{cover:1,gap:.86});};
 R(.7,[0,1.75,0],[1.25,.6,.95],1);
 molten(1.05,[0,2.75,.05],[1.35,1.05,1],5,body,1);
 R(.62,[0,3.55,0],[1.75,.6,1.15],3);
 for(const s of[-1,1])molten(.45,[s*.95,3.6,0],[1,1.05,1.1],3,body,4+s);
 R(.36,[0,3.62,.62],[1.05,.85,1],6);
 for(const s of[-1,1])body.add(ball(.07,gl,[s*.15,3.7,.92]));
 body.add(ball(.28,gl,[0,2.85,1.05],[1,1.1,.35]));
 const arms:T.Object3D[]=[];
 for(const s of[-1,1]){const a=new T.Group();a.position.set(s*1.5,3.35,0);body.add(a);
  R(.48,[0,-.55,0],[.95,1.4,.95],10+s,a);R(.5,[0,-1.35,.08],[1,1.3,1],12+s,a);molten(.66,[0,-2.1,.15],[1.05,.95,1.05],3,a,14+s);arms.push(a);}
 return {chitin:ch,glow:gl,body,legs:addLegs(body,ch,[[.62,1.5,0,-.15,1.2],[-.62,1.5,0,Math.PI+.15,1.2]],.42,.1,ch),arms,height:4.3};
}
function buildWinged(root:T.Group,p:Pal):Look{
 const dark=skin(new T.MeshStandardMaterial({color:'#2e4a5a',roughness:.45,metalness:.2}),p.g,.35,4);dark.userData.chitin=true;
 const pl=plates('#e6eef4','#8fb8d0'),hn=horn('#20262c'),gl=glowMat(p.g,2),body=new T.Group();root.add(body);
 const ch=pl;
 body.add(lump(.6,dark,[0,1.2,0],[1,.85,1.7],.12,2.4,41));body.add(lump(.5,dark,[0,1.35,.85],[1.05,1,1],.12,2.4,42));
 shell(body,pl,.55,[0,1.3,-.15],[1.15,.85,1.9],2,'#9fc8e0',.3);
 const neck=[[0,1.75,1.25,.32],[0,2.05,1.55,.28],[0,2.25,1.85,.26]] as const;
 neck.forEach(([x,y,z,r],i)=>body.add(lump(r,i===2?pl:dark,[x,y,z],[1,1,1.15],.12,2.6,43+i)));
 body.add(lump(.3,ch,[0,2.35,2.15],[.9,.75,1.35],.1,2.8,47));
 body.add(cone(.1,.42,hn,[0,2.25,2.55],[Math.PI/2+.45,0,0]));
 for(const s of[-1,1]){body.add(ball(.05,gl,[s*.15,2.45,2.3]));for(let k=0;k<3;k++)body.add(cone(.05,.45-k*.08,pl,[s*(.12+k*.05),2.55-k*.02,2.0-k*.15],[-1.1,0,s*(.4+k*.15)]));}
 // tail: scaled segments curling up behind
 for(let i=0;i<8;i++){const k=i/7;body.add(lump(.3-k*.2,i%2?pl:dark,[Math.sin(k*2.2)*.35,1.0+Math.pow(k,2)*.45,-1.2-i*.42],[1,1,1.3],.12,3,50+i));}
 // feathered wings: a fan of long white blades per side
 const fm=skin(new T.MeshStandardMaterial({color:'#d8e6f0',roughness:.4,metalness:.15,side:T.DoubleSide}),p.g,.2,5);
 const wings:T.Object3D[]=[];
 for(const s of[-1,1]){const w=new T.Group();w.position.set(s*.45,1.8,.35);body.add(w);
  for(let k=0;k<7;k++){const len=1.2+k*.28,f=new T.Mesh(new T.ConeGeometry(.16,len,6),fm);f.geometry.translate(0,len/2,0);f.scale.set(1,1,.22);
   f.rotation.set(0,0,-s*(1.25-k*.08));f.rotation.y=s*(-.3+k*.13);f.position.set(s*(.05+k*.05),k*.02,-k*.12);f.castShadow=true;w.add(f);}
  wings.push(w);}
 return {chitin:dark,glow:gl,body,legs:addLegs(body,dark,four(.45,1.0,.75,1.05),.16,.28,hn),wings,height:2.8};
}
// O Soterrado (2D: soterrado-v1): a giant sand crab of overlapping golden scales, maroon flesh, dark scythe claws; it burrows
function buildWorm(root:T.Group,p:Pal):Look{
 const ch=chitin(p),gl=glowMat(p.g,2),body=new T.Group();root.add(body);
 const pl=plates('#8a5a2a','#c8883a'),sand=skin(new T.MeshStandardMaterial({color:'#8a5e30',roughness:.55,metalness:.1}),'#ffcf7a',.35,3),flesh=skin(new T.MeshStandardMaterial({color:'#5a1e22',roughness:.5}),'#ff6a3a',.4,4),dark=horn('#2a1e1a');
 body.add(lump(1.1,flesh,[0,1.05,0],[1.2,.6,1.3],.12,2,111));
 shell(body,pl,1.25,[0,1.1,-.1],[1.25,.8,1.35],4,'#d89a48',.5);
 for(let i=0;i<9;i++){const a=(i/9)*Math.PI*2;body.add(cone(.14,.7,dark,[Math.cos(a)*.9,2.0-Math.abs(Math.sin(a))*.15,Math.sin(a)*.8-.2],[-.6*Math.sin(a),0,.6*Math.cos(a)]));}
 body.add(lump(.5,sand,[0,1.0,1.35],[1.4,.7,.9],.12,2.5,112));
 for(const s of[-1,1])body.add(ball(.09,gl,[s*.3,1.18,1.75]));
 for(let k=0;k<6;k++)body.add(cone(.05,.25,dark,[(k-2.5)*.12,.82,1.75],[Math.PI*.55,0,0]));
 const arms:T.Object3D[]=[];
 for(const s of[-1,1]){const a=new T.Group();a.position.set(s*1.3,1.0,1.1);body.add(a);
  a.add(lump(.4,sand,[s*.1,0,.3],[1,.9,1.6],.15,2.5,115+s));
  const c=new T.Mesh(clawGeo(),dark);c.scale.set(.42,.42,.7);c.position.set(s*.15,-.15,.85);a.add(c);arms.push(a);}
 return {chitin:ch,glow:gl,body,legs:addLegs(body,sand,six(1.0,.95,.75,1.5),.2,.55,dark),arms,height:2.4};
}
// sculpted models (Blender, scripts/asset-tools/3d-new/make_*.py) preloaded by the game
export const MODELS:Record<string,T.Object3D>={};
function buildWardenModel(root:T.Group,src:T.Object3D):Look{
 if(!src.userData.smoothed){src.userData.smoothed=true;src.traverse(o=>{const me=o as T.Mesh;if(!me.isMesh)return;let g=me.geometry.clone();for(const k of Object.keys(g.attributes))if(k!=='position')g.deleteAttribute(k);g=mergeVertices(g,1e-3);g.computeVertexNormals();me.geometry=g;});}
 const m=src.clone(true);root.add(m);const body=new T.Group();root.add(body);body.add(m);
 let stone:T.MeshStandardMaterial|null=null,core:T.MeshStandardMaterial|null=null;
 m.traverse(o=>{const me=o as T.Mesh;if(!me.isMesh)return;me.castShadow=true;me.receiveShadow=true;
  const mats=(Array.isArray(me.material)?me.material:[me.material]) as T.MeshStandardMaterial[];
  const own=mats.map(x=>{const c=x.clone();if(/core/.test(x.name))core=c;else if(/stone/.test(x.name)&&!stone)stone=c;return c;});
  me.material=Array.isArray(me.material)?own:own[0];});
 m.traverse(o=>{const me=o as T.Mesh;if(!me.isMesh)return;const ms=(Array.isArray(me.material)?me.material:[me.material]) as T.MeshStandardMaterial[];ms.forEach(x=>{x.vertexColors=false;if(/stone/.test(x.name)){x.map=null;x.color.set('#6c6244');x.roughness=.8;x.metalness=.05;skin(x,'#3a2a48',.45,2.6,{lichen:'#b86a20'});}if(/flesh/.test(x.name)){x.map=null;x.color.set('#3e2a4e');x.roughness=.55;skin(x,'#b070ff',.3,3.5);}if(/core/.test(x.name)){x.emissiveIntensity=Math.min(x.emissiveIntensity,1.6);}x.needsUpdate=true;});});
 const n=(k:string)=>m.getObjectByName(k)!;
 return {chitin:stone??new T.MeshStandardMaterial(),glow:core??glowMat(Creature.coreColor),body,legs:[],arms:[n('arm_l'),n('arm_r')],limbs:[n('leg_l'),n('leg_r')],height:4.6};
}
function buildWarden(root:T.Group,p:Pal):Look{
 if(MODELS.warden)return buildWardenModel(root,MODELS.warden);
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
// merge the parts that never move on their own into one mesh per material (fewer draw calls per creature);
// geometry is cached per species, materials stay per creature (hit flashes, burn tint)
const bakeCache=new Map<string,T.BufferGeometry>();
function bakeBody(kind:string,L:Look){
 const keep=new Set<T.Object3D>([...(L.mandibles??[]),...(L.arms??[]),...(L.wings??[]),...(L.segs??[]),...(L.halo??[]),...(L.limbs??[])]);if(L.sac)keep.add(L.sac);
 const body=L.body;body.updateMatrixWorld(true);const inv=body.matrixWorld.clone().invert();
 const slots:T.Material[]=[],parts=new Map<T.Material,T.BufferGeometry[]>(),drop:T.Mesh[]=[];
 for(const c of [...body.children]){if(keep.has(c))continue;
  c.traverse(o=>{const m=o as T.Mesh;if(!m.isMesh||Array.isArray(m.material))return;const mat=m.material as T.MeshStandardMaterial;if(mat.transparent)return;
   if(!parts.has(mat)){parts.set(mat,[]);slots.push(mat);}
   const k=kind+':'+slots.indexOf(mat);if(!bakeCache.has(k)){let g=m.geometry.index?m.geometry.toNonIndexed():m.geometry.clone();
    for(const a of Object.keys(g.attributes))if(a!=='position'&&a!=='normal'&&!(a==='color'&&mat.vertexColors))g.deleteAttribute(a);
    if(mat.vertexColors&&!g.attributes.color){g=g.clone();g.setAttribute('color',new T.Float32BufferAttribute(new Float32Array(g.attributes.position.count*3).fill(1),3));}
    g.applyMatrix4(new T.Matrix4().multiplyMatrices(inv,m.matrixWorld));parts.get(mat)!.push(g);}
   drop.push(m);});}
 for(const m of drop)m.removeFromParent();
 slots.forEach((mat,i)=>{const k=kind+':'+i;let g=bakeCache.get(k);if(!g){const list=parts.get(mat)!;if(!list.length)return;g=mergeGeometries(list,false)!;bakeCache.set(k,g);}
  const mesh=new T.Mesh(g,mat);mesh.castShadow=true;mesh.receiveShadow=true;body.add(mesh);});
}
// the Domador's Simbionte (2D: dante-symbiont): a mossy hound with leaf-plate ears and violet tufts; legs pivot at the hips
export function petModel(){
 const g=new T.Group(),moss=skin(new T.MeshStandardMaterial({color:'#5a6a3a',roughness:.75}),'#7dff9e',.4,4),hide=horn('#8a8270'),leaf=plates('#6a7a3c','#9ab060'),leafS=skin(new T.MeshStandardMaterial({color:'#6a7a3c',roughness:.6}),'#7dff9e',.3,4);
 const tuft=new T.MeshStandardMaterial({color:'#9a7ad0',emissive:'#7a5ab0',emissiveIntensity:.25,roughness:.5,side:T.DoubleSide});
 g.add(lump(.3,moss,[0,.62,0],[1,.9,1.5],.12,2.4,131));shell(g,leaf,.34,[0,.66,-.05],[1,.8,1.5],2,'#c8d890',.4);
 g.add(lump(.22,moss,[0,.78,.5],[1,.95,1.1],.12,2.6,132));
 for(const s of[-1,1]){const e=cone(.08,.42,leafS,[s*.14,1.02,.4],[-.5,0,s*.5]);e.scale.z=.35;g.add(e);g.add(ball(.03,glowMat('#ffd060',2),[s*.09,.82,.7]));}
 for(let i=0;i<3;i++){const t=cone(.06,.32,tuft,[(i-1)*.05,.95,-.55],[-.9,0,(i-1)*.35]);t.scale.z=.3;g.add(t);}
 const legs:T.Object3D[]=[];
 for(const [x,z] of[[-.18,.32],[.18,.32],[-.18,-.32],[.18,-.32]]){const l=new T.Group();l.position.set(x,.58,z);
  l.add(lump(.11,hide,[0,-.12,0],[1,1.6,1.1],.12,3,140+x*10+z));l.add(lump(.07,hide,[0,-.38,.03],[1,1.6,1],.12,3,150+x*10+z));
  const paw=new T.Mesh(clawGeo(),hide);paw.scale.setScalar(.1);paw.position.set(0,-.56,.02);l.add(paw);g.add(l);legs.push(l);}
 g.traverse(o=>{(o as T.Mesh).castShadow=true;});
 return {g,legs};
}
const BUILD:Record<Body,(r:T.Group,p:Pal)=>Look>={warden:buildWarden,crawler:buildCrawler,skitter:buildSkitter,spitter:buildSpitter,carapace:buildCarapace,hound:buildHound,amphibian:buildAmphibian,thorn:buildThorn,golem:buildGolem,winged:buildWinged,worm:buildWorm};

// ---------- telegraphs (amber, fixed once announced) ----------
// shape-aware warning: a bright rim, a fill that grows from the source as the attack charges, chevrons on lines
const TELE_V='varying vec3 vP;void main(){vP=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}';
const TELE_F=`uniform float uK;uniform vec3 uColor;uniform float uShape;uniform float uR;uniform float uW;uniform float uArc;uniform float uT;varying vec3 vP;
void main(){
 float rim,fill,pat=0.;
 if(uShape<.5){float rn=length(vP.xz)/uR;if(rn>1.)discard;
  float aa=abs(atan(vP.x,vP.z));float ae=uArc<6.?smoothstep(uArc*.5-.05,uArc*.5,aa)*step(.06,rn):0.;if(uArc<6.&&aa>uArc*.5)discard;
  rim=max(smoothstep(.9,.99,rn),ae);fill=smoothstep(uK+.02,uK-.02,rn);pat=step(.5,fract(rn*uR*1.2-uT*1.5))*.12;}
 else{float al=vP.z/uR,ac=abs(vP.x)/uW;if(al<0.||al>1.||ac>1.)discard;
  rim=max(smoothstep(.78,.98,ac),smoothstep(.96,1.,al));fill=smoothstep(uK+.02,uK-.02,al);
  float ch=fract(al*uR*.7-ac*.5-uT*2.);pat=smoothstep(.0,.15,ch)*smoothstep(.45,.3,ch)*.35;}
 float a=.1+pat*(.4+uK)+fill*.32+rim*(.55+.4*uK);
 vec3 c=mix(uColor,vec3(1.,.95,.8),rim*.35+fill*.15);
 gl_FragColor=vec4(c,min(a,.95)*(.75+.25*uK));}`;
let teleClock=0;export function tickTele(dt:number){teleClock+=dt;}
// one mesh per telegraph shape so the warm-up compiles the shader before the first fight
export function teleWarm(){const g=new T.Group();for(const t of[TS.disc(1),TS.strip(1,2),TS.sector(2,1.5)])g.add(new T.Mesh(t.geo,teleMat(t.o)));return g;}
function teleMat(o:{shape:0|1;R:number;W?:number;arc?:number}){return new T.ShaderMaterial({vertexShader:TELE_V,fragmentShader:TELE_F,uniforms:{uK:{value:0},uColor:{value:new T.Color('#ff8a1a')},uShape:{value:o.shape},uR:{value:o.R},uW:{value:o.W??1},uArc:{value:o.arc??7},uT:{value:teleClock}},transparent:true,depthWrite:false});}
const sector=(r:number,arc:number)=>new T.CircleGeometry(r,48,Math.PI/2-arc/2,arc).rotateX(-Math.PI/2).rotateY(Math.PI).translate(0,.05,0);
const strip=(w:number,l:number)=>new T.PlaneGeometry(w,l,1,1).rotateX(-Math.PI/2).translate(0,.05,l/2);
const disc=(r:number)=>new T.CircleGeometry(r,48).rotateX(-Math.PI/2).translate(0,.05,0);
// telegraph shapes with the parameters their shader needs
const TS={strip:(w:number,l:number)=>({geo:strip(w,l),o:{shape:1 as const,R:l,W:w/2}}),sector:(r:number,arc:number)=>({geo:sector(r,arc),o:{shape:0 as const,R:r,arc}}),disc:(r:number)=>({geo:disc(r),o:{shape:0 as const,R:r}})};

interface Shot{m:T.Mesh;v:T.Vector3;life:number;dmg:number;color:string;arc?:{from:T.Vector3;to:T.Vector3;t:number;dur:number;r:number}}
const shots:Shot[]=[];

export class Creature{
 g=new T.Group();spec:Spec;look:Look;hp:number;state:'idle'|'chase'|'wind'|'act'|'recover'|'dead'='idle';
 t=Math.random()*9;timer=0;vel=new T.Vector3();deadT=0;flash=0;gone=false;
 slowUntil=0;burnUntil=0;burnAcc=0;markUntil=0;heading=Math.random()*6.28;
 private tele:T.Mesh[]=[];private dir=new T.Vector3();private hitDone=false;private gait=0;private mv!:Move;private targets:T.Vector3[]=[];private hidden=0;private moveCd=0;
 static ctx:Ctx;static coreColor='#a060ff';
 constructor(public kind:SpeciesId,x:number,z:number,private scene:T.Scene){
  this.spec=SPECIES[kind] as Spec;this.hp=this.spec.hp;this.g.position.set(x,0,z);this.g.scale.setScalar(this.spec.scale);scene.add(this.g);
  const root=new T.Group();this.g.add(root);this.look=BUILD[this.spec.body](root,this.spec.pal);
  if(!(this.spec.body==='warden'&&MODELS.warden))bakeBody(kind,this.look);
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
  if(this.spec.phase2&&this.phase===1&&this.hp<this.spec.hp*.5){this.phase=2;ctx.popText(this.pos.clone().setY(5.5),'O guardião muda de padrão','#8ff4ff');ctx.sfx?.('roar',this.pos);ctx.vfx.shake=.4;this.look.glow.color.set('#ff5a8a');this.look.glow.emissive.set('#ff5a8a');}
  if(this.hp<=0)this.die(ctx);
 }
 private die(ctx:Ctx){this.state='dead';this.clearTele();ctx.onKill(this);ctx.sfx?.(this.boss?'roar':'death',this.pos);
  ctx.vfx.emit({pos:this.pos.clone().setY(.6),n:this.boss?90:24,speed:[1,this.boss?7:4],up:.6,life:[.4,.9],size:[.14,.03],c0:'#ffffff',c1:'#'+this.look.glow.color.getHexString(),a:[1,0],grav:6,drag:1.5,spread:this.boss?1.2:.3});}
 private clearTele(){for(const m of this.tele){m.removeFromParent();m.geometry.dispose();(m.material as T.Material).dispose();}this.tele=[];}
 private addTele(t:{geo:T.BufferGeometry;o:{shape:0|1;R:number;W?:number;arc?:number}},at:T.Vector3,rot:number){const m=new T.Mesh(t.geo,teleMat(t.o));m.renderOrder=3;m.position.copy(at).setY(0);m.rotation.y=rot;this.scene.add(m);this.tele.push(m);}
 phase=1;
 private pick(dist:number){
  const pool=this.phase===2&&this.spec.phase2?[...this.spec.moves,...this.spec.phase2]:this.spec.moves;
  const ok=pool.filter(m=>dist<=m.range&&dist>=(m.min??0));
  return ok.length?ok[Math.floor(Math.random()*ok.length)]:null;
 }
 private announce(ctx:Ctx){
  ctx.sfx?.(this.boss?'roar':'warn',this.pos);
  const m=this.mv,s=1/this.spec.scale;void s;this.targets=[];
  if(m.type==='dash')this.addTele(TS.strip(1.1*this.spec.scale,m.range),this.pos,this.heading);
  else if(m.type==='spit')this.addTele(TS.strip(.5,m.range),this.pos,this.heading);
  else if(m.type==='fan'){const n=m.count??3;for(let i=0;i<n;i++)this.addTele(TS.strip(.45,m.range),this.pos,this.heading+(i-(n-1)/2)*.32);}
  else if(m.type==='sweep'||m.type==='bite'||m.type==='breath')this.addTele(TS.sector(m.range*(m.type==='bite'?.95:1),m.arc??1.6),this.pos,this.heading);
  else if(m.type==='slam')this.addTele(TS.disc(m.radius!),this.pos,0);
  else{ // lob, marks, burrow: circles around the hero
   const n=m.count??1;for(let i=0;i<n;i++){const p=ctx.player.clone();if(i>0){const a=Math.random()*6.28,d=rnd(1.8,3.5);p.x+=Math.cos(a)*d;p.z+=Math.sin(a)*d;}this.targets.push(p);this.addTele(TS.disc(m.radius!),p,0);}
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
   for(const te of this.tele){const u=(te.material as T.ShaderMaterial).uniforms;u.uK.value=k;u.uT.value=teleClock;}
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
  this.clearTele();this.timer=m.type==='dash'?.36:m.type==='breath'?.5:.15;
  const SND:Record<string,string>={bite:'bite',dash:'dash',spit:'spit',fan:'spit',sweep:'swing',slam:'earth',lob:'fire',breath:'dash',marks:'energy',burrow:'earth'};ctx.sfx?.(SND[m.type]??'hit',this.pos);L.glow.emissiveIntensity=this.spec.body==='golem'?2.4:1.6;
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
  if(L.limbs){const w=Math.min(1,this.vel.length()/1.5);L.limbs.forEach((l,i)=>l.rotation.x=Math.sin(this.gait*1.2+i*Math.PI)*.45*w);if(dead)L.limbs.forEach(l=>l.rotation.x=.8);}
  if(L.halo){L.halo.forEach((h,i)=>{if(i<3){h.rotation.set(Math.PI/2+Math.sin(this.t*.7+i)*.6,this.t*(.8+i*.4),Math.cos(this.t*.5+i)*.5);}else{const a=(i-3)/8*Math.PI*2+this.t*(this.phase===2?1.6:.8);h.position.set(Math.cos(a)*1.9,2.6+Math.sin(this.t*2+i)*.3,Math.sin(a)*1.9);h.rotation.y+=.05;}});L.body.position.y=Math.sin(this.t*1.6)*.15+.3;}
  if(L.wings){const f=Math.sin(this.t*(this.state==='act'?9:5));L.wings.forEach((w,i)=>w.rotation.z=(i?-1:1)*(f*.6+.1));}
  if(L.segs){const h=this.hidden;L.segs.forEach((sg,i)=>{const k=i/(L.segs!.length-1);sg.position.set(Math.sin(this.t*2+i*.7)*.25,(2.4-k*2.6)*(1-h)-h*2.5+ (dead?-1:0),-k*2.2+.6);});}
  if(L.arms&&this.state!=='wind'&&this.state!=='act'&&this.state!=='recover')L.arms.forEach((a,i)=>a.rotation.x=Math.sin(this.gait+i*Math.PI)*.35);
  if(this.spec.body==='worm'){const rt=L.body.parent!;rt.position.y=-3.4*this.hidden;rt.visible=this.hidden<.98;}
  if(!L.legs.length||this.hidden>.05)return;
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
   leg.foot.position.copy(this.g.worldToLocal(foot.clone()));leg.foot.position.y=Math.max(0,leg.foot.position.y-.02);leg.foot.rotation.set(dead?1:0,Math.atan2(leg.out.x,leg.out.z)+(dead?0:Math.sin(ph)*.15),0);
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
  this.addTele(TS.disc(m.radius!),to,0);const te=this.tele[this.tele.length-1];this.tele.pop();(te.material as T.ShaderMaterial).uniforms.uK.value=1;
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
   if(k>=1){end=true;ctx.sfx?.('fire',p);ctx.vfx.impact('fire',p,UP);ctx.vfx.scorch(p,a.r,1.6);ctx.vfx.shake=Math.max(ctx.vfx.shake,.15);if(Math.hypot(p.x-ctx.player.x,p.z-ctx.player.z)<a.r&&!ctx.invuln())ctx.damagePlayer(s.dmg,p);}}
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
