# Decisões técnicas — Sprint 01

- **Phaser 3 + TypeScript + Vite:** o repositório estava vazio. A cena única e o loop do Phaser bastam para o protótipo 2D de navegador.
- **Responsabilidades pequenas:** `Controls` lê input; `Movement` resolve limites e rochas; `SaberAttack` usa `HitDetection`; `Damage` aplica dano em `Health`; entidades cuidam de estado e apresentação; `GameScene` coordena a ordem do loop e efeitos.
- **Acerto do sabre:** teste geométrico de distância e ângulo com raio do alvo. O clique dispara no evento `pointerdown`, evitando perder cliques curtos entre frames. Segurar o botão repete apenas após o cooldown.
- **Dash:** velocidade fixa por um intervalo curto, direção do input ou da mira, cooldown e invulnerabilidade durante o deslocamento e por 80 ms adicionais.
- **Crawler:** máquina de estados pequena (`IDLE`, `DETECT`, `CHASE`, `ATTACK`, `HURT`, `DEAD`). A preparação do ataque é marcada por um círculo. Entidades mortas saem da lista ativa e seus objetos visuais são destruídos após o efeito.
- **Arte e áudio:** formas vetoriais desenhadas em runtime evitam dependência de arquivos pesados. Web Audio gera sinais curtos; se o navegador bloquear áudio, o combate visual continua.
- **Câmera:** acompanha o jogador com interpolação e respeita os limites da arena; o mouse é convertido de coordenadas da tela para o mundo antes de calcular a mira.
- **Teste de navegador:** um smoke test local com Chrome headless verificou WASD, dash/cooldown, acerto, dano recebido, morte, respawn e remoção de inimigo. O teste usou teleporte e redução de HP apenas para alcançar estados específicos rapidamente. Não substitui avaliação humana de sensação de jogo.

## Sprint 01.5 — arte e game feel

- O visual continua procedural e usa `Graphics` e formas do Phaser. Isso evita arquivos grandes e mantém a arte substituível sem tocar em hitboxes.
- A floresta tem solo, clareira e marcas antigas no fundo; vegetação, minerais e estruturas no meio; entidades e efeitos no plano de combate; luzes ambientais discretas em primeiro plano. Algumas copas balançam por tween.
- Galactic Warrior e Hollow Crawler ganharam silhuetas distintas, detalhes de traje/biomecânica e estados visuais. Suas posições, raios de colisão, IA e regras de combate não mudaram.
- O sabre agora usa uma trajetória com núcleo claro e borda suave. Acertos geram flash, quatro faíscas curtas e número de dano; a morte do Hollow inclui colapso e poucos fragmentos. O dash ganhou um marcador de término.
- HUD mantém as informações existentes em painéis compactos. O canvas permanece em 1280×720 e escala com `Phaser.Scale.FIT`.
- Smoke test local em Chrome headless passou em 1280×720, 1366×768 e 1920×1080, sem erros de JavaScript. Em 1280×720 também verificou WASD, mira, ataque, dano, dash, morte, respawn pelo botão e pela tecla R, e remoção do inimigo. A medição pontual do loop foi de cerca de 49 FPS no ambiente headless; ela não representa FPS garantido em outras máquinas.

## Sprint 01.6 — movimento e sabre

