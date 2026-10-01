import Phaser from 'phaser';
import { RockRenderingLab } from './RockRenderingLab';

// Separate HTML entry: the normal game never imports this scene or its textures.
const game = new Phaser.Game({
  type: Phaser.AUTO,
  width: 1280,
  height: 720,
  parent: 'rendering-lab',
  backgroundColor: '#07151c',
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  render: { antialias: true, pixelArt: false },
  scene: [RockRenderingLab],
});

if (import.meta.env.DEV) Object.assign(window, { __danteRenderingLab: game });
