import Phaser from 'phaser';
import { KINETIC_CHARGE, VIEW_HEIGHT, VIEW_WIDTH } from '../config/game';
import { ECHO_COUNT, NORTHERN_DISCOVERY } from '../config/discovery';
import type { KineticPhase } from '../combat/KineticCharge';

export class Hud {
  private hpFill: Phaser.GameObjects.Rectangle;
  private hpText: Phaser.GameObjects.Text;
  private dashFill: Phaser.GameObjects.Rectangle;
  private dashText: Phaser.GameObjects.Text;
  private chargeText: Phaser.GameObjects.Text;
  private deathGroup: Array<{ setVisible(value: boolean): unknown }> = [];
  private discoveryPrompt: Phaser.GameObjects.Text;
  private discoveryMessage: Phaser.GameObjects.Text;
  private progressText: Phaser.GameObjects.Text;
  private levelMessage: Phaser.GameObjects.Text;
  private signalPanel: Phaser.GameObjects.Graphics;
  private signalObjective: Phaser.GameObjects.Text;
  private areaSubtitle: Phaser.GameObjects.Text;
  private discoveryTimer?: Phaser.Time.TimerEvent;
  private levelTimer?: Phaser.Time.TimerEvent;

  constructor(private scene: Phaser.Scene, onRestart: () => void) {
    const text = (x: number, y: number, value: string, size: number, color = '#e8f1ed', condensed = false) => scene.add.text(x, y, value, {
      fontFamily: condensed ? 'Barlow Condensed, sans-serif' : 'DM Sans, sans-serif',
      fontSize: `${size}px`, color, fontStyle: condensed ? 'bold' : 'normal', letterSpacing: condensed ? 1.8 : 0.4,
    }).setScrollFactor(0).setDepth(20002);
    const panel = scene.add.graphics().setScrollFactor(0).setDepth(19990);
    const box = (x: number, y: number, w: number, h: number) => {
      panel.fillStyle(0x071b24, 0.88).fillRoundedRect(x, y, w, h, 8);
      panel.lineStyle(1, 0x668e91, 0.4).strokeRoundedRect(x, y, w, h, 8);
      panel.fillStyle(0x82c9cb, 0.65).fillRect(x + 12, y, 34, 2);
    };
    box(24, 16, 340, 79);
    box(24, 103, 340, 45);
    box(380, 16, 500, 79);
    box(896, 16, 360, 79);
    panel.fillStyle(0x071b24, 0.86).fillRoundedRect(24, VIEW_HEIGHT - 68, 1232, 48, 8);
    panel.lineStyle(1, 0x668e91, 0.32).strokeRoundedRect(24, VIEW_HEIGHT - 68, 1232, 48, 8);
    panel.fillStyle(0x82c9cb, 0.65).fillRect(39, VIEW_HEIGHT - 68, 46, 2);

    text(45, 24, 'ECHOES OF DANTE', 26, '#ecf5ee', true);
    this.areaSubtitle = text(47, 61, 'DANTE FOREST   /   COMBAT PROTOTYPE', 12, '#83a8a8');
    this.progressText = text(44, 112, 'LV 1   XP 0 / 60   ECHOES 0 / 3', 17, '#d8e9dc', true);
    this.signalPanel = scene.add.graphics().setScrollFactor(0).setDepth(19990).setVisible(false);
    this.signalPanel.fillStyle(0x071b24, 0.88).fillRoundedRect(24, 156, 340, 43, 8);
    this.signalPanel.lineStyle(1, 0xa98cff, 0.55).strokeRoundedRect(24, 156, 340, 43, 8);
    this.signalPanel.fillStyle(0xa98cff, 0.7).fillRect(36, 156, 34, 2);
    this.signalObjective = text(44, 165, 'FOLLOW THE SIGNAL  /  NORTH', 17, '#b9adff', true).setVisible(false);
    text(401, 25, 'GALACTIC WARRIOR', 19, '#eaf3ec', true);
    text(402, 58, 'VITALS', 12, '#8eb8b5', true);
    scene.add.rectangle(474, 57, 264, 13, 0x17343c).setOrigin(0).setScrollFactor(0).setDepth(20000);
    this.hpFill = scene.add.rectangle(476, 59, 260, 9, 0x9fd9c1).setOrigin(0).setScrollFactor(0).setDepth(20001);
    this.hpText = text(752, 49, '100 / 100 HP', 18, '#e5f3e8', true);
    text(917, 25, 'VOID DASH', 19, '#eaf3ec', true);
    text(918, 58, 'CHARGE', 12, '#8eb8b5', true);
    scene.add.rectangle(990, 57, 135, 13, 0x17343c).setOrigin(0).setScrollFactor(0).setDepth(20000);
    this.dashFill = scene.add.rectangle(992, 59, 131, 9, 0x8fd9df).setOrigin(0).setScrollFactor(0).setDepth(20001);
    this.dashText = text(1144, 48, 'READY', 19, '#a4e5e6', true);
    this.chargeText = text(918, 77, '[Q]  KINETIC READY', 12, '#a4e5e6');

    const key = (x: number, w: number, name: string, action: string) => {
      panel.fillStyle(0x24434c, 0.8).fillRoundedRect(x, VIEW_HEIGHT - 58, w, 28, 5);
      panel.lineStyle(1, 0x7bafb1, 0.45).strokeRoundedRect(x, VIEW_HEIGHT - 58, w, 28, 5);
      text(x + 10, VIEW_HEIGHT - 57, name, 18, '#d6f0e8', true);
      text(x + w + 11, VIEW_HEIGHT - 53, action, 13, '#9bb5b1');
    };
    key(43, 88, 'W A S D', 'MOVE');
    key(254, 82, 'MOUSE', 'AIM');
    key(449, 63, 'LMB', 'SABER STRIKE');
    key(748, 82, 'SPACE', 'VOID DASH');
    text(1107, VIEW_HEIGHT - 51, 'DANTE  /  01', 15, '#7fa7a5', true);
    this.discoveryPrompt = text(VIEW_WIDTH / 2, VIEW_HEIGHT - 115, '[ E ]  INVESTIGATE', 20, '#c4e5d9', true)
      .setOrigin(0.5).setBackgroundColor('#0b2730').setPadding(16, 9).setVisible(false);
    this.discoveryMessage = text(VIEW_WIDTH / 2, VIEW_HEIGHT - 164, 'SIGNAL DETECTED\nSOURCE: UNKNOWN', 22, '#c4e5d9', true)
      .setOrigin(0.5, 0).setAlign('center').setBackgroundColor('#0b2730').setPadding(22, 12).setVisible(false);
    this.levelMessage = text(VIEW_WIDTH / 2, 115, 'LEVEL UP', 25, '#e4f6dc', true)
      .setOrigin(0.5, 0).setAlign('center').setBackgroundColor('#0b2730').setPadding(20, 8).setVisible(false);

    const veil = scene.add.rectangle(0, 0, VIEW_WIDTH, VIEW_HEIGHT, 0x05141b, 0.79).setOrigin(0).setScrollFactor(0).setDepth(30000).setVisible(false);
    const frame = scene.add.graphics().setScrollFactor(0).setDepth(30001).setVisible(false);
    frame.fillStyle(0x0b2730, 0.97).fillRoundedRect(347, 199, 586, 334, 11);
    frame.lineStyle(2, 0x689b9c, 0.65).strokeRoundedRect(347, 199, 586, 334, 11);
    frame.fillStyle(0xda938b).fillRect(374, 199, 65, 3);
    const overline = text(640, 232, 'SIGNAL LOST   /   DANTE 01', 17, '#d99a91', true).setOrigin(0.5).setDepth(30002).setVisible(false);
    const title = text(640, 289, 'WARRIOR DOWN', 58, '#eff3e9', true).setOrigin(0.5).setDepth(30002).setVisible(false);
    const subtitle = text(640, 373, 'The forest is still listening.', 17, '#aac5bf').setOrigin(0.5).setDepth(30002).setVisible(false);
    const button = scene.add.rectangle(640, 467, 248, 55, 0x9edacf).setScrollFactor(0).setDepth(30002).setInteractive({ useHandCursor: true }).setVisible(false);
    const buttonText = text(640, 467, 'RESPAWN   [ R ]', 26, '#12303a', true).setOrigin(0.5).setDepth(30003).setVisible(false);
    button.on('pointerover', () => button.setFillStyle(0xc1eee1));
    button.on('pointerout', () => button.setFillStyle(0x9edacf));
    button.on('pointerdown', onRestart);
    this.deathGroup = [veil, frame, overline, title, subtitle, button, buttonText];
  }

