# Decisões técnicas — Sprint 01

## Dunas Interiores e música regional, 0.1.59

- O portal oriental da Bacia do Siroco avança para Dunas Interiores; seu retorno fica na entrada da nova área. A região reutiliza GameScene, o kit ilustrado D, habitats áridos e save local. Caminhos norte/sul contornam uma crista; ruínas registram checkpoint e uma depressão de areia prepara um encontro futuro sem implementar boss.
- Piso WebP original, quatro faixas estáticas de RenderTexture e dez bases circulares mantêm composição e física separadas. Sete habitantes usam IA e valores existentes; duas descobertas opcionais concedem 20 XP uma vez. Novas flags são opcionais no schema local atual, preservando saves anteriores.
- Nove músicas originais de 120–173 segundos substituem os loops curtos em todas as regiões. Composição e síntese são offline (`compose-region-scores.py`); runtime usa MP3 estéreo sob demanda e crossfade finito de 1,6 s, com no máximo duas vozes. Não há amostras externas ou síntese musical durante gameplay. A geografia da Cavern seleciona suas quatro atmosferas; o encerramento do Warden conserva o silêncio após a vitória.
- Autoplay continua condicionado a gesto; áudio indisponível não bloqueia gameplay. MASTER/MUSIC/SFX permanecem separados, e vozes anteriores são liberadas. [Arte, autoria, medições e QA](sirocco-interior-and-sound/).

## Base da Sprint 01

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

## Sprint 05.0 — The Sealed Passage

- `Progression.passageOpen` é um único estado de sessão, autorizado apenas após localizar a fonte com 3/3 Echoes. Investigar o pequeno mecanismo enterrado perto da fissura ativa as inscrições; duas placas se afastam em 680 ms e o obstáculo local sai da lista de colisões ao fim da animação. Não há XP adicional, chave ou sistema de missão.
- A entrada usa a mesma `GameScene`: a área seleciona `Arena` ou `CavernArea` na criação. A travessia aplica fade curto e reinicia apenas a cena, guardando o HP atual por um restart; XP, nível, Echoes e passagem aberta já permanecem no campo `Progression`. Morrer na Cavern reinicia sua primeira sala com HP restaurado e conserva o estado da sessão.
- `CavernArea` é uma única câmara autoral de aproximadamente 1200×740 unidades dentro do mundo e câmera existentes. `Movement` recebe limites opcionais só para essa área; sem limites explícitos, mantém exatamente o clamp da floresta. Três rochas usam o mesmo resolvedor circular, e dois Hollows usam a IA e o combate existentes com IDs de recompensa próprios.
- Solo, paredes, raízes, minerais e face antiga da Cavern são capturados uma vez em `RenderTexture`; apenas um brilho discreto usa tween contínuo. A face é visual e não concede Echo. Os valores de ataque, dash, Kinetic Charge, IA, câmera e progressão permanecem iguais.

## Sprint 05.1 — Cavern Depths

- A confusão na abertura vinha da resposta simultânea do mecanismo e das placas. O mesmo mecanismo agora mostra um sinal percorrendo duas inscrições no solo durante 580 ms; só então a fissura pulsa e as placas abrem em 680 ms. O obstáculo sai ao fim, e a mensagem de abertura aparece nesse momento. Não há novo estado de progressão ou recompensa.
- A segunda abertura percebida pelo jogador era a face escura no nordeste da câmara, sem conexão funcional. Ela agora enquadra um corredor curto para um desabamento visível. O destino permanece indefinido: não é identificado como saída da floresta nem carregado outro mapa. Chegar perto apenas mostra uma mensagem curta uma vez na sessão; o jogador pode voltar livremente.
- A área mantém os limites de 1200×740 unidades. Três zonas usam chão e relevo irregulares: descida, bacia mineral lateral e caminho para a face. Os dois spawns de Hollow foram separados entre a bacia e a rota, sem condição de eliminação para avançar. As três colisões existentes foram ajustadas para acompanhar formações de pedra maiores; controles, combate, IA, XP, HP e câmera não mudaram.
- Desenhos estáticos continuam capturados uma vez em `RenderTexture`, inclusive um pequeno plano de raízes à frente. Dois brilhos discretos reutilizam objetos e tweens. A Cavern não recebe sistemas de iluminação, partículas ou redraw por frame.

## Sprint 05.2 — The Deep Signal

- O desabamento é revelado por proximidade, sem nova interação ou condição de combate. Inscrições e um sinal percorrem a rocha; duas placas deslocam-se em cerca de um segundo. Até a abertura terminar, o limite e um obstáculo circular impedem a travessia. Depois, o obstáculo é removido e o limite direito da Cavern aumenta de 1680 para 2470. O estado aberto sobrevive ao respawn da cena na mesma sessão.
- A primeira câmara e o bolso profundo continuam na mesma `GameScene`, com o mesmo zoom e acompanhamento de câmera. Só o limite horizontal da câmera na Cavern aumenta para mostrar a extensão; o limite da Forest não muda. A área profunda é curta e não define o que existe além dela.
- A primeira câmara usa natureza e pedra como linguagem principal; a área profunda coloca uma estrutura antiga fraturada, parcialmente coberta por raízes e minerais, no centro da composição. Não é um Echo, não concede XP e não revela a origem do sinal. Dois Hollows permanecem nos spawns anteriores, sem novo bloqueio por eliminação.
- A arte profunda é capturada uma vez em `RenderTexture`. Apenas um pulso ambiental e os objetos reutilizados da abertura animam; nenhum cenário estático é redesenhado por frame. Sete colisores simples acompanham o relevo e a estrutura, sem alterar `Movement`, combate ou IA.

