import Phaser from 'phaser';
import { SaberAttack } from '../combat/Attack';
import { applyDamage } from '../combat/Damage';
import { KineticCharge } from '../combat/KineticCharge';
import { PLAYER, CRAWLER, KINETIC_CHARGE, WORLD_HEIGHT, WORLD_WIDTH } from '../config/game';
import { FOREST_ENTRY, FOREST_PATROLS, FOREST_SPAWNS } from '../config/forest';
import { CAVERN_DEPTH_OPENING, CAVERN_ENTRY, CAVERN_HOLLOWS, DEEP_AREA } from '../config/cavern';
import { FOREST_ECHOES, SIGNAL_THRESHOLD } from '../config/discovery';
import { HollowCrawler } from '../entities/HollowCrawler';
import { Player } from '../entities/Player';
import { Controls } from '../input/Controls';
import { Arena } from '../systems/Arena';
import { CavernArea } from '../systems/CavernArea';
import { MineralPulse } from '../systems/MineralPulse';
import { AudioManager } from '../systems/Sound';
import { NorthernDiscovery } from '../systems/NorthernDiscovery';
import { ForestEcho, type EchoSite } from '../systems/EchoSite';
import { Progression } from '../systems/Progression';
import { SignalThreshold } from '../systems/SignalThreshold';
import { PassageMechanism } from '../systems/PassageMechanism';
import type { MovementBounds, Obstacle } from '../systems/Movement';
import { Hud } from '../ui/Hud';
import { distance, normalized, type Vec2 } from '../utils/math';

