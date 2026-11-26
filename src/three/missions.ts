import type {BiomeId} from './biomes';
import type {SpeciesId} from './creatures';
import type {Look} from './character';
import {shelterPoint,shuttlePoint,type NpcDef} from './camp';

// Story missions of the 2D expedition, carried into the 3D regions. Same people, same words;
// goals are places to reach, readings to take and the guardians that hold each region.
export type NpcId='nara'|'lia'|'ivo';
export type GoalKind='visit'|'scan'|'boss';
export interface Goal{id:string;label:string;biome:BiomeId;kind:GoalKind;x:number;z:number;after?:string[];boss?:SpeciesId}
export interface Mission{id:string;title:string;npc:NpcId;credits:number;offer:string[];report:string[];goals:Goal[];requires?:string}

export const NPC_INFO:Record<NpcId,{name:string;service:string;portrait:string}>={
 nara:{name:'Nara',service:'Expedições e cofre',portrait:'assets/base/base-expedition-civilian.png'},
 lia:{name:'Dra. Lia',service:'Enfermaria e suprimentos',portrait:'assets/base/base-medic-civilian.png'},
 ivo:{name:'Ivo',service:'Oficina e fabricação',portrait:'assets/base/base-smith-civilian.png'},
};

export const MISSIONS:Mission[]=[
 {id:'recon',title:'Primeiro reconhecimento',npc:'nara',credits:20,
  offer:['A nave trouxe quem ainda podíamos salvar. Para receber mais gente, precisamos conhecer o terreno.','Reconheça a clareira e a trilha das raízes ao redor do acampamento. Registre uma rota de ida e volte para me contar o que encontrou.'],
  report:['Temos uma rota inicial e sabemos onde as criaturas circulam. Vou manter os civis junto da nave.','Lia precisa analisar água e atividade biológica antes de planejarmos qualquer permanência.'],
  goals:[{id:'clearing',label:'Reconhecer a clareira',biome:'camp',kind:'visit',x:25,z:-17},{id:'roots',label:'Reconhecer a trilha das raízes',biome:'camp',kind:'visit',x:-26,z:-13}]},
 {id:'survival',title:'Condições de sobrevivência',npc:'lia',requires:'recon',credits:30,
  offer:['Dante parece vivo, mas ainda sabemos pouco sobre o que pode nos sustentar.','Siga pelo portal norte até a Bacia das Nascentes. Analise a umidade acumulada nas raízes e registre a atividade biológica. Traga as leituras para a enfermaria.'],
  report:['As leituras confirmam água superficial e atividade biológica. Vou estudar a compatibilidade com o que trouxemos.','Ainda precisamos de uma fonte estável para um abrigo. Ivo está investigando outra parte do seu relatório: os vestígios luminosos.'],
  goals:[{id:'water',label:'Analisar a umidade nas raízes',biome:'springs',kind:'scan',x:-15,z:-10},{id:'biology',label:'Registrar atividade biológica',biome:'springs',kind:'scan',x:16,z:7}]},
 {id:'signal',title:'Energia desconhecida',npc:'ivo',requires:'survival',credits:40,
  offer:['Os vestígios não parecem isolados. O equipamento registrou o mesmo padrão em pontos diferentes do Vale da Ressonância.','Investigue os três Ecos e a estrutura junto da fissura. Quero saber se o mecanismo responde ao conjunto.'],
  report:['O mecanismo respondeu aos Ecos. Há uma ligação entre o que vimos na superfície e as estruturas sob a rocha.','Não vou conectar os sistemas da nave a essa energia. Nara precisa do seu relatório antes de enviar a equipe mais fundo.'],
  goals:[{id:'echo1',label:'Investigar o primeiro Eco',biome:'valley',kind:'scan',x:-18,z:-6},{id:'echo2',label:'Investigar o segundo Eco',biome:'valley',kind:'scan',x:18,z:-12},{id:'echo3',label:'Investigar o terceiro Eco',biome:'valley',kind:'scan',x:6,z:17},
   {id:'passage',label:'Ativar o mecanismo da fissura',biome:'valley',kind:'scan',x:0,z:-22,after:['echo1','echo2','echo3']}]},
 {id:'forges',title:'Antes de acender as forjas',npc:'ivo',requires:'signal',credits:60,
  offer:['O frio do relatório mostrou a falta de energia confiável. A Caldeira de Dante guarda calor que pode servir, mas algo vigia as forjas.','Registre o calor da margem interna e as marcas antes do limiar. Depois confirme o que guarda a caldeira. Não fique sobre a lava.'],
  report:['O pátio comporta uma patrulha leve com isolamento nos pés. O calor pode alimentar a oficina sem tocar nas estruturas originais.','O Incandescente caiu. Pela primeira vez, uma fonte de energia em Dante não depende só da nave.'],
  goals:[{id:'heat',label:'Registrar o calor da margem interna',biome:'caldera',kind:'scan',x:-15,z:-12},{id:'marks',label:'Examinar as marcas antes do limiar',biome:'caldera',kind:'scan',x:15,z:-15},
   {id:'titan',label:'Enfrentar o Incandescente',biome:'caldera',kind:'boss',x:0,z:-18,boss:'titan',after:['heat','marks']}]},
 {id:'frost',title:'Um abrigo contra a geada',npc:'lia',requires:'forges',credits:70,
  offer:['Além da caldeira, o frio ameaça quem transporta água e suprimentos. Precisamos distinguir abrigo de uma encosta apenas bonita.','Na Fratura Boreal, compare o olho de água morna e os líquens das fissuras. Dizem que algo branco sopra sobre o gelo; volte viva.'],
  report:['A face protegida conserva calor e os líquens revelam fissuras mornas. A encosta aberta exige ancoragem.','Vésper não sopra mais sobre a fratura. Vamos marcar o abrigo para a próxima caravana.'],
  goals:[{id:'warmwater',label:'Analisar o olho de água morna',biome:'frost',kind:'scan',x:-13,z:-14},{id:'lichen',label:'Registrar os líquens das fissuras',biome:'frost',kind:'scan',x:15,z:-8},
   {id:'vesper',label:'Enfrentar Vésper, o Sopro Branco',biome:'frost',kind:'boss',x:0,z:-16,boss:'vesper',after:['warmwater','lichen']}]},
 {id:'dunes',title:'Sob a pele das dunas',npc:'ivo',requires:'frost',credits:80,
  offer:['A crista divide a aproximação: por cima há uma borda firme; por baixo, um canal expõe partes de uma estrutura soterrada.','Registre a encosta norte e examine as nervuras junto da depressão. Se a areia vibrar, afaste-se do centro.'],
  report:['O caminho alto oferece visão e uma entrada pelas ruínas. A carga deve acompanhar a borda firme.','O Soterrado não guarda mais a depressão. As ruínas sob a areia falam a mesma língua dos Ecos.'],
  goals:[{id:'ridge',label:'Registrar a encosta norte',biome:'dunes',kind:'scan',x:-14,z:-18},{id:'ribs',label:'Examinar as nervuras da depressão',biome:'dunes',kind:'scan',x:13,z:-11},
   {id:'soterrado',label:'Enfrentar o Soterrado',biome:'dunes',kind:'boss',x:0,z:-14,boss:'soterrado',after:['ridge','ribs']}]},
 {id:'beyond',title:'Além da fissura',npc:'nara',requires:'dunes',credits:120,
  offer:['Todos os sinais apontam para o mesmo lugar. Se existe algo capaz de responder à nossa presença, precisamos entender seus limites.','Siga o sinal até o Domínio do Guardião. Investigue o que houver além e volte com um relatório; os civis dependem de uma rota segura.'],
  report:['Um arquivo ancestral reconheceu uma assinatura humana, mas sua data e origem continuam ilegíveis. Isso exige mais investigação.','A travessia abriu possibilidades. Dante já não é só um ponto no mapa: alguém vai chamar este lugar de casa.'],
  goals:[{id:'origin',label:'Investigar a origem do sinal',biome:'domain',kind:'scan',x:0,z:-12},{id:'warden',label:'Confirmar a segurança além do limiar',biome:'domain',kind:'boss',x:0,z:0,boss:'warden'}]},
];
export const missionById=(id:string)=>MISSIONS.find(m=>m.id===id)!;

