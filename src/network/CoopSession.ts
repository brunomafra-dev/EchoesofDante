import type { SaberPose } from '../combat/Attack';
import type { PlayableClass } from '../config/classes';
import type { JourneyArea, JourneyFlags } from '../systems/LocalJourney';
import type { ProgressionSnapshot } from '../systems/Progression';
import type { HunterBeamPose } from '../visual/HunterBeam';
import { LocalJourney } from '../systems/LocalJourney';
import type { BossPose } from './BossPresentation';
import { validEquipment, validItem, type InventoryItem, type EquipmentSnapshot } from '../config/equipment';
import type {ResourceDrop} from '../systems/ResourceDrops';
import type { LootPose } from '../systems/EquipmentDrops';
import type { ExpeditionReturn } from '../systems/ExpeditionReturn';
import { characterProfiles } from '../systems/CharacterProfiles';
import type { CampaignLobby } from '../systems/Campaign';
import {validChat,CHAT_HISTORY,CHAT_DURATION,CHAT_LIMIT,type ChatMessage} from './PartyChat';
import {MISSION_IDS,type MissionId} from '../config/missions';
import type {MissionAction,MissionSnapshot} from '../systems/Missions';
import {isPermanence} from '../config/permanence';
export type MissionRequest={id:string;nonce:string;action:MissionAction;mission:MissionId};
export type RoomCampaign = CampaignLobby & { started: boolean; running: boolean };
export const COOP_AREAS: readonly JourneyArea[] = ['base','forest','cavern','warden','valley','arid','dunes','sandpit','frost','icecave','icenest','cinder','obsidian','caldera','springs','terraces'];
const CONNECTIONS: Partial<Record<JourneyArea, readonly JourneyArea[]>> = { forest: ['cavern'], cavern: ['forest','warden'], warden: ['cavern','valley'], valley: ['warden','arid','springs'], springs:['valley','terraces'],terraces:['springs'], arid: ['valley','dunes'], dunes: ['arid','sandpit'], sandpit: ['dunes','frost'], frost: ['sandpit','icecave'], icecave: ['frost','icenest'], icenest: ['icecave','cinder'], cinder:['icenest','obsidian'], obsidian:['cinder','caldera'], caldera: ['obsidian'] };
export type PartyProfile = {characterId?:string;name: string; classId: PlayableClass;sex?:import('../config/appearance').CharacterSex;bagFree?:number;potions?:number;equipment?:EquipmentSnapshot['slots'];build?:Pick<ProgressionSnapshot,'xp'|'abilityUpgrades'|'bossRewards'>};
export type PartyMember={id:string;profile:PartyProfile;connected:boolean};
export type MemberState={input:PartyInput;attackTap:boolean;inputAt:number;deathId:string;potionUsed:number;potionReady:number;travelHp?:number};
export type PartyInput = {x:number;y:number;aim:number;attack:boolean;dash:boolean;charge:boolean;held:boolean;release:boolean;cancel:boolean;interact:boolean;restart:boolean;element?:boolean};
export const NO_INPUT: PartyInput={x:0,y:0,aim:0,attack:false,dash:false,charge:false,held:false,release:false,cancel:false,interact:false,restart:false};
export type PartyPose={x:number;y:number;aim:number;hp:number;maxHp:number;dead:boolean;dash:boolean;phase:string;level:number;firing:boolean;dashReady?:number;chargeReady?:number;momentum?:number;astral?:import('../combat/AstralCombat').AstralPose;xenobinder?:import('../combat/XenobinderCombat').XenobinderPose;beam?:HunterBeamPose;strike?:SaberPose;releaseProgress?:number;velocity?:{x:number;y:number};deathId?:string;dashCooldown?:number;chargeCooldown?:number;swingProgress?:number;wave?:{x:number;y:number;rotation:number;width:number;height:number}};
export type CreatureLayer={texture:string;frame:string;x:number;y:number;width:number;height:number;rotation:number;flip:boolean;depth:number;originX:number;originY:number};
export type ImpactPose={id:number;at:number;x:number;y:number;color:number;damage:number;angle?:number;effective?:boolean;resisted?:boolean};
export type CreaturePose={id:number;species:string;x:number;y:number;hp:number;maxHp:number;radius:number;texture:string;frame:string;flip:boolean;size:number;rotation:number;
 warning:boolean;angle:number;warningX:number;warningY:number;warningWidth:number;warningHeight:number;layers?:CreatureLayer[];projectile?:{x:number;y:number;rotation:number}};
