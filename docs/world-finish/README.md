# Acabamento da campanha e atalhos · 0.1.139

[Testar a base](https://echosofdante.vercel.app/world-finish-playtest.html?area=base&v=0.1.139) · [Biblioteca](https://echosofdante.vercel.app/test-library.html) · [Campanha oficial](https://echosofdante.vercel.app/)

O usuário aprovou o movimento natural da 0.1.138 e autorizou explicitamente **acabamento completo + reações naturais em todos os mapas, inclusive a base**. A revisão deixa de ser exclusiva da clareira. Organic Sci-Fi R3 / referência D preservados. Esta autorização permite a aplicação; a avaliação perceptual do resultado completo continua humana.

## O que foi aplicado

| Regiões | Terreno, composição e vida ambiental |
|---|---|
| Base | Pintura contínua própria do acampamento, terra pisada e cobertura baixa conectadas; nave, abrigos, civis, suprimentos e serviços mantidos. Copas, sombras e plantas reativas enquadram as bordas. |
| Floresta | Pintura nova com caminhos orientados pelo layout existente, solo/raízes/folhas integrados, luz agrupada, copas móveis que aliviam a cobertura do jogador. Hollow inteiro violeta aprovado na campanha. |
| Caverna, profundezas, trecho mais fundo | Material mineral contínuo novo sob as formações existentes; musgo/rebordos discretos, corrente de ar fraca e poeira limitada. Mantidos todos os marcos e passagens. |
| Exterior e aproximação | Material de pradaria, folhagem e sombra. A transição da pedra para a vegetação tem uma faixa de alpha composta uma vez, sem corte vertical. |
| Warden | Piso mineral novo, mesmos bancos e construção ancestral; vegetação e partículas restritas às margens, preservando o centro e os telegraphs. |
| Vale, Nascentes e Terraços | Material de pradaria novo, cobertura baixa com contato, copas e sombras suaves. Reflexos pequenos na água das Nascentes. Habitação, colonos e locais de análise preservados. |
| Siroco e Dunas | Solo árido novo, baixo relevo e material conectado; tufos secos próprios. Painéis alinham-se pela coordenada mundial, sem dupla composição no encontro das duas partes do Siroco. |
| Soterrado | Composição original da depressão de areia preservada, com integração tonal e tufos secos; não substituir o buraco por uma clareira. |
| Fratura Boreal, Galeria de Gelo e Ninho | Pinturas contínuas de neve/gelo existentes reutilizadas, integração tonal, plantas baixas próprias com neve e partículas leves de frio. Sem samambaias verdes em todas as regiões. |
| Costa das Cinzas, Obsidiana e Caldeira | Pinturas contínuas de lava/rocha existentes reutilizadas e integradas ao tratamento tonal; vegetação escassa de cinzas, vento/poeira discretos. Lava e silhuetas importantes preservadas. |

São **16 regiões reais**, incluindo os trechos internos da caverna que compartilham a mesma cena. Não são 16 imagens novas: cinco pinturas de terreno e um atlas novo, combinados com os mapas e estruturas existentes. Planos minerais extensos usam painéis de escala consistente, com bordas correspondentes e variação espelhada; não esticam uma pedra para a largura inteira da caverna. As pinturas de neve e lava já contínuas foram conservadas.

### Reações naturais

Folhas e copas têm vento suave. As plantas baixas cedem quando os pés do jogador, aliados ou criaturas passam perto; a raiz fica fixa e o retorno é amortecido. Folhas pequenas aparecem apenas ao roçar vegetação verde, não a cada passo num corredor limpo. Não há E, clique, objetivo ou recompensa para acionar esses efeitos. Rochas, cristais e estruturas rígidas não balançam como plantas.

O tratamento usa as posições visuais locais de cada navegador. O anfitrião continua sendo a única simulação de combate; no convidado, os aliados e criaturas representados pelos snapshots também provocam contato. O Hollow aprovado usa a mesma figura completa e os mesmos seis frames no anfitrião e nos layers do convidado. **Protocolo 15 preservado; nenhum evento de gameplay novo.**

### Atalhos ao lado dos ícones

Teclado: **🎒 I · 🧪 H · 🌐 M · 📖 B · ☰ Esc · 💬 Enter**. Letras pequenas, sem caixas adicionais. Os botões mantêm nomes acessíveis, foco e `aria-keyshortcuts`. Não há tecla inventada no histórico ou no recolhimento do radar. Touch e gamepad escondem as letras de teclado ao usar seus controles; os ícones continuam clicáveis.

## Preservação da campanha

Não foram alterados colliders, limites, câmera global, controles, IA, HP, dano, XP, drops, missões ou gatilhos dos bosses. O QA compara numericamente **cada obstáculo e limite** com o renderizador anterior nas 16 regiões. O novo chão é material baixo e caminhável; árvores/rochas/estruturas que bloqueiam passagem continuam sendo os objetos existentes com suas bases físicas.

O laboratório reservado simula as passagens da caverna abertas e mantém os quatro bosses vivos. A preparação de nível/equipamento vale apenas para esse teste; os pontos existentes são distribuídos para não abrir o diálogo de aperfeiçoamento ao carregar uma região. O jogo oficial não recebe esse progresso. Não há acesso de viagem do laboratório para saves reais.

## Arte e implementação

- [Seis assets e medidas](assets.json), total **4.162.804 bytes** em WebP; cinco pisos RGB e um atlas RGBA de 512×512. [Prompts completos e fontes](art-prompts.md). Geração offline com imagegen integrada; nenhuma geração neural em runtime ou imagem externa.
- Reutilizados: copa/plantas/Hollow da referência aprovada, árvores, minerais, sombras, rochas, marcos, terrenos de neve/lava/areia do boss e toda a arte de personagens/NPCs.
- `CampaignEnvironment.ts` compõe os pisos e mantém grupos limitados: até 36 plantas baixas, seis folhas, oito partículas de ar e até três reflexos de água. Só alguns ramos adicionais nas regiões verdes. Posições anteriores retêm apenas atores vivos do frame.
- A composição estática e os RenderTextures existentes continuam. Não há centenas de Graphics novos redesenhados por frame, física de folhas, luz dinâmica por objeto ou partículas acumuladas.
- Uma textura de transição do exterior é composta uma vez e reutilizada; sem máscara processada a cada frame. As cinco pinturas somam aproximadamente 30 MiB RGBA; atlas regional, 1 MiB. Recursos reutilizados e a transição adicionam custo separado. Pisos são carregados por região e ficam em cache para as viagens; o conjunto é finito.
- Movimento reduzido mantém cenários/colisões e congela vento/partículas. A movimentação não muda os volumes físicos.

## Verificação técnica

- `npm run typecheck` e `npm run build` passaram. Aviso conhecido do tamanho do chunk Phaser permanece.
- [16 regiões e comparação física](qa/world.json): terrenos, vegetação limitada, bosses vivos, limites/obstáculos idênticos ao anterior, teclas I/M/B/H, raiz fixa, retorno amortecido, quatro reconstruções e saves isolados. Inclui captura dos trechos fundo/exterior/aproximação da caverna. A amostra curta de FPS durante carregamento não representa medição aquecida.
- [Regressão da campanha](qa/campaign/report.json): Floresta → Ecos → mecanismo → cavernas → Primeiro Eco → Warden → Vale, morte/respawn, recompensa, reload, registros, touch e gamepad mock passaram. **57,7 FPS** na amostra aquecida desse teste. Posicionamento e relógios DEV estão explicitados.
- [Cooperativo local](qa/coop/coop.json): oito inimigos saudáveis com nome/HP em ambos os navegadores, Hollow completo recebido e contato de criaturas remotas com a vegetação. Sem erro JS.
- [Entradas](qa/inputs/report.json): multitouch independente em oito direções, carga de Q, mochila/atlas por toque, troca de região, gamepad mock Start/B e WebKit móvel com Astral feminina na região vulcânica. Sem teste em aparelho físico.
- Layouts 1280×720, 1366×768, 1920×1080 e 844×390. Screenshots JPEG são evidências de QA; assets do jogo continuam WebP.

- [Medição dedicada](qa/performance.json), com uma página por vez, oito segundos de aquecimento e cinco segundos sem screenshots: base **58,8**, floresta **58,4**, caverna **58,5**, Siroco **59,1**, Fratura Boreal **58,9** e Costa das Cinzas **59,0 FPS**. Contagem real de eventos UPDATE: **59,9–60,1 por segundo**, sem cena pausada.
- [Viagens no mesmo jogo](qa/travel.json): 48 reconstruções em três ciclos pelas 16 regiões; primeiro ciclo aquece o cache finito, os dois seguintes mantêm objetos, texturas, tweens e listeners iguais para cada região. Não é uma campanha humana caminhando; o teste declara a troca de área DEV.

- [Build compilada](qa/compiled/report.json): navegação real entre regiões, troca de classe/apresentação/equipamento, atalhos e layouts, sem globals DEV e sem alterar o sentinel dos saves reais.
- [Entrada da campanha compilada](qa/compiled-campaign/report.json): Astral nomeado, abertura MP4 original, dificuldade persistida, entrada no jogo, menu com gamepad e título por toque passaram. Esse teste exclui salas; o cooperativo está no relatório local separado acima.

Publicação será registrada após o deploy. Aprovação técnica não substitui o playtest do usuário.

## Revisão crítica e limites

A revisão visual identificou e corrigiu o encontro reto entre caverna e exterior e o encaixe dos painéis do Siroco. Corrigido também o CSS móvel antigo que zerava a fonte e escondia os pictogramas de poção/atlas/chat. O laboratório foi corrigido para não pausar sob a tela de upgrades. A vegetação desenhada no piso continua parte da pintura; as copas e plantas separadas dão as respostas visíveis. Não há deformação de toda folha pintada, construção de mundo 3D ou destruição.

Os painéis de regiões extensas reutilizam materiais e podem revelar variações espelhadas num exame prolongado. Terrenos de gelo/lava mantêm suas pinturas anteriores e seus marcos, com integração e movimento novos; não são biomas refeitos do zero. Densidade do piso, recortes entre massas antigas e novas e leitura dos agrupamentos de inimigos ainda merecem avaliação humana em movimento, especialmente no celular real.

**Mudança aplicada à campanha; aguardar playtest antes de iniciar outra etapa.**
