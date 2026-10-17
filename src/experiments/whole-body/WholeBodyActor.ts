import Phaser from 'phaser';
import type { KineticPose } from '../../combat/KineticCharge';
import { ASTRAL } from '../../config/classes';
import type { Player } from '../../entities/Player';

type Frame = { index: number; direction: string; action: string; muzzle: { x: number; y: number } };
export class WholeBodyActor {
  readonly image: Phaser.GameObjects.Image;
  private travel = 0;
  private previous = { x: 0, y: 0 };
  private frames: Frame[];
  constructor(scene: Phaser.Scene, player: Player) {
    this.frames = scene.cache.json.get('whole-frames').frames;
    this.previous = { ...player.position };
    this.image = scene.add.image(player.position.x, player.position.y + 39, 'whole-astral', 0)
      .setOrigin(.5, 244 / 256).setDisplaySize(128, 128);
  }
  direction(aim: number): number { return ((Math.round((Math.PI / 2 - aim) / (Math.PI / 4)) % 8) + 8) % 8; }
  projectileOffset(aim: number): { x: number; y: number } {
    const palm = this.frames[this.direction(aim) * 4 + 3].muzzle;
    return { x: (palm.x - 128) * .5 - Math.cos(aim) * ASTRAL.muzzleDistance,
      y: 39 + (palm.y - 244) * .5 - Math.sin(aim) * ASTRAL.muzzleDistance };
  }
  update(player: Player, aim: number, firing: boolean, heavy: KineticPose): void {
    const dx = player.position.x - this.previous.x, dy = player.position.y - this.previous.y;
    const moved = Math.hypot(dx, dy);
    const walking = moved > .05 && moved < 32 && !player.isDashing && heavy.phase === 'READY';
    if (walking) this.travel += moved * (dx * Math.cos(aim) + dy * Math.sin(aim) < 0 ? -1 : 1);
    Object.assign(this.previous, player.position);
    const phase = ((this.travel / 104) % 1 + 1) % 1;
    const column = firing || heavy.phase !== 'READY' ? 3 : walking ? [0, 1, 0, 2][Math.floor(phase * 4)] : 0;
    this.image.setFrame(this.direction(aim) * 4 + column).setPosition(player.position.x, player.position.y + 39)
      .setDepth(player.position.y).setRotation(0).setAlpha(player.isDashing ? .74 : 1);
  }
}
