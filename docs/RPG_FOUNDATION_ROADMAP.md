# Echoes of Dante — Fundação do RPG e da expedição cooperativa

**29/10/2026 · O rastro do Primeiro Eco · 0.1.170 publicada no solo:** usuário testou a 0.1.169, respondeu “ficou excelente” e autorizou a proposta seguinte. Um capítulo: comparar o registro antigo, conduzir um pulso por dois desviadores e arquivar o percurso com Nara. Reutiliza o corredor existente antes do limiar do Warden; preserva portais, bosses, encontros finitos, arte e sistemas do assentamento. Cinco objetivos, 150 créditos únicos; sem tradução definitiva ou origem humana confirmada. [Escopo e evidências](echo-circuit/README.md). Somente este sprint; aguardar playtest humano antes de outro.

- [x] Investigação 0.1.169 aprovada pelo usuário: “Já testei ficou excelente”.
- [x] Implementação, typecheck/build 260 módulos, nove combinações/save antigo/recibo único, solo/dupla completos, navegação/colisões/morte/reload, quatro classes touch/gamepad e circuito compilado sem globais DEV passaram. [Evidências e fixtures](echo-circuit/README.md), com capturas inspecionadas pelo agente.
- [x] Aplicação `25b6099` em `origin/main`, sincronização conferida; laboratório registrado, Vercel success e 62 hashes iguais à build. Solo público: aceite/reload de circuito/frequência/posto e circuito com caminhada/giros/emissão/chegada/reload passaram, sem globais DEV e com saves reais preservados. Capturas públicas inspecionadas pelo agente.
- [ ] Coop público: Render ainda `e968e07`, sem `circuits:1`; atualização externa solicitada ao usuário após conferir a incompatibilidade. Dupla local/compilada passou; disponibilidade pública não confirmada.
- [ ] Playtest humano do circuito antes de outra etapa.

**29/10/2026 · Retomada da investigação · 0.1.169 publicada:** após aprovar a barra/poção (“ficou muito bom”) e confirmar os aliados no coop, o usuário pediu voltar à implementação. [Uma frequência a mais](signal-expedition/README.md): capítulo único após o posto, comparação de sinais na Bacia/Vale, alinhamento pela mira do integrante e arquivo isolado. Ivo recebe o relatório; 130 créditos únicos, sem XP novo, novos mapas ou origem definitiva das estruturas. Campanha, criaturas finitas, arte e protocolo 16 preservados; catálogo `signals:1` confirmado no relay público. Aguardar playtest antes de outra etapa.

- [x] Apresentação de vida/poção 0.1.168 aprovada pelo usuário em 29/10/2026; publicação/QA registrados abaixo.
- [x] 0.1.169: typecheck/build 258 módulos, save 0.1.166/recibo atômico, solo/dupla completos, mira do ator correto, navegação/colisões/morte/reload, quatro classes/touch/gamepad e relay 16 anterior passaram. Alinhamento e início da dupla compilados sem globais DEV passaram. [Evidências e fixtures](signal-expedition/README.md), separadas da avaliação humana.
- [x] Solo publicado: aplicação `e968e07`, Vercel success e 62 hashes iguais à build; aceite/reload públicos de investigação/água/posto e alinhamento por caminhada/mira/E com fixture explícita passaram, preservando saves reais. [Evidências](signal-expedition/README.md).
- [x] Coop público: usuário publicou Render `e968e07`, protocolo 16 / `outposts:1` / `signals:1`; dois Chrome na Vercel passaram por preparo explícito, aceite/coleta pelo convidado, reload/reentrada e encerramento normal, preservando saldo/recibos/bosses. Catálogo e 62 hashes conferidos; [evidências e limites](signal-expedition/README.md).
- [x] Playtest humano da investigação: usuário testou, aprovou (“ficou excelente”) e autorizou O rastro do Primeiro Eco em 29/10/2026.

**29/10/2026 · Vida e poções · 0.1.168:** usuário respondeu “Boa vamos para o próximo” ao apoio e pediu confirmação visual de poção e vida mais legível sobre o personagem. [Escopo e evidências](player-vitals/README.md): barra contextual, frasco/pulso após consumo confirmado e apresentação solo/coop pelos contadores existentes. Preserva HUD, figuras completas, economia/recarga/cura, campanha, saves e protocolo 16. Esta entrega atende esse ajuste antes de outra etapa da colonização; aguardar seu playtest.

- [x] Comentário positivo e continuação do apoio 0.1.167 recebidos; não representam medição completa da campanha.
- [x] QA local: typecheck/build de 256 módulos, quatro classes/touch/gamepad, recusa/rollback, morte/reload, texturas/objetos estáveis, dupla com efeitos locais/remotos e reentrada. Solo/dupla compilados e captura final em 568 passaram; inspeção visual do agente separada do usuário.
- [x] Aplicação `290b17c` publicada na Vercel, `origin/main` conferido e 62 hashes verificados; solo/dupla públicos 16 com consumo individual, reload/reentrada e touch em 568 passaram. [Evidências e limitações](player-vitals/README.md). Render existente compatível, sem atualização de protocolo.
- [x] Avaliação humana da barra/animação: usuário respondeu “ficou muito bom”, confirmou a leitura dos aliados e pediu retomar o plano.

**29/10/2026 · Apoio de campo · 0.1.167:** continuação autorizada após o deploy do posto. [Escopo e evidências](outpost/SUPPORT.md): recuperação, compra de poções e cofre pessoal no depósito, só após relatório entregue, presença segura e equipe original reunida. Reutiliza economia/saves/serviços e o protocolo 16 / `outposts:1`; não adiciona missões ou recibos, não altera oficina/base, moradores, bosses ou bloqueios do atlas. Laboratório separado e avaliação humana pendente antes de outra etapa.

- [x] Typecheck/build 255 módulos; solo/limites/rollback, save serializado 0.1.166, guardas de segurança, dupla com cura pessoal e reconexão, quatro classes touch e gamepad emulados passaram. Dupla compilada sem globais DEV e capturas inspecionadas pelo agente; não representam aprovação humana.
- [x] Aplicação `6afa0f6` na Vercel e em `origin/main`; 62 hashes, relay 16 / `outposts:1` e solo/dupla públicos com cura pessoal, compras/cofres e reload/reentrada passaram. [Evidências](outpost/SUPPORT.md). Não exige outro deploy do Render.
- [ ] Playtest humano do apoio antes de outra etapa.

**29/10/2026 · Coop do posto confirmado / próximo sprint autorizado:** usuário publicou o Render e pediu avançar. Revisão `a49fad7`, protocolo 16 / `outposts:1`, 62 hashes e [dupla pública](outpost/qa/public-coop/report.json) passaram: aceite do convidado, caminhada/E, reload/reentrada e saves reais preservados. Esta orientação autoriza o próximo sprint de utilidade do posto (cura, suprimentos e cofre pessoal pelos sistemas existentes); não constitui aprovação visual expressa ou medição humana da 0.1.166. Manter requisitos, economia, moradores e bosses; aguardar validação do sprint seguinte antes de outro.

**28/10/2026 · Primeiro posto autorizado · 0.1.166 em desenvolvimento:** usuário respondeu “vamo” à proposta de ocupar uma região conquistada. [Escopo e evidências](outpost/README.md): Bacia das Nascentes, condições de sobrevivência/apoio, carga física, fundação seca e transferência de Mara/Choco. Autorização atual permite este primeiro capítulo da entrega D, preservando requisitos, derrotas finitas, moradores/serviços existentes e saves. Não autoriza outro sprint sem playtest desta entrega; não registra aprovação integral ou duração dos cinco capítulos anteriores.

