import * as T from 'three';
import {Batches,material,mineralSurface}from './Art';
import {cavernContour}from '../../config/earlyJourney';
import {DEEP_OBSTACLES}from '../../config/cavern';
import {EXPANSION_ROCKS}from '../../config/expansion';
import {WARDEN_FOOTPRINTS}from '../../config/wardenPreparation';
import {WARDEN_ARENA,WARDEN_ARENA_FOOTPRINTS}from '../../config/wardenArena';
import {SITES,CAVE}from './Journey';
import type{ArrivalWorld}from './World';
import type{Trial}from './model';
export const caveContour=cavernContour().map(p=>({x:p.x/40,y:p.y/40}));
export const ARENA=WARDEN_ARENA;
const stone=new T.IcosahedronGeometry(1,1),crystal=new T.ConeGeometry(1,1,5),leaf=new T.SphereGeometry(1,7,4);
export class CaveArt{
 private gates:{mesh:T.Group;flag:'depth'|'deepSignal'|'fragment'|'firstEcho'|'gate'}[]=[];
 private maps=new Map<string,T.Texture>();private texture(name:string,color=false){let t=this.maps.get(name);if(!t){t=new T.TextureLoader().load(name);t.wrapS=t.wrapT=T.RepeatWrapping;t.anisotropy=4;if(color)t.colorSpace=T.SRGBColorSpace;this.maps.set(name,t);}return t;}
 private mineral=material('#716d61',.08,.94);private vein=material('#a49bc2',.2,.7);private pale=material('#b5ab91',.12,.82);private wet=material('#526770',.2,.3);private plant=material('#657568',0,.9);
 constructor(private world:ArrivalWorld){
  this.mineral.flatShading=true;const vertex=stone.attributes.position;for(let i=0;i<vertex.count;i++){const factor=.90+.16*Math.sin(vertex.getX(i)*19+vertex.getY(i)*13+vertex.getZ(i)*7);vertex.setXYZ(i,vertex.getX(i)*factor,vertex.getY(i)*factor,vertex.getZ(i)*factor);}stone.computeVertexNormals();const map=mineralSurface();this.mineral.map=this.texture('/assets/arrival-3d/cavern-stone-196.webp',true);this.mineral.color.set('#b5b2a5');this.mineral.normalMap=this.texture('/assets/frontier-3d/Rock035_1K-JPG_NormalGL.webp');this.mineral.normalScale.set(.28,.28);this.pale.map=map;this.vein.emissive.set('#615077');this.vein.emissiveIntensity=.22;
  this.build('cavern',caveContour);const b=ARENA.bounds;this.build('warden',[{x:b.left/40,y:b.top/40},{x:b.right/40,y:b.top/40},{x:b.right/40,y:b.bottom/40},{x:b.left/40,y:b.bottom/40}]);
  this.sites('forest');this.sites('cavern');
 }
 private build(zone:'cavern'|'warden',contour:{x:number;y:number}[]){
  const group=new T.Group();group.name=zone==='warden'?'warden-environment196':'cavern-environment196';this.world.groups[zone].add(group);const shape=new T.Shape(contour.map(p=>new T.Vector2(p.x,-p.y))),ground=new T.ShapeGeometry(shape);ground.rotateX(-Math.PI/2);
  const p=ground.attributes.position,uv=ground.attributes.uv;for(let i=0;i<p.count;i++)uv.setXY(i,p.getX(i)/4,p.getZ(i)/4);
  const floor=material('#b6b3a9',.04,.94);floor.map=this.texture('/assets/arrival-3d/cavern-stone-196.webp',true);
  floor.normalMap=this.texture('/assets/frontier-3d/Rock035_1K-JPG_NormalGL.webp');floor.normalMap.wrapS=floor.normalMap.wrapT=T.RepeatWrapping;floor.normalScale.set(.38,.38);
  const mesh=new T.Mesh(ground,floor);mesh.receiveShadow=true;group.add(mesh);
  const bins=new Map<number,Batches>(),batch=(x:number)=>{const key=Math.floor(x/14);if(!bins.has(key))bins.set(key,new Batches());return bins.get(key)!;};
  const rock=(x:number,z:number,r:number,h:number,solid=false)=>{batch(x).add(stone,this.mineral,x,h*.42-.08,z,r,h*.52,r*.88,(x+z)*1.9);if(solid)this.world.solids.push({zone,x,z,radius:r,tag:'rocha subterrânea'});};
  // Cutaway walls sit outside the walking contour. No roof conceals the hero.
  for(let j=0;j<contour.length;j++){const a=contour[j],b=contour[(j+1)%contour.length],length=Math.hypot(b.x-a.x,b.y-a.y),count=Math.ceil(length/1.5);for(let i=0;i<count;i++){const t=i/count,r=1.0+.2*Math.sin(i*3),x=T.MathUtils.lerp(a.x,b.x,t)+(b.y-a.y)/length*(r+.12),z=T.MathUtils.lerp(a.y,b.y,t)-(b.x-a.x)/length*(r+.12);rock(x,z,r,1.5+.4*Math.sin(i*2.7+j));batch(x).add(stone,this.mineral,x,-.16,z,r*1.35,.25,r*1.35,i*.7);}}
  const footprints=zone==='warden'?WARDEN_ARENA_FOOTPRINTS:[...DEEP_OBSTACLES,...EXPANSION_ROCKS,...WARDEN_FOOTPRINTS.filter(p=>p.x<6200)];
  for(const s of footprints)rock(s.x/40,s.y/40,s.radius/40,Math.min(2.1,s.radius/28),true);
  if(zone==='cavern'){
   // Grounded ancestral ribs and mineral seams give each chamber a readable identity.
   for(let x=72;x<108;x+=4.2)for(const side of[-1,1]){const z=side<0?11.5:26;batch(x).add(stone,this.pale,x,.8,z,.42,1.1,.30,side*.7);this.world.solids.push({zone,x,z,radius:.45,tag:'mineral rib'});}
   for(const [i,p]of[CAVE.signal,CAVE.fragment,CAVE.echo].entries()){const x=p.x/40,z=p.y/40;for(let n=0;n<3;n++){batch(x).add(stone,this.pale,x+(n-1)*.55,.6+n*.12,z-.9,.4,.8,.3,n*.4);batch(x).add(crystal,this.vein,x+(n-1)*.55,1.2+n*.12,z-.82,.045,.38,.045);}if(i===2){const ring=new T.TorusGeometry(1.2,.09,6,32).rotateX(-Math.PI/2);batch(x).add(ring,this.vein,x,.05,z,1,1,.15);}}
   for(const [flag,x,z]of[['depth',42,12.25],['deepSignal',61.75,18.4],['fragment',133.75,18.5],['firstEcho',154.5,18.5],['gate',158,18.5]]as const){const gate=new T.Group(),g=new T.TorusGeometry(2.6,.16,6,24,Math.PI);const arc=new T.Mesh(g,this.pale);arc.position.y=.25;gate.add(arc);const sheet=new T.Mesh(new T.PlaneGeometry(18,2.8),new T.MeshBasicMaterial({color:'#857fa5',transparent:true,opacity:.22,side:T.DoubleSide,depthWrite:false}));sheet.position.set(z-18.75,1.4,0);gate.add(sheet);gate.position.set(x,0,z);gate.rotation.y=Math.PI/2;group.add(gate);this.gates.push({mesh:gate,flag});}
  }else{
   const b=batch(29);for(let i=0;i<3;i++)b.add(new T.TorusGeometry(3.8+i*2.1,.035,4,64).rotateX(-Math.PI/2),this.vein,29.25,.025,18.375,1,.22,1);
   for(const x of[13.5,40.5])for(const z of[12,25.5]){b.add(stone,this.pale,x,1.2,z,.6,1.5,.5);b.add(crystal,this.vein,x,2.6,z,.09,.5,.09);}
  }
  for(const b of bins.values())b.flush(group,[]);
 }
 private sites(zone:'forest'|'cavern'){
  const b=new Batches(),points=[...SITES.filter(s=>s.area===zone),...(zone==='forest'?[{x:620,y:1080,art:'water'},{x:480,y:735,art:'biology'}]:[])];
  for(const [i,s]of points.entries()){const x=s.x/40,z=s.y/40;
   // A shallow wet patch, rooted plant cluster or repaired conduit; never a supply-case proxy.
   if(s.art==='water'){b.add(new T.CircleGeometry(.78,24).rotateX(-Math.PI/2),this.wet,x,.018,z,.9,1,.5,0,false,false);for(let j=0;j<7;j++){const a=j/7*Math.PI*2;b.add(stone,this.mineral,x+Math.cos(a)*.8,.05,z+Math.sin(a)*.4,.18,.10,.14,a,false,false);}}
   else if(s.art==='biology'&&zone==='cavern'){for(let n=0;n<5;n++){const curve=new T.CatmullRomCurve3([new T.Vector3(-.75+n*.12,.02,.35),new T.Vector3(-.32+n*.12,.22,-.12),new T.Vector3(.35+n*.06,.11,-.45),new T.Vector3(.72,.025,-.15+n*.15)]);b.add(new T.TubeGeometry(curve,12,.055,6,false),this.pale,x,.02,z,1,1,1,n*.4,false,false);}}
   else if(s.art==='biology'){for(let n=0;n<7;n++){const a=n*2.4,xx=x+Math.cos(a)*.45,zz=z+Math.sin(a)*.4;b.add(leaf,this.plant,xx,.2,zz,.10,.35,.07,a,false,false);b.add(crystal,this.vein,xx,.49,zz,.05,.12,.05,a,false,false);}}
   else{for(let j=0;j<3;j++){const tube=new T.CylinderGeometry(.11,.14,1.4,8).rotateZ(Math.PI/2);b.add(tube,this.pale,x,.17+j*.16,z-.55,1,1,1,i*.3);b.add(new T.TorusGeometry(.16,.04,6,12),this.vein,x+.3,.17+j*.16,z-.55);}}
  }b.flush(this.world.groups[zone],[]);
 }
 update(t:Trial){for(const g of this.gates)g.mesh.visible=!t.journey[g.flag];}
}
