import { SPECIES, type SpeciesId } from '../config/bestiary';

export type BestiaryEntry = { seen: boolean; defeats: number };
export type BestiarySnapshot = Partial<Record<SpeciesId, BestiaryEntry>>;

export class Bestiary {
  private entries: BestiarySnapshot = {};

  see(id: SpeciesId): boolean {
    if (this.entries[id]?.seen) return false;
    this.entries[id] = { seen: true, defeats: this.entries[id]?.defeats ?? 0 };
    return true;
  }

  defeat(id: SpeciesId): void {
    this.see(id);
    this.entries[id]!.defeats++;
  }

  get discovered(): number { return Object.keys(this.entries).length; }
  snapshot(): BestiarySnapshot {
    return Object.fromEntries(Object.entries(this.entries).map(([id, entry]) => [id, { ...entry }]));
  }

  restore(value: unknown): void {
    this.entries = {};
    if (!value || typeof value !== 'object') return;
    const raw = value as Record<string, unknown>;
    for (const id of Object.keys(SPECIES) as SpeciesId[]) {
      const item = raw[id];
      if (!item || typeof item !== 'object') continue;
      const entry = item as Record<string, unknown>;
      if (entry.seen !== true || !Number.isSafeInteger(entry.defeats) || (entry.defeats as number) < 0) continue;
      this.entries[id] = { seen: true, defeats: Math.min(entry.defeats as number, 1_000_000) };
    }
  }
}
