# Posto das Nascentes · 0.1.166

Em 28/10/2026 o usuário respondeu “vamo” à proposta de um primeiro posto em região conquistada: Nara organiza, Lia verifica sobrevivência, Ivo verifica apoio, jogador conduz equipamento e instala um posto com moradores. Esta autorização cobre **somente este capítulo**, não o restante da entrega D. A aprovação dos NPCs 0.1.165 continua distinta da avaliação humana dos cinco capítulos anteriores e da duração da campanha.

## Capítulo — Um lugar entre as margens

Requer os relatórios originais e os cinco capítulos da permanência, até a chegada de Mara/Choco. A Bacia das Nascentes precisa estar conquistada: os seis habitats originais, seis residentes regionais e as reservas correspondentes ao tamanho fixo da equipe já derrotados. Usa os registros permanentes existentes, inclusive de saves anteriores; nenhum inimigo, onda ou recompensa de combate é recriado. Não é requisito para portais ou bosses.

Oito objetivos: comparar a linha de cheia, verificar apoio sul, separar carga reservada na base, engatar, conduzir/descarregar fisicamente, escolher o terreno seco, transferir Mara/Choco e conferir as condições. A escolha na margem baixa recusa a fundação sem gastar a carga; observações anteriores explicam a diferença. A carga usa o movimento e os colisores existentes, acompanha qualquer integrante próximo e volta ao engate após viagem/morte/reload enquanto pendente. Entrega a Nara concede **140 créditos por integrante, uma vez**, sem XP novo ou consumo de equipamentos pessoais.

O posto usa a pintura completa de módulo aprovada, reservatório e toldo integrados, regulador da nave e caixas lacradas. Mantém a água pesquisada/tratada nos capítulos anteriores; não abre outra captação nem conecta equipamento humano à tecnologia antiga. Mara e Choco deixam o segundo alojamento dos Terraços quando assumem o posto; seus IDs e ritmos aprovados são preservados. Tio Gui/Elisa continuam no primeiro abrigo, serviços na base. Estruturas e geografia usam instâncias/cache, sem redesenho estático por frame.

## Laboratório e coop

