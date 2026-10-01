# Echoes of Dante

Repositório: https://github.com/brunomafra-dev/EchoesofDante

Protótipo de action RPG sci-fi para navegador. O jogador explora Dante Forest, combate Hollows e investiga três Echoes. Depois de sincronizar os sinais, pode ativar a passagem antiga, explorar a Cavern e seguir o sinal além do desabamento. A direção Organic Sci-Fi segue a [Art Bible](docs/art-bible/).

A [World Shape Language](docs/WORLD_SHAPE_LANGUAGE.md) complementa a Art Bible com regras de massas, silhuetas e composição ambiental. É uma base documental para um futuro microprotótipo visual da Cavern; não altera o jogo atual.

O [Visual Prototype 02](docs/visual-prototype-02/) registrou o experimento que testa uma formação orgânica de cerca de 180×170 unidades na primeira Cavern, em (885, 595). A representação geométrica foi rejeitada no playtest; o experimento permanece como controle no laboratório.

O [Visual Rendering Prototype 01](docs/visual-rendering-prototype-01/) compara Graphics, raster, ilustração e composição híbrida em uma única rocha. Abra `/rendering-lab.html` na mesma build web para ver o laboratório isolado. O usuário aprovou **D — Hybrid** como referência: assets ilustrados, materialidade, sombra de contato e integração ambiental. A aplicação ao mundo será incremental, preservando Organic Sci-Fi R3 e gameplay.

## Stack

- TypeScript, Phaser 3 e Vite
- PNGs pintados em `public/assets/visual/characters/` para personagens e em `public/assets/visual/environment/` para cenários; composição estática baked/cacheada
- Loops musicais autorais de protótipo em `public/assets/audio/`; efeitos curtos são sintetizados com Web Audio
- Barlow Condensed e DM Sans carregadas via Google Fonts, com fallback local
- Sem backend, persistência ou multiplayer

## Instalar e executar

Requer Node.js com npm.

```bash
npm install
npm run dev
```

Abra a URL local indicada pelo Vite. Para validar o pacote de produção:

```bash
npm run build
npm run preview
```

A [integração da linguagem D nos ambientes](docs/environment-art-pass/) aplica texturas pintadas a Forest, Cavern e área profunda: pedra, raízes, minerais, vegetação e bases antigas, com comparativos antes/depois. Cenário estático continua baked, e os mesmos colisores, rotas, interações e sistemas de gameplay permanecem. A nova aplicação ainda precisa de playtest visual humano.

A [passagem de arte do Warrior e Hollow](docs/character-art-pass/) aplica o tratamento pintado aprovado no cenário aos personagens. Preserva o Warrior em pé, as duas mãos no sabre e os rigs existentes. Os comparativos incluem oito direções de mira, caminhada, ataque, carga e Dash; a aprovação visual desta passagem depende do playtest do usuário.

## Controles

| Ação | Teclado e mouse | Gamepad padrão | Touch em landscape |
| --- | --- | --- | --- |
| Mover | W A S D | Analógico esquerdo | Controle esquerdo |
| Mirar | Mouse | Analógico direito | Arraste a partir de STRIKE ou CHARGE |
| Saber Strike | Clique esquerdo; segure para repetir | RT/R2 | Toque STRIKE ou arraste e solte |
| Void Dash | Espaço | RB/R1 | DASH |
| Kinetic Charge | Segure Q; solte para disparar | Segure LT/L2; solte | Segure CHARGE, arraste para mirar e solte |
| Investigar quando próximo | E | A/Cross | INVESTIGATE contextual |
| Respawn | R ou botão na tela | Start ou botão na tela | RESPAWN |

A entrada ativa muda conforme o dispositivo usado, sem recarregar a página. Gamepad usa o mapeamento `standard` da Gamepad API e deadzone nos analógicos; a mira conserva a última direção quando o analógico direito volta ao centro. A mesma build web é usada em todos os casos; não há aplicativo nativo nem suporte oficial a Xbox ou mobile físico nesta etapa.

No touch, o joystick esquerdo move e os botões da direita controlam o combate, sem joystick permanente de mira. STRIKE dispara uma vez ao soltar: um toque usa a última direção de combate; um arrasto de pelo menos 12 pixels CSS escolhe outra direção e mostra a área aproximada do golpe. CHARGE inicia a preparação ao pressionar, permite mirar por arrasto e dispara ao soltar. Sem uma direção touch escolhida, usa a mira já disponível. DASH conserva a regra existente: direção de movimento ou mira quando parado. INVESTIGATE e RESPAWN aparecem apenas no contexto apropriado.

Os gestos capturam o ponteiro até o release, inclusive fora do botão. Cancelamento do ponteiro, perda de foco, mudança de orientação ou método de entrada interrompem a preparação sem disparar a onda. Em portrait, uma indicação pede rotação para landscape; botões respeitam safe areas. O canvas e os controles consomem gestos de zoom/scroll/seleção, incluindo double-tap e pinch; a prevenção não é aplicada ao documento inteiro nem usa `user-scalable=no`.

