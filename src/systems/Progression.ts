import { PROGRESSION } from '../config/progression';
import { ECHO_COUNT } from '../config/discovery';

export type ProgressionSnapshot = { xp: number; echoes: string[]; sourceLocated: boolean; passageOpen: boolean; rewardedHollows: number[] };

// GameScene retains this state across respawns; LocalJourney stores its snapshot.
export class Progression {
  xp = 0;
  level = 1;
  readonly echoes = new Set<string>();
  sourceLocated = false;
  passageOpen = false;
  private rewardedHollows = new Set<number>();

  get maxHp(): number { return PROGRESSION.baseMaxHp + (this.level - 1) * PROGRESSION.maxHpPerLevel; }
  get nextLevelXp(): number | null { return PROGRESSION.levelThresholds[this.level] ?? null; }
  get signalSynchronized(): boolean { return this.echoes.size === ECHO_COUNT; }

  locateSource(): boolean {
    if (!this.signalSynchronized || this.sourceLocated) return false;
    this.sourceLocated = true;
    return true;
  }

  openPassage(): boolean {
    if (!this.sourceLocated || this.passageOpen) return false;
    this.passageOpen = true;
    return true;
  }

  discover(id: string): boolean {
    if (this.echoes.has(id)) return false;
    this.echoes.add(id);
    return this.award(PROGRESSION.echoXp);
  }

  defeatHollow(spawnIndex: number): { awarded: boolean; leveledUp: boolean } {
    if (this.rewardedHollows.has(spawnIndex)) return { awarded: false, leveledUp: false };
    this.rewardedHollows.add(spawnIndex);
    return { awarded: true, leveledUp: this.award(PROGRESSION.hollowXp) };
  }

  defeatValleyResident(): boolean { return this.award(PROGRESSION.hollowXp); }

  snapshot(): ProgressionSnapshot {
    return { xp: this.xp, echoes: [...this.echoes], sourceLocated: this.sourceLocated,
      passageOpen: this.passageOpen, rewardedHollows: [...this.rewardedHollows] };
  }

  restore(value: ProgressionSnapshot): void {
    this.xp = value.xp;
    this.level = 1;
    while (this.level < PROGRESSION.levelThresholds.length && this.xp >= PROGRESSION.levelThresholds[this.level]) this.level++;
    this.echoes.clear();
    value.echoes.forEach(id => this.echoes.add(id));
    this.sourceLocated = this.signalSynchronized && value.sourceLocated;
    this.passageOpen = this.sourceLocated && value.passageOpen;
    this.rewardedHollows = new Set(value.rewardedHollows);
  }

  private award(amount: number): boolean {
    this.xp += amount;
    const before = this.level;
    while (this.level < PROGRESSION.levelThresholds.length && this.xp >= PROGRESSION.levelThresholds[this.level]) this.level++;
    return this.level > before;
  }
}