## Sprint 06.0 — entrada web multiplataforma e identidade sonora inicial

- Uma única build web recebe as ações MOVE, AIM, ATTACK, DASH, KINETIC_CHARGE e INTERACT. `Controls` traduz teclado/mouse, gamepad com mapeamento `standard` da Gamepad API e `TouchControls` para a cena. `Player`, `SaberAttack`, `KineticCharge`, `HitDetection`, colisão, IA e valores de gameplay não foram alterados.
- WASD, mouse, LMB, Space, Q e E mantêm a semântica anterior. O ataque de clique curto continua no evento de pressionar, inclusive no botão touch; segurar mantém repetição pelo cooldown existente. Gamepad usa analógico esquerdo para movimento, direito para mira, RT para ataque, RB para Dash, LT para charge com release e A para investigar. Start ou o botão na tela reinicia após morte. A deadzone de 0,22 evita drift; a última mira válida permanece quando o analógico centraliza. O método ativo acompanha o último input efetivo sem reload.
- No touch em landscape, dois controles de direção permitem movimento e mira simultâneos. STRIKE, DASH, CHARGE e INVESTIGATE contextual são elementos HTML reutilizados; CHARGE preserva pressionar, segurar e soltar. O HUD esconde a barra de teclas no touch e muda os prompts no gamepad. Layout usa safe areas e indica rotação em portrait. Não há detecção por user-agent, aim assist ou lógica alternativa de combate.
- `AudioManager` substitui o sintetizador isolado: uma música HTML Audio em loop por área e SFX curtos em Web Audio, com volumes internos MASTER/MUSIC/SFX. Um gesto de teclado, ponteiro, touch ou gamepad tenta desbloquear o áudio; falha ou ausência de áudio não bloqueia o jogo. Trocar de Forest para Cavern pausa a música anterior antes de tocar a próxima. Os dois WAVs instrumentais são originais e gerados offline pelo script de protótipo; não há samples de terceiros nem sistema musical procedural em runtime.
- A direção sonora pretendida une sci-fi, exploração, mistério, organicidade e tecnologia antiga. Forest apresenta o sinal distante; Cavern usa uma variação mais baixa e contida do mesmo motivo. Deep Signal, camadas de combate/descoberta e vocal atmosférico sem letra são possibilidades futuras, não funcionalidades declaradas nesta versão.
- Esta sprint não cria APK, PWA, builds nativas ou suporte oficial a Xbox. Gamepad físico, mobile físico e navegadores de console dependem de validação posterior; os testes de navegador emulado não substituem esses aparelhos.

## Sprint 06.1 — combate touch e proteção de gestos

- A camada touch deixa de usar joystick de mira. STRIKE traduz press/drag/release em uma única ação do ataque existente, sem repetição enquanto segura; um toque conserva `lastCombatDirection`, com fallback para a mira já disponível. CHARGE conserva hold/release e usa o mesmo vetor escolhido por arrasto. O threshold de 12 pixels CSS e a tolerância do joystick ficam em `config/touch.ts`, separados dos valores de gameplay.
- Pointer capture mantém os gestos fora dos botões; movimento e combate têm ponteiros independentes, e apenas um gesto de seleção de combate é aceito por vez. Pointer cancel, perda de captura/foco, portrait, morte e troca de entrada limpam o gesto. A cena consome somente um novo sinal de cancelamento touch e usa `KineticCharge.stop()` já existente para impedir que uma interrupção seja interpretada como release ofensivo. Dano, cooldowns, Dash e regras de PC/gamepad permanecem iguais.
- `TouchAimPreview` desenha duas guias uma vez por cena, a partir dos valores reais de alcance/arco e trajetória da onda. Durante o gesto, só visibilidade, posição e rotação mudam. Os elementos HTML são reutilizados; não há novo sistema de partículas, redraw de cenário, timers de gesto ou atualização contínua do DOM.
- `touch-action: none` pertence ao contêiner do jogo, canvas e controles. `GameplayGestures` complementa isso com prevenção não passiva de eventos touch e gestos Safari nessas superfícies, evitando double-tap, pinch, scroll, seleção e callout. O viewport continua escalável e a prevenção não usa listeners globais no documento. Listeners de superfície, foco, visibilidade e orientação são removidos no shutdown da cena.
- A composição touch usa alvos maiores que suas faces visuais, feedback de pressionado/release, guia direcional e textos curtos, com safe areas e orientação landscape. A proteção foi projetada para Safari, mas a confirmação em iPhone físico permanece um playtest necessário; Chrome emulado não representa essa validação.
- O teste portrait → landscape encontrou o canvas preso no tamanho anterior: o evento de orientação atualizava os limites do pai depois do cálculo de FIT. Um único refresh agendado em resize atualiza os limites antes de recalcular FIT; é removido no shutdown. A centralização CSS redundante foi retirada, deixando `CENTER_BOTH` do Phaser centralizar o canvas. Resolução interna, câmera, zoom e coordenadas do jogo não mudam.


