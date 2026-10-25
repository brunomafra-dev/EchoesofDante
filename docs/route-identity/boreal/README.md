# Fratura Boreal até Vésper — 0.1.144

**Percurso 0.1.147:** após aprovação humana dos terrenos e do Siroco jogável, o arco recebe [seis desvios, encontros e vestígios](../../boreal-journey/README.md). As três pinturas desta página, o enquadramento −300/2300 das Galerias e as dimensões físicas são preservados. Aprovação da arte anterior não substitui o novo playtest de ritmo.

[Fratura Boreal](https://echosofdante.vercel.app/world-finish-playtest.html?area=frost&trails=1&v=0.1.144) · [Galerias do Degelo](https://echosofdante.vercel.app/world-finish-playtest.html?area=icecave&trails=1&spot=1&v=0.1.144) · [Ninho de Vésper](https://echosofdante.vercel.app/world-finish-playtest.html?area=icenest&trails=1&v=0.1.144)

Segundo arco do [lote consecutivo autorizado](../README.md). O primeiro teve commit/push `d2ae660`; esta entrega segue após ele, sem aguardar outra aprovação intermediária, conforme pedido do usuário. Avaliação estética continua humana.

| Região | Composição própria |
|---|---|
| Fratura Boreal | Campo de neve aberto, dobra baixa com caminhos ao redor, veio quente na margem e gelo selado na saída. |
| Galerias do Degelo | Pedra polida úmida, canais escuros nas bordas, sedimentos minerais e uma passagem seca que se abre no salão central. |
| Ninho de Vésper | Vestíbulo fossilizado, placa de gelo antigo, marcas de arrasto e fósseis presos na periferia do gelo. Centro aberto para o boss. |

As três regiões usam pinturas completas distintas; não são versões recoloridas do mesmo chão. Cada uma desenha um único piso, sem espelhamento. Nas Galerias, o enquadramento vertical começa em −300 e ocupa 2300 unidades para posicionar os canais profundos além dos limites caminháveis originais. A câmera e o mapa continuam com as dimensões anteriores; não há novo collider, obstáculo invisível ou mudança dos checkpoints/relays. Os traços internos são superfícies sólidas de pedra, neve baixa e gelo selado.

Portais, sinais, encontros, IDs de análise, recompensas e arena do Vésper preservados. Reutiliza sombras, bordas, estruturas, plantas/poeira de bioma e as criaturas/boss com arte já aprovada. Sem sistema novo, inimigo novo ou aumento artificial de HP.

## Arte offline

Imagegen integrado, três pinturas originais, Organic Sci-Fi R3 / referência D. [Prompts completos](prompts.json). Fontes locais preservadas em `%USERPROFILE%/.codex/generated_images/01a0df0e-3f54-78d2-bf2c-6f7125fee783/`. Preparação técnica com Pillow: RGB, redução Lanczos e WebP qualidade 90; nenhuma repintura por código.

| Arquivo em `public/assets/visual/route-identity/` | Pixels / bytes | Fonte `exec-….png` |
|---|---|---|
| `frost-v1.webp` | 1619×971 / 454.814 | `c2aebefa-2ea3-48e5-95bc-4ebccb655fe5` |
| `icecave-v1.webp` | 1619×971 / 548.648 | `7e979dba-9cb6-4912-abf2-623f5e292dd1` |
| `icenest-v1.webp` | 1434×1024 / 431.780 | `47e3ede6-d4f8-4f64-81d2-1a070cbac935` |

Transferência ~1,37 MiB, até ~17,6 MiB RGBA após visitar as três regiões. Preload por região, nenhum RenderTexture novo e nenhum loop adicional de desenho estático.

## Validação

`QA_ARC=boreal`: `qa-route-identity.mjs`, `qa-route-coop.mjs`, `qa-route-public.mjs`. Evidências em [qa](qa/). Comparam física com 0.1.142, aproximações das seis análises existentes, movimento/Dash, quatro resoluções, recriações, recursos e os quatro avisos do Vésper. O ensaio de boss usa ataques acionados por fixture explícita para revisão visual; não é avaliação humana de balanceamento. Coop usa dois Chrome independentes e E real do convidado, com viagens adjacentes e bosses vivos. Limitações de Safari/dispositivos físicos e avaliação humana permanecem no documento geral.

[QA dos três mapas](qa/routes.json) passou. FPS observado após estabilização: **57,9 Fratura**, **57,8 Galerias**, **57,6 Ninho**. Chaves do piso e listeners estáveis; Galerias oscilaram entre 114–121 objetos e 223–224 texturas transitórias de personagem/ataque, retornando à contagem inicial. Nenhum recurso novo cresce a cada reinício. Capturas dos quatro avisos estão em `qa/icenest-tell-*.jpg`.

Typecheck e build passaram, com o aviso conhecido do tamanho do chunk Phaser. [Dupla cooperativa](qa/coop/coop.json) passou: piso e física iguais nos dois clientes, seis análises com E do convidado, viagens Fratura → Galerias → Ninho e Vésper vivo. O protocolo permanece 15; esta entrega não exige alteração do relay.

[Build compilado local](qa/compiled/public.json) passou sem globals de desenvolvimento: três links carregam a arte correta, o seletor de trecho recarrega a prévia e o save real permanece intacto.
