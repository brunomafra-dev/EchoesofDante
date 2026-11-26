import * as T from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {Character,type Look} from './character';

// Arrival camp of the 2D game rebuilt in 3D: the expedition's landing shuttle (DANTE-01),
// the three field shelters (Lia · Enfermaria, Ivo · Oficina, Nara · Expedições e cofre),
// cargo props and the people of the base.

// ---------- shared surface: worn hull panels (tinted per material) ----------
let panelSet:{map:T.CanvasTexture;normal:T.CanvasTexture;rough:T.CanvasTexture}|null=null;
function panels(){
 if(panelSet)return panelSet;
 const S=512,rnd=((s:number)=>()=>{s=(s*16807)%2147483647;return s/2147483647;})(7);
 const col=document.createElement('canvas'),hgt=document.createElement('canvas'),rgh=document.createElement('canvas');
 for(const c of[col,hgt,rgh])c.width=c.height=S;
 const g=col.getContext('2d')!,h=hgt.getContext('2d')!,r=rgh.getContext('2d')!;
 g.fillStyle='#d9d9d9';g.fillRect(0,0,S,S);h.fillStyle='#808080';h.fillRect(0,0,S,S);r.fillStyle='#a0a0a0';r.fillRect(0,0,S,S);
 // panels: a 4x4 grid with some merged cells, each slightly different in tone
 const cells:[number,number,number,number][]=[];const N=4,c=S/N;
 const used=new Set<string>();
 for(let y=0;y<N;y++)for(let x=0;x<N;x++){if(used.has(x+','+y))continue;let w=1,hh=1;if(rnd()<.35&&x<N-1&&!used.has((x+1)+','+y))w=2;else if(rnd()<.3&&y<N-1)hh=2;
  for(let a=0;a<w;a++)for(let b=0;b<hh;b++)used.add((x+a)+','+(y+b));cells.push([x*c,y*c,w*c,hh*c]);}
 for(const [x,y,w,hh] of cells){
  const t=200+Math.floor(rnd()*45);g.fillStyle=`rgb(${t},${t},${t-4})`;g.fillRect(x+2,y+2,w-4,hh-4);
  r.fillStyle=`rgb(${140+rnd()*60|0},${140+rnd()*60|0},${140+rnd()*60|0})`;r.fillRect(x+2,y+2,w-4,hh-4);
  // groove around the panel and rivets along its edge
  g.strokeStyle='rgba(30,30,30,.6)';g.lineWidth=2.5;g.strokeRect(x+1.5,y+1.5,w-3,hh-3);
  h.strokeStyle='#202020';h.lineWidth=4;h.strokeRect(x+1.5,y+1.5,w-3,hh-3);
  g.fillStyle='rgba(40,40,40,.7)';for(let k=10;k<w-6;k+=18){g.beginPath();g.arc(x+k,y+8,1.6,0,6.3);g.fill();g.beginPath();g.arc(x+k,y+hh-8,1.6,0,6.3);g.fill();}
  // some panels carry a small hatch or vent
  if(rnd()<.25){const vx=x+w*.25,vy=y+hh*.3,vw=w*.5,vh=hh*.35;g.fillStyle='rgba(60,60,60,.55)';g.fillRect(vx,vy,vw,vh);h.fillStyle='#606060';h.fillRect(vx,vy,vw,vh);
   g.strokeStyle='rgba(20,20,20,.7)';g.lineWidth=2;for(let k=vy+5;k<vy+vh-3;k+=7){g.beginPath();g.moveTo(vx+4,k);g.lineTo(vx+vw-4,k);g.stroke();}}
 }
 // grime: streaks and dust toward the bottom of each tile
 for(let i=0;i<260;i++){const x=rnd()*S,y=rnd()*S,l=10+rnd()*60;const gr=g.createLinearGradient(x,y,x,y+l);gr.addColorStop(0,'rgba(50,45,35,.0)');gr.addColorStop(.5,`rgba(50,45,35,${.05+rnd()*.12})`);gr.addColorStop(1,'rgba(50,45,35,0)');g.fillStyle=gr;g.fillRect(x,y,1+rnd()*3,l);}
 for(let i=0;i<1600;i++){const x=rnd()*S,y=rnd()*S,a=rnd()*.18;g.fillStyle=`rgba(${rnd()<.5?40:230},${rnd()<.5?38:225},30,${a})`;g.fillRect(x,y,1+rnd()*2,1+rnd()*2);}
 // scratches (bright, metallic underneath)
 for(let i=0;i<70;i++){const x=rnd()*S,y=rnd()*S,a=rnd()*6.3,l=4+rnd()*16;g.strokeStyle='rgba(255,255,250,.35)';g.lineWidth=1;g.beginPath();g.moveTo(x,y);g.lineTo(x+Math.cos(a)*l,y+Math.sin(a)*l);g.stroke();r.strokeStyle='#3a3a3a';r.beginPath();r.moveTo(x,y);r.lineTo(x+Math.cos(a)*l,y+Math.sin(a)*l);r.stroke();}
 // height -> normal map
 const hd=h.getImageData(0,0,S,S).data,nc=document.createElement('canvas');nc.width=nc.height=S;const n=nc.getContext('2d')!,out=n.createImageData(S,S);
 const H=(x:number,y:number)=>hd[(((y+S)%S)*S+((x+S)%S))*4]/255;
 for(let y=0;y<S;y++)for(let x=0;x<S;x++){const dx=(H(x+1,y)-H(x-1,y))*2.2,dy=(H(x,y+1)-H(x,y-1))*2.2;const l=Math.hypot(dx,dy,1);const i=(y*S+x)*4;out.data[i]=(-dx/l*.5+.5)*255;out.data[i+1]=(dy/l*.5+.5)*255;out.data[i+2]=(1/l*.5+.5)*255;out.data[i+3]=255;}
 n.putImageData(out,0,0);
 const mk=(cv:HTMLCanvasElement,srgb:boolean)=>{const t=new T.CanvasTexture(cv);t.wrapS=t.wrapT=T.RepeatWrapping;t.anisotropy=8;if(srgb)t.colorSpace=T.SRGBColorSpace;return t;};
 panelSet={map:mk(col,true),normal:mk(nc,false),rough:mk(rgh,false)};return panelSet;
}
// tent canvas: woven fabric with seams and dust
let fabricTex:T.CanvasTexture|null=null;
function fabric(){
 if(fabricTex)return fabricTex;const S=256,c=document.createElement('canvas');c.width=c.height=S;const g=c.getContext('2d')!;
 g.fillStyle='#bdbca0';g.fillRect(0,0,S,S);
 for(let y=0;y<S;y+=2){g.fillStyle=`rgba(0,0,0,${.04+Math.random()*.04})`;g.fillRect(0,y,S,1);}for(let x=0;x<S;x+=2){g.fillStyle=`rgba(255,255,240,${.03+Math.random()*.03})`;g.fillRect(x,0,1,S);}
 for(const x of[S*.33,S*.66]){g.fillStyle='rgba(40,40,25,.35)';g.fillRect(x-2,0,4,S);g.fillStyle='rgba(255,255,230,.15)';g.fillRect(x+2,0,1,S);}
 for(let i=0;i<40;i++){const x=Math.random()*S,y=Math.random()*S,r=10+Math.random()*40,gr=g.createRadialGradient(x,y,0,x,y,r);gr.addColorStop(0,`rgba(70,60,40,${Math.random()*.18})`);gr.addColorStop(1,'rgba(70,60,40,0)');g.fillStyle=gr;g.fillRect(x-r,y-r,r*2,r*2);}
 fabricTex=new T.CanvasTexture(c);fabricTex.wrapS=fabricTex.wrapT=T.RepeatWrapping;fabricTex.colorSpace=T.SRGBColorSpace;fabricTex.anisotropy=8;return fabricTex;
}
const MATS=new Map<string,T.MeshStandardMaterial>();
function hullMat(name:string,color:string,o:{rough?:number;metal?:number;emissive?:string;ei?:number;plain?:boolean}={}){
 const k=name;let m=MATS.get(k);if(m)return m;const p=panels();
 m=new T.MeshStandardMaterial({name,color,roughness:o.rough??.75,metalness:o.metal??.3,map:o.plain?null:p.map,normalMap:o.plain?null:p.normal,roughnessMap:o.plain?null:p.rough,normalScale:new T.Vector2(.8,.8),emissive:o.emissive??'#000000',emissiveIntensity:o.ei??1,envMapIntensity:.8});
 MATS.set(k,m);return m;
}
const M={
 light:()=>hullMat('hull-light','#a3a08f'),olive:()=>hullMat('hull-olive','#6c705a'),dark:()=>hullMat('hull-dark','#34363a',{metal:.5,rough:.6}),
 stripe:()=>hullMat('hull-stripe','#d2682a',{rough:.65,metal:.15}),glass:()=>hullMat('glass','#0b141b',{rough:.08,metal:.9,plain:true}),
 warm:()=>hullMat('warm','#ffcf96',{emissive:'#ffb060',ei:2.2,plain:true}),cyan:()=>hullMat('cyan','#9ff4ff',{emissive:'#4fe6ff',ei:2,plain:true}),
 amber:()=>hullMat('amber','#6a3a1a',{emissive:'#ff7a2a',ei:.55,plain:true}),cloth:()=>{const m=hullMat('tent','#8a8c6a',{rough:.95,metal:0,plain:true});if(!m.map){m.map=fabric();m.needsUpdate=true;}return m;},
 wood:()=>hullMat('crate','#6f7258',{rough:.85,metal:.1}),white:()=>hullMat('white','#e8e4da',{rough:.7,metal:.05,plain:true}),
 redLight:()=>hullMat('nav-red','#ff4a3a',{emissive:'#ff3a2a',ei:3,plain:true}),greenLight:()=>hullMat('nav-green','#6aff8a',{emissive:'#4aff7a',ei:3,plain:true}),
};

