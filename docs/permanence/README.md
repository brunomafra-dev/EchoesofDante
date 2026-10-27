# Capítulos da permanência

Em 27/10/2026 o usuário aprovou o Incandescente 0.1.154 (“Gostei muito”) e autorizou executar **água → alimento → transporte → energia → chegada de colonos**, com QA, commit e push por sprint e continuação imediata, sem esperar playtest entre os cinco. Aprovação humana destes capítulos continua pendente. Nenhum capítulo da entrega D, agricultura produtiva ou construção livre faz parte deste lote.

## 1 — Água para o assentamento · 0.1.155

[Laboratório direto](https://echosofdante.vercel.app/campaign-playtest.html?permanence=water&v=0.1.155)

Continua a partir dos sete relatórios e do primeiro abrigo existentes; não substitui a missão original de analisar a nascente. Lia investiga a saturação do cartucho: comparar captação/sedimento, recuperar carga reservada, isolar retorno sob pressão e instalar tratamento no reservatório. Cinco objetivos contextuais, sem quota de abates ou compra obrigatória. A descarga tem aviso de 1100 ms, contato durante 700 ms num ciclo de 3200 ms, e pode ser contornada. Isolar o retorno a interrompe. Dano-base 18 segue dificuldade, resistência, invulnerabilidade e morte existentes.

O tratamento instalado aparece nos Terraços e na base, com carga pintada existente e colisor próprio. Evidências, conclusão e 80 créditos pessoais usam o diário/recibos atuais, sem XP extra. Nenhum portal ou boss é liberado pelo capítulo. Saves schema 1 anteriores continuam válidos; não ganham conclusão ou créditos novos automaticamente.

### Laboratórios e simulação

`campaign-playtest.html?permanence=water`: namespace `dante-permanence-v1.water.<classe>`, em sessionStorage isolado de personagens, configurações e progresso reais. Simula sete relatórios até o abrigo, Warden, 350 XP, cinco poções e acesso já descoberto às Nascentes/Terraços. Capítulo escolhido está **por aceitar e completar**. Soterrado, Vésper e Incandescente permanecem vivos; a simulação não concede seus recibos. Os próximos laboratórios também simulam apenas os capítulos anteriores ao escolhido.

### Cooperativo

Catálogo compartilhado reservado para cinco capítulos e 25 evidências em `src/config/permanence-catalog.json`; só definições implementadas aparecem no diário. O relay anterior remove IDs desconhecidos, portanto existe incompatibilidade real: cliente/relay passam ao **protocolo 16**. Aceite/entrega continuam autenticados e validados pelo anfitrião junto ao NPC; E usa a posição real do integrante. Host resolve pressão/dano e envia o mesmo tempo de simulação usado para a apresentação remota. Atualizar o Render e verificar sua saúde/publicação antes de declarar coop público disponível.

### QA técnico e limites

- [x] [Modelo e save](qa/model/model.json): ordem/pré-requisitos, persistência anterior, falha de armazenamento, recibos/retry.
- [x] [Relay real](qa/protocol/mission-protocol.json): quatro conexões, catálogo, autoria, entradas inválidas, equipe original e viagens conectadas.
- [x] [Solo](qa/water/solo.json): E, diálogos, instalação recusada antes dos requisitos, entrega, reload, três retornos sem crescimento e diário em quatro resoluções.
- [x] [Dupla em dois navegadores](qa/water-coop/coop.json): convidado aceita/executa/entrega, recompensa pessoal e reconexão sem duplicação; posições/invulnerabilidade preparadas.
- [x] [Navegação e pressão](qa/water-access/access.json): todos os locais com aproximação/retorno, dano real de 20 HP no normal solo, isolamento durável e regiões futuras bloqueadas.
- [x] [Controles emulados](qa/controls/controls.json): quatro classes, CDP multitouch, mira independente, carga/cancelamento, gamepad mock, quatro resoluções e reinícios sem duplicar HUD.
- [x] Typecheck/build finais e revisão/diff. Aviso conhecido dos chunks permanece.
- [x] [Build compilada](qa/compiled/public.json): aceite real e reload, sem globais DEV, personagens/configurações sentinela intactos.
- [ ] Commit/push e publicação; aguardar hashes e saúde do relay público 16.
- [ ] Playtest humano de ritmo, leitura e diversão.

Os testes de objetivos usam posição/invulnerabilidade preparadas para cobrir interações. Não medem duração humana ou descoberta da solução. Arte, terrenos, estatísticas de inimigos/bosses, quatro classes, economia pessoal e controles originais preservados. Sem garantia de 30 minutos ou oito horas.
