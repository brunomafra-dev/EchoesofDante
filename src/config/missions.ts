import type {JourneyArea} from '../systems/LocalJourney';

export const MISSION_IDS=['recon','survival','signal','beyond'] as const;
export type MissionId=typeof MISSION_IDS[number];
export type MissionNpc='expedition'|'medic'|'smith';
export const MISSION_EVIDENCE=['clearing','roots','water','biology','echo1','echo2','echo3','passage','first-echo','warden'] as const;
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
export type MissionDefinition={id:MissionId;title:string;npc:MissionNpc;requires?:MissionId;credits:number;offer:readonly string[];report:readonly string[];goals:readonly {id:MissionEvidence;label:string;area:JourneyArea}[]};
export const MISSIONS:readonly MissionDefinition[]=[
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
];
export const missionById=(id:MissionId):MissionDefinition=>MISSIONS.find(m=>m.id===id)!;
