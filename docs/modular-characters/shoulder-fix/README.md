# Junção dos braços na roupa simples — 0.1.82

O usuário aprovou a melhoria dos corpos e armas da revisão 03, mas identificou braços desconectados do torso na roupa simples: Guerreiro atacando e Hunter parado.

## Teste reservado

[Hunter sem proteção](https://echosofdante.vercel.app/character-playtest.html?class=hunter&sex=female&kit=clothes&weapon=starter) · [Guerreiro sem proteção](https://echosofdante.vercel.app/character-playtest.html?class=warrior&sex=male&kit=clothes&weapon=starter) · [Biblioteca](https://echosofdante.vercel.app/test-library.html)

Confira ombro/manga parado, caminhando, atacando e usando Q; mire de frente, perfil e costas. Alterne torso básico/reforçado e roupa simples. O teste não altera personagens ou progresso reais. **Aguardar validação humana antes de iniciar a etapa 2.**

## Correção

- 48 pares de encaixes extraídos offline da área pintada dos ombros: duas classes, dois sexos, três direções e quatro poses. `scripts/prepare-shoulder-sockets.py` gera somente metadados JSON; nenhuma imagem foi modificada.
- A raiz da manga acompanha o frame, tamanho, posição e espelhamento do corpo. As posições fixas anteriores permanecem para armaduras, cuja apresentação foi aprovada.
- Manga invade o ombro em 5 px e o antebraço sobrepõe o cotovelo em 2 px. A própria manga cobre sua junção e o corte do braço na pintura; o braço próximo pode cruzar à frente do peito.
- Pegadas, mãos, armas, mira, dano e animação funcional das habilidades permanecem iguais. Apresentação do menu recebe o mesmo ajuste.
- Foram testadas outras ordenações e uma máscara de ombro. A máscara expunha novamente o braço cortado da pintura e foi descartada; não existe na implementação final.

## QA e performance

`npm run typecheck` e `npm run build` passaram; aviso preexistente do tamanho do chunk Phaser permanece. `qa-cloth-shoulders.mjs` verifica encaixe sobre pixels opacos, sobreposição, ordenação, oito direções, quatro combinações de classe/sexo, caminhada, ataque real do Guerreiro e Q. Alternar vestir/retirar retorna às origens anteriores da armadura; objetos e texturas não crescem nas trocas.

Criação/seleção/reload de personagens e letras A/L passaram. Touch CDP e gamepad mock tiveram movimento, ataque, Dash e hold/release verificados. Nenhum teste físico de dispositivo nesta revisão. Relatórios e capturas em [qa](qa/), incluindo [comparação](qa/comparison.jpg). Zero erros JS/assets nas execuções registradas.

O audit registrou aproximadamente 51–59 FPS durante trocas rápidas de aparência e capturas. Medição de repouso em `qa/performance.json`: o contador suavizado começa em 44–48 FPS durante a inicialização e chega a **58,6–58,8 FPS após nove segundos**, com deltas de aproximadamente 16,67 ms. Nenhum novo GameObject, textura raster, RenderTexture ou tween foi adicionado: os dois pontos de encaixe por ator são reutilizados; não há leitura de alpha durante gameplay.

Esta entrega corrige somente a junção dos braços. Não reproduz musculatura ou deformação de tecido com animação esquelética. A percepção de união natural ainda depende do playtest humano, sobretudo em diagonais e durante os arcos do ataque.
