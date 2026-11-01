# Configurações de áudio no mobile · 0.1.178

**Auditoria de 01/11/2026:** a correção permanece incompleta. Começar com Geral 0 e depois restaurar 80 no cliente público mantém `media.muted=true`, ganho positivo e sinal zero. O QA abaixo cobria o caminho com volume inicial positivo e não detectou esse estado. A abertura também mantém seu caminho nativo de volume. [Achados, capturas e reprodução](../frontend-ux-audit-178/README.md). Nenhuma correção aplicada pela auditoria; reteste humano continua pendente.

## Escopo

Em 31/10/2026, o usuário relatou que, jogando no iPhone, reduzir Efeitos, Música e Volume geral não mudava o som. A música da campanha usava `HTMLAudioElement.volume`, uma limitação de controle registrada pelo WebKit para iOS; o áudio da trilha agora passa por um `GainNode` do Web Audio. Os efeitos continuam em seu bus Web Audio próprio. A configuração geral atua em ambos.

Os três controles de Configurações mostram o percentual, têm área de toque maior e aplicam em `input` e `change`. Os valores continuam salvos por navegador; o teste usa armazenamento temporário e preserva registros reais. Nenhuma música, efeito de boss, regra de combate ou protocolo de coop foi substituído.

## Laboratório

[Testar os controles de áudio](https://echosofdante.vercel.app/campaign-playtest.html?audio-review=1&v=0.1.178) abre um menu novo, sem pré-requisitos simulados. Crie um personagem temporário, inicie solo, use uma ação para liberar o áudio e abra Esc → Configurações. Arraste cada controle até zero e restaure; o percentual deve acompanhar o dedo. Fechar a aba descarta os dados do teste.

## QA técnico e aprovação humana

- [x] Typecheck e build de 270 módulos.
- [x] Chrome com toque emulado, servidor dev e preview compilado: os três sliders alteram a preferência isolada; música/efeitos/geral chegam a zero; níveis restaurados após retomar a campanha. Música passou pelo `GainNode` e o `HTMLAudioElement.volume` ficou em 1. Save/configurações reais de sentinela permaneceram inalterados. [Roteiro](../../scripts/qa-mobile-audio-settings.mjs), [relatório do preview compilado](qa/compiled/report.json), [captura do painel](qa/compiled/settings-touch.png).
- [x] Commit `012ebb9` enviado; Vercel publicou 0.1.178, 73 hashes conferidos e teste público do jogo passou. [Relatório público](qa/public/report.json), [hashes/relay](../outpost/qa/publication/0.1.178/hashes.json), [captura pública](qa/public/settings-touch.png).
- [ ] Reteste humano em iPhone 13/13 Pro no Chrome, incluindo Música e Efeitos em zero e restauração do volume durante a campanha. Emulação de desktop não confirma comportamento físico do iOS.

Fontes técnicas: [registro do WebKit sobre volume programático em iOS](https://bugs.webkit.org/show_bug.cgi?id=169969); rota Web Audio usa a interface [MediaElementAudioSourceNode do padrão Web Audio](https://webaudio.github.io/web-audio-api/#MediaElementAudioSourceNode) e seu ganho independente.
