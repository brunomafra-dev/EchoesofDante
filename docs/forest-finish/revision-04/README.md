# Clareira viva e interface compacta · 0.1.137

[Testar esta revisão](https://echosofdante.vercel.app/forest-finish.html?v=0.1.137) · [Biblioteca](https://echosofdante.vercel.app/test-library.html)

O usuário aprovou a leitura do Hollow violeta da 0.1.136 e pediu indicadores permanentes, menos texto no HUD e um lugar mais reativo. Direção D / Organic Sci-Fi R3 preservada. A entrega técnica não substitui aprovação visual humana.

## O que mudou

- **Campanha e laboratório:** criaturas comuns mostram nome e barra cheia antes de qualquer hit. A barra acompanha o HP, fica acima da vegetação e desaparece com a criatura morta. Inclui Hollows, criaturas regionais e as representações do convidado no cooperativo. Apresentação dedicada dos bosses mantida.
- Vida do jogador tem **✚**, barra e valor numérico; rótulo acessível informa vida atual/máxima. Atlas 🌐, poção 🧪 com quantidade, mochila 🎒, registros 📖, menu ☰, chat 💬 e histórico 🕘 substituem títulos compridos nos atalhos. Nomes acessíveis, foco, tooltips e comandos existentes continuam disponíveis. Ícones emoji podem variar entre sistemas.
- **Somente nesta referência:** água tem deslocamento discreto limitado ao interior da nascente; margens permanecem imóveis. Copas e suas sombras se movem suavemente. Seis plantas baixas cedem à passagem do jogador e dos Hollows. Passos levantam folhas pequenas que desaparecem.
- Próximo da margem, **E / interação touch / gamepad** toca a água, produz ondas e um som curto. Perto da estrutura ancestral, o mesmo comando provoca um pulso violeta e áudio antigo. Há indicação contextual e intervalo mínimo de um segundo; nenhuma recompensa, missão ou passagem é alterada.

## Composição, custo e estabilidade

Chão/copa/Hollow violeta existentes reutilizados. Apenas um novo atlas de vegetação; as seis plantas acompanham vegetação já pintada nas margens, sem preencher o corredor. Sombras são cópias translúcidas das copas, sem iluminação dinâmica. Objetos fixos: seis plantas, seis folhas, cinco ondas, um pulso e uma superfície de água mascarada. Sem geração de arte em runtime, sem tweens/timers acumulados e sem redesenho estático a cada frame. O movimento reduzido congela vento/UV, remove folhas no ar e conserva as interações com resposta sem expansão.

A revisão visual também identificou um problema de reconstrução: adicionar o subframe da água mudava o frame padrão da textura. O chão agora pede explicitamente `__BASE`; o QA confere as dimensões integrais após cada reinício.

## Arte

`public/assets/experiments/forest-finish/trail-plants-v1.webp`: **512×512 RGBA, 81.502 bytes**, células 256×256, três plantas e uma folha. Aproximadamente 1 MiB RGBA descomprimido, além do overhead do renderizador. Original gerado offline pela ferramenta integrada imagegen, **1254×1254 RGBA**, reduzido uniformemente com Lanczos e WebP qualidade 91. [Prompt e origem](art-prompt.md). Nenhuma imagem externa usada.

## Verificação

- `npm run typecheck` e `npm run build` passaram; permanece o aviso conhecido do chunk Phaser.
- [Interações e HUD](qa/life.json): HP antes do dano, uso real da poção, atlas/mochila/registros, E nos dois pontos, plantas/folhas/água, famílias regionais, movimento reduzido e quatro reconstruções. **75 objetos de cena, 222 texturas, 25 listeners de shutdown e quatro de resize**, estáveis nas quatro amostras. Contagens são da referência, não de toda campanha.
- [Combate e classes](qa/report.json): quatro classes, duas apresentações, oito direções, Q, sabre, limites físicos, comparação, pausa, morte e respawn. Amostra aquecida sem screenshots: **60,0 FPS** em Chrome desktop neste ambiente.
- [Entradas](qa/inputs.json): mira/movimento independentes por multitouch emulado, carga visível, pausa, gamepad mock e WebKit. Resoluções 1280×720, 1366×768, 1920×1080 e 844×390.
- [Cooperativo local](qa/coop.json): dois navegadores e relay real local, oito inimigos saudáveis com nome/barra no anfitrião e no convidado. Protocolo **15**, sem mudança de servidor.
- [Build compilada](qa/compiled/report.json): Chrome sem globals DEV, cliques reais nos ícones, exploração/Q/E e layouts 1366×768/844×390; saves reais preservados.
- [Regressão da campanha](qa/campaign/report.json): Floresta → Ecos → mecanismo → cavernas → Primeiro Eco → Warden → Vale, morte/respawn, reload, recompensa, pausa dos registros, touch e gamepad mock passaram sem erro JS. Amostra dessa campanha: **57,8 FPS**. Os scripts descrevem quando usam posicionamento DEV; isso não representa uma campanha humana caminhando.

## Revisão crítica e limites

Conferidos chão integral após reiniciar, margem/ondas, plantas nas bordas, barras acima da copa e atalhos no viewport pequeno. O terreno continua uma composição ilustrada, com algumas camadas e respostas locais: rochas e árvores inteiras não são objetos 3D nem toda a pintura reage. Sem destruição, coleta ambiental nova ou mudança de colisão/gameplay. Nomes podem se aproximar quando inimigos se agrupam; avaliar a leitura em combate no celular real. Emoji e desempenho variam por dispositivo. Testes touch/WebKit/gamepad são emulados, não dispositivos físicos.

Os saves reais permanecem isolados pela entrada reservada. O ambiente ainda não foi migrado para os mapas da campanha. **Aguardar avaliação do usuário desta revisão antes da próxima etapa.**
