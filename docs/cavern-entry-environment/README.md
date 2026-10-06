# Ambiente da primeira Cavern — 0.1.50

O piso ilustrado e a composição aprovados na Câmara de Referência agora também
aparecem na primeira sala da Cavern jogável. A mudança responde à lacuna entre
a comparação visual e o jogo normal: antes, só a câmara recebia aquela leitura
de chão contínuo e materiais integrados.

## O que mudou

Captura da sala normal, depois da aplicação: [gameplay-preview.png](gameplay-preview.png).

- O backplate pintado substitui a leitura procedural escura do piso no salão de
  entrada. O material se estende além da sala e recebe alpha suave nas bordas,
  para se misturar ao `cavern-soil` contínuo durante a descida.
- A primeira sala usa a composição compacta da referência: bordas rochosas,
  pedras com bases, raízes baixas, minerais e a estrutura antiga. O centro do
  caminho fica aberto para leitura do Guerreiro, dos Hollows e do combate.
- O trecho estreito que segue à estrutura mantém sua direção e inscrições.
  O colapso, POIs e geografia das regiões profundas continuam nos sistemas
  atuais.
- Reutiliza o backplate aprovado, `EnvironmentPainter`, as pinturas existentes
  e as pegadas ambientais. A máscara alfa é uma preparação offline do mesmo
  piso: só suaviza a transição de borda, sem criar nova arte.

## Física e renderização

Não mudam limites, obstáculos, pontos de entrada, passagem, combate, câmera,
progressão ou controles. O visual continua independente dos footprints. A sala
é composta numa RenderTexture estática; o novo backplate é uma única Image e o
restante das regiões continua usando o bake existente.

Para regenerar o backplate preparado:

```powershell
python scripts/prepare-cavern-entry-floor.py
```

O script lê `public/assets/experiments/quality-reference/basin-floor.webp` e
grava `public/assets/visual/environment/cavern-entry-floor.webp`.

## Escopo e revisão visual

Esta aplicação corresponde à primeira sala descrita no README da Referência de
Qualidade. Deep Cavern, exterior e Vale conservam suas composições atuais. O
próximo critério é visual: percorrer a descida, olhar a ligação entre o salão e
o túnel, e confirmar que os footprints existentes continuam fáceis de entender.
