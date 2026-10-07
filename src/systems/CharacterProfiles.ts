export type CharacterClass = 'warrior';
export type CharacterProfile = { id: string; name: string; classId: CharacterClass; createdAt: number };
const KEY = 'echoes-of-dante.characters.v1';
const LEGACY = 'echoes-of-dante.journey.v1';

// Legacy Warrior keeps its original save key. Other characters are isolated.
// Lazy initialization also keeps the visual labs out of the real save registry.
export class CharacterProfiles {
  private initialized = false;
  private characters: CharacterProfile[] = [];
  private selected = 'legacy-warrior';
  private initialize(): void {
    if (this.initialized) return; this.initialized = true;
    try {
      const raw = JSON.parse(localStorage.getItem(KEY) ?? 'null');
      if (raw?.schema === 1 && Array.isArray(raw.characters)) {
        this.characters = raw.characters.filter((p: CharacterProfile) => p && typeof p.id === 'string' &&
          /^[a-zA-Z0-9-]{1,64}$/.test(p.id) && typeof p.name === 'string' && p.name.length <= 24 &&
          p.classId === 'warrior' && Number.isFinite(p.createdAt)).slice(0, 6);
        if (this.characters.some(p => p.id === raw.selected)) this.selected = raw.selected;
      }
    } catch { /* Local play remains available when storage is blocked. */ }
    if (!this.characters.length) {
      this.characters = [{ id: 'legacy-warrior', name: 'Guerreiro', classId: 'warrior', createdAt: Date.now() }];
      this.selected = this.characters[0].id; this.persist();
    }
    if (!this.characters.some(p => p.id === this.selected)) this.selected = this.characters[0].id;
  }
  get list(): readonly CharacterProfile[] { this.initialize(); return this.characters; }
  get active(): CharacterProfile { this.initialize(); return this.characters.find(p => p.id === this.selected)!; }
  keyFor(id: string): string { return id === 'legacy-warrior' ? LEGACY : `${LEGACY}.character.${id}`; }
  get journeyKey(): string { return this.keyFor(this.active.id); }
  select(id: string): boolean {
    this.initialize(); if (!this.characters.some(p => p.id === id)) return false;
    const before = this.selected; this.selected = id;
    if (this.persist()) return true; this.selected = before; return false;
  }
  create(name: string, classId: CharacterClass): CharacterProfile | undefined {
    this.initialize(); const clean = name.trim().replace(/\s+/g, ' ').slice(0, 24);
    if (!clean || this.characters.length >= 6 || classId !== 'warrior') return undefined;
    const profile = { id: crypto.randomUUID?.() ?? `hero-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: clean, classId, createdAt: Date.now() };
    this.characters.push(profile);
    if (this.persist()) return profile; this.characters.pop(); return undefined;
  }
  private persist(): boolean {
    try { localStorage.setItem(KEY, JSON.stringify({ schema: 1, selected: this.selected, characters: this.characters })); return true; }
    catch { return false; }
  }
}
export const characterProfiles = new CharacterProfiles();
