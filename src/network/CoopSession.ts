import type { PlayableClass } from '../config/classes';
import type { JourneyArea, JourneyFlags } from '../systems/LocalJourney';
import type { ProgressionSnapshot } from '../systems/Progression';
import type { HunterBeamPose } from '../visual/HunterBeam';
import { LocalJourney } from '../systems/LocalJourney';
export const COOP_AREAS: readonly JourneyArea[] = ['forest','valley','arid','dunes','frost'];
const CONNECTIONS: Partial<Record<JourneyArea, readonly JourneyArea[]>> = { valley: ['arid'], arid: ['valley', 'dunes'], dunes: ['arid'] };
export type PartyProfile = {name: string; classId: PlayableClass};
export type PartyInput = {x:number;y:number;aim:number;attack:boolean;dash:boolean;charge:boolean;held:boolean;release:boolean;cancel:boolean;interact:boolean;restart:boolean};
export const NO_INPUT: PartyInput={x:0,y:0,aim:0,attack:false,dash:false,charge:false,held:false,release:false,cancel:false,interact:false,restart:false};
export type PartyPose={x:number;y:number;aim:number;hp:number;maxHp:number;dead:boolean;dash:boolean;phase:string;level:number;firing:boolean;dashReady?:number;chargeReady?:number;momentum?:number;beam?:HunterBeamPose;wave?:{x:number;y:number;rotation:number;width:number;height:number}};
export type CreatureLayer={texture:string;frame:string;x:number;y:number;width:number;height:number;rotation:number;flip:boolean;depth:number;originX:number;originY:number};
export type CreaturePose={id:number;species:string;x:number;y:number;hp:number;maxHp:number;radius:number;texture:string;frame:string;flip:boolean;size:number;rotation:number;
 warning:boolean;angle:number;warningX:number;warningY:number;warningWidth:number;warningHeight:number;layers?:CreatureLayer[];projectile?:{x:number;y:number;rotation:number}};