// ---------- geometry helpers ----------
type Station={x:number;w:number;top:number;bot:number};
// loft a rounded-rectangle (superellipse) section along x: fuselages, nacelles, canopy bands
function loft(st:Station[],o:{n?:number;seg?:number;a0?:number;a1?:number;grow?:number;cap?:boolean}={}){
 const n=o.n??4,seg=o.seg??40,a0=o.a0??0,a1=o.a1??Math.PI*2,grow=o.grow??1,full=Math.abs(a1-a0-Math.PI*2)<1e-6;
 const pos:number[]=[],uv:number[]=[],idx:number[]=[];
 const pt=(s:Station,a:number)=>{const c=Math.cos(a),si=Math.sin(a),hw=s.w/2*grow,cy=(s.top+s.bot)/2,hh=(s.top-s.bot)/2*grow;
  return new T.Vector3(s.x,cy+Math.sign(si)*Math.pow(Math.abs(si),2/n)*hh,Math.sign(c)*Math.pow(Math.abs(c),2/n)*hw);};
 st.forEach((s,i)=>{let arc=0,prev:T.Vector3|null=null;for(let k=0;k<=seg;k++){const p=pt(s,a0+(a1-a0)*k/seg);if(prev)arc+=p.distanceTo(prev);prev=p;pos.push(p.x,p.y,p.z);uv.push(s.x/4.2,arc/4.2);}
  if(i>0){const A=(i-1)*(seg+1),B=i*(seg+1);for(let k=0;k<seg;k++)idx.push(A+k,B+k,A+k+1,A+k+1,B+k,B+k+1);}});
 if(o.cap&&full){for(const i of [0,st.length-1]){const s=st[i],c=pos.length/3;pos.push(s.x,(s.top+s.bot)/2,0);uv.push(.5,.5);const B=i*(seg+1);for(let k=0;k<seg;k++){idx.push(c,B+k+1,B+k,c,B+k,B+k+1);}}}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();return g;
}
const box=(w:number,h:number,d:number,r=.05)=>new RoundedBoxGeometry(w,h,d,2,Math.min(r,w/2-.001,h/2-.001,d/2-.001));
function add(g:T.Object3D,geo:T.BufferGeometry,mat:T.Material,p:[number,number,number],r:[number,number,number]=[0,0,0],s?:[number,number,number]){const m=new T.Mesh(geo,mat);m.position.set(...p);m.rotation.set(...r);if(s)m.scale.set(...s);m.castShadow=m.receiveShadow=true;g.add(m);return m;}
// merge static meshes that share a material: the shuttle becomes a handful of draw calls
function bake(root:T.Group,keep:(m:T.Mesh)=>boolean=()=>false){
 root.updateMatrixWorld(true);const inv=new T.Matrix4().copy(root.matrixWorld).invert();
 const by=new Map<T.Material,T.BufferGeometry[]>(),drop:T.Mesh[]=[];
 root.traverse(o=>{const m=o as T.Mesh;if(!m.isMesh||keep(m))return;let g=m.geometry.index?m.geometry.toNonIndexed():m.geometry.clone();
  for(const k of Object.keys(g.attributes))if(!['position','normal','uv'].includes(k))g.deleteAttribute(k);
  if(!g.attributes.uv)g.setAttribute('uv',new T.Float32BufferAttribute(new Float32Array(g.attributes.position.count*2),2));
  g.applyMatrix4(new T.Matrix4().multiplyMatrices(inv,m.matrixWorld));const mat=m.material as T.Material;if(!by.has(mat))by.set(mat,[]);by.get(mat)!.push(g);drop.push(m);});
 for(const m of drop)m.removeFromParent();
 for(const [mat,list] of by){const g=mergeGeometries(list,false);if(!g)continue;const m=new T.Mesh(g,mat);m.castShadow=m.receiveShadow=true;root.add(m);}
 return root;
}
function labelTex(text:string,color='#2a2a26',w=512,h=96,font='bold 64px "Barlow Condensed",Arial'){
 const c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d')!;g.clearRect(0,0,w,h);g.font=font;g.fillStyle=color;g.textBaseline='middle';g.fillText(text,8,h/2);
 const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.anisotropy=8;return t;
}

