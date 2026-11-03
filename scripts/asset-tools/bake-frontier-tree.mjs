// Offline impostor bake from the complete CC0 model. Never loaded by the game.
import {chromium} from 'playwright';
import {writeFile} from 'node:fs/promises';
import sharp from 'sharp';
const browser=await chromium.launch({channel:'chrome'});
try{
 const page=await browser.newPage();
 await page.goto('http://127.0.0.1:5185/frontier-3d.html');
 const frames=await page.evaluate(async()=>{
  const T=await import('/node_modules/three/build/three.module.js');
  const {GLTFLoader}=await import('/node_modules/three/examples/jsm/loaders/GLTFLoader.js');
  const g=await new GLTFLoader().loadAsync('/.local/visual184/ph/tree_small_02/model.gltf');
  const s=new T.Scene();s.add(g.scene);s.add(new T.HemisphereLight('#c3dae4','#4a4435',1.45));
  const sun=new T.DirectionalLight('#ffe0b4',3.6);sun.position.set(-18,30,8);s.add(sun);
  const r=new T.WebGLRenderer({alpha:true,antialias:true,preserveDrawingBuffer:true});r.setSize(768,1024);r.setClearColor(0,0);r.toneMapping=T.ACESFilmicToneMapping;r.toneMappingExposure=1.15;
  const box=new T.Box3().setFromObject(g.scene),height=box.max.y-box.min.y,center=box.getCenter(new T.Vector3());
  const camera=new T.OrthographicCamera(-height*.45,height*.45,height*.6,-height*.6,.1,50);camera.position.set(0,center.y,10);camera.lookAt(0,center.y,0);
  const images=[];for(let i=0;i<2;i++){g.scene.rotation.y=i*Math.PI/2;r.render(s,camera);images.push(r.domElement.toDataURL('image/png'));}r.dispose();return{images,height,center:center.toArray(),width:height*.9,planeHeight:height*1.2};
 });
 for(let i=0;i<frames.images.length;i++)await sharp(Buffer.from(frames.images[i].split(',')[1],'base64')).webp({quality:92,alphaQuality:100}).toFile('public/assets/frontier-3d/tree-canopy-'+i+'.webp');
 delete frames.images;await writeFile('.local/visual184/tree-bake.json',JSON.stringify(frames,null,2)+'\n');console.log(frames);
}finally{await browser.close();}
