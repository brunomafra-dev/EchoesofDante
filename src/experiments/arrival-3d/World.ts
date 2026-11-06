import {CaveArt,caveContour}from'./Caves';
import{WardenScene}from'./WardenScene';
import type{WardenVisual}from'./Warden';
import {SITES}from'./Journey';
import type{Trial}from'./model';
import{NPC_LOOKS}from'./looks';
import * as T from 'three';
import {FoliageVisibility}from'./FoliageVisibility';
import {GLTFLoader}from'three/addons/loaders/GLTFLoader.js';
import {RoomEnvironment}from'three/addons/environments/RoomEnvironment.js';
import {Batches,box,sphere,material,paintedMetal,mineralSurface}from'./Art';
import {loadIdentity,batchIdentity}from'./Identity';
import {layout,distanceToSegment,inPolygon,type Zone}from'./model';
export const v=(x:number,y:number)=>new T.Vector3(x/40,0,y/40);
export const ENTRY={base:v(1040,800),forest:v(400,1230),cavern:v(630,950),warden:v(650,760)};
export const PORTALS={base:v(1240,800),forest:v(400,1285),cavern:v(630,950),warden:v(540,760)};
const NPCS_BASE=[
 {id:'lia',name:'Dra. Lia',role:'Enfermaria',x:320,y:700,gender:'female',hair:3,cloth:'#b9c2b3',yaw:Math.PI,text:'Antes de levarmos alguém para a floresta, precisamos entender a água, o solo e as criaturas. Observe os sinais e volte inteiro. As amostras ficam separadas das nossas mudas.'},
 {id:'ivo',name:'Ivo',role:'Oficina',x:760,y:690,gender:'male',hair:2,cloth:'#6d7c7e',yaw:Math.PI,text:'Ainda estamos vivendo do que trouxemos na nave. Estou ajustando as ferramentas e os instrumentos de campo. Teste seu equipamento na trilha e preste atenção ao movimento das criaturas.'},
 {id:'nara',name:'Nara',role:'Expedições',x:1000,y:465,gender:'female',hair:2,cloth:'#8d785a',yaw:Math.PI,text:'A saída fica a leste do acampamento. Na floresta, a trilha se divide: as ruínas estão ao norte, o mineral fica a leste e há um vestígio entre as raízes a oeste. Observe os três antes de procurar a origem do sinal.'},
 {id:'gui',name:'Tio Gui',role:'Infraestrutura',x:380,y:500,gender:'male',hair:2,cloth:'#79705c',yaw:0,text:'Estou ajustando as conexões do kit do abrigo. Água e energia ficam em circuitos separados; Ivo não abre mão disso.'},
 {id:'elisa',name:'Elisa',role:'Mudas da nave',x:820,y:490,gender:'female',hair:1,cloth:'#728569',yaw:0,text:'As mudas vieram da nave. Estou separando o que podemos levar para o canteiro sem misturar com as plantas de Dante.'},
] as const;
export const NPCS=NPCS_BASE.map(n=>({...n,...NPC_LOOKS[n.id]}));
export const DISCOVERIES=[{id:'northern-ruin',name:'Ruína do norte',...layout.discovery.NORTHERN_DISCOVERY,color:'#95dbd3'},
 {name:'Sinal mineral',...layout.discovery.FOREST_ECHOES.mineral,color:'#e4bd65'},
 {name:'Vestígio desconhecido',...layout.discovery.FOREST_ECHOES.trace,color:'#b79ae2'}];
