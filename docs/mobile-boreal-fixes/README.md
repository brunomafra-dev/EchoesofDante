# Galerias, gênero e mobile · 0.1.177

## Solicitação e escopo

Em 31/10/2026 o usuário informou que acionou o Render da 0.1.176, criticou a poça/vegetação sem contexto nas Galerias e pediu “Gênero” aplicado a todas as prévias da criação. Relatou saída/erro que sugeria recarregar ou entrar anonimamente em Chrome no iPhone 13, e faixa cinza na horizontal também no iPhone 13 Pro da esposa. A mensagem aproximada não corresponde aos textos de erro do jogo; não há log do aparelho que confirme a causa da queda. Autorizou continuar esta manutenção, sem novo capítulo.

## Correções

- **Galerias:** o objeto genérico de água da floresta sai das duas análises. A primeira mostra uma fissura baixa com água aflorando sob gelo fino, poça rasa e escoamento na direção do canal real. O ponto de análise fica na faixa seca a oeste. A terceira usa a margem do canal existente e marcas rasas, sem duplicar outra poça. Texto da descoberta acompanha a origem/saída observável e não declara a água potável. Raízes e plantas verdes não são estampadas nas Galerias. IDs/coordenadas das três análises, recibo regional de 85 e capítulo de 200 créditos mantidos; nenhum save pede refazer análise antiga. Pintura/enquadramento −300/2300 e mapa físico 3100×1800 preservados.
- **Gênero:** as quatro prévias usam a mesma escolha, inclusive antes de selecionar uma classe, ao mudar de classe e ao voltar da dificuldade. Mudanças rápidas se agrupam num frame e só substituem apresentações que precisam mudar; continua uma demonstração ativa por vez. Título “Gênero”, botão “GÊNERO”, Masculino/Feminino. A identidade criada recebe essa escolha; personagens salvos e aliados não são reescritos. Controles compactos para 568×320 mantêm os botões essenciais visíveis.
- **Faixa na base:** reproduzida em 915×412 e ao girar a tela. A vista larga ultrapassava a pintura de 1400 unidades; o acabamento externo usava coordenadas locais onde o compositor esperava coordenadas de mundo, deixando a faixa de fundo exposta. A borda agora continua na floresta que circunda a base, usando arte aprovada, com transição apenas fora do limite caminhável x=1330. Coordenadas do acabamento corrigidas e pool temporário de imagens destruído após bake. Limites/colisores/arte interna da base preservados; sem zoom ou rotação CSS que altere mira/toque.
- **Carregamento/memória:** menu normal e laboratório de revisão não criam a cena do mundo nem baixam suas texturas enquanto exibem as quatro prévias. A navegação explícita para jogar carrega o mundo depois de liberar a tela de criação, preservando a abertura e o progresso. As sete folhas grandes dos bosses somam [37 MiB em RGBA](qa/boss-sheet-sizes.json), além de outras texturas: agora só ficam carregadas na arena correspondente e são removidas ao sair. Isso não é a RAM total, não mede o pico real do iPhone e não prova a causa da queda reportada. Nenhum dado/cache/save do jogador é apagado.

Protocolo 16 e catálogos mantidos. A revisão do cliente não exige novo deploy do Render. O Render está em `42de5a0bbd951f32efdcb8480080b3e3db32ea41`, protocolo 16 / `icecave:1`; a dupla pública da 0.1.176 passou antes desta alteração do cliente.

## Laboratórios

[Gênero e mobile](https://echosofdante.vercel.app/campaign-playtest.html?mobile-review=1&v=0.1.177): namespace temporário `dante-mobile-review-v1.`, começa do zero no menu. **Nenhuma missão, vitória, recompensa ou pré-requisito simulado.** Crie solo ou coop e compartilhe o convite desse laboratório. Fechar a aba descarta apenas o teste; saves/settings reais protegidos.

[Fissura](https://echosofdante.vercel.app/campaign-playtest.html?boreal=1&arrival=icecave&focus=thaw&v=0.1.177): namespace Boreal isolado. Simula Warden/Soterrado e acessos anteriores às Galerias; relatórios regionais aceitos, análises/mecanismo ainda pendentes. Só neste foco visual, moradores comuns das Galerias são considerados afastados, sem XP/drop. Vésper/Incandescente vivos, nenhuma vitória deles ou recompensa nova simulada. Chegada na faixa seca ao lado do afloramento; campanha normal mantém os encontros. Ambos registrados na biblioteca.

## Arte

Skill imagegen, **ferramenta integrada**, uma geração nova RGBA, Organic Sci-Fi R3. [Prompt completo](source/prompts.json), [fonte preservada](source/melt-pocket-generated.png), origem `C:\Users\1\.codex\generated_images\01a173c1-3677-75b2-89b6-2f3640ffad61\exec-21fd528e-d172-44f9-90ab-f6ed302362c0.png`. Fissura/água rasa/gelo fino/saída visível, sem vegetação, fundo, UI ou parede alta.

`python scripts/prepare-boreal-details.py` apenas recorta pelo alpha, reduz e adiciona margem transparente. Destino `public/assets/boreal-details/melt-pocket-v1.png`; [hash/limites alpha](source/asset.json). Sem API/CLI externa, pintura procedural de objeto ou substituição da pintura principal.

## QA técnico / limites

- [x] [Baseline da faixa](qa/baseline/report.json) e capturas antes da correção, com cópia do save 0.1.176 e Chrome mobile emulado. A captura reproduz o defeito na horizontal; o erro físico de saída não foi reproduzido nessa amostra.
- [x] Menu/gênero, perfil persistente após fechar/reabrir Chrome, saves/recibos/descoberta, fullscreen negado, seis layouts, fissura/E e dupla mobile real contra relay 16; capturas inspecionadas. [Relatórios](qa/report.json) e [dupla](qa/coop/report.json).
- [x] Carregamento lento intencional em solo/coop e quatro arenas de boss: filme disponível durante download, início automático da sala ao liberar a cena, textura carregada apenas na arena e restaurada viva ao retornar. [Carregamento](qa/loading/report.json), [arenas](qa/boss-residency/report.json).
- [x] Regressão integral solo e em dupla das Galerias: E/análises, colisões/11 aproximações, 5 trechos físicos, degelo, morte/R/reload, dois retornos coop, mecanismo original, Ivo/200 créditos e Vésper vivo. [Solo](qa/gallery-solo/report.json), [coop](qa/gallery-coop/coop.json).
- [x] Typecheck, build de 270 módulos e compilado sem globais DEV; menu/gênero, save antigo, descoberta/reload e captura final da fissura inspecionados. [Compilado](qa/compiled/report.json). O build conserva o aviso existente de chunks grandes.
- [ ] `git diff --check`, commit/push/sincronização, Vercel/hashes e QA público da 0.1.177.
- [ ] Commit/push/sincronização exata, Vercel/hashes e QA público; conferência do Render já acionado.
- [ ] Aprovação humana da fissura e reteste em Chrome nos iPhones 13/13 Pro fora do modo anônimo. Emulação/perfil persistente não confirmam aparelho físico nem eliminam toda causa da queda relatada. Não iniciar capítulo seguinte antes dessa avaliação.
