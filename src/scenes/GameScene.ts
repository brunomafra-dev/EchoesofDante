import Phaser from 'phaser';
import { SaberAttack } from '../combat/Attack';
import { applyDamage } from '../combat/Damage';
import { KineticCharge } from '../combat/KineticCharge';
import { PLAYER, CRAWLER, KINETIC_CHARGE, WORLD_HEIGHT, WORLD_WIDTH } from '../config/game';
import { FOREST_ENTRY, FOREST_PATROLS, FOREST_SPAWNS } from '../config/forest';
import { HollowCrawler } from '../entities/HollowCrawler';
import { Player } from '../entities/Player';
import { Controls } from '../input/Controls';
import { Arena } from '../systems/Arena';
import { MineralPulse } from '../systems/MineralPulse';
import { SoundEffects } from '../systems/Sound';
import { NorthernDiscovery } from '../systems/NorthernDiscovery';
import { Hud } from '../ui/Hud';
import { distance, normalized, type Vec2 } from '../utils/math';

export class GameScene extends Phaser.Scene {
  private player!: Player;
  private controls!: Controls;
  private arena!: Arena;
  private enemies: HollowCrawler[] = [];
  private attack = new SaberAttack();
  private charge = new KineticCharge();
  private sounds = new SoundEffects();
  private hud!: Hud;
  private discovery!: NorthernDiscovery;
  private lastDashTrail = 0;

  constructor() { super('Game'); }

  preload(): void {
    const assetBase = `${import.meta.env.BASE_URL}assets/visual/`;
    const art = [
      'warrior-body',
      'warrior-body-back',
      'warrior-body-side',
      'warrior-boot',
      'warrior-support-arm',
      'warrior-saber-arm',
      'hollow-body',
      'hollow-rear-limbs',
      'hollow-forelimbs',
      'dante-tree-trunk',
      'dante-canopy-green',
      'dante-canopy-blue',
    ] as const;
    for (const key of art) {
      if (!this.textures.exists(key)) this.load.svg(key, `${assetBase}${key}.svg`);
    }
  }

