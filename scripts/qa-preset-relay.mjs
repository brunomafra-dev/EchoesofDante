import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {WebSocket} from 'ws';
import {attachCoop} from '../server/relay.mjs';
import {mkdir,writeFile} from 'node:fs/promises';
const out='docs/2d-refinement/qa/202/relay';await mkdir(out,{recursive:true});
const server=createServer(),relay=attachCoop(server),sockets=[];
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const url=`ws://127.0.0.1:${server.address().port}/coop`,report={passed:false,checks:[],fixture:'Actual local WebSocket relay with disposable campaigns. No browser saves or public rooms.'};
async function socket(){const ws=new WebSocket(url,{handshakeTimeout:8000});sockets.push(ws);await new Promise((r,j)=>{ws.once('open',r);ws.once('error',j);});return ws;}
function request(ws,data){return new Promise((resolve,reject)=>{const timeout=setTimeout(()=>{ws.off('message',receive);reject(Error('Relay reply timeout'));},5000);function receive(raw){const m=JSON.parse(String(raw));if(!['joined','error'].includes(m.type))return;clearTimeout(timeout);ws.off('message',receive);resolve(m);}ws.on('message',receive);ws.send(JSON.stringify(data));});}
function campaign(id,memberId='host-person'){return{mode:'coop',id,hostId:'host-person',memberId,memberKey:(memberId==='host-person'?'ab':'cd').repeat(24),introSeen:true,difficulty:'normal',size:2,crew:[]};}
const profile=(classId,visualPreset,characterId='host-person')=>({classId,visualPreset,characterId,name:'QA',sex:'female'});
try{
 const oldHost=await socket(),old=await request(oldHost,{type:'create',area:'base',profile:profile('hunter'),campaign:campaign('legacy-campaign')});assert.equal(old.type,'joined');assert.equal(old.members[0].profile.visualPreset,'hunter');
 const guest=await socket();let result=await request(guest,{type:'join',code:old.code,area:'base',identities:1,profile:profile('warrior','hunter','guest-person'),campaign:campaign('legacy-campaign','guest-person')});assert.equal(result.type,'error');assert.match(result.message,/atualizar/);
 report.checks.push('Legacy original client remains compatible; a new cross-family guest cannot enter an unupdated host.');
 const host=await socket(),joined=await request(host,{type:'create',area:'base',identities:1,profile:profile('warrior','hunter'),campaign:campaign('cross-campaign')});assert.equal(joined.type,'joined');assert.equal(joined.identities,1);assert.equal(joined.protocol,16);assert.equal(joined.members[0].profile.visualPreset,'hunter');assert.equal(joined.members[0].profile.classId,'warrior');
 result=await request(guest,{type:'join',code:joined.code,area:'base',profile:profile('hunter',undefined,'guest-person'),campaign:campaign('cross-campaign','guest-person')});assert.equal(result.type,'error');assert.match(result.message,/atualizar/);
 result=await request(guest,{type:'join',code:joined.code,area:'base',identities:1,profile:profile('astral','hunter','guest-person'),campaign:campaign('cross-campaign','guest-person')});assert.equal(result.type,'error');assert.match(result.message,/inválido/);
 report.checks.push('Old clients and unauthored visual/profession combinations are rejected before entering a cross-family room.');
 const resumed=await socket();result=await request(resumed,{type:'resume',code:joined.code,token:joined.token});assert.equal(result.type,'error');
 result=await request(resumed,{type:'resume',code:joined.code,token:joined.token,identities:1});assert.equal(result.type,'joined');assert.equal(result.members[0].profile.visualPreset,'hunter');
 result=await request(guest,{type:'join',code:joined.code,area:'base',identities:1,profile:profile('hunter','hunter','guest-person'),campaign:campaign('cross-campaign','guest-person')});assert.equal(result.type,'joined');assert.deepEqual(result.members.map(m=>m.profile.classId),['warrior','hunter']);assert.ok(result.members.every(m=>m.profile.visualPreset==='hunter'));
 report.checks.push('Secret-token resume retains body/profession; two updated clients may share a visual while preserving unique professions and original campaign credentials.');report.passed=true;
}finally{for(const ws of sockets)ws.terminate();relay.close();await new Promise(resolve=>server.close(resolve));await writeFile(out+'/report.json',JSON.stringify(report,null,2)+'\n');console.log('202 relay',report.passed);}
