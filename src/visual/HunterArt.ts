import Phaser from 'phaser';

type Part = { frame: number; width: number; height: number };
export function preloadHunterArt(scene: Phaser.Scene): void {
  if (!scene.textures.exists('star-hunter-rig')) scene.load.spritesheet('star-hunter-rig',
    `${import.meta.env.BASE_URL}assets/visual/characters/star-hunter-rig.png`, { frameWidth: 256, frameHeight: 256 });
  if (!scene.cache.json.exists('star-hunter-rig-parts')) scene.load.json('star-hunter-rig-parts',
    `${import.meta.env.BASE_URL}assets/visual/characters/star-hunter-rig.json`);
}

// Presentation only: articulation at hips/knees, independent of the aimed rifle.
// Actual displacement drives the gait; blocked movement never walks in place.
export class HunterArt {
  private readonly body: Phaser.GameObjects.Image;
  private readonly legs: { thigh: Phaser.GameObjects.Image; shin: Phaser.GameObjects.Image }[];
  private travel = 0;
  private previous: { x: number; y: number };
  constructor(scene: Phaser.Scene, private view: Phaser.GameObjects.Container, x: number, y: number) {
    view.list.forEach(part => (part as unknown as Phaser.GameObjects.Components.Visible).setVisible(false));
    const texture = scene.textures.get('star-hunter-rig');
    for (const part of scene.cache.json.get('star-hunter-rig-parts') as Part[]) {
      const name = `part-${part.frame}`;
      if (!texture.has(name)) texture.add(name, 0, part.frame % 5 * 256 + Math.floor((256 - part.width) / 2),
        Math.floor(part.frame / 5) * 256 + 16, part.width, part.height);
    }
    this.legs = [0, 1].map(() => ({
      thigh: scene.add.image(0, 0, 'star-hunter-rig', 'part-1').setOrigin(.5, .06),
      shin: scene.add.image(0, 0, 'star-hunter-rig', 'part-2').setOrigin(.5, .06),
    }));
    this.body = scene.add.image(0, -1, 'star-hunter-rig', 'part-0').setOrigin(.5, 1);
    for (const leg of this.legs) view.add([leg.thigh, leg.shin]);
    view.add(this.body); this.previous = { x, y };
    this.update(x, y, 0, false);
  }
  update(x: number, y: number, aim: number, firing: boolean, dashing = false): void {
    const dx = x - this.previous.x, dy = y - this.previous.y, moved = Math.hypot(dx, dy);
    this.previous = { x, y };
    const walking = moved > .05 && moved < 30 && !dashing;
    if (walking) this.travel += moved;
    const vx = Math.cos(aim), vy = Math.sin(aim), vertical = Math.abs(vy) > Math.abs(vx);
    const row = vertical ? vy > 0 ? 0 : 1 : 2, flip = !vertical && vx < 0;
    this.view.setRotation(0);
    this.body.setFrame(`part-${row * 5}`).setFlipX(flip);
    this.body.setDisplaySize(this.body.frame.realWidth / this.body.frame.realHeight * 61, 61)
      .setPosition(row === 2 ? (flip ? -14 : 14) : 0, -1)
      .setRotation(firing ? (flip ? -.018 : .018) : 0);
    for (let i = 0; i < 2; i++) {
      const leg = this.legs[i], side = i === 0 ? -1 : 1;
      const phase = (this.travel / 104 + i * .5) % 1;
      const swing = phase >= .5, t = (phase - .5) * 2;
      const along = !walking ? 0 : swing ? -26 + 52 * t * t * (3 - 2 * t) : 26 - 104 * phase;
      const lift = walking && swing ? Math.sin(t * Math.PI) * 7 : 0;
      const hip = { x: side * (row === 2 ? 5 : 8), y: -3 };
      const foot = { x: side * (row === 2 ? 6 : 9) + (walking ? dx / moved * along : 0),
        y: 39 + (walking ? dy / moved * along * .2 : 0) - lift };
      const fx = foot.x - hip.x, fy = foot.y - hip.y;
      const distance = Math.max(1, Math.hypot(fx, fy)), length = Math.min(43.5, distance);
      const ux = fx / distance, uy = fy / distance;
      const bend = Math.sqrt(Math.max(0, 22 * 22 - length * length / 4));
      const bendSide = row === 2 ? (flip ? -1 : 1) : side;
      // Fore/aft knee flexion projects mostly into depth in front/back views;
      // full sideways bending there would look like a bow-legged crab walk.
      const projectedBend = bend * (row === 2 ? 1 : .25);
      const knee = { x: hip.x + ux * length / 2 + uy * projectedBend * bendSide,
        y: hip.y + uy * length / 2 - ux * projectedBend * bendSide };
      const end = { x: hip.x + ux * length, y: hip.y + uy * length };
      leg.thigh.setFrame(`part-${row * 5 + (i === 0 ? 1 : 3)}`).setFlipX(flip);
      leg.shin.setFrame(`part-${row * 5 + (i === 0 ? 2 : 4)}`).setFlipX(flip);
      for (const [image, from, to] of [[leg.thigh, hip, knee], [leg.shin, knee, end]] as const) {
        image.setDisplaySize(image.frame.realWidth / image.frame.realHeight * 24, Math.hypot(to.x - from.x, to.y - from.y) + 2)
          .setPosition(from.x, from.y).setRotation(Math.atan2(to.y - from.y, to.x - from.x) - Math.PI / 2);
      }
    }
  }
}