// people of the base: the three services (2D portraits and roles) and two settlers
const L=(o:Partial<Look>):Look=>({sex:'female',skin:2,hair:'long01',hairColor:0,brows:'eyebrow005',outfit:'work',cloth:1,weapon:'saber',helmet:false,...o});
const at=(k:'medic'|'smith'|'expedition',x:number,z:number):[number,number]=>{const p=shelterPoint(k,x,z);return[p.x,p.z];};
const face=(k:'medic'|'smith'|'expedition',a:number)=>{const p=shelterPoint(k,0,0);return p.ry+a;};
export const NPCS:NpcDef[]=[
 {id:'nara',npc:'nara',name:'Nara',role:'Expedições e cofre',look:L({skin:2,hair:'ponytail01',hairColor:0,tint:'#8f7c58'}),at:at('expedition',1.7,2.1),face:face('expedition',.2),anim:'Idle_Loop',hold:'tablet'},
 {id:'lia',npc:'lia',name:'Dra. Lia',role:'Enfermaria e suprimentos',look:L({skin:4,hair:'short03',hairColor:0,tint:'#d9d3c3'}),at:at('medic',1.5,2.1),face:face('medic',.1),anim:'Idle_Loop',hold:'tablet'},
 {id:'ivo',npc:'ivo',name:'Ivo',role:'Oficina e fabricação',look:L({sex:'male',skin:1,hair:'none',hairColor:4,brows:'eyebrow009',tint:'#5d6646'}),at:at('smith',2.3,2.2),face:face('smith',-.5),anim:'Idle_Loop',hold:'wrench'},
 {id:'elisa',name:'Elisa',role:'Mudas da nave',look:L({skin:1,hair:'braid01',hairColor:2,tint:'#6f7a5a'}),at:[-9,-4],face:0,anim:'Idle_Loop',route:[[-9,-4],[-12.2,-4.5],[-11,-1.5]],
  lines:['As mudas vieram da nave. Estou separando o que podemos levar para o canteiro sem misturar com as plantas de Dante.']},
 {id:'gui',name:'Tio Gui',role:'Infraestrutura',look:L({sex:'male',skin:3,hair:'short04',hairColor:4,tint:'#4f5560'}),at:(()=>{const p=shuttlePoint(3.6,2.6);return[p.x,p.z] as [number,number];})(),face:Math.PI*.85,anim:'Interact',
  lines:['Estou ajustando as conexões do kit do abrigo. Quando a rota estiver pronta, levo tudo para os Terraços.','Água e energia ficam em circuitos separados; Ivo não abre mão disso.']},
];

