import Phaser from 'phaser';
import { GameScene } from '../../scenes/GameScene';
import { VIEW_HEIGHT,VIEW_WIDTH } from '../../config/game';
import { EQUIPMENT_IDS,EQUIPMENT } from '../../config/equipment';
import '../../style.css';
import '../glacier-playtest/playtest.css';
const params=new URLSearchParams(location.search),classId=params.get('class')==='hunter'?'hunter':'warrior',sex=params.get('sex')==='female'?'female':'male';
const game=new Phaser.Game({type:Phaser.AUTO,width:VIEW_WIDTH,height:VIEW_HEIGHT,parent:'game',backgroundColor:'#102d2c',scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH},render:{antialias:true,pixelArt:false},scene:[new GameScene(false,false,undefined,{area:'forest',classId,sex,inventory:true})]});
if(import.meta.env.DEV)Object.assign(window,{__danteGame:game});
// This entry is an explicit lab; sandbox methods never modify real saves.
function ready():GameScene|undefined{const s=game.scene.getScene('Game') as GameScene;return s?.sys.isActive()?s:undefined;}
document.querySelector('[data-drop]')!.addEventListener('click',()=>ready()?.seedInventoryPlaytest(false));
document.querySelector('[data-full]')!.addEventListener('click',()=>ready()?.seedInventoryPlaytest(true));
document.querySelector('[data-reset]')!.addEventListener('click',()=>ready()?.resetInventoryPlaytest());
for(const select of Array.from(document.querySelectorAll<HTMLSelectElement>('select[data-choice]'))){select.value=select.dataset.choice==='class'?classId:sex;select.onchange=()=>{params.set(select.dataset.choice!,select.value);location.search=params.toString();};}
const items=document.querySelector('select[data-item]') as HTMLSelectElement;
for(const id of EQUIPMENT_IDS){const o=document.createElement('option');o.value=id;o.textContent=EQUIPMENT[id].name;items.append(o);}
document.querySelector('[data-one]')!.addEventListener('click',()=>ready()?.seedInventoryPlaytest(false,items.value as typeof EQUIPMENT_IDS[number]));
