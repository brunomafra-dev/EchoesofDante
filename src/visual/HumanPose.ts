import type { PaintedArmPart } from './PaintedArmFrames';
import type { ArmPose, Joint } from './CasterPose';
import type { SaberPose } from '../combat/Attack';
import type { KineticPose } from '../combat/KineticCharge';

// Pure geometry shared by Canvas portraits and Phaser actors. All coordinates
// are attachment points in the painting, never the bounding-box centre.
export function projectShoulder(socket: Joint, x: number, y: number, scaleX: number, scaleY: number, flipped: boolean, out: Joint): void {
  out.x = x + (socket.x - 128) * scaleX * (flipped ? -1 : 1);
  out.y = y + (socket.y - 128) * scaleY;
}
export function heldArm(sx: number, sy: number, wx: number, wy: number, side: number, length: number, maxBend: number, out: ArmPose): void {
  const dx = wx - sx, dy = wy - sy, distance = Math.max(.001, Math.hypot(dx, dy));
  const bone = Math.max(length, distance / 2 + .5);
  const bend = Math.min(maxBend, Math.sqrt(Math.max(0, bone * bone - distance * distance / 4)));
  out.shoulder.x = sx; out.shoulder.y = sy;
  out.elbow.x = sx + dx / 2 - dy / distance * bend * side;
  out.elbow.y = sy + dy / 2 + dx / distance * bend * side;
  out.wrist.x = wx; out.wrist.y = wy;
}
export function paintedSegment(part: PaintedArmPart, a: Joint, b: Joint): { scale: number; angle: number } {
  const dx = part.tip.x - part.root.x, dy = part.tip.y - part.root.y;
  return { scale: Math.hypot(b.x - a.x, b.y - a.y) / Math.hypot(dx, dy), angle: Math.atan2(b.y - a.y, b.x - a.x) - Math.atan2(dy, dx) };
}
export function paintedHand(part:PaintedArmPart,angle:number,length=7.5,reverse=false):{scale:number;angle:number}{
  const dx=part.tip.x-part.root.x,dy=part.tip.y-part.root.y;
  return {scale:length/Math.hypot(dx,dy),angle:angle-Math.atan2(reverse?-dy:dy,dx)};
}
export function warriorHand(aim: number, shoulderY: number, reach: number, sweep: number, out: Joint): void {
  const c = Math.cos(aim), s = Math.sin(aim);
  out.x = 22 * c - 9 * s + c * reach - s * sweep;
  out.y = shoulderY + 13 + 12 * s + s * reach + c * sweep;
}
export function newArm(): ArmPose { return { shoulder: { x: 0, y: 0 }, elbow: { x: 0, y: 0 }, wrist: { x: 0, y: 0 } }; }
export function warriorReach(heavy:KineticPose):number { return heavy.phase==='CHARGING'?-4-heavy.level*4:heavy.phase==='RELEASE'?Math.sin(heavy.swingProgress*Math.PI)*8:0; }
export function warriorSweep(pose:SaberPose):number { return pose.phase==='READY'?0:pose.relativeAngle*3; }
