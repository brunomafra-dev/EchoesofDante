# Jornada preservada e HUD de desktop — 0.1.132

## Diagnóstico

A captura do usuário veio de `campaign-playtest.html?missions=1&settlement=1`. Esse laboratório preparava automaticamente a campanha pós-Warden: Ecos, cavernas, Primeiro Eco, portão e vitória eram simulados para testar o assentamento. Isso explicava o covil vazio e as viagens avançadas nessa aba. A preparação não fazia parte da aceitação das missões na campanha oficial; entretanto, o link entregue tornava fácil confundir simulação e campanha.

## Progressão

- O laboratório do assentamento agora começa do zero num namespace novo. Nenhum parâmetro prepara automaticamente uma vitória. Simular uma etapa exige botão e confirmação, com aviso persistente no painel após reload. O laboratório **jornada** remove os botões de preparação.
- Aceitar, acompanhar e entregar missões continua observando os fatos da exploração. Essas ações não derrotam bosses nem abrem os portões existentes.
- Atlas e ação de viagem da cena conferem os requisitos do mundo além da lista de destinos descobertos: fissura, Primeiro Eco, limiar, Warden e registros/bosses seguintes. Um nome na lista `visited` não basta para atravessar uma etapa. O convidado continua solicitando viagens ao anfitrião.
- Viagem rápida a regiões já liberadas e retorno à posição da expedição continuam disponíveis. O tracker indica a rota intermediária: Ecos/mecanismo, cavernas, Primeiro Eco, limiar, Warden, Vale, Nascentes e Terraços. O marcador do atlas aponta o próximo trecho acessível.
- Saves reais, vitórias legítimas e recibos de recompensa não foram apagados nem reiniciados. Não há alteração de protocolo (14), atributos, combate, drops ou custo de viagem.

## Composição do desktop

Referência de organização: [Blizzard — UI Design, Controller Support, and Co-Op](https://news.blizzard.com/en-gb/article/23308274/diablo-iv-quarterly-updatefebruary-2020), especialmente agrupamento da barra de ações embaixo e preservação da leitura do combate. A aparência continua própria do Dante.

| Grupo | Posição |
| --- | --- |
| Vida, nível, XP e Ecos | Canto inferior esquerdo |
| Dash e habilidade, com prontidão/recarga | Centro inferior |
| Recurso de Astral/Domador | Acima das habilidades |
| Créditos, atlas e poção | Canto inferior direito |
| Menu, mochila e registros | Linha superior direita |
| Radar local e missão | Coluna direita, em blocos separados |
| Região | Canto superior esquerdo |
| Chat cooperativo | Acima da vida |

O HUD de desktop usa DOM, mantendo a representação mobile aprovada e os controles atuais. O antigo chrome do canvas fica oculto; prompts, feedback de descoberta, morte e boss permanecem no canvas. Overlays centrais e barra de boss acompanham o tamanho lógico da janela. Os elementos são removidos no shutdown da cena.

`Phaser.Scale.EXPAND` preenche a janela mantendo a proporção dos sprites e o mínimo lógico de 1280×720. Pode mostrar mais cenário em telas largas/altas; não há estiramento CSS nem câmera de boss nova. A base tem só 1400 unidades de largura: o chão e uma borda vegetal decorativa continuam além dela, sem ampliar a área caminhável. Uma RenderTexture fixa adicional de 640×1050 (~2,6 MiB RGBA) é preparada uma vez na base; nenhuma nova imagem foi gerada.

## Testar

[Jornada do zero e HUD](https://echosofdante.vercel.app/campaign-playtest.html?missions=1&journey=1&v=0.1.132). Personagem temporário, sem ler ou alterar saves reais. Aceite Nara, saia pela Floresta e confira que o atlas não permite viajar às regiões seguintes. Para repetir, use **REINICIAR TESTE** no painel LAB.

[Assentamento](https://echosofdante.vercel.app/campaign-playtest.html?missions=1&settlement=1&v=0.1.132): também começa do zero. Abra o painel e confirme a simulação somente se quiser avaliar especificamente o conteúdo pós-Warden.

## Verificações

Scripts: `qa-journey-hud.mjs`, `qa-mobile-controls.mjs`, regressão `qa-dante-journey.mjs`, missões e assentamento. Os testes antigos de assentamento passam a solicitar explicitamente sua fixture pós-Warden; o QA compilado aceita a confirmação de simulação pelo navegador.

Resultados técnicos e capturas ficam em [qa](qa). A suíte de jornada distingue ações reais de interface, posicionamento DEV para alcançar NPCs e injeção deliberada de destinos inválidos para testar a recusa. Ela não substitui um playthrough humano caminhando o trajeto inteiro.

### Resultado técnico · 22/10/2026

- Typecheck e build passaram. Permanece o aviso existente de chunk Phaser acima de 500 kB.
- [Jornada/HUD](qa/report.json): oito verificações, incluindo destinos bloqueados mesmo com `visited` adulterado, aceite sem alteração do mundo, descoberta não inventada após reload e confirmação explícita das simulações. Três reinícios mantêm as contagens de HUD e listeners de resize.
- Capturas inspecionadas: 1280×720, 1366×768, 1920×1080, 1912×886 e 1024×768. Os oito grupos do HUD ficam dentro da janela sem colisões entre si. A base tem continuidade visual na lateral larga, com os mesmos limites físicos.
- [Mobile](qa/mobile/controls.json): 24 verificações nas quatro classes, duas mãos independentes, oito direções, Q, cancelamento, menus, quatro tamanhos de viewport e WebKit. O teste de toque usa o tamanho lógico atual do canvas, em vez de presumir 1280×720 após resize.
- [Campanha original](qa/campaign/report.json): Floresta → Ecos → fissura/mecanismo → cavernas → Primeiro Eco → Warden → Vale. O boss aparece, inicia e mantém telegraphs ao pausar; recompensa e passagem usam o caminho real. O QA reduz seu HP somente para testar a consequência, sem declarar novo balanceamento. Morte/respawn, reload, recuperação de save inválido e mock de gamepad passaram. Amostra local de **57,8 FPS**, sem gravações durante idle; contagens iguais nos três ciclos monitorados.
- [Assentamento](qa/settlement/solo.json): sete relatórios preservados, três novas entregas, instalação condicionada às análises, colonos, recompensa única e persistência após morte/reload. Três viagens sem crescimento nas contagens monitoradas.
- [Dupla compilada](qa/compiled-coop/report.json): telefone anfitrião e tablet convidado em dois Chrome separados. Sete verificações de criação, espera, convite, início, chat, movimento e mira/ataque remoto passaram. Não há globals DEV nessa build; compartilhamento nativo é mockado. WebKit foi verificado separadamente.
- [Modelo](qa/models/model.json) e [relay](qa/protocol/mission-protocol.json): pré-requisitos, sete missões, recompensas únicas e equipe original preservados. Protocolo 14 mantido. Sem erro JS ou falha de asset nos fluxos de navegador aprovados.

Avaliação visual/ergonômica final pertence ao usuário. O mobile continua sujeito às condições do aparelho; as mudanças desta entrega não prometem FPS em todos os dispositivos. Não foi iniciada uma próxima etapa de conteúdo.