export type ParticipantPose=PartyPose&{prompt:boolean;action:string;potionUsed:number};
export type PartyWorld={permanence?:import('../config/permanence').PermanencePose;missions?:MissionSnapshot;players:Record<string,ParticipantPose>;area:JourneyArea;time:number;progression:ProgressionSnapshot;flags:JourneyFlags;host:PartyPose;partner?:PartyPose;enemies:CreaturePose[];impacts?:ImpactPose[];boss?:BossPose;signalPortal?:boolean;loot?:LootPose[];lootAwarded?:(InventoryItem&{owner:string})[];resources?:ResourceDrop[];resourceAwarded?:ResourceDrop[];potionUsed?:number;returnStation?:{x:number;y:number};expeditionReturn?:ExpeditionReturn;visited?:JourneyArea[];message:string;prompt:boolean;action:string;shots:{x:number;y:number;rotation:number;friendly?:boolean;water?:boolean}[]};
// One connection across scene restarts. The relay grants roles; only host worlds are accepted.
export class CoopSession {
 serverProtocol?:15|16;
 role:'offline'|'connecting'|'host'|'guest'='offline';
 code='';message='Equipe de até quatro pessoas, uma de cada classe.';endedMessage='';
 connected=false;peerConnected=false;travelling=false;epoch=0;personalXpGained=0;rewardSaved=true;
 campaign?:RoomCampaign;campaignSaved=true;
 private acknowledgedCrew='';
 chatHistory:ChatMessage[]=[];chatError='';chatTyping=false;chatPending=false;chatDelivered=0;
 private pendingChatText='';private chatTimer?:ReturnType<typeof setTimeout>;
 readonly speech=new Map<string,{id:string;text:string;until:number}>();
 private chatSeen=new Set<string>();
 private chatChanged():void{window.dispatchEvent(new Event('dante-chat'));}
 private clearChat():void{clearTimeout(this.chatTimer);this.chatPending=false;this.pendingChatText='';this.chatDelivered=0;this.chatHistory=[];this.chatSeen.clear();this.speech.clear();this.chatError='';this.chatTyping=false;this.chatChanged();}
 private failChat(message:string):void{clearTimeout(this.chatTimer);this.chatPending=false;this.pendingChatText='';this.chatError=message;this.chatChanged();}
 private restoreChat(raw:unknown):void{
  this.chatHistory=Array.isArray(raw)?raw.filter(validChat).slice(-CHAT_HISTORY):[];
  for(const m of this.chatHistory)this.chatSeen.add(m.id);
  this.trimChatSeen();this.chatChanged();
 }
 private trimChatSeen():void{while(this.chatSeen.size>200)this.chatSeen.delete(this.chatSeen.values().next().value!);}
 private receiveChat(raw:unknown):void{
  if(!validChat(raw)||this.chatSeen.has(raw.id))return;
  this.chatSeen.add(raw.id);this.trimChatSeen();this.chatHistory.push(raw);this.chatHistory=this.chatHistory.slice(-CHAT_HISTORY);
  if(this.chatPending&&raw.author===this.id&&raw.text===this.pendingChatText){clearTimeout(this.chatTimer);this.chatPending=false;this.pendingChatText='';this.chatDelivered++;}
  this.speech.set(raw.author,{id:raw.id,text:raw.text,until:performance.now()+CHAT_DURATION});this.chatError='';this.chatChanged();
 }
 sendChat(text:string):boolean{
  if(this.chatPending)return false;
  this.chatError='';
  if(!this.connected||this.socket?.readyState!==WebSocket.OPEN){this.chatError='Reconectando. Envie novamente quando a sala voltar.';this.chatChanged();return false;}
  if(!text.trim()||Array.from(text).length>CHAT_LIMIT){this.chatError='Escreva de 1 a 200 caracteres.';this.chatChanged();return false;}
  this.chatPending=true;this.pendingChatText=text.replace(/[\u0000-\u001f\u007f]/g,' ').trim();
  this.chatTimer=setTimeout(()=>this.failChat('Envio não confirmado. Confira o histórico antes de enviar novamente.'),8000);
  this.socket.send(JSON.stringify({type:'chat',text}));this.chatChanged();return true;
 }
 get campaignRunning():boolean{return this.connected&&!!this.campaign?.running&&this.campaignSaved;}
 lastClose?:{code:number;reason:string};
 area?:JourneyArea;private pendingTravel?:JourneyArea;
 hostPaused=false;private localMenu=false;
 id='host'; members:PartyMember[]=[];
 readonly states=new Map<string,MemberState>();
 get guests():PartyMember[]{return this.members.filter(m=>m.id!=='host');}
 get peer():PartyProfile|undefined{return (this.role==='guest'?this.members.find(m=>m.id==='host'):this.guests[0])?.profile;}
 get ownPose():ParticipantPose|undefined{return this.world?.players[this.id];}
 state(id:string):MemberState{let s=this.states.get(id);if(!s){s={input:{...NO_INPUT},attackTap:false,inputAt:0,deathId:'',potionUsed:0,potionReady:0};this.states.set(id,s);}return s;}
 input:PartyInput={...NO_INPUT};inputAt=0;world?:PartyWorld;worldAt=0;
 private socket?:WebSocket;
 private url='';private token='';private sequence=0;private retryAt=0;
 private retryTimer?:ReturnType<typeof setTimeout>;
 private timeout?:ReturnType<typeof setTimeout>;
 private rewards=new LocalJourney();private receipt='';private rewardTotal=0;private rewardResources={credits:0,materials:[0,0,0],used:0};
 peerDeathId='';
 private earnedBosses:string[]=[];
 private requests:{id:string;action:'potion'|'return'|'heal'}[]=[];
 private missionRequests:MissionRequest[]=[];
 missionNotice='';missionPending=false;private missionNonce='';private missionTimer?:ReturnType<typeof setTimeout>;
 requestMission(action:MissionAction,mission:MissionId):boolean{
  if(this.role!=='guest'||!this.connected||this.socket?.readyState!==WebSocket.OPEN||!this.campaignRunning||this.missionPending)return false;
  this.missionPending=true;this.missionNonce=crypto.randomUUID();this.missionNotice='Aguardando validação da equipe…';
  this.socket?.send(JSON.stringify({type:'mission-request',action,mission,nonce:this.missionNonce,epoch:this.epoch}));
  this.missionTimer=setTimeout(()=>{this.missionPending=false;this.missionNotice='Sem confirmação. Confira o diário antes de tentar novamente.';},5000);return true;
 }
 takeMissionRequests():MissionRequest[]{return this.missionRequests.splice(0);}
 answerMission(request:MissionRequest,ok:boolean,message:string):void{if(this.role==='host'&&this.connected)this.socket?.send(JSON.stringify({type:'mission-result',id:request.id,nonce:request.nonce,ok,message,epoch:this.epoch}));}
 readonly lootAwarded=new Map<string,InventoryItem&{owner:string}>();
 readonly resourceAwarded=new Map<string,ResourceDrop>();
 personalItems:InventoryItem[]=[];
 canTravel(from:JourneyArea,to:JourneyArea):boolean{return this.campaignRunning && (to==='base'||from==='base'||!!CONNECTIONS[from]?.includes(to));}
 travel(from:JourneyArea,to:JourneyArea):boolean {
  if(this.role!=='host'||!this.canTravel(from,to)||this.travelling)return false;
  this.travelling=true;this.pendingTravel=to;this.input={...NO_INPUT};this.inputAt=0;
  this.socket!.send(JSON.stringify({type:'travel',area:to,epoch:this.epoch}));
  return true;
 }
 connect(url:string,mode:'create'|'join',profile:PartyProfile,area:JourneyArea,code=''):Promise<void>{
  if(this.role!=='offline')return Promise.reject(new Error('Encerre a sala atual primeiro.'));
  const hero=characterProfiles.active,campaign=hero.campaign;
  if(!campaign||campaign.mode!=='coop'||!campaign.introSeen)return Promise.reject(new Error('Crie ou selecione um personagem desta campanha cooperativa e conclua o prólogo.'));
  if(mode==='create'&&campaign.hostId!==hero.id)return Promise.reject(new Error('Peça ao anfitrião original para reunir a equipe.'));
  let target:URL;try{target=new URL(url);if(!['ws:','wss:'].includes(target.protocol)||target.username||target.password)throw Error();}catch{return Promise.reject(new Error('Informe um endereço ws:// ou wss:// válido.'));}
  if(location.protocol==='https:'&&target.protocol!=='wss:')return Promise.reject(new Error('Esta página segura precisa de um servidor wss://.'));
  if(mode==='join'&&!/^[A-F0-9]{10}$/.test(code.replace(/\s/g,'').toUpperCase()))return Promise.reject(new Error('O código da sala tem 10 letras/números. Confira com o anfitrião.'));
  this.clearChat();this.url=target.href;this.role='connecting';this.endedMessage='';this.message='Conectando à expedição…';this.personalXpGained=0;this.sequence=0;this.epoch=0;this.rewards=new LocalJourney();this.changed();
  this.campaign=undefined;this.campaignSaved=true;this.members=[];this.states.clear();this.requests=[];this.peerDeathId='';this.earnedBosses=[];this.lootAwarded.clear();this.resourceAwarded.clear();this.personalItems=[];this.receipt='';this.rewardTotal=0;this.rewardSaved=true;this.rewardResources={credits:0,materials:[0,0,0],used:0};
  const inventory=validEquipment(this.rewards.load()?.equipment);
  profile={...profile,characterId:hero.id,build:this.rewards.load()?.progression,potions:this.rewards.load()?.economy?.potions??0,equipment:inventory.slots,bagFree:24-(inventory.items!.length-Object.keys(inventory.equipped!).length)};
  return new Promise((resolve,reject)=>this.open({type:mode,profile,area,code,campaign},false,resolve,reject));
 }
 private open(request:object,retry:boolean,resolve:()=>void=()=>{},reject:(reason:Error)=>void=()=>{}):void {
  const ws=new WebSocket(this.url);this.socket=ws;let joined=false;
  this.timeout=setTimeout(()=>{if(this.socket===ws&&!joined){ws.close();if(!retry){this.fail('O cooperativo demorou para responder. Tente novamente em alguns segundos.');reject(new Error(this.message));}}},retry?5000:60000);
  ws.onopen=()=>{if(this.socket===ws)ws.send(JSON.stringify(request));};
  ws.onmessage=event=>{
   if(this.socket!==ws)return;
   let m;try{m=JSON.parse(event.data);}catch{return;}
   if(m.type==='joined'&&(m.role==='host'||m.role==='guest')){
    const needsPermanence=new URLSearchParams(location.search).has('permanence')||this.rewards.load()?.missions?.accepted.some(isPermanence);
    if(![15,16].includes(m.protocol)||m.protocol===15&&needsPermanence){clearTimeout(this.timeout);ws.send(JSON.stringify({type:'leave'}));this.fail('O servidor cooperativo aguarda a atualização dos capítulos do assentamento. Seus personagens permanecem preservados.');reject(new Error(this.message));return;}
    this.serverProtocol=m.protocol;
    joined=true;clearTimeout(this.timeout);this.role=m.role;this.connected=true;this.token=m.token;this.code=m.code;this.epoch=m.epoch;
    this.id=m.id;this.acknowledgedCrew='';this.setCampaign(m.campaign);this.setRoster(m.members);this.input={...NO_INPUT};this.inputAt=0;this.world=undefined;
    this.area=m.area;this.travelling=false;
    if(this.role==='host'&&this.campaignRunning&&this.pendingTravel&&this.pendingTravel!==m.area){
     this.travelling=true;ws.send(JSON.stringify({type:'travel',area:this.pendingTravel,epoch:this.epoch}));
    }else this.pendingTravel=undefined;
    this.message=retry?'Conexão recuperada.':m.role==='host'&&!this.guests.length?'Sala criada. Envie o link para convidar seu amigo.':'Equipe pronta. XP e drops são pessoais.';
    this.hostPaused=m.paused===true;this.restoreChat(m.chatHistory);
    if(this.role==='host')this.setMenu(this.localMenu);
    if(this.role==='guest'){
     this.credit(m.receipt,m.total,m.items,m.resources,m.bosses);
     const own=this.rewards.load(),inventory=validEquipment(own?.equipment);
     this.updateEquipment(inventory.slots,24-(inventory.items!.length-Object.keys(inventory.equipped!).length),own?.economy?.potions??0);
    }
    this.changed();resolve();
   }else if(m.type==='chat'&&joined){this.receiveChat(m.message);
   }else if(m.type==='chat-error'&&joined){this.failChat(String(m.message));
   }else if(m.type==='error'){
    this.message=String(m.message);
    if(!joined){clearTimeout(this.timeout);this.fail(this.message);reject(new Error(this.message));}
    else{this.travelling=false;this.changed();}
   }else if(m.type==='pause'&&this.role==='guest'){
    this.hostPaused=m.paused===true;
   }else if(m.type==='roster'){
    this.setCampaign(m.campaign);this.setRoster(m.members);this.message=this.campaignRunning?'Equipe original reunida.':this.campaign?.started?'Campanha pausada · aguardando a equipe original completa.':'Reúna todos os integrantes para começar.';if(!this.campaignRunning){this.clearInputs();this.travelling=false;this.pendingTravel=undefined;}this.changed();
   }else if(m.type==='travel'&&m.epoch>this.epoch&&COOP_AREAS.includes(m.area)){
    this.clearInputs();this.requests=[];this.missionRequests=[];clearTimeout(this.missionTimer);this.missionPending=false;this.missionNonce='';
    this.epoch=m.epoch;this.area=m.area;this.pendingTravel=undefined;this.world=undefined;this.input={...NO_INPUT};this.inputAt=0;this.travelling=false;
    this.message='Travessia em equipe · aguardando a nova região.';this.changed();
   }else if(m.type==='mission-request'&&this.role==='host'&&m.epoch===this.epoch){if(this.guests.some(p=>p.id===m.id)&&['accept','deliver'].includes(m.action)&&MISSION_IDS.includes(m.mission)&&typeof m.nonce==='string'&&this.missionRequests.length<32)this.missionRequests.push({id:m.id,action:m.action,mission:m.mission,nonce:m.nonce});
   }else if(m.type==='mission-result'&&this.role==='guest'&&m.nonce===this.missionNonce&&this.missionPending){clearTimeout(this.missionTimer);this.missionPending=false;this.missionNonce='';this.missionNotice=String(m.message).slice(0,180);
   }else if(m.type==='service-request'&&this.role==='host'){if(this.guests.some(p=>p.id===m.id)&&['potion','return','heal'].includes(m.action))this.requests.push({id:m.id,action:m.action});
   }else if(m.type==='input'&&this.role==='host'&&m.epoch===this.epoch&&this.guests.some(p=>p.id===m.id)){
    const state=this.state(m.id);
    state.attackTap ||= m.input.attack===true;
    for(const key of ['dash','charge','release','cancel','interact','restart','element'] as const)m.input[key] ||= state.input[key];
    state.input=m.input;state.inputAt=performance.now();
   }else if(m.type==='awards-ack'&&this.role==='host'){
    for(const id of (m.items??[]).slice(0,512))this.lootAwarded.delete(id);
    for(const id of (m.resources??[]).slice(0,512))this.resourceAwarded.delete(id);
   }else if(m.type==='world'&&this.role==='guest'&&m.epoch===this.epoch&&m.world&&COOP_AREAS.includes(m.world.area)&&Array.isArray(m.world.enemies)&&m.world.enemies.length<=32){
    this.world=m.world;this.worldAt=performance.now();this.credit(m.receipt,m.total,m.items,m.resources,m.bosses);
   }else if(m.type==='ended'||m.type==='replaced')this.fail(m.type==='ended'?'O dono da sala saiu do jogo.':String(m.message));
  };
  ws.onerror=()=>{if(!retry&&!joined&&this.socket===ws){this.fail('O cooperativo está indisponível nesta conexão. Tente novamente em alguns segundos; sua jornada solo continua disponível.');reject(new Error(this.message));}};
  ws.onclose=event=>{
   if(this.socket!==ws)return;
   this.lastClose={code:event.code,reason:event.reason};
   if(this.chatPending)this.failChat('Conexão interrompida antes da confirmação. Confira o histórico ao reconectar.');
   clearTimeout(this.timeout);clearTimeout(this.missionTimer);this.missionPending=false;this.missionRequests=[];this.socket=undefined;this.connected=false;this.input={...NO_INPUT};this.inputAt=0;
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
 private credit(receipt:string,total:number,items:unknown=this.personalItems,resources=this.rewardResources,bosses:unknown=this.earnedBosses):void {
  if(typeof receipt!=='string'||!Number.isSafeInteger(total)||total<0)return;
  const valid=Array.isArray(items)?items.filter(validItem).slice(0,512):[];
  const earned=Array.isArray(bosses)?[...new Set(bosses.filter((id):id is string=>['warden','soterrado','vesper','titan'].includes(id)))].slice(0,4):[];
  if(this.rewardSaved&&this.receipt===receipt&&this.rewardTotal===total&&JSON.stringify(valid)===JSON.stringify(this.personalItems)&&JSON.stringify(resources)===JSON.stringify(this.rewardResources)&&JSON.stringify(earned)===JSON.stringify(this.earnedBosses))return;
  this.receipt=receipt;this.rewardTotal=total;
  this.personalItems=valid;this.earnedBosses=earned;this.rewardResources=resources??{credits:0,materials:[0,0,0],used:0};
  this.rewardSaved=total===0&&valid.length===0&&earned.length===0&&this.rewardResources.credits===0&&this.rewardResources.used===0&&this.rewardResources.materials.every(v=>v===0)||this.rewards.creditCoopXp(receipt,total,valid,this.rewardResources,earned);
  this.personalXpGained=total;
 }
 updateEquipment(slots:EquipmentSnapshot['slots'],bagFree=24,potions?:number):void {
  if(this.connected)this.socket?.send(JSON.stringify({type:'equipment',build:this.rewards.load()?.progression,equipment:slots,bagFree,potions:potions??this.rewards.load()?.economy?.potions??0}));
 }
 requestPotion():void{if(this.role==='guest'&&this.connected)this.socket?.send(JSON.stringify({type:'service-request',action:'potion'}));}
 requestBase():void{if(this.role==='guest'&&this.connected)this.socket?.send(JSON.stringify({type:'service-request',action:'return'}));}
 requestHeal():void{if(this.role==='guest'&&this.connected)this.socket?.send(JSON.stringify({type:'service-request',action:'heal'}));}
 takeRequests(){return this.requests.splice(0);}
 startCampaign():void{if(this.role==='host'&&this.connected&&this.campaignSaved)this.socket?.send(JSON.stringify({type:'start'}));}
 retryCampaignSave():void{if(!this.campaign)return;this.campaignSaved=characterProfiles.sealCrew(this.campaign.crew);this.socket?.send(JSON.stringify({type:'ready',ready:this.campaignSaved}));this.changed();}
 private setCampaign(campaign:RoomCampaign):void{
  if(!campaign||campaign.id!==characterProfiles.active.campaign?.id)return;
  this.campaign=campaign;
  if(campaign.crew.length){const previous=this.campaignSaved;this.campaignSaved=characterProfiles.sealCrew(campaign.crew);const key=JSON.stringify(campaign.crew);if(previous!==this.campaignSaved||this.acknowledgedCrew!==key){this.acknowledgedCrew=key;this.socket?.send(JSON.stringify({type:'ready',ready:this.campaignSaved}));}}
 }
 send(type:'input'|'world',payload:PartyInput|PartyWorld):boolean{
  if(!this.connected||!this.campaignRunning||this.travelling||this.socket?.readyState!==WebSocket.OPEN)return false;
  if(this.socket.bufferedAmount>1048576){this.socket.close(4001,'Reconectando a expedição congestionada.');return false;}
  if(this.socket.bufferedAmount>131072&&!(type==='input'&&(payload as PartyInput).cancel))return false;
  this.socket.send(JSON.stringify(type==='input'?{type,input:payload,epoch:this.epoch}:{type,world:payload,epoch:this.epoch,sequence:++this.sequence}));
  return true;
 }
 setMenu(paused:boolean):void {
  this.localMenu=paused;
  if(this.role==='host'&&this.connected)this.socket?.send(JSON.stringify({type:'pause',paused}));
 }
 consumeEdges():void{for(const state of this.states.values()){state.attackTap=false;for(const key of ['dash','charge','release','cancel','interact','restart','element'] as const)state.input[key]=false;}}
 private clearInputs():void{for(const state of this.states.values()){state.input={...NO_INPUT,cancel:true};state.attackTap=false;state.inputAt=0;}}
 disconnect(restoreGuest=true):boolean{
  clearTimeout(this.missionTimer);this.missionPending=false;this.missionRequests=[];this.missionNotice='';
  const guest=this.role==='guest';
  if(guest&&this.receipt)this.credit(this.receipt,this.rewardTotal);
  // If storage fails, keep the visit open so the player can retry instead of losing XP silently.
  if(guest&&!this.rewardSaved){this.message='Não foi possível salvar o XP. Libere o armazenamento e tente sair novamente.';this.changed();return false;}
  if(this.socket?.readyState===WebSocket.OPEN)this.socket.send(JSON.stringify({type:'leave'}));
  this.role='offline';this.serverProtocol=undefined;this.endedMessage='';this.connected=false;this.peerConnected=false;this.campaign=undefined;this.members=[];this.states.clear();this.requests=[];this.world=undefined;this.input={...NO_INPUT};this.token='';this.travelling=false;this.pendingTravel=undefined;this.area=undefined;this.clearChat();
  clearTimeout(this.timeout);clearTimeout(this.retryTimer);
  const socket=this.socket;this.socket=undefined;socket?.close();this.changed();if(guest&&restoreGuest)location.reload();return true;
 }
 private fail(message:string):void{
  this.message=message;
  if(this.role!=='guest'){this.disconnect();return;}
  // Keep the visit non-authoritative until the player chooses to restore their
  // own journey. This also lets an unsaved XP receipt be retried safely.
  this.endedMessage=message;this.connected=false;this.peerConnected=false;this.hostPaused=false;this.clearChat();
  this.input={...NO_INPUT};this.inputAt=0;this.travelling=false;this.pendingTravel=undefined;
  clearTimeout(this.timeout);clearTimeout(this.retryTimer);
  if(this.receipt)this.credit(this.receipt,this.rewardTotal);
  const socket=this.socket;this.socket=undefined;
  if(socket?.readyState===WebSocket.OPEN)socket.send(JSON.stringify({type:'leave'}));
  socket?.close();this.changed();
 }
 private setRoster(raw:PartyMember[]):void{
  if(!Array.isArray(raw)||raw.length>4)return;
  this.members=raw;const live=new Set(raw.map(m=>m.id));
  for(const [uid,item]of this.lootAwarded)if(!live.has(item.owner))this.lootAwarded.delete(uid);
  for(const [uid,item]of this.resourceAwarded)if(!live.has(item.owner))this.resourceAwarded.delete(uid);
  for(const [id,state] of this.states){if(!live.has(id))this.states.delete(id);else if(!raw.find(m=>m.id===id)?.connected){state.input={...NO_INPUT,cancel:true};state.attackTap=false;state.inputAt=0;}}
  this.peerConnected=this.role==='guest'?!!raw.find(m=>m.id==='host')?.connected:raw.some(m=>m.id!=='host'&&m.connected);
 }
 private changed():void{window.dispatchEvent(new Event('dante-coop'));}
}
export const coopSession=new CoopSession();
