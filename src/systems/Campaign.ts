import { difficultyId, type DifficultyId } from '../config/difficulty';
import type { PlayableClass } from '../config/classes';
import type { CharacterSex } from '../config/appearance';

export type CrewMember = { id: string; name: string; classId: PlayableClass; sex: CharacterSex; keyHash: string };
export type Campaign = { id: string; mode: 'solo' | 'coop'; difficulty: DifficultyId; size: number; hostId: string; memberId: string; memberKey: string; introSeen: boolean; crew: CrewMember[] };
export type CampaignLobby = Pick<Campaign, 'id' | 'difficulty' | 'size' | 'hostId' | 'crew'>;
export type CampaignCreation = { mode: 'solo' | 'coop'; difficulty: DifficultyId; size?: number; joining?: CampaignLobby };
const identifier = (v: unknown): v is string => typeof v === 'string' && /^[a-zA-Z0-9-]{1,64}$/.test(v);
export function validCampaign(raw: unknown, memberId?: string): Campaign | undefined {
  const v = raw as Campaign | undefined;
  if (!v || !identifier(v.id) || !identifier(v.memberId) || memberId && v.memberId !== memberId || !identifier(v.hostId) || !['solo', 'coop'].includes(v.mode) || !/^[a-f0-9]{48}$/.test(v.memberKey)) return;
  const size = v.mode === 'solo' ? 1 : [2, 3, 4].includes(v.size) ? v.size : 2;
  const crew = Array.isArray(v.crew) ? v.crew.filter(m => m && identifier(m.id) && typeof m.name === 'string' && ['warrior', 'hunter', 'astral', 'xenobinder'].includes(m.classId) && /^[a-f0-9]{64}$/.test(m.keyHash)).slice(0, 4).map(m => ({ ...m, sex: m.sex === 'female' ? 'female' as const : 'male' as const })) : [];
  return { id: v.id, mode: v.mode, difficulty: difficultyId(v.difficulty), size, hostId: v.hostId, memberId: v.memberId, memberKey: v.memberKey, introSeen: v.introSeen === true, crew };
}
export function createCampaign(memberId: string, options: CampaignCreation): Campaign {
  const joining = options.joining;
  return { id: joining?.id ?? crypto.randomUUID?.() ?? `campaign-${Date.now()}-${Math.random().toString(36).slice(2,10)}`, mode: options.mode, difficulty: joining?.difficulty ?? options.difficulty, size: options.mode === 'solo' ? 1 : joining?.size ?? options.size ?? 2, hostId: joining?.hostId ?? memberId, memberId, memberKey: [...crypto.getRandomValues(new Uint8Array(24))].map(v => v.toString(16).padStart(2, '0')).join(''), introSeen: false, crew: joining?.crew ?? [] };
}
export async function memberHash(key: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(key));
  return [...new Uint8Array(digest)].map(v => v.toString(16).padStart(2, '0')).join('');
}
