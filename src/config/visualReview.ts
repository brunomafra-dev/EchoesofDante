import type {JourneyArea} from '../systems/LocalJourney';
export function visualReviewQuiet():boolean{return location.pathname.split('/').pop()==='campaign-playtest.html'&&new URLSearchParams(location.search).has('visual-review')&&!new URLSearchParams(location.search).has('combat');}
export const VISUAL_REVIEW_STOPS:readonly {id:string;name:string;area:JourneyArea;x:number;y:number}[]=[
 {id:'base',name:'Base · reservas e oficina',area:'base',x:740,y:830},
 {id:'post',name:'Nascentes · posto e apoio',area:'springs',x:1920,y:1080},
 {id:'pipes',name:'Nascentes · tubulação',area:'springs',x:1620,y:1040},
 {id:'camp',name:'Terraços · primeiro abrigo',area:'terraces',x:1150,y:1100},
 {id:'collector',name:'Fratura · coletor na neve',area:'frost',x:940,y:1080},
 {id:'gallery',name:'Galerias · fissura e carga',area:'icecave',x:940,y:1220},
 {id:'wind',name:'Siroco · plataforma',area:'arid',x:2550,y:795},
 {id:'dunes',name:'Dunas · sondagem',area:'dunes',x:2060,y:1000},
 {id:'forest',name:'Floresta · copas e rochas',area:'forest',x:900,y:850},
];
