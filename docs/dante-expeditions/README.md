# Expedições de Dante — 0.1.45

Esta etapa dá continuidade ao mundo já existente: mais dois níveis, escolhas
de encontro no Vale, descoberta recompensada uma vez e observações úteis no
bestiário. Não acrescenta mapa, criatura, equipamento, habilidade ou quest.

## Progressão e retorno

| Nível | XP acumulado | Vida máxima |
| --- | ---: | ---: |
| 1 | 0 | 100 |
| 2 | 60 | 110 |
| 3 | 140 | 120 |
| 4 | 360 | 130 |
| 5 | 660 | 140 |

Os primeiros três limiares e o ganho de 10 PV por nível permanecem. Subir de
nível restaura vida, como antes. Sabre, Dash, carga, dano, velocidades e ataques
inimigos não recebem escalonamento. O HUD mostra XP faltante, benefício seguinte,
XP recebido e ganho real de vida; ganhos próximos são somados em um único aviso.
Na versão 0.1.45, XP continuava acumulando no nível 5, que era o limite então.
Desde 0.1.54, a progressão foi ampliada até o nível 10; veja
[Progressão e especializações](../progression-specializations/).

Cada um dos três desvios concede **20 XP uma única vez**. Visitar não exige
combate. Derrotar cada novo morador continua concedendo **15 XP**; os moradores
retornam após 90 segundos e só nascem a pelo menos 480 unidades do jogador.
Forest/Cavern conservam suas recompensas únicas por habitat. POI e Warden não
ganham nova recompensa de XP.

## Composição de encontros

| Região | Habitats | Composição |
| --- | --- | --- |
| Passagem entre cristas | 900 | Um Casco Errante |
| Desvio mineral | 901, 906 | Espinhante + Casco Errante |
| Bacia enraizada | 902, 903 | Casco Errante + Espinhante |
| Margem leste | 904, 905, 907 | Casco Errante + dois Espinhantes |

São **oito moradores no máximo**, com IA existente e pools fixos de projéteis.
A dupla sul fica na bacia; o trio final ocupa a margem sul/leste, deixando o
ponto ancestral fora da detecção inicial. Portal, checkpoint e aproximação do
POI possuem espaço de descanso. Não há ondas, porta por abates, bloqueio de
retorno ou perseguidores roteirizados. Criaturas podem seguir o jogador para
fora de seus agrupamentos pela IA direta existente.

Os obstáculos, caminhos, chão, caches, arte e câmera permanecem. As duas
criaturas adicionais reutilizam as sprites existentes. O jogador pode atravessar
o Vale sem atacar. Depois de conhecer os desvios e o fim, o guia passa a
**EXPEDIÇÃO LIVRE**, com indicação de progresso e consulta aos Registros,
sem apontar repetidamente para o limite bloqueado.

## Conhecimento como benefício

O bestiário distingue **observado** (encontro) de **estudado** (primeira derrota).
Estudar libera uma observação sobre direção comprometida, cobertura ou janela
de recuperação. Não altera dano, defesa ou XP. Os seis registros e contagens
existentes continuam; nenhuma nova família de criaturas é criada.

Os Registros mostram contagem de observações/estudos, benefício do próximo
nível, composição dos desvios visitados e bônus ainda disponíveis. Detalhes de
habitat aparecem após a visita. Não é inventário nem sistema de tarefas.

## Compatibilidade do save

O mesmo arquivo/schema local v1 é preservado. `rewardedRoutes` é um campo
aditivo da progressão: ausente em um save antigo, começa vazio. Quem já visitou
desvios na 0.1.44 conserva o registro e recebe os 20 XP ao revisitar cada trecho.
O conjunto de bônus recebidos é salvo junto do XP; reload, respawn e portal
não liberam bônus repetidos. IDs desconhecidos são ignorados.

XP já acumulado continua válido e determina o nível pelos novos limiares. Um
save com 400 XP passa a nível 4 sem apagar nada; HP salvo é preservado, sem
restauração gratuita em cada reload. Morte continua restaurando a vida no
checkpoint seguro. Não há conta, servidor, sincronização ou save permanente
fora do navegador.

## Validação e performance

Executar typecheck/build e os QA de jornada, Vale e expedições. O QA dedicado é
`node scripts/qa-dante-expeditions.mjs URL PASTA_DE_RESULTADOS`.
Ele usa arquivo legado controlado, posicionamento DEV e isolamento para medir
quatro golpes reais de sabre e hold/release real de carga. Ciclos longos de
renovação usam dano encurtado e expiração DEV explícita; não simulam uma sessão
humana de 20 minutos. Touch e gamepad são emulados, sem alegação de hardware.

