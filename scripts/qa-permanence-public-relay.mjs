import assert from 'node:assert/strict';
import {randomBytes, randomUUID} from 'node:crypto';
import {mkdir, readFile, writeFile} from 'node:fs/promises';
import WebSocket from 'ws';

const relay='https://echoes-of-dante-rooms.onrender.com';
const out=process.env.QA_OUT??'docs/permanence/qa/public-relay-16';
const report={at:new Date().toISOString(),relay,method:'Two temporary WebSocket clients on the public relay. Synthetic catalogue snapshots test transport/filtering, not gameplay completion.',checks:[]};
const clients=[],sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function client(){
  const ws=new WebSocket(relay.replace('https:','wss:')+'/coop',{origin:'https://echosofdante.vercel.app'}),inbox=[];
  ws.on('message',raw=>inbox.push(JSON.parse(raw)));
  await new Promise((resolve,reject)=>{ws.once('open',resolve);ws.once('error',reject)});
  const c={ws,send:m=>ws.send(JSON.stringify(m)),next:async(type,predicate=()=>true)=>{
    for(let i=0;i<200;i++){const n=inbox.findIndex(m=>m.type===type&&predicate(m));if(n>=0)return inbox.splice(n,1)[0];await sleep(100)}
    throw Error('Missing public relay message: '+type);
  }};
  clients.push(c);return c;
}
try{
  report.health=await fetch(relay+'/coop/health?audit='+Date.now(),{headers:{'Cache-Control':'no-cache'},signal:AbortSignal.timeout(30000)}).then(r=>r.json());
  assert.equal(report.health.protocol,16);
  const config=await fetch('https://echosofdante.vercel.app/api/coop-config').then(r=>r.json());
  assert.equal(config.ready,true);assert.equal(config.relay,relay.replace('https:','wss:')+'/coop');
  const catalogue=JSON.parse(await readFile('src/config/permanence-catalog.json','utf8'));
  const id=randomUUID(),ids=[randomUUID(),randomUUID()],team=await Promise.all(ids.map(client));
  const profiles=ids.map((characterId,i)=>({characterId,name:'Relay QA '+i,classId:i?'hunter':'warrior',sex:'female',build:{xp:0}}));
  const campaigns=ids.map(memberId=>({id,mode:'coop',size:2,difficulty:'normal',memberId,hostId:ids[0],memberKey:randomBytes(24).toString('hex'),introSeen:true,crew:[]}));
  team[0].send({type:'create',area:'base',profile:profiles[0],campaign:campaigns[0]});
  const joined=await team[0].next('joined');assert.equal(joined.protocol,16);
  team[1].send({type:'join',code:joined.code,profile:profiles[1],campaign:campaigns[1]});assert.equal((await team[1].next('joined')).protocol,16);
  team[0].send({type:'start'});for(const c of team)c.send({type:'ready',ready:true});
  await team[0].next('roster',m=>m.campaign.running);
  report.checks.push('Vercel config, HTTP health and both actual WebSocket joins agree on protocol 16');
  team[0].send({type:'world',epoch:0,sequence:1,world:{area:'base',enemies:[],players:Object.fromEntries(ids.map(id=>[id,{potionUsed:0}])),progression:{xp:0},missions:{schema:1,accepted:[...catalogue.ids,'fake'],completed:catalogue.ids,evidence:[...catalogue.evidence,'fake']},permanence:{haul:{x:1200,y:1070,kind:'cargo'}}}});
  const world=(await team[1].next('world')).world;
  assert.deepEqual(world.missions.accepted,catalogue.ids);assert.deepEqual(world.missions.completed,catalogue.ids);assert.deepEqual(world.missions.evidence,catalogue.evidence);
  assert.deepEqual(world.permanence.haul,{x:1200,y:1070,kind:'cargo'});
  report.checks.push('All five chapter IDs, 25 evidence IDs and optional cargo pose survive the deployed relay; unknown IDs are removed');
  const nonce=randomUUID();team[1].send({type:'mission-request',mission:'settle-arrivals',action:'accept',nonce,epoch:0,id:'forged'});
  const request=await team[0].next('mission-request',m=>m.nonce===nonce);assert.equal(request.id,ids[1]);assert.equal(request.mission,'settle-arrivals');
  team[0].send({type:'mission-result',id:ids[1],nonce,epoch:0,ok:true,message:'QA transport acknowledgement'});assert.equal((await team[1].next('mission-result',m=>m.nonce===nonce)).ok,true);
  report.checks.push('Authenticated guest chapter request and host result travel through the public service');
  team[0].send({type:'leave'});await team[1].next('ended');report.passed=true;
}catch(error){report.failure=String(error);throw error}
finally{for(const c of clients)c.ws.close();await mkdir(out,{recursive:true});await writeFile(out+'/report.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2))}