  update(hp: number, maxHp: number, dashProgress: number, chargeProgress: number, chargePhase: KineticPhase, chargeLevel: number): void {
    this.hpFill.width = 260 * hp / maxHp;
    this.hpFill.setFillStyle(hp < maxHp * 0.3 ? 0xdb8c81 : 0x9fd9c1);
    this.hpText.setText(`${hp} / ${maxHp} HP`);
    this.dashFill.width = 131 * dashProgress;
    this.dashText.setText(dashProgress >= 1 ? 'READY' : `${Math.ceil((1 - dashProgress) * 1.7 * 10) / 10}s`);
    this.dashText.setColor(dashProgress >= 1 ? '#a4e5e6' : '#7b9c9c');
    this.chargeText.setText(chargePhase === 'CHARGING' ? `[Q]  CHARGING ${Math.round(chargeLevel * 100)}%` : chargePhase === 'RELEASE' ? '[Q]  KINETIC STRIKE' : chargeProgress >= 1 ? '[Q]  HOLD FOR KINETIC STRIKE' : `[Q]  KINETIC ${((1 - chargeProgress) * KINETIC_CHARGE.cooldown / 1000).toFixed(1)}s`);
    this.chargeText.setColor(chargePhase !== 'READY' || chargeProgress >= 1 ? '#a4e5e6' : '#7b9c9c');
  }

