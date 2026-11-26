# 3D novo · créditos de assets

**Armas** (`weapons/saber.glb`, `carbine.glb`, `gauntlet.glb`, `conductor.glb`): modelagem original Echoes of Dante, gerada por script no Blender 4.5 LTS (`scripts/asset-tools/3d-new/make_weapons.py`). Sem malhas, texturas ou pacotes de terceiros.

**Personagens (em preparação):** o criador usa o MPFB2 (gerador de humanos para Blender) e pacotes de assets do MakeHuman Community em CC0 (https://static.makehumancommunity.org/assets/assetpacks/index.html). Os humanos gerados não estão versionados; `scripts/asset-tools/3d-new/` reproduz a geração. Nenhum personagem do protótipo 3D anterior é reaproveitado.

## Characters and animations (S1)
- Human base, hair, eyebrows, eyelashes, clothes: MPFB2 / MakeHuman community assets (CC0).
- Animations: Universal Animation Library by Quaternius (CC0), retargeted onto the MPFB `game_engine` rig.

## Nature (Poly Haven, CC0) — `nature/`
Models: quiver_tree_01, quiver_tree_02, dead_quiver_trunk, dead_tree_trunk, dead_tree_trunk_02, tree_stump_01, tree_stump_02, dry_branches_medium_01, dead_quiver_branch_01, rock_07, rock_09, stone_01, namaqualand_boulder_04, rock_moss_set_01, rock_moss_set_02. Texture: burned_ground_01. All from https://polyhaven.com (CC0), downloaded at 1k and decimated for the web with `scripts/asset-tools/3d-new/fetch_polyhaven.py` + `decimate_polyhaven.py`.
Earth-like regions (2026-11-26): island_tree_02, searsia_lucida, fir_sapling, pine_sapling_small, othonna_cerarioides, shrub_02, shrub_03, shrub_04, fern_02, weed_plant_02, nettle_plant, grass_bermuda_01, grass_medium_02, dandelion_01, root_cluster_01, wild_rooibos_bush, cheiridopsis_succulent, mountainside, rock_face_01, rock_face_02, namaqualand_cliff_01, namaqualand_boulder_02; ground textures sparse_grass, leafy_grass, aerial_grass_rock, mud_forest, forest_ground_04, snow_02, coast_sand_01, rocky_terrain_02, aerial_rocks_02. All CC0 from https://polyhaven.com, fetched with `fetch_earth.py` and reduced with `decimate_earth.py` (foliage thinned leaf by leaf).
