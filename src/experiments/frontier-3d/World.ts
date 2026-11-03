import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';

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
 private environment:T.WebGLRenderTarget;
 private batches=new Map<T.Material,T.BufferGeometry[]>();
 private randomState=182;
 private rockSites:{x:number;z:number;radius:number;rotation:number}[]=[];
 private treeSites:{x:number;z:number;height:number;rotation:number}[]=[];
 private random(){this.randomState=(1664525*this.randomState+1013904223)>>>0;return this.randomState/4294967296;}
 constructor(readonly renderer:T.WebGLRenderer){
  const s=this.scene;s.background=new T.Color('#a6b4ae');s.fog=new T.FogExp2('#a6b4ae',.008);
  const pmrem=new T.PMREMGenerator(renderer),room=new RoomEnvironment();this.environment=pmrem.fromScene(room,.04);s.environment=this.environment.texture;s.environmentIntensity=.3;room.dispose();pmrem.dispose();
  s.add(new T.HemisphereLight('#c3dae4','#4a4435',1.45));s.add(new T.AmbientLight('#c4d2c5',.18));
  this.sun=new T.DirectionalLight('#ffe0b4',3.6);this.sun.position.set(-18,30,8);this.sun.castShadow=true;
  this.sun.shadow.mapSize.set(2048,2048);Object.assign(this.sun.shadow.camera,{left:-30,right:30,top:30,bottom:-30,near:1,far:90});this.sun.shadow.normalBias=.035;this.sun.shadow.bias=-.00015;s.add(this.sun);
  const sky=new T.Mesh(new T.SphereGeometry(180,24,16),new T.ShaderMaterial({side:T.BackSide,depthWrite:false,uniforms:{top:{value:new T.Color('#547b88')},bottom:{value:new T.Color('#b9bfaa')}},vertexShader:'varying vec3 direction; void main(){ direction=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }',fragmentShader:'varying vec3 direction; uniform vec3 top; uniform vec3 bottom; void main(){float h=normalize(direction).y; gl_FragColor=vec4(mix(bottom,top,smoothstep(-.05,.8,h)),1.); }'}));s.add(sky);
  const moon=new T.Mesh(new T.SphereGeometry(7,32,24),new T.MeshBasicMaterial({color:'#c5d5b7',fog:false}));moon.position.set(32,30,-95);s.add(moon);
  const earth=mat(0xd2d0bd);earth.vertexColors=true;
  const loader=new T.TextureLoader();
  const texture=(suffix:string,color=false,material='Ground037')=>{const t=loader.load(`/assets/frontier-3d/${material}_1K-JPG_${suffix}.webp`);t.wrapS=t.wrapT=T.RepeatWrapping;t.repeat.set(material==='Ground037'?24:2,material==='Ground037'?24:2);t.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());if(color)t.colorSpace=T.SRGBColorSpace;return t;};
  earth.map=texture('Color',true);earth.normalMap=texture('NormalGL');earth.normalScale.set(.65,.65);earth.roughnessMap=texture('Roughness');
  const ground=new T.PlaneGeometry(100,100,140,140);ground.rotateX(-Math.PI/2);const p=ground.attributes.position,colors=[];
  for(let i=0;i<p.count;i++) {const x=p.getX(i),z=p.getZ(i);p.setY(i,elevation(x,z));const trail=Math.exp(-Math.pow((x-Math.sin(z*.14)*2)/3.6,2))*.6;const c=new T.Color('#aeb09a').lerp(new T.Color('#d9c6a6'),trail);colors.push(c.r,c.g,c.b);}
  ground.setAttribute('color',new T.Float32BufferAttribute(colors,3));ground.computeVertexNormals();const floor=new T.Mesh(ground,earth);floor.receiveShadow=true;s.add(floor);
  const bark=mat(0x625d48),metal=mat(0xb2b3a5,.25,.75),dark=mat(0x354641,.4,.7),orange=mat(0xa56632,.25,.65),glass=mat(0x264e53,.65,.22),linen=mat(0xa49876),glow=mat(0x6cd4bd,.1,.3);
  // Paint wear is baked once, shared by the hull, ribs and utility equipment.
  const surface=document.createElement('canvas');surface.width=surface.height=512;const ctx=surface.getContext('2d')!;
  ctx.fillStyle='#b7b7a7';ctx.fillRect(0,0,512,512);
  for(let i=0;i<21000;i++){const v=100+Math.floor(this.random()*100);ctx.fillStyle=`rgba(${v},${v},${v-8},${.03+this.random()*.12})`;ctx.fillRect(this.random()*512,this.random()*512,1+this.random()*3,1+this.random()*3);}
  for(let i=0;i<170;i++){ctx.fillStyle='rgba(60,52,36,.12)';ctx.fillRect(this.random()*512,this.random()*512,1,8+this.random()*55);}
  for(const y of [4,505]){ctx.fillStyle='rgba(39,44,39,.5)';ctx.fillRect(0,y,512,3);for(let x=20;x<512;x+=58){ctx.fillStyle='#565b52';ctx.beginPath();ctx.arc(x,y+5,2.3,0,Math.PI*2);ctx.fill();}}
  const hullTexture=new T.CanvasTexture(surface);hullTexture.colorSpace=T.SRGBColorSpace;hullTexture.anisotropy=4;hullTexture.wrapS=hullTexture.wrapT=T.RepeatWrapping;
  for(const m of [metal,dark,orange])m.map=hullTexture;
  const rockColor=texture('Color',true,'Rock035'),rockNormal=texture('NormalGL',false,'Rock035'),rockRough=texture('Roughness',false,'Rock035');
  bark.map=rockColor;bark.normalMap=rockNormal;bark.normalScale.set(.35,.35);bark.roughnessMap=rockRough;
  glow.emissive=new T.Color('#48bba7');glow.emissiveIntensity=1.3;
  const box=new RoundedBoxGeometry(1,1,1,2,.1),tube=new T.CylinderGeometry(1,1,1,10);
  const add=(g:T.BufferGeometry,m:T.Material,x:number,y:number,z:number,sx=1,sy=1,sz=1,ry=0)=>this.static(g,m,new T.Vector3(x,y,z),new T.Vector3(sx,sy,sz),ry);
  // A chamfered pressure hull with structural rings, separate panels and service hardware.
  const outline=new T.Shape();outline.moveTo(-4,.26);outline.lineTo(-4,2.5);outline.lineTo(-3.35,3.5);outline.lineTo(3.35,3.5);outline.lineTo(4,2.5);outline.lineTo(4,.26);outline.closePath();
  const hull=new T.ExtrudeGeometry(outline,{depth:4.85,bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:.06,bevelThickness:.06});
  hull.translate(0,0,-2.425);add(hull,metal,-9,0,-5);
  add(box,dark,-9,.25,-5,8,.35,5);
  for(const z of [-7.25,-5,-2.7]){
   const rib=new T.Shape();rib.moveTo(-4.09,.27);rib.lineTo(-4.09,2.54);rib.lineTo(-3.4,3.6);rib.lineTo(3.4,3.6);rib.lineTo(4.09,2.54);rib.lineTo(4.09,.27);rib.lineTo(3.94,.27);rib.lineTo(3.94,2.49);rib.lineTo(3.3,3.45);rib.lineTo(-3.3,3.45);rib.lineTo(-3.94,2.49);rib.lineTo(-3.94,.27);rib.closePath();
   add(new T.ExtrudeGeometry(rib,{depth:.13,bevelEnabled:false}),orange,-9,0,z);
  }
  for(const x of [-12.6,-11,-7,-5.4]){add(box,metal,x,1.7,-2.52,1.4,2.4,.1);add(box,dark,x,.55,-2.6,1.25,.035,.03);}
  for(const x of [-12.4,-10.9,-7,-5.6]){add(box,dark,x,1.8,-2.54,.035,2.85,.03);for(const y of [.55,2.9])add(new T.CylinderGeometry(.045,.045,.04,6).rotateX(Math.PI/2),orange,x,y,-2.59);}
  for(let i=0;i<6;i++)add(box,dark,-5.04,1.5+i*.13,-5,.05,.055,1.55);
  add(box,orange,-5.04,2.7,-5,.08,.09,3.5);add(box,dark,-9,3.74,-5,3.5,.14,2.2);
  for(let i=0;i<8;i++)add(box,metal,-10.4+i*.4,3.83,-5,.18,.08,1.8);
  add(box,dark,-8.8,1.4,-2.5,1.65,2.7,.15);add(box,orange,-8.8,2.8,-2.35,1.9,.15,.2);
  for(const [x,w]of [[-11.6,1.5],[-6.7,1.1]]){add(box,dark,x,2,-2.39,w+.2,1.13,.15);add(box,glass,x,2,-2.28,w,.95,.05);add(box,metal,x,1.52,-2.22,w+.25,.07,.17);add(box,orange,x,2.54,-2.27,w+.12,.05,.05);}
  add(box,metal,-8.8,1.45,-2.38,1.35,2.45,.14);add(box,dark,-8.8,1.45,-2.29,.035,2.25,.04);add(box,glow,-8.08,1.55,-2.26,.07,.35,.05);
  for(let i=0;i<4;i++)add(box,dark,-5.01,1.15+i*.22,-6.4,.09,.09,.8);
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
  for(let i=0;i<24;i++){
   const angle=this.random()*Math.PI*2,r=19+this.random()*25,x=Math.cos(angle)*r,z=Math.sin(angle)*r,sz=1+this.random()*3;
   this.rockSites.push({x,z,radius:sz*1.55,rotation:this.random()*6});
   if(r<29)this.solid(x,z,sz*1.55,'rocha');
  }
  for(const [x,z,r] of [[-3,6,1.1],[11,4,1.2],[-16,7,2],[5,-12,1.5]])this.solid(x,z,r*1.25,'rocha');
  for(let i=0;i<20;i++){
   const a=i*2.399,r=21+this.random()*14,x=Math.cos(a)*r,z=Math.sin(a)*r,h=6+this.random()*3;
   this.treeSites.push({x,z,height:h,rotation:this.random()*6});this.solid(x,z,.6,'árvore');
  }
  for(let i=0;i<30;i++){const a=i*2.399,r=36+this.random()*13;this.treeSites.push({x:Math.cos(a)*r,z:Math.sin(a)*r,height:8+this.random()*5,rotation:this.random()*6});}
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
  const grassMat=new T.MeshStandardMaterial({color:0x788260,roughness:1,side:T.DoubleSide});
  grassMat.onBeforeCompile=shader=>{shader.uniforms.windTime=this.wind;shader.vertexShader='uniform float windTime;\n'+shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\ntransformed.x += sin(windTime*1.2 + instanceMatrix[3].x*.7 + instanceMatrix[3].z*.4)*position.y*position.y*.1;');};
  const grass=new T.InstancedMesh(blade,grassMat,14000),dummy=new T.Object3D();let n=0;
  for(let i=0;i<18000&&n<14000;i++){
   const x=(this.random()-.5)*74,z=(this.random()-.5)*74;
   if(Math.hypot(x,z)<16&&Math.abs(x-Math.sin(z*.14)*2)<3||this.blocked(x,z,.5)||Math.hypot(x+5,z)<2)continue;
   dummy.position.set(x,elevation(x,z)-.015,z);dummy.rotation.y=this.random()*6.28;dummy.scale.setScalar(.18+this.random()*.4);dummy.updateMatrix();grass.setMatrixAt(n,dummy.matrix);grass.setColorAt(n++,new T.Color().setHSL(.18+this.random()*.07,.12+this.random()*.12,.45+this.random()*.2));
  }grass.count=n;grass.receiveShadow=true;s.add(grass);
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
 floorHeight(x:number,z:number){return Math.max(elevation(x,z),Math.abs(x+8.8)<1.05&&Math.abs(z+1.5)<.85?.24:0);}
 ceilingHeight(x:number,z:number){
  // Match the awning plane's tilt and allow room for the explorer's head radius.
  return Math.abs(x+8.7)<3.5&&Math.abs(z+.8)<1.85?2.65-Math.tan(.08)*(x+8.7+.35)-.05:Infinity;
 }
 move(p:T.Vector3,dx:number,dz:number,radius=.35){if(!this.blocked(p.x+dx,p.z,radius))p.x+=dx;if(!this.blocked(p.x,p.z+dz,radius))p.z+=dz;p.y=this.floorHeight(p.x,p.z);}
 async loadScenery(){
  const loader=new GLTFLoader(),[gltf,farRocks,tree,farTree,ferns]=await Promise.all(['rock-moss.glb','rock-moss-far.glb','tree_small_02.glb','tree_small_02_far.glb','fern_02.glb'].map(f=>loader.loadAsync('/assets/frontier-3d/'+f)));
  const rocks:T.Mesh[]=[];gltf.scene.traverse(o=>{if(o instanceof T.Mesh)rocks.push(o);});
  const distantRocks:T.Mesh[]=[];farRocks.scene.traverse(o=>{if(o instanceof T.Mesh)distantRocks.push(o);});
  if(rocks.length<4)throw Error('Conjunto de rochas incompleto');
  const rockSites=[...[[-3,6,1.1],[11,4,1.2],[-16,7,2],[5,-12,1.5]].map(([x,z,r],i)=>({x,z,radius:r*1.25,rotation:i*.9})),...this.rockSites];
  for(const [i,{x,z,radius:targetRadius,rotation}] of rockSites.entries()){
   const source=i<4?rocks[i]:distantRocks[i%distantRocks.length],geo=source.geometry.clone();geo.computeBoundingBox();
   const b=geo.boundingBox!,center=b.getCenter(new T.Vector3());geo.translate(-center.x,-b.min.y,-center.z);
   let radius=0;const p=geo.attributes.position;for(let j=0;j<p.count;j++)radius=Math.max(radius,Math.hypot(p.getX(j),p.getZ(j)));
   const scale=targetRadius/radius;
   this.static(geo,rocks[0].material as T.Material,new T.Vector3(x,elevation(x,z)-(i<4?.035:(b.max.y-b.min.y)*scale*.28),z),new T.Vector3(scale,scale,scale),rotation);
   geo.dispose();
  }
  const materialPool=new Map<string,T.Material>();
  for(const asset of [tree,farTree]){asset.scene.updateMatrixWorld(true);asset.scene.traverse(o=>{if(o instanceof T.Mesh){const m=o.material as T.MeshStandardMaterial;if(materialPool.has(m.name)){o.material=materialPool.get(m.name)!;for(const v of Object.values(m))if(v instanceof T.Texture)v.dispose();m.dispose();}else{materialPool.set(m.name,m);if(m.map)m.map.anisotropy=4;}}});}
  for(const [i,site]of this.treeSites.entries()){
   const source=i<20&&i%4===0?tree.scene:farTree.scene,scale=site.height/source.userData.frontierHeight;
   source.traverse(o=>{if(o instanceof T.Mesh){const geo=o.geometry.clone().applyMatrix4(o.matrixWorld);geo.translate(0,-source.userData.frontierBase,0);this.static(geo,o.material as T.Material,new T.Vector3(site.x,elevation(site.x,site.z)-.03,site.z),new T.Vector3(scale,scale,scale),site.rotation);geo.dispose();}});
  }
  // Crossed canopy impostors baked from the complete 2M-triangle tree restore
  // foliage coverage that mesh simplification cannot preserve. Trunks stay 3D.
  const canopyTextures=await Promise.all([0,1].map(i=>new T.TextureLoader().loadAsync('/assets/frontier-3d/tree-canopy-'+i+'.webp')));
  const canopyMaterials=canopyTextures.map(map=>{map.colorSpace=T.SRGBColorSpace;map.anisotropy=4;return new T.MeshBasicMaterial({map,alphaTest:.38,side:T.DoubleSide,toneMapped:false});});
  for(const site of this.treeSites){const scale=site.height/4.556741;for(let i=0;i<2;i++)this.static(new T.PlaneGeometry(4.101067,5.468089),canopyMaterials[i],new T.Vector3(site.x,elevation(site.x,site.z)+site.height*.5,site.z),new T.Vector3(scale,scale,scale),site.rotation+i*Math.PI/2);}
  ferns.scene.updateMatrixWorld(true);const variants:T.Mesh[]=[];ferns.scene.traverse(o=>{if(o instanceof T.Mesh)variants.push(o);});
  for(let i=0;i<150;i++){
   const a=this.random()*6.28,r=10+this.random()*26,x=Math.cos(a)*r,z=Math.sin(a)*r;
   if(this.blocked(x,z,.85)||Math.abs(x-Math.sin(z*.14)*2)<3)continue;
   const source=variants[i%variants.length],geo=source.geometry.clone().applyMatrix4(source.matrixWorld);geo.computeBoundingBox();geo.translate(0,-geo.boundingBox!.min.y,0);const scale=.65+this.random()*.55;
   this.static(geo,source.material as T.Material,new T.Vector3(x,elevation(x,z)-.035,z),new T.Vector3(scale,scale,scale),this.random()*6.28);geo.dispose();
  }
  this.flush();
  // The detached source is never rendered. Its shared materials/textures now belong to the batches.
  const unusedMaterials=new Set<T.Material>();farRocks.scene.traverse(o=>{if(o instanceof T.Mesh)unusedMaterials.add(o.material as T.Material);});
  for(const [name,m]of materialPool)if(name.endsWith('_leaves'))unusedMaterials.add(m);
  for(const m of unusedMaterials){for(const value of Object.values(m))if(value instanceof T.Texture)value.dispose();m.dispose();}
  for(const asset of [gltf,farRocks,tree,farTree,ferns])asset.scene.traverse(o=>{if(o instanceof T.Mesh)o.geometry.dispose();});
 }
 update(time:number,active:boolean){this.wind.value=time;this.dust.rotation.y=time*.006;this.beaconRing.rotation.z=time*.15;this.beaconLight.scale.setScalar(active?1.2:1+.12*Math.sin(time*2));}
 dispose(){const geometries=new Set<T.BufferGeometry>(),materials=new Set<T.Material>(),textures=new Set<T.Texture>();this.scene.traverse(o=>{if(o instanceof T.Mesh||o instanceof T.Points){geometries.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:[o.material]){materials.add(m);for(const v of Object.values(m))if(v instanceof T.Texture)textures.add(v);}}});geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());this.sun.shadow.map?.dispose();this.environment.dispose();}
}