- [x] 29/10: implementação e QA local do posto: modelo/saves antigos, solo/dupla completos, ameaça restante, carga por movimento real, morte/R/reload, migração exclusiva dos moradores, colisões/atlas e controles emulados. Build de 255 módulos; solo e dupla compilados locais sem globais DEV passaram. Evidências no documento do capítulo.
- [x] Aplicação `664b039` publicada no solo: Vercel `success`, 62 hashes e Chrome público com aceite/reload nos capítulos do posto/água/chegada, preservando saves reais.
- [x] Coop público: usuário publicou Render `a49fad7`; capacidade `outposts:1` e dupla Vercel/Render passaram em 29/10. A indisponibilidade anterior permanece registrada como histórico.
- [ ] Avaliação humana deste capítulo antes de outra etapa.

**28/10/2026 · Aprovação humana dos NPCs · 0.1.165:** após receber os acessos e as correções, o usuário respondeu “Gostei” e perguntou pela próxima etapa. Aprova as figuras/tarefas desta entrega; QA técnico e publicação permanecem registrados abaixo. Não constitui medição de duração ou playtest completo dos cinco capítulos da permanência. A entrega D permanece planejamento, sem novo sprint autorizado por esta pergunta.

**28/10/2026 · Figuras e tarefas corrigidas · 0.1.165:** usuário encontrou botas de outra pose sobre a cabeça e pediu Tio Gui/Mara trabalhando parados em equipamento real; Tomás passa a se chamar Choco. [Correção e QA](settlement-motion/NPC_WORKSTATIONS.md): isolamento de silhuetas completas e margens transparentes, kits com colisão, Elisa preservada e lotes de Choco contextualizados. Mantém os acessos de inspeção da 0.1.164, ainda pendente de publicação quando surgiu o pedido. IDs/saves/protocolo 16 preservados; avaliação humana pendente.

- [x] Typecheck/build, 64 células isoladas, tarefas fixas/conversa, nove aproximações e dupla compilada 16 com posições/poses compartilhadas passaram. Capturas ampliadas inspecionadas pelo agente.
- [x] Aplicação `261f967` publicada; 56 hashes conferidos. Quatro acessos/touch/reload públicos e dupla pública 16 com tarefas fixas, reconexão e visitas aos sete NPCs passaram, preservando saves reais e bosses posteriores.
- [x] Avaliação humana das figuras e tarefas desta correção: usuário respondeu “Gostei” em 28/10/2026.

**28/10/2026 · Acesso de inspeção aos NPCs · 0.1.164:** usuário pediu todos os mapas com NPCs para conferir um a um. [Laboratório e limites](settlement-motion/NPC_REVIEW.md): Base/Terraços, quatro situações de ocupação e sete personagens, com aproximação individual e saves reais isolados. Reutiliza preparação de relatórios, sem alterar ritmos, serviços, campanha real ou protocolo 16. Avaliação humana das animações segue pendente; não inicia nova etapa de campanha.

- [x] Typecheck/build, nove aproximações, colisões/reload e saves reais protegidos; quatro links compilados e touch em duas resoluções passaram. Dupla 16 visita as quatro situações com autoridade do anfitrião e transição normal da equipe.
- [ ] Avaliação humana dos NPCs pelos novos acessos antes de outra etapa.

**28/10/2026 · Ritmo de Lia/Nara · 0.1.163:** usuário aprovou o movimento de Ivo e apontou Lia/Nara como vídeo acelerado. Correção restrita: sequências próprias de tarefas, pausas de observação/preparo e ciclos de 10,7 s / 12,75 s; ciclo de Ivo preservado. [Escopo e QA](settlement-motion/SERVICE_PACING.md). Sem nova etapa de campanha. QA técnico e playtest humano registrados separadamente.

- [x] Typecheck/build, medição na cena, serviços por E e reload; Ivo mantém o ritmo aprovado. Dupla compilada com relay 16, ciclos lentos, reentrada e viagem ao acampamento passou.
- [x] Aplicação `b25a2ff` publicada, 50 hashes conferidos. Solo e dupla públicos 16 passaram; ciclos de Lia/Nara medidos nos dois participantes com precisão limitada pelos intervalos registrados da rede. Evidências e limites no documento da correção.
- [ ] Playtest humano do ritmo de Lia/Nara antes de outra etapa.

**28/10/2026 · Revisão do movimento autorizada · 0.1.162:** usuário aprovou o conjunto da 0.1.161 e apontou animação robótica. [Revisão e QA](settlement-motion/README.md): partida/frenagem graduais, passada ligada ao deslocamento, preparação/retorno do trabalho com dezesseis figuras inteiras por morador, apoios das bancadas registrados e apresentação entre pacotes no convidado. Preserva âncoras de serviço, campanha, minimapa, derrotas, saves e protocolo 16. Não inicia colonização de outros mapas. **Naturalidade da 0.1.162 aguarda playtest humano**, separado dos testes técnicos.

- [x] Modelo e solo: aceleração, colisões, etapas de trabalho/conversa, cache estável e reload do minimapa; cerca de 60 FPS em uma amostra desktop.
- [x] Dois Chrome locais: poses compartilhadas, conversa do convidado, viagens, derrota permanente salva pelos dois integrantes e reconexão.
- [x] Aplicação `4590482` publicada na Vercel; 50 hashes conferidos. Solo público com diálogo/reload e dupla pública 16 com serviço animado, reentrada e viagem normal até Tio Gui/Elisa passaram, preservando saves reais, recibos e bosses posteriores. Evidências no documento do sprint.
- [ ] Playtest humano da suavidade/naturalidade desta revisão antes de nova etapa.

**28/10/2026 · Manutenção do mundo autorizada · 0.1.161:** usuário pediu descoberta persistente do minimapa, inimigos comuns sem reaparecimento e NPCs integrados/animados. O senhor de cabelo escuro e bigode se chama **Tio Gui**. [Escopo e evidências](settlement-life/README.md): memória por personagem/região, migração dos registros antigos disponíveis, serviços em posições fixas com bancadas e figuras completas, moradores com trajetos/falas e transferência da base ao abrigo. Protocolo 16 mantido. Não inicia entrega D nem construção livre. QA técnico e publicação registrados no documento; avaliação visual/humana pendente antes da próxima etapa.

- [x] Persistência solo: viagens, reload, morte/respawn, reconstrução da geometria e habitats das regiões existentes sem novo XP.
- [x] Migração real ao instalar abrigo, rotinas com colisão, serviços fixos, quatro classes/touch e gamepad emulados; dois Chrome com anfitrião/convidado, falas, poses e reconexão.
- [x] Aplicação `6f0cf12` publicada na Vercel; 45 hashes conferidos. Laboratório público solo preserva minimapa no reload e dupla pública 16 passa por diálogo/quadros/reentrada sem alterar recibos ou bosses posteriores. Evidências públicas no documento do sprint.
- [ ] Aprovação humana deste sprint e decisão sobre futura colonização dos mapas limpos.

**28/10/2026 · Coop público confirmado / manutenção publicada · 0.1.160:** Render 16/revisão `ae96140` e Vercel da correção `9178d37` conferidos. [Evidências e links](permanence/README.md): catálogo público preserva cinco capítulos/25 evidências; retorno ao menu e inspeção de convite corrigidos. Dois Chrome na Vercel/Render passaram por criação, preparo explícito, aceite pelo convidado, manifesto com E e reload/reentrada sem mudar créditos/recibos ou derrotar bosses. Cinco laboratórios solo públicos e 37 hashes JavaScript passaram. QA público é amostra funcional da dupla, com percurso completo dos capítulos validado localmente; aprovação humana continua pendente. Não iniciar entrega D.

