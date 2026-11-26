# Creatures of the new 3D (`public/assets/3d-new/creatures/`)

- `warden.glb`: original Echoes of Dante model, `scripts/asset-tools/3d-new/make_warden.py` (CC0).
- `antlion.glb`, `antlion_hatchling.glb`: **Clint Bellanger**, CC BY 3.0 — https://opengameart.org/content/antlion
- `antlion_armored.glb`: **Justin Jacobs**, **Clint Bellanger** (original model), CC BY-SA 3.0 — https://opengameart.org/content/antlion
- `wyvern.glb`, `wyvern_boss.glb`, `wyvern_air.jpg`, `wyvern_fire.jpg`, `wyvern_water.jpg`: model and animation **Clint Bellanger**,
  painted skins **Justin Nichol**, CC BY-SA 3.0 — https://opengameart.org/content/wyvern-1 , https://opengameart.org/content/wyvern-elemental-skins

Flare sources: https://github.com/flareteam/flare-game-art-src (revision 8830c68b420b631e09a459e5b0bf87c0e068a558, `art_src_hd/characters`).
Changes: conversion Blender → glTF with `scripts/asset-tools/3d-new/make_flare.py` (antlion procedural colours baked to a 512 px atlas,
wyvern skins resized to 1024 px JPEG); meshes, rigs, weights and animations are the authors'. The derived files keep the licenses above
(CC BY-SA 3.0 files remain under CC BY-SA 3.0).

The Hollow spider ("Squinty", **Easyforge**, Giant Monster Spiders Free Sample, Giant Monster Spiders Asset Licence 1.0,
https://easyforge.itch.io/giant-monster-spiders-free-sample) is not in this folder: it is incorporated in the game build only, through the
same reviewed module as the first 3D (`virtual:arrival-hollow`, see `public/assets/arrival-3d/CREDITS.md`).
