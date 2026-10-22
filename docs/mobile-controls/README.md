# Mobile — mira, HUD e salas · 0.1.130

Manutenção autorizada em 22/10/2026 após captura e relatos de jogadores no celular. Sem avanço da próxima etapa de conteúdo. **Aprovação técnica não equivale à validação em aparelho real.**

## Diagnóstico

- A mira touch era um arrasto oculto no botão com ataque somente ao soltar. Não havia um analógico legível para ajustar continuamente a direção enquanto se movia.
- Interfaces DOM usavam posições incompatíveis: recurso em `top:26%`, mapa/poção no centro, chat na parte inferior central e dois mapas com o mesmo nome. Os elementos não acompanhavam a composição do HUD do canvas em janelas baixas do Safari.
- Não havia uma proibição por dispositivo no relay ou no cliente para criar sala. A criação precisava ser verificável inteiramente por toque, com ações visíveis e estados de espera claros. O caminho agora se chama **Criar sala e convidar** em todas as plataformas.

## Controles

1. Analógico esquerdo move.
2. Analógico direito: **arrastar gira e ataca continuamente**, respeitando a cadência e as regras existentes de cada classe. Voltar ao centro ou soltar interrompe o ataque. Toque curto mantém um ataque único.
3. Toque/arrasto no cenário orienta o personagem sem disparar. Não interfere na direção de um gesto de combate já capturado.
4. Habilidade mantém **segurar → mirar → soltar**. Percentual de carga, recarga e estado aparecem no próprio botão; esquiva também mostra sua recarga.
5. Cancelamento de ponteiro, perda de captura, mudança de orientação, morte, perda de foco e abertura de modal limpam o gesto. Cancelar carga não equivale a soltá-la para atacar.

Eventos de movimento e combate mantêm `pointerId` e captura independentes. Não usar rotação CSS da página. Implementação baseada nos [Pointer Events](https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events).

Não foram alterados velocidade, alcance, dano, cooldown, recursos, equipamentos, IA ou cálculo de colisão. O ataque contínuo usa a mesma entrada já existente de mouse/gamepad; não implementa autoaim nem travamento de alvo. Os snapshots cooperativos existentes já transportam direção e ataque sustentado.

## Composição mobile

Somente em dispositivos com ponteiro coarse:

- Vida, nível e XP compactos no canto superior; recurso Astral/Vínculo junto deles.
- Créditos, poção, atlas, guia, bolsa, menu e chat em uma faixa de borda, sem atalhos de teclado visíveis.
- Missão em duas linhas curtas; toque abre o diário completo. Texto longo tem reticências.
- Radar local começa recolhido. **ATLAS** abre o mapa de regiões; **RADAR** abre o mapa local.
- Chat fechado ocupa um botão. Histórico/campo aparecem ao abrir e respeitam a altura útil, inclusive durante a digitação.
- Código da sala e contador redundante de XP pessoal não ficam desenhados sobre o cenário mobile durante a conexão normal. Alertas de reconexão e de recompensa não salva continuam disponíveis; nicknames sobre os personagens permanecem.
- Em telas menores, recurso e missão passam à segunda linha. Safe areas e janelas baixas foram consideradas.

O HUD desktop do canvas foi agrupado em um container e fica invisível no mobile; os estados continuam sendo atualizados. Vida/XP mobile usam um único elemento DOM por cena. Recursos e atalhos reaproveitam as interfaces existentes. Desktop preserva seus controles e HUD. Corrigido também o seletor CSS que escondia a bolsa mesmo quando o dialog de menu estava fechado.

O painel do laboratório fica na borda superior lateral, longe do analógico esquerdo; não aparece no jogo principal.

## Salas e convites

**Jogar → Cooperativo → Criar sala e convidar → personagem → equipe → dificuldade → abertura → lobby.** Celular, tablet e computador usam o mesmo processo e as mesmas restrições de campanha/equipe original.

