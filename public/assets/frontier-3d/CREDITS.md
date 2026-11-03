# Reference assets · Echoes of Dante 3D trial

The camp construction, procedural vegetation, scene layout and code are authored for this repository. Imported character and rock geometry is credited below. Existing campaign art and actors are unchanged.

## Adult crew and natural environment (0.1.184)

Quaternius — actual downloaded Standard archives include CC0-1.0:

- Universal Base Characters: https://quaternius.itch.io/universal-base-characters
- Universal Animation Library: https://quaternius.itch.io/universal-animation-library
- Modular Character Outfits — Fantasy: https://quaternius.itch.io/modular-character-outfits-fantasy
- Included archive licenses are redistributed as `Quaternius-UBC-CC0.txt`, `Quaternius-UAL-CC0.txt`, `Quaternius-Outfits-CC0.txt`. Exact archive hashes and derived files: `visual184.json`.
- Whole work-clothing rig, adult head/hair and compatible in-place animations; offline cleanup, head selection, geometry reduction, texture resizing and field-clothing tint. Eight clips retained. Full figures remain skinned, with runtime field equipment attached to the torso. This does not imply all current Quaternius products use the same license.

Powered by Poly Haven — CC0-1.0:

- Tree Small 02, Rico Cilliers: https://polyhaven.com/a/tree_small_02
- Fern 02, Rob Tuytel (scanning), Rico Cilliers (modeling): https://polyhaven.com/a/fern_02
- Optimized trunk/branch geometry and PBR maps; two crossed canopy impostors baked offline from the complete tree. Fern variants simplified; Rock Moss Set 02 distant geometry reduced. Original MD5/URLs and processing steps in `scripts/asset-tools/`. No API requests in the game.

The habitat pressure hull, panels, surface wear and field equipment are authored for Dante. Surface wear is baked once; static geometry and equipment are grouped by material. The original alien remains a reference actor. The older two human GLBs remain available for historical tests, but this version no longer loads them.

## Photogrammetric rocks (0.1.183)

Powered by Poly Haven. Rock Moss Set 02 by Kless Gyzen, CC0-1.0.

- Creator: https://polyhaven.com/a/rock_moss_set_02
- Asset license: https://polyhaven.com/license
- Discovery API repository: https://github.com/Poly-Haven/Public-API (API code is separate, AGPL; not incorporated).
- `rock-moss.glb` embeds the original model buffers and 1K JPEG maps, without altering them. Four variants are centered/scaled and statically merged at runtime. `scenery.json` records original download hashes and the derived GLB hash. Reproduction: `python scripts/prepare-frontier-rocks.py`.
- No Poly Haven API or external asset request at runtime.

## Animated whole characters

Quaternius — Creative Commons Zero 1.0 (CC0, public-domain dedication).

- Soldier_Male and BlueSoldier_Male: https://quaternius.com/packs/ultimatedanimatedcharacter.html
- Alien: https://poly.pizza/m/HYUUkdugoP
- License: https://creativecommons.org/publicdomain/zero/1.0/
- Frozen public mirror, file sizes, clip lists and SHA-256: `sources.json` in this directory. This is the mirror's distribution (including its fit node), not a claim of byte identity to the author's original archive. Runtime changes: scale and material color/roughness. No limb sprite reconstruction.

## PBR ground and rock

ambientCG — CC0 1.0. https://docs.ambientcg.com/license/

- https://ambientcg.com/view?id=Ground037
- https://ambientcg.com/view?id=Rock035
- Official downloads, original/converted hashes and processing: `materials.json`.

## Fonts

Google Fonts, SIL Open Font License 1.1. Font license texts are included alongside the files.

- Manrope: https://github.com/google/fonts/tree/main/ofl/manrope — `manrope.ttf`, `manrope-OFL.txt`.
- Barlow Condensed Medium: https://github.com/google/fonts/tree/main/ofl/barlowcondensed — `barlow-condensed.ttf`, `barlowcondensed-OFL.txt`.

Three.js is distributed as an npm dependency under MIT; its license remains in the package. The existing Phaser campaign is not converted or replaced by this trial.
