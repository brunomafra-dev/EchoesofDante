import Phaser from 'phaser';
import { normalized, type Vec2 } from '../utils/math';
import { TouchControls } from './TouchControls';

export type InputMethod = 'keyboard' | 'gamepad' | 'touch';

// One action surface for the scene, regardless of which device supplies it.
export class Controls {
  private keys: Record<'W' | 'A' | 'S' | 'D' | 'Q' | 'SPACE' | 'R' | 'E', Phaser.Input.Keyboard.Key>;
  private touch: TouchControls;
  private method: InputMethod = matchMedia('(pointer: coarse)').matches ? 'touch' : 'keyboard';
  private padMove: Vec2 = { x: 0, y: 0 };
  private padAim = 0;
  private padButtons = { attack: false, dash: false, charge: false, interact: false, restart: false };
  private padEdges = { attack: false, dash: false, charge: false, release: false, interact: false, restart: false };
  private lastPointerX = -1;
  private lastPointerY = -1;

  constructor(private scene: Phaser.Scene, private onGesture: () => void, private onAttack: () => void) {
    this.keys = scene.input.keyboard!.addKeys('W,A,S,D,Q,SPACE,R,E') as typeof this.keys;
    scene.input.mouse?.disableContextMenu();
    this.touch = new TouchControls(() => { this.method = 'touch'; this.onGesture(); }, () => {
      this.onAttack();
    });
    scene.input.on('pointerdown', this.pointerDown, this);
    scene.input.on('pointermove', this.pointerMove, this);
    scene.input.keyboard?.on('keydown', this.keyDown, this);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      scene.input.off('pointerdown', this.pointerDown, this);
      scene.input.off('pointermove', this.pointerMove, this);
      scene.input.keyboard?.off('keydown', this.keyDown, this);
      this.touch.destroy();
    });
  }

  private keyDown(): void { this.method = 'keyboard'; this.onGesture(); }
  private isTouchPointer(pointer: Phaser.Input.Pointer): boolean {
    const event = pointer.event as Event & { pointerType?: string };
    return event.pointerType === 'touch' || event.type.startsWith('touch');
  }
  private pointerDown(pointer: Phaser.Input.Pointer): void {
    if (this.isTouchPointer(pointer)) this.method = 'touch';
    else this.method = 'keyboard';
    this.onGesture();
    if (this.method === 'keyboard' && pointer.leftButtonDown()) this.onAttack();
  }
  private pointerMove(pointer: Phaser.Input.Pointer): void {
    if (this.isTouchPointer(pointer)) return;
    if (Math.abs(pointer.x - this.lastPointerX) + Math.abs(pointer.y - this.lastPointerY) > 2) {
      this.method = 'keyboard';
      this.lastPointerX = pointer.x;
      this.lastPointerY = pointer.y;
    }
  }

  private axis(value: number): number { return Math.abs(value) < 0.22 ? 0 : value; }
  update(position: Vec2): void {
    const pad = navigator.getGamepads?.().find(gamepad => gamepad?.mapping === 'standard' && gamepad.connected);
    const moveX = this.axis(pad?.axes[0] ?? 0);
    const moveY = this.axis(pad?.axes[1] ?? 0);
    const aimX = this.axis(pad?.axes[2] ?? 0);
    const aimY = this.axis(pad?.axes[3] ?? 0);
    const buttons = {
      attack: (pad?.buttons[7]?.value ?? 0) > 0.5,
      dash: (pad?.buttons[5]?.value ?? 0) > 0.5,
      charge: (pad?.buttons[6]?.value ?? 0) > 0.5,
      interact: (pad?.buttons[0]?.value ?? 0) > 0.5,
      restart: (pad?.buttons[9]?.value ?? 0) > 0.5,
    };
    this.padEdges = {
      attack: buttons.attack && !this.padButtons.attack,
      dash: buttons.dash && !this.padButtons.dash,
      charge: buttons.charge && !this.padButtons.charge,
      release: !buttons.charge && this.padButtons.charge,
      interact: buttons.interact && !this.padButtons.interact,
      restart: buttons.restart && !this.padButtons.restart,
    };
    this.padButtons = buttons;
    const anyButton = buttons.attack || buttons.dash || buttons.charge || buttons.interact || buttons.restart;
    const anyEdge = this.padEdges.attack || this.padEdges.dash || this.padEdges.charge ||
      this.padEdges.release || this.padEdges.interact || this.padEdges.restart;
    if (moveX || moveY || aimX || aimY || anyButton) {
      if (this.method !== 'gamepad' && !aimX && !aimY) this.padAim = this.aimFrom(position);
      if (this.method !== 'gamepad' || anyEdge) this.onGesture();
      this.method = 'gamepad';
    }
    this.padMove = normalized(moveX, moveY);
    if (aimX || aimY) this.padAim = Math.atan2(aimY, aimX);
    if (this.padEdges.attack) this.onAttack();
    this.touch.setVisible(this.method === 'touch' || (this.method === 'keyboard' && this.touch.coarsePointer));
  }

  get inputMethod(): InputMethod { return this.method; }
  setInteractAvailable(available: boolean): void { this.touch.setInteractAvailable(available); }
  setDead(dead: boolean): void { this.touch.setDead(dead); }
  movement(): Vec2 {
    if (this.method === 'gamepad') return this.padMove;
    if (this.method === 'touch') return this.touch.movement;
    return normalized(Number(this.keys.D.isDown) - Number(this.keys.A.isDown), Number(this.keys.S.isDown) - Number(this.keys.W.isDown));
  }
  aimFrom(position: Vec2): number {
    if (this.method === 'gamepad') return this.padAim;
    if (this.method === 'touch') return this.touch.aimValid ? this.touch.aimAngle : 0;
    const pointer = this.scene.input.activePointer;
    const world = this.scene.cameras.main.getWorldPoint(pointer.x, pointer.y);
    return Math.atan2(world.y - position.y, world.x - position.x);
  }
  get attacking(): boolean { return this.method === 'gamepad' ? this.padButtons.attack : this.method === 'touch' ? this.touch.attackHeld : this.scene.input.activePointer.isDown && this.scene.input.activePointer.leftButtonDown(); }
  get dashPressed(): boolean { return this.method === 'gamepad' ? this.padEdges.dash : this.method === 'touch' ? this.touch.takeDash() : Phaser.Input.Keyboard.JustDown(this.keys.SPACE); }
  get chargePressed(): boolean { return this.method === 'gamepad' ? this.padEdges.charge : this.method === 'touch' ? this.touch.takeChargeStart() : Phaser.Input.Keyboard.JustDown(this.keys.Q); }
  get chargeReleased(): boolean { return this.method === 'gamepad' ? this.padEdges.release : this.method === 'touch' ? this.touch.takeChargeRelease() : Phaser.Input.Keyboard.JustUp(this.keys.Q); }
  get chargeHeld(): boolean { return this.method === 'gamepad' ? this.padButtons.charge : this.method === 'touch' ? this.touch.chargeHeld : this.keys.Q.isDown; }
  get restartPressed(): boolean { return this.method === 'gamepad' ? this.padEdges.restart : this.method === 'touch' ? this.touch.takeRestart() : Phaser.Input.Keyboard.JustDown(this.keys.R); }
  get interactPressed(): boolean { return this.method === 'gamepad' ? this.padEdges.interact : this.method === 'touch' ? this.touch.takeInteract() : Phaser.Input.Keyboard.JustDown(this.keys.E); }
}