### Playtest pendente no iPhone

A emulação de touch no Chrome não comprova o comportamento do Safari em hardware real. Na mesma URL, em landscape, verificar: taps rápidos e repetidos; movimento junto com STRIKE arrastado; CHARGE segurado, arrastado e solto; DASH; investigação e respawn; pinch e arrastos verticais sem mudar o zoom ou rolar a página. Girar para portrait durante um gesto deve cancelá-lo e mostrar a orientação de rotação. Conferir também notch e área segura inferior.

## Áudio

A música de exploração usa dois loops instrumentais curtos e originais, Forest e Cavern, com o mesmo motivo de sinal em atmosferas diferentes. São protótipos, reproduzidos de arquivos WAV locais e reproduzíveis pelo script `python scripts/generate-prototype-audio.py`; não usam samples externos. O `AudioManager` mantém uma única música ativa, separa MUSIC de SFX e possui níveis internos MASTER/MUSIC/SFX em `src/config/audio.ts`. Os efeitos existentes continuam com Web Audio; sinal e mecanismo receberam variações discretas. O jogo funciona sem áudio e só tenta iniciar a reprodução após um gesto do jogador, respeitando o bloqueio de autoplay do navegador.

## Escopo implementado

- Fundação web multiplataforma: `Controls` traduz teclado/mouse, gamepad padrão e interface touch em movimento, mira, ataque, Dash, Kinetic Charge e investigação. A cena continua a usar as mesmas regras de Player, combate, colisão e progressão.
- The Signal: após o terceiro Echo, os três locais pulsam em violeta e uma fissura antiga no fim da trilha norte começa a emitir sinal. Investigar a fissura revela `SIGNAL SOURCE: BELOW / PASSAGE: SEALED` e torna o mecanismo próximo responsivo.
- The Sealed Passage: investigar o mecanismo depois de 3/3 Echoes faz um sinal violeta percorrer a pedra até a fissura; em seguida as placas se abrem e a colisão é removida. Caminhar pela abertura leva à Cavern. HP atual, XP, nível e Echoes acompanham a travessia; o respawn ocorre na Cavern e conserva o estado da sessão.
- Cavern Depths: a área de aproximadamente 1200×740 unidades possui descida de entrada, bacia mineral lateral, caminho principal, face antiga e um corredor curto até um desabamento visível. Dois Hollow Crawlers habitam zonas diferentes; é possível avançar sem derrotá-los. Aproximar-se da segunda abertura indica que o sinal continua abaixo, sem iniciar outra região ou conceder recompensa.
- The Deep Signal: ao chegar ao desabamento, inscrições violetas acendem e duas placas deslocam-se, revelando uma passagem curta. Além dela há um bolso subterrâneo de cerca de 700 unidades, onde raízes e minerais cobrem uma estrutura antiga parcialmente enterrada. O sinal se intensifica sem conceder XP ou explicar sua origem. A travessia, o ponto de interesse e o retorno não exigem derrotar Hollows; o acesso permanece aberto após morrer na mesma sessão.
- Três Echoes de sessão: ruína norte, sinal mineral a leste e vestígio antigo no desvio oeste. Aproximar-se mostra `[ E ] INVESTIGATE`; cada descoberta exibe um pulso e uma mensagem curta, atualiza o contador e concede 40 XP apenas uma vez por sessão. A mensagem original da ruína permanece.
- Progressão curta: cada Hollow derrotado pela primeira vez em seu ponto de spawn concede 15 XP. Nível 2 aos 60 XP e nível 3 aos 140 XP; cada nível concede +10 de HP máximo e restaura o HP. O HUD mostra nível, XP e Echoes 0–3. Morte/respawn preserva esse progresso; atualizar a página inicia uma nova sessão.
- Kinetic Charge: segurar Q carrega energia sem deslocar o Warrior; soltar lança uma onda de corte ciano/branco na direção atual da mira. Ela começa à frente do Warrior, tem 120 unidades de largura e avança 133 unidades, a distância percorrida pelo Void Dash em terreno livre. Carga de até 800 ms, dano de 50 a 76, recuo de 500 unidades/s e cooldown de 3,2 s. Cada Hollow recebe no máximo um impacto por onda. A carga não concede invulnerabilidade; LMB, movimento e Dash voltam após o gesto de 200 ms, mesmo enquanto a onda ainda avança.
- Energy Saber: a mão principal e a mão de apoio acompanham dois pontos do mesmo cabo no `bodyRig`. O braço de apoio dobra no cotovelo para manter as duas mãos legíveis em todas as direções, sem alterar alcance, arco, dano ou janela do Saber Strike.
- Quatro Hollows, em dois pares, percorrem rotas curtas nas clareiras central e leste. Ao perceber o jogador, usam a perseguição e o combate existentes; ao perder contato, voltam ao ponto inicial e retomam a patrulha. Os demais continuam em seus postos.
- A formação mineral a leste continua emitindo um pulso breve e discreto; o Echo no local adiciona investigação sem interromper o fenômeno.
- First Discovery: estrutura parcialmente soterrada nas ruínas do norte, inscrições, fragmentos e vegetação. Investigar produz um pulso, som opcional e a mensagem temporária “SIGNAL DETECTED / SOURCE: UNKNOWN”. As inscrições permanecem acesas após o respawn na mesma sessão.
- Dante Forest de 2200×1500 unidades: entrada ao sudoeste, trilha principal rumo às ruínas ao norte e desvios para uma árvore maior a oeste e uma formação mineral a leste. Clareiras conectadas, vegetação em camadas e bancos de rochas delimitam o espaço; câmera suave e zoom preservados.
- O solo e os desenhos estáticos da floresta são renderizados uma vez em camadas. Copas e troncos usam PNGs compartilhados; rochas, sombra de contato e raízes pintadas são capturadas nas camadas estáticas. Profundidade e animações existentes foram preservadas.
- Galactic Warrior com capacete destacado, torso, braços e duas pernas visíveis. O corpo permanece ereto em vistas frontal, lateral e traseira; o sabre continua seguindo a mira e as pernas mantêm o ciclo de passos. Sombra, HP, movimento, dash e invulnerabilidade breve permanecem.
- Oito Hollow Crawlers distribuídos em quatro pares ao longo da exploração, com carapaça e membros orgânicos pintados em PNG e núcleo quente. Detecção, perseguição, preparação do ataque, reação ao dano e morte continuam iguais. A entrada fica fora do alcance inicial de detecção.
- Golpe com preparação, varredura e recuperação; arco e trail ligados à posição da lâmina; dano aplicado durante a varredura. Contato curto orientado pelo sabre, contração e recuo visual do Hollow, números de dano, efeito de início/fim do dash, HUD de exploração, sons opcionais e tela de respawn.