export class GameScene extends Phaser.Scene {
  private player!: Player;
  private controls!: Controls;
  private arena!: Arena | CavernArea;
  private cavern?: CavernArea;
  private movementBounds?: MovementBounds;
  private area: 'forest' | 'cavern' = 'forest';
  private transferHp?: number;
  private transitioning = false;
  private cavernDepthSeen = false;
  private deepOpening = false;
  private deepPassageOpen = false;
  private deepAreaSeen = false;
  private gateObstacle?: Obstacle;
  private enemies: HollowCrawler[] = [];
  private hollowSpawnIds = new Map<HollowCrawler, number>();
  private readonly progression = new Progression();
  private attack = new SaberAttack();
  private charge = new KineticCharge();
  private sounds = new AudioManager();
  private hud!: Hud;
  private echoSites: EchoSite[] = [];
  private threshold?: SignalThreshold;
  private mechanism?: PassageMechanism;
  private kineticWave!: Phaser.GameObjects.Graphics;
  private waveDrawn = false;
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
    this.waveDrawn = false;
    this.enemies = [];
    this.hollowSpawnIds.clear();
    this.transitioning = false;
    this.deepOpening = false;
    this.cavern = undefined;
    this.gateObstacle = undefined;
    this.threshold = undefined;
    this.mechanism = undefined;
    this.echoSites = [];
    if (this.area === 'forest') {
      this.arena = new Arena(this);
      this.movementBounds = undefined;
      if (!this.progression.passageOpen) {
        this.gateObstacle = { x: SIGNAL_THRESHOLD.x, y: SIGNAL_THRESHOLD.y, radius: SIGNAL_THRESHOLD.obstacleRadius };
        this.arena.obstacles.push(this.gateObstacle);
      }
      new MineralPulse(this);
      this.echoSites = [
        new NorthernDiscovery(this, this.progression.echoes.has('northern-ruin')),
        new ForestEcho(this, FOREST_ECHOES.mineral, this.progression.echoes.has(FOREST_ECHOES.mineral.id)),
        new ForestEcho(this, FOREST_ECHOES.trace, this.progression.echoes.has(FOREST_ECHOES.trace.id)),
      ];
      this.threshold = new SignalThreshold(this, this.progression.signalSynchronized, this.progression.sourceLocated, this.progression.passageOpen);
      this.mechanism = new PassageMechanism(this, this.progression.sourceLocated, this.progression.passageOpen);
    } else {
      this.cavern = new CavernArea(this, this.deepPassageOpen);
      this.arena = this.cavern;
      this.movementBounds = this.arena.bounds;
    }
    const entry = this.area === 'forest' ? FOREST_ENTRY : CAVERN_ENTRY;
    this.player = new Player(this, entry.x, entry.y, this.progression.maxHp);
    if (this.transferHp !== undefined) this.player.health.current = Math.min(this.transferHp, this.player.maxHp);
    this.transferHp = undefined;
    this.kineticWave = this.add.graphics().setDepth(14999);
    this.controls = new Controls(this, () => this.sounds.unlock(), () => {
      if (!this.player.isDead) this.beginStrike(this.time.now);
    });
    this.sounds.setArea(this.area);
    const spawns = this.area === 'forest' ? FOREST_SPAWNS : CAVERN_HOLLOWS;
    spawns.forEach((point, index) => {
      const enemy = new HollowCrawler(this, point.x, point.y, this.area === 'forest' ? FOREST_PATROLS[index] : undefined);
      this.enemies.push(enemy);
      this.hollowSpawnIds.set(enemy, this.area === 'forest' ? index : FOREST_SPAWNS.length + index);
    });
    this.hud = new Hud(this, () => this.restart());
    this.updateProgressHud();
    this.hud.setSignalObjective(this.progression.signalSynchronized, this.progression.sourceLocated, this.progression.passageOpen, this.area === 'cavern', this.cavernDepthSeen, this.deepAreaSeen);
    this.cameras.main.setBounds(0, 0, this.area === 'cavern' ? DEEP_AREA.cameraWidth : WORLD_WIDTH, WORLD_HEIGHT)
      .startFollow(this.player.view, false, 0.1, 0.1);
    this.cameras.main.setBackgroundColor(this.area === 'forest' ? '#102d2c' : '#07151c');
    if (this.area === 'cavern') {
      this.cameras.main.centerOn(entry.x, entry.y);
      this.cameras.main.fadeIn(260, 5, 15, 20);
    }
    this.input.setDefaultCursor('crosshair');
  }

  update(time: number, delta: number): void {
    if (this.transitioning) return;
    this.controls.update(this.player.position);
    this.hud.setInputMethod(this.controls.inputMethod);
    const interact = this.controls.interactPressed;
    const nearbyEcho = this.echoSites.find(site => site.canInvestigate(this.player.position, this.player.isDead));
    const nearDiscovery = nearbyEcho !== undefined;
    const nearThreshold = this.threshold?.canInvestigate(this.player.position, this.player.isDead) ?? false;
    const nearMechanism = this.mechanism?.canInvestigate(this.player.position, this.player.isDead) ?? false;
    if (nearDiscovery && interact) {
      const wasSynchronized = this.progression.signalSynchronized;
      nearbyEcho.activate();
      const leveledUp = this.progression.discover(nearbyEcho.id);
      this.hud.showDiscovery(nearbyEcho.message);
      this.updateProgressHud();
      if (leveledUp) this.levelUp();
      this.sounds.discovery();
      if (!wasSynchronized && this.progression.signalSynchronized) this.synchronizeSignal();
    } else if (interact && nearThreshold && this.progression.locateSource()) {
      this.threshold?.locateSource();
      this.mechanism?.arm();
      this.hud.showDiscovery(SIGNAL_THRESHOLD.thresholdMessage);
      this.hud.setSignalObjective(true, true);
      this.sounds.signal();
    } else if (interact && nearMechanism && this.progression.openPassage()) {
      this.mechanism?.activate(() => {
        this.threshold?.open(() => {
          if (this.gateObstacle) {
            const index = this.arena.obstacles.indexOf(this.gateObstacle);
            if (index >= 0) this.arena.obstacles.splice(index, 1);
            this.gateObstacle = undefined;
          }
          this.hud.showDiscovery(SIGNAL_THRESHOLD.openedMessage);
        });
      });
      this.hud.showDiscovery(SIGNAL_THRESHOLD.openingMessage);
      this.hud.setSignalObjective(true, true, true);
      this.sounds.ancient();
    }
    this.hud.setDiscoveryPrompt(nearDiscovery || nearThreshold || nearMechanism);
    this.controls.setInteractAvailable(nearDiscovery || nearThreshold || nearMechanism);
    this.controls.setDead(this.player.isDead);
    if (this.player.isDead) {
      if (this.controls.restartPressed) this.restart();
      return;
    }
    const dt = Math.min(delta / 1000, 0.04);
    const input = this.controls.movement();
    const aim = this.controls.aimFrom(this.player.position);
    this.charge.tick(time);
    if (this.controls.chargeCancelled) this.charge.stop();
    if (this.controls.chargePressed && !this.player.isDashing && this.attack.pose(time, aim).phase === 'READY' && this.charge.start(time)) {
      this.sounds.charge();
    }
    if ((this.controls.chargeReleased || (this.charge.phase === 'CHARGING' && !this.controls.chargeHeld)) && this.charge.release(time, aim, this.player.position)) {
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
    this.player.update(time, dt, input, facing, this.arena.obstacles, pose, heavy, this.movementBounds);
    if (wasDashing && !this.player.isDashing) this.dashEnd();
    if (this.player.isDashing && time - this.lastDashTrail > 30) {
      this.lastDashTrail = time;
      this.dashTrail();
    }
    if (this.charge.wavePending) {
      const waveHits = this.charge.takeHits(time, this.enemies);
      this.resolvePlayerHits(time, waveHits, this.charge.damage, this.charge.angle, 0x5fe6d8, this.charge.origin, true);
    }
    this.renderKineticWave(time);
    const sweep = this.attack.advance(time, this.player.position, facing, this.enemies);
    this.resolveSaberHits(time, sweep.hits, sweep.pose.worldAngle);
    for (const enemy of this.enemies) {
      enemy.update(time, dt, this.player.position, this.player.isDead, this.arena.obstacles, () => this.enemyStrike(enemy), this.movementBounds);
    }
    this.enemies = this.enemies.filter(enemy => !enemy.isDead);
    this.hud.update(this.player.hp, this.player.maxHp, this.player.dashProgress, this.charge.getProgress(time), heavy.phase, heavy.level);
    if (this.area === 'forest' && this.progression.passageOpen && !this.gateObstacle && this.threshold?.isInside(this.player.position)) this.enterCavern();
    if (this.area === 'cavern' && !this.deepPassageOpen && !this.deepOpening && distance(this.player.position, CAVERN_DEPTH_OPENING) <= CAVERN_DEPTH_OPENING.radius) {
      this.cavernDepthSeen = true;
      this.deepOpening = true;
      this.hud.showDiscovery('SIGNAL CONTINUES\nSTONE RESPONDING');
      this.sounds.ancient();
      this.hud.setSignalObjective(true, true, true, true, true, false);
      this.cavern?.revealDeep(() => {
        this.deepOpening = false;
        this.deepPassageOpen = true;
        this.hud.showDiscovery('PASSAGE REVEALED\nSIGNAL: BELOW');
      });
    }
    if (this.area === 'cavern' && this.deepPassageOpen && !this.deepAreaSeen &&
      Math.hypot(this.player.position.x - DEEP_AREA.signalX, this.player.position.y - DEEP_AREA.signalY) <= DEEP_AREA.signalRadius) {
      this.deepAreaSeen = true;
      this.hud.showDiscovery('ANCIENT PATTERN\nSOURCE: STILL BELOW');
      this.sounds.signal();
      this.hud.setSignalObjective(true, true, true, true, true, true);
    }
  }

  private enterCavern(): void {
    this.transitioning = true;
    this.transferHp = this.player.hp;
    this.cameras.main.fadeOut(220, 5, 15, 20);
    this.time.delayedCall(240, () => {
      this.area = 'cavern';
      this.scene.restart();
    });
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
        const spawnIndex = this.hollowSpawnIds.get(enemy);
        if (spawnIndex !== undefined) {
          const reward = this.progression.defeatHollow(spawnIndex);
          if (reward.awarded) this.updateProgressHud();
          if (reward.leveledUp) this.levelUp();
          this.hollowSpawnIds.delete(enemy);
        }
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
      this.kineticWave.clear();
      this.waveDrawn = false;
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

  private renderKineticWave(now: number): void {
    if (!this.charge.waveVisible(now)) {
      if (this.waveDrawn) this.kineticWave.clear();
      this.waveDrawn = false;
      return;
    }
    this.kineticWave.clear();
    this.waveDrawn = true;
    const progress = this.charge.waveProgress(now);
    const angle = this.charge.angle;
    const radius = 80;
    const spread = Math.asin(KINETIC_CHARGE.waveHalfWidth / radius);
    const travel = KINETIC_CHARGE.waveStart + KINETIC_CHARGE.waveTravel * progress - radius + 8;
    const x = this.charge.origin.x + Math.cos(angle) * travel;
    const y = this.charge.origin.y + Math.sin(angle) * travel;
    const fade = Math.min(1, (1 - progress) / 0.22);
    this.kineticWave.lineStyle(18, 0x5fe6d8, 0.22 * fade);
    this.kineticWave.beginPath().arc(x, y, radius, angle - spread, angle + spread).strokePath();
    this.kineticWave.lineStyle(7, 0x70e9e2, 0.68 * fade);
    this.kineticWave.beginPath().arc(x, y, radius, angle - spread, angle + spread).strokePath();
    this.kineticWave.lineStyle(2, 0xe2fffa, 0.9 * fade);
    this.kineticWave.beginPath().arc(x, y, radius, angle - spread, angle + spread).strokePath();
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

  private updateProgressHud(): void {
    this.hud.setProgress(this.progression.level, this.progression.xp, this.progression.nextLevelXp, this.progression.echoes.size);
  }

  private synchronizeSignal(): void {
    this.threshold?.activate();
    // Give the third site's own discovery a moment before the shared response.
    this.time.delayedCall(1150, () => {
      if (this.player.isDead || this.progression.sourceLocated) return;
      this.echoSites.forEach(site => site.respond());
      this.hud.showDiscovery(SIGNAL_THRESHOLD.synchronizedMessage);
      this.hud.setSignalObjective(true, false);
      this.sounds.signal();
    });
  }

  private levelUp(): void {
    this.player.health.setMaxAndRestore(this.progression.maxHp);
    this.hud.showLevelUp(this.progression.level);
    const ring = this.add.circle(this.player.position.x, this.player.position.y, 25)
      .setStrokeStyle(3, 0xffbd54, 0.8).setDepth(15000);
    this.tweens.add({ targets: ring, scale: 2.6, alpha: 0, duration: 450, onComplete: () => ring.destroy() });
  }

  private restart(): void { this.scene.restart(); }
}
