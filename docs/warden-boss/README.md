# The Warden — primeiro boss

Versão: **0.1.38**.

Na expansão 0.1.42, a transmissão após a vitória também libera o portal para o
[Vale da Ressonância](../resonance-valley/). O encontro, fases e valores descritos
aqui permanecem; a antiga mensagem de encerramento passa a indicar a travessia.

O encontro continua o Primeiro Eco e encerra o vertical slice com uma transmissão incompleta. O boss está em **uma nova área depois do limiar do guardião**. A preparação exterior continua sendo um espaço de descoberta e aproximação.

## Conceito e identidade

O Warden é uma entidade antiga de Dante: anatomia baixa e pesada, membros orgânicos, carapaça mineral assimétrica e placas ancestrais incorporadas ao corpo. Desgaste, matéria viva e um núcleo ainda ativo indicam uma presença antiga sem estabelecer sua origem. Compartilha materialidade com os Hollows, mas possui silhueta, escala e comportamento próprios.

A pintura D e Organic Sci-Fi R3 orientam corpo e ambiente. Violeta marca o Signal, âmbar marca matéria mineral e vermelho-alaranjado indica perigo. A energia ciano do Warrior permanece distinguível. A animação usa oito poses raster, passada conforme deslocamento real, inclinação contida e pulso do núcleo; a criatura não gira inteira de cabeça para baixo.

## Caminho e arena

Após registrar o Primeiro Eco, investigar o limiar provoca sua abertura. Caminhar pela passagem leva ao domínio do Warden usando a transição de área existente. A câmera mantém resolução, zoom e acompanhamento atuais.

A arena possui **1200×740 unidades navegáveis**, entrada segura em **(650,760)** e posição inicial do guardião em **(1170,735)**. O percurso de entrada desemboca em uma bacia mineral irregular. Placas antigas, raízes e formações ficam principalmente nas bordas, mantendo o centro legível para ataques, movimento, Dash e Carga Cinética.

Ao avançar até x=850, começa uma apresentação de **2,6 segundos**. O jogador conserva controle, o núcleo desperta e a entrada se fecha. Não há ataque durante essa preparação. Depois da vitória, a passagem permite retornar ao exterior.

## Fases e ataques

Valores centralizados em `src/config/warden.ts`. O Warden possui **900 HP**, raio físico de 62 unidades e arte exibida aproximadamente em 250×250 unidades. Os valores do Warrior permanecem iguais.

| Fase | Condição | Comportamento |
| --- | --- | --- |
| 1 | Acima de 65% de HP | Varredura, impacto próximo e investida apresentam direção, distância e recuperação. |
| 2 | 65% de HP ou menos | Leques do Signal alternam pressão à distância com os padrões próximos. |
| 3 | 30% de HP ou menos | Marcas de solo sequenciais entram na composição; pausas entre decisões diminuem. |

A mudança de fase tem resposta própria de **1,7 segundo**, limpa riscos anteriores e torna o núcleo mais intenso. Não adiciona inimigos. As sequências são autorais e previsíveis, com substituição de varredura por investida quando o alvo está distante.

| Padrão | Leitura e resposta | Aviso | Dano | Recuperação |
| --- | --- | ---: | ---: | ---: |
| Varredura | Setor frontal fixo, postura de preparação; contornar ou sair do arco. | 1000 ms | 16 | 1400 ms |
| Investida | Faixa com direção comprometida; sair lateralmente, sem perseguição durante a execução. | 1150 ms | 20 | 1500 ms |
| Impacto no solo | Área de alcance 185 ao redor da origem; afastar-se antes do impacto. | 1250 ms | 22 | 1500 ms |
| Leque do Signal | Três trajetórias visíveis; mover-se entre projéteis, que respeitam obstáculos. | 1050 ms | 14 | 1300 ms |
| Ecos de pressão | Três marcas fixadas no solo explodem em sequência, com intervalo de 460 ms. | 1250 ms | 24 | 1400 ms |

Forma, posição, postura e tempo complementam a cor dos avisos. O ataque compromete sua direção durante a preparação. As janelas de recuperação de **1,3–1,5 segundo** permitem aproximar, golpear ou preparar a carga máxima existente de 800 ms. A Carga Cinética continua sendo opcional. Dash e a proteção curta após dano mantêm as regras atuais.

Não há summons. O conjunto de cinco padrões fornece variedade sem adicionar inimigos à arena ou reiniciar spawns continuamente.

## IA e integração com o combate

`Warden` implementa o contrato `Enemy` usado pelo golpe e pela onda. A máquina de estados local é explícita: `DORMANT → INTRO → IDLE → TELEGRAPH → EXECUTE → RECOVER`, com transições para `PHASE` e `DEATH`.

