# Expedição vulcânica — 0.1.95

Revisão solicitada pelo usuário: a entrega 0.1.94 tinha um mapa com boss e moradores reaproveitados do Siroco. A expansão passa a ter **três mapas exploráveis conectados antes do encontro**, com um ecossistema próprio.

## Teste reservado

[Começar a expedição](https://echosofdante.vercel.app/caldera-playtest.html?kit=advanced&v=0.1.95) · [Garganta de Obsidiana](https://echosofdante.vercel.app/caldera-playtest.html?region=obsidian&kit=advanced&v=0.1.95) · [Forjas](https://echosofdante.vercel.app/caldera-playtest.html?region=caldera&kit=advanced&v=0.1.95) · [Boss](https://echosofdante.vercel.app/caldera-playtest.html?boss=1&kit=basic&v=0.1.95).

Mesma build, personagens temporários e saves reais preservados. O botão de região permite comparar os mapas; recolha o painel para jogar. O teste sem parâmetros começa na Costa, não no boss.

## Percurso

**Vésper → Costa das Cinzas → Garganta de Obsidiana → Forjas da Caldeira → arena do Incandescente.**

| Mapa | Identidade | Ritmo |
|---|---|---|
| Costa das Cinzas | Vapor da borda glacial, cinza clara e basalto | Apresentação do Rasga-brasa, depois primeiros Foles e combinações; sete moradores |
| Garganta de Obsidiana | Pedra vítrea escura, margens de lava e canais soterrados | Introdução do Dorso, depois grupos mistos; oito moradores |
| Forjas da Caldeira | Crosta antiga, minerais e estruturas térmicas | Nove moradores em grupos; registro de basalto, checkpoint e limiar do boss |

Cada mapa possui caminhos abertos, desvios e silêncio entre encontros. Costa e Garganta têm duas rotas opcionais cada, registro ancestral, portal de retorno e passagem adiante revelada pela investigação. As Forjas preservam seus dois desvios. **Nenhuma passagem exige limpar todos os inimigos.** Não há portais que pulem diretamente da entrada ao boss na campanha nova.

O Incandescente e sua arena permanecem no extremo das Forjas, após os três mapas. Não foi alterado o kit do jogador, HP do boss, suas três fases ou recompensa única.

## Criaturas originais

| Espécie | Anatomia / silhueta | Função | Fraqueza / resistência |
|---|---|---|---|
| Rasga-brasa | Predador baixo, quatro patas musculosas, mandíbula mineral e placas térmicas | Persegue, firma as patas, anuncia uma linha e arranca; recuperação permite contra-ataque | Água / fogo |
| Fole de Magma | Reservatório orgânico em patas curtas, foles dorsais vivos | Mantém distância; foles inflam antes de lançar magma em direção comprometida; rochas bloqueiam | Água / fogo |
| Dorso de Basalto | Escudo baixo de obsidiana, tecido exposto, patas e punhos pesados | Aproximação lenta; impacto de área anunciado, com recuperação longa | Energia / terra |

São pinturas/anatomias próprias, não recolorações dos habitantes do Siroco. Cada uma possui seis poses raster registradas: repouso, dois apoios de caminhada, preparação, execução e reação. Arte permanece em pé, com giro horizontal, sem rotação que coloque o corpo de cabeça para baixo. Nomes, HP, dano, morte, XP, materiais e perfis elementais usam os contratos atuais.

`VolcanicCreature` possui estados explícitos para os três padrões, usando Health, Movement, EnemyImpact e detecção varrida existentes. Não há novo framework de IA, pathfinding, combate, controles ou classe. Cada Fole reutiliza um projétil; avisos e UI são criados uma vez por ator.

## Progressão e campanha

Curva fixa: Costa 1,55 HP / 1,25 dano / 32 XP; Garganta 1,7 / 1,35 / 35 XP; Forjas mantêm 1,8 / 1,4 / 36 XP. A criatura fornece sua base anatômica e recebe o fator uma vez. Equipamento não aumenta automaticamente a ameaça. Cada desvio concede os 20 XP atuais uma vez. Materiais âmbar, créditos, drops raros de equipamento e poções usam a economia atual.

Registros novos preservam sua resposta após morte e viagem. Retorno à base, retomada e atlas incluem os mapas. Saves antigos que já visitaram a Caldeira conservam acesso, registros anteriores e vitória; não são obrigados a refazer o caminho. O progresso do visitante permanece pessoal conforme a campanha cooperativa existente.

## Arte e execução

Fontes originais em `source-art/`, prompts em `illustration-prompts.md`. Preparação offline: `python scripts/prepare-volcanic-art.py`. Dois pisos WebP 1536×1024 (~411/450 KB), três atlas PNG 768×512 (~351/427/473 KB), frames 256² com apoio na linha 244. Alpha real preservado, fragmentos soltos removidos e escala comum por espécie. Total novo de imagens de runtime: aproximadamente 2,1 MB.

Piso contínuo e composição estática em três RenderTextures por mapa. Rochas, raízes, remanescentes e minerais existentes integrados com contato e sombras; colliders simples, gameplay e câmera atuais. Sem desenho de cenário por frame, geração de arte no navegador ou partículas infinitas.

Duas trilhas originais adicionais, arranjadas e renderizadas offline pelo compositor existente: **Costa 123,9 s** (ar/vapor, 62 BPM) e **Garganta 137,1 s** (pulso grave, 56 BPM), ~1,7/1,9 MB MP3. As Forjas e a luta conservam seus temas próprios. Sem samples externos ou novo sistema de áudio. [Métricas](audio-measurements.json).

## QA e limites

Resultados da [expedição](qa/report.json), [portais ida/volta até Vésper](qa/return.json) e [boss](boss-qa/report.json).

- Driver Gamepad API percorreu caminhos e quatro desvios novos por movimento real; registros abriram os portais e os três mapas foram alcançados. Invulnerabilidade foi usada para auditar navegação, não dificuldade.
- As três espécies prepararam seus padrões, atingiram o jogador, morreram e concederam **35 XP por kill na Garganta**, com material/crédito. Posição e dano letal de fixture foram usados para isolar cada caso.
- Migração de save 0.1.94, retorno à base/retomada, três mortes e respawns: **104 objetos / 212 texturas / dois tweens** estáveis na Garganta após derrotas. HP restaurado e registro preservado.
- Dupla WebSocket local: visitante abriu ambos os registros e viajou até as Forjas, recebeu os mesmos corpos/poses e usou Q por **CDP touch hold → drag → release**, mantendo o zoom da página.
- Incandescente: três fases, quatro ataques, morte/reinício da dupla, portais, recompensa única de 260 XP/domínio e persistência. **144 objetos / 217 texturas / um tween** constantes nos três reinícios; uma única instância do boss.
- Viewports 1280×720, 1366×768, 1920×1080 e 844×390. Sem erros JS/assets nos relatórios. FPS: **58,2/56,3** na dupla da expedição e **60,2/60,2** no QA do boss, no mesmo computador.
- `npm run typecheck`, `npm run build` e `git diff --check` passaram. Permanece o aviso anterior sobre tamanho do bundle Phaser.
- [Regressão da campanha anterior](campaign-regression/campaign.json): Forest, Cavern, Warden, Vale, Siroco, Dunas, Soterrado, Fratura, Galerias e Vésper; equipamento, dano nos dois participantes, coleta, portais, persistência e respawn. Passou sem erros JS. Esta suíte declara suas fixtures de posicionamento/HP.

Sem acesso físico a iPhone/gamepad. Perseguição direta pode manter criaturas junto de rochas; não foi introduzido pathfinding. Aprovação de ritmo/dificuldade não é inferida das fixtures.

Dupla integrada a todas as conexões novas, snapshots das pinturas e avisos, interações do visitante e recompensa. **Relay requer protocolo 8**; validação local não confirma deploy público do Render. A sala continua limitada a dois jogadores.

**Playtest humano necessário:** avaliar diferença entre os três mapas, leitura de criaturas, caminhada/apoio, intensidade dos grupos, espaços de descanso e preparação para o boss. Não iniciar Domador de feras antes dessa avaliação.

Atualização de execução em 13/10/2026: o usuário autorizou explicitamente finalizar esta revisão e implementar a etapa 6 sem esperar uma validação intermediária. Revisão encerrada tecnicamente em `83cf3a6`. A regra de espera acima é o registro histórico anterior; avaliação perceptual continua humana e não foi presumida aprovada. [Domador de feras](../../xenobinder/README.md).

## Publicação

Implementação `95f9bfac880274f6b5e072e02abb41dc943f3090`, versão **0.1.95**. Deploy Vercel concluído; [QA público](qa/public/public.json) passou: três mapas, três classes, controles, quatro viewports e carregamento das músicas novas após input real. Onze arquivos de imagem/música verificados por HTTP; fontes e evidências ficam nesta pasta. Biblioteca de testes atualizada.

**Salas online pendentes:** o Render respondeu protocolo **4** em 13/10/2026, enquanto esta campanha exige **8**. Precisa publicar o `origin/main` atual no serviço `echoes-of-dante-rooms`. Não houve acesso ao painel/autorização autenticada do Render para executar esse deploy. O resultado `passed` do smoke público refere-se ao solo; `coop: blocked-relay-deployment` registra a pendência separadamente.
