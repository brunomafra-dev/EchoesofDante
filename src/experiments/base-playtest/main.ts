import Phaser from 'phaser';
import {GameScene} from '../../scenes/GameScene';
import {VIEW_WIDTH,VIEW_HEIGHT} from '../../config/game';
import '../../style.css';
import '../glacier-playtest/playtest.css';
const game=new Phaser.Game({type:Phaser.AUTO,width:VIEW_WIDTH,height:VIEW_HEIGHT,parent:'game',backgroundColor:'#102d2c',scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH},render:{antialias:true,pixelArt:false},scene:[new GameScene(false,false,undefined,{area:'base',classId:'warrior',economy:true})]});
if(import.meta.env.DEV)Object.assign(window,{__danteGame:game});
document.querySelector('[data-reset]')!.addEventListener('click',()=>{const scene=game.scene.getScene('Game') as GameScene;if(scene.sys.isActive())scene.seedEconomyPlaytest()});
