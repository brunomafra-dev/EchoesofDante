import Phaser from 'phaser';
import { normalized, type Vec2 } from '../utils/math';

export class Controls {
  private keys: Record<'W' | 'A' | 'S' | 'D' | 'Q' | 'SPACE' | 'R' | 'E', Phaser.Input.Keyboard.Key>;

  constructor(private scene: Phaser.Scene) {
    this.keys = scene.input.keyboard!.addKeys('W,A,S,D,Q,SPACE,R,E') as typeof this.keys;
    scene.input.mouse?.disableContextMenu();
  }

  movement(): Vec2 {
    return normalized(Number(this.keys.D.isDown) - Number(this.keys.A.isDown), Number(this.keys.S.isDown) - Number(this.keys.W.isDown));
  }

  aimFrom(position: Vec2): number {
    const pointer = this.scene.input.activePointer;
    const world = this.scene.cameras.main.getWorldPoint(pointer.x, pointer.y);
    return Math.atan2(world.y - position.y, world.x - position.x);
  }

  get attacking(): boolean { return this.scene.input.activePointer.isDown && this.scene.input.activePointer.leftButtonDown(); }
  get dashPressed(): boolean { return Phaser.Input.Keyboard.JustDown(this.keys.SPACE); }
  get chargePressed(): boolean { return Phaser.Input.Keyboard.JustDown(this.keys.Q); }
  get restartPressed(): boolean { return Phaser.Input.Keyboard.JustDown(this.keys.R); }
  get interactPressed(): boolean { return Phaser.Input.Keyboard.JustDown(this.keys.E); }
}
