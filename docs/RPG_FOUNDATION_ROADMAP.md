# Echoes of Dante — Fundação do RPG e da expedição cooperativa

Plano aprovado pelo usuário e arquivado em **09/10/2026**. Base de execução: **0.1.78**, commit `90a5dcaf33842652d55e29279b273f149e566e1f`.

Este documento é a referência de implementação desta evolução. As funcionalidades descritas são metas; o checklist ao final distingue o que foi entregue do que permanece planejado. Art Bible, World Shape Language e o descritivo de classes continuam válidos.

## 1. Direção e decisões fechadas

Construir um ciclo completo:

**BASE → PREPARAÇÃO → EXPLORAÇÃO → COMBATE → DROPS → EQUIPAR/FABRICAR → NOVAS AMEAÇAS → RETORNO À BASE**

A direção visual permanece **Organic Sci-Fi R3 / referência D**. Phaser, TypeScript, Vite, renderização raster e cenário baked continuam sendo a base técnica.

Referências de princípios: preparação e slots de [Tibia](https://www.tibia.com/gameguides/?section=interface&subtopic=manual), escolhas de equipamento de [Path of Exile](https://www.pathofexile.com/item-data), fabricação na base de [Lost Ark](https://www.playlostark.com/en-us/game/releases/arkesia-ignited) e progressão pelas profundezas do [Diablo original](https://news.blizzard.com/pt-br/article/22887361/diablo-ja-disponivel-em-gog-com). Assets, personagens, interfaces e conteúdo serão originais.

**Decisões confirmadas:**

- Catálogo de equipamentos com raridades e atributos definidos.
- Equipamentos visíveis no personagem.
- Inventário, poções, materiais, moeda e fabricação.
- Base de pouso conectada à Floresta; regiões atuais preservadas.
- Quarta classe com companheiro e simbiose.
- Cooperativo de até quatro jogadores, sem repetir classes.
- Morte: perda de **10% dos créditos carregados**, arredondada para baixo; conservar XP, materiais e equipamentos.
- Durante bosses, mortos aguardam os aliados. Reiniciar somente quando todos morrerem.
- Introdução ilustrada cinematográfica, pulável.
- Itens pessoais, sem comércio entre jogadores nesta evolução.

## 2. Regras do jogo e da arquitetura

### Inventário, drops e aparência

- **24 espaços de mochila**; materiais e créditos em contadores separados.
- Sete slots: **arma, capacete, torso, pernas, botas, luvas e acessório**.
- Três raridades iniciais: **comum, aprimorado e raro**. Cada item possui atributos e aparência definidos, sem geração de afixos.
- Equipamentos aparecem no chão com ícone próprio, nome discreto e coleta contextual. Materiais e créditos continuam com coleta por aproximação.
- Mochila cheia impede coletar equipamento e informa o motivo. Drops não coletados desaparecem ao sair da região.
- Equipar, retirar, comparar, vender e desmontar; nenhum item será equipado automaticamente.
- Cada jogador recebe loot pessoal adequado à classe. Receitas oferecem uma alternativa previsível à sorte dos drops.
- Armas e peças de armadura mudam a apresentação. Acessórios usam detalhes pequenos, preservando a leitura da classe.
- Migrar os nove itens atuais: emissores para armas compatíveis, armaduras para torso e focos para acessório. Preservar seus bônus e posse.

### Personagens e renderização

- Seleção **masculino/feminino** para todas as classes, com os mesmos atributos e habilidades.
- Saves antigos conservam a apresentação atual: Guerreiro masculino e Hunter feminino.
- Novos personagens começam em roupa simples de expedição, sem armadura embutida. A proteção original passa a ser equipamento básico; a carapaça reforçada substitui visualmente a peça básica. Capacete, torso, pernas, botas e luvas são separados, com arma e acessório independentes. Drops/fabricação e slots persistentes serão implementados na etapa 2, depois da aprovação visual.
- Preparar corpos, armaduras, mãos e armas em camadas, com âncoras comuns para frente, lado e costas.
- Preservar apoio dos pés, direção da arma, pegada e sobreposição dos braços.
- Produzir sprites e atlas offline; carregar somente o conjunto necessário. Evitar um atlas gigante contendo todas as combinações.
- Validar primeiro um Guerreiro e um Hunter com troca real de arma e torso antes de ampliar o catálogo visual.

### Base, mapa e economia

- Criar uma pequena **base de pouso caminhável**, ligada à entrada da Floresta.
- Nave, enfermaria, oficina, suprimentos e terminal de expedições.
- Três NPCs funcionais: **médico/fornecedor, ferreiro/técnico e responsável pelas expedições**.
- Começar com a tripulação. Refugiados chegam visualmente após marcos da campanha, inicialmente após o Warden.
- Mapa mundial mostra regiões, ligações, pontos descobertos e destino atual; mantém o minimapa existente.
- Retorno à base de qualquer ponto da exploração pelo mapa, com retomada na posição de saída. Terminais existentes também funcionam. Não permitir retirada durante boss ativo. Revisão autorizada pelo usuário em 10/10/2026; detalhes no registro da etapa 3.
- Créditos compram suprimentos; três famílias regionais de materiais alimentam receitas.
- Fabricação imediata, com custo e resultado explícitos. Sem filas, tempo de espera ou chance de falha.
- Cofre pessoal de **48 espaços**, sem compartilhamento entre personagens.
- Poção inicial: cura **35% da vida máxima**, recarga de **8 segundos**, consumida apenas se houver vida a recuperar. Pilhas de até 20.
- Médico restaura a vida gratuitamente na base; novos personagens recebem três poções.
- Compras, fabricação, consumo e salvamento devem ser operações indivisíveis e resistentes a repetição de comandos.

### Classes

| Classe | Fantasia | Kit central |
|---|---|---|
| Guerreiro Galáctico | Dominar o combate próximo | Sabre, resistência, Dash e Carga Cinética |
| Star Hunter | Controlar a distância | Rifle, mobilidade, Momentum e feixe carregado |
| Manipulador Astral | Controlar o campo | Manopla, quatro elementos e zonas direcionais |
| **Vinculador de Dante — Xenobinder** | Lutar em simbiose | Arma biológica tecnológica, companheiro e apoio limitado |

**Astral:**

- Alterna **energia → fogo → água → terra** durante o combate.
- Ataque básico de médio alcance assume o elemento escolhido: raio, bola de fogo, rajada de água ou pedra; Q mantém **segurar → mirar → soltar**.
- Energia: malha de descarga com impacto inicial; fogo: terreno em chamas; água: onda e zona de desaceleração; terra: rocha emergindo com impacto e empurrão, usando HURT existente.
- Recurso próprio: **Energia Astral**. Ataque básico recupera recurso; Q consome. Movimento evasivo permanece independente do recurso.
- Primeira versão sem combinações elementais em cadeia; preservar clareza antes de acrescentá-las.

**Vinculador:**

- Uma criatura original permanente acompanha o personagem.
- Ataque básico orienta a assistência do companheiro.
- Q direciona uma investida do companheiro e produz um pulso curto de recuperação para aliados próximos ao impacto.
- Recurso próprio: **Vínculo**, acumulado em combate.
- Companheiro com estados explícitos: seguir, assistir, executar comando e retornar; contornar obstáculos simples e recuperar distância fora de combate.
- Sem captura de dezenas de animais, enxames ou dependência de um aliado para jogar solo.

Os números dos novos kits serão registrados no documento de balanceamento antes da implementação de cada classe e calibrados contra os encontros existentes.

### Cooperativo e dificuldade

- Manter duas pessoas funcionando em cada etapa; ampliar para quatro depois de concluir as quatro classes.
- Jogadores levam **nível, equipamentos, consumíveis e habilidades próprios**. A campanha e suas portas seguem o anfitrião.
- Lobby mostra classes ocupadas e exige escolher uma disponível; nunca trocar a classe automaticamente.
- Identificação por participante substitui a estrutura atual de um único visitante.
- Anfitrião simula combate e valida ações; relay controla vagas, reconexão e entrega de recompensas.
- Inventário pessoal não pausa a equipe. Serviços comerciais ficam na base.
- Morte cobra a penalidade uma única vez por morte real. Reinício coletivo não cobra novamente de quem já morreu.
- Vitória do boss traz os participantes mortos ao ponto seguro. Derrota coletiva reinicia o encontro.
- Dificuldade progride por região. Não aumentar inimigos automaticamente a cada melhoria do equipamento.
- Ajustar encontros, resistência e dano considerando equipamentos e poções; preservar telegraphs e evitar mortes instantâneas.

## 3. Ordem obrigatória de implementação

| Etapa | Entrega | Condição para avançar |
|---|---|---|
| **0 — Arquivar a direção** | Criar `docs/RPG_FOUNDATION_ROADMAP.md` com decisões, etapas, dependências e checklist | Documento versionado e ligado ao README |
| **1 — Personagens modulares** | Masculino/feminino, registro de classes e equipamento visual piloto | Frente/costas, caminhada, mãos e arma aprovados |
| **2 — Inventário e loot** | Mochila, sete slots, drops próprios, migração e persistência pessoal | Coletar/equipar/recarregar funciona no solo e na dupla |
| **3 — Base e economia** | Nave, NPCs, mapa, cofre, poções, compras e fabricação | Completar uma expedição e retornar para melhorar o personagem |
| **4 — Progressão e ameaça** | Revisar recompensas e encontros das regiões existentes | Equipamento e poções ajudam sem eliminar o desafio |
| **5 — Astral** | Kit elemental, recurso, apresentação masculina/feminina | Campanha e bosses jogáveis no solo e em dupla |
| **5A — Caldeira de Dante** | Expansão vulcânica após Vésper, exploração, descoberta, boss Incandescente e dupla | Playtest humano da nova região/boss antes do Vinculador |
| **6 — Vinculador** | Companheiro, simbiose, recurso e apresentação | Criatura navega e não domina nem prejudica o combate |
| **7 — Equipe de quatro** | Lobby sem classes repetidas, estados individuais e bosses para quatro | Campanha completa com as quatro classes |
| **8 — Prólogo** | Introdução, integração narrativa da base e chegada de refugiados | Novo jogador entende a missão e começa a jogar rapidamente |

Cada etapa terá implementação, QA, revisão visual, documentação, versão quando aplicável, commit e push. Atualizar o checklist com evidências e limitações antes de começar a etapa seguinte.

## 4. Introdução e narrativa

Produzir **cinco takes**, aproximadamente oito segundos cada:

1. Terra inabitável e evacuação.
2. Partida das naves com os sobreviventes.
3. Anos de viagem e desgaste da expedição.
4. Descoberta de Dante e aproximação orbital.
5. Pouso da equipe; início da missão de reconhecimento.

Usar ilustrações originais, movimento suave, som, música e legendas em português. Botão **PULAR** sempre disponível; opção **REVER INTRODUÇÃO** no menu.

Exibir uma vez neste navegador, após criar o primeiro personagem. Em convites cooperativos, permitir pular ou concluir antes de confirmar prontidão no lobby.

A abertura confirma a nova premissa fornecida: humanidade em fuga e expedição pioneira. Não definir a causa exata da perda da Terra nem explicar o Signal, o registro humano ancestral ou a origem de Dante.

## 5. Validação, compatibilidade e limites

- Migrar saves e personagens existentes sem reset; versionar inventário e aparência.
- Ampliar os tipos de classe, aparência, inventário e participantes; versionar o protocolo cooperativo e atualizar frontend/relay de forma coordenada.
- Testar mochila cheia, troca visual, compras, fabricação, consumo, morte, reload, armazenamento indisponível e reconexão sem duplicar itens.
- Percorrer toda a campanha com cada classe e com quatro participantes; testar mortes individuais, derrota coletiva e recompensa única.
- Verificar teclado/mouse, touch e gamepad em 1280×720, 1366×768, 1920×1080 e 844×390.
- Medir FPS, memória, entidades, texturas e objetos após viagens e respawns. Meta aproximada: **55–60 FPS**, sem crescimento contínuo.
- Playtest humano obrigatório para aparência dos equipamentos, prazer do ciclo econômico, legibilidade das classes e dificuldade.
- Preservar a mesma build web, sem login obrigatório, saves em nuvem, comércio entre jogadores, PvP ou mundo MMO persistente nesta evolução.
- Conservar o limite atual de nível inicialmente; ampliar após validar a nova curva de poder.
- O plano foi arquivado como a primeira entrega da execução. Alterações posteriores precisam registrar a decisão, a justificativa e o impacto nas etapas dependentes, preservando as escolhas aprovadas.

## 6. Controle de execução

### Biblioteca de testes e aprovação

Decisão do usuário em 09/10/2026: cada sprint deve terminar com um link específico, reunido na [Biblioteca de testes](../test-library.html). O laboratório deve isolar a alteração e preservar saves. A etapa seguinte começa somente após validação humana explícita.

### Regras para cada etapa

1. Ler este plano e inspecionar os sistemas envolvidos antes de implementar.
2. Trabalhar na próxima etapa pendente, preservando as etapas já entregues. Correções de regressão têm prioridade.
3. Não incorporar funcionalidades de etapas futuras por conveniência. Preparar interfaces apenas quando necessário à entrega atual.
4. Registrar arquivos, migrações, testes, métricas, limitações e instruções de playtest em documentação própria da etapa, ligada aqui.
5. Distinguir QA automatizado de avaliação humana; não registrar aprovação visual sem o playtest correspondente.
6. Revisar o diff, executar as verificações aplicáveis, commitar, fazer push e conferir sincronização. Documentação isolada não incrementa a versão do jogo.
7. Avançar depois de atender à condição da etapa. Se depender de avaliação humana, entregar uma comparação jogável e registrar a pendência.

### Checklist

- [x] **Etapa 0 — Arquivar a direção:** plano preservado, referências no README e instruções do repositório. Entrega documental; gameplay e versão 0.1.78 preservados.
- [x] **Etapa 1 — Personagens modulares:** masculino/feminino, roupa, equipamento e junção dos braços aprovados pelo usuário após a versão 0.1.82 (“bem melhor”).
- [x] **Etapa 2 — Inventário e loot:** 24 espaços, sete slots, drops pessoais, migração e persistência; miniaturas corrigidas em 0.1.84 e aprovadas pelo usuário (“Muito bom”). [Relatório/teste](inventory-loot/README.md).
- [x] **Etapa 3 — Base e economia:** base, NPCs próprios, atlas, receitas, cofre, poções e retorno/retomada. Revisão 0.1.88 explicitamente validada pelo usuário antes da etapa 4. [Relatório/teste](base-economy/README.md).
- [ ] **Etapa 4 — Progressão e ameaça:** entrega técnica 0.1.89: curva regional fixa, revisão de recompensas/custos, morte perde 10% dos créditos, auditoria do visitante cooperativo. [Relatório/teste](progression-threat/README.md). Validação humana pendente; o usuário autorizou executar a etapa 5 durante sua viagem sem aguardar esse playtest.
- [ ] **Etapa 5 — Astral:** entrega técnica 0.1.90: quatro elementos alternáveis, Energia Astral, manopla, apresentações masculina/feminina e integração solo/dupla. [Relatório/teste](astral/README.md). Aguardar avaliação humana das etapas 4/5 antes de iniciar o Vinculador.
- [ ] **Interlúdio 5A — Caldeira:** entrega técnica 0.1.94, autorizada antes do Vinculador. Região vulcânica e boss gigante mineral de lava; campanha, dupla local e três kits validados automaticamente. [Entrega e QA](caldera/README.md). Aguardar aprovação humana de visual/ritmo/dificuldade.
- [ ] **Etapa 6 — Vinculador:** entrega técnica 0.1.96; companheiro original, assistência marcada, Vínculo, investida/recuperação, apresentação e equipamento solo/dupla. [Relatório e teste](xenobinder/README.md). Autorizado explicitamente após a revisão vulcânica; aguardando playtest humano. Quatro participantes permanecem na etapa 7.
- [ ] **Etapa 7 — Equipe de quatro:** lobby, classes exclusivas, participantes individuais e bosses.
- [ ] **Etapa 8 — Prólogo:** cinco takes, chegada, integração da base e refugiados.

### Registro inicial — Etapa 0

- Fonte: plano aprovado e reenviado pelo usuário; conteúdo das seções 1–5 preservado, com atualização do estado de arquivamento.
- Entrega: este documento, link no README principal e instrução de leitura em `AGENTS.md`.
- Validação: conteúdo comparado à fonte, links locais e checklist conferidos, `git diff --check` e revisão do escopo documental.
- Versão: 0.1.78, sem incremento por documentação.
- Limitação: nenhuma funcionalidade das etapas 1–8 é anunciada como implementada.

### Entrega técnica — Etapa 1

Versão 0.1.79: masculino/feminino, corpos raster e equipamento visual piloto para Guerreiro/Hunter, registro das futuras classes e biblioteca de testes. [Relatório e limites](modular-characters/README.md). Saves legados preservados; campos opcionais compatíveis no perfil cooperativo. Teste específico: [personagens modulares](https://echosofdante.vercel.app/character-playtest.html). A aprovação humana continua pendente e a Etapa 2 não foi iniciada.

### Revisão visual da etapa 1 — roupa e peças separadas

O usuário rejeitou o encaixe do piloto anterior porque sobrepunha uma armadura a outra já pintada no corpo. A revisão 02 usa corpos em roupa simples e peças registradas por pose, com opções sem proteção/básica/reforçada no laboratório. Os nove itens antigos, atributos e posse permanecem intactos; o slot atual de armadura apresenta somente o torso. Luvas foram incluídas no plano de sete slots. **Aguardando novo playtest humano**; nenhuma etapa de inventário/drops foi iniciada.

Teste: [roupa e equipamentos](https://echosofdante.vercel.app/character-playtest.html?class=warrior&sex=female&kit=clothes).


### Revisão 03 — corpo vestido e proporções — 0.1.81

Revisão 02 rejeitada pelo usuário: Hunter deformado, armadura com aparência colada e relance sem equipamento ao usar Q. Agora as peças substituem regiões de pinturas completas e compatíveis numa textura reutilizada por ator; não há corpo sem proteção sob overlays de armadura. Registro offline preserva a proporção X/Y. Braços usam recortes da área pintada, com espessura real e duas articulações; poses do corpo permanecem compatíveis durante habilidades. Armas: inicial simples, equipamento atual e versão tecnológica avançada, sem alterar atributos existentes.

[Relatório e evidências](modular-characters/revision-03/README.md) · [Teste do Hunter](https://echosofdante.vercel.app/character-playtest.html?class=hunter&sex=female&kit=basic&weapon=current).

**Aguardando aprovação humana.** A etapa 2 permanece bloqueada por esta validação; nenhum inventário ou novo sistema de drops foi iniciado.


### Correção da junção dos braços — 0.1.82

O usuário aprovou a melhoria da revisão 03, mas apontou braços desconectados na roupa simples, sobretudo no ataque do Guerreiro e na postura do Hunter. Correção localizada: encaixes registrados na pintura de cada pose, sobreposição curta da manga dentro do ombro e ordenação da manga próxima à frente do peito. Equipamento, mãos e armas mantêm os encaixes anteriores. Nenhum novo asset raster, estatística ou sistema de gameplay.

[Relatório e capturas](modular-characters/shoulder-fix/README.md) · [Teste reservado](https://echosofdante.vercel.app/character-playtest.html?class=hunter&sex=female&kit=clothes&weapon=starter).

**Aguardar validação desta correção antes da etapa 2.**

### Aprovação da etapa 1 e entrega técnica da etapa 2 — 0.1.83

O usuário aprovou a junção dos braços (“bem melhor”) e autorizou a etapa seguinte. Mochila 24 espaços, sete slots, comparação, peças visíveis, coleta contextual pessoal e persistência com migração dos nove itens. Catálogo compartilhado com relay, protocolo 3; combate, controles, mapas e narrativa preservados.

[Relatório e evidências](inventory-loot/README.md) · [Laboratório reservado](https://echosofdante.vercel.app/inventory-playtest.html).

**Aguardar validação humana da mochila/loot antes da etapa 3.** As pendências anteriores da etapa 1 são registros históricos, superados pela aprovação explícita.

### Entrega técnica da etapa 3 — 0.1.85

Etapa 2 aprovada pelo usuário, que autorizou a base/economia. Base caminhável conectada à Floresta, três serviços pessoais, receitas garantidas, moeda/materiais regionais, cofre 48, poções e destinos descobertos. Protocolo cooperativo 4 com recibos e cura autoritativa. Custos iniciais conservadores; dificuldade e penalidade de morte permanecem para a etapa 4.

[Teste reservado](https://echosofdante.vercel.app/base-playtest.html?v=0.1.85) · [Relatório](base-economy/README.md). **Aguardar aprovação humana antes de iniciar a etapa 4.**

### Revisão visual da etapa 3 — 0.1.86

O usuário aprovou o ciclo da base e pediu identidades civis próprias e mapa mundial visual. Cinco NPCs originais e atlas da região conhecida, com relevo, conexões, descobertas e localização. Nenhuma regra de economia/viagem foi alterada. [Revisão e teste](base-economy/civilian-atlas/README.md). A etapa 4 continua aguardando avaliação desta revisão.


### Clareza de recursos e frequência de equipamentos — 0.1.87

NPCs próprios e atlas aprovados pelo usuário (“perfeito”). Antes de avançar, solicitou saldo visível, materiais explícitos nas receitas e equipamentos mais difíceis de encontrar. Revisão localizada da etapa 3: créditos no topo, receitas com custo/estoque/faltantes, nome do material coletado e equipamento a cada 12 mortes comuns na sessão (bosses mantêm garantia). A fabricação já cobrava créditos + materiais; regra preservada.

[Relatório](base-economy/reward-clarity/README.md) · [Teste reservado](https://echosofdante.vercel.app/base-playtest.html?v=0.1.87). **Aguardar validação desta revisão antes da etapa 4.** O ajuste de frequência foi antecipado por solicitação explícita; dificuldade e penalidade de morte ainda não foram implementadas.


### Retorno e retomada da expedição — 0.1.88

Recursos/receitas da revisão 0.1.87 aprovados pelo usuário (“achei digno”). Em seguida autorizou retorno à base de qualquer ponto e retomada no ponto de saída. Ajuste explícito da decisão anterior de retirada somente em terminais: reduz repetição do caminho para comprar, fabricar e guardar materiais. Guarda um destino pessoal; boss ativo permanece bloqueado. Na dupla, o anfitrião conduz a retomada e o visitante acompanha. Não muda checkpoints, combate, dificuldade ou a ordem das etapas.

[Relatório e teste](base-economy/expedition-return/README.md). **Aguardar validação humana do retorno antes da etapa 4.**

### Aprovação da etapa 3 e entrega técnica da etapa 4 — 0.1.89

O usuário validou o último sprint e autorizou progressão/ameaça, acrescentando a auditoria do visitante cooperativo. Curva regional fixa de HP/dano/XP, economia anterior revisada e preservada, penalidade de 10% dos créditos por morte, aprimoramentos/kit pessoais, recargas e poses reais, portais acessíveis aos dois e derrota/vitória da dupla. Limite atual de nível 10 preservado. Relay protocolo 5; sem novos assets, mapas, classes ou sistemas de combate.

[Relatório, QA e teste reservado](progression-threat/README.md). **Aguardar validação humana da curva e do cooperativo antes da etapa 5 — Astral.** As pendências históricas da etapa 3 acima foram superadas pela aprovação explícita.

### Autorização de avanço durante a viagem e etapa 5 — 0.1.90

Em 10/10/2026, o usuário informou que estaria ausente até terça-feira e autorizou explicitamente terminar a etapa 4 e implementar a etapa 5 sem perguntas ou validação intermediária. Essa autorização supera o bloqueio operacional acima; a avaliação humana da etapa 4 permanece pendente.

Manipulador Astral com pulso de médio alcance, quatro campos elementais, Energia Astral e Q segurar/mirar/soltar; manopla e corpos originais por apresentação/vestimenta. Mesma infraestrutura de equipamento, dano, progressão, controles e campanha. Dupla ainda limitada a dois participantes, protocolo 6. [Arte, valores, QA e laboratório](astral/README.md).

**Entrega técnica não significa aprovação humana.** Não avançar às etapas 6/7 sem a avaliação das etapas 4/5 após o retorno do usuário.

### Revisão elemental do Astral — 0.1.91

No primeiro playtest da etapa 5, o usuário gostou da classe e pediu que o básico refletisse o elemento e que Q possuísse manifestações visuais próprias. Revisão dentro da etapa 5: projéteis elementais, chão em chamas, onda, rocha emergindo com empurrão e malha energizada. Arte original e texturas preparadas offline; mesma economia, controles e rede. [Relatório/teste](astral/elemental-v2/README.md). **Aguardar a avaliação desta revisão antes da próxima classe.**

### Cor do dano e afinidades — 0.1.92

Manifestações de 0.1.91 aprovadas pelo usuário (“Gostei bastante”). Solicitou números coloridos pelo elemento e vantagem conforme a criatura. Regra inicial: fogo +25% contra glaciais, água +25% contra criaturas do Siroco; demais combinações neutras. Básico/Q/DOT preservam o elemento capturado. Vantagem indicada por ↑ e bestiário; anfitrião calcula e replica feedback ao visitante. [Regras e evidências](astral/elemental-affinities/README.md). **Validar dificuldade desta revisão e pendências da etapa 4 antes da etapa 6.**

### Perfis de todas as espécies — 0.1.93

Revisão de 0.1.92 bem recebida; o usuário ampliou explicitamente a regra para todas as criaturas e pediu resistência à água nos glaciais. Configuração obrigatória para as 13 espécies, incluindo bosses: uma fraqueza (+25%), uma resistência (−25%) e dois elementos neutros. Mesma regra por alvo no solo e na dupla; setas ↑/↓ e perfis no bestiário. [Tabela, QA e teste reservado](astral/species-profiles/README.md). Não há combinações encadeadas, imunidades, novos ataques ou antecipação de outra etapa. **Validar esta matriz e as pendências da etapa 4 antes do Vinculador.**

### Mudança autorizada de prioridade — Caldeira · 0.1.94

O usuário confirmou que os perfis elementais funcionam e, antes da etapa 6, solicitou uma região vulcânica caminhável. Aprovou a proposta de Caldeira após Vésper e acrescentou explicitamente um boss semelhante em escala a um gigante de lava. Interlúdio 5A: caminhos de basalto, dois desvios, registro ancestral, mecanismo, checkpoint, arena e O Incandescente, criatura original. Reutilizar kit/economia/colisões/rede; conservar os limites atuais de nível/classes/participantes. Próxima ordem autorizada: **Caldeira → playtest humano → Vinculador → equipe de quatro → prólogo**. Pendências de avaliação geral da etapa 4 continuam registradas. Não copiar conteúdo/arte/layout de jogos citados como referências.

### Revisão de escopo — expedição vulcânica · 0.1.95

O usuário considerou a 0.1.94 insuficiente por ter apenas um mapa com boss e moradores reutilizados. Solicitou **pelo menos três mapas até o boss e monstros autênticos do ambiente**. Costa das Cinzas e Garganta de Obsidiana antecedem as Forjas, com três espécies novas, 24 habitantes, seis desvios e registros que revelam passagem. Incandescente preservado no final. [Entrega, arte e QA](caldera/expansion/README.md). Não interpretar a revisão anterior como aprovação humana; aguardar playtest desta expedição antes do Vinculador.

### Encerramento vulcânico e avanço autorizado — etapa 6 · 0.1.96

Em 13/10/2026, o usuário solicitou explicitamente revisar/commitar a tarefa vulcânica e implementar imediatamente o Vinculador, com o kit descrito no plano. Essa autorização supera a espera operacional anterior; não equivale a aprovação visual da expedição por automação. Revisão vulcânica encerrada em `83cf3a6`, após `95f9bfa`, ambas em origin/main.

Vinculador: humano de expedição com condutor vivo e uma criatura original permanente; FOLLOW/ASSIST/COMMAND/RETURN, assistência somente ao alvo acertado, Vínculo acumulado em combate, Q hold/aim/release com investida e recuperação próxima limitada. Corpo/armas/companheiro raster original offline, equipamento por partes e mesma infraestrutura de combate/campanha/dupla. Protocolo 9; não antecipar quatro jogadores ou prólogo. [Entrega e QA](xenobinder/README.md). **Aguardar validação humana da etapa 6 antes da etapa 7.**

### Revisão solicitada dos dois rigs — 0.1.97

Em 14/10/2026 o usuário aprovou a sensação do kit, mas rejeitou braços e caminhada dos dois personagens mais recentes. Auditoria de manutenção dentro das etapas 5/6: ombros medidos por vestimenta, ossos de comprimento constante, punho/mão/instrumento registrados, ordenação frente/costas/perfil e poses de pernas completas produzidas offline. Mesma apresentação no solo, na dupla e no menu; nenhum valor de combate, recurso, controle, mapa ou protocolo foi alterado. [Auditoria, testes e links reservados](caster-motion-audit/README.md). **Aguardar aprovação humana desta revisão antes da etapa 7.**

### Rejeição visual e revisão dos braços — 0.1.98

A captura enviada pelo usuário rejeitou os braços da 0.1.97. Correção focada: pintura sem punhos artificiais nas junções, escala uniforme, articulações registradas dentro do PNG, mão proporcional/relaxada, antebraço e manopla no mesmo eixo, punho do condutor ajustado e ordenação da manga sob o torso. Pernas, corpos, kit, controles e valores preservados. QA passa a verificar pixels opacos nas junções e ausência de estiramento, além das coordenadas. [Entrega e teste](caster-motion-audit/revision-02/README.md). **Ainda aguardar aprovação visual antes da etapa 7.**
