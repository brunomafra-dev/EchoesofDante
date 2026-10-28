import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {randomBytes,randomUUID} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
import ts from 'typescript';
import WebSocket from 'ws';
import {attachCoop} from '../server/relay.mjs';

globalThis.WebSocket=WebSocket;
const source=await readFile('src/network/PartyLobby.ts','utf8');
const compiled=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText;
const {inspectRoom}=await import('data:text/javascript;base64,'+Buffer.from(compiled).toString('base64'));
const legacy=execFileSync('git',['show','fc0f552:server/relay.mjs'],{encoding:'utf8'}).replace("'./campaign.mjs'","'../server/campaign.mjs'");
await writeFile('.local/relay-15-qa.mjs',legacy);
const old=await import(pathToFileURL(resolve('.local/relay-15-qa.mjs')).href);
const out=process.env.QA_OUT??'docs/permanence/qa/menu-lobby',report={at:new Date().toISOString(),method:'Actual PartyLobby.ts, transpiled without changing its behavior, against real local relays 15 (fc0f552) and 16. Read-only room inspection; no gameplay or progression fixtures.',checks:[]};
try{
 for(const [protocol,attach] of [[15,old.attachCoop],[16,attachCoop]]){
  const server=createServer(),relay=attach(server);await new Promise(r=>server.listen(0,'127.0.0.1',r));
  const url=`ws://127.0.0.1:${server.address().port}/coop`,ws=new WebSocket(url);
  try{
   await new Promise((resolve,reject)=>{ws.once('open',resolve);ws.once('error',reject)});
   const joined=new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('Host join timed out')),10000);ws.on('message',raw=>{const m=JSON.parse(raw);if(m.type==='joined'){clearTimeout(timer);resolve(m)}})});
   const memberId=randomUUID();ws.send(JSON.stringify({type:'create',area:'base',profile:{characterId:memberId,name:'Lobby QA',classId:'warrior',sex:'female',build:{xp:0}},campaign:{id:randomUUID(),mode:'coop',size:2,difficulty:'normal',memberId,hostId:memberId,memberKey:randomBytes(24).toString('hex'),introSeen:true,crew:[]}}));
   const room=await joined;assert.equal(room.protocol,protocol);
   const lobby=await inspectRoom(url,room.code);assert.equal(lobby.members.length,1);assert.equal(lobby.members[0].profile.classId,'warrior');assert.equal(lobby.campaign.size,2);
   await assert.rejects(inspectRoom(url,'0000000000'),/encontrada/);
   report.checks.push(`Relay ${protocol}: real room inspection preserves occupied class/team size; missing room is rejected`);
  }finally{ws.close();relay.close();await new Promise(r=>server.close(r))}
 }
 report.passed=true;
}catch(error){report.failure=String(error);throw error}
finally{await mkdir(out,{recursive:true});await writeFile(out+'/report.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2))}
