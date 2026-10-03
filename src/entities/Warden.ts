import Phaser from 'phaser';
import { Health } from '../combat/Health';
import { inMeleeArc, inShockwaveSweep } from '../combat/HitDetection';
import { PLAYER } from '../config/game';
import { WARDEN, WARDEN_PATTERNS, type WardenAttack, type WardenPhase } from '../config/warden';
import { moveWithCollisions, type MovementBounds, type Obstacle } from '../systems/Movement';
import { clamp, distance, type Vec2 } from '../utils/math';
import type { Enemy, EnemyImpact } from './Enemy';

export type { WardenAttack } from '../config/warden';

export type WardenState = 'DORMANT' | 'INTRO' | 'IDLE' | 'TELEGRAPH' | 'EXECUTE' | 'RECOVER' | 'PHASE' | 'DEATH';
export type WardenCue = 'intro' | 'telegraph' | 'execute' | 'phase' | 'death' | 'defeated';

type SignalShot = {
  active: boolean;
  x: number;
  y: number;
  angle: number;
  travelled: number;
  previous: Vec2;
  image: Phaser.GameObjects.Ellipse;
};

type GroundMark = {
  x: number;
  y: number;
  spent: boolean;
  visual: Phaser.GameObjects.Graphics;
};

// One encounter-specific state machine, implementing the existing Enemy contract.
// Telegraph geometry is drawn on transitions. All projectiles and ground marks are reused.
export class Warden implements Enemy {
  readonly position: Vec2;
  readonly health = new Health(WARDEN.maxHp);
  readonly radius = WARDEN.radius;
  readonly attackRange = WARDEN.sweep.range;
  readonly attackDamage = WARDEN.sweep.damage;
  readonly view: Phaser.GameObjects.Container;
  readonly shadow: Phaser.GameObjects.Ellipse;
  readonly telegraph: Phaser.GameObjects.Graphics;
  readonly body: Phaser.GameObjects.Image;
  isDead = false;
  private readonly core: Phaser.GameObjects.Ellipse;
  private readonly shots: SignalShot[];
  private readonly marks: GroundMark[];
  private readonly velocity: Vec2 = { x: 0, y: 0 };
  private readonly push: Vec2 = { x: 0, y: 0 };
  private readonly previous: Vec2 = { x: 0, y: 0 };
  private readonly attackOrigin: Vec2 = { x: 0, y: 0 };
  private _state: WardenState = 'DORMANT';
  private _phase: WardenPhase = 1;
  private _attackName: WardenAttack | null = null;
  private introduced = false;
  private stateAt = 0;
  private stateUntil = 0;
  private attackAngle = Math.PI;
  private patternIndex = 0;
  private activationHit = false;
  private rushTravelled = 0;
  private hurtUntil = 0;
  private travelPhase = 0;
  private facingLeft = true;
  private stopped = false;

  constructor(
    private readonly scene: Phaser.Scene,
    x: number,
    y: number,
    private readonly arenaBounds: MovementBounds,
    private readonly onCue: (cue: WardenCue, attack?: WardenAttack) => void,
    private readonly onDefeated: () => void,
  ) {
    this.position = { x, y };
    this.shadow = scene.add.ellipse(x, y + 15, 174, 60, 0x071518, 0.7).setDepth(y - 2);
    this.body = scene.add.image(0, 30, 'warden-motion', 0)
      .setOrigin(0.5, 0.83).setDisplaySize(WARDEN.artSize, WARDEN.artSize).setFlipX(true);
    this.core = scene.add.ellipse(0, -40, 27, 17, 0xa98cff, 0.13).setBlendMode(Phaser.BlendModes.ADD);
    this.view = scene.add.container(x, y, [this.body, this.core]).setDepth(y);
    this.telegraph = scene.add.graphics().setVisible(false);
    this.shots = Array.from({ length: 3 }, () => ({
      active: false, x, y, angle: 0, travelled: 0, previous: { x, y },
      image: scene.add.ellipse(x, y, 30, 19, 0xffbd54, 0.95)
        .setStrokeStyle(3, 0xff6a4a, 1).setVisible(false),
    }));
    this.marks = Array.from({ length: 3 }, () => ({ x, y, spent: false, visual: scene.add.graphics().setVisible(false) }));
  }

  get phase(): WardenPhase { return this._phase; }
  get state(): WardenState { return this._state; }
  get attackName(): WardenAttack | null { return this._attackName; }
  get introComplete(): boolean { return this.introduced; }
  get canBeHit(): boolean {
    return !this.isDead && !this.stopped && this.introduced
      && this._state !== 'INTRO' && this._state !== 'PHASE' && this._state !== 'DORMANT';
  }

