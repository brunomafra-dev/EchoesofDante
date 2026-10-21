import assert from 'node:assert/strict';
import {readFile,stat,mkdir,writeFile} from 'node:fs/promises';
const base=process.env.QA_BASE??'http://localhost:5192',out=process.env.QA_OUT??'docs/cinematic-compatibility/qa';
const name='arrival-compatible-v1.mp4',file='public/assets/cinematic-opening/'+name,url=base+'/assets/cinematic-opening/'+name,size=(await stat(file)).size,original=await readFile(file),report={base,checks:[]};
for(const [range,start,end]of [['bytes=0-1023',0,1023],['bytes=-512',size-512,size-1],['bytes=2048-',2048,size-1]]){
 const r=await fetch(url,{headers:{Range:range}});assert.equal(r.status,206);assert.equal(r.headers.get('content-type'),'video/mp4');assert.equal(r.headers.get('content-range'),`bytes ${start}-${end}/${size}`);const bytes=Buffer.from(await r.arrayBuffer());assert.ok(bytes.equals(original.subarray(start,end+1)));report.checks.push(range);
}
for(const range of ['bytes='+size+'-','bytes=20-10','bytes=-0']){const r=await fetch(url,{headers:{Range:range}});assert.equal(r.status,416);assert.equal(r.headers.get('content-range'),'bytes */'+size)}
for(const [media,type]of [[name,'video/mp4'],['arrival-compatible-v1.webm','video/webm'],['arrival.pt-BR.vtt','text/vtt; charset=utf-8']]){const r=await fetch(base+'/assets/cinematic-opening/'+media,{method:'HEAD'});assert.equal(r.status,200);assert.equal(r.headers.get('content-type'),type);assert.equal(r.headers.get('accept-ranges'),'bytes')}
report.passed=true;await mkdir(out,{recursive:true});await writeFile(out+'/http.json',JSON.stringify(report,null,2)+'\n');console.log('Real HTTP: MIME, HEAD, byte ranges, suffixes, seeking and unsatisfiable ranges passed');
