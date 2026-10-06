# Expansão 04 — Bacia do Siroco

## Objetivo

Dar uma conclusão clara à travessia da Escarpa e abrir uma região jogável diferente por meio de um portal. A escarpa é a missão de saída; a Bacia do Siroco é a primeira expedição em outro bioma de Dante.

## Fluxo

1. Depois da resposta do sinal na Escarpa, caminhe até a fissura a leste.
2. A área registra **MISSÃO CONCLUÍDA** e abre o portal para a Bacia do Siroco.
3. Aproxime-se e use **E / A / INVESTIGAR** para atravessar.
4. Explore a bacia árida, encontre seus habitantes e investigue o relé ancestral.
5. O portal a oeste permite retornar à Escarpa a qualquer momento.

A passagem não depende de derrotar criaturas. O relé marca a expedição no progresso local. A descoberta e a entrada na região são salvas no navegador.

## Região

A Bacia do Siroco é uma área separada de 3000 × 1500 unidades, conectada por transição de cena. A paleta de Dante continua, com solo ocre, cristais minerais quentes e sinais violetas. O mapa usa uma imagem contínua de terreno e três faixas estáticas baked para formações, sedimento, raízes e bases de rocha. Colisores simples seguem os obstáculos visíveis.

## Habitantes

- **Rasga-areia:** criatura de aproximação rápida, que baixa o corpo e salta em uma linha anunciada.
- **Cuspidor vítreo:** criatura mineralizada que recua, fixa a direção durante o preparo e dispara um projétil âmbar.

Os dois usam o contrato atual de inimigos, HP, dano, reação, bestiário e XP. Os seis habitantes têm IDs estáveis; uma derrota não concede XP repetido depois de recarregar a região. As criaturas não bloqueiam a saída nem o relé.

## Progressão

XP, nível, vida máxima, Ecos e marcos continuam no sistema existente. Os níveis ainda aumentam a vida máxima; não há uma árvore de habilidades neste incremento. Uma evolução de habilidades merece um próximo marco próprio, com escolhas e efeitos legíveis, em vez de aumentos ocultos de números.

## Assets e execução

Arte original gerada para este projeto e processada offline por [`prepare-sirocco-assets.py`](../../scripts/prepare-sirocco-assets.py). O jogo carrega somente texturas prontas. O relatório de dimensões e hashes está em [`asset-measurements.json`](asset-measurements.json); os originais estão em [`source-art/`](source-art/). Não há geração durante o jogo.

O portal usa o asset ancestral já existente, em escala reduzida e em uma camada atrás do personagem, para que a travessia não esconda o jogador. A composição ambiental estática é criada uma vez na entrada da área.

## Validação

[`qa-sirocco-expansion.mjs`](../../scripts/qa-sirocco-expansion.mjs) exercita conclusão da missão, abertura e travessia do portal, inimigos, ganho de XP e nível, relé, recarga, persistência, respawn, retorno e Gamepad API mock. Capturas automatizadas e medições ficam em [`qa/`](qa/).

Validação headless: zero erros de JavaScript/rede; fluxo de missão, portal, região, relé, XP/nível, reload e respawn passaram. Na medição mais recente, a Bacia ficou em média a **60,3 FPS** (mínimo 60,2), com três RenderTextures estáticas, dois tweens reutilizados e 79 objetos após os dois alvos de QA serem derrotados. O teste de regressão do Vale marcou média de **57,4 FPS** (mínimo 56,0), com 153 objetos e quatro RenderTextures. Foram verificadas as viewports 1280×720, 1366×768, 1920×1080 e 844×390; entrada por teclado, mock de Gamepad API e botão contextual touch **ENTRAR** passaram. A regressão touch existente também passou. Nenhum telefone ou gamepad físico foi usado nesta expansão.

O teste usa posicionamento de desenvolvimento para encurtar a jornada anterior; isso não substitui a avaliação humana do caminho até a Escarpa, da escala do novo bioma e da leitura dos dois habitantes em combate. Nenhum teste físico de telefone ou gamepad foi feito nesta expansão.

## Próximo passo

Após playtest, expandir a geografia de Dante com outra região de identidade forte (por exemplo, uma zona fria) e planejar a evolução de habilidades como progressão explícita. A Bacia do Siroco não tenta representar um bioma terrestre real nem explicar a origem de Dante.