export type PartyWorld={area:JourneyArea;time:number;progression:ProgressionSnapshot;flags:JourneyFlags;host:PartyPose;partner?:PartyPose;enemies:CreaturePose[];message:string;prompt:boolean;action:string;shots:{x:number;y:number;rotation:number;friendly?:boolean}[]};
// One connection across scene restarts. The relay grants roles; only host worlds are accepted.
export class CoopSession {
 role:'offline'|'connecting'|'host'|'guest'='offline';
 code='';message='Cooperativo para duas pessoas.';
 connected=false;peerConnected=false;travelling=false;epoch=0;personalXpGained=0;rewardSaved=true;
 area?:JourneyArea;private pendingTravel?:JourneyArea;
 hostPaused=false;private localMenu=false;
 peer?:PartyProfile;world?:PartyWorld;input:PartyInput={...NO_INPUT};inputAt=0;worldAt=0;
 private socket?:WebSocket;
 private url='';private token='';private sequence=0;private retryAt=0;
 private retryTimer?:ReturnType<typeof setTimeout>;
 private timeout?:ReturnType<typeof setTimeout>;
 private rewards=new LocalJourney();private receipt='';private rewardTotal=0;
 canTravel(from:JourneyArea,to:JourneyArea):boolean{return this.connected && !!CONNECTIONS[from]?.includes(to);}
 travel(from:JourneyArea,to:JourneyArea):boolean {
  if(this.role!=='host'||!this.canTravel(from,to)||this.travelling)return false;
  this.travelling=true;this.pendingTravel=to;this.input={...NO_INPUT};this.inputAt=0;
  this.socket!.send(JSON.stringify({type:'travel',area:to,epoch:this.epoch}));
  return true;
 }
 connect(url:string,mode:'create'|'join',profile:PartyProfile,area:JourneyArea,code=''):Promise<void>{
  if(this.role!=='offline')return Promise.reject(new Error('Encerre a sala atual primeiro.'));
  let target:URL;try{target=new URL(url);if(!['ws:','wss:'].includes(target.protocol)||target.username||target.password)throw Error();}catch{return Promise.reject(new Error('Informe um endereço ws:// ou wss:// válido.'));}
  if(location.protocol==='https:'&&target.protocol!=='wss:')return Promise.reject(new Error('Esta página segura precisa de um servidor wss://.'));
  if(mode==='join'&&!/^[A-F0-9]{10}$/.test(code.replace(/\s/g,'').toUpperCase()))return Promise.reject(new Error('O código da sala tem 10 letras/números. Confira com o anfitrião.'));
  this.url=target.href;this.role='connecting';this.message='Conectando à expedição…';this.personalXpGained=0;this.sequence=0;this.epoch=0;this.rewards=new LocalJourney();this.changed();
  return new Promise((resolve,reject)=>this.open({type:mode,profile,area,code},false,resolve,reject));
 }
 private open(request:object,retry:boolean,resolve:()=>void=()=>{},reject:(reason:Error)=>void=()=>{}):void {
  const ws=new WebSocket(this.url);this.socket=ws;let joined=false;
  this.timeout=setTimeout(()=>{if(this.socket===ws&&!joined){ws.close();if(!retry){this.fail('O cooperativo demorou para responder. Tente novamente em alguns segundos.');reject(new Error(this.message));}}},5000);
  ws.onopen=()=>{if(this.socket===ws)ws.send(JSON.stringify(request));};
  ws.onmessage=event=>{
   if(this.socket!==ws)return;
   let m;try{m=JSON.parse(event.data);}catch{return;}
   if(m.type==='joined'&&(m.role==='host'||m.role==='guest')){
    joined=true;clearTimeout(this.timeout);this.role=m.role;this.connected=true;this.token=m.token;this.code=m.code;this.epoch=m.epoch;
    this.peer=m.peer;this.peerConnected=m.peerConnected===true;this.input={...NO_INPUT};this.inputAt=0;this.world=undefined;
    this.area=m.area;this.travelling=false;
    if(this.role==='host'&&this.pendingTravel&&this.pendingTravel!==m.area){
     this.travelling=true;ws.send(JSON.stringify({type:'travel',area:this.pendingTravel,epoch:this.epoch}));
    }else this.pendingTravel=undefined;
    this.message=retry?'Conexão recuperada.':m.role==='host'&&!m.peer?'Sala criada. Copie o código para convidar seu amigo.':'Dupla pronta. O XP ganho fica com seu personagem.';
    this.hostPaused=m.paused===true;
    if(this.role==='host')this.setMenu(this.localMenu);
    if(this.role==='guest')this.credit(m.receipt,m.total);
    this.changed();resolve();
   }else if(m.type==='error'){
    this.message=String(m.message);
    if(!joined){clearTimeout(this.timeout);this.fail(this.message);reject(new Error(this.message));}
    else{this.travelling=false;this.changed();}
   }else if(m.type==='pause'&&this.role==='guest'){
    this.hostPaused=m.paused===true;
   }else if(m.type==='peer'){
    this.peer=m.profile;this.peerConnected=true;this.input={...NO_INPUT};this.inputAt=0;this.message='Companheiro conectado.';this.changed();
   }else if(m.type==='peer-offline'){
    this.peerConnected=false;this.input={...NO_INPUT};this.inputAt=0;this.message='Companheiro reconectando · vaga reservada por 20 segundos.';this.changed();
   }else if(m.type==='peer-left'){
    this.peer=undefined;this.peerConnected=false;this.input={...NO_INPUT};this.message='Companheiro saiu. A sala continua aberta.';this.changed();
   }else if(m.type==='travel'&&m.epoch>this.epoch&&COOP_AREAS.includes(m.area)){
    this.epoch=m.epoch;this.area=m.area;this.pendingTravel=undefined;this.world=undefined;this.input={...NO_INPUT};this.inputAt=0;this.travelling=false;
    this.message='Travessia em dupla · aguardando a nova região.';this.changed();
   }else if(m.type==='input'&&this.role==='host'&&m.epoch===this.epoch){
    for(const key of ['dash','charge','release','cancel','interact','restart'] as const)m.input[key] ||= this.input[key];
    this.input=m.input;this.inputAt=performance.now();
   }else if(m.type==='world'&&this.role==='guest'&&m.epoch===this.epoch&&m.world&&COOP_AREAS.includes(m.world.area)&&Array.isArray(m.world.enemies)&&m.world.enemies.length<=32){
    this.world=m.world;this.worldAt=performance.now();this.credit(m.receipt,m.total);
   }else if(m.type==='ended'||m.type==='replaced')this.fail(String(m.message));
  };
  ws.onerror=()=>{if(!retry&&!joined&&this.socket===ws){this.fail('O cooperativo está indisponível nesta conexão. Tente novamente em alguns segundos; sua jornada solo continua disponível.');reject(new Error(this.message));}};
  ws.onclose=()=>{
   if(this.socket!==ws)return;
   clearTimeout(this.timeout);this.socket=undefined;this.connected=false;this.input={...NO_INPUT};this.inputAt=0;
   if(!this.token){this.fail('A conexão foi encerrada.');reject(new Error(this.message));return;}
   if(!retry)this.retryAt=performance.now()+15000;
   this.message='Conexão interrompida · tentando recuperar a sala…';this.changed();this.retry();
  };
 }
 private retry():void {
  if(this.role==='offline')return;
  if(performance.now()>=this.retryAt){this.fail('A reconexão expirou. Entre novamente com o código da sala.');return;}
  this.retryTimer=setTimeout(()=>this.open({type:'resume',code:this.code,token:this.token},true),750);
 }
 private credit(receipt:string,total:number):void {
  if(typeof receipt!=='string'||!Number.isSafeInteger(total)||total<0)return;
  if(this.rewardSaved&&this.receipt===receipt&&this.rewardTotal===total)return;
  this.receipt=receipt;this.rewardTotal=total;
  this.rewardSaved=total===0||this.rewards.creditCoopXp(receipt,total);
  this.personalXpGained=total;
 }
 send(type:'input'|'world',payload:PartyInput|PartyWorld):void{
  if(!this.connected||this.travelling||this.socket?.readyState!==WebSocket.OPEN||this.socket.bufferedAmount>131072)return;
  this.socket.send(JSON.stringify(type==='input'?{type,input:payload,epoch:this.epoch}:{type,world:payload,epoch:this.epoch,sequence:++this.sequence}));
 }
 setMenu(paused:boolean):void {
  this.localMenu=paused;
  if(this.role==='host'&&this.connected)this.socket?.send(JSON.stringify({type:'pause',paused}));
 }
 consumeEdges():void{for(const key of ['dash','charge','release','cancel','interact','restart'] as const)this.input[key]=false;}
 disconnect(restoreGuest=true):void{
  const guest=this.role==='guest';
  if(guest&&this.rewardTotal>0)this.credit(this.receipt,this.rewardTotal);
  // If storage fails, keep the visit open so the player can retry instead of losing XP silently.
  if(guest&&!this.rewardSaved){this.message='Não foi possível salvar o XP. Libere o armazenamento e tente sair novamente.';this.changed();return;}
  if(this.socket?.readyState===WebSocket.OPEN)this.socket.send(JSON.stringify({type:'leave'}));
  this.role='offline';this.connected=false;this.peerConnected=false;this.peer=undefined;this.world=undefined;this.input={...NO_INPUT};this.token='';this.travelling=false;this.pendingTravel=undefined;this.area=undefined;
  clearTimeout(this.timeout);clearTimeout(this.retryTimer);
  const socket=this.socket;this.socket=undefined;socket?.close();this.changed();if(guest&&restoreGuest)location.reload();
 }
 private fail(message:string):void{this.message=message;this.disconnect();}
 private changed():void{window.dispatchEvent(new Event('dante-coop'));}
}
export const coopSession=new CoopSession();
