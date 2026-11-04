# Mochila de expedição · 0.1.190 local

O usuário pediu substituir a mochila em caixa e as duas barras no torso por uma mochila com acabamento próprio, aproveitando modelos existentes. Esta revisão cobre somente o equipamento de costas/alças e sua inspeção. Restrição vigente: **sem push/deploy**; aguardar playtest humano antes de avançar.

## Modelo e integração

Base: [Backpack de Quaternius, publicado pelo autor no Poly Pizza](https://poly.pizza/m/2g9Jm7kvIU), identificado como **CC0 1.0**, upload de 03/10/2021. O arquivo do próprio visualizador foi obtido e inspecionado: GLB 99.444 bytes, 1.748 triângulos, quatro materiais, nenhuma textura ou animação. A página/metadata do publicador identifica autor, recurso `0d29cdc2-0baf-4bf7-835f-075b34c70b61` e licença; [registro de licença](../../public/assets/arrival-3d/backpack-190-LICENSE.txt). O download original do Google Drive estava em quota; não foi contornado. O modelo foi obtido da publicação pública do próprio autor no Poly Pizza. Kenney Survival Kit também foi inspecionado, mas não contém uma mochila; não foi incorporado.

Adaptações: origem e orientação corrigidas, altura de 0,50 m, lona/tecido foscos sem metalness, fivelas com metalness contida, paleta de campo compatível com Dante e materiais reunidos por cores de vértice. Bolsos, fivelas e rolo do modelo substituem o bloco liso. Alças próprias de fita fina com bordas costuradas substituem barras e módulo luminoso do peito. A superfície de referência dos dois humanos foi amostrada offline para posicionar as alças; não há ajuste geométrico caro em cada frame.

`Avatar` compartilha o conjunto entre criação, oficina e mundo, preso ao `spine_03`. Formato feminino usa ajuste próprio de alças e pequena redução da mochila. Geometrias/materiais compartilhados via `Identity`, sem novas texturas, luzes ou transparências. O conjunto anterior existe somente para comparação na oficina. O seletor Mochila é independente de Armas: comparar costas não desfaz as empunhaduras/manopla anteriores. NPCs continuam sem esse equipamento de jogador.

| Recurso incorporado | Triângulos | Materiais/chamadas na passagem de cor |
|---|---:|---:|
| Mochila Quaternius adaptada | 1.748 | 2 |
| Alças de um gênero | 1.176 | 1 |
| Conjunto visível por jogador | 2.924 | 3 |

GLB derivado contém mochila e as duas variantes das alças; só uma variante é desenhada por personagem. Tamanho/hash exatos em [backpack-190.json](../../public/assets/arrival-3d/backpack-190.json). Sem dependência de placa dedicada, render offline ou ferramenta paga.

## Reprodução

Arquivo fonte decodificado do visualizador em `.local/backpack190/backpack-source.glb`, SHA256 `315a559dc389f0a3a98395222d56c2db45b4bd505c93db282c7e34011f6e5c0f`. URL exata publicada e modificações no manifesto. Originais/intermediários ficam ignorados; somente derivado necessário e licença entram no projeto.

1. `node scripts/asset-tools/measure-arrival190-harness.mjs`: lê os humanos e mede superfícies na referência de encaixe, sem modificar modelos ou clips.
2. `node scripts/asset-tools/prepare-arrival190-backpack.mjs`: valida o hash fonte e gera o GLB/material/manifesto.
3. `npm run typecheck` e `npm run build`.
4. `node scripts/qa-arrival190.mjs`: suítes sequenciais no preview local 5193; não executar Blender/build/outro QA durante a medição de desempenho.

Armas, manopla, humanos, habilidades/dano, cenários, Hollow, progressão, dados de save e campanha/relay continuam no escopo anterior, sem alterações funcionais.

## Revisar

- [Mochila no compilado local](http://127.0.0.1:5193/arrival-workshop.html?v=0.1.190&subject=warrior&view=backpack).
- [Alças e torso](http://127.0.0.1:5193/arrival-workshop.html?v=0.1.190&subject=warrior&view=torso).
- [Mundo local](http://127.0.0.1:5193/arrival-3d.html?v=0.1.190).

Oficina não lê/escreve personagens ou saves reais. Mundo conserva sessão temporária isolada, sem pré-requisitos ou bosses vencidos simulados.

## QA técnico concluído

Typecheck e build passaram (308 módulos). Cinco relatórios no compilado local passaram: [mochila](qa/0.1.190/backpack/report.json), [quatro classes](qa/0.1.190/classes/report.json), [touch/gamepad e recuperação](qa/0.1.190/input/report.json), [oficina/NPCs](qa/0.1.190/workshop/report.json) e [desempenho](qa/0.1.190/performance/report.json). A mochila foi comparada nos dois corpos, com ataque, corrida, esquiva e salto; 80 amostras e 67 capturas. Seis trocas adicionais mantiveram geometrias 37 → 37 e texturas 33 → 33. [Inspeção visual e limites](qa/0.1.190/OBSERVATIONS.md).

[Verificação do compilado](qa/0.1.190/build-verification.json): 86 assets da campanha idênticos, humanos/armas/manopla íntegros, fonte e relay da campanha sem alterações. Os 59 hashes do compilado são um inventário local; não indicam publicação.

No Celeron N5105/Intel UHD, Chrome ANGLE D3D11, 1440×900/DPR1, três amostras de dois segundos após oito segundos de aquecimento: base com cinco NPCs teve 40,0–40,2 FPS; floresta com oito aranhas animadas, 56,6–57,0 FPS. Personagem Guerreiro parado, execuções sequenciais sem outro QA/build concorrente. Não representa combate contínuo de todas as classes, aparelho físico ou garantia de 60 FPS.

Números de encaixe/limites não comprovam sozinhos qualidade visual ou ausência de contato em todas as animações. Aprovação estética humana e teste em aparelho físico continuam pendentes. Nenhum push/deploy nesta entrega.
