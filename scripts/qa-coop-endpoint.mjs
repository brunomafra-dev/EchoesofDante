import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {mkdir,writeFile} from 'node:fs/promises';
const out=process.env.QA_OUT??'docs/first-settlement/qa/endpoint';await mkdir(out,{recursive:true});
const built=await build({entryPoints:['src/network/CoopEndpoint.ts'],bundle:true,write:false,format:'esm',platform:'node',define:{'import.meta.env.VITE_COOP_URL':'undefined','import.meta.env.BASE_URL':'"/"'}});
let serial=0;const client=async()=>import('data:text/javascript;base64,'+Buffer.from(built.outputFiles[0].text+'\n// context '+serial++).toString('base64'));
globalThis.location={href:'https://dante.test/campaign-playtest.html?missions=1&settlement=1',protocol:'https:'};
class Storage{data=new Map();blocked=false;getItem(k){if(this.blocked)throw Error('Blocked');return this.data.get(k)??null}setItem(k,v){if(this.blocked)throw Error('Blocked');this.data.set(k,v)}}
globalThis.sessionStorage=new Storage();
const response=relay=>({ok:true,json:async()=>({ready:true,relay})}),report={checks:[]},check=s=>{console.log(s);report.checks.push(s)};
try{
 let count=0,finish;globalThis.fetch=async(url,options)=>{count++;assert.equal(String(url),'https://dante.test/api/coop-config');assert.equal(options.cache,'no-store');return new Promise(r=>finish=r)};
 const a=await client(),one=a.coopEndpoint(),two=a.coopEndpoint();assert.equal(one,two);assert.equal(count,1);finish(response('wss://rooms.test/coop'));
 assert.deepEqual(await Promise.all([one,two]),['wss://rooms.test/coop','wss://rooms.test/coop']);globalThis.fetch=async()=>{throw Error('Must not refetch after character loading')};assert.equal(await a.coopEndpoint(),'wss://rooms.test/coop');check('Concurrent inspection/join share one lookup; later join reuses the validated address without another network dependency');
 const reloaded=await client();assert.equal(await reloaded.coopEndpoint(),'wss://rooms.test/coop');check('A new document/module after character creation reuses the validated tab cache without refetching');
 const key='echoes-of-dante.coop-endpoint.v1',cached=JSON.parse(sessionStorage.getItem(key));cached.expiresAt=Date.now()-1;sessionStorage.setItem(key,JSON.stringify(cached));count=0;globalThis.fetch=async()=>{count++;return response('wss://new.test/coop')};const expired=await client();assert.equal(await expired.coopEndpoint(),'wss://new.test/coop');assert.equal(count,1);check('Expired tab configuration triggers a fresh lookup');
 sessionStorage.data.clear();const b=await client();globalThis.fetch=async()=>{throw new DOMException('Timed out','AbortError')};await assert.rejects(b.coopEndpoint(),/Tente novamente/);globalThis.fetch=async()=>response('/coop');assert.equal(await b.coopEndpoint(),'wss://dante.test/coop');check('Failure is not cached; explicit retry recovers and integrated HTTPS resolves to WSS');
 sessionStorage.data.clear();const c=await client();globalThis.fetch=async()=>response('wss://user:password@rooms.test/coop');await assert.rejects(c.coopEndpoint(),/Tente novamente/);globalThis.fetch=async()=>response('https://rooms.test/coop');await assert.rejects(c.coopEndpoint());globalThis.fetch=async()=>({ok:false});await assert.rejects(c.coopEndpoint());globalThis.fetch=async()=>response('wss://rooms.test/coop');assert.equal(await c.coopEndpoint(),'wss://rooms.test/coop');check('Credentials, invalid protocols and HTTP failures never become a cached endpoint; valid retry still works');
 sessionStorage.setItem(key,JSON.stringify({source:'https://dante.test/api/coop-config',relay:'wss://user:password@rooms.test',expiresAt:Date.now()+10000}));const invalid=await client();globalThis.fetch=async()=>response('wss://valid.test/coop');assert.equal(await invalid.coopEndpoint(),'wss://valid.test/coop');sessionStorage.blocked=true;const blocked=await client();assert.equal(await blocked.coopEndpoint(),'wss://valid.test/coop');check('Invalid cached credentials and blocked tab storage fall back to a validated server response');
 report.passed=true;
}catch(e){report.failure=String(e);throw e}finally{await writeFile(out+'/report.json',JSON.stringify(report,null,2))}
