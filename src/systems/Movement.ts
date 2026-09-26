import { clamp, distance, normalized, type Vec2 } from '../utils/math';
import { WORLD_HEIGHT, WORLD_WIDTH } from '../config/game';

export type Obstacle = { x: number; y: number; radius: number };

export function moveWithCollisions(position: Vec2, velocity: Vec2, deltaSeconds: number, radius: number, obstacles: ReadonlyArray<Obstacle>): void {
  // Resolve axes separately so the character slides along rocks instead of sticking to them.
  position.x += velocity.x * deltaSeconds;
  resolve(position, radius, obstacles);
  position.y += velocity.y * deltaSeconds;
  resolve(position, radius, obstacles);
  position.x = clamp(position.x, 56 + radius, WORLD_WIDTH - 56 - radius);
  position.y = clamp(position.y, 56 + radius, WORLD_HEIGHT - 56 - radius);
}

function resolve(position: Vec2, radius: number, obstacles: ReadonlyArray<Obstacle>): void {
  for (const rock of obstacles) {
    const minimum = radius + rock.radius;
    const separation = distance(position, rock);
    if (separation >= minimum) continue;
    const direction = separation > 0 ? normalized(position.x - rock.x, position.y - rock.y) : { x: 1, y: 0 };
    position.x = rock.x + direction.x * minimum;
    position.y = rock.y + direction.y * minimum;
  }
}
