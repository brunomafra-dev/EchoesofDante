import Phaser from 'phaser';
import {coopSession} from '../network/CoopSession';
import {MISSIONS,NPC_NAMES,NPC_SERVICES,missionById,type MissionId,type MissionNpc} from '../config/missions';
import type {Missions,MissionAction,MissionStatus} from '../systems/Missions';
import './missions.css';

type State={missions:Missions;notice:string;pending:boolean;routeHint?:string};
const STATUS:Record<MissionStatus,string>={locked:'Aguardando relatório anterior',available:'Disponível',active:'Em andamento',ready:'Pronta para entrega',completed:'Relatório entregue'};
export class MissionPanel{
 private root=document.createElement('section');
 private tracker=document.createElement('button');
 private dialog=document.createElement('dialog');
 private npc?:MissionNpc;
 private selected:MissionId='recon';
 private regionalTab=false;
 private pickerOpen=false;
 private layoutQuery=matchMedia('(max-width:900px),(max-height:600px)');
 private resize=()=>{if(this.isOpen){this.pickerOpen=!this.compact();this.render();this.dialog.scrollTop=0;}};
 private key='';private trackerKey='';private frame=0;private previous:boolean[]=[];
 private waiting?:{id:MissionId;action:MissionAction;until:number};
 private destroyed=false;
 constructor(scene:Phaser.Scene,private read:()=>State,private canTalk:(npc:MissionNpc)=>boolean,
  private act:(action:MissionAction,id:MissionId)=>boolean,private track:(id:MissionId|null)=>void,
  private services:(npc:MissionNpc)=>void,private opened:()=>void,private closed:()=>void){
  this.root.className='mission-tracker';this.root.setAttribute('aria-label','Missão acompanhada');
  this.tracker.type='button';this.tracker.setAttribute('aria-haspopup','dialog');this.tracker.onclick=()=>this.openJournal();this.root.append(this.tracker);
  this.dialog.className='records-dialog mission-dialog';this.dialog.setAttribute('aria-label','Diário e conversas da expedição');
  this.dialog.addEventListener('close',()=>{this.waiting=undefined;if(!this.destroyed)this.closed();});
  document.body.append(this.root,this.dialog);window.addEventListener('keydown',this.onKey,true);
  this.layoutQuery.addEventListener('change',this.resize);
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN,()=>{this.destroyed=true;cancelAnimationFrame(this.frame);window.removeEventListener('keydown',this.onKey,true);this.layoutQuery.removeEventListener('change',this.resize);this.root.remove();this.dialog.remove();});
  this.refresh();this.frame=requestAnimationFrame(this.poll);
 }
 get isOpen():boolean{return this.dialog.open;}
 openJournal():void{this.open();}
 openNpc(npc:MissionNpc):void{if(!this.canTalk(npc))return;this.open(npc);}
 private open(npc?:MissionNpc):void{
  if(this.isOpen||document.querySelector('dialog[open]'))return;
  this.npc=npc;
  this.selected=this.preferred(npc?MISSIONS.filter(d=>d.npc===npc):MISSIONS,!!npc);
  this.regionalTab=!!missionById(this.selected).regional;
  this.pickerOpen=!this.compact();
  this.key='';this.previous=this.pad();this.render();this.opened();this.dialog.showModal();this.dialog.querySelector<HTMLButtonElement>('[data-close]')?.focus();
 }
 private button(parent:Element,text:string,run:()=>void,id:string,disabled=false):HTMLButtonElement{
  const b=document.createElement('button');b.type='button';b.textContent=text;b.dataset.missionAction=id;b.disabled=disabled;b.onclick=run;parent.append(b);return b;
 }
 private compact():boolean{return this.layoutQuery.matches;}
 private preferred(options:readonly (typeof MISSIONS)[number][],npc=false):MissionId{
  const m=this.read().missions;
  if(!npc&&m.current&&options.some(d=>d.id===m.current))return m.current;
  for(const status of (npc?['ready','available','active']:['ready','active','available'])){const next=options.find(d=>m.status(d.id)===status);if(next)return next.id;}
  return [...options].reverse().find(d=>m.status(d.id)==='completed')?.id??options[0].id;
 }
 private select(id:MissionId):void{
  this.selected=id;if(this.compact())this.pickerOpen=false;this.render();this.dialog.scrollTop=0;
  if(this.compact())this.dialog.querySelector<HTMLElement>('.mission-content h2')?.focus({preventScroll:true});
 }
 private render():void{
  const {missions:m,notice,pending}=this.read();
  const focus=(document.activeElement as HTMLElement)?.dataset.missionAction;
  const previous=this.dialog.querySelector<HTMLElement>('[data-mission]')?.dataset.mission,scroll=this.dialog.scrollTop;
  const d=missionById(this.selected),status=m.status(d.id),isNpc=!!this.npc;
  this.dialog.replaceChildren();
  const header=document.createElement('header'),title=document.createElement('div'),small=document.createElement('small'),h=document.createElement('h1');
  small.textContent=isNpc?'EXPEDIÇÃO DANTE-01':'DIÁRIO DA EXPEDIÇÃO';h.textContent=isNpc?NPC_NAMES[this.npc!]:'Missões de Dante';title.append(small,h);header.append(title);
  const headerActions=document.createElement('div');headerActions.className='mission-header-actions';
  if(isNpc){const service=this.button(headerActions,{expedition:'EXPEDIÇÕES / COFRE',medic:'ENFERMARIA',smith:'OFICINA'}[this.npc!],()=>{const id=this.npc!;this.dialog.close();requestAnimationFrame(()=>{if(!this.destroyed)this.services(id);});},'services');service.title=NPC_SERVICES[this.npc!];service.setAttribute('aria-label',NPC_SERVICES[this.npc!]);}
  this.button(headerActions,'VOLTAR',()=>this.dialog.close(),'close').dataset.close='';header.append(headerActions);this.dialog.append(header);
  if(!isNpc){const tabs=document.createElement('nav');tabs.className='mission-tabs';tabs.setAttribute('aria-label','Tipo de missão');
   for(const [regional,label]of [[false,'CAMPANHA'],[true,'EXPEDIÇÕES REGIONAIS']] as const){const b=this.button(tabs,label,()=>{this.regionalTab=regional;this.selected=this.preferred(MISSIONS.filter(def=>!!def.regional===regional));this.render();},regional?'tab-regional':'tab-story');b.setAttribute('aria-pressed',String(this.regionalTab===regional));}this.dialog.append(tabs);
  }
  const workspace=document.createElement('div');workspace.className='mission-workspace';this.dialog.append(workspace);
  const options=isNpc?MISSIONS.filter(def=>def.npc===this.npc&&m.status(def.id)!=='locked'&&m.status(def.id)!=='completed'):MISSIONS.filter(def=>!!def.regional===this.regionalTab);
  if(!isNpc||options.length>1){
   const picker=document.createElement('details');picker.className='mission-picker';picker.open=this.pickerOpen;
   const summary=document.createElement('summary');summary.textContent=`ESCOLHER MISSÃO · ${options.length}`;summary.dataset.missionAction='choose-mission';picker.append(summary);
   picker.ontoggle=()=>{if(picker.isConnected)this.pickerOpen=picker.open;};
   const groups=document.createElement('div');groups.className='mission-groups';picker.append(groups);
   const ordered=[...options].sort((a,b)=>{const rank=(id:MissionId)=>id===m.current?-1:({ready:0,active:1,available:2,completed:3,locked:4})[m.status(id)];return rank(a.id)-rank(b.id);});
   for(const kind of ['current','completed','locked']){
    const entries=ordered.filter(def=>kind==='current'?!['completed','locked'].includes(m.status(def.id)):m.status(def.id)===kind);if(!entries.length)continue;
    const group=kind==='current'?document.createElement('section'):document.createElement('details');
    const title=document.createElement(kind==='current'?'h3':'summary');title.textContent=(kind==='current'?'EM CURSO E DISPONÍVEIS':kind==='completed'?'RELATÓRIOS CONCLUÍDOS':'A DESCOBRIR')+` · ${entries.length}`;if(kind!=='current')title.dataset.missionAction='group-'+kind;group.append(title);
    const nav=document.createElement('nav');nav.className='mission-list';nav.setAttribute('aria-label',title.textContent);
    for(const def of entries){const s=m.status(def.id);const b=this.button(nav,`${def.id===m.current?'◈ ':s==='completed'?'✓ ':s==='ready'?'◆ ':''}${def.title} · ${STATUS[s]}`,()=>this.select(def.id),'select-'+def.id);b.setAttribute('aria-pressed',String(def.id===this.selected));}group.append(nav);groups.append(group);
   }
   workspace.append(picker);
  }
  const content=document.createElement('section');content.className='mission-content';content.dataset.mission=d.id;
  const name=document.createElement('h2');name.textContent=d.title;name.tabIndex=-1;content.append(name);
  const subtitle=document.createElement('p');subtitle.className='mission-state';subtitle.textContent=`${NPC_NAMES[d.npc]} · ${STATUS[status]}`;content.append(subtitle);
  if(status==='locked'){
   const p=document.createElement('p');
   if(d.id.startsWith('settle-')&&!m.permanenceAvailable)p.textContent='Os capítulos do assentamento aguardam a atualização do serviço cooperativo. A expedição anterior continua disponível.';
   else if(d.id==='settle-outpost'&&!m.outpostAvailable)p.textContent='O servidor cooperativo aguarda o capítulo do Posto das Nascentes. Os capítulos anteriores continuam disponíveis.';
   else if(d.requires&&m.status(d.requires)!=='completed')p.textContent=`Entregue o relatório de “${missionById(d.requires).title}” para continuar.`;
   else if(d.unlock==='po-secure')p.textContent='A Bacia das Nascentes ainda precisa estar segura. As ameaças já eliminadas permanecem registradas; explore os caminhos e margens restantes.';
   else p.textContent=d.unlock==='after-soterrado'?'Investigue a bacia sob as dunas e conclua o encontro com o Soterrado.':'Conclua a travessia glacial e o encontro com Vésper para receber este relatório.';
   content.append(p);
  }else{
   if(status!=='completed'){
    const next=document.createElement('p');next.className='mission-next';next.textContent=status==='ready'?`✓ Relatório pronto · entregue a ${NPC_NAMES[d.npc]}.`:status==='available'?(isNpc?'Aceite a missão para iniciar.':`Converse com ${NPC_NAMES[d.npc]} para iniciar.`):d.goals.find(g=>!m.has(g.id))?.label??'Retorne à base';content.append(next);
   }
   const actions=document.createElement('div');actions.className='mission-actions';
   if(isNpc&&d.npc===this.npc&&(status==='available'||status==='ready')){
    const action:MissionAction=status==='ready'?'deliver':'accept';
    this.button(actions,pending?'AGUARDANDO A EQUIPE…':action==='accept'?'ACEITAR MISSÃO':'ENTREGAR RELATÓRIO',()=>{
     if(this.act(action,d.id)){this.waiting={id:d.id,action,until:performance.now()+6500};this.refresh();}
    },action,pending||!this.canTalk(d.npc));
   }else if(status!=='completed'){
    if(m.current!==d.id)this.button(actions,'ACOMPANHAR',()=>{this.track(d.id);this.dialog.close();},'track');
    else this.button(actions,'PARAR DE ACOMPANHAR',()=>{this.track(null);this.dialog.close();},'untrack');
   }
   content.append(actions);
   for(const line of status==='completed'||isNpc&&status==='ready'?d.report:d.offer){const p=document.createElement('p');p.textContent=line;content.append(p);}
   const goals=document.createElement('ul');goals.className='mission-goals';
   for(const g of d.goals){const li=document.createElement('li');li.dataset.done=String(m.has(g.id));li.textContent=(m.has(g.id)?'✓ ':'◇ ')+g.label;goals.append(li);}content.append(goals);
   const reward=document.createElement('p');reward.className='mission-reward';reward.textContent=`Recompensa pessoal: ${d.credits} créditos`;content.append(reward);
   if(!isNpc&&status!=='completed'){const p=document.createElement('p');p.className='mission-hint';p.textContent=`Converse com ${NPC_NAMES[d.npc]} na base para ${status==='ready'?'entregar o relatório':status==='available'?'aceitar a missão':'conferir a missão'}.`;content.append(p);}
  }
  workspace.append(content);
  const feedback=document.createElement('p');feedback.className='mission-feedback';feedback.setAttribute('role','status');feedback.textContent=notice;this.dialog.append(feedback);
  if(focus){const next=this.dialog.querySelector<HTMLElement>(`[data-mission-action="${focus}"]`);if(next?.getClientRects().length)next.focus({preventScroll:true});}
  this.dialog.scrollTop=previous===this.selected?scroll:0;
 }
 private refresh():void{
  const s=this.read(),m=s.missions,id=m.current,tk=`${m.version}:${m.tracked}:${id}:${s.routeHint}:${id?this.canTalk(missionById(id).npc):false}`;
  if(tk!==this.trackerKey){
   this.trackerKey=tk;this.tracker.replaceChildren();this.root.classList.toggle('is-finished',!id);
   const hint=document.createElement('small');hint.textContent='MISSÕES · J / L3';this.tracker.append(hint);
   if(id){const d=missionById(id),status=m.status(id),title=document.createElement('strong'),goal=document.createElement('span');title.textContent=d.title;
    goal.textContent=status==='ready'?`✓ Entregue o relatório a ${NPC_NAMES[d.npc]}${this.canTalk(d.npc)?'':' · Base / M'}`:status==='available'?`! Converse com ${NPC_NAMES[d.npc]} na base`:s.routeHint??d.goals.find(g=>!m.has(g.id))?.label??'Retorne à base';this.tracker.append(title,goal);
   }else{const title=document.createElement('strong');title.textContent='Diário da expedição';this.tracker.append(title);}
  }
  if(!this.isOpen)return;
  if(this.waiting){const status=m.status(this.waiting.id),done=this.waiting.action==='accept'?['active','ready','completed'].includes(status):status==='completed';if(done){this.dialog.close();return;}if(performance.now()>this.waiting.until)this.waiting=undefined;}
  const key=`${tk}:${this.npc}:${this.selected}:${s.notice}:${s.pending}`;
  if(key!==this.key){this.key=key;this.render();}
 }
 private onKey=(e:KeyboardEvent):void=>{
  if(e.target instanceof HTMLInputElement||e.target instanceof HTMLTextAreaElement||coopSession.chatTyping)return;
  if(this.isOpen){e.stopImmediatePropagation();if(e.key==='Escape'||e.code==='KeyJ'){e.preventDefault();this.dialog.close();}else if(e.key.startsWith('Arrow')){e.preventDefault();this.focus(e.key==='ArrowUp'||e.key==='ArrowLeft'?-1:1);}return;}
  if(e.code==='KeyJ'&&!e.repeat&&!document.querySelector('dialog[open]')){e.preventDefault();e.stopImmediatePropagation();this.openJournal();}
 };
 private focus(delta:number):void{const bs=Array.from(this.dialog.querySelectorAll<HTMLElement>('button:not(:disabled),summary')).filter(b=>b.getClientRects().length);if(!bs.length)return;const i=bs.indexOf(document.activeElement as HTMLElement);const b=bs[(i+delta+bs.length)%bs.length];b.focus();b.scrollIntoView({block:'nearest'});}
 private pad():boolean[]{return navigator.getGamepads?.().find(p=>p?.connected&&p.mapping==='standard')?.buttons.map(b=>b.pressed||b.value>.5)??[];}
 private poll=():void=>{const buttons=this.pad(),edge=(i:number)=>buttons[i]&&!this.previous[i];if(!coopSession.chatTyping){if(this.isOpen){if(edge(12)||edge(14))this.focus(-1);else if(edge(13)||edge(15))this.focus(1);else if(edge(0))(document.activeElement as HTMLButtonElement)?.click();else if(edge(1)||edge(10))this.dialog.close();}else if(edge(10)&&!document.querySelector('dialog[open]'))this.openJournal();}this.previous=buttons;this.refresh();this.frame=requestAnimationFrame(this.poll);};
}