  beginIntro(now: number): void {
    if (this._state !== 'DORMANT' || this.isDead || this.stopped) return;
    this.setState('INTRO', now, WARDEN.introMs);
    this.onCue('intro');
  }

  update(now: number, dt: number, player: Vec2, playerDead: boolean,
    obstacles: readonly Obstacle[], onAttack: (impact?: EnemyImpact) => void, _bounds?: MovementBounds): void {
    if (this.isDead || this.stopped) return;
    if (playerDead) { this.suspend(); return; }
    const elapsed = Math.min(dt, 0.04);
    this.velocity.x = this.velocity.y = 0;
    this.previous.x = this.position.x;
    this.previous.y = this.position.y;

    if (this._state === 'DORMANT') { this.render(now, 0); return; }
    if (this._state === 'INTRO') {
      if (now >= this.stateUntil) {
        this.introduced = true;
        this.setState('IDLE', now, WARDEN.idleMs[0]);
      }
      this.render(now, 0);
      return;
    }

    const ratio = this.health.current / this.health.max;
    const targetPhase: WardenPhase = ratio <= WARDEN.phaseThreeAt ? 3 : ratio <= WARDEN.phaseTwoAt ? 2 : 1;
    if (targetPhase > this._phase && this._state !== 'PHASE') {
      this._phase = targetPhase;
      this.patternIndex = 0;
      this.clearHazards();
      this._attackName = null;
      this.setState('PHASE', now, WARDEN.phaseMs);
      this.onCue('phase');
    }

    if (this._state === 'PHASE') {
      if (now >= this.stateUntil) this.setState('IDLE', now, WARDEN.idleMs[this._phase - 1]);
    } else if (this._state === 'IDLE') {
      const dx = player.x - this.position.x, dy = player.y - this.position.y;
      const gap = Math.hypot(dx, dy);
      if (Math.abs(dx) > 12) this.facingLeft = dx < 0;
      if (gap > WARDEN.standOff) {
        this.velocity.x = dx / gap * WARDEN.speed;
        this.velocity.y = dy / gap * WARDEN.speed;
      }
      if (now >= this.stateUntil) {
        const pattern = WARDEN_PATTERNS[this._phase];
        const selected = pattern[this.patternIndex++ % pattern.length];
        // Faraway targets receive a readable approach rather than repeated empty swipes.
        this.beginAttack(now, gap > 320 && selected === 'sweep' ? 'rush' : selected, player);
        this.velocity.x = this.velocity.y = 0;
      }
    } else if (this._state === 'TELEGRAPH') {
      if (now >= this.stateUntil) this.execute(now);
    } else if (this._state === 'EXECUTE') {
      this.updateAttack(now, elapsed, player, obstacles, onAttack);
      if (now >= this.stateUntil || (this._attackName === 'rush' && this.rushTravelled >= WARDEN.rush.distance)) {
        const recovery = this._attackName ? WARDEN[this._attackName].recoverMs : 1400;
        this.clearHazards();
        this.setState('RECOVER', now, recovery);
        this.velocity.x = this.velocity.y = 0;
      }
    } else if (this._state === 'RECOVER' && now >= this.stateUntil) {
      this._attackName = null;
      this.setState('IDLE', now, WARDEN.idleMs[this._phase - 1]);
    }

    if (now < this.hurtUntil && (this._state === 'IDLE' || this._state === 'RECOVER')) {
      this.velocity.x += this.push.x;
      this.velocity.y += this.push.y;
      this.push.x *= Math.max(0, 1 - elapsed * 14);
      this.push.y *= Math.max(0, 1 - elapsed * 14);
    }

    // Rush performs its own swept collision step. All other movement uses the same solver.
    if (this._state !== 'EXECUTE' || this._attackName !== 'rush') {
      moveWithCollisions(this.position, this.velocity, elapsed, this.radius, obstacles, this.arenaBounds);
    }
    const travelled = distance(this.position, this.previous);
    this.render(now, travelled);
  }

  private setState(state: WardenState, now: number, duration: number): void {
    this._state = state;
    this.stateAt = now;
    this.stateUntil = now + duration;
  }

  private beginAttack(now: number, attack: WardenAttack, player: Vec2): void {
    this.clearHazards();
    this._attackName = attack;
    this.activationHit = false;
    this.rushTravelled = 0;
    this.attackOrigin.x = this.position.x;
    this.attackOrigin.y = this.position.y;
    this.attackAngle = Math.atan2(player.y - this.position.y, player.x - this.position.x);
    if (Math.abs(Math.cos(this.attackAngle)) > 0.1) this.facingLeft = Math.cos(this.attackAngle) < 0;
    this.setState('TELEGRAPH', now, WARDEN[attack].telegraphMs);
    this.drawTelegraph(attack, player);
    this.onCue('telegraph', attack);
  }

