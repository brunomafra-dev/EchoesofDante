import WebSocket from 'ws';
import {randomUUID,randomBytes} from 'node:crypto';
import {mkdir,writeFile} from 'node:fs/promises';
const url='wss://echoes-of-dante-rooms.onrender.com/coop',out='docs/outpost/qa/public-relay';await mkdir(out,{recursive:true});
const result={at:new Date().toISOString(),url,method:'Temporary original-campaign room handshake; no characters/saves from real users and no victory or mission snapshot. Joined credentials never recorded.',connected:false,compatible:false};
const id=randomUUID(),hero=randomUUID();
await new Promise(resolve=>{
 const ws=new WebSocket(url,{origin:'https://echosofdante.vercel.app',handshakeTimeout:20000});let done=false;
 const finish=()=>{if(done)return;done=true;clearTimeout(timer);if(ws.readyState===WebSocket.OPEN){ws.send(JSON.stringify({type:'leave'}));ws.close()}else ws.terminate();resolve()};
 const timer=setTimeout(()=>{result.error='Room handshake timed out after 20 seconds';finish()},20000);
 ws.on('open',()=>ws.send(JSON.stringify({type:'create',area:'base',profile:{characterId:hero,name:'Posto QA',classId:'warrior',sex:'male',build:{xp:0}},campaign:{id,mode:'coop',size:2,difficulty:'normal',memberId:hero,hostId:hero,memberKey:randomBytes(24).toString('hex'),introSeen:true,crew:[]}})));
 ws.on('message',data=>{let m;try{m=JSON.parse(data)}catch{return}if(m.type==='joined'){result.connected=true;result.protocol=m.protocol;result.outposts=m.outposts??null;result.compatible=m.protocol===16&&m.outposts===1;finish()}else if(m.type==='error'){result.error=String(m.message);finish()}});
 ws.on('error',e=>{if(!done){result.error=e.message;finish()}});ws.on('close',()=>{if(!done){result.error='Connection closed before room handshake';finish()}});
});
await writeFile(out+'/report.json',JSON.stringify(result,null,2)+'\n');console.log(result);
