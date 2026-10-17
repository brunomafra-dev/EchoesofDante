# Personagens inteiros — prova visual · 0.1.110

[Abrir comparação A/B](https://echosofdante.vercel.app/whole-body-playtest.html?v=0.1.110) · [32 poses](../../public/assets/experiments/whole-body/astral-female-whole.png) · [Biblioteca](https://echosofdante.vercel.app/test-library.html)

**Experimento isolado solicitado pelo usuário antes de implementar a mudança no jogo. Avaliação humana pendente.** A campanha, o seletor, aliados cooperativos, equipamentos, colisões e saves conservam seus sistemas atuais. Não declara encerrada a etapa da abertura nem antecipa missões/mapas.

## Hipótese e auditoria

`AstralArt` monta corpo, quatro segmentos de braço, mão livre e instrumento. Usa os encaixes de `ClothShoulders`, alvos de `CasterPose` e transformações de `paintedSegment`; o Domador herda esse mesmo rig em `XenobinderArt`. A combinação de pinturas separadas, braços estendidos e troca de profundidade permite gaps/quinas nos ombros e cotovelos. O seletor também usa essas peças em `CharacterShowcase`. Guerreiro e Hunter possuem rigs próprios; não foram alterados nesta prova.

A hipótese é pintar cada **pose inteira**, conservando as conexões anatômicas dentro da imagem. Em B, corpo, braços, mãos, roupa e manopla são **um único Phaser Image**, sem osso, escala de braço, recorte de membro, espelhamento ou rotação do corpo. Em A, usamos o `AstralArt` real atual, sem refiná-lo para a comparação.

## Como testar

- Começa em **B · Corpo inteiro**. Alterne **A · Rig atual** na mesma posição, iluminação, enquadramento e escala.
- WASD anda, mouse mira, clique dispara, Espaço esquiva. Q mantém **segurar → mirar → soltar**; F troca o elemento. O laboratório reutiliza `Controls`, `Player`, `KineticCharge` e `AstralCombat`, sem editar esses módulos.
- **Ampliar** aproxima somente a câmera do laboratório para inspecionar braços/mãos. **Reposicionar** restaura a posição e limpa disparos/carga. Não carrega ou grava saves.
- A pequena seta mostra a mira contínua. O corpo B seleciona uma das **oito direções pintadas**. Não gira o bitmap para acompanhar o mouse.
- Somente **Astral feminino com roupa inicial e manopla**, sem inimigos, progressão, equipamento combinável ou coop nesta prova. Há disparos e campos reais do kit existente, sem alvos de dano.

## Arte e preparação

Geradas offline com a ferramenta interna **`image_gen.imagegen`**, sem chave externa nem chamadas ao HF/fal/Runway. Referência: a mulher de uniforme azul no [quadro da equipe pioneira](../cinematic-opening/source/pioneer-team.png), inspecionado antes da geração; Organic Sci-Fi R3 / D preservado.

- [Prancha A original](source/astral-a-v1.png): frente e três vistas à direita. A primeira conjuração frontal apontava para o lado; a ferramenta gerou uma [correção da prancha inteira](source/astral-a.png), sem remontagem de braços por código.
- [Prancha B](source/astral-b.png): costas e três vistas à esquerda. Não é espelhamento de A.
- Cada prancha tem 4×4 figuras completas. Colunas: repouso, apoio A, apoio B, conjuração. Duas pranchas fornecem oito vistas e **32 quadros**.
- [Prompts normalizados](prompts/astral-whole-a.txt), [segunda prancha](prompts/astral-whole-b.txt), [correção frontal](prompts/astral-front-correction.txt). Fontes geradas com alpha real; dimensões/hashes efetivos em [assets.json](assets.json), sem confundir o tamanho solicitado com o recebido.
- `python scripts/prepare-whole-body-actors.py` recorta **células contendo pessoas inteiras**, aplica escala uniforme ao quadro completo e registra o contato dos pés. Não extrai, mistura, alonga ou reposiciona membros. Palmas foram medidas para deslocar apenas a apresentação dos projéteis; a simulação original continua partindo do jogador.
- Runtime: atlas PNG **1024×2048**, quadros 256×256, **1.293.309 bytes (~1,23 MiB)** e **8 MiB de RGBA sem compressão**, mais JSON pequeno. Carregado exclusivamente pelo laboratório.

## Movimento, custo e limites

O apoio alterna conforme a distância realmente percorrida; parar mantém os pés estáveis. Há dois apoios pintados e passagem pelo repouso, não uma animação final fluida com muitos intermediários. Conjuração e Q usam a pose braced existente; o Dash conserva o corpo inteiro e a transparência de apresentação, sem desenhar nova anatomia.

O experimento **mantém o rig A em memória**, oculto em B, para permitir comparação instantânea. Portanto, não apresenta uma redução medida do custo total da cena. B acrescenta um Image, um atlas e a guia de carregamento; não cria objetos a cada troca de quadro, não gera texturas nem redesenha anatomia em runtime. A instância de comparação A conserva o bake existente do torso.

**Limites perceptuais que exigem olhar humano:** pequenos desvios de rosto, volume, roupa e mão dominante entre pinturas; mudança discreta de direção a cada 45°; diferença entre mira exata e orientação aproximada da pose; dois apoios de caminhada podem parecer abruptos. Manter o corpo unido não garante automaticamente uma boa animação. Avaliar frente, costas, diagonais, movimento para trás, troca rápida de mira e conjuração ampliada.

Equipamentos mistos e diferentes armas exigirão uma solução de produção própria para preservar corpos completos sem explodir a quantidade de variantes. **Não gerar todas as classes/vestimentas nem substituir o jogo inteiro antes do playtest desta prova.** Nenhuma representação foi declarada vencedora pela automação.

## Verificações

- `npm run typecheck` e `npm run build` passaram; permanece o aviso conhecido do chunk Phaser >500 kB.
- `node scripts/qa-whole-body.mjs`: [Chrome e apresentação](qa/report.json), 32 poses, teclado/mouse, touch emulado, gamepad mock e quatro resoluções (1280×720, 1366×768, 1920×1080 e 844×390). **~60 atualizações/s** na amostra local, zero erros JS/assets ou warnings de textura. Seis ciclos A/B/reposicionar: **28 objetos, 52 texturas, zero tweens, 14 listeners de shutdown e um root touch**, iguais antes/depois. Save sentinela preservado. Menu principal compilado também abriu sem erros e sem carregar os assets/handle do laboratório. Não é medição da campanha ou coop.
- Inspeção pelo agente: vistas das duas pranchas e quadros da cena conferidos; a conjuração frontal corrigida agora aponta para a frente. Isso não equivale a aprovação visual do usuário.
- Nenhuma alteração em `GameScene`, `Player`, `Controls`, `TouchControls`, combate, IA, HP/XP, progressão, protocolo de rede ou personagens selecionados. Não foi refeito o playthrough completo de bosses por uma prova de apresentação isolada.
- **Publicação conferida em 17/10/2026:** Vercel publicou `c1128a3ce32b25b1173055cbeb89a752d25f6978` (`feat: add whole-body character comparison lab`). [QA público](qa/public-report.json) passou com as mesmas poses, inputs, resoluções, ciclos e proteção de saves, ~60 atualizações/s, zero erros/warnings e menu principal sem assets do protótipo. **Automação passou; playtest humano necessário.**

## Quadro da cinemática preservado

A geração da equipe, interrompida antes de ser incorporada, foi salva em `docs/cinematic-opening/source/pioneer-team.png`, com [prompt](../cinematic-opening/prompts/pioneer-team-image.txt) e [metadados](../cinematic-opening/source/pioneer-team.json). Há uma cópia WebP para consulta na biblioteca. É **imagem estática**, não uma nova cena de vídeo, e não altera os 36 segundos publicados. Animação continua pendente de cota HF; nenhuma conta adicional ou compra foi utilizada.
