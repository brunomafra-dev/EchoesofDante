import Phaser from 'phaser';
import { GameScene } from './scenes/GameScene';
import { VIEW_HEIGHT, VIEW_WIDTH } from './config/game';
import './style.css';
import { coopSession } from './network/CoopSession';
import { ApplicationShell } from './ui/ApplicationShell';

const shell = new ApplicationShell();
// A normal title/creation screen needs no world textures or scene. The
// explicit launch navigation loads them after the previews have been released.
// Existing direct laboratories retain their authored scene arrival.
const filename=location.pathname.split('/').pop()??'';
const menuLab=filename==='campaign-playtest.html'&&['mobile-review','audio-review','ux-review'].some(key=>new URLSearchParams(location.search).has(key));
const worldAtBoot=shell.needsWorld||(filename!==''&&filename!=='index.html'&&!menuLab);

export const game = new Phaser.Game({
  type: Phaser.AUTO,
  width: VIEW_WIDTH,
  height: VIEW_HEIGHT,
  parent: 'game',
  backgroundColor: '#102d2c',
  scale: { mode: Phaser.Scale.EXPAND, autoCenter: Phaser.Scale.CENTER_BOTH },
  render: { antialias: true, pixelArt: false },
  scene: worldAtBoot?[new GameScene(false, false, scene => shell.bind(scene),undefined,progress=>shell.reportLoading(progress))]:[],
  callbacks:{postBoot:game=>{if(!worldAtBoot)game.events.once(Phaser.Core.Events.POST_RENDER,()=>game.loop.sleep());}},
});
game.events.once(Phaser.Core.Events.DESTROY, () => { shell.destroy(); coopSession.disconnect(false); });

if (import.meta.env.DEV) Object.assign(window, { __danteGame: game, __danteCoop: coopSession });
