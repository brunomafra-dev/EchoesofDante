import type {PlayableClass} from './classes';
import supported from './visual-presets.json';

// Visual identity is independent of the profession. Only complete, authored
// pose families may be used; missing pairs must never substitute another body.
export function visualPreset(profession:PlayableClass,value?:unknown):PlayableClass {
 return typeof value==='string'&&Object.hasOwn(supported,value)?value as PlayableClass:profession;
}
export function supportsVisual(profession:PlayableClass,preset:PlayableClass):boolean {
 return (supported[profession] as readonly string[]).includes(preset);
}
export const PRESET_NAMES={
 male:{warrior:'Pioneiro',hunter:'Batedor',astral:'Erudito',xenobinder:'Vinculado'},
 female:{warrior:'Pioneira',hunter:'Batedora',astral:'Erudita',xenobinder:'Vinculada'},
} as const;
