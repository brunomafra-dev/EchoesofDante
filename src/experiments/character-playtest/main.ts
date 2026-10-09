import Phaser from 'phaser';
import {equipmentLook,PROTECTION_PARTS,type ProtectionStyle,type WeaponStyle} from '../../config/appearance';
import { GameScene } from '../../scenes/GameScene';
import { VIEW_HEIGHT,VIEW_WIDTH } from '../../config/game';
import '../../style.css';
import '../glacier-playtest/playtest.css';
const params=new URLSearchParams(location.search);
const classId=params.get('class')==='hunter'?'hunter':'warrior';
const sex=params.get('sex')==='female'?'female':'male';
const kit=params.get('kit');
const style:ProtectionStyle=kit==='basic'?'basic':kit==='reinforced'||kit==='pilot'?'reinforced':'none';
const look=equipmentLook(style);
for(const part of PROTECTION_PARTS){const v=params.get(part);if(v==='none'||v==='basic'||v==='reinforced')look[part]=v;}
const pilot=style==='reinforced';
const weaponParam=params.get('weapon');
const weaponLook:WeaponStyle=weaponParam==='starter'||weaponParam==='current'||weaponParam==='advanced'?weaponParam:style==='none'?'starter':style==='basic'?'current':'advanced';
for(const link of Array.from(document.querySelectorAll<HTMLAnchorElement>('[data-choice]'))){
  const next=new URLSearchParams(params);next.set(link.dataset.choice!,link.dataset.value!);if(link.dataset.choice==='kit')for(const part of PROTECTION_PARTS)next.delete(part);
  link.href=`character-playtest.html?${next}`;
  const selected=link.dataset.choice==='class'?classId:link.dataset.choice==='sex'?sex:style==='none'?'clothes':style;
  if(link.dataset.value===selected)link.setAttribute('aria-current','true');
}
const game=new Phaser.Game({type:Phaser.AUTO,width:VIEW_WIDTH,height:VIEW_HEIGHT,parent:'game',backgroundColor:'#102d2c',
 scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH},render:{antialias:true,pixelArt:false},
 scene:[new GameScene(false,false,undefined,{area:'forest',classId,sex,pilot,look,weaponLook})]});
if(import.meta.env.DEV)Object.assign(window,{__danteGame:game});

for(const select of Array.from(document.querySelectorAll<HTMLSelectElement>('select[data-part]'))){
  const part=select.dataset.part as typeof PROTECTION_PARTS[number];select.value=look[part];
  select.addEventListener('change',()=>{look[part]=select.value as ProtectionStyle;params.set(part,select.value);history.replaceState(null,'',`?${params}`);const scene=game.scene.getScene('Game') as GameScene;scene.setPlaytestAppearance(look);});
}

const weapons=document.querySelector<HTMLSelectElement>('select[data-weapon]')!;weapons.value=weaponLook;
weapons.addEventListener('change',()=>{const style=weapons.value as WeaponStyle;params.set('weapon',style);history.replaceState(null,'',`?${params}`);(game.scene.getScene('Game') as GameScene).setPlaytestWeapon(style);});
