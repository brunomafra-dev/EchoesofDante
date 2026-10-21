# Guerreiro — caminhada e transições · 0.1.128

[Masculino, roupa inicial — caso do usuário](https://echosofdante.vercel.app/character-cohesion.html?class=warrior&sex=male&kit=clothes&v=0.1.128) · [Biblioteca](https://echosofdante.vercel.app/test-library.html)

Manutenção autorizada em 21/10/2026. O usuário esclareceu que o defeito ocorreu no Guerreiro masculino com roupa inicial. Não avança missões/mapas/classes. Capturas de quadro estático e typecheck não bastam para aprovar a marcha.

## Causas encontradas

- A fase somava ou subtraía distância conforme o produto entre deslocamento e mira. Girar o cursor mudava o sentido do ciclo sem mudar o movimento físico.
- `renderWeapon()` também amostrava o deslocamento. O redesenho imediato de `beginStrike()` podia ler posição idêntica, marcar parado e trocar a pose por um quadro.
- Dois contatos alternavam diretamente; faltava uma passagem com os pés sob o quadril. As pinturas independentes também tinham proporções diferentes.
- A cabeça de uma pose parada era recortada sobre outros corpos. Isso mascarava os tamanhos inconsistentes e podia separar visualmente cabeça/pescoço.

## Correção

O Guerreiro avança o ciclo pela distância percorrida, sempre no mesmo sentido, inclusive ao recuar ou girar a mira. Só `Player.update()`/`renderRemote()` amostram movimento. `present()` atualiza mira/ataque sem tocar na distância ou decidir novamente se está parado. O ataque usa sua pose durante SWING; preparação/recuperação deixam o deslocamento legível. Dano, alcance, cooldowns, velocidade, Dash, Q e controles preservados.

Um pequeno limiar de troca estabiliza as oito vistas perto da fronteira angular; a mira e os acertos continuam contínuos. Apoio esquerdo → passagem → apoio direito → passagem. Parado usa a postura existente; Q continua interrompendo movimento conforme o kit. Sem bob extra, esticar membros, crossfade de dois corpos ou giro da imagem.

Seis fontes novas de humanos inteiros, geradas offline: duas apresentações e três trajes. Preservei identidade, materiais e sabres existentes. As fontes de proteção derivam da folha de roupa inicial. Algumas saídas tocaram botas/cabeças entre linhas e foram rejeitadas; revisões de espaçamento ficaram com gutters verificados. Não normalizar um corpo cortado para disfarçar o defeito. O NE feminino usa reflexão da figura traseira oposta completa; permanece a limitação de possível troca de mão dominante nesse tipo de espelhamento.

As roupas uniformes mantêm a cabeça original da própria figura, ligada ao pescoço. Capacetes mistos usam a mesma pose, sem buscar a cabeça parada de outra pintura. Materiais de equipamentos continuam preparados no bake, sem membros móveis independentes. [Fontes, recortes, hashes e margens](assets.json), [prompts](prompts.md). Original antigo permanece para auditoria, sem download duplo obrigatório.

## Custo e integração

Warrior passa de 32 para 40 quadros de 192×192, atlases 768×1920. Um Image e um atlas equipado por ator; os oito quadros extras ficam no mesmo atlas. Seis PNGs versionados `*-walk-v2.png` evitam cache das folhas antigas. Loader compartilhado com o seletor. Os 18 PNGs das outras classes permanecem idênticos; não foram trocadas suas poses/locomoção.

As fontes do Guerreiro ocupam ~6,75 MiB RGBA adicionais somando os seis atlases; +1,125 MiB por atlas equipado de um Guerreiro. Sem novos objetos de cena, partículas ou tweens, sem bake por frame. [Bytes e checagem de importação](qa/import.json). Não altera save ou protocolo 14.

## QA

- `prepare-warrior-walk.py`: 144 recortes de figuras completas, margens opacas seguras e registro cabeça/chão; seis atlases. Não divide anatomia.
- `qa-warrior-walk.mjs`: 3.072 frames de simulação, oito vistas, duas apresentações, trajes e peças mistas, paridade local/remota; redraw repetido sem idle, giro sem inversão de fase, parada, fronteira de vista e atlas limpo após trocas. Cabeça permanece conectada através do pescoço ao corpo inferior, inclusive com capacete misto.
- Entradas reais no caso principal: WASD, cursor, básico, Q, Dash; touch emulado/gamepad mock e 1280×720, 1366×768, 1920×1080, 844×390. Saves reais protegidos.
- `qa-complete-actors.mjs`: regressão das quatro classes, duas apresentações e 3.072 combinações de pose/arma/equipamento, seletor e recursos. O critério de cabeça pixel a pixel congelada permanece nas outras classes; o Guerreiro usa conectividade/figuras completas na nova bateria.
- Typecheck/build, seletor compilado, entrada cooperativa e ciclos de morte/respawn aplicáveis. Relatórios em [qa](qa/).

Seletor compilado passou nas quatro classes e duas apresentações. Três ciclos de morte/R/respawn do Guerreiro masculino com roupa inicial mantiveram um atlas e as contagens de recursos. Coop compilado com Hunter anfitrião e Guerreiro convidado passou por criação/reload, movimentação, missão e passagem compartilhada. A amostragem local/remota dos passos usa a mesma implementação. Sem erros JavaScript ou assets nesses fluxos.

[Gravação com teclado/mouse](qa/male-walk-review.mp4) e [quadros da caminhada](qa/walking-sequence.png): laboratório isolado, câmera ampliada a 1,6× somente para inspeção; a câmera do jogo não foi alterada. Revisão visual das fontes, atlases e sequência gravada complementa os asserts. Os PNGs repetidos das classes inalteradas ficam no diretório local de revisão; relatórios e capturas pertinentes estão arquivados aqui.

A bateria focada mediu **54,9 FPS**; a regressão mais pesada **53,5 FPS**, com um atlas equipado e contagens estáveis nas trocas. São amostras locais, não promessa de 60 FPS em todo dispositivo. Inspecionar caminhada real e transições, não só o número de testes.

## Validação humana

Andar continuamente com a roupa inicial masculina, mudar a mira em volta, recuar, atacar, parar/retomar e trocar peças. Conferir também armaduras, feminino e aliado remoto. Há oito vistas discretas e três pinturas de caminhada por vista; não é uma animação esquelética contínua. Sem prometer ausência de qualquer defeito futuro. Esta entrega corrige as causas verificadas e aguarda o playtest do usuário.
