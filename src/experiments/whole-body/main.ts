import Phaser from 'phaser';
import { Player } from '../../entities/Player';
import { Controls } from '../../input/Controls';
import { AstralArt, preloadAstralArt } from '../../visual/AstralArt';
import { preloadModularArt } from '../../visual/ModularTorso';
import { AstralCombat } from '../../combat/AstralCombat';
import { KineticCharge } from '../../combat/KineticCharge';
import { SaberAttack } from '../../combat/Attack';
import { ASTRAL, ELEMENT_COLORS, ELEMENT_NAMES } from '../../config/classes';
import { VIEW_HEIGHT, VIEW_WIDTH } from '../../config/game';
import { WholeBodyActor } from './WholeBodyActor';
import '../../style.css';
import './style.css';

const status = document.querySelector<HTMLElement>('#lab-status')!;
class WholeBodyLab extends Phaser.Scene {
  player!: Player;
  current!: AstralArt;
  whole!: WholeBodyActor;
  controls!: Controls;
  combat!: AstralCombat;
  charge = new KineticCharge();
  private attack = new SaberAttack();
  private guide!: Phaser.GameObjects.Graphics;
  private arrow!: Phaser.GameObjects.Triangle;
  mode: 'whole' | 'current' = 'whole';
  private ready = false;
  private sampledAt = 0;
  private updates = 0;
  private sampleStart = 0;
  measuredFps = 0;
  fixture?: { direction: number; action: number };
  constructor() { super('WholeBody'); }
  preload(): void {
    preloadAstralArt(this); preloadModularArt(this);
    for (const key of ['warrior-body', 'warrior-body-back', 'warrior-body-side', 'warrior-boot', 'warrior-support-arm', 'warrior-saber-arm']) {
      const file = key === 'warrior-support-arm' ? 'warrior-saber-arm' : key;
      this.load.image(key, `${import.meta.env.BASE_URL}assets/visual/characters/${file}.png`);
    }
    this.load.image('item-accessory-1', `${import.meta.env.BASE_URL}assets/items/accessory-1.png`);
    this.load.image('lab-floor', `${import.meta.env.BASE_URL}assets/visual/environment/forest-ground.png`);
    this.load.spritesheet('whole-astral', `${import.meta.env.BASE_URL}assets/experiments/whole-body/astral-female-whole.png`, { frameWidth: 256, frameHeight: 256 });
    this.load.json('whole-frames', `${import.meta.env.BASE_URL}assets/experiments/whole-body/frames.json`);
  }
  create(): void {
    this.add.image(640, 360, 'lab-floor').setDisplaySize(1280, 720).setTint(0x85958a).setDepth(-1000);
    this.player = new Player(this, 640, 390, 85, false, false, () => 0, 'astral', 'female');
    this.current = new AstralArt(this, this.player.view, 640, 390, 'female');
    this.whole = new WholeBodyActor(this, this.player);
    this.combat = new AstralCombat(this, () => 0);
    this.guide = this.add.graphics().setDepth(10000);
    this.arrow = this.add.triangle(0, 0, 0, -4, 10, 0, 0, 4, 0xd6dbc9, .6).setDepth(9999);
    this.controls = new Controls(this, () => {}, () => this.fire());
    this.controls.setCombatPresentation(true, true);
    const blur = (): void => { this.controls.cancelForRecords(); this.charge.stop(); };
    window.addEventListener('blur', blur);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      window.removeEventListener('blur', blur); this.combat.destroy();
    });
    this.ready = true; this.sampleStart = performance.now();
    this.setMode('whole');
  }
  setMode(mode: 'whole' | 'current'): void {
    this.mode = mode;
    if (!this.ready) return;
    this.controls.cancelForRecords(); this.charge.stop(); this.combat.clear();
    this.player.view.setVisible(mode === 'current'); this.whole.image.setVisible(mode === 'whole');
    for (const b of Array.from(document.querySelectorAll<HTMLButtonElement>('[data-mode]'))) b.setAttribute('aria-pressed', String(b.dataset.mode === mode));
    document.querySelector<HTMLElement>('#mode-name')!.textContent = mode === 'whole' ? 'B · CORPO INTEIRO' : 'A · RIG ATUAL';
  }
  private fire(): void {
    if (!this.ready || this.charge.phase !== 'READY' || this.fixture) return;
    const aim = this.controls.aimFrom(this.player.position);
    this.combat.fire(this.time.now, this.player.position, aim,
      this.mode === 'whole' ? this.whole.projectileOffset(aim) : this.current.projectileOffset(aim));
  }
  reset(): void {
    this.controls.cancelForRecords(); this.charge.stop(); this.combat.clear(); this.fixture = undefined;
    this.player.revive({ x: 640, y: 390 }); this.combat.energy = ASTRAL.energyMax;
  }
  update(now: number, delta: number): void {
    if (!this.ready) return;
    this.updates++;
    if (performance.now() - this.sampleStart > 2000) {
      this.measuredFps = this.updates * 1000 / (performance.now() - this.sampleStart);
      this.updates = 0; this.sampleStart = performance.now();
    }
    if (this.fixture) {
      const aim = Math.PI / 2 - this.fixture.direction * Math.PI / 4;
      this.current.update(this.player.position.x, this.player.position.y, aim, this.fixture.action === 3, false, { phase: 'READY', level: 0 }, this.combat.element);
      this.whole.image.setFrame(this.fixture.direction * 4 + this.fixture.action);
      this.guide.clear(); return;
    }
    this.controls.update(this.player.position);
    const input = this.controls.movement(), aim = this.controls.aimFrom(this.player.position);
    if (this.controls.elementPressed && this.charge.phase === 'READY') this.combat.cycle();
    if (this.controls.chargeCancelled) this.charge.stop();
    if (this.controls.chargePressed && this.combat.canCharge && !this.player.isDashing) this.charge.start(now);
    if ((this.controls.chargeReleased || this.charge.phase === 'CHARGING' && !this.controls.chargeHeld) && this.charge.release(now, aim, this.player.position)) this.combat.cast(now, this.player.position, aim, this.charge.level(now));
    this.charge.tick(now);
    const heavy = this.charge.pose(now);
    if (this.controls.dashPressed && heavy.phase === 'READY') this.player.startDash(now, input);
    if (this.controls.attacking) this.fire();
    this.player.update(now, delta / 1000, input, aim, [], this.attack.pose(now, aim), heavy, { left: 120, right: 1160, top: 180, bottom: 620 });
    const firing = now < this.combat.firedUntil;
    this.current.update(this.player.position.x, this.player.position.y, aim, firing, this.player.isDashing, heavy, this.combat.element);
    this.whole.update(this.player, aim, firing, heavy);
    this.combat.update(now, delta / 1000, [], [], { left: 40, right: 1240, top: 100, bottom: 700 }, () => {}, heavy.phase === 'CHARGING');
    this.arrow.setPosition(this.player.position.x + Math.cos(aim) * 45, this.player.position.y + 39 + Math.sin(aim) * 18).setRotation(aim);
    this.guide.clear();
    if (this.mode === 'whole' && heavy.phase === 'CHARGING') {
      const color = ELEMENT_COLORS[this.combat.element], range = ASTRAL.castRange + ASTRAL.chargedRange * heavy.level;
      this.guide.lineStyle(2, color, .65).beginPath().arc(this.player.position.x, this.player.position.y, 44, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * heavy.level).strokePath();
      this.guide.lineStyle(1, color, .4).lineBetween(this.player.position.x, this.player.position.y, this.player.position.x + Math.cos(aim) * range, this.player.position.y + Math.sin(aim) * range)
        .strokeCircle(this.player.position.x + Math.cos(aim) * range, this.player.position.y + Math.sin(aim) * range, ASTRAL.radius + ASTRAL.chargedRadius * heavy.level);
    }
    if (now - this.sampledAt > 180) {
      this.sampledAt = now;
      status.textContent = `${ELEMENT_NAMES[this.combat.element]} · Energia ${Math.round(this.combat.energy)} · Q ${heavy.phase === 'CHARGING' ? Math.round(heavy.level * 100) + '%' : this.charge.getProgress(now) < 1 ? 'recarregando' : 'pronto'} · ${this.whole.image.frame.name}/31 · ${Math.round(this.measuredFps)} FPS`;
    }
  }
}
const scene = new WholeBodyLab();
const game = new Phaser.Game({ type: Phaser.AUTO, width: VIEW_WIDTH, height: VIEW_HEIGHT, parent: 'game', backgroundColor: '#152521',
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH }, render: { antialias: true, pixelArt: false }, scene: [scene] });
for (const button of Array.from(document.querySelectorAll<HTMLButtonElement>('[data-mode]'))) button.addEventListener('click', () => { scene.setMode(button.dataset.mode as 'whole' | 'current'); button.blur(); });
document.querySelector('#reset')!.addEventListener('click', event => { scene.reset(); (event.currentTarget as HTMLButtonElement).blur(); });
document.querySelector('#zoom')!.addEventListener('click', event => {
  const camera = scene.cameras.main, zoom = camera.zoom === 1 ? 1.8 : 1;
  camera.setZoom(zoom).centerOn(scene.player.position.x, scene.player.position.y);
  (event.currentTarget as HTMLButtonElement).textContent = zoom === 1 ? 'Ampliar' : 'Escala do jogo';
  (event.currentTarget as HTMLButtonElement).blur();
});
// This handle exists exclusively in the reserved lab, never in the campaign bundle.
Object.assign(window, { __wholeBodyLab: { game, scene } });
