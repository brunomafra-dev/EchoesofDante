# Frontier 0.1.184 — offline visual preparation

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