// ---------- the landing shuttle (2D: landing-shuttle.png) ----------
// local frame: nose toward +x, starboard door on +z. ~14 m long.
export function buildShuttle(){
 const g=new T.Group(),L=M.light(),O=M.olive(),D=M.dark(),S=M.stripe();
 const hull:Station[]=[{x:-6.6,w:2.4,top:3.3,bot:1.75},{x:-6.2,w:3.1,top:3.75,bot:1.35},{x:-4.5,w:3.5,top:3.95,bot:1.2},{x:2.2,w:3.5,top:3.95,bot:1.2},{x:4,w:3.35,top:3.7,bot:1.24},{x:5.4,w:2.9,top:3.15,bot:1.32},{x:6.4,w:2.05,top:2.55,bot:1.45},{x:6.95,w:1.05,top:2.1,bot:1.62}];
 add(g,loft(hull,{cap:true,seg:48}),L,[0,0,0]);
 // olive armour belts and orange stripes (2D livery), slightly proud of the hull
 const part=(x0:number,x1:number)=>{const out:Station[]=[];for(let i=0;i<hull.length-1;i++){const a=hull[i],b=hull[i+1];for(const s of[a,b])if(s.x>=x0&&s.x<=x1&&!out.includes(s))out.push(s);}
  const lerp=(x:number)=>{for(let i=0;i<hull.length-1;i++){const a=hull[i],b=hull[i+1];if(x>=a.x&&x<=b.x){const t=(x-a.x)/(b.x-a.x);return{x,w:a.w+(b.w-a.w)*t,top:a.top+(b.top-a.top)*t,bot:a.bot+(b.bot-a.bot)*t};}}return hull[0];};
  return[lerp(x0),...out.filter(s=>s.x>x0&&s.x<x1),lerp(x1)];};
 add(g,loft(part(-6.2,-3.2),{grow:1.025,a0:-.55,a1:.55,seg:16}),O,[0,0,0]);
 add(g,loft(part(-6.2,-3.2),{grow:1.025,a0:Math.PI-.55,a1:Math.PI+.55,seg:16}),O,[0,0,0]);
 add(g,loft(part(-1.2,1.4),{grow:1.02,a0:-.62,a1:.62,seg:16}),O,[0,0,0]);
 add(g,loft(part(-1.2,1.4),{grow:1.02,a0:Math.PI-.62,a1:Math.PI+.62,seg:16}),O,[0,0,0]);
 add(g,loft(part(-4.6,3.4),{grow:1.015,a0:.95,a1:2.19,seg:16}),O,[0,0,0]);
 for(const [a,b] of[[.6,.7],[Math.PI-.7,Math.PI-.6]])add(g,loft(part(3.2,6.3),{grow:1.03,a0:a,a1:b,seg:3}),S,[0,0,0]);
 add(g,loft(part(-3.15,-2.75),{grow:1.035,a0:-.9,a1:Math.PI+.9,seg:30}),S,[0,0,0]);
 add(g,loft(part(-6.25,-6.05),{grow:1.04,seg:30}),D,[0,0,0]);
 // cockpit glass and frame
 add(g,loft(part(4.05,6.75),{grow:1.018,a0:.35,a1:Math.PI-.35,seg:24}),M.glass(),[0,0,0]);
 for(const a of[.95,Math.PI/2,Math.PI-.95])add(g,loft(part(4.05,6.75),{grow:1.03,a0:a-.035,a1:a+.035,seg:2}),D,[0,0,0]);
 for(const x of[4.05,5.2,6.2])add(g,loft(part(x-.05,x+.05),{grow:1.03,a0:.35,a1:Math.PI-.35,seg:20}),D,[0,0,0]);
 // spine with vents, hatch and antenna
 add(g,box(6.2,.55,1.7,.18),O,[-1.2,4.05,0]);
 for(let i=0;i<5;i++)add(g,box(.5,.12,1.2,.04),D,[-3.6+i*.62,4.36,0]);
 add(g,new T.CylinderGeometry(.42,.46,.16,24),D,[1.2,4.36,0]);add(g,new T.CylinderGeometry(.3,.3,.18,24),O,[1.2,4.4,0]);
 add(g,new T.CylinderGeometry(.03,.03,1.4,6),D,[-.6,5,.55]);add(g,new T.SphereGeometry(.06,8,6),M.redLight(),[-.6,5.72,.55]);
 // engines: two big nacelles at the rear flanks, two small pods on top (2D silhouette)
 const nac=(len:number,r:number):Station[]=>[{x:-len/2,w:r*1.7,top:r*.85,bot:-r*.85},{x:-len/2+.3,w:r*2,top:r,bot:-r},{x:len/2-.4,w:r*2,top:r,bot:-r},{x:len/2,w:r*1.75,top:r*.88,bot:-r*.88}];
 for(const sz of[-1,1]){
  const e=new T.Group();e.position.set(-4.7,2.75,sz*2.55);g.add(e);
  add(e,loft(nac(3.4,1.05),{n:3,seg:36}),L,[0,0,0]);
  add(e,loft([{x:-.9,w:2.15,top:1.07,bot:-1.07},{x:.2,w:2.15,top:1.07,bot:-1.07}],{n:3,grow:1.01,a0:Math.PI/2-.35,a1:Math.PI/2+.35,seg:8}),S,[0,0,0]);
  add(e,new T.TorusGeometry(.86,.1,10,32),D,[1.72,0,0],[0,Math.PI/2,0]);
  add(e,new T.CircleGeometry(.82,32),M.dark(),[1.7,0,0],[0,Math.PI/2,0]);
  add(e,new T.CylinderGeometry(.18,.3,.3,16),M.dark(),[1.6,0,0],[0,0,Math.PI/2]);for(let i=0;i<8;i++){const a=i/8*6.283;add(e,box(.04,.5,.08,.01),D,[1.62,Math.sin(a)*.5,Math.cos(a)*.5],[Math.PI/2-a,0,0]);}
  add(e,new T.CylinderGeometry(.78,.9,.4,32),D,[-1.85,0,0],[0,0,Math.PI/2]);
  add(e,new T.CircleGeometry(.62,32),M.amber(),[-2.06,0,0],[0,-Math.PI/2,0]);
  add(e,box(1.6,.5,1.1,.12),O,[0,0,-sz*1.05]);
  add(e,new T.SphereGeometry(.07,8,6),sz>0?M.greenLight():M.redLight(),[.6,.2,sz*1.06]);
  const top=new T.Group();top.position.set(-3.9,4.45,sz*1.15);g.add(top);
  add(top,loft(nac(2.6,.55),{n:3,seg:28}),L,[0,0,0]);
  add(top,new T.CircleGeometry(.36,24),M.amber(),[-1.31,0,0],[0,-Math.PI/2,0]);add(top,new T.CircleGeometry(.4,24),D,[1.31,0,0],[0,Math.PI/2,0]);
  add(top,new T.TorusGeometry(.45,.06,8,24),D,[1.3,0,0],[0,Math.PI/2,0]);
  add(top,box(1.4,.3,.4,.08),O,[0,-.45,-sz*.2]);
  // tail fins, raked outward, orange tips
  const fs=new T.Shape();fs.moveTo(0,0);fs.lineTo(1.9,0);fs.lineTo(1.05,1.9);fs.lineTo(.45,1.9);fs.closePath();
  const fin=new T.Group();fin.position.set(-6.1,3.9,sz*.85);fin.rotation.x=-sz*.32;g.add(fin);
  add(fin,new T.ExtrudeGeometry(fs,{depth:.14,bevelEnabled:true,bevelSize:.03,bevelThickness:.03,bevelSegments:1}),L,[0,0,-.07]);
  const ts=new T.Shape();ts.moveTo(.78,1.35);ts.lineTo(1.29,1.35);ts.lineTo(1.05,1.9);ts.lineTo(.45,1.9);ts.closePath();
  add(fin,new T.ExtrudeGeometry(ts,{depth:.17,bevelEnabled:false}),S,[0,0,-.085]);
 }
 // landing gear: struts, pistons and wide pads
 for(const [x,z] of[[-4.2,1.5],[-4.2,-1.5],[3.6,1.35],[3.6,-1.35]]){
  const sz=Math.sign(z),knee=new T.Vector3(x,.75,z+sz*.75),top=new T.Vector3(x,1.35,z),foot=new T.Vector3(x,.16,z+sz*1);
  const strut=(a:T.Vector3,b:T.Vector3,r:number,mat:T.Material)=>{const d=b.clone().sub(a),m=add(g,new T.CylinderGeometry(r,r,d.length(),10),mat,[(a.x+b.x)/2,(a.y+b.y)/2,(a.z+b.z)/2]);m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),d.normalize());};
  strut(top,knee,.13,D);strut(knee,foot,.1,L);strut(top.clone().setX(x+.25),foot.clone().setX(x+.2),.05,D);
  add(g,new T.SphereGeometry(.17,12,10),O,[knee.x,knee.y,knee.z]);
  add(g,box(.95,.16,.8,.06),D,[foot.x,.08,foot.z]);
 }
 // open starboard door with a warm interior and the cargo ramp down to the ground
 add(g,box(1.5,1.9,.3,.06),hullMat('interior','#2a2622',{rough:.9,metal:.2}),[2.3,2.2,1.66]);
 add(g,new T.PlaneGeometry(1.2,1.6),M.warm(),[2.3,2.2,1.6],[0,0,0]);
 for(const dx of[-.78,.78])add(g,box(.12,2.05,.12,.04),S,[2.3+dx,2.2,1.82]);
 add(g,box(1.7,.12,.12,.04),S,[2.3,3.2,1.82]);
 const ramp=new T.Group();ramp.position.set(2.3,1.24,1.8);ramp.rotation.x=Math.atan2(1.24,2.6);g.add(ramp);
 add(ramp,box(1.35,.08,2.85,.03),D,[0,0,1.42]);
 for(let i=0;i<9;i++)add(ramp,box(1.2,.03,.06,.01),O,[0,.05,.2+i*.3]);
 for(const dx of[-.7,.7])add(ramp,box(.06,.18,2.85,.02),S,[dx,.06,1.42]);
 // hull lettering (2D: DANTE-01 · BASE DE POUSO)
 for(const sz of[1,-1]){const t=new T.Mesh(new T.PlaneGeometry(2.6,.48),new T.MeshStandardMaterial({map:labelTex('DANTE-01'),transparent:true,roughness:.8,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2}));
  t.position.set(-1.8,3.1,sz*1.79);if(sz<0)t.rotation.y=Math.PI;g.add(t);}
 bake(g,m=>(m.material as T.Material).transparent===true);
 return g;
}

