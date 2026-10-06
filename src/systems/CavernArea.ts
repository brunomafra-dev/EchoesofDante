import Phaser from 'phaser';
import { CAVERN_BOUNDS, DEEP_AREA, DEEP_OBSTACLES, DEEP_RIDGES } from '../config/cavern';
import { CAVERN_STRUCTURE_FOOTPRINTS, cavernShelfFootprints } from '../config/environmentCollision';
import { DeepSignal } from './DeepSignal';
import { CavernContinuation } from './CavernContinuation';
import { WardenApproach } from './WardenApproach';
import { WARDEN_PREPARATION } from '../config/wardenPreparation';
import type { MovementBounds, Obstacle } from './Movement';
import { createEnvironmentGround } from '../visual/EnvironmentArt';
import { CavernEntryEnvironment } from '../visual/CavernEntryEnvironment';

// One continuous authored Cavern; static art is captured once per section.
export class CavernArea {
  readonly bounds: MovementBounds;
  readonly obstacles: Obstacle[] = [
    { x: 885, y: 595, radius: 56 },
    { x: 1190, y: 1000, radius: 63 },
    { x: 1490, y: 850, radius: 67 },
    ...DEEP_OBSTACLES,
    ...DEEP_RIDGES.flatMap(ridge => ridge.bases),
  ];
  private readonly collapseObstacle: Obstacle = { x: DEEP_AREA.collapseX, y: DEEP_AREA.collapseY, radius: 64 };
  private readonly deepSignal: DeepSignal;
  readonly continuation: CavernContinuation;
  readonly wardenApproach: WardenApproach;

  constructor(scene: Phaser.Scene, deepPassageOpen = false, fragmentSeen = false, firstEchoSeen = false, wardenGateOpen = false) {
    // One illustrated stone substrate continues below the entry basin, every
    // deeper pocket, the exterior approach and its baked scenery layers.
    createEnvironmentGround(scene, WARDEN_PREPARATION.cameraWidth, 'cavern-ground', 0xb7c4b5);
    this.bounds = { ...CAVERN_BOUNDS, right: deepPassageOpen ? wardenGateOpen ? 6480 : WARDEN_PREPARATION.right : CAVERN_BOUNDS.right };
    if (!deepPassageOpen) this.obstacles.push(this.collapseObstacle);
    new CavernEntryEnvironment(scene, this.obstacles, this.collapseObstacle);
    // One reused light source makes the inscriptions readable; no per-frame redraw.
    const glow = scene.add.ellipse(1492, 581, 86, 44, 0xa98cff, 0.17).setDepth(580);
    scene.tweens.add({ targets: glow, alpha: { from: 0.13, to: 0.35 }, scale: { from: 0.9, to: 1.1 }, duration: 2000, yoyo: true, repeat: -1 });
    const seam = scene.add.ellipse(1703, 486, 48, 14, 0xffbd54, 0.12).setDepth(480);
    scene.tweens.add({ targets: seam, alpha: { from: 0.1, to: 0.27 }, duration: 2300, yoyo: true, repeat: -1 });
    this.deepSignal = new DeepSignal(scene, deepPassageOpen);
    this.continuation = new CavernContinuation(scene, fragmentSeen);
    this.obstacles.push(...this.continuation.obstacles);
    this.wardenApproach = new WardenApproach(scene, firstEchoSeen, wardenGateOpen);
    this.obstacles.push(...this.wardenApproach.obstacles);
    // Add gameplay footprints after the static visual composition.
    this.obstacles.push(...CAVERN_STRUCTURE_FOOTPRINTS, ...cavernShelfFootprints());
  }

  revealDeep(onOpened: () => void): void {
    this.deepSignal.reveal(() => {
      const index = this.obstacles.indexOf(this.collapseObstacle);
      if (index >= 0) this.obstacles.splice(index, 1);
      this.bounds.right = WARDEN_PREPARATION.right;
      onOpened();
    });
  }

  respondToDeepSignal(): void { this.deepSignal.respond(); }
}
