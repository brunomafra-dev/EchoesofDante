# Evolução integrada de monstros e armas · 0.1.188 local

**Revisão posterior:** o playtest apontou empunhaduras inadequadas e rejeitou o foco de mão Astral. [Correção 0.1.189: pegadas e manopla](GRIPS.md). Este documento registra a entrega anterior; seus checks de distância ao punho não substituem a avaliação visual de dedos segurando o cabo.

Autorização de 04/11/2026: inspecionar, implementar e validar a aranha Hollow, os quatro instrumentos existentes, efeitos e oficina; **sem push, deploy ou compra**. Esta instrução prevalece sobre o fluxo histórico de publicação. Não ampliar mundo, engine, personagens, progressão ou coop 3D. Base inicial `2ef0691`, árvore limpa.

## Inventário e integração

Three.js 0.187, TypeScript e Vite no ensaio; campanha Phaser preservada. Quatro classes reais: Guerreiro Galáctico (`warrior`), Caçador Estelar (`hunter`), Manipulador Astral (`astral`) e Domador de Feras (`xenobinder`). Uma arma por classe utilizável, sem inventário de variantes. Editor, oficina e mundo usam `Avatar.create`; dois rigs humanos completos masculino/feminino, cabelos/cores e barba já existentes. NPCs usam o mesmo Avatar com ferramentas de profissão separadas, preservadas.

| Classe | Equipamento anterior | Revisão atual |
|---|---|---|
| Guerreiro | Espada metálica com canal luminoso | Energy saber com empunhadura, emissor compacto, lâmina volumétrica, núcleo e bordas contidas; rastro acompanha base/ponta reais |
| Caçador | Rifle, sem arco | Receiver/capa integrados, empunhadura e guarda, coronha, dissipação e boca identificável; orientação por nó de correção e apoio esquerdo no disparo |
| Astral | Foco de mão com gimbal/orbe | Berço curvo e núcleo contido; cor do núcleo acompanha os quatro elementos existentes, emissão no foco |
| Domador | Bastão/instrumento de vínculo | Ressonador de campo com semente bioelétrica e garfos protetores; linguagem própria, emissão de vínculo |

`Identity.ts` carrega/cacha o GLB original e o novo de armas. Os anteriores ficam em `previous-weapon-*`; novos usam os nomes compartilhados `weapon-*`. Nós `emitter`, `support`, `blade-base` e `blade-tip` ficam no recurso e são consultados pelo Avatar. Geometria/material compartilhados; apenas material energético por personagem é clonado para cor dinâmica, com descarte próprio. Não se reestrutura o rig completo. Fonte editável reproduzível: `scripts/asset-tools/author-arrival188.py`; `.blend` gerado e intermediários em `.local/combat188/`, ignorados. Não há render offline: modelagem/exportação de malha, chanfros discretos, normais e cores de vértice.

## Hollow e licença

