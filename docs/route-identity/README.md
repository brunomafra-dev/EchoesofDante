# Trilhas próprias — aplicação após a bacia da Floresta

## Autorização e sequência

Em 24/10/2026 o usuário aprovou continuar a referência 0.1.142 em três entregas consecutivas, **com commit e push ao fim de cada arco e início imediato do próximo**. Essa instrução dispensa a espera intermediária descrita no plano anterior para este lote; não transforma QA em aprovação visual automática.

1. **[Vale → Siroco → Dunas → Soterrado — 0.1.143](sirocco/README.md).** Commit/push `d2ae660`: pradaria mineral, calcário, escarpa, salinas secas, sedimentos e depressão de areia.
2. **[Fratura Boreal → Galerias → Vésper — 0.1.144](boreal/README.md).** Composição própria por região de gelo.
3. **Costa das Cinzas → Obsidiana → último boss — entrega seguinte.** Costa vulcânica, garganta e forjas com terrenos distintos.

Preservar Organic Sci-Fi R3 / referência D, personagens, criaturas, portais, missões, marcos e recompensas. Este lote dá identidade e composição ao percurso existente; não declara novos mapas, novas horas de campanha nem altera dificuldade para aumentar duração.

## Composição e custo

Cada região recebe **uma pintura completa e exclusiva**, com variação interna entre início, meio e saída. Não existe repetição de piso, espelhamento de painéis ou a mesma pintura recolorida para representar biomas diferentes. O compositor existente desenha um único quad sobre o mapa, abaixo dos caches e objetos ordenados por profundidade. Reutiliza rochas, raízes, estruturas, contato, vento e partículas limitadas. Não redesenha gráficos estáticos por frame.

Os prompts mantêm o espaço de gameplay limpo e deixam grandes bancos fora das margens caminháveis. Núcleos de rocha pintados dentro da trilha recebem colisão documentada; arenas dos bosses conservam suas colisões e espaço de esquiva. Entradas, relays, missões e saídas são verificados pelo grafo de navegação e no cooperativo.

## Laboratório

`world-finish-playtest.html?area=REGIÃO&trails=1&spot=0` chega diretamente à composição; o seletor Trecho oferece começo, meio e fim. O botão **Comparar com 0.1.142** usa `trails=previous`, preservando o acabamento anterior, não o renderer mais antigo de `mode=previous`. Prévia temporária, bosses vivos, equipamento e classe selecionáveis; saves reais protegidos. A campanha normal também usa a arte nova. A simulação não é uma campanha vencida nem oferece atalhos no jogo oficial.

## QA e limites

Cada arco executa typecheck/build, QA visual/técnico, comparação de limites e colliders, acessos às análises, movimento/Dash, quatro resoluções, três recriações, FPS e telegraphs do boss sobre o novo terreno. O ensaio cooperativo usa duas instâncias independentes, confere pintura/física nos dois lados e analisa os locais com o E do convidado. Ataques de boss são acionados por fixtures explícitas para capturar seus avisos; isso não é playthrough humano de balanceamento.

As chaves dos pisos e os listeners ficam idênticos nas recriações. O ensaio aquece primeiro os caches de pose/projéteis; texturas dinâmicas de personagem/ataque podem variar até duas e objetos transitórios até oito entre amostras. Essas variações são registradas, não tratadas como contagens estáticas exatas. O FPS é amostrado após estabilizar o carregamento. Não afirmar compatibilidade universal com Safari: o encerramento de WebKit Windows também observado no baseline continua documentado em `docs/early-journey/qa/webkit-observations.json`. Celular físico, equipe humana de quatro e avaliação estética continuam humanos.
