import { clamp, distance, normalized, type Vec2 } from '../utils/math';
import { WORLD_HEIGHT, WORLD_WIDTH } from '../config/game';
import {constrainGround} from './WalkableGround';

export type Obstacle = { x: number; y: number; radius: number };
export type MovementBounds = { left: number; right: number; top: number; bottom: number; walkable?:readonly Vec2[] };

export function moveWithCollisions(position: Vec2, velocity: Vec2, deltaSeconds: number, radius: number, obstacles: ReadonlyArray<Obstacle>, bounds?: MovementBounds,footY=0): void {
  if(bounds?.walkable){
    // Short swept steps stop dash/knockback from crossing a narrow bank. The
    // footprint follows the actor's feet, not the center of its painted torso.
    const steps=Math.max(1,Math.ceil(Math.hypot(velocity.x,velocity.y)*deltaSeconds/Math.max(4,radius*.5)));
    for(let i=0;i<steps;i++){
      position.x+=velocity.x*deltaSeconds/steps;resolve(position,radius,obstacles);constrainGround(position,radius,bounds.walkable,footY);
      position.y+=velocity.y*deltaSeconds/steps;resolve(position,radius,obstacles);constrainGround(position,radius,bounds.walkable,footY);
    }
    position.x=clamp(position.x,bounds.left+radius,bounds.right-radius);
    position.y=clamp(position.y,bounds.top+radius-footY,bounds.bottom-radius-footY);
    constrainGround(position,radius,bounds.walkable,footY);
    return;
  }
  // Resolve axes separately so the character slides along rocks instead of sticking to them.
  position.x += velocity.x * deltaSeconds;
  resolve(position, radius, obstacles);
  position.y += velocity.y * deltaSeconds;
  resolve(position, radius, obstacles);
  position.x = clamp(position.x, (bounds?.left ?? 56) + radius, (bounds?.right ?? WORLD_WIDTH - 56) - radius);
  position.y = clamp(position.y, (bounds?.top ?? 56) + radius, (bounds?.bottom ?? WORLD_HEIGHT - 56) - radius);
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