  private execute(now: number): void {
    const attack = this._attackName;
    if (!attack) return;
    this.setState('EXECUTE', now, WARDEN[attack].executeMs);
    if (attack === 'signal') {
      for (let index = 0; index < this.shots.length; index++) {
        const shot = this.shots[index];
        shot.angle = this.attackAngle + (index - 1) * WARDEN.signal.spread;
        shot.x = this.position.x + Math.cos(shot.angle) * (this.radius + 8);
        shot.y = this.position.y + Math.sin(shot.angle) * (this.radius + 8);
        shot.travelled = 0;
        shot.active = true;
      }
      this.telegraph.setVisible(false);
    }
    this.onCue('execute', attack);
  }

  private updateAttack(now: number, dt: number, player: Vec2, obstacles: readonly Obstacle[], onAttack: (impact?: EnemyImpact) => void): void {
    const attack = this._attackName;
    if (!attack) return;
    const activeFor = now - this.stateAt;
    if (attack === 'sweep' && activeFor <= 170) {
      if (inMeleeArc(this.attackOrigin, this.attackAngle, player, WARDEN.sweep.range, WARDEN.sweep.halfAngle, PLAYER.radius)) this.hit(onAttack);
    } else if (attack === 'slam' && activeFor <= 170) {
      if (distance(this.attackOrigin, player) <= WARDEN.slam.radius + PLAYER.radius) this.hit(onAttack);
    } else if (attack === 'rush') {
      const beforeX = this.position.x, beforeY = this.position.y;
      this.velocity.x = Math.cos(this.attackAngle) * WARDEN.rush.speed;
      this.velocity.y = Math.sin(this.attackAngle) * WARDEN.rush.speed;
      moveWithCollisions(this.position, this.velocity, dt, this.radius, obstacles, this.arenaBounds);
      const moved = Math.hypot(this.position.x - beforeX, this.position.y - beforeY);
      this.rushTravelled += moved;
      if (inShockwaveSweep(this.previous, this.attackAngle, player, 0, moved,
        WARDEN.rush.halfWidth, this.radius * 2, PLAYER.radius)) this.hit(onAttack);
      if (moved < WARDEN.rush.speed * dt * 0.4) this.stateUntil = now;
    } else if (attack === 'signal') {
      for (const shot of this.shots) {
        if (!shot.active) continue;
        const step = Math.min(WARDEN.signal.speed * dt, WARDEN.signal.range - shot.travelled);
        shot.previous.x = shot.x;
        shot.previous.y = shot.y;
        shot.x += Math.cos(shot.angle) * step;
        shot.y += Math.sin(shot.angle) * step;
        shot.travelled += step;
        const blocked = obstacles.some(obstacle => inShockwaveSweep(shot.previous, shot.angle, obstacle, 0, step,
          WARDEN.signal.radius, 0, obstacle.radius));
        const hit = !blocked && inShockwaveSweep(shot.previous, shot.angle, player, 0, step,
          WARDEN.signal.radius, 0, PLAYER.radius);
        if (hit) this.hit(onAttack);
        if (hit || blocked || shot.travelled >= WARDEN.signal.range
          || shot.x < this.arenaBounds.left || shot.x > this.arenaBounds.right
          || shot.y < this.arenaBounds.top || shot.y > this.arenaBounds.bottom) {
          shot.active = false;
          shot.image.setVisible(false);
        } else shot.image.setPosition(shot.x, shot.y).setRotation(shot.angle).setDepth(shot.y + 3).setVisible(true);
      }
    } else if (attack === 'echoes') {
      for (let index = 0; index < this.marks.length; index++) {
        const mark = this.marks[index];
        if (!mark.spent && activeFor >= index * WARDEN.echoes.intervalMs) {
          mark.spent = true;
          if (distance(mark, player) <= WARDEN.echoes.radius + PLAYER.radius) this.hit(onAttack);
        }
        if (mark.spent) mark.visual.setAlpha(Math.max(0, 1 - (activeFor - index * WARDEN.echoes.intervalMs) / 220));
      }
    }
  }

  private hit(onAttack: (impact?: EnemyImpact) => void): void {
    if (this.activationHit || !this._attackName) return;
    // A dash or hurt-grace can reject this attempt in GameScene. It still consumes
    // the activation, preventing a lingering shape from hitting after invulnerability.
    this.activationHit = true;
    onAttack({ damage: WARDEN[this._attackName].damage, ranged: true });
  }