**27/10/2026 · Lote da permanência implementado e publicado no solo · 0.1.155–0.1.159:** cinco sprints consecutivos implementados com commit/push individual: água, alimento, transporte físico, energia isolada e segunda equipe de colonos. [QA e links por capítulo](permanence/README.md). Uma jornada temporária concluiu os cinco sem nova preparação intermediária, com 500 créditos únicos; saves/recibos, morte/reload, mapas/bosses originais e quatro classes preservados. Solo público e hashes da Vercel conferidos; dupla 16 local e controles emulados passaram. **Render público ainda no protocolo 15:** campanha anterior funciona e foi testada com dois Chrome públicos; novos capítulos no coop aguardam deploy 16, sem descartar objetivos. Solicitação de atualização externa já informada ao usuário. Playtest humano do lote continua pendente; não iniciar entrega D ou outro lote sem nova orientação.

**Lote da permanência · 0.1.159 · Mais duas vozes em Dante:** Baliza, manifesto, segundo alojamento e chegada de Mara e Tomás, com falas próprias. Água, alimento, transporte e energia sustentam a recepção. [Escopo, laboratório e QA](permanence/README.md). Sequência já autorizada; avaliação humana permanece separada.

**Lote da permanência · 0.1.158 · Uma luz que é nossa:** Aterramento seco, descarga por setores, isolamento do circuito antigo e iluminação alimentada pela nave. Novas consequências na base e no abrigo. [Escopo, laboratório e QA](permanence/README.md). Sequência já autorizada; avaliação humana permanece separada.

**Lote da permanência · 0.1.157 · O peso de permanecer:** Apoio do estrado, carga física conduzida por proximidade e descarga validada no depósito. Qualquer integrante pode conduzir; a carga respeita as rochas. [Escopo, laboratório e QA](permanence/README.md). Sequência já autorizada; avaliação humana permanece separada.

**Lote da permanência · 0.1.156 · O que pode nos alimentar:** Comparação de resíduos, escolha do lote compatível, descontaminação na base e reserva identificada. Sem produção agrícola automática. [Escopo, laboratório e QA](permanence/README.md). Sequência já autorizada; avaliação humana permanece separada.

**27/10/2026 · Incandescente aprovado e lote da permanência autorizado:** após “Gostei muito”, o usuário pediu executar água, alimento, transporte, energia e chegada de colonos em sequência, com QA/commit/push por sprint e continuação imediata enquanto está ausente. Esta autorização substitui a espera de playtest **entre estes cinco capítulos**, sem transformar automação em aprovação humana. Manter um laboratório isolado por capítulo, preservar campanha/saves/arte e não antecipar construção livre, agricultura produtiva, novos limites de nível ou a entrega D. [Escopo e evidências](permanence/README.md).

**27/10/2026 · Sequência do Vésper 0.1.153 autorizada · Incandescente 0.1.154:** usuário pediu “vamos pro próximo” e confirmou continuar. [Basalto e descarga](titan-counterplay/README.md): blocos físicos temporários, frente de pressão interrompida pelos abrigos, sombra protegida e peito exposto após absorção. Preservar HP, requisitos, recibos, pintura e protocolo 15. Esta autorização encerra a espera do Vésper; **aguardar playtest humano do Incandescente antes de outra etapa**.

- [x] QA local do Incandescente registrado com evidências e limites: doze derrotas com auto attack, vitória com movimento, dupla, controles, saves e build compilada. Git sincronizado, Vercel publicada e [hashes/smoke público](titan-counterplay/README.md) conferidos; relay público mantém protocolo 15.
- [x] Incandescente aprovado pelo usuário (“Gostei muito”); lote seguinte autorizado na entrada mais recente.

**27/10/2026 · Vésper 0.1.152 rejeitado por facilidade · revisão 0.1.153 autorizada:** usuário venceu atrás dele segurando auto attack. [Revisão da retaguarda](vesper-revision-02/README.md): manter a direção do corpo, cauda de ida/volta com avisos separados e abertura apenas após quebrar gelo sem causar dano real com a cauda. HP, campanha, arte e protocolo 15 preservados. QA anterior cobria posições frontais e não aprovava dificuldade; nova validação inclui retaguarda parada e acompanhando o corpo. **Aguardar novo playtest humano antes de Incandescente.**

- [x] Revisão e QA técnico registrados com evidências em `docs/vesper-revision-02/`: oito derrotas com auto attack na retaguarda, vitória com movimento, dupla, controles e saves. Git sincronizado, Vercel publicada após nova tentativa, hashes e smoke público conferidos.
- [x] Usuário pediu seguir ao próximo boss em 27/10/2026; sequência autorizada na entrada mais recente.

**27/10/2026 · Soterrado 0.1.151 aprovado e Vésper autorizado · 0.1.152:** usuário aprovou a entrega (“muito bom”) e pediu o próximo boss. [Vésper — gelo e retaguarda](vesper-counterplay/README.md): sopro deixa crostas persistentes; cauda muda o espaço e pode expor o dragão. Novas figuras inteiras, contatos sincronizados e pressão sem aumentar HP. Preservar pinturas, requisitos, recibos e protocolo 15. A aprovação anterior encerra a espera do Soterrado; aguardar playtest do Vésper antes do Incandescente.

- [x] Vésper: gelo persistente, cauda traseira/quebra, oito figuras completas e contato; HP/recompensas preservados.
- [x] QA: quatro classes, tentativa com movimento/aberturas, dupla, touch/gamepad, saves antigos/atlas, reload e build compilada. [Evidências e limites](vesper-counterplay/README.md).
- [ ] Playtest humano do Vésper; Incandescente aguarda essa validação.

**27/10/2026 · Warden 0.1.150 aprovado e Soterrado autorizado · 0.1.151:** usuário confirmou “Aprovadissimo” e pediu aplicar ao próximo boss. [Soterrado — carapaça e colisão](soterrado-counterplay/README.md): investida comprometida contra formações rompe a defesa; novas poses inteiras e contato visível. Preservar HP, pintura, jornada, recompensas e protocolo 15. Esta autorização supera a espera histórica do Warden abaixo. QA técnico separado; aguardar playtest do Soterrado antes de Vésper ou outro capítulo.

- [x] Soterrado: carapaça/colisão, oito poses completas, contato e pressão; HP/recompensas originais.
- [x] QA técnico: navegação/Dash, quatro kits, oito tentativas estacionárias, vitória com movimento, dupla, touch/gamepad, saves antigos/atlas, reload e build compilada. [Evidências e limites](soterrado-counterplay/README.md).
- [x] Soterrado aprovado pelo usuário em 27/10/2026; Vésper autorizado na entrada mais recente.

**Revisão do Warden após rejeição · 0.1.150:** o usuário considerou a 0.1.149 ainda fraca, apontando impacto em área sem animação suficiente e vitória trocando auto attack. [Revisão 02](warden-revision-02/README.md): oito quadros inteiros para a queda, dano sincronizado ao contato, onda atravessável com Dash, ida/retorno na varredura, rajadas e impactos visíveis. Dano/tempos revisados; HP-base preservado. Núcleo só expõe após um ataque completo que não causou dano real; acertar alguém leva à recomposição protegida curta. Validar tentativas estacionárias e vitória com movimento, além de dupla/controles/saves. **Não interpretar QA como aprovação: aguardar novo playtest do Warden antes de outro boss.**

