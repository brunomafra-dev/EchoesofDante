// Shared only by the two single-instrument human rigs and their menu previews.
export type CasterIdentity='astral'|'xenobinder';
export type Joint={x:number;y:number};
export type ArmPose={shoulder:Joint;elbow:Joint;wrist:Joint};
export const CASTER_COLUMNS=5;
export const CASTER_WALK=[1,2,3,4] as const;
// Pixel registration in the authored 128x96 weapon canvases, not their centers.
export const CASTER_INSTRUMENTS={
 astral:{starter:{wrist:{x:88,y:48},muzzle:{x:118,y:48},width:27},current:{wrist:{x:88,y:48},muzzle:{x:117,y:48},width:27},advanced:{wrist:{x:88,y:48},muzzle:{x:118,y:48},width:29}},
 xenobinder:{starter:{wrist:{x:34,y:68},muzzle:{x:111,y:23},width:30},current:{wrist:{x:34,y:65},muzzle:{x:114,y:29},width:30},advanced:{wrist:{x:36,y:64},muzzle:{x:114,y:32},width:32}},
} as const;
export function casterTargets(sx:number,sy:number,ox:number,oy:number,aim:number,firing:boolean,charging:boolean,gait:number,main:ArmPose,other:ArmPose):void{
 // The worn gauntlet and casting forearm share an axis. Resting elbows stay
 // close to the body rather than forming the old outward zigzag.
 const c=Math.cos(aim),s=Math.sin(aim),side=Math.sign(sx)||-1;
 const t=Math.max(0,Math.min(1,(-s-.15)/.7)),up=t*t*(3-2*t);
 const ux=c*8+side*3*(1-Math.abs(c)),uy=(17-(charging?2:firing?1:0))*(1-up)+(6+s*10)*up,length=Math.hypot(ux,uy);
 main.shoulder.x=sx;main.shoulder.y=sy;
 main.elbow.x=sx+ux/length*18;main.elbow.y=sy+uy/length*18;
 main.wrist.x=main.elbow.x+c*15;main.wrist.y=main.elbow.y+s*15;
 const outward=Math.sign(ox)||1,upperX=outward*(2+gait),foreX=outward*(-1+gait*.3);
 other.shoulder.x=ox;other.shoulder.y=oy;
 other.elbow.x=ox+upperX;other.elbow.y=oy+Math.sqrt(18*18-upperX*upperX);
 other.wrist.x=other.elbow.x+foreX;other.wrist.y=other.elbow.y+Math.sqrt(15*15-foreX*foreX);
}
