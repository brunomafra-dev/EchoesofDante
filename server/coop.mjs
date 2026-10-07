import { createServer } from 'node:http';
import { randomBytes } from 'node:crypto';
import { WebSocketServer, WebSocket } from 'ws';
const areas = new Set(['forest','valley','arid','dunes','frost']);
const rooms = new Map(), clients = new Set();
const origins = (process.env.COOP_ORIGINS ?? '').split(',').filter(Boolean);
const server = createServer((req,res)=>{res.setHeader('Content-Type','application/json');res.end(JSON.stringify({service:'Dante regional co-op',rooms:rooms.size,players:clients.size}));});
const wss = new WebSocketServer({server,maxPayload:65536,perMessageDeflate:false,verifyClient:({origin},done)=>done(!origins.length||origins.includes(origin))});
const send=(ws,message)=>{if(ws?.readyState===WebSocket.OPEN&&ws.bufferedAmount<131072)ws.send(JSON.stringify(message));};
const profile=p=>p&&(p.classId==='warrior'||p.classId==='hunter')&&typeof p.name==='string'&&p.name.trim().length>0
 ?{name:p.name.trim().slice(0,24),classId:p.classId}:null;
function leave(ws){
 const room=rooms.get(ws.room);ws.room=undefined;
 if(!room)return;
 if(room.host===ws){rooms.delete(room.code);send(room.guest,{type:'ended',message:'O anfitrião encerrou a expedição.'});if(room.guest)room.guest.room=undefined;}
 else if(room.guest===ws){room.guest=undefined;send(room.host,{type:'peer-left'});}
}
wss.on('connection',ws=>{
 if(clients.size>=128){ws.close(1013,'Servidor ocupado');return;}clients.add(ws);ws.alive=true;ws.count=0;ws.window=Date.now();
 ws.on('pong',()=>ws.alive=true);ws.on('error',()=>{});ws.on('close',()=>{leave(ws);clients.delete(ws);});
 ws.on('message',(raw,binary)=>{
  if(binary)return ws.close(1003,'Somente JSON');
  if(Date.now()-ws.window>=1000){ws.window=Date.now();ws.count=0;}if(++ws.count>60)return ws.close(1008,'Limite de mensagens');
  let m;try{m=JSON.parse(raw.toString());}catch{return send(ws,{type:'error',message:'Mensagem inválida.'});}
  if(!m||typeof m.type!=='string')return;
  if(m.type==='create'||m.type==='join'){
   if(ws.room)return send(ws,{type:'error',message:'Você já está em uma sala.'});
   const p=profile(m.profile);if(!p)return send(ws,{type:'error',message:'Personagem inválido.'});
   if(m.type==='create'){
    if(!areas.has(m.area))return send(ws,{type:'error',message:'Chefes e cavernas de campanha permanecem solo nesta etapa.'});
    if(rooms.size>=64)return send(ws,{type:'error',message:'Servidor ocupado.'});
    const code=randomBytes(5).toString('hex').toUpperCase();const room={code,host:ws,hostProfile:p,guest:undefined,area:m.area};rooms.set(code,room);ws.room=code;
    send(ws,{type:'joined',role:'host',code,area:room.area});
   }else{
    const room=rooms.get(String(m.code).toUpperCase());if(!room)return send(ws,{type:'error',message:'Sala não encontrada.'});
    if(room.guest)return send(ws,{type:'error',message:'Esta sala já tem duas pessoas.'});
    room.guest=ws;ws.room=room.code;send(ws,{type:'joined',role:'guest',code:room.code,area:room.area,peer:room.hostProfile});send(room.host,{type:'peer',profile:p});
   }return;
  }
  const room=rooms.get(ws.room);if(!room)return;
  if(m.type==='input'&&ws===room.guest){
   const i=m.input;if(!i||!Number.isFinite(i.x)||!Number.isFinite(i.y)||!Number.isFinite(i.aim))return;
   const scale=Math.max(1,Math.hypot(i.x,i.y));const input={x:i.x/scale,y:i.y/scale,aim:Math.atan2(Math.sin(i.aim),Math.cos(i.aim))};
   for(const k of ['attack','dash','charge','held','release','cancel','interact','restart'])input[k]=i[k]===true;
   send(room.host,{type:'input',input});
  }else if(m.type==='world'&&ws===room.host){
   if(m.world?.area!==room.area||!Array.isArray(m.world.enemies)||m.world.enemies.length>32)return;
   send(room.guest,{type:'world',world:m.world});
  }else if(m.type==='leave')leave(ws);
 });
});
const heartbeat=setInterval(()=>{for(const ws of clients){if(!ws.alive){ws.terminate();continue;}ws.alive=false;ws.ping();}},30000);heartbeat.unref();
server.listen(Number(process.env.COOP_PORT??5190),'0.0.0.0',()=>console.log('Dante regional co-op relay on port '+(process.env.COOP_PORT??5190)));
const stop=()=>{clearInterval(heartbeat);for(const ws of clients)ws.close();wss.close();server.close();};process.on('SIGINT',stop);process.on('SIGTERM',stop);
