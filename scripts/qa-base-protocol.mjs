import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import WebSocket from 'ws';
const url=process.argv[2]??'ws://localhost:5184/coop',out=process.argv[3]??'docs/base-economy/qa/base-protocol.json',clients=[];
async function client(){const ws=new WebSocket(url,{origin:'https://echosofdante.vercel.app'}),inbox=[];ws.on('message',v=>inbox.push(JSON.parse(v.toString())));await new Promise((r,j)=>{ws.once('open',r);ws.once('error',j)});clients.push(ws);return{send:m=>ws.send(JSON.stringify(m)),next:async type=>{const end=Date.now()+5000;while(Date.now()<end){const i=inbox.findIndex(m=>m.type===type);if(i>=0)return inbox.splice(i,1)[0];await new Promise(r=>setTimeout(r,15))}throw Error('Missing '+type)}}}
try{
 const h=await client(),g=await client();h.send({type:'create',profile:{name:'Base QA',classId:'warrior',potions:3},area:'base'});const joined=await h.next('joined');assert.equal(joined.protocol,4);g.send({type:'join',profile:{name:'Guest QA',classId:'hunter',potions:3},code:joined.code});await g.next('joined');await h.next('peer');
 h.send({type:'travel',epoch:0,area:'frost'});await h.next('error');h.send({type:'travel',epoch:0,area:'forest'});assert.equal((await g.next('travel')).area,'forest');await h.next('travel');
 const world={area:'forest',enemies:[],progression:{xp:0},boss:{active:true},resourceAwarded:[{uid:'qa-resource',tier:1,credits:4,amount:1}],potionUsed:1};
 h.send({type:'world',epoch:1,sequence:1,world});const first=await g.next('world');assert.deepEqual(first.resources,{credits:4,materials:[1,0,0],used:1});h.send({type:'travel',epoch:1,area:'base'});await h.next('error');
 h.send({type:'world',epoch:1,sequence:2,world:{...world,boss:{active:false}}});assert.deepEqual((await g.next('world')).resources,first.resources);h.send({type:'travel',epoch:1,area:'base'});assert.equal((await g.next('travel')).area,'base');await h.next('travel');
 const report={passed:true,url,checks:['Protocol 4; base creation and discovered-only travel','Boss-active return rejected by relay; inactive return accepted','Repeated awards and potion counters do not duplicate personal receipts']};await writeFile(out,JSON.stringify(report,null,2));console.log(report);h.send({type:'leave'});
}finally{clients.forEach(ws=>ws.close())}
