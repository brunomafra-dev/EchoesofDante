import Phaser from 'phaser';

const PAINTINGS = [
  'world-rock', 'root-growth', 'world-shadow', 'rock-shelf',
  'mineral-growth', 'ancient-frame', 'ancient-remnant', 'forest-ground', 'cavern-ground',
  'deep-stratum', 'deep-mineral', 'deep-relay',
] as const;
export type EnvironmentPainting = typeof PAINTINGS[number];

export function preloadEnvironment(scene: Phaser.Scene): void {
  const base = `${import.meta.env.BASE_URL}assets/visual/environment/`;
  for (const name of PAINTINGS) {
    if (!scene.textures.exists(name)) scene.load.image(name, `${base}${name}.png`);
  }
  for (const [key, filename] of [
    ['dante-tree-trunk', 'forest-trunk'],
    ['dante-canopy-green', 'forest-canopy'],
    ['dante-canopy-blue', 'forest-canopy'],
  ]) {
    if (!scene.textures.exists(key)) scene.load.image(key, `${base}${filename}.png`);
  }
}

export interface EnvironmentStamp {
  key: EnvironmentPainting | 'dante-canopy-green';
  x: number;
  y: number;
  width: number;
  height: number;
  depth?: number;
  angle?: number;
  tint?: number;
  alpha?: number;
  flipX?: boolean;
}

// Used only while composing static scenery. A small image pool is disposed after
// the bake; painted details never become individual world objects or frame work.
export class EnvironmentPainter {
  private images = new Map<string, Phaser.GameObjects.Image>();
  constructor(private scene: Phaser.Scene, private target: Phaser.GameObjects.RenderTexture) {}

  stamp(s: EnvironmentStamp): void {
    let image = this.images.get(s.key);
    if (!image) {
      image = this.scene.make.image({ key: s.key, add: false });
      this.images.set(s.key, image);
    }
    image.setOrigin(0.5).setDisplaySize(s.width, s.height).setAngle(s.angle ?? 0).setFlipX(s.flipX ?? false)
      .setTint(s.tint ?? 0xffffff).setAlpha(s.alpha ?? 1);
    this.target.draw(image, s.x - this.target.x, s.y - this.target.y);
  }

  rock(x: number, y: number, radius: number, tint = 0xffffff): void {
    const size = radius * 512 / 112;
    const variation = Math.sin(x * 0.013 + y * 0.019);
    for (const key of ['world-shadow', 'world-rock'] as const) {
      this.stamp({ key, x, y, width: size, height: size, tint,
        angle: key === 'world-rock' ? variation * 5 : 0, flipX: variation < 0 });
    }
    this.stamp({ key: 'root-growth', x: x - radius * 0.18, y: y + radius * 0.52,
      width: radius * 1.25, height: radius * 0.48, tint });
  }

  ground(key: 'forest-ground' | 'cavern-ground', alpha: number, maskSource?: Phaser.GameObjects.Graphics): void {
    const tile = this.scene.make.tileSprite({
      key, width: this.target.width, height: this.target.height, add: false,
    }).setOrigin(0).setAlpha(alpha);
    tile.tilePositionX = this.target.x;
    tile.tilePositionY = this.target.y;
    const originalPosition = maskSource && { x: maskSource.x, y: maskSource.y };
    if (maskSource) {
      maskSource.setPosition(maskSource.x - this.target.x, maskSource.y - this.target.y);
      tile.setMask(maskSource.createGeometryMask());
    }
    this.target.draw(tile, 0, 0);
    tile.clearMask(true);
    if (maskSource && originalPosition) maskSource.setPosition(originalPosition.x, originalPosition.y);
    tile.destroy();
  }

  destroy(): void {
    this.images.forEach(image => image.destroy());
    this.images.clear();
  }
}

// Smooth only the low ground/color masses. Physical footprints and painted rock
// silhouettes are independent. Evaluated during the bake, never during update.
export function groundContour(points: Phaser.Types.Math.Vector2Like[]): Phaser.Types.Math.Vector2Like[] {
  let contour = points;
  for (let pass = 0; pass < 2; pass++) {
    const rounded: Phaser.Types.Math.Vector2Like[] = [];
    contour.forEach((a, index) => {
      const b = contour[(index + 1) % contour.length];
      rounded.push({ x: a.x * 0.75 + b.x * 0.25, y: a.y * 0.75 + b.y * 0.25 },
        { x: a.x * 0.25 + b.x * 0.75, y: a.y * 0.25 + b.y * 0.75 });
    });
    contour = rounded;
  }
  return contour;
}

// Static POI paintings keep the old depth and position. Animated inscriptions
// stay separate, using their existing feedback and interaction systems.
export function environmentImage(
  scene: Phaser.Scene, key: EnvironmentPainting, x: number, y: number,
  width: number, height: number, depth: number,
): Phaser.GameObjects.Image {
  return scene.add.image(x, y, key).setDisplaySize(width, height).setDepth(depth);
}
