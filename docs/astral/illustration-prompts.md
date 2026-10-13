# Arte original do Manipulador Astral

Origem: geração e edição com a ferramenta interna de imagens durante esta etapa. Nenhum asset externo foi baixado. Abaixo estão os requisitos enviados, resumidos para registrar a intenção; não são uma transcrição literal dos prompts. As fontes finais estão em `source-art/` e não são carregadas pelo jogo.

## Corpos e vestimentas

Prancha transparente, seis colunas: masculino frente/costas/lado e feminino frente/costas/lado. Três linhas: roupa de expedição sem proteção, proteção básica e proteção reforçada. Humano adulto com proporções anatômicas consistentes, botas apoiadas, roupa técnica curta, equipamento científico compacto; pintura estilizada, volume, material e silhueta legível na câmera elevada do jogo. Tons de ardósia/metal, pequenos acentos humanos âmbar e energia ciano. Identidade de operador de campo com manopla; sem rifle, sabre, cajado, vestes medievais ou armadura de outro personagem. Mesmo enquadramento e tamanho entre versões.

A primeira geração incluía braços completos. Uma edição pela mesma ferramenta retirou os braços abaixo das mangas, conservando as extremidades dos ombros, para permitir articulação com os recortes pintados já existentes no projeto. Fonte final: `source-art/bodies.png`, 1536×1024 RGBA.

## Manoplas

Três instrumentos originais de antebraço e mão, apresentados horizontalmente, apontando para a direita: manopla de campo simples, condução básica e ressonância avançada. Punho humano e luva integrados, metal funcional, núcleo energético discreto, materialidade e iluminação coerentes com a pintura dos corpos. Sem arma de fogo, bastão, símbolo religioso ou círculo mágico. Fundo transparente e separação suficiente para recorte. Fonte: `source-art/gauntlets.png`, 2172×724 RGBA.

## Preparação offline

`python scripts/prepare-astral-art.py` usa Pillow, já disponível no ambiente de desenvolvimento, para recortar/registrar as pinturas sem alterar sua proporção, criar os atlas e miniaturas e desenhar texturas pequenas para os campos elementais. Não é uma dependência do browser ou do build. Os frames de caminhada usam deslocamentos curtos das pernas; não há alongamento X/Y dos corpos. Encaixes dos ombros são registrados em JSON por apresentação e pose.

Dimensões e bytes por asset: [asset-measurements.json](asset-measurements.json). Os efeitos são texturas autorais simples produzidas pelo script; não são arte gerada durante o gameplay. Não houve geração de novos cenários nesta etapa.
