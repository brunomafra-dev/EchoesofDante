import type { Obstacle } from '../systems/Movement';

export const CALDERA = {
  name:'Caldeira de Dante', width:3400, height:1800,
  bounds:{left:160,right:3180,top:350,bottom:1300},
  entry:{x:340,y:950}, back:{x:220,y:950},
  checkpoint:{x:1920,y:870}, relay:{x:1620,y:660,radius:115},
  gate:{x:2090,y:960,radius:110}, record:{x:3100,y:830,radius:115},
  rocks:[{x:650,y:1210,radius:38},{x:860,y:800,radius:43},{x:1180,y:1070,radius:46},
    {x:1430,y:780,radius:35},{x:1595,y:612,radius:32},{x:1810,y:1260,radius:45},
    {x:1900,y:580,radius:40},{x:3080,y:775,radius:30}],
} as const;
// Solid shelves separating exploration from the arena; a wide throat stays open.
export const CALDERA_WALL:readonly Obstacle[]=[430,540,650,760,1150,1260,1370].map(y=>({x:2090,y,radius:65}));
export const CALDERA_ENCOUNTERS=[
 {id:1400,kind:'dunePouncer',x:750,y:1030},
 {id:1401,kind:'glassSpitter',x:970,y:590},
 {id:1402,kind:'dunePouncer',x:1260,y:1220},
 {id:1403,kind:'glassSpitter',x:1390,y:1130},
 {id:1404,kind:'dunePouncer',x:1620,y:1060},
 {id:1405,kind:'glassSpitter',x:1690,y:1210},
] as const;
export const CALDERA_ROUTES=[
 {id:'caldera-obsidian-shelf',name:'Prateleira de Obsidiana',x:1050,y:520,radius:105},
 {id:'caldera-ash-terrace',name:'Terraço das Cinzas',x:1500,y:1270,radius:100},
] as const;
export type TitanAttack='cleave'|'slam'|'fissure'|'boulders';
export const TITAN={
 hp:950,radius:64,size:275,spawn:{x:2690,y:910},awakeningX:2190,speed:64,xp:260,
 bounds:{left:2210,right:3170,top:510,bottom:1290},
 patterns:{1:['cleave','slam','boulders'],2:['fissure','cleave','boulders','slam'],3:['fissure','boulders','cleave','slam','fissure']} satisfies Record<1|2|3,TitanAttack[]>,
 cleave:{tell:950,duration:240,recovery:1450,damage:20,range:195,halfAngle:1.25},
 slam:{tell:1200,duration:300,recovery:1900,damage:24,radius:205},
 fissure:{tell:1400,duration:1050,recovery:1650,damage:22,radius:65,interval:320},
 boulders:{tell:1250,duration:1800,recovery:1650,damage:18,speed:250,range:660,radius:14,spread:.24},
} as const;
