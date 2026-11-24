# Prompts do Erudito/Erudita (0.1.205)

Direção visual aprovada: identidade fixa do Erudito/Erudita, acento azul/prata, variação só por instrumento e postura. Os 18 prompts completos, prontos para colar, estão em [generation.json](generation.json) (`requests[].prompt`), cada um com as duas referências (`refs`) e o arquivo de saída (`source`).

## Como usar

1. Anexe `refs[0]` como Reference1 (identidade: folha original do Erudito, mesmo gênero e equipamento) e `refs[1]` como Reference2 (só o instrumento: folha original da profissão).
2. Cole o `prompt`. Exija saída **1536×1152, RGBA transparente, 8 colunas × 6 linhas** (células de 192×192).
3. Salve em `docs/erudite-professions/source/astral-{profissão}-{gênero}-{equipamento}.png` e registre origem e prompt em `variant-output-map.json`.
4. Antes de salvar, confira: 48 figuras inteiras; sem fundo, chão, sombra ou texto; quatro fases de caminhada distintas; pés na mesma linha de base; instrumento preso à mão; nada cortado entre células.

## Ajustes em relação à direção aprovada

- **Domador sem filhote pintado.** O jogo desenha o companheiro em separado, como no Pioneiro; um filhote na folha duplicaria a criatura e quebraria as 48 figuras. O verde fica só no filamento da luva.
- A folha original do Erudito tem layout 4×8; serve apenas como referência de identidade.

## As 18 combinações

| # | Profissão | Gênero | Equipamento | Arquivo |
|---|---|---|---|---|
| 1 | warrior | female | none | `astral-warrior-female-none.png` |
| 2 | warrior | female | basic | `astral-warrior-female-basic.png` |
| 3 | warrior | female | reinforced | `astral-warrior-female-reinforced.png` |
| 4 | warrior | male | none | `astral-warrior-male-none.png` |
| 5 | warrior | male | basic | `astral-warrior-male-basic.png` |
| 6 | warrior | male | reinforced | `astral-warrior-male-reinforced.png` |
| 7 | hunter | female | none | `astral-hunter-female-none.png` |
| 8 | hunter | female | basic | `astral-hunter-female-basic.png` |
| 9 | hunter | female | reinforced | `astral-hunter-female-reinforced.png` |
| 10 | hunter | male | none | `astral-hunter-male-none.png` |
| 11 | hunter | male | basic | `astral-hunter-male-basic.png` |
| 12 | hunter | male | reinforced | `astral-hunter-male-reinforced.png` |
| 13 | xenobinder | female | none | `astral-xenobinder-female-none.png` |
| 14 | xenobinder | female | basic | `astral-xenobinder-female-basic.png` |
| 15 | xenobinder | female | reinforced | `astral-xenobinder-female-reinforced.png` |
| 16 | xenobinder | male | none | `astral-xenobinder-male-none.png` |
| 17 | xenobinder | male | basic | `astral-xenobinder-male-basic.png` |
| 18 | xenobinder | male | reinforced | `astral-xenobinder-male-reinforced.png` |

## Estrutura de cada prompt

Cabeçalho comum + bloco da profissão + bloco do equipamento + bloco do gênero. O texto literal de cada um está em `generation.json`.
