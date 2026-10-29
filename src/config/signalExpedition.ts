import type {Vec2} from '../utils/math';

export const SIGNAL_RECEIVER={x:1750,y:900,target:{x:2050,y:830},radius:72} as const;
export const SIGNAL_LOG={x:1890,y:1060} as const;
export function signalAligned(position:Vec2,aim:number,target:Vec2=SIGNAL_RECEIVER.target):boolean{
 if(![position.x,position.y,aim,target.x,target.y].every(Number.isFinite))return false;
 const angle=Math.atan2(target.y-position.y,target.x-position.x)-aim;
 return Math.abs(Math.atan2(Math.sin(angle),Math.cos(angle)))<=.3;
}
