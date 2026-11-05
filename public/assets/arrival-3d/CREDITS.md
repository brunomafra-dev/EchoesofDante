# Arrival in Dante · 0.1.185

Complete adult male and female character geometry and twelve animations are derived from Quaternius free Standard archives, whose included licenses are CC0-1.0:

- Universal Base Characters: https://quaternius.itch.io/universal-base-characters
- Universal Animation Library: https://quaternius.itch.io/universal-animation-library
- Modular Character Outfits — Fantasy: https://quaternius.itch.io/modular-character-outfits-fantasy

The exact archive hashes, derived model hashes and processing are in `sources.json`. The original license texts are distributed at `../frontier-3d/Quaternius-UBC-CC0.txt`, `../frontier-3d/Quaternius-UAL-CC0.txt` and `../frontier-3d/Quaternius-Outfits-CC0.txt`.

The new entry reuses the credited Poly Haven trees, fern and moss rocks, ambientCG Ground037 textures and baked canopy imagery from `../frontier-3d/`; see that directory's `CREDITS.md`, manifests and licenses. No external request occurs during gameplay.

The landing shuttle, shelters, field equipment, Hollow interpretation, companion, procedural grass, material wear, layout reconstruction and combat effects are authored for this repository. These are initial 3D interpretations of Dante, not models from Diablo, Path of Exile or Warcraft. Whole character rigs remain intact; accessories attach to bones, without reconstructing figures from sprite limbs.

In 0.1.186, `identity-186.glb` contains the new authored weapons, role clothing/tools, shuttle/stations, workbenches, planters, supply cases, mechanism and articulated creature parts. Generated offline with Blender 4.5.15 LTS by `scripts/asset-tools/author-arrival186.py` and optimized by `prepare-arrival186.mjs`. No third-party artwork, PixelFX assets or Godot runtime are included in this new GLB. Existing credited human rigs and nature remain separate and unchanged. Hashes and production metadata: `identity-186.json`.


## Criaturas importadas na 0.1.187 — Flare

- **Antlion / predador Hollow**: modelo e animação de **Clint Bellanger**, [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/). [Original](https://opengameart.org/content/antlion).
- **Earth Wyvern / companheira alada**: modelo e animações de **Clint Bellanger**, textura pintada de **Justin Nichol**, [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/). [Original](https://opengameart.org/content/wyvern-1), [texturas elementais](https://opengameart.org/content/wyvern-elemental-skins).
- Arquivos convertidos do [Flare HD Art Sources, revisão 8830c68](https://github.com/flareteam/flare-game-art-src/tree/8830c68b420b631e09a459e5b0bf87c0e068a558). [Créditos por arquivo](https://github.com/flareteam/flare-game-art-src/blob/8830c68b420b631e09a459e5b0bf87c0e068a558/CREDITS.txt). Atualizações HD de Justin Jacobs também reconhecidas.
- Adaptação Echoes of Dante: conversão Blender → glTF, atlas de cor do antlion com bake offline sem a normal externa, textura earth redimensionada para 512 px/WebP, escala e ligação dos clipes ao combate. A malha, o rig, os pesos e as poses vêm dos artistas acima. Não são extrações de WoW, Diablo ou Path of Exile e não há endosso desses jogos.
- **Os GLB derivados mantêm suas licenças acima**, incluindo CC BY-SA 3.0 na wyvern; licença não substituída pela do código do projeto. Modelos distribuídos completos em `creature-antlion-187.glb` e `creature-wyvern-187.glb`. Manifesto `creatures-187.json`; conversores reproduzíveis em `scripts/asset-tools/` no repositório público do Dante.


## 0.1.188 local — Squinty e instrumentos autorais

**Efeitos de combate 0.1.192:** dez modelos originais Echoes of Dante, autoria no Blender 4.5.15 sem render offline: cápsula/feixe de plasma, lente astral, água/espuma, fogo, mineral, semente de vínculo e corte. Fonte `scripts/asset-tools/author-arrival192.py`, conversão `prepare-arrival192-fx.mjs`; contagens/hash em `combat-fx-192.json`. Nenhum asset ou áudio novo de terceiros. Humanos, equipamentos, natureza e criaturas mantêm as licenças anteriores.

**Mochila de expedição 0.1.190:** [Backpack por Quaternius](https://poly.pizza/m/2g9Jm7kvIU), publicado pelo autor no Poly Pizza em 03/10/2021 como CC0 1.0. Escala/orientação, materiais, paleta e integração adaptados por Echoes of Dante; alças de tecido próprias ajustadas aos dois corpos existentes. [Licença e origem](backpack-190-LICENSE.txt); hashes/contagens/modificações em `backpack-190.json`. Sem novas texturas, áudio ou cópia de franquias.

Revisão local 0.1.189: rifle e manopla articulada originais Echoes of Dante, sem novo asset externo. `gauntlet-189.glb/json`, produzidos por `scripts/asset-tools/author-arrival189.py` e `prepare-arrival189-gauntlet.mjs`; modelagem/exportação no Blender, sem render offline. Sabre e ressonador reaproveitam as malhas 0.1.188 com encaixes corrigidos. Humanos, animações, fauna e respectivas licenças permanecem os mesmos.

**Squinty, Giant Monster Spiders Free Sample**, Easyforge / Easy Forge, copyright 2026. Origem oficial: https://easyforge.itch.io/giant-monster-spiders-free-sample . **Giant Monster Spiders Asset Licence 1.0**, incluída no ZIP. Uso/modificação em jogos permitido; não redistribuir modelo/ZIP/FBX/GLB como asset separado. Incorporado somente no módulo do jogo; fontes/intermediários ignorados fora da pasta pública. Não é CC0 nem arte autoral do Dante.

Modificações: LOD1 3.826 triângulos, sete clipes de gameplay, translação XZ de Body removida, mapas reduzidos para 1024 WebP, emissão 0,25, escala visual 0,44 e ajuste conservador de cor do material preservando mapas. Rig original de 107 joints mantido; sem luz dinâmica ou novas mecânicas de escalada/headshot. Hollow anterior Flare continua com suas licenças próprias acima.

**Quatro instrumentos 0.1.188**: geometria original Echoes of Dante por script Blender, sem modelo externo ou marca/franquia copiada. Fonte editável reproduzível em `scripts/asset-tools/author-arrival188.py`; manifesto de geometria e materiais em `weapons-188.json`. Não houve render offline ou novo arquivo de áudio.
