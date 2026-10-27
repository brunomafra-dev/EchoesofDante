import type {MissionDefinition, MissionEvidence, MissionId} from './missions';
import type {JourneyArea} from '../systems/LocalJourney';
import type {RegionalArt} from './regionalExpeditions';

export const PERMANENCE_IDS=['settle-water','settle-food','settle-transport','settle-energy','settle-arrivals'] as const;
export type PermanenceId=typeof PERMANENCE_IDS[number];
export type PermanenceEvidence=`pw-${'intake'|'silt'|'filter'|'valve'|'online'}`|`pf-${'trace'|'control'|'sample'|'safe'|'stock'}`|`pt-${'upper'|'lower'|'anchor'|'load'|'deliver'}`|`pe-${'ground'|'return'|'cell'|'isolate'|'online'}`|`pc-${'beacon'|'manifest'|'shelter'|'receive'|'home'}`;
export type PermanenceSite={id:PermanenceEvidence;mission:PermanenceId;area:JourneyArea;x:number;y:number;radius:number;name:string;finding:string;art:RegionalArt;action:string;needs?:readonly MissionEvidence[]};
export const PERMANENCE_SITES:readonly PermanenceSite[]=[
 {id:'pw-intake',mission:'settle-water',area:'springs',x:1680,y:650,radius:75,name:'Captação a montante',art:'water',action:'COLETAR',finding:'O sedimento vem da margem baixa. A captação alta mantém fluxo constante.'},
 {id:'pw-silt',mission:'settle-water',area:'springs',x:1510,y:1100,radius:75,name:'Sedimento da margem',art:'soil',action:'COMPARAR',finding:'O lodo obstrui o cartucho da nave; precisamos separar o retorno da captação.'},
 {id:'pw-filter',mission:'settle-water',area:'terraces',x:590,y:1070,radius:75,name:'Cartucho de tratamento',art:'mineral',action:'RECUPERAR',needs:['pw-intake','pw-silt'],finding:'Cartucho reservado recuperado. A carga não consome seus materiais pessoais.'},
 {id:'pw-valve',mission:'settle-water',area:'springs',x:1660,y:1100,radius:65,name:'Desvio da descarga',art:'record',action:'ISOLAR',needs:['pw-filter'],finding:'Retorno isolado. A frente de pressão cessa e a captação fica separada do lodo.'},
 {id:'pw-online',mission:'settle-water',area:'terraces',x:1990,y:1040,radius:75,name:'Tratamento do reservatório',art:'water',action:'INSTALAR',needs:['pw-valve','shelter-built'],finding:'Água tratada no reservatório. Lia ainda precisa conferir e registrar a entrega.'},
];
export const PERMANENCE_MISSIONS:readonly MissionDefinition[]=[
 {id:'settle-water',title:'Água para o assentamento',npc:'medic',requires:'shelter',credits:80,
  offer:['A nascente sustenta o abrigo, mas o cartucho está saturando antes do previsto. Não podemos receber outra família com água racionada.','Compare a captação com o sedimento da margem. Ivo separou um cartucho nos terraços; isole o retorno sob pressão antes de instalar o tratamento.'],
  report:['A captação agora está separada do retorno e o reservatório recebe água tratada. Já podemos manter uma reserva segura.','Vou acompanhar cada lote. Isso nos permite estudar o canteiro sem arriscar a água das famílias.'],
  goals:PERMANENCE_SITES.filter(s=>s.mission==='settle-water').map(s=>({id:s.id,label:s.name,area:s.area}))},
];
export const isPermanence=(id:MissionId):id is PermanenceId=>PERMANENCE_IDS.includes(id as PermanenceId);
