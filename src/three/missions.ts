import type {BiomeId} from './biomes';
import type {SpeciesId} from './creatures';
import type {Look} from './character';
import {shelterPoint,shuttlePoint,type NpcDef} from './camp';
import {EXPEDITIONS} from './expeditions';

// Story missions of the 2D expedition, carried into the 3D regions. Same people, same words;
// goals are places to reach, readings to take and the guardians that hold each region.
export type NpcId='nara'|'lia'|'ivo';
export type GoalKind='visit'|'scan'|'boss';
// place: the goal sits on free ground near x/z (placed when the region is built)
export interface Goal{id:string;label:string;biome:BiomeId;kind:GoalKind;x:number;z:number;after?:string[];boss?:SpeciesId;finding?:string;art?:string;place?:boolean}
// side: a regional expedition (expeditions.ts), worked on beside the story mission
export interface Mission{id:string;title:string;npc:NpcId;credits:number;offer:string[];report:string[];goals:Goal[];requires?:string;side?:boolean;region?:BiomeId}

export const NPC_INFO:Record<NpcId,{name:string;service:string;portrait:string}>={
 nara:{name:'Nara',service:'Expedições e cofre',portrait:'assets/base/base-expedition-civilian.png'},
 lia:{name:'Dra. Lia',service:'Enfermaria e suprimentos',portrait:'assets/base/base-medic-civilian.png'},
 ivo:{name:'Ivo',service:'Oficina e fabricação',portrait:'assets/base/base-smith-civilian.png'},
};

