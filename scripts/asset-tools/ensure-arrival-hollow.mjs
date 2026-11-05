// A clean deployment obtains the same reviewed free sample from its author.
// Never commit or publish the source archive/GLB as a standalone asset.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {existsSync} from 'node:fs';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
import {unzipSync} from 'fflate';

const dir=resolve(process.env.DANTE_ARRIVAL_ART_DIR??'.local/combat188');
const hash=data=>createHash('sha256').update(data).digest('hex');
const sourceHash='29f3d3bff81de211226bdb6329c2c7a8e304b39682a29231aa1e412412049871';
async function check(){
 const meta=JSON.parse(await readFile(resolve(dir,'spider-runtime.json'),'utf8'));
 assert.equal(meta.inputSha256,sourceHash,'Unreviewed source model');
 assert.equal(hash(await readFile(resolve(dir,'spider-runtime.glb'))),meta.sha256,'Prepared model hash mismatch');
 assert.equal(meta.triangles,3826);assert.equal(meta.joints,107);assert.equal(meta.materials,1);
 assert.deepEqual(meta.clips,['Idle','Walk','Run','Attack','Bite','Hit','Death']);
 return meta;
}
if(existsSync(resolve(dir,'spider-runtime.glb'))&&existsSync(resolve(dir,'spider-runtime.json'))){await check();console.log('Reviewed Hollow art ready (ignored build input).');process.exit(0);}
if(process.env.VERCEL!=='1'&&!process.argv.includes('--fetch')){console.log('No prepared Hollow art; local build keeps the identified legacy fallback. Use --fetch to prepare the official free sample.');process.exit(0);}

const page='https://easyforge.itch.io/giant-monster-spiders-free-sample';
// Same public flow as the author's Download button, observed in itch's game.js.
// No account, purchase, challenge bypass or persistent signed URL.
const response=await fetch(page,{signal:AbortSignal.timeout(45000)});
assert.ok(response.ok,'Official asset page unavailable');const html=await response.text();
assert.ok(/data-upload_id="20113780"/.test(html),'Reviewed official download button changed');
const csrf=html.match(/name="csrf_token" value="([^"]+)"/)?.[1];assert.ok(csrf,'Official download form unavailable');
const cookie=response.headers.getSetCookie().map(value=>value.split(';')[0]).join('; ');
const request=await fetch(page+'/file/20113780?source=view_game&as_props=1',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded',Cookie:cookie,Referer:page},body:new URLSearchParams({csrf_token:csrf}),signal:AbortSignal.timeout(45000)});
assert.ok(request.ok,'Official download request failed');const download=await request.json();
assert.ok(download.url&&!download.errors&&!download.lightbox,'Official download requires manual action');
const url=new URL(download.url);assert.equal(url.protocol,'https:');
assert.ok(url.hostname==='itch.zone'||url.hostname.endsWith('.itch.zone')||url.hostname==='itch.io'||url.hostname.endsWith('.itch.io')||url.hostname==='itchio-mirror.cb031a832f44726753d6267436f3b414.r2.cloudflarestorage.com','Unexpected download host');
const archive=await fetch(url,{signal:AbortSignal.timeout(180000)});assert.ok(archive.ok,'Official archive unavailable');
const chunks=[];let size=0;for await(const chunk of archive.body){size+=chunk.length;assert.ok(size<=64*1024*1024,'Unexpected archive size');chunks.push(chunk);}
const bytes=Buffer.concat(chunks);assert.equal(hash(bytes),'f4d9b914683561a0423a60425e881f1c58e55a062d85808ad4d78271017f3628','Official archive changed; inspect its contents and licence before updating pins');
const names=['LICENSE.txt','README.txt','squinty/squinty_LOD1.glb','squinty/squinty_info.json'];
const prefix='Giant-Monster-Spiders-Free-Sample/',files=unzipSync(bytes,{filter:file=>names.some(name=>file.name===prefix+name)});
await mkdir(dir,{recursive:true});
for(const name of names){const data=files[prefix+name];assert.ok(data,'Reviewed archive entry missing: '+name);await writeFile(resolve(dir,name.split('/').pop()),data);}
assert.equal(hash(await readFile(resolve(dir,'squinty_LOD1.glb'))),sourceHash);
const licence=await readFile(resolve(dir,'LICENSE.txt'),'utf8');assert.ok(licence.includes('ASSET LICENCE (version 1.0)')&&licence.includes('Easy Forge'));
function run(command,args){const result=spawnSync(command,args,{stdio:'inherit',shell:process.platform==='win32'&&command==='npm',env:{...process.env,DANTE_ARRIVAL_ART_DIR:dir}});if(result.error)throw result.error;assert.equal(result.status,0,'Asset preparation failed');}
if(!existsSync('scripts/asset-tools/node_modules/@gltf-transform/core'))run('npm',['ci','--prefix','scripts/asset-tools','--no-audit','--no-fund']);
run(process.execPath,['scripts/asset-tools/prepare-arrival188-spider.mjs']);
const meta=await check();console.log('Official Hollow prepared for incorporated game build:',meta.bytes,'bytes,',meta.triangles,'triangles. Source files remain private build inputs.');
