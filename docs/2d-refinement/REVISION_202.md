# 0.1.202 — Batedor/Batedora com profissão de Guerreiro

Em 07/11 o usuário aprovou a composição do seletor da 0.1.201 e relatou o bloqueio de Batedora + Guerreiro. O bloqueio era explícito e correspondia à falta de pinturas e de identidade visual independente no perfil. Esta entrega implementa esse primeiro cruzamento para avaliação, nos dois gêneros. **Os outros 11 cruzamentos continuam pendentes.** Não declarar todas as combinações entregues.

## Implementação

- `visualPreset` é um campo aditivo do perfil e do roster. `classId` continua sendo a profissão: HP, velocidade, poderes, equipamentos, XP e identidade da equipe não são derivados do corpo. Personagens antigos sem o campo usam sua própria classe como visual. IDs, chaves de save, jornadas e metadados antigos permanecem.
- Um único seletor, na ordem aprovada, agora fica independente também no jogo principal. Pares disponíveis demonstram o combate da profissão com a figura correta. Opções ainda sem poses são identificadas, mantêm a pessoa escolhida em repouso e bloqueiam a criação. Falha de carregamento apresenta mensagem útil, sem colocar outro corpo no lugar.
- Seis folhas completas originais: Batedor/Batedora, roupa inicial, carapaça básica e reforçada, com sabre. Oito direções, repouso, quatro fases distintas de passos e ação compacta. O sabre faz parte da pintura da figura inteira. Nenhum editor de rosto/cabelo/pele voltou.
- Criação, lista salva, mundo e aliados usam a mesma família de pinturas/configuração. Cabeça e equipamento pertencem ao mesmo personagem. A composição de materiais e do capacete conserva o mecanismo de equipamento existente; não utiliza peças dos outros corpos para construir uma nova pessoa.
- Combate reaproveita básico, Q, esquiva e colisão do Guerreiro. Pivôs ópticos próprios; escala de exibição 128 constante, sem bake a cada frame. Registro dos pés e dimensionamento são preparados offline sobre a figura inteira.
- Relay mantém protocolo 16 e anuncia `identities:1`. Combinações sem arte são recusadas. Equipes com novo cruzamento exigem clientes atualizados, incluindo na reconexão; salas só com pares originais continuam compatíveis. Não altera recibos, requisitos, vitórias, drops ou a regra de profissões distintas.
- Fontes de roupa continuam em cache CPU por jogo; somente a figura equipada vira textura de renderização. No coop, as fontes novas são solicitadas apenas para os cruzamentos presentes na equipe. [Autoria, prompts, medidas e reprodução](../preset-pilot/README.md).

## Acessos isolados

- [Criar Batedora Guerreira](https://echosofdante.vercel.app/campaign-playtest.html?refinement=202&presets=1&preset=hunter&class=warrior&sex=female&v=0.1.202).
- [Caminhar, atacar, usar Q e esquiva](https://echosofdante.vercel.app/character-playtest.html?refinement=202&preset=hunter&class=warrior&sex=female&kit=clothes&v=0.1.202).
- [Batedor com armadura](https://echosofdante.vercel.app/character-playtest.html?refinement=202&preset=hunter&class=warrior&sex=male&kit=reinforced&v=0.1.202).

A criação começa na base sem requisito ou boss vencido simulado. O ensaio de movimento prepara Floresta/roupa indicada, sem progresso real. Todos usam namespace temporário da aba e preservam personagens canônicos. Registrados em `test-library.html`.

## QA e limites

- [x] `typecheck` e `build` (329 módulos); `git diff --check`.
- [x] Pixels dos seis atlas: transparência, bordas, oito direções, quatro poses de pernas diferentes, hashes e escala por direção; [relatório](qa/202/asset-geometry/report.json).
- [x] Matriz de 32 seleções, dez entradas jogáveis e 22 ainda sem poses, demonstração, criação nativa, voltar/rascunho, reload, personagem salvo, falha de download induzida, movimento reduzido e isolamento; [relatório](qa/202/selection/report.json).
- [x] Movimento/básico/Q nativos em dois gêneros/três equipamentos; 128 de exibição e bake estável; [relatório](qa/202/motion/report.json). Marcha de quatro fases validada nos pixels, além do índice de frames.
- [x] Touch CDP e gamepad padrão emulado nas quatro classes (Guerreiro com o novo visual), quatro resoluções de criação: 844×390, 393×852, 1024×768 e 1920×1080; [relatório](qa/202/input/report.json).
- [x] Dupla nativa em dois navegadores, convite, criação e mundo: mesmo visual Batedor em Guerreiro e Caçador, identidades locais/remotas corretas, protocolo 16/`identities:1`; [relatório](qa/202/native-coop/report.json).
- [x] WebSocket real: clientes antigos, par sem arte, sala mista e reconexão por token; [relatório](qa/202/relay/report.json).
- [x] Capacete removido/adicionado nas roupas mistas dos dois gêneros, comparação de visual na mesma profissão e navegação do laboratório; [relatório](qa/202/mixed-gear/report.json). Capturas inspecionadas.
- [x] Regressão de movimento/básico/Q dos quatro originais, dois gêneros e três roupas do Guerreiro: [relatório](qa/202/original-motion/report.json).
- [x] Capturas de criação, base, marcha, Q, armadura, mobile e dupla inspecionadas pelo agente. Isso não é aprovação estética humana.
- [x] Aplicação `edacbb34274e0910c6fc39060434bdb3d596659a` em `origin/main`, Vercel success e 46 hashes de HTML/JS/CSS/novos atlas conferidos; [hashes públicos](qa/202/publication-hashes.json). HTML normaliza apenas quebras de linha e linhas vazias; demais recursos são comparados byte a byte.
- [x] Seleção/criação/reload/falha de download e movimento/básico/Q públicos nos dois gêneros e três roupas; [seleção](qa/202/public-selection/report.json), [movimento](qa/202/public-motion/report.json). Capturas públicas de base, sabre e ação inspecionadas. Os parâmetros históricos `head/hair` das suítes são ignorados e não representam edição aplicada.
- [ ] Coop público com `identities:1` conferido. Saúde conferida em 07/11 ainda informa `512a38f`, sem a nova capacidade; [evidência](qa/202/relay-public-before.json).
- [ ] Playtest humano do novo cruzamento. **Composição da tela aprovada; novas pinturas ainda não.** Aguardar antes de multiplicar para as outras profissões ou avançar níveis/mapas/civilização. 3D continua pausado; computador ligado.

Execuções em Chrome automatizado no Windows; touch/gamepad são emulados. Não representa iPhone físico, controle físico, grupo humano de quatro ou campanha completa. Não houve medição de FPS nesta entrega.

[Estado da publicação e gate do relay](qa/202/publication.json). Commits posteriores somente de documentação/QA não alteram o runtime confirmado acima.