// Journey order: the forest and its depths up to the Warden, the three guardians of the outer regions (sirocco,
// frost, caldera), then water and the caravan route. Ids are kept so saved progress still counts.
export const MISSIONS:Mission[]=[
 {id:'recon',title:'Primeiro reconhecimento',npc:'nara',credits:20,
  offer:['A nave trouxe quem ainda podíamos salvar. Para receber mais gente, precisamos conhecer o terreno.','Reconheça a clareira e a trilha das raízes ao redor do acampamento. Registre uma rota de ida e volte para me contar o que encontrou.'],
  report:['Temos uma rota inicial e sabemos onde as criaturas circulam. Vou manter os civis junto da nave.','Lia precisa analisar água e atividade biológica antes de planejarmos qualquer permanência.'],
  goals:[{id:'clearing',label:'Reconhecer a clareira',biome:'camp',kind:'visit',x:25,z:-17},{id:'roots',label:'Reconhecer a trilha das raízes',biome:'camp',kind:'visit',x:-26,z:-13}]},
 {id:'survival',title:'Condições de sobrevivência',npc:'lia',requires:'recon',credits:30,
  offer:['Dante parece vivo, mas ainda sabemos pouco sobre o que pode nos sustentar.','Siga pelo portal norte até as Profundezas da floresta. Analise a umidade acumulada nas raízes e registre a atividade biológica. Traga as leituras para a enfermaria.'],
  report:['As leituras confirmam água superficial e atividade biológica. Vou estudar a compatibilidade com o que trouxemos.','Ainda precisamos de uma fonte estável para um abrigo. Ivo está investigando outra parte do seu relatório: os vestígios luminosos.'],
  goals:[{id:'water',label:'Analisar a umidade nas raízes',biome:'domain',kind:'scan',x:-27,z:16},{id:'biology',label:'Registrar atividade biológica',biome:'domain',kind:'scan',x:26,z:20}]},
 {id:'signal',title:'Energia desconhecida',npc:'ivo',requires:'survival',credits:40,
  offer:['Os vestígios não parecem isolados. O equipamento registrou o mesmo padrão em pontos diferentes das Profundezas.','Investigue os três Ecos e a estrutura junto da fissura, na borda do círculo de pedra. Quero saber se o mecanismo responde ao conjunto.'],
  report:['O mecanismo respondeu aos Ecos. Há uma ligação entre o que vimos na superfície e as estruturas sob a rocha.','Não vou conectar os sistemas da nave a essa energia. Nara precisa do seu relatório antes de enviar a equipe mais fundo.'],
  goals:[{id:'echo1',label:'Investigar o primeiro Eco',biome:'domain',kind:'scan',x:-31,z:-6},{id:'echo2',label:'Investigar o segundo Eco',biome:'domain',kind:'scan',x:30,z:-10},{id:'echo3',label:'Investigar o terceiro Eco',biome:'domain',kind:'scan',x:-19,z:-27},
   {id:'passage',label:'Ativar o mecanismo da fissura',biome:'domain',kind:'scan',x:0,z:-25,after:['echo1','echo2','echo3']}]},
 {id:'beyond',title:'Além da fissura',npc:'nara',requires:'signal',credits:60,
  offer:['A passagem está aberta. Se existe algo capaz de responder à nossa presença, precisamos entender seus limites.','Siga o sinal até o centro do círculo de pedra. Investigue o que houver além e volte com um relatório; os civis dependem de uma rota segura.'],
  report:['Um arquivo ancestral reconheceu uma assinatura humana, mas sua data e origem continuam ilegíveis. Isso exige mais investigação.','A travessia abriu possibilidades. Ivo detectou o mesmo padrão dos Ecos além das Profundezas, sob as dunas do Siroco.'],
  goals:[{id:'origin',label:'Investigar a origem do sinal',biome:'domain',kind:'scan',x:0,z:-9},{id:'warden',label:'Confirmar a segurança além do limiar',biome:'domain',kind:'boss',x:0,z:0,boss:'warden',after:['origin']}]},
 {id:'dunes',title:'Sob a pele das dunas',npc:'ivo',requires:'beyond',credits:80,
  offer:['Com o Guardião vencido, o portal além das Profundezas leva à Bacia do Siroco. A crista divide a aproximação: por cima há uma borda firme; por baixo, um canal expõe partes de uma estrutura soterrada.','Registre a encosta norte e examine as nervuras junto da depressão. Se a areia vibrar, afaste-se do centro.'],
  report:['O caminho alto oferece visão e uma entrada pelas ruínas. A carga deve acompanhar a borda firme.','O Soterrado não guarda mais a depressão. As ruínas sob a areia falam a mesma língua dos Ecos.'],
  goals:[{id:'ridge',label:'Registrar a encosta norte',biome:'dunes',kind:'scan',x:-14,z:-18},{id:'ribs',label:'Examinar as nervuras da depressão',biome:'dunes',kind:'scan',x:13,z:-11},
   {id:'soterrado',label:'Enfrentar o Soterrado',biome:'dunes',kind:'boss',x:0,z:-14,boss:'soterrado',after:['ridge','ribs']}]},
 {id:'frost',title:'Um abrigo contra a geada',npc:'lia',requires:'dunes',credits:70,
  offer:['Além das dunas, o frio ameaça quem transporta água e suprimentos. Precisamos distinguir abrigo de uma encosta apenas bonita.','Na Fratura Boreal, compare o olho de água morna e os líquens das fissuras. Dizem que algo branco sopra sobre o gelo; volte viva.'],
  report:['A face protegida conserva calor e os líquens revelam fissuras mornas. A encosta aberta exige ancoragem.','Vésper não sopra mais sobre a fratura. Vamos marcar o abrigo para a próxima caravana.'],
  goals:[{id:'warmwater',label:'Analisar o olho de água morna',biome:'frost',kind:'scan',x:-13,z:-14},{id:'lichen',label:'Registrar os líquens das fissuras',biome:'frost',kind:'scan',x:15,z:-8},
   {id:'vesper',label:'Enfrentar Vésper, o Sopro Branco',biome:'frost',kind:'boss',x:0,z:-16,boss:'vesper',after:['warmwater','lichen']}]},
 {id:'forges',title:'Antes de acender as forjas',npc:'ivo',requires:'frost',credits:90,
  offer:['O frio do relatório mostrou a falta de energia confiável. A Caldeira de Dante guarda calor que pode servir, mas algo vigia as forjas.','Registre o calor da margem interna e as marcas antes do limiar. Depois confirme o que guarda a caldeira. Não fique sobre a lava.'],
  report:['O pátio comporta uma patrulha leve com isolamento nos pés. O calor pode alimentar a oficina sem tocar nas estruturas originais.','O Incandescente caiu. Pela primeira vez, uma fonte de energia em Dante não depende só da nave. Agora Lia precisa de água estável para o primeiro abrigo.'],
  goals:[{id:'heat',label:'Registrar o calor da margem interna',biome:'caldera',kind:'scan',x:-15,z:-12},{id:'marks',label:'Examinar as marcas antes do limiar',biome:'caldera',kind:'scan',x:15,z:-15},
   {id:'titan',label:'Enfrentar o Incandescente',biome:'caldera',kind:'boss',x:0,z:-18,boss:'titan',after:['heat','marks']}]},
 {id:'source',title:'Água para permanecer',npc:'lia',requires:'forges',credits:45,
  offer:['Com as forjas acesas, o portal além da Caldeira leva à Bacia das Nascentes. Precisamos de uma fonte estável, não apenas de umidade no solo.','Investigue a nascente da bacia. Registre vazão e composição; a água ainda passará pelo nosso tratamento.'],
  report:['A nascente tem vazão suficiente para o módulo e pode alimentar o reservatório após filtragem.','Uma fonte de água nos dá uma possibilidade real de permanecer. Nara quer planejar a travessia do vale para as primeiras famílias.'],
  goals:[{id:'spring',label:'Analisar a nascente na nova bacia',biome:'springs',kind:'scan',x:-15,z:-10},{id:'flow',label:'Registrar a vazão e a composição',biome:'springs',kind:'scan',x:16,z:7}]},
 {id:'caravan',title:'Uma caravana atravessa o vale',npc:'nara',requires:'source',credits:50,
  offer:['As primeiras famílias não podem atravessar correndo como nossa equipe. Precisamos escolher onde parar a caravana sem ocupar o território das criaturas.','No Vale da Ressonância, registre o abrigo das cristas, a bacia de descanso e a margem da passagem oriental.'],
  report:['O abrigo das cristas protege uma parada curta. A bacia é firme nas bordas, mas o centro úmido deve ficar livre.','Marquei os pontos de apoio. Com água, energia e uma rota segura, as primeiras famílias podem deixar a nave.'],
  goals:[{id:'v-shelter',label:'Registrar o abrigo das cristas',biome:'valley',kind:'scan',x:-18,z:-6},{id:'v-basin',label:'Examinar a bacia de descanso',biome:'valley',kind:'scan',x:18,z:-12},{id:'v-pass',label:'Registrar a margem da passagem oriental',biome:'valley',kind:'scan',x:6,z:17}]},
 // the end of the 2D story (config/missions.ts): the Terraces of Dawn lie in the springs region of the 3D
 {id:'safe-route',title:'Uma rota segura',npc:'ivo',requires:'caravan',credits:55,
  offer:['A carga da nave inclui um módulo habitável, um reservatório e um canteiro de testes. Só precisamos de uma rota viável.','Confirme o acesso pela crista e a travessia inferior dos Terraços do Amanhecer. A caravana poderá evitar as margens ocupadas.'],
  report:['Os dois acessos foram registrados. Podemos escolher a passagem conforme a atividade das criaturas.','Separei a carga do primeiro abrigo. Nara precisa aprovar o terreno antes de enviarmos os primeiros colonos.'],
  goals:[{id:'route-west',label:'Confirmar o acesso pela crista',biome:'springs',kind:'scan',x:-26,z:-2,place:true},{id:'route-east',label:'Confirmar a travessia inferior',biome:'springs',kind:'scan',x:22,z:-28,place:true}]},
 {id:'shelter',title:'O primeiro abrigo',npc:'nara',requires:'safe-route',credits:75,
  offer:['Temos água e uma rota. Agora precisamos de um lugar onde as primeiras famílias possam ficar.','Analise o solo e confirme o local nos terraços. Depois instale o módulo reservado da expedição. A carga já está separada; não precisa fabricar nem comprar.'],
  report:['O módulo está instalado, com reservatório e um canteiro experimental. Os primeiros colonos chegaram.','Ainda somos poucos. Mas Dante já não é só um ponto no mapa: alguém vai chamar este lugar de casa.'],
  goals:[{id:'soil',label:'Analisar o solo dos terraços',biome:'springs',kind:'scan',x:8,z:-20,place:true},{id:'site',label:'Validar o local do abrigo',biome:'springs',kind:'scan',x:20,z:-17,place:true,after:['soil']},
   {id:'shelter-built',label:'Instalar o módulo da expedição',biome:'springs',kind:'scan',x:20,z:-17,place:true,after:['site']}]},
];
export {EXPEDITIONS};
export const ALL_MISSIONS:Mission[]=[...MISSIONS,...EXPEDITIONS];
export const missionById=(id:string)=>ALL_MISSIONS.find(m=>m.id===id)!;

