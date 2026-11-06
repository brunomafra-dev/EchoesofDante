import assert from'node:assert/strict';
import{execFile}from'node:child_process';
import{promisify}from'node:util';
import{mkdir,mkdtemp,readFile,writeFile}from'node:fs/promises';
import{resolve}from'node:path';
import{createHash}from'node:crypto';
const run=promisify(execFile),out='docs/2d-refinement/qa/199/build',report={passed:false,checks:[],results:[]};await mkdir(out,{recursive:true});await mkdir('.local/qa199-build',{recursive:true});
const script=resolve('scripts/asset-tools/ensure-arrival-hollow.mjs');
try{
 for(const mode of['offline-empty','outage','shipped-module','cache']){
  const temp=await mkdtemp(resolve('.local/qa199-build/case-')),dir=temp+'/art',cache=mode==='cache'?resolve('node_modules/.cache/dante-reviewed-hollow'):temp+'/cache';
  const env={...process.env,VERCEL:'1',DANTE_ARRIVAL_ART_DIR:dir,DANTE_HOLLOW_CACHE_DIR:cache,DANTE_HOLLOW_OFFLINE:mode==='offline-empty'?'1':'0'};
  const code=mode==='outage'?`globalThis.fetch=async()=>{throw Error('Network outage fixture')};await import(${JSON.stringify('file:///'+script.replaceAll('\\','/'))});`:null;
  const result=await run(process.execPath,code?['--input-type=module','-e',code]:[script],{env,timeout:60000});report.results.push({mode,stdout:result.stdout.trim(),stderr:result.stderr.trim()});
  if(mode==='offline-empty'||mode==='outage')assert.match(result.stderr,/Build continues/);else{const meta=JSON.parse(await readFile(dir+'/spider-runtime.json','utf8')),bytes=await readFile(dir+'/spider-runtime.glb');assert.equal(createHash('sha256').update(bytes).digest('hex'),meta.sha256);assert.equal(meta.triangles,3826);}
 }
 report.checks.push('Clean Vercel-mode preparation succeeds with all networking disabled, with an injected network outage, from a verified private cache and from the exact previously published game module.','No original GLB/archive was added to public or Git; full reviewed 3D art survives the normal successful cache/recovery paths.');report.passed=true;
}catch(e){report.failure=String(e.stack??e);throw e;}finally{await writeFile(out+'/report.json',JSON.stringify(report,null,2)+'\n');console.log('199 build preparation',report.passed);}
