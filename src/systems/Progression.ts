import { PROGRESSION } from '../config/progression';

// Run-local state. GameScene survives scene.restart(), so death retains awards.
export class Progression {
  xp = 0;
  level = 1;
  readonly echoes = new Set<string>();
  private rewardedHollows = new Set<number>();

  get maxHp(): number { return PROGRESSION.baseMaxHp + (this.level - 1) * PROGRESSION.maxHpPerLevel; }
  get nextLevelXp(): number | null { return PROGRESSION.levelThresholds[this.level] ?? null; }

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

  private award(amount: number): boolean {
    this.xp += amount;
    const before = this.level;
    while (this.level < PROGRESSION.levelThresholds.length && this.xp >= PROGRESSION.levelThresholds[this.level]) this.level++;
    return this.level > before;
  }
}
