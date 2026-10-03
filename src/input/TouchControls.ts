import { TOUCH } from '../config/touch';
import { normalized, type Vec2 } from '../utils/math';
import { protectGameplayGestures } from './GameplayGestures';

type Action = 'attack' | 'dash' | 'charge' | 'interact' | 'restart';
type QueuedAction = Exclude<Action, 'attack'> | 'release' | 'cancel';
type CombatGesture = { id: number; action: 'attack' | 'charge'; button: HTMLButtonElement; x: number; y: number; dragged: boolean };

export class TouchControls {
  readonly coarsePointer = matchMedia('(pointer: coarse)').matches;
  private root: HTMLDivElement;
  private moveZone: HTMLElement;
  private movePad: HTMLElement;
  private moveKnob: HTMLElement;
  private interactButton: HTMLElement;
  private moveId?: number;
  private moveOrigin = { x: 0, y: 0 };
  private moveVector: Vec2 = { x: 0, y: 0 };
  private combat?: CombatGesture;
  private lastCombatDirection?: Vec2;
  private visible = false;
  private interactAvailable = false;
  private dead = false;
  private portrait = matchMedia('(orientation: portrait)');
  private queued: Record<QueuedAction, boolean> = { dash: false, charge: false, release: false, cancel: false, interact: false, restart: false };
  private unprotect: () => void;
  private pointerCancels: (() => void)[] = [];

  constructor(private onGesture: () => void, private onAttack: () => void, private fallbackAim: () => number) {
    this.root = document.createElement('div');
    this.root.className = 'touch-controls';
    this.root.innerHTML = `
      <div class="touch-move-zone" aria-label="Área de movimento"><div class="touch-move touch-pad" aria-label="Mover"><span>MOVER</span><i></i></div></div>
      <div class="touch-actions">
        <button data-action="attack" aria-label="Golpe de sabre: toque ou arraste e solte"><span class="touch-face"><b>GOLPE</b><small>TOQUE / ARRASTE</small><i class="touch-direction"></i></span></button>
        <button data-action="dash" aria-label="Esquiva do vazio"><span class="touch-face"><b>ESQUIVA</b><small>MOVER</small></span></button>
        <button data-action="charge" aria-label="Carga cinética: segure, mire e solte"><span class="touch-face"><b>CARGA</b><small>SEGURE / SOLTE</small><i class="touch-direction"></i></span></button>
      </div>
      <div class="touch-context">
        <button data-action="interact" class="touch-interact" aria-label="Investigar"><span class="touch-face"><b>INVESTIGAR</b></span></button>
        <button data-action="restart" class="touch-restart" aria-label="Renascer"><span class="touch-face"><b>RENASCER</b></span></button>
      </div>
      <div class="touch-rotate">GIRE O DISPOSITIVO<br><small>Jogue na horizontal</small></div>`;
    document.body.append(this.root);
    this.unprotect = protectGameplayGestures(this.root);
    this.moveZone = this.root.querySelector('.touch-move-zone')!;
    this.movePad = this.root.querySelector('.touch-move')!;
    this.moveKnob = this.movePad.querySelector('i')!;
    this.interactButton = this.root.querySelector('.touch-interact')!;
    this.bindMovement();
    for (const button of Array.from(this.root.querySelectorAll<HTMLButtonElement>('[data-action]'))) {
      this.bindButton(button, button.dataset.action as Action);
    }
    window.addEventListener('blur', this.cancelAll);
    document.addEventListener('visibilitychange', this.visibilityChanged);
    this.portrait.addEventListener('change', this.cancelAll);
  }

