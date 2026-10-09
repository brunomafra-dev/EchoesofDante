# Expedição glacial · 0.1.76

## Jogar

**Acesso direto isolado:** [`/glacier-playtest.html`](https://echosofdante.vercel.app/glacier-playtest.html). Para ir direto ao boss: [`?area=icenest`](https://echosofdante.vercel.app/glacier-playtest.html?area=icenest). Menu OPÇÕES troca região e Guerreiro/Hunter ou reinicia. Personagem temporário nível 6 com HP completo e três aperfeiçoamentos, sem carregar/gravar seus personagens ou jornada. Progresso de teste dura somente até reload; morte usa o respawn real do encontro. Disponível também no servidor local no mesmo caminho.

QA desse acesso: `node scripts/qa-glacier-playtest.mjs`. Verifica as quatro combinações região/classe, ausência de cadastro em navegador vazio, preservação literal do armazenamento durante o teste, entrada/morte/retry do boss, opções em 844×390 e retorno à campanha original. [Resultado e capturas](direct-playtest/).

Na **Fratura Boreal**, investigue o registro e siga a indicação até o portal da extremidade da região. Ele agora leva às **Galerias do Degelo**. Saves anteriores continuam válidos; não é necessário criar outro personagem.

Fluxo: Fratura Boreal → Galerias do Degelo → registro → Ninho da Geada → **Vésper, o Sopro Branco** → fragmento → retorno livre. Nenhuma passagem exige matar todos os inimigos.

## Regiões e encontros

- **Galerias:** terreno subterrâneo mais escuro, oito habitantes distribuídos, espaço para contornar encontros e dois desvios opcionais — Poço do Degelo e Asas na Pedra. Cada descoberta usa a recompensa atual de exploração, uma vez por personagem.
- **Casco Glacial:** criatura de carapaça com seis patas, 170 HP, aproximação lenta e varredura anunciada (17 de dano, preparação de 1,05 s). Reutiliza o comportamento da carapaça existente. Saltadores e cuspidores glaciais completam grupos com funções distintas; XP renovável e repovoamento seguem o sistema atual.
- **Ninho:** passagem estreita, limiar físico que fecha durante a luta, espaço aberto para reposicionamento e registro após a vitória. O boss é uma criatura original, sem assets ou design copiados de Tibia.

## Vésper

1100 HP, três fases (65% e 30%), apresentação de 2,2 s e quatro padrões:

| Ataque | Preparação | Dano | Leitura |
| --- | --- | --- | --- |
| Sopro glacial | 1,30 s | 22 | Cone fixado antes da execução |
| Cauda | 0,90 s | 18 | Arco próximo com recuperação longa |
| Investida | 1,15 s | 24 | Faixa direcional; para nos obstáculos |
| Erupções | 1,30 s | 20 | Três marcas e impactos em sequência |

A direção fica fixa durante a preparação. Cada ativação causa no máximo um acerto; Dash e invulnerabilidade usam o caminho de dano existente. Fases acrescentam combinações e reduzem o intervalo entre ações, mantendo janelas para Saber e Charge. Não há summons.

Vitória concede **220 XP e um ponto de aperfeiçoamento**, uma vez, pelo sistema existente. O registro libera um fragmento curto, sem explicar a origem do sinal. Estado e recompensa persistem no save individual; Vésper não reaparece após vitória. Morrer antes disso reinicia HP, fase, timers e efeitos no checkpoint imediatamente anterior ao limiar, conservando XP, Echoes e descobertas. Nas galerias, o checkpoint após o registro fica afastado das zonas iniciais de detecção dos moradores.

## Arte, colisões e áudio

Arte original gerada offline; [prompts e preparação](illustration-prompts.md). Piso raster contínuo, rochas/raízes/minerais/vestígios existentes reaproveitados com sombras e bases integradas. Nenhuma geração de arte em runtime. Cenário estático usa quatro RenderTextures por região; apenas obstáculos com ordenação por base permanecem como Images. Colisores circulares simples e gate visual/físico sincronizados. Câmera e controles preservados.

| Asset novo | Dimensões | Tamanho aproximado |
| --- | --- | --- |
| `glacier-ground.webp` | 1536×1024 | 452 KB |
| `vesper-motion.png` | 1024×512; oito frames 256×256 | 547 KB |
| `ice-carapace-motion.png` | 1024×512; oito frames 256×256 | 555 KB |
| `icecave-journey.mp3` | 166 s | 2,33 MB |
| `vesper-journey.mp3` | 114 s | 1,60 MB |

Sprites têm alpha, pose de advertência, locomoção e morte. A preparação mantém escala entre frames e alinha o apoio; rotação do corpo não vira a criatura de cabeça para baixo. Nove imagens de mineral e quatro Graphics reutilizados compõem os efeitos delimitados do boss.

As duas trilhas são composições originais exportadas pelo script existente, com arranjos subterrâneo/combate e transições do AudioManager. Reutilizamos os sons ancestrais e de impacto; não foram baixados samples externos. Medições em [assets.json](assets.json) e [audio-measurements.json](audio-measurements.json).

## Correção de digitação

Phaser mantinha captura global do teclado mesmo com a cena pausada, consumindo letras usadas pelo gameplay. O menu agora intercepta eventos de campos editáveis antes desses listeners, depois dos handlers do próprio campo, sem impedir digitação/paste/defaults. O término do carregamento também preserva a prévia escolhida, foco e nome digitado em vez de reconstruir o formulário. Destruição remove os listeners. Nenhuma mudança em Controls ou TouchControls.

## Validação

Chrome headless local, testes automatizados; **nenhum teste físico de iPhone/gamepad ou playtest humano foi realizado neste ambiente**.

- `npm run typecheck` e `npm run build`.
- `node scripts/qa-glacier-expansion.mjs`: alfabeto inteiro, A/L, espaço, Ctrl+A, Enter; entrada a partir de save anterior, dois desvios, três espécies/dano/morte/XP, registro, quatro ataques/direção fixa, três fases, respawn, recompensa única, persistência, retorno e três reloads. Capturas 1280×720, 1366×768, 1920×1080 e 844×390 em [qa/](qa/).
- `node scripts/qa-vesper-playthrough.mjs`: tentativa completa com teclado/mouse, sem editar HP/dano ou curar durante a luta. Bot lê telegraphs; vitória técnica não equivale à avaliação humana de dificuldade. [Relatório](playthrough/report.json).
- Variante Hunter: `node scripts/qa-vesper-playthrough.mjs "http://localhost:5184/?qa=play" docs/glacier-expansion/hunter-playthrough hunter`. Vitória técnica em 31 s, contra 35 s do Guerreiro; todas as fases/padrões cobertos. [Relatório](hunter-playthrough/report.json).
- `node scripts/qa-glacier-inputs.mjs`: touch CDP com movimento/arrasto de Strike/Dash/hold-release Charge e Gamepad API mock. [Relatório](input-qa/report.json).
- `node scripts/qa-glacier-performance.mjs`: uma página Chrome, amostras separadas por região, estabilidade de entidades/Graphics/texturas/tweens, três mortes/respawns, checkpoints e colisores. [Medições](performance/report.json).
- `node scripts/qa-dante-journey.mjs "http://localhost:5184/?qa=play" docs/glacier-expansion/regression-journey`: fluxo anterior, Echoes, fissura, Cavern, First Echo, Warden, saves, diário e inputs. [Relatório](regression-journey/report.json).
- `node scripts/qa-coop-invitation.mjs production docs/glacier-expansion/coop-regression`: convites, escolha de personagem, encerramento do host e retorno solo, em servidor integrado da build.

Fixtures DEV encurtam capítulos anteriores e cobrem estados por chamadas controladas. A tentativa completa é separada desses testes. FPS de uma suíte concorrente não é usado como benchmark; consulte a medição isolada.

Medição isolada: **57,45 FPS nas galerias**, **58,66 no ninho** e **60,29 no combate**. Ninho manteve 83 objetos, 11 Graphics, quatro caches, 86 texturas e um tween antes/depois do combate e nos três respawns. A Fratura anterior ficou em 50,53 FPS nesta máquina; não afirmamos 60 FPS em todo o jogo. Portão fechado bloqueia, aberto permite passagem e ativações repetidas não duplicam collider.

## Limitações e playtest

**Galerias e Ninho são campanha solo.** O cooperativo regional existente continua na Fratura e apresenta aviso antes da passagem; não houve mudança no relay/protocolo. Expandir coop de bosses exige trabalho específico de sincronização e autoridade.

Perseguição continua direta, sem pathfinding novo; moradores podem encostar em formações. Os dois caminhos e passagem principal permitem contorno. Arte usa oito poses, sem animação esquelética; sons do boss reutilizam a família ancestral existente.

Validar humanamente: clareza dos desvios, coesão/escala do piso e dos assets, locomoção, telegraphs em celular real, dificuldade com Guerreiro e Hunter, oportunidades de Charge, ritmo entre grupos e vontade de continuar explorando. Loot/equipamentos permanecem para uma etapa posterior.
