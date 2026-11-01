# Arte e proveniência · fissura v2

Ferramenta: **imagegen integrada**, modo edição, fundo transparente, em 01/11/2026. Skill utilizada: [SKILL.md](C:/Users/1/.codex/skills/.system/imagegen/SKILL.md). Sem CLI/API externa. O alvo e a referência foram vistos antes da chamada, e o resultado foi inspecionado antes da cópia.

- Alvo: [melt-pocket-v1.png](../../public/assets/boreal-details/melt-pocket-v1.png), mantido.
- Referência de material/câmera: [icecave-v1.webp](../../public/assets/visual/route-identity/icecave-v1.webp), inalterada.
- Saída de projeto: [melt-pocket-v2.png](../../public/assets/boreal-details/melt-pocket-v2.png), PNG com alpha, 1254×1254, 1.988.686 bytes. Não substitui a pintura do mapa.
- Original gerado: `C:\Users\1\.codex\generated_images\01a173c1-3677-75b2-89b6-2f3640ffad61\exec-8922e7ee-4af5-4a00-8e11-8ab4089c8412.png`. Cópia preservada no projeto, sem sobrescrever v1.
- Consumo: [MeltPocket.ts](../../src/visual/MeltPocket.ts) faz bake com suavização em 128² uma vez, compartilha o resultado entre regiões e libera a textura fonte maior. Essa adaptação aproxima a densidade de detalhe do chão. Tamanho/posição física do alvo das Galerias preservados.

Prompt final enviado à ferramenta:

```text
Production sprite edit for existing isometric action RPG Organic Sci-Fi R3. Image 1 is the EDIT TARGET: shallow meltwater analysis pocket, isolated transparent ground decal. Image 2 is STYLE AND MATERIAL REFERENCE ONLY: approved grey-blue flat stone cave floor with thin ice and brown mineral grain. Replace the raised dark ring/island in target with a genuinely SHALLOW narrow depression that looks cut into that same grey-blue floor. Preserve approximate NW-to-SE footprint and visible thin water trickle entering NW and leaving SE. Very low relief, thin fractured frost film hugging ground, small grey blue fractured stone flakes, clear dark teal shallow water with visible bottom. Far less white ice rim, no thick stone wall, no enclosed high rim, no floating island, no black cast shadow or outline, no green vegetation, no text. Uneven softly feathered natural outer perimeter with translucent stone grit, all beyond footprint fully transparent. Muted contrast matching the cave floor, painterly detailed game material, light upper left, camera oblique overhead same as reference; no 3D platform. Keep subject inside frame with generous transparent margin.
```

Os apoios e tubos são desenho nativo de canvas convertido em texturas compartilhadas. Não há novos PNGs de chão completo nem peças separadas de personagens. Capturas antes/depois não recebem correção de cor ou retoque para a auditoria.
