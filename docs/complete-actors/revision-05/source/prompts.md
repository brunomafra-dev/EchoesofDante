# Fontes completas — revisão 05

Origem: `image_gen.imagegen`, geração original offline com fundo transparente. As referências foram as pinturas completas das mesmas classes/vestimentas já presentes no projeto. Nenhum membro foi gerado ou montado separadamente. Dimensões, bytes e SHA-256 efetivos estão em [source-audit.json](../source-audit.json).

## Hunter — apoio SW

Arquivo: `hunter-sw-contact.png`, RGBA 1536×1024. Duas linhas (masculino/feminino), três colunas (inicial/básico/reforçado).

Especificação do prompt: folha de seis personagens humanos completos em estilo de RPG ilustrado Organic Sci-Fi; câmera ortográfica elevada fixa; vista frontal em três quartos, apoio de caminhada com pé direito à frente, passo contido e botas proporcionais. Hunter de pele escura, homem com cabelo curto prateado, mulher com rabo de cavalo prateado; uniforme azul e arnês âmbar, rifle compacto seguro por ambas as mãos. Colunas de roupa inicial, proteção básica e proteção reforçada com viseira âmbar. Preservar cabeça, pescoço, ombros, braços, mãos, rifle, pernas e ambos os pés dentro de cada célula; grandes intervalos transparentes entre figuras e linhas; sem texto, cenário, chão ou sombra pintada na folha.

A ferramenta entregou as figuras voltadas para a direita. O importador espelha **a pessoa inteira** para a vista SW. A arma/mão dominante pode se inverter nesta orientação, limite já existente da representação em oito vistas.

## Guerreira — apoio direito frontal

Arquivo: `warrior-female-right-front.png`, RGBA 1024×1536. Quatro linhas (S/SE/E/NE), três colunas de vestimenta.

Especificação do prompt: doze pinturas da mesma mulher guerreira humana inteira, cabelo castanho curto desalinhado, camisa de expedição carvão, calça cargo oliva, botas marrons e espada curta de aço. Apoio de caminhada com pé direito adiante, sem salto, mãos e cotovelos conectados naturalmente ao torso; espada e mão livres inteiras. Proteção básica branca/dourada com capacete aberto e reforçada branca/dourada com viseira cyan e sabre energético. Organic Sci-Fi R3, volume pintado, mesma escala/perspectiva em todas as células, oito direções do jogo respeitadas pelas quatro vistas solicitadas. Transparência, margens generosas em todos os lados, sem recortar cabelo, dedos, lâmina ou pés; sem peças soltas ou membros extras.

## Guerreira — apoio direito posterior

Arquivo: `warrior-female-right-back.png`, RGBA 1024×1536. Quatro linhas (N/NW/W/SW), três colunas de vestimenta.

Especificação do prompt: continuação da folha frontal, mesma pessoa, anatomia, câmera, materiais, três vestimentas e contato de caminhada; vistas posteriores/laterais N/NW/W/SW. Corpo completo por célula, braços/mãos unidos, espada inteira, pés proporcionais apoiados, intervalos transparentes amplos entre linhas e colunas. Sem montagem por partes, cenário ou texto.

## Preparação

Os limites de linha dessas três fontes são revisados explicitamente. Os limites de coluna são encontrados a partir das massas alfa reais; a divisão em terços nominais cortava punhos nas folhas anteriores. Os 30 recortes destas fontes mantêm pelo menos três pixels de margem para a massa com alfa >128. O processamento remove apenas fragmentos isolados da célula vizinha; não elimina pele para separar poses sobrepostas. PNGs finais continuam 768×1536, 32 quadros de 192×192.

A vista W de apoio direito do Hunter masculino reutiliza a pintura E de apoio esquerdo, espelhada como **corpo inteiro**, para evitar a sobreposição entre bota e cabeça da folha antiga.
