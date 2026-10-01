# World Shape Language — Echoes of Dante

Extensão documental da direção **Organic Sci-Fi — R3**. Sprint 06.2.

## 1. Purpose — propósito

Definir uma gramática de formas, materiais e composição para os ambientes de Dante. Ela orienta decisões de produção e avaliação visual, desde uma pequena formação até uma região explorável.

O resultado esperado é a leitura de um lugar: massas que se formaram, cresceram ou foram incorporadas ao terreno, com caminhos e referências espaciais compreensíveis.

Dicero é uma referência externa mencionada na discussão de estilização ambiental. Este documento trabalha com princípios gerais de composição; não reproduz assets, personagens, cenários, cores específicas, interface, efeitos, composição proprietária, código ou identidade de Dicero. O mesmo limite vale para as demais referências de sensação do projeto.

Esta sprint produz documentação. Nenhuma recomendação abaixo foi aplicada ao jogo nesta etapa.

## 2. Relationship to Organic Sci-Fi — relação com a direção oficial

| Camada | Pergunta que responde | Responsabilidade |
| --- | --- | --- |
| Organic Sci-Fi / Art Bible | Que tipo de mundo é Dante? | Identidade, materiais, paleta, personagens, energia e hierarquia visual. |
| World Shape Language | Como esse mundo é construído visualmente? | Silhuetas ambientais, massas, integração, profundidade e ritmo de composição. |

A gramática complementa a [Art Bible oficial](art-bible/), especialmente a direção R3. Mantém o contraste entre natureza que cresce, tecnologia humana construída e tecnologia ancestral incorporada ao ambiente. Não escolhe outro estilo de renderização nem exige um novo formato de asset.

## 3. Core Principle — princípio central

> FORMAS GEOMÉTRICAS SÃO PERMITIDAS, MAS NÃO DEVEM SER PERCEBIDAS COMO PRIMITIVAS ISOLADAS.

**OBJETO → MASSA → FORMAÇÃO → AMBIENTE**

Triângulos, polígonos, círculos e retângulos podem construir uma forma. A avaliação recai sobre a leitura do conjunto, não sobre a presença de uma primitiva no desenho ou no código.

Uma faceta triangular pode funcionar dentro de uma rocha. Uma sequência de triângulos soltos com o mesmo tamanho tende a comunicar um padrão gráfico antes de comunicar uma parede.

## 4. Shape Language — linguagem de formas

- **Assimetria controlada:** variar peso, altura e extensão sem comprometer a leitura da massa principal.
- **Silhuetas irregulares:** alternar saliências, reentrâncias e espaços negativos reconhecíveis.
- **Sobreposição:** estabelecer qual elemento está à frente, atrás ou entrando no solo.
- **Variação de escala e orientação:** combinar formas maiores e menores, com direções relacionadas à formação.
- **Massas compostas:** construir uma forma principal com subformas subordinadas.
- **Bordas quebradas:** sugerir fratura, erosão e crescimento com mudanças seletivas de contorno.
- **Elementos parcialmente enterrados:** mostrar apenas parte de uma estrutura e conectar sua base ao terreno.
- **Integração entre objetos:** compartilhar apoio, sombra, fissura, raiz ou mineralização.
- **Repetição limitada e detalhes seletivos:** conservar famílias de formas sem tornar o padrão de montagem evidente.

Irregularidade precisa de intenção. Variação aleatória em cada vértice, cor ou orientação pode destruir a unidade da formação. Geometria precisa e simetria funcional continuam apropriadas à tecnologia humana.

## 5. Environmental Masses — massas ambientais

Planejar primeiro a massa principal, seu apoio no chão e sua relação com o caminho. Depois acrescentar subformas, materiais e poucos detalhes de integração.