// ---------- field shelter (2D: field-shelter.png): cargo module + awning on poles ----------
export type Service='medic'|'smith'|'expedition';
export function buildShelter(kind:Service){
 const g=new T.Group(),L=M.light(),O=M.olive(),D=M.dark(),S=M.stripe();
 // module on the left, awning to the right (local +x), open toward +z
 add(g,box(2.3,2.3,2.1,.12),kind==='medic'?L:O,[-1.35,1.15,0]);
 add(g,box(2.34,.14,2.14,.04),S,[-1.35,1.9,0]);
 add(g,box(.9,1.6,.06,.03),D,[-1.35,.95,1.07]);add(g,box(.3,.06,.02,.01),M.amber(),[-1.35,1.82,1.11]);
 add(g,box(.5,.4,.25,.05),D,[-1.9,2.5,-.4]);add(g,new T.CylinderGeometry(.02,.02,1.1,6),D,[-.75,2.85,-.6]);
 for(const z of[-.6,.6])add(g,box(.12,.5,.5,.03),D,[-2.55,.8,z]);
 // awning: sagging cloth from the module roof to two front poles
 const cg=new T.PlaneGeometry(3.4,2.5,14,12);const p=cg.attributes.position as T.BufferAttribute;
 for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),u=(x+1.7)/3.4,v=(y+1.25)/2.5;p.setZ(i,-(Math.sin(u*Math.PI)*Math.sin(v*Math.PI))*.18-u*.55);}
 cg.computeVertexNormals();const cloth=M.cloth();cloth.side=T.DoubleSide;
 const aw=add(g,cg,cloth,[1.5,2.2,0],[-Math.PI/2,0,0]);aw.rotation.z=0;
 for(const z of[-1.1,1.1])add(g,new T.CylinderGeometry(.05,.06,1.7,8),D,[3.15,.85,z]);
 add(g,box(.2,.08,2.45,.03),S,[3.2,1.68,0]);
 add(g,box(.08,.06,.06,.02),M.warm(),[2.9,1.6,0]);
 // furniture per service
 if(kind==='medic'){
  add(g,box(1.9,.08,.7,.03),M.white(),[1.3,.62,-.5]);for(const x of[.45,2.15])for(const z of[-.8,-.2])add(g,new T.CylinderGeometry(.025,.025,.6,6),D,[x,.3,z]);
  add(g,box(.6,.45,.4,.06),M.white(),[.5,.23,.7]);add(g,box(.3,.08,.02,.01),S,[.5,.3,.91]);add(g,box(.08,.3,.02,.01),S,[.5,.3,.91]);
  add(g,box(.4,1.2,.35,.04),L,[2.6,.6,-1]);add(g,box(.3,.04,.02,.01),M.cyan(),[2.6,1.05,-.82]);
 }else if(kind==='smith'){
  add(g,box(1.8,.12,.8,.03),O,[1.3,.9,-.6]);for(const x of[.5,2.1])add(g,box(.1,.85,.7,.02),D,[x,.43,-.6]);
  add(g,box(.35,.25,.25,.04),D,[.9,1.08,-.6]);add(g,new T.CylinderGeometry(.04,.04,.4,8),S,[1.6,1.05,-.5],[0,0,Math.PI/2]);
  add(g,box(.06,1.4,1.4,.02),D,[-.2+.05,.9,-.4]);for(let i=0;i<5;i++)add(g,box(.05,.3,.05,.01),S,[-.1,.9+(i%2)*.15,-.9+i*.25]);
  add(g,new T.CylinderGeometry(.3,.3,.8,16),D,[2.6,.4,.7]);add(g,new T.TorusGeometry(.3,.03,6,16),S,[2.6,.6,.7],[Math.PI/2,0,0]);
  add(g,new T.SphereGeometry(.05,8,6),M.cyan(),[1.6,1.05,-.32]);
 }else{
  add(g,new T.CylinderGeometry(.55,.65,.8,24),D,[1.4,.4,-.2]);add(g,new T.CylinderGeometry(.6,.6,.06,24),O,[1.4,.83,-.2]);
  add(g,box(1.1,.7,.6,.06),O,[-.1,.35,-.85]);add(g,box(1.12,.08,.62,.02),S,[-.1,.62,-.85]);add(g,box(.16,.16,.04,.02),M.amber(),[-.1,.4,-.53]);
  add(g,box(.5,.5,.5,.05),M.wood(),[2.7,.25,.8]);add(g,box(.4,.4,.4,.05),M.wood(),[2.6,.7,.75],[0,.4,0]);
 }
 for(let i=0;i<2;i++)add(g,box(.55,.45,.45,.05),M.wood(),[-2.9+i*.1,.23+i*.45,.95],[0,i*.5,0]);
 bake(g,m=>(m.material as T.Material).transparent===true||m.material===cloth);
 // the expedition's holographic map keeps animating
 if(kind==='expedition'){
  const holo=new T.Group();holo.position.set(1.4,.95,-.2);holo.name='holo';
  const hm=new T.MeshBasicMaterial({color:'#5fe8ff',transparent:true,opacity:.5,blending:T.AdditiveBlending,depthWrite:false,side:T.DoubleSide});
  holo.add(new T.Mesh(new T.CircleGeometry(.5,32).rotateX(-Math.PI/2),new T.MeshBasicMaterial({color:'#2fb8d8',transparent:true,opacity:.25,blending:T.AdditiveBlending,depthWrite:false})));
  for(let i=0;i<3;i++){const r=new T.Mesh(new T.TorusGeometry(.18+i*.12,.006,4,40),hm);r.rotation.x=Math.PI/2;r.position.y=.08+i*.06;holo.add(r);}
  const terrain=new T.Mesh(new T.ConeGeometry(.22,.3,6,1,true),new T.MeshBasicMaterial({color:'#8ff4ff',wireframe:true,transparent:true,opacity:.6,blending:T.AdditiveBlending,depthWrite:false}));terrain.position.y=.25;holo.add(terrain);
  g.add(holo);
 }
 return g;
}

