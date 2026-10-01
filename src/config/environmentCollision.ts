import { FOREST_ECHOES, SIGNAL_THRESHOLD } from './discovery';
import type { Obstacle } from '../systems/Movement';

// Physical footprints only. Interaction ranges and baked artwork remain separate.
// SOLID: trunks, structural bases, standing minerals and existing large rocks.
// DECORATIVE: canopies, leaves, grass, ground marks, shadows and signal effects.
// OPTIONAL: low roots, small mineral seams and flat fragments remain traversable.
export function treeFootprint(x: number, y: number, size: number): Obstacle {
  const scale = size / 100;
  // SVG trunk contact around (112, 106), relative to its (110, 100) origin.
  return { x: x + 2 * scale, y: y + 6 * scale, radius: 12 * scale };
}

export function totemFootprint(x: number, y: number): Obstacle {
  return { x, y: y + 8, radius: 16 };
}

export const FOREST_STRUCTURE_FOOTPRINTS: ReadonlyArray<Obstacle> = [
  { x: FOREST_ECHOES.trace.x, y: FOREST_ECHOES.trace.y, radius: 26 },
  { x: SIGNAL_THRESHOLD.mechanismX, y: SIGNAL_THRESHOLD.mechanismY, radius: 28 },
  // Side supports remain solid after the central seal opens. Leave its throat free.
  { x: SIGNAL_THRESHOLD.x - 72, y: SIGNAL_THRESHOLD.y + 10, radius: 18 },
  { x: SIGNAL_THRESHOLD.x + 72, y: SIGNAL_THRESHOLD.y + 10, radius: 18 },
];

export const CAVERN_STRUCTURE_FOOTPRINTS: ReadonlyArray<Obstacle> = [
  // Descent framing: compact circles on the exposed stone, away from the spawn.
  { x: 507, y: 891, radius: 24 },
  { x: 706, y: 882, radius: 19 },
  { x: 727, y: 970, radius: 20 },
  // Ancient face: two feet, with the dark opening and corridor left navigable.
  { x: 1403, y: 632, radius: 28 },
  { x: 1584, y: 632, radius: 27 },
  // Standing growth blocks at its base; light, roots and small seams do not.
  { x: 946, y: 1014, radius: 12 },
  { x: 1002, y: 1036, radius: 12 },
  { x: 1055, y: 994, radius: 12 },
  { x: 760, y: 1040, radius: 16 },
  { x: 1370, y: 1060, radius: 18 },
  // Buried structure: complement its existing central footprint at the lower base.
  { x: 2155, y: 721, radius: 43 },
  { x: 2250, y: 708, radius: 40 },
  { x: 1978, y: 691, radius: 12 },
  { x: 2020, y: 871, radius: 12 },
  { x: 2343, y: 784, radius: 12 },
  { x: 2378, y: 623, radius: 12 },
];

// The visible rim shelves protrude into the existing rectangular area limits.
// Use one compact circle per shelf, rather than tracing their polygon edges.
export function cavernShelfFootprints(): Obstacle[] {
  const footprints: Obstacle[] = [];
  for (let i = 0; i < 12; i++) {
    const x = 508 + i * 96;
    footprints.push(
      { x, y: 387 + Math.sin(i * 2.7) * 22 - 5, radius: 22 },
      { x, y: 1103 + Math.cos(i * 1.9) * 16 + 1, radius: 22 },
    );
  }
  return footprints;
}