| Leitura a evitar | Leitura preferível |
| --- | --- |
| Rocha + rocha + mineral + rocha, cada elemento independente. | Formação rochosa contendo subformas, mineral, raízes, sombra e variação de superfície. |
| Uma coleção de props com o mesmo peso visual. | Uma massa dominante, elementos de apoio e espaço livre ao redor. |

Os componentes devem compartilhar alguma relação visível: direção de crescimento, base contínua, contato, material ou desgaste. A formação pode ter intervalos e fissuras; unidade não exige preencher todo o espaço.

## 6. Silhouette — silhueta

**A silhueta externa tem prioridade sobre o detalhe interno.**

Uma parede, rocha, árvore, ruína, estrutura ou grupo mineral deve continuar reconhecível na escala real de gameplay e com o detalhe interno simplificado. A massa geral comunica volume; fissuras e facetas confirmam o material.

Avaliar o contorno e os espaços negativos antes de adicionar inscrições, pequenos fragmentos ou textura. Mais detalhes não compensam uma silhueta ambígua. Preservar o recorte dos caminhos e a separação entre personagem e ambiente.

## 7. Layering and Depth — camadas e profundidade

| Camada conceitual | Conteúdo | Tratamento |
| --- | --- | --- |
| Background | Grandes massas, paredes e formações distantes. | Menor contraste e menor prioridade; sustenta o espaço. |
| Midground | Caminho, rochas, raízes, minerais e estruturas. | Define navegação, obstáculos e referências de exploração. |
| Foreground | Pequenas pedras, vegetação, raízes, detalhes e sombras. | Sobreposição seletiva e enquadramento, mantendo o combate visível. |

São camadas de composição, **não uma obrigação de criar três RenderTextures**. A implementação pode continuar usando as texturas, faixas de profundidade e caches existentes.

Sombra de contato conecta elementos ao solo. Sobreposição indica profundidade; não deve esconder personagem, ameaça, interação ou passagem. Um elemento em foreground não ganha prioridade visual apenas por estar à frente.

## 8. Material Language — linguagem de materiais

| Família | Forma e superfície | Integração |
| --- | --- | --- |
| Pedra | Massa irregular, faces amplas, fraturas e variação de superfície seletiva. | Apoio no solo, pequenos depósitos, sombras e ligação com a parede. |
| Natureza viva | Ramificação, curvas e crescimento assimétrico. | Continuidade entre solo, fissuras e outras massas. |
| Mineral | Facetas dentro de grupos de tamanhos e exposições diferentes. | Veios e crescimento parcialmente exposto na rocha. |
| Tecnologia humana | Junções, módulos, precisão e materiais funcionais reconhecíveis. | Apoio físico e desgaste de uso sem perder a leitura de fabricação. |
| Tecnologia ancestral | Superfícies intencionais, fraturadas e parcialmente enterradas. | Geologia, erosão, raízes e mineralização atravessando a composição. |

Forma, superfície e apoio devem comunicar material antes da emissão de luz. Geometria ancestral continua sugerindo construção intencional, mesmo quando suas bordas foram alteradas pelo tempo.

## 9. Dante Nature — natureza de Dante

A natureza comunica crescimento, adaptação, irregularidade, organicidade e estranheza familiar. Árvores, vegetação, raízes, rochas, minerais e elementos subterrâneos devem parecer que **cresceram ou se formaram ali**.

Relacionar sua orientação ao terreno e às massas próximas. Uma raiz busca uma fissura; um conjunto vegetal ocupa uma borda; minerais emergem de uma formação. Essas relações são pistas visuais, sem definir novas explicações de lore.

Evitar intervalos uniformes e a mesma silhueta em toda a vegetação. Preservar áreas silenciosas: ambiente vivo não exige preencher cada espaço.

## 10. Human Technology — tecnologia humana

Manter precisão, modularidade, funcionalidade, construção intencional, geometria controlada e leitura industrial. Junções e módulos podem repetir padrões de fabricação. Desgaste deve preservar a função reconhecível do equipamento.

