# Expansão perceptível — revisão 02 · 0.1.142

[Bacia do Leito Vivo](https://echosofdante.vercel.app/campaign-playtest.html?route=1&arrival=forest&v=0.1.142) · [Câmara da Condensação](https://echosofdante.vercel.app/campaign-playtest.html?route=1&arrival=cavern&v=0.1.142) · [Jornada completa / coop](https://echosofdante.vercel.app/campaign-playtest.html?route=1&v=0.1.142)

## Por que revisar

O usuário explorou a 0.1.141, mas não percebeu diferença suficiente. Os desvios existiam tecnicamente; repetiam o cenário, tinham uma entrada oriental obstruída e o laboratório começava longe deles. Esta revisão corrige a entrega anterior, sem começar outro capítulo. Aprovação técnica não substitui a avaliação visual humana.

## Mudanças

- **Floresta:** pintura contínua da Bacia do Leito Vivo, caminhos terrosos, lagoa rasa e raiz fossilizada dividindo a trilha. Duas rochas deixam de fechar o acesso oriental; árvores aleatórias não ocupam a água. A análise do leito fica na margem, com o mesmo ID e recompensa.
- **Câmaras:** bacia de condensação, raiz mineralizada e conduto ativo têm silhuetas próprias. O piso reutiliza a parte calma da pintura aprovada da entrada, com alpha suave e uma única textura compartilhada. Mantém as três caches estáticas das bordas.
- **Orientação:** pequenas estacas e títulos locais surgem perto dos acessos. Uma descoberta curta identifica cada lugar; não acrescenta caixas permanentes ao HUD, XP ou marcos de campanha.
- **Física:** seis núcleos de colisão acompanham água, raiz e conduto, usando o movimento existente. Caminhos e análises continuam acessíveis; o desmoronamento limita a primeira câmara até ser aberto normalmente.
- **Laboratório:** links individuais entram diretamente na expansão. O endereço explicita a simulação de pré-requisitos; nenhum boss é derrotado. Namespaces temporários separados por trecho, preservação dos saves reais e retomada no checkpoint preparado após reload/respawn. O link sem `arrival` continua começando do zero na base e é o ponto de partida para coop.

As pinturas e limites fazem parte da campanha oficial e dos dois clientes cooperativos. Apenas o posicionamento/preparo imediato depende do laboratório solo. Nenhum protocolo de rede, combate, dano, missão, recibo de recompensa ou requisito de boss foi substituído. O Primeiro Eco, limiar e Warden continuam no trajeto original.

## Arte e orçamento

Dois arquivos originais gerados offline com imagegen, Organic Sci-Fi R3 / referência D. [Prompts integrais](prompts.json). Fontes locais preservadas em `%USERPROFILE%/.codex/generated_images/01a0df0e-3f54-78d2-bf2c-6f7125fee783/`:

| Runtime | Dimensões / bytes | Origem |
|---|---|---|
| `public/assets/visual/early-journey/living-basin-v1.webp` | 1024×1024 RGBA / 654.124 | `exec-3eb87d01-1bee-4010-968a-76122523265d.png` |
| `public/assets/visual/early-journey/cavern-landmarks-v1.webp` | 1536×512 RGBA / 317.082; três células de 512 | `exec-ccb4d6c6-4662-4ff2-8376-37ec0b0c3b94.png` |

Preparação técnica com Pillow: conversão RGBA, redimensionamento Lanczos e WebP qualidade 90. Sem desenho procedural dos assets, imagem externa ou geração no jogo. O piso das câmaras reutiliza `cavern-entry-floor.webp`; estacas reutilizam `material-route`, bordas reutilizam `rock-shelf`, raízes/minerais e toda a vegetação reativa anterior.

Novos raster somam cerca de 949 KiB transferidos e 7 MiB RGBA se as duas regiões forem visitadas. O piso suave compartilhado acrescenta 1,5 MiB. Preload por região; nenhum carregamento dos novos raster em outros biomas. Um piso na Floresta, três pisos e três marcos nas cavernas, poucos textos/estacas e duas ou uma elipses de brilho. Sem novo RenderTexture para esses marcos, sem listener, tween ou crescimento de partículas. As caches de borda existentes permanecem.

## Validação

Resultados e capturas são registrados em [qa](qa/). Os scripts distinguem chegada simulada, posicionamento de teste e comandos reais. Não representam 30 minutos de campanha humana.

- `qa-early-landmarks.mjs`: chegada direta nas duas regiões, passagem oriental com teclado, marcos presentes, análises acessíveis pelo grafo real, bloqueio original e reload com saves protegidos.
- `qa-early-journey-model.mjs`: contorno, trajetórias rápidas, seis núcleos sólidos, checkpoints secos e recibos únicos.
- `qa-early-journey.mjs`: seis análises, inimigos finitos, persistência, recriações, resoluções e FPS.
- Regressão da jornada original e dupla cooperativa com comandos reais e fixtures declaradas.

| Verificação executada | Resultado |
|---|---|
| `npm run typecheck`; `npm run build` | Passaram. Aviso conhecido do tamanho do chunk Phaser permanece. |
| [Chegada e marcos](qa/landmarks.json) | Passou: duas chegadas, caminhada pelo acesso oriental, seis destinos conectados e reload. |
| [Geometria](qa/geometry-model.json) / [missões](qa/model/model.json) | Passaram: 80 trajetórias, seis núcleos sólidos, recibos/IDs e 19 missões preservados. |
| [Expansão](qa/browser.json) | Passou: seis análises com E, XP persistido, quatro recriações por região e 1280×720, 1366×768, 1920×1080, 844×390. |
| [Jornada original](qa/journey/report.json) | Passou: Ecos, mecanismo, cavernas, Primeiro Eco, limiar, Warden e Vale; morte/respawn/reload, touch emulado e gamepad mock. Boss encurtado por fixture declarada. |
| [Cooperativo](qa/coop/report.json) | Passou: dois Chrome independentes, seis análises pelo convidado, viagem, entrega única para ambos e reconexão. |
| [Produção local](qa/compiled/report.json) | Passou em Chrome: links diretos, imagens carregadas, bosses vivos, reload e isolamento sem globals DEV. |

Reprodução da regressão da jornada: `node scripts/qa-dante-journey.mjs "http://localhost:5185/?qa=play" docs/early-journey/revision-02/qa/journey`. O parâmetro `qa=play` inicia a fixture de campanha; abrir somente a raiz deixa a tela de entrada ativa. Os demais scripts usam `QA_BASE`/`QA_OUT`; o ensaio compilado desta revisão usou `QA_BROWSER=chrome`. Capturas foram exportadas tecnicamente para WebP após os testes, sem repintura.

O ensaio de expansão registrou **56,6 FPS na Floresta e 59,4 nas cavernas**, sem outro browser de QA simultâneo nessa amostragem. Quatro recriações mantiveram contagens idênticas: Floresta 433 objetos / 251 texturas / 38 listeners de shutdown / 5 de resize; caverna 157 / 242 / 29 / 5. Não é benchmark em celular físico. As caches estáticas somaram 16.674.564 e 9.788.108 pixels, respectivamente; não houve crescimento por recriação.

| Região | Antes (0.1.141) | Revisão (0.1.142) |
|---|---|---|
| Bacia / leito | [Captura anterior](../qa/exp-forest-2.webp) | [Margem revisada](qa/exp-forest-2.webp) · [Chegada direta](qa/direct-forest.webp) |
| Condensação | [Captura anterior](../qa/exp-cavern-1.webp) | [Chegada direta](qa/direct-cavern.webp) |
| Jardim mineral | [Captura anterior](../qa/exp-cavern-2.webp) | [Marco revisado](qa/chamber-1.webp) |
| Conduto | [Captura anterior](../qa/exp-cavern-3.webp) | [Marco revisado](qa/chamber-2.webp) |

**Limites de avaliação:** duração humana e equipe real de quatro jogadores não foram medidas. O WebKit Windows apresentou encerramentos também no baseline anterior (ver relatório histórico da 0.1.141); não considerar isto aprovação de Safari/iPhone real. A nova composição ainda depende do seu playtest, especialmente escala da lagoa, clareza da bifurcação e combate junto aos marcos. Aguardar essa avaliação antes do capítulo seguinte.
