import Phaser from 'phaser';
import type { SaberPose } from '../combat/Attack';
import type { KineticPose } from '../combat/KineticCharge';
import type { Vec2 } from '../utils/math';

const KEYS = ['warrior-poses-front', 'warrior-poses-side', 'warrior-poses-back'] as const;
const WALK_FRAMES = [1, 2, 3, 0] as const;
const SHOULDERS = [-30, -31, -31, -31, -25, -27, -19, -16] as const;

export function preloadWarriorArt(scene: Phaser.Scene): void {
  for (const key of KEYS) {
    if (!scene.textures.exists(key)) scene.load.spritesheet(key,
      `${import.meta.env.BASE_URL}assets/visual/characters/${key}.png`,
      { frameWidth: 256, frameHeight: 256 });
  }
}

// Presentation only: painted body/legs replace the old torso and two boots.
// Arms and both saber grips keep their existing continuous aiming rig.
export class WarriorArt {
  shoulderY = -30;
  constructor(private readonly body: Phaser.GameObjects.Image) {
    body.setTexture(KEYS[0], 0).setDisplaySize(128, 128).setPosition(0, -15);
  }

  update(aim: number, step: number, walking: boolean, travel: Vec2,
    pose: SaberPose, heavy: KineticPose, dashing: boolean): void {
    const x = Math.cos(aim), y = Math.sin(aim);
    const vertical = Math.abs(y) > Math.abs(x);
    const key = vertical ? (y > 0 ? KEYS[0] : KEYS[2]) : KEYS[1];
    let frame = 0;
    if (heavy.phase === 'CHARGING') frame = 6;
    else if (heavy.phase === 'RELEASE') frame = 5;
    else if (dashing) frame = 7;
    else if (pose.phase === 'WINDUP') frame = 4;
    else if (pose.phase === 'SWING') frame = 5;
    else if (pose.phase === 'RECOVERY') frame = 4;
    else if (walking) {
      // Feet advance with distance actually travelled, including backing up.
      // Passing poses separate the two planted steps; no timer keeps walking
      // against a wall and no new animations/tweens are allocated per frame.
      const backwards = travel.x * x + travel.y * y < -0.2;
      const phase = ((step * (backwards ? -1 : 1)) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
      frame = WALK_FRAMES[Math.floor(phase / (Math.PI / 2))];
    }
    if (this.body.texture.key !== key || Number(this.body.frame.name) !== frame) this.body.setTexture(key, frame);
    this.body.setFlipX(!vertical && x < 0);
    this.shoulderY = SHOULDERS[frame];
  }
}
