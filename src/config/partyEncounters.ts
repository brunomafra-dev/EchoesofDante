import type { JourneyArea } from '../systems/LocalJourney';
import type {ColonyKind} from './colonization';
import type { SiroccoKind } from './sirocco';
import type { FrostKind } from './frost';
import type { VolcanicKind } from './volcanic';

type Resident = { id:number; kind:'crawler'|'carapace'|'thorn'|'iceCarapace'|ColonyKind|SiroccoKind|FrostKind|VolcanicKind; x:number;y:number;minParty:number };
// Three authored reserve habitats per exploration region: +1/+2/+3 for a
// fixed team of 2/3/4. Boss arenas and safe bases do not receive extra mobs.
const habitats:Partial<Record<JourneyArea,readonly (readonly [Resident['kind'],number,number])[]>> = {
  springs:[['bankGrazer',820,1040],['reedSpitter',1540,1120],['bankGrazer',2120,980]],
  terraces:[['bankGrazer',780,960],['reedSpitter',1260,540],['bankGrazer',1700,1120]],
  forest:[['crawler',920,920],['crawler',1500,550],['crawler',1770,1100]],
  cavern:[['crawler',1110,960],['crawler',2110,930],['crawler',4100,930]],
  valley:[['carapace',1000,870],['thorn',1590,1110],['carapace',3280,920]],
  arid:[['dunePouncer',880,720],['glassSpitter',2040,1030],['dunePouncer',3400,650]],
  dunes:[['dunePouncer',930,1220],['glassSpitter',1830,1630],['dunePouncer',2360,1160]],
  frost:[['frostPouncer',890,1100],['frostSpitter',1630,1270],['frostPouncer',2460,1100]],
  icecave:[['frostPouncer',790,1130],['iceCarapace',1440,900],['frostSpitter',2440,1140]],
  cinder:[['emberHound',890,1020],['fumarole',1490,1110],['emberHound',2400,960]],
  obsidian:[['slagback',900,1000],['emberHound',1530,1100],['fumarole',2450,1100]],
};
export const PARTY_ENCOUNTERS = Object.fromEntries(Object.entries(habitats).map(([area,entries],region) => [area,entries.map(([kind,x,y],i) => ({id:1800+region*3+i,kind,x,y,minParty:i+2}))])) as Partial<Record<JourneyArea,readonly Resident[]>>;