  private drawTelegraph(attack: WardenAttack, player: Vec2): void {
    const graphic = this.telegraph;
    graphic.clear().setScale(1).setAlpha(1).setPosition(this.attackOrigin.x, this.attackOrigin.y)
      .setRotation(this.attackAngle).setDepth(this.attackOrigin.y - 1).setVisible(true);
    graphic.fillStyle(0xff6a4a, 0.15).lineStyle(3, 0xffbd54, 0.95);
    if (attack === 'sweep') {
      graphic.beginPath().moveTo(0, 0).arc(0, 0, WARDEN.sweep.range, -WARDEN.sweep.halfAngle, WARDEN.sweep.halfAngle, false)
        .closePath().fillPath().strokePath();
      this.arrow(graphic, 74, 0, 0);
    } else if (attack === 'rush') {
      graphic.fillRect(-this.radius, -WARDEN.rush.halfWidth, WARDEN.rush.distance + this.radius * 2, WARDEN.rush.halfWidth * 2);
      graphic.strokeRect(-this.radius, -WARDEN.rush.halfWidth, WARDEN.rush.distance + this.radius * 2, WARDEN.rush.halfWidth * 2);
      this.arrow(graphic, 130, 0, 0);
      this.arrow(graphic, 250, 0, 0);
    } else if (attack === 'slam') {
      this.groundWarning(graphic, WARDEN.slam.radius);
    } else if (attack === 'signal') {
      graphic.lineStyle(3, 0xffbd54, 0.7);
      for (let index = -1; index <= 1; index++) {
        const angle = index * WARDEN.signal.spread;
        const x = Math.cos(angle), y = Math.sin(angle);
        graphic.lineBetween(x * this.radius, y * this.radius, x * 520, y * 520);
        this.arrow(graphic, x * 160, y * 160, angle);
      }
    } else {
      graphic.setVisible(false);
      // All positions lock now; later circles never chase the player during execution.
      for (let index = 0; index < this.marks.length; index++) {
        const mark = this.marks[index];
        const side = index === 0 ? 0 : index === 1 ? -1 : 1;
        mark.x = clamp(player.x - Math.sin(this.attackAngle) * side * WARDEN.echoes.spacing,
          this.arenaBounds.left + WARDEN.echoes.radius, this.arenaBounds.right - WARDEN.echoes.radius);
        mark.y = clamp(player.y + Math.cos(this.attackAngle) * side * WARDEN.echoes.spacing,
          this.arenaBounds.top + WARDEN.echoes.radius, this.arenaBounds.bottom - WARDEN.echoes.radius);
        mark.spent = false;
        mark.visual.clear().setPosition(mark.x, mark.y).setRotation(0).setDepth(mark.y - 1).setAlpha(1).setVisible(true);
        this.groundWarning(mark.visual, WARDEN.echoes.radius);
        // One/two/three short notches communicate the order without relying on color.
        mark.visual.lineStyle(5, 0xffe0a3, 1);
        for (let notch = 0; notch <= index; notch++) mark.visual.lineBetween(-index * 8 + notch * 16, -30, -index * 8 + notch * 16, -18);
      }
    }
  }

  private groundWarning(graphic: Phaser.GameObjects.Graphics, radius: number): void {
    graphic.fillStyle(0xff6a4a, 0.15).fillCircle(0, 0, radius);
    graphic.lineStyle(3, 0xffbd54, 0.95).strokeCircle(0, 0, radius);
    graphic.lineBetween(-12, -12, 12, 12).lineBetween(12, -12, -12, 12);
    // Four edge strokes make the extent readable against both rock and vegetation.
    for (let index = 0; index < 4; index++) {
      const angle = index * Math.PI / 2;
      graphic.lineBetween(Math.cos(angle) * (radius - 13), Math.sin(angle) * (radius - 13),
        Math.cos(angle) * (radius + 4), Math.sin(angle) * (radius + 4));
    }
  }

  private arrow(graphic: Phaser.GameObjects.Graphics, x: number, y: number, angle: number): void {
    const forwardX = Math.cos(angle), forwardY = Math.sin(angle);
    const sideX = -forwardY, sideY = forwardX;
    graphic.lineBetween(x - forwardX * 14 + sideX * 10, y - forwardY * 14 + sideY * 10, x, y);
    graphic.lineBetween(x - forwardX * 14 - sideX * 10, y - forwardY * 14 - sideY * 10, x, y);
  }

