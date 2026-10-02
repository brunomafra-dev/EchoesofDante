import Phaser from 'phaser';
import { drawOrganicCavernForm } from '../../visual/OrganicCavernForm';

const ASSETS = ['rock-raster', 'rock-illustrated', 'contact-shadow', 'root-mineral-overlay'] as const;
const COLUMNS = [205, 495, 785, 1075] as const;
const Y = 346;

export class RockRenderingLab extends Phaser.Scene {
  constructor() { super('RockRenderingLab'); }

  preload(): void {
    const base = `${import.meta.env.BASE_URL}assets/experiments/rock-rendering/`;
    for (const key of ASSETS) this.load.image(`lab-${key}`, `${base}${key}.png`);
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#07151c');
    const text = (x: number, y: number, value: string, size = 16, color = '#afc1b9') =>
      this.add.text(x, y, value, { fontFamily: 'monospace', fontSize: size, color, align: 'center' }).setOrigin(0.5);
    text(640, 70, 'ECHOES OF DANTE / LABORATÓRIO DE ROCHAS', 26);
    text(640, 112, 'SCI-FI ORGÂNICO R3 / MESMA ESCALA, SOLO E LUZ SUPERIOR ESQUERDA', 16, '#78948b');

    // Same quiet floor/context in every column; drawn once and then discarded.
    const floor = this.add.graphics().setVisible(false);
    for (const x of COLUMNS) {
      floor.fillStyle(0x293c3d).fillRoundedRect(x - 128, 184, 256, 310, 10);
      floor.lineStyle(1, 0x456057, 0.4).strokeRoundedRect(x - 128, 184, 256, 310, 10);
      floor.fillStyle(0x3c5049, 0.22).fillEllipse(x, Y + 55, 200, 62);
    }
    this.add.renderTexture(0, 0, 1280, 720).setOrigin(0).setDepth(-2).draw(floor);
    floor.destroy();

    COLUMNS.forEach(x => this.add.image(x, Y, 'lab-contact-shadow').setDisplaySize(256, 256).setDepth(-1));

    // A is the exact unrefined Prototype 02 drawing, captured once as in Cavern.
    const baseline = this.add.graphics().setVisible(false);
    drawOrganicCavernForm(baseline);
    this.add.renderTexture(COLUMNS[0] - 128, Y - 128, 256, 256).setOrigin(0)
      .draw(baseline, 128 - 885, 128 - 595);
    baseline.destroy();

    // B/C/D use only loaded PNG Images. No surface drawing or generation at runtime.
    this.add.image(COLUMNS[1], Y, 'lab-rock-raster').setDisplaySize(256, 256);
    this.add.image(COLUMNS[2], Y, 'lab-rock-illustrated').setDisplaySize(256, 256);
    this.add.image(COLUMNS[3], Y, 'lab-rock-illustrated').setDisplaySize(256, 256);
    this.add.image(COLUMNS[3], Y, 'lab-root-mineral-overlay').setDisplaySize(256, 256);

    const labels = ['A — GEOMETRIA', 'B — RASTER', 'C — ILUSTRAÇÃO', 'D — HÍBRIDO'];
    const descriptions = ['Geometria atual em cache', 'Altura e material offline', 'PNG pintado original', 'C + raízes e minerais'];
    COLUMNS.forEach((x, i) => {
      text(x, 219, labels[i], 18);
      text(x, 459, descriptions[i], 13, '#78948b');
    });

    // A footprint reference is diagnostic only: this scene has no gameplay physics.
    const footprints = this.add.graphics().setDepth(2).setVisible(false);
    footprints.lineStyle(1, 0xafc1b9, 0.55);
    COLUMNS.forEach(x => footprints.strokeCircle(x, Y, 56));
    const toggle = text(640, 544, 'BASE FÍSICA: OCULTA — CLIQUE PARA MOSTRAR O RAIO 56', 14);
    toggle.setInteractive({ useHandCursor: true }).on('pointerdown', () => {
      footprints.setVisible(!footprints.visible);
      toggle.setText(`BASE FÍSICA: ${footprints.visible ? 'VISÍVEL' : 'OCULTA'} — CLIQUE PARA ALTERNAR`);
    });
    text(640, 590, 'B / C / D: PNG RGBA de 512px → 256 unidades; silhueta ≈112 unidades', 14, '#78948b');
    text(640, 632, 'COMPARAÇÃO TÉCNICA — D É A REFERÊNCIA VISUAL APROVADA', 15);
    text(640, 662, 'Laboratório isolado / sem alterações no movimento, combate ou progressão', 13, '#78948b');
  }
}