## Sprint 06.3 — presença física ambiental

- A [auditoria de colisão](ENVIRONMENT_COLLISION_AUDIT.md) separa SOLID, DECORATIVE e OPTIONAL; interação permanece independente. `config/environmentCollision.ts` centraliza bases circulares de troncos, totens, fragmento investigável, mecanismo, suportes da fissura, pedras estruturais, face antiga e minerais maiores. Rochas, ruína e bloqueios dinâmicos existentes mantêm seu fluxo.
- Forest registra os novos círculos depois da composição, preservando a sequência aleatória e a distribuição visual das árvores. Cavern registra suas bases depois de desenhar as rochas, evitando que um footprint físico vire uma rocha visual extra. Cenário estático continua baked; não há objetos físicos Phaser ou criação de colliders por frame.
- Player e Hollow compartilham o resolvedor circular existente, sem mudança em Movement, controles, combate, valores, IA ou câmera. Bases compactas deixam livres os alcances de investigação e o centro das passagens; spawns e POIs não foram deslocados. Perseguição direta pode continuar prendendo Hollows contra obstáculos, como limitação conhecida.


## Environment art pass — D / Hybrid, 0.1.32

- A aprovação humana de D e a autorização para iniciar por Forest e Cavern orientam a [integração ambiental](environment-art-pass/). PNGs pintados substituem superfícies geométricas de pedra, minerais, vegetação e bases antigas. Organic Sci-Fi R3, paleta e World Shape Language continuam oficiais; o laboratório anterior permanece como controle.
- As pinturas são produzidas e normalizadas offline. GameScene carrega o kit uma vez; EnvironmentPainter reutiliza Images temporárias para compor as RenderTextures existentes e as destrói depois do bake. Copas, troncos e placas animadas mantêm os objetos necessários ao desenho em profundidade. Não há redraw ambiental por frame ou novos tweens contínuos.
- Colisores, limites, caminhos, spawns, interações, sinais, combate, controles, câmera, progressão e áudio permanecem. Variações visuais não consomem a sequência aleatória de posicionamento; a verificação compara os arrays físicos antes/depois. O kit adiciona cerca de 2,16 MiB em PNGs, e a aprovação visual da aplicação no mundo depende de playtest humano.

## Expansion Sprint 01 — Deep Cavern, 0.1.34

- O bolso profundo passa a ser uma região com descida, bifurcação mineral, dois moradores, estrutura ancestral e limite sugerindo continuidade. Conserva a mesma cena, bounds e câmera; não revela The First Echo ou lore definitiva. [Composição e validação](expansion-deep-cavern/).
- Três PNGs pintados offline complementam o kit D aprovado. A composição profunda usa o bake existente e um pequeno foreground adicional. Ground Graphics apenas definem massas de solo/máscara; rochas e estruturas usam pinturas. Bases físicas circulares ficam nos dados de ambiente.
- Hollows profundos são criados depois da abertura, evitando o clamp para a primeira sala. IDs próprios preservam o XP por spawn, inclusive após respawn. A IA e valores não mudam.
- Entrar na região registra um retorno local seguro em (1870,580), sem framework de checkpoints ou save. Passagens, XP, nível e Echoes continuam dados da sessão. O POI responde por proximidade, sem nova recompensa; o áudio reutiliza Cavern e Signal existentes.

## Expansion Sprint 02 — Cavern Exterior, 0.1.35

- A continuação mantém a mesma cena, estende o limite horizontal após a abertura existente e conecta habitats subterrâneos a um exterior de cerca de 980 unidades. Modelo/zoom/follow da câmera e a região aprovada permanecem; apenas a antiga base do limite é deslocada à borda do túnel. [Ritmo e validação](expansion-sprint-02/).
- Dois arquétipos explícitos em DanteCreature: Skitter leve com investida telegráfica de direção fixa, Spitter que mantém distância e dispara projétil esquivável. Enemy expressa o contrato de Health/posição/update/reação/morte que o combate já usa. Não há framework de IA ou alteração do Crawler/Player.
- Cinco habitats totalizam 15 novos moradores; são instanciados uma vez por ciclo de cena na aproximação. IDs 12–26 usam o XP existente por spawn, sem farm após respawn. Nada abre por kill count.
- Pinturas offline de criaturas, afloramento, arco e atmosfera complementam o kit D. Três tiles de 1000×1000 são baked uma vez; os footprints ambientais continuam círculos simples. Um único tween anima as novas luzes e cada Spitter reutiliza um projétil com swept hit detection existente.
- Retornos locais em (2580,980) e (4600,740) preservam estado de sessão. O fragmento exterior reage a INVESTIGATE, sem XP/Echo: PATTERN: REPLY sugere comunicação estruturada sem definir lore. O arco prepara continuidade, sem First Echo ou Warden.
- Áudio usa Cavern no subterrâneo e Forest no exterior, pelo mesmo AudioManager. Controles, valores do combate, progressão e HUD estrutural continuam.

## Postura das criaturas e orientação em português, 0.1.36

