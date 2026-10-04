import Phaser from 'phaser';
import { normalized, type Vec2 } from '../utils/math';
import { TouchControls } from './TouchControls';
import { TouchAimPreview } from './TouchAimPreview';
import { protectGameplayGestures } from './GameplayGestures';

export type InputMethod = 'keyboard' | 'gamepad' | 'touch';

// One action surface for the scene, regardless of which device supplies it.
export class Controls {
  private keys: Record<'W' | 'A' | 'S' | 'D' | 'Q' | 'SPACE' | 'R' | 'E' | 'B', Phaser.Input.Keyboard.Key>;
  private touch: TouchControls;
  private touchPreview: TouchAimPreview;
  private lastAim = 0;
  private resizeFrame = 0;
  private method: InputMethod = matchMedia('(pointer: coarse)').matches ? 'touch' : 'keyboard';
  private padMove: Vec2 = { x: 0, y: 0 };
  private padAim = 0;
  private padButtons = { attack: false, dash: false, charge: false, interact: false, restart: false };
  private padEdges = { attack: false, dash: false, charge: false, release: false, interact: false, restart: false };
  private lastPointerX = -1;
  private lastPointerY = -1;
  private padRecords = false;
  private recordsEdge = false;
  private padSuppressed = false;

  constructor(private scene: Phaser.Scene, private onGesture: () => void, private onAttack: () => void) {
    this.keys = scene.input.keyboard!.addKeys('W,A,S,D,Q,SPACE,R,E,B') as typeof this.keys;
    scene.input.mouse?.disableContextMenu();
    this.touch = new TouchControls(() => { this.method = 'touch'; this.onGesture(); }, () => {
      this.onAttack();
    }, () => this.lastAim);
    this.touchPreview = new TouchAimPreview(scene);
    const unprotect = protectGameplayGestures(scene.game.canvas.parentElement!);
    window.addEventListener('resize', this.refreshLayout);
    scene.input.on('pointerdown', this.pointerDown, this);
    scene.input.on('pointermove', this.pointerMove, this);
    scene.input.keyboard?.on('keydown', this.keyDown, this);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      scene.input.off('pointerdown', this.pointerDown, this);
      scene.input.off('pointermove', this.pointerMove, this);
      scene.input.keyboard?.off('keydown', this.keyDown, this);
      this.touch.destroy();
      this.touchPreview.destroy();
      unprotect();
      window.removeEventListener('resize', this.refreshLayout);
      cancelAnimationFrame(this.resizeFrame);
    });
  }

  private refreshLayout = (): void => {
    cancelAnimationFrame(this.resizeFrame);
    this.resizeFrame = requestAnimationFrame(() => {
      this.resizeFrame = 0;
      // Orientation events can reach Phaser before its parent bounds update.
      this.scene.scale.getParentBounds();
      this.scene.scale.refresh();
    });
  };

  private keyDown(): void { if (this.method === 'touch') this.touch.cancelAll(); this.method = 'keyboard'; this.onGesture(); }
  private isTouchPointer(pointer: Phaser.Input.Pointer): boolean {
    const event = pointer.event as Event & { pointerType?: string };
    return event.pointerType === 'touch' || event.type.startsWith('touch');
  }
  private pointerDown(pointer: Phaser.Input.Pointer): void {
    if (this.isTouchPointer(pointer)) this.method = 'touch';
    else { if (this.method === 'touch') this.touch.cancelAll(); this.method = 'keyboard'; }
    this.onGesture();
    if (this.method === 'keyboard' && pointer.leftButtonDown()) this.onAttack();
  }
  private pointerMove(pointer: Phaser.Input.Pointer): void {
    if (this.isTouchPointer(pointer)) return;
    if (Math.abs(pointer.x - this.lastPointerX) + Math.abs(pointer.y - this.lastPointerY) > 2) {
      if (this.method === 'touch') this.touch.cancelAll();
      this.method = 'keyboard';
      this.lastPointerX = pointer.x;
      this.lastPointerY = pointer.y;
    }
  }

  private axis(value: number): number { return Math.abs(value) < 0.22 ? 0 : value; }
  update(position: Vec2): void {
    const pad = navigator.getGamepads?.().find(gamepad => gamepad?.mapping === 'standard' && gamepad.connected);
    // Menu buttons must be released before they can become gameplay actions again.
    if (this.padSuppressed && ![0, 5, 6, 7, 8, 9].some(index => (pad?.buttons[index]?.value ?? 0) > 0.5)) this.padSuppressed = false;
    const records = !this.padSuppressed && (pad?.buttons[8]?.value ?? 0) > 0.5;
    this.recordsEdge = records && !this.padRecords;
    this.padRecords = records;
    const moveX = this.axis(pad?.axes[0] ?? 0);
    const moveY = this.axis(pad?.axes[1] ?? 0);
    const aimX = this.axis(pad?.axes[2] ?? 0);
    const aimY = this.axis(pad?.axes[3] ?? 0);
    const buttons = {
      attack: !this.padSuppressed && (pad?.buttons[7]?.value ?? 0) > 0.5,
      dash: !this.padSuppressed && (pad?.buttons[5]?.value ?? 0) > 0.5,
      charge: !this.padSuppressed && (pad?.buttons[6]?.value ?? 0) > 0.5,
      interact: !this.padSuppressed && (pad?.buttons[0]?.value ?? 0) > 0.5,
      restart: !this.padSuppressed && (pad?.buttons[9]?.value ?? 0) > 0.5,
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
      if (this.method === 'touch') this.touch.cancelAll();
      if (this.method !== 'gamepad' && !aimX && !aimY) this.padAim = this.aimFrom(position);
      if (this.method !== 'gamepad' || anyEdge) this.onGesture();
      this.method = 'gamepad';
    }
    this.padMove = normalized(moveX, moveY);
    if (aimX || aimY) this.padAim = Math.atan2(aimY, aimX);
    if (this.padEdges.attack) this.onAttack();
    this.touch.setVisible(this.method === 'touch' || (this.method === 'keyboard' && this.touch.coarsePointer));
    this.touchPreview.update(this.method === 'touch' ? this.touch.preview : undefined, position, this.aimFrom(position));
  }

  get inputMethod(): InputMethod { return this.method; }
  get recordsPressed(): boolean { return this.recordsEdge || Phaser.Input.Keyboard.JustDown(this.keys.B); }
  cancelForRecords(): void {
    this.padSuppressed = true;
    this.touch.cancelAll();
    this.touchPreview.update(undefined, { x: 0, y: 0 }, this.lastAim);
    this.scene.input.keyboard?.resetKeys();
    this.scene.input.resetPointers();
  }
  setInteractAvailable(available: boolean): void { this.touch.setInteractAvailable(available); }
  setDead(dead: boolean): void { this.touch.setDead(dead); }
  movement(): Vec2 {
    if (this.method === 'gamepad') return this.padMove;
    if (this.method === 'touch') return this.touch.movement;
    return normalized(Number(this.keys.D.isDown) - Number(this.keys.A.isDown), Number(this.keys.S.isDown) - Number(this.keys.W.isDown));
  }
  aimFrom(position: Vec2): number {
    if (this.method === 'gamepad') this.lastAim = this.padAim;
    else if (this.method === 'touch') this.lastAim = this.touch.aimAngle;
    else {
      const pointer = this.scene.input.activePointer;
      const world = this.scene.cameras.main.getWorldPoint(pointer.x, pointer.y);
      this.lastAim = Math.atan2(world.y - position.y, world.x - position.x);
    }
    return this.lastAim;
  }
  get attacking(): boolean { return this.method === 'gamepad' ? this.padButtons.attack : this.method === 'touch' ? false : this.scene.input.activePointer.isDown && this.scene.input.activePointer.leftButtonDown(); }
  get chargeCancelled(): boolean { return this.touch.takeChargeCancel(); }
  get dashPressed(): boolean { return this.method === 'gamepad' ? this.padEdges.dash : this.method === 'touch' ? this.touch.takeDash() : Phaser.Input.Keyboard.JustDown(this.keys.SPACE); }
  get chargePressed(): boolean { return this.method === 'gamepad' ? this.padEdges.charge : this.method === 'touch' ? this.touch.takeChargeStart() : Phaser.Input.Keyboard.JustDown(this.keys.Q); }
  get chargeReleased(): boolean { return this.method === 'gamepad' ? this.padEdges.release : this.method === 'touch' ? this.touch.takeChargeRelease() : Phaser.Input.Keyboard.JustUp(this.keys.Q); }
  get chargeHeld(): boolean { return this.method === 'gamepad' ? this.padButtons.charge : this.method === 'touch' ? this.touch.chargeHeld : this.keys.Q.isDown; }
  get restartPressed(): boolean { return this.method === 'gamepad' ? this.padEdges.restart : this.method === 'touch' ? this.touch.takeRestart() : Phaser.Input.Keyboard.JustDown(this.keys.R); }
  get interactPressed(): boolean { return this.method === 'gamepad' ? this.padEdges.interact : this.method === 'touch' ? this.touch.takeInteract() : Phaser.Input.Keyboard.JustDown(this.keys.E); }
}
