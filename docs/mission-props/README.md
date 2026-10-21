# Amostras, materiais e capa — 0.1.129

Manutenção visual solicitada após a fase 5. Não avança a próxima etapa do plano. **QA técnico não equivale à aprovação visual humana.**

## Diagnóstico e correção

`ColonizationArea` usava `camp-supplies` para todos os locais de investigação, incluindo solo e água. `ResonanceValley` também usava a caixa para indicar a trilha. `ResourceDrops` usava três cristais genéricos com moeda incorporada, apesar de conceder materiais diferentes.

| Objeto real | Representação nova | Tamanho no mundo |
| --- | --- | --- |
| Umidade nas raízes | Pequena poça entre raízes e musgo | 100×72 |
| Atividade biológica | Planta alienígena com vagens | 80×75 |
| Nascente mineral | Água saindo de rocha com musgo | 112×98 |
| Acessos da rota / trilha do vale | Estaca de levantamento com bandeirola | 45×63 |
| Solo dos terraços | Terra exposta, raízes e pequena sondagem | 78×61 |
| Local do abrigo | Demarcação de levantamento, estacas e cordão | 108×82 |
| Liga da floresta | Retalhos de liga metálica | 36×36 |
| Carapaça âmbar | Lascas curvas de carapaça orgânica | 36×36 |
| Núcleo boreal | Núcleo arredondado em carapaça azul | 36×36 |

`MissionProps.ts` centraliza os assets utilizados na campanha e no laboratório. Caixa de suprimentos continua apenas onde representa suprimentos no acampamento. Miniaturas dos equipamentos não foram substituídas. Análises continuam sendo leituras locais, sem adicionar inventário de amostras.

Posições, raios de interação/coleta, colisores, quantidade/frequência de drops, receitas, créditos, missões, saves e protocolo 14 preservados. Um drop continua concedendo seu material **e** créditos; a moeda desenhada foi retirada do sprite, sem retirar créditos da recompensa. Host e convidados usam a mesma correspondência visual.

## Produção dos assets

Ferramenta integrada `image_gen`, geração original offline. [Prompts](prompts.md), [fontes](source), [dimensões/tamanhos e hashes](assets.json). Uma prancha de nove objetos e uma capa; sem geração ou desenho de arte por frame.

`scripts/prepare-mission-props.py` recorta a prancha pelas divisões medidas, ajusta escala com proporção preservada e exporta nove PNGs transparentes de 224×224. O primeiro corte automático incluía a ponta de uma estaca na célula da água; divisão manual corrigida e exportação reinspecionada. Sem retoque criativo em Python.

Nove texturas somam aproximadamente 1,72 MiB RGBA; reutilizadas entre áreas, sem tweens, partículas ou listeners adicionais em runtime. A galeria do laboratório tem seis objetos e legendas fixas; quarenta reposições reutilizam os mesmos três drops. Os inimigos são removidos apenas nessa galeria comparativa; a campanha preserva seus encontros.

## Compartilhamento

`index.html` contém os metadados no HTML inicial, sem depender de JavaScript: título, descrição em português, canonical, Open Graph e cartão de imagem grande. Configuração baseada no [protocolo oficial Open Graph](https://ogp.me/).

Imagem pública: `/assets/share/dante-expedition-v1.jpg`, **1200×630**, 307.280 bytes. Equipe baseada no quadro aprovado `pioneer-team-v2.png`; capa ilustrada promocional. O JPEG não é carregado como textura do jogo. URLs absolutas HTTPS, MIME, dimensões e descrição acessível. Convites com `?sala=…` recebem a mesma capa sem expor código ou nome no metadata. Não foi feita alteração no conteúdo do convite ou nas conexões.

Um aplicativo pode manter a prévia de um link antigo em cache. A entrega verifica o HTML e a imagem publicados; a renderização final do cartão pertence ao aplicativo em que o link é enviado.

## Laboratório

[Ver amostras e coletar materiais](https://echosofdante.vercel.app/inventory-playtest.html?props=1&v=0.1.129). Começa em uma galeria temporária na floresta, com seis objetos e os três materiais no chão. Aproxime-se para coletar automaticamente; abra o painel superior para repor. Nenhum save real é modificado.

[Missões nos mapas reais](https://echosofdante.vercel.app/campaign-playtest.html?missions=1&settlement=1&v=0.1.129). O painel prepara as etapas sem repetir bosses, apenas nesse laboratório.

## Validação

Relatórios em [qa](qa). Incluem coleta com os valores originais, miniaturas remotas, filtragem por proprietário, pool de drops, preservação de saves, análises reais, entregas únicas, instalação, viagens, reload, morte/respawn, resoluções habituais, touch emulado e gamepad mock. Nenhum teste emulado deve ser interpretado como teste de aparelho físico.

| Verificação | Resultado |
| --- | --- |
| `npm run typecheck` / `npm run build` | Passaram; aviso já existente de chunk grande do Phaser |
| `qa-mission-props.mjs` | 6 verificações passaram; 0 erros JS/HTTP; 341 objetos e 220 texturas antes/depois de 40 reposições |
| `qa-arrival-missions-browser.mjs` | 10 verificações passaram, incluindo as duas análises da floresta por E, touch e gamepad mock |
| `qa-first-settlement.mjs` | 8 verificações passaram; três relatórios finais, recompensa única, abrigo, reload, respawn e três viagens sem crescimento de objetos/texturas |
| `qa-first-settlement-production.mjs` | **Parcial**, dois Chromes e relay reais: convite, aceite pelo convidado, travessia/análise da nascente e retorno/entrega passaram. Na travessia adicional em direção aos Terraços o anfitrião morreu; o script caminha sem combater. Falha preservada em `qa/compiled-coop/report.json`, sem declarar a travessia completa aprovada |

FPS médios observados em Chrome automatizado: **52,4** na galeria, **50,5** nos Terraços após viagens e **54,1** na regressão inicial. Não declarar 55–60 FPS garantidos a partir dessas medições. As artes são estáticas; esta manutenção não adiciona loops de desenho ou VFX. A avaliação de fluidez no dispositivo do usuário continua necessária.

Revisão visual feita nas capturas da galeria e dos mapas: objetos distinguíveis, sombra/materialidade compatíveis, sem maletas nas análises nem cristal genérico no material. Aprovação final do estilo e da legibilidade no seu celular aguarda playtest.
