import Phaser from 'phaser';
import {equipmentLook,PROTECTION_PARTS,type ProtectionStyle,type WeaponStyle} from '../../config/appearance';
import { GameScene } from '../../scenes/GameScene';
import{appearance,companion}from'../../config/characterPresentation';
import{appearanceControls}from'../../ui/AppearanceControls';
import { VIEW_HEIGHT,VIEW_WIDTH } from '../../config/game';
import '../../style.css';
import '../glacier-playtest/playtest.css';
const params=new URLSearchParams(location.search);
const classId=(['warrior','hunter','astral','xenobinder'].includes(params.get('class')??'')?params.get('class'):'warrior') as import('../../config/classes').PlayableClass;
const sex=params.get('sex')==='female'?'female':'male';
// Display laboratories must not register a legacy character or normalize the
// real registry, including when only an old journey/corrupt registry exists.
const storageGet=Storage.prototype.getItem,storageSet=Storage.prototype.setItem,storageRemove=Storage.prototype.removeItem;
const storagePrefix=`dante-complete-actor-display198.${classId}.${sex}.`;
const storageKey=(storage:Storage,key:string)=>storagePrefix+(storage===localStorage?'local.':'session.')+key;
Storage.prototype.getItem=function(key){return key.startsWith('echoes-of-dante.')?storageGet.call(sessionStorage,storageKey(this,key)):storageGet.call(this,key);};
Storage.prototype.setItem=function(key,value){if(key.startsWith('echoes-of-dante.'))storageSet.call(sessionStorage,storageKey(this,key),String(value));else storageSet.call(this,key,value);};
Storage.prototype.removeItem=function(key){if(key.startsWith('echoes-of-dante.'))storageRemove.call(sessionStorage,storageKey(this,key));else storageRemove.call(this,key);};
const visualAppearance=appearance(Object.fromEntries(['skin','hair','head'].map(key=>[key,params.get(key)]))),species=companion(params.get('pet'));
const kit=params.get('kit');
const style:ProtectionStyle=kit==='basic'?'basic':kit==='reinforced'||kit==='pilot'?'reinforced':'none';
const look=equipmentLook(style);
for(const part of PROTECTION_PARTS){const v=params.get(part);if(v==='none'||v==='basic'||v==='reinforced')look[part]=v;}
const pilot=style==='reinforced';
const weaponParam=params.get('weapon');
const weaponLook:WeaponStyle=weaponParam==='starter'||weaponParam==='current'||weaponParam==='advanced'?weaponParam:style==='none'?'starter':style==='basic'?'current':'advanced';
const identity=document.querySelector<HTMLElement>('[data-current-identity]');
if(identity)identity.textContent=`Você está testando: ${{warrior:'Guerreiro',hunter:'Caçador estelar',astral:'Manipulador Astral',xenobinder:'Domador de feras'}[classId]} · ${sex==='female'?'Feminino':'Masculino'} · ${style==='none'?'Roupa inicial':style==='basic'?'Carapaça básica':'Carapaça reforçada'}. O capacete pode ser retirado abaixo para comparar o rosto.`;
for(const link of Array.from(document.querySelectorAll<HTMLAnchorElement>('[data-choice]'))){
  const next=new URLSearchParams(params);next.set(link.dataset.choice!,link.dataset.value!);if(link.dataset.choice==='kit')for(const part of PROTECTION_PARTS)next.delete(part);
  link.href=`${location.pathname}?${next}`;
  const selected=link.dataset.choice==='class'?classId:link.dataset.choice==='sex'?sex:style==='none'?'clothes':style;
  if(link.dataset.value===selected)link.setAttribute('aria-current','true');
}
const game=new Phaser.Game({type:Phaser.AUTO,width:VIEW_WIDTH,height:VIEW_HEIGHT,parent:'game',backgroundColor:'#102d2c',
 scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH},render:{antialias:true,pixelArt:false},
 scene:[new GameScene(false,false,undefined,{area:'forest',classId,sex,pilot,look,weaponLook,appearance:visualAppearance,companion:species})]});
if(params.get('refinement')==='198'){
 document.querySelector('.playtest-navigation summary')!.textContent='REVISÃO 2D · PERSONAGENS E MAGIAS · 0.1.198';
 const nav=document.querySelector('.playtest-navigation nav')!;
 nav.append(appearanceControls(visualAppearance,value=>{const next=new URLSearchParams(params);for(const[key,v]of Object.entries(value))next.set(key,v);location.assign(location.pathname+'?'+next);}));
 if(classId==='xenobinder'){const label=document.createElement('label');label.textContent='Fera de teste (sem desbloqueio real)';const select=document.createElement('select');select.name='lab-companion';for(const[id,name]of [['symbiont','Simbionte'],['hollow','Hollow vinculado']]){const option=document.createElement('option');option.value=id;option.textContent=name;select.append(option);}select.value=species;select.onchange=()=>{const next=new URLSearchParams(params);next.set('pet',select.value);location.assign(location.pathname+'?'+next);};label.append(select);nav.append(label);}
 Object.assign(window,{__dante2dReview:()=>({isolated:true,fixture:'Character/gear/companion display only; canonical campaign untouched.',...(game.scene.getScene('Game')as GameScene).inspectCharacterPresentation()})});
}
if(import.meta.env.DEV)Object.assign(window,{__danteGame:game});

for(const select of Array.from(document.querySelectorAll<HTMLSelectElement>('select[data-part]'))){
  const part=select.dataset.part as typeof PROTECTION_PARTS[number];select.value=look[part];
  select.addEventListener('change',()=>{look[part]=select.value as ProtectionStyle;params.set(part,select.value);history.replaceState(null,'',`?${params}`);const scene=game.scene.getScene('Game') as GameScene;scene.setPlaytestAppearance(look);});
}

const weapons=document.querySelector<HTMLSelectElement>('select[data-weapon]')!;weapons.value=weaponLook;
weapons.addEventListener('change',()=>{const style=weapons.value as WeaponStyle;params.set('weapon',style);history.replaceState(null,'',`?${params}`);(game.scene.getScene('Game') as GameScene).setPlaytestWeapon(style);});
