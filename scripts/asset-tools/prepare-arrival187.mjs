import {NodeIO}from'@gltf-transform/core';
import {ALL_EXTENSIONS}from'@gltf-transform/extensions';
import {dedup,prune,weld,textureCompress}from'@gltf-transform/functions';
import sharp from'sharp';import{readFile,writeFile}from'node:fs/promises';import{createHash}from'node:crypto';
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS),files=[];
for(const name of['antlion','wyvern']){
 const d=await io.read('.local/creature187/export/'+name+'-raw.glb');
 if(name==='antlion')for(const mat of d.getRoot().listMaterials())mat.setBaseColorFactor([.36,.28,.18,1]);
 await d.transform(dedup(),prune(),weld(),textureCompress({encoder:sharp,targetFormat:'webp',resize:[512,512]}));
 const file='creature-'+name+'-187.glb',path='public/assets/arrival-3d/'+file;await io.write(path,d);
 const b=await readFile(path);files.push({file,bytes:b.length,sha256:createHash('sha256').update(b).digest('hex'),meshes:d.getRoot().listMeshes().length,materials:d.getRoot().listMaterials().length,textures:d.getRoot().listTextures().map(t=>({name:t.getName(),size:t.getSize()})),animations:d.getRoot().listAnimations().map(a=>({name:a.getName(),channels:a.listChannels().length})),source:name==='antlion'?'art_src_hd/characters/antlion/antlion.blend':'art_src_hd/characters/wyvern/wyvern.blend',license:name==='antlion'?'CC-BY-3.0':'CC-BY-SA-3.0',authors:name==='antlion'?['Clint Bellanger']:['Clint Bellanger','Justin Nichol']});
}
const manifest={version:'0.1.187',sourceRepository:'https://github.com/flareteam/flare-game-art-src',sourceCommit:'8830c68b420b631e09a459e5b0bf87c0e068a558',changes:'Blender to glTF conversion; antlion procedural color baked without external normal; one material atlas; painted earth wyvern texture resized to 512px WebP; original meshes, weights and authored poses retained.',files};
await writeFile('public/assets/arrival-3d/creatures-187.json',JSON.stringify(manifest,null,2)+'\n');console.log(JSON.stringify(manifest,null,2));
