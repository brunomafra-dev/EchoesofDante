# Assets originais · Primeiro assentamento

Produzidos em 21/10/2026 com **OpenAI imagegen integrada**, modo geração de imagem nova, `transparent_background: true`. PNGs finais em `public/assets/colonization/`. [Manifesto](assets.json) registra arquivo fonte, SHA-256, dimensões e tamanho. Fontes preservadas no diretório local `.codex/generated_images/01a0df0e-3f54-78d2-bf2c-6f7125fee783`; não são dependência do runtime.

## Direção comum

Organic Sci-Fi R3 / referência D. Ilustração raster pintada, vista de jogo elevada em três quartos, volume material, iluminação suave superior esquerda, silhuetas irregulares, sombra de contato, escala legível e fundo transparente. Natureza verde `#6bb464`, tecnologia humana laranja `#e0863f`, mistério violeta `#a98cff`, mineral âmbar `#ffbd54`. Sem texto, UI, marcas, estética low-poly ou formas primitivas como resultado final.

## Conteúdo dos seis prompts

Direção textual consolidada dos pedidos de geração:

- **camp-ground:** clareira orgânica de terra verde-oliva e marrom quente, musgo, pequenas raízes e pedrinhas nas bordas, centro calmo e caminhável. Vista elevada, borda larga que se dissolve irregularmente em transparência; sem estradas brancas, edifícios, grandes obstáculos, padrão repetido ou retângulo visível.
- **camp-supplies:** conjunto pacífico de suprimentos de acampamento de uma expedição humana sci-fi: caixas verde-oliva, lona ocre, unidade de energia com detalhes laranja e recipiente de água. Um pequeno grupo integrado com base de terra e sombra justa; sem armas, pessoas ou letras. A primeira tentativa foi recusada pela ferramenta; o pedido reformulado como suprimentos pacíficos produziu o asset utilizado.
- **spring-pool:** nascente alienígena rasa com água verde-azulada, uma cavidade profunda discreta, margem de pedra arredondada, musgo e raízes. Forma assimétrica, bancos acessíveis, transição de margem para terreno, sombra de contato. Sem uma moldura retangular nem água brilhante dominando o jogo.
- **first-habitat:** primeiro pequeno módulo de habitação expedicionária humana em Dante, casco verde-oliva/grafite, juntas e detalhes laranja, entrada quente e toldo. Reservatório fechado e canteiro experimental anexos, composição única de escala humana, terreno e base de contato. Sem templo, cidade, símbolos ou personagens.
- **bankGrazer:** criatura original de Dante, anfíbio baixo e robusto com seis patas, carapaça segmentada verde-oliva, tecido orgânico e pequenas brânquias laterais. Folha de oito poses de corpo inteiro em grade 4 × 2, mesma vista, identidade, proporções e escala: repouso, quatro apoios de caminhada, preparação de golpe, execução/recuperação, reação. Cada célula isolada em transparência; sem membros desconectados.
- **reedSpitter:** criatura original de Dante com corpo em pera, seis patas curtas, bolsa de água dorsal, crista vegetal e probóscide; aparência animal, distinta do anfíbio blindado. Folha 4 × 2 com oito poses completas: repouso, quatro passos, bolsa inflada/preparação, disparo, reação. Manter perspectiva, apoio no chão e proporção entre poses; transparência entre células, sem texto.

## Preparo offline

`scripts/prepare-colonization-assets.py` recorta alpha vazio, reduz imagens estáticas e empacota as criaturas em 1024 × 512 (8 células de 256 × 256). Uma escala comum por folha preserva proporções e registra os pés na linha 244. Pillow é usado apenas para recorte, redimensionamento e empacotamento das imagens geradas, não para desenhar ou substituir sua arte. Não há composição de braços/pernas em runtime.

Reprodução do preparo exige as fontes identificadas no manifesto; o jogo e o build usam somente os PNGs finais versionados. Não há dependência de conta, geração ou download em produção.
