import type { PlayableClass } from '../config/classes';
import type { JourneyArea, JourneyFlags } from '../systems/LocalJourney';
import type { ProgressionSnapshot } from '../systems/Progression';
export const COOP_AREAS: readonly JourneyArea[] = ['forest','valley','arid','dunes','frost'];
export type PartyProfile = {name: string; classId: PlayableClass};
export type PartyInput = {x:number;y:number;aim:number;attack:boolean;dash:boolean;charge:boolean;held:boolean;release:boolean;cancel:boolean;interact:boolean;restart:boolean};
export const NO_INPUT: PartyInput={x:0,y:0,aim:0,attack:false,dash:false,charge:false,held:false,release:false,cancel:false,interact:false,restart:false};
export type PartyPose={x:number;y:number;aim:number;hp:number;maxHp:number;dead:boolean;dash:boolean;phase:string;level:number;firing:boolean;dashReady?:number;chargeReady?:number;momentum?:number;wave?:{x:number;y:number;rotation:number;width:number;height:number}};
export type CreatureLayer={texture:string;frame:string;x:number;y:number;width:number;height:number;rotation:number;flip:boolean;depth:number;originX:number;originY:number};
export type CreaturePose={id:number;species:string;x:number;y:number;hp:number;maxHp:number;radius:number;texture:string;frame:string;flip:boolean;size:number;rotation:number;
 warning:boolean;angle:number;warningX:number;warningY:number;warningWidth:number;warningHeight:number;layers?:CreatureLayer[];projectile?:{x:number;y:number;rotation:number}};
export type PartyWorld={area:JourneyArea;time:number;progression:ProgressionSnapshot;flags:JourneyFlags;host:PartyPose;partner?:PartyPose;enemies:CreaturePose[];message:string;prompt:boolean;action:string;shots:{x:number;y:number;rotation:number;friendly?:boolean}[]};
// One connection across scene restarts. The relay grants roles; only host worlds are accepted.
export class CoopSession {
 role:'offline'|'connecting'|'host'|'guest'='offline';
 code='';message='Cooperativo regional para duas pessoas.';
 peer?:PartyProfile;world?:PartyWorld;input:PartyInput={...NO_INPUT};inputAt=0;worldAt=0;
 private socket?:WebSocket;
 connect(url:string,mode:'create'|'join',profile:PartyProfile,area:JourneyArea,code=''):Promise<void>{
  if(this.role!=='offline')return Promise.reject(new Error('Encerre a sala atual primeiro.'));
  let target:URL;try{target=new URL(url);if(!['ws:','wss:'].includes(target.protocol)||target.username||target.password)throw Error();}catch{return Promise.reject(new Error('Informe um endereço ws:// ou wss:// válido.'));}
  if(location.protocol==='https:'&&target.protocol!=='wss:')return Promise.reject(new Error('Esta página segura precisa de um servidor wss://.'));
  this.role='connecting';this.changed();
  return new Promise((resolve,reject)=>{
   const ws=new WebSocket(target);this.socket=ws;let joined=false;
   const timeout=setTimeout(()=>{if(!joined){ws.close();this.role='offline';reject(new Error('O servidor de salas não respondeu.'));this.changed();}},8000);
   ws.onopen=()=>ws.send(JSON.stringify({type:mode,profile,area,code}));
   ws.onmessage=event=>{
    let m;try{m=JSON.parse(event.data);}catch{return;}
    if(m.type==='joined'&&(m.role==='host'||m.role==='guest')){joined=true;clearTimeout(timeout);this.role=m.role;this.code=m.code;this.peer=m.peer;this.message=m.role==='host'?'Compartilhe o código para convidar uma pessoa.':'Expedição do anfitrião. Seu save solo permanece guardado.';this.changed();resolve();}
    else if(m.type==='error'){clearTimeout(timeout);this.message=String(m.message);if(!joined){ws.close();this.role='offline';reject(new Error(this.message));}this.changed();}
    else if(m.type==='peer'){this.peer=m.profile;this.message='Companheiro conectado.';this.changed();}
    else if(m.type==='peer-left'){this.peer=undefined;this.input={...NO_INPUT};this.message='Companheiro saiu. A sala continua aberta.';this.changed();}
    else if(m.type==='input'&&this.role==='host'){
     // Preserve one-shot gestures if two packets arrive between rendered frames.
     for(const key of ['dash','charge','release','cancel','interact','restart'] as const)m.input[key] ||= this.input[key];
     this.input=m.input;this.inputAt=performance.now();
    }
    else if(m.type==='world'&&this.role==='guest'&&m.world&&COOP_AREAS.includes(m.world.area)&&Array.isArray(m.world.enemies)&&m.world.enemies.length<=32){this.world=m.world;this.worldAt=performance.now();}
    else if(m.type==='ended'){this.message=String(m.message);this.disconnect(true);}
   };
   ws.onerror=()=>{this.message='Não foi possível acessar o servidor de salas.';if(!joined){clearTimeout(timeout);this.role='offline';reject(new Error(this.message));this.changed();}};
   ws.onclose=()=>{clearTimeout(timeout);if(this.socket!==ws)return;const guest=this.role==='guest';this.role='offline';this.peer=undefined;this.world=undefined;this.socket=undefined;this.changed();if(!joined)reject(new Error('A conexão com a sala foi encerrada.'));if(guest)location.reload();};
  });
 }
 send(type:'input'|'world',payload:PartyInput|PartyWorld):void{
  if(this.socket?.readyState!==WebSocket.OPEN||this.socket.bufferedAmount>131072)return;
  this.socket.send(JSON.stringify(type==='input'?{type,input:payload}:{type,world:payload}));
 }
 consumeEdges():void{for(const key of ['dash','charge','release','cancel','interact','restart'] as const)this.input[key]=false;}
 disconnect(restoreGuest=true):void{
  const guest=this.role==='guest';this.role='offline';this.peer=undefined;this.world=undefined;this.input={...NO_INPUT};
  this.socket?.close();this.socket=undefined;this.changed();if(guest&&restoreGuest)location.reload();
 }
 private changed():void{window.dispatchEvent(new Event('dante-coop')); }
}
export const coopSession=new CoopSession();
