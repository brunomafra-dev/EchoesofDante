import type {WeaponId} from './character';

// The four playable classes of the 2D game (src/config/classes.ts, src/ui/CharacterSelection.ts),
// carried into the 3D track with the same names, roles and kits. Numbers are rescaled from
// the 2D pixels/ms to metres/seconds; ratios between classes are kept.
export type ClassId='warrior'|'hunter'|'astral'|'xenobinder';
export type Element='energy'|'fire'|'water'|'earth';
export interface Kit{
 name:string;role:string;fantasy:string;kit:string;weapon:WeaponId;
 hp:number;speed:number;resource:string;resColor:string;regen:number;
 idle:string;attacks:string[];atkSpeed:number;impact:number;
 primary:{kind:'melee'|'shot';dmg:number;range:number;arc?:number;color?:string;speed?:number};
 dash:{name:string;speed:number;dur:number;cd:number};
 skill:{name:string;cost:number;cd:number;hint:string};
 // melee extras: void lunge to a target out of reach, damage taken reduced, life drawn from each hit
 lunge?:{range:number;speed:number;cd:number};guard?:number;leech?:number;
}
export const CLASS_ORDER:ClassId[]=['warrior','hunter','astral','xenobinder'];
export const CLASSES:Record<ClassId,Kit>={
 warrior:{name:'Guerreiro Galáctico',role:'CORPO A CORPO · RESISTÊNCIA',fantasy:'Entre na batalha. Domine o espaço próximo.',kit:'Sabre de energia · Investida do vazio · Esquiva do vazio · Carga cinética',weapon:'saber',
  hp:140,speed:4.6,resource:'Carga',resColor:'#ff9a48',regen:9,
  idle:'Sword_Idle',attacks:['Sword_Attack'],atkSpeed:1.65,impact:.42,
  primary:{kind:'melee',dmg:30,range:3,arc:2.5},
  dash:{name:'Esquiva do vazio',speed:13,dur:.32,cd:.85},
  lunge:{range:9,speed:20,cd:2.2},guard:.25,leech:.06,
  skill:{name:'Carga cinética',cost:0,cd:3.2,hint:'segure e solte'}},
 hunter:{name:'Caçador estelar',role:'DISTÂNCIA · PRECISÃO',fantasy:'Controle a distância. Encontre sua janela de disparo.',kit:'Rifle de pulso · Passo de fase · Feixe perfurante',weapon:'carbine',
  hp:105,speed:4.7,resource:'Foco',resColor:'#6fe4ff',regen:7,
  idle:'Pistol_Idle_Loop',attacks:['Pistol_Shoot'],atkSpeed:1.9,impact:.18,
  primary:{kind:'shot',dmg:22,range:16,color:'#7fe9ff',speed:40},
  dash:{name:'Passo de fase',speed:10,dur:.42,cd:1.2},
  skill:{name:'Feixe perfurante',cost:40,cd:5,hint:'carrega e dispara um feixe gigante'}},
 astral:{name:'Manipulador Astral',role:'MÉDIO ALCANCE · CONTROLE',fantasy:'Controle o campo. Conduza as forças de Dante pela manopla.',kit:'Manopla astral · Energia, fogo, água e terra · Campos direcionais',weapon:'gauntlet',
  hp:110,speed:4.3,resource:'Energia',resColor:'#5fe6d8',regen:6,
  idle:'Idle_Loop',attacks:['Punch_Jab','Punch_Cross'],atkSpeed:1.7,impact:.38,
  primary:{kind:'shot',dmg:18,range:12,speed:26},
  dash:{name:'Passo astral',speed:7.5,dur:.55,cd:1.5},
  skill:{name:'Campo direcional',cost:30,cd:1.2,hint:'no cursor'}},
 xenobinder:{name:'Domador de feras',role:'DOMADOR · SIMBIOSE',fantasy:'Lute em simbiose. Oriente uma criatura de Dante e proteja sua expedição.',kit:'Condutor simbiótico · Fera companheira (uma de três) · Comando da fera',weapon:'conductor',
  hp:118,speed:4.3,resource:'Vínculo',resColor:'#6bb464',regen:2,
  idle:'Spell_Simple_Idle_Loop',attacks:['Spell_Simple_Shoot'],atkSpeed:1.7,impact:.35,
  primary:{kind:'shot',dmg:16,range:12,color:'#7dff9e',speed:28},
  dash:{name:'Esquiva',speed:7.5,dur:.55,cd:1.75},
  skill:{name:'Comando da fera',cost:35,cd:6,hint:'salto, abalo ou sopro, conforme a fera'}},
};
export const WEAPON_CLASS:Record<WeaponId,ClassId>={saber:'warrior',carbine:'hunter',gauntlet:'astral',conductor:'xenobinder'};
export const ELEMENTS:Element[]=['energy','fire','water','earth'];
export const ELEMENT_NAMES:Record<Element,string>={energy:'Energia',fire:'Fogo',water:'Água',earth:'Terra'};
export const ELEMENT_COLORS:Record<Element,string>={energy:'#5fe6d8',fire:'#ff6a4a',water:'#83ccd8',earth:'#ffbd54'};