**Prioridade autorizada · 25/10/2026 · 0.1.149:** usuário aprovou os percursos e pediu bosses com mecânicas próprias. Autorizou o Warden como piloto e solicitou revisão musical. [Warden e som de Dante](warden-and-sound/README.md): carapaça direcional, pressão/contra-ataque e núcleo aberto; vinte composições instrumentais originais, mixagem mais baixa e entrada de tensão no encontro real. Mesmo HP, danos, campanha, arte, recibos e protocolo 15. QA técnico e avaliação humana separados. **Aguardar escuta/playtest do usuário antes dos outros bosses ou capítulo C.**

**Percurso vulcânico autorizado · 25/10/2026 · 0.1.148:** após receber a 0.1.147, usuário pediu seguir ao próximo arco. [Costa → Obsidiana → Incandescente](embers-journey/README.md): três relatórios e nove análises existentes ligados a contornos com cobertura/retorno, pares variados e seis residentes finitos. Arte, requisitos, arena, recibos e protocolo 15 preservados. Laboratório das Forjas mantém o registro de basalto pendente e Incandescente vivo. Entregar QA/versão/commit/push; **aguardar playtest humano antes de outra etapa**, sem declarar duração atingida ou iniciar capítulo C.

**Percurso Boreal autorizado · 25/10/2026 · 0.1.147:** usuário confirmou playtest/aprovação do Siroco 0.1.146 e autorizou **Fratura → Galerias → Vésper**. [Entrega e QA](boreal-journey/README.md): seis desvios integram os dois relatórios existentes de Lia/Ivo, seis coberturas físicas, pares variados, quatro residentes finitos e sulcos no vestíbulo. Pinturas/enquadramento das Galerias, requisitos, recibos e arena preservados. Vésper vivo no laboratório. Checklist técnico e limites no relatório; **aguardar aprovação humana antes do arco vulcânico**, sem declarar duração atingida.

**Percurso autorizado · 25/10/2026 · 0.1.146:** terrenos anteriores aprovados pelo usuário. Continuar a entrega B com [Vale → Siroco → Soterrado](sirocco-journey/README.md): três relatórios existentes ligados a nove desvios com cobertura/retorno, seis residentes finitos e indícios ambientais do boss. Portais, ruínas, descida, arena, pagamentos e recibos preservados; nenhuma duração humana declarada. Entregar laboratório/QA/commit/push e aguardar playtest antes do arco seguinte.

**Lote visual · 25/10/2026 · 0.1.145:** terceiro arco autorizado: [Costa das Cinzas ao Incandescente](route-identity/embers/README.md). Dez mapas do lote passam a usar pinturas completas próprias; preservam campanha, quests, encontros e bosses. Os dois primeiros arcos foram enviados separadamente em `d2ae660` e `524708e`. Fechar este arco com QA/commit/push, sem iniciar capítulo narrativo novo. A revisão estética final e a duração humana continuam pendentes de playtest.

**Lote visual · 25/10/2026 · 0.1.144:** continuação autorizada. [Vale ao Soterrado](route-identity/sirocco/README.md) foi entregue em `d2ae660`; [arco boreal](route-identity/boreal/README.md) distingue neve aberta, galerias de degelo e o ninho antigo. Pinturas únicas na campanha/coop, referências físicas e progressão preservadas. Após QA/commit/push, seguir para Costa das Cinzas ao último boss conforme pedido explícito, mantendo aprovação visual separada.

**Aplicação em sequência autorizada · 24/10/2026:** após a revisão 0.1.142 o usuário pediu [três arcos consecutivos](route-identity/README.md): Vale ao Soterrado, Fratura Boreal ao Vésper e Costa das Cinzas ao último boss. Fazer QA/versão/commit/push por arco e seguir imediatamente ao próximo, conforme instrução explícita desta sessão, sem pedir validação entre essas três entregas. Manter avaliações técnicas e estéticas separadas. Não iniciar outro capítulo narrativo ou sistemas fora desse lote.

**Correção após playtest · 24/10/2026 · 0.1.142:** usuário explorou o laboratório da 0.1.141 e não percebeu expansão suficiente; não considerar essa entrega aprovada visualmente. [Revisão 02 do primeiro arco](early-journey/revision-02/README.md): bacia ilustrada com água e raízes, passagem oriental legível, marcos distintos e chão mais calmo nas câmaras; links diretos com pré-requisitos simulados, bosses vivos e saves reais isolados. Mantém a campanha original, recompensas e protocolo 15. Aguardar nova validação humana; não avançar capítulo nem afirmar duração de 30 minutos.

**Percurso e ritmo autorizado · 24/10/2026 · 0.1.141:** após aprovar o acabamento de criaturas, o usuário autorizou aprofundar Base → Floresta → cavernas → Warden. [Primeiro arco ampliado](early-journey/README.md): circuito oriental/sul, três câmaras laterais, relatórios de Lia/Ivo reposicionados com recibos estáveis, pares variados e quatro residentes finitos. Bloqueios dos Ecos, mecanismo, desmoronamento, Primeiro Eco e Warden conservados. Laboratório isolado começa sem progresso; prévia explícita mantém bosses vivos. Esta é a primeira parte da entrega B, sem declarar atingidos 30 minutos ou oito horas. Aguardar avaliação humana antes do capítulo seguinte; não alterar a ordem do plano.

**Aplicação autorizada · 23/10/2026 · 0.1.139:** o usuário aprovou a revisão 0.1.138 e confirmou **acabamento completo + reações naturais em todos os mapas, inclusive a base**. [Acabamento da campanha](world-finish/README.md): pisos contínuos próprios de acampamento/floresta/cavernas/pradaria/árido, integração das composições existentes de gelo/lava, movimento natural por bioma e Hollow aprovado na campanha/coop. Atalhos pequenos junto aos ícones. As 16 regiões preservam numericamente limites e obstáculos; laboratório reservado com comparação e saves isolados. Sem nova etapa de conteúdo ou mudança do protocolo 15; aguardar avaliação humana da aplicação completa.

**Correção visual · 23/10/2026 · 0.1.138:** usuário esclareceu que quer respostas ambientais naturais, não pontos acionados por botão. [Revisão 05](forest-finish/revision-05/README.md): removidos os gatilhos da água/estrutura e seus avisos; vento suave, contato nos pés, retorno amortecido da vegetação e folhas somente ao roçar plantas. Sem novos assets, sem alterar missões/combate/colisões. Indicadores aprovados mantidos; aguardar playtest desta revisão reservada.

**Revisão autorizada · 23/10/2026 · 0.1.137:** usuário aprovou o Hollow violeta e pediu nomes/HP permanentes, identificação da vida, atalhos sem excesso de texto e ambiente menos estático. [Revisão 04](forest-finish/revision-04/README.md): indicadores aplicados à campanha e aliados remotos; água, vegetação e respostas locais a E/toque/gamepad apenas na clareira reservada. Sem alteração de progressão ou protocolo 15. QA técnico separado da avaliação humana; aguardar playtest antes de migrar o ambiente ou iniciar conteúdo.

**Leitura visual · 23/10/2026 · 0.1.136:** usuário gostou da revisão física, mas relatou que o Hollow se confundia com o ambiente e cansava a vista. [Revisão 03](forest-finish/revision-03/README.md): repintura do atlas inteiro com carapaça violeta, bordas de osso, menos manchas e comparação com a criatura anterior na mesma clareira. Apenas apresentação; aguardar validação da leitura em movimento antes da aplicação à campanha. Sem próxima etapa de conteúdo.

**Revisão autorizada · 23/10/2026 · 0.1.135:** usuário aprovou o acabamento da Clareira e pediu limites físicos nas árvores/caminhos e melhoria dos monstros. [Revisão 02](forest-finish/revision-02/README.md): contorno caminhável autoral sobre a pintura, apoio pelos pés, bloqueio de Dash/empurrão e Hollow inteiro em seis poses. HP/dano/IA existentes. Esta revisão continua no laboratório solo; **aguardar playtest dos limites e da criatura antes de migrar a referência para a campanha**. Não inicia outra etapa de conteúdo.