// people of the base: the three services (2D portraits and roles) and two settlers
const L=(o:Partial<Look>):Look=>({sex:'female',skin:2,hair:'long01',hairColor:0,brows:'eyebrow005',outfit:'work',cloth:1,weapon:'saber',helmet:false,...o});
const at=(k:'medic'|'smith'|'expedition',x:number,z:number):[number,number]=>{const p=shelterPoint(k,x,z);return[p.x,p.z];};
const face=(k:'medic'|'smith'|'expedition',a:number)=>{const p=shelterPoint(k,0,0);return p.ry+a;};
export const NPCS:NpcDef[]=[
 {id:'nara',npc:'nara',name:'Nara',role:'Expedições e cofre',look:L({skin:2,hair:'ponytail01',hairColor:0,tint:'#5a5a40',garb:'jacket'}),at:at('expedition',1.7,2.1),face:face('expedition',.2),anim:'Idle_Loop',hold:'tablet'},
 {id:'lia',npc:'lia',name:'Dra. Lia',role:'Enfermaria e suprimentos',look:L({skin:4,hair:'short03',hairColor:0,tint:'#5a5a46',garb:'coat'}),at:at('medic',1.5,2.1),face:face('medic',.1),anim:'Idle_Loop',hold:'tablet'},
 {id:'ivo',npc:'ivo',name:'Ivo',role:'Oficina e fabricação',look:L({sex:'male',skin:1,hair:'none',hairColor:4,brows:'eyebrow009',tint:'#56603e',garb:'apron'}),at:at('smith',2.3,2.2),face:face('smith',-.5),anim:'Idle_Loop',hold:'wrench'},
 {id:'elisa',name:'Elisa',role:'Mudas da nave',look:L({skin:1,hair:'braid01',hairColor:2,tint:'#6f7a5a'}),at:[-9,-4],face:0,anim:'Idle_Loop',route:[[-9,-4],[-12.2,-4.5],[-11,-1.5]],
  lines:['As mudas vieram da nave. Estou separando o que podemos levar para o canteiro sem misturar com as plantas de Dante.']},
 {id:'gui',name:'Tio Gui',role:'Infraestrutura',look:L({sex:'male',skin:3,hair:'short04',hairColor:4,tint:'#4f5560'}),at:(()=>{const p=shuttlePoint(3.6,2.6);return[p.x,p.z] as [number,number];})(),face:Math.PI*.85,anim:'Interact',
  lines:['Estou ajustando as conexões do kit do abrigo. Quando a rota estiver pronta, levo tudo para os Terraços.','Água e energia ficam em circuitos separados; Ivo não abre mão disso.']},
];

