import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {Batches} from './Art';
import {loadCreatures}from'./Creatures';

let ready:Promise<void>|undefined;
const roots=new Map<string,T.Object3D>();
/** One offline GLB, shared mesh/material storage, no authoring in the frame loop. */
export function loadIdentity(){
 return ready??=Promise.all([new GLTFLoader().loadAsync('/assets/arrival-3d/identity-186.glb'),new GLTFLoader().loadAsync('/assets/arrival-3d/weapons-188.glb'),new GLTFLoader().loadAsync('/assets/arrival-3d/gauntlet-189.glb'),loadCreatures()]).then(([gltf,weapons,gauntlet])=>{
  for(const root of gltf.scene.children){roots.set(root.name,root);root.traverse(o=>{if(o instanceof T.Mesh){o.castShadow=true;o.receiveShadow=true;for(const m of Array.isArray(o.material)?o.material:[o.material])for(const value of Object.values(m))if(value instanceof T.Texture)value.anisotropy=4;}});}
  for(const root of weapons.scene.children){roots.set('previous-'+root.name,root);roots.set(root.name,root);root.traverse(o=>{if(/^emitter(?:_\d+)?$/.test(o.name))o.name='emitter';if(o instanceof T.Mesh){o.castShadow=true;o.receiveShadow=true;}});}
  for(const root of gauntlet.scene.children){roots.set(root.name,root);root.traverse(o=>{if(/^emitter(?:_\d+)?$/.test(o.name))o.name='emitter';if(o instanceof T.Mesh){o.castShadow=true;o.receiveShadow=true;}});}
 });
}
export function identity(name:string){
 const source=roots.get(name);if(!source)throw Error('Modelo de Dante indisponível: '+name);
 const root=new T.Group();root.name=name;root.add(source.clone(true));
 root.traverse(o=>o.userData.arrivalSharedIdentity=true);return root;
}
export function batchIdentity(batch:Batches,name:string,x=0,y=0,z=0,yaw=0){
 const root=identity(name);root.position.set(x,y,z);root.rotation.set(0,yaw,0);root.updateMatrixWorld(true);
 root.traverse(o=>{if(o instanceof T.Mesh){const materials=Array.isArray(o.material)?o.material:[o.material];
  // glTF loader usually splits material primitives into separate meshes.
  if(materials.length!==1)throw Error('Asset sem separação por material: '+name);
  const g=o.geometry.clone().applyMatrix4(o.matrixWorld);batch.add(g,materials[0],0,0,0);g.dispose();
 }});
}
export function identityMeshes(name:string){const root=identity(name);root.updateMatrixWorld(true);const meshes:{geometry:T.BufferGeometry;material:T.Material}[]=[];root.traverse(o=>{if(o instanceof T.Mesh){if(Array.isArray(o.material))throw Error('Material composto: '+name);meshes.push({geometry:o.geometry.clone().applyMatrix4(o.matrixWorld),material:o.material});}});return meshes;}
