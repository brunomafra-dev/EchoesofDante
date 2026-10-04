import Phaser from 'phaser';
import type { Vec2 } from '../../utils/math';
import type { SaberPose } from '../../combat/Attack';
import type { KineticPose } from '../../combat/KineticCharge';

// Presentation only. Logical position, aim, attack windows and hit tests never
// come through this module. Invoked only by the isolated reference entry point.
export function poseWarrior(
  left: Phaser.GameObjects.Image, right: Phaser.GameObjects.Image,
  body: Phaser.GameObjects.Container, stride: number, phase: number,
  walking: boolean, travel: Vec2, aim: number, pose: SaberPose, heavy: KineticPose,
  dashing: boolean, hurt: boolean,
): number {
  const brace = heavy.phase !== 'READY';
  const stance = brace ? 13 : 10;
  for (const [leg, side] of [[left, -1], [right, 1]] as const) {
    const swing = walking ? Math.max(0, Math.sin(phase + (side > 0 ? Math.PI : 0))) : 0;
    const offset = stride * side;
    leg.setPosition(side * stance + travel.x * offset * 5, travel.y * offset * 5 - swing * 4);
    leg.setRotation(dashing ? side * 0.1 : offset * 0.035);
    leg.setDisplaySize(40 * (1 + swing * 0.025), 100 * (1 - swing * 0.025));
    leg.setTint(0xf0e8d2);
    if (dashing) leg.setPosition(side * 10 - travel.x * 5, side * 3 - 2);
  }
  // Small visible weight transfer and compression; the hands remain on the
  // original saber rig. Local-to-world conversion respects the existing aim.
  const push = pose.phase === 'SWING' ? Math.sin(pose.swingProgress * Math.PI) * 3 : 0;
  const shiftX = walking ? stride * 1.3 : 0;
  const shiftY = heavy.phase === 'CHARGING' ? 1.8 : hurt ? 2 : 0;
  body.x += shiftX * Math.cos(aim) + shiftY * Math.sin(aim) + push;
  body.y += shiftY * Math.cos(aim) - shiftX * Math.sin(aim);
  return walking ? stride * 0.022 : 0;
}

type Leg = { image: Phaser.GameObjects.Image; x: number; y: number; phase: number; side: number };

export class CrawlerPresentation {
  private readonly legs: Leg[] = [];
  private previousState = 'IDLE';
  private landedAt = -Infinity;

  constructor(scene: Phaser.Scene, private view: Phaser.GameObjects.Container,
    fore: Phaser.GameObjects.Image, rear: Phaser.GameObjects.Image,
    private body: Phaser.GameObjects.Image) {
    // Frames only select existing painted pixels. Four independent limbs,
    // no image generation/readback/texture upload during gameplay.
    fore.setVisible(false); rear.setVisible(false);
    for (const [key, px, py, offset] of [
      ['hollow-rear-limbs', 114, 90, Math.PI],
      ['hollow-forelimbs', 192, 96, 0],
    ] as const) {
      const texture = scene.textures.get(key);
      for (const [half, side] of [[0, -1], [1, 1]] as const) {
        const name = `reference-half-${half}`;
        if (!texture.has(name)) texture.add(name, 0, 0, half * 128, 320, 128);
        const pivotY = side < 0 ? py : 256 - py;
        const x = (px - 160) / 4, y = (pivotY - 128) / 4;
        const image = scene.add.image(x, y, key, name).setOrigin(px / 320, (pivotY - half * 128) / 128)
          .setDisplaySize(80, 32).setTint(0xe4e0cc);
        view.addAt(image, key === 'hollow-rear-limbs' ? 0 : view.length - 1);
        this.legs.push({ image, x, y, side, phase: offset + half * Math.PI });
      }
    }
    body.setTint(0xe4e0cc);
  }

  update(now: number, travelPhase: number, moving: boolean, state: string, recoil: number, windupRemaining: number): void {
    if (this.previousState === 'ATTACK' && state === 'CHASE') this.landedAt = now;
    this.previousState = state;
    const lunge = Math.max(0, 1 - (now - this.landedAt) / 130);
    const brace = state === 'ATTACK' ? 1 - Math.min(1, windupRemaining / 330) : 0;
    for (const leg of this.legs) {
      const phase = travelPhase + leg.phase;
      const swing = moving ? Math.max(0, Math.sin(phase)) : 0;
      const stride = moving ? Math.cos(phase) : 0;
      leg.image.setPosition(leg.x + stride * 3 - recoil * 3 + lunge * 4,
        leg.y + leg.side * (brace * 2 - swing * 2));
      leg.image.setRotation(leg.side * (stride * 0.15 - brace * 0.09 + lunge * 0.13));
    }
    const breathe = Math.sin(now * 0.003) * 0.005;
    this.body.setPosition(-recoil * 3 + lunge * 5 - brace * 2, 0)
      .setDisplaySize(80 * (1 + breathe - brace * 0.04 + lunge * 0.04), 64 * (1 - breathe + brace * 0.035));
    this.view.setScale(1 - recoil * 0.04, 1 + recoil * 0.025);
  }
}