**Referência visual autorizada · 23/10/2026 · 0.1.134:** o usuário considerou o acabamento visual insuficiente e aprovou um trecho pequeno da Floresta com composição, terreno, luz, profundidade e HUD trabalhados em conjunto. [Clareira da Nascente](forest-finish/README.md): laboratório com comparação, combate/classes/equipamentos existentes, duas pinturas originais offline e saves reais isolados. Preserva Organic Sci-Fi R3 / direção D; a proposta não substitui a campanha. **Aguardar aprovação humana desta referência antes de aplicá-la aos outros mapas.** A validação da expansão 0.1.133 continua pendente.

**Publicação confirmada · 23/10/2026 · 0.1.133:** Render atualizado para protocolo 15/revisão `1247c89`; [smoke e dupla públicos](regional-expeditions/README.md) passaram contra Vercel/Render reais, incluindo anfitrião móvel, convite, início, chat e mira remota. Pendência externa encerrada; validação humana da expansão continua aguardada. Sem alteração de gameplay ou avanço de etapa.

**Expansão autorizada · 0.1.133:** o usuário solicitou aprofundar as regiões existentes, ampliar missões e renomear Star Hunter para **Caçador estelar**. [Plano de expansão arquivado](DANTE_EXPANSION_ROADMAP.md): primeira meta de ritmo exploratório de cerca de 30 minutos; oito horas são visão futura, não duração entregue. Doze expedições opcionais, 36 descobertas e 72 habitantes finitos; sete missões principais e bosses preservados. [Laboratório e evidências](regional-expeditions/README.md). Essa solicitação autoriza esta entrega sem declarar aprovação automática das revisões anteriores. **Aguardar validação humana desta expansão antes do próximo capítulo.**

**Manutenção · 0.1.132:** [jornada e HUD de desktop](journey-hud/README.md). A captura do usuário revelou a preparação automática pós-Warden no laboratório do assentamento. Removida a simulação automática, com escolha explícita e aviso persistente; destinos também exigem seus marcos reais. Missões orientam a rota existente. HUD de PC agrupado nas bordas e viewport proporcional sem faixas. Mobile 0.1.131 aprovado pelo usuário em 22/10/2026. Esta revisão aguarda playtest; sem nova etapa de conteúdo.


**Complemento · 0.1.131:** a checagem pública do mobile encontrou assets do mundo ainda baixando enquanto a tela aguardava para iniciar o filme. [Correção do carregamento](mobile-controls/README.md): filme em paralelo ao preload, percentual após pular e continuação automática, com teste de rede retida para solo e coop. Mesmo escopo de manutenção, sem nova etapa de conteúdo.

**Manutenção · 0.1.130:** [mobile: mira, interface e salas](mobile-controls/README.md). Dois polegares independentes, giro sem disparo no cenário, HUD compacto nas bordas, carga visível no botão e criação/convite de sala por toque. Estados explícitos de espera do líder/convidados. Sem nova etapa de conteúdo; campanha, combate, equipe original e protocolo 14 preservados. QA técnico separado da validação no celular/tablet real.

**Manutenção · 0.1.129:** [amostras, materiais e compartilhamento](mission-props/README.md). Caixas genéricas nos locais de investigação substituídas pelo objeto real; materiais passam a representar liga, carapaça e núcleo. Capa pública e metadados no HTML inicial. Recompensas, missões, colisões e protocolo preservados; laboratório reservado e aprovação visual humana pendente. Sem avançar a próxima etapa.

**Manutenção · 0.1.128:** usuário relatou novamente caminhada quebrada, especificamente no Guerreiro masculino com roupa inicial. [Revisão do Guerreiro](warrior-walk/README.md): novas figuras completas de locomoção, fase independente da mira, separação de amostragem/desenho e teste do redesenho extra do ataque. Sem nova etapa de conteúdo; aprovação técnica e humana separadas.

**Manutenção · 0.1.127:** [compatibilidade da abertura e entrada mobile](cinematic-compatibility/README.md), autorizada após erro no celular e Brave. Formatos alternativos, gesto para som, recuperação sem obrigar a pular e orientação horizontal quando suportada. Filme e gameplay preservados; sem nova etapa de conteúdo.

**Manutenção · 0.1.126:** o Render 14 foi confirmado no commit `b1ea13a`. O teste público encontrou nova consulta de configuração expirando após criar o convidado, embora o relay estivesse online. Reutilizar a configuração validada por página, descartar falhas para permitir nova tentativa e conferir o fluxo real de convite; sem avançar de etapa ou alterar campanha/combate. [Registro e QA](first-settlement/README.md).

**Etapa atual · 0.1.125:** usuário autorizou continuar a fase 5 em 21/10/2026, concluir as missões e revisar o Ivo flutuando/manchas brancas. [Primeiro assentamento](first-settlement/README.md): Bacia das Nascentes e Terraços do Amanhecer, três missões finais, duas espécies locais e carga de habitação instalada. Acampamento revisto. Preservar filme/mixagem aprovados. QA técnico não substitui playtest humano; aguardar a validação desta entrega antes de outra etapa. Registros abaixo são históricos.

**Proposta sonora · 0.1.123:** usuário rejeitou as fontes isoladas por falta de propulsão. [Nova base gravada e desenho de turbina](cinematic-opening/revision-07/README.md) publicados no player móvel para escuta. Não confundir força espectral medida com aprovação perceptual. **Aguardar esta avaliação antes da mixagem no filme ou avanço de etapa.**

**Diagnóstico · 0.1.122:** usuário ainda não reconhece propulsão na 0.1.121. [Players móveis com fontes isoladas](cinematic-opening/revision-06/engine-listening.md) para avaliação, sem nova mixagem ou geração. **Motores não aprovados; aguardar escuta.**

**Revisão vigente · 0.1.121:** usuário aprovou trilha/fundo da 0.1.120 e solicitou motores mais audíveis. [Correção pontual](cinematic-opening/revision-06/README.md) na decolagem e descida, preservando as camadas aprovadas e a prioridade da dublagem. **Aguardar escuta dos motores; missões/mapas não iniciados.**

**Entrega vigente em 20/10/2026 · 0.1.120:** imagem e Nara da 0.1.119 aprovadas pelo usuário. [Trilha espacial e efeitos](cinematic-opening/revision-05/README.md) adicionados por solicitação: motores, cabine, descida e desembarque; volume próximo do anterior, fundo reduzido durante as falas. Mesmos quadros e onze vozes. **Aguardar escuta da nova mixagem antes de iniciar missões/mapas.** Os registros abaixo são históricos.

**Entrega vigente em 18/10/2026 · 0.1.116:** [abertura completa de 59,25 s](cinematic-opening/completion/README.md), com equipe atualizada, descida e desembarque; mesma conta HF gratuita, sem pagamentos. Substitui o prólogo estático no início solo/coop; laboratório isolado e corte anterior preservados. Quadro da equipe aprovado; **filme completo aguarda validação visual**. Manutenção 0.1.115 bem recebida; novo apontamento dos Hunters tratado pelo rosto de referência compartilhado com o render. **Não iniciar missões/mapas antes do playtest da abertura.** Registros abaixo são históricos.

