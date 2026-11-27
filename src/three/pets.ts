import type {ModelId} from './creatures';

// Companions of the Domador de feras, after the three companions of the 2D game (src/config/companions.ts):
// same roles and commands. Each is a beast that lives nowhere else on the map; the player picks one when the
// character is created and can trade it later at the base, in the beast pen.
export type PetId='symbiont'|'bulwark'|'frostling';
export interface PetDef{
 name:string;role:string;command:string;desc:string;model:ModelId;glow:string;base:string;
 speed:number;           // m/s when following or chasing
 bite:number;biteCd:number;reach:number;
 shot?:{dmg:number;range:number;speed:number};   // ranged companions spit instead of biting
}
export const PET_ORDER:PetId[]=['symbiont','bulwark','frostling'];
export const PETS:Record<PetId,PetDef>={
 symbiont:{name:'Simbionte de Dante',role:'ASSALTO E RECUPERAÇÃO',command:'Salto simbiótico',
  desc:'Felino de musgo, rápido. Q: salta até o ponto mirado, atinge a área ao pousar e recupera você se estiver perto.',
  model:'pCat',glow:'#7dff9e',base:'#4a5a34',speed:7.2,bite:20,biteCd:.8,reach:1.3},
 bulwark:{name:'Broto Guardião',role:'IMPACTO E PROTEÇÃO',command:'Abalo guardião',
  desc:'Broto encouraçado, lento e forte. Q: golpeia o chão ao redor e protege você por 5 s (40% menos dano).',
  model:'pMush',glow:'#ffd27a',base:'#5a4a2a',speed:5.6,bite:28,biteCd:1.2,reach:1.5},
 frostling:{name:'Filhote da Geada',role:'EXPLOSÃO EM ÁREA',command:'Sopro glacial',
  desc:'Filhote de penas geladas que ataca de longe e deixa os alvos lentos. Q: dispara gelo que explode no primeiro alvo.',
  model:'pBirb',glow:'#a8f0ff',base:'#3a5a6a',speed:6.6,bite:14,biteCd:1.1,reach:1.2,shot:{dmg:14,range:7.5,speed:17}},
};
export const isPet=(v:unknown):v is PetId=>typeof v==='string'&&v in PETS;
