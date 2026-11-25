import * as T from 'three';

// Visual effects for the new 3D: one pooled GPU particle system (additive glow + soft smoke),
// rock shards, lightning, sword arcs and beams. No lights are ever added (that stalls shader
// compilation); everything glows through additive blending and the bloom pass.
export type Kind='pulse'|'fire'|'water'|'earth'|'energy'|'filament';
const V=()=>new T.Vector3();
const rnd=(a:number,b:number)=>a+Math.random()*(b-a);
const tmp=new T.Vector3(),tmp2=new T.Vector3();

// ---------- particles ----------
const PV=`attribute float size;attribute vec4 col;varying vec4 vCol;uniform float uScale;
void main(){vCol=col;vec4 mv=modelViewMatrix*vec4(position,1.);gl_PointSize=size*uScale/max(.1,-mv.z);gl_Position=projectionMatrix*mv;}`;
const PF_ADD=`varying vec4 vCol;void main(){vec2 p=gl_PointCoord-.5;float d=length(p);float a=smoothstep(.5,.0,d);a*=a;gl_FragColor=vec4(vCol.rgb*vCol.a*a,1.);}`;
const PF_SMOKE=`varying vec4 vCol;void main(){vec2 p=gl_PointCoord-.5;float d=length(p);float a=smoothstep(.5,.1,d);gl_FragColor=vec4(vCol.rgb,vCol.a*a);}`;
export interface Emit{pos:T.Vector3;n:number;speed?:[number,number];dir?:T.Vector3;cone?:number;up?:number;life?:[number,number];size?:[number,number];c0:string;c1?:string;a?:[number,number];grav?:number;drag?:number;spread?:number}
class Particles{
 readonly N:number;n=0;pts:T.Points;geo=new T.BufferGeometry();mat:T.ShaderMaterial;
 pos:Float32Array;col:Float32Array;size:Float32Array;
 vel:Float32Array;c0:Float32Array;c1:Float32Array;life:Float32Array;max:Float32Array;s0:Float32Array;s1:Float32Array;a0:Float32Array;a1:Float32Array;grav:Float32Array;drag:Float32Array;
 constructor(N:number,additive:boolean){
  this.N=N;const f=(k:number)=>new Float32Array(N*k);
  this.pos=f(3);this.col=f(4);this.size=f(1);this.vel=f(3);this.c0=f(3);this.c1=f(3);this.life=f(1);this.max=f(1);this.s0=f(1);this.s1=f(1);this.a0=f(1);this.a1=f(1);this.grav=f(1);this.drag=f(1);
  this.geo.setAttribute('position',new T.BufferAttribute(this.pos,3).setUsage(T.DynamicDrawUsage));
  this.geo.setAttribute('col',new T.BufferAttribute(this.col,4).setUsage(T.DynamicDrawUsage));
  this.geo.setAttribute('size',new T.BufferAttribute(this.size,1).setUsage(T.DynamicDrawUsage));
  this.mat=new T.ShaderMaterial({vertexShader:PV,fragmentShader:additive?PF_ADD:PF_SMOKE,uniforms:{uScale:{value:600}},transparent:true,depthWrite:false,blending:additive?T.AdditiveBlending:T.NormalBlending});
  this.pts=new T.Points(this.geo,this.mat);this.pts.frustumCulled=false;this.pts.renderOrder=additive?10:9;
 }
 emit(e:Emit){
  const c0=new T.Color(e.c0),c1=new T.Color(e.c1??e.c0);
  for(let k=0;k<e.n;k++){
   if(this.n>=this.N)return;const i=this.n++;
   const sp=rnd(...(e.speed??[0,1])),dir=tmp;
   if(e.dir){dir.copy(e.dir).normalize();const c=e.cone??.4;dir.x+=rnd(-c,c);dir.y+=rnd(-c,c);dir.z+=rnd(-c,c);dir.normalize();}
   else{dir.set(rnd(-1,1),rnd(-1,1),rnd(-1,1)).normalize();}
   dir.y+=e.up??0;
   const s=e.spread??0;
   this.pos[i*3]=e.pos.x+rnd(-s,s);this.pos[i*3+1]=e.pos.y+rnd(-s,s)*.5;this.pos[i*3+2]=e.pos.z+rnd(-s,s);
   this.vel[i*3]=dir.x*sp;this.vel[i*3+1]=dir.y*sp;this.vel[i*3+2]=dir.z*sp;
   this.c0[i*3]=c0.r;this.c0[i*3+1]=c0.g;this.c0[i*3+2]=c0.b;this.c1[i*3]=c1.r;this.c1[i*3+1]=c1.g;this.c1[i*3+2]=c1.b;
   const l=rnd(...(e.life??[.3,.6]));this.life[i]=l;this.max[i]=l;
   const sz=e.size??[.2,.05];this.s0[i]=sz[0]*rnd(.75,1.25);this.s1[i]=sz[1];
   const a=e.a??[1,0];this.a0[i]=a[0];this.a1[i]=a[1];this.grav[i]=e.grav??0;this.drag[i]=e.drag??1.5;
  }
 }
 update(dt:number){
  for(let i=0;i<this.n;i++){
   this.life[i]-=dt;
   if(this.life[i]<=0){this.n--;this.copy(this.n,i);i--;continue;}
   const k=1-this.life[i]/this.max[i],dr=Math.exp(-this.drag[i]*dt);
   this.vel[i*3]*=dr;this.vel[i*3+1]=this.vel[i*3+1]*dr-this.grav[i]*dt;this.vel[i*3+2]*=dr;
   this.pos[i*3]+=this.vel[i*3]*dt;this.pos[i*3+1]+=this.vel[i*3+1]*dt;this.pos[i*3+2]+=this.vel[i*3+2]*dt;
   if(this.pos[i*3+1]<.02&&this.grav[i]>0){this.pos[i*3+1]=.02;this.vel[i*3+1]*=-.3;}
   for(let c=0;c<3;c++)this.col[i*4+c]=this.c0[i*3+c]+(this.c1[i*3+c]-this.c0[i*3+c])*k;
   this.col[i*4+3]=this.a0[i]+(this.a1[i]-this.a0[i])*k;
   this.size[i]=this.s0[i]+(this.s1[i]-this.s0[i])*k;
  }
  this.geo.setDrawRange(0,this.n);
  for(const a of ['position','col','size'])(this.geo.attributes[a] as T.BufferAttribute).needsUpdate=true;
 }
 private copy(from:number,to:number){
  const arr3=[this.pos,this.vel,this.c0,this.c1],arr1=[this.life,this.max,this.s0,this.s1,this.a0,this.a1,this.grav,this.drag,this.size];
  for(const a of arr3){a[to*3]=a[from*3];a[to*3+1]=a[from*3+1];a[to*3+2]=a[from*3+2];}
  for(const a of arr1)a[to]=a[from];
  for(let c=0;c<4;c++)this.col[to*4+c]=this.col[from*4+c];
 }
}

