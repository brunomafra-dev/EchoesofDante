# Chegada a Dante em 3D · 0.1.185

## Autorização e limite

O usuário pediu reproduzir o começo de Dante no novo mundo e confirmou **acampamento de pouso com nave, NPCs e floresta**. Pediu introduzir criação/edição de personagem e classes/poderes nesta avaliação. Siroco e regiões seguintes dependem de este trecho dar certo; não foram iniciados. O pedido anterior de interromper a correção isolada da formação nativa foi respeitado; a colisão está incluída nesta nova cena autorizada.

Ensaio solo em [arrival-3d.html?v=0.1.185](https://echosofdante.vercel.app/arrival-3d.html?v=0.1.185). O laboratório anterior continua disponível. Não é migração da campanha, editor definitivo, coop 3D ou promessa de qualidade final equivalente a Diablo/Path of Exile. Nenhuma infraestrutura paga ou renderização remota foi contratada.

## O que se pode avaliar

- Nome, gênero global da figura, cabelo, barba masculina e cores de pele/cabelo/roupa, com prévia tridimensional do corpo inteiro. Quatro classes selecionáveis; aparência editável depois de entrar. A classe permanece fixa neste personagem; criar outro ensaio exige confirmação e reinicia somente seu namespace.
- Acampamento com os pontos originais de Lia, Ivo, Nara, Tio Gui e Elisa, três estações e a nave: casco alongado, cockpit inclinado, motores laterais, apoios e rampa. Conversas simples próprias, trabalho nas estações e Elisa entre os dois canteiros reais. Sem duplicar esses moradores na floresta.
- Floresta conectada pela saída original, com contorno, trilhas, clareiras, quinze rochas, oito encontros e três vestígios em coordenadas originais, na escala de 40 pixels por metro. Ruína, mineral, rastro, origem do sinal e mecanismo seguem a ordem da descoberta. O fim da cena informa que a passagem para cavernas está fora deste ensaio.
- Primeira interpretação 3D do Hollow: carapaça mineral, olho âmbar recuado e seis pernas articuladas. Fera do Domador tem corpo e quatro pernas próprios. A criatura antiga de referência não é carregada por esta cena.
- Movimento, mira independente, ataque básico, poder carregado, esquiva, salto balístico, poções e retorno após derrota. Os oito encontros são finitos e a pesquisa permanece após voltar à base, reentrar ou recarregar.

## Primeiros kits

| Classe | Básico e recurso | Poder carregado |
| --- | --- | --- |
| Guerreiro Galáctico | Lâmina em alcance curto | Onda cinética direcional, dano crescente e deslocamento físico |
| Caçador estelar | Projétil; mover-se em combate gera embalo | Disparo perfurante em linha, consome embalo e para em paredes |
| Manipulador Astral | Projétil restaura energia ao acertar; regeneração lenta | Campos de energia, fogo, água e terra; custo, fogo periódico, água lenta e deslocamento de terra |
| Domador de feras | Projétil marca o alvo e gera vínculo; fera auxilia somente o alvo marcado | Investida limitada por alcance/colisões, dano único por alvo e pulso que cura o herói vivo apenas perto da chegada e com linha de visão |

São kits iniciais para avaliar navegação e combate no novo cenário. Compartilham um rig de trabalho, com clipes de lâmina, disparo e conjuração; não incluem armaduras, árvore de habilidades, inventário/economia, chefes, rede, missões de permanência ou balanceamento definitivo. Valores base e identidades vêm da campanha; a representação visual e temporal das habilidades ainda é uma interpretação deste ensaio.

## Controles

WASD/setas movem; mouse mira, clique segurado ataca. Q segura/solta o poder, R alterna elemento astral; Espaço/Shift esquiva, F pula, H usa poção, E interage. Botão direito arrasta a câmera, roda aproxima. No toque: analógico, arraste livre da câmera e botões; segurar Poder, arrastar para mirar e soltar. Contexto próximo pode ser tocado.

Gamepad: esquerdo move, direito mira; RT básico, LT poder, RB esquiva, X salto, A interação, Y poção, ↑ elemento, ←/→ câmera, Menu pausa e B fecha conversa/pausa. O analógico direito mira neste novo circuito; no laboratório antigo ele controla a câmera. F permanece salto, por isso R assume a troca astral nesta cena. A carga mostra no terreno a direção/área prevista. Pausa, troca de região, edição e perda de foco cancelam ações carregadas sem custo. Os botões de ação bloqueiam rolagem/seleção nativa para preservar o arrasto da mira no toque.

## Dados, pré-requisitos e física

Nenhum pré-requisito é simulado. Não lê nem grava personagens/saves/preferências da campanha ou catálogo do relay. Usa somente `sessionStorage['dante.arrival3d.v1']`, separado do ensaio antigo. Armazena aparência, região, vida, poções, oito mortes, três ecos, origem e mecanismo. Recarregar mantém esses dados, mas reposiciona na entrada segura da região. Fechar a aba pode encerrar o ensaio; não é save permanente da campanha.

As mortes comuns não reaparecem. Retornar após derrota restaura vida na base e mantém poções restantes, mortes e pesquisa. Não distribui XP, itens ou créditos reais. O mecanismo exige os três ecos e a análise da origem; não libera cavernas/regiões, não derrota bosses e não altera recibos.

Casco, motores, apoios, abrigos, bancadas, canteiros, pedras, troncos, fissura, água profunda e formações nativas têm colisão. A rampa é caminhável e o interior da nave permanece fechado. Pulo não atravessa obstáculos sólidos nem dá invulnerabilidade; teto limita o salto sob os toldos. Objetos conservam opacidade. É possível ocultar o herói atrás de estruturas/copas dependendo da câmera, conforme a direção solicitada; gire ou aproxime para inspecionar.

## Produção e desempenho

`scripts/prepare-arrival-layout.mjs` extrai um snapshot offline dos módulos puros da campanha e registra SHA-256 canônico LF das fontes. O runtime não importa as configurações da campanha, evitando extrair novos chunks do jogo original. `layout.json` permite comparar esta reconstrução com as coordenadas aprovadas.

Modelos completos Quaternius Standard/CC0, cabelos selecionáveis no mesmo esqueleto e doze clipes. Cabeça e roupa são malhas 3D reatadas ao rig completo, sem montagem de sprites por membros. Redução e WebP 512px offline; manifesto, hashes, licenças e autoria em `public/assets/arrival-3d/`. Reutiliza natureza Poly Haven, mapas ambientCG e copas previamente assadas. Nave, equipamentos, criaturas e efeitos foram modelados em código para Dante.

Árvores secundárias usam a geometria reduzida já disponível (144 triângulos; a detalhada tem 935), com as mesmas copas preparadas; materiais compartilhados. Terreno/estruturas agrupados por material e região; grama e membros das criaturas instanciados, vento no shader. Ambas as regiões são preparadas uma vez, com visibilidade por região; não há desenho estático por frame ou geração de assets em serviço externo durante o jogo. CPU atualiza matrizes, esqueleto, estado e efeitos transitórios. Esta estratégia ainda necessita avaliação em aparelhos reais; não presume 60 FPS ou estabilidade em iPhone a partir da emulação.

Amostra isolada em Chrome/ANGLE Intel UHD, 1440×900 e DPR 1, após oito segundos de aquecimento: base aproximadamente 44,6–45,1 FPS; floresta aproximadamente 46,6–48,1 FPS, em três janelas de dois segundos por cena. [Amostras completas](qa/0.1.185/performance/report.json). O roteiro de percurso também registra uma amostra que inclui a fase de entrada/reload; ela não deve ser confundida com o benchmark aquecido. Não é medição contínua de todos os combates ou garantia para celular.

## QA e gate humano

Evidências técnicas em `qa/0.1.185/`: inspeção geométrica dos dois rigs/animações, circuito por entradas normais, classes, controles, layouts, comparação do build e publicação. Cada relatório descreve fixtures e limitações. [Observações e correções do QA](qa/0.1.185/OBSERVATIONS.md). A inspeção pelo agente incluiu editor nos dois gêneros, nave, cinco aproximações de NPC, formação nativa, encontros, ruína, mineral, mecanismo antes da conversa, efeitos e telas estreitas. Fogo, água, terra e energia têm verificação funcional própria; toque nas quatro classes, gamepad padrão emulado com Astral e sete resoluções são registrados separadamente. O diagnóstico `?inspect=1` expõe somente cópias de estado, sem teleportes ou setters de progresso.

- [x] Rigs masculino/feminino: doze animações amostradas, sem geometria explodida, cabeça acompanha o corpo caído e salto não soma uma segunda trajetória física.
- [x] Typecheck/build (301 módulos), circuito compilado completo, quatro kits e quatro elementos, toque nas quatro classes, gamepad Astral, sete layouts, derrota/poção/reload e isolamento. Seis relatórios finais passaram; capturas inspecionadas pelo agente. [Comparação de build e hashes](qa/0.1.185/build-verification.json).
- [ ] Publicação e QA no endereço público.
- [ ] Aprovação humana do acampamento, floresta, editor, criaturas, câmera e poderes.
- [ ] iPhone 13/13 Pro físico; coop 3D e migração da campanha continuam fora do escopo.

O próximo arco não começa antes da validação deste trecho. QA técnico e inspeção pelo agente não aprovam estética, naturalidade, diversão ou desempenho em hardware não testado.
