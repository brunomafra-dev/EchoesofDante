# 3D novo · créditos de assets

**Armas** (`weapons/saber.glb`, `carbine.glb`, `gauntlet.glb`, `conductor.glb`): modelagem original Echoes of Dante, gerada por script no Blender 4.5 LTS (`scripts/asset-tools/3d-new/make_weapons.py`). Sem malhas, texturas ou pacotes de terceiros.

**Personagens (em preparação):** o criador usa o MPFB2 (gerador de humanos para Blender) e pacotes de assets do MakeHuman Community em CC0 (https://static.makehumancommunity.org/assets/assetpacks/index.html). Os humanos gerados não estão versionados; `scripts/asset-tools/3d-new/` reproduz a geração. Nenhum personagem do protótipo 3D anterior é reaproveitado.

## Characters and animations (S1)
- Human base, hair, eyebrows, eyelashes, clothes: MPFB2 / MakeHuman community assets (CC0).
- Animations: Universal Animation Library by Quaternius (CC0), retargeted onto the MPFB `game_engine` rig.

## Nature (Poly Haven, CC0) — `nature/`
Models: dead_quiver_trunk, dead_tree_trunk, dead_tree_trunk_02, tree_stump_01, tree_stump_02, dry_branches_medium_01, dead_quiver_branch_01, rock_07, rock_09, stone_01, namaqualand_boulder_04, rock_moss_set_01, rock_moss_set_02. Texture: burned_ground_01. All from https://polyhaven.com (CC0), downloaded at 1k and decimated for the web with `scripts/asset-tools/3d-new/fetch_polyhaven.py` + `decimate_polyhaven.py`.
