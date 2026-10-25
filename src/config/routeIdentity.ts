import type {JourneyArea} from '../systems/LocalJourney';
import type {Obstacle} from '../systems/Movement';

export type RouteIdentity={arc:'sirocco'|'boreal'|'embers';width:number;height:number;groundY?:number;groundHeight?:number;spots:readonly {x:number;y:number;name:string}[];solids:readonly Obstacle[]};
// Complete, non-repeating authored paintings, one per region. Coordinates keep
// existing campaign entrances, relays and boss combat spaces intact.
export const ROUTE_IDENTITY:Partial<Record<JourneyArea,RouteIdentity>>={
 valley:{arc:'sirocco',width:5500,height:1500,spots:[{x:980,y:850,name:'Pradaria mineral'},{x:2690,y:850,name:'Raízes de calcário'},{x:4380,y:850,name:'Escarpa da Ressonância'}],solids:[{x:800,y:620,radius:115}]},
 arid:{arc:'sirocco',width:5250,height:1500,spots:[{x:850,y:850,name:'Leito ferruginoso'},{x:2700,y:850,name:'Salinas secas'},{x:4200,y:850,name:'Estratos de Siroco'}],solids:[]},
 dunes:{arc:'sirocco',width:3200,height:2200,spots:[{x:1050,y:650,name:'Crista dos ventos'},{x:1550,y:1550,name:'Canal dos grãos escuros'},{x:2450,y:1090,name:'Margem da depressão'}],solids:[{x:1220,y:1130,radius:70},{x:1450,y:1160,radius:80},{x:1680,y:1170,radius:70}]},
 sandpit:{arc:'sirocco',width:1800,height:1500,spots:[{x:550,y:790,name:'Bacia Soterrada'},{x:950,y:790,name:'Rastros sob a areia'},{x:1300,y:840,name:'Margem do selo'}],solids:[]},
 frost:{arc:'boreal',width:3000,height:1800,spots:[{x:600,y:1050,name:'Passagem da neve baixa'},{x:1510,y:900,name:'Dobra da Fratura'},{x:2450,y:1000,name:'Gelo selado'}],solids:[]},
 // Fit the dry shelf to the playable band: deep meltwater stays beyond the
 // existing northern/southern limits, including the original relay checkpoint.
 icecave:{arc:'boreal',width:3100,height:1800,groundY:-300,groundHeight:2300,spots:[{x:650,y:1010,name:'Pedra do degelo'},{x:1530,y:970,name:'Canal sob o gelo'},{x:2600,y:1050,name:'Margem mineral'}],solids:[]},
 icenest:{arc:'boreal',width:2500,height:1800,spots:[{x:550,y:990,name:'Vestíbulo fossilizado'},{x:1200,y:1030,name:'Placa de gelo antigo'},{x:1820,y:1000,name:'Ninho de Vésper'}],solids:[]},
 cinder:{arc:'embers',width:3100,height:1800,spots:[{x:600,y:980,name:'Praia de cinzas frias'},{x:1580,y:900,name:'Leito de poeira cinza'},{x:2600,y:1050,name:'Bancos de basalto'}],solids:[]},
 obsidian:{arc:'embers',width:3300,height:1800,spots:[{x:520,y:980,name:'Passagem de vidro escuro'},{x:1730,y:900,name:'Prateleira violeta'},{x:2850,y:1000,name:'Canal seco da garganta'}],solids:[]},
 caldera:{arc:'embers',width:3400,height:1800,spots:[{x:480,y:950,name:'Pátio das forjas'},{x:1780,y:900,name:'Condutos resfriados'},{x:2500,y:1000,name:'Domínio do Incandescente'}],solids:[]},
};