// ---------- loose cargo, decontamination arch, flood light ----------
export function buildProps(kind:'crates'|'decon'|'flood'|'barrels'){
 const g=new T.Group(),D=M.dark(),S=M.stripe();
 if(kind==='crates'){
  const sp:[number,number,number,number,number][]=[[0,0,0,1,0],[.9,0,.1,.9,.3],[.4,1,0,.8,.15],[-.8,0,-.4,.7,.6],[.2,0,-1,1.1,.1]];
  for(const [x,y,z,s,r] of sp){add(g,box(s,s*.8,s*.8,.06),M.wood(),[x,y*.8+s*.4,z],[0,r,0]);add(g,box(s*1.01,.08,s*.81,.02),S,[x,y*.8+s*.62,z],[0,r,0]);}
 }else if(kind==='barrels'){
  for(const [x,z] of[[0,0],[.6,.2],[.2,.65],[-.5,.4]]){add(g,new T.CylinderGeometry(.28,.28,.9,16),M.olive(),[x,.45,z]);for(const y of[.2,.7])add(g,new T.TorusGeometry(.285,.025,6,20),D,[x,y,z],[Math.PI/2,0,0]);}
 }else if(kind==='decon'){
  for(const x of[-1,1]){add(g,box(.35,2.5,.5,.06),M.light(),[x,1.25,0]);add(g,box(.06,2,.1,.02),M.cyan(),[x*.82,1.2,0]);}
  add(g,box(2.4,.35,.6,.08),M.olive(),[0,2.55,0]);add(g,box(1.6,.05,.3,.02),M.cyan(),[0,2.36,0]);
  add(g,box(2,.04,1.4,.02),D,[0,.02,0]);
 }else{
  add(g,new T.CylinderGeometry(.07,.1,4.2,8),D,[0,2.1,0]);add(g,box(.9,.35,.3,.06),M.olive(),[0,4.25,0]);
  add(g,new T.PlaneGeometry(.75,.22),M.warm(),[0,4.25,.16]);
  for(const a of[0,2.1,4.2])add(g,new T.CylinderGeometry(.03,.03,1.6,6),D,[Math.cos(a)*.5,.6,Math.sin(a)*.5],[Math.sin(a)*.4,0,-Math.cos(a)*.4]);
 }
 return bake(g);
}

