import Phaser from 'phaser';
import {coopSession} from '../network/CoopSession';
import {MISSIONS,NPC_NAMES,NPC_SERVICES,missionById,type MissionId,type MissionNpc} from '../config/missions';
import type {Missions,MissionAction,MissionStatus} from '../systems/Missions';
import './missions.css';

type State={missions:Missions;notice:string;pending:boolean};
const STATUS:Record<MissionStatus,string>={locked:'Aguardando relatório anterior',available:'Disponível',active:'Em andamento',ready:'Pronta para entrega',completed:'Relatório entregue'};
export class MissionPanel{
 private root=document.createElement('section');
 private tracker=document.createElement('button');
 private dialog=document.createElement('dialog');
 private npc?:MissionNpc;
 private selected:MissionId='recon';
 private key='';private trackerKey='';private frame=0;private previous:boolean[]=[];
 private waiting?:{id:MissionId;action:MissionAction;until:number};
 private destroyed=false;
 constructor(scene:Phaser.Scene,private read:()=>State,private canTalk:(npc:MissionNpc)=>boolean,
  private act:(action:MissionAction,id:MissionId)=>boolean,private track:(id:MissionId)=>void,
  private services:(npc:MissionNpc)=>void,private opened:()=>void,private closed:()=>void){
  this.root.className='mission-tracker';this.root.setAttribute('aria-label','Missão acompanhada');
  this.tracker.type='button';this.tracker.setAttribute('aria-haspopup','dialog');this.tracker.onclick=()=>this.openJournal();this.root.append(this.tracker);
  this.dialog.className='records-dialog mission-dialog';this.dialog.setAttribute('aria-label','Diário e conversas da expedição');
  this.dialog.addEventListener('close',()=>{this.waiting=undefined;if(!this.destroyed)this.closed();});
  document.body.append(this.root,this.dialog);window.addEventListener('keydown',this.onKey,true);
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN,()=>{this.destroyed=true;cancelAnimationFrame(this.frame);window.removeEventListener('keydown',this.onKey,true);this.root.remove();this.dialog.remove();});
  this.refresh();this.frame=requestAnimationFrame(this.poll);
 }
 get isOpen():boolean{return this.dialog.open;}
 openJournal():void{this.open();}
 openNpc(npc:MissionNpc):void{if(!this.canTalk(npc))return;this.open(npc);}
 private open(npc?:MissionNpc):void{
  if(this.isOpen||document.querySelector('dialog[open]'))return;
  this.npc=npc;const m=this.read().missions;
  this.selected=npc?MISSIONS.find(d=>d.npc===npc&&['ready','available','active'].includes(m.status(d.id)))?.id
    ??[...MISSIONS].reverse().find(d=>d.npc===npc&&m.status(d.id)==='completed')?.id??MISSIONS.find(d=>d.npc===npc)!.id:m.current??'recon';
  this.key='';this.previous=this.pad();this.render();this.opened();this.dialog.showModal();this.dialog.querySelector<HTMLButtonElement>('[data-close]')?.focus();
 }
 private button(parent:Element,text:string,run:()=>void,id:string,disabled=false):HTMLButtonElement{
  const b=document.createElement('button');b.type='button';b.textContent=text;b.dataset.missionAction=id;b.disabled=disabled;b.onclick=run;parent.append(b);return b;
 }
 private render():void{
  const {missions:m,notice,pending}=this.read();
  const focus=(document.activeElement as HTMLElement)?.dataset.missionAction;
  const d=missionById(this.selected),status=m.status(d.id),isNpc=!!this.npc;
  this.dialog.replaceChildren();
  const header=document.createElement('header'),title=document.createElement('div'),small=document.createElement('small'),h=document.createElement('h1');
  small.textContent=isNpc?'EXPEDIÇÃO DANTE-01':'DIÁRIO DA EXPEDIÇÃO';h.textContent=isNpc?NPC_NAMES[this.npc!]:'Missões de Dante';title.append(small,h);header.append(title);
  this.button(header,'VOLTAR',()=>this.dialog.close(),'close').dataset.close='';this.dialog.append(header);
  if(!isNpc){
   const nav=document.createElement('nav');nav.className='mission-list';nav.setAttribute('aria-label','Missões');
   for(const def of MISSIONS){const s=m.status(def.id);const b=this.button(nav,`${s==='completed'?'✓ ':s==='ready'?'◆ ':''}${def.title} · ${STATUS[s]}`,()=>{this.selected=def.id;this.render();},'select-'+def.id);b.setAttribute('aria-pressed',String(def.id===this.selected));}
   this.dialog.append(nav);
  }
  const content=document.createElement('section');content.className='mission-content';content.dataset.mission=d.id;
  const name=document.createElement('h2');name.textContent=d.title;content.append(name);
  const subtitle=document.createElement('p');subtitle.className='mission-state';subtitle.textContent=`${NPC_NAMES[d.npc]} · ${STATUS[status]}`;content.append(subtitle);
  if(status==='locked'){
   const p=document.createElement('p');p.textContent=`Entregue o relatório de “${missionById(d.requires!).title}” para continuar.`;content.append(p);
  }else{
   for(const line of status==='completed'||isNpc&&status==='ready'?d.report:d.offer){const p=document.createElement('p');p.textContent=line;content.append(p);}
   const goals=document.createElement('ul');goals.className='mission-goals';
   for(const g of d.goals){const li=document.createElement('li');li.dataset.done=String(m.has(g.id));li.textContent=(m.has(g.id)?'✓ ':'◇ ')+g.label;goals.append(li);}content.append(goals);
   const reward=document.createElement('p');reward.className='mission-reward';reward.textContent=`Recompensa pessoal: ${d.credits} créditos`;content.append(reward);
   const actions=document.createElement('div');actions.className='mission-actions';
   if(isNpc&&d.npc===this.npc&&(status==='available'||status==='ready')){
    const action:MissionAction=status==='ready'?'deliver':'accept';
    this.button(actions,pending?'AGUARDANDO A EQUIPE…':action==='accept'?'ACEITAR MISSÃO':'ENTREGAR RELATÓRIO',()=>{
     if(this.act(action,d.id)){this.waiting={id:d.id,action,until:performance.now()+6500};this.refresh();}
    },action,pending||!this.canTalk(d.npc));
   }else if(status!=='completed')this.button(actions,'ACOMPANHAR',()=>{this.track(d.id);this.dialog.close();},'track');
   content.append(actions);
   if(!isNpc&&status!=='completed'){const p=document.createElement('p');p.className='mission-hint';p.textContent=`Converse com ${NPC_NAMES[d.npc]} na base para ${status==='ready'?'entregar o relatório':status==='available'?'aceitar a missão':'conferir a missão'}.`;content.append(p);}
  }
  this.dialog.append(content);
  if(isNpc)this.button(this.dialog,NPC_SERVICES[this.npc!].toLocaleUpperCase('pt-BR'),()=>{const id=this.npc!;this.dialog.close();requestAnimationFrame(()=>{if(!this.destroyed)this.services(id);});},'services');
  const feedback=document.createElement('p');feedback.className='mission-feedback';feedback.setAttribute('role','status');feedback.textContent=notice;this.dialog.append(feedback);
  if(focus)this.dialog.querySelector<HTMLButtonElement>(`[data-mission-action="${focus}"]`)?.focus();
 }
 private refresh():void{
  const s=this.read(),m=s.missions,id=m.current,tk=`${m.version}:${m.tracked}:${id}:${id?this.canTalk(missionById(id).npc):false}`;
  if(tk!==this.trackerKey){
   this.trackerKey=tk;this.tracker.replaceChildren();this.root.classList.toggle('is-finished',!id);
   const hint=document.createElement('small');hint.textContent='MISSÕES · J / L3';this.tracker.append(hint);
   if(id){const d=missionById(id),status=m.status(id),title=document.createElement('strong'),goal=document.createElement('span');title.textContent=d.title;
    goal.textContent=status==='ready'?`✓ Entregue o relatório a ${NPC_NAMES[d.npc]}${this.canTalk(d.npc)?'':' · Base / M'}`:status==='available'?`! Converse com ${NPC_NAMES[d.npc]} na base`:d.goals.find(g=>!m.has(g.id))?.label??'Retorne à base';this.tracker.append(title,goal);
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
 private focus(delta:number):void{const bs=Array.from(this.dialog.querySelectorAll<HTMLButtonElement>('button:not(:disabled)'));if(!bs.length)return;const i=bs.indexOf(document.activeElement as HTMLButtonElement);const b=bs[(i+delta+bs.length)%bs.length];b.focus();b.scrollIntoView({block:'nearest'});}
 private pad():boolean[]{return navigator.getGamepads?.().find(p=>p?.connected&&p.mapping==='standard')?.buttons.map(b=>b.pressed||b.value>.5)??[];}
 private poll=():void=>{const buttons=this.pad(),edge=(i:number)=>buttons[i]&&!this.previous[i];if(!coopSession.chatTyping){if(this.isOpen){if(edge(12)||edge(14))this.focus(-1);else if(edge(13)||edge(15))this.focus(1);else if(edge(0))(document.activeElement as HTMLButtonElement)?.click();else if(edge(1)||edge(10))this.dialog.close();}else if(edge(10)&&!document.querySelector('dialog[open]'))this.openJournal();}this.previous=buttons;this.refresh();this.frame=requestAnimationFrame(this.poll);};
}
