import { normalized, type Vec2 } from '../utils/math';

type Action = 'attack' | 'dash' | 'charge' | 'interact' | 'restart';

export class TouchControls {
  readonly coarsePointer = matchMedia('(pointer: coarse)').matches;
  private root: HTMLDivElement;
  private moveZone: HTMLElement;
  private aimZone: HTMLElement;
  private interactButton: HTMLElement;
  private moveId?: number;
  private aimId?: number;
  private moveOrigin = { x: 0, y: 0 };
  private aimOrigin = { x: 0, y: 0 };
  private moveVector: Vec2 = { x: 0, y: 0 };
  private aimDirection = 0;
  private hasAim = false;
  private visible = false;
  private interactAvailable = false;
  private dead = false;
  private held = { attack: false, charge: false };
  private queued: Record<Exclude<Action, 'attack'> | 'release', boolean> = { dash: false, charge: false, release: false, interact: false, restart: false };

  constructor(private onGesture: () => void, private onAttack: () => void) {
    this.root = document.createElement('div');
    this.root.className = 'touch-controls';
    this.root.innerHTML = `
      <div class="touch-move touch-pad" aria-label="Move"><span>MOVE</span><i></i></div>
      <div class="touch-aim touch-pad" aria-label="Aim"><span>AIM</span><i></i></div>
      <div class="touch-actions">
        <button data-action="attack" aria-label="Saber Strike">STRIKE</button>
        <button data-action="dash" aria-label="Void Dash">DASH</button>
        <button data-action="charge" aria-label="Hold Kinetic Charge">CHARGE</button>
        <button data-action="interact" class="touch-interact" aria-label="Investigate">INVESTIGATE</button>
        <button data-action="restart" class="touch-restart" aria-label="Respawn">RESPAWN</button>
      </div>
      <div class="touch-rotate">ROTATE DEVICE<br><small>Landscape mode</small></div>`;
    document.body.append(this.root);
    this.moveZone = this.root.querySelector('.touch-move')!;
    this.aimZone = this.root.querySelector('.touch-aim')!;
    this.interactButton = this.root.querySelector('.touch-interact')!;
    this.bindStick(this.moveZone, 'move');
    this.bindStick(this.aimZone, 'aim');
    for (const button of Array.from(this.root.querySelectorAll<HTMLButtonElement>('[data-action]'))) {
      const action = button.dataset.action as Action;
      button.addEventListener('pointerdown', event => {
        event.preventDefault();
        button.setPointerCapture(event.pointerId);
        this.onGesture();
        if (action === 'attack') {
          this.held.attack = true;
          this.onAttack();
        }
        if (action === 'charge') this.held.charge = true;
        if (action !== 'attack') this.queued[action] = true;
      });
      const release = (event: PointerEvent) => {
        event.preventDefault();
        if (action === 'attack') this.held.attack = false;
        if (action === 'charge' && this.held.charge) {
          this.held.charge = false;
          this.queued.release = true;
        }
      };
      button.addEventListener('pointerup', release);
      button.addEventListener('pointercancel', release);
    }
  }

  private bindStick(zone: HTMLElement, kind: 'move' | 'aim'): void {
    zone.addEventListener('pointerdown', event => {
      event.preventDefault();
      zone.setPointerCapture(event.pointerId);
      this.onGesture();
      if (kind === 'move') {
        this.moveId = event.pointerId;
        this.moveOrigin = { x: event.clientX, y: event.clientY };
        this.moveVector = { x: 0, y: 0 };
      } else {
        this.aimId = event.pointerId;
        this.aimOrigin = { x: event.clientX, y: event.clientY };
      }
    });
    zone.addEventListener('pointermove', event => {
      if (kind === 'move' && event.pointerId === this.moveId) {
        const dx = event.clientX - this.moveOrigin.x;
        const dy = event.clientY - this.moveOrigin.y;
        this.moveVector = Math.hypot(dx, dy) > 9 ? normalized(dx, dy) : { x: 0, y: 0 };
        this.positionKnob(zone, dx, dy);
      } else if (kind === 'aim' && event.pointerId === this.aimId) {
        const dx = event.clientX - this.aimOrigin.x;
        const dy = event.clientY - this.aimOrigin.y;
        if (Math.hypot(dx, dy) > 9) {
          this.aimDirection = Math.atan2(dy, dx);
          this.hasAim = true;
          this.positionKnob(zone, dx, dy);
        }
      }
    });
    const release = (event: PointerEvent) => {
      if (kind === 'move' && event.pointerId === this.moveId) {
        this.moveId = undefined;
        this.moveVector = { x: 0, y: 0 };
        this.positionKnob(zone, 0, 0);
      } else if (kind === 'aim' && event.pointerId === this.aimId) {
        this.aimId = undefined;
        this.positionKnob(zone, 0, 0);
      }
    };
    zone.addEventListener('pointerup', release);
    zone.addEventListener('pointercancel', release);
  }

  private positionKnob(zone: HTMLElement, dx: number, dy: number): void {
    const distance = Math.hypot(dx, dy);
    const scale = distance > 32 ? 32 / distance : 1;
    const knob = zone.querySelector<HTMLElement>('i');
    if (knob) knob.style.transform = `translate(${Math.round(dx * scale)}px, ${Math.round(dy * scale)}px)`;
  }

  private take(action: Exclude<Action, 'attack'> | 'release'): boolean {
    const value = this.queued[action];
    this.queued[action] = false;
    return value;
  }
  takeDash(): boolean { return this.take('dash'); }
  takeChargeStart(): boolean { return this.take('charge'); }
  takeChargeRelease(): boolean { return this.take('release'); }
  takeInteract(): boolean { return this.take('interact'); }
  takeRestart(): boolean { return this.take('restart'); }
  get movement(): Vec2 { return this.moveVector; }
  get aimAngle(): number { return this.aimDirection; }
  get aimValid(): boolean { return this.hasAim; }
  get attackHeld(): boolean { return this.held.attack; }
  get chargeHeld(): boolean { return this.held.charge; }
  setVisible(visible: boolean): void {
    if (this.visible === visible) return;
    this.visible = visible;
    this.root.classList.toggle('is-visible', visible);
  }
  setInteractAvailable(available: boolean): void {
    if (this.interactAvailable === available) return;
    this.interactAvailable = available;
    this.interactButton.classList.toggle('is-available', available);
  }
  setDead(dead: boolean): void {
    if (this.dead === dead) return;
    this.dead = dead;
    this.root.classList.toggle('is-dead', dead);
  }
  destroy(): void { this.root.remove(); }
}