// ---------- people of the base ----------
export interface NpcDef{id:string;npc?:'nara'|'lia'|'ivo';name:string;role:string;look:Look;at:[number,number];face:number;anim:string;portrait?:string;service?:Service;route?:[number,number][];hold?:'tablet'|'wrench';lines?:string[]}
export class Npc{
 char=new Character();ready=false;home:T.Vector3;private t=Math.random()*10;private leg=0;private wait=2;marker:T.Sprite;state:'!'|'?'|''='';
 constructor(public def:NpcDef,scene:T.Scene){
  this.home=new T.Vector3(def.at[0],0,def.at[1]);this.char.root.position.copy(this.home);
  this.marker=new T.Sprite(new T.SpriteMaterial({map:markTex('!'),transparent:true,depthWrite:false,depthTest:false}));this.marker.scale.set(.55,.55,1);this.marker.visible=false;this.marker.renderOrder=10;this.char.root.add(this.marker);
  scene.add(this.char.root);
 }
 async load(){
  await this.char.setSex(this.def.look.sex);this.char.apply(this.def.look);this.char.model.rotation.y=this.def.face;
  if(this.def.hold){const hand=this.char.model.getObjectByName(this.def.hold==='tablet'?'hand_l':'hand_r');if(hand){const t=this.def.hold==='tablet'?new T.Mesh(box(.2,.012,.14,.006),M.dark()):new T.Mesh(box(.04,.28,.04,.01),M.dark());const sc=1/(hand.getWorldScale(new T.Vector3()).x||1);t.scale.setScalar(sc);t.position.set(0,.09*sc,.03*sc);hand.add(t);
   if(this.def.hold==='tablet'){const s=new T.Mesh(new T.PlaneGeometry(.17,.11),M.cyan());s.rotation.x=-Math.PI/2;s.position.y=.007;t.add(s);}}}
  this.char.play(this.def.anim,{fade:0});const a=this.char.current;if(a)a.time=Math.random()*a.getClip().duration;
  this.ready=true;
 }
 setMarker(s:'!'|'?'|''){if(s===this.state)return;this.state=s;this.marker.visible=!!s;if(s){(this.marker.material as T.SpriteMaterial).map?.dispose();(this.marker.material as T.SpriteMaterial).map=markTex(s);(this.marker.material as T.SpriteMaterial).needsUpdate=true;}}
 get pos(){return this.char.root.position;}
 update(dt:number,player:T.Vector3,talking:boolean){
  if(!this.ready)return;this.t+=dt;const p=this.pos,m=this.char.model;
  const near=Math.hypot(player.x-p.x,player.z-p.z)<4.2||talking;
  let face=this.def.face,anim=this.def.anim;
  if(this.def.route&&!near){
   const goal=this.def.route[this.leg],d=new T.Vector3(goal[0]-p.x,0,goal[1]-p.z),l=d.length();
   if(l<.15){this.wait-=dt;anim='Idle_Loop';if(this.wait<=0){this.leg=(this.leg+1)%this.def.route.length;this.wait=2+Math.random()*3;}face=m.rotation.y;}
   else{d.normalize();p.addScaledVector(d,Math.min(l,dt*1.25));face=Math.atan2(d.x,d.z);anim='Walk_Loop';}
  }
  if(near){face=Math.atan2(player.x-p.x,player.z-p.z);anim='Idle_Loop';}
  let dh=face-m.rotation.y;dh=Math.atan2(Math.sin(dh),Math.cos(dh));m.rotation.y+=dh*Math.min(1,dt*5);
  this.char.play(anim,{fade:.35});this.char.update(dt);
  this.marker.position.set(0,2.25+Math.sin(this.t*2.4)*.06,0);
 }
}
function markTex(s:string){
 const c=document.createElement('canvas');c.width=c.height=128;const g=c.getContext('2d')!;
 g.translate(64,64);g.rotate(Math.PI/4);g.fillStyle='rgba(20,16,10,.85)';g.fillRect(-34,-34,68,68);g.strokeStyle=s==='?'?'#7dffb0':'#ffc24a';g.lineWidth=6;g.strokeRect(-34,-34,68,68);g.rotate(-Math.PI/4);
 g.fillStyle=s==='?'?'#7dffb0':'#ffc24a';g.font='bold 64px Georgia,serif';g.textAlign='center';g.textBaseline='middle';g.fillText(s,0,4);
 const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;return t;
}

