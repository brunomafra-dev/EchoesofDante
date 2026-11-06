import * as T from 'three';
import {GLTFLoader}from'three/addons/loaders/GLTFLoader.js';
import type{ArrivalWorld}from'./World';
import{WARDEN_ARENA_FOOTPRINTS}from'../../config/wardenArena';

/** Isolated art review; solid footprints and combat stay in the existing world. */
export class WardenScene{
 private fill=new T.DirectionalLight('#9db3cb',.65);
 private root=new T.Group();
 private loaded=false;private failure='';
 constructor(private world:ArrivalWorld){this.fill.position.set(39,13,6);this.fill.target.position.set(28,1,19);this.fill.visible=false;world.scene.add(this.fill,this.fill.target);}
 async load(rocks:T.Object3D){try{
  const asset=await new GLTFLoader().loadAsync('/assets/arrival-3d/warden-arena-197.glb');asset.scene.name='warden-environment197';asset.scene.position.set(27,0,18.75);
  const previous=this.world.groups.warden.getObjectByName('warden-environment196');let floor:T.MeshStandardMaterial|undefined;
  previous?.traverse(o=>{if(o instanceof T.Mesh&&o.geometry.type==='ShapeGeometry')floor=(o.material as T.MeshStandardMaterial).clone();});
  asset.scene.traverse(o=>{if(!(o instanceof T.Mesh))return;const materials=(Array.isArray(o.material)?o.material:[o.material]) as T.MeshStandardMaterial[];
   o.castShadow=!materials.some(m=>m.name==='Arena cool slate'||m.name==='Worn ancestral incisions');o.receiveShadow=true;
   if(materials.some(m=>m.name==='Arena cool slate')){if(floor){materials.forEach(m=>m.dispose());o.material=floor;floor.color.set('#858b83');floor.roughness=.88;}const p=o.geometry.attributes.position,c=[];for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i),d=Math.hypot(x-2.25,z+.375),v=.78+.10*Math.sin(x*.37)*Math.cos(z*.48)+.12*Math.exp(-d*d/38);c.push(v,v,v);}o.geometry.setAttribute('color',new T.Float32BufferAttribute(c,3));(o.material as T.MeshStandardMaterial).vertexColors=true;}
  });this.root.add(asset.scene);
  if(floor){const g=new T.PlaneGeometry(72,60).rotateX(-Math.PI/2),uv=g.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)*18,uv.getY(i)*15);const mat=floor.clone();mat.vertexColors=false;mat.color.set('#69726e');const underlay=new T.Mesh(g,mat);underlay.position.set(27,-.065,18.75);underlay.receiveShadow=true;this.root.add(underlay);}
  this.boundaries(rocks);this.world.groups.warden.add(this.root);if(previous)previous.visible=false;this.loaded=true;
 }catch{this.failure='A arena proposta não carregou. Arena original ativa.';}}
 private boundaries(source:T.Object3D){
  const meshes:T.Mesh[]=[];source.traverse(o=>{if(o instanceof T.Mesh)meshes.push(o);});
  const sites=WARDEN_ARENA_FOOTPRINTS.map((p,i)=>({x:p.x/40,z:p.y/40,r:p.radius/40,h:p.y/40<12?1.5:p.y/40>24?.7:1.0,yaw:i*2.399}));
  for(let i=0;i<15;i++)sites.push({x:10+i*2.5,z:8.0,r:1.45,h:1.9+.4*Math.sin(i*2),yaw:i*1.74});
  for(let i=0;i<9;i++)sites.push({x:8+i*4.5,z:3.6,r:3.2,h:3.6+1.0*Math.sin(i*1.8),yaw:i*2.11});
  const dummy=new T.Object3D(),shared=new Map<T.Material,T.MeshStandardMaterial>();
  for(const [index,s]of meshes.entries()){
   const sitesForMesh=sites.filter((_,i)=>i%meshes.length===index);if(!sitesForMesh.length)continue;
   const g=s.geometry.clone().applyMatrix4(s.matrixWorld);g.computeBoundingBox();const box=g.boundingBox!,center=box.getCenter(new T.Vector3()),height=box.max.y-box.min.y;g.translate(-center.x,-box.min.y,-center.z);const p=g.attributes.position;let r=0;for(let i=0;i<p.count;i++)r=Math.max(r,Math.hypot(p.getX(i),p.getZ(i)));
   const sourceMaterial=s.material as T.MeshStandardMaterial;let m=shared.get(sourceMaterial);if(!m){m=sourceMaterial.clone();m.color.set('#929a91');shared.set(sourceMaterial,m);}const batch=new T.InstancedMesh(g,m,sitesForMesh.length);batch.castShadow=true;batch.receiveShadow=true;
   for(const [i,site]of sitesForMesh.entries()){dummy.position.set(site.x,-.04,site.z);dummy.rotation.set(0,site.yaw,0);dummy.scale.set(site.r/r,site.h/height,site.r/r);dummy.updateMatrix();batch.setMatrixAt(i,dummy.matrix);}
   batch.instanceMatrix.needsUpdate=true;this.root.add(batch);
  }
 }
 setZone(zone:string){const active=zone==='warden'&&this.loaded;this.fill.visible=active;
  this.world.scene.traverse(o=>{if(o instanceof T.HemisphereLight)o.intensity=active?.65:1.45;else if(o instanceof T.AmbientLight)o.intensity=active?.06:.18;});
  this.world.scene.environmentIntensity=active?.45:.3;
  if(active){this.world.sun.intensity=2.6;this.world.sun.color.set('#efd9b5');this.world.scene.background=new T.Color('#29353a');this.world.scene.fog=new T.FogExp2('#29353a',.020);}
 }
 focus(p:T.Vector3){if(this.loaded&&this.world.zone==='warden')this.world.sun.position.set(p.x-9,20,p.z+8);}
 inspect(){const mats=new Set<T.Material>();let meshes=0;this.root.traverse(o=>{if(o instanceof T.Mesh){meshes++;for(const m of Array.isArray(o.material)?o.material:[o.material])mats.add(m);}});return{loaded:this.loaded,message:this.failure,materials:mats.size,meshes,additionalDirectionalLights:1,additionalShadowCastingLights:0};}
}
