import Phaser from 'phaser';
import {VIEW_WIDTH,VIEW_HEIGHT} from '../../config/game';
import type {PlayableClass} from '../../config/classes';
import '../../style.css';
import './forest.css';

const params=new URLSearchParams(location.search),current=params.get('mode')==='current';
const classId=(['warrior','hunter','astral','xenobinder'].includes(params.get('class')??'')?params.get('class'):'warrior') as PlayableClass;
const sex=params.get('sex')==='female'?'female':'male',kit=params.get('kit')??'basic';
document.body.classList.add('forest-proof',current?'proof-current':'proof-enhanced');
document.querySelector(`[data-mode=${current?'current':'reference'}]`)?.setAttribute('aria-pressed','true');
const get=Storage.prototype.getItem,set=Storage.prototype.setItem,remove=Storage.prototype.removeItem,prefix=`dante-forest-finish.${classId}.${sex}.${kit}.`;
const key=(storage:Storage,k:string)=>prefix+(storage===localStorage?'local.':'session.')+k;
Storage.prototype.getItem=function(k){return k.startsWith('echoes-of-dante.')?get.call(sessionStorage,key(this,k)):get.call(this,k)};
Storage.prototype.setItem=function(k,v){if(k.startsWith('echoes-of-dante.'))set.call(sessionStorage,key(this,k),String(v));else set.call(this,k,v)};
Storage.prototype.removeItem=function(k){if(k.startsWith('echoes-of-dante.'))remove.call(sessionStorage,key(this,k));else remove.call(this,k)};
const {characterProfiles}=await import('../../systems/CharacterProfiles');
if(!characterProfiles.list.length){const p=characterProfiles.create('Pioneiro',classId,sex,{mode:'solo',difficulty:'normal'});if(p)characterProfiles.select(p.id);}
function choose(name:string,value:string){const url=new URL(location.href);url.searchParams.set(name,value);location.href=url.href;}
for(const b of Array.from(document.querySelectorAll<HTMLButtonElement>('[data-mode]')))b.onclick=()=>choose('mode',b.dataset.mode!);
for(const select of Array.from(document.querySelectorAll<HTMLSelectElement>('select'))){select.value=select.name==='class'?classId:select.name==='sex'?sex:kit;select.onchange=()=>choose(select.name,select.value);}
document.querySelector<HTMLButtonElement>('[data-retry]')!.onclick=()=>location.reload();
const comparison=document.querySelector<HTMLAnchorElement>('[data-hollow-compare]')!,comparisonUrl=new URL(location.href),previousHollow=params.get('hollow')==='previous';
comparisonUrl.searchParams.set('mode','reference');comparisonUrl.searchParams.set('hollow',previousHollow?'refined':'previous');comparison.href=comparisonUrl.href;
comparison.textContent=previousHollow?'Voltar ao Hollow com leitura refinada':'Comparar com o Hollow anterior nesta clareira';
const {GameScene}=await import('../../scenes/GameScene');
const game=new Phaser.Game({type:Phaser.AUTO,width:VIEW_WIDTH,height:VIEW_HEIGHT,parent:'game',backgroundColor:'#0b1612',scale:{mode:Phaser.Scale.EXPAND,autoCenter:Phaser.Scale.CENTER_BOTH},render:{antialias:true,pixelArt:false},scene:[new GameScene(current?'forest-current':'forest-reference',false,()=>{document.querySelector<HTMLElement>('#loading')!.hidden=true;})]});
const options=document.querySelector<HTMLDetailsElement>('.proof-tools details')!;
options.addEventListener('toggle',()=>{const scene=game.scene.getScene('Game') as import('../../scenes/GameScene').GameScene;if(!scene?.sys.isActive()&&!scene?.scene.isPaused())return;if(options.open){scene.pauseForShell();options.querySelector<HTMLSelectElement>('select')?.focus();}else {scene.resumeFromShell();game.canvas.focus();}});
let previous:boolean[]=[],frame=0;
const pad=()=>{const p=navigator.getGamepads?.().find(p=>p?.connected&&p.mapping==='standard'),buttons=p?.buttons.map(b=>b.pressed||b.value>.5)??[],edge=(i:number)=>buttons[i]&&!previous[i];
 if(edge(9))options.open=!options.open;
 if(options.open){const controls=Array.from(options.querySelectorAll<HTMLElement>('select,a'));if(edge(12)||edge(13)){const at=controls.indexOf(document.activeElement as HTMLElement);controls[(at+(edge(12)?-1:1)+controls.length)%controls.length]?.focus();}if(edge(0))(document.activeElement as HTMLElement)?.click();if(edge(1))options.open=false;}
 previous=buttons;frame=requestAnimationFrame(pad);};frame=requestAnimationFrame(pad);
game.events.once(Phaser.Core.Events.DESTROY,()=>cancelAnimationFrame(frame));
if(import.meta.env.DEV)Object.assign(window,{__danteGame:game});