**Manutenção visual em 18/10/2026 · 0.1.115:** cinco capturas do usuário expuseram cortes de braços/espada na Guerreira e proporção do passo do Hunter que a 0.1.114 não resolveu. [Revisão 05](complete-actors/revision-05/README.md): importação pelos limites reais das figuras, três fontes corretivas com pessoas completas, registro cabeça/chão medido e seta fora do corpo. QA de corpo inteiro substitui o indicador limitado de área da cabeça. Campanha/seletor/aliados compartilham a correção. **Aguardar playtest humano; nenhuma nova etapa de conteúdo iniciada.**

**Prova visual autorizada em 17/10/2026 · 0.1.110:** usuário pediu testar personagens pintados inteiros antes da implementação. [Laboratório A/B do Astral](whole-body-actors/README.md), oito vistas e 32 poses completas, isolado da campanha. Não substitui classes/equipamentos nem altera a ordem das etapas; aguardar playtest para decidir a estratégia de produção. Quadro-base estático da equipe pioneira também foi salvo; vídeo ainda pendente.

**Roteiro ampliado em 17/10/2026:** usuário solicitou a [apresentação da equipe pioneira](cinematic-opening/pioneer-team.md), com Guerreiro, Hunter, Astral e Domador preparando o reconhecimento. Cena de ~4,5 s prevista entre ponte e descida; abertura planejada passa de 54,75 a ~59 s. Quadro-base estático salvo na 0.1.110; animação ainda pendente. Prévia publicada permanece com 36 s e integração na campanha continua pendente.

**Etapa vigente: [abertura cinematográfica completa, ~55 segundos](cinematic-opening/README.md), em produção.** Piloto 0.1.108 **aprovado pelo usuário em 17/10/2026**: “irmão muito bom! vamos produzir a abertura completa”. A 0.1.105 com montagem por membros continua rejeitada. Preservar cenas/atores inteiros, legendas em português e áudio original, sem loops ou quadros congelados para completar duração. Fonte 832×480/16 FPS; exportação 1280×720/24 FPS por ampliação/interpolação explicitadas. **0.1.109: prévia parcial de 36 s**, com quatro cenas novas e a ponte aprovada. Conta gratuita HF autenticada e geração real confirmada; depois atingiu o limite de chamadas. Restam descida/desembarque (18,75 s); preservar fontes e retomar após renovação da cota, sem pagamentos. Prólogo ativo preservado. Nomes/chat da 0.1.104 validados. Missões e mapas ainda aguardam a abertura completa e seu playtest.

Preparação Wan2.2: usuário autorizou o teste inicial curto na fal.ai. [Execução única, configuração local e retomada](cinematic-pilot/revision-02/wan-test.md) prontas; checagem de preço antes do envio, sem retries de geração. Credencial/autenticação validadas em 17/10/2026 (GET 200; controle sem chave 401), USD 0,15 por vídeo; guard ajustado à unidade real `videos`, 16 casos simulados passaram. Usuário ainda não adicionou créditos; nenhum vídeo ou pedido pago realizado. Não confundir essa preparação offline com a entrega do piloto de 12 s.

**Sequência vigente em 16/10/2026:** [correções visuais, comunicação e primeira colonização](DANTE_COLONIZATION_PLAN.md). A 0.1.101 foi **rejeitada visualmente**. Entregar personagens/início, aguardar playtest, depois chat, piloto de cinemática, missões e mapas/assentamento. Os registros de entregas abaixo são históricos, não uma aprovação do prólogo ou dos retratos.

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
- Cinemática com atuação, validada primeiro num piloto, pulável.
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
| **Domador de feras — Xenobinder** | Lutar em simbiose | Arma biológica tecnológica, companheiro e apoio limitado |

**Astral:**

- Alterna **energia → fogo → água → terra** durante o combate.
- Ataque básico de médio alcance assume o elemento escolhido: raio, bola de fogo, rajada de água ou pedra; Q mantém **segurar → mirar → soltar**.
- Energia: malha de descarga com impacto inicial; fogo: terreno em chamas; água: onda e zona de desaceleração; terra: rocha emergindo com impacto e empurrão, usando HURT existente.
- Recurso próprio: **Energia Astral**. Ataque básico recupera recurso; Q consome. Movimento evasivo permanece independente do recurso.
- Primeira versão sem combinações elementais em cadeia; preservar clareza antes de acrescentá-las.

**Domador de feras:**

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
| **5A — Caldeira de Dante** | Expansão vulcânica após Vésper, exploração, descoberta, boss Incandescente e dupla | Playtest humano da nova região/boss antes do Domador de feras |
| **6 — Domador de feras** | Companheiro, simbiose, recurso e apresentação | Criatura navega e não domina nem prejudica o combate |
| **7 — Equipe de quatro** | Lobby sem classes repetidas, estados individuais e bosses para quatro | Campanha completa com as quatro classes |
| **8 — Prólogo** | Introdução, integração narrativa da base e chegada de refugiados | Novo jogador entende a missão e começa a jogar rapidamente |

Cada etapa terá implementação, QA, revisão visual, documentação, versão quando aplicável, commit e push. Atualizar o checklist com evidências e limitações antes de começar a etapa seguinte.

## 4. Introdução e narrativa

Decisão vigente: piloto de atuação de 12 s na ponte da nave, com câmera parada, antes da abertura completa de aproximadamente 55 s. MP4 1280×720/24 FPS, animação offline, conversa/texto em português e ambiente/efeitos sem dublagem. A exportação de pinturas animadas da 0.1.101 foi rejeitada; não é o objetivo aprovado.

1. Terra inabitável e evacuação.
2. Partida das naves com os sobreviventes.
3. Anos de viagem e desgaste da expedição.
4. Descoberta de Dante e aproximação orbital.
5. Pouso da equipe; início da missão de reconhecimento.

Usar personagens atuando, operando equipamentos, andando e gesticulando. Não reutilizar pinturas com pan/zoom como cinemática. Manter **PULAR**, **REVER INTRODUÇÃO**, pausa e mobile. Produzir a abertura completa somente após aprovação humana do piloto.

Exibir ao criar cada nova jornada, conforme a revisão autorizada de 14/10/2026. Personagens antigos não recebem introdução retroativa. Em convites cooperativos, permitir pular ou concluir antes de confirmar prontidão no lobby.

A abertura confirma a nova premissa fornecida: humanidade em fuga e expedição pioneira. Não definir a causa exata da perda da Terra nem explicar o Signal, o registro humano ancestral ou a origem de Dante.

### Revisão autorizada de menus e campanhas — 14/10/2026 · 0.1.100

O usuário autorizou implementar o prólogo junto da reorganização de menus e dificuldades, sem aguardar nova resposta durante a execução. A decisão posterior confirmou **exigir a equipe original completa** para continuar. Essa autorização supera a espera operacional anterior da etapa 7; não constitui aprovação visual por automação.

Solo e cooperativo usam personagens separados, sem troca de herói durante a expedição. Dificuldade e tamanho 2–4 são fixados na criação; presença temporária e equipamentos não os reduzem. A sala só começa após todos guardarem o manifesto. Ausência interrompe a simulação/relógio até o retorno. Jornada cooperativa não vira solo. Cinco takes por nova jornada, pular/rever, início na base existente. [Entrega e evidências](prologue-menu/README.md).

### Revisão do fluxo e da cinemática — 15/10/2026 · 0.1.101