O encontro reutiliza `Health`, aplicação de dano, detecção de arco, varredura de projétil e movimento com colisões. Cada ataque do jogador continua atingindo o mesmo alvo no máximo uma vez por ativação. O Warden não recebe impactos durante apresentação ou mudança de fase. Dano não cancela toda preparação do boss; a reação visual e o recuo reduzido comunicam o impacto sem permitir interrupção infinita.

O guardião possui aproximação moderada, distância de parada e limites próprios. Não há pathfinding, behavior tree, novo framework de IA ou segunda arquitetura de combate.

## VFX e áudio

Avisos são desenhados somente nas mudanças de estado. Três projéteis e três marcas de solo são objetos reutilizados. A cena muda postura, alpha, escala e cor; não cria partículas contínuas. Impactos do jogador continuam usando o feedback existente.

`AudioManager` recebe `setArea('warden')` e nove cues curtos: apresentação, varredura, investida, impacto, Signal, ecos, mudança de fase, morte e resolução. Todos usam as vozes finitas de Web Audio existentes. A trilha do guardião tem um pulso grave contido, notas minerais e o intervalo aberto D/A/E relacionado à exploração.

`public/assets/audio/warden-theme.wav` é uma composição original de protótipo, escrita em `scripts/generate-warden-audio.py`: **24 segundos, 80 BPM, mono PCM16 a 22.050 Hz, 1.058.444 bytes**. É gerada offline, sem gravações, downloads, samples externos, IA musical ou geração durante gameplay. A emenda preserva as caudas das notas. O áudio continua opcional e respeita autoplay.

`stopMusic()` conserva a pausa ao receber novos gestos de desbloqueio; uma seleção explícita de área permite retomar. Isso evita que a música do combate reinicie após a resolução por um clique do jogador.

## Morte, recompensa e encerramento

A derrota do Warden produz reação, colapso e perda de energia durante **2,4 segundos**. Os riscos são limpos, o Signal da arena muda e a saída volta a funcionar. A vitória é registrada uma vez durante a sessão.

A recompensa é narrativa, sem XP adicional ou item:

> GUARDIÃO SILENCIADO<br>
> O SINAL NÃO SE APAGOU

Depois:

> TRANSMISSÃO LIBERADA<br>
> FRAGMENTO: RETORNO CONFIRMADO<br>
> DESTINO: ILEGÍVEL

“Retorno confirmado” é um fragmento de transmissão. Não identifica quem retorna, de onde vem, a idade do arquivo ou os responsáveis pela estrutura. A assinatura humana registrada no Primeiro Eco continua sem data e origem. A nova pergunta encerra o trecho atual sem explicar Dante.

## Respawn, retorno e sessão

Morrer durante o encontro retorna à entrada segura da nova área, com HP restaurado. XP, nível, três Ecos, Primeiro Eco e passagem aberta permanecem. O Warden reinicia com HP completo, fase 1 e sem projéteis, marcas ou ataques da tentativa anterior.

Após a vitória, voltar ao domínio não cria outro Warden nem concede outra recompensa. O registro da descoberta pode ser mostrado novamente como orientação, sem repetir a sequência de vitória. Recarregar a página inicia uma nova sessão, conforme o restante do protótipo; não existe save permanente.

## Colisões e performance

Há **19 footprints ambientais** simples, que passam a **20 durante o encontro** com o selo da entrada. Bases de formações e minerais são sólidas; raízes finas, placas embutidas e detalhes de chão permanecem atravessáveis. O corpo do boss também bloqueia o Warrior enquanto vivo. As áreas de combate ficam livres de obstáculos pequenos.

Uma RenderTexture de **1500×1060** compõe o ambiente estático uma vez. Seu armazenamento RGBA nominal é aproximadamente **6,07 MiB**, além do overhead do driver. As pinturas e os quadros de animação são preparados offline; o jogo apenas carrega texturas. Não há redraw de cenário por frame ou criação contínua de colliders.

O atlas do Warden contém oito quadros de 512×512 em uma textura **2048×1024**, com **2.177.741 bytes** em PNG e armazenamento RGBA nominal de 8 MiB. O limiar aberto possui **512×512**, **347.181 bytes** e 1 MiB RGBA nominal. [Medições dos assets](asset-measurements.json). O limite de objetos ativos do encontro é fixo; a contagem real e a medição de FPS pertencem ao QA final.

## Assets e reprodução

| Asset | Uso | Origem |
| --- | --- | --- |
| `warden-motion.png` | Oito poses: repouso, passadas, preparação, ataque, impacto, Signal e colapso | Pintura original com `imagegen`, preparada offline; sem imagens externas. |
| `open-threshold.png` | Continuação visual do portão aprovado | Variante original do asset existente, preparada offline. |
| `warden-theme.wav` | Trilha do encontro | Partitura e síntese offline autorais, reproduzíveis pelo script Python. |

