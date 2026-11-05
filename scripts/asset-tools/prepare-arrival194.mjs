import sharp from'sharp';
import{NodeIO}from'@gltf-transform/core';import{ALL_EXTENSIONS}from'@gltf-transform/extensions';import{dedup,prune,weld,textureCompress}from'@gltf-transform/functions';
import * as T from'three';import{readFile,writeFile}from'node:fs/promises';import{createHash}from'node:crypto';
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS),doc=await io.read('.local/crew194/looks-raw.glb'),binds={},bodyVertices={};
for(const gender of['male','female']){const crew=await io.read('public/assets/arrival-3d/crew-'+gender+'-193.glb');binds[gender]=Object.fromEntries(['Head','spine_03'].map(name=>[name,new T.Matrix4().fromArray(crew.getRoot().listNodes().find(n=>n.getName()===name).getWorldMatrix()).invert()]));bodyVertices[gender]=[];for(const mesh of crew.getRoot().listMeshes())for(const p of mesh.listPrimitives())if(/Peasant/.test(p.getMaterial().getName()))for(let i=0;i<p.getAttribute('POSITION').getCount();i++)bodyVertices[gender].push({p:p.getAttribute('POSITION').getElement(i,[]),j:p.getAttribute('JOINTS_0').getElement(i,[]),w:p.getAttribute('WEIGHTS_0').getElement(i,[])});}
const models=[];
for(const root of doc.getRoot().getDefaultScene().listChildren()){
 const hair=/^hair-(male|female)-/.exec(root.getName()),gender=hair?.[1]??(/(?:lia|nara|elisa)$/.test(root.getName())?'female':'male'),anchor=hair||root.getName().startsWith('head-')?'Head':'skin';let triangles=0;
 const meshes=[];root.traverse(n=>{if(n.getMesh())meshes.push(n);});
 for(const node of meshes){const matrix=(anchor==='skin'?new T.Matrix4():binds[gender][anchor].clone()).multiply(new T.Matrix4().fromArray(node.getWorldMatrix())),normal=new T.Matrix3().getNormalMatrix(matrix);
  for(const prim of node.getMesh().listPrimitives()){
   const pos=prim.getAttribute('POSITION'),norm=prim.getAttribute('NORMAL'),a=pos.getArray().slice(),b=norm.getArray().slice();
   for(let i=0;i<pos.getCount();i++){new T.Vector3().fromArray(a,i*3).applyMatrix4(matrix).toArray(a,i*3);new T.Vector3().fromArray(b,i*3).applyMatrix3(normal).normalize().toArray(b,i*3);}pos.setArray(a);norm.setArray(b);triangles+=(prim.getIndices()?.getCount()??pos.getCount())/3;
   if(anchor==='skin'){
    const joints=new Uint16Array(pos.getCount()*4),weights=new Float32Array(pos.getCount()*4);
    for(let i=0;i<pos.getCount();i++){
     const p=pos.getElement(i,[]),nearest=[];for(const v of bodyVertices[gender]){const d=p.reduce((s,x,k)=>s+(x-v.p[k])**2,0);if(nearest.length<4||d<nearest.at(-1).d){nearest.push({v,d});nearest.sort((a,b)=>a.d-b.d);if(nearest.length>4)nearest.pop();}}
     const blend=new Map();for(const{v,d}of nearest)for(let k=0;k<4;k++)blend.set(v.j[k],(blend.get(v.j[k])??0)+v.w[k]/Math.max(.000001,d));const ranked=[...blend].sort((a,b)=>b[1]-a[1]).slice(0,4),total=ranked.reduce((s,x)=>s+x[1],0);for(let k=0;k<ranked.length;k++){joints[i*4+k]=ranked[k][0];weights[i*4+k]=ranked[k][1]/total;}
    }
    const buffer=doc.getRoot().listBuffers()[0];prim.setAttribute('JOINTS_0',doc.createAccessor().setType('VEC4').setArray(joints).setBuffer(buffer));prim.setAttribute('WEIGHTS_0',doc.createAccessor().setType('VEC4').setArray(weights).setBuffer(buffer));
   }
  }node.setMatrix(new T.Matrix4().toArray());
 }root.setMatrix(new T.Matrix4().toArray());root.setExtras({gender,anchor});models.push({name:root.getName(),gender,anchor,triangles});
}
await doc.transform(weld(),dedup(),prune(),textureCompress({encoder:sharp,targetFormat:'webp',resize:[256,256],quality:86}),dedup(),prune());const file='looks-194.glb';await io.write('public/assets/arrival-3d/'+file,doc);const bytes=await readFile('public/assets/arrival-3d/'+file),shapes=JSON.parse(await readFile('.local/crew194/age-shapes.json','utf8'));
await writeFile('public/assets/arrival-3d/npc-age-194.json',JSON.stringify(shapes)+'\n');
const meta={version:'0.1.194',file,bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex'),author:'Quaternius Universal Base Characters CC0 hair surfaces adapted in Blender; new tails, braid, garments and goggles by Echoes of Dante. Existing credited CC0 textures.',textures:doc.getRoot().listTextures().length,materials:doc.getRoot().listMaterials().length,models,ageShapes:Object.fromEntries(Object.entries(shapes).map(([k,v])=>[k,v.length]))};
await writeFile('public/assets/arrival-3d/looks-194.json',JSON.stringify(meta,null,2)+'\n');console.log(JSON.stringify(meta,null,2));
