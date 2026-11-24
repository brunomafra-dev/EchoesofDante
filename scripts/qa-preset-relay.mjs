import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {WebSocket} from 'ws';
import {attachCoop} from '../server/relay.mjs';
import {mkdir,writeFile} from 'node:fs/promises';
const revision=process.env.QA_REVISION??'202',out='docs/2d-refinement/qa/'+revision+'/relay';await mkdir(out,{recursive:true});
const server=createServer(),relay=attachCoop(server),sockets=[];
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const url=`ws://127.0.0.1:${server.address().port}/coop`,report={passed:false,checks:[],fixture:'Actual local WebSocket relay with disposable campaigns. No browser saves or public rooms.'};
async function socket(){const ws=new WebSocket(url,{handshakeTimeout:8000});sockets.push(ws);await new Promise((r,j)=>{ws.once('open',r);ws.once('error',j);});return ws;}
function request(ws,data){return new Promise((resolve,reject)=>{const timeout=setTimeout(()=>{ws.off('message',receive);reject(Error('Relay reply timeout'));},5000);function receive(raw){const m=JSON.parse(String(raw));if(!['joined','error'].includes(m.type))return;clearTimeout(timeout);ws.off('message',receive);resolve(m);}ws.on('message',receive);ws.send(JSON.stringify(data));});}
function campaign(id,memberId='host-person'){return{mode:'coop',id,hostId:'host-person',memberId,memberKey:(memberId==='host-person'?'ab':'cd').repeat(24),introSeen:true,difficulty:'normal',size:2,crew:[]};}
const profile=(classId,visualPreset,characterId='host-person')=>({classId,visualPreset,characterId,name:'QA',sex:'female'});
try{
 assert.equal(relay.status().erudites,1);
 const oldHost=await socket(),old=await request(oldHost,{type:'create',area:'base',profile:profile('hunter'),campaign:campaign('legacy-campaign')});assert.equal(old.type,'joined');assert.equal(old.erudites,1);assert.equal(old.members[0].profile.visualPreset,'hunter');
 const guest=await socket();let result=await request(guest,{type:'join',code:old.code,area:'base',identities:1,profile:profile('warrior','hunter','guest-person'),campaign:campaign('legacy-campaign','guest-person')});assert.equal(result.type,'error');assert.match(result.message,/atualizar/);
 report.checks.push('Legacy original client remains compatible; the relay advertises the additive erudites capability while an old cross-family guest remains blocked from an unupdated host.');
 const host=await socket(),joined=await request(host,{type:'create',area:'base',identities:1,profile:profile('warrior','hunter'),campaign:campaign('cross-campaign')});assert.equal(joined.type,'joined');assert.equal(joined.identities,1);assert.equal(joined.protocol,16);assert.equal(joined.members[0].profile.visualPreset,'hunter');assert.equal(joined.members[0].profile.classId,'warrior');
 result=await request(guest,{type:'join',code:joined.code,area:'base',profile:profile('hunter',undefined,'guest-person'),campaign:campaign('cross-campaign','guest-person')});assert.equal(result.type,'error');assert.match(result.message,/atualizar/);
 result=await request(guest,{type:'join',code:joined.code,area:'base',identities:1,profile:profile('warrior','astral','guest-person'),campaign:campaign('cross-campaign','guest-person')});assert.equal(result.type,'error');assert.match(result.message,/inválido/);
 report.checks.push('Old clients and unauthored visual/profession combinations are rejected before entering a cross-family room.');
 const resumed=await socket();result=await request(resumed,{type:'resume',code:joined.code,token:joined.token});assert.equal(result.type,'error');
 result=await request(resumed,{type:'resume',code:joined.code,token:joined.token,identities:1});assert.equal(result.type,'joined');assert.equal(result.members[0].profile.visualPreset,'hunter');
 result=await request(guest,{type:'join',code:joined.code,area:'base',identities:1,profile:profile('hunter','hunter','guest-person'),campaign:campaign('cross-campaign','guest-person')});assert.equal(result.type,'joined');assert.deepEqual(result.members.map(m=>m.profile.classId),['warrior','hunter']);assert.ok(result.members.every(m=>m.profile.visualPreset==='hunter'));
 report.checks.push('Secret-token resume retains body/profession; two updated clients may share a visual while preserving unique professions and original campaign credentials.');
 if(['203','204'].includes(revision))for(const cls of ['astral','xenobinder']){
  const nativeHost=await socket(),id='scout-'+cls,created=await request(nativeHost,{type:'create',area:'base',identities:1,scouts:1,profile:profile(cls,'hunter'),campaign:campaign(id)});
  assert.equal(created.type,'joined');assert.equal(created.scouts,1);assert.equal(created.members[0].profile.classId,cls);assert.equal(created.members[0].profile.visualPreset,'hunter');
  const other=await socket();result=await request(other,{type:'join',code:created.code,area:'base',identities:1,profile:profile('hunter','hunter','guest-person'),campaign:campaign(id,'guest-person')});assert.equal(result.type,'error');assert.match(result.message,/atualizar/);
  const retry=await socket();result=await request(retry,{type:'resume',code:created.code,token:created.token,identities:1});assert.equal(result.type,'error');assert.match(result.message,/Atualize/);
  result=await request(retry,{type:'resume',code:created.code,token:created.token,identities:1,scouts:1});assert.equal(result.type,'joined');assert.equal(result.members[0].profile.visualPreset,'hunter');
  result=await request(other,{type:'join',code:created.code,area:'base',identities:1,scouts:1,profile:profile('hunter','hunter','guest-person'),campaign:campaign(id,'guest-person')});assert.equal(result.type,'joined');assert.equal(result.members[1].profile.classId,'hunter');
  const back=await socket();result=await request(back,{type:'join',code:joined.code,area:'base',identities:1,scouts:1,profile:profile(cls,'hunter','third-person'),campaign:campaign('cross-campaign','third-person')});assert.equal(result.type,'error');assert.match(result.message,/atualizar/);
 }
 if(['203','204'].includes(revision))report.checks.push('Both new scout professions require scouts:1 in create/join/resume; old 202 clients are blocked in both directions, while updated peers and secret-token reconnection preserve the identities.');
 if(revision==='204'){
  const legacyHost=await socket(),blocked=await request(legacyHost,{type:'create',area:'base',identities:1,profile:profile('astral','warrior'),campaign:campaign('pioneer-gate')});assert.equal(blocked.type,'error');assert.match(blocked.message,/Pioneiro/);
  const host=await socket(),created=await request(host,{type:'create',area:'base',identities:1,pioneers:1,profile:profile('astral','warrior'),campaign:campaign('pioneer-gate')});assert.equal(created.type,'joined');assert.equal(created.pioneers,1);assert.equal(created.members[0].profile.visualPreset,'warrior');
  const legacyGuest=await socket();result=await request(legacyGuest,{type:'join',code:created.code,area:'base',identities:1,scouts:1,profile:profile('hunter','hunter','guest-person'),campaign:campaign('pioneer-gate','guest-person')});assert.equal(result.type,'error');assert.match(result.message,/Pioneiro/);
  const returned=await socket();result=await request(returned,{type:'resume',code:created.code,token:created.token,identities:1,scouts:1});assert.equal(result.type,'error');assert.match(result.message,/Pioneiro/);
  result=await request(returned,{type:'resume',code:created.code,token:created.token,identities:1,scouts:1,pioneers:1});assert.equal(result.type,'joined');assert.equal(result.pioneers,1);
  result=await request(legacyGuest,{type:'join',code:created.code,area:'base',identities:1,scouts:1,pioneers:1,profile:profile('hunter','hunter','guest-person'),campaign:campaign('pioneer-gate','guest-person')});assert.equal(result.type,'joined');assert.equal(result.members.length,2);assert.deepEqual(result.members.map(m=>m.profile.classId),['astral','hunter']);
  report.checks.push('Pioneiro cross-profession rooms require pioneers:1 when creating, joining and resuming. A legacy peer is blocked without changing campaign identity; updated peers reconnect and join successfully.');
 }
 report.passed=true;
}finally{for(const ws of sockets)ws.terminate();relay.close();await new Promise(resolve=>server.close(resolve));await writeFile(out+'/report.json',JSON.stringify(report,null,2)+'\n');console.log(revision+' relay',report.passed);}
