import { ECHO_COUNT, FOREST_ECHOES } from '../config/discovery';
import { VALLEY_ENCOUNTERS, VALLEY_ROUTES } from '../config/valley';
import { SIROCCO_ENCOUNTERS } from '../config/sirocco';
import type { BestiarySnapshot } from './Bestiary';
import type { ProgressionSnapshot } from './Progression';
import type { AbilityUpgradeRanks } from '../config/abilityUpgrades';

export const JOURNEY_KEY = 'echoes-of-dante.journey.v1';
export const JOURNEY_FLAGS = ['cavernDepthSeen', 'deepPassageOpen', 'deepAreaSeen', 'deepCavernEntered',
  'deepEndSeen', 'deeperEntered', 'exteriorEntered', 'fragmentSeen', 'approachSeen', 'firstEchoSeen',
  'wardenReached', 'wardenGateOpen', 'wardenDefeated', 'wardenEndingSeen', 'valleyVisited',
  'valleyLandmarkSeen', 'valleyEndSeen', 'valleyCheckpointReached', 'valleyFrontierReached',
  'valleyFrontierSignalSeen', 'valleyFrontierEndSeen', 'aridVisited', 'aridSignalSeen'] as const;
export type JourneyArea = 'forest' | 'cavern' | 'warden' | 'valley' | 'arid';
export type JourneyFlags = Record<typeof JOURNEY_FLAGS[number], boolean>;
export type JourneySnapshot = {
  schema: 1; updatedAt: number; area: JourneyArea; hp: number;
  progression: ProgressionSnapshot; flags: JourneyFlags;
  bestiary: BestiarySnapshot; valleyRoutes: string[]; valleyHabitats: [number, number][]; aridHabitats: [number, number][];
};

const object = (value: unknown): Record<string, unknown> | undefined =>
  value !== null && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : undefined;
const integer = (value: unknown, max: number): value is number => Number.isSafeInteger(value) && (value as number) >= 0 && (value as number) <= max;

// One small, versioned local file. Unknown versions/corrupt files never crash gameplay.
export class LocalJourney {
  status = 'O progresso será salvo neste navegador.';

  load(): JourneySnapshot | undefined {
    try {
      const text = localStorage.getItem(JOURNEY_KEY);
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
        'valleyFrontierReached', 'valleyFrontierSignalSeen', 'valleyFrontierEndSeen', 'aridVisited', 'aridSignalSeen'] as const) flags[key] = false;
      flags.aridVisited &&= flags.valleyFrontierEndSeen;
      flags.aridSignalSeen &&= flags.aridVisited;
      const area: JourneyArea = raw.area === 'arid' && flags.wardenDefeated && flags.valleyFrontierEndSeen && flags.aridVisited ? 'arid'
        : raw.area === 'valley' && flags.wardenDefeated ? 'valley'
        : raw.area === 'warden' && flags.wardenGateOpen ? 'warden'
        : raw.area !== 'forest' && passageOpen ? 'cavern' : 'forest';
      const routes = Array.isArray(raw.valleyRoutes) ? raw.valleyRoutes.filter((id): id is string => typeof id === 'string' && VALLEY_ROUTES.some(r => r.id === id)) : [];
      const habitats: [number, number][] = [];
      if (Array.isArray(raw.valleyHabitats)) for (const entry of raw.valleyHabitats.slice(0, VALLEY_ENCOUNTERS.length)) {
        if (Array.isArray(entry) && VALLEY_ENCOUNTERS.some(h => h.id === entry[0]) && integer(entry[1], 8_640_000_000_000_000)) habitats.push([entry[0], entry[1]]);
      }
      const aridHabitats: [number, number][] = [];
      if (Array.isArray(raw.aridHabitats)) for (const entry of raw.aridHabitats.slice(0, SIROCCO_ENCOUNTERS.length)) {
        if (Array.isArray(entry) && SIROCCO_ENCOUNTERS.some(h => h.id === entry[0]) && integer(entry[1], 8_640_000_000_000_000)) aridHabitats.push([entry[0], entry[1]]);
      }
      this.status = 'Progresso recuperado deste navegador.';
      return { schema: 1, updatedAt: integer(raw.updatedAt, 8_640_000_000_000_000) ? raw.updatedAt : 0, area, hp: raw.hp,
        progression: { xp: p.xp, echoes, sourceLocated: echoes.length === ECHO_COUNT && p.sourceLocated === true,
          passageOpen, rewardedHollows: p.rewardedHollows.filter((id): id is number => integer(id, 1999)).slice(0, 2000),
          rewardedRoutes: Array.isArray(p.rewardedRoutes) ? p.rewardedRoutes.filter((id): id is string =>
            typeof id === 'string' && VALLEY_ROUTES.some(route => route.id === id)) : [],
          abilityUpgrades: object(p.abilityUpgrades) as Partial<AbilityUpgradeRanks> | undefined },
        flags, bestiary: object(raw.bestiary) as BestiarySnapshot ?? {}, valleyRoutes: [...new Set(routes)], valleyHabitats: habitats, aridHabitats };
    } catch {
      this.status = 'Não foi possível ler o progresso local. O jogo continua disponível.';
      return undefined;
    }
  }

  save(snapshot: JourneySnapshot): boolean {
    try {
      localStorage.setItem(JOURNEY_KEY, JSON.stringify(snapshot));
      this.status = 'Progresso salvo neste navegador.';
      return true;
    } catch {
      this.status = 'Não foi possível salvar. O progresso desta sessão continua disponível.';
      return false;
    }
  }

  clear(): boolean {
    try { localStorage.removeItem(JOURNEY_KEY); return true; }
    catch { this.status = 'Não foi possível apagar o registro local.'; return false; }
  }
}
