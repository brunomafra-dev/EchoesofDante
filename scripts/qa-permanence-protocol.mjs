import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {randomBytes,randomUUID} from 'node:crypto';
import WebSocket from 'ws';
import {attachCoop} from '../server/relay.mjs';
import {mkdir,writeFile} from 'node:fs/promises';
import {readFile} from 'node:fs/promises';
const out=process.env.QA_OUT??'docs/permanence/qa/protocol',server=createServer(),relay=attachCoop(server);await new Promise(r=>server.listen(0,'127.0.0.1',r));
const url=`ws://127.0.0.1:${server.address().port}/coop`,clients=[],report={checks:[]},sleep=ms=>new Promise(r=>setTimeout(r,ms));
const check=s=>{console.log(s);report.checks.push(s)};
async function client(){const ws=new WebSocket(url),inbox=[];ws.on('message',r=>inbox.push(JSON.parse(r)));await new Promise((r,j)=>{ws.once('open',r);ws.once('error',j)});const c={ws,inbox,send:m=>ws.send(JSON.stringify(m)),next:async(type,predicate=()=>true)=>{for(let n=0;n<300;n++){const i=inbox.findIndex(m=>m.type===type&&predicate(m));if(i>=0)return inbox.splice(i,1)[0];await sleep(10)}throw Error('Missing '+type)}};clients.push(c);return c;}
try{
 const id=randomUUID(),ids=Array.from({length:4},()=>randomUUID()),team=await Promise.all(ids.map(client)),campaigns=ids.map(memberId=>({id,mode:'coop',size:4,difficulty:'normal',memberId,hostId:ids[0],memberKey:randomBytes(24).toString('hex'),introSeen:true,crew:[]}));
 const profiles=ids.map((characterId,i)=>({characterId,name:['Nara QA','Lúcia','Álvaro','Érica'][i],classId:['warrior','hunter','astral','xenobinder'][i],sex:'female',build:{xp:0}}));
 const h=team[0];h.send({type:'create',profile:profiles[0],campaign:campaigns[0],area:'base'});const joined=await h.next('joined');assert.equal(joined.protocol,16);assert.equal(joined.outposts,1);
 for(let i=1;i<4;i++){team[i].send({type:'join',profile:profiles[i],campaign:campaigns[i],code:joined.code});await team[i].next('joined');}
 const nonce=randomUUID();team[1].send({type:'mission-request',action:'accept',mission:'recon',nonce,epoch:0});await sleep(50);assert.ok(!h.inbox.some(m=>m.type==='mission-request'));
 h.send({type:'start'});for(const c of team)c.send({type:'ready',ready:true});await h.next('roster',m=>m.campaign.running);
 team[1].send({type:'mission-request',id:ids[2],action:'accept',mission:'recon',nonce,epoch:0});const request=await h.next('mission-request');assert.equal(request.id,ids[1]);assert.equal(request.nonce,nonce);
 team[1].send({type:'mission-request',action:'deliver',mission:'recon',nonce:randomUUID(),epoch:0});assert.equal((await team[1].next('mission-result')).ok,false);check('Only running original team can request; relay supplies authenticated member ID and rejects floods');
 h.send({type:'mission-result',id:ids[1],nonce,epoch:0,ok:true,message:'Missão aceita'});assert.equal((await team[1].next('mission-result',m=>m.nonce===nonce)).ok,true);
 team[2].send({type:'mission-result',id:ids[1],nonce,epoch:0,ok:true,message:'forjado'});await sleep(60);assert.ok(!team[1].inbox.some(m=>m.type==='mission-result'&&m.message==='forjado'));
 const invalid=[{epoch:99,mission:'recon',action:'accept'},{epoch:0,mission:'fake',action:'accept'},{epoch:0,mission:'recon',action:'cheat'}];for(const data of invalid)team[2].send({type:'mission-request',...data,nonce:randomUUID()});await sleep(60);assert.ok(!h.inbox.some(m=>m.type==='mission-request'));check('Host-only results; invalid mission, action and stale epoch never enter host queue');
 const world=(sequence,missions)=>h.send({type:'world',epoch:0,sequence,world:{area:'base',enemies:[],players:Object.fromEntries(ids.map(id=>[id,{potionUsed:0}])),progression:{xp:0},missions}});
 world(1,{schema:1,accepted:['recon','fake','recon'],completed:[],evidence:['clearing','fake','clearing']});for(const c of team.slice(1)){const w=(await c.next('world')).world;assert.deepEqual(w.missions.accepted,['recon']);assert.deepEqual(w.missions.evidence,['clearing']);}
 world(2,{schema:1,accepted:['recon'],completed:['recon'],evidence:['clearing','roots']});for(const c of team.slice(1))assert.deepEqual((await c.next('world')).world.missions.completed,['recon']);check('Shared mission snapshot reaches all three guests, with bounded known IDs only');
 h.send({type:'world',epoch:0,sequence:3,world:{area:'base',enemies:[],players:Object.fromEntries(ids.map(id=>[id,{potionUsed:0}])),progression:{xp:350},visited:['valley'],missions:{schema:1,accepted:['recon','survival','signal','beyond','water-source','safe-route','shelter'],completed:['recon','survival','signal','beyond','water-source','safe-route','shelter'],evidence:['spring','route-west','route-east','soil','site','shelter-built']}}});
 for(const c of team.slice(1)){const w=(await c.next('world')).world;assert.equal(w.missions.completed.length,7);assert.ok(w.missions.evidence.includes('shelter-built'));}
 const regional=JSON.parse(await readFile('src/config/regional-expeditions.json','utf8')),regionalIds=regional.map(m=>m.id),regionalEvidence=regional.flatMap(m=>m.sites.map((_,i)=>`${m.id}-${i+1}`));
 world(4,{schema:1,accepted:['recon','survival','signal','beyond','water-source','safe-route','shelter',...regionalIds],completed:['recon','survival','signal','beyond','water-source','safe-route','shelter',...regionalIds],evidence:[...regionalEvidence,'after-soterrado','after-vesper','fake']});for(const c of team.slice(1)){const w=(await c.next('world')).world;assert.equal(w.missions.completed.length,19);assert.equal(w.missions.evidence.length,38);assert.ok(w.missions.evidence.includes('exp-caldera-3'));}check('Protocol 16 transmits all twelve regional reports and 36 discoveries to three guests; unknown evidence is removed');
 const permanence=JSON.parse(await readFile('src/config/permanence-catalog.json','utf8'));
 world(5,{schema:1,accepted:permanence.ids,completed:permanence.ids,evidence:[...permanence.evidence,'fake']});for(const c of team.slice(1)){const w=(await c.next('world')).world;assert.deepEqual(w.missions.completed,permanence.ids);assert.deepEqual(w.missions.evidence,permanence.evidence);}check('Six chapter IDs and all 34 evidence IDs survive the actual relay catalogue; unknown evidence removed');
 await sleep(900);const chapterNonce=randomUUID();team[1].send({type:'mission-request',action:'accept',mission:'settle-water',nonce:chapterNonce,epoch:0});assert.equal((await h.next('mission-request',m=>m.nonce===chapterNonce)).mission,'settle-water');check('Guest can request a chapter through the authenticated mission channel');
 let epoch=0;for(const area of ['valley','springs','terraces','springs','valley']){h.send({type:'travel',epoch,area});epoch++;for(const c of team)assert.equal((await c.next('travel')).area,area);}
 h.send({type:'travel',epoch,area:'terraces'});assert.match((await h.next('error')).message,/conectada/);check('All seven missions and installation evidence reach the team; both new routes are bidirectional and disconnected travel is rejected');
 team[3].send({type:'leave'});await h.next('roster',m=>!m.campaign.running);team[1].send({type:'mission-request',action:'deliver',mission:'recon',nonce:randomUUID(),epoch});await sleep(60);assert.ok(!h.inbox.some(m=>m.type==='mission-request'));check('Missing original team freezes mission requests with the campaign');
 h.send({type:'leave'});await team[1].next('ended');assert.equal(relay.status().rooms,0);report.passed=true;
}catch(e){report.failure=String(e);throw e}finally{for(const c of clients)c.ws.close();relay.close();await new Promise(r=>server.close(r));await mkdir(out,{recursive:true});await writeFile(out+'/mission-protocol.json',JSON.stringify(report,null,2));}