export type Solid={zone:Zone;x:number;z:number;radius:number;tag:string;halfX?:number;halfZ?:number};
type Tree={x:number;z:number;height:number;angle:number};
const contour=layout.forest.contour.map(p=>({x:p.x/40,y:p.y/40}));
const forestPaths=layout.forest.paths.map(p=>({width:p.width/40,points:p.points.map(a=>({x:a.x/40,y:a.y/40}))}));
export class ArrivalWorld{
 readonly foliage=new FoliageVisibility();readonly scene=new T.Scene();readonly groups={base:new T.Group(),forest:new T.Group(),cavern:new T.Group(),warden:new T.Group()};readonly solids:Solid[]=[];
 readonly bodies={base:[] as T.Object3D[],forest:[] as T.Object3D[]};readonly sun:T.DirectionalLight;
 bossBody?:T.Vector3;zone:Zone='base';private environment:T.WebGLRenderTarget;private randomState=319;private wind={value:0};
 private trees={base:[] as Tree[],forest:[] as Tree[]};private rocks={base:[] as {x:number;z:number;radius:number}[],forest:[] as {x:number;z:number;radius:number}[]};
 readonly cameraObstacles:Record<Zone,T.Sphere[]>={base:[],forest:[],cavern:[],warden:[]};
 private caves:CaveArt;private progress?:Trial;private sky:T.Mesh;private review?:WardenScene;
 private authored:{name:string;x:number;z:number}[]=[];
 private batches={base:new Batches(),forest:new Batches()};private materials:T.Material[]=[];
 private steel=material('#a9aca0',.28,.72);private dark=material('#3f4b48',.35,.7);private amber=material('#b0743b',.3,.64);private glass=material('#243f45',.65,.22);private canvas=material('#aaa187');private wood=material('#68674c');private glow=material('#72cfc0',.2,.3);
 private rand(){this.randomState=(1664525*this.randomState+1013904223)>>>0;return this.randomState/4294967296;}
 constructor(readonly renderer:T.WebGLRenderer,readonly sceneReview=false,readonly wardenVisual:WardenVisual='original'){
  const s=this.scene;s.background=new T.Color('#a6b4ae');s.fog=new T.FogExp2('#a6b4ae',.012);
  const pmrem=new T.PMREMGenerator(renderer),room=new RoomEnvironment();this.environment=pmrem.fromScene(room,.04);s.environment=this.environment.texture;s.environmentIntensity=.3;room.dispose();pmrem.dispose();
  s.add(new T.HemisphereLight('#c3dae4','#4a4435',1.45),new T.AmbientLight('#c4d2c5',.18));this.sun=new T.DirectionalLight('#ffe0b4',3.6);this.sun.position.set(-18,30,8);this.sun.castShadow=true;this.sun.shadow.mapSize.set(1536,1536);Object.assign(this.sun.shadow.camera,{left:-25,right:25,top:25,bottom:-25,near:1,far:90});this.sun.shadow.normalBias=.035;s.add(this.sun,this.sun.target);
  const sky=this.sky=new T.Mesh(new T.SphereGeometry(180,24,16),new T.ShaderMaterial({side:T.BackSide,depthWrite:false,uniforms:{top:{value:new T.Color('#547b88')},bottom:{value:new T.Color('#b9bfaa')}},vertexShader:'varying vec3 direction;void main(){direction=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'varying vec3 direction;uniform vec3 top;uniform vec3 bottom;void main(){gl_FragColor=vec4(mix(bottom,top,smoothstep(-.05,.8,normalize(direction).y)),1.);}'}));s.add(sky);
  s.add(...Object.values(this.groups));for(const zone of['forest','cavern','warden']as const)this.groups[zone].visible=false;
  const paint=paintedMetal();for(const m of[this.steel,this.dark,this.amber])m.map=paint;this.glow.emissive.set('#458b7a');this.glow.emissiveIntensity=.5;
  this.materials.push(this.steel,this.dark,this.amber,this.glass,this.canvas,this.wood,this.glow);
  this.ground('base');this.ground('forest');this.camp();this.forest();this.grass('base');this.grass('forest');this.caves=new CaveArt(this);if(sceneReview)this.review=new WardenScene(this);
  for(const zone of['base','forest']as const){for(const tree of this.trees[zone]){this.cameraObstacles[zone].push(new T.Sphere(new T.Vector3(tree.x,tree.height*.72,tree.z),tree.height*.36));for(const y of[.8,1.8,2.8])if(y<tree.height*.5)this.cameraObstacles[zone].push(new T.Sphere(new T.Vector3(tree.x,y,tree.z),.24));}for(const rock of this.rocks[zone])this.cameraObstacles[zone].push(new T.Sphere(new T.Vector3(rock.x,rock.radius*.7,rock.z),rock.radius*.85));}
 }
 private add(zone:Zone,g:T.BufferGeometry,m:T.Material,x:number,y:number,z:number,sx=1,sy=1,sz=1,yaw=0,solid=true,shadow=true){this.batches[zone as 'base'|'forest'].add(g,m,x,y,z,sx,sy,sz,yaw,solid,shadow);}
 private solid(zone:Zone,x:number,z:number,radius:number,tag:string,halfX?:number,halfZ?:number){this.solids.push({zone,x,z,radius,tag,halfX,halfZ});}
 private ground(zone:'base'|'forest'){
  const width=zone==='base'?70:100,depth=zone==='base'?60:75,cx=zone==='base'?17.5:38.75,cz=zone==='base'?13.125:24.375,g=new T.PlaneGeometry(width,depth,110,85);g.rotateX(-Math.PI/2);g.translate(cx,0,cz);
  const loader=new T.TextureLoader(),m=material('#cecdbd');m.vertexColors=true;
  const tex=(suffix:string,color=false)=>{const t=loader.load('/assets/frontier-3d/Ground037_1K-JPG_'+suffix+'.webp');t.wrapS=t.wrapT=T.RepeatWrapping;t.repeat.set(width/4,depth/4);t.anisotropy=4;if(color)t.colorSpace=T.SRGBColorSpace;return t;};m.map=tex('Color',true);m.normalMap=tex('NormalGL');m.normalScale.set(.65,.65);m.roughnessMap=tex('Roughness');
  const position=g.attributes.position,colors:number[]=[];for(let i=0;i<position.count;i++){const x=position.getX(i),z=position.getZ(i),trail=this.onPath(zone,x,z);const c=new T.Color(zone==='base'?'#b5b29a':'#929c7d').lerp(new T.Color('#d8c19e'),trail);colors.push(c.r,c.g,c.b);if(zone==='base'&&(x<0||x>35||z<0||z>26.25)||zone==='forest'&&!inPolygon(x,z,contour))position.setY(i,-.05+Math.sin(x*.21)*Math.cos(z*.25)*.25);}
  g.setAttribute('color',new T.Float32BufferAttribute(colors,3));g.computeVertexNormals();const mesh=new T.Mesh(g,m);mesh.receiveShadow=true;this.groups[zone].add(mesh);this.materials.push(m);
 }
 onPath(zone:Zone,x:number,z:number){if(zone==='base'){const lines=[[[13.75,12.7],[26,20]],[[8,17.5],[19,17.25]],[[19,17.25],[25,11.6]],[[26,20],[31,20]]];return Math.max(...lines.map(([a,b])=>Math.exp(-Math.pow(distanceToSegment(x,z,{x:a[0],y:a[1]},{x:b[0],y:b[1]})/1.8,2))));}let best=0;for(const path of forestPaths)for(let i=1;i<path.points.length;i++)best=Math.max(best,Math.exp(-Math.pow(distanceToSegment(x,z,path.points[i-1],path.points[i])/(path.width*.45),4)));return best;}
 private camp(){
  const zone='base',cx=13.75,cz=9;
  this.authored.push({name:'shuttle',x:cx,z:cz});this.solid(zone,cx,cz,0,'nave',5.95,2.15);
  for(const side of[-1,1]){
   this.solid(zone,cx-1.2,cz+side*2.85,0,'motor da nave',2.65,.85);
   for(const x of[-3.7,4.4])this.solid(zone,cx+x-.3,cz+side*2.05,.58,'apoio da nave');
  }
  for(const npc of NPCS.slice(0,3)){const x=npc.x/40,z=npc.y/40-2.45;this.shelter(x,z,npc.id);this.solid(zone,x,z,0,'abrigo '+npc.id,2.2,1.35);this.bench(x,npc.y/40-.68,npc.id);}
  this.bench(9.5,13.18,'repair');this.bed(21.75,13.5);this.bed(19.1,12.1);
  for(const [x,z]of[[11,16.25],[22.4,15.625],[28,10.5]]){this.authored.push({name:'supply-case',x,z});this.solid(zone,x,z,.78,'suprimentos');}
  for(const [x,z,r]of[[3.25,6.5,1.5],[30,7.5,1.75],[5,21.5,1.2],[29.5,23.25,1.2]]){this.rocks.base.push({x,z,radius:r});this.solid(zone,x,z,r,'rocha');}
  for(let i=0;i<80;i++){const x=-8+this.rand()*51,z=-8+this.rand()*43;if(x>1&&x<34&&z>1&&z<25)continue;this.trees.base.push({x,z,height:5+this.rand()*4,angle:this.rand()*6.28});if(x>1.75&&x<33.25&&z>2.25&&z<24.25)this.solid(zone,x,z,.38,'tronco');}
  this.portal('base',PORTALS.base,'Floresta de Dante');
 }
 private shelter(x:number,z:number,role:string){this.authored.push({name:'station-'+role,x,z});for(const side of[-1,1])this.solid('base',x+side*2.05,z+2.25,.08,'apoio do toldo');}
 private bench(x:number,z:number,role:string){this.authored.push({name:'bench-'+role,x,z});this.solid('base',x,z,0,'bancada '+role,.95,.42);}
 private bed(x:number,z:number){this.authored.push({name:'planter',x,z});this.solid('base',x,z,0,'canteiro',.75,.4);}
 private forest(){
  const b=this.batches.forest;
  for(const [x,y,r]of layout.forest.rocks){const site={x:x/40,z:y/40,radius:r/40};this.rocks.forest.push(site);this.solid('forest',site.x,site.z,site.radius,'rocha');}
  for(let i=0;i<190;i++){const x=-4+this.rand()*87,z=-4+this.rand()*58;if(this.onPath('forest',x,z)>.035||this.inClearing(x,z)||SITES.some(s=>s.area==='forest'&&Math.hypot(x-s.x/40,z-s.y/40)<3.3)||this.inApproachView(x,z)||this.blocked('forest',x,z,.7)&&inPolygon(x,z,contour))continue;const height=5+this.rand()*5;this.trees.forest.push({x,z,height,angle:this.rand()*6.28});if(inPolygon(x,z,contour))this.solid('forest',x,z,.36,'tronco');}
  for(const discovery of DISCOVERIES){const x=discovery.x/40,z=discovery.y/40;if(discovery.id==='northern-ruin'){for(const dx of[-1.2,0,1.2]){b.add(box,this.wood,x+dx,.9,z,.7,1.8,.55);b.add(box,this.glow,x+dx,1,z+.29,.045,.65,.03);}b.add(box,this.wood,x,1.95,z,3.3,.3,.65);this.solid('forest',x,z,0,'ruína',1.7,.4);}else if(discovery.id==='unknown-trace'){for(let i=0;i<3;i++){const dz=(i-1)*.28;b.segment(new T.Vector3(x-.65,.08,z+dz),new T.Vector3(x+.65,.06,z+dz-.25),.04,this.dark);}const curve=new T.CatmullRomCurve3([new T.Vector3(x-.7,0,z+.5),new T.Vector3(x-.45,.32,z+.3),new T.Vector3(x+.3,.2,z+.2),new T.Vector3(x+.6,0,z-.2)]);b.add(new T.TubeGeometry(curve,12,.13,7),this.wood,0,0,0);this.solid('forest',x,z,.85,discovery.id);}else{const m=material(discovery.color,.25,.35);m.emissive.set(discovery.color);m.emissiveIntensity=.25;this.materials.push(m);for(let i=0;i<5;i++){const geo=new T.ConeGeometry(.2,.6+this.rand()*.4,5);b.add(geo,m,x+(i-2)*.22,.4,z+Math.sin(i)*.2,1,1,1,i*.5);}this.solid('forest',x,z,.65,discovery.id);}}
  const source=layout.discovery.SIGNAL_THRESHOLD,x=source.x/40,z=source.y/40;
  b.add(new T.CircleGeometry(1.5,40).rotateX(-Math.PI/2),this.dark,x,.025,z,1,1,1,0,false,false);
  for(let i=0;i<10;i++){const a=i/10*Math.PI*2,rx=x+Math.cos(a)*1.6,rz=z+Math.sin(a)*1.25;this.rocks.forest.push({x:rx,z:rz,radius:.45});}
  this.solid('forest',x,z,1.55,'fissura selada');this.solid('forest',source.mechanismX/40,source.mechanismY/40,.55,'mecanismo');
  const px=69.25,pz=27.25;b.add(new T.CircleGeometry(3.0,48).rotateX(-Math.PI/2),material('#45675e',.35,.25),px,.02,pz,1,1,.72,0,false,false);this.solid('forest',px,pz,3.0,'nascente profunda');
  for(let i=0;i<11;i++){const a=i/11*Math.PI*2;this.rocks.forest.push({x:px+Math.cos(a)*3.1,z:pz+Math.sin(a)*2.25,radius:.45+this.rand()*.2});}
  // The solid native pods that were missing collision in the first trial.
  const pod=material('#77795e'),map=mineralSurface();map.colorSpace=T.SRGBColorSpace;pod.map=map;this.materials.push(pod);for(const [x,z]of[[8.8,23],[32.9,33],[60.5,40.5]]){b.add(sphere,pod,x,.58,z,.55,.78,.5);for(let i=0;i<5;i++){const a=i/5*Math.PI*2;b.add(sphere,this.amber,x+Math.sin(a)*.43,.65,z+Math.cos(a)*.4,.065,.09,.055);}this.solid('forest',x,z,.58,'formação nativa');}
  this.portal('forest',PORTALS.forest,'Acampamento de pouso');
 }
 private portal(zone:Zone,p:T.Vector3,_label:string){for(const side of[-1,1]){const x=p.x+(zone==='forest'?side*.95:0),z=p.z+(zone==='base'?side*.95:0);this.add(zone,box,this.steel,x,.85,z,.24,1.7,.35);this.add(zone,box,this.glow,x,.95,z+.19,.05,.9,.03);this.solid(zone,x,z,.2,'marco de trilha');}}
 private grass(zone:'base'|'forest'){const blade=new T.BufferGeometry();blade.setAttribute('position',new T.Float32BufferAttribute([-.07,0,0,.07,0,0,-.035,.45,.03,.035,.45,.03,0,.8,.12],3));blade.setIndex([0,1,2,1,3,2,2,3,4]);blade.computeVertexNormals();const m=material('#788260');m.side=T.DoubleSide;m.onBeforeCompile=shader=>{shader.uniforms.windTime=this.wind;shader.vertexShader='uniform float windTime;\n'+shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\ntransformed.x+=sin(windTime*1.2+instanceMatrix[3].x*.7+instanceMatrix[3].z*.4)*position.y*position.y*.1;');};const mesh=new T.InstancedMesh(blade,m,zone==='base'?6500:16000),dummy=new T.Object3D();let n=0;for(let i=0;i<mesh.instanceMatrix.count*3&&n<mesh.instanceMatrix.count;i++){const x=this.rand()*(zone==='base'?46:84)-4,z=this.rand()*(zone==='base'?37:57)-4;if(this.onPath(zone,x,z)>.35||this.blocked(zone,x,z,.14))continue;dummy.position.set(x,-.015,z);dummy.rotation.y=this.rand()*6.28;dummy.scale.setScalar(.22+this.rand()*.45);dummy.updateMatrix();mesh.setMatrixAt(n,dummy.matrix);mesh.setColorAt(n++,new T.Color().setHSL(.18+this.rand()*.07,.14+this.rand()*.1,.45+this.rand()*.2));}mesh.count=n;mesh.receiveShadow=true;this.groups[zone].add(mesh);}
 update(time:number){this.wind.value=time;}
 private inApproachView(x:number,z:number){const source=layout.discovery.SIGNAL_THRESHOLD,sites=[...DISCOVERIES.map(d=>({x:d.x/40,y:d.y/40+2})),{x:source.x/40,y:source.y/40+2.5},{x:source.mechanismX/40,y:source.mechanismY/40+2},{x:ENTRY.forest.x,y:ENTRY.forest.z}];return sites.some(a=>distanceToSegment(x,z,{x:a.x-1,y:a.y-1},{x:a.x+7,y:a.y+9})<4);}
 private inClearing(x:number,z:number){return layout.forest.clearings.some(c=>Math.pow((x-c.x/40)/(c.rx/40+1),2)+Math.pow((z-c.y/40)/(c.ry/40+1),2)<1)||DISCOVERIES.some(d=>Math.hypot(x-d.x/40,z-d.y/40)<3)||Math.hypot(x-46.75,z-6.125)<5;}
 blocked(zone:Zone,x:number,z:number,r=.35){if(zone==='base'){if(x<1.75+r||x>33.25-r||z<2.25+r||z>24.25-r)return true;}else{const poly=zone==='forest'?contour:zone==='cavern'?caveContour:[{x:12,y:9.5},{x:42,y:9.5},{x:42,y:28},{x:12,y:28}];if(!inPolygon(x,z,poly)||poly.some((a,i)=>distanceToSegment(x,z,a,poly[(i+1)%poly.length])<r))return true;if(zone==='cavern'&&this.progress){const j=this.progress.journey,max=!j.depth?42:!j.deepSignal?61.75:!j.fragment?133.75:!j.firstEcho?154.5:!j.gate?157:161.5;if(x>max-r)return true;}}return this.solids.some(o=>o.zone===zone&&(o.halfX?Math.abs(x-o.x)<o.halfX+r&&Math.abs(z-o.z)<o.halfZ!+r:Math.hypot(x-o.x,z-o.z)<o.radius+r));}
 floorHeight(zone:Zone,x:number,z:number){return zone==='base'&&Math.abs(x-16.55)<.7&&z>11.25&&z<14.05?.095+(14.05-z)*(.895/2.8):0;}
 move(zone:Zone,p:T.Vector3,dx:number,dz:number,r=.35){if(zone==='warden'&&this.bossBody&&r<1){const b=this.bossBody,min=1.55+r,old=Math.hypot(p.x-b.x,p.z-b.z),limit=Math.min(min,old);if(Math.hypot(p.x+dx-b.x,p.z-b.z)<limit-.00001)dx=0;const horizontal=Math.hypot(p.x+dx-b.x,p.z-b.z);if(Math.hypot(p.x+dx-b.x,p.z+dz-b.z)<Math.min(min,horizontal)-.00001)dz=0;}if(!this.blocked(zone,p.x+dx,p.z,r))p.x+=dx;if(!this.blocked(zone,p.x,p.z+dz,r))p.z+=dz;p.y=this.floorHeight(zone,p.x,p.z);}
 lineOfSight(zone:Zone,a:T.Vector3,b:T.Vector3){const dist=a.distanceTo(b);for(let i=1;i<Math.ceil(dist/.3);i++){const t=i/Math.ceil(dist/.3);if(this.blocked(zone,T.MathUtils.lerp(a.x,b.x,t),T.MathUtils.lerp(a.z,b.z,t),.05))return false;}return true;}
 ceilingHeight(zone:Zone,x:number,z:number){if(zone!=='base')return Infinity;for(const n of NPCS.slice(0,3))if(Math.abs(x-n.x/40)<2.5&&z>n.y/40-2.5&&z<n.y/40+.2)return 2.4;return Infinity;}
 setProgress(trial:Trial){this.progress=trial;this.caves.update(trial);}
 setZone(zone:Zone){this.zone=zone;for(const [id,g]of Object.entries(this.groups))g.visible=id===zone;const cave=zone==='cavern'||zone==='warden';this.sky.visible=!cave;this.sun.intensity=cave?1.7:3.6;this.sun.color.set(cave?'#b4b4d3':'#ffe0b4');this.scene.background=new T.Color(cave?'#252a30':'#a6b4ae');this.scene.fog=new T.FogExp2(cave?'#252a30':'#a6b4ae',cave?.026:.012);this.review?.setZone(zone);}
 updateFocus(p:T.Vector3){this.sun.position.set(p.x-18,30,p.z+8);this.sun.target.position.set(p.x,0,p.z);this.review?.focus(p);}
 inspectReview(){return this.review?.inspect();}
 async load(){
  await loadIdentity();batchIdentity(this.batches.forest,'mechanism',layout.discovery.SIGNAL_THRESHOLD.mechanismX/40,0,layout.discovery.SIGNAL_THRESHOLD.mechanismY/40);for(const item of this.authored)batchIdentity(this.batches.base,item.name,item.x,0,item.z);
  const loader=new GLTFLoader(),[rocks,tree,ferns,farTree]=await Promise.all(['rock-moss-far.glb','tree_small_02.glb','fern_02.glb','tree_small_02_far.glb'].map(f=>loader.loadAsync('/assets/frontier-3d/'+f)));
  for(const asset of[rocks,tree,ferns,farTree])asset.scene.updateMatrixWorld(true);await this.review?.load(rocks.scene);const shared=new Map<string,T.Material>();for(const asset of[tree,farTree])asset.scene.traverse(o=>{if(o instanceof T.Mesh){const m=o.material as T.Material;if(shared.has(m.name)){o.material=shared.get(m.name)!;for(const value of Object.values(m))if(value instanceof T.Texture)value.dispose();m.dispose();}else shared.set(m.name,m);}});
  const rockMeshes:T.Mesh[]=[],fernMeshes:T.Mesh[]=[];rocks.scene.traverse(o=>{if(o instanceof T.Mesh)rockMeshes.push(o);});ferns.scene.traverse(o=>{if(o instanceof T.Mesh)fernMeshes.push(o);});
  const canopy=await Promise.all([0,1].map(i=>new T.TextureLoader().loadAsync('/assets/frontier-3d/tree-canopy-'+i+'.webp'))),canopyMats=canopy.map(map=>{map.colorSpace=T.SRGBColorSpace;return new T.MeshBasicMaterial({map,alphaTest:.38,side:T.DoubleSide,toneMapped:false});});
  const foliageMaterials=new Set<T.Material>(canopyMats);for(const source of[tree,farTree])source.scene.traverse(o=>{if(o instanceof T.Mesh)for(const m of Array.isArray(o.material)?o.material:[o.material])foliageMaterials.add(m);});for(const m of foliageMaterials)this.foliage.apply(m);
  for(const zone of['base','forest']as const){const batch=this.batches[zone];
   for(const [i,site]of this.rocks[zone].entries()){const m=rockMeshes[i%rockMeshes.length],g=m.geometry.clone();g.computeBoundingBox();const bounds=g.boundingBox!,center=bounds.getCenter(new T.Vector3());g.translate(-center.x,-bounds.min.y,-center.z);let radius=0;const p=g.attributes.position;for(let j=0;j<p.count;j++)radius=Math.max(radius,Math.hypot(p.getX(j),p.getZ(j)));const scale=site.radius/radius;batch.add(g,m.material as T.Material,site.x,-.06,site.z,scale,scale,scale,i*.9);g.dispose();}
   for(const [index,site]of this.trees[zone].entries()){const source=index%8===0?tree.scene:farTree.scene,scale=site.height/source.userData.frontierHeight;source.traverse(o=>{if(o instanceof T.Mesh){const g=o.geometry.clone().applyMatrix4(o.matrixWorld);g.translate(0,-source.userData.frontierBase,0);batch.add(g,o.material as T.Material,site.x,-.03,site.z,scale,scale,scale,site.angle);g.dispose();}});for(let i=0;i<2;i++)batch.add(new T.PlaneGeometry(4.101067,5.468089),canopyMats[i],site.x,site.height*.5,site.z,site.height/4.556741,site.height/4.556741,site.height/4.556741,site.angle+i*Math.PI/2,false,true);}
   for(let i=0;i<(zone==='base'?120:260);i++){const x=this.rand()*(zone==='base'?35:77.5),z=this.rand()*(zone==='base'?26.25:48.75);if(this.onPath(zone,x,z)>.18||this.blocked(zone,x,z,.55))continue;const source=fernMeshes[i%fernMeshes.length],g=source.geometry.clone().applyMatrix4(source.matrixWorld);g.computeBoundingBox();g.translate(0,-g.boundingBox!.min.y,0);const scale=.6+this.rand()*.8;batch.add(g,source.material as T.Material,x,-.03,z,scale,scale,scale,this.rand()*6.28,false,false);g.dispose();}
   batch.flush(this.groups[zone],this.bodies[zone]);
  }
  for(const asset of[rocks,tree,ferns,farTree])asset.scene.traverse(o=>{if(o instanceof T.Mesh)o.geometry.dispose();});
 }
 dispose(){const geometries=new Set<T.BufferGeometry>(),materials=new Set<T.Material>(),textures=new Set<T.Texture>();this.scene.traverse(o=>{if(o instanceof T.Mesh){geometries.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:[o.material]){materials.add(m);for(const value of Object.values(m))if(value instanceof T.Texture)textures.add(value);}}});geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());this.environment.dispose();this.sun.shadow.map?.dispose();}
}