- `EnergySaber` é um elemento visual separado do corpo. O cabo, a guarda, o emissor e a lâmina têm formas próprias; o indicador e o trail usam dois objetos `Graphics` reutilizados.
- O movimento funcional permanece em `Player.update`. A distância realmente percorrida avança o ciclo das botas; corpo e braços recebem uma oscilação pequena. Sem deslocamento, botas e corpo voltam imediatamente ao repouso. A sombra fica no plano do chão e marcas de contato breves reforçam os passos.
- `SaberAttack` mantém o cooldown de 340 ms e o alcance de 106 unidades. A animação usa preparação de 32 ms, swing de 128 ms e recuperação de 94 ms. A cada frame, a detecção cobre o setor angular percorrido desde o frame anterior. Cada alvo recebe no máximo um acerto por golpe. O indicador e a lâmina usam a mesma pose angular.
- O personagem segue se movendo durante o ataque. Dash, HP, morte e respawn mantêm as regras anteriores. O Hollow recebeu uma passada baseada na distância e uma pequena inclinação ao levar dano; a IA e o knockback funcional não mudaram.
- Smoke test em Chrome headless verificou movimento cardinal e diagonal, parada sem deslize, mira, cooldown, varredura contra três alvos em frame atrasado, ataque real, ataque contra dois Hollows, movimento durante o golpe, dash, dano recebido, perseguição, morte, respawn e console sem erros. A aparência do ciclo de caminhada ainda requer avaliação humana em movimento; capturas isoladas não demonstram toda a animação.

## Sprint 01.7 — correção da caminhada

- O deslocamento real após colisões determina a fase e a direção da passada. As botas ficam em um contêiner visual próprio, independente da rotação de mira usada pela arma e pela hitbox.
- Na implementação inicial, corpo e botas ficaram quase verticais na tela. A compensação de `-aim` no torso cancelava a rotação do contêiner do jogador e causou a regressão de orientação corrigida na hotfix abaixo.
- Ao começar a andar, a fase reinicia no começo de um passo e acompanha o movimento no primeiro frame. Ao parar, velocidade e posição respondem como antes, enquanto botas e bob retornam ao repouso em poucos frames.
- Smoke test em Chrome headless verificou WASD cardinal e diagonal, parada, orientação visual, sombra, mira, ataque e cooldown, morte de Hollow, dash, dano recebido, morte e respawn. Capturas foram inspecionadas em repouso e caminhada. A avaliação final da naturalidade do ciclo depende de jogo manual.

## Sprint 01.7 Hotfix — orientação da mira

- `Player.view` continua recebendo o ângulo calculado pelo mouse. O torso e o capacete herdam esse ângulo; apenas um balanço local pequeno é somado durante a passada e o golpe. Nesta primeira hotfix, as botas ainda ficaram em uma orientação independente, corrigida abaixo.
- O bob do torso e da Energy Saber é convertido para um pequeno deslocamento vertical na tela. A espada mantém seu ângulo relativo de prontidão/swing; alcance, hitbox, movimento, dash e IA não mudaram.
- O Chrome headless verificou oito direções de mira parado, mudanças rápidas de mira, quatro direções de caminhada e duas diagonais, mira durante o movimento, mudança de mira durante o swing, ataque e cooldown, dash parado e andando, dano, morte e respawn. Capturas das quatro direções cardinais foram inspecionadas; a avaliação final da postura em movimento ainda depende de jogo manual.

## Sprint 01.7 Hotfix 2 — orientação das pernas

- `legsRig` e `bodyRig` já eram filhos de `Player.view`. A rotação local `-aim - π/2` de `legsRig` cancelava a mira do contêiner; removê-la faz as pernas herdar a mesma orientação do torso sem aplicar o ângulo duas vezes.
- As posições das botas já eram locais. Apenas os offsets da passada passaram a converter a direção real de deslocamento do mundo para os eixos locais da mira. Fase, amplitude, retorno ao repouso, sombra, bob e sistema de combate permanecem iguais.
- Chrome headless verificou oito direções de mira parado, mudanças rápidas de mira, seis trajetórias de caminhada, mira durante caminhada e swing, ataque/cooldown, dash parado e andando, dano, morte e respawn. Capturas das direções cardinais e da caminhada com mira diagonal foram inspecionadas. A naturalidade da silhueta 2D em movimento ainda requer avaliação humana.

## Sprint 01.8 — impacto e reação do Hollow

