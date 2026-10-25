import type {JourneyArea} from '../systems/LocalJourney';
import type {SiroccoTrail} from './siroccoJourney';
import type {SpeciesId} from './bestiary';

// Optional loops inside the approved paintings. Six existing evidence IDs,
// unchanged relays/checkpoints. Low solid shelters have two open approaches.
export const BOREAL_TRAILS:Record<'frost'|'icecave',readonly SiroccoTrail[]>={
 frost:[
  {name:'Olho de água morna',site:'exp-frost-1',entry:{x:460,y:850},exit:{x:1110,y:850},ridge:{x:790,y:690,radius:65},art:'shelf',hint:'Contorne a dobra pelo sul: o veio morno fica abrigado, sem pisar na nascente.'},
  {name:'Líquens da geada',site:'exp-frost-2',entry:{x:1100,y:1040},exit:{x:1820,y:1090},ridge:{x:1500,y:1130,radius:60},art:'roots',hint:'Siga os líquens pelo lado baixo da dobra e volte a leste, longe do vento.'},
  {name:'Encosta exposta',site:'exp-frost-3',entry:{x:2120,y:1020},exit:{x:2580,y:1080},ridge:{x:2370,y:1130,radius:58},art:'buried',hint:'Compare a encosta com a face protegida da pedra; retorne ao registro antes das galerias.'},
 ],
 icecave:[
  {name:'Poça lateral do degelo',site:'exp-icecave-1',entry:{x:510,y:1020},exit:{x:1160,y:1040},ridge:{x:820,y:1150,radius:62},art:'shelf',hint:'A margem sul conduz à poça rasa; a pedra firme retorna ao salão sem cruzar água profunda.'},
  {name:'Coluna sob a geada',site:'exp-icecave-2',entry:{x:1240,y:830},exit:{x:1900,y:850},ridge:{x:1530,y:730,radius:58},art:'buried',hint:'A bifurcação norte segue pela pedra seca, abaixo da coluna. Compare o apoio das cargas.'},
  {name:'Margem do canal oculto',site:'exp-icecave-3',entry:{x:2240,y:1030},exit:{x:2730,y:1030},ridge:{x:2490,y:1170,radius:55},art:'shelf',hint:'Siga a borda rasa ao sul e retorne à passagem; as marcas e a vibração apontam para o ninho.'},
 ],
};
export function borealTrails(area:JourneyArea):readonly SiroccoTrail[]{return BOREAL_TRAILS[area as keyof typeof BOREAL_TRAILS]??[];}
export const BOREAL_SITE_KINDS:Partial<Record<string,readonly SpeciesId[]>>={
 'exp-frost-1':['frostPouncer','frostPouncer'],
 'exp-frost-2':['frostSpitter','frostPouncer'],
 'exp-frost-3':['frostSpitter','frostSpitter'],
 'exp-icecave-1':['iceCarapace','iceCarapace'],
 'exp-icecave-2':['frostSpitter','iceCarapace'],
 'exp-icecave-3':['iceCarapace','frostSpitter'],
};
export const BOREAL_TRAIL_RESIDENTS=[
 {id:1982,site:'exp-frost-1',area:'frost',kind:'frostPouncer',x:1030,y:830},
 {id:1983,site:'exp-frost-3',area:'frost',kind:'frostSpitter',x:2610,y:1210},
 {id:1984,site:'exp-icecave-1',area:'icecave',kind:'iceCarapace',x:1060,y:1310},
 {id:1985,site:'exp-icecave-2',area:'icecave',kind:'frostSpitter',x:1830,y:840},
] satisfies {id:number;site:string;area:JourneyArea;kind:SpeciesId;x:number;y:number}[];

// Flat, non-interactive traces before the original awakening threshold (870).
// No objective/receipt, collider, boss trigger or extra reward in the vestibule.
export const BOREAL_NEST_TRACES=[
 {x:480,y:1000,width:105,angle:-15},
 {x:600,y:980,width:86,angle:12},
 {x:725,y:990,width:95,angle:-8},
] as const;
