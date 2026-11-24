# 0.1.205 — Erudito/Erudita nas quatro profissões (PAUSADA)

## Contexto
Continuação do plano de permitir as quatro profissões em cada personagem (Batedor 0.1.203, Pioneiro 0.1.204; depois Erudito, depois Vinculado). Pausada: as 18 grades de origem não existem e o ImageGen integrado foi encerrado neste fluxo. Reaproveitar ou substituir corpos só com plano visual aprovado pelo usuário.

## Já existente (não commitado)
- [x] Capacidade aditiva `erudites:1` em `server/relay.mjs` e `src/network/CoopSession.ts` (protocolo 16); só dispara com `visualPreset==='astral'&&classId!=='astral'`, hoje impossível.
- [x] `--preset astral` em `prepare-scout-professions.py` e `verify-scout-professions.py`.
- [x] Esqueleto documental em `docs/erudite-professions/` e rascunhos de QA.

## Pendente
- [ ] 18 grades de origem (bloqueio exclusivo).
- [ ] Atlas, âncoras, `CompleteActorFrames.ts`, `"astral"` em `visual-presets.json`, flag `'205'`, `test-library.html`, versão 0.1.205.
- [ ] QA técnico (typecheck, build, geometria, matriz 26/32, movimento, input, relay, coop local, viewports, saves sentinela).
- [ ] Aprovação humana visual — não declarável só com QA automatizado.

## Scripts de QA (rascunhos)
`scripts/qa-2d-revision205-selection.mjs`, `qa-2d-revision205-input.mjs`, `qa-erudite-coop.mjs`, `qa-erudite-library-link.mjs`: derivados mecanicamente das suítes 204 (troca warrior↔astral); sintaxe verificada, **não executados**. Precisam de revisão (contagens de matriz, textos) na primeira execução real.

## Esteira de importação e fechamento

- `python scripts/validate-erudite-sources.py` valida as 18 grades em `docs/erudite-professions/source/` (somente leitura): tamanho 1536×1152, alfa real, fundo removido, 8×6 figuras inteiras sem tocar a borda da célula, nenhuma peça solta (o importador guarda só o maior componente e apagaria um membro/instrumento destacado), altura coerente entre linhas, quatro fases de caminhada realmente diferentes e arquivos não duplicados. Relatório em `docs/2d-refinement/qa/205/source-validation/report.json`. `--allow-partial` valida só o que existir.
- `python scripts/finalize-erudite.py` é um **dry run** por padrão e exige 18/18 válidas. Com `--apply`: importa (`prepare-scout-professions.py --preset astral`), verifica a geometria, aplica a ativação (emissores em `CompleteActorFrames.ts`, `"astral"` em `visual-presets.json` para Guerreiro, Caçador e Domador, flag `'205'`, subtítulo da seleção, seção em `test-library.html`, versão 0.1.205) e roda typecheck, build, relay, `git diff --check` e as quatro suítes de navegador. Qualquer falha restaura os arquivos editados e mantém `"astral"` bloqueado; no sucesso atualiza este documento e o roadmap. **Nunca faz commit nem push** e deixa a aprovação humana em aberto.
- Verificação das próprias ferramentas (24/11/2026): o validador foi testado com fixtures sintéticas fora do repositório (conjunto válido aprovado; defeitos de fundo, tamanho, borda, peça solta, fases repetidas e arquivo duplicado reprovados; parcial só com `--allow-partial`). A ativação foi aplicada numa cópia temporária, com âncoras sintéticas, e `tsc --noEmit` passou; recusou aplicar duas vezes. O caminho completo (`--apply` com arte real, build e navegador) **não foi executado**; as quatro suítes de navegador seguem como rascunhos derivados da 204.
