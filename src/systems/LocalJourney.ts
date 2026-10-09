import { ECHO_COUNT, FOREST_ECHOES } from '../config/discovery';
import { VALLEY_ENCOUNTERS, VALLEY_ROUTES } from '../config/valley';
import { SIROCCO_ENCOUNTERS, SIROCCO_ROUTES } from '../config/sirocco';
import { DUNES_ENCOUNTERS, DUNES_ROUTES } from '../config/dunes';
import { FROST_ENCOUNTERS, FROST_ROUTES } from '../config/frost';
import { GLACIER_ENCOUNTERS, GLACIER_ROUTES } from '../config/glacier';
import type { BestiarySnapshot } from './Bestiary';
import type { ProgressionSnapshot } from './Progression';
import type { AbilityUpgradeRanks } from '../config/abilityUpgrades';
import { characterProfiles } from './CharacterProfiles';

export const JOURNEY_KEY = 'echoes-of-dante.journey.v1';
export const JOURNEY_FLAGS = ['cavernDepthSeen', 'deepPassageOpen', 'deepAreaSeen', 'deepCavernEntered',
  'deepEndSeen', 'deeperEntered', 'exteriorEntered', 'fragmentSeen', 'approachSeen', 'firstEchoSeen',
  'wardenReached', 'wardenGateOpen', 'wardenDefeated', 'wardenEndingSeen', 'valleyVisited',
  'valleyLandmarkSeen', 'valleyEndSeen', 'valleyCheckpointReached', 'valleyFrontierReached',
  'valleyFrontierSignalSeen', 'valleyFrontierEndSeen', 'aridVisited', 'aridSignalSeen',
  'aridFrontierEntered', 'aridFrontierReached', 'dunesVisited', 'dunesRuinsSeen', 'dunesDepthSeen',
  'soterradoReached', 'soterradoDefeated', 'soterradoClueSeen', 'frostVisited', 'frostSignalSeen', 'frostEndSeen', 'icecaveVisited', 'icecaveSignalSeen', 'icenestVisited', 'vesperReached', 'vesperDefeated', 'vesperClueSeen'] as const;
export type JourneyArea = 'forest' | 'cavern' | 'warden' | 'valley' | 'arid' | 'dunes' | 'sandpit' | 'frost' | 'icecave' | 'icenest';
export type JourneyFlags = Record<typeof JOURNEY_FLAGS[number], boolean>;
export type JourneySnapshot = {
  schema: 1; updatedAt: number; area: JourneyArea; hp: number;
  progression: ProgressionSnapshot; flags: JourneyFlags;
  bestiary: BestiarySnapshot; valleyRoutes: string[]; valleyHabitats: [number, number][]; aridHabitats: [number, number][];
  coopReceipts?: { id: string; total: number }[];
};

const object = (value: unknown): Record<string, unknown> | undefined =>
  value !== null && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : undefined;
const integer = (value: unknown, max: number): value is number => Number.isSafeInteger(value) && (value as number) >= 0 && (value as number) <= max;

// One small, versioned local file. Unknown versions/corrupt files never crash gameplay.
export class LocalJourney {
  status = 'O progresso será salvo neste navegador.';
  private key?: string;
  private owner?: string;
  private storageKey(): string {
    if (!this.key) { this.owner = characterProfiles.active.id; this.key = characterProfiles.keyFor(this.owner); }
    return this.key;
  }
  private hasOwner(): boolean {
    this.storageKey(); return characterProfiles.ownsJourney(this.owner!);
  }

