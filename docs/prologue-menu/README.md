# Campanhas, equipe original e chegada a Dante

## Escopo

Autorização do usuário em 14/10/2026: reorganizar o menu, separar jornadas solo/cooperativas, fixar dificuldade e tamanho da equipe e implementar o prólogo nesta entrega. Essa autorização substitui a espera operacional anterior pela etapa 8; não representa aprovação humana das novas ilustrações.

[Teste reservado](https://echosofdante.vercel.app/campaign-playtest.html) · [Biblioteca](https://echosofdante.vercel.app/test-library.html).

O laboratório usa somente armazenamento de sessão próprio, inclusive para seleção e preferências. Recarregar mantém seus personagens temporários; fechar a aba encerra o teste. Saves reais não são lidos nem alterados. Os convites permanecem no laboratório.

## Menu e continuidade

- Início: **Jogar / Configurações**.
- Jogar: **Continuar expedição / Novo jogo / Cooperativo**.
- Continuar solo abre somente personagens solo, com suas próprias jornadas.
- Cooperativo: **Iniciar novo jogo / Continuar jogando com amigos / Entrar por convite**.
- Novo jogo define dificuldade; em equipe, define também **2, 3 ou 4 integrantes**, com classes diferentes. Depois cria nome, classe e apresentação.
- Configurações estão disponíveis em todos os menus, inclusive no prólogo. Esc e o botão B do controle voltam pela hierarquia; Start abre a pausa.
- Durante a expedição não existe troca de personagem. Retornar ao início salva e encerra a conexão antes de selecionar outra jornada.

Personagens antigos continuam solo, na dificuldade média, sem perder o registro existente e sem receber prólogo retroativo. Nenhum personagem é criado automaticamente em um navegador novo. O limite existente de seis personagens permanece.

## Equipe original completa

A decisão explícita do usuário é exigir **todos os personagens originais**, inclusive o anfitrião. A formação é selada quando o anfitrião inicia uma sala completa. Cada navegador precisa guardar a composição antes de liberar a simulação.

Cada personagem possui identificador e credencial local; o manifesto compartilhado contém somente hashes SHA-256. O servidor valida campanha, dificuldade, tamanho, classe e identidade. Convites contêm somente o código público da sala.

Ao faltar alguém, a cena e seu relógio de combate param: sem viagem, combate, consumo ou avanço das recargas de habilidades. O intervalo real já existente das poções continua usando seu timestamp persistente. O integrante original pode retornar; a vaga não é liberada para substitutos. Ao sair o anfitrião, a sala termina e os demais voltam ao menu, sem converter aquela campanha em solo.

Para continuar outra sessão: anfitrião seleciona o mesmo personagem, reúne uma sala e envia o novo convite; cada amigo seleciona seu personagem original. O grupo só começa completo. Cada integrante conserva seu equipamento, XP, economia e os marcos compartilhados da campanha. O save do anfitrião continua sendo a autoridade do mundo.

Não há conta ou save na nuvem: personagens dependem do navegador original. Excluir um personagem original ou apagar seus dados impede completar aquela equipe. A sala não é um servidor persistente de mundo; o anfitrião deve reunir novamente o grupo após ela encerrar.

## Dificuldade

Multiplicadores sobre o balanceamento regional existente; jogador, XP, drops e kit não são alterados automaticamente.

| Jornada | Vida de inimigos e bosses | Dano recebido |
|---|---:|---:|
| Fezes puríssima — superfácil | ×0,70 | ×0,45 |
| Marromenos — médio | ×1,00 | ×1,00 |
| Chama 🔥 — difícil | ×1,35 | ×1,35 |

| Equipe original | Vida de moradores | Vida de bosses | Dano | Reservas por região explorável |
|---|---:|---:|---:|---:|
| Solo | ×1 | ×1 | ×1 | 0 |
| 2 | ×1,55 | ×1,65 | ×1,05 | até +1 |
| 3 | ×2,05 | ×2,30 | ×1,10 | até +2 |
| 4 | ×2,60 | ×3,00 | ×1,15 | até +3 |

Os dois conjuntos de multiplicadores se combinam. A dificuldade e o tamanho são fixados na criação da jornada; sair da sala ou trocar equipamento não os reduz.

Reservas são posições pequenas e definidas por dados, próximas de encontros existentes. Carregam ao aproximar-se, respeitam os limites e evitam sólidos. Base e arenas não recebem novos grupos. Não existe geração de arte em runtime, nova IA ou onda infinita. As reservas não têm renovação automática: o sistema regional existente continua responsável pelos habitats normais.

## Prólogo

Cinco pinturas originais, aproximadamente **8 segundos por take / 40 segundos no total**:

1. **O último lar:** a Terra já não pode abrigar a humanidade.
2. **O que levamos:** evacuação e sobreviventes.
3. **Anos entre estrelas:** desgaste e esperança.
4. **Dante:** aproximação do planeta.
5. **A primeira expedição:** pouso para reconhecer e preparar a chegada dos demais.

Novo personagem assiste antes de entrar na jornada. Pular ou avançar está sempre disponível. Configurações e aba oculta suspendem o take; rever nas configurações não altera progresso. Ao terminar, solo chega à base; cooperativo abre a formação da equipe antes de começar na base. Não revela origem do Signal, First Echo ou história do Warden.

### Arte e áudio

`public/assets/prologue/`: cinco WebP de **1439 × 810**, aproximadamente **847 KB somados**. Imagens originais geradas com a ferramenta de imagem, preparadas offline; [prompts e origem](illustration-prompts.json). Sem fontes externas ou geração durante o jogo. Renderização usa uma imagem reutilizada, legenda e movimento CSS discreto; respeita preferência por movimento reduzido.

Áudio reutiliza a trilha das profundezas pelo AudioManager existente. Volumes compartilhados com as configurações, botão para desbloquear som e funcionamento silencioso quando autoplay é recusado. Aprovação da narrativa visual e escuta dependem de playtest humano.

## Verificação

Resultados técnicos e capturas em `qa/`. Scripts desta entrega:

- `node scripts/qa-campaign-protocol.mjs`: equipes 2/3/4, manifesto, autenticação, pausa, retorno, recompensas e restrições.
- `node scripts/qa-campaign-menu.mjs`: fluxo real de criação/continuação, prólogo, dificuldades, resoluções e isolamento.
- `node scripts/qa-campaign-continuity.mjs`: quatro navegadores pelo menu real, ausência/retorno, salvamento e nova sessão.
- QA de regressão de combate/campanha e performance registrado no relatório final.

### Resultado técnico local — passou

| Verificação | Evidência |
|---|---|
| Typecheck / build de produção | `npm run typecheck` e `npm run build`, sem erros; aviso conhecido do chunk Phaser acima de 500 KB |
| Relay 2/3/4, equipe original, impedimento de substituição e pausa | [Protocolo](qa/protocol-report.json) |
| Menu, nomes com A/L e acentos, cinco imagens, take de ~8 s, pular/rever, pausa nas configurações | [Menu](qa/menu-report.json) |
| Entrada real, ausência, retorno, marcos pessoais e nova sala com os mesmos personagens | [Dupla](qa/continuity-2-report.json) e [quatro](qa/continuity-4-report.json) |
| Quatro kits, poções, recompensas pessoais, dano, portais por cada visitante, 14 regiões e quatro bosses | [Regressão de quatro](qa/four-regression/report.json) |
| Três derrotas/respawns coletivos | 440 objetos, 250 texturas, 25 tweens e três aliados remotos em todos os ciclos; sem crescimento |
| Fluxo original solo, Echoes/fissura/mecanismo/First Echo/Warden/vale, persistência e falhas de armazenamento | [Campanha solo](qa/solo-campaign/report.json) |
| 1280×720, 1366×768, 1920×1080 e 844×390; touch e gamepad | Chrome, toque CDP e Gamepad API simulada; [capturas do prólogo](qa/prologue-844.png) e relatórios acima |
| Build compilada, sem exports DEV: quatro convites, mundo compartilhado, saída do anfitrião, menu touch e ajustes pelo gamepad | [Produção local](qa/production/report.json) |
| Performance com um Chrome visível e convidados Node | [Oito medições](qa/performance/report.json): grupos 2/3/4 e Forest/Cavern/Warden/Siroco/gelo/Caldeira |

Nenhum erro JS ou carregamento de asset nos relatórios concluídos. Na medição de performance, amostras de **53,1–57,7 FPS** durante aquecimento, com últimas amostras próximas de **55–58 FPS**, equivalentes ao perfil anterior desta máquina. O fluxo solo registrou média de **58,0 FPS**, sem escritas de save durante ociosidade. Quatro navegadores compartilham a GPU do computador de QA; isso não equivale a quatro dispositivos físicos. Bake/cache ambiental foi preservado.

O teste de retomada encontrou e corrigiu duas regressões: classe do próprio titular marcada como ocupada e pausa de menu confundida com pausa da equipe, contabilizando tempo duas vezes. Os ciclos foram repetidos até os relatórios de dupla/quatro passarem, inclusive recebimento do mundo e salvamento após voltar.

**Resultado humano:** pendente. Os multiplicadores iniciais requerem teste de diversão nas três dificuldades e com grupos reais; automação não decide esse balanceamento. Não houve teste físico de iPhone ou gamepad. Avaliar as pinturas, ritmo/legibilidade das legendas e música.

## Publicação

Esta entrega exige **protocolo 11** no relay e cliente correspondente. Se o Render ainda estiver na versão anterior, o jogo informa que o servidor precisa atualizar; não tenta entrar em uma campanha incompatível. Deploy Vercel e Render são independentes. O estado público efetivamente verificado será registrado ao encerrar a entrega.

### Verificação pública — 14/10/2026, 18h25 BRT

**Vercel publicada**, commit de implementação `0e1cc545e2e3a3da4a08f6acb2d48ae4f00b0e6d`. [QA no endereço oficial](qa/public/report.json): criação de Astral, cinco imagens, entrada solo após o prólogo, dificuldade persistida, menu inicial e configurações por touch/gamepad. Sem erro JS ou asset quebrado. O laboratório também está publicado.

**Cooperativo público pendente de infraestrutura.** Requisições ao `/coop/health` público expiraram. O [incidente oficial do Render](https://status.render.com/incidents/8tsd93r1wbmz) permanece identificado: builds/deploys não iniciam em todas as regiões e deploys de serviços gratuitos estão pausados. [Estado consultado e fontes](qa/public/deployment.json). Não foi possível confirmar o protocolo 11 na hospedagem nem executar quatro amigos no relay público; os testes de quatro da build compilada usaram o relay local real.

Após a recuperação do serviço, conferir `/coop/health` com protocolo 11 e executar `QA_BASE=https://echosofdante.vercel.app` e `QA_OUT=docs/prologue-menu/qa/public-coop` com `node scripts/qa-campaign-production.mjs`, sem `QA_NO_COOP`. Isso valida quatro navegadores no endereço público. A pendência é de publicação/verificação, sem requerer mudança adicional de gameplay ou avançar outra etapa do plano.
