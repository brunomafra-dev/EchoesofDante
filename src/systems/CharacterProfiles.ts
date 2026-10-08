export type CharacterClass = 'warrior' | 'hunter';
export type CharacterProfile = { id: string; name: string; classId: CharacterClass; createdAt: number };
const KEY = 'echoes-of-dante.characters.v1';
const LEGACY = 'echoes-of-dante.journey.v1';
// Boot the scene behind an empty menu without creating a saved character.
const PREVIEW: CharacterProfile = { id: 'unassigned-preview', name: 'Nova expedição', classId: 'warrior', createdAt: 0 };

// Legacy Warrior keeps its original save key. Other characters are isolated.
// Lazy initialization also keeps the visual labs out of the real save registry.
export class CharacterProfiles {
  private initialized = false;
  private characters: CharacterProfile[] = [];
  private selected = 'legacy-warrior';
  private initialize(): void {
    if (this.initialized) return; this.initialized = true;
    let intentionallyEmpty = false;
    try {
      const raw = JSON.parse(localStorage.getItem(KEY) ?? 'null');
      if (raw?.schema === 1 && Array.isArray(raw.characters)) {
        intentionallyEmpty = raw.characters.length === 0;
        this.characters = raw.characters.filter((p: CharacterProfile) => p && typeof p.id === 'string' &&
          /^[a-zA-Z0-9-]{1,64}$/.test(p.id) && typeof p.name === 'string' && p.name.length <= 24 &&
          (p.classId === 'warrior' || p.classId === 'hunter') && Number.isFinite(p.createdAt)).slice(0, 6);
        if (this.characters.some(p => p.id === raw.selected)) this.selected = raw.selected;
      }
    } catch { /* Local play remains available when storage is blocked. */ }
    if (!this.characters.length && !intentionallyEmpty) {
      this.characters = [{ id: 'legacy-warrior', name: 'Guerreiro', classId: 'warrior', createdAt: Date.now() }];
      this.selected = this.characters[0].id; this.persist();
    }
    if (!this.characters.some(p => p.id === this.selected)) this.selected = this.characters[0]?.id ?? '';
  }
  get list(): readonly CharacterProfile[] { this.initialize(); return this.characters; }
  get active(): CharacterProfile { this.initialize(); return this.characters.find(p => p.id === this.selected) ?? PREVIEW; }
  keyFor(id: string): string { return id === 'legacy-warrior' ? LEGACY : `${LEGACY}.character.${id}`; }
  get journeyKey(): string { return this.keyFor(this.active.id); }
  ownsJourney(id: string): boolean {
    this.initialize(); if (!this.characters.some(p => p.id === id)) return false;
    try {
      const saved = JSON.parse(localStorage.getItem(KEY) ?? 'null');
      if (saved?.schema === 1 && Array.isArray(saved.characters)) return saved.characters.some((p: CharacterProfile) => p?.id === id);
    } catch { /* Journey I/O reports storage failures without losing a legacy session. */ }
    // A legacy journey remains readable if registering it fails (e.g. quota).
    // An explicitly empty/deleted registry above always denies stale writes.
    return true;
  }
  select(id: string): boolean {
    this.initialize(); if (!this.characters.some(p => p.id === id)) return false;
    const before = this.selected; this.selected = id;
    if (this.persist()) return true; this.selected = before; return false;
  }
  create(name: string, classId: CharacterClass): CharacterProfile | undefined {
    this.initialize(); const clean = name.trim().replace(/\s+/g, ' ').slice(0, 24);
    if (!clean || this.characters.length >= 6 || (classId !== 'warrior' && classId !== 'hunter')) return undefined;
    const profile = { id: crypto.randomUUID?.() ?? `hero-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: clean, classId, createdAt: Date.now() };
    this.characters.push(profile);
    if (this.persist()) return profile; this.characters.pop(); return undefined;
  }
  remove(id: string): boolean {
    this.initialize(); if (!this.characters.some(p => p.id === id)) return false;
    const before = this.characters, selected = this.selected;
    let previousRegistry: string | null = null, registryWritten = false;
    try {
      previousRegistry = localStorage.getItem(KEY);
      this.characters = before.filter(p => p.id !== id);
      if (selected === id) this.selected = this.characters[0]?.id ?? '';
      if (!this.persist()) throw new Error('Registry unavailable');
      registryWritten = true;
      localStorage.removeItem(this.keyFor(id));
      return true;
    } catch {
      this.characters = before; this.selected = selected;
      if (registryWritten) try {
        if (previousRegistry === null) localStorage.removeItem(KEY); else localStorage.setItem(KEY, previousRegistry);
      } catch { /* Keep the session intact if storage becomes unavailable. */ }
      return false;
    }
  }
  private persist(): boolean {
    try { localStorage.setItem(KEY, JSON.stringify({ schema: 1, selected: this.selected, characters: this.characters })); return true; }
    catch { return false; }
  }
}
export const characterProfiles = new CharacterProfiles();