  load(): JourneySnapshot | undefined {
    if (!this.hasOwner()) return undefined;
    try {
      const text = localStorage.getItem(this.storageKey());
      if (!text) return undefined;
      const raw = object(JSON.parse(text));
      const p = object(raw?.progression), rawFlags = object(raw?.flags);
      if (!raw || raw.schema !== 1 || !p || !rawFlags || !integer(p.xp, 1_000_000_000) ||
        !Array.isArray(p.echoes) || !Array.isArray(p.rewardedHollows) || !integer(raw.hp, 10_000)) {
        this.status = 'Registro local incompatível. Esta sessão começou na floresta.';
        return undefined;
      }
      const allowedEchoes: string[] = ['northern-ruin', FOREST_ECHOES.mineral.id, FOREST_ECHOES.trace.id];
      const echoes = [...new Set(p.echoes.filter((id): id is string => typeof id === 'string' && allowedEchoes.includes(id)))];
      const passageOpen = echoes.length === ECHO_COUNT && p.sourceLocated === true && p.passageOpen === true;
      const flags = Object.fromEntries(JOURNEY_FLAGS.map(key => [key, passageOpen && rawFlags[key] === true])) as JourneyFlags;
      // Keep access dependencies coherent; no partially restored gate/portal can strand the player.
      if (!flags.deepPassageOpen) for (const key of JOURNEY_FLAGS) if (key !== 'cavernDepthSeen') flags[key] = false;
      flags.wardenGateOpen &&= flags.firstEchoSeen;
      flags.wardenDefeated &&= flags.wardenGateOpen;
      flags.wardenEndingSeen &&= flags.wardenDefeated;
      if (flags.firstEchoSeen) { flags.fragmentSeen = true; flags.exteriorEntered = true; }
      if (!flags.wardenDefeated) for (const key of ['valleyVisited', 'valleyLandmarkSeen', 'valleyEndSeen', 'valleyCheckpointReached',
        'valleyFrontierReached', 'valleyFrontierSignalSeen', 'valleyFrontierEndSeen', 'aridVisited', 'aridSignalSeen',
        'aridFrontierEntered', 'aridFrontierReached', 'dunesVisited', 'dunesRuinsSeen', 'dunesDepthSeen'] as const) flags[key] = false;
      flags.aridVisited &&= flags.valleyFrontierEndSeen;
      flags.aridSignalSeen &&= flags.aridVisited;
      flags.aridFrontierEntered &&= flags.aridSignalSeen;
      flags.aridFrontierReached &&= flags.aridFrontierEntered;
      flags.dunesVisited &&= flags.aridFrontierReached;
      flags.dunesRuinsSeen &&= flags.dunesVisited;
      flags.dunesDepthSeen &&= flags.dunesRuinsSeen;
      flags.soterradoReached &&= flags.dunesDepthSeen;
      flags.soterradoDefeated &&= flags.soterradoReached;
      flags.soterradoClueSeen &&= flags.soterradoDefeated;
      flags.frostVisited &&= flags.soterradoClueSeen;
      flags.frostSignalSeen &&= flags.frostVisited;
      flags.frostEndSeen &&= flags.frostSignalSeen;
      flags.icecaveVisited &&= flags.frostSignalSeen;
      flags.icecaveSignalSeen &&= flags.icecaveVisited;
      flags.icenestVisited &&= flags.icecaveSignalSeen;
      flags.vesperReached &&= flags.icenestVisited;
      flags.vesperDefeated &&= flags.vesperReached;
      flags.vesperClueSeen &&= flags.vesperDefeated;
      const area: JourneyArea = raw.area === 'icenest' && flags.icenestVisited ? 'icenest' : raw.area === 'icecave' && flags.icecaveVisited ? 'icecave' : raw.area === 'frost' && flags.frostVisited ? 'frost' : raw.area === 'sandpit' && flags.soterradoReached ? 'sandpit'
        : raw.area === 'dunes' && flags.dunesVisited ? 'dunes'
        : raw.area === 'arid' && flags.wardenDefeated && flags.valleyFrontierEndSeen && flags.aridVisited ? 'arid'
        : raw.area === 'valley' && flags.wardenDefeated ? 'valley'
        : raw.area === 'warden' && flags.wardenGateOpen ? 'warden'
        : raw.area !== 'forest' && passageOpen ? 'cavern' : 'forest';
      const routes = Array.isArray(raw.valleyRoutes) ? raw.valleyRoutes.filter((id): id is string => typeof id === 'string' && VALLEY_ROUTES.some(r => r.id === id)) : [];
      const habitats: [number, number][] = [];
      if (Array.isArray(raw.valleyHabitats)) for (const entry of raw.valleyHabitats.slice(0, VALLEY_ENCOUNTERS.length)) {
        if (Array.isArray(entry) && VALLEY_ENCOUNTERS.some(h => h.id === entry[0]) && integer(entry[1], 8_640_000_000_000_000)) habitats.push([entry[0], entry[1]]);
      }
      const aridHabitats: [number, number][] = [];
      const desertHabitats = [...SIROCCO_ENCOUNTERS, ...DUNES_ENCOUNTERS, ...FROST_ENCOUNTERS, ...GLACIER_ENCOUNTERS];
      if (Array.isArray(raw.aridHabitats)) for (const entry of raw.aridHabitats.slice(0, desertHabitats.length)) {
        if (Array.isArray(entry) && desertHabitats.some(h => h.id === entry[0]) && integer(entry[1], 8_640_000_000_000_000)) aridHabitats.push([entry[0], entry[1]]);
      }
      this.status = 'Progresso recuperado deste navegador.';
      return { schema: 1, updatedAt: integer(raw.updatedAt, 8_640_000_000_000_000) ? raw.updatedAt : 0, area, hp: raw.hp,
        progression: { xp: p.xp, echoes, sourceLocated: echoes.length === ECHO_COUNT && p.sourceLocated === true,
          passageOpen, rewardedHollows: p.rewardedHollows.filter((id): id is number => integer(id, 1999)).slice(0, 2000),
          rewardedRoutes: Array.isArray(p.rewardedRoutes) ? p.rewardedRoutes.filter((id): id is string =>
            typeof id === 'string' && (VALLEY_ROUTES.some(route => route.id === id) || SIROCCO_ROUTES.some(route => route.id === id) || DUNES_ROUTES.some(route => route.id === id) || FROST_ROUTES.some(route => route.id === id) || GLACIER_ROUTES.some(route => route.id === id))) : [],
          abilityUpgrades: object(p.abilityUpgrades) as Partial<AbilityUpgradeRanks> | undefined,
          bossRewards: [...(flags.soterradoDefeated ? ['soterrado'] : []), ...(flags.vesperDefeated ? ['vesper'] : [])] },
        flags, bestiary: object(raw.bestiary) as BestiarySnapshot ?? {}, valleyRoutes: [...new Set(routes)], valleyHabitats: habitats, aridHabitats,
        coopReceipts: Array.isArray(raw.coopReceipts) ? raw.coopReceipts.filter((entry): entry is {id:string;total:number} =>
          !!entry && typeof entry.id === 'string' && /^[a-f0-9]{32}$/.test(entry.id) && integer(entry.total, 1e9)).slice(-32) : [] };
    } catch {
      this.status = 'Não foi possível ler o progresso local. O jogo continua disponível.';
      return undefined;
    }
  }

