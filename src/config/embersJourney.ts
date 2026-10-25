import type {JourneyArea} from '../systems/LocalJourney';
import type {SiroccoTrail} from './siroccoJourney';
import type {SpeciesId} from './bestiary';

// Existing discoveries gain approaches and returns inside approved terrain.
// All Caldera loops stay before the original relay-controlled boss threshold.
export const EMBERS_TRAILS:Record<'cinder'|'obsidian'|'caldera',readonly SiroccoTrail[]>={
 cinder:[
  {name:'Saída de vapor da costa',site:'exp-cinder-1',entry:{x:470,y:980},exit:{x:1120,y:950},ridge:{x:750,y:815,radius:60},art:'shelf',hint:'Contorne o basalto pelo sul; recolha a condensação da margem e retorne à cinza firme.'},
  {name:'Cinza consolidada',site:'exp-cinder-2',entry:{x:1200,y:1090},exit:{x:1890,y:1080},ridge:{x:1550,y:1040,radius:64},art:'shelf',hint:'Compare a crosta no desvio sul e volte por leste. A cinza firme não dispensa medir gases.'},
  {name:'Leito térmico lateral',site:'exp-cinder-3',entry:{x:2130,y:1010},exit:{x:2720,y:1030},ridge:{x:2440,y:840,radius:56},art:'buried',hint:'Siga o veio mineral por baixo da dobra; preserve o conduto e volte à passagem da garganta.'},
 ],
 obsidian:[
  {name:'Parede de vidro escuro',site:'exp-obsidian-1',entry:{x:460,y:980},exit:{x:1140,y:980},ridge:{x:750,y:830,radius:60},art:'shelf',hint:'Use o sedimento ao pé do vidro; os fragmentos junto à parede contam a história sem exigir escalada.'},
  {name:'Canal da margem inferior',site:'exp-obsidian-2',entry:{x:1390,y:1050},exit:{x:2070,y:1060},ridge:{x:1750,y:1040,radius:62},art:'buried',hint:'O braço sul acompanha o canal raso. Compare suas seções e retorne pelo apoio de pedra.'},
  {name:'Divisor de pulsos',site:'exp-obsidian-3',entry:{x:2390,y:1000},exit:{x:3000,y:1000},ridge:{x:2760,y:860,radius:55},art:'buried',hint:'A margem do divisor dá leitura dos dois fluxos; o registro original ainda abre o caminho às forjas.'},
 ],
 caldera:[
  {name:'Margem fria da entrada',site:'exp-caldera-1',entry:{x:400,y:950},exit:{x:980,y:930},ridge:{x:650,y:690,radius:58},art:'shelf',hint:'A margem interna do pátio permite comparar o piso frio com o calor retido, sem pisar nos bancos altos.'},
  {name:'Depósito térmico inferior',site:'exp-caldera-2',entry:{x:860,y:1110},exit:{x:1440,y:1150},ridge:{x:1120,y:1080,radius:58},art:'shelf',hint:'Contorne o depósito pelo sul e volte entre os apoios; as cargas devem permanecer fora do conduto.'},
  {name:'Conduto antes do limiar',site:'exp-caldera-3',entry:{x:1510,y:1000},exit:{x:1950,y:970},ridge:{x:1770,y:840,radius:55},art:'buried',hint:'Compare as marcas no piso antes do limiar. Investigue o registro de basalto para liberar a aproximação.'},
 ],
};
export function embersTrails(area:JourneyArea):readonly SiroccoTrail[]{return EMBERS_TRAILS[area as keyof typeof EMBERS_TRAILS]??[];}
export const EMBERS_SITE_KINDS:Partial<Record<string,readonly SpeciesId[]>>={
 'exp-cinder-1':['emberHound','emberHound'],'exp-cinder-2':['fumarole','emberHound'],'exp-cinder-3':['fumarole','fumarole'],
 'exp-obsidian-1':['slagback','emberHound'],'exp-obsidian-2':['fumarole','slagback'],'exp-obsidian-3':['slagback','fumarole'],
 'exp-caldera-1':['emberHound','emberHound'],'exp-caldera-2':['slagback','slagback'],'exp-caldera-3':['emberHound','fumarole'],
};
export const EMBERS_TRAIL_RESIDENTS=[
 {id:1986,site:'exp-cinder-1',area:'cinder',kind:'emberHound',x:1000,y:1070},
 {id:1987,site:'exp-cinder-3',area:'cinder',kind:'fumarole',x:2640,y:1180},
 {id:1988,site:'exp-obsidian-1',area:'obsidian',kind:'emberHound',x:1030,y:1010},
 {id:1989,site:'exp-obsidian-2',area:'obsidian',kind:'slagback',x:1970,y:1190},
 {id:1990,site:'exp-caldera-1',area:'caldera',kind:'emberHound',x:880,y:940},
 {id:1991,site:'exp-caldera-3',area:'caldera',kind:'fumarole',x:1930,y:1110},
] satisfies {id:number;site:string;area:JourneyArea;kind:SpeciesId;x:number;y:number}[];
