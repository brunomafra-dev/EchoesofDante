import Phaser from 'phaser';
import { Health } from '../combat/Health';
import { inMeleeArc, inShockwaveSweep } from '../combat/HitDetection';
import { PLAYER } from '../config/game';
import { VESPER as B, type IceAttack } from '../config/glacier';
import { moveWithCollisions, type Obstacle } from '../systems/Movement';
import { clamp, distance, type Vec2 } from '../utils/math';
import type { Enemy, EnemyImpact } from './Enemy';

export type IceCue = 'intro' | 'warning' | 'strike' | 'phase' | 'death';
// Encounter-specific state machine, on the same Enemy contract as the existing bosses.
export class Vesper implements Enemy {
  readonly health = new Health(B.hp);
  readonly radius = B.radius;
  readonly position = { ...B.spawn };
  readonly body: Phaser.GameObjects.Image;
  readonly shadow: Phaser.GameObjects.Ellipse;
  readonly telegraph: Phaser.GameObjects.Graphics;
  readonly attackRange = B.breath.range;
  state: 'DORMANT' | 'INTRO' | 'IDLE' | 'TELEGRAPH' | 'EXECUTE' | 'RECOVER' | 'PHASE' | 'DEATH' = 'DORMANT';
  phase: 1 | 2 | 3 = 1;
  attackName: IceAttack | null = null;
  isDead = false;
  get coopObjects(): Phaser.GameObjects.GameObject[] { return [this.shadow,this.body,this.telegraph,...this.marks.map(m=>m.image),...this.ice]; }
  private victims = new Set<Vec2>();
  private participants?: readonly Vec2[];
  private at = 0;
  private until = 0;
  private index = 0;
  private angle = 0;
  private hitSpent = false;
  private travelled = 0;
  private gait = 0;
  private left = true;
  private hurtUntil = 0;
  private stopped = false;
  private origin = { x: 0, y: 0 };
  private readonly marks: { x: number; y: number; spent: boolean; image: Phaser.GameObjects.Graphics }[];
  private readonly ice: Phaser.GameObjects.Image[];