- As criaturas de anatomia lateral não giram integralmente com a mira. Dois atlas pintados de oito poses mantêm postura e contato no chão; passada acompanha deslocamento real. Direção de ataque permanece independente da orientação visual. Valores e IA permanecem.
- Interface e mensagens do jogador usam pt-BR, preservando nome próprio do jogo e identificadores internos. Rótulos touch mudam sem alterar gestos ou proteções do navegador.
- ExplorationGuide fornece um próximo passo curto e uma etiqueta próxima ao ambiente, desde 0/3. A condição Ecos → fissura → mecanismo → entrada permanece; investigar fora de ordem explica o pré-requisito sem criar quest framework.
- Um pulso reutilizado evidencia o mecanismo pronto; desaparece na ativação. Cenário permanece baked e atlas são preparados offline. [Assets, verificação e limitações](playtest-readability/).

## Primeiro Eco e aproximação ao guardião, 0.1.37

- Um estado narrativo local registra o Primeiro Eco no exterior, além do arco existente. O arquivo contém uma assinatura humana já registrada; data e origem ilegíveis impedem estabelecer cronologia ou autoria. Não altera os 3 Ecos da Forest, XP, nível ou recompensas. [Sequência e validação](warden-preparation/).
- WardenApproach compõe o arquivo, inscrições e limiar fechado na mesma cena. A resposta finita de 5,2 segundos mantém o controle. Não há entidade, hitbox ou IA de Warden. Flags persistem nos mesmos ciclos de respawn; reload inicia sessão nova.
- Duas pinturas PNG 512×512 geradas offline usam a linguagem D. Uma cache 1400×1000 adicional captura solo e integrações; inscrições são desenhadas uma vez. Não há novos tweens infinitos ou listeners. MUSIC recebe um fator de foco local, reutilizando os sons ancestral/sinal existentes.
- Skitter e Crawler exteriores ocupam o desvio sul para reduzir perseguição na descoberta; IA e balanceamento permanecem. O checkpoint local após descoberta é (5430,740); oito footprints simples e o limite navegável mantém o portão fechado. Somente o limite horizontal da câmera acompanha a nova composição, sem mudar zoom/follow.

## Warden — encontro depois do limiar

- O portão da preparação passa a aceitar investigação depois do Primeiro Eco e conduz a uma área própria de 1200×740 usando a seleção de área da mesma `GameScene`. O boss ocupa essa nova bacia mineral; câmera, zoom e controles mantêm seu comportamento. [Conceito, valores e validação](warden-boss/).
- `Warden` implementa `Enemy`, reutilizando Health, dano, arco de ataque, varredura de projétil e colisões existentes. A máquina de estados local possui três fases e cinco padrões. Valores ficam em `config/warden.ts`: 900 HP, avisos de 1000–1250 ms, dano de 14–24 e recuperações de 1300–1500 ms. Não há summons, framework de IA ou alteração do kit do Warrior.
- A arena usa pinturas do kit D baked em uma RenderTexture de 1500×1060. Dezenove footprints delimitam formações; o selo de combate acrescenta apenas um. Projéteis e marcas de chão são poucos objetos reutilizados. A criatura usa oito poses raster preparadas offline, preservando postura em vez de girar uma ilustração lateral integralmente.
- Morrer reinicia o encontro na entrada segura em (650,760). Flags de acesso, Primeiro Eco e progressão permanecem; HP/fase/ataques/VFX do boss são reconstruídos limpos. A vitória persiste na sessão e não concede XP ou loot. O fragmento “RETORNO CONFIRMADO / DESTINO: ILEGÍVEL” avança o Signal sem definir autoria, idade do registro humano ou origem de Dante.
- Uma trilha original de 24 segundos é escrita e renderizada offline, sem samples externos. AudioManager seleciona Warden, usa cues finitos de Web Audio e preserva a pausa explícita após novos gestos de unlock. A saída do encontro continua usando a infraestrutura de áreas existente.

## Coesão e contato ambiental, 0.1.39

- A linguagem D permanece. Formações secundárias do exterior recebem escala menor; marcos monumentais, footprints, rotas e gameplay permanecem. Nenhum PNG foi alterado ou acrescentado. [Comparativos e validação](environment-cohesion/).
- Um frame na textura `world-shadow` existente recorta apenas seu padding transparente, permitindo sombras de contato centradas nas bases. Raízes, detritos rasos e sombra de transição são capturados nas RenderTextures, com menor contraste uniforme no solo.
- Vinte corpos estáticos da Cavern completa usam Images ordenadas pelos pés, sem update/tween próprio; massas de borda e detalhes continuam baked. Forest reutiliza suas bandas de depth. Não há nova textura GPU, iluminação global ou novo sistema de física.
- QA compara arrays de obstáculos, limites e zoom exatamente com a base anterior e reutiliza testes de percurso, Primeiro Eco, boss, respawn e entradas emuladas. A avaliação perceptual depende de playtest humano; contagens estáveis e compilação não demonstram autenticidade visual.

## Correção de chão e oclusão, 0.1.40

