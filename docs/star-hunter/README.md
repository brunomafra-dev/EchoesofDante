# Star Hunter — segunda classe jogável

Escolha **Star Hunter** ao criar um personagem no menu. Jornada e XP ficam separados do Guerreiro.

## Kit

- Rifle de pulso: clique/RT/DISPARO lança um projétil mirando livremente, 22 de dano base, 700 de alcance, 340 ms entre tiros. Rochas e estruturas bloqueiam; não há auto-aim.
- Momentum: movimentação real perto de ameaças gera até 100. Parar deixa o recurso decair. Disparos consomem 9; feixe consome 35. O recurso concede até 35% de dano adicional, aplicado no lançamento.
- Passo de fase: mesma semântica direcional de esquiva, recarga base 1450 ms.
- Feixe de luz: segure **Q / LT / FEIXE**, mire e solte. Disparo instantâneo de 980 unidades, largura base 36, atravessando todos os inimigos na linha. Obstáculos sólidos e limites do mapa interrompem o feixe. Dano base **90–137**, conforme carregamento, antes dos upgrades e do Momentum. Mantém carregamento máximo de 800 ms e recarga de 3200 ms. O brilho dura 340 ms e não reaplica dano. Sem auto-aim.

Movimento 275, vida 80% do Guerreiro no mesmo nível. Resistência menor exige controle de distância. Saber e valores do Guerreiro permanecem iguais. Upgrades existentes possuem apresentação e efeito próprios no rifle, alcance e feixe. Expansão acrescenta 8 unidades de largura por grau; potência aplica o multiplicador 1,8 aos mesmos acréscimos de carga, antes do Momentum.

## Arte · revisão 0.1.68

O teste humano rejeitou as pernas finas/segmentadas e o rifle preso ao torso da revisão 0.1.67. Agora o corpo utiliza **12 poses inteiras pintadas**, com coxas, joelhos e botas contínuos, em frente/costas/perfil. Deslocamento real conduz quatro poses de caminhada; parar ou ficar bloqueado interrompe o ciclo. Disparar não congela a marcha. Os recortes seguem as margens transparentes reais, preservando botas e cabelo; cabeça/torso têm alinhamento constante.

O rifle é uma Image independente, com braços e luvas ilustrados acompanhando as duas empunhaduras. Sua rotação acompanha continuamente a mira. Frente/costas/perfil possuem ordenação própria; mirar para a esquerda preserva o lado superior da arma. Cano, brilho, projéteis e feixe compartilham `HunterRiflePose`. O feixe mantém a direção da mira, em vez de curvar a linha até o antigo rifle fixo. A projeção óptica na altura da arma é separada do raio de colisão no plano do chão: dano, alcance e obstáculos mantêm seus contratos.

**Q/LT/FEIXE:** HUD mostra PRONTA, porcentagem durante hold e segundos de recarga. Momentum fica separado. Um anel de carga como o do Guerreiro, barra e luz no cano mostram o progresso; 100% fecha o anel. Soltar dispara. Feedback também é usado no cooperativo, sem novo processamento de dano.

- `star-hunter-body-v2.png`: **1024 × 768**, 12 células 256 × 256, **454.598 bytes**.
- `star-hunter-weapon-v2.png`: **512 × 768**, 6 componentes, **215.650 bytes**.
- Dois atlas compartilhados: aproximadamente **4,5 MiB RGBA**; 10 elementos reutilizados por apresentação de Hunter. Nenhum tween de caminhada, geração de textura ou cenário redesenhado. Apenas um Graphics pequeno desenha o anel enquanto está carregando.
- Fontes originais offline: `source-art/hunter-body-v2-source.png` e `source-art/hunter-weapon-v2-source.png`. Prompts: [corpo](hunter-body-v2-prompt.md) e [arma](hunter-weapon-v2-prompt.md). `scripts/prepare-hunter-v2.py` apenas recorta, dimensiona e empacota, preservando alpha. Arte/kit 0.1.67 permanecem para histórico e rollback.

Tentativas adicionais de contatos de caminhada foram descartadas: uma repetia poses, outra alterava a proporção do corpo. Não foram incorporadas ao runtime.

## QA

Typecheck/build passam. O aviso conhecido de tamanho do bundle Phaser continua presente; não há nova dependência.

Revisão 0.1.67, Chrome headless:

