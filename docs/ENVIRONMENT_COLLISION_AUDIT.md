# Environmental collision audit — Sprint 06.3

## Physical rule

A standing object large enough to obstruct the Warrior has a compact physical
footprint. Canopies, projected height, shadows and low ground detail do not define
the footprint. Visual complexity does not require collision complexity.

Interaction is independent: an interactive object may be solid or traversable.
Investigation continues to use the existing distance checks, without collider
triggers or new input rules.

## Existing architecture

`Movement.moveWithCollisions` resolves circular obstacles separately on each axis
and clamps actors to area bounds. Player and HollowCrawler share the same list.
There are no Phaser physics bodies for these environmental objects. Existing
rocks, the landmark tree, Northern Ruin, sealed fissure, collapse and deep-area
rocks already use this list. No separate physics engine was introduced.

`config/environmentCollision.ts` supplies physical footprints only. Forest tree
footprints derive from each actual image placement and scale; totems derive from
their drawing anchors. Authored structural coordinates correspond to the current
drawings in EchoSite, PassageMechanism, SignalThreshold, CavernArea and DeepSignal.
If those drawings move later, their footprints must move with them.

## Classification

| Area / element | Classification | Physics |
| --- | --- | --- |
| Forest rocks and boundary banks | SOLID | Existing circles retained |
| Ordinary and boundary trees | SOLID trunk / DECORATIVE canopy | One small circle at SVG trunk contact; branches, foliage and spreading roots stay traversable |
| Landmark tree | SOLID | Existing radius-25 circle retained, without an additional trunk collider |
| Four beacons / totems | SOLID | Radius 16 at the visible pedestal, eight units below the drawing anchor |
| Northern Ruin | INTERACTIVE + SOLID | Existing three foundation circles retained |
| Unknown Trace standing fragment | INTERACTIVE + SOLID | Radius 26 on the fragment; investigation remains accessible from outside |
| Mineral Signal seam / Mineral Pulse | INTERACTIVE + traversable / DECORATIVE | No new circle for the low seam or light; large supporting formation keeps its existing rock collision |
| Passage mechanism | INTERACTIVE + SOLID | Radius 28 on the buried stone, inside its investigation radius of 85 |
| Fissure supports | SOLID | Two radius-18 side feet; existing central gate remains controlled by opening animation |
| Grass, ferns, leaves, motes, soil fragments and shadows | DECORATIVE | No collision |
| Cavern walls / rim shelves | SOLID | Existing area bounds plus 24 compact circles for visible protruding shelves |
| Cavern large rocks | SOLID | Existing circles retained |
| Descent framing stone | SOLID | Three simple circles at exposed bases; spawn and descent remain clear |
| Ancient face | SOLID feet / open throat | Two base circles; no circle covering the dark opening or entire raised silhouette |
| Standing mineral growth | SOLID | Three basin bases, two larger side formations and four deep-area mineral bases |
| Smaller mineral seams, floor flecks and roots | OPTIONAL, currently traversable | Preserve navigation; no collision on each root segment or light streak |
| Deep buried structure | SOLID | Existing central circle plus two lower foundation circles |
| Collapse | SOLID until revealed | Existing blocker and bounds change retained; no additional permanent circle across the revealed opening |
| Low old plates / manufactured floor seams | OPTIONAL, currently traversable | Floor surfaces are not walls |

## Navigation and lifecycle

- Spawns, Echo locations, investigation radii, routes and enemy positions are unchanged.
- Trunk collisions are appended **after** Forest layout generation: its deterministic
  rock clearance checks and random sequence produce exactly the same tree placements.
- Cavern footprints are appended **after** artwork creation: its existing obstacle
  drawing loop does not turn new physics footprints into new visual rocks.
- Gates continue to be removed by object identity at the end of their existing
  opening animations. Side supports do not cover the traversal threshold.
- Each area creates its obstacle list once. Respawn rebuilds a fresh area list;
  it does not append to an old list. XP, Echoes and opened passages retain their
  existing session behavior.
- Direct Hollow pursuit is preserved. A creature may still stick against an
  obstacle when pursuing across it; this sprint adds no pathfinding or escape AI.

## Validation matrix

Automated validation must cover physical contact, diagonal movement, sliding,
Dash contact and stationary charge; low detail remains navigable. Route probes
must use an actor radius and the real movement resolver, including gaps between
obstacles. Verify all existing spawns, four patrol loops, three Echo approaches,
the mechanism, fissure, ancient face, revealed corridor and deep signal approach.

Browser regression covers LMB damage, charge damage, Hollow pursuit/attack/death,
XP, respawn and passage states. Exercise keyboard/mouse, standard Gamepad API mock
and touch emulation. Repeat three death/respawn/reload cycles and compare obstacle
counts. Inspect collision overlays against artwork and capture the three desktop
resolutions. These automated checks do not replace a physical-device playtest.

### Results in the audit environment

| Check | Automated result |
| --- | --- |
| Simple footprint contact | 736 combinations of footprint, eight directions and normal/Dash speed; no penetration detected per step at the existing maximum delta of 0.04 s |
| Forest composition | All 115 trunk placements/scales and the initial 370 visual objects match the baseline; no duplicate obstacle entries |
| Spawn and patrol clearance | Existing Forest spawns and four complete patrol loops remain clear |
| Exploration | Action-vector traversal using the real Player update reaches all three Echoes, mechanism, fissure, ancient face and deep approach; no Hollow kills required |
| Combat | LMB: Hollow HP 68 → 34; charge defeats the remaining target and grants 15 XP; Hollow attacks still kill the Player |
| Lifecycle | Three Cavern death/respawn/reload cycles: 50 obstacles and 66 scene objects after each open-area respawn; 198 obstacles and 370 scene objects after each fresh Forest reload |
| Input | Keyboard/mouse, standard Gamepad API mock and multi-pointer Chrome touch emulation pass movement, collision, strike, Dash and hold/release charge checks |
| Viewports | 1280×720, 1366×768, 1920×1080, 844×390, 640×360 and 1024×576 keep the canvas inside the viewport |
| Performance | Same running Forest scene, original list versus new list: mean 58.6 versus 59.8 FPS over five-second samples; full-flow samples approximately 56.6 FPS Forest / 60.1 FPS Cavern |
| Console | No JavaScript errors in the successful gameplay and input runs |

Navigation checks temporarily supply action vectors and invulnerability to isolate
environmental accessibility; combat checks separately exercise real damage/death.
Collider overlays and captures were visually inspected. No physical iPhone or
gamepad playtest was performed by the agent in this sprint. Browser emulation and
capture inspection are not a manual gameplay approval from the user.

## Performance and visual preservation

Footprints are plain circular data reused by the existing resolver. No collider
GameObjects, new listeners, timers, per-frame creation or static redraw are needed.
Forest baking and shared SVG textures, Cavern RenderTextures, camera, zoom and
the Organic Sci-Fi assets remain intact. Benchmark the same Chrome environment
before and after; frame rates measured there do not promise equivalent mobile FPS.

The [World Shape Language](WORLD_SHAPE_LANGUAGE.md) remains a future visual
composition guide. This audit changes physical footprints, not environmental art.
