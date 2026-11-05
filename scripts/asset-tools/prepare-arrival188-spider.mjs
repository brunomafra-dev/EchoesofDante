import{NodeIO}from'@gltf-transform/core';import{ALL_EXTENSIONS}from'@gltf-transform/extensions';import{prune,dedup,resample,textureCompress}from'@gltf-transform/functions';import sharp from'sharp';import{readFile,writeFile}from'node:fs/promises';import{createHash}from'node:crypto';
const dir=(process.env.DANTE_ARRIVAL_ART_DIR??'.local/combat188')+'/',io=new NodeIO().registerExtensions(ALL_EXTENSIONS),input=await readFile(dir+'squinty_LOD1.glb'),doc=await io.readBinary(input);
if(createHash('sha256').update(input).digest('hex')!=='29f3d3bff81de211226bdb6329c2c7a8e304b39682a29231aa1e412412049871')throw Error('Unreviewed Squinty revision; stage the pinned official ZIP before conversion.');
const originals=doc.getRoot().listAnimations().map(a=>a.getName()),wanted=['Idle','Walk','Run','Attack','Bite','Hit','Death'];
for(const name of wanted)if(!originals.includes(name))throw Error('Missing original clip '+name);
const roots=[];
for(const a of doc.getRoot().listAnimations()){
 if(!wanted.includes(a.getName())){a.dispose();continue;}
 for(const c of a.listChannels())if(c.getTargetNode()?.getName()==='Body'&&c.getTargetPath()==='translation'){
  const out=c.getSampler().getOutput(),array=out.getArray(),first=Array.from(array.slice(0,3)),last=Array.from(array.slice(-3));roots.push({clip:a.getName(),first,last});
  // Gameplay owns XZ translation. Keep authored vertical articulation.
  for(let i=0;i<array.length;i+=3){array[i]=first[0];array[i+2]=first[2];}out.setArray(array);
 }
}
for(const m of doc.getRoot().listMaterials())m.getExtension('KHR_materials_emissive_strength')?.setEmissiveStrength(.25);
await doc.transform(resample(),dedup(),prune(),textureCompress({encoder:sharp,targetFormat:'webp',resize:[1024,1024]}));
const output=await io.writeBinary(doc);await writeFile(dir+'spider-runtime.glb',output);
const meta={author:'Easyforge / Easy Forge',source:'https://easyforge.itch.io/giant-monster-spiders-free-sample',license:'Giant Monster Spiders Asset Licence 1.0; incorporated game build only; not standalone redistribution',inputSha256:createHash('sha256').update(input).digest('hex'),sha256:createHash('sha256').update(output).digest('hex'),inputBytes:input.length,bytes:output.length,triangles:doc.getRoot().listMeshes().reduce((sum,m)=>sum+m.listPrimitives().reduce((s,p)=>s+p.getIndices().getCount()/3,0),0),joints:doc.getRoot().listSkins()[0].listJoints().length,materials:doc.getRoot().listMaterials().length,originalClips:originals,clips:wanted,textures:doc.getRoot().listTextures().map(t=>({name:t.getName(),size:t.getSize(),mime:t.getMimeType()})),rootMotion:roots,changes:'LOD1; seven gameplay clips; XZ Body root motion removed; four maps resized to 1024 WebP, emissive strength 0.25. Original textures and skin retained. Runtime scale/grounding separate from gameplay collision.'};
await writeFile(dir+'spider-runtime.json',JSON.stringify(meta,null,2)+'\n');console.log(JSON.stringify(meta,null,2));
