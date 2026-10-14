// Shared only by the two single-instrument human rigs and their menu previews.
export type CasterIdentity='astral'|'xenobinder';
export type Joint={x:number;y:number};
export type ArmPose={shoulder:Joint;elbow:Joint;wrist:Joint};
export const CASTER_COLUMNS=5;
export const CASTER_WALK=[1,2,3,4] as const;
// Pixel registration in the authored 128x96 weapon canvases, not their centers.
export const CASTER_INSTRUMENTS={
 astral:{starter:{wrist:{x:88,y:48},muzzle:{x:118,y:48},width:27},current:{wrist:{x:88,y:48},muzzle:{x:117,y:48},width:27},advanced:{wrist:{x:88,y:48},muzzle:{x:118,y:48},width:29}},
 xenobinder:{starter:{wrist:{x:18,y:68},muzzle:{x:111,y:23},width:30},current:{wrist:{x:18,y:65},muzzle:{x:114,y:29},width:30},advanced:{wrist:{x:19,y:64},muzzle:{x:114,y:32},width:32}},
} as const;
export function solveCasterArm(sx:number,sy:number,wx:number,wy:number,outward:number,out:ArmPose):void{
 const dx=wx-sx,dy=wy-sy,d=Math.max(.001,Math.hypot(dx,dy)),reach=Math.max(5,Math.min(32,d)),ux=dx/d,uy=dy/d;
 const upper=18,fore=15,a=(upper*upper-fore*fore+reach*reach)/(2*reach),h=Math.sqrt(Math.max(0,upper*upper-a*a));
 const bx=sx+ux*a,by=sy+uy*a;
 // Prefer a downward elbow during side aim and an outward elbow for vertical aim.
 const sign=Math.abs(ux)>.35?(ux>0?1:-1):(outward>0?-1:1);
 out.shoulder.x=sx;out.shoulder.y=sy;out.elbow.x=bx-uy*h*sign;out.elbow.y=by+ux*h*sign;
 out.wrist.x=sx+ux*reach;out.wrist.y=sy+uy*reach;
}
export function casterTargets(sx:number,sy:number,ox:number,oy:number,aim:number,firing:boolean,charging:boolean,gait:number,main:ArmPose,other:ArmPose):void{
 const c=Math.cos(aim),s=Math.sin(aim),reach=charging?19:firing?25:22;
 solveCasterArm(sx,sy,sx+c*reach,sy+s*reach*.65+11,Math.sign(sx)||-1,main);
 solveCasterArm(ox,oy,ox+(Math.sign(ox)||1)*5,oy+30+gait*2.5,Math.sign(ox)||1,other);
}