- Líder sem equipe completa: **Aguardando convidados**.
- Todos chegaram: **Equipe pronta para iniciar**, com o botão de iniciar em destaque, antes do bloco de convite.
- Convidado antes do início: **Aguardando líder**.
- Campanha já iniciada aguardando reconexão: **Aguardando a equipe original**.

Convite usa compartilhamento nativo quando [Web Share](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/share) está disponível. Copiar continua disponível; sem clipboard, o link é selecionado para cópia manual. Pedidos automáticos de fullscreen não interceptam o gesto dos botões de compartilhamento/cópia.

Protocolo **14 preservado**: não há migração de save ou servidor, alteração de autoridade, novo limite de equipe ou substituição de integrantes. O dispositivo do líder continua executando a simulação; esta entrega não promete execução do navegador em segundo plano pelo sistema operacional.

## Laboratórios protegidos

- [Mira e HUD — Hunter](https://echosofdante.vercel.app/campaign-playtest.html?missions=1&mobile=1&class=hunter&v=0.1.130).
- [Astral](https://echosofdante.vercel.app/campaign-playtest.html?missions=1&mobile=1&class=astral&v=0.1.130) · [Guerreiro](https://echosofdante.vercel.app/campaign-playtest.html?missions=1&mobile=1&class=warrior&v=0.1.130) · [Domador](https://echosofdante.vercel.app/campaign-playtest.html?missions=1&mobile=1&class=xenobinder&v=0.1.130).
- [Criar sala pelo celular/tablet](https://echosofdante.vercel.app/campaign-playtest.html?mobile=1&v=0.1.130).

O namespace `dante-mobile-lab` vive somente no sessionStorage da aba, separado dos personagens reais. Convites mantêm o laboratório. Fechar a aba descarta os perfis temporários. O laboratório de combate permite preparar cada classe sem repetir a campanha.

## QA e limites

Relatórios e capturas em [qa](qa). Scripts `qa-mobile-controls.mjs`, `qa-mobile-rearshot.mjs` e `qa-mobile-coop.mjs` distinguem entradas reais por CDP/toque, fixtures de combate DEV, APIs nativas simuladas e build compilado. Chrome mobile e WebKit não substituem Safari/iPhone ou Android físicos.

`npm run typecheck` e `npm run build` passaram; permanece o aviso existente de tamanho do chunk do Phaser. O primeiro script passou 24 verificações sem erros JS/HTTP. O rearshot confirmou dano real, esquiva e gamepad, também sem erros. A suíte compilada confirmou criação da sala pelo telefone, entrada do tablet, mensagens de espera, início pelo líder, chat no lobby/gameplay, entrada de mira/ataque do convidado e criação independente de sala pelo WebKit. Convites do laboratório preservam `mobile=1`; o aviso de espera fica fixo durante a rolagem do lobby.

- Quatro classes, oito direções, mover e mirar para lados opostos, deadzone e parada ao soltar.
- Giro pelo cenário, carga percentual, soltura, cancelamento e limpeza ao abrir/fechar modais.
- Janelas 844×390, 1600×530, 568×320 e 1024×768; desktop 1280×720 e WebKit mobile.
- Três reinícios mantêm um HUD, um controlador touch e um tracker.
- Hunter: alvo atrás recebeu dano real de projéteis, **68 → 23 HP**, enquanto o jogador avançou **x790 → x968,761** mirando para trás. Esquiva e mock de gamepad também verificados.
- Nenhum asset novo, textura adicional ou arte em runtime. O novo container e HUD DOM são destruídos com a cena. A medição curta do rearshot automatizado variou de 41,6 a 52,2 FPS, média 47,5; não usar isso para prometer FPS em aparelhos físicos.

Validar no aparelho real: conforto dos polegares, legibilidade com o chrome do navegador, teclado virtual, folha nativa de compartilhar, fluidez como líder e recepção do convite em outro dispositivo. Esta revisão aguarda esse playtest antes da próxima etapa.
