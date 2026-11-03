import {NodeIO} from '@gltf-transform/core';
import {ALL_EXTENSIONS} from '@gltf-transform/extensions';
import {mergeDocuments,prune,dedup,resample,textureCompress,unpartition,weld,simplify,compactPrimitive,joinPrimitives} from '@gltf-transform/functions';
import {MeshoptSimplifier} from 'meshoptimizer';
import sharp from 'sharp';
import {mkdir} from 'node:fs/promises';

const root='.local/visual184',out='public/assets/arrival-3d';await mkdir(out,{recursive:true});
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS);
const keptClips=new Map([['Idle_Loop','Idle'],['Jog_Fwd_Loop','Run'],['PickUp_Table','PickUp'],['Punch_Cross','Punch'],['Roll','Roll'],['Jump_Loop','Jump'],['Hit_Chest','RecieveHit'],['Death01','Death'],['Walk_Loop','Walk'],['Sword_Attack','Sword'],['Pistol_Shoot','Shoot'],['Spell_Simple_Shoot','Cast']]);
function detach(node){for(const p of node.listParents())if(p.propertyType==='Node'||p.propertyType==='Scene')p.removeChild(node);}
async function crew(file,hairs,female=false){
 const doc=await io.read(root+'/sources/'+(female?'clothes-female':'clothes')+'/model.gltf'),scene=doc.getRoot().getDefaultScene()??doc.getRoot().listScenes()[0];
 scene.setExtras({frontierCrew:true});
 const outfit=doc.getRoot().listNodes().filter(n=>n.getMesh());
 const groups=new Map();for(const n of outfit)for(const p of n.getMesh().listPrimitives()){compactPrimitive(p);const key=p.getMaterial().getName()+p.listSemantics().sort().map(k=>k+':'+p.getAttribute(k).getType()+':'+p.getAttribute(k).getComponentType()+':'+p.getAttribute(k).getNormalized()).join('|');const list=groups.get(key)??[];list.push(p);groups.set(key,list);}
 const mesh=doc.createMesh('Complete work outfit');for(const list of groups.values())mesh.addPrimitive(joinPrimitives(list));
 const first=outfit[0];for(const n of outfit){if(n.getSkin()!==first.getSkin()||JSON.stringify(n.getMatrix())!==JSON.stringify(first.getMatrix()))throw Error('Outfit rig mismatch');}
 first.setMesh(mesh);for(const n of outfit.slice(1))n.dispose();
 const rig=new Map(doc.getRoot().listNodes().map(n=>[n.getName(),n]));
 async function importFigure(path,headOnly=false,hairTag){
  const source=await io.read(path),r=source.getRoot();
  if(headOnly){
   const full=r.listNodes().find(n=>n.getName()===(female?'Superhero_Female':'SuperHero_Male'));if(!full)throw Error('Missing whole human model');
   for(const prim of full.getMesh().listPrimitives()){
    const pos=prim.getAttribute('POSITION'),indices=prim.getIndices().getArray(),filtered=[];
    for(let i=0;i<indices.length;i+=3)if([indices[i],indices[i+1],indices[i+2]].every(j=>pos.getElement(j,[])[1]>=(female?1.45:1.535)))filtered.push(indices[i],indices[i+1],indices[i+2]);
    if(!filtered.length)throw Error('Empty head extraction');
    prim.setIndices(source.createAccessor().setType('SCALAR').setArray(new Uint32Array(filtered)).setBuffer(r.listBuffers()[0]));
    compactPrimitive(prim);
   }
  }
  const meshes=r.listNodes().filter(n=>n.getMesh()),skins=r.listSkins(),scenes=r.listScenes(),map=mergeDocuments(doc,source);
  for(const skin of skins){const copied=map.get(skin),joints=skin.listJoints().map(j=>{const node=rig.get(j.getName());if(!node)throw Error('Missing shared bone '+j.getName());return node;});for(const j of copied.listJoints())copied.removeJoint(j);for(const j of joints)copied.addJoint(j);const skeleton=skin.getSkeleton();if(skeleton)copied.setSkeleton(rig.get(skeleton.getName())??null);}
  for(const mesh of meshes){const copy=map.get(mesh);detach(copy);if(hairTag)copy.setExtras({arrivalHair:hairTag});scene.addChild(copy);}
  for(const old of scenes)map.get(old).dispose();
  for(const node of r.listNodes())if(!node.getMesh())map.get(node).dispose();
 }
 await importFigure(root+'/sources/'+(female?'human-female':'human')+'/model.gltf',true);
 for(const hair of hairs)await importFigure(root+'/sources/'+hair+'/model.gltf',false,hair);
 const source=await io.read(root+'/sources/ual/UAL1_Standard.glb'),sourceRoot=source.getRoot(),map=mergeDocuments(doc,source);
 for(const animation of sourceRoot.listAnimations()){
  const copy=map.get(animation),name=keptClips.get(animation.getName());
  if(!name){for(const c of copy.listChannels())c.dispose();for(const s of copy.listSamplers())s.dispose();copy.dispose();continue;}
  copy.setName(name);
  for(const channel of copy.listChannels()){
   const node=rig.get(channel.getTargetNode()?.getName());
   if(node)channel.setTargetNode(node);else channel.dispose();
  }
 }
 for(const s of sourceRoot.listScenes())map.get(s).dispose();
 for(const node of sourceRoot.listNodes())map.get(node).dispose();
 // Neutral work clothes, then role-specific field colours. Skin/eyes stay intact.
 for(const m of doc.getRoot().listMaterials())if(/Peasant/.test(m.getName()))m.setBaseColorFactor([1,1,1,1]);
 for(const mesh of doc.getRoot().listMeshes())for(const prim of mesh.listPrimitives())compactPrimitive(prim);
 await MeshoptSimplifier.ready;
 await doc.transform(weld(),simplify({simplifier:MeshoptSimplifier,ratio:.38,error:.002}),prune(),dedup(),resample({tolerance:1e-3}),textureCompress({encoder:sharp,targetFormat:'webp',resize:[512,512],quality:90}),prune(),unpartition());
 await io.write(out+'/'+file,doc);
 console.log(file,'meshes',doc.getRoot().listMeshes().length,'clips',doc.getRoot().listAnimations().map(a=>a.getName()));
}
await crew('crew-male.glb',['Hair_Buzzed','Hair_SimpleParted','Hair_Long','Hair_Beard']);
await crew('crew-female.glb',['Hair_BuzzedFemale','Hair_Buns','Hair_Long'],true);
