# Frontier 0.1.184 — offline visual preparation

Arrival 0.1.186 adds authored equipment, structures and creature parts in a separate `identity-186.glb`. With Blender 4.5 LTS, run `blender --background --factory-startup --python scripts/asset-tools/author-arrival186.py`, then `node scripts/asset-tools/prepare-arrival186.mjs`. Blender files/intermediates remain under ignored `.local/arrival186/`; only the GLB, manifest and generators are shipped/tracked. Two seeded 256px maps are exported and compressed to WebP, and small NPC wearables/tools are merged with vertex colors. Blender and this authoring generator do not run in the browser; the app loads the prepared models and updates scene/effect state. Human and scenery assets below remain untouched. See [scope and QA](../../docs/frontier-3d/IDENTITY.md).

Arrival 0.1.185 reuses these verified archives and scenery. After the staging below, run `python scripts/asset-tools/stage-arrival185.py`, `node scripts/asset-tools/prepare-arrival185.mjs`, `python scripts/asset-tools/record-arrival185.py` and `node scripts/inspect-arrival-crew.mjs`. Outputs go to the separate `public/assets/arrival-3d/` directory. Both full work-clothing rigs share a skeleton with selectable tagged hairstyles; compatible outfit primitives are merged. Twelve clips include walking and distinct sword, shot and spell actions. Runtime appearance colors do not modify the older trial assets. `node scripts/prepare-arrival-layout.mjs` refreshes the canonical layout snapshot offline, without importing campaign modules into the new entry.

Run from repository root. These are authoring dependencies, separate from the browser app:

```
npm ci --prefix scripts/asset-tools
python scripts/asset-tools/stage-frontier184.py
node scripts/asset-tools/prepare-frontier184.mjs
```

First download the three **free Standard** ZIPs from their official pages in `frontier184-sources.json`, placing them in ignored `.local/visual184/` as `ubc.zip`, `ual.zip`, `outfits.zip`. The staging script verifies their SHA256 before reading them. No premium archive, credentials, automated purchase or account is required. It stages only selected glTF resources, corrects the author's two mistyped normal-map URIs and verifies Poly Haven downloads against frozen MD5 values. The complete source tree is about 100 MB and is never shipped to the browser.

For the canopy bake, start Vite on `127.0.0.1:5185`, then run:

```
node scripts/asset-tools/bake-frontier-tree.mjs
python scripts/asset-tools/record-frontier184.py
node scripts/inspect-frontier-crew.mjs
```

The bake renders the complete original tree into two transparent 768×1024 views, converts them to WebP, and records scale/framing in `.local/visual184/tree-bake.json`. Fixed lighting matches the trial. Runtime uses crossed alpha-tested planes and actual 3D trunks/branches. This is a foliage impostor technique; it has view-angle limitations and is not a neural renderer or a promise of close-range geometric foliage.

Humans keep one complete clothing rig and share the original bone names/inverse binds with the selected head, hair and animation channels. Unused source rigs, mannequin, channels, samplers and accessors are explicitly discarded. Vertex streams are compacted, geometry simplified, animations resampled, maps resized to 512 WebP. Clothing is tinted; skin/eye maps are preserved. The Node inspector strips only material texture references from an in-memory copy to sample the shipped skinning without a DOM; it does not alter the shipped GLB.

Nature geometry is simplified offline. Tree geometry retains the original height/base in scene extras before removing the leaf primitives. The four nearby rocks retain their 0.1.183 detail, while perimeter rocks use a separate reduced GLB. Source archives, intermediate binaries, dependencies and full models remain ignored. Derived files, actual licenses, hashes and scripts are committed.

Code tools: [glTF Transform](https://github.com/donmccurdy/glTF-Transform) (MIT), [meshoptimizer](https://github.com/zeux/meshoptimizer) (MIT), [sharp](https://github.com/lovell/sharp) (Apache-2.0). Their transitive licenses stay in authoring node_modules; none are added to the app bundle. Browser runtime remains Three.js/MIT.


## Flare creatures · 0.1.187

From the project root:

```powershell
python scripts/asset-tools/fetch-arrival187.py
& '<blender-4.5-LTS.exe>' --background --factory-startup --python scripts/asset-tools/import-arrival187.py
node scripts/asset-tools/prepare-arrival187.mjs
```

The downloader pins the upstream commit and verifies SHA256 of every input, including the per-file credits. Antlion (Clint Bellanger) remains CC BY 3.0; earth wyvern (Clint Bellanger, texture Justin Nichol) and its derivative remain CC BY-SA 3.0. See shipped `public/assets/arrival-3d/CREDITS.md` and `creatures-187.json`. Only art is imported: no Flare engine/game source code. Conversion removes stale channels targeting absent ankle bones, makes the legacy armature parent explicit without changing bind pose, bakes antlion procedural color offline without its unavailable stone normal, applies a brown chitin tint/smooth normals, and resizes the original painted earth skin to 512 WebP. Original geometry, rigs, weights and animation keys are retained. Runtime uses complete cloned skeletons, cached shared geometry/materials and AnimationMixer; no limb assembly or baking per frame.


## Integrated combat visuals · 0.1.188 local

See `docs/frontier-3d/COMBAT_VISUALS.md` for scope, licence and actual QA. No push/deploy authorized for this iteration.

Official free sample: https://easyforge.itch.io/giant-monster-spiders-free-sample . Put `giant-monster-spiders-free-sample-sample.zip` in ignored `.local/combat188/`, then run `python scripts/asset-tools/stage-arrival188-spider.py` and `node scripts/asset-tools/prepare-arrival188-spider.mjs`. ZIP and source GLB hashes are pinned; a revised archive needs inspection before updating pins. No account/payment required. Keep originals and derived GLB outside public/Git: the Easy Forge Asset Licence 1.0 permits incorporated game builds and restricts standalone redistribution. `scripts/arrival-hollow-plugin.ts` incorporates the prepared payload in a game module; no GLB download URL. This is packaging, not DRM. Restart Vite after preparing. A checkout without prepared art builds with the previous Hollow and identifies fallback explicitly.

Original equipment: run Blender 4.5 LTS background with `scripts/asset-tools/author-arrival188.py`, then `node scripts/asset-tools/prepare-arrival188-weapons.mjs`. Mesh-only production, closed thickness/end caps, beveled edges, three material groups per instrument, named attachment/emission anchors. `.blend` stays editable in `.local/combat188/Dante-equipment-188.blend`; script sources and own derived weapons are versionable. Geometry helpers are reused from the original authoring prefix; the previous asset generation pass is not executed.

`node scripts/qa-arrival188.mjs` reproduces existing regression plus current visual and asset checks sequentially against preview 5193 (override QA_BASE/QA_ROOT). Do not run browser QAs or Blender/build alongside performance measurements. Models' full source/ZIPs are excluded; rendered game QA images and numerical reports are retained.
