# Capítulos da permanência

Em 27/10/2026 o usuário aprovou o Incandescente 0.1.154 (“Gostei muito”) e autorizou executar **água → alimento → transporte → energia → chegada de colonos**, com QA, commit e push por sprint e continuação imediata, sem esperar playtest entre os cinco. Aprovação humana destes capítulos continua pendente. Nenhum capítulo da entrega D, agricultura produtiva ou construção livre faz parte deste lote.

## 1 — Água para o assentamento · 0.1.155

[Laboratório direto](https://echosofdante.vercel.app/campaign-playtest.html?permanence=water&v=0.1.155)

Continua a partir dos sete relatórios e do primeiro abrigo existentes; não substitui a missão original de analisar a nascente. Lia investiga a saturação do cartucho: comparar captação/sedimento, recuperar carga reservada, isolar retorno sob pressão e instalar tratamento no reservatório. Cinco objetivos contextuais, sem quota de abates ou compra obrigatória. A descarga tem aviso de 1100 ms, contato durante 700 ms num ciclo de 3200 ms, e pode ser contornada. Isolar o retorno a interrompe. Dano-base 18 segue dificuldade, resistência, invulnerabilidade e morte existentes.

O tratamento instalado aparece nos Terraços e na base, com carga pintada existente e colisor próprio. Evidências, conclusão e 80 créditos pessoais usam o diário/recibos atuais, sem XP extra. Nenhum portal ou boss é liberado pelo capítulo. Saves schema 1 anteriores continuam válidos; não ganham conclusão ou créditos novos automaticamente.

### Laboratórios e simulação

`campaign-playtest.html?permanence=water`: namespace `dante-permanence-v1.water.<classe>`, em sessionStorage isolado de personagens, configurações e progresso reais. Simula sete relatórios até o abrigo, Warden, 350 XP, cinco poções e acesso já descoberto às Nascentes/Terraços. Capítulo escolhido está **por aceitar e completar**. Soterrado, Vésper e Incandescente permanecem vivos; a simulação não concede seus recibos. Os próximos laboratórios também simulam apenas os capítulos anteriores ao escolhido.

### Cooperativo

Catálogo compartilhado reservado para cinco capítulos e 25 evidências em `src/config/permanence-catalog.json`; só definições implementadas aparecem no diário. O relay anterior remove IDs desconhecidos, portanto os capítulos novos exigem **protocolo 16**. Aceite/entrega continuam autenticados e validados pelo anfitrião junto ao NPC; E usa a posição real do integrante. Host resolve pressão/dano e envia o mesmo tempo de simulação usado para a apresentação remota. Atualizar o Render e verificar saúde/publicação antes de declarar estes capítulos disponíveis no coop público. A partir da 0.1.158 o cliente também mantém as campanhas anteriores no relay 15: oculta o aceite de capítulos novos antes de criar objetivos, preservando os relatórios antigos. Laboratórios novos e campanhas que já possuem capítulo novo aceito recusam relay 15 explicitamente, para impedir perda ou divergência de evidências.

### QA técnico e limites

- [x] [Modelo e save](qa/model/model.json): ordem/pré-requisitos, persistência anterior, falha de armazenamento, recibos/retry.
- [x] [Relay real](qa/protocol/mission-protocol.json): quatro conexões, catálogo, autoria, entradas inválidas, equipe original e viagens conectadas.
- [x] [Solo](qa/water/solo.json): E, diálogos, instalação recusada antes dos requisitos, entrega, reload, três retornos sem crescimento e diário em quatro resoluções.
- [x] [Dupla em dois navegadores](qa/water-coop/coop.json): convidado aceita/executa/entrega, recompensa pessoal e reconexão sem duplicação; posições/invulnerabilidade preparadas.
- [x] [Navegação e pressão](qa/water-access/access.json): todos os locais com aproximação/retorno, dano real de 20 HP no normal solo, isolamento durável e regiões futuras bloqueadas.
- [x] [Controles emulados](qa/controls/controls.json): quatro classes, CDP multitouch, mira independente, carga/cancelamento, gamepad mock, quatro resoluções e reinícios sem duplicar HUD.
- [x] Typecheck/build finais e revisão/diff. Aviso conhecido dos chunks permanece.
- [x] [Build compilada](qa/compiled/public.json): aceite real e reload, sem globais DEV, personagens/configurações sentinela intactos.
- [x] Commit/push da água `8e647825c96e2c53704817a09db2e194bc322244`, local/remoto conferidos; Vercel publicada, [37 hashes JavaScript](qa/publication/0.1.155/hashes.json) e [smoke público](qa/publication/0.1.155/public.json) passaram.
- [ ] Coop público **dos cinco capítulos novos**: Render ainda respondeu protocolo 15 na conferência; incompatibilidade real informada ao usuário, código 16 enviado. A campanha anterior passou em [dois Chrome contra Vercel/Render reais](qa/public-coop/report.json), com nomes, convite, aceite de Lia e passagem norte. Não declarar estes capítulos novos disponíveis no coop público até o relay 16 ser publicado.
- [ ] Playtest humano de ritmo, leitura e diversão.

Os testes de objetivos usam posição/invulnerabilidade preparadas para cobrir interações. Não medem duração humana ou descoberta da solução. Arte, terrenos, estatísticas de inimigos/bosses, quatro classes, economia pessoal e controles originais preservados. Sem garantia de 30 minutos ou oito horas.

## 2 — O que pode nos alimentar · 0.1.156

[Laboratório direto](https://echosofdante.vercel.app/campaign-playtest.html?permanence=food&v=0.1.156). Simula também o capítulo da água, sem conceder a recompensa do alimento. Requer entregar água no jogo real. Lia compara resíduo dos juncos com mudas de controle, orienta uma coleta seletiva pelas marcas, trata a amostra na base e reserva o lote no abrigo. Lote azul incompatível permanece intocado, sem evidência ou crédito; somente a amostra compatível pode ser tratada. Guia não entrega a escolha com uma seta. Reserva identificada aparece na base e nos Terraços com colisor, sem produção agrícola automática. 90 créditos pessoais únicos, sem XP adicional.

- [x] [Solo e saves](qa/food/solo.json): rejeição do lote incompatível, bloqueio do armazenamento prematuro, tratamento, instalação/entrega, reload e três retornos estáveis; quatro resoluções.
- [x] [Dupla](qa/food-coop/coop.json): convidado coleta/trata/entrega; 90 créditos por integrante e reconexão sem duplicação.
- [x] [Modelo](qa/food-model/model.json): cadeia, pré-requisitos, recibos, save anterior e falha/retry de armazenamento.
- [x] [Navegação](qa/food-access/access.json): caminhos e retornos dos dois lotes e demais locais livres; atlas preserva bloqueios.
- [x] Typecheck/build e [build compilada](qa/food-compiled/public.json), com regressão da chegada da água, aceite/reload e sentinelas reais preservados.
- [x] Vercel da 0.1.156 publicada: [hashes](qa/publication/0.1.156/hashes.json) e [Chrome público](qa/publication/0.1.156/public.json) conferidos. Render ainda 15; sem declaração de coop público compatível.
- [ ] Playtest humano. Continuação ao transporte já autorizada.

Os props de cartucho/carga usam o equipamento inteiro existente; registros/minerais usam suas imagens próprias. Folhas/raízes pintadas existentes distinguem o resíduo azulado do lote seco. Capturas dos dois lotes inspecionadas; não há nova pintura de terreno ou desenho estático por frame.

## 3 — O peso de permanecer · 0.1.157

[Laboratório direto](https://echosofdante.vercel.app/campaign-playtest.html?permanence=transport&v=0.1.157). Simula os sete relatórios e os capítulos de água/alimento; transporte está pendente. Ivo verifica largura/apoio para o estrado, fixa a carga e solicita conduzi-la fisicamente ao depósito. O estrado se move a 165 unidades/s atrás de qualquer integrante vivo entre 70 e 280 unidades; fora do alcance ele espera. Colisão circular de raio 22 respeita rochas e jogadores, incluindo Dash. Descarga requer a presença real da carga a até 105 unidades, além da posição do integrante. Sem consumo de inventário, HP de escolta, quota ou espera obrigatória. 100 créditos pessoais únicos.

Viajar, morrer/reiniciar ou recarregar recolhe a carga ainda pendente ao engate seguro (850,1070); objetivos discretos permanecem salvos. Posição do estrado é transitória, como a posição de combate, e não uma nova migração de save. Ao descarregar, o objeto móvel dá lugar ao depósito visível no abrigo/base. Depósito afastado lateralmente do ponto de interação após inspeção visual. Movimento usa a colisão existente; minimapa mantém somente geometria permanente no cache.

Pose opcional do estrado segue o snapshot autenticado do anfitrião no protocolo 16, sem novo comando ou ação de rede. Convidado não simula outra carga; apresenta pose e colisor recebidos. Catálogo de IDs já foi reservado na 0.1.155.

- [x] [Solo](qa/transport/solo.json): destino rejeita sem carga; condução por WASD real, descarga/diálogo e recompensa; reload/retornos/resoluções.
- [x] [Dupla](qa/transport-coop/coop.json): convidado conduz com teclado real, pose replicada, recusa de descarga sem carga e 100 créditos por membro, uma vez, após reconexão.
- [x] [Colisão e ciclo](qa/transport-safety/safety.json): caminhada/Dash param no estrado; carga espera fora do alcance, respeita crista física, morte real/R e reload preservam objetivos e uma única carga pendente. Fixtures de posição/objetivos/invulnerabilidade explicitadas; nenhuma edição da carga.
- [x] [Modelo](qa/transport-model/model.json) e [acesso](qa/transport-access/access.json): cadeia/save/recibos, caminhos/retornos e atlas bloqueado.
- [x] Typecheck/build final e [Chrome compilado](qa/transport-compiled/public.json) passaram. Inspeção do ponto de descarga livre e cache estático registrada no teste de ciclo.
- [x] Vercel da 0.1.157 publicada; [37 hashes JavaScript e SHA-256](qa/publication/0.1.157/hashes.json) conferidos. Laboratório do transporte também passou no [Chrome público cumulativo](qa/publication/0.1.159/public.json).
- [ ] Playtest humano. Continuação à energia já autorizada.

## 4 — Uma luz que é nossa · 0.1.158

[Laboratório direto](https://echosofdante.vercel.app/campaign-playtest.html?permanence=energy&v=0.1.158). Simula também os três capítulos anteriores; energia está pendente. Investigar aterramento seco e retorno úmido, retirar célula/regulador reservados da nave, desligar apoio antigo e energizar rede humana isolada. Preserva o mistério das estruturas de Dante, sem conectar a nave a elas. 110 créditos pessoais únicos, sem XP adicional. Oficina iluminada passa a aparecer na base e nos Terraços, com colisor e aproximação livre.

Frente de descarga muda por quatro setores em ciclos de 1900 ms: 1000 ms de preparo, 550 ms de contato e 350 ms de recomposição. Setor de 190 unidades e semiamplitude 0,42 rad; dano-base 22 usa as regras comuns. Geometria do aviso desenhada uma vez, depois somente rotação/alpha. Som de aviso existente, por evento e proximidade, sem nova música ou mudança de mixagem. Desconectar o apoio interrompe todas as direções; não há espera obrigatória ou quota de abates.

- [x] [Solo](qa/energy/solo.json): ordem, instalação prematura recusada, retirada/travessia, entrega, 110 créditos, reload, quatro resoluções e retornos estáveis.
- [x] [Navegação e descarga](qa/energy-access/access.json): acessos/retornos, dano real (25 HP no equipamento da fixture; golpes de criaturas filtrados para isolar a descarga), setores seguros, preparo sem dano e interrupção das quatro direções.
- [x] [Modelo](qa/energy-model/model.json): cadeia, save/recibo/retry e capacidade do relay sem reescrever estado antigo.
- [x] [Compatibilidade anterior](qa/relay15-compatibility/compatibility.json): dois Chrome contra relay 15 exato de `fc0f552`, relatório regional real com E/entrega/crédito; capítulos novos bloqueados antes do aceite, laboratório novo e campanha já iniciada no capítulo recusados explicitamente. Snapshot salvo permanece intacto e atualizar a capacidade restaura a disponibilidade.
- [x] [Dupla 16](qa/energy-coop/coop.json): convidado aceita/executa/entrega e recebe 110 créditos uma vez, inclusive após reconexão; repetida após a guarda de compatibilidade.
- [x] Typecheck/build final e [Chrome compilado](qa/energy-compiled/public.json) passaram. Aviso violeta distingue a descarga dos avisos das criaturas; captura inspecionada. Painel do laboratório explica criação da equipe e oferece preparo explícito pelo anfitrião, com nomes portugueses das classes.
- [x] Vercel da 0.1.158 publicada; [37 hashes e SHA-256](qa/publication/0.1.158/hashes.json) conferidos. Campanhas anteriores podem usar o relay 15; os capítulos novos continuam exigindo relay 16.
- [ ] Playtest humano de ritmo, dificuldade e leitura; seguir às chegadas conforme autorização do lote.

## 5 — Mais duas vozes em Dante · 0.1.159

[Laboratório direto](https://echosofdante.vercel.app/campaign-playtest.html?permanence=arrivals&v=0.1.159). Simula também os quatro capítulos anteriores; a recepção está por aceitar/concluir, sem seus 120 créditos. Nara organiza baliza, manifesto, segundo módulo reservado, recepção de Mara/Tomás e conferência dos recursos. Continua a primeira colonização já existente: **segunda equipe**, preservando os primeiros moradores e o primeiro módulo. Não há construção livre, produção agrícola ou definição da origem das estruturas antigas.

Segundo alojamento fixo no setor oeste, com os três colisores proporcionais à mesma pintura completa original. Mara/Manutenção e Tomás/Suprimentos usam figuras completas existentes, sombras e colisores pequenos, com falas individuais por E, toque ou A. Instalar reposiciona qualquer integrante que ocupe o volume novo; nada duplica ao voltar, morrer ou recarregar. Manifesto conferido também aparece na base. Verificação final exige as evidências de água, reserva, depósito e rede isolada; não substitui os relatórios anteriores nem abre regiões/bosses.

- [x] [Solo](qa/arrivals/solo.json): cinco ações reais/entrega, recusa prematura, 120 créditos únicos, reload, quatro resoluções e três retornos com contagens estáveis.
- [x] [Dupla](qa/arrivals-coop/coop.json): botão real prepara somente no anfitrião, convidado não altera a simulação; convidado instala, recebe, conversa e entrega. Aliado dentro do volume é reposicionado; moradores/falas aparecem em ambos, recompensa e reconexão sem duplicação.
- [x] [Modelo](qa/arrivals-model/model.json) e [acessos](qa/arrivals-access/access.json): pré-requisitos/recibos/save antigo; geografia completa com duas casas, passagem original e aproximações dos moradores conectadas. Vista geral inspecionada, além dos pontos com personagem.
- [x] [Controles finais](qa/final-controls/controls.json): quatro classes com CDP multitouch, oito direções independentes, carga/soltura/cancelamento, layouts 568×320, 844×390, 1024×768 e 1600×530; gamepad mock e falas por toque/A. Evidências provisórias de casa/moradores são fixtures de entrada, sem simular entrega ou recompensa deste capítulo.
- [x] [Compilado cumulativo](qa/final-compiled/public.json): cinco links, aceite/reload e sentinelas reais, sem globais DEV.
- [x] Publicação final da aplicação: commit `8e80eb1303787da4826070ab1637bf5b124ad568`, Git local/remoto sincronizados e Vercel concluída. [37 JavaScript/SHA-256](qa/publication/0.1.159/hashes.json) conferem com a build local; [cinco laboratórios públicos](qa/publication/0.1.159/public.json) passaram no Chrome, incluindo aceite/reload e sentinelas de personagens/configurações. Capturas públicas inspecionadas.
- [ ] Playtest humano. O lote autorizado termina aqui, sem iniciar a entrega D.

## Verificação integrada e limites

[Uma jornada, cinco capítulos](qa/full-chain/chain.json): somente os sete relatórios/Warden anteriores foram simulados uma vez, antes do primeiro capítulo. Os cinco capítulos novos foram aceitos, executados e entregues na mesma personagem temporária, sem nova preparação entre eles; E/NPC/atlas reais e carga conduzida por WASD real. Total de **500 créditos novos** (80+90+100+110+120), um recibo por capítulo, sem XP adicional, com 12 relatórios principais preservados após reload. Morte real/R cobra uma vez a penalidade original de 10%; segundo reload não concede os capítulos de novo. As duas pessoas e o novo módulo persistem, e os três bosses posteriores ao Warden permanecem vivos na simulação.

Posicionamento/invulnerabilidade são usados para cobrir objetivos e não representam um playthrough humano nem balanceamento solo/dupla. Dupla usa dois Chrome; quatro conexões foram validadas no protocolo, sem afirmar quatro renderizações humanas ou aparelhos físicos. Não foram medidos 30 minutos/oito horas. Pinturas aprovadas, figuras completas, classes, estatísticas dos bosses, cadeia original, recibos antigos e enquadramento das Galerias preservados. Nenhum PNG/MP3 novo foi necessário; geometria estática é preparada uma vez e os efeitos mudam por transformações/eventos.

Scripts principais: `qa-permanence.mjs`, `qa-permanence-coop.mjs`, `qa-permanence-chain.mjs`, `qa-permanence-access.mjs`, `qa-permanence-model.mjs`, `qa-permanence-protocol.mjs`, `qa-permanence-compatibility.mjs`, `qa-permanence-haul-safety.mjs`, `qa-permanence-final-controls.mjs`, `qa-permanence-public.mjs`, `qa-permanence-public-coop.mjs` e `verify-permanence-publication.py` em `scripts/`.

## Fechamento do lote

| Versão | Sprint | Commit enviado para main |
|---|---|---|
| 0.1.155 | Água | `8e647825c96e2c53704817a09db2e194bc322244` |
| 0.1.156 | Alimento | `a120f09e545a2c3f844a4b06afe26cf624030dbd` |
| 0.1.157 | Transporte | `4e9c0c3354323f6790c47e047e588c4787782184` |
| 0.1.158 | Energia / compatibilidade anterior | `02483b1dbd7cc4123dceb26f386cd7ce479e7d33` |
| 0.1.159 | Segunda equipe | `8e80eb1303787da4826070ab1637bf5b124ad568` |

Os cinco sprints tiveram QA, commit e push próprios, sem antecipar a entrega D. Todos os laboratórios foram publicados no solo e registrados na biblioteca. **Histórico de 27/10:** o Render ainda informava protocolo 15/revisão `1247c89c2150896bf9797512e354323ead7f4d7b`; o cliente preservou campanhas anteriores e bloqueou os capítulos novos nesse relay. Em 28/10 o usuário publicou `ae96140`; saúde e WebSocket passaram a informar protocolo 16. [Catálogo público](qa/public-relay-16/report.json): cinco capítulos, 25 evidências, posição opcional da carga e requisição autenticada do convidado conferidos com duas conexões temporárias. Snapshots sintéticos verificam transporte/filtro, sem representar conclusão jogável. A validação da interface pública é descrita na manutenção abaixo.

A revisão histórica `ae96140` alterou somente documentação/testes e manteve a versão da aplicação. Conferências com `--read-only` preservam o registro de implementação de cada versão. Aprovação humana dos cinco capítulos segue pendente.

## 28/10 — Retorno ao menu e coop público · 0.1.160

A automação pública encontrou um bloqueio no laboratório: depois de “Voltar à tela inicial”, a chegada automática reabria o solo e impedia alcançar Jogar → Cooperativo. O shell agora emite um evento depois de salvar/desconectar com sucesso; somente o laboratório de permanência guarda uma intenção temporária de abrir o menu na próxima carga. A chegada automática sem pedido explícito fica restrita ao personagem solo. Personagens coop usam o menu/convite para reunir sua equipe original depois de recarregar. Namespace/recibos, campanha principal, bosses e protocolo 16 não mudam.

A consulta inicial do convite (`PartyLobby`) ainda aceitava apenas protocolo 15, embora `CoopSession` já aceitasse 16. Agora ambos aceitam 15/16. As guardas existentes continuam impedindo capítulos novos no relay 15; aceitar a inspeção da sala não altera essa restrição.

[Laboratório direto](https://echosofdante.vercel.app/campaign-playtest.html?permanence=arrivals&v=0.1.160), registrado na biblioteca. Simula Warden/sete relatórios e os quatro capítulos anteriores, deixando recepção e seus 120 créditos pendentes. Para equipe, volte ao menu, crie/reúna os personagens e use o preparo explícito do anfitrião. Não há vitória simulada dos três bosses posteriores.

- [x] Typecheck/build finais: passaram; permanece o aviso conhecido de tamanho dos chunks Phaser/GameScene.
- [x] [Inspeção 15/16](qa/menu-lobby/report.json): função real `PartyLobby` transpilada e executada contra relays reais 15 histórico e 16 atual, incluindo classe ocupada, tamanho de equipe e recusa de sala inexistente.
- [x] [Dupla compilada](qa/menu-coop-compiled/report.json): dois Chrome, sem globais DEV; solo → menu → criação, convite/nomes próprios, preparo explícito, aceite por diálogo e manifesto com E do convidado. Reload → menu → convite → personagem original mantém objetivo, créditos/recibos e bosses posteriores vivos. Sentinelas de personagens/configurações reais intactas. Captura do diário inspecionada.
- [x] [Solo compilado nos cinco capítulos](qa/menu-solo-compiled/public.json): aceite/reload continuam funcionando e personagens/configurações reais permanecem intactos; biblioteca contém os cinco links. Captura da água inspecionada.
- [x] [Relay público](qa/public-relay-16/report.json): catálogo completo e requisição autenticada. Snapshots sintéticos, sem afirmar execução jogável de cada objetivo.
- [ ] Publicação da correção e repetição do fluxo de dupla na Vercel/Render.
- [ ] Aprovação humana dos cinco capítulos; não iniciar entrega D. Esta manutenção não repete o percurso completo de cinco capítulos nem constitui avaliação de dificuldade/duração.
