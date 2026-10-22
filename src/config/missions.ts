import type {JourneyArea} from '../systems/LocalJourney';
import {REGIONAL_IDS,REGIONAL_EVIDENCE,REGIONAL_MISSIONS} from './regionalExpeditions';

export const MISSION_IDS=['recon','survival','signal','beyond','water-source','safe-route','shelter',...REGIONAL_IDS] as const;
export type MissionId=typeof MISSION_IDS[number];
export type MissionNpc='expedition'|'medic'|'smith';
export const MISSION_EVIDENCE=['clearing','roots','water','biology','echo1','echo2','echo3','passage','first-echo','warden','spring','route-west','route-east','soil','site','shelter-built',...REGIONAL_EVIDENCE] as const;
export type MissionEvidence=typeof MISSION_EVIDENCE[number];
export const NPC_NAMES:Record<MissionNpc,string>={expedition:'Nara',medic:'Dra. Lia',smith:'Ivo'};
export const NPC_SERVICES:Record<MissionNpc,string>={expedition:'Expedições e cofre',medic:'Enfermaria e suprimentos',smith:'Oficina e fabricação'};
export const SURVEY_POINTS=[
 {id:'clearing',name:'Clareira de reconhecimento',x:790,y:920,radius:140,kind:'walk'},
 {id:'roots',name:'Trilha das raízes',x:520,y:735,radius:120,kind:'walk'},
 {id:'water',name:'Umidade nas raízes',x:620,y:1080,radius:85,kind:'scan'},
 {id:'biology',name:'Atividade biológica',x:480,y:735,radius:85,kind:'scan'},
] as const;
export const ANALYSIS_POINTS=SURVEY_POINTS.filter(p=>p.kind==='scan');
export type MissionDefinition={id:MissionId;title:string;npc:MissionNpc;requires?:MissionId;unlock?:MissionEvidence;regional?:boolean;region?:JourneyArea;credits:number;offer:readonly string[];report:readonly string[];goals:readonly {id:MissionEvidence;label:string;area:JourneyArea}[]};
const STORY_MISSIONS:readonly MissionDefinition[]=[
 {id:'recon',title:'Primeiro reconhecimento',npc:'expedition',credits:20,
  offer:['A nave trouxe quem ainda podíamos salvar. Para receber mais gente, precisamos conhecer o terreno.','Reconheça a clareira e a trilha das raízes. Registre uma rota de ida e volte para me contar o que encontrou.'],
  report:['Temos uma rota inicial e sabemos onde as criaturas circulam. Vou manter os civis junto da nave.','Lia precisa analisar água e atividade biológica antes de planejarmos qualquer permanência.'],
  goals:[{id:'clearing',label:'Reconhecer a clareira',area:'forest'},{id:'roots',label:'Reconhecer a trilha das raízes',area:'forest'}]},
 {id:'survival',title:'Condições de sobrevivência',npc:'medic',requires:'recon',credits:30,
  offer:['Dante parece vivo, mas ainda sabemos pouco sobre o que pode nos sustentar.','Analise a umidade acumulada nas raízes e registre a atividade biológica. Traga as leituras para a enfermaria.'],
  report:['As leituras confirmam água superficial e atividade biológica. Vou estudar a compatibilidade com o que trouxemos.','Ainda precisamos de uma fonte estável para um abrigo. Ivo está investigando outra parte do seu relatório: os vestígios luminosos.'],
  goals:[{id:'water',label:'Analisar a umidade nas raízes',area:'forest'},{id:'biology',label:'Registrar atividade biológica',area:'forest'}]},
 {id:'signal',title:'Energia desconhecida',npc:'smith',requires:'survival',credits:40,
  offer:['Os vestígios não parecem isolados. O equipamento registrou o mesmo padrão em pontos diferentes.','Investigue os três Ecos e a estrutura junto da fissura. Quero saber se o mecanismo responde ao conjunto.'],
  report:['O mecanismo respondeu aos Ecos. Há uma ligação entre o que vimos na superfície e as estruturas sob a rocha.','Não vou conectar os sistemas da nave a essa energia. Nara precisa do seu relatório antes de enviar a equipe mais fundo.'],
  goals:[{id:'echo1',label:'Investigar o primeiro Eco',area:'forest'},{id:'echo2',label:'Investigar o segundo Eco',area:'forest'},{id:'echo3',label:'Investigar o terceiro Eco',area:'forest'},{id:'passage',label:'Ativar o mecanismo da fissura',area:'forest'}]},
 {id:'beyond',title:'Além da fissura',npc:'expedition',requires:'signal',credits:60,
  offer:['A passagem está aberta. Se existe algo capaz de responder à nossa presença, precisamos entender seus limites.','Siga o sinal pelas cavernas. Investigue o que houver além e volte com um relatório; os civis dependem de uma rota segura.'],
  report:['Um arquivo ancestral reconheceu uma assinatura humana, mas sua data e origem continuam ilegíveis. Isso exige mais investigação.','A travessia abriu possibilidades. Nosso próximo objetivo será encontrar água estável e terreno para o primeiro abrigo.'],
  goals:[{id:'first-echo',label:'Investigar a origem do sinal nas profundezas',area:'cavern'},{id:'warden',label:'Confirmar a segurança além do limiar',area:'warden'}]},
 {id:'water-source',title:'Água para permanecer',npc:'medic',requires:'beyond',credits:45,
  offer:['O relatório permite abrir uma rota ao norte do Vale da Ressonância. Precisamos de uma fonte estável, não apenas de umidade no solo.','Investigue a nascente da bacia. Registre vazão e composição; a água ainda passará pelo nosso tratamento.'],
  report:['A nascente tem vazão suficiente para o módulo e pode alimentar o reservatório após filtragem.','Uma fonte de água nos dá uma possibilidade real de permanecer. Ivo vai verificar como levar a carga até os terraços.'],
  goals:[{id:'spring',label:'Analisar a nascente na nova bacia',area:'springs'}]},
 {id:'safe-route',title:'Uma rota segura',npc:'smith',requires:'water-source',credits:55,
  offer:['A carga da nave inclui um módulo habitável, um reservatório e um canteiro de testes. Só precisamos de uma rota viável.','Confirme o acesso pela crista e a travessia inferior dos Terraços do Amanhecer. A caravana poderá evitar as margens ocupadas.'],
  report:['Os dois acessos foram registrados. Podemos escolher a passagem conforme a atividade das criaturas.','Separei a carga do primeiro abrigo. Nara precisa aprovar o terreno antes de enviarmos os primeiros colonos.'],
  goals:[{id:'route-west',label:'Confirmar o acesso pela crista',area:'terraces'},{id:'route-east',label:'Confirmar a travessia inferior',area:'terraces'}]},
 {id:'shelter',title:'O primeiro abrigo',npc:'expedition',requires:'safe-route',credits:75,
  offer:['Temos água e uma rota. Agora precisamos de um lugar onde as primeiras famílias possam ficar.','Analise o solo e confirme o local nos terraços. Depois instale o módulo reservado da expedição. A carga já está separada; não precisa fabricar nem comprar.'],
  report:['O módulo está instalado, com reservatório e um canteiro experimental. Os primeiros colonos chegaram.','Ainda somos poucos. Mas Dante já não é só um ponto no mapa: alguém vai chamar este lugar de casa.'],
  goals:[{id:'soil',label:'Analisar o solo dos terraços',area:'terraces'},{id:'site',label:'Validar o local do abrigo',area:'terraces'},{id:'shelter-built',label:'Instalar o módulo da expedição',area:'terraces'}]},
];
export const MISSIONS:readonly MissionDefinition[]=[...STORY_MISSIONS,...REGIONAL_MISSIONS];
export const missionById=(id:MissionId):MissionDefinition=>MISSIONS.find(m=>m.id===id)!;