// ---------- layout of the arrival camp (mirrors the 2D base: shuttle north, medic west, workshop south, expedition east) ----------
export const CAMP={
 shuttle:{x:-5,z:-11.5,ry:-.22},
 shelters:{medic:{x:-12,z:2.5,ry:.45},smith:{x:2.5,z:8.5,ry:-.1},expedition:{x:12.5,z:-3,ry:-.55}} as Record<Service,{x:number;z:number;ry:number}>,
 fire:{x:3,z:-2.2},
 crates:[[-13,-6,.4],[6.5,-10,1.1],[-1,-17.5,.2]] as [number,number,number][],
 barrels:[[9,4.5],[-15.5,7]] as [number,number][],
 decon:{x:-1.2,z:-4.8,ry:-.22},
 floods:[[-15,-3],[10,-13],[16,6.5],[-6,9.5]] as [number,number][],
};
// a point in a shelter's local frame, in world space
export function shelterPoint(k:Service,lx:number,lz:number){const s=CAMP.shelters[k],c=Math.cos(s.ry),si=Math.sin(s.ry);return{x:s.x+lx*c+lz*si,z:s.z-lx*si+lz*c,ry:s.ry};}
export function shuttlePoint(lx:number,lz:number){const s=CAMP.shuttle,c=Math.cos(s.ry),si=Math.sin(s.ry);return{x:s.x+lx*c+lz*si,z:s.z-lx*si+lz*c};}