  create(): void {
    this.attack = new SaberAttack();
    this.charge = new KineticCharge();
    this.enemies = [];
    this.arena = new Arena(this);
    new MineralPulse(this);
    this.discovery = new NorthernDiscovery(this);
    this.player = new Player(this, FOREST_ENTRY.x, FOREST_ENTRY.y);
    this.controls = new Controls(this);
    FOREST_SPAWNS.forEach((point, index) => this.enemies.push(new HollowCrawler(this, point.x, point.y, FOREST_PATROLS[index])));
    this.hud = new Hud(this, () => this.restart());
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.leftButtonDown() && !this.player.isDead) this.beginStrike(this.time.now);
    });
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT).startFollow(this.player.view, false, 0.1, 0.1);
    this.cameras.main.setBackgroundColor('#102d2c');
    this.input.setDefaultCursor('crosshair');
  }

  update(time: number, delta: number): void {
    const interact = this.controls.interactPressed;
    const nearDiscovery = this.discovery.canInvestigate(this.player.position, this.player.isDead);
    if (nearDiscovery && interact) {
      this.discovery.activate();
      this.hud.showDiscovery();
      this.sounds.discovery();
    }
    this.hud.setDiscoveryPrompt(nearDiscovery && !this.discovery.activated);
    if (this.player.isDead) {
      if (this.controls.restartPressed) this.restart();
      return;
    }
    const dt = Math.min(delta / 1000, 0.04);
    const input = this.controls.movement();
    const aim = this.controls.aimFrom(this.player.position);
    this.charge.tick(time);
    if (this.controls.chargePressed && !this.player.isDashing && this.attack.pose(time, aim).phase === 'READY' && this.charge.start(time)) {
      this.sounds.charge();
    }
    if ((this.controls.chargeReleased || (this.charge.phase === 'CHARGING' && !this.controls.chargeHeld)) && this.charge.release(time, aim)) {
      this.sounds.swing();
      this.chargeBurst();
    }
    const heavy = this.charge.pose(time);
    const heavyBusy = heavy.phase !== 'READY';
    const facing = heavy.phase === 'RELEASE' ? this.charge.angle : aim;
    if (this.controls.dashPressed && !heavyBusy && this.player.startDash(time, input)) {
      this.sounds.dash();
      this.dashBurst(input);
    }
    if (this.controls.attacking && !heavyBusy) this.beginStrike(time);
    const pose = this.attack.pose(time, facing);
    const wasDashing = this.player.isDashing;
    this.player.update(time, dt, input, facing, this.arena.obstacles, pose, heavy);
    if (wasDashing && !this.player.isDashing) this.dashEnd();
    if (this.player.isDashing && time - this.lastDashTrail > 30) {
      this.lastDashTrail = time;
      this.dashTrail();
    }
    if (heavy.phase === 'RELEASE') {
      const hits = this.charge.takeHits(time, this.player.position, this.enemies);
      this.resolvePlayerHits(time, hits, this.charge.damage, facing, 0x5fe6d8, this.player.position, true);
    }
    const sweep = this.attack.advance(time, this.player.position, facing, this.enemies);
    this.resolveSaberHits(time, sweep.hits, sweep.pose.worldAngle);
    for (const enemy of this.enemies) {
      enemy.update(time, dt, this.player.position, this.player.isDead, this.arena.obstacles, () => this.enemyStrike(enemy));
    }
    this.enemies = this.enemies.filter(enemy => !enemy.isDead);
    this.hud.update(this.player.hp, this.player.maxHp, this.player.dashProgress, this.charge.getProgress(time), heavy.phase, heavy.level);
  }

  private beginStrike(now: number): void {
    if (this.charge.phase !== 'READY') return;
    if (!this.attack.start(now)) return;
    const facing = this.controls.aimFrom(this.player.position);
    this.player.setAim(facing);
    this.player.renderWeapon(facing, this.attack.pose(now, facing), this.charge.pose(now));
    this.sounds.swing();
  }

  private resolveSaberHits(now: number, hits: HollowCrawler[], saberAngle: number): void {
    this.resolvePlayerHits(now, hits, this.player.attackDamage, saberAngle, 0xaafce1, this.player.position, false);
  }

  private resolvePlayerHits(now: number, hits: HollowCrawler[], damage: number, angle: number, color: number, from: Vec2, chargeHit: boolean): void {
    if (hits.length) this.cameras.main.shake(chargeHit ? 75 : 55, chargeHit ? 0.003 : 0.0024);
    for (const enemy of hits) {
      const result = applyDamage(enemy.health, damage);
      if (!result.applied) continue;
      this.sounds.hit();
      this.impact(enemy.position, color, result.amount, angle);
      if (chargeHit) {
        const wave = this.add.circle(enemy.position.x, enemy.position.y, 14).setStrokeStyle(3, 0x5fe6d8, 0.82).setDepth(15001);
        this.tweens.add({ targets: wave, scale: 2.4, alpha: 0, duration: 190, onComplete: () => wave.destroy() });
      }
      if (result.died) {
        this.deathEffect(enemy.position);
        enemy.die();
      } else enemy.hurt(now, from, chargeHit ? KINETIC_CHARGE.knockback : 300);
    }
  }

  private enemyStrike(enemy: HollowCrawler): void {
    if (this.player.isDead || this.player.invulnerable || distance(enemy.position, this.player.position) > CRAWLER.attackRange + PLAYER.radius) return;
    const result = applyDamage(this.player.health, CRAWLER.attackDamage);
    if (!result.applied) return;
    this.sounds.hurt();
    this.player.flashHurt();
    this.impact(this.player.position, 0xff8f82, result.amount);
    const hurtRing = this.add.circle(this.player.position.x, this.player.position.y, 19).setStrokeStyle(4, 0xffa087, 0.8).setDepth(15001);
    this.tweens.add({ targets: hurtRing, scale: 2.2, alpha: 0, duration: 210, onComplete: () => hurtRing.destroy() });
    this.cameras.main.shake(90, 0.004);
    // Enemy swings are spaced by cooldown; this short grace period stops overlap bursts.
    this.player.setHurtGrace(this.time.now + PLAYER.hurtCooldown);
    if (result.died) {
      this.charge.stop();
      this.player.die();
      this.sounds.death();
      this.time.delayedCall(550, () => this.hud.showDeath());
    }
  }

  private impact(position: Vec2, color: number, damage: number, saberAngle?: number): void {
    const saberHit = saberAngle !== undefined;
    const burst = this.add.ellipse(position.x, position.y, saberHit ? 34 : 20, saberHit ? 9 : 20, color, 0.85).setDepth(15001);
    if (saberHit) burst.setRotation(saberAngle + Math.PI / 2);
    this.tweens.add({ targets: burst, scaleX: saberHit ? 1.25 : 2.6, scaleY: saberHit ? 0.55 : 2.6, alpha: 0, duration: saberHit ? 140 : 170, onComplete: () => burst.destroy() });
    for (let i = 0; i < 4; i++) {
      const angle = i * Math.PI / 2 + Math.PI / 4;
      const spark = this.add.ellipse(position.x, position.y, 11, 3, color, 0.9).setRotation(angle).setDepth(15002);
      this.tweens.add({ targets: spark, x: position.x + Math.cos(angle) * 28, y: position.y + Math.sin(angle) * 28, alpha: 0, scaleX: 0.35, duration: 180, onComplete: () => spark.destroy() });
    }
    const label = this.add.text(position.x, position.y - 31, `${damage}`, { fontFamily: 'Barlow Condensed, sans-serif', fontSize: '24px', fontStyle: 'bold', color: color === 0xff8f82 ? '#ff968a' : '#d4ffe9', stroke: '#14312d', strokeThickness: 4 }).setOrigin(0.5).setDepth(15002);
    this.tweens.add({ targets: label, y: label.y - 32, alpha: 0, duration: 520, onComplete: () => label.destroy() });
  }

  private deathEffect(position: Vec2): void {
    const ring = this.add.circle(position.x, position.y, 16).setStrokeStyle(3, 0x9ddcca, 0.7).setDepth(15000);
    this.tweens.add({ targets: ring, scale: 3.1, alpha: 0, duration: 330, onComplete: () => ring.destroy() });
    for (let i = 0; i < 6; i++) {
      const angle = i * Math.PI / 3;
      const fragment = this.add.triangle(position.x, position.y, 0, 0, 5, 3, 0, 7, i % 2 ? 0x668b84 : 0xb5dece, 0.9).setDepth(15001);
      this.tweens.add({ targets: fragment, x: position.x + Math.cos(angle) * 40, y: position.y + Math.sin(angle) * 35, alpha: 0, angle: 110, duration: 390, onComplete: () => fragment.destroy() });
    }
  }

  private dashTrail(): void {
    const ghost = this.add.ellipse(this.player.position.x, this.player.position.y, 50, 30, 0x8de5e5, 0.25).setRotation(this.player.rotation).setDepth(this.player.position.y - 1);
    this.tweens.add({ targets: ghost, scaleX: 1.3, scaleY: 0.25, alpha: 0, duration: 210, onComplete: () => ghost.destroy() });
  }

  private chargeBurst(): void {
    const x = this.player.position.x;
    const y = this.player.position.y;
    const burst = this.add.ellipse(x, y, 54, 18, 0x5fe6d8, 0.28).setRotation(this.charge.angle).setDepth(y - 1);
    this.tweens.add({ targets: burst, scaleX: 2.1, scaleY: 0.65, alpha: 0, duration: 190, onComplete: () => burst.destroy() });
  }

  private dashBurst(input: Vec2): void {
    const direction = input.x || input.y ? input : normalized(Math.cos(this.player.rotation), Math.sin(this.player.rotation));
    const ring = this.add.circle(this.player.position.x - direction.x * 15, this.player.position.y - direction.y * 15, 15).setStrokeStyle(3, 0xa1e9ee, 0.8).setDepth(15000);
    this.tweens.add({ targets: ring, scale: 2.6, alpha: 0, duration: 230, onComplete: () => ring.destroy() });
  }

  private dashEnd(): void {
    const ring = this.add.circle(this.player.position.x, this.player.position.y, 18).setStrokeStyle(2, 0x9ed9e1, 0.55).setDepth(this.player.position.y + 1);
    this.tweens.add({ targets: ring, scale: 1.8, alpha: 0, duration: 180, onComplete: () => ring.destroy() });
  }

  private restart(): void { this.scene.restart(); }
}
