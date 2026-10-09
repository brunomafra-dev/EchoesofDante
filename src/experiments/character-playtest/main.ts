import Phaser from 'phaser';
import { GameScene } from '../../scenes/GameScene';
import { VIEW_HEIGHT,VIEW_WIDTH } from '../../config/game';
import '../../style.css';
import '../glacier-playtest/playtest.css';
const params=new URLSearchParams(location.search);
const classId=params.get('class')==='hunter'?'hunter':'warrior';
const sex=params.get('sex')==='female'?'female':'male';
const pilot=params.get('kit')==='pilot';
for(const link of Array.from(document.querySelectorAll<HTMLAnchorElement>('[data-choice]'))){
  const next=new URLSearchParams(params);next.set(link.dataset.choice!,link.dataset.value!);
  link.href=`character-playtest.html?${next}`;
  const selected=link.dataset.choice==='class'?classId:link.dataset.choice==='sex'?sex:pilot?'pilot':'base';
  if(link.dataset.value===selected)link.setAttribute('aria-current','true');
}
const game=new Phaser.Game({type:Phaser.AUTO,width:VIEW_WIDTH,height:VIEW_HEIGHT,parent:'game',backgroundColor:'#102d2c',
 scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH},render:{antialias:true,pixelArt:false},
 scene:[new GameScene(false,false,undefined,{area:'forest',classId,sex,pilot})]});
if(import.meta.env.DEV)Object.assign(window,{__danteGame:game});
