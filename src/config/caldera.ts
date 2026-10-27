import type { Obstacle } from '../systems/Movement';

export const CALDERA = {
  name:'Forjas da Caldeira', width:3400, height:1800,
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
 {id:1400,kind:'emberHound',x:470,y:1090},
 {id:1401,kind:'fumarole',x:970,y:590},
 {id:1402,kind:'emberHound',x:1260,y:1220},
 {id:1403,kind:'slagback',x:1460,y:1100},
 {id:1404,kind:'emberHound',x:1510,y:1150},
 {id:1405,kind:'fumarole',x:1870,y:1150},
 {id:1406,kind:'slagback',x:1120,y:860},
 {id:1407,kind:'emberHound',x:830,y:1150},
 {id:1408,kind:'fumarole',x:1350,y:550},
] as const;
export const CALDERA_ROUTES=[
 {id:'caldera-obsidian-shelf',name:'Prateleira de Obsidiana',x:1050,y:520,radius:105},
 {id:'caldera-ash-terrace',name:'Terraço das Cinzas',x:1500,y:1270,radius:100},
] as const;
export type TitanAttack='cleave'|'slam'|'fissure'|'boulders';
export const TITAN={
 hp:950,radius:64,size:275,spawn:{x:2690,y:910},awakeningX:2190,speed:90,xp:260,
 idleMs:260,phaseMs:1000,armoredDamage:.18,openingDamage:1.7,openingMs:3400,openingAt:240,closingMs:240,
 cover:{radius:42,distance:250,spread:.72},
 bounds:{left:2210,right:3170,top:510,bottom:1290},
 patterns:{1:['boulders','slam','cleave','fissure'],2:['boulders','fissure','slam','cleave'],3:['boulders','cleave','fissure','slam']} satisfies Record<1|2|3,TitanAttack[]>,
 cleave:{tell:900,duration:620,recovery:350,contact:280,damage:38,range:255,halfAngle:1.7},
 slam:{tell:1250,duration:2350,recovery:350,contact:240,damage:40,radius:205,waveAt:950,waveStart:70,waveEnd:1150,waveSpeed:1050,waveDamage:46},
 fissure:{tell:1100,duration:1900,recovery:350,contact:220,damage:32,radius:88,interval:720},
 boulders:{tell:1050,duration:1250,recovery:350,contact:240,damage:34,radius:74,interval:300},
} as const;
