# Costa das Cinzas até o Incandescente — 0.1.145

[Costa das Cinzas](https://echosofdante.vercel.app/world-finish-playtest.html?area=cinder&trails=1&v=0.1.145) · [Garganta de Obsidiana](https://echosofdante.vercel.app/world-finish-playtest.html?area=obsidian&trails=1&spot=1&v=0.1.145) · [Forjas da Caldeira](https://echosofdante.vercel.app/world-finish-playtest.html?area=caldera&trails=1&v=0.1.145) · [Arena do último boss](https://echosofdante.vercel.app/world-finish-playtest.html?area=caldera&trails=1&spot=2&v=0.1.145)

Terceira entrega do [lote consecutivo autorizado](../README.md), após os pushes individuais `d2ae660` (Siroco) e `524708e` (Boreal). As três regiões recebem pinturas próprias na campanha solo e cooperativa, sem substituir os bosses, narrativa ou requisitos de progressão.

| Região | Identidade |
|---|---|
| Costa das Cinzas | Praia escura de cinza fria, poeira depositada pelo vento, bifurcação suave e basalto na saída; lava só nas margens externas. |
| Garganta de Obsidiana | Vidro vulcânico escuro/violeta, prateleiras secas gastas e duas faixas de sedimento que se encontram na passagem. |
| Forjas da Caldeira | Pátio de basalto frio com condutos rasos no piso, transição para rocha escura ampla e arena limpa do Incandescente. |

As cores não são filtros aplicados ao mesmo piso: cada composição foi criada separadamente. Sombras, estruturas ancestrais, minerais, bordas, plantas/poeira, criaturas e boss com arte existente são reutilizados. Nenhum collider novo neste arco, nenhuma poça de lava com aparência segura no caminho, nenhuma alteração de dano/HP, nenhuma onda de monstros para alongar a campanha. Limites, portais, sinais, IDs de análise e recompensas conservados.

## Revisão física da pintura

A primeira geração das Forjas introduziu plataformas altas no pátio, sem correspondência com a física. Foi **rejeitada antes da implementação** e editada com imagegen: essas massas foram substituídas por chão plano. A versão final mantém os condutos no nível do piso e concentra as grandes paredes fora da faixa caminhável. Não foi necessário inventar colliders para bloquear a aproximação.

O seletor do laboratório permite chegar à arena. Nesse caso explícito, apenas o relay anterior é preparado, sem vitória, XP ou loot; o boss permanece vivo. A prévia normal da entrada ainda exige investigar o relay. Uma correção limita o ponto de chegada selecionado à sua própria região, para não substituir o ponto de entrada de outro mapa ao usar um portal. Tudo restrito à fixture visual, sem atalhos na campanha real.

## Arte e orçamento

Imagegen integrado, geração/edição offline em Organic Sci-Fi R3 / referência D. [Prompts completos](prompts.json), incluindo a revisão rejeitada e sua correção. Fontes preservadas em `%USERPROFILE%/.codex/generated_images/01a0df0e-3f54-78d2-bf2c-6f7125fee783/`. Preparação técnica Pillow: RGB, redução Lanczos, WebP qualidade 90. Sem geração neural em runtime ou novo pacote de dependência.

| Arquivo em `public/assets/visual/route-identity/` | Pixels / bytes | Fonte `exec-….png` |
|---|---|---|
| `cinder-v1.webp` | 1619×971 / 692.384 | `1df1268a-f383-43c0-990f-ada144067782` |
| `obsidian-v1.webp` | 1698×926 / 364.976 | `c897ec8c-e3ea-4d73-a727-b3cc65ecea51` |
| `caldera-v1.webp` | 1722×913 / 518.422 | `d23d9434-e642-4d9d-a765-e6fe3374ebfc` |

A versão descartada das Forjas é `42033b98-7105-490e-a727-eee56ee9f6c4`; somente o resultado revisado entra no jogo. Transferência total do arco ~1,50 MiB, até ~18 MiB RGBA após visitar os três mapas. Um quad por região e nenhum RenderTexture adicional; cache e partículas limitadas anteriores preservados.

## Verificações

`QA_ARC=embers`: scripts `qa-route-identity.mjs`, `qa-route-coop.mjs`, `qa-route-public.mjs`. Evidências em [qa](qa/). As fixtures encurtam viagem e acionam ataques para inspeção; não são tempo de campanha ou balanceamento humanos.

- [Três mapas](qa/routes.json): passou, com física anterior idêntica e nove aproximações de análise conectadas; movimento/Dash, quatro resoluções, recriações e quatro avisos do Incandescente. FPS após estabilização: **59,3 Costa**, **60,0 Obsidiana**, **59,4 Caldeira**. Chaves de piso e listeners estáveis; variação limitada de texturas/objetos transitórios retorna à contagem inicial.
- [Entradas e retorno](qa/entries.json): passou com seletor real de trecho, boss vivo sem recibo de vitória e E no portal de retorno usando a entrada correta de Obsidiana. Saves reais protegidos.

- [Dupla cooperativa](qa/coop/coop.json): passou nos três mapas, com nove análises pelo convidado, física e terreno iguais nas duas instâncias e Incandescente vivo na chegada. Relay local real, sem alegar teste de equipe humana de quatro.
- `npm run typecheck` e `npm run build`: passaram. O aviso já existente de tamanho do bundle Phaser permanece.
- Revisão das capturas: cinzas, vidro violeta e arena escura têm leituras diferentes; personagens, nomes e marcas dos ataques continuam visíveis. A avaliação estética final é humana.

- [Build compilado](qa/compiled/public.json): os três links carregam a arte nova, o seletor de trecho funciona, não há globais DEV expostas e o save sentinela permanece intacto. Sem erros de página.

Permanecem as limitações gerais de Safari/iPhone real, equipe humana de quatro e aprovação estética descritas no plano do lote.