  save(snapshot: JourneySnapshot): boolean {
    // pagehide/visibility flush must never recreate a deleted character's save.
    if (!this.hasOwner()) { this.status = 'Não foi possível salvar. Este personagem não está disponível no armazenamento local.'; return false; }
    try {
      // Ordinary solo flushes keep the receipts written while visiting a room.
      if (!snapshot.coopReceipts) snapshot.coopReceipts = this.load()?.coopReceipts ?? [];
      localStorage.setItem(this.storageKey(), JSON.stringify(snapshot));
      this.status = 'Progresso salvo neste navegador.';
      return true;
    } catch {
      this.status = 'Não foi possível salvar. O progresso desta sessão continua disponível.';
      return false;
    }
  }

  creditCoopXp(id: string, total: number): boolean {
    if (!/^[a-f0-9]{32}$/.test(id) || !integer(total, 1e9)) return false;
    const saved = this.load();
    if (!saved) return false;
    const receipts = saved.coopReceipts ?? [];
    const previous = receipts.find(receipt => receipt.id === id)?.total ?? 0;
    if (total <= previous) return true;
    // XP and its receipt are a single storage write. Campaign flags/area/kit stay local.
    saved.progression.xp = Math.min(1e9, saved.progression.xp + total - previous);
    saved.coopReceipts = [...receipts.filter(receipt => receipt.id !== id), { id, total }].slice(-32);
    saved.updatedAt = Date.now();
    return this.save(saved);
  }

  clear(): boolean {
    try { localStorage.removeItem(this.storageKey()); return true; }
    catch { this.status = 'Não foi possível apagar o registro local.'; return false; }
  }
}