  setDiscoveryPrompt(visible: boolean): void { this.discoveryPrompt.setVisible(visible); }

  setProgress(level: number, xp: number, nextLevelXp: number | null, echoes: number): void {
    this.progressText.setText(`LV ${level}   XP ${nextLevelXp === null ? `${xp} / MAX` : `${xp} / ${nextLevelXp}`}   ECHOES ${echoes} / ${ECHO_COUNT}`);
  }

  setSignalObjective(synchronized: boolean, sourceLocated: boolean, passageOpen = false, inCavern = false, depthSeen = false): void {
    this.signalPanel.setVisible(synchronized);
    this.signalObjective.setVisible(synchronized);
    this.areaSubtitle.setText(inCavern ? 'CAVERN   /   FIRST DESCENT' : 'DANTE FOREST   /   COMBAT PROTOTYPE');
    if (synchronized) this.signalObjective.setText(inCavern ? depthSeen ? 'SIGNAL CONTINUES  /  BELOW' : 'EXPLORE THE CAVERN' : passageOpen ? 'ENTER THE CAVERN' : sourceLocated ? 'INVESTIGATE THE MECHANISM' : 'FOLLOW THE SIGNAL  /  NORTH');
  }

  showDiscovery(message: string): void {
    this.discoveryTimer?.remove(false);
    this.discoveryMessage.setText(message);
    this.discoveryMessage.setVisible(true);
    this.discoveryTimer = this.scene.time.delayedCall(NORTHERN_DISCOVERY.messageDuration, () => this.discoveryMessage.setVisible(false));
  }

  showLevelUp(level: number): void {
    this.levelTimer?.remove(false);
    this.levelMessage.setText(`LEVEL UP   /   LEVEL ${level}\nHP RESTORED`).setVisible(true);
    this.levelTimer = this.scene.time.delayedCall(2000, () => this.levelMessage.setVisible(false));
  }

  showDeath(): void {
    this.discoveryPrompt.setVisible(false);
    this.discoveryMessage.setVisible(false);
    this.levelMessage.setVisible(false);
    this.deathGroup.forEach(item => item.setVisible(true));
  }
}