- A revisão 0.1.39 foi rejeitada perceptualmente. Cavern/arena passam a ter um substrato opaco contínuo, com material original de sedimento 512×512 produzido offline. Um TileSprite estacionário usa backing canvas 512×512 e repetição inversamente escalada; as caches capturam somente composição e contato. A paisagem com céu deixa de funcionar como piso no exterior. [Diagnóstico e comparativos](environment-cohesion/correction/).
- Altura de rochas e marcos diminui, preservando largura de base, footprints, interações e limites. Imagens elevadas que encobrem o Guerreiro atenuam seu alpha por interseção simples, restaurando-o ao sair. Lista visual local é reconstruída em cada criação da cena; sem listeners, timers ou tweens adicionais. Durante a abertura o portão mantém controle exclusivo do alpha.
- Forest mantém suas dimensões e seu terreno. Controle, combate, IA, Signal e estado narrativo permanecem. O QA compara física/câmera exatamente; aprovação visual depende de playtest humano.

## Integração de terreno e limiares, 0.1.41

- A revisão anterior ainda foi questionada perceptualmente. Sedimento com bordas suaves passa a conectar piso e bases nas caches existentes, com caminho quieto e margens mais escuras. A face/relay recebem altura menor sem mudar footprints. [Comparação, origem dos assets e QA](environment-cohesion/grounding-revision/).
- Dois PNGs originais de 512×256 substituem a pintura frontal alta dos limiares: apoios baixos e vão realmente transparente. A mesma família atende arco exterior, limiar e entrada da arena, com escalas locais. Imagens antigas permanecem disponíveis.
- O alpha da pintura elevada é amostrado em uma grade CPU de 32×32 preparada uma vez por textura. Aberturas transparentes não acionam o fade retangular antigo. Não há leitura de pixels, geração de arte, novo tween ou novo objeto por frame; física continua independente.
- Dados de colisão, limites, zoom, controles, combate, IA, progressão, áudio e narrativa permanecem. Aprovação visual exige playtest humano; os QA verificam percurso, oclusão, respawn e estabilidade, sem declarar hardware mobile/gamepad validado.

## Movimento touch e Vale da Ressonância, 0.1.42

- A superfície de movimento ocupa até 44% da largura/52% da altura, limitada a 380×280 CSS pixels, respeitando safe areas. A base acompanha o início do toque; somente sua pintura fica limitada à área segura. O gesto usa a posição real do dedo como origem e pointer capture mantém o arrasto além do círculo/área inicial. Soltar, cancelar, perder foco ou girar para portrait interrompe movimento. PC/gamepad e ações de combate permanecem.
- O portal responde depois da morte e transmissão do Warden. INTERACT seleciona uma área nova na mesma GameScene, reutilizando transferência de HP, restart, fade e estado de sessão. Há retorno pela mesma fenda e o boss derrotado permanece derrotado. Não há save permanente, sistema de quests ou novo framework.
- [Vale da Ressonância](resonance-valley/) possui layout próprio, rota principal, desvio norte e seis habitats. Casco Errante prepara uma varredura curta; Espinhante fixa direção e lança três espinhos evitáveis/bloqueados por obstáculos. Ambos implementam Enemy, usam Health/dano/colisão/XP existentes e oito poses pintadas offline, sem girar o corpo lateral com a mira. IDs 900–905 garantem XP único por habitat na sessão.
- Piso contínuo, sedimento, contato e kit D da revisão 0.1.41 compõem duas caches estáticas. Portal usa os apoios baixos com transparência real. Três PNGs originais novos somam cerca de 1,19 MiB comprimidos; sprites possuem oito frames de 256×256. As pinturas não são geradas em runtime. Projéteis usam pool fixo e varredura existente.
- O checkpoint local em (1860,570) fica fora da detecção dos habitats iniciais; flag de chegada preserva o retorno seguro após morte. O POI não concede XP nem novo Eco e sugere que o sinal atravessou com o jogador. O fim permanece promessa de continuação, sem resolver lore. Áudio reutiliza Forest/Signal; não há nova infraestrutura.

## Jornada local, habitats renováveis e bestiário, 0.1.44

- `LocalJourney` armazena um snapshot versionado em localStorage por descobertas, dano, derrotas, travessias e ciclo de página. Restaura progressão, flags narrativas, região/HP e dados do Vale; nível é derivado do XP. Retorno usa checkpoints existentes, sem salvar posição exata ou combate em curso. Dados inválidos e armazenamento indisponível mantêm o jogo utilizável. [Escopo e QA](dante-journey/).
- Apenas os seis habitats do Vale renovam moradores: 90 segundos após derrota e distância mínima de 480 unidades. IDs fixos e timestamps persistem em reload, morte e portal. Novo morador concede os 15 XP atuais; Forest/Cavern mantêm recompensa única por habitat. IA, valores, geografia, câmera, arte e colisões permanecem; nível máximo continua 3.
- `Bestiary` registra seis espécies vistas e derrotas; não concede bônus nem muda combate. `RecordsPanel` permite consulta pausada por B, botão touch/DOM ou botão 8 do gamepad. Abertura cancela gestos e carga existentes; fechar retorna foco ao canvas. Reinício exige confirmação e impede a gravação de saída de recriar o arquivo apagado. Não há conta, backend ou sincronização entre dispositivos.
- Três trechos existentes do Vale recebem registro de visita e sugestão no guia local. Não são quests, novas regiões, portas ou recompensas. Save não é escrito por frame; DOM muda ao abrir, mapas de habitats permanecem limitados a seis e listeners são removidos no shutdown. Bake/cache e pools de projéteis continuam intactos.

