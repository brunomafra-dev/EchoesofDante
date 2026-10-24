import type {JourneyArea} from '../systems/LocalJourney';
import type {Obstacle} from '../systems/Movement';

export type RouteIdentity={arc:'sirocco'|'boreal'|'embers';width:number;height:number;spots:readonly {x:number;y:number;name:string}[];solids:readonly Obstacle[]};
// Complete, non-repeating authored paintings, one per region. Coordinates keep
// existing campaign entrances, relays and boss combat spaces intact.
export const ROUTE_IDENTITY:Partial<Record<JourneyArea,RouteIdentity>>={
 valley:{arc:'sirocco',width:5500,height:1500,spots:[{x:980,y:850,name:'Pradaria mineral'},{x:2690,y:850,name:'Raízes de calcário'},{x:4380,y:850,name:'Escarpa da Ressonância'}],solids:[{x:800,y:620,radius:115}]},
 arid:{arc:'sirocco',width:5250,height:1500,spots:[{x:850,y:850,name:'Leito ferruginoso'},{x:2700,y:850,name:'Salinas secas'},{x:4200,y:850,name:'Estratos de Siroco'}],solids:[]},
 dunes:{arc:'sirocco',width:3200,height:2200,spots:[{x:1050,y:650,name:'Crista dos ventos'},{x:1550,y:1550,name:'Canal dos grãos escuros'},{x:2450,y:1090,name:'Margem da depressão'}],solids:[{x:1220,y:1130,radius:70},{x:1450,y:1160,radius:80},{x:1680,y:1170,radius:70}]},
 sandpit:{arc:'sirocco',width:1800,height:1500,spots:[{x:550,y:790,name:'Bacia Soterrada'},{x:950,y:790,name:'Rastros sob a areia'},{x:1300,y:840,name:'Margem do selo'}],solids:[]},
};
