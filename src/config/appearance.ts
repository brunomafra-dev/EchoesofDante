import type { PlayableClass } from './classes';
export type CharacterSex = 'male' | 'female';
export const SEX_NAMES = { male: 'Masculino', female: 'Feminino' } as const;
export function characterSex(classId: PlayableClass, value?: unknown): CharacterSex {
  return value === 'male' || value === 'female' ? value : classId === 'hunter' ? 'female' : 'male';
}
export function warriorBody(sex: CharacterSex, direction: 'front'|'back'|'side'): string {
  return `warrior-${sex}-clothes-${direction}`;
}
export function hunterBody(sex: CharacterSex): string { return `hunter-${sex}-clothes`; }

export type ProtectionStyle = 'none' | 'basic' | 'reinforced';
export const PROTECTION_PARTS = ['helmet','torso','legs','boots','gloves'] as const;
export type ProtectionPart = typeof PROTECTION_PARTS[number];
export type EquipmentLook = Record<ProtectionPart,ProtectionStyle>;
export function equipmentLook(style:ProtectionStyle='none'):EquipmentLook {
  return {helmet:style,torso:style,legs:style,boots:style,gloves:style};
}
