import Phaser from 'phaser';
import { environmentImage } from '../visual/EnvironmentArt';
import { NORTHERN_DISCOVERY as SITE } from '../config/discovery';
import type { Vec2 } from '../utils/math';
import type { EchoSite } from './EchoSite';

export class NorthernDiscovery implements EchoSite {
  readonly id = 'northern-ruin';
  readonly message = 'SINAL DETECTADO\nFONTE: DESCONHECIDA';
  activated: boolean;
  private inscriptions: Phaser.GameObjects.Graphics;
  private pulse: Phaser.GameObjects.Ellipse;

  constructor(private scene: Phaser.Scene, discovered = false) {
    this.activated = discovered;
    environmentImage(scene, 'ancient-remnant', SITE.x, SITE.y - 40, 260, 180, SITE.y - 20);
    this.inscriptions = scene.add.graphics().setPosition(SITE.x,SITE.y).setDepth(SITE.y-19).setAlpha(discovered ? 0.65 : 0.32);
    this.inscriptions.lineStyle(2,0x9bd2c7).strokeTriangle(-13,-62,1,-73,13,-61);
    this.inscriptions.lineBetween(-13,-56,0,-40).lineBetween(0,-40,13,-56);
    this.inscriptions.lineBetween(0,-30,0,4).lineBetween(-7,-23,7,-23);
    this.inscriptions.lineBetween(-64,-35,-67,-12).lineBetween(75,-18,72,7);
    this.pulse = scene.add.ellipse(SITE.x,SITE.y+9,80,34).setStrokeStyle(2,0xadddd0,0.8).setDepth(SITE.y-21).setAlpha(0);
  }

  canInvestigate(position: Vec2, dead: boolean): boolean {
    return !dead && !this.activated && Math.hypot(position.x-SITE.x,position.y-SITE.y) <= SITE.radius;
  }

  activate(): void {
    if (this.activated) return;
    this.activated = true;
    this.inscriptions.setAlpha(1);
    this.scene.tweens.add({targets:this.inscriptions,alpha:0.65,duration:1400,ease:'Sine.easeOut'});
    this.pulseWithColor(0xadddd0);
  }

  respond(): void {
    this.pulseWithColor(0xa98cff);
  }

  private pulseWithColor(color: number): void {
    this.pulse.setStrokeStyle(2, color, 0.8);
    this.pulse.setScale(1).setAlpha(0.8);
    this.scene.tweens.add({targets:this.pulse,scaleX:3.2,scaleY:3.2,alpha:0,duration:900,ease:'Cubic.easeOut'});
  }
}
