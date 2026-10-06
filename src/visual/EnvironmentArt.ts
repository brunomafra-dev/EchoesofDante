import Phaser from 'phaser';

const PAINTINGS = [
  'world-rock', 'root-growth', 'world-shadow', 'rock-shelf',
  'mineral-growth', 'ancient-frame', 'ancient-remnant', 'forest-ground', 'cavern-ground', 'cavern-soil',
  'deep-stratum', 'deep-mineral', 'deep-relay',
  'exterior-outcrop', 'ancient-approach', 'exterior-atmosphere',
  'first-echo-archive', 'sealed-threshold', 'open-threshold', 'terrain-blend',
  'guardian-lintel-closed', 'guardian-lintel-open', 'resonance-growth',
] as const;
export type EnvironmentPainting = typeof PAINTINGS[number];

type Occluder = { image: Phaser.GameObjects.Image; alpha: number; width: number; height: number; coverage: Uint8ClampedArray };
const occluders = new WeakMap<Phaser.Scene, Occluder[]>();
const coverageCache = new WeakMap<Phaser.Textures.Texture, Uint8ClampedArray>();
const actorSamples = [[-12,-72],[0,-72],[12,-72],[-12,-42],[0,-42],[12,-42],[-12,-12],[0,-12],[12,-12]];

function textureCoverage(image: Phaser.GameObjects.Image): Uint8ClampedArray {
  const cached = coverageCache.get(image.texture);
  if (cached) return cached;
  // Read a 32-square visual occupancy grid once per shared texture. This is not
  // physics, a GPU texture or per-frame pixel reading. Empty gate throats stay
  // fully visible instead of fading the entire monument through its rectangle.
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 32;
  const context = canvas.getContext('2d', { willReadFrequently: true })!;
  context.drawImage(image.texture.getSourceImage() as HTMLImageElement, 0, 0, 32, 32);
  const pixels = context.getImageData(0, 0, 32, 32).data;
  const coverage = new Uint8ClampedArray(1024);
  for (let i = 0; i < coverage.length; i++) coverage[i] = pixels[i * 4 + 3];
  coverageCache.set(image.texture, coverage);
  return coverage;
}

export function resetEnvironmentOcclusion(scene: Phaser.Scene): void {
  occluders.set(scene, []);
}

// Only raised environmental bodies participate. No gameplay state, listeners,
// masks or tweens: this bounded list is rebuilt on the existing scene restart.
export function trackEnvironmentOcclusion(scene: Phaser.Scene, image: Phaser.GameObjects.Image): void {
  const list = occluders.get(scene) ?? [];
  if (list.some(entry => entry.image === image)) return;
  list.push({ image, alpha: image.alpha, width: image.texture.key === 'world-rock' ? 0.46 : 0.86,
    height: image.texture.key === 'world-rock' ? 0.4 : 0.86, coverage: textureCoverage(image) });
  occluders.set(scene, list);
}

export function updateEnvironmentOcclusion(scene: Phaser.Scene, feet: { x: number; y: number }, dt: number): void {
  for (const entry of occluders.get(scene) ?? []) {
    const image = entry.image;
    // Opening/fading a gate owns its alpha until that finite transition ends.
    if (!image.active || !image.visible || image.getData('environmentFadeDisabled')) continue;
    const centerX = image.x + (0.5 - image.originX) * image.displayWidth;
    const centerY = image.y + (0.5 - image.originY) * image.displayHeight;
    const halfWidth = image.displayWidth * entry.width * 0.5;
    const halfHeight = image.displayHeight * entry.height * 0.5;
    const overlap = image.depth > feet.y && feet.x + 18 > centerX - halfWidth && feet.x - 18 < centerX + halfWidth
      && feet.y + 6 > centerY - halfHeight && feet.y - 90 < centerY + halfHeight;
    let covering = false;
    if (overlap) {
      const cos = Math.cos(image.rotation), sin = Math.sin(image.rotation);
      for (const [ox, oy] of actorSamples) {
        const dx = feet.x + ox - image.x, dy = feet.y + oy - image.y;
        let u = (cos * dx + sin * dy) / image.displayWidth + image.originX;
        let v = (-sin * dx + cos * dy) / image.displayHeight + image.originY;
        if (image.flipX) u = 1 - u;
        if (image.flipY) v = 1 - v;
        if (u >= 0 && u < 1 && v >= 0 && v < 1 && entry.coverage[Math.floor(v * 32) * 32 + Math.floor(u * 32)] > 96) {
          covering = true;
          break;
        }
      }
    }
    const target = entry.alpha * (covering ? 0.28 : 1);
    image.setAlpha(Phaser.Math.Linear(image.alpha, target, Math.min(1, dt * 12)));
  }
}

// One stationary textured quad under every cache, including cache margins.
// The material is authored offline; no runtime procedural floor or giant PNG.
export function createEnvironmentGround(
  scene: Phaser.Scene,
  width: number,
  material: 'cavern-soil' | 'cavern-ground' | 'forest-ground' = 'cavern-soil',
  tint = 0xb7c4b5,
): void {
  // Keep the TileSprite backing canvas at 512 square, rather than allocating a
  // world-sized canvas. Inverse tile scale preserves 512 world units per repeat.
  scene.add.tileSprite(0, 0, 512, 512, material).setOrigin(0)
    .setDisplaySize(width, 1500).setTileScale(512 / width, 512 / 1500)
    .setDepth(-10001.5).setTint(tint).setName(`continuous-${material}`);
}

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
  frame?: string;
}