**DANTE NATURE → cresce. HUMAN TECHNOLOGY → é construída.**

A assimetria ambiental não obriga deformar todo componente humano. O contraste entre as famílias ajuda a reconhecer origem e função. Esta gramática não modifica a identidade ou o rig do Galactic Warrior.

## 11. Ancient Technology — tecnologia ancestral

Comunicar antiguidade, escala monumental, assimetria, destruição parcial e integração com a geologia. A estrutura deve parecer presente no local há muito tempo, parcialmente absorvida pelo ambiente.

Usar erosão, quebra, deslocamento, cobertura natural e partes enterradas para integrar sua geometria. Compartilhar base, sombra e relevo com a formação ao redor. Raízes podem desaparecer atrás de uma placa e reaparecer numa fissura; minerais podem ocupar uma fratura.

Um objeto geométrico roxo, limpo e separado do chão oferece pouca evidência dessa integração. Preferir material físico e emissão violeta localizada em inscrições, juntas ou fissuras. Monumentalidade vem da proporção e da composição, sem exigir uma estrutura enorme.

Não acrescentar nomes de civilização, explicações sobre o sinal ou respostas ao mistério para justificar a arte.

## 12. Rocks and Caverns — rochas e cavernas

A Cavern é o principal campo de aplicação futura desta gramática.

**GRANDE MASSA + SUBFORMAÇÕES + FRATURAS + RAÍZES + MINERAIS + SOMBRA + VARIAÇÃO**

Construir paredes como massas contínuas com mudanças de profundidade, apoios e saliências. Usar facetas como partes do relevo, evitando uma sequência evidente de polígonos independentes. Não é necessário preencher cada parede com todas as características da fórmula.

Uma formação pode reunir uma massa principal irregular, duas subformas, uma fratura e uma faixa de sombra. Detalhes minerais e raízes entram onde ajudam a leitura. Isso pode ser desenhado com formas simples e baked em cenário estático, sem textura complexa.

A Cavern atual já possui zonas, sobreposição, raízes, minerais, estruturas e baking em `CavernArea.ts`. Essa base deve ser preservada. O futuro teste avaliará a integração e a repetição em um trecho pequeno, sem tratar o mapa inteiro como algo a reconstruir.

## 13. Minerals — minerais

Planejar o mineral como uma formação, não como um ícone ou cristal perfeito repetido.

- Agrupar poucos volumes de tamanhos diferentes.
- Variar orientação e quanto de cada volume está exposto.
- Conectar a base à rocha por veio, sombra ou cobertura parcial.
- Concentrar emissão de luz em uma parte da formação.
- Manter áreas sem emissão para preservar materialidade e contraste.

Facetas regulares são permitidas dentro do grupo; o conjunto deve mostrar crescimento irregular. A linguagem violeta/âmbar do sinal permanece compartilhada com a tecnologia ancestral. Este documento não redefine o Mineral Pulse ou seus VFX.

## 14. Roots and Vegetation — raízes e vegetação

Usar raízes e vegetação para unir massas: atravessar uma fissura da pedra, contornar uma base, desaparecer atrás de uma estrutura ou conectar duas formações.

Mostrar continuidade por sobreposição e espessura variável. Evitar uma raiz que termina sem apoio ou cruza arbitrariamente uma superfície sólida. A cobertura natural deve reforçar desgaste e crescimento, mantendo inscrições relevantes e passagens legíveis.

Folhagem pode enquadrar uma entrada ou formar uma borda. Não deve sugerir um obstáculo inexistente nem ocultar uma colisão real.

## 15. Environmental Composition — composição ambiental

Organizar o ambiente em torno de caminhos, espaços abertos, barreiras, POIs, enquadramentos e massas visuais.

1. Identificar o espaço navegável e as colisões existentes.
2. Escolher a massa que estabelece a borda ou a referência do trecho.
3. Organizar subformas e espaços negativos ao redor dela.
4. Integrar materiais e selecionar o ponto de maior interesse.
5. Verificar a leitura em movimento e durante combate.

