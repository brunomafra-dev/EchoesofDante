# Material de chão — origem e preparação

Um único asset original, produzido offline pela ferramenta integrada `imagegen`.
Não usa imagem externa ou cópia de outro jogo. A saída foi um PNG opaco RGB de
1254×1254; o preparo offline com Pillow reduziu para **512×512**, sem alteração
das pinturas existentes. O PNG final tem **525.542 bytes** (~513 KiB).

Arquivo: `public/assets/visual/environment/cavern-soil.png`.
Repetir a preparação, com o original disponível:

```powershell
python scripts/prepare-cavern-soil.py caminho/do/original.png
```

## Prompt utilizado

Create one original seamless repeating terrain material texture for Echoes of Dante, a stylized painted 2D top-down sci-fi action RPG. This is ONLY A FLAT WALKABLE CAVERN GROUND MATERIAL, viewed vertically from above, not a scene and not a rock prop. Entire square filled edge to edge with continuous worn compact earth, fine shale dust, subtle scuffs, tiny flush buried pebbles and a few soft irregular sediment patches. Low contrast, matte, restrained muted warm gray green soil. Overall dark medium value around RGB 62 69 61. Small warm brown mineral dust hints, very subdued green organic traces. Recognizable earthy mineral floor rather than wallpaper of stone slabs. Details sparse and irregular, most areas restful readable ground for a character. Soft diffuse light, no directional cast shadows, no perspective or horizon. Seamless/tileable on all four edges, balanced brightness throughout. Painted game asset materiality, gently brushed natural surface, coherent grain. NO large rocks, boulders, slabs, crystals, roots, portals, architecture, outlines, grid, checkerboard, polygons, triangles, cracks forming big islands, alpha borders, gradients to black, decals, labels or lettering. Full opaque square texture, 1024 by 1024 if possible; will be prepared offline to 512 by 512. Do not copy any game. This should feel like foot-worn substrate within an organic alien cavern, quiet enough that the warrior and creatures dominate.