Registro histórico da tentativa: nome/apresentação antes da dificuldade e MP4 de 19,6 s. **Rejeitada pelo usuário:** faltava atuação, havia confirmação adicional e os corpos com mangas cortadas ficaram sem braços completos no seletor. [Evidências históricas](prologue-menu/README.md). A correção segue o novo plano, com geometria/articulações compartilhadas e clique na dificuldade iniciando a jornada.

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
- [x] **Etapa 5 — Astral:** kit/elementos e afinidades bem recebidos pelo usuário nas revisões 0.1.91–0.1.93; braços/apresentação aprovados após a revisão 0.1.98. [Relatório/teste](astral/README.md). QA solo/dupla local; avaliação geral de dificuldade da etapa 4 permanece pendente.
- [ ] **Interlúdio 5A — Caldeira:** entrega técnica 0.1.94, autorizada antes do Domador de feras. Região vulcânica e boss gigante mineral de lava; campanha, dupla local e três kits validados automaticamente. [Entrega e QA](caldera/README.md). Aguardar aprovação humana de visual/ritmo/dificuldade.
- [x] **Etapa 6 — Domador de feras:** kit/companheiro bem recebidos pelo usuário, seguidos de rejeição dos braços; revisão 0.1.98 aprovada em 14/10/2026 (“agora sim perfeito!”). [Relatório e teste](xenobinder/README.md). QA solo/dupla local; quatro participantes e publicação coordenada das salas pertencem à etapa 7.
- [ ] **Etapa 7 — Equipe de quatro:** entrega técnica 0.1.99, lobby e quatro classes exclusivas, estado/recibos individuais e campanha/bosses. Frontend/relay protocolo 10 publicados; QA público de quatro sessões Chrome passou em 14/10/2026. [Relatório/teste](party-four/README.md). Aguardar playtest humano antes do prólogo.
- [ ] **Etapa 8 — Prólogo:** tentativa 0.1.101 rejeitada visualmente. Seguir o [plano atualizado](DANTE_COLONIZATION_PLAN.md): personagens → comunicação → piloto real de atuação → abertura aprovada → missões → dois mapas/primeiro assentamento. Nenhum filme ou missão é considerado entregue pela exportação anterior.

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

Revisão de 0.1.92 bem recebida; o usuário ampliou explicitamente a regra para todas as criaturas e pediu resistência à água nos glaciais. Configuração obrigatória para as 13 espécies, incluindo bosses: uma fraqueza (+25%), uma resistência (−25%) e dois elementos neutros. Mesma regra por alvo no solo e na dupla; setas ↑/↓ e perfis no bestiário. [Tabela, QA e teste reservado](astral/species-profiles/README.md). Não há combinações encadeadas, imunidades, novos ataques ou antecipação de outra etapa. **Validar esta matriz e as pendências da etapa 4 antes do Domador de feras.**

### Mudança autorizada de prioridade — Caldeira · 0.1.94

O usuário confirmou que os perfis elementais funcionam e, antes da etapa 6, solicitou uma região vulcânica caminhável. Aprovou a proposta de Caldeira após Vésper e acrescentou explicitamente um boss semelhante em escala a um gigante de lava. Interlúdio 5A: caminhos de basalto, dois desvios, registro ancestral, mecanismo, checkpoint, arena e O Incandescente, criatura original. Reutilizar kit/economia/colisões/rede; conservar os limites atuais de nível/classes/participantes. Próxima ordem autorizada: **Caldeira → playtest humano → Domador de feras → equipe de quatro → prólogo**. Pendências de avaliação geral da etapa 4 continuam registradas. Não copiar conteúdo/arte/layout de jogos citados como referências.

### Revisão de escopo — expedição vulcânica · 0.1.95

O usuário considerou a 0.1.94 insuficiente por ter apenas um mapa com boss e moradores reutilizados. Solicitou **pelo menos três mapas até o boss e monstros autênticos do ambiente**. Costa das Cinzas e Garganta de Obsidiana antecedem as Forjas, com três espécies novas, 24 habitantes, seis desvios e registros que revelam passagem. Incandescente preservado no final. [Entrega, arte e QA](caldera/expansion/README.md). Não interpretar a revisão anterior como aprovação humana; aguardar playtest desta expedição antes do Domador de feras.

### Encerramento vulcânico e avanço autorizado — etapa 6 · 0.1.96

Em 13/10/2026, o usuário solicitou explicitamente revisar/commitar a tarefa vulcânica e implementar imediatamente o Domador de feras, com o kit descrito no plano. Essa autorização supera a espera operacional anterior; não equivale a aprovação visual da expedição por automação. Revisão vulcânica encerrada em `83cf3a6`, após `95f9bfa`, ambas em origin/main.

Domador de feras: humano de expedição com condutor vivo e uma criatura original permanente; FOLLOW/ASSIST/COMMAND/RETURN, assistência somente ao alvo acertado, Vínculo acumulado em combate, Q hold/aim/release com investida e recuperação próxima limitada. Corpo/armas/companheiro raster original offline, equipamento por partes e mesma infraestrutura de combate/campanha/dupla. Protocolo 9; não antecipar quatro jogadores ou prólogo. [Entrega e QA](xenobinder/README.md). **Aguardar validação humana da etapa 6 antes da etapa 7.**

### Revisão solicitada dos dois rigs — 0.1.97

Em 14/10/2026 o usuário aprovou a sensação do kit, mas rejeitou braços e caminhada dos dois personagens mais recentes. Auditoria de manutenção dentro das etapas 5/6: ombros medidos por vestimenta, ossos de comprimento constante, punho/mão/instrumento registrados, ordenação frente/costas/perfil e poses de pernas completas produzidas offline. Mesma apresentação no solo, na dupla e no menu; nenhum valor de combate, recurso, controle, mapa ou protocolo foi alterado. [Auditoria, testes e links reservados](caster-motion-audit/README.md). **Aguardar aprovação humana desta revisão antes da etapa 7.**

### Rejeição visual e revisão dos braços — 0.1.98

A captura enviada pelo usuário rejeitou os braços da 0.1.97. Correção focada: pintura sem punhos artificiais nas junções, escala uniforme, articulações registradas dentro do PNG, mão proporcional/relaxada, antebraço e manopla no mesmo eixo, punho do condutor ajustado e ordenação da manga sob o torso. Pernas, corpos, kit, controles e valores preservados. QA passa a verificar pixels opacos nas junções e ausência de estiramento, além das coordenadas. [Entrega e teste](caster-motion-audit/revision-02/README.md). **Ainda aguardar aprovação visual antes da etapa 7.**

### Aprovação visual e próxima etapa — 14/10/2026

O usuário aprovou a revisão 0.1.98 (“agora sim perfeito!”) e perguntou qual é o próximo passo. Registro encerra a pendência visual dos dois personagens. Etapa 7: salas/lobby de até quatro pessoas, classes exclusivas, estado individual de cada participante, campanha/bosses, reconexão e recompensas pessoais. Primeiro alinhar frontend/relay publicados; não declarar quatro jogadores implementados, nem iniciar o prólogo. Pendências gerais de balanceamento da etapa 4 e avaliação vulcânica continuam registradas e devem entrar no playtest da campanha cooperativa. Nenhum gameplay foi alterado neste registro.

### Avanço autorizado — etapa 7 · 0.1.99

O usuário autorizou a implementação (“Vamos nessa!”). Quatro vagas exclusivas, IDs estáveis, estado por participante, convites com escolha explícita, campanha compartilhada e recompensas pessoais; relay protocolo 10. Personagens, arte, kits, regiões e bosses existentes reutilizados. Resistência dos inimigos por quantidade de participantes, sem alterar dano/IA ou escalar com equipamento. Menus pessoais não pausam a equipe; derrota coletiva, travessias, reconexão e saída do anfitrião tratadas para os quatro.