Distribuição uniforme enfraquece direção e descoberta. Preferir agrupamentos separados por espaços de descanso visual. Uma borda mais densa pode enquadrar uma rota aberta; um POI pode concentrar detalhe sem transformar todo o caminho em decoração.

## 16. Color Masses — massas de cor

A paleta oficial R3 permanece:

| Função | Cor de referência |
| --- | --- |
| Natureza | `#6bb464` |
| Tecnologia humana / acentos | `#e0863f` |
| Energia do jogador | `#5fe6d8` |
| Tecnologia ancestral / mistério | `#a98cff` |
| Calor mineral | `#ffbd54` |
| Perigo / dano | `#ff6a4a` |

**Cor também funciona como massa visual.** Agrupar famílias de material e tonalidades já compatíveis com a Art Bible. Não dar uma cor distinta a cada componente nem usar os seis acentos com a mesma intensidade em toda formação.

Na Cavern, pedra e sombra sustentam o espaço; verde orgânico integra a natureza; violeta e âmbar destacam sinais localizados. Ciano permanece principalmente associado ao jogador. Os acentos não substituem as superfícies físicas nem criam uma nova paleta.

## 17. Visual Hierarchy — hierarquia visual

Preservar a prioridade da Art Bible:

**PLAYER → THREAT → POI → PHENOMENON → ENVIRONMENT**

O jogador também precisa distinguir espaço navegável, obstáculos, perigo, ponto de interesse, fenômeno e objetivo. Essas são verificações de leitura espacial, não uma nova ordem que coloque decoração ou objetivo acima do combate.

Contraste, recorte e espaço livre precisam manter personagem e ameaça reconhecíveis em movimento. A luz do ambiente é localizada e subordinada a essa prioridade. Não usar setas, marcadores novos ou alteração de VFX para compensar uma composição confusa.

## 18. Detail Density — densidade de detalhe

| Densidade | Uso | Regra |
| --- | --- | --- |
| Alta | POIs, entradas, estruturas, minerais e locais narrativos. | Concentrar informação relevante em uma área limitada. |
| Média | Bordas, formações e trechos de caminho. | Sustentar material e direção sem competir com o foco. |
| Baixa | Espaços de navegação e descanso visual. | Preservar leitura, circulação e contraste com os agrupamentos. |

Alternar densidades cria ritmo visual. Alta densidade não significa muitos objetos independentes ou microdetalhes ilegíveis. Verificar o conjunto no zoom atual do jogo antes de aumentar detalhe.

## 19. Repetition and Variation — repetição e variação

Reutilizar componentes com variação suficiente para quebrar padrões perceptíveis. Alterar escala, orientação, posição, exposição e combinação com outros elementos. Inverter quando a forma e o material permitirem.

Não espelhar inscrições, sinalização ou peças funcionais cuja direção tenha significado. Em obstáculos, a variação visual deve continuar correspondendo à colisão existente.

Evitar rochas, cristais ou silhuetas idênticas em intervalos regulares. Não criar infinitas variações manuais: um pequeno kit compartilhado pode gerar diferentes formações por composição. Manter identidade material entre as variações.

## 20. Performance Constraints — restrições de execução

> COMPLEXIDADE VISUAL NÃO PRECISA SIGNIFICAR COMPLEXIDADE DE EXECUÇÃO.

No Sprint 02.0.1, a Forest foi corrigida após centenas de `Graphics` estáticos serem renderizados a cada frame. Baking/caching e texturas reutilizadas reduziram esse trabalho. Essa decisão continua obrigatória.

