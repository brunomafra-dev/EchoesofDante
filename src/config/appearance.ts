import type { PlayableClass } from './classes';
export type CharacterSex = 'male' | 'female';
export const SEX_NAMES = { male: 'Masculino', female: 'Feminino' } as const;
export function characterSex(classId: PlayableClass, value?: unknown): CharacterSex {
  return value === 'male' || value === 'female' ? value : classId === 'hunter' ? 'female' : 'male';
}
export function warriorBody(sex: CharacterSex, direction: 'front'|'back'|'side'): string {
  return `warrior-${sex === 'female' ? 'female-' : ''}poses-${direction}`;
}
export function hunterBody(sex: CharacterSex): string { return sex === 'male' ? 'star-hunter-male-body' : 'star-hunter-body-v2'; }