- O acerto continua sendo decidido por `SaberAttack.advance` durante o swing. `GameScene` passa apenas o ângulo da pose ao efeito já existente: o clarão de contato fica estreito e acompanha a direção do sabre. Número de dano, quatro faíscas, áudio e shake mantêm o mesmo momento e a mesma lógica.
- O Hollow usa sua janela `HURT` de 170 ms para comprimir brevemente o corpo, recolher os membros e clarear o núcleo. O flash existente ficou mais curto e suave. O knockback mantém velocidade e desaceleração anteriores; no golpe fatal, o flash acompanha o colapso já existente.
- Não foi adicionado hit stop para não interferir no input. O Chrome headless verificou golpe no vazio, acerto e número no frame do swing, flash, contração, deslocamento pelo knockback, recuperação, golpe fatal, ataque andando e após dash, mudança de mira durante swing, dano recebido, morte, respawn e ausência de erros de JavaScript. A sensação de peso ainda precisa de avaliação humana jogando.

## Sprint 01.9 — fundação explorável de Dante Forest

- Antes havia uma clareira central circular, oito rochas e oito inimigos ao redor do centro. O mundo já tinha 2200×1500 unidades e câmera com acompanhamento suave e limites; dimensão, zoom e código da câmera foram preservados.
- `config/forest.ts` reúne entrada, trilhas, clareiras, rochas interiores e posições dos quatro pares de Hollows. `Arena` compõe o ambiente existente e `GameScene` usa as posições de início. Não há geração de encontros nem alterações em movimento, entidades, combate ou HUD.
- A entrada fica em (400, 1230). A trilha principal de 230 unidades segue ao nordeste; desvios de 170 e 190 unidades levam à árvore maior e à formação mineral. A ruína ao norte e os marcos de tecnologia reaproveitam a arte procedural. As trilhas e clareiras reservam espaço sem árvores comuns.
- Bancos de rochas visíveis, com variação de posição e tamanho, cobrem os limites existentes. As 75 colisões circulares incluem rochas, tronco do marco vegetal e base da ruína; o resolvedor existente é reutilizado. A maioria das árvores é estática: a cena inicial observada tinha 418 objetos e 23 tweens ativos, sem benchmark de desempenho.
- Chrome headless em 1280×720 percorreu a entrada, os dois desvios, as ruínas e o retorno usando WASD, verificando orientação das pernas, limites da câmera e acesso aos encontros. A travessia usou invulnerabilidade somente no teste para isolar navegação. Os eixos das trilhas e todos os spawns passaram na checagem de espaço livre; os quatro limites foram exercitados pelo resolvedor nas velocidades de caminhada e dash, além de uma caminhada real contra a borda sul.
- Em uma cena reiniciada com HP normal, o teste encontrou um Hollow ao avançar, causou dano, derrotou-o com ataque andando e usou dash. Para testar morte rapidamente, reduziu o HP e aproximou outro Hollow; a IA matou o jogador e R restaurou a entrada. Não houve erros de JavaScript. Capturas do mapa e dos três pontos de interesse foram inspecionadas. Typecheck e build passaram; o Vite manteve o aviso conhecido de bundle acima de 500 kB. Estes testes não substituem avaliação humana do fluxo e da sensação do combate.
- A perseguição direta existente pode prender inimigos em obstáculos fora das rotas. A borda ainda tem composição simples e a arte é provisória; navegação de IA e refinamento visual ficam fora desta sprint.

## Sprint 02.0 — First Discovery

