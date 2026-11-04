// Offline surface sampling in the same initial spine space used by Avatar.
// Only reads the shipped humans; never changes their GLBs or animations.
import {readFile,writeFile,mkdir}from'node:fs/promises';
import * as T from'three';
import {GLTFLoader}from'three/addons/loaders/GLTFLoader.js';
// Geometry-only parsing for Node: omit image references, preserve vertices,
// weights, inverse binds and animation data verbatim from the shipped GLB.
async function load(file){const b=await readFile('public/assets/arrival-3d/'+file),length=b.readUInt32LE(12),g=JSON.parse(b.subarray(20,20+length));
 for(const m of g.materials){for(const key of Object.keys(m))if(key.endsWith('Texture'))delete m[key];for(const key of Object.keys(m.pbrMetallicRoughness??{}))if(key.endsWith('Texture'))delete m.pbrMetallicRoughness[key];}
 const raw=Buffer.from(JSON.stringify(g)),json=Buffer.alloc(Math.ceil(raw.length/4)*4,32);raw.copy(json);const bin=b.subarray(20+length),out=Buffer.alloc(20+json.length+bin.length);b.subarray(0,12).copy(out);out.writeUInt32LE(out.length,8);out.writeUInt32LE(json.length,12);out.writeUInt32LE(0x4e4f534a,16);json.copy(out,20);bin.copy(out,20+json.length);return new GLTFLoader().parseAsync(out.buffer.slice(out.byteOffset,out.byteOffset+out.byteLength),'');}

await mkdir('.local/backpack190',{recursive:true});
for(const gender of ['male','female']){
 const g=await load('crew-'+gender+'.glb'),m=g.scene,b=new T.Box3().setFromObject(m),scale=1.9/(b.max.y-b.min.y);m.scale.setScalar(scale);m.position.y=-b.min.y*scale;
 const mixer=new T.AnimationMixer(m);mixer.clipAction(g.animations.find(a=>a.name==='Idle')).fadeIn(.17).play();mixer.update(.01);m.updateMatrixWorld(true);const first=m.getObjectByName('spine_03').matrixWorld.clone();mixer.update(.60);m.updateMatrixWorld(true);const gear=m.getObjectByName('spine_03').matrixWorld.clone().multiply(first.clone().invert()),inv=gear.clone().invert(),meshes=[];
 m.traverse(o=>{if(!o.isSkinnedMesh||o.userData.arrivalHair||!o.visible)return;const geo=o.geometry.clone(),a=geo.attributes.position;for(let i=0;i<a.count;i++){const v=new T.Vector3().fromBufferAttribute(a,i);o.applyBoneTransform(i,v);o.localToWorld(v).applyMatrix4(inv);a.setXYZ(i,v.x,v.y,v.z);}geo.computeBoundingSphere();const mesh=new T.Mesh(geo,new T.MeshBasicMaterial({side:T.DoubleSide}));mesh.updateMatrixWorld(true);meshes.push(mesh);});
 const ray=new T.Raycaster(),fit=[];
 for(const side of [-1,1]){const points=[];for(const [x,y]of [[.14,1.51],[.13,1.47],[.12,1.40],[.12,1.32],[.13,1.25],[.14,1.20]].map(([x,y])=>[x*(gender==='female'?.78:1),y])){ray.set(new T.Vector3(x*side,y,2),new T.Vector3(0,0,-1));const hit=ray.intersectObjects(meshes,false)[0];points.push([x*side,y,hit?.point.z??null]);}fit.push(points);}
 const wraps=[];for(const side of [-1,1]){ray.set(new T.Vector3(side*2,1.20,.025),new T.Vector3(-side,0,0));const hit=ray.intersectObjects(meshes,false).find(h=>Math.abs(h.point.x)<.22);wraps.push(hit?.point.toArray());}await writeFile('.local/backpack190/wrap-'+gender+'.json',JSON.stringify(wraps));await writeFile('.local/backpack190/fit-'+gender+'.json',JSON.stringify(fit,null,2));}