- `qa-hunter-beam.mjs`: três inimigos reais alinhados recebem 137 de dano cada, uma vez. Cobertura bloqueia os alvos posteriores; feixe respeita direção, limites, recarga e cancelamento na pausa. Pernas articulam durante tiros e param quando o personagem para. Quatro resoluções; cinco disparos adicionais sem crescimento de objetos/tweens após os impactos desaparecerem. Aproximadamente **59,7 FPS**, 383 objetos e 24 tweens, iguais antes/depois no cenário de teste.
- `qa-star-hunter.mjs`: menu real, save separado, rifle/dano/XP, cobertura, Momentum, bloqueio de movimento durante carga, release, esquiva e respawn. Gamepad mock testa RT e **LT hold → release do feixe**; touch CDP testa joystick, arrasto do rifle, **FEIXE hold → drag → release**, esquiva e escala do viewport. Aproximadamente **60 FPS**.
- `qa-hunter-beam-coop.mjs`: dois Hunters em clientes Chrome independentes, relay WebSocket local real. Feixes do visitante e do anfitrião atingem os três alvos na simulação do host, aparecem nos dois clientes e não duplicam dano. Caminhada articulada do visitante também é apresentada.
- `qa-coop-warrior.mjs`: Guerreiro visitante/Hunter anfitrião, Sabre, onda cinética, esquiva, registros e cancelamento da carga pela pausa preservados.
- `qa-dante-journey.mjs`: Forest → três Ecos → fissura → Cavern → profundezas → exterior → First Echo → Warden → Vale; progressão, recarga, registros, três respawns e teclado/mouse/gamepad mock/touch emulado. Aproximadamente **58,5 FPS** no Vale.

Zero erros JS/assets nesses testes. Relatórios e capturas em [beam-qa/](beam-qa/). [Vídeo de combate e articulação](beam-qa/hunter-beam-walk.webm). Os alvos, posições e expiração de cooldown de algumas verificações são controlados em DEV, conforme registrado nos scripts; não representam um playtest humano contínuo.

O Guerreiro mantém seu kit e apresentação anteriores; mapas, colisões, IA e progressão não foram modificados.

## Limitações

Não houve playtest físico desta revisão, nem iPhone/gamepad físico disponíveis. A sensação da passada e o balanceamento do feixe precisam de avaliação humana. A articulação é uma aproximação 2D, com três vistas e perfil espelhado; não é animação esquelética 3D. Oito projéteis e quatro elementos visuais do feixe são reutilizados. Momentum reinicia no respawn/pausa para impedir disparos pendentes. Sem crítico aleatório ou marcação nesta primeira versão. Coop foi validado no relay local, sem teste público de latência de Internet.

Astral Manipulator está documentado como classe oficial futura; não é anunciado como jogável nesta etapa.

## QA · alinhamento e carga 0.1.68

Relatérios/capturas em [alignment-qa](alignment-qa/): oito direções de mira, corpo inteiro em movimento, origem do feixe no cano, Q pronto → carga parcial → 100% → disparo → recarga → pronto, estabilidade após cinco cargas. Tamb?m regressão do rifle, cobertura, dano, Momentum, XP, Dash, respawn, quatro resoluções, gamepad mock, touch emulado e dois clientes cooperativos usando relay local real.

A animação utiliza quatro poses por vista; não é animação esquelética completa. Automação e inspeção das capturas verificam alinhamento e cortes, mas a sensação de caminhada ainda deve ser avaliada jogando. Nenhum iPhone ou gamepad físico disponível neste ambiente.

**Resultados:** typecheck/build aprovados. Chrome: testes de alinhamento, Hunter, feixe, dupla Hunter/Hunter, dupla Hunter/Guerreiro e jornada até Warden/Vale aprovados, sem erros JS ou de assets. A jornada usa posições e expiração de cooldown controladas em DEV; não representa playtest humano de dificuldade. 386 objetos de cena e 24 tweens, iguais antes/depois de cinco cargas; aproximadamente 60 FPS no trecho Hunter e 58,4 FPS no Vale. Quatro resoluções: 1280×720, 1366×768, 1920×1080 e 844×390. O ambiente não disponibiliza iPhone/gamepad físico.

Capturas: [costas/diagonal](alignment-qa/direction-1.png), [perfil](alignment-qa/direction-0.png), [carga completa](alignment-qa/fully-charged.png) e [touch emulado](alignment-qa/regression/touch-charge.png). [Vídeo de caminhada/combate automatizado](alignment-qa/beam/hunter-beam-walk.webm).
