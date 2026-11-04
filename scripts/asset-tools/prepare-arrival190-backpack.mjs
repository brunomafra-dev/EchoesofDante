/** Offline adaptation of Quaternius' CC0 Backpack. No runtime mesh generation.
 * Source: https://poly.pizza/m/2g9Jm7kvIU (author-published, Public Domain CC0).
 * Place the downloaded, decoded GLB in .local/backpack190/backpack-source.glb.
 */
import {NodeIO} from '@gltf-transform/core';
import {dedup,prune,weld,transformPrimitive,joinPrimitives} from '@gltf-transform/functions';
import * as T from 'three';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const source='.local/backpack190/backpack-source.glb',bytes=await readFile(source),sha=createHash('sha256').update(bytes).digest('hex');
if(sha!=='315a559dc389f0a3a98395222d56c2db45b4bd505c93db282c7e34011f6e5c0f')throw Error('Unexpected Backpack source hash; inspect origin and license before adapting.');
const io=new NodeIO(),d=await io.read(source),scene=d.getRoot().getDefaultScene(),prims=[];
scene.traverse(n=>{for(const p of n.getMesh()?.listPrimitives()??[]){transformPrimitive(p,n.getWorldMatrix());prims.push(p);}});
const min=new T.Vector3(Infinity,Infinity,Infinity),max=new T.Vector3(-Infinity,-Infinity,-Infinity);
for(const p of prims){const a=p.getAttribute('POSITION');for(let i=0;i<a.getCount();i++){const v=new T.Vector3().fromArray(a.getElement(i,[]));min.min(v);max.max(v);}}
const center=min.clone().add(max).multiplyScalar(.5),scale=.5/(max.y-min.y);
const fit=new T.Matrix4().makeRotationY(Math.PI).multiply(new T.Matrix4().makeScale(scale,scale,scale)).multiply(new T.Matrix4().makeTranslation(-center.x,-center.y,-center.z));
const palette={Brown:'#99836a',LightGreen:'#69775e',Gold:'#aa8250',Green:'#414c3d'};
const fabric=d.createMaterial('Dante canvas and webbing').setMetallicFactor(0).setRoughnessFactor(.94),hardware=d.createMaterial('Dante brushed fasteners').setMetallicFactor(.55).setRoughnessFactor(.48);
const groups=new Map([[fabric,[]],[hardware,[]]]),buffer=d.getRoot().listBuffers()[0];
for(const p of prims){transformPrimitive(p,fit.elements);const old=p.getMaterial(),color=new T.Color(palette[old.getName()]??'#69775e'),count=p.getAttribute('POSITION').getCount(),array=new Float32Array(count*4);for(let i=0;i<count;i++)array.set([color.r,color.g,color.b,1],i*4);p.setAttribute('COLOR_0',d.createAccessor().setType('VEC4').setArray(array).setBuffer(buffer));const mat=old.getName()==='Gold'?hardware:fabric;p.setMaterial(mat);groups.get(mat).push(p);}
const pack=d.createNode('field-backpack'),mesh=d.createMesh('Quaternius Backpack adapted');for(const ps of groups.values())mesh.addPrimitive(joinPrimitives(ps));pack.setMesh(mesh);
for(const root of scene.listChildren())scene.removeChild(root);scene.addChild(pack);

