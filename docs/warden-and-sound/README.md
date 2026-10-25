# Warden e o som de Dante · 0.1.149

**Combate rejeitado no playtest:** o usuário apontou golpes fracos e falta de animação no impacto. A [revisão 0.1.150](../warden-revision-02/README.md) substitui o piloto do Warden descrito abaixo. A música é preservada e não recebe aprovação estética por inferência.

[Warden vivo](https://echosofdante.vercel.app/campaign-playtest.html?warden=1&v=0.1.149) · [Escutar a mixagem](https://echosofdante.vercel.app/soundtrack-playtest.html?v=0.1.149) · [Biblioteca](https://echosofdante.vercel.app/test-library.html)

## Autorização e escopo

Em 25/10/2026, o usuário aprovou os percursos e pediu bosses que exijam decisões, sem dicas explicando a solução. Aprovou começar pelo Warden como piloto e acrescentou música agradável, volume menor e tensão no começo do combate. Esta prioridade antecede os capítulos da permanência. Os outros três bosses recebem somente a seleção/mixagem musical e o HUD sem instruções de solução; suas mecânicas novas aguardam o playtest deste piloto.

## O encontro

O Warden conserva HP, dano, fases, ataques, requisitos, colisões e recompensa. A carapaça rejeita golpes vindos do setor frontal de 230,4 graus. Durante preparação/execução, sua orientação fica comprometida; o setor posterior aceita dano. Na recuperação, recolhe a carapaça, abre o núcleo com uma pose inteira existente e recebe 135% de dano de qualquer direção. Não há montagem de membros.

Três impactos frontais em até 6,5 s acumulam pressão durante repouso/preparação. No repouso seguinte, provocam impacto próximo ou investida distante com o aviso original completo. A pressão antecipa uma decisão; não aplica dano instantâneo nem exige uma classe, elemento ou aliado. O ciclo normal continua sem pressionar a carapaça.

O caminho de dano autoritativo usa o ângulo de viagem do golpe/projétil. Campos do Astral fornecem a origem radial; o companheiro fornece sua própria origem. Deslocar o atirador depois do disparo não muda o lado do impacto. Afinidades, equipamentos, invulnerabilidade e recibos continuam no fluxo existente.

Arco com marca direcional e brilho comunicam a carapaça; pose/cor mostram recuperação. Bloqueio gera som curto e faísca, sem número zero ou explicação. Avisos têm assinaturas distintas; o núcleo responde com som ascendente. HUD mostra o nome do ataque, sem “saia da marca”, “janela para atacar” ou “leia o movimento”. Geometria da carapaça desenhada uma vez; terrenos aprovados preservados.

## Composição e referências

Vinte composições originais substituem os loops anteriores no jogo. Ambientes usam guitarra de nylon/piano, cordas, cello e frases espaçadas de madeira/vibrafone. Cordas graves, pizzicato e tímpano contido diferenciam os quatro encontros. Cada região tem tonalidade, andamento e sequência próprios; pausas e mudanças de densidade entre seções. Aproximadamente 101–131 s por faixa, estéreo 44,1 kHz/128 kbps; sem geração musical no browser.

Fontes dos criadores consultadas: [Diablo II / Matt Uelmen](https://diablo.bandcamp.com/album/diablo-ii-original-soundtrack), [Kamil Orman-Janowski / Path of Exile](https://kamilormanjanowski.com/) e [Koji Kondo / Nintendo sobre efeitos e instrumentos](https://www.nintendo.com/us/whatsnew/ask-the-developer-vol-11-super-mario-bros-wonder-part-2/). A interpretação aplicada a Dante privilegia atmosfera, identidade e sons que comuniquem ações. Nenhuma melodia/gravação desses jogos foi reutilizada; não se afirma qualidade equivalente à produção deles.

[Script de autoria](../../scripts/compose-dante-score.py), [MIDI e medições/hashes](score/measurements.json). Renderização local com FluidSynth 2.6.1 e GeneralUser GS 2.0.3 de S. Christian Collins; [fonte do banco](https://github.com/mrbumpy409/GeneralUser-GS), [licença integral](GeneralUser-GS-LICENSE.txt). Sem dependências novas no jogo; o banco fica fora da build. Dois ciclos são renderizados e o segundo é exportado para carregar as caudas de reverberação na volta do loop.

## Mixagem

Sliders salvos preservados. Trim de 0,55 na exploração e 0,42 nos encontros: com os valores padrão, volumes HTMLAudio de 0,2112 e 0,16128. Fontes com RMS próximo de 0,065 antes do filtro final; não é volume acústico medido no aparelho. Avisos reduzem a música a 42% por intervalo finito, com liberação suave de 700 ms; introdução/fase também reservam espaço. O ducking é independente do foco de menus/reconexão e nunca desfaz o mute.

MASTER/MUSIC/SFX mantêm zero exato. Máximo de 12 vozes SFX, osciladores desconectados ao terminar, impactos/bloqueios com frequência limitada. No máximo duas músicas no crossfade de 1,6 s; mudanças rápidas liberam fontes antigas. Sem scheduler musical, síntese instrumental ou desenho estático por frame. Arquivos são carregados conforme a região.

Antes do limiar, a arena usa a aproximação. O encontro real seleciona a trilha tensa, inclusive quando provocado pelo visitante. O estado de morte mantém a seleção e permite o silêncio de vitória existente. Respawn/retorno conservam seu ciclo. Cinemática e vozes não foram remixadas.

## Laboratório e simulações

`campaign-playtest.html?warden=1` usa sessionStorage separado por classe; personagens/configurações reais não são lidos nem gravados. Simula três Ecos, mecanismo, percurso subterrâneo, Primeiro Eco e portão. Considera entregues os três relatórios anteriores e mantém “Além da fissura” aberto. Warden vivo, sem vitória, recibo ou portal liberado. Recomeço restrito ao laboratório; nenhum atalho novo na campanha.

Coop: criar equipe pelo início, compartilhar convite e, com todos presentes, usar RECOMEÇAR WARDEN VIVO no anfitrião. O visitante não prepara a campanha; convites conservam isolamento. A página de escuta usa o mesmo AudioManager, sem escrever configurações. Seus botões são controles de audição, não pistas no jogo.

## QA técnico e aprovação humana

Evidências em `qa/`: dano frontal/flanco/recuperação pelos kits reais, pressão/aviso completo, dano do boss, quatro resoluções, derrota/renascimento, vitória/XP único/reload; dupla em dois processos Chrome com relay local real, golpes do visitante, apresentação, música e recibos; touch CDP nas quatro classes, gamepad mock e layouts compactos. Fixtures explícitas de posição/estado/HP isolam as regras; o teste de controles congela o boss vivo. Não são partidas humanas integrais.

Áudio: vinte faixas decodificadas, picos medidos, reprodução/loop, mute, crossfade, ducking e descarte. Preferência sonora, tensão e leitura dependem de escuta/playtest humano. Não afirmar hardware mobile, equipe humana de quatro ou duração medida da campanha.

Protocolo 15 preservado: arco e pose viajam no BossVisual existente; feedback de bloqueio usa impacto de dano zero existente. Sem migração de save/recibo ou necessidade técnica de intervenção Render.

A inspeção visual encontrou uma regressão anterior no visitante: Phaser inclui um booleano no comando ARC; o filtro numérico removia esse operando e deslocava os comandos seguintes. A captura agora converte booleanos em 0/1 na mesma posição; comandos inválidos são descartados em conjunto. O QA compara o fluxo completo do anfitrião com o renderizador do visitante, além da captura visual corrigida.

| Verificação | Evidência |
|---|---|
| Combate, quatro kits, derrota, vitória única e reload | [mechanics.json](qa/mechanics.json) |
| Dupla real local, geometria idêntica, recompensa e reconexão | [coop.json](qa/coop/coop.json) |
| Vinte trilhas, loops, volumes, mute e descarte | [audio.json](qa/audio/audio.json) |
| Touch nas quatro classes, gamepad mock, layouts e reinícios | [controls.json](qa/controls/controls.json) |
| Build compilada sem globals DEV, links e áudio | [public.json](qa/compiled/public.json) |

Capturas de aproximação, preparação, recuperação e visitante foram inspecionadas visualmente. `npm run typecheck`, `npm run build` e `git diff --check` compõem os checks de entrega; o build conserva o aviso conhecido de tamanho do chunk Phaser. QA técnico não é aprovação humana.

- [ ] Aprovação humana da música, volume, tensão e leitura do Warden.
- [ ] Após aprovação, escolher o próximo boss; não antecipar suas mecânicas.
