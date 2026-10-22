import type { JourneyArea, JourneyFlags } from './LocalJourney';

// Discovery alone is never an unlock. Missions observe these world facts;
// they do not write them or grant access to a later chapter.
export function regionUnlocked(area: JourneyArea, passageOpen: boolean, f: Partial<JourneyFlags>): boolean {
  if (area === 'base' || area === 'forest') return true;
  if (!passageOpen) return false;
  if (area === 'cavern') return true;
  if (!f.firstEchoSeen || !f.wardenGateOpen) return false;
  if (area === 'warden') return true;
  if (!f.wardenDefeated) return false;
  if (area === 'valley') return !!f.valleyVisited;
  if (area === 'springs') return !!f.valleyVisited && !!f.springsVisited;
  if (area === 'terraces') return !!f.valleyVisited && !!f.springsVisited && !!f.terracesVisited;
  if (!f.valleyFrontierEndSeen || !f.aridVisited) return false;
  if (area === 'arid') return true;
  if (!f.aridSignalSeen || !f.dunesVisited) return false;
  if (area === 'dunes') return true;
  if (!f.dunesDepthSeen || !f.soterradoReached) return false;
  if (area === 'sandpit') return true;
  if (!f.soterradoDefeated || !f.soterradoClueSeen || !f.frostVisited) return false;
  if (area === 'frost') return true;
  if (!f.frostSignalSeen || !f.icecaveVisited) return false;
  if (area === 'icecave') return true;
  if (!f.icecaveSignalSeen || !f.icenestVisited) return false;
  if (area === 'icenest') return true;
  if (!f.vesperDefeated || !f.vesperClueSeen || !f.cinderVisited) return false;
  if (area === 'cinder') return true;
  if (!f.cinderSignalSeen || !f.obsidianVisited) return false;
  if (area === 'obsidian') return true;
  return area === 'caldera' && !!f.obsidianSignalSeen && !!f.calderaVisited;
}