[Teste direto](https://echosofdante.vercel.app/campaign-playtest.html?permanence=outpost&v=0.1.166), com namespace temporário próprio por classe/capítulo. Simula Warden, sete relatórios originais, cinco capítulos e Bacia conquistada (incluindo reservas da equipe), sem XP/drops das derrotas simuladas. Capítulo do posto pendente, sem seus créditos. Soterrado, Vésper e Incandescente continuam vivos. Não altera saves reais. No coop, só o anfitrião pode preparar a equipe original reunida.

Protocolo permanece 16: transporte, evidências e pessoas usam formatos existentes. O relay passa a anunciar a capacidade opcional `outposts:1` e o catálogo ampliado. Cliente bloqueia este capítulo em relay anterior, preserva o save e mantém campanhas anteriores disponíveis. É necessária publicação do relay com essa capacidade antes de declarar o novo capítulo disponível no coop público.

## Evidências e avaliação

- [x] Typecheck/build (255 módulos) e revisão das diferenças de código. Mantém o aviso conhecido de tamanho dos chunks.
- [x] Solo, pré-requisitos, escolha, carga, colisões, morte/reload, recompensa única e saves anteriores.
- [x] Anfitrião/convidado, transferência dos moradores e reconexão, com dois Chrome locais.
- [x] Touch/gamepad emulados, resoluções e inspeção visual das capturas.
- [x] Commit de aplicação `664b039d74f04bec8dc970744b7fe35ec4aa5851` enviado e sincronizado; aplicação pública conferida.
- [ ] Compatibilidade real do relay público conferida.
- [ ] Playtest humano deste capítulo. Aguardar antes de outra etapa.

QA técnico não mede diversão, duração ou naturalidade humana. Sem teste em celular físico/equipe humana de quatro e sem garantia de 30 minutos/oito horas.

### 29/10 — QA local

[Modelo e saves](qa/model/report.json): exige chegada anterior e segurança da região; 12 habitantes originais/regionais mais 1/2/3 reservas conforme a equipe. Evidências e recibos sobrevivem ao schema anterior, indisponibilidade de capacidade e falha/retry de armazenamento. Recompensa de 140 créditos uma vez, mantendo XP e materiais.

[Solo completo](qa/solo/solo.json): E nos oito objetivos, escolha inundável recusada, descarga sem estrado recusada, condução por WASD, entrega real a Nara, reload/recibo, quatro resoluções e três retornos estáveis. [Regressão do transporte anterior](qa/transport-regression/solo.json): percurso/entrega/reload e recompensa original preservados. Esses scripts usam posicionamento/invulnerabilidade para cobrir interações, não medem descoberta ou dificuldade.

[Mundo e persistência](qa/world/report.json): uma ameaça original restante mantém o posto bloqueado; morte pelo caminho comum de dano libera a segurança, sem reaparecimento ou XP repetido após viagem/reload. Caminhada/Dash colidem com estrado; morte real/R/reload mantêm apenas uma carga pendente no engate. Inserção do módulo resolve ator dentro do volume; doze aproximações/portais/retornos continuam conectados. Conversas por E, transferência exclusiva de Mara/Choco, reload e três retornos com cache aquecido mantêm objetos, colisores e texturas. Atlas com lista de visitas contaminada continua recusando regiões posteriores.

[Dupla completa](qa/coop/coop.json): convidado aceita, investiga, conduz, instala, conversa e entrega; 140 créditos e um recibo por pessoa, reconexão sem duplicação. Botão real do laboratório só prepara o anfitrião com equipe original reunida. Pessoas/estrado/evidências replicados; Mara/Choco deixam os Terraços e reaparecem uma vez no posto. O teste encontrou disputa do estrado por aliado parado: a carga agora conserva quem a conduz e permite transferência a outro integrante em movimento, sem ser puxada de volta pelo aliado ocioso. Repetição completa passou.

[Controles](qa/controls/controls.json): quatro classes, CDP multitouch com oito direções de mira independentes do movimento, carga/soltura/cancelamento, HUD em 568×320, 844×390, 1024×768 e 1600×530, interação por toque e A no gamepad mock. O movimento foi isolado no corredor livre da Bacia; a tentativa inicial na base esbarrava nas bancadas existentes. Capturas do posto, falas de Mara/Choco e layouts inspecionadas visualmente pelo agente. Os pontos de instalação/conferência e a rota de Choco foram afastados da vegetação frontal após inspeção das primeiras capturas.

[Relay com quatro conexões](qa/protocol/mission-protocol.json): seis capítulos, 34 IDs de evidência, filtros, autoridade e viagens reais do protocolo 16. Não representa equipe humana de quatro. [Compatibilidade com relay 16 anterior](qa/compatibility/report.json), revisão `3a5481f` e catálogo históricos: conexão do capítulo antigo/inspeção de sala preservadas; laboratório novo e save com posto aceito recusados sem perder objetivos; atualização da capacidade permite reconectar. É conferência de handshake/guardas, não repetição de todos os capítulos no relay antigo.

[Solo compilado](qa/compiled-solo/public.json), sem globais DEV: aceite/reload e sentinelas reais nos capítulos do posto, água e chegada. [Dupla compilada](qa/compiled-coop/report.json), **http://localhost:5194**, com dois Chrome independentes e relay local: criação/convite/preparo pelo botão, aceite real de Nara pelo convidado, atlas para a Bacia, caminhada pela rota sul e E na linha de cheia. Reload/reentrada mantém objetivo, créditos e recibos; bosses posteriores vivos e sentinelas reais intactas. A sala foi encerrada pelo menu normal. É amostra compilada local, não QA de Vercel/Render; o percurso completo/entrega foi coberto na dupla DEV acima.

### 29/10 — Publicação solo / coop público pendente

[Vercel da aplicação](https://vercel.com/brunomafra-devs-projects/echosofdante/HX4TvDjsPEPZx83KTGNU8CdKWiZh) com status `success`. [62 hashes](qa/publication/hashes.json), incluindo JavaScript, folhas dos moradores e arte dos módulos, correspondem à build local. [Chrome no endereço público](qa/public-solo/public.json): posto, água e chegada passaram por aceite/reload, sem globais DEV e com sentinelas de personagens/configurações reais intactas. A biblioteca pública contém o acesso da 0.1.166. **Disponível no solo; avaliação humana pendente.**

A saúde HTTP do Render excedeu os timeouts, mas a [conexão real de sala](qa/public-relay/report.json) respondeu **protocolo 16, sem `outposts:1`**. A incompatibilidade do catálogo foi confirmada no WebSocket, sem simular vitória ou objetivos. O teste criou e encerrou uma sala temporária; credenciais não foram registradas. As guardas recusam o novo capítulo nesse relay para preservar os saves; não se declara o posto disponível no coop público. Foi solicitado ao usuário executar **Deploy latest commit** no serviço `echoes-of-dante-rooms`, com o código já no GitHub. Resta repetir a capacidade e a dupla pública após essa atualização; os testes locais não substituem esse gate externo.
