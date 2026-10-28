import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {chromium} from 'playwright';
const sheets={ivo:'ivo-work-r1',lia:'lia-work-r1',nara:'nara-work-r1',caio:'caio-motion-r2',elisa:'elisa-motion-r3',mara:'mara-motion-r1',tomas:'tomas-motion-r1'};
const out='public/assets/settlement-life',metadata={};await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome'}),page=await browser.newPage();
try{for(const[id,file]of Object.entries(sheets)){
 const bytes=await readFile(`.local/settlement-life/raw/${file}.png`);
 const packed=await page.evaluate(async({source,id})=>{
  const image=new Image();image.src=source;await image.decode();if(image.width!==1536||image.height!==1024)throw Error('Unexpected sheet dimensions');
  const sourceCanvas=document.createElement('canvas');sourceCanvas.width=1536;sourceCanvas.height=1024;const sourceContext=sourceCanvas.getContext('2d');sourceContext.drawImage(image,0,0);const rgba=sourceContext.getImageData(0,0,1536,1024).data;
  const job=['ivo','lia','nara'].includes(id),anchors=[];let standingHeight=0;
  for(let frame=0;frame<6;frame++){
   const ox=frame%3*512,oy=Math.floor(frame/3)*512,alpha=(x,y)=>rgba[((oy+y)*1536+ox+x)*4+3];
   let top=512,bottom=0,count=0;for(let y=0;y<512;y++)for(let x=0;x<512;x++)if(alpha(x,y)>100){top=Math.min(top,y);bottom=Math.max(bottom,y);count++;}
   if(count<3000)throw Error('Empty frame '+frame);
   let foot=bottom;if(job){foot=0;for(let y=0;y<512;y++)for(let x=0;x<205;x++)if(alpha(x,y)>100)foot=Math.max(foot,y);}
   let sum=0,weight=0;for(let y=Math.max(0,foot-(job?12:95));y<=foot;y++)for(let x=0;x<(job?205:512);x++){const a=alpha(x,y);if(a>100){sum+=x*a;weight+=a;}}
   const x=(sum/weight+(job?35:0))/512,y=foot/512;anchors.push({x:+x.toFixed(5),y:+y.toFixed(5)});if(frame===0)standingHeight=foot-top;
  }
  const canvas=document.createElement('canvas');canvas.width=768;canvas.height=512;const context=canvas.getContext('2d');context.imageSmoothingEnabled=true;context.imageSmoothingQuality='high';context.drawImage(image,0,0,768,512);
  return {data:canvas.toDataURL('image/webp',.94),scale:+(108/(standingHeight/2)).toFixed(5),anchors};
 },{source:'data:image/png;base64,'+bytes.toString('base64'),id});
 assert.ok(packed.data.startsWith('data:image/webp;'));assert.ok(packed.anchors.every(a=>a.x>.1&&a.x<.9&&a.y>.4&&a.y<=1));
 const result=Buffer.from(packed.data.split(',')[1],'base64');await writeFile(`${out}/${file}.webp`,result);metadata[id]={scale:packed.scale,anchors:packed.anchors};console.log(id,result.length,'bytes',packed.scale);
 }}finally{await browser.close();}
await writeFile(out+'/frames.json',JSON.stringify(metadata,null,2)+'\n');
