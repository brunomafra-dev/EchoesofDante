import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {randomBytes,createHash,randomUUID} from 'node:crypto';
import WebSocket from 'ws';
import {attachCoop} from '../server/relay.mjs';
import {mkdir,writeFile} from 'node:fs/promises';
const server=createServer(),relay=attachCoop(server);await new Promise(r=>server.listen(0,'127.0.0.1',r));
const url=`ws://127.0.0.1:${server.address().port}/coop`,clients=[],report={checks:[]};
const sleep=ms=>new Promise(r=>setTimeout(r,ms)),check=t=>{console.log(t);report.checks.push(t)};
async function client(){const ws=new WebSocket(url),inbox=[];ws.on('message',raw=>inbox.push(JSON.parse(raw)));await new Promise((r,j)=>{ws.once('open',r);ws.once('error',j)});const c={ws,inbox,send:m=>ws.send(JSON.stringify(m)),next:async(type,predicate=()=>true)=>{for(let i=0;i<300;i++){const n=inbox.findIndex(m=>m.type===type&&predicate(m));if(n>=0)return inbox.splice(n,1)[0];await sleep(10);}throw Error('Missing '+type);}};clients.push(c);return c;}
function campaign(size,difficulty){const id=randomUUID(),ids=Array.from({length:size},()=>randomUUID());return ids.map(memberId=>({id,mode:'coop',size,difficulty,memberId,hostId:ids[0],memberKey:randomBytes(24).toString('hex'),introSeen:true,crew:[]}));}
const profile=(c,i)=>({characterId:c.memberId,name:'QA '+i,classId:['warrior','hunter','astral','xenobinder'][i],sex:'male',potions:5,bagFree:24,build:{xp:100,bossRewards:[]}});
try{
 for(const size of [2,3,4]){
  const cs=campaign(size,['easy','normal','hard'][size-2]),ps=cs.map(profile),team=await Promise.all(cs.map(client)),h=team[0];
  h.send({type:'create',profile:ps[0],campaign:cs[0],area:'forest'});const host=await h.next('joined');assert.equal(host.protocol,15);assert.equal(host.campaign.size,size);assert.equal(host.campaign.running,false);
  for(let i=1;i<size;i++){team[i].send({type:'join',profile:ps[i],campaign:cs[i],code:host.code});await team[i].next('joined');}
  const world=(xp,sequence)=>h.send({type:'world',epoch:0,sequence,world:{area:'forest',enemies:[],players:Object.fromEntries(cs.map(c=>[c.memberId,{potionUsed:0}])),progression:{xp}}});
  world(120,1);await sleep(80);assert.ok(!team[1].inbox.some(m=>m.type==='world'));
  h.send({type:'start'});const roster=await h.next('roster',m=>m.campaign.started);assert.equal(roster.campaign.running,false);const crew=roster.campaign.crew;assert.equal(crew.length,size);
  assert.ok(crew.every(m=>m.keyHash&&!m.memberKey));assert.ok(!JSON.stringify(roster).includes(cs[0].memberKey));
  for(const c of team)c.send({type:'ready',ready:true});await h.next('roster',m=>m.campaign.running);
  world(120,2);for(const c of team.slice(1))assert.equal((await c.next('world')).total,20);
  check(`${size} players: immutable difficulty/size, original crew sealed before world runs, hash-only roster and XP baseline`);
  const outsider=await client();outsider.send({type:'join',profile:{...ps[1],characterId:'replacement'},campaign:{...cs[1],memberId:'replacement',memberKey:randomBytes(24).toString('hex')},code:host.code});assert.match((await outsider.next('error')).message,/original/);
  const departing=team.at(-1);departing.send({type:'leave'});await h.next('roster',m=>!m.campaign.running);await sleep(40);
  team[1].inbox.splice(0);world(150,3);h.send({type:'travel',epoch:0,area:'cavern'});await sleep(100);assert.ok(!team[1].inbox.some(m=>['world','travel'].includes(m.type)));
  const missing=await client(),i=size-1;missing.send({type:'join',profile:ps[i],campaign:{...cs[i],crew},code:host.code});const joined=await missing.next('joined');assert.equal(joined.id,cs[i].memberId);
  missing.send({type:'ready',ready:true});await h.next('roster',m=>m.campaign.running);world(150,4);assert.equal((await missing.next('world')).total,50);
  check(`${size} players: departure freezes world/travel, replacement rejected, original character rejoins with cumulative receipts`);
  h.send({type:'leave'});await missing.next('ended');assert.equal(relay.status().rooms,0);
  const original=await client();original.send({type:'create',profile:ps[0],campaign:{...cs[0],crew},area:'forest'});const restarted=await original.next('joined');assert.equal(restarted.campaign.crew.length,size);assert.equal(restarted.campaign.running,false);
  outsider.send({type:'join',profile:ps[1],campaign:{...cs[1],crew,difficulty:cs[1].difficulty==='hard'?'easy':'hard'},code:restarted.code});assert.match((await outsider.next('error')).message,/original/);
  original.send({type:'leave'});await sleep(70);assert.equal(relay.status().rooms,0);
  check(`${size} players: room recreation retains the original manifest; difficulty changes and absent crew cannot resume`);
 }
 const bad=await client();bad.send({type:'create',profile:{name:'Legacy solo',classId:'warrior'},area:'forest'});assert.match((await bad.next('error')).message,/campanha/);
 const cs=campaign(2,'normal');bad.send({type:'create',profile:profile(cs[0],0),campaign:{...cs[0],introSeen:false},area:'forest'});assert.match((await bad.next('error')).message,/prólogo/);
 check('Solo/unfinished journeys cannot silently become cooperative campaigns');report.passed=true;
}catch(e){report.failure=String(e);throw e;}finally{for(const c of clients)c.ws.close();relay.close();await new Promise(r=>server.close(r));await mkdir(process.env.QA_OUT??'docs/prologue-menu/qa',{recursive:true});await writeFile((process.env.QA_OUT??'docs/prologue-menu/qa')+'/protocol-report.json',JSON.stringify(report,null,2));}
