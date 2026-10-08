# Star Hunter — segunda classe jogável

Escolha **Star Hunter** ao criar um personagem no menu. Jornada e XP ficam separados do Guerreiro.

## Kit

- Rifle de pulso: clique/RT/DISPARO lança um projétil mirando livremente, 22 de dano base, 700 de alcance, 340 ms entre tiros. Rochas e estruturas bloqueiam; não há auto-aim.
- Momentum: movimentação real perto de ameaças gera até 100. Parar deixa o recurso decair. Disparos consomem 9; feixe consome 35. O recurso concede até 35% de dano adicional, aplicado no lançamento.
- Passo de fase: mesma semântica direcional de esquiva, recarga base 1450 ms.
- Feixe de luz: segure **Q / LT / FEIXE**, mire e solte. Disparo instantâneo de 980 unidades, largura base 36, atravessando todos os inimigos na linha. Obstáculos sólidos e limites do mapa interrompem o feixe. Dano base **90–137**, conforme carregamento, antes dos upgrades e do Momentum. Mantém carregamento máximo de 800 ms e recarga de 3200 ms. O brilho dura 340 ms e não reaplica dano. Sem auto-aim.

Movimento 275, vida 80% do Guerreiro no mesmo nível. Resistência menor exige controle de distância. Saber e valores do Guerreiro permanecem iguais. Upgrades existentes possuem apresentação e efeito próprios no rifle, alcance e feixe. Expansão acrescenta 8 unidades de largura por grau; potência aplica o multiplicador 1,8 aos mesmos acréscimos de carga, antes do Momentum.

## Arte

Na revisão **0.1.67**, um kit original pintado separa torso/rifle, coxas e canelas/botas em frente, costas e perfil. Quadris e joelhos articulam o apoio alternado, guiados pelo deslocamento efetivo. O tiro não congela as pernas. Marcha para quando o personagem está bloqueado/parado; dash não acelera o ciclo artificialmente. Corpo e arma permanecem erguidos, sem rotação de cabeça para baixo.

Atlas **1280 × 768**, quinze células 256 × 256, **584.585 bytes**. `scripts/prepare-hunter-rig.py` apenas recorta, dimensiona e empacota a ilustração original produzida offline com imagegen. Fonte: `source-art/hunter-rig-source.png`; prompt: [hunter-rig-prompt.md](hunter-rig-prompt.md). Cinco Images por personagem reutilizam a mesma textura; não há geração de arte em runtime. O atlas anterior fica preservado para histórico/rollback.

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
