import {readFile,writeFile} from 'node:fs/promises';
import {chromium} from 'playwright';
// Correct atlas extraction: figures cross the old uniform cell boundaries.
// Segment whole silhouettes before packing; never assemble body parts.
const root='public/assets/settlement-life',metadata=JSON.parse(await readFile(root+'/frames-r2.json','utf8'));
const files={caio:['caio-motion-r3','caio-motion-r4'],elisa:['elisa-motion-r4','elisa-motion-r5'],mara:['mara-motion-r2','mara-motion-r3'],tomas:['tomas-motion-r2','tomas-motion-r3']};
const browser=await chromium.launch({channel:'chrome'}),page=await browser.newPage();
try{for(const[id,[input,output]]of Object.entries(files)){
 const source='data:image/webp;base64,'+(await readFile(root+'/'+input+'.webp')).toString('base64');
 const result=await page.evaluate(async source=>{
  const image=new Image();image.src=source;await image.decode();const w=image.width,h=image.height,c=document.createElement('canvas');c.width=w;c.height=h;const ctx=c.getContext('2d');ctx.drawImage(image,0,0);const pixels=ctx.getImageData(0,0,w,h),rgba=pixels.data,q=new Int32Array(w*h);
  let labels,components,threshold;
  for(threshold of [80,128,192]){
   labels=new Int16Array(w*h).fill(-1);components=[];let component=0;
   for(let i=0;i<w*h;i++){
    if(labels[i]!==-1||rgba[i*4+3]<threshold)continue;let head=0,tail=0;q[tail++]=i;labels[i]=component;let left=w,right=0,top=h,bottom=0;
    while(head<tail){const n=q[head++],x=n%w,y=Math.floor(n/w);left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const xx=x+dx,yy=y+dy,j=yy*w+xx;if(xx<0||xx>=w||yy<0||yy>=h||labels[j]!==-1||rgba[j*4+3]<threshold)continue;labels[j]=component;q[tail++]=j}}
    if(tail>1500)components.push({label:component,left,right,top,bottom,size:tail,col:Math.max(0,Math.min(3,Math.round(((left+right)/2-w/8)/(w/4))))});component++;
   }
   if(components.length===16&&[0,1,2,3].every(col=>components.filter(v=>v.col===col).length===4))break;
  }
  if(components.length!==16)throw Error('Cannot isolate sixteen full silhouettes: '+components.length);
  const ordered=[];for(let col=0;col<4;col++)components.filter(v=>v.col===col).sort((a,b)=>a.top-b.top).forEach((v,row)=>ordered[row*4+col]=v);
  const index=new Map(ordered.map((v,i)=>[v.label,i])),owners=new Int16Array(w*h).fill(-1),edgeDistance=new Uint8Array(w*h);let head=0,tail=0;
  for(let i=0;i<w*h;i++)if(index.has(labels[i])){owners[i]=index.get(labels[i]);q[tail++]=i;}
  // Grow antialiased edges from their silhouette cores; narrow alpha bridges
  // between neighboring drawings are partitioned rather than copied twice.
  while(head<tail){const n=q[head++],x=n%w,y=Math.floor(n/w);if(edgeDistance[n]>=4)continue;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const xx=x+dx,yy=y+dy,j=yy*w+xx;if(xx<0||xx>=w||yy<0||yy>=h||owners[j]>=0||rgba[j*4+3]===0)continue;owners[j]=owners[n];edgeDistance[j]=edgeDistance[n]+1;q[tail++]=j;}}
  const boxes=ordered.map(()=>({left:w,right:0,top:h,bottom:0}));for(let n=0;n<w*h;n++){const id=owners[n];if(id<0)continue;const b=boxes[id],x=n%w,y=Math.floor(n/w);b.left=Math.min(b.left,x);b.right=Math.max(b.right,x);b.top=Math.min(b.top,y);b.bottom=Math.max(b.bottom,y);}
  const fit=Math.min(...boxes.flatMap(b=>[226/(b.right-b.left+1),226/(b.bottom-b.top+1)]));
  const atlas=document.createElement('canvas');atlas.width=atlas.height=1024;const ac=atlas.getContext('2d'),anchors=[];
  for(let i=0;i<16;i++){
   const b=boxes[i],piece=document.createElement('canvas');piece.width=b.right-b.left+1;piece.height=b.bottom-b.top+1;const pc=piece.getContext('2d'),data=pc.createImageData(piece.width,piece.height);
   for(let y=0;y<piece.height;y++)for(let x=0;x<piece.width;x++){const n=(b.top+y)*w+b.left+x;if(owners[n]!==i)continue;for(let k=0;k<4;k++)data.data[(y*piece.width+x)*4+k]=rgba[n*4+k];}pc.putImageData(data,0,0);
   const width=piece.width*fit,height=piece.height*fit;ac.drawImage(piece,i%4*256+(256-width)/2,Math.floor(i/4)*256+242-height,width,height);anchors.push({x:.5,y:242/256});
  }
  return{data:atlas.toDataURL('image/webp',.94),anchors,scale:108/((boxes[8].bottom-boxes[8].top+1)*fit),threshold,figures:boxes.length};
 },source);
 await writeFile(root+'/'+output+'.webp',Buffer.from(result.data.split(',')[1],'base64'));metadata[id]={scale:result.scale,anchors:result.anchors};console.log(id,output,'silhouettes',result.figures,'alpha core',result.threshold);
}}finally{await browser.close()}
await writeFile(root+'/frames-r3.json',JSON.stringify(metadata,null,2)+'\n');
