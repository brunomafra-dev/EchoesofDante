# O Soterrado — encontro das Dunas · 0.1.60

## Experiência

Ruínas das Dunas → rastros desiguais e tremor na depressão → **DESCER** → entrada segura da Bacia Soterrada → emersão → luta → passagem exposta → leitura de frio ao norte. A região gelada fica para outra expedição; esta atualização revela uma direção, sem explicar o sinal ou criar um mapa de neve.

A bacia é uma área local separada de 1800×1500, com espaço navegável de aproximadamente 1330×720. Os sete habitantes das Dunas não entram nela. A música, o piso e a criatura usam assets preparados offline. Câmera, kit do jogador, controles e inimigos anteriores são preservados.

## Criatura e leitura

Escavador de seis patas, duas extremidades em pá de tamanhos diferentes, carapaça ocre mineralizada, articulações orgânicas e pequenas fissuras violetas. Oito poses ilustradas com apoio comum. Não gira a imagem para mirar; alterna passos conforme deslocamento, postura de aviso, ataque, emersão, fase e colapso. Não é um Hollow ampliado.

Entrar não começa um ataque: a criatura emerge durante 2,2 segundos ao avançar além da faixa inicial. Nome e barra aparecem. As marcas combinam preenchimento, contorno, direção/setas, cruzes e ordem de execução; não dependem somente de cor.

## Combate

850 HP; corpo físico de raio 60; imagem em célula de 265 unidades. Persegue a 85 unidades/s e guarda cerca de 130 unidades de distância. Não tem pathfinding, invocações ou projéteis acumulativos.

| Ataque | Aviso | Execução | Recuperação | Dano | Resposta do jogador |
|---|---:|---:|---:|---:|---|
| Varredura | 900 ms | 220 ms | 1150 ms | 18 | Sair do setor e atacar pela lateral |
| Investida | 1150 ms | até 800 ms | 1400 ms | 24 | Sair da linha fixada; percurso limitado a 350 unidades |
| Emersão | 1250 ms | 320 ms | 1800 ms | 26 | Sair do círculo fixado na preparação; não acompanha o jogador |
| Fissuras | 1400 ms | 1000 ms | 1500 ms | 20 | Três marcas numeradas por traços, espaçadas em 300 ms |

Um ataque causa dano no máximo uma vez por ativação, pelo sistema existente, incluindo invulnerabilidade do Dash e intervalo de dano do jogador. A emersão não pode atingir uma base sólida. O boss não recebe golpes durante introdução, mudança de fase ou quando totalmente enterrado; seu corpo deixa de bloquear a passagem enquanto está subterrâneo.

**Fase 1:** varredura, investida, emersão, varredura; quando está longe, substitui varredura por investida. **Fase 2:** abaixo de 48% de HP, pausa de 1,6 segundos e sequência com fissuras. Não interrompe um ataque já anunciado para mudar de fase. Há aberturas para combate corpo a corpo e carga sem exigir uma técnica específica.

## Tentativas, recompensa e continuação

Respawn seguro em (430,790). Morte limpa avisos e reinicia um único boss com HP/fase/padrão restaurados, preservando XP, Ecos, escolhas anteriores e acesso às Dunas. É possível subir antes de acordá-lo; após começar, vencer libera o retorno.

A morte do boss concede **180 XP e um ponto adicional do sistema de aperfeiçoamentos existente**, idempotentes. Pontos normais por nível continuam existindo. O colapso dura 1,9 segundos; a escolha de técnica vem depois, inclusive quando a vitória cruza um nível de domínio. Não existe loot ou habilidade nova. A persistência local anterior aceita os novos campos e mantém escolhas e vitória após reload.

Uma estrutura previamente soterrada acende. Investigá-la registra uma pista curta: **leitura ao norte abaixo de zero**. A origem do sinal permanece desconhecida. Não há portal de neve nesta versão; subir retorna às Dunas, de onde os portais anteriores continuam funcionando.

## Assets, áudio e performance

