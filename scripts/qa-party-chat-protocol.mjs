import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {randomBytes,randomUUID} from 'node:crypto';
import WebSocket from 'ws';
import {attachCoop} from '../server/relay.mjs';
import {mkdir,writeFile} from 'node:fs/promises';
const out=process.env.QA_OUT??'docs/party-chat/qa',server=createServer(),relay=attachCoop(server);
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const url=`ws://127.0.0.1:${server.address().port}/coop`,clients=[],report={checks:[]},check=t=>{report.checks.push(t);console.log(t);},sleep=ms=>new Promise(r=>setTimeout(r,ms));
const realNow=Date.now;let offset=0;Date.now=()=>realNow()+offset;
async function client(){const ws=new WebSocket(url),inbox=[];ws.on('message',r=>inbox.push(JSON.parse(r)));await new Promise((r,j)=>{ws.once('open',r);ws.once('error',j)});const c={ws,inbox,send:m=>ws.send(JSON.stringify(m)),next:async(type)=>{for(let n=0;n<300;n++){const i=inbox.findIndex(m=>m.type===type);if(i>=0)return inbox.splice(i,1)[0];await sleep(10);}throw Error('Missing '+type);}};clients.push(c);return c;}
try{
 const id=randomUUID(),ids=Array.from({length:4},()=>randomUUID()),team=await Promise.all(ids.map(client)),campaigns=ids.map(memberId=>({id,mode:'coop',size:4,difficulty:'normal',memberId,hostId:ids[0],memberKey:randomBytes(24).toString('hex'),introSeen:true,crew:[]}));
 const profiles=['Guilherme','Lúcia','Álvaro','Érica'].map((name,i)=>({characterId:ids[i],name,classId:['warrior','hunter','astral','xenobinder'][i],sex:'female',build:{xp:0}}));
 const h=team[0];h.send({type:'create',profile:profiles[0],campaign:campaigns[0],area:'forest'});const joined=await h.next('joined');assert.equal(joined.protocol,15);assert.deepEqual(joined.chatHistory,[]);
 for(let i=1;i<4;i++){team[i].send({type:'join',profile:profiles[i],campaign:campaigns[i],code:joined.code});await team[i].next('joined');}
 const observer=await client();observer.send({type:'inspect',code:joined.code});await observer.next('lobby');observer.send({type:'chat',text:'intruso'});await sleep(50);assert.equal(h.inbox.some(m=>m.type==='chat'),false);
 team[1].send({type:'chat',text:'Olá <b>equipe</b>!',author:'host',name:'Falso',id:'fake',at:1});
 const first=(await h.next('chat')).message;assert.equal(first.author,ids[1]);assert.equal(first.name,'Lúcia');assert.equal(first.text,'Olá <b>equipe</b>!');assert.notEqual(first.id,'fake');assert.ok(first.at>1);
 for(const c of team.slice(1))assert.deepEqual((await c.next('chat')).message,first);
 check('Lobby chat: authenticated author, relay ID/time, accents and literal HTML; room inspection cannot send');
 team[1].send({type:'chat',text:'rápida demais'});assert.match((await team[1].next('chat-error')).message,/1 segundo/);await sleep(50);assert.equal(h.inbox.some(m=>m.type==='chat'),false);
 offset+=1100;team[1].send({type:'chat',text:'x'.repeat(201)});await team[1].next('chat-error');team[1].send({type:'chat',text:' \n\t '});await team[1].next('chat-error');
 team[1].send({type:'chat',text:'🌎'.repeat(200)});assert.equal(Array.from((await h.next('chat')).message.text).length,200);for(const c of team.slice(1))await c.next('chat');
 check('200 Unicode characters accepted; oversized/empty/rate-limited messages rejected without queued delivery');
 offset+=1100;for(let i=0;i<4;i++)team[i].send({type:'chat',text:'simultânea '+i});
 const messages=await Promise.all(Array.from({length:4},()=>h.next('chat')));assert.equal(new Set(messages.map(m=>m.message.id)).size,4);for(const c of team.slice(1))for(let i=0;i<4;i++)await c.next('chat');
 h.send({type:'start'});for(const c of team)c.send({type:'ready',ready:true});await sleep(80);
 h.send({type:'travel',area:'cavern',epoch:0});await h.next('travel');
 offset+=1100;h.send({type:'chat',text:'Nova região'});assert.equal((await team[2].next('chat')).message.text,'Nova região');await h.next('chat');
 check('Four simultaneous authors get unique IDs; chat survives campaign start and region travel');
 team[3].ws.close();await sleep(60);offset+=1100;h.send({type:'chat',text:'Esperando a Érica'});await h.next('chat');
 const rejoin=await client();rejoin.send({type:'join',profile:profiles[3],campaign:campaigns[3],code:joined.code});const restored=await rejoin.next('joined');assert.ok(restored.chatHistory.some(m=>m.text==='Esperando a Érica'));assert.ok(restored.chatHistory.some(m=>m.id===first.id));
 check('Chat works while original crew is missing; authenticated rejoin recovers room history');
 // Advance the test clock instead of sleeping for 100 seconds. Other members
 // pong on each step so heartbeat age remains representative of live clients.
 for(let i=0;i<105;i++){offset+=1100;for(const c of clients)if(c.ws.readyState===WebSocket.OPEN)c.ws.pong();h.send({type:'chat',text:'histórico '+i});await h.next('chat');}
 const resumed=await client();resumed.send({type:'resume',code:joined.code,token:restored.token});const last=await resumed.next('joined');assert.equal(last.chatHistory.length,100);assert.equal(new Set(last.chatHistory.map(m=>m.id)).size,100);assert.equal(last.chatHistory.at(-1).text,'histórico 104');assert.ok(!last.chatHistory.some(m=>m.id===first.id));
 check('History is capped at 100 and resume returns exactly one copy of each retained message');
 h.send({type:'leave'});await resumed.next('ended');assert.equal(relay.status().rooms,0);
 check('Ending the room discards its in-memory history');report.passed=true;
}catch(e){report.failure=String(e);throw e;}finally{Date.now=realNow;for(const c of clients)c.ws.close();relay.close();await new Promise(r=>server.close(r));await mkdir(out,{recursive:true});await writeFile(out+'/chat-protocol.json',JSON.stringify(report,null,2));}
