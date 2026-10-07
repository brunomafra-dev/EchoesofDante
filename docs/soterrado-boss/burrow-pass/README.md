# O Soterrado — escavação e emersão · 0.1.61

## O que o jogador vê

Na apresentação, a areia cede e uma abertura escura aparece antes da criatura. O corpo sobe por trás da borda pintada, com poeira breve, até apoiar as patas no terreno. A anatomia mantém sua escala: a parte enterrada fica oculta, em vez de achatar a imagem.

No ataque de emersão, o Soterrado afunda pelo buraco de entrada. A abertura de saída aparece no ponto já anunciado pelo círculo de perigo; a criatura emerge dali. Os buracos desaparecem após a areia assentar. A marca de perigo permanece legível e o destino continua fixo.

[Vídeo da sequência](qa/burrow-animation.webm) · [Abertura](qa/01-opening.png) · [Emersão inicial](qa/02-emerging.png) · [Saída durante ataque](qa/05-reemerging.png).

## Implementação e assets

- Ilustração original com transparência, fonte de **1280×1280**, gerada durante desenvolvimento; [prompt e origem](illustration-prompt.md). Não há geração em runtime.
- `scripts/prepare-soterrado-burrow.py` recorta/redimensiona a fonte, separa a borda frontal pelo alpha e prepara uma pequena textura de poeira. Requer Pillow já disponível no ambiente de preparação; o jogo não depende de Python.
- Buraco e borda: **512×288** cada, apresentados em aproximadamente **244×136 unidades**. Poeira: **64×64**. Os três PNGs somam **338.958 bytes**, cerca de 331 KiB; [dimensões, bytes e hashes](asset-measurements.json).
- `SoterradoBurrow` reutiliza dois pares de imagens e doze imagens de poeira: **16 objetos fixos**. Posição, escala e opacidade acompanham o relógio existente. Não adiciona Graphics, RenderTextures, emissores, listeners ou tweens.
- A criatura usa sua pose ilustrada de emersão, deslocamento vertical e `Image.setCrop`; a borda frontal encobre o corte. A máscara/crop é visual e não desloca o corpo físico.
- Morte e suspensão limpam buracos, poeira e crop; a reconstrução da cena cria somente um conjunto novo.

## Combate preservado

Introdução de **2,2 s**; aviso de emersão de **1,25 s**; execução de **320 ms**; recuperação de **1,8 s**; dano **26**. A posição fixada, a invulnerabilidade subterrânea, as duas fases, os demais ataques, a recompensa e o respawn não foram alterados. Os buracos não criam obstáculos novos. Controles, áudio, HUD e cenários anteriores permanecem nos sistemas existentes.

## Validação

Typecheck e build passaram. O aviso já conhecido sobre o tamanho do chunk Phaser permanece.

[QA da animação](qa/report.json): Chrome headless com relógio real, capítulos/posições preparados por DEV. Verifica abertura antes do corpo, borda frontal, escala uniforme, crop limpo na recuperação, saída no alvo fixado, seis ativações sem crescimento e limpeza ao morrer. **71 objetos** antes/depois, incluindo os 16 novos objetos reutilizados.

O [QA do encontro](encounter-qa/report.json) passou: quatro ataques, alvo fixado, dano real de Sabre/Carga, Dash, três mortes/respawns, recompensa única e persistência. Contagens ficaram iguais nos três respawns: **71 objetos**, **11 Graphics**, **1 RenderTexture**, **78 texturas no cache** e os mesmos listeners monitorados. A amostra da luta mediu **59,6 FPS médios**, mínimo **58,8**, com **0 tweens**. Touch emulado e gamepad mock passaram; quatro resoluções: 1280×720, 1366×768, 1920×1080 e 844×390. Sem erros de JavaScript ou carregamento registrados.

A [tentativa completa automatizada](playthrough/report.json) derrotou os **850 HP** em **23,4 s**, atravessando as duas fases e terminando com **140 HP**. Utiliza teclado/mouse e lê os avisos existentes, sem editar HP, curar ou dar invulnerabilidade durante a luta. Não representa a dificuldade ou a avaliação perceptual de um jogador humano.

```text
npm run typecheck
npm run build
node scripts/qa-soterrado-burrow.mjs
node scripts/qa-soterrado-boss.mjs http://localhost:5184/ docs/soterrado-boss/burrow-pass/encounter-qa
node scripts/qa-soterrado-playthrough.mjs http://localhost:5184/ docs/soterrado-boss/burrow-pass/playthrough
```

## Limites e playtest

A abertura é um efeito visual temporário; não deforma a malha do terreno nem muda a navegação. A escavação subterrânea não é mostrada como um trajeto completo. A poeira tem quantidade limitada e o buraco é reutilizado, mantendo o custo previsível.

**Automação passou; playtest humano necessário.** As capturas foram inspecionadas visualmente, mas não houve teste físico de iPhone ou gamepad nesta atualização. Para avaliar, acorde o Soterrado numa tentativa nova e observe a apresentação e o ataque de emersão: corpo saindo de dentro da areia, apoio das patas e clareza do círculo de perigo. Se o boss já foi derrotado no seu save, a vitória permanece preservada; o vídeo mostra a sequência sem exigir apagar seu progresso.
