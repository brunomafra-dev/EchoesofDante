# Erudito/Erudita nas quatro profissões — 0.1.205 (EM PREPARAÇÃO)

**Estado:** pausado por falta das 18 grades de origem. Nenhum atlas, âncora ou liberação de preset existe. Este diretório contém só o esqueleto; `"astral"` continua **bloqueado** em `src/config/visual-presets.json` para Guerreiro, Caçador e Domador.

## Objetivo
Erudito/Erudita (hoje só Manipulador Astral) exercer Guerreiro Galáctico, Caçador Estelar e Domador de Feras, como Batedor (0.1.203) e Pioneiro (0.1.204). A profissão controla combate, recursos, equipamentos e progresso; o corpo é uma pintura completa. Sem editor de rosto/cabelo/pele. `CharacterProfiles` e `LocalJourney` (`schema: 1`) não mudam: `visualPreset` é só apresentação.

## Entradas necessárias (18)
`source/astral-{warrior|hunter|xenobinder}-{female|male}-{none|basic|reinforced}.png`, RGBA transparente, 8 colunas (direções) × 6 linhas (repouso, 4 fases de caminhada reais, ação), 48 figuras inteiras, sem chão, sombra, texto, grade ou fragmentos. Detalhes em [generation.json](generation.json); a correspondência de cada arquivo recebido vai em [variant-output-map.json](variant-output-map.json), arquivando o prompt literal ou a origem.

## Importação (quando as fontes existirem)
1. `python scripts/prepare-scout-professions.py --preset astral` (gera 18 atlas 1536×1536 em `public/assets/visual/complete-actors/cross/astral-*-v1.png`, `measurements.json` e `src/visual/eruditeEmitterAnchors.json`).
2. `python scripts/verify-scout-professions.py --preset astral` (relatório em `docs/2d-refinement/qa/205/asset-geometry`).
3. Ajustar pontos de emissão em [emitter-overrides.json](emitter-overrides.json) se necessário.

## Fechamento da revisão (só depois dos 18 atlas passarem)
Importar `eruditeEmitters` em `CompleteActorFrames.ts`; acrescentar `"astral"` às três linhas de `visual-presets.json`; flag `'205'` nos sete pontos de `src`; seção em `test-library.html`; versão 0.1.205; QA `qa-2d-revision205-*`, `qa-erudite-*` (rascunhos derivados da suíte 204, ainda não executados); entrada final no roadmap.