  private bindButton(button: HTMLButtonElement, action: Action): void {
    let pointerId: number | undefined;
    this.pointerCancels.push(() => {
      const id = pointerId;
      pointerId = undefined;
      button.classList.remove('is-pressed', 'is-aiming');
      if (id !== undefined && button.hasPointerCapture(id)) button.releasePointerCapture(id);
    });
    button.addEventListener('pointerdown', event => {
      event.preventDefault();
      if (pointerId !== undefined || (this.dead && action !== 'restart') || this.portrait.matches) return;
      if ((action === 'attack' || action === 'charge') && this.combat) return;
      pointerId = event.pointerId;
      button.setPointerCapture(event.pointerId);
      button.classList.remove('is-released');
      button.classList.add('is-pressed');
      this.onGesture();
      if (action === 'attack' || action === 'charge') {
        this.combat = { id: event.pointerId, action, button, x: event.clientX, y: event.clientY, dragged: false };
        if (action === 'charge') this.queued.charge = true;
        this.updateHint(this.combat);
      } else this.queued[action] = true;
    });
    button.addEventListener('pointermove', event => {
      if (this.combat?.id === event.pointerId && this.combat.button === button) this.selectDirection(event);
    });
    const finish = (event: PointerEvent) => {
      if (pointerId !== event.pointerId) return;
      event.preventDefault();
      pointerId = undefined;
      const released = event.type === 'pointerup';
      if (this.combat?.id === event.pointerId && this.combat.button === button) {
        if (released) this.selectDirection(event);
        const action = this.combat.action;
        this.clearCombat();
        if (released) {
          if (action === 'attack') this.onAttack();
          else this.queued.release = true;
        } else if (action === 'charge') this.cancelCharge();
      }
      button.classList.remove('is-pressed');
      if (released) button.classList.add('is-released');
      if (button.hasPointerCapture(event.pointerId)) button.releasePointerCapture(event.pointerId);
    };
    button.addEventListener('pointerup', finish);
    button.addEventListener('pointercancel', finish);
    button.addEventListener('lostpointercapture', finish);
    button.addEventListener('animationend', () => button.classList.remove('is-released'));
  }

  private selectDirection(event: PointerEvent): void {
    const gesture = this.combat!;
    const dx = event.clientX - gesture.x;
    const dy = event.clientY - gesture.y;
    if (Math.hypot(dx, dy) < TOUCH.dragThreshold) return;
    this.lastCombatDirection = normalized(dx, dy);
    gesture.dragged = true;
    gesture.button.classList.add('is-aiming');
    this.updateHint(gesture);
  }

  private updateHint(gesture: CombatGesture): void {
    gesture.button.querySelector<HTMLElement>('small')!.textContent = gesture.action === 'charge' || gesture.dragged ? 'SOLTE PARA ATACAR' : 'ARRASTE PARA MIRAR';
    gesture.button.querySelector<HTMLElement>('.touch-direction')!.style.transform = `rotate(${this.aimAngle}rad)`;
  }

  private clearCombat(): void {
    if (!this.combat) return;
    const { button, action } = this.combat;
    this.combat = undefined;
    button.classList.remove('is-pressed', 'is-aiming');
    button.querySelector<HTMLElement>('small')!.textContent = action === 'charge' ? 'SEGURE / SOLTE' : 'TOQUE / ARRASTE';
  }

  private cancelCharge(): void {
    this.queued.charge = false;
    this.queued.release = false;
    this.queued.cancel = true;
  }

  private bindMovement(): void {
    const zone = this.moveZone;
    zone.addEventListener('pointerdown', event => {
      event.preventDefault();
      if (this.moveId !== undefined || this.dead || this.portrait.matches) return;
      zone.setPointerCapture(event.pointerId);
      this.onGesture();
      this.moveId = event.pointerId;
      const bounds = zone.getBoundingClientRect();
      const radius = this.movePad.getBoundingClientRect().width / 2;
      // The hit surface is much larger than the visible circle. Keep the base
      // inside safe areas even when the first touch is near the viewport edge.
      const x = Math.max(radius + 8, Math.min(bounds.width - radius - 8, event.clientX - bounds.left));
      const y = Math.max(radius + 8, Math.min(bounds.height - radius - 8, event.clientY - bounds.top));
      this.movePad.style.left = `${x - radius}px`;
      this.movePad.style.top = `${y - radius}px`;
      this.movePad.style.bottom = 'auto';
      this.movePad.classList.add('is-moving');
      // An edge press is neutral too: only the illustration is clamped, never
      // the gesture origin. Movement starts when the finger actually drags.
      this.moveOrigin = { x: event.clientX, y: event.clientY };
      this.updateMovement(event.clientX, event.clientY);
    });
    zone.addEventListener('pointermove', event => {
      if (event.pointerId !== this.moveId) return;
      event.preventDefault();
      this.updateMovement(event.clientX, event.clientY);
    });
    const finish = (event: PointerEvent) => {
      if (event.pointerId !== this.moveId) return;
      this.moveId = undefined;
      this.moveVector = { x: 0, y: 0 };
      this.positionKnob(0, 0);
      this.resetMovePad();
      if (zone.hasPointerCapture(event.pointerId)) zone.releasePointerCapture(event.pointerId);
    };
    zone.addEventListener('pointerup', finish);
    zone.addEventListener('pointercancel', finish);
    zone.addEventListener('lostpointercapture', finish);
  }