  private render(now: number, travelled: number): void {
    const moving = travelled > 0.1 && (this._state === 'IDLE' || (this._state === 'EXECUTE' && this._attackName === 'rush'));
    if (moving) this.travelPhase += travelled / 62;
    const warning = this._state === 'TELEGRAPH';
    const execution = this._state === 'EXECUTE';
    const signalPose = this._attackName === 'signal' || this._attackName === 'echoes';
    const frame = this._state === 'PHASE' || (warning && signalPose) ? 6
      : warning ? 3 : execution ? signalPose ? 6 : this._attackName === 'slam' ? 5 : 4
      : moving ? 1 + Math.floor(this.travelPhase) % 2 : 0;
    this.body.setFrame(frame).setFlipX(this.facingLeft);
    if (now < this.hurtUntil) this.body.setTintFill(0xf3e4cd);
    else this.body.clearTint();
    const gait = moving ? Math.sin(this.travelPhase * Math.PI) : 0;
    const warningProgress = warning ? clamp((now - this.stateAt) / (this.stateUntil - this.stateAt), 0, 1) : 0;
    const introProgress = this._state === 'INTRO' ? clamp((now - this.stateAt) / WARDEN.introMs, 0, 1) : 1;
    this.body.setPosition(0, 30 - Math.abs(gait) * 2 + warningProgress * 3);
    this.view.setPosition(this.position.x, this.position.y).setDepth(this.position.y).setRotation(0);
    // Grounded steps use actual travel; a blocked creature never cycles through a glide.
    this.shadow.setPosition(this.position.x, this.position.y + 15).setDepth(this.position.y - 2)
      .setScale(1 + warningProgress * 0.04, 1 - warningProgress * 0.08);
    this.core.setFillStyle(this._phase === 3 ? 0xffbd54 : 0xa98cff)
      .setAlpha(this._state === 'DORMANT' ? 0.08 : (0.18 + this._phase * 0.07 + warningProgress * 0.38) * introProgress)
      .setScale(this._state === 'PHASE' ? 1.5 : 1 + Math.sin(now * 0.004) * 0.08 + warningProgress * 0.3);
    if (warning) {
      this.telegraph.setAlpha(0.62 + warningProgress * 0.38);
      if (this._attackName === 'echoes') for (const mark of this.marks) mark.visual.setAlpha(0.62 + warningProgress * 0.38);
    } else if (execution && this._attackName !== 'echoes' && this._attackName !== 'signal') {
      this.telegraph.setAlpha(1 - clamp((now - this.stateAt) / (this.stateUntil - this.stateAt), 0, 1) * 0.7);
    }
  }

  private clearHazards(): void {
    this.telegraph.setVisible(false);
    for (const shot of this.shots) { shot.active = false; shot.image.setVisible(false); }
    for (const mark of this.marks) { mark.spent = true; mark.visual.setVisible(false); }
  }

  // Called by GameScene immediately on player death, before its dead-player early return.
  suspend(): void {
    if (this.isDead || this.stopped) return;
    this.stopped = true;
    this.clearHazards();
    this._state = 'DORMANT';
    this._attackName = null;
    this.velocity.x = this.velocity.y = this.push.x = this.push.y = 0;
    this.body.setFrame(0).clearTint();
    this.core.setAlpha(0.15);
  }

  hurt(now: number, from: Vec2, force = 300): void {
    if (!this.canBeHit) return;
    this.hurtUntil = now + 115;
    const dx = this.position.x - from.x, dy = this.position.y - from.y;
    const length = Math.max(1, Math.hypot(dx, dy));
    this.push.x = dx / length * force * WARDEN.knockbackResistance;
    this.push.y = dy / length * force * WARDEN.knockbackResistance;
    // The boss takes ordinary damage. Its mass prevents Saber stunlock and preserves
    // committed warning geometry; reduced knockback is applied in idle/recovery only.
    this.body.setTintFill(0xf3e4cd);
  }

  die(): void {
    if (this.isDead) return;
    this.health.current = 0;
    this.isDead = true;
    this._state = 'DEATH';
    this._attackName = null;
    this.clearHazards();
    this.body.clearTint().setFrame(7);
    this.onCue('death');
    this.scene.tweens.add({ targets: this.core, alpha: 0, scale: 0.25, duration: 1400 });
    this.scene.tweens.add({ targets: this.view, scaleY: 0.87, alpha: 0.58, duration: 1700, ease: 'Sine.easeOut' });
    this.scene.tweens.add({ targets: this.shadow, scaleY: 0.7, alpha: 0.52, duration: 1700 });
    // Scene-owned finite timer is disposed on restart; completion cannot duplicate.
    this.scene.time.delayedCall(WARDEN.deathMs, () => {
      this.onCue('defeated');
      this.onDefeated();
    });
  }
}
