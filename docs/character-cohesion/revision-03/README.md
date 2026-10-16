# Revisão 0.1.103 — início direto e cotovelos do seletor

A 0.1.102 não foi aprovada: o usuário ainda encontrou braços estranhos no seletor e relatou voltar ao título depois da dificuldade, precisando entrar por Continuar. Esta é uma correção da entrega 1; nomes/chat e demais etapas continuam aguardando validação.

## Fluxo exigido

**Jogar → Novo jogo → personagem/nome/apresentação → dificuldade → abertura → jogar.**

- A dificuldade é uma ação de início; não existe confirmação adicional nem retorno ao título.
- Sem jornada válida: mostrar **Novo jogo**, sem **Continuar expedição**.
- Com jornada salva: mostrar **Novo jogo** e **Continuar expedição**. Novo jogo continua sendo uma jornada nova, sem selecionar ou sobrescrever a anterior.
- Coop mantém personagem → tamanho da equipe → dificuldade → abertura → lobby. A equipe completa continua necessária para iniciar.

## Correção do início

O início anterior só atravessava o reload por uma marca em `sessionStorage`. A falha ao gravá-la fazia o código voltar ao menu. Agora o navegador navega com uma intenção de início associada ao personagem selecionado (`iniciar=<id>`), validada contra o registro local e removida da URL ao consumir. O carregamento mostra **Iniciando expedição**, sem exibir Jogar/Continuar antes da abertura. Sem novo formato de save, migração ou credencial no parâmetro.

Outra saída indevida estava na falha ao salvar `introSeen`: ela também voltava ao título. Agora permite tentar concluir a mesma chegada, sem repetir o vídeo ou criar outro personagem. O início normal não exige esse botão; ele aparece apenas quando essa gravação falha.

O marcador de sessão anterior ainda é aceito para os laboratórios legados, mas o novo jogo não depende dele. Os convites continuam sujeitos à identidade e às regras do relay. A consulta de jornadas para Continuar reutiliza a validação de `LocalJourney`, agora com dono explícito opcional, sem trocar o personagem ativo.

## Correção visual

O antebraço pintado tinha uma ponta no recorte junto ao cotovelo. Ampliada no seletor, ela sobressaía sobre a outra peça e parecia uma articulação quebrada. O Canvas do retrato agora limita o recorte a uma junção arredondada, preservando a pintura, os encaixes e a escala proporcional. A demonstração também flexiona o braço/instrumento, mantendo a pose frontal.

Sem novos PNGs, máscaras/Graphics de gameplay, alteração de ossos/ataques ou novas entidades. A composição é somente no Canvas já usado pelo seletor, com demonstração finita a 30 FPS; a campanha mantém seu rig existente.

## Teste reservado

[Abrir seletor e criação](https://echosofdante.vercel.app/campaign-playtest.html?v=0.1.103). Personagens reais preservados; o laboratório usa somente dados temporários desta aba. Para ver o estado sem saves no laboratório, use **Reiniciar teste** no painel reservado.

[Apresentações masculinas](qa/menu/selection-male.png) · [Apresentações femininas](qa/menu/selection-female.png) · [Relatório do fluxo oficial](qa/start/report.json).

## Validação

`qa-new-game-direct.mjs` testa o **ponto de entrada oficial**, em contextos Chrome separados: navegador vazio, término natural do vídeo, segunda criação com save anterior, clique repetido e `sessionStorage` completamente bloqueado. Confere que o jogo realmente abre (incluindo pausa/retomada), que não aparece título/Jogar na transição, que não se duplica personagem e que a jornada anterior é preservada. Não testa apenas o botão Pular ou o wrapper do laboratório.

`qa-character-cohesion-menu.mjs` captura as oito apresentações e suas demos no build compilado. Automação não aprova o desenho dos braços. Comparação visual e teste físico continuam dependendo do usuário.

O QA cooperativo observa ações nos snapshots do relay, em vez de apenas esperar pulsos curtos de teclado. Também aguarda a recuperação do ataque/esquiva antes de iniciar Q, conforme as condições existentes do combate. Os clientes usam emulação de foco do Chrome para representar aparelhos separados: alternar abas num único navegador não representa quatro jogos em primeiro plano. Nenhuma regra de combate ou controle foi alterada para acomodar o teste.

### Resultados desta revisão

- Fluxo oficial: passou, sem erros de JavaScript/assets, incluindo término natural da abertura, armazenamento da aba bloqueado, clique repetido, quatro resoluções e recuperação de falha transitória de gravação.
- Seletor: passaram carregamento e demonstrações das quatro classes, nas duas apresentações; capturas acima para revisão humana.
- [Entrada cooperativa compilada](qa/coop/report.json): passaram criação/convites de quatro classes, início com equipe completa, retorno dos visitantes quando o anfitrião sai, navegação de menu por gamepad e toque emulado. Sem erros de JavaScript/assets nessa bateria.
- `npm run typecheck`, `npm run build` e `git diff --check`: passaram; permanece o aviso conhecido de tamanho do bundle Phaser.
- A bateria estendida de ações cooperativas ficou **inconclusiva**: em execuções diferentes observou movimento/ataque/esquiva/carregamento, mas não confirmou todas as transições para todos os clientes na mesma execução. O [diagnóstico preservado](qa/coop/diagnostic-actions.json) termina sem observar Q do anfitrião; isso não equivale a aprovar combate com quatro pessoas. Conferir Q e movimento também no playtest da equipe. Esta revisão não altera controles, combate, relay ou protocolo.

**Aprovação visual humana pendente.** Não avançar à etapa 2 antes da validação deste seletor e do início direto.