  private updateMovement(x: number, y: number): void {
    const dx = x - this.moveOrigin.x, dy = y - this.moveOrigin.y;
    // Clamp only the visual knob. The captured gesture remains valid beyond
    // either the circle or the activation surface until release/cancellation.
    this.moveVector = Math.hypot(dx, dy) > TOUCH.moveDeadzone ? normalized(dx, dy) : { x: 0, y: 0 };
    this.positionKnob(dx, dy);
  }

  private resetMovePad(): void {
    this.movePad.style.removeProperty('left');
    this.movePad.style.removeProperty('top');
    this.movePad.style.removeProperty('bottom');
    this.movePad.classList.remove('is-moving');
  }

  private positionKnob(dx: number, dy: number): void {
    const distance = Math.hypot(dx, dy);
    const scale = distance > TOUCH.knobRadius ? TOUCH.knobRadius / distance : 1;
    this.moveKnob.style.transform = `translate(${Math.round(dx * scale)}px, ${Math.round(dy * scale)}px)`;
  }

  private visibilityChanged = (): void => { if (document.hidden) this.cancelAll(); };
  cancelAll = (): void => {
    const combat = this.combat;
    if (combat?.action === 'charge' || this.queued.charge || this.queued.release) this.cancelCharge();
    this.clearCombat();
    for (const cancel of this.pointerCancels) cancel();
    if (this.moveId !== undefined && this.moveZone.hasPointerCapture(this.moveId)) this.moveZone.releasePointerCapture(this.moveId);
    this.moveId = undefined;
    this.moveVector = { x: 0, y: 0 };
    this.positionKnob(0, 0);
    this.resetMovePad();
    this.queued.dash = this.queued.interact = this.queued.restart = false;
  };

  private take(action: QueuedAction): boolean {
    const value = this.queued[action];
    this.queued[action] = false;
    return value;
  }
  takeDash(): boolean { return this.take('dash'); }
  takeChargeStart(): boolean { return this.take('charge'); }
  takeChargeRelease(): boolean { return this.take('release'); }
  takeChargeCancel(): boolean { return this.take('cancel'); }
  takeInteract(): boolean { return this.take('interact'); }
  takeRestart(): boolean { return this.take('restart'); }
  get movement(): Vec2 { return this.moveVector; }
  get aimAngle(): number { return this.lastCombatDirection ? Math.atan2(this.lastCombatDirection.y, this.lastCombatDirection.x) : this.fallbackAim(); }
  get chargeHeld(): boolean { return this.combat?.action === 'charge'; }
  get preview(): 'attack' | 'charge' | undefined { return this.dead ? undefined : this.combat?.action === 'charge' ? 'charge' : this.combat?.dragged ? 'attack' : undefined; }
  setVisible(visible: boolean): void {
    if (this.visible === visible) return;
    this.visible = visible;
    if (!visible) this.cancelAll();
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
    if (dead) this.cancelAll();
    this.root.classList.toggle('is-dead', dead);
  }
  destroy(): void {
    this.cancelAll();
    window.removeEventListener('blur', this.cancelAll);
    document.removeEventListener('visibilitychange', this.visibilityChanged);
    this.portrait.removeEventListener('change', this.cancelAll);
    this.unprotect();
    this.root.remove();
  }
}