## Ritmo de expedição e progressão, 0.1.45

- [Expedições de Dante](dante-expeditions/) amplia somente o sistema atual: níveis 4/5 aos 360/660 XP, mantendo +10 PV por nível e restauração. Dano, ataques, cooldowns, velocidades, câmera, arte, colisões e controles permanecem. Novos níveis não escalam inimigos.
- Vale passa a oito habitats fixos: entrada solo, duas duplas opcionais e um trio na margem final. IDs 906/907 reutilizam Casco/Espinhante; a dupla sul e o trio ficam afastados da aproximação inicial ao checkpoint/POI. Renovação continua em 90 s e distância de 480, sem ondas, pathfinding ou porta por abates.
- Cada desvio concede 20 XP uma vez. `rewardedRoutes` é aditivo ao snapshot/schema v1 e ausente em saves antigos vira vazio; visitas anteriores permanecem e podem receber o bônus na primeira revisita. XP e bônus recebidos são salvos juntos, sem reset, nova chave de armazenamento ou migração destrutiva.
- Bestiário observado/estudado é derivado de seen/defeats existentes. Primeira derrota revela informação tática, sem bônus de atributos/XP. Registros mostram próximos benefícios e habitats conhecidos; depois de explorar, o guia permite expedição livre. Feedback usa textos reutilizados e timers canceláveis. Cenário permanece baked; nenhum asset novo foi criado.

## Densidade de HUD, 0.1.46

- [HUD compacto](hud-clarity/) substitui molduras azuis por dois pequenos apoios neutros, recursos nos cantos e um título/linha de orientação. Ganhos de XP mostram só número, sem origem ou caixa; mensagens narrativas mantêm conteúdo/duração. Ajuda temporária continua disponível nos Registros. Warden conserva avisos/vida/fase no alto.
- UI touch conserva alvos/gestos/captura e reduz decoração; fontes essenciais se ajustam à altura real do canvas FIT. Tipografia muda somente ao trocar a categoria de viewport. Não há assets, novos controles, alterações de combate, save, IA, mundo ou colisões.

## Referência jogável de qualidade, 0.1.47

- `/quality-reference.html` compara uma primeira câmara isolada com `?baseline=1`. Opção explícita de GameScene ativa somente a apresentação experimental; a URL normal mantém mundo, rigs e regras atuais. O laboratório não lê, escreve ou apaga o registro local do jogo.
- Um piso pintado original WebP 1536×1024 cobre todo o footprint possível da câmera, evitando emendas na borda da cache. Props, contato e sedimento são baked uma vez; rochas e face elevadas reutilizam ordenação/oclusão existentes. Os mesmos 37 footprints e limites da primeira câmara foram verificados.
- Articulação opcional do Guerreiro/Hollow e pool fixo de impactos usam os assets existentes. Posição lógica, arco de dano, timings, IA, câmera, controles e áudio permanecem. Nenhum novo sistema de combate ou iluminação global.
- [Comparações e QA](quality-reference/) registram resultados técnicos e limitações. O experimento continua Organic Sci-Fi R3/D, em 2D; não estabelece equivalência com um jogo 3D nem autoriza expansão sem playtest humano.

## Warrior pintado e poses, 0.1.48

- Após aprovar o ambiente da câmara e apontar que o Guerreiro permanecia igual, o usuário autorizou arte nova e sua aplicação também ao jogo principal. O [Warrior pintado](warrior-quality-reference/) usa 24 poses em três PNGs 1024×512, com materiais humanos, proporções mais alongadas e pernas/tronco articulados na pintura. Organic Sci-Fi R3/D continua sendo a identidade; não há importação de arte de outro jogo.
- `WarriorArt` seleciona direção/pose na Image existente, com quadros de caminhada por distância real, apoio dos pés registrado e corpo ereto. Mangas e rig contínuo das duas mãos no sabre são reutilizados com encaixe visual de ombros. Não altera input, posição lógica, hitbox, timings, dano, velocidade, colisões, câmera, IA, áudio, progressão ou save.
- Três texturas novas somam ~739 KiB comprimidos e ~6 MiB RGBA; recorte/registro/compressão são offline. Sem objetos, timers, tweens ou geração de textura adicionais por quadro. `?warrior=original` permite comparação no mesmo cenário aprovado; `?baseline=1` mantém o controle anterior. O ambiente experimental não foi espalhado pelo mundo. Playtest humano continua necessário para avaliar transições e proporções.

## Cavern entry environment from quality reference — 0.1.50

- A aprovação visual da Câmara de Referência foi aplicada à primeira sala jogável da Cavern: backplate ilustrado contínuo, bordas minerais, rochas com contato, raízes e a estrutura antiga, com o centro mais aberto para leitura de gameplay. A entrada e o túnel mantêm sua conexão para as áreas profundas.
- O backplate usa uma derivação alfa offline do piso existente. Uma faixa estreita nas bordas mistura a pintura com `cavern-soil`; não há tiling do backplate nem chão de retângulo aparente. Props continuam em bake estático e os poucos corpos elevados seguem como Images para foot sorting.
- Nenhum footprint, limite, spawn, POI, passagem ou regra de combate foi alterado. A aplicação é limitada à primeira sala; Deep Cavern, exterior, Vale e Forest conservam o ambiente que já tinham. A avaliação final de autenticidade requer playtest visual.

