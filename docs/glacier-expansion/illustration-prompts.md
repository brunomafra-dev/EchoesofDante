# Arte original da expedição

Produzida com a ferramenta de geração de imagem disponível na sessão, offline. Fontes em [source-art/](source-art/). Nenhuma imagem externa, personagem ou asset de Tibia foi utilizado; inspiração restrita à ideia geral de criatura dracônica glacial. Direção D / Organic Sci-Fi R3 preservada.

## Vésper — briefing enviado

Original painted game creature sprite sheet for Echoes of Dante, Organic Sci-Fi. Ancient alien frost dragon, compact quadruped, folded wing membranes, long heavy tail, asymmetric head, ribbed ice carapace, dark teal organic tissue, chalk blue mineral plates, localized violet signal slits and amber inclusions. Neither robot, humanoid, knight, nor enlarged Hollow. Strong organic silhouette, material volume, selective painted detail, readable elevated three-quarter game view. Transparent background, no text, no scenery. Eight equal cells in a four-column/two-row sheet, facing right, consistent scale and baseline: idle, walk support A, walk support B, warning posture, tail sweep, forward rush, braced breath/wing posture, collapsed death. Feet grounded; no triangular low-poly facets, no dominant geometric mosaics, no copied game designs.

## Casco Glacial — briefing enviado

Original alien frost creature for the same painted game world. Squat six-legged crustacean, ivory fossil/mineral shell, dark teal living tissue, shovel-like forelimbs, compact asymmetry and a distinct wide warning sweep. Readable grounded anatomy, weight, materiality and contact. Elevated three-quarter view, right facing, transparent background, no text/scenery. Eight equal cells in a four-column/two-row sheet: idle, alternating walking supports, warning, sweep, movement, brace, death. Consistent proportions and feet baseline. Not a robot or rocks with eyes; avoid low-poly triangles and copied monster designs.

## Terreno — briefing enviado

Original top-down game ground illustration, no horizon or camera perspective, Organic Sci-Fi ancient glacial cavern floor. Dark blue-grey mineral stone interwoven with milky old ice, teal cracks, subtle localized violet and amber traces. Continuous connected masses, quiet navigable negative space, mineral material, controlled value variation, no walls, structures, creatures, text, hard tile borders, or triangular polygon mosaic. Painted volume and gentle contact-friendly sediment; ground only.

## Preparação reproduzível

```powershell
python scripts/prepare-glacier-assets.py
```

Pillow/NumPy preparam as imagens existentes, sem chamar geração: recortam as oito células, isolam o maior componente pintado para excluir fragmentos de poses vizinhas e calculam o conteúdo com alpha acima de 20 para excluir padding quase invisível. Bordas recebem margem antialias; escala comum e apoio em y=244. Exportam atlas PNG 1024×512 com frames 256×256. Piso é reduzido para WebP 1536×1024. [Metadados](assets.json).

Phaser preloads dois spritesheets e uma Image; sprites trocam frame por distância/estado. Não há geração procedural de arte em runtime. Floor e composição raster usam o bake existente. Fontes são de desenvolvimento, não carregadas na build web.

Música: `python scripts/compose-region-scores.py icecave vesper`. Arranjos autorais e síntese do pipeline local; MP3 exportado offline, AudioManager existente faz playback/loop. Nenhum sample de procedência desconhecida.
