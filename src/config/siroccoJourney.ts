import type {JourneyArea} from '../systems/LocalJourney';
import type {Obstacle} from '../systems/Movement';
import type {SpeciesId} from './bestiary';

export type SiroccoTrailArea='valley'|'arid'|'dunes';
export type SiroccoTrail={name:string;site:string;entry:{x:number;y:number};exit:{x:number;y:number};ridge:Obstacle;art:'roots'|'shelf'|'buried';hint:string};
// Loops stay within the approved paintings. Each low ridge has a matching solid
// footprint; both ends stay open. Original signals, portals and checkpoints do
// not move, and none of these optional reports opens a campaign gate.
export const SIROCCO_TRAILS:Record<SiroccoTrailArea,readonly SiroccoTrail[]>={
 valley:[
  {name:'Abrigo das cristas',site:'exp-valley-1',entry:{x:1040,y:590},exit:{x:1870,y:590},ridge:{x:1440,y:700,radius:75},art:'roots',hint:'Passe pela margem norte da crista; a caravana pode descansar atrás das raízes.'},
  {name:'Bacia de descanso',site:'exp-valley-2',entry:{x:3020,y:970},exit:{x:3910,y:970},ridge:{x:3500,y:880,radius:70},art:'shelf',hint:'Contorne a crista por baixo e compare o solo da bacia com a margem exposta.'},
  {name:'Margem da passagem oriental',site:'exp-valley-3',entry:{x:4330,y:650},exit:{x:4840,y:750},ridge:{x:4600,y:730,radius:57},art:'buried',hint:'O lado alto da escarpa oferece um retorno à passagem, longe das marcas de arrasto.'},
 ],
 arid:[
  {name:'Raízes do leito seco',site:'exp-arid-1',entry:{x:840,y:860},exit:{x:1570,y:870},ridge:{x:1250,y:780,radius:68},art:'roots',hint:'Siga as fibras ao sul do leito e volte pelo lado da pedra baixa.'},
  {name:'Depósito salino',site:'exp-arid-2',entry:{x:2490,y:760},exit:{x:3120,y:720},ridge:{x:2850,y:740,radius:70},art:'shelf',hint:'A borda norte da salina é firme; a crosta branca não é água potável.'},
  {name:'Sombra do paredão distante',site:'exp-arid-3',entry:{x:4020,y:920},exit:{x:4680,y:900},ridge:{x:4350,y:800,radius:64},art:'shelf',hint:'Desça pela face sombreada e retorne à trilha antes do portal das dunas.'},
 ],
 dunes:[
  {name:'Encosta das areias claras',site:'exp-dunes-1',entry:{x:680,y:1000},exit:{x:1490,y:790},ridge:{x:1100,y:800,radius:70},art:'shelf',hint:'A rota alta contorna a crista e chega às ruínas pelo norte.'},
  {name:'Sedimento profundo',site:'exp-dunes-2',entry:{x:1040,y:1370},exit:{x:2040,y:1530},ridge:{x:1460,y:1490,radius:75},art:'buried',hint:'O canal sul expõe nervuras antigas; siga a areia escura e volte por leste.'},
  {name:'Nervuras da depressão',site:'exp-dunes-3',entry:{x:2190,y:1440},exit:{x:2590,y:1260},ridge:{x:2490,y:1410,radius:52},art:'buried',hint:'O pulso não vem do vento. Observe os rastros antes de descer à bacia.'},
 ],
};
export function siroccoTrails(area:JourneyArea):readonly SiroccoTrail[]{return SIROCCO_TRAILS[area as SiroccoTrailArea]??[];}
// Stable finite IDs, compatible with the existing 0..1999 save/relay budget.
// These residents never renew and their XP/material/gear use the existing path.
export const SIROCCO_TRAIL_RESIDENTS=[
 {id:1976,site:'exp-valley-1',area:'valley',kind:'carapace',x:1730,y:580},
 {id:1977,site:'exp-valley-2',area:'valley',kind:'thorn',x:3780,y:920},
 {id:1978,site:'exp-arid-1',area:'arid',kind:'dunePouncer',x:1450,y:885},
 {id:1979,site:'exp-arid-2',area:'arid',kind:'glassSpitter',x:3040,y:580},
 {id:1980,site:'exp-dunes-1',area:'dunes',kind:'dunePouncer',x:1300,y:560},
 {id:1981,site:'exp-dunes-2',area:'dunes',kind:'glassSpitter',x:1760,y:1690},
] satisfies {id:number;site:string;area:JourneyArea;kind:SpeciesId;x:number;y:number}[];

// Different approaches instead of repeating the same mixed pair nine times.
// Existing IDs 1912..1929 and their completed-save receipts stay unchanged.
export const SIROCCO_SITE_KINDS:Partial<Record<string,readonly SpeciesId[]>>={
 'exp-valley-1':['carapace','thorn'],'exp-valley-2':['carapace','carapace'],'exp-valley-3':['thorn','carapace'],
 'exp-arid-1':['dunePouncer','dunePouncer'],'exp-arid-2':['glassSpitter','glassSpitter'],'exp-arid-3':['glassSpitter','dunePouncer'],
 'exp-dunes-1':['dunePouncer','glassSpitter'],'exp-dunes-2':['glassSpitter','dunePouncer'],'exp-dunes-3':['dunePouncer','dunePouncer'],
};