// ---------- shaders for meshes ----------
// sword arc: uv.x runs along the swing (0 tail -> 1 head), uv.y across the blade (0 inner -> 1 outer)
const ARC_V='varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}';
const ARC_F=`uniform float uProg;uniform float uFade;uniform vec3 uColor;uniform vec3 uCore;varying vec2 vUv;
void main(){float head=uProg*1.25;float x=vUv.x;
 float body=smoothstep(head-.95,head,x)*(1.-smoothstep(head,head+.04,x));
 float edge=pow(vUv.y,2.5);float inner=smoothstep(0.,.35,vUv.y);
 float streak=.75+.25*sin(vUv.x*60.+vUv.y*8.);
 float a=max(0.,body*inner*(.25+edge*1.2)*streak*clamp(1.-uFade,0.,1.));
 vec3 c=mix(uColor,uCore,edge*body);gl_FragColor=vec4(c*a,1.);}`;
// soft beam / dome: brightness from facing ratio, scrolling energy along the length
const BEAM_V='varying vec3 vN;varying vec3 vV;varying vec2 vUv;void main(){vUv=uv;vec4 mv=modelViewMatrix*vec4(position,1.);vN=normalize(normalMatrix*normal);vV=normalize(-mv.xyz);gl_Position=projectionMatrix*mv;}';
const BEAM_F=`uniform vec3 uColor;uniform float uTime;uniform float uAlpha;uniform float uPow;varying vec3 vN;varying vec3 vV;varying vec2 vUv;
float h(float n){return fract(sin(n)*43758.5453);}
void main(){float f=abs(dot(normalize(vN),normalize(vV)));float core=pow(f,uPow);
 float s=.7+.3*sin(vUv.y*40.-uTime*30.)*sin(vUv.x*12.+uTime*9.);
 gl_FragColor=vec4(uColor*core*s*uAlpha,1.);}`;
// ground decal: soft ring / disc with ripples
const DECAL_F=`uniform vec3 uColor;uniform float uProg;uniform float uAlpha;uniform float uRipple;varying vec2 vUv;
void main(){vec2 p=vUv*2.-1.;float r=length(p);if(r>1.)discard;
 float ring=smoothstep(uProg-.18,uProg,r)*(1.-smoothstep(uProg,uProg+.04,r));
 float fill=(1.-r)*.35;float rip=uRipple*(.5+.5*sin(r*30.-uProg*40.))*(1.-r);
 gl_FragColor=vec4(uColor*(ring*.95+fill*.45+rip*.25)*uAlpha,1.);}`;

