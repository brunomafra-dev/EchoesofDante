import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import WebSocket from 'ws';
import {attachCoop} from '../server/relay.mjs';
import {mkdir,writeFile} from 'node:fs/promises';
const server=createServer(),relay=attachCoop(server);await new Promise(r=>server.listen(0,'127.0.0.1',r));
const url=`ws://127.0.0.1:${server.address().port}/coop`,clients=[],report={checks:[]};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let pressure=0;const buffered=Object.getOwnPropertyDescriptor(WebSocket.prototype,'bufferedAmount');
Object.defineProperty(WebSocket.prototype,'bufferedAmount',{configurable:true,get(){return this._isServer&&pressure?pressure:buffered.get.call(this)}});
async function client(){const ws=new WebSocket(url),inbox=[];ws.on('message',raw=>inbox.push(JSON.parse(raw)));await new Promise((r,j)=>{ws.once('open',r);ws.once('error',j)});const c={ws,inbox,send:m=>ws.send(JSON.stringify(m)),next:async type=>{for(let i=0;i<200;i++){const index=inbox.findIndex(m=>m.type===type);if(index>=0)return inbox.splice(index,1)[0];await sleep(10);}throw Error('No '+type);}};clients.push(c);return c;}
const profile=classId=>({name:'QA '+classId,classId,potions:5,bagFree:24,build:{xp:100,bossRewards:[]}});
const check=t=>{report.checks.push(t);console.log(t)};
try{
 const h=await client(),a=await client(),b=await client(),c=await client(),extra=await client();
 h.send({type:'create',profile:profile('warrior'),area:'forest'});const host=await h.next('joined');assert.equal(host.protocol,10);assert.equal(host.id,'host');
 a.send({type:'join',profile:profile('warrior'),code:host.code});assert.match((await a.next('error')).message,/classe/);assert.equal(relay.status().rooms,1);
 const joined=[];
 for(const [client,cls]of [[a,'hunter'],[b,'astral'],[c,'xenobinder']]){client.send({type:'join',profile:profile(cls),code:host.code});joined.push(await client.next('joined'));}
 assert.equal(new Set(joined.map(m=>m.id)).size,3);
 extra.send({type:'join',profile:profile('hunter'),code:host.code});assert.match((await extra.next('error')).message,/quatro/);
 extra.send({type:'inspect',code:host.code});const lobby=await extra.next('lobby');assert.equal(lobby.members.length,4);assert.ok(lobby.members.every(m=>!m.token&&!m.receipt));check('Atomic four-seat/unique-class enforcement, stable IDs and secret-free read-only lobby');
 b.send({type:'input',epoch:0,input:{x:30,y:40,aim:45,dash:'true',charge:true}});const input=await h.next('input');assert.equal(input.id,joined[1].id);assert.equal(input.input.x,.6);assert.equal(input.input.y,.8);assert.equal(input.input.dash,false);assert.equal(input.input.charge,true);
 c.send({type:'service-request',action:'potion'});assert.equal((await h.next('service-request')).id,joined[2].id);check('Normalized input and consumable requests routed by the authenticated connection seat, not a supplied ID');
 let sequence=0;const players=Object.fromEntries(joined.map(m=>[m.id,{potionUsed:0}]));
 const world=(xp,extra={})=>h.send({type:'world',epoch:0,sequence:++sequence,world:{area:'forest',enemies:[],progression:{xp},players,...extra}});
 world(100);for(const g of [a,b,c])assert.equal((await g.next('world')).total,0);
 world(120,{resourceAwarded:[{uid:'only-astral',owner:joined[1].id,tier:2,amount:2,credits:12}],lootAwarded:[{uid:'only-hunter',id:'forest-helmet',owner:joined[0].id}],players:{...players,[joined[2].id]:{potionUsed:1}}});
 const snapshots=await Promise.all([a,b,c].map(g=>g.next('world')));
 assert.ok(snapshots.every(m=>m.total===20));assert.equal(snapshots[0].items.length,1);assert.equal(snapshots[1].items.length,0);assert.equal(snapshots[1].resources.credits,12);assert.equal(snapshots[0].resources.credits,0);assert.equal(snapshots[2].resources.used,1);
 world(120,{resourceAwarded:[{uid:'only-astral',owner:joined[1].id,tier:2,amount:2,credits:12}],lootAwarded:[{uid:'only-hunter',id:'forest-helmet',owner:joined[0].id}]});assert.equal((await b.next('world')).resources.credits,12);await a.next('world');await c.next('world');check('Shared XP gains with distinct idempotent personal equipment/material/potion receipts');
 c.ws.close();await sleep(100);extra.send({type:'join',profile:profile('xenobinder'),code:host.code});assert.match((await extra.next('error')).message,/quatro/);
 const resumed=await client();resumed.send({type:'resume',code:host.code,token:joined[2].token});const back=await resumed.next('joined');assert.equal(back.id,joined[2].id);assert.equal(back.receipt,joined[2].receipt);assert.equal(back.resources.used,1);
 const replace=await client();replace.send({type:'resume',code:host.code,token:joined[2].token});assert.equal((await replace.next('joined')).id,joined[2].id);await resumed.next('replaced');check('Reserved class/seat and cumulative rewards survive socket reconnection and old-transport replacement');
 const before=sequence; b.send({type:'world',epoch:0,sequence:before+10,world:{area:'forest',enemies:[],progression:{xp:99999},players}});b.send({type:'travel',epoch:0,area:'cavern'});await sleep(100);assert.ok(!a.inbox.some(m=>m.type==='world'||m.type==='travel'));
 pressure=200000;world(130);await sleep(100);assert.ok(!a.inbox.some(m=>m.type==='world'));
 h.send({type:'travel',epoch:0,area:'cavern'});for(const g of [h,a,b,replace])assert.equal((await g.next('travel')).epoch,1);
 pressure=0;h.send({type:'world',epoch:1,sequence:++sequence,world:{area:'cavern',enemies:[],progression:{xp:140},players}});for(const g of [a,b,replace])assert.equal((await g.next('world')).total,40);check('Congested snapshots may drop; travel/epochs remain reliable for all four and cumulative XP is recovered');
 b.send({type:'input',epoch:0,input:{x:1,y:0,aim:0}});await sleep(100);assert.ok(!h.inbox.some(m=>m.type==='input'));check('Host-only world/travel, synchronized epochs and stale input rejection');
 b.send({type:'leave'});await sleep(100);const newGuest=await client();newGuest.send({type:'join',profile:profile('astral'),code:host.code});const fresh=await newGuest.next('joined');assert.notEqual(fresh.id,joined[1].id);assert.equal(fresh.total,0);assert.equal(fresh.resources.credits,0);
 h.send({type:'leave'});for(const g of [a,replace,newGuest])await g.next('ended');assert.equal(relay.status().rooms,0);check('Explicit departure frees only its class; new occupant inherits no receipts; host end reaches all three visitors');
 report.passed=true;
}catch(e){report.failure=String(e);throw e;}finally{Object.defineProperty(WebSocket.prototype,'bufferedAmount',buffered);for(const c of clients)c.ws.close();relay.close();await new Promise(r=>server.close(r));await mkdir('docs/party-four/protocol-qa',{recursive:true});await writeFile('docs/party-four/protocol-qa/report.json',JSON.stringify(report,null,2));}
