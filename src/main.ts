import Phaser from 'phaser';
import { GameScene } from './scenes/GameScene';
import { VIEW_HEIGHT, VIEW_WIDTH } from './config/game';
import './style.css';
import { ApplicationShell } from './ui/ApplicationShell';

const shell = new ApplicationShell();

const game = new Phaser.Game({
  type: Phaser.AUTO,
  width: VIEW_WIDTH,
  height: VIEW_HEIGHT,
  parent: 'game',
  backgroundColor: '#102d2c',
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  render: { antialias: true, pixelArt: false },
  scene: [new GameScene(false, false, scene => shell.bind(scene))],
});
game.events.once(Phaser.Core.Events.DESTROY, () => shell.destroy());

if (import.meta.env.DEV) Object.assign(window, { __danteGame: game });
