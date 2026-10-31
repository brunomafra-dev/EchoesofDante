import type {Vec2} from '../utils/math';
import type {Obstacle} from '../systems/Movement';
import {pushSurvey,type SurveyPusher} from './windSurvey';

// Use the EXISTING rock at (1260,1230). Its dry northern side is the cargo
// route; the shallow meltwater film on the southern bank supports walkers,
// but not the loaded skids. Deep water and region bounds are untouched.
export const ICE_TRANSFER={
 start:{x:1050,y:1200},dock:{x:1510,y:1220},reset:{x:990,y:1250},
 kit:{x:790,y:850},log:{x:1580,y:1220},
 radius:24,speed:110,dockRadius:25,
 bounds:{left:960,right:1620,top:1030,bottom:1410},
 wet:{left:1160,right:1395,top:1285,bottom:1400},
} as const;
export function cargoWet(p:Vec2):boolean{
 const w=ICE_TRANSFER.wet,r=ICE_TRANSFER.radius;
 return p.x>w.left-r&&p.x<w.right+r&&p.y>w.top-r&&p.y<w.bottom+r;
}
export function iceDocked(p:Vec2):boolean{return Number.isFinite(p.x)&&Number.isFinite(p.y)&&Math.hypot(p.x-ICE_TRANSFER.dock.x,p.y-ICE_TRANSFER.dock.y)<=ICE_TRANSFER.dockRadius;}
export function pushIceTransfer(p:Vec2,actors:readonly SurveyPusher[],dt:number,solids:readonly Obstacle[]):'idle'|'moved'|'wet'{
 const before={...p};if(!pushSurvey(p,actors,dt,solids,ICE_TRANSFER))return 'idle';
 if(cargoWet(p)){Object.assign(p,before);return 'wet';}return 'moved';
}