- `NorthernDiscovery` substitui somente o desenho da ruína em (1500, 285). Placas assimétricas, núcleo geométrico, fraturas, solo e vegetação sugerem uma estrutura antiga. As três colisões existentes, rotas, spawns, dimensões e câmera são preservados.
- `config/discovery.ts` concentra posição, alcance de 150 unidades e duração da mensagem de 4,2 segundos. A classe guarda um único booleano por cena; não há sistema de interação genérico, quest, recompensa ou persistência.
- `Controls` lê E com `JustDown`, consumido a cada update mesmo fora de alcance ou morto. `GameScene` permite ativar apenas vivo, próximo e antes da primeira descoberta. Segurar E longe e depois aproximar não dispara a interação.
- A ativação acende as inscrições e expande uma elipse durante 900 ms. Dois tweens sobre objetos existentes, sem partículas ou criação por frame. O brilho fica em 65% depois do sinal; reiniciar a cena restaura o estado inicial. O áudio reutiliza o sintetizador opcional existente.
- `Hud` exibe prompt contextual e mensagem curta acima dos controles, sem cobrir a estrutura ou interromper movimento/combate. O timer pertence à cena; morte oculta a mensagem e o respawn recria os objetos.
- Typecheck e build passaram (permanece o aviso conhecido de bundle grande). Chrome headless percorreu a rota após derrotar um Hollow com HP normal, investigou, verificou pulso/brilho, expiração da mensagem, bloqueio de repetição e saída da área com ataque e dash. Também verificou E fora de alcance, E mantido durante aproximação, E durante morte, respawn e nova ativação. Capturas foram inspecionadas em 1280×720, 1366×768 e 1920×1080.
- A travessia após o primeiro combate usou invulnerabilidade no teste. Morte foi acelerada reduzindo HP e aproximando um inimigo; os casos adicionais de interação após restart usaram posicionamento direto. Não houve erros de JavaScript ou console na execução final. Um 404 preexistente de favicon foi corrigido com um ícone SVG embutido em `index.html`. Não houve avaliação auditiva nem validação humana da sensação de descoberta.

## Sprint 02.0.1 — auditoria do início da partida

- Chrome headless em 1280×720, com ANGLE/Intel UHD, mediu cerca de 12–13 FPS e 48–55 unidades de deslocamento por segundo nos primeiros oito segundos. Os frames duravam perto de 80 ms. O movimento continuava configurado em 245 unidades/s; o `TimeStep` do Phaser mantinha o delta suavizado em 16,7 ms durante seu período padrão de recuperação de 120 frames. Quando esse período terminou, o deslocamento subiu para cerca de 126 unidades/s, ainda limitado pelo teto de 40 ms da cena. A mesma cena em `fa58366` apresentou 12,3 FPS com 327 objetos `Graphics`, mostrando que o custo existia antes da descoberta.
- Ocultar apenas o desenho do solo elevou o teste de 12,6 para 16 FPS; ocultar os 328 `Graphics` ambientais elevou para 60,5 FPS. Os oito inimigos, 23 tweens ambientais, HUD, câmera e descoberta permaneceram presentes nesse isolamento. Portanto, o custo recorrente estava na renderização dos desenhos estáticos, amplificado pela recuperação do delta, não em uma mudança de velocidade, IA ou interação.
- `Arena` agora captura o solo e elementos estáticos em `RenderTexture` na criação da cena, agrupados em faixas de profundidade de 100 unidades. A geometria deixa de ser redesenhada a cada frame. Três pequenas texturas geradas uma vez são compartilhadas por todas as copas e troncos, que conservam posição, profundidade e animação individual. Colisões, seed, rotas, spawns, câmera, `GameScene.update` e valores de movimento não mudaram.
- Com a correção final, o mesmo Chrome headless registrou 60 FPS, cerca de 240 unidades/s no primeiro segundo e cerca de 245 unidades/s nos segundos seguintes, sem frames acima de 40 ms na amostra de dez segundos. Na reinicialização da cena, observou 122 frames em cerca de dois segundos, 484,6 unidades percorridas e contagem de texturas estável em 30. Capturas do início e das ruínas foram comparadas com a versão anterior.
- Smoke test no navegador verificou movimento diagonal, mira, perseguição, golpe que derrota Hollow, dash, rota até as ruínas, prompt, ativação, movimento e ataque após a descoberta, morte e respawn, sem erros de console. A travessia longa usou invulnerabilidade no teste e a morte foi acelerada ajustando HP e posição do inimigo. O ganho observado se aplica ao ambiente medido; outros navegadores e GPUs ainda exigem avaliação humana. O carregamento inicial continua preparando texturas antes de mostrar a cena, e a ordem de sobreposição de pequenos elementos estáticos pode variar levemente dentro de cada faixa.