  constructor(private scene: Phaser.Scene, private cue: (cue: IceCue) => void, private finish: () => void) {
    this.shadow = scene.add.ellipse(this.position.x, this.position.y + 10, 175, 37, 0x051219, .3);
    this.body = scene.add.image(this.position.x, this.position.y + 15, 'vesper-motion', 0)
      .setOrigin(.5, 244 / 256).setDisplaySize(B.size, B.size).setFlipX(true);
    this.telegraph = scene.add.graphics().setVisible(false);
    this.marks = Array.from({ length: 3 }, () => ({ x: 0, y: 0, spent: true, image: scene.add.graphics().setVisible(false) }));
    this.ice = Array.from({ length: 9 }, () => scene.add.image(0, 0, 'mineral-growth').setTint(0xc8dcee).setVisible(false));
  }
  get canBeHit(): boolean { return !this.isDead && !this.stopped && !['DORMANT', 'INTRO', 'PHASE'].includes(this.state); }
  get solid(): boolean { return !this.isDead; }
  beginIntro(now: number): void {
    if (this.state !== 'DORMANT' || this.stopped) return;
    this.setState('INTRO', now, 2200); this.cue('intro');
  }
  private setState(state: typeof this.state, now: number, ms: number): void { this.state = state; this.at = now; this.until = now + ms; }
  update(now: number, dt: number, player: Vec2, dead: boolean, obstacles: readonly Obstacle[], onAttack: (i?: EnemyImpact) => void, _bounds?: unknown, participants?: readonly Vec2[]): void {
    this.participants=participants;
    if (this.isDead || this.stopped) return;
    if (dead) { this.suspend(); return; }
    dt = Math.min(dt, .04);
    const before = { ...this.position };
    if (this.state === 'DORMANT') { this.render(now, 0); return; }
    if (this.state === 'INTRO' || this.state === 'PHASE') {
      if (now >= this.until) this.setState('IDLE', now, 650);
    } else {
      const next = this.health.current <= this.health.max * .3 ? 3 : this.health.current <= this.health.max * .65 ? 2 : 1;
      if (next > this.phase && this.state !== 'TELEGRAPH' && this.state !== 'EXECUTE') {
        this.phase = next; this.attackName = null; this.clear(); this.setState('PHASE', now, 1400); this.cue('phase');
      } else if (this.state === 'IDLE') {
        const gap = distance(this.position, player);
        if (Math.abs(player.x - this.position.x) > 12) this.left = player.x < this.position.x;
        if (gap > 180) moveWithCollisions(this.position,
          { x: (player.x - this.position.x) / gap * B.speed, y: (player.y - this.position.y) / gap * B.speed }, dt, this.radius, obstacles, B.bounds);
        if (now >= this.until) this.beginAttack(now, B.patterns[this.phase][this.index++ % B.patterns[this.phase].length], player);
      } else if (this.state === 'TELEGRAPH' && now >= this.until) {
        this.setState('EXECUTE', now, B[this.attackName!].duration); this.cue('strike');
      } else if (this.state === 'EXECUTE' && this.attackName) {
        const attack = this.attackName, elapsed = now - this.at;
        if (attack === 'rush') {
          const start = { ...this.position };
          moveWithCollisions(this.position, { x: Math.cos(this.angle) * B.rush.speed, y: Math.sin(this.angle) * B.rush.speed }, dt, this.radius, obstacles, B.bounds);
          const step = distance(start, this.position); this.travelled += step;
          for(const victim of this.participants??[player]) if (inShockwaveSweep(start, this.angle, victim, 0, step, B.rush.halfWidth, this.radius * 2, PLAYER.radius)) this.hit(onAttack,victim);
          if (step < B.rush.speed * dt * .3 || this.travelled >= B.rush.distance) this.until = now;
        } else if (attack === 'eruption') {
          this.marks.forEach((m, i) => {
            if (!m.spent && elapsed >= i * B.eruption.interval) {
              m.spent = true;
              for(const victim of this.participants??[player]) if (distance(m, victim) < B.eruption.radius + PLAYER.radius) this.hit(onAttack,victim);
            }
            m.image.setAlpha(m.spent ? Math.max(0, 1 - (elapsed - i * B.eruption.interval) / 350) : 1);
          });
        } else if (attack === 'breath' || elapsed < 170) {
          for(const victim of this.participants??[player]) if (inMeleeArc(this.origin, this.angle, victim, B[attack].range, B[attack].halfAngle, PLAYER.radius)) this.hit(onAttack,victim);
        }
        // Each activation hits at most once; dash invulnerability remains on the existing damage path.
        if (now >= this.until) { const rest = B[attack].recovery; this.clear(); this.setState('RECOVER', now, rest); }
      } else if (this.state === 'RECOVER' && now >= this.until) { this.attackName = null; this.setState('IDLE', now, this.phase === 3 ? 420 : 650); }
    }
    this.render(now, distance(before, this.position));
  }
  private hit(callback: (i?: EnemyImpact) => void, victim:Vec2): void {
    if ((!this.participants && this.hitSpent) || this.victims.has(victim) || !this.attackName) return;
    this.victims.add(victim);
    this.hitSpent = true; callback({ damage: B[this.attackName].damage, ranged: true, victim });
  }
  private beginAttack(now: number, attack: IceAttack, player: Vec2): void {
    this.clear(); this.attackName = attack; this.hitSpent = false; this.victims.clear(); this.travelled = 0;
    Object.assign(this.origin, this.position);
    this.angle = Math.atan2(player.y - this.position.y, player.x - this.position.x);
    this.left = Math.cos(this.angle) < 0;
    this.setState('TELEGRAPH', now, B[attack].tell); this.cue('warning');
    const g = this.telegraph.clear().setPosition(this.origin.x, this.origin.y).setRotation(this.angle).setDepth(this.position.y - 3).setVisible(true).setAlpha(1);
    g.fillStyle(0xa98cff, .18).lineStyle(3, 0xffbd54, .95);
    if (attack === 'breath' || attack === 'tail') {
      const s = B[attack];
      g.beginPath().moveTo(0, 0).arc(0, 0, s.range, -s.halfAngle, s.halfAngle, false).closePath().fillPath().strokePath();
      g.lineBetween(80, -10, 110, 0).lineBetween(80, 10, 110, 0);
    } else if (attack === 'rush') {
      g.fillRect(-55, -B.rush.halfWidth, B.rush.distance + 110, B.rush.halfWidth * 2);
      g.strokeRect(-55, -B.rush.halfWidth, B.rush.distance + 110, B.rush.halfWidth * 2);
      g.lineBetween(160, -18, 190, 0).lineBetween(160, 18, 190, 0);
    } else {
      g.setVisible(false);
      this.marks.forEach((m, i) => {
        m.x = clamp(player.x + (i - 1) * 165, B.bounds.left + 80, B.bounds.right - 80);
        m.y = clamp(player.y + (i === 1 ? -90 : 50), B.bounds.top + 80, B.bounds.bottom - 80); m.spent = false;
        m.image.clear().setPosition(m.x, m.y).setDepth(m.y - 3).setVisible(true).setAlpha(1);
        m.image.fillStyle(0xa98cff, .22).lineStyle(3, 0xffbd54, .95).fillCircle(0, 0, B.eruption.radius).strokeCircle(0, 0, B.eruption.radius);
        m.image.lineBetween(-12, 0, 12, 0).lineBetween(0, -12, 0, 12);
      });
    }
  }
  private render(now: number, travel: number): void {
    this.gait += travel / 30;
    const frame = this.state === 'EXECUTE' ? this.attackName === 'tail' ? 4 : this.attackName === 'rush' ? 5 : 6
      : this.state === 'TELEGRAPH' ? 3 : travel > .1 ? 1 + Math.floor(this.gait) % 2 : 0;
    this.body.setFrame(frame).setFlipX(this.left).setPosition(this.position.x, this.position.y + 15)
      .setDepth(this.position.y).setRotation(0).setScale(B.size / 256, B.size / 256 * (1 + Math.sin(now / 560) * .012));
    if (now < this.hurtUntil) this.body.setTintFill(0xe9f2ff); else this.body.clearTint();
    this.shadow.setPosition(this.position.x, this.position.y + 10).setDepth(this.position.y - 2);
    if (this.state === 'EXECUTE' && this.attackName === 'breath') this.telegraph.setAlpha(.8 + Math.sin(now / 60) * .15);
    // Nine reusable raster accents. Only bounded attack VFX animate; scenery stays baked.
    const breath = this.state === 'EXECUTE' && this.attackName === 'breath';
    const eruption = this.state === 'EXECUTE' && this.attackName === 'eruption';
    this.ice.forEach((image, i) => {
      image.setVisible(breath || eruption && this.marks[Math.floor(i / 3)].spent);
      if (breath) {
        const forward = 65 + ((now - this.at) * .36 + i * 45) % 300;
        const sideways = Math.sin(i * 2.4) * forward * .24;
        image.setPosition(this.origin.x + Math.cos(this.angle) * forward - Math.sin(this.angle) * sideways,
          this.origin.y + Math.sin(this.angle) * forward + Math.cos(this.angle) * sideways)
          .setDisplaySize(35 + forward * .12, 22 + forward * .09).setAlpha(.5).setDepth(this.origin.y + 2);
      } else if (eruption) {
        const m = this.marks[Math.floor(i / 3)], age = now - this.at - Math.floor(i / 3) * B.eruption.interval;
        image.setPosition(m.x + (i % 3 - 1) * 34, m.y - Math.sin(clamp(age / 350, 0, 1) * Math.PI) * 25)
          .setDisplaySize(48, 68).setAlpha(Math.max(0, 1 - age / 450)).setDepth(m.y + 2);
      }
    });
  }
  private clear(): void { this.telegraph.setVisible(false); this.marks.forEach(m => { m.spent = true; m.image.setVisible(false); }); this.ice.forEach(image => image.setVisible(false)); }
  hurt(now: number): void { if (this.canBeHit) this.hurtUntil = now + 120; }
  suspend(): void { this.stopped = true; this.clear(); }
  die(): void {
    if (this.isDead) return;
    this.isDead = true; this.health.current = 0; this.state = 'DEATH'; this.clear(); this.body.setFrame(7).clearTint(); this.cue('death');
    this.scene.tweens.add({ targets: this.body, alpha: .6, duration: 1800 });
    this.scene.time.delayedCall(1800, this.finish);
  }
}