## Limitações conhecidas

- A Cavern contém a primeira área e um pequeno bolso profundo. A face antiga e a estrutura profunda são pontos visuais; o limite após a estrutura não tem outra região jogável nesta versão.
- O nível está limitado a 3 e o progresso existe somente na aba atual: recarregar a página reinicia XP, Echoes e recompensas. Não há salvamento.
- A onda usa uma faixa frontal móvel e não tem interação especial com rochas. Seus valores e a naturalidade das poses do braço ainda precisam de avaliação humana em combate.
- HUD e Energy Saber receberam apenas o feedback necessário para a habilidade; sua arte base, Mineral Pulse, First Discovery e parte do terreno ainda são provisórios.
- Touch e gamepad foram validados em emulação de navegador; conforto e compatibilidade em dispositivos físicos ainda exigem playtest. Não há suporte oficial a navegadores de console, builds nativas, remapeamento de botões ou menu de volume.
- Os dois temas musicais são protótipos instrumentais. Vocal atmosférico, mixagem final e camadas adaptativas de combate/descoberta permanecem para avaliação futura.
- Os inimigos derrotados só retornam ao reiniciar a arena.
- Troncos, totens e bases estruturais possuem colisores circulares simples; copas, vegetação baixa, raízes e pequenos detalhes continuam atravessáveis. A classificação e a auditoria estão em [Environmental Collision Audit](docs/ENVIRONMENT_COLLISION_AUDIT.md).
- A IA mantém perseguição direta, sem navegação por caminhos; Hollows podem ficar presos em rochas ao perseguir fora das trilhas.
- A câmera e a arte usam visão superior 2D, sem profundidade isométrica real.
- O ciclo de passos usa transformações de formas 2D; a articulação das botas ainda é simples e precisa de avaliação humana em movimento.
- As fontes web dependem de conexão; o jogo usa fonte alternativa do sistema se não carregarem.
- O build inclui o Phaser em um único bundle grande; o Vite avisa sobre tamanho do chunk, embora a saída seja válida.
- O carregamento inicial ainda precisa preparar as texturas da cena; a auditoria mediu cerca de 1,8 segundo até a cena ficar disponível no Chrome headless testado. A composição em faixas de 100 unidades pode mudar levemente a sobreposição de rochas e pequenos elementos em relação ao desenho original.

## Próximos passos

Fazer playtest físico com gamepad e aparelhos touch em landscape para ajustar ergonomia, legibilidade e mixagem antes de declarar suporte oficial. O desempenho em outra GPU pode ser diferente do Chrome headless medido nos testes.

As decisões técnicas desta sprint estão em [docs/technical-decisions.md](docs/technical-decisions.md).
