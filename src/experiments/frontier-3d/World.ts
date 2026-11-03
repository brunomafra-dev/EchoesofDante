import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';

export type Solid={x:number;z:number;radius:number;tag:string};
export const SPAWN=new T.Vector3(0,0,9);
export const IVO=new T.Vector3(-5,0,0);
export const BEACON=new T.Vector3(8,0,-7);
export const ENEMY=new T.Vector3(7,0,-1);
export function elevation(x:number,z:number):number {
 const edge=T.MathUtils.smoothstep(Math.hypot(x,z),18,38);
 return edge*(1.2+Math.sin(x*.18)*.9+Math.cos(z*.22)*.7);
}
const mat=(color:number,metalness=0,roughness=.85)=>new T.MeshStandardMaterial({color,metalness,roughness});
export class FrontierWorld {
 readonly scene=new T.Scene();
 readonly solids:Solid[]=[];
 readonly cameraBodies:T.Object3D[]=[];
 readonly beaconLight:T.Mesh;
 readonly beaconRing:T.Mesh;
 readonly sun:T.DirectionalLight;
 readonly dust:T.Points;
 readonly wind={value:0};
 private batches=new Map<T.Material,T.BufferGeometry[]>();
 private randomState=182;
 private random(){this.randomState=(1664525*this.randomState+1013904223)>>>0;return this.randomState/4294967296;}
 constructor(readonly renderer:T.WebGLRenderer){
  const s=this.scene;s.background=new T.Color('#88a69a');s.fog=new T.FogExp2('#8ea99b',.014);
  s.add(new T.HemisphereLight('#d5e8e3','#74674b',2.3));s.add(new T.AmbientLight('#c4d2c5',.35));
  this.sun=new T.DirectionalLight('#ffdfa6',3.2);this.sun.position.set(-18,30,8);this.sun.castShadow=true;
  this.sun.shadow.mapSize.set(2048,2048);Object.assign(this.sun.shadow.camera,{left:-30,right:30,top:30,bottom:-30,near:1,far:90});this.sun.shadow.normalBias=.035;this.sun.shadow.bias=-.00015;s.add(this.sun);
  const sky=new T.Mesh(new T.SphereGeometry(180,24,16),new T.ShaderMaterial({side:T.BackSide,depthWrite:false,uniforms:{top:{value:new T.Color('#244a50')},bottom:{value:new T.Color('#b8c4a3')}},vertexShader:'varying vec3 direction; void main(){ direction=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }',fragmentShader:'varying vec3 direction; uniform vec3 top; uniform vec3 bottom; void main(){float h=normalize(direction).y; gl_FragColor=vec4(mix(bottom,top,smoothstep(-.05,.8,h)),1.); }'}));s.add(sky);
  const moon=new T.Mesh(new T.SphereGeometry(7,32,24),new T.MeshBasicMaterial({color:'#c5d5b7',fog:false}));moon.position.set(32,30,-95);s.add(moon);
  const earth=mat(0xaba77c);earth.vertexColors=true;
  const loader=new T.TextureLoader();
  const texture=(suffix:string,color=false,material='Ground037')=>{const t=loader.load(`/assets/frontier-3d/${material}_1K-JPG_${suffix}.webp`);t.wrapS=t.wrapT=T.RepeatWrapping;t.repeat.set(material==='Ground037'?24:2,material==='Ground037'?24:2);t.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());if(color)t.colorSpace=T.SRGBColorSpace;return t;};
  earth.map=texture('Color',true);earth.normalMap=texture('NormalGL');earth.normalScale.set(.65,.65);earth.roughnessMap=texture('Roughness');
  const ground=new T.PlaneGeometry(100,100,140,140);ground.rotateX(-Math.PI/2);const p=ground.attributes.position,colors=[];
  for(let i=0;i<p.count;i++) {const x=p.getX(i),z=p.getZ(i);p.setY(i,elevation(x,z));const trail=Math.exp(-Math.pow((x-Math.sin(z*.14)*2)/3.6,2))*.6;const c=new T.Color('#9dba86').lerp(new T.Color('#e6bd82'),trail);colors.push(c.r,c.g,c.b);}
  ground.setAttribute('color',new T.Float32BufferAttribute(colors,3));ground.computeVertexNormals();const floor=new T.Mesh(ground,earth);floor.receiveShadow=true;s.add(floor);
  const stone=mat(0xb8c0a8),stone2=mat(0xd6cfb0),bark=mat(0x625d48),metal=mat(0xa1aaa0,.3,.7),dark=mat(0x475953,.28,.7),orange=mat(0xc28b4b,.28,.6),glass=mat(0x367c7d,.48,.23),linen=mat(0xbfb288),glow=mat(0x6cd4bd,.1,.3);
  const rockColor=texture('Color',true,'Rock035'),rockNormal=texture('NormalGL',false,'Rock035'),rockRough=texture('Roughness',false,'Rock035');
  for(const m of [stone,stone2,bark]){m.map=rockColor;m.normalMap=rockNormal;m.normalScale.set(.35,.35);m.roughnessMap=rockRough;m.roughness=1;if(m!==bark)m.color.multiplyScalar(2.5);}
  glow.emissive=new T.Color('#48bba7');glow.emissiveIntensity=1.3;
  const box=new RoundedBoxGeometry(1,1,1,2,.1),rock=new T.IcosahedronGeometry(1,2),tube=new T.CylinderGeometry(1,1,1,10);
  const add=(g:T.BufferGeometry,m:T.Material,x:number,y:number,z:number,sx=1,sy=1,sz=1,ry=0)=>this.static(g,m,new T.Vector3(x,y,z),new T.Vector3(sx,sy,sz),ry);
  // Whole salvage habitat. Walls, window, ribs and entry have a shared 3D volume.
  add(box,dark,-9,1.75,-5,8,3.5,5);
  add(box,metal,-9,1.9,-5,7.7,3.3,4.85);
  add(box,linen,-9,3.55,-5,8.1,.26,5.15);
  for(const x of [-12,-9,-6]){add(box,orange,x,3.75,-5,.22,.24,5.2);add(box,orange,x,1.8,-2.52,.22,3.4,.13);}
  for(const x of [-12.4,-10.9,-7,-5.6]){add(box,dark,x,1.8,-2.54,.035,2.85,.03);for(const y of [.55,2.9])add(new T.CylinderGeometry(.045,.045,.04,6).rotateX(Math.PI/2),orange,x,y,-2.59);}
  for(let i=0;i<6;i++)add(box,dark,-5.04,1.5+i*.13,-5,.05,.055,1.55);
  add(box,orange,-5.04,2.7,-5,.08,.09,3.5);add(box,dark,-9,3.74,-5,3.5,.14,2.2);
  for(let i=0;i<8;i++)add(box,metal,-10.4+i*.4,3.83,-5,.18,.08,1.8);
  add(box,dark,-8.8,1.4,-2.5,1.65,2.7,.15);add(box,orange,-8.8,2.8,-2.35,1.9,.15,.2);
  add(box,glass,-11.6,2,-2.42,1.5,.95,.16);add(box,glass,-6.7,2,-2.42,1.1,.95,.16);
  for(const x of [-12,-5.8]) {add(tube,dark,x,.32,-5,.25,.65,.25);}
  // Low threshold and ramp are traversable, the cabin itself is solid.
  add(box,dark,-8.8,.12,-1.5,2.1,.24,1.7);
  const awning=new T.PlaneGeometry(6.3,3);awning.rotateX(-Math.PI/2);awning.rotateZ(-.08);add(awning,new T.MeshStandardMaterial({color:0xb8a783,side:T.DoubleSide,roughness:1}),-8.7,2.65,-.8);
  for(const x of [-11.6,-5.8])add(tube,orange,x,1.3,.5,.055,2.6,.055);
  this.solids.push({x:-9,z:-5,radius:0,tag:'habitat'});
  // Tank, pipe and working bench: props sit on supports rather than hovering.
  add(tube,metal,-14,1.55,-4,1.05,3.1,1.05);add(tube,orange,-14,2.85,-4,1.1,.16,1.1);add(tube,dark,-14,.22,-4,1.18,.42,1.18);this.solid(-14,-4,1.2,'reservatório');
  const hose=new T.CatmullRomCurve3([new T.Vector3(-14,.6,-2.9),new T.Vector3(-14,.15,-.7),new T.Vector3(-10,.15,1.5),new T.Vector3(-7,.15,1.4)]);add(new T.TubeGeometry(hose,28,.07,6,false),dark,0,0,0);
  add(box,dark,-5,.9,-1,2.5,.18,1.1);for(const x of [-5.95,-4.05])add(box,metal,x,.45,-1,.12,.9,.85);
  add(box,metal,-5,1.06,-1,.8,.16,.4);add(box,orange,-4.4,1.2,-1,.15,.32,.15);
  add(box,glass,-5.8,1.2,-1,.45,.35,.1);
  for(let i=0;i<3;i++){add(box,metal,-12+i*1.2,.35,2.6,1,.7,.8);add(box,orange,-12+i*1.2,.35,3.02,.12,.7,.04);this.solid(-12+i*1.2,2.6,.57,'caixa');}
  this.solid(-5,-1,1.4,'bancada');
  // Survey beacon and two low solar panels frame the encounter.
  add(tube,dark,8,.24,-7,1.1,.48,1.1);add(tube,metal,8,1.6,-7,.18,2.8,.18);
  add(box,dark,8,2.8,-7,1,.55,.6);add(box,glass,8,2.8,-6.67,.78,.32,.05);
  this.beaconLight=new T.Mesh(new T.SphereGeometry(.16,12,8),glow);this.beaconLight.position.set(8,3.3,-7);s.add(this.beaconLight);this.solid(8,-7,.55,'baliza');
  this.beaconRing=new T.Mesh(new T.RingGeometry(.9,1,48),new T.MeshBasicMaterial({color:'#d3b67f',side:T.DoubleSide,transparent:true,opacity:.65,depthWrite:false}));this.beaconRing.rotation.x=-Math.PI/2;this.beaconRing.position.set(8,.04,-7);s.add(this.beaconRing);
  for(const x of [11,14]){add(tube,dark,x,.7,-10,.1,1.4,.1);const panel=new T.BoxGeometry(2.2,.08,1.7);panel.rotateX(.3);add(panel,glass,x,1.4,-10);for(let i=-1;i<=1;i++)add(box,metal,x+i*.63,1.47,-10,.025,.05,1.7);this.solid(x,-10,1,'painel');}
  // Rounded mineral shelves and roots leave the central clearing navigable.
  for(let i=0;i<65;i++){
   const angle=this.random()*Math.PI*2,r=19+this.random()*25,x=Math.cos(angle)*r,z=Math.sin(angle)*r,sz=1+this.random()*3;
   add(rock,i%3?stone:stone2,x,elevation(x,z)+sz*.38,z,sz*1.5,sz*.8,sz,this.random()*6);
   if(r<29)this.solid(x,z,sz*1.55,'rocha');
  }
  for(const [x,z,r] of [[-3,6,1.1],[11,4,1.2],[-16,7,2],[5,-12,1.5]]) {add(rock,stone,x,r*.45,z,r*1.2,r*.75,r);this.solid(x,z,r*1.25,'rocha');}
  const leaves=mat(0x526b41),leaves2=mat(0x7d8750),leafGeo=new T.SphereGeometry(1,12,8);
  for(let i=0;i<20;i++){
   const a=i*2.399,r=21+this.random()*14,x=Math.cos(a)*r,z=Math.sin(a)*r,h=5+this.random()*6,y=elevation(x,z);
   add(tube,bark,x,y+h*.5,z,.35,h,.4,this.random());this.solid(x,z,.6,'árvore');
   for(let j=0;j<6;j++){const t=j*2.399,bx=x+Math.cos(t)*1.3,bz=z+Math.sin(t)*1.3;add(leafGeo,j%2?leaves:leaves2,bx,y+h-j*.45,bz,2.1,1.35,1.8);const branch=new T.CatmullRomCurve3([new T.Vector3(x,y+h-3,z),new T.Vector3(bx,y+h-1.7,bz),new T.Vector3(bx,y+h-j*.45,bz)]);add(new T.TubeGeometry(branch,5,.12,5,false),bark,0,0,0);}
   for(let j=0;j<4;j++){const a=j*1.57;const root=new T.CatmullRomCurve3([new T.Vector3(x,y+.7,z),new T.Vector3(x+Math.cos(a),y+.15,z+Math.sin(a)),new T.Vector3(x+Math.cos(a)*2,y+.02,z+Math.sin(a)*2)]);add(new T.TubeGeometry(root,6,.12,5,false),bark,0,0,0);}
  }
  // Native seed pods around the edge of the camp give the plants a Dante identity.
  for(const [x,z] of [[-14,4],[-17,-3],[13,7],[17,-8],[-8,12]]){
   add(new T.SphereGeometry(1,12,10),bark,x,.55,z,.55,.75,.5);for(let j=0;j<5;j++){const a=j*1.26;add(new T.SphereGeometry(.075,8,6),orange,x+Math.sin(a)*.4,.7,z+Math.cos(a)*.4);}
  }
  for(const side of [-1,1])for(let i=-25;i<=25;i+=5){
   for(const [x,z] of [[side*25,i],[i,side*25]])add(tube,orange,x,elevation(x,z)+.45,z,.035,.9,.035);
   if(i<25)for(const swap of [false,true]){const points=[];for(let j=0;j<=5;j++){const x=swap?i+j:side*25,z=swap?side*25:i+j;points.push(new T.Vector3(x,elevation(x,z)+.6-Math.sin(j/5*Math.PI)*.12,z));}add(new T.TubeGeometry(new T.CatmullRomCurve3(points),8,.018,4,false),linen,0,0,0);}
  }
  this.flush();
  // Dense leaves and grass are instanced, with wind in the vertex shader.
  const blade=new T.BufferGeometry();blade.setAttribute('position',new T.Float32BufferAttribute([-.07,0,0,.07,0,0,-.035,.45,.03,.035,.45,.03,0,.8,.12],3));blade.setIndex([0,1,2,1,3,2,2,3,4]);blade.computeVertexNormals();
  const grassMat=new T.MeshStandardMaterial({color:0x7e8b50,roughness:1,side:T.DoubleSide});
  grassMat.onBeforeCompile=shader=>{shader.uniforms.windTime=this.wind;shader.vertexShader='uniform float windTime;\n'+shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\ntransformed.x += sin(windTime*1.2 + instanceMatrix[3].x*.7 + instanceMatrix[3].z*.4)*position.y*position.y*.1;');};
  const grass=new T.InstancedMesh(blade,grassMat,14000),dummy=new T.Object3D();let n=0;
  for(let i=0;i<18000&&n<14000;i++){
   const x=(this.random()-.5)*74,z=(this.random()-.5)*74;
   if(Math.hypot(x,z)<16&&Math.abs(x-Math.sin(z*.14)*2)<3||this.blocked(x,z,.5)||Math.hypot(x+5,z)<2)continue;
   dummy.position.set(x,elevation(x,z)-.015,z);dummy.rotation.y=this.random()*6.28;dummy.scale.setScalar(.25+this.random()*.6);dummy.updateMatrix();grass.setMatrixAt(n++,dummy.matrix);
  }grass.count=n;grass.receiveShadow=true;s.add(grass);
  const fernMat=new T.MeshStandardMaterial({color:0x4d7957,roughness:.8,side:T.DoubleSide});
  const leaf=new T.BufferGeometry(),verts=[],indices=[];for(let i=0;i<8;i++){const t=i/7,w=Math.sin(t*Math.PI)*.22;verts.push(-w,Math.sin(t*Math.PI)*.13,t,0,Math.sin(t*Math.PI)*.13+.035,t,w,Math.sin(t*Math.PI)*.13,t);if(i<7){const a=i*3;indices.push(a,a+3,a+1,a+1,a+3,a+4,a+1,a+4,a+2,a+2,a+4,a+5);}}leaf.setAttribute('position',new T.Float32BufferAttribute(verts,3));leaf.setIndex(indices);leaf.computeVertexNormals();
  const fern=new T.InstancedMesh(leaf,fernMat,900);let f=0;
  for(let i=0;i<105;i++){const a=this.random()*6.28,r=11+this.random()*25,x=Math.cos(a)*r,z=Math.sin(a)*r;if(this.blocked(x,z,1))continue;for(let j=0;j<8;j++){const a=j*Math.PI/4;dummy.position.set(x,elevation(x,z)+.04,z);dummy.rotation.set(-.5,a,0);dummy.scale.setScalar(.8+this.random()*.55);dummy.updateMatrix();fern.setMatrixAt(f++,dummy.matrix);}}fern.count=f;fern.receiveShadow=true;s.add(fern);
  const dustGeo=new T.BufferGeometry(),points=[];for(let i=0;i<85;i++)points.push((this.random()-.5)*50,1+this.random()*9,(this.random()-.5)*50);dustGeo.setAttribute('position',new T.Float32BufferAttribute(points,3));this.dust=new T.Points(dustGeo,new T.PointsMaterial({color:'#e2cea0',size:.045,transparent:true,opacity:.6,depthWrite:false}));s.add(this.dust);
 }
 private solid(x:number,z:number,radius:number,tag:string){this.solids.push({x,z,radius,tag});}
 private static(geometry:T.BufferGeometry,material:T.Material,p:T.Vector3,scale:T.Vector3,ry:number){const g=geometry.index?geometry.toNonIndexed():geometry.clone();g.applyMatrix4(new T.Matrix4().compose(p,new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),ry),scale));const list=this.batches.get(material)??[];list.push(g);this.batches.set(material,list);}
 private flush(){for(const [material,geos] of this.batches){const merged=mergeGeometries(geos);if(!merged)throw Error('Falha ao preparar cenário');const m=new T.Mesh(merged,material);m.castShadow=true;m.receiveShadow=true;this.scene.add(m);this.cameraBodies.push(m);geos.forEach(g=>g.dispose());}this.batches.clear();}
 blocked(x:number,z:number,radius=.35):boolean {
  if(Math.abs(x)+radius>25||Math.abs(z)+radius>25)return true;
  // Expanded AABB matches the cabin, rather than a circle over its courtyard.
  if(x>-13-radius&&x<-5+radius&&z>-7.5-radius&&z<-2.5+radius)return true;
  return this.solids.some(o=>o.radius>0&&Math.hypot(x-o.x,z-o.z)<o.radius+radius);
 }
 move(p:T.Vector3,dx:number,dz:number,radius=.35){if(!this.blocked(p.x+dx,p.z,radius))p.x+=dx;if(!this.blocked(p.x,p.z+dz,radius))p.z+=dz;p.y=elevation(p.x,p.z);}
 update(time:number,active:boolean){this.wind.value=time;this.dust.rotation.y=time*.006;this.beaconRing.rotation.z=time*.15;this.beaconLight.scale.setScalar(active?1.2:1+.12*Math.sin(time*2));}
 dispose(){const geometries=new Set<T.BufferGeometry>(),materials=new Set<T.Material>(),textures=new Set<T.Texture>();this.scene.traverse(o=>{if(o instanceof T.Mesh||o instanceof T.Points){geometries.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:[o.material]){materials.add(m);for(const v of Object.values(m))if(v instanceof T.Texture)textures.add(v);}}});geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());this.sun.shadow.map?.dispose();}
}
