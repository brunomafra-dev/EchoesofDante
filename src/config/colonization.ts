import type {Obstacle} from '../systems/Movement';

export type ColonyArea='springs'|'terraces';
export type ColonyKind='bankGrazer'|'reedSpitter';
export const COLONY={
 springs:{name:'Bacia das Nascentes',width:2600,height:1500,entry:{x:350,y:1020},back:{x:205,y:1020},exit:{x:2370,y:670},checkpoint:{x:350,y:1020}},
 terraces:{name:'Terraços do Amanhecer',width:2600,height:1500,entry:{x:340,y:850},back:{x:200,y:850},checkpoint:{x:340,y:850}},
} as const;
export const COLONY_BRANCH={x:1880,y:530,radius:100};
export const COLONY_SITES=[
 {id:'spring',area:'springs',x:1820,y:650,radius:90,name:'Nascente mineral',mission:'water-source'},
 {id:'route-west',area:'terraces',x:850,y:590,radius:100,name:'Acesso pela crista',mission:'safe-route'},
 {id:'route-east',area:'terraces',x:1630,y:1040,radius:100,name:'Travessia inferior',mission:'safe-route'},
 {id:'soil',area:'terraces',x:1880,y:1080,radius:90,name:'Solo dos terraços',mission:'shelter'},
 {id:'site',area:'terraces',x:2210,y:1010,radius:90,name:'Local do primeiro abrigo',mission:'shelter'},
 {id:'shelter-built',area:'terraces',x:2210,y:1010,radius:90,name:'Instalar módulo da expedição',mission:'shelter'},
] as const;
export const COLONY_ENCOUNTERS:Record<ColonyArea,readonly {id:number;kind:ColonyKind;x:number;y:number}[]>={
 springs:[{id:3000,kind:'bankGrazer',x:740,y:940},{id:3001,kind:'reedSpitter',x:900,y:530},{id:3002,kind:'bankGrazer',x:1100,y:1080},{id:3003,kind:'reedSpitter',x:1450,y:1040},{id:3004,kind:'bankGrazer',x:2020,y:880},{id:3005,kind:'reedSpitter',x:2100,y:790}],
 terraces:[{id:3010,kind:'bankGrazer',x:690,y:870},{id:3011,kind:'reedSpitter',x:1050,y:530},{id:3012,kind:'bankGrazer',x:1200,y:580},{id:3013,kind:'reedSpitter',x:1430,y:1070},{id:3014,kind:'bankGrazer',x:1650,y:930},{id:3015,kind:'bankGrazer',x:1730,y:850}],
};
export const COLONY_ROCKS:Record<ColonyArea,readonly Obstacle[]>={
 springs:[{x:720,y:700,radius:44},{x:950,y:890,radius:35},{x:1660,y:980,radius:48},{x:2200,y:1120,radius:38},
  {x:1140,y:760,radius:100},{x:1270,y:760,radius:113},{x:1400,y:760,radius:100},{x:1760,y:505,radius:60},{x:1850,y:505,radius:60}],
 terraces:[{x:720,y:690,radius:38},{x:1100,y:815,radius:68},{x:1270,y:815,radius:67},{x:1440,y:815,radius:60},{x:1800,y:600,radius:40}],
};
export const HABITAT={x:2180,y:890,width:360,height:255};
export const HABITAT_SOLIDS:readonly Obstacle[]=[{x:2120,y:795,radius:68},{x:2260,y:800,radius:47},{x:2220,y:866,radius:29}];