// ---------- progress (saved on this device) ----------
export type Status='locked'|'available'|'active'|'ready'|'completed';
export class Journal{
 active:string|null=null;done=new Set<string>();goals=new Set<string>();credits=0;
 constructor(){try{const s=JSON.parse(localStorage.getItem('dante3d.missions')??'null');if(s){this.active=s.active;this.done=new Set(s.done);this.goals=new Set(s.goals);this.credits=s.credits??0;}}catch{/* private mode */}}
 save(){try{localStorage.setItem('dante3d.missions',JSON.stringify({active:this.active,done:[...this.done],goals:[...this.goals],credits:this.credits}));}catch{/* ignore */}}
 status(id:string):Status{
  const m=missionById(id);if(this.done.has(id))return'completed';
  if(this.active===id)return m.goals.every(g=>this.goals.has(g.id))?'ready':'active';
  if(this.active)return'locked';
  return!m.requires||this.done.has(m.requires)?'available':'locked';
 }
 offerFor(npc:NpcId){return MISSIONS.find(m=>m.npc===npc&&['available','active','ready'].includes(this.status(m.id)))??null;}
 marker(npc:NpcId):'!'|'?'|''{const m=this.offerFor(npc);if(!m)return'';const s=this.status(m.id);return s==='ready'?'?':s==='available'?'!':'';}
 current(){return this.active?missionById(this.active):null;}
 // goals that can be worked on now (their prerequisites are done)
 open(){const m=this.current();if(!m)return[];return m.goals.filter(g=>!this.goals.has(g.id)&&(g.after??[]).every(a=>this.goals.has(a)));}
 accept(id:string){if(this.status(id)!=='available')return false;this.active=id;this.save();return true;}
 deliver(id:string){if(this.status(id)!=='ready')return 0;const m=missionById(id);this.done.add(id);this.active=null;this.credits+=m.credits;this.save();return m.credits;}
 complete(goal:string){if(this.goals.has(goal))return false;this.goals.add(goal);this.save();return true;}
 // a region boss wakes when the mission readings that lead to it are complete
 bossCalled(biome:BiomeId){return this.open().some(g=>g.kind==='boss'&&g.biome===biome);}
 reset(){this.active=null;this.done.clear();this.goals.clear();this.credits=0;this.save();}
}
