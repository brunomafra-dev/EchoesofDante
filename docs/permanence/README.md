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
- [ ] Coop público: Render ainda respondeu protocolo 15 na conferência; incompatibilidade real informada ao usuário, código 16 enviado. Não declarar dupla pública validada até saúde e browsers reais passarem.
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
- [x] Vercel da 0.1.157 publicada; [37 hashes JavaScript e SHA-256](qa/publication/0.1.157/hashes.json) conferidos. Chrome público cumulativo da entrega final também cobre o laboratório do transporte.
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
- [ ] Publicação desta versão.
- [ ] Playtest humano de ritmo, dificuldade e leitura; seguir às chegadas conforme autorização do lote.