- Preferir formas simples compondo silhuetas maiores.
- Bakear composições estáticas quando apropriado, usando a estratégia existente.
- Não manter centenas de `Graphics` estáticos no caminho de renderização de cada frame nem reconstruir seus comandos continuamente.
- Não criar novos `Graphics`, objetos ou texturas continuamente durante gameplay.
- Reutilizar texturas e componentes; limitar tamanho e quantidade de caches para evitar desperdício de memória e custo de startup.
- Separar apenas os poucos elementos que realmente precisam animar ou mudar de estado.
- Evitar dezenas ou centenas de tweens decorativos, partículas permanentes e DOM adicional para cenário.
- Preservar sobreposição e profundidade no baking; não achatar toda a cena se isso encobrir entidades ou tornar a navegação ambígua.

`Arena.ts` já usa camadas estáticas em cache e texturas compartilhadas. `CavernArea.ts` captura arte estática em `RenderTexture`; os poucos pulsos existentes permanecem separados. A gramática deve caber nessa base, sem novo sistema de renderização ou iluminação.

No futuro microprotótipo, comparar startup, FPS, quantidade de objetos/tweens e console com a versão anterior, no mesmo ambiente de teste. Cerca de 55–60 FPS é uma referência local, não uma garantia para todo dispositivo. Uma regressão exige diagnóstico antes de ampliar a área.

## 21. What to Avoid — o que evitar

- Primitiva isolada representando um objeto complexo sem apoio de composição.
- Repetição óbvia de pedra, cristal, silhueta ou intervalo.
- Simetria excessiva em formações naturais e ruínas.
- Distribuição uniforme que elimina agrupamentos e espaços de descanso.
- Paredes que expõem uma sequência óbvia de polígonos independentes.
- Estruturas ancestrais limpas, destacadas do solo ou com leitura de tecnologia humana.
- Objetos visualmente flutuando, sem contato, sombra ou cobertura.
- Cores excessivamente fragmentadas ou emissão aplicada a tudo.
- Detalhes sem função de material, direção, profundidade ou interesse.
- Cenário mais chamativo que personagem, ameaça ou ação.
- Aumento de polígonos como solução automática para falta de integração.

## 22. What to Prefer — o que preferir

- Massas e silhuetas claras.
- Agrupamentos, sobreposição e espaços negativos.
- Integração com solo, pedra e estruturas próximas.
- Variação e assimetria com intenção.
- Desgaste, raízes e mineralização em pontos selecionados.
- Sombras de contato e contraste coerente com a hierarquia.
- Detalhes seletivos e composição que sustenta exploração.
- Componentes simples, reutilizáveis e baked quando estáticos.

## 23. Practical Examples — exemplos conceituais

| Elemento | Evitar como leitura final | Preferir como leitura final |
| --- | --- | --- |
| Rock | Triângulo marrom isolado. | Formação com massa principal irregular, duas subformas, uma fissura, pequenas pedras e integração com o solo. |
| Mineral | Cristal perfeito copiado várias vezes. | Grupo mineral irregular parcialmente exposto na rocha, com orientações variadas e emissão localizada. |
| Ancient Structure | Objeto roxo geométrico colocado no chão. | Estrutura parcialmente enterrada, quebrada e atravessada por raízes, com luz violeta em uma fissura ou inscrição. |
| Cavern Wall | Sequência de polígonos com igual tamanho e espaçamento. | Massa rochosa contínua com variações de profundidade e pequenas formações integradas. |
| Vegetation | Plantas idênticas distribuídas como pontos de uma grade. | Agrupamentos de crescimento desigual enquadrando uma borda, com intervalos de chão livre. |

São descrições de composição, não pedidos de novos assets ou mudanças imediatas no mapa.

## 24. Prototype Rules — futuro Visual Prototype 02

**O Visual Prototype 02 não é implementado pelo Sprint 06.2.** Sua execução depende de uma instrução posterior.

O primeiro teste deverá alterar somente uma pequena região visual da Cavern, com escopo identificável e rollback fácil. Escolher o trecho após inspecionar sua geometria e colisões; esta documentação não fixa uma localização nem muda o mapa.

