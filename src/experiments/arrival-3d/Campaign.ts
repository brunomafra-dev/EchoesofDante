import * as T from 'three';
import {missionById,NPC_NAMES,SURVEY_POINTS,type MissionId}from'../../config/missions';
import {WARDEN_PREPARATION as W}from'../../config/wardenPreparation';
import {QUESTS,SITES,CAVE,ZONE_NAMES,missionEngine,currentQuest,questTarget,routeTarget,syncEvidence,record}from'./Journey';
import {NPCS,v}from'./World';
import type{Trial,Zone}from'./model';
import{maxHp}from'./model';
import{POTION_PRICE}from'../../config/economy';
const el=(id:string)=>document.getElementById(id)!;
export type JourneyContext={kind:'survey'|'regional'|'depth'|'deepSignal'|'fragment'|'firstEcho'|'threshold'|'descent'|'ascent'|'bossGate'|'arenaReturn';id:number;name:string};
export class Campaign{
 private last?:Trial;private missions!:ReturnType<typeof missionEngine>;private beacon=new T.Mesh(new T.RingGeometry(.73,.8,40).rotateX(-Math.PI/2),new T.MeshBasicMaterial({color:'#dfc797',transparent:true,opacity:.8,depthWrite:false,side:T.DoubleSide}));private lastVersion=-1;
 private get m(){const t=this.trial();if(t!==this.last){this.last=t;this.missions=missionEngine(t);this.lastVersion=-1;}return this.missions;}
 constructor(private trial:()=>Trial,private position:T.Vector3,scene:T.Scene,private save:()=>void,private dialogue:(title:string,text:string,subtitle?:string)=>void,private notify:(text:string)=>void,private zone:(zone:Zone,point?:T.Vector3)=>void){this.missions=missionEngine(this.trial());scene.add(this.beacon);el('quests').onclick=()=>this.journal();}
 private persist(){const t=this.trial();syncEvidence(t,this.m);t.journey.tracked=this.m.tracked;this.save();this.update();}
 observe(){const t=this.trial(),m=this.m;syncEvidence(t,m);if(t.zone==='forest')for(const p of SURVEY_POINTS)if(p.kind==='walk'&&this.position.distanceTo(v(p.x,p.y))<p.radius/40)m.record(p.id);if(m.version!==this.lastVersion){this.lastVersion=m.version;this.persist();}}
 context():JourneyContext|null{
  const t=this.trial(),p=this.position,near=(x:number,y:number,r=2.2)=>p.distanceTo(v(x,y))<r;
  if(t.zone==='forest'){
   for(const [i,s]of SURVEY_POINTS.entries())if(s.kind==='scan'&&near(s.x,s.y,1.9))return{kind:'survey',id:i,name:`Analisar ${s.name.toLocaleLowerCase()}`};
   if(t.mechanism&&near(1870,245,3.2))return{kind:'descent',id:0,name:'Descer às Cavernas de Dante'};
  }
  for(const [i,s]of SITES.entries())if(t.zone===s.area&&near(s.x,s.y,1.9))return{kind:'regional',id:i,name:`${this.m.has(s.id)?'Rever':'Analisar'} ${s.name.toLocaleLowerCase()}`};
  if(t.zone==='cavern'){
   if(near(CAVE.entry.x,CAVE.entry.y))return{kind:'ascent',id:0,name:'Subir para a Floresta de Dante'};
   const points=[['depth',CAVE.depth,'Investigar a abertura às profundezas'],['deepSignal',CAVE.signal,'Analisar o sinal sob a pedra'],['fragment',CAVE.fragment,'Examinar o fragmento exterior'],['firstEcho',CAVE.echo,'Investigar o Primeiro Eco'],['threshold',CAVE.threshold,'Investigar o limiar do Guardião']]as const;
   for(const [kind,s,name]of points)if(near(s.x,s.y,kind==='depth'?2.5:2.4))return{kind,id:0,name};
   if(t.journey.gate&&near(6310,740,2.6))return{kind:'bossGate',id:0,name:'Entrar no Domínio do Guardião'};
  }
  if(t.zone==='warden'&&near(540,760,2.2))return{kind:'arenaReturn',id:0,name:t.journey.warden?'Voltar às cavernas':'Retornar antes do confronto'};
  return null;
 }
 interact(c:JourneyContext,bossFighting:boolean){const t=this.trial(),j=t.journey;
  if(c.kind==='survey'){const p=SURVEY_POINTS[c.id];record(t,this.m,p.id);this.dialogue(p.name,p.id==='water'?'A umidade se acumula entre raízes, separada da nascente profunda. A leitura registra sedimentos e uma película viva. Lia precisa comparar a composição antes de usar essa água.':'As folhas se contraem quando a raiz vibra. O registro distingue a reação da planta dos movimentos das criaturas próximas.','LEITURA REGISTRADA');}
  else if(c.kind==='regional'){const s=SITES[c.id];record(t,this.m,s.id);this.dialogue(s.name,s.finding,'PESQUISA DE CAMPO');}
  else if(c.kind==='descent'){if(t.mechanism)this.zone('cavern');}
  else if(c.kind==='ascent')this.zone('forest',v(1870,355));
  else if(c.kind==='arenaReturn'){if(bossFighting){this.notify('O limiar se fechou durante o confronto.');return;}this.zone('cavern',v(6230,740));}
  else if(c.kind==='bossGate'){if(j.gate)this.zone('warden');}
  else if(c.kind==='depth'){j.depth=true;j.checkpoint='depth';this.dialogue('As profundezas','O sinal continua além da fratura. As inscrições não fecham a passagem por causa das criaturas; há uma rota entre os pilares e uma câmara mineral ao sul.','CAMINHO REVELADO');}
  else if(c.kind==='deepSignal'){if(!j.depth)return;j.deepSignal=true;this.dialogue('O que corre sob a pedra','A rede atravessa a parede e segue a leste. O conduto transportava mais do que energia: as marcas indicam circulação e reparos antigos.','LEITURA DAS PROFUNDEZAS');}
  else if(c.kind==='fragment'){if(!j.deepSignal)return;j.fragment=true;j.checkpoint='exterior';this.dialogue('Fragmento exterior','Um vestígio sob a camada mineral responde à sua aproximação. O mesmo padrão reaparece além da subida, na estrutura do Primeiro Eco.','FRAGMENTO EXAMINADO');}
  else if(c.kind==='firstEcho'){if(!j.fragment){this.notify('Examine primeiro o fragmento na câmara anterior.');return;}j.firstEcho=true;j.checkpoint='echo';this.dialogue('Primeiro Eco',W.revelation+'\n\n'+W.confirmation+'\n\nAs inscrições apontam para o limiar a leste.','ORIGEM DO SINAL');}
  else if(c.kind==='threshold'){if(!j.firstEcho){this.notify('O Primeiro Eco ainda precisa responder.');return;}j.gate=true;this.dialogue('Limiar do Guardião','A estrutura se abre. Algo pesado se move além da pedra. Entre pela passagem a leste quando estiver pronto.','DOMÍNIO DO GUARDIÃO');}
  this.persist();
 }
 npc(index:number){const n=NPCS[index],npc=index===0?'medic':index===1?'smith':index===2?'expedition':undefined;this.dialogue(n.name,n.text,n.role);const container=document.createElement('div');container.id='quest-actions';container.className='quest-actions';
  if(npc)for(const q of QUESTS.filter(q=>q.npc===npc)){const status=this.m.status(q.id);if(status==='locked'||status==='completed')continue;const b=document.createElement('button');b.textContent=(status==='ready'?'✓ Entregar: ':status==='available'?'! Missão: ':'◈ Acompanhar: ')+q.title;b.dataset.quest=q.id;b.onclick=()=>this.quest(q.id);container.append(b);}
  if(index===0){const t=this.trial(),heal=document.createElement('button'),buy=document.createElement('button');heal.textContent='RESTAURAR VIDA · GRATUITO';heal.disabled=t.hp>=maxHp(t.hero!.classId);heal.onclick=()=>{t.hp=maxHp(t.hero!.classId);this.persist();this.notify('Vida restaurada na enfermaria.');this.npc(index);};buy.textContent=`COMPRAR POÇÃO · ${POTION_PRICE} CRÉDITOS · ${t.journey.credits} disponíveis`;buy.disabled=t.journey.credits<POTION_PRICE||t.potions>=3;buy.onclick=()=>{if(t.journey.credits<POTION_PRICE||t.potions>=3)return;t.journey.credits-=POTION_PRICE;t.journey.spent+=POTION_PRICE;t.potions++;this.persist();this.npc(index);};container.append(heal,buy);}
  el('dialog').insertBefore(container,el('dialog-close'));
 }
 private quest(id:MissionId){const q=missionById(id),status=this.m.status(id);this.dialogue(q.title,(status==='ready'?q.report:status==='available'?q.offer:q.goals.map(g=>(this.m.has(g.id)?'✓ ':'○ ')+g.label)).join('\n\n'),NPC_NAMES[q.npc]);const container=document.createElement('div');container.id='quest-actions';container.className='quest-actions';const action=document.createElement('button');action.className='primary';action.dataset.action=status==='ready'?'deliver':status==='available'?'accept':'track';action.dataset.quest=id;action.textContent=status==='ready'?`ENTREGAR · ${q.credits} CRÉDITOS`:status==='available'?'ACEITAR MISSÃO':'RASTREAR MISSÃO';action.onclick=()=>{
   if(status==='available')this.m.act('accept',id);else if(status==='ready'){this.m.act('deliver',id);const reward=this.m.claimable(this.trial().journey.receipts);this.trial().journey.receipts.push(...reward.ids);this.trial().journey.credits+=reward.credits;this.notify(`Relatório entregue · +${reward.credits} créditos 3D.`);}else this.m.tracked=id;
   this.persist();(el('dialog')as HTMLDialogElement).close();
  };container.append(action);el('dialog').insertBefore(container,el('dialog-close'));
 }
 journal(){const d=el('journal')as HTMLDialogElement;if(d.open){d.close();return;}el('quest-list').replaceChildren();const m=this.m;for(const q of QUESTS){const status=m.status(q.id),row=document.createElement('article');row.className='quest-card';const title=document.createElement('h3');title.textContent=q.title;const detail=document.createElement('p');detail.textContent=status==='locked'?`Conclua ${missionById(q.requires!).title} para receber este relatório.`:status==='available'?`Converse com ${NPC_NAMES[q.npc]} no acampamento.`:q.goals.map(g=>(m.has(g.id)?'✓ ':'○ ')+g.label).join('\n');row.append(title,detail);const b=document.createElement('button');b.textContent=status==='completed'?'✓ Entregue':currentQuest(m)===q.id?'◈ Rastreando':status==='locked'?'Ainda indisponível':'Rastrear';b.disabled=status==='completed'||status==='locked';b.dataset.track=q.id;b.setAttribute('aria-pressed',String(currentQuest(m)===q.id));b.onclick=()=>{m.tracked=q.id;this.persist();d.close();};row.append(b);el('quest-list').append(row);}
  el('quest-balance').textContent=`${this.trial().journey.credits} créditos em relatórios 3D · recompensas únicas por personagem.`;el('quest-untrack').onclick=()=>{m.tracked=null;this.persist();d.close();};d.showModal();
 }
 update(camera?:T.Camera){const t=this.trial(),m=this.m,target=questTarget(t,m),id=currentQuest(m);el('zone-name').textContent=ZONE_NAMES[t.zone];el('goal').textContent=id?missionById(id).title:t.journey.warden?'O limiar está seguro':'Exploração';
  if(!target){el('objective').textContent='Abra o diário para escolher uma missão.';this.beacon.visible=false;return;}
  const route=routeTarget(t,target),distance=Math.round(this.position.distanceTo(v(route.x,route.y)));el('objective').textContent=`${target.name}${target.zone!==t.zone?' · '+ZONE_NAMES[target.zone]:''}\n${route.instruction}`;el('navigation-name').textContent=`${route.name} · ${distance} m`;this.beacon.visible=route.zone===t.zone&&distance<35;this.beacon.position.copy(v(route.x,route.y)).setY(.055);
  if(camera){const d=v(route.x,route.y).sub(this.position),forward=this.position.clone().sub(camera.position).setY(0).normalize(),right=new T.Vector3(-forward.z,0,forward.x),angle=Math.atan2(d.dot(right),d.dot(forward));el('navigation-arrow').style.transform=`rotate(${angle}rad)`;}
 }
 marker(index:number){const npc=index===0?'medic':index===1?'smith':index===2?'expedition':undefined;if(!npc)return'';const states=QUESTS.filter(q=>q.npc===npc).map(q=>this.m.status(q.id));return states.includes('ready')?'✓ ':states.includes('available')?'! ':'';}
 inspect(){const m=this.m,t=this.trial(),target=questTarget(t,m);return{current:currentQuest(m)??null,target:target??null,route:target?routeTarget(t,target):null,quests:QUESTS.map(q=>({id:q.id,status:m.status(q.id),goals:q.goals.map(g=>({id:g.id,done:m.has(g.id)}))})),snapshot:m.snapshot()};}
 dispose(){this.beacon.removeFromParent();this.beacon.geometry.dispose();this.beacon.material.dispose();}
}