## Sprint 02.1 — atividade da floresta

- Quatro Hollows em dois pares receberam percursos curtos definidos em `forest.ts`, sobre clareiras já abertas. Os outros quatro mantêm o comportamento anterior. A patrulha usa o estado `IDLE` e velocidade de 45 unidades/s; detecção, perseguição, ataque e dano continuam no fluxo existente. Depois de perder o jogador, o Hollow volta ao ponto de origem antes de retomar o ciclo.
- A formação mineral a leste já era um ponto de interesse; por isso não foi criado outro. Um anel e um brilho reaproveitados por um único tween produzem um pulso breve sem interação, texto ou trabalho extra em `update`. Os objetos ficam acima da faixa estática da rocha para permanecer visíveis.
- Chrome headless em 1366×768 verificou movimento, patrulha, detecção, perseguição, dano recebido, golpes, dash, descoberta, morte e respawn, além do pulso e da contagem estável de objetos. A posição foi ajustada diretamente em trechos longos do teste e HP foi reduzido para acelerar a morte. O primeiro segundo de WASD percorreu cerca de 243 unidades; o loop ficou próximo de 59 FPS na amostra, sem erro de console. A leitura subjetiva de atividade da floresta ainda depende de avaliação humana.

## Visual Prototype 01 — primeiro recorte Organic Sci-Fi

- A Art Bible em `docs/art-bible/` orientou uma substituição visual pequena: armadura humana com acento industrial laranja e visor ciano; Hollow com carapaça e núcleo quente; copas irregulares e rochas facetadas. Os SVGs são autorais e ficam em `public/assets/visual/`.
- `GameScene.preload` carrega oito SVGs uma vez pelo Phaser. As três texturas de árvore preservam as chaves antigas, então `Arena` reutiliza imagens, posições, profundidade e tweens sem alterar o mapa. O terreno e as rochas estáticos continuam capturados em `RenderTexture`; nenhum `Graphics` estático volta a ser redesenhado por frame.
- `Player` e `HollowCrawler` trocam somente partes desenhadas por `Graphics` por `Image` dentro dos mesmos contêineres. Aim, ciclo de passos, animação dos membros, estados, hitboxes, combate, colisões e velocidade não foram modificados. Sabre, efeitos, Mineral Pulse, First Discovery e HUD continuam com a apresentação anterior nesta etapa.
- Os arquivos são servidos pela pasta `public` porque o Vite pode embutir SVGs pequenos em `data:` URLs, formato que causou erro de decodificação no loader SVG do Phaser durante o primeiro smoke test. URLs estáticas com `BASE_URL` funcionaram no teste seguinte.
- No Chrome headless em 1366×768, a cena carregou oito texturas novas sem erro; um teste com teclado/mouse mediu 236 unidades em 950 ms de W, 129 unidades em 500 ms na diagonal, patrulha, mira, dash, acerto de 34 HP, ativação da descoberta e respawn. O loop reportou aproximadamente 58 FPS nessa execução. O build de produção também abriu em 1920×1080 sem erro de console ou requisição 4xx. A inspeção visual de capturas confirmou a diferença em relação ao protótipo anterior; a avaliação estética final precisa ser feita pelo jogador.

## Visual Prototype 01.1 — silhueta do Galactic Warrior

