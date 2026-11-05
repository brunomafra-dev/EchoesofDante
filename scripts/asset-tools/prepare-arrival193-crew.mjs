import{NodeIO}from'@gltf-transform/core';import{ALL_EXTENSIONS}from'@gltf-transform/extensions';
import{readFile,writeFile}from'node:fs/promises';import{createHash}from'node:crypto';import * as T from'three';
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS),sculpt=JSON.parse(await readFile('.local/crew193/sculpt.json','utf8')),models=[];
const key=p=>p.map(v=>Math.round(v*1e5)).join(',');
for(const gender of['male','female']){
 const source='crew-'+gender+'.glb',file='crew-'+gender+'-193.glb',doc=await io.read('public/assets/arrival-3d/'+source),changes=new Map(sculpt[gender].map(c=>[key(c.old),c]));let changed=0,triangles=0;
 for(const mesh of doc.getRoot().listMeshes())for(const prim of mesh.listPrimitives()){
  const pos=prim.getAttribute('POSITION'),a=pos.getArray().slice(),norm=prim.getAttribute('NORMAL'),normals=norm.getArray().slice();let touched=false;
  for(let i=0;i<pos.getCount();i++){const change=changes.get(key(pos.getElement(i,[])));if(change){a.set(change.next,i*3);const n=norm.getElement(i,[]),m=change.normal,vector=new T.Vector3(...m.map(row=>row.reduce((s,v,j)=>s+v*n[j],0))).normalize();vector.toArray(normals,i*3);touched=true;changed++;}}
  triangles+=(prim.getIndices()?.getCount()??pos.getCount())/3;
  if(touched){pos.setArray(a);norm.setArray(normals);}
 }
 if(changed<100)throw Error('Sculpt matching failed for '+gender);
 await io.write('public/assets/arrival-3d/'+file,doc);const bytes=await readFile('public/assets/arrival-3d/'+file);
 models.push({gender,file,source,changedVertices:changed,triangles,bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex'),joints:doc.getRoot().listSkins().map(s=>s.listJoints().length),clips:doc.getRoot().listAnimations().map(a=>a.getName()),materials:doc.getRoot().listMaterials().length,textures:doc.getRoot().listTextures().length});
}
const meta={version:'0.1.193',author:'Quaternius, CC0-1.0; conservative Blender face/brow rest-shape modifications by Echoes of Dante',source:'https://quaternius.com/packs/universalbasecharacters.html',generator:'scripts/asset-tools/author-arrival193-crew.py',rig:'Original joints, weights, animations and bind matrices retained; no bone edits.',models};
await writeFile('public/assets/arrival-3d/crew-193.json',JSON.stringify(meta,null,2)+'\n');console.log(JSON.stringify(meta,null,2));