Preservar integralmente:

- Gameplay, controles e valores de movimento/combate.
- Colisões, limites, rotas e passagens navegáveis.
- Câmera, zoom e escala do jogo.
- Inimigos, spawns, IA e patrulhas.
- POIs, posição, função, interações e estado narrativo.
- Iluminação funcional e legibilidade de jogador/ameaças.
- Echoes, progressão, HP, morte e respawn.
- HUD, VFX, áudio e cache de cenário estático.

O teste modifica a composição visual local de formas ambientais. Não acrescenta conteúdo, recompensa, mecânica, lore ou pipeline definitivo de arte. A arte de obstáculo deve continuar comunicando a área de colisão existente; se isso exigir mudar colisões, reduzir o redesenho visual.

### Validação do microprotótipo

1. Capturar o trecho anterior e a proposta com a mesma câmera, zoom e resolução.
2. Comparar silhueta, integração, massas de cor e densidade na escala real de gameplay.
3. Percorrer o trecho, contornar obstáculos e combater para verificar oclusão e navegação.
4. Confirmar que POI, passagem e estado narrativo continuam legíveis.
5. Executar typecheck/build e regressões relevantes na futura implementação.
6. Medir performance no mesmo ambiente e verificar console e estabilidade de objetos/tweens.
7. Revisar o diff e confirmar que o teste permaneceu dentro da região visual delimitada.

Perguntas de aceitação: a formação parece pertencer ao lugar? O conjunto é reconhecido antes das primitivas? Caminho e obstáculos continuam claros? Personagem e ameaça permanecem prioritários? O custo de execução continua próximo do anterior?

Ampliar a aplicação apenas após avaliação visual real do trecho. Uma reprovação deve permitir desfazer o experimento sem alterar gameplay ou outras regiões.

## 25. Relationship to Art Bible — autoridade e limites

### Representação validada após os protótipos

O teste humano do Visual Prototype 02 rejeitou a leitura de formas geométricas
agrupadas. Na comparação do [Visual Rendering Prototype 01](visual-rendering-prototype-01/),
o usuário aprovou **D — Hybrid** como referência de representação para o jogo:
asset raster ilustrado com volume e material, sombra de contato e sobreposição
seletiva de raízes/minerais ou outros elementos apropriados ao objeto.

As massas e silhuetas desta gramática continuam válidas; a pintura/textura passa
a ser a referência para representá-las. Não repetir uma única textura em todo
o mundo. Manter famílias de material, variação controlada, paleta semântica e
contraste entre natureza, tecnologia humana e ancestral. Cenário estático
continua baked/cacheado; sobreposições estáticas também podem entrar no bake.

A aprovação da linguagem no laboratório não valida automaticamente sua futura
aplicação a personagens, interfaces ou mapas inteiros. Cada expansão deve
preservar gameplay e confirmar leitura na escala real de jogo.

A [Art Bible](art-bible/) define a identidade visual do jogo. **World Shape Language define como essa identidade é traduzida em formas ambientais.** Em caso de conflito visual, preservar a direção Organic Sci-Fi R3 e revisar esta extensão.

As referências verificadas no site são as seções R3 de Dante Forest, Ancient Technology, Color System, Lighting System e Gameplay Readability. A paleta e a hierarquia apresentadas aqui mantêm essas definições. O site e seus arquivos não são alterados por este documento.

Esta gramática não substitui o Art Bible, não muda cores oficiais ou Organic Sci-Fi, não altera a identidade do Galactic Warrior ou o conceito do Hollow Crawler e não modifica HUD, VFX ou gameplay.

Para o contexto técnico de baking/caching e das áreas existentes, consultar [technical-decisions.md](technical-decisions.md), especialmente os Sprints 02.0.1, 05.0–05.2. Este documento prepara uma avaliação visual controlada; não autoriza implementar o Visual Prototype 02 nem redesenhar o restante do mundo.
