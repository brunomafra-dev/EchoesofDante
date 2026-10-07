import Phaser from 'phaser';
export function preloadHunterArt(scene: Phaser.Scene): void {
  if (!scene.textures.exists('star-hunter-poses')) scene.load.spritesheet('star-hunter-poses',
    `${import.meta.env.BASE_URL}assets/visual/characters/star-hunter-poses.png`, { frameWidth: 256, frameHeight: 256 });
}
export class HunterArt {
  private readonly body: Phaser.GameObjects.Image;
  private travel = 0;
  private previous: { x: number; y: number };
  constructor(scene: Phaser.Scene, private view: Phaser.GameObjects.Container, x: number, y: number) {
    view.list.forEach(part => (part as unknown as Phaser.GameObjects.Components.Visible).setVisible(false));
    this.body = scene.add.image(0, 39, 'star-hunter-poses', 0).setOrigin(.5, 244 / 256).setDisplaySize(108, 108);
    view.add(this.body); this.previous = { x, y };
  }
  update(x: number, y: number, aim: number, firing: boolean): void {
    const moved = Math.hypot(x - this.previous.x, y - this.previous.y);
    this.travel += moved; this.previous = { x, y };
    const vx = Math.cos(aim), vy = Math.sin(aim), vertical = Math.abs(vy) > Math.abs(vx);
    const row = vertical ? vy > 0 ? 0 : 1 : 2;
    const pose = firing ? 3 : moved > .1 ? 1 + Math.floor(this.travel / 22) % 2 : 0;
    this.view.setRotation(0);
    this.body.setFrame(row * 4 + pose).setFlipX(!vertical && vx < 0);
  }
}