function arcGeometry(r0:number,r1:number,theta:number,seg=40){
 const g=new T.BufferGeometry(),pos:number[]=[],uv:number[]=[],idx:number[]=[];
 for(let i=0;i<=seg;i++){const t=i/seg,a=-theta/2+t*theta;
  for(const [j,r] of [[0,r0],[1,r1]] as const){pos.push(Math.sin(a)*r,0,Math.cos(a)*r);uv.push(t,j);}}
 for(let i=0;i<seg;i++){const a=i*2,b=a+1,c=a+2,d=a+3;idx.push(a,c,b,b,c,d);}
 g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(idx);return g;
}
const glowTex=(()=>{const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d')!;const r=g.createRadialGradient(32,32,0,32,32,32);r.addColorStop(0,'rgba(255,255,255,1)');r.addColorStop(.25,'rgba(255,255,255,.45)');r.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=r;g.fillRect(0,0,64,64);const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;return t;})();
const ELEM:Record<Kind,{core:string;glow:string;hot:string}>={
 pulse:{core:'#e8fdff',glow:'#5fd8ff',hot:'#bff6ff'},fire:{core:'#fff1b0',glow:'#ff5a1a',hot:'#ffb040'},water:{core:'#e6fbff',glow:'#3aa8ff',hot:'#8fd8ff'},
 earth:{core:'#d9b77a',glow:'#9a6a32',hot:'#ffd08a'},energy:{core:'#f0ffff',glow:'#3fe6ff',hot:'#a0f6ff'},filament:{core:'#e8ffe8',glow:'#3ccf6a',hot:'#9dff9e'},
};

interface Timed{t:number;life:number;update:(k:number,dt:number)=>void;done?:()=>void}
export class VFX{
 add=new Particles(3500,true);smoke=new Particles(900,false);
 private timed:Timed[]=[];private shardMesh:T.InstancedMesh;private shards:{p:T.Vector3;v:T.Vector3;r:T.Euler;w:T.Vector3;s:number;life:number}[]=[];
 private bolts:T.LineSegments;private boltPos=new Float32Array(600*6);private boltCol=new Float32Array(600*6);private boltN=0;private boltList:{a:T.Vector3;b:T.Vector3;c:T.Color;life:number;jag:number}[]=[];
 shake=0;
 constructor(private scene:T.Scene){
  scene.add(this.add.pts,this.smoke.pts);
  this.shardMesh=new T.InstancedMesh(new T.DodecahedronGeometry(.12,0),new T.MeshStandardMaterial({color:'#6b5238',roughness:.95,flatShading:true}),220);
  this.shardMesh.count=0;this.shardMesh.castShadow=true;this.shardMesh.frustumCulled=false;scene.add(this.shardMesh);
  const bg=new T.BufferGeometry();bg.setAttribute('position',new T.BufferAttribute(this.boltPos,3).setUsage(T.DynamicDrawUsage));bg.setAttribute('color',new T.BufferAttribute(this.boltCol,3).setUsage(T.DynamicDrawUsage));
  this.bolts=new T.LineSegments(bg,new T.LineBasicMaterial({vertexColors:true,transparent:true,blending:T.AdditiveBlending,depthWrite:false}));this.bolts.frustumCulled=false;scene.add(this.bolts);
 }
 setView(height:number,fov:number){const s=height/(2*Math.tan(fov*Math.PI/360));this.add.mat.uniforms.uScale.value=s;this.smoke.mat.uniforms.uScale.value=s;}
 emit(e:Emit){this.add.emit(e);}
 puff(e:Emit){this.smoke.emit(e);}
 private run(t:Timed){this.timed.push(t);}
 update(dt:number){
  this.add.update(dt);this.smoke.update(dt);
  for(let i=this.timed.length-1;i>=0;i--){const t=this.timed[i];t.t+=dt;const k=Math.min(1,t.t/t.life);t.update(k,dt);if(k>=1){t.done?.();this.timed.splice(i,1);}}
  // shards
  const m=new T.Matrix4(),q=new T.Quaternion();
  for(let i=this.shards.length-1;i>=0;i--){const s=this.shards[i];s.life-=dt;s.v.y-=14*dt;s.p.addScaledVector(s.v,dt);if(s.p.y<s.s*.5){s.p.y=s.s*.5;s.v.multiplyScalar(.4);s.v.y=Math.abs(s.v.y)*.3;}s.r.x+=s.w.x*dt;s.r.y+=s.w.y*dt;if(s.life<=0)this.shards.splice(i,1);}
  this.shards.forEach((s,i)=>{const sc=s.s*Math.min(1,s.life*2);m.compose(s.p,q.setFromEuler(s.r),tmp.set(sc,sc,sc));this.shardMesh.setMatrixAt(i,m);});
  this.shardMesh.count=this.shards.length;this.shardMesh.instanceMatrix.needsUpdate=true;
  // lightning
  this.boltN=0;
  for(let i=this.boltList.length-1;i>=0;i--){const b=this.boltList[i];b.life-=dt;if(b.life<=0){this.boltList.splice(i,1);continue;}this.jag(b.a,b.b,b.c.clone().multiplyScalar(Math.min(1,b.life*8)),b.jag);}
  this.bolts.geometry.setDrawRange(0,this.boltN*2);(this.bolts.geometry.attributes.position as T.BufferAttribute).needsUpdate=true;(this.bolts.geometry.attributes.color as T.BufferAttribute).needsUpdate=true;
  this.shake*=Math.exp(-dt*7);
 }
 private jag(a:T.Vector3,b:T.Vector3,c:T.Color,amp:number){
  const segs=7;let prev=a.clone();
  for(let i=1;i<=segs;i++){
   if(this.boltN>=600)return;
   const p=a.clone().lerp(b,i/segs);if(i<segs)p.add(tmp2.set(rnd(-amp,amp),rnd(-amp,amp),rnd(-amp,amp)));
   const o=this.boltN*6;this.boltPos.set([prev.x,prev.y,prev.z,p.x,p.y,p.z],o);this.boltCol.set([c.r,c.g,c.b,c.r,c.g,c.b],o);this.boltN++;prev=p;
  }
 }
 lightning(a:T.Vector3,b:T.Vector3,color='#9ff4ff',life=.12,jag=.25){this.boltList.push({a:a.clone(),b:b.clone(),c:new T.Color(color),life,jag});}
 shard(p:T.Vector3,v:T.Vector3,s=1){if(this.shards.length<220)this.shards.push({p:p.clone(),v:v.clone(),r:new T.Euler(rnd(0,6),rnd(0,6),0),w:V().set(rnd(-12,12),rnd(-12,12),0),s:s*rnd(.6,1.4),life:rnd(.8,1.4)});}
 glow(p:T.Vector3,color:string,size:number,life:number,parent?:T.Object3D){
  const s=new T.Sprite(new T.SpriteMaterial({map:glowTex,color,blending:T.AdditiveBlending,depthWrite:false,transparent:true}));s.position.copy(p);(parent??this.scene).add(s);
  this.run({t:0,life,update:k=>{s.scale.setScalar(size*(1+k*.6));s.material.opacity=1-k;},done:()=>{s.removeFromParent();s.material.dispose();}});
 }
 decal(p:T.Vector3,color:string,radius:number,life:number,ripple=0,strength=1){
  const m=new T.Mesh(new T.PlaneGeometry(radius*2,radius*2).rotateX(-Math.PI/2),new T.ShaderMaterial({vertexShader:ARC_V,fragmentShader:DECAL_F,uniforms:{uColor:{value:new T.Color(color)},uProg:{value:0},uAlpha:{value:1},uRipple:{value:ripple}},transparent:true,depthWrite:false,blending:T.AdditiveBlending}));
  m.position.copy(p).setY(.04);this.scene.add(m);
  this.run({t:0,life,update:k=>{(m.material as T.ShaderMaterial).uniforms.uProg.value=.25+k*.75;(m.material as T.ShaderMaterial).uniforms.uAlpha.value=strength*(1-k*k);},done:()=>{m.removeFromParent();m.geometry.dispose();(m.material as T.Material).dispose();}});
 }

 // ---------- warrior ----------
 // sword cut: a bright crescent that sweeps with the blade, then a wind blade detaches and flies forward
 slash(center:T.Vector3,heading:number,flip:boolean,color='#6fe4ff'){
  const mk=(r0:number,r1:number,th:number)=>new T.Mesh(arcGeometry(r0,r1,th),new T.ShaderMaterial({vertexShader:ARC_V,fragmentShader:ARC_F,uniforms:{uProg:{value:0},uFade:{value:0},uColor:{value:new T.Color(color)},uCore:{value:new T.Color('#ffffff')}},transparent:true,depthWrite:false,side:T.DoubleSide,blending:T.AdditiveBlending}));
  const g=new T.Group();g.position.copy(center).setY(1.05);g.rotation.set(0,heading,0);this.scene.add(g);
  const tilt=new T.Group();tilt.rotation.z=flip?-.42:.42;g.add(tilt);
  const arc=mk(.6,2.3,2.6);arc.scale.x=flip?-1:1;tilt.add(arc);
  const wind=mk(1.2,2.0,1.7);wind.scale.x=flip?-1:1;wind.visible=false;tilt.add(wind);
  this.run({t:0,life:.5,update:k=>{
   const u=(arc.material as T.ShaderMaterial).uniforms;u.uProg.value=Math.min(1,k/.35);u.uFade.value=Math.max(0,(k-.35)/.3);
   if(k>.18){wind.visible=true;const w=(wind.material as T.ShaderMaterial).uniforms,kk=(k-.18)/.82;w.uProg.value=1;w.uFade.value=kk;wind.position.z=kk*4.2;wind.scale.y=1;}
  },done:()=>{g.removeFromParent();for(const m of [arc,wind]){m.geometry.dispose();(m.material as T.Material).dispose();}}});
  // wind dust at the end of the swing
  const f=tmp.set(Math.sin(heading),0,Math.cos(heading));
  this.emit({pos:center.clone().addScaledVector(f,1.6).setY(1),n:14,dir:f.clone(),cone:.5,speed:[3,7],life:[.25,.45],size:[.25,.05],c0:'#dffaff',c1:color,a:[.7,0],drag:3});
 }
 // Twisting Slash: the hero spins and blade arcs whirl around, wind sucked into the vortex
 twist(center:()=>T.Vector3,radius:number,dur:number,color='#6fe4ff'){
  const g=new T.Group();this.scene.add(g);const arcs:T.Mesh[]=[];
  for(let i=0;i<3;i++){
   const m=new T.Mesh(arcGeometry(radius*.8,radius,Math.PI*1.1,48),new T.ShaderMaterial({vertexShader:ARC_V,fragmentShader:ARC_F,uniforms:{uProg:{value:1},uFade:{value:0},uColor:{value:new T.Color(color)},uCore:{value:new T.Color('#ffffff')}},transparent:true,depthWrite:false,side:T.DoubleSide,blending:T.AdditiveBlending}));
   const holder=new T.Group();holder.position.y=.55+i*.38;holder.rotation.x=(i-1)*.18;holder.add(m);g.add(holder);arcs.push(m);
  }
  this.decal(center(),color,radius*1.05,dur+.3,.4,.45);
  this.run({t:0,life:dur,update:(k,dt)=>{
   const c=center();g.position.copy(c);
   arcs.forEach((m,i)=>{m.rotation.y-=dt*(20+i*3);const u=(m.material as T.ShaderMaterial).uniforms;u.uFade.value=k<.8?.45:.45+.55*(k-.8)/.2;u.uProg.value=.85+.15*Math.sin(k*30+i);});
   for(let i=0;i<2;i++){const a=rnd(0,6.28),r=radius*rnd(.6,1.1);const p=tmp.set(c.x+Math.cos(a)*r,rnd(.2,1.6),c.z+Math.sin(a)*r);
    this.emit({pos:p,n:1,dir:tmp2.set(-Math.sin(a),0,Math.cos(a)),cone:.2,speed:[6,10],life:[.2,.35],size:[.22,.04],c0:'#e8fdff',c1:color,a:[.6,0],drag:2});}
  },done:()=>{g.removeFromParent();arcs.forEach(m=>{m.geometry.dispose();(m.material as T.Material).dispose();});}});
 }
 // ---------- hunter ----------
 // Final-Spark style: energy gathers at the muzzle, then a huge beam tears forward
 spark(from:()=>T.Vector3,dir:()=>T.Vector3,len:number,charge:number,fire:()=>void,color='#38c8ff'){
  const orb=new T.Sprite(new T.SpriteMaterial({map:glowTex,color,blending:T.AdditiveBlending,depthWrite:false,transparent:true}));this.scene.add(orb);
  this.run({t:0,life:charge,update:k=>{
   const p=from();orb.position.copy(p);orb.scale.setScalar(.3+k*1.6);
   for(let i=0;i<3;i++){const o=tmp.set(rnd(-1,1),rnd(-1,1),rnd(-1,1)).normalize().multiplyScalar(rnd(1.2,2.2));
    this.emit({pos:p.clone().add(o),n:1,dir:o.clone().negate(),cone:.05,speed:[5,8],life:[.22,.3],size:[.12,.02],c0:'#ffffff',c1:color,a:[.2,1],drag:0});}
   if(Math.random()<.4)this.lightning(p,p.clone().add(tmp.set(rnd(-.8,.8),rnd(-.6,.6),rnd(-.8,.8))),color,.06,.12);
  },done:()=>{
   orb.removeFromParent();orb.material.dispose();fire();this.shake=.35;
   const outer=new T.Mesh(new T.CylinderGeometry(1,1,len,24,1,true).rotateX(Math.PI/2).translate(0,0,len/2),new T.ShaderMaterial({vertexShader:BEAM_V,fragmentShader:BEAM_F,uniforms:{uColor:{value:new T.Color(color)},uTime:{value:0},uAlpha:{value:1},uPow:{value:2.2}},transparent:true,depthWrite:false,blending:T.AdditiveBlending,side:T.DoubleSide}));
   const core=new T.Mesh(new T.CylinderGeometry(.32,.32,len,16,1,true).rotateX(Math.PI/2).translate(0,0,len/2),new T.ShaderMaterial({vertexShader:BEAM_V,fragmentShader:BEAM_F,uniforms:{uColor:{value:new T.Color('#e8fbff')},uTime:{value:0},uAlpha:{value:.85},uPow:{value:1.4}},transparent:true,depthWrite:false,blending:T.AdditiveBlending,side:T.DoubleSide}));
   const g=new T.Group();g.add(outer,core);this.scene.add(g);
   const mouth=new T.Sprite(new T.SpriteMaterial({map:glowTex,color:'#ffffff',blending:T.AdditiveBlending,depthWrite:false,transparent:true}));g.add(mouth);mouth.scale.setScalar(3.2);
   const L=.75;
   this.run({t:0,life:L,update:(k,dt)=>{
    const p=from(),d=dir();g.position.copy(p);g.lookAt(p.clone().add(d));
    const w=k<.1?k/.1:k>.75?1-(k-.75)/.25:1;const wob=1+Math.sin(k*90)*.05;
    outer.scale.set(w*.9*wob,w*.9*wob,1);core.scale.set(w*wob,w*wob,1);
    for(const m of[outer,core]){const u=(m.material as T.ShaderMaterial).uniforms;u.uTime.value+=dt;}
    mouth.material.opacity=w;
    for(let i=0;i<5;i++){const along=rnd(0,len);this.emit({pos:p.clone().addScaledVector(d,along).add(tmp.set(rnd(-.9,.9),rnd(-.9,.9),rnd(-.9,.9)).multiplyScalar(w)),n:1,dir:d,cone:.3,speed:[4,10],life:[.2,.4],size:[.18,.03],c0:'#ffffff',c1:color,a:[.9,0],drag:2});}
   },done:()=>{g.removeFromParent();for(const m of[outer,core]){m.geometry.dispose();(m.material as T.Material).dispose();}mouth.material.dispose();}});
  }});
 }
 // ---------- projectiles ----------
 projectile(kind:Kind):T.Object3D{
  const c=ELEM[kind],g=new T.Group();
  const glow=new T.Sprite(new T.SpriteMaterial({map:glowTex,color:c.glow,blending:T.AdditiveBlending,depthWrite:false,transparent:true}));
  if(kind==='earth'){
   const rock=new T.Mesh(new T.DodecahedronGeometry(.16,0),new T.MeshStandardMaterial({color:'#7a5b3a',roughness:.9,flatShading:true,emissive:'#2a1405'}));rock.name='spin';g.add(rock);glow.scale.setScalar(.6);glow.material.opacity=.5;
  }else if(kind==='water'){
   const ball=new T.Mesh(new T.SphereGeometry(.17,16,12),new T.ShaderMaterial({vertexShader:BEAM_V,fragmentShader:BEAM_F,uniforms:{uColor:{value:new T.Color('#8fd8ff')},uTime:{value:0},uAlpha:{value:1.2},uPow:{value:.6}},transparent:true,depthWrite:false,blending:T.AdditiveBlending}));g.add(ball);glow.scale.setScalar(.9);
  }else if(kind==='pulse'){
   const s=new T.Mesh(new T.SphereGeometry(.07,10,8),new T.MeshBasicMaterial({color:c.core}));s.scale.set(1,1,7);g.add(s);glow.scale.setScalar(.7);
  }else{
   const s=new T.Mesh(new T.SphereGeometry(kind==='fire'?.13:.1,12,10),new T.MeshBasicMaterial({color:c.core}));g.add(s);glow.scale.setScalar(kind==='fire'?1.3:1);
  }
  g.add(glow);this.scene.add(g);return g;
 }
 // called every frame while the projectile flies
 trail(kind:Kind,o:T.Object3D,v:T.Vector3,dt:number){
  const p=o.position,c=ELEM[kind],back=tmp2.copy(v).normalize().negate();
  if(kind==='fire'){
   this.emit({pos:p,n:4,dir:back,cone:.5,speed:[.5,2],up:.6,life:[.25,.45],size:[.45,.1],c0:'#ffd36a',c1:'#ff3a0a',a:[.9,0],drag:2,spread:.06});
   if(Math.random()<.4)this.puff({pos:p,n:1,dir:back,cone:.4,speed:[.3,.8],up:.8,life:[.6,.9],size:[.3,.8],c0:'#2b2622',c1:'#151312',a:[.35,0],drag:1});
  }else if(kind==='water'){
   this.emit({pos:p,n:2,dir:back,cone:.6,speed:[.5,1.5],life:[.35,.55],size:[.12,.04],c0:'#d8f6ff',c1:'#3a8fff',a:[.9,0],grav:6,spread:.08});
  }else if(kind==='earth'){
   const r=o.getObjectByName('spin');if(r){r.rotation.x+=dt*14;r.rotation.y+=dt*9;}
   if(Math.random()<.6)this.puff({pos:p,n:1,dir:back,cone:.5,speed:[.3,1],life:[.4,.7],size:[.2,.6],c0:'#7a6448',c1:'#4a3a2a',a:[.45,0],drag:2});
  }else if(kind==='energy'){
   this.emit({pos:p,n:2,dir:back,cone:1,speed:[.5,2.5],life:[.12,.25],size:[.12,.02],c0:'#ffffff',c1:c.glow,a:[1,0],drag:3});
   if(Math.random()<.7)this.lightning(p,p.clone().add(tmp.set(rnd(-.5,.5),rnd(-.4,.4),rnd(-.5,.5))),c.hot,.05,.1);
  }else if(kind==='filament'){
   const t=performance.now()/90;const side=tmp.set(-back.z,0,back.x).multiplyScalar(Math.sin(t)*.12);
   this.emit({pos:p.clone().add(side),n:2,dir:back,cone:.2,speed:[.2,.6],life:[.35,.55],size:[.1,.02],c0:'#dfffe0',c1:'#2fae5a',a:[.9,0],drag:1});
  }else{
   this.emit({pos:p,n:2,dir:back,cone:.15,speed:[1,3],life:[.1,.18],size:[.14,.02],c0:'#ffffff',c1:c.glow,a:[.9,0],drag:3});
  }
 }
 // muzzle flash when a shot leaves the weapon
 muzzle(kind:Kind,p:T.Vector3,dir:T.Vector3){
  const c=ELEM[kind];this.glow(p,c.hot,kind==='pulse'?.9:.7,.1);
  this.emit({pos:p,n:8,dir,cone:.35,speed:[2,6],life:[.08,.16],size:[.12,.02],c0:'#ffffff',c1:c.glow,a:[1,0],drag:4});
 }
 impact(kind:Kind,p:T.Vector3,dir:T.Vector3){
  const c=ELEM[kind],at=p.clone();
  if(kind==='fire'){
   this.glow(at,'#ff7a2a',2.2,.25);
   this.emit({pos:at,n:26,speed:[1.5,5],up:.5,life:[.3,.6],size:[.55,.1],c0:'#ffe08a',c1:'#ff2a0a',a:[1,0],drag:3});
   this.emit({pos:at,n:14,speed:[4,9],up:.6,life:[.3,.6],size:[.07,.02],c0:'#fff3c0',c1:'#ff6a20',grav:9,drag:1});
   this.puff({pos:at,n:6,speed:[.4,1.2],up:1,life:[.8,1.3],size:[.5,1.4],c0:'#2e2924',c1:'#111',a:[.45,0],drag:1});
  }else if(kind==='water'){
   this.glow(at,'#5fb8ff',1.6,.2);this.decal(at,'#5fb8ff',1.4,.6,1);
   this.emit({pos:at,n:30,dir:tmp.set(0,1,0),cone:.9,speed:[2.5,6],life:[.45,.8],size:[.13,.05],c0:'#e8fbff',c1:'#2e7fff',a:[1,.2],grav:12,drag:.5});
   this.puff({pos:at,n:5,speed:[.5,1.5],life:[.4,.7],size:[.4,1],c0:'#bfe8ff',c1:'#6fb6e8',a:[.3,0],drag:2});
  }else if(kind==='earth'){
   for(let i=0;i<9;i++)this.shard(at,tmp.set(rnd(-1,1)+dir.x*.6,rnd(.8,1.8),rnd(-1,1)+dir.z*.6).normalize().multiplyScalar(rnd(3,6.5)),.9);
   this.puff({pos:at.clone().setY(.4),n:10,speed:[.8,2.4],up:.3,life:[.7,1.2],size:[.6,1.6],c0:'#8a7356',c1:'#4a3d2e',a:[.55,0],drag:2});
   this.decal(at,'#c8923e',1.3,.45);
  }else if(kind==='energy'){
   this.glow(at,'#9ff4ff',1.8,.18);
   for(let i=0;i<6;i++)this.lightning(at,at.clone().add(tmp.set(rnd(-1.4,1.4),rnd(-.4,1.2),rnd(-1.4,1.4))),'#bff8ff',.14,.22);
   this.emit({pos:at,n:22,speed:[3,8],life:[.15,.35],size:[.1,.02],c0:'#ffffff',c1:'#3fe6ff',a:[1,0],drag:2});
  }else if(kind==='filament'){
   this.glow(at,'#6dff9a',1.2,.2);
   this.emit({pos:at,n:22,speed:[1,3.5],life:[.4,.8],size:[.12,.03],c0:'#e8ffe8',c1:'#2fae5a',a:[1,0],drag:2,grav:-1});
  }else{
   this.glow(at,c.glow,1.1,.14);
   this.emit({pos:at,n:16,dir:dir.clone().negate(),cone:.8,speed:[3,8],life:[.1,.28],size:[.1,.02],c0:'#ffffff',c1:c.glow,a:[1,0],drag:2,grav:5});
  }
 }
 // generic melee hit sparks
 hitSpark(p:T.Vector3,dir:T.Vector3,color='#8fe8ff'){
  this.glow(p,color,1,.12);
  this.emit({pos:p,n:12,dir,cone:.7,speed:[3,8],life:[.1,.25],size:[.1,.02],c0:'#ffffff',c1:color,a:[1,0],grav:6,drag:2});
 }
 // ---------- astral fields ----------
 field(kind:Kind,at:T.Vector3,radius:number){
  const c=ELEM[kind];
  if(kind==='fire'){
   this.decal(at,'#ff5a1a',radius,1.6);this.glow(at.clone().setY(.6),'#ff7a2a',radius*1.4,.35);
   this.run({t:0,life:1.4,update:()=>{for(let i=0;i<5;i++){const a=rnd(0,6.28),r=radius*Math.sqrt(Math.random());
    this.emit({pos:tmp.set(at.x+Math.cos(a)*r,.1,at.z+Math.sin(a)*r),n:1,dir:tmp2.set(0,1,0),cone:.15,speed:[1.5,3.2],life:[.35,.6],size:[.6,.1],c0:'#ffe08a',c1:'#ff2a0a',a:[.9,0],drag:1});}
    if(Math.random()<.3)this.puff({pos:tmp.set(at.x+rnd(-radius,radius)*.6,.6,at.z+rnd(-radius,radius)*.6),n:1,dir:tmp2.set(0,1,0),cone:.2,speed:[.6,1.2],life:[1,1.6],size:[.6,1.8],c0:'#2e2924',c1:'#111',a:[.35,0],drag:.6});}});
  }else if(kind==='water'){
   this.decal(at,'#3aa8ff',radius,1.4,1.5);
   for(let j=0;j<6;j++){const a=j/6*6.28,r=radius*.6;const p=tmp.set(at.x+Math.cos(a)*r,.1,at.z+Math.sin(a)*r).clone();
    this.emit({pos:p,n:16,dir:tmp2.set(0,1,0),cone:.25,speed:[4,8],life:[.6,.9],size:[.16,.05],c0:'#eafcff',c1:'#2a7cff',a:[1,.2],grav:14,drag:.3});}
   this.emit({pos:at.clone().setY(.2),n:40,dir:tmp2.set(0,1,0),cone:1,speed:[2,5],life:[.6,1],size:[.12,.04],c0:'#eafcff',c1:'#2a7cff',a:[1,.2],grav:12,drag:.5,spread:radius*.7});
  }else if(kind==='earth'){
   this.decal(at,'#c8923e',radius,1.2);this.shake=Math.max(this.shake,.25);
   const spikes:T.Mesh[]=[];const mat=new T.MeshStandardMaterial({color:'#6e5236',roughness:.95,flatShading:true});
   for(let i=0;i<9;i++){const a=rnd(0,6.28),r=radius*Math.sqrt(Math.random())*.9,h=rnd(.8,1.7);
    const m=new T.Mesh(new T.ConeGeometry(rnd(.18,.32),h,5),mat);m.position.set(at.x+Math.cos(a)*r,-h/2,at.z+Math.sin(a)*r);m.rotation.set(rnd(-.3,.3),rnd(0,6),rnd(-.3,.3));m.castShadow=true;m.userData.h=h;this.scene.add(m);spikes.push(m);}
   this.puff({pos:at.clone().setY(.3),n:16,speed:[1,3],up:.3,life:[.8,1.3],size:[.7,1.8],c0:'#8a7356',c1:'#4a3d2e',a:[.5,0],drag:2,spread:radius*.6});
   this.run({t:0,life:1.3,update:k=>{const rise=k<.12?k/.12:k>.7?1-(k-.7)/.3:1;spikes.forEach(m=>m.position.y=-m.userData.h/2+m.userData.h*.85*rise);},done:()=>{spikes.forEach(m=>{m.removeFromParent();m.geometry.dispose();});mat.dispose();}});
  }else{
   const dome=new T.Mesh(new T.SphereGeometry(radius,28,16,0,Math.PI*2,0,Math.PI/2),new T.ShaderMaterial({vertexShader:BEAM_V,fragmentShader:BEAM_F,uniforms:{uColor:{value:new T.Color(c.glow)},uTime:{value:0},uAlpha:{value:1},uPow:{value:.35}},transparent:true,depthWrite:false,blending:T.AdditiveBlending,side:T.DoubleSide}));
   dome.position.copy(at).setY(0);this.scene.add(dome);this.decal(at,c.glow,radius,.9);
   this.run({t:0,life:.9,update:(k,dt)=>{const u=(dome.material as T.ShaderMaterial).uniforms;u.uTime.value+=dt;u.uAlpha.value=k<.1?k*10:1-(k-.1)/.9;dome.scale.setScalar(.6+.4*Math.min(1,k*5));
    for(let i=0;i<2;i++){const a=rnd(0,6.28),b=rnd(0,6.28);this.lightning(tmp.set(at.x+Math.cos(a)*radius*.9,rnd(.1,radius*.6),at.z+Math.sin(a)*radius*.9),tmp2.set(at.x+Math.cos(b)*radius*.3,rnd(.5,radius*.8),at.z+Math.sin(b)*radius*.3),'#bff8ff',.08,.3);}},
    done:()=>{dome.removeFromParent();dome.geometry.dispose();(dome.material as T.Material).dispose();}});
  }
 }
 // ---------- status effects on enemies (call each frame) ----------
 burning(p:T.Vector3){this.emit({pos:tmp.set(p.x,rnd(.4,1.6),p.z),n:1,dir:tmp2.set(0,1,0),cone:.3,speed:[.8,1.8],life:[.3,.5],size:[.35,.06],c0:'#ffd36a',c1:'#ff2a0a',a:[.9,0],drag:1,spread:.25});}
 wet(p:T.Vector3){if(Math.random()<.5)this.emit({pos:tmp.set(p.x,rnd(1,1.8),p.z),n:1,dir:tmp2.set(0,-1,0),cone:.1,speed:[.2,.6],life:[.4,.6],size:[.09,.04],c0:'#d8f6ff',c1:'#3a8fff',a:[.9,.3],grav:6,spread:.3});}
 marked(p:T.Vector3){if(Math.random()<.5)this.emit({pos:tmp.set(p.x,2.25,p.z),n:1,dir:tmp2.set(0,1,0),cone:1,speed:[.1,.4],life:[.4,.7],size:[.12,.03],c0:'#dfffe0',c1:'#2fae5a',a:[1,0],drag:1,spread:.25});}
 petTrail(p:T.Vector3){this.emit({pos:tmp.set(p.x,.5,p.z),n:3,speed:[.3,1.2],life:[.3,.5],size:[.25,.04],c0:'#dfffe0',c1:'#2fae5a',a:[.8,0],drag:2,spread:.3});}
}