// ---------- progress (saved on this device) ----------
export type Status='locked'|'available'|'active'|'ready'|'completed';
export class Journal{
 // active: the story mission; side: the regional expedition taken beside it
 active:string|null=null;side:string|null=null;done=new Set<string>();goals=new Set<string>();credits=0;bosses=new Set<string>();
 // one journal per saved character; without a key (preview) it lives only in memory
 constructor(private key:string|null=null){if(!key)return;try{const s=JSON.parse(localStorage.getItem(key)??'null');if(s){this.active=s.active;this.side=s.side??null;this.done=new Set(s.done);this.goals=new Set(s.goals);this.credits=s.credits??0;this.bosses=new Set(s.bosses??[]);}}catch{/* private mode */}
  if(this.active&&!MISSIONS.some(m=>m.id===this.active))this.active=null;if(this.side&&!EXPEDITIONS.some(m=>m.id===this.side))this.side=null;}
 save(){if(!this.key)return;try{localStorage.setItem(this.key,JSON.stringify({active:this.active,side:this.side,done:[...this.done],goals:[...this.goals],credits:this.credits,bosses:[...this.bosses]}));}catch{/* ignore */}}
 // a guardian counts as beaten when it fell in a fight or its mission goal was completed
 beaten(kind:string){return this.bosses.has(kind)||this.goals.has(kind);}
 beat(kind:string){if(this.bosses.has(kind))return;this.bosses.add(kind);this.save();}
 status(id:string):Status{
  const m=missionById(id);if(this.done.has(id))return'completed';
  const slot=m.side?this.side:this.active;
  if(slot===id)return m.goals.every(g=>this.goals.has(g.id))?'ready':'active';
  if(slot)return'locked';
  return!m.requires||this.done.has(m.requires)?'available':'locked';
 }
 offerFor(npc:NpcId){return MISSIONS.find(m=>m.npc===npc&&['available','active','ready'].includes(this.status(m.id)))??null;}
 sideOfferFor(npc:NpcId){return EXPEDITIONS.find(m=>m.npc===npc&&['available','active','ready'].includes(this.status(m.id)))??null;}
 /** everything this person has to say about missions: the story first, then an expedition */
 offersFor(npc:NpcId){return[this.offerFor(npc),this.sideOfferFor(npc)].filter((m):m is Mission=>!!m);}
 marker(npc:NpcId):'!'|'?'|''{const st=this.offersFor(npc).map(m=>this.status(m.id));return st.includes('ready')?'?':st.includes('available')?'!':'';}
 current(){return this.active?missionById(this.active):null;}
 sideCurrent(){return this.side?missionById(this.side):null;}
 // goals that can be worked on now (their prerequisites are done), of the story mission and of the expedition
 open(){return[this.current(),this.sideCurrent()].flatMap(m=>m?m.goals.filter(g=>!this.goals.has(g.id)&&(g.after??[]).every(a=>this.goals.has(a))):[]);}
 accept(id:string){if(this.status(id)!=='available')return false;if(missionById(id).side)this.side=id;else this.active=id;this.save();return true;}
 deliver(id:string){if(this.status(id)!=='ready')return 0;const m=missionById(id);this.done.add(id);if(m.side)this.side=null;else this.active=null;this.credits+=m.credits;this.save();return m.credits;}
 /** findings kept from the discoveries already registered (Records of Dante) */
 records(){return EXPEDITIONS.flatMap(m=>m.goals.filter(g=>g.finding&&this.goals.has(g.id)).map(g=>({mission:m,goal:g})));}
 complete(goal:string){if(this.goals.has(goal))return false;this.goals.add(goal);this.save();return true;}
 // a region boss wakes when the mission readings that lead to it are complete
 bossCalled(biome:BiomeId){return this.open().some(g=>g.kind==='boss'&&g.biome===biome);}
 reset(){this.active=null;this.side=null;this.done.clear();this.goals.clear();this.bosses.clear();this.credits=0;this.save();}
}
