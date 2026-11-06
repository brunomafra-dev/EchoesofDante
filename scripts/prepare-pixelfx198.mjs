// Offline only. Run after obtaining the pinned official PixelFX source in .local.
import{mkdir,writeFile,copyFile,readFile}from'node:fs/promises';
import{createHash}from'node:crypto';
import{resolve}from'node:path';
import{pathToFileURL}from'node:url';
import{execFileSync}from'node:child_process';
const source=resolve(process.env.DANTE_PIXELFX_SOURCE??'.local/pixelfx-198');
const {loadEffect,renderFrames,spriteSheet}=await import(pathToFileURL(source+'/tools/lib/fxlib.mjs'));
const output='public/assets/visual/pixelfx';await mkdir(output,{recursive:true});
const commit=execFileSync('git',['-C',source,'rev-parse','HEAD'],{encoding:'utf8'}).trim();
const definitions=[
 ['energy-field','lightning/lightning-strike',.76,2.15,1.35],
 ['energy-ground','lightning/thunderclap',.03,1.6,1.35],
 ['fire-field','fire/fire-ring',.06,3.5,3],
 ['water-ground','water/whirlpool',0,3,2.5],
 ['water-field','water/splash',.16,1.3,1.15],
 ['earth-field','nature/earth-spike',.2,1.65,.85],
 ['frost-shatter','ice/ice-shatter',0,1.2,.65],
 ['ground-impact','impacts/ground-slam',0,1.2,.65],
 ['hit-spark','impacts/hit-spark',0,.45,.18],
];
const records=[];
for(const[name,id,start,end,duration]of definitions){
 const fx=await loadEffect(id),render=renderFrames(fx,{fps:30,actor:false,bg:'none',seed:19});
 const frames=Array.from({length:16},(_,i)=>render.frames[Math.min(render.n-1,Math.round((start+(end-start)*i/15)*30))]);
 const sheet=spriteSheet(fx,{...render,frames,fps:16/duration,n:16},name);
 await writeFile(`${output}/${name}-source.png`,sheet.png);
 const meta={name,id,frameWidth:render.w,frameHeight:render.h,origin:fx.meta.origin,duration,frames:16,columns:4};
 // Source sheet dimensions may be non-square; the CPU packing step fixes columns.
 await writeFile(`${output}/${name}-source.json`,JSON.stringify({...sheet.json,meta:{...sheet.json.meta,dante:meta}},null,2)+'\n');
 records.push({...meta,sourceCommit:commit,sourceSha256:createHash('sha256').update(await readFile(source+'/src/fx/'+id+'.js')).digest('hex')});
 console.log(name,id);
}
await copyFile(source+'/LICENSE',output+'/LICENSE.txt');await copyFile(source+'/NOTICE.md',output+'/NOTICE.md');
await writeFile(`${output}/source-manifest.json`,JSON.stringify({source:'https://github.com/patch-gg/pixelfx',commit,license:'MIT; LICENSE.txt and NOTICE.md included. Gallery fonts excluded.',modifications:'16 sampled transparent frames, no actor/backdrop; timing and palette preserved/adapted to existing Dante combat. Packed/resized offline by prepare-pixelfx198.py.',effects:records},null,2)+'\n');
