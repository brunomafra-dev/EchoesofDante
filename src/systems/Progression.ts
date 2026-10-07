import { PROGRESSION } from '../config/progression';
import { ECHO_COUNT } from '../config/discovery';
import { VALLEY_ROUTES } from '../config/valley';
import { SIROCCO_ROUTES } from '../config/sirocco';
import { DUNES_ROUTES } from '../config/dunes';
import { ABILITY_UPGRADE_MILESTONES, ABILITY_UPGRADES, type AbilityUpgradeId, type AbilityUpgradeRanks } from '../config/abilityUpgrades';

export type ProgressionSnapshot = { xp: number; echoes: string[]; sourceLocated: boolean; passageOpen: boolean;
  rewardedHollows: number[]; rewardedRoutes: string[]; abilityUpgrades?: Partial<AbilityUpgradeRanks> };

const UPGRADE_IDS = Object.keys(ABILITY_UPGRADES) as AbilityUpgradeId[];

// GameScene retains this state across respawns; LocalJourney stores its snapshot.
export class Progression {
  xp = 0;
  level = 1;
  readonly echoes = new Set<string>();
  sourceLocated = false;
  passageOpen = false;
  private rewardedHollows = new Set<number>();
  readonly rewardedRoutes = new Set<string>();
  private readonly ranks: AbilityUpgradeRanks = {
    saberArc: 0, saberReach: 0, dashCooldown: 0, dashDuration: 0, chargeWidth: 0, chargePower: 0,
  };

  get maxHp(): number {
    const legacyLevels = Math.min(this.level - 1, PROGRESSION.legacyHpThroughLevel - 1);
    const laterLevels = Math.max(0, this.level - PROGRESSION.legacyHpThroughLevel);
    return PROGRESSION.baseMaxHp + legacyLevels * PROGRESSION.maxHpPerLevel + laterLevels * PROGRESSION.laterMaxHpPerLevel;
  }
  get nextLevelXp(): number | null { return PROGRESSION.levelThresholds[this.level] ?? null; }
  get nextLevelHpGain(): number { return this.level < PROGRESSION.legacyHpThroughLevel ? PROGRESSION.maxHpPerLevel : PROGRESSION.laterMaxHpPerLevel; }
  get upgradePointsEarned(): number { return ABILITY_UPGRADE_MILESTONES.filter(milestone => this.level >= milestone).length; }
  get upgradePointsSpent(): number { return UPGRADE_IDS.reduce((total, id) => total + this.ranks[id], 0); }
  get upgradePointsAvailable(): number { return Math.max(0, this.upgradePointsEarned - this.upgradePointsSpent); }
  get abilityUpgradeRanks(): Readonly<AbilityUpgradeRanks> { return this.ranks; }
  get signalSynchronized(): boolean { return this.echoes.size === ECHO_COUNT; }

  upgradeRank(id: AbilityUpgradeId): number { return this.ranks[id]; }

  investUpgrade(id: AbilityUpgradeId): boolean {
    if (this.upgradePointsAvailable <= 0 || this.ranks[id] >= ABILITY_UPGRADES[id].maxRank) return false;
    this.ranks[id]++;
    return true;
  }

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

  defeatRenewableResident(): boolean { return this.award(PROGRESSION.hollowXp); }

  discoverValleyRoute(id: string): { awarded: boolean; leveledUp: boolean } {
    if (this.rewardedRoutes.has(id) || !VALLEY_ROUTES.some(route => route.id === id)) return { awarded: false, leveledUp: false };
    this.rewardedRoutes.add(id);
    return { awarded: true, leveledUp: this.award(PROGRESSION.valleyRouteXp) };
  }

  discoverSiroccoRoute(id: string): { awarded: boolean; leveledUp: boolean } {
    if (this.rewardedRoutes.has(id) || !(SIROCCO_ROUTES.some(route => route.id === id) || DUNES_ROUTES.some(route => route.id === id))) return { awarded: false, leveledUp: false };
    this.rewardedRoutes.add(id);
    return { awarded: true, leveledUp: this.award(PROGRESSION.valleyRouteXp) };
  }

  snapshot(): ProgressionSnapshot {
    return { xp: this.xp, echoes: [...this.echoes], sourceLocated: this.sourceLocated,
      passageOpen: this.passageOpen, rewardedHollows: [...this.rewardedHollows], rewardedRoutes: [...this.rewardedRoutes],
      abilityUpgrades: { ...this.ranks } };
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
    this.rewardedRoutes.clear(); value.rewardedRoutes.forEach(id => this.rewardedRoutes.add(id));
    for (const id of UPGRADE_IDS) {
      const rank = value.abilityUpgrades?.[id];
      this.ranks[id] = Number.isSafeInteger(rank) ? Math.max(0, Math.min(ABILITY_UPGRADES[id].maxRank, rank!)) : 0;
    }
    // Ignore malformed or pre-milestone ranks rather than granting upgrades for free.
    let excess = Math.max(0, this.upgradePointsSpent - this.upgradePointsEarned);
    for (const id of [...UPGRADE_IDS].reverse()) {
      while (excess > 0 && this.ranks[id] > 0) { this.ranks[id]--; excess--; }
    }
  }

  private award(amount: number): boolean {
    this.xp += amount;
    const before = this.level;
    while (this.level < PROGRESSION.levelThresholds.length && this.xp >= PROGRESSION.levelThresholds[this.level]) this.level++;
    return this.level > before;
  }
}
