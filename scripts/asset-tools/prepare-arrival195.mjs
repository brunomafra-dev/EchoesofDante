import sharp from'sharp';import{NodeIO}from'@gltf-transform/core';import{ALL_EXTENSIONS}from'@gltf-transform/extensions';import{copyToDocument,unpartition,weld,dedup,prune,textureCompress}from'@gltf-transform/functions';
import * as T from'three';import{readFile,writeFile}from'node:fs/promises';import{createHash}from'node:crypto';
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS),doc=await io.read('.local/crew195/work-raw.glb'),buffer=doc.getRoot().listBuffers()[0];
const male=await io.read('public/assets/arrival-3d/crew-male-193.glb'),waist=[];for(const mesh of male.getRoot().listMeshes())for(const prim of mesh.listPrimitives())if(/Peasant/.test(prim.getMaterial().getName()))for(let i=0;i<prim.getAttribute('POSITION').getCount();i++){const p=prim.getAttribute('POSITION').getElement(i,[]);if(p[1]>1.01&&p[1]<1.23&&Math.abs(p[0])<.26)waist.push({p,j:prim.getAttribute('JOINTS_0').getElement(i,[]),w:prim.getAttribute('WEIGHTS_0').getElement(i,[])});}
for(const m of doc.getRoot().listMaterials()){const tint=m.getExtras().danteTint;if(!tint)throw Error('Missing authored tint '+m.getName());m.setBaseColorFactor(tint);m.setExtras({});}
for(const root of doc.getRoot().getDefaultScene().listChildren())root.traverse(node=>{if(!node.getMesh())return;const matrix=new T.Matrix4().fromArray(node.getWorldMatrix());if(root.getName()==='head-ivo')matrix.premultiply(new T.Matrix4().fromArray(male.getRoot().listNodes().find(n=>n.getName()==='Head').getWorldMatrix()).invert());const normal=new T.Matrix3().getNormalMatrix(matrix);for(const p of node.getMesh().listPrimitives()){
 const pos=p.getAttribute('POSITION'),norm=p.getAttribute('NORMAL'),a=pos.getArray().slice(),b=norm.getArray().slice();for(let i=0;i<pos.getCount();i++){new T.Vector3().fromArray(a,i*3).applyMatrix4(matrix).toArray(a,i*3);new T.Vector3().fromArray(b,i*3).applyMatrix3(normal).normalize().toArray(b,i*3);}pos.setArray(a);norm.setArray(b);
 if(root.getName()==='apron-hem'){const j=new Uint16Array(pos.getCount()*4),w=new Float32Array(pos.getCount()*4);for(let i=0;i<pos.getCount();i++){const point=pos.getElement(i,[]),nearest=waist.reduce((a,b)=>point.reduce((s,x,k)=>s+(x-a.p[k])**2,0)<point.reduce((s,x,k)=>s+(x-b.p[k])**2,0)?a:b),blend=Math.max(0,Math.min(1,(point[1]-1.0)/.13)),weights=new Map([[1,1-blend]]);for(let k=0;k<4;k++)weights.set(nearest.j[k],(weights.get(nearest.j[k])??0)+nearest.w[k]*blend);const sorted=[...weights].sort((a,b)=>b[1]-a[1]).slice(0,4),sum=sorted.reduce((s,v)=>s+v[1],0);sorted.forEach(([index,weight],k)=>{j[i*4+k]=index;w[i*4+k]=weight/sum;});}for(const[name,array]of[['JOINTS_0',j],['WEIGHTS_0',w]])p.setAttribute(name,doc.createAccessor().setType('VEC4').setArray(array).setBuffer(buffer));}
}node.setMatrix(new T.Matrix4().toArray());});
const authoredMaterials=doc.getRoot().listMaterials().slice();
// Only the hem and tools need additional geometry. Uniforms below reuse the
// complete original outfit with its exact skin weights and continuous seams.
const rgb=hex=>new T.Color(hex).toArray();
const canvasTex=doc.getRoot().listTextures().find(t=>t.getName().includes('canvas'));
// The cloth map is present as an authored material swatch, even if no tool
// uses canvas. It is included explicitly by the authoring script.
if(!canvasTex)throw Error('Missing woven canvas texture');
const palette={ivo:['#777766','#565a4b','#4a3b2e','#66503a','#bc9778'],lia:['#d8d5c4','#777b65','#4f4537','#cccdbd','#946748'],nara:['#85806a','#5a6150','#48402f','#626a52','#c6a17f'],gui:['#647079','#737559','#4a3f30','#6a5541','#bf9572'],elisa:['#dedbc9','#7b7b6c','#574533','#626a52','#e0bd9b']};
for(const role of Object.keys(palette)){
 const gender=['ivo','gui'].includes(role)?'male':'female',crew=await io.read('public/assets/arrival-3d/crew-'+gender+'-193.glb'),source=crew.getRoot().listNodes().find(n=>n.getMesh()?.listPrimitives().some(p=>/Peasant/.test(p.getMaterial().getName()))),copy=copyToDocument(doc,crew,[source.getMesh()]).get(source.getMesh()),mesh=doc.createMesh('Integrated work outfit '+role);
 const materials=new Map(),uniform=doc.createNode('dress-'+role).setMesh(mesh);doc.getRoot().getDefaultScene().addChild(uniform);
 const use=(kind,sourceMaterial)=>{if(materials.has(kind))return materials.get(kind);const colors=palette[role],color=kind==='skin'?colors[4]:kind==='pants'?colors[1]:kind==='boots'?colors[2]:kind==='coat'?colors[3]:kind==='apron'?colors[3]:kind==='scarf'?'#ab602d':kind==='patch'?'#bc7136':colors[0];let m;
  if(kind==='skin'){m=doc.createMaterial('195 exposed skin '+role).setBaseColorFactor([...rgb(color),1]).setRoughnessFactor(.82);}
  else{m=doc.createMaterial('195 '+role+' '+kind).setBaseColorFactor([...rgb(color),1]).setRoughnessFactor(kind==='boots'?.84:.94).setBaseColorTexture(kind==='apron'?authoredMaterials.find(m=>m.getName().includes('smith leather')).getBaseColorTexture():canvasTex);if(sourceMaterial.getNormalTexture())m.setNormalTexture(sourceMaterial.getNormalTexture()).setNormalScale(.55);m.setDoubleSided(false);}
  materials.set(kind,m);return m;};
 for(const prim of copy.listPrimitives()){
  const p=prim.getAttribute('POSITION'),j=prim.getAttribute('JOINTS_0'),w=prim.getAttribute('WEIGHTS_0'),index=prim.getIndices(),groups=new Map();
  const category=ids=>{const center=[0,0,0];let hand=0;for(const i of ids){const point=p.getElement(i,[]);point.forEach((v,k)=>center[k]+=v/3);for(let k=0;k<4;k++){const joint=j.getElement(i,[])[k];if(joint>=10&&joint<=30||joint>=34&&joint<=54)hand+=w.getElement(i,[])[k]/3;}}
   const[x,y,z]=center;if(/Regular/.test(prim.getMaterial().getName())||hand>.4)return'skin';if(y<.34)return'boots';if(y<1.02)return'pants';
   if(role==='ivo'){const width=y<1.21?.18:.11;if(z>.015&&Math.abs(x)<width&&y<1.47&&y>1.095)return'apron';return'shirt';}
   if(role==='nara'&&y>1.40&&y<1.52&&z>.03&&Math.abs(x)<.066)return'scarf';
   if(role==='lia'&&y>1.32&&y<1.4&&x<-.08&&x>-.16&&z>.045)return'patch';
   if(Math.abs(x)<.24&&(z<0||Math.abs(x)>.04))return'coat';return'shirt';};
  for(let i=0;i<(index?.getCount()??p.getCount());i+=3){const ids=[0,1,2].map(k=>index?index.getScalar(i+k):i+k);if(/Regular/.test(prim.getMaterial().getName())&&ids.reduce((sum,n)=>sum+Math.abs(p.getElement(n,[])[0]),0)/3<.50)continue;const kind=category(ids);if(!groups.has(kind))groups.set(kind,[]);groups.get(kind).push(...ids);}
  for(const[kind,indices]of groups){const part=doc.createPrimitive().setMode(prim.getMode()).setMaterial(use(kind,prim.getMaterial())).setIndices(doc.createAccessor().setType('SCALAR').setArray(new Uint32Array(indices)).setBuffer(buffer));for(const semantic of prim.listSemantics())part.setAttribute(semantic,prim.getAttribute(semantic));mesh.addPrimitive(part);}
 }
 uniform.setExtras({gender,anchor:'skin',exactOriginalWeights:true});
}
const hem=doc.getRoot().getDefaultScene().listChildren().find(n=>n.getName()==='apron-hem'),ivo=doc.getRoot().getDefaultScene().listChildren().find(n=>n.getName()==='dress-ivo');doc.getRoot().getDefaultScene().removeChild(hem);ivo.addChild(hem);
for(const root of doc.getRoot().getDefaultScene().listChildren())if(root.getName()==='material-swatches')root.dispose();
await doc.transform(unpartition(),weld(),dedup(),prune({keepLeaves:true}),textureCompress({encoder:sharp,targetFormat:'webp',resize:[256,256],quality:90}),dedup(),prune({keepLeaves:true}));
const records=doc.getRoot().getDefaultScene().listChildren().filter(n=>/^(dress|tool|head)-/.test(n.getName())).map(root=>{let triangles=0;root.traverse(n=>{for(const p of n.getMesh()?.listPrimitives()??[])triangles+=(p.getIndices()?.getCount()??p.getAttribute('POSITION').getCount())/3;});return{name:root.getName(),gender:/(lia|nara|elisa)$/.test(root.getName())?'female':'male',anchor:root.getName().startsWith('dress-')?'skin':root.getName().startsWith('head-')?'Head':'grip',triangles};});
const file='crew-work-195.glb';await io.write('public/assets/arrival-3d/'+file,doc);const bytes=await readFile('public/assets/arrival-3d/'+file),meta={version:'0.1.195',file,bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex'),author:'Echoes of Dante original tools/textures; integrated work uniforms adapted from Quaternius UBC CC0 outfit surfaces with unchanged source skin weights.',textures:doc.getRoot().listTextures().length,materials:doc.getRoot().listMaterials().length,models:records};
await writeFile('public/assets/arrival-3d/crew-work-195.json',JSON.stringify(meta,null,2)+'\n');console.log(JSON.stringify(meta,null,2));
