import type {Vec2} from '../utils/math';

// Protected bank below the existing warm-water analysis. No terrain/relay
// changes, nor a route to the next region supplied by the chapter.
export const FROST_WATER={
 mount:{x:940,y:1050},body:{x:940,y:980},
 inlet:{x:840,y:1020},bypass:{x:1040,y:1020},sample:{x:940,y:1080},
 source:{x:790,y:880},kit:{x:520,y:620},treatment:{x:470,y:660},
 radius:62,
} as const;
export type ColdValve='inlet'|'bypass'|'sample';
export function coldFlow(inletOpen:boolean,bypassClosed:boolean):'dry'|'return'|'vessel'{
 return !inletOpen?'dry':bypassClosed?'vessel':'return';
}
export const nearColdControl=(p:Vec2,q:Vec2)=>Math.hypot(p.x-q.x,p.y-q.y)<FROST_WATER.radius;
