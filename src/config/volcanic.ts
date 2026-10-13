import type { Obstacle } from '../systems/Movement';
export type VolcanicKind='emberHound'|'fumarole'|'slagback';
export type VolcanicArea='cinder'|'obsidian';
export const VOLCANIC_CREATURES={
 emberHound:{name:'RASGA-BRASA',hp:95,radius:17,size:110,speed:142,detection:330,range:85,damage:12,windup:650,cooldown:1900,texture:'ember-hound-motion',style:'rush'},
 fumarole:{name:'FOLE DE MAGMA',hp:130,radius:23,size:120,speed:52,detection:410,range:330,damage:15,windup:1000,cooldown:2800,texture:'fumarole-motion',style:'shot'},
 slagback:{name:'DORSO DE BASALTO',hp:180,radius:29,size:145,speed:56,detection:300,range:125,damage:20,windup:1250,cooldown:3200,texture:'slagback-motion',style:'slam'},
} as const;
export const VOLCANIC={
 cinder:{name:'Costa das Cinzas',width:3100,height:1800,texture:'cinder-ground',
  bounds:{left:170,right:2930,top:370,bottom:1330},entry:{x:390,y:980},back:{x:230,y:980},
  checkpoint:{x:1720,y:950},relay:{x:1840,y:650,radius:120},exit:{x:2810,y:980},
  previous:'icenest',next:'obsidian',
  rocks:[{x:770,y:790,radius:36},{x:950,y:1250,radius:40},{x:1330,y:1020,radius:45},{x:1690,y:560,radius:38},{x:2240,y:720,radius:46},{x:2320,y:1240,radius:35},{x:2530,y:890,radius:40}],
  routes:[{id:'cinder-steam-bank',name:'Margem do Vapor',x:1080,y:470,radius:105},{id:'cinder-ash-bed',name:'Leito de Cinzas',x:2100,y:1250,radius:100}],
  clusters:[{key:'root-growth',x:650,y:620,w:170,h:60},{key:'deep-mineral',x:1100,y:440,w:120,h:75},{key:'ancient-remnant',x:2090,y:1270,w:160,h:100}],
 },
 obsidian:{name:'Garganta de Obsidiana',width:3300,height:1800,texture:'obsidian-ground',
  bounds:{left:170,right:3120,top:370,bottom:1330},entry:{x:380,y:980},back:{x:230,y:980},
  checkpoint:{x:1810,y:920},relay:{x:1950,y:580,radius:120},exit:{x:2990,y:970},
  previous:'cinder',next:'caldera',
  rocks:[{x:670,y:770,radius:50},{x:980,y:1150,radius:43},{x:1230,y:700,radius:48},{x:1510,y:1210,radius:45},{x:1760,y:480,radius:37},{x:2130,y:720,radius:45},{x:2280,y:1250,radius:52},{x:2680,y:770,radius:42}],
  routes:[{id:'obsidian-glass-shelf',name:'Prateleira Vítrea',x:1480,y:465,radius:110},{id:'obsidian-buried-channel',name:'Canal Soterrado',x:2420,y:1250,radius:100}],
  clusters:[{key:'deep-mineral',x:1480,y:440,w:150,h:85},{key:'ancient-remnant',x:2360,y:1260,w:175,h:105},{key:'root-growth',x:830,y:660,w:150,h:50}],
 },
} as const satisfies Record<VolcanicArea,{name:string;width:number;height:number;texture:string;bounds:{left:number;right:number;top:number;bottom:number};entry:{x:number;y:number};back:{x:number;y:number};checkpoint:{x:number;y:number};relay:{x:number;y:number;radius:number};exit:{x:number;y:number};previous:string;next:string;rocks:readonly Obstacle[];routes:readonly {id:string;name:string;x:number;y:number;radius:number}[];clusters:readonly {key:string;x:number;y:number;w:number;h:number}[]}>;
export const VOLCANIC_ENCOUNTERS={
 cinder:[
  {id:1500,kind:'emberHound',x:800,y:1020},{id:1501,kind:'emberHound',x:1110,y:650},
  {id:1502,kind:'fumarole',x:1260,y:1100},{id:1503,kind:'emberHound',x:1390,y:1160},
  {id:1504,kind:'fumarole',x:2090,y:740},{id:1505,kind:'emberHound',x:2320,y:960},{id:1506,kind:'emberHound',x:2440,y:1070},
 ],
 obsidian:[
  {id:1600,kind:'slagback',x:790,y:1000},{id:1601,kind:'emberHound',x:1090,y:860},
  {id:1602,kind:'fumarole',x:1370,y:1130},{id:1603,kind:'slagback',x:1450,y:1010},
  {id:1604,kind:'fumarole',x:2250,y:1100},{id:1605,kind:'emberHound',x:2370,y:870},
  {id:1606,kind:'slagback',x:2660,y:1110},{id:1607,kind:'emberHound',x:2810,y:820},
 ],
} as const;
export const VOLCANIC_ROUTES=[...VOLCANIC.cinder.routes,...VOLCANIC.obsidian.routes];