Os [prompts exatos](illustration-prompt.md) registram a criação com `imagegen` e o [registro de origem](art-sources.json) identifica as saídas originais. O Hollow do próprio projeto serviu somente como referência de material; o limiar fechado forneceu a referência para sua variante aberta. `scripts/prepare-warden-boss-art.py` extrai e reduz os quadros offline. Não há geração de imagem ou música durante a execução do jogo.

## Testes e estado da validação

**Automação passou. Playtest humano necessário.** Typecheck e build passaram em 0.1.38. Chrome não registrou erros JavaScript ou de carregamento de assets. O aviso conhecido de tamanho do bundle Phaser permanece.

Verificações já realizadas no áudio: typecheck no momento da integração; WAV sem clipping; pico 0,34 e RMS 0,0872; diferença de emenda 27 contra diferenças normais próximas de até 214 unidades PCM. Mock do AudioManager confirmou autoplay adiado, uma música por vez, pausa preservada após `unlock()`, volume combinado e ausência de exceção quando as APIs não existem. Todas as 20 vozes dos nove cues possuem encerramento finito.

QA executado:

- Fluxo anterior completo até o limiar e travessia para a nova área.
- Apresentação, três fases, cinco padrões, avisos, dano, Dash, golpe e carga.
- Colisões do boss e das bordas, tentativas de sair durante o encontro e retorno após vitória.
- Morte/respawn repetidos, reinício limpo, recompensa única e reload.
- Chrome em 1280×720, 1366×768, 1920×1080 e 844×390; touch emulado e gamepad mock.
- Erros JS/assets, objetos, texturas, listeners, tweens e FPS ao longo das tentativas.

Os scripts e relatórios reproduzíveis são:

| Verificação | Script | Relatório |
| --- | --- | --- |
| Forest → Cavern → Deep Cavern → Exterior, combate antigo, retorno e respawn | `qa-cavern-exterior.mjs` | [Fluxo](flow-regression/measurements.json) |
| Primeiro Eco, portão fechado/aberto e entrada em uma nova área | `qa-warden-preparation.mjs` | [Preparação](preparation-regression/qa-report.json) |
| Cinco padrões, avisos, dano único, esquiva, fases, Saber e carga máxima | `qa-warden-patterns.mjs` | [Ataques](pattern-qa/qa-report.json) |
| Entrada, três mortes, reinício limpo, final único, retorno, reload, quatro resoluções e controles emulados | `qa-warden-boss.mjs` | [Encontro](encounter-qa/qa-report.json) |
| Vitória com HP normal e todos os padrões, sem invulnerabilidade ou ataques forçados | `qa-warden-playthrough.mjs` | [Travessia da luta](playthrough-qa/qa-report.json) |
| Build publicada localmente, assets e ausência de hook DEV | `qa-cavern-exterior-production.mjs` | [Produção](production/production-checks.json) |

Os comandos recebem URL de dev/preview e diretório de saída como argumentos. Os testes de estado usam preparação explícita em DEV e eventos reais de teclado/mouse ou Gamepad API mock/CDP touch. A travessia automatizada venceu em cerca de **31,5 segundos**, com HP normal e as três fases; isso comprova que o kit atual consegue concluir o encontro, sem substituir avaliação humana de dificuldade.

A arena apresentou **60,33 FPS médios** (mínimo 60,18) no Chrome headless durante ataques. A continuação anterior apresentou 60,05 FPS médios. O encontro manteve **71 objetos totais**, **14 Graphics totais**, uma RenderTexture e nenhum tween contínuo após estabilização; os totais incluem Player, HUD e controles visuais. Três respawns conservaram as mesmas contagens e um boss por tentativa. Após vitória e retorno, não há boss ativo nem recompensa repetida.

Uma asserção temporal do Skitter falhou durante execução concorrente; a repetição isolada da regressão inteira passou, sem alteração da IA. FPS é uma medição deste ambiente de teste, não uma garantia para aparelhos físicos.

As capturas foram inspecionadas visualmente. A barra do Warden ficou abaixo da área central para preservar corpo e telegraphs, inclusive em 844×390. [Arena](encounter-qa/arena-1280x720.png), [touch emulado](encounter-qa/touch-boss.png), [transmissão](encounter-qa/transmission.png).

## Limitações e playtest humano

A avaliação automática pode comprovar estados, dano e estabilidade, mas não determina sozinha diversão, justiça, reconhecimento dos avisos ou impacto da apresentação. **Playtest humano necessário** para ajustar dificuldade, ritmo, materialidade, animação, legibilidade em telefone e mixagem.

Ainda não há validação física deste boss em iPhone, gamepad ou navegador de console. A trilha e os efeitos são protótipos instrumentais, sem vocal ou mixagem final. Não foram criados dificuldade selecionável, loot, equipamentos, habilidades novas, segunda arena ou persistência permanente.