Download feito pelo botão da [página oficial Easyforge](https://easyforge.itch.io/giant-monster-spiders-free-sample), sem conta ou pagamento. ZIP `giant-monster-spiders-free-sample-sample.zip`, SHA256 `f4d9b914683561a0423a60425e881f1c58e55a062d85808ad4d78271017f3628`. Conteúdo inspecionado, não presumido: `squinty_LOD1.glb`, **3.826 triângulos**, **107 joints**, **um material**, 24 animações; quatro mapas de 2048. GLB fonte 9.408.128 bytes.

Licença incluída **Giant Monster Spiders Asset Licence 1.0**, Easy Forge, 2026: permite usar/modificar e incorporar em projetos; proíbe compartilhar/republicar os arquivos como assets separados e pede medidas razoáveis em projeto aberto. Originais, ZIP, FBX e GLB derivados permanecem ignorados, fora de `public/` e do Git. Plugin `scripts/arrival-hollow-plugin.ts` incorpora o payload no módulo compilado do jogo, sem URL GLB, exportador ou botão de download. Isso é empacotamento, não DRM ou garantia de impossibilidade de extração. Nenhuma fonte do pacote deve ser adicionada ao repositório público. Créditos identificam autor/origem/modificações; o asset continua sob sua licença própria.

Preparação local em `stage-arrival188-spider.py` e `prepare-arrival188-spider.mjs`: confere o ZIP; mantém Idle, Walk, Run, Attack, Bite, Hit e Death; remove translação XZ do osso Body e preserva articulação vertical; reduz mapas a 1024 WebP e emissão a 0,25. Visual recebe tint conservador de material, sem eliminar texturas. Escala visual 0,44, eixo frontal +Z, pés próximos de Y=0. **IA, 68 HP, dano 14, preparação 0,33 s, cooldown, velocidade 2,875, raio físico 0,45/hit de projétil 0,6 e IDs 0–7 permanecem.** Não deriva hitbox da malha e não adiciona luz por inimigo. Envergadura visual em repouso ~2,12 m; pernas finas estendem além do corpo e do volume de acerto existente.

Bite é o ataque visual: amostra dos ossos da presa localizou avanço em ~0,36 s, sincronizado à janela original de 0,33 s por escala de tempo ~1,09. Recuperação pode continuar visualmente; só `Combat` aplica dano. Hit recebe contador visual do evento confirmado; morte tem prioridade e segura a última pose, inclusive reload. Walk/Run usam distância percorrida e mixers/esqueletos independentes; nenhum clip reinicia por frame. DeathHeadshot, saltos e escaladas não são apresentados como mecânicas do Hollow. Sem payload/erro de leitura, antlion Flare continua funcionando e a oficina informa explicitamente o fallback.

## Efeitos e oficina

Rastro de lâmina usa buffer limitado a 16 segmentos, material compartilhado e transformações reais; limpa em pausa, saída, troca, salto e esquiva, descarta amostras após 0,11 s e rejeita saltos espaciais. Onda de poder continua um efeito separado. Disparo/feixe usam emissor real. Focos têm pulso curto de canalização; impactos de inimigo só vêm de hits confirmados, com cores por classe/elemento. Sem novo áudio, bloom obrigatório, luz dinâmica, hitstop ou alteração de cadência/dano. Buffer existente de partículas limitado a 192.

Oficina reaproveitada: Hollow atual/antigo; quatro armas atuais/anteriores nos dois gêneros; ataque, corrida, esquiva e salto, além dos movimentos reais de cada criatura. Mesma luz/câmera/escala para comparação, órbita/zoom existentes. Falha mantém ação desativada; modelo substituto identificado. Diagnósticos somente via `?inspect=1`, como antes. Mais campos usam rolagem interna para preservar a área do modelo.

## Revisão local e reprodução

- [Oficina](http://127.0.0.1:5185/arrival-workshop.html?v=0.1.188&subject=hollow).
- [Trecho jogável](http://127.0.0.1:5185/arrival-3d.html?v=0.1.188).
- [Biblioteca local](http://127.0.0.1:5185/test-library.html).

Oficina não lê/grava personagens ou progresso. Mundo usa a sessão temporária existente; **nenhum pré-requisito, vitória de boss ou recompensa real é simulado** na entrada normal. Fixtures de QA são declaradas nos relatórios. Campanha real, configuração, terreno, NPCs e recursos de classe preservados.

```powershell
python scripts/asset-tools/stage-arrival188-spider.py
node scripts/asset-tools/prepare-arrival188-spider.mjs
& '<Blender 4.5 LTS>' --background --factory-startup --python scripts/asset-tools/author-arrival188.py
node scripts/asset-tools/prepare-arrival188-weapons.mjs
npm run typecheck
npm run build
```

Em outro checkout, obter o ZIP oficial e colocar em `.local/combat188/giant-monster-spiders-free-sample-sample.zip`, executar stage/preparação e reiniciar Vite. Sem esse arquivo/preparação, o build usa o Hollow anterior de forma funcional. Não copiar o ZIP/GLB para `public/` ou versionar os originais. Dependências de autoria já existentes em `scripts/asset-tools/`.

## Evidências e limites

- [x] Typecheck/build e preservação dos arquivos da campanha.
- [x] Hollow: poses, solo, oito skeletons, ataque/hit/death/reload e fallback.
- [x] Armas: quatro classes, dois gêneros, A/B, empunhadura, ações e emissores.
- [x] Controles existentes, percurso/save, oficina/layouts e efeitos/limpeza.
- [x] Capturas inspecionadas e desempenho medido separadamente.
- [ ] Aprovação estética humana e teste em iPhone físico.

QA técnico não representa aprovação humana. Sem publicação; links públicos continuam na 0.1.187 até autorização futura. Evidências locais em `qa/0.1.188/`.

### Resultado técnico local

Typecheck e build finais passaram (307 módulos). Onze relatórios compilados passaram. Após normalizar os nomes de emissor que GLTFLoader torna únicos e liberar bone textures dos Avatars removidos, repetidos classes/input/elementos/oficina/visual/desempenho/assets no compilado final. Percurso/NPCs/saves, crew e identidade anterior haviam passado com física/animadores humanos/terreno iguais. `visual/report.json` exige um emissor real por arma atual e recurso limitado após doze trocas extras. Primeiro limite de morte era estrito também para o antlion antigo; preservado em observations/legacy-death-threshold, teste separa queda antiga e pés da aranha nova.

- base: 38.4–39.2 FPS; 149 chamadas, 308851 triângulos renderizados; ANGLE (Intel, Intel(R) UHD Graphics (0x00004E61) Direct3D11 vs_5_0 ps_5_0, D3D11)
- forest: 55.0–56.0 FPS; 62 chamadas, 297859 triângulos renderizados; ANGLE (Intel, Intel(R) UHD Graphics (0x00004E61) Direct3D11 vs_5_0 ps_5_0, D3D11)

Amostras aquecidas em Chrome/ANGLE a 1440×900/DPR1, três janelas de dois segundos por cena, sem build/Blender/outro navegador de QA em paralelo. Floresta com oito aranhas vivas animadas e sem ataque do herói; base com os cinco NPCs e seus postos. Não mede combate contínuo, notebook do usuário ou celular físico. Comparação de método anterior 0.1.187 na floresta: ~57,5–58 FPS, sem equivalência a benchmark controlado de hardware alheio.

Aranha incorporada: 4,346,140 bytes antes de base64/compactação HTTP, um material, 107 ossos, quatro mapas 1024 compartilhados (estimativa RGBA8+mipmaps ~21,3 MiB, não medição do driver). Embrulho JS aumenta bytes sem compressão; original/derivado não têm URL GLB pública. Armas próprias somam 346,104 bytes, três materiais por modelo.

| Modelo | Triângulos | Materiais |
|---|---:|---:|
| weapon-warrior | 2640 | 3 |
| weapon-hunter | 3076 | 3 |
| weapon-astral | 2676 | 3 |
| weapon-xenobinder | 2664 | 3 |

Arquivos principais: `Avatar.ts`, `Creatures.ts`, `Combat.ts`, `Effects.ts`, `Identity.ts`, `main.ts`, `workshop.ts/css`, `vite.config.ts`, plugin/módulo virtual, pipelines/QA da 0.1.188, GLB/manifesto autorais de armas, biblioteca, créditos e roadmaps. `World.ts`, humanos GLB, model/layout, campanha e relay sem alteração. Geometria de lâmina sólida; curvas fechadas nas pontas. Capturas A/B nos dois gêneros e nas ações inspecionadas. O antlion antigo mantém a queda original para comparação; pernas finas da aranha vão além do volume de acerto do corpo. Aprovação estética humana/iPhone físico e coop 3D continuam pendentes. Sem push/deploy; original Easyforge ignorado.