- A captura do primeiro recorte mostrava uma mochila larga, braços curtos e botas quase cobertas pelo torso. O novo desenho separa capacete, pescoço, ombros, torso, braços, coxas, joelhos e botas; a mochila foi reduzida. A direção frontal local continua sendo +X, para que o rig existente gire o conjunto com a mira.
- Dois SVGs de braço substituem os desenhos `Graphics` anteriores dentro do mesmo `bodyRig`. As duas imagens de perna permanecem no `legsRig`; posições, rotações, passada, ataque e arma mantêm o código anterior. O Phaser carrega os dois novos arquivos uma vez no `preload`.
- Capturas do Chrome headless foram inspecionadas em repouso, nas quatro direções de mira, caminhando, no swing e durante o dash. Em 1366×768, o teste registrou 235 unidades em 950 ms de W, 127 unidades em 500 ms na diagonal, acerto de 34 HP, patrulha, morte e respawn, sem erro de console. O build de produção abriu em 1920×1080 sem requisições 4xx. A leitura final da silhueta e a sensação da passada ainda dependem de avaliação humana jogando.

## Correção visual — Galactic Warrior ereto

- A rotação integral do contêiner de mira deixava o corpo horizontal ao apontar para os lados. O contêiner ainda orienta o sabre, mas `bodyRig` e `legsRig` recebem a rotação inversa; o torso seleciona vista frontal, lateral ou traseira segundo o ângulo do mouse. A pequena inclinação de ataque continua local ao torso.
- Os SVGs do corpo e das botas foram redesenhados em postura vertical. Braços e contato com o chão acompanham essa postura; a mão direita se estende até o cabo existente. Nenhuma velocidade, hitbox, alcance, dano ou estado de combate foi alterado.
- Capturas e interação no Chrome headless em 1366×768 e 1920×1080 verificaram as quatro direções, caminhada, parada, golpe, dash, acerto de 34 HP, dano recebido, morte e respawn sem erro de console. A avaliação da naturalidade artística permanece com o jogador.

## Sprint 02.2 — Kinetic Charge

- Não havia especificação concreta da habilidade no código, documentação, Art Bible ou histórico. A versão mínima usa Q, direção da mira capturada no início, 600 unidades/s por 180 ms, 30 de dano, arco frontal de 44 unidades e 0,45 radiano, cooldown de 3200 ms. Todos os valores ficam em `config/game.ts`.
- `KineticCharge` guarda duração, cooldown, direção e alvos já atingidos. A detecção reutiliza `inMeleeArc` nas posições anterior e posterior ao movimento corrigido por `moveWithCollisions`; cada Hollow recebe no máximo um impacto por ativação. `GameScene` usa o mesmo fluxo de dano, reação e morte do Saber Strike.
- Durante a carga, o movimento segue a mira fixada e a lâmina aponta para frente; ataque básico e Dash aguardam a janela de 180 ms. A habilidade não concede invulnerabilidade e é encerrada quando o Warrior morre. O HUD mostra Q e o cooldown, sem sistema de recursos.
- Chrome headless verificou direção cardinal e diagonal, Q andando, cooldown, dois alvos com 30 de dano cada, morte de Hollow, bloqueio pela rocha, ataque e Dash após a carga, dano recebido, morte durante a carga, respawn e First Discovery. Houve cerca de 60 FPS depois do carregamento na execução medida, sem erro de console; sensação e balanceamento ainda exigem avaliação humana.

## Sprint 02.3 — golpe pesado e ancoragem do sabre

- Q agora inicia `CHARGING`; soltar Q usa a mira daquele instante para `RELEASE`. O Player permanece parado durante as duas fases, sem invulnerabilidade nova. `KineticCharge` reutiliza `inMeleeArc` e dispara uma única janela de impacto após 80 ms; o fluxo de dano e morte continua em `GameScene`.
- O golpe pesado usa 50–76 de dano conforme até 800 ms de carga, alcance de 135, abertura frontal de 0,75 radiano, knockback inicial de 500 e cooldown de 3200 ms. LMB, Dash e velocidades normais não mudaram. O HUD existente mostra o percentual de carga e o cooldown.
- `EnergySaber.view` fica sob `handAnchor`, filho do `bodyRig`, junto da luva. O braço vai do ombro até essa âncora, e a arte do cabo foi deslocada dentro do contêiner para girar exatamente no ponto da mão. O torso continua ereto e a espada segue a mira; efeitos de trilha permanecem em coordenadas de mundo.