[Laboratório reservado](https://echosofdante.vercel.app/party-playtest.html?region=base&kit=basic&v=0.1.99) · [Implementação, QA e limites](party-four/README.md). Frontend e relay devem publicar o mesmo protocolo; a confirmação pública fica registrada no relatório desta etapa. **Aguardar playtest humano da equipe antes da etapa 8 — prólogo.** Balanceamento geral da etapa 4 e avaliação da campanha vulcânica continuam incluídos nessa validação; automação não substitui aprovação humana.

### Publicação coordenada confirmada — etapa 7 · 14/10/2026

Após o usuário concluir o deploy manual do commit `c529cbf` no Render, o health confirmou protocolo 10, quatro vagas e classes exclusivas. QA de quatro contextos Chrome passou contra Vercel/Render reais, sem simulação local de rede: convites, seleção/criação de personagens, roster, snapshots, saída do anfitrião e recuperação da jornada solo. [Evidência pública](party-four/public-qa/report.json). A indisponibilidade de publicação está resolvida para esta versão; o gatilho automático futuro ainda não foi comprovado. Versão preservada em 0.1.99, pois este registro é documental. **Aguardando playtest humano; etapa 8 não iniciada.**

### Correções visuais e novo plano — entrega 1 · 0.1.102

O usuário rejeitou a apresentação 0.1.101 e aprovou a sequência [personagens/início → nomes/chat → piloto de atuação → missões → mapas/assentamento](DANTE_COLONIZATION_PLAN.md), com validação humana entre entregas. Esta é somente a primeira: corpos/encaixes registrados, braços/mãos proporcionais, poses compartilhadas entre seletor e campanha, alinhamento do Guerreiro remoto, passada assinada do Hunter e início pelo clique na dificuldade. No coop, tamanho da equipe vem antes da dificuldade. Rascunho preservado ao voltar/configurar e criação protegida contra clique repetido.

[Laboratório, comparação e QA](character-cohesion/README.md): 6.912 poses, 1.024 comparações local/remoto, oito retratos com demos, quatro resoluções, teclado/touch/gamepad, equipe compilada com quatro navegadores e ações reais de cada kit. Floresta próxima de 60 updates/s nas amostras individuais; três reinícios por classe sem crescimento das contagens monitoradas. A execução longa legada de campanha teve timeout de visitante e fica registrada separadamente, sem afirmar validação integral da campanha. Nenhum novo raster/mapa/regra de combate/protocolo. **Aguardar playtest visual do usuário antes de nomes/chat. A cinemática anterior continua provisória; o piloto real pertence à entrega 3.**


### Corpos completos aprovados e expansão autorizada — 0.1.111

Em 17/10/2026, o usuário aprovou explicitamente o protótipo de Astral feminino (“está perfeito”) e autorizou aplicar a mesma ferramenta às quatro classes, nas duas apresentações, com commit/push. Manutenção visual autorizada: poses humanas completas em seletor, campanha e aliados cooperativos; equipamento preparado em atlas fixo na troca, sem articulações remontadas por frame. A aprovação do teste anterior não representa aprovação automática das novas pinturas. [Entrega, arte e QA](complete-actors/README.md). Abertura completa continua pendente da cota de vídeo; missões e expansão permanecem na ordem aprovada.

### Passada e identidade — revisão 0.1.112

Em 18/10/2026 o usuário aprovou o resultado geral da representação inteira, mas pediu correção da caminhada do Guerreiro/Hunter, percebida como saltos, e aparência própria para o Hunter. Revisão restrita: pinturas inteiras de contatos opostos, registro pelo eixo do corpo, ciclo visual mais calmo sem postura parada entre passos e Hunter com identidade/roupas distintas nas duas apresentações. Astral/Domador mantêm seus PNGs; gameplay e rede preservados. [Relatório, fontes e teste reservado](complete-actors/revision-02/README.md). **Aguardar playtest desta revisão antes de outra etapa; a abertura completa e o plano de missões continuam pendentes na ordem aprovada.**

### Capacete, proporções e mostruário — revisão 0.1.113

O playtest da 0.1.112 apontou cobertura de cabeça e tamanho inconsistentes ao andar/atacar e mudar a mira; o usuário também solicitou prévias fiéis ao básico/Q. Manutenção nas quatro classes e duas apresentações: composição registrada pelo pescoço/plano dos pés, cabeça equipada estável por vista e mostruário isolado que executa os componentes reais de combate. Nenhum PNG ou regra de combate/save/protocolo foi substituído. [Diagnóstico, limites, QA e testes](complete-actors/revision-03/README.md). **Aguardar avaliação humana desta revisão. Não antecipar cinematográfica completa, missões ou expansão.**

### Cabeça da Guerreira e diagonais do Hunter — revisão 0.1.114

O usuário aprovou a 0.1.113 no geral e corrigiu explicitamente o caso remanescente para **Guerreira feminina**, além da impressão de zoom nas diagonais frontais do Star Hunter. Manutenção: referências de cabeça íntegras e máscaras técnicas, calibração uniforme da figura inteira nas duas diagonais do Hunter, emissão visual alinhada e bake por quadro com coordenadas locais iguais. [Comparações, testes e limites](complete-actors/revision-04/README.md). **Aguardar playtest destas correções; não avançar conteúdo.**

### Revisão autorizada da abertura — 0.1.117

Em 20/10/2026 o usuário autorizou testar o Concat e pediu melhorar a imagem e fazer os quatro heróis desembarcarem primeiro. Revisão dentro da etapa 3: novo quadro inteiro com identidades atuais, duas tomadas de desembarque, restauração moderada da ponte/desembarque e menor compressão final. Prova separada de 12 s com Ivo/Nara em português, editada e exportada no Concat; sem sincronização labial nova ou dublagem integral antecipada. [Produção, laboratório e QA](cinematic-opening/revision-02/README.md). Nenhuma mudança de personagem, combate, coop ou save. **Aguardar avaliação humana do filme e das vozes antes de dublar o restante ou iniciar missões/mapas.**

### Desembarque e elenco — revisão 0.1.118

Em 20/10/2026 o usuário aprovou a ponte, rejeitou a qualidade do desembarque e autorizou vozes distintas por personagem, com montagem no Concat. Novo quadro e animação inteiros do desembarque, movimentos curtos e menos informação concorrente. Corte de 54,25 s: continuação bloqueada pela cota gratuita; a cena final usa somente a nova tomada de 4,75 s, sem preencher com o desembarque rejeitado. Onze falas com três vozes fixas para narrador, Ivo e Nara; os WAVs aprovados da ponte foram preservados. [Entrega, fontes e QA](cinematic-opening/revision-03/README.md). Os heróis não falam neste roteiro e ainda não receberam elenco próprio. **Aguardar aprovação humana desta revisão antes de missões/mapas.**

### Nara visível e revisão de imagem — 0.1.119

Usuário aprovou a 0.1.118 (“Excelente!”) e pediu mostrar Nara no desembarque durante sua fala e revisar os frames. Novo quadro/cena inteira: Nara na rampa, lenço laranja e roupa da ponte, quatro heróis à frente. Sete cenas anteriores e todos os WAVs preservados; exportação Concat com menor compressão e inspeção de quadros das oito cenas. [Entrega e testes](cinematic-opening/revision-04/README.md). **Aguardar avaliação desta correção final; missões e mapas continuam na próxima etapa, não foram antecipados.**


### Revisão visual autorizada das criaturas — 0.1.140

Em 24/10/2026, após esclarecer que apenas o Hollow tinha recebido a pintura aprovada, o usuário autorizou aplicar o tratamento aos demais monstros e bosses. Manutenção visual: 18 folhas completas novas, registro dos apoios, sombra compartilhada suave e mesmas poses na campanha/cooperativo. Preservar IA, stats, geometrias de ataque, recompensas, checkpoints e missões. [Arte, teste reservado, evidências e limites](creature-finish/README.md). Não interpretar QA técnico como aprovação visual; aguardar playtest humano antes de avançar conteúdo.