## Ground language across regions — 0.1.51

- A linguagem aprovada de piso ilustrado, massas de material, composição baked e caminho legível foi estendida sem repetir o mesmo material em todos os biomas. A entrada da Cavern mantém o backplate; todas as suas áreas usam o substrato pintado de pedra existente; os trechos exteriores e o Vale recebem solo vegetal; Forest usa seu próprio chão ilustrado com presença maior; a arena do Warden recebe pedra subterrânea pintada.
- A transição para o Exterior usa o mesmo asset de solo aplicado por máscara na composição estática já existente. Não há novo cenário por frame nem asset de imagem gerado nesta etapa. O backplate e os materiais são imagens; props seguem no bake/cache atual.
- A mudança só altera camadas visuais/de terreno. Não muda dimensões, posições físicas, colisões, spawns, gameplay ou identidade narrativa. A revisão por capturas em Chrome cobriu cada região e não registrou erros; repetição de textura em percurso longo e a mistura Cavern/Exterior ainda pedem playtest humano.

## Braços direcionais e sabre pintado, 0.1.49

- O teste humano encontrou que os braços de 0.1.48 mantinham postura e sobreposição frontal quando o corpo virava de costas. `WarriorArms` projeta ombros/pegada por vista, articula ambos os cotovelos e ordena membros/arma atrás do tronco nas costas; na lateral, braço distante fica atrás e próximo fica à frente. As duas mãos seguem os pivots contínuos existentes do sabre. [Comparação e QA](warrior-arm-pass/).
- Um atlas original de seis mangas/luvas e um sabre pintado somam ~108 KiB comprimidos/~448 KiB RGBA. Pintura é imagegen offline; registro de alpha e pivots em script local. Dois objetos adicionais dentro do rig, duas texturas, sem novos listeners, tweens ou geração de arte em runtime. Modos antigos preservam a renderização anterior.
- Somente apresentação e origem visual do cabo mudam. Ataques, dano, hitboxes, timings, alcance, movimento, colisões, IA, controles, câmera, save e progressão permanecem. QA agora verifica material e ordem de desenho por vista, além de pegadas durante golpes nas oito direções; aprovação visual exige teste humano.

## Expansão do Vale até a Escarpa da Ressonância — 0.1.52

- A antiga pista no limite leste do Vale agora conduz por uma passagem física para uma extensão contínua de ~2500 unidades. A câmera, o material de solo e a `GameScene` atuais continuam; a nova composição de cristas de pedra, minerais e raízes cria uma sub-região sem uma troca de tela. Dois desvios contornam a crista central e reencontram a rota principal.
- Quatro habitantes existentes, dois Casco Errante e dois Espinhante, foram distribuídos em dois grupos afastados. Compartilham IA, ataques, HP e XP já existentes. Combate não bloqueia o caminho. As formas grandes e minerais receberam colisores simples.
- Uma estrutura de escuta reage ao INTERACT com um eco recente cuja origem permanece além da escarpa. O limiar oriental mostra uma continuação desconhecida e permanece como fronteira da expansão; não revela a origem do sinal.
- `valleyFrontierReached`, `valleyFrontierSignalSeen` e `valleyFrontierEndSeen` são flags opcionais no snapshot local já versionado; saves anteriores continuam válidos. Ao alcançar a Escarpa, a morte/reload usa um checkpoint seguro na entrada. O portal de retorno ao Warden continua voltando para a entrada oeste do Vale.
- Os elementos são compostos offline nos quatro bakes estáticos existentes com imagens ambientais já carregadas. Sem geração de textura em runtime, nova IA, sistema de quest ou mudanças de combate. Capturas e relatório em [Expansion Sprint 03](expansion-sprint-03/).

## Progressão e especializações — 0.1.54

- O limite passa de 5 para 10, preservando XP e os limiares anteriores. Níveis 6–10 exigem 960/1300/1680/2100/2560 XP; PV cresce +5 por nível após o nível 5, chegando a 165. Níveis 4/6/8/10 concedem quatro pontos para escolher especializações do Sabre, Dash ou Carga Cinética, duas opções por habilidade e dois graus por opção.
- Bônus são aplicados aos parâmetros que o combate já consulta: arco/alcance do Sabre, recarga/duração do Dash, largura/força da onda. Não foram alterados controles, IA, dano base, hitboxes base ou sistemas de combate. Painel curto pausa durante a escolha e aceita teclado, gamepad padrão e touch.
- `abilityUpgrades` é um campo opcional no snapshot v1 local. Saves antigos permanecem válidos; pontos disponíveis são derivados do XP/nível e escolhas registradas são sanitizadas. A sessão continua persistindo por reload, morte e portal no armazenamento já existente.
- [Detalhes e QA](progression-specializations/). Typecheck/build e QA browser cobrem migração, escolhas e persistência; hardware físico requer playtest separado.

## Expansão oriental da Bacia do Siroco, 0.1.58

