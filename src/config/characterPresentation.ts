import catalog from './presentation-catalog.json';
export {catalog as PRESENTATION};
export type CharacterAppearance={skin:keyof typeof catalog.skin;hair:keyof typeof catalog.hair;head:keyof typeof catalog.head};
export type CompanionSpecies=keyof typeof catalog.companions;
export function appearance(value?:unknown):CharacterAppearance{
 const raw=value&&typeof value==='object'?value as Record<string,unknown>:{};
 return Object.fromEntries((['skin','hair','head']as const).map(key=>[key,typeof raw[key]==='string'&&Object.hasOwn(catalog[key],raw[key]as string)?raw[key]:'original']))as CharacterAppearance;
}
export function companion(value?:unknown):CompanionSpecies{return value==='bulwark'||value==='frostling'?value:'symbiont';}
export function companionAvailable(saved:unknown,species:CompanionSpecies):boolean{
 if(species==='symbiont')return true;
 const raw=saved as{flags?:Record<string,unknown>;progression?:{bossRewards?:unknown}}|undefined;
 const boss=species==='bulwark'?'warden':'vesper';return raw?.flags?.[boss+'Defeated']===true||Array.isArray(raw?.progression?.bossRewards)&&raw.progression.bossRewards.includes(boss);
}
