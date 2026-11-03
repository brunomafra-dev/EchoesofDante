import {NodeIO} from '@gltf-transform/core';
import {ALL_EXTENSIONS} from '@gltf-transform/extensions';
import {mergeDocuments,prune,dedup,resample,textureCompress,unpartition,weld,simplify,compactPrimitive,getBounds} from '@gltf-transform/functions';
import {MeshoptSimplifier} from 'meshoptimizer';
import sharp from 'sharp';
import {mkdir} from 'node:fs/promises';

const root='.local/visual184',out='public/assets/frontier-3d';await mkdir(out,{recursive:true});
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS);
const keptClips=new Map([['Idle_Loop','Idle'],['Jog_Fwd_Loop','Run'],['PickUp_Table','PickUp'],['Punch_Cross','Punch'],['Roll','Roll'],['Jump_Loop','Jump'],['Hit_Chest','RecieveHit'],['Death01','Death']]);
function detach(node){for(const p of node.listParents())if(p.propertyType==='Node'||p.propertyType==='Scene')p.removeChild(node);}
async function crew(file,hairs,tint){
 const doc=await io.read(root+'/sources/clothes/model.gltf'),scene=doc.getRoot().getDefaultScene()??doc.getRoot().listScenes()[0];
 scene.setExtras({frontierCrew:true});
 const rig=new Map(doc.getRoot().listNodes().map(n=>[n.getName(),n]));
 async function importFigure(path,headOnly=false){
  const source=await io.read(path),r=source.getRoot();
  if(headOnly){
   const full=r.listNodes().find(n=>n.getName()==='SuperHero_Male');if(!full)throw Error('Missing whole human model');
   for(const prim of full.getMesh().listPrimitives()){
    const pos=prim.getAttribute('POSITION'),indices=prim.getIndices().getArray(),filtered=[];
    for(let i=0;i<indices.length;i+=3)if([indices[i],indices[i+1],indices[i+2]].every(j=>pos.getElement(j,[])[1]>=1.535))filtered.push(indices[i],indices[i+1],indices[i+2]);
    if(!filtered.length)throw Error('Empty head extraction');
    prim.setIndices(source.createAccessor().setType('SCALAR').setArray(new Uint32Array(filtered)).setBuffer(r.listBuffers()[0]));
    compactPrimitive(prim);
   }
  }
  const meshes=r.listNodes().filter(n=>n.getMesh()),skins=r.listSkins(),scenes=r.listScenes(),map=mergeDocuments(doc,source);
  for(const skin of skins){const copied=map.get(skin),joints=skin.listJoints().map(j=>{const node=rig.get(j.getName());if(!node)throw Error('Missing shared bone '+j.getName());return node;});for(const j of copied.listJoints())copied.removeJoint(j);for(const j of joints)copied.addJoint(j);const skeleton=skin.getSkeleton();if(skeleton)copied.setSkeleton(rig.get(skeleton.getName())??null);}
  for(const mesh of meshes){const copy=map.get(mesh);detach(copy);scene.addChild(copy);}
  for(const old of scenes)map.get(old).dispose();
  for(const node of r.listNodes())if(!node.getMesh())map.get(node).dispose();
 }
 await importFigure(root+'/sources/human/model.gltf',true);
 for(const hair of hairs)await importFigure(root+'/sources/'+hair+'/model.gltf');
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
 for(const m of doc.getRoot().listMaterials())if(/Peasant/.test(m.getName()))m.setBaseColorFactor([...tint,1]);
 for(const mesh of doc.getRoot().listMeshes())for(const prim of mesh.listPrimitives())compactPrimitive(prim);
 await MeshoptSimplifier.ready;
 await doc.transform(weld(),simplify({simplifier:MeshoptSimplifier,ratio:.48,error:.002}),prune(),dedup(),resample({tolerance:1e-3}),textureCompress({encoder:sharp,targetFormat:'webp',resize:[512,512],quality:90}),prune(),unpartition());
 await io.write(out+'/'+file,doc);
 console.log(file,'meshes',doc.getRoot().listMeshes().length,'clips',doc.getRoot().listAnimations().map(a=>a.getName()));
}
if(!process.argv.includes('--nature')){
 await crew('crew-explorer.glb',['Hair_Buzzed'],[.66,.75,.64]);
 await crew('crew-ivo.glb',['Hair_SimpleParted','Hair_Beard'],[.63,.73,.78]);
}
if(!process.argv.includes('--crew')){
 await MeshoptSimplifier.ready;
 const rock=await io.read(out+'/rock-moss.glb');
 await rock.transform(weld(),simplify({simplifier:MeshoptSimplifier,ratio:.08,error:.015}),prune(),unpartition());
 await io.write(out+'/rock-moss-far.glb',rock);
 for(const [asset,ratio]of [['tree_small_02',.006],['tree_small_02_far',.0012],['fern_02',.35]]){
  const far=asset.endsWith('_far'),doc=await io.read(root+'/ph/'+asset.replace('_far','')+'/model.gltf');
  const simplifier=far?{simplify:(...args)=>{args[5]=[...(args[5]??[]),'Prune','Permissive'];return MeshoptSimplifier.simplify(...args);}}:MeshoptSimplifier;
  await doc.transform(weld(),simplify({simplifier,ratio,error:far?.25:.15}),prune(),dedup(),textureCompress({encoder:sharp,targetFormat:'webp',resize:[far?512:1024,far?512:1024],quality:88}),unpartition());
  if(asset.startsWith('tree_')){
   const scene=doc.getRoot().listScenes()[0],bounds=getBounds(scene);scene.setExtras({frontierHeight:bounds.max[1]-bounds.min[1],frontierBase:bounds.min[1]});
   for(const mesh of doc.getRoot().listMeshes())for(const p of mesh.listPrimitives())if(p.getMaterial().getName().endsWith('_leaves')){mesh.removePrimitive(p);p.dispose();}
   await doc.transform(prune(),unpartition());
  }
  const triangles=doc.getRoot().listMeshes().reduce((n,m)=>n+m.listPrimitives().reduce((s,p)=>s+(p.getIndices()?.getCount()??0)/3,0),0);
  await io.write(out+'/'+asset+'.glb',doc);console.log(asset,triangles,'triangles');
 }
}
