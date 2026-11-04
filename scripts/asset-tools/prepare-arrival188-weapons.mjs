import{NodeIO}from'@gltf-transform/core';import{ALL_EXTENSIONS}from'@gltf-transform/extensions';import{dedup,prune,weld,transformPrimitive,joinPrimitives,textureCompress}from'@gltf-transform/functions';import sharp from'sharp';import{readFile,writeFile}from'node:fs/promises';import{createHash}from'node:crypto';
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS),d=await io.read('.local/combat188/weapons-raw.glb'),report=[];
for(const m of d.getRoot().listMaterials()){const tint=m.getExtras().danteTint;if(tint)m.setBaseColorFactor(tint);m.setDoubleSided(false);}
for(const root of d.getRoot().getDefaultScene().listChildren()){
 for(const n of root.listChildren())if(!n.getMesh())n.setName(n.getName().replace(/[_.]\d+$/,''));
 const groups=new Map(),nodes=[];root.traverse(n=>{if(n.getMesh())nodes.push(n);});
 for(const n of nodes)for(const p of n.getMesh().listPrimitives()){
  const mat=p.getMaterial(),energy=!!mat.getEmissiveTexture()||mat.getEmissiveFactor().some(x=>x>0),category=energy?'energy':/rubber|grip|leather/i.test(mat.getName())?'grip':'alloy';
  transformPrimitive(p,n.getWorldMatrix());let group=groups.get(category);if(!group){const m=d.createMaterial(root.getName()+' '+category).setRoughnessFactor(category==='grip'?.88:category==='energy'?.32:.48).setMetallicFactor(category==='alloy'?.55:0);if(energy)m.setEmissiveFactor(mat.getEmissiveFactor().map(v=>v*.65));group={mat:m,prims:[]};groups.set(category,group);}
  const color=mat.getBaseColorFactor(),count=p.getAttribute('POSITION').getCount(),array=new Float32Array(count*4);for(let i=0;i<count;i++)array.set(color,i*4);
  p.setAttribute('COLOR_0',d.createAccessor().setType('VEC4').setArray(array).setBuffer(p.getAttribute('POSITION').getBuffer()));p.setMaterial(group.mat);group.prims.push(p);
 }
 const mesh=d.createMesh(root.getName());for(const g of groups.values())mesh.addPrimitive(joinPrimitives(g.prims));root.setMesh(mesh);for(const n of nodes)n.dispose();
 report.push({name:root.getName(),materials:groups.size,triangles:mesh.listPrimitives().reduce((sum,p)=>sum+(p.getIndices()?.getCount()??p.getAttribute('POSITION').getCount())/3,0),anchors:root.listChildren().map(n=>({name:n.getName(),translation:n.getTranslation()}))});
}
await d.transform(dedup(),prune({keepLeaves:true}),weld(),textureCompress({encoder:sharp,targetFormat:'webp',resize:[256,256]}));
const path='public/assets/arrival-3d/weapons-188.glb';await io.write(path,d);const b=await readFile(path),meta={version:'0.1.188',author:'Echoes of Dante original equipment; Blender script, no external weapon asset',file:'weapons-188.glb',bytes:b.length,sha256:createHash('sha256').update(b).digest('hex'),models:report};await writeFile('public/assets/arrival-3d/weapons-188.json',JSON.stringify(meta,null,2)+'\n');console.log(meta);
