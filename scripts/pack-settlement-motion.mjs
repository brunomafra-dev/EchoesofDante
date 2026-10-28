import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {chromium} from 'playwright';
const out='public/assets/settlement-life',raw='.local/settlement-motion/raw';await mkdir(raw,{recursive:true});
const sheets={caio:['caio-motion-r3','exec-b4c91588-91c1-4955-ad9c-ed61c1c49aff.png'],elisa:['elisa-motion-r4','exec-744611b7-3185-4a38-8118-6e6c0d99a838.png'],mara:['mara-motion-r2','exec-fd0f157a-2ffb-4c7c-aa84-c0586367a88c.png'],tomas:['tomas-motion-r2','exec-3a9c086d-f4ab-4e8a-b32f-40dc1dd98e8c.png']};
const metadata=JSON.parse(await readFile(out+'/frames.json','utf8'));
const b=await chromium.launch({channel:'chrome'}),p=await b.newPage();
try{for(const[id,[file,origin]]of Object.entries(sheets)){
 const bytes=await readFile('C:/Users/1/.codex/generated_images/01a173c1-3677-75b2-89b6-2f3640ffad61/'+origin);await writeFile(raw+'/'+file+'.png',bytes);
 const result=await p.evaluate(async source=>{
  const image=new Image();image.src=source;await image.decode();if(image.width!==image.height)throw Error('Expected square 4x4 sheet');
  const c=document.createElement('canvas');c.width=c.height=1024;const ctx=c.getContext('2d');
  const a=document.createElement('canvas');a.width=a.height=256;const ac=a.getContext('2d'),anchors=[];let height=0;
  for(let i=0;i<16;i++){
   ac.clearRect(0,0,256,256);ac.drawImage(image,i%4*image.width/4,Math.floor(i/4)*image.height/4,image.width/4,image.height/4,0,0,256,256);ctx.drawImage(a,i%4*256,Math.floor(i/4)*256);
   const rgba=ac.getImageData(0,0,256,256).data;let top=256,bottom=0;for(let y=0;y<256;y++)for(let x=0;x<256;x++)if(rgba[(y*256+x)*4+3]>100){top=Math.min(top,y);bottom=Math.max(bottom,y)}
   if(bottom-top<65)throw Error('Missing full figure '+i);
   // Fixed horizontal registration avoids foot-centroid jitter as support changes.
   anchors.push({x:.5,y:bottom/256});if(i===8)height=bottom-top;
  }
  return{data:c.toDataURL('image/webp',.94),scale:108/height,anchors};
 },'data:image/png;base64,'+bytes.toString('base64'));
 await writeFile(out+'/'+file+'.webp',Buffer.from(result.data.split(',')[1],'base64'));metadata[id]={scale:result.scale,anchors:result.anchors};console.log(id,file,result.anchors.length);
 }
 for(const[id,file]of Object.entries({ivo:'ivo-work-r1',lia:'lia-work-r1',nara:'nara-work-r1'})){
  const bytes=await readFile(out+'/'+file+'.webp');
  metadata[id].anchors=await p.evaluate(async({source,scale})=>{
   const image=new Image();image.src=source;await image.decode();const c=document.createElement('canvas');c.width=c.height=256;const ctx=c.getContext('2d'),anchors=[];
   for(let i=0;i<6;i++){ctx.clearRect(0,0,256,256);ctx.drawImage(image,i%3*256,Math.floor(i/3)*256,256,256,0,0,256,256);const rgba=ctx.getImageData(0,0,256,256).data;let right=0,bottom=0;
    for(let y=128;y<256;y++)for(let x=128;x<256;x++)if(rgba[(y*256+x)*4+3]>100){right=Math.max(right,x);bottom=Math.max(bottom,y)}
    anchors.push({x:(right-82/scale)/256,y:(bottom-17/scale)/256});
   }return anchors;
  },{source:'data:image/webp;base64,'+bytes.toString('base64'),scale:metadata[id].scale});
 }
}finally{await b.close()}
// The old metadata remains available for old public lab sheets; new loader uses r2.
await writeFile(out+'/frames-r2.json',JSON.stringify(metadata,null,2)+'\n');