- [Prompt e origem da arte](illustration-prompt.md): fonte original transparente, preparada por `scripts/prepare-soterrado-art.py`.
- Spritesheet PNG **1536×768**, oito células **384×384**, aproximadamente **1,12 MB**.
- Piso WebP **1024×1024**, aproximadamente **79 KB**, derivado do piso ilustrado das próprias Dunas.
- Formações, raízes e vestígio ancestral reutilizam assets existentes; cenário estático em uma RenderTexture, sem redraw por frame.
- Música original de **126 segundos**, aproximadamente **1,77 MB**, composta offline por `python scripts/compose-region-scores.py soterrado`; pulso grave espaçado e tensão mineral. As nove trilhas regionais anteriores permanecem.
- Áudio usa o AudioManager existente, unlock após gesto, crossfade e SFX ancestrais reutilizados. A vitória interrompe a música do encontro.
- Quatro avisos Graphics reutilizados, sem criação por ataque; uma animação finita de colapso e uma revelação curta. Física: quatro formações periféricas e a base do vestígio, sem colisão pixel-perfect.

[Medições dos assets](asset-measurements.json) · [Medições musicais](audio-measurements.json).

## Validação e limites

QA específico em `scripts/qa-soterrado-boss.mjs`: entrada/retorno, quatro padrões, alvo fixo da emersão, Dash, dano real de Sabre/Carga, duas fases, três mortes/respawns, recompensa única, escolha por nível e boss, pista/reload, estabilidade e quatro resoluções. Setup DEV encurta capítulos e seleciona padrões/HP final; não representa uma vitória completa de balanceamento.

Uma [tentativa completa automatizada](playthrough/report.json) derrotou os 850 HP em 23,8 segundos, sem editar HP, curar, acelerar relógios ou dar invulnerabilidade durante a luta. O bot leu as marcas e usou teclado/mouse reais; terminou com 140 HP, atravessando as duas fases. Isso demonstra a viabilidade das janelas, sem medir a dificuldade humana.

[QA do encontro](qa/report.json): passou nas quatro resoluções (1280×720, 1366×768, 1920×1080, 844×390), com aproximadamente **59,7 FPS**, **55 objetos estáveis**, **1 RenderTexture** e **0 tweens** na amostra assentada da luta. Três respawns mantiveram 55 objetos e os mesmos dois listeners monitorados. A regressão das Dunas mediu **55,6 FPS** de média, com 105 objetos estáveis entre reconstruções. São amostras de Chrome headless, sem garantia de FPS no celular.

Regressões de [jornada](regression-journey/report.json), [Warden](regression-warden/qa-report.json) e [Dunas/música](regression-dunes/report.json) são executadas separadamente. Typecheck e build passaram; permanece o aviso conhecido de tamanho do chunk Phaser. Chrome headless, touch emulado e gamepad mock não são teste físico. **Playtest humano necessário:** ritmo, justiça, sensação do escavador, clareza das marcas e combate touch em dispositivo real. A avaliação perceptual e o ajuste fino da dificuldade continuam dependendo desse teste.

```text
npm run typecheck
npm run build
node scripts/qa-soterrado-boss.mjs
node scripts/qa-soterrado-playthrough.mjs
node scripts/qa-dunes-and-music.mjs http://localhost:5184/ docs/soterrado-boss/regression-dunes
node scripts/qa-dante-journey.mjs http://localhost:5184/ docs/soterrado-boss/regression-journey
node scripts/qa-warden-boss.mjs http://localhost:5184/ docs/soterrado-boss/regression-warden
```

## Como avaliar

Continue seu progresso local nas Dunas, investigue as ruínas se necessário e siga até a depressão de areia no leste. Use **E / A / DESCER**. Antes de avançar, a subida permite voltar. Na luta, observe o aviso antes de atacar; o círculo de emersão fica onde foi anunciado. Após vencer, escolha seu aperfeiçoamento e investigue a abertura ao leste. A pista indica o norte; o destino gelado será construído depois.

[Encontro](qa/phase-2.png) · [Passagem revelada](qa/revealed-clue.png) · [Touch emulado](qa/touch.png).