O cenário mantém as duas caches e não recebe assets novos ou redraw. Dois
residentes aumentam a quantidade fixa de entidades; feedback de XP reutiliza
um texto e um timer cancelável. Os cartões DOM só mudam ao abrir Registros.
### Resultados técnicos — 2026-10-04

- `npm run typecheck` e `npm run build`: passaram. O aviso conhecido sobre
  o tamanho do bundle Phaser permanece; não há pacote ou asset novo.
- QA de jornada: Forest → três Ecos → mecanismo → Cavern → First Echo →
  Warden → Vale, com estados DEV controlados para encurtar a vitória do boss.
  Save/reload, pausas de combate, falha de armazenamento, novo percurso,
  três ciclos de morte e touch/gamepad emulados passaram.
- QA do Vale: travessia com criaturas vivas sem abates, esquiva da varredura,
  projéteis bloqueados por rocha, golpes, carga, dano recebido, retorno e
  respawn passaram. Quatro quadros de passada continuam sem rotação do corpo.
- QA de expedições: save legado, 20 XP sem duplicação, níveis 4/5, restauração
  de HP, quatro golpes reais de 34 no Casco, carga máxima real de 76 no
  Espinhante seguida de golpe e desbloqueio de observações passaram. Para
  encurtar ciclos de renovação, apenas esse trecho usa HP reduzido/tempo DEV.
- Build de produção: sessão nova, teclado, arquivo legado com 400 XP → nível
  4 preservando 71 HP, Registros e UI touch passaram sem o global DEV.
- Resoluções: 1280×720, 1366×768, 1920×1080 e 844×390. Zero erros JS ou de
  carregamento nas quatro execuções. Nenhum teste físico foi realizado.

Com oito moradores ativos, o teste dedicado mediu **59,49 FPS** e permaneceu
com **122 objetos, duas RenderTextures, dois tweens e cinco listeners de
update**. A jornada mediu 53,34 FPS e o QA do Vale 52,50 FPS em outros estados;
essas amostras não representam 60 FPS constantes.

Para investigar a diferença, foram medidos os mesmos três pontos em cópias
separadas de 0.1.44 e 0.1.45, na mesma máquina, sequencialmente, com criaturas
ativas, viewport 1280×720, quatro segundos de aquecimento e oito de amostra:

| Ponto | 0.1.44 / seis moradores | 0.1.45 / oito moradores |
| --- | ---: | ---: |
| Margem oeste | 57,24 FPS | 50,08 FPS |
| Checkpoint | 58,59 FPS | 56,91 FPS |
| Caminho principal | 50,78 FPS | 54,01 FPS |

Há variação entre execuções, inclusive na versão anterior. Não foi observada
queda consistente nos três pontos; a amostra oeste mais baixa permanece
registrada e exige observação em hardware real. O crescimento de 105 para 122
objetos é fixo: duas criaturas reutilizadas e dois textos. Caches/tweens não
cresceram. Morte, reload e retorno também conservaram as contagens físicas e
de DOM, sem escritas contínuas no armazenamento durante repouso.

[Resumo de QA](qa-summary.json) · [Registros desktop](records-desktop.png) ·
[Registros em viewport mobile](records-mobile.png)

**Automação passou. Playtest humano necessário.** A leitura das imagens foi
revisada, mas não prova que o combate combinado é divertido ou que o trio
final está bem balanceado.

## Playtest humano necessário

Meta: uma sessão total de 15–20 minutos com decisões e vontade de retornar.
Essa duração e o interesse não são comprovados pelo QA automatizado.

1. Peça a um jogador novo que explore sem explicar o próximo passo.
2. Observe se entende XP recebido, próximo nível e +10 PV.
3. Percorra cada desvio e tente tanto enfrentar quanto evitar os encontros.
4. Volte a um habitat depois de 90 segundos, afastando-se antes.
5. Confira se a observação do Espinhante ajuda a evitar o leque.
6. Reabra o jogo e verifique progresso e ausência de bônus repetido.
7. Avalie se o trio final é legível e justo em touch físico e gamepad físico.

IA sem pathfinding pode prender moradores em rochas. Nível 5 é um limite
finito; recompensas além dele, loot, equipamentos e economia permanecem para
decisão posterior. Não há promessa de MMO ou multiplayer nesta etapa.