- A região árida cresce 2.250 unidades para leste no mesmo mapa. O relé passa a indicar continuidade; um marco opcional de rota concede 20 XP uma única vez, e a expedição só termina ao alcançar o portal leste. Habitantes permanecem evitáveis.
- O jogador recebe checkpoint seguro ao chegar à margem. O portal novo retorna ao portal do Vale; o portal oeste mantém o retorno anterior. Flags e recompensa usam o save local versionado existente.
- O piso ilustrado original é uma imagem WebP de 1536×1024 preparada offline e exibida em 2250×1500. A extensão é estática e baked em três bandas de depth, elevando a Bacia de três para seis RenderTextures. Não há geração de terreno por frame nem novos sistemas de combate.
- [Arte, fluxo e relatório de Chrome](expansion-sprint-05/). O QA inclui teclado, touch emulado, mock de gamepad, persistência, respawn e os dois portais; desempenho medido em Chrome headless não substitui playtest em aparelho físico.

## Orientação, personagens e expedições · 0.1.62–0.1.66

- Minimapa local e seta usam a geometria de navegação existente; cálculo de rota em grade cacheada não altera movimento ou IA. Tela inicial sem login e menu Esc mantêm até seis personagens com saves locais independentes. O personagem legado conserva a chave de armazenamento anterior.
- A pista do Soterrado agora abre acesso à Fratura Boreal, com dois desvios, dois arquétipos de criaturas pintadas, relé e checkpoint. Arte/áudio são preparados offline; terreno conserva bake e camadas de depth.
- [Descritivo oficial das classes](classes/) distingue Guerreiro, Star Hunter e Astral Manipulator. O Hunter é a segunda classe implementada: rifle com projéteis bloqueados por obstáculos, Momentum por movimentação em combate e menor resistência. A habilidade carregada foi revisada em 0.1.67, conforme abaixo. Mantém a superfície de ações atual e o kit do Guerreiro. Astral permanece como classe futura.
- [Cooperativo regional](regional-coop/): duas pessoas por sala; anfitrião simula combate/IA/progresso, visitante envia ações e interpola snapshots. Relay Node/WebSocket separado da build estática, sem framework de IA ou novo sistema de combate. O visitante usa temporariamente nível/aprimoramentos da jornada do anfitrião; seu save solo nunca é sobrescrito. Desconexão e troca de região encerram a visita, com retorno à jornada própria.
- Chefes/cavernas de campanha permanecem solo. Não há persistência multiplayer, migração de host, matchmaking ou suporte MMO. Serviço público exige deploy WSS separado; o QA desta etapa valida relay local real, dois navegadores, touch emulado e gamepad mock. Não houve playtest físico ou publicação de servidor público.
- `ws` é dependência do relay Node; o navegador usa WebSocket nativo. Playwright foi registrado como dependência de desenvolvimento para tornar os QAs reproduzíveis; atualização transitiva de `source-map-js` eliminou o alerta de auditoria sem migração de framework.

## Hunter: feixe perfurante e apoio dos p?s ? 0.1.67

- Q reutiliza o ciclo de carga existente, mas resolve um feixe instant?neo de 980 unidades, largura base 36 e multiplicador de dano 1,8 exclusivo do Hunter. Todos os inimigos interceptados recebem dano uma vez; o primeiro obst?culo s?lido/limite interrompe a linha. Quatro objetos visuais reutilizados exibem luz por 340 ms, saindo do cano pintado e terminando no ponto de colis?o. O rifle comum e o Guerreiro mant?m seus valores.
- Duas poses de corpo inteiro, substitu?das por uma pose est?tica ao atirar, causavam a sensa??o de deslizamento. Um kit ilustrado original separa torso/rifle e segmentos das pernas; deslocamento real conduz o ciclo, joelhos flexionam e o apoio alterna sem travar durante o tiro. Arte produzida offline, uma textura compartilhada, cinco Images por Hunter; sem tweens de caminhada ou gera??o de assets em runtime.
- O host resolve o dano no cooperativo; PartyPose transmite apenas a apresenta??o do feixe. A articula??o ? local nos dois clientes, usando posi??es simuladas/interpoladas. Sem segundo processamento de dano no visitante. [Kit, prompt e verifica??es](star-hunter/README.md).


## Hunter: alinhamento do rifle e ilustração contínua · 0.1.68

- Após feedback humano, o kit de coxas/canelas 0.1.67 foi substituído por poses do corpo inteiro, sem emendas nos joelhos. Recortes respeitam os intervalos reais da ilustração, não uma grade que corta as botas. O deslocamento efetivo conduz a caminhada, inclusive durante disparos; corpo não gira de cabeça para baixo.
- Rifle e braços ilustrados são independentes. `HunterRiflePose` define um eixo óptico comum para arma, cano, luz, traçadores e feixe. A visualização projeta esse eixo à altura da empunhadura; colisão/dano continuam no plano de gameplay existente, inclusive no host cooperativo. Nenhum valor de combate ou controle alterado.
- Prontidão/recarga do Q deixam de ser ocultadas pelo Momentum. Feedback reutiliza a linguagem do anel de carga do Guerreiro; snapshots já transmitem fase/nível para ambos os clientes. Atlas offline compartilhados, poucos elementos persistentes e um único Graphics reutilizado apenas durante a carga. [Arte, prompts, medidas e QA](star-hunter/README.md).
