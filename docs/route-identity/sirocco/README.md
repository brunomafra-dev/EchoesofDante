# Vale até Soterrado — 0.1.143

[Vale](https://echosofdante.vercel.app/world-finish-playtest.html?area=valley&trails=1&v=0.1.143) · [Siroco](https://echosofdante.vercel.app/world-finish-playtest.html?area=arid&trails=1&spot=1&v=0.1.143) · [Dunas](https://echosofdante.vercel.app/world-finish-playtest.html?area=dunes&trails=1&v=0.1.143) · [Soterrado](https://echosofdante.vercel.app/world-finish-playtest.html?area=sandpit&trails=1&v=0.1.143)

Aplicação à campanha e ao coop. [Sequência autorizada, arquitetura e limites](../README.md).

| Região | Identidade |
|---|---|
| Vale da Ressonância | Pradaria na chegada, ilha mineral com caminhos por ambos os lados, calcário e raiz impressa no meio, escarpa quente na saída. |
| Bacia do Siroco | Leito ferruginoso, drenagem seca ramificada, salinas claras e estratos ocres. |
| Dunas Interiores | Crista central divide a passagem, crista clara ao norte e canal de grãos escuros ao sul. |
| Bacia Soterrada | Depressão mais fechada, sedimentos profundos nas bordas, rastros no chão e arena quieta sem obstáculos novos. |

Uma ilha mineral do Vale e três núcleos da crista das Dunas recebem colisão circular no sistema existente. Limites de mapa, portais, sinais e arenas preservados. As análises continuam com IDs, quantidades e recompensas originais. Não surgem novos inimigos, habilidades, ondas ou quotas de combate.

## Assets

Quatro pinturas originais offline com imagegen integrado, sem amostras externas. [Prompts integrais](prompts.json). Fontes preservadas em `%USERPROFILE%/.codex/generated_images/01a0df0e-3f54-78d2-bf2c-6f7125fee783/`. Preparação técnica: RGB, redução Lanczos, WebP qualidade 90; sem repintura por código. Arquivos finais em `public/assets/visual/route-identity/`.

| Arquivo | Pixels / bytes | Fonte `exec-….png` |
|---|---|---|
| `valley-v1.webp` | 2048×748 / 750.092 | `5c52c128-4785-4b67-8809-9543edb833eb` |
| `arid-v1.webp` | 2048×683 / 519.606 | `95a4f3cf-87c0-41dc-8575-0b0ee15d76ed` |
| `dunes-v1.webp` | 1536×1024 / 438.048 | `21983137-a38a-49a8-86cf-23a8b0a71ae2` |
| `sandpit-v1.webp` | 1229×1024 / 430.806 | `b1c32d13-2330-4435-9167-93cb66b2b631` |

Total de transferência ~2,04 MiB; ~22 MiB RGBA se todas as regiões forem visitadas, um novo piso por região, sem RenderTexture adicional. Preload local à região. Caches, VFX naturais, monstros/bosses e sombras existentes reutilizados.

## Evidências

Relatórios e capturas em [qa](qa/): `qa-route-identity.mjs` e `qa-route-coop.mjs`, `QA_ARC=sirocco`. Comparações com 0.1.142, navegação, estabilidade, quatro resoluções e os quatro telegraphs do Soterrado. Aprovação visual humana ainda separada do QA técnico.

Typecheck e build passaram (aviso conhecido do chunk Phaser). [QA dos quatro mapas](qa/routes.json) passou: limites anteriores preservados, somente os quatro núcleos documentados alteram a colisão, nove aproximações de análise acessíveis, movimento/Dash, três recriações após aquecimento e quatro resoluções. FPS observado: Vale **57,5**, Siroco **59,3**, Dunas **58,8**, Soterrado **59,5**. Piso único, sem espelho; não é benchmark de telefone físico.

O QA cooperativo começa no primeiro mapa do arco e percorre **transições adjacentes reais**. Não tenta enviar Floresta diretamente ao Vale, pois o relay corretamente recusa esse salto. Fixtures preparam marcos de viagem; nenhum boss alvo é marcado como derrotado. Comparações do piso/física e análises pelo convidado ficam em `qa/coop/coop.json`. A produção compilada é verificada sem globals DEV em `qa/compiled/public.json`.
