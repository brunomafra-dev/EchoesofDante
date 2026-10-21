# Direção e preparo das figuras completas

Ferramenta integrada `image_gen.imagegen`, fundo transparente, execução offline em 21/10/2026. Nenhuma imagem externa ou geração durante o jogo. Referências: os próprios atlases aprovados `warrior-{sex}-{none|basic|reinforced}.png`.

Prompt comum: folha de três colunas e oito vistas S/SE/E/NE/N/NW/W/SW, 24 figuras completas; contato esquerdo, passagem estreita natural, contato direito; mesma pessoa adulta, proporções, tamanho da cabeça, comprimento dos membros, câmera e chão; passo pequeno, sem pulo/joelho alto/pés enormes. Braços unidos aos ombros, espada segura baixa, mãos/pés completos. Sem textos, cenário ou piso. Roupa inicial: camiseta carvão, cargo oliva, botas/luvas marrons e espada curta de metal. Mesma identidade masculina/feminina da referência.

Proteção básica: editar apenas o traje, com placas marfim/cinza, roupa escura, detalhes âmbar, capacete aberto e sabre cyan. Reforçada: mesmo corpo/poses, capacete fechado com visor cyan e proteção correspondente. Preservar posições, comprimentos, câmera e escala da folha inicial.

Quatro folhas de primeira tentativa tiveram pouco espaço entre figuras. Foram rejeitadas como fontes de produção. Prompt corretivo: reduzir cada humano INTEIRO a 70%, centralizado na própria célula; pelo menos 35 pixels transparentes entre linhas e 25 entre colunas, margens externas e pés inteiros no último quadro; não cortar anatomia para criar espaço, não alterar poses/direções/traje. Identificadores das saídas finais e hashes em `assets.json`.

`scripts/prepare-warrior-walk.py` copia as fontes finais para `source/`, mede gutters separadamente por coluna, recorta figuras completas e aplica escala uniforme com topo/chão constantes. Mantém os quadros de repouso/ataque; adiciona passagem e substitui os dois contatos. Sem reconstruir cotovelos, mãos, joelhos ou pés. A reflexão do NE feminino usa uma figura oposta inteira e está registrada por quadro.
