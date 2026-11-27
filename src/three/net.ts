import {coopEndpoint} from '../network/CoopEndpoint';
import type {Look} from './character';
import type {Armour} from './outfit';
import type {BiomeId} from './biomes';

// Client of the 3D rooms (server/relay3d.mjs). The same address as the 2D rooms, on the path /coop3d. Each player
// sends who they are (profile) once and where they are (state) a few times a second; the others are drawn by this
// game with its own characters, armour and animations.
export interface Profile{name:string;cls:string;look:Look;armour:Armour;pet?:string;level:number}
export interface State{x:number;z:number;h:number;a:string;b:BiomeId;hp:number;t:number}
export interface NetEvent{k:'attack'|'skill'|'dash'|'down'|'up'|'emote';x:number;z:number;h:number}
type Msg={type:'room';code:string;id:string;members:{id:string;profile:Profile}[]}|{type:'joined'|'profile';id:string;profile:Profile}|{type:'left';id:string}
 |{type:'state';id:string;s:State}|{type:'event';id:string;e:NetEvent}|{type:'error';message:string};
export interface NetHandlers{room(code:string,members:{id:string;profile:Profile}[]):void;joined(id:string,p:Profile):void;profile(id:string,p:Profile):void;left(id:string):void;state(id:string,s:State):void;event(id:string,e:NetEvent):void;error(text:string):void;closed():void;slow?():void}

async function roomsUrl(){
 const q=new URLSearchParams(location.search).get('relay');
 const base=q??await coopEndpoint();
 const u=new URL(base,location.href);if(u.protocol==='http:')u.protocol='ws:';if(u.protocol==='https:')u.protocol='wss:';
 u.pathname=u.pathname.replace(/\/?(coop)?\/?$/,'')+'/coop3d';return u.href;
}
export class Net{
 ws:WebSocket|null=null;code='';id='';private lastSend=0;
 constructor(private h:NetHandlers){}
 get on(){return this.ws?.readyState===WebSocket.OPEN&&!!this.code;}
 async connect(kind:'host'|'join',profile:Profile,code=''){
  this.close();
  let url:string;try{url=await roomsUrl();}catch(e){console.warn('coop3d endpoint',e);this.h.error('O serviço de salas não respondeu. Tente de novo em instantes.');return;}
  const ws=new WebSocket(url);this.ws=ws;
  // the free room service sleeps when idle and takes up to a minute to wake
  const slow=setTimeout(()=>{if(ws.readyState===WebSocket.CONNECTING)this.h.slow?.();},4000);
  const timer=setTimeout(()=>{if(ws.readyState!==WebSocket.OPEN){ws.close();this.h.error('Não foi possível conectar ao servidor de salas do 3D.');}},75000);
  ws.onopen=()=>{clearTimeout(timer);clearTimeout(slow);ws.send(JSON.stringify(kind==='host'?{type:'host',profile}:{type:'join',code,profile}));};
  ws.onmessage=e=>{let m:Msg;try{m=JSON.parse(String(e.data));}catch{return;}
   if(m.type==='room'){this.code=m.code;this.id=m.id;this.h.room(m.code,m.members.filter(x=>x.id!==m.id));}
   else if(m.type==='joined')this.h.joined(m.id,m.profile);else if(m.type==='profile')this.h.profile(m.id,m.profile);
   else if(m.type==='left')this.h.left(m.id);else if(m.type==='state')this.h.state(m.id,m.s);
   else if(m.type==='event')this.h.event(m.id,m.e);else if(m.type==='error')this.h.error(m.message);};
  ws.onclose=()=>{clearTimeout(timer);clearTimeout(slow);if(this.ws===ws){const was=!!this.code;this.ws=null;this.code='';if(was)this.h.closed();}};
 }
 /** about ten times a second is enough: the other screens smooth the movement between two moments */
 state(s:Omit<State,'t'>,now:number){if(!this.on||now-this.lastSend<.1)return;this.lastSend=now;this.ws!.send(JSON.stringify({type:'state',s:{...s,t:Date.now()}}));}
 profile(p:Profile){if(this.on)this.ws!.send(JSON.stringify({type:'profile',profile:p}));}
 event(e:NetEvent){if(this.on)this.ws!.send(JSON.stringify({type:'event',e}));}
 close(){const ws=this.ws;this.ws=null;this.code='';if(ws){try{ws.send(JSON.stringify({type:'leave'}));}catch{/* closing */}ws.close();}}
}
