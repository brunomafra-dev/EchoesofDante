import Phaser from 'phaser';
import { NORTHERN_DISCOVERY as SITE } from '../config/discovery';
import type { Vec2 } from '../utils/math';
import type { EchoSite } from './EchoSite';

export class NorthernDiscovery implements EchoSite {
  readonly id = 'northern-ruin';
  readonly message = 'SIGNAL DETECTED\nSOURCE: UNKNOWN';
  activated: boolean;
  private inscriptions: Phaser.GameObjects.Graphics;
  private pulse: Phaser.GameObjects.Ellipse;

  constructor(private scene: Phaser.Scene, discovered = false) {
    this.activated = discovered;
    const g = scene.add.graphics().setPosition(SITE.x, SITE.y).setDepth(SITE.y - 20);
    g.fillStyle(0x071c23, 0.65).fillEllipse(8, 27, 232, 75);
    // Unequal, fractured plates embedded in an older foundation, not an entrance.
    g.fillStyle(0x4b6066).fillPoints([{x:-100,y:22},{x:-90,y:-37},{x:-48,y:-51},{x:83,y:-23},{x:103,y:28}], true);
    g.fillStyle(0x293d4c).fillPoints([{x:-39,y:20},{x:-45,y:-83},{x:-14,y:-115},{x:27,y:-101},{x:44,y:17}], true);
    g.fillStyle(0x708985).fillPoints([{x:-45,y:-83},{x:-14,y:-115},{x:-9,y:-96},{x:-31,y:-72}], true);
    g.fillStyle(0x425b69).fillPoints([{x:27,y:-101},{x:44,y:17},{x:22,y:12},{x:10,y:-83}], true);
    g.fillStyle(0x152c36).fillPoints([{x:-20,y:-65},{x:1,y:-80},{x:20,y:-62},{x:1,y:-32}], true);
    g.fillStyle(0x617871).fillPoints([{x:-92,y:9},{x:-79,y:-64},{x:-61,y:-72},{x:-51,y:17}], true);
    g.fillStyle(0x3a505b).fillPoints([{x:57,y:17},{x:69,y:-43},{x:91,y:-30},{x:94,y:25}], true);
    g.lineStyle(2, 0x99aca0, 0.4).lineBetween(-82,-54,-72,-59).lineBetween(72,-31,84,-23);
    g.lineStyle(3, 0x142f35).lineBetween(-13,-96,-21,-84).lineBetween(-21,-84,-13,-73);
    // Soil and growth overlap the base; small flat fragments do not add blockers.
    g.fillStyle(0x345348).fillEllipse(-65,25,95,25).fillEllipse(64,27,91,21);
    g.fillStyle(0x526965).fillTriangle(-111,33,-93,40,-120,46).fillTriangle(88,43,110,33,123,47);
    g.lineStyle(3,0x4f7960).lineBetween(-81,20,-65,-21).lineBetween(60,28,75,2);
    for (let i=0;i<4;i++) {
      g.fillStyle(i%2 ? 0x62816b : 0x3f6859).fillEllipse(-78+i*4,12-i*9,17,8);
    }
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
