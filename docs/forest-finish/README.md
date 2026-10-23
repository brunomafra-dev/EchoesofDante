# Clareira da Nascente · referência de acabamento · 0.1.134

> **Referência 0.1.138 aprovada pelo usuário. Aplicação: [0.1.139 — acabamento da campanha](../world-finish/README.md).** O usuário autorizou terreno, composição, profundidade e reações naturais em todos os mapas, inclusive a base. Esta clareira continua disponível como referência isolada; o novo laboratório visita as regiões reais com seus limites e bosses.

> **Registro anterior: [0.1.135 — terreno físico e Hollow completo](revision-02/README.md).** O usuário aprovou o acabamento ambiental da 0.1.134 e pediu corrigir passagens sobre árvores/rochas e elevar a criatura ao novo contexto. O restante deste documento registra a primeira entrega; links com versão antiga abrem a build mais recente. O feedback da 0.1.135 originou a revisão 03 acima.

[Abrir referência jogável](https://echosofdante.vercel.app/forest-finish.html?v=0.1.134) · [Visual atual](https://echosofdante.vercel.app/forest-finish.html?mode=current&v=0.1.134) · [Biblioteca](https://echosofdante.vercel.app/test-library.html)

## Escopo e aprovação

Em 23/10/2026, o usuário considerou o visual fraco e autorizou produzir um trecho pequeno da Floresta com acabamento maior antes de continuar expandindo. A proposta preserva Organic Sci-Fi R3 / direção D. **É uma referência jogável isolada, ainda aguardando aprovação humana.** Não substitui os mapas da campanha, não confirma a validação das expedições regionais e não inicia outro capítulo.

## Como comparar

Use **Novo acabamento / Visual atual**. A troca reinicia o encontro; não é um comparativo do mesmo frame. Ambos usam as classes atuais, os mesmos kits reais, os mesmos três Hollows, HP/dano/recargas existentes e os mesmos limites gerais. A composição e os obstáculos internos acompanham o terreno de cada versão: o atual usa Arena/Floresta, a proposta tem margens de nascente e raízes próprias.

WASD/mouse, ataque, Dash e Q são os controles existentes. **↻** reinicia. Em **Opções**, compare as quatro classes, duas apresentações e roupa inicial/carapaças básica/avançada. As opções pausam a luta e cancelam carregamentos pelo caminho existente. No gamepad, Start abre as opções e B fecha. Touch usa os dois analógicos/ações atuais. B/Registros e I/Mochila continuam disponíveis pelos atalhos existentes; o atlas não pode transportar a referência para a campanha.

O laboratório intercepta os namespaces `echoes-of-dante.*` em sessionStorage próprio antes de importar os perfis; não lê nem grava personagens, configurações ou jornadas reais. Perfil temporário por classe/apresentação/kit. Não há hospedagem de sala nesta câmara; o cooperativo da campanha não mudou.

## Diferença visual

- Terreno contínuo de 2200×1500 unidades, pintado como uma composição única: trilha curva, bifurcação, nascente abaixo da margem, raízes e pedra conectadas ao solo. Sem mosaico de manchas geométricas ou muralha de pedras repetidas.
- Luz filtrada pela copa, sombra fria nas bordas e luz mais quente na trilha. A pintura já contém iluminação/contato dos bancos estáticos; o personagem recebe tonalidade sutil em função da posição, preservando o flash de dano.
- Três copas com transparência real em primeiro plano, balanço muito pequeno e redução de opacidade por proximidade para não esconder o personagem. Não acrescentam colliders invisíveis.
- Reflexo discreto na água, 16 pequenos pontos de pólen e sombra suave adicional junto aos pés. Quantidades fixas; nenhuma geração de arte ou crescimento de partículas em runtime.
- HUD local com metal fosco, tipografia compacta e contraste controlado; informações de vida/XP/recargas usam os componentes e estados reais. Cabeçalho e comparação ficam nas bordas; avisos de viagem/campanha não aparecem nessa câmara.

## Arte e origem

Duas imagens originais produzidas com a ferramenta **imagegen integrada**, offline. Prompts: [art-prompts.md](art-prompts.md). Runtime:

| Arquivo | Dimensões | Tamanho | Função |
|---|---|---:|---|
| `public/assets/experiments/forest-finish/clearing-v1.webp` | 1536×1024 RGB | 817.202 bytes | Terreno contínuo |
| `public/assets/experiments/forest-finish/canopy-v1.webp` | 1536×1024 RGBA | 496.672 bytes | Copa com alpha real |

WebP preparado offline, qualidade 93/91. Os PNGs originais permanecem na pasta padrão de imagens geradas; os arquivos finais usados pelo jogo estão no repositório. Duas texturas de aproximadamente 6 MiB RGBA cada: cerca de 12 MiB de memória de imagem sem considerar mipmaps/overhead. Uma sombra de 96×96 é criada uma vez com gradiente de canvas; sem renderização neural ou modelo de IA em runtime. Arte de personagens, equipamentos, Hollows, VFX e música existentes foi reutilizada.

## Arquitetura e limites

Entrada própria `forest-finish.html`, modo explícito de `GameScene` e `ForestFinishArea`. A campanha não carrega as duas novas imagens. O modo atual usa o renderizador real Arena. O renderizador da proposta atualiza apenas três copas, 16 pontos, três reflexos e a sombra/tonalidade do personagem; o cenário estático é uma imagem.

A direção da luz da pintura é fixa; não é um motor de sombras dinâmicas. Os bancos/rochas/raízes do chão são pré-pintados e seus volumes não são objetos 3D. Colliders simples impedem atravessar as massas altas; a copa é uma camada separada. A arte dos personagens e as animações não foram refeitas nesta entrega. A qualidade deles deve ser avaliada no novo contexto, principalmente nitidez relativa, escala, telegraphs e contraste dos poderes.

Essa composição não é um sistema para preencher todo o mundo automaticamente. Uma eventual aplicação aos mapas exige composições próprias, divisão de terreno, limites/oclusão e validação por região, após aprovação desta referência. Não prometer equivalência a jogos comerciais nem aprovar o resultado só por teste automatizado.

## Verificações

Scripts: `qa-forest-finish.mjs` e `qa-forest-finish-inputs.mjs`; `QA_BASE`/`QA_OUT` selecionam servidor e pasta.

- [QA da referência](qa/report.json): quatro classes × duas apresentações, roupa inicial/básica, oito direções durante movimento, Q, dano real do sabre, margens/corredor, pausa, comparação, morte/respawn, isolamento de saves e layouts 1280×720, 1366×768, 1920×1080 e 844×390.
- [Entradas](qa/inputs.json): movimento e mira independentes por CDP multitouch, carga visível, opções pausadas, gamepad mock Start/B e WebKit emulado. Não houve teste em dispositivos físicos.
- Três reinícios adicionais mantiveram contagens de objetos, texturas e listeners. A amostra aquecida da referência ficou em **59,9 FPS** no Chrome desktop deste ambiente; não é garantia para todo celular.

`npm run typecheck` e `npm run build` passaram; permanece o aviso conhecido de tamanho do chunk Phaser. [Build compilada](qa/compiled/report.json): navegação real, troca de classe/apresentação/kit avançado e comparação/reinício, sem globals DEV ou alteração de saves reais. [Regressão da campanha](qa/campaign/report.json): Floresta → Ecos → mecanismo → cavernas → Primeiro Eco → Warden → Vale, combate/recompensa, pausas, morte/respawn, reload e gamepad mock passaram; sem erro JS. Essa regressão usa posicionamento DEV explícito, não uma campanha humana caminhando.

Revisão crítica: o terreno tem material e composição mais contínuos, mas os personagens mantêm a arte existente e podem pedir outro ajuste de nitidez/escala após o playtest. O HUD é uma proposta local; não foi migrado para todos os menus. Bancos pré-pintados e limites simples merecem revisão humana nas bordas. A tonalidade e a transparência da copa variam suavemente, e a animação ambiental respeita a preferência inicial de movimento reduzido. Publicação e QA público são registrados após o deploy. Aprovação técnica e aprovação visual humana são separadas.

## Publicação confirmada · 23/10/2026

Implementação `a43ca4a`, versão 0.1.134, enviada a origin/main. GitHub confirmou a publicação da Vercel. [QA público](qa/public/report.json) passou contra `https://echosofdante.vercel.app`: carregamento sem globals DEV, entrada/movimento/ataque/Q, troca de classe/apresentação/kit avançado, comparação e reinício por navegação real. Nenhum erro JS/asset ausente; sentinel dos saves reais preservado. As capturas públicas acompanham o relatório.

**Entrega técnica concluída; aguardar a avaliação visual humana caminhando e lutando.** O novo acabamento está somente neste laboratório. Protocolo do cooperativo permanece 15; nenhum servidor/modelo de geração foi acrescentado à hospedagem.