## Ajuste visual — empunhadura com duas mãos

- A mão de apoio acompanha um segundo ponto local do cabo em `EnergySaber.view`; o braço de apoio possui dois segmentos com cotovelo calculado no `bodyRig`. Ambos os pontos giram com o mesmo sabre durante mira, caminhada, LMB, Q e Dash. As peças são criadas uma vez por Player; hitboxes, dano, velocidade e cooldowns não mudaram.

## Ajuste de Kinetic Charge — onda de corte

- O gesto carregado continua parado e com o sabre nas duas mãos. Após 80 ms do release, uma onda ciano/branca de 120 unidades de largura parte 55 unidades à frente do Player e percorre 133 unidades em 320 ms, acompanhando a mira capturada ao soltar Q. A distância percorrida deriva da velocidade e duração atuais do Void Dash; o movimento do Player e o Dash não mudam.
- `KineticCharge` guarda a origem do lançamento e verifica uma faixa varrida entre a posição anterior e a atual da onda. Isso evita perder alvos entre frames e limita cada Hollow a um acerto por ativação. O fluxo existente de dano, knockback, impacto e morte permanece em `GameScene`. Um único `Graphics` reutilizado desenha a onda só enquanto ela existe; o efeito é limpo ao terminar ou quando o Player morre.

## Sprint 03.0 — Echoes e progresso de sessão

- `NorthernDiscovery` mantém a arte e a reação existentes e passa a cumprir a pequena interface `EchoSite`. `ForestEcho` desenha somente dois locais adicionais: o sinal na formação mineral a leste e um fragmento antigo no desvio oeste. A cena usa a mesma tecla E, alcance e mensagem curta para os três; o `MineralPulse` permanece independente.
- `Progression` é um campo da instância de `GameScene`, preservado por `scene.restart()` e descartado ao recarregar a página. Guarda os IDs dos Echoes e dos oito spawns de Hollow já recompensados; não há XP duplicado depois de morrer. XP: 40 por Echo, 15 por Hollow; limiares de nível: 0, 60 e 140; HP máximo: 100, 110 e 120. A única consequência de nível é restaurar HP e elevar seu máximo.
- O HUD recebe um painel compacto para nível, XP e contador 0/3 e mensagens temporárias de descoberta/level up. As faixas estáticas da `Arena`, movimento, câmera, colisões, IA, dano e habilidades mantêm seus valores e fluxo anteriores.

## Sprint 04.0 — The Signal

- `Progression.signalSynchronized` deriva dos três Echoes já registrados; `sourceLocated` guarda apenas a interação final da sessão. Não há estado de quest ou nova recompensa. Após o terceiro Echo, os três locais reutilizam seus objetos de pulso em violeta; a mensagem `SIGNAL SYNCHRONIZED / ORIGIN: NORTHERN RIDGE` e o objetivo curto aparecem sem pausar o jogo.
- `SignalThreshold` desenha uma única fissura selada em (1870, 245), no término da trilha norte existente. Antes de 3/3 a estrutura não interage; depois acende inscrições violeta/âmbar e aceita E uma vez. Um obstáculo local impede atravessar a abertura, sem mudar as demais colisões ou rotas. A interação revela `SIGNAL SOURCE: BELOW / PASSAGE: SEALED` e marca o limite atual da floresta.
- O sinal ativo, a fonte localizada e o objetivo do HUD são reconstituídos no respawn pelo mesmo estado de sessão. Recarregar a página reinicia tudo. Os gráficos são criados uma vez por cena; a fissura usa um tween leve e os pulsos reaproveitam objetos existentes.
