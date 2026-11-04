import {NodeIO} from '@gltf-transform/core';
import {ALL_EXTENSIONS} from '@gltf-transform/extensions';
import {dedup,prune,weld,textureCompress,transformPrimitive,joinPrimitives} from '@gltf-transform/functions';
import sharp from 'sharp';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS);
const doc=await io.read('.local/arrival186/identity-raw.glb');
for(const material of doc.getRoot().listMaterials()){
 const tint=material.getExtras().danteTint;
 if(tint)material.setBaseColorFactor(tint);
 material.setDoubleSided(false);
}
// Tiny wearable/tool parts share one vertex-colored material per category.
// Their colors remain distinct without six extra draw calls per NPC/pass.
for(const category of ['uniform-','tool-']){
 const shared=doc.createMaterial(category==='uniform-'?'Field workwear vertex palette':'Hand tool vertex palette').setRoughnessFactor(category==='uniform-'?.9:.58).setMetallicFactor(category==='uniform-'?0:.45);
 for(const root of doc.getRoot().getDefaultScene().listChildren().filter(n=>n.getName().startsWith(category))){
  const prims=[],nodes=[];root.traverse(n=>{if(n.getMesh())nodes.push(n);});
  for(const node of nodes)for(const p of node.getMesh().listPrimitives()){
   transformPrimitive(p,node.getWorldMatrix());const color=p.getMaterial().getBaseColorFactor(),count=p.getAttribute('POSITION').getCount(),array=new Float32Array(count*4);
   for(let i=0;i<count;i++)array.set(color,i*4);
   p.setAttribute('COLOR_0',doc.createAccessor().setType('VEC4').setArray(array).setBuffer(p.getAttribute('POSITION').getBuffer()));
   for(const semantic of p.listSemantics())if(!['POSITION','NORMAL','COLOR_0'].includes(semantic))p.setAttribute(semantic,null);
   p.setMaterial(shared);prims.push(p);
  }
  const mesh=doc.createMesh(root.getName()).addPrimitive(joinPrimitives(prims));root.setMesh(mesh);
  for(const node of nodes)node.dispose();
 }
}
// The lofts are closed volumes. Correct any inward normal in the authoring
// source before export; don't mask incorrect winding with DoubleSide.
await doc.transform(dedup(),prune(),weld(),textureCompress({encoder:sharp,targetFormat:'webp',resize:[256,256]}));
const file='identity-186.glb',out='public/assets/arrival-3d/';await io.write(out+file,doc);
const bytes=await readFile(out+file),authoring=JSON.parse(await readFile('.local/arrival186/authoring.json','utf8'));
const manifest={version:'0.1.186',...authoring,file,bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex'),textures:doc.getRoot().listTextures().map(t=>({name:t.getName(),size:t.getSize(),mime:t.getMimeType()})),meshes:doc.getRoot().listMeshes().length,materials:doc.getRoot().listMaterials().length};
await writeFile(out+'identity-186.json',JSON.stringify(manifest,null,2)+'\n');
console.log(JSON.stringify(manifest,null,2));