// Closed, thin fabric ribbons follow the chest/shoulder contour. Their flat
// section and matte surface deliberately replace the old rectangular bars.
function ribbon(points,width,thickness,color){
 const curve=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),vertices=[],indices=[],segments=24;
 for(let i=0;i<=segments;i++){
  const p=curve.getPoint(i/segments),t=curve.getTangent(i/segments),x=new T.Vector3(1,0,0),normal=x.clone().cross(t).normalize();
  for(const [a,b]of [[-1,-1],[1,-1],[1,1],[-1,1]])vertices.push(...p.clone().addScaledVector(x,a*width/2).addScaledVector(normal,b*thickness/2).toArray());
 }
 for(let i=0;i<segments;i++)for(let j=0;j<4;j++){const a=i*4+j,b=i*4+(j+1)%4;indices.push(a,b,b+4,a,b+4,a+4);}indices.push(0,2,1,0,3,2,96,97,98,96,98,99);
 for(let i=0;i<indices.length;i+=3)[indices[i+1],indices[i+2]]=[indices[i+2],indices[i+1]];
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(vertices,3));g.setIndex(indices);g.computeVertexNormals();
 const p=d.createPrimitive().setAttribute('POSITION',d.createAccessor().setType('VEC3').setArray(g.attributes.position.array).setBuffer(buffer)).setAttribute('NORMAL',d.createAccessor().setType('VEC3').setArray(g.attributes.normal.array).setBuffer(buffer)).setIndices(d.createAccessor().setType('SCALAR').setArray(new Uint16Array(indices)).setBuffer(buffer));
 const c=new T.Color(color),cols=new Float32Array(g.attributes.position.count*4);for(let i=0;i<g.attributes.position.count;i++)cols.set([c.r,c.g,c.b,1],i*4);p.setAttribute('COLOR_0',d.createAccessor().setType('VEC4').setArray(cols).setBuffer(buffer));p.setMaterial(fabric);return p;
}
for(const gender of ['male','female']){
 const ps=[],fit=JSON.parse(await readFile('.local/backpack190/fit-'+gender+'.json','utf8')),wraps=JSON.parse(await readFile('.local/backpack190/wrap-'+gender+'.json','utf8'));
 for(const [index,side]of [-1,1].entries()){
  const front=fit[index].map(([x,y,z])=>{if(z===null)throw Error('Harness misses torso: '+gender);return[x,y,z+(gender==='female'?(y>=1.47?.042:.02):.012)];}),wrap=wraps[index];
  const path=[[.13*side,1.48,-.15],[.16*side,1.565,-.055],[(gender==='female'?.16:.17)*side,1.55,.06],...front,[wrap[0]+side*.009,wrap[1],wrap[2]],[.15*side,1.16,-.15]];
  ps.push(ribbon(path,.034,.007,'#3c4738'));
  for(const edge of [-1,1])ps.push(ribbon(path.map(([x,y,z])=>[x+edge*.014,y,z+.001]),.0018,.008,'#899076'));
 }
 scene.addChild(d.createNode('field-harness-'+gender).setMesh(d.createMesh('Contoured fabric harness '+gender).addPrimitive(joinPrimitives(ps))));
}
await d.transform(prune(),dedup(),weld());
const file='backpack-190.glb';await io.write('public/assets/arrival-3d/'+file,d);const output=await readFile('public/assets/arrival-3d/'+file);
const meta={version:'0.1.190',file,author:'Quaternius; adaptation and fabric harness by Echoes of Dante',source:'https://poly.pizza/m/2g9Jm7kvIU',sourceFileURL:'https://static.poly.pizza/0d29cdc2-0baf-4bf7-835f-075b34c70b61.glb.br',license:'CC0-1.0',sourceSHA256:sha,sha256:createHash('sha256').update(output).digest('hex'),bytes:output.length,changes:['Centered, rotated and normalized to 0.50 m height','Canvas/bedroll/strap palette and physically appropriate roughness; metallic only on fasteners','Four source materials merged to two with vertex colors','Original, thin contoured fabric harness for both existing human rigs'],models:scene.listChildren().map(n=>({name:n.getName(),triangles:n.getMesh().listPrimitives().reduce((sum,p)=>sum+p.getIndices().getCount()/3,0),materials:n.getMesh().listPrimitives().length})),textures:d.getRoot().listTextures().length};
await writeFile('public/assets/arrival-3d/backpack-190.json',JSON.stringify(meta,null,2)+'\n');console.log(meta);
