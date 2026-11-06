import catalog from './presentation-catalog.json';
export {catalog as PRESENTATION};
export type CharacterAppearance={skin:keyof typeof catalog.skin;hair:keyof typeof catalog.hair;head:keyof typeof catalog.head};
export type CompanionSpecies=keyof typeof catalog.companions;
export function appearance(value?:unknown):CharacterAppearance{
 const raw=value&&typeof value==='object'?value as Record<string,unknown>:{};
 return Object.fromEntries((['skin','hair','head']as const).map(key=>[key,typeof raw[key]==='string'&&Object.hasOwn(catalog[key],raw[key]as string)?raw[key]:'original']))as CharacterAppearance;
}
export function companion(value?:unknown):CompanionSpecies{return value==='hollow'?'hollow':'symbiont';}
export function hollowBondAvailable(saved:unknown):boolean{
 const raw=saved as {missions?:{completed?:unknown}}|undefined;
 return Array.isArray(raw?.missions?.completed)&&raw.missions.completed.includes('survival');
}
