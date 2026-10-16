import type Phaser from 'phaser';
import { projectShoulder } from './HumanPose';

export type ShoulderPoint={x:number;y:number};
export type ShoulderSockets={left:ShoulderPoint;right:ShoulderPoint};

// Project the authored socket with the same frame/flip/scale as its body.
// Callers reuse their output points; no alpha scans or buffers during gameplay.
export function clothShoulder(body:Phaser.GameObjects.Image,side:'left'|'right',out:ShoulderPoint):void {
  const sockets=body.getData('clothShoulders') as ShoulderSockets[];
  const frame=Number(body.frame.name);
  const row=body.texture.key.endsWith('-back')?1:body.texture.key.endsWith('-side')?2:0;
  const socket=sockets[body.texture.key.endsWith('-all')?frame:row*4+frame][side];
  projectShoulder(socket,body.x,body.y,body.scaleX,body.scaleY,body.flipX,out);
}
