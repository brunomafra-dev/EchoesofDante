# Restauração e preferências de áudio · 0.1.179

Primeira etapa da auditoria de front-end/UX, autorizada em 01/11/2026. Corrige A01–A03 da [auditoria da 0.1.178](../frontend-ux-audit-178/README.md). UX mobile e integração visual, incluindo a retirada da transparência automática dos objetos (V05), seguem pendentes para a etapa seguinte, após o reteste desta entrega.

## Comportamento

- A música iniciada com Geral/Música em zero ou sem foco pode voltar ao restaurar o volume e retomar. O ganho recebe o valor correto antes de limpar o mute nativo herdado; silêncio e mixagem passam pelo ganho quando há Web Audio.
- A abertura usa ganho Web Audio próprio, sob Geral × Música. É uma faixa já mixada; Efeitos controla os efeitos do jogo e não separa os sons do filme. O contexto da abertura é fechado com o vídeo, inclusive ao pular.
- A abertura indica **VOLUME EM ZERO** quando Geral ou Música está em zero. O botão fica indisponível nesse estado, com orientação para aumentar nas configurações. O mute manual continua independente das preferências e sobrevive a pausa/retorno das configurações.
- Flags transitórias de início/convite são lidas separadamente das preferências. JSON inválido de convite não descarta configurações válidas de áudio.
- O laboratório de áudio inicia sem carregar o mundo atrás do menu, como a entrada oficial. O mundo só é carregado ao iniciar uma campanha.
- O convite cooperativo preserva `audio-review=1`, mantendo anfitrião e convidado no mesmo laboratório e namespace de teste. A ausência dessa flag foi detectada pela primeira tentativa de QA da dupla e corrigida antes da publicação.

Músicas, níveis padrão, efeitos, bosses, missões e saves existentes preservados. Sem mudança de protocolo ou catálogo do relay; não exige novo deploy no Render.

## Teste direto e isolamento

[Testar restauração de áudio](https://echosofdante.vercel.app/campaign-playtest.html?audio-review=1&v=0.1.179).

1. Antes de criar, abra Configurações e deixe Geral em zero.
2. Crie um personagem temporário e escolha a dificuldade. A abertura deve continuar muda e indicar VOLUME EM ZERO.
3. Nas configurações da abertura, restaure Geral: o som deve voltar. Confira também o botão de mute e o retorno das configurações.
4. No jogo, teste Geral, Música e Efeitos em zero separadamente. Retome a partida para escutar; o menu de pausa ainda silencia a música. A prévia audível e o layout compacto pertencem à próxima etapa de UX.
5. Recarregue e continue o mesmo personagem para conferir preferências e restauração. Em equipe, use o convite deste laboratório; cada navegador controla seu próprio volume.

Nenhum pré-requisito, vitória, missão ou recompensa é simulado. Personagens e preferências do teste ficam somente no namespace temporário da aba, isolados dos dados reais; o teste sobrevive a reload nessa aba. Fechá-la descarta os dados temporários.

## QA técnico e aprovação humana

Roteiro de regressão: [qa-audio-recovery.mjs](../../scripts/qa-audio-recovery.mjs). Mede sinal após os ganhos reais, além de volume, mute e estado do contexto. Usa criação/menus/toque normais e uma flag de convite deliberadamente inválida como fixture de resiliência. Não usa globais DEV ou simulação de progresso. A opção `QA_LOCK_MEDIA_VOLUME=1` simula um setter nativo ignorado; não representa um iPhone físico.

- [x] Typecheck e build de 271 módulos; aviso existente de chunks grandes. Revisão dos caminhos de ganho/mute e leitura de preferências.
- [x] DEV: abertura/jogo, Geral/Música/Efeitos, mute manual, pausa, reload e armazenamento real preservado. [Relatório](qa/dev/report.json).
- [x] Subsistema real de áudio: início em zero/sem foco/normal, retomada de contexto suspenso, transição exploração/boss, liberação da trilha anterior, parada explícita, reinício e destruição; fallback nativo sem Web Audio. [Roteiro](../../scripts/qa-audio-transitions.mjs), [relatório](qa/transitions/report.json). Não é combate de boss nem simula uma vitória.
- [x] Compilado: regressão completa com setter de volume nativo ignorado, Geral/Música da abertura, encerramento do contexto ao pular, teclado e gamepad emulado nos sliders. [Relatório](qa/compiled/report.json), [abertura em zero](qa/compiled/film-zero.jpg), [configurações touch](qa/compiled/settings-touch.jpg). Capturas inspecionadas pelo agente.
- [x] Compilado em dois Chrome independentes, anfitrião/convidado: preferências pessoais, silêncio e restauração medidos, convite de laboratório preservado e dados reais intactos. [Roteiro](../../scripts/qa-audio-recovery-coop.mjs), [relatório](qa/coop/report.json). Protocolo 16; campanha inicial sem missão aceita. Chat cancelado pela interface quando sobrepôs Retomar, conforme observação abaixo.
- [ ] Publicação: commit/push, igualdade local/remota, hashes e teste público.
- [ ] Reteste humano em iPhone 13/13 Pro e aprovação da escuta. QA emulado não substitui aparelho físico.

**Observação para a próxima etapa de UX:** no roteiro cooperativo, o chat aberto sobrepôs o botão Retomar do menu de pausa. [Captura inspecionada](qa/coop/chat-overlap.jpg). Cancelar o chat pela interface permite retomar. A origem da abertura nesse percurso não foi isolada; não é atribuída à alteração de áudio. O roteiro registra quando precisa desse cancelamento e não usa clique forçado para atravessar a sobreposição. Rever convivência entre chat e menus na etapa de UX mobile.

**Limites dos roteiros:** a primeira tentativa de reload esperava que a partida voltasse automaticamente; foi ajustada para continuar pelo seletor normal. A medição passa a aguardar mídia carregada e tempo de reprodução avançando, para distinguir silêncio de carregamento. Falhas de roteiro corrigidas não são registradas como regressões da aplicação.

Referências técnicas: [roteamento de áudio/vídeo por MediaElementAudioSourceNode](https://developer.mozilla.org/en-US/docs/Web/API/AudioContext/createMediaElementSource) e [gestos de usuário/autoplay no Web Audio](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices). O caminho nativo permanece como fallback quando Web Audio não está disponível; nessa condição não se garante volume intermediário em dispositivos que ignoram o setter, embora mute em zero seja aplicado.