// The existing shadow PNG has a large transparent canvas and an off-center
// painted footprint. This frame crops padding only; no texture is generated.
export function contactStamp(x: number, y: number, width: number, height: number, alpha = 0.8): EnvironmentStamp {
  return { key: 'world-shadow', frame: 'ground-contact', x, y, width, height, alpha, depth: -10000 };
}

export function rockStamps(x: number, y: number, radius: number, tint = 0xcbd3c6, heightRatio = 0.92): EnvironmentStamp[] {
  const size = radius * 512 / 112;
  const variation = Math.sin(x * 0.013 + y * 0.019);
  const foot = y + radius * 0.65;
  return [
    contactStamp(x, foot - radius * 0.12, radius * 2.25, radius * 0.64, 0.88),
    { key: 'world-rock', x, y: heightRatio === 0.92 ? y - radius * 0.05 : foot - size * heightRatio * (343 / 512 - 0.5), width: size, height: size * heightRatio,
      depth: foot, tint, angle: variation * 5, flipX: variation < 0 },
    { key: 'root-growth', x: x - radius * 0.24, y: foot + radius * 0.06,
      width: radius * 1.4, height: radius * 0.38, tint, alpha: 0.65, depth: -10000 },
    { key: 'world-rock', x: x + radius * 0.87, y: foot - radius * 0.06,
      width: radius * 0.56, height: radius * 0.45, tint, alpha: 0.8, flipX: true, depth: -10000 },
  ];
}

// Used only while composing static scenery. The stamp pool is disposed after
// bake. A few explicit raised bodies remain static Images for foot sorting.
export class EnvironmentPainter {
  private images = new Map<string, Phaser.GameObjects.Image>();
  constructor(private scene: Phaser.Scene, private target: Phaser.GameObjects.RenderTexture) {}

  stamp(s: EnvironmentStamp): void {
    if (s.frame === 'ground-contact' && !this.scene.textures.get(s.key).has(s.frame)) {
      this.scene.textures.get(s.key).add(s.frame, 0, 121, 274, 293, 131);
    }
    const poolKey = `${s.key}/${s.frame ?? ''}`;
    let image = this.images.get(poolKey);
    if (!image) {
      image = this.scene.make.image({ key: s.key, frame: s.frame, add: false });
      this.images.set(poolKey, image);
    }
    image.setOrigin(0.5).setDisplaySize(s.width, s.height).setAngle(s.angle ?? 0).setFlipX(s.flipX ?? false)
      .setTint(s.tint ?? 0xffffff).setAlpha(s.alpha ?? 1);
    this.target.draw(image, s.x - this.target.x, s.y - this.target.y);
  }

  rock(x: number, y: number, radius: number, tint = 0xcbd3c6, raised = false): void {
    this.sediment(x, y + radius * 0.53, radius * 3.6, radius * 1.65, 0x676b55, 0.26);
    for (const stamp of rockStamps(x, y, radius, tint, 0.75)) {
      if (raised && stamp.depth !== -10000) this.raised(stamp);
      else this.stamp(stamp);
    }
  }

  // Only a few obstacles within walkable space need independent foot sorting.
  // Perimeter masses stay baked. These static Images have no update or tween.
  raised(s: EnvironmentStamp): void {
    const image = this.scene.add.image(s.x, s.y, s.key).setDisplaySize(s.width, s.height)
      .setDepth(s.depth ?? s.y).setAngle(s.angle ?? 0).setFlipX(s.flipX ?? false)
      .setTint(s.tint ?? 0xffffff).setAlpha(s.alpha ?? 1);
    trackEnvironmentOcclusion(this.scene, image);
  }

  contact(x: number, y: number, width: number, height: number, alpha = 0.8): void {
    this.stamp(contactStamp(x, y, width, height, alpha));
  }

  // Broad material transitions, captured into the existing cache. The offline
  // feather mask has a fully transparent edge; it cannot draw a floor rectangle.
  sediment(x: number, y: number, width: number, height: number, tint = 0x727a63, alpha = 0.24): void {
    this.stamp({ key: 'terrain-blend', x, y, width, height, tint, alpha,
      angle: Math.sin(x * 0.008 + y * 0.006) * 12 });
  }

  apron(x: number, y: number, width: number, tint = 0xa5b69f): void {
    // Shallow sediment, a root and tiny rubble join the prop to the terrain.
    // Decorative marks are well below a body-sized obstacle and remain flat.
    this.sediment(x, y, width * 1.6, width * 0.8, 0x686d52, 0.32);
    this.contact(x, y, width * 1.22, width * 0.32, 0.3);
    this.contact(x, y - width * 0.035, width * 0.87, width * 0.18, 0.8);
    const flip = Math.sin(x * 0.017 + y * 0.023) < 0;
    this.stamp({ key: 'root-growth', x: x - width * 0.18, y: y + width * 0.015,
      width: width * 0.65, height: width * 0.18, angle: flip ? -12 : 8, flipX: flip, tint, alpha: 0.55 });
    for (const [dx, dy, scale] of [[0.4, 0.03, 0.19], [-0.42, -0.01, 0.13]]) {
      this.stamp({ key: 'world-rock', x: x + width * dx, y: y + width * dy,
        width: width * scale, height: width * scale * 0.8, tint, alpha: 0.65, flipX: flip });
    }
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
