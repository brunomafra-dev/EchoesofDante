# Batedor/Batedora nas quatro profissões — 0.1.203

Este lote acrescenta as famílias `hunter → astral` e `hunter → xenobinder`. Caçador original e Guerreiro da 0.1.202 permanecem. São personagens inteiros prontos; não há edição de cabelo, rosto, pele ou montagem de membros.

Produção original com **imagegen integrado**, a partir das referências do próprio Echoes of Dante. O [registro de geração](generation.json) contém os doze prompts, referências e nomes originais. Fontes RGBA em `source/`; não são baixadas pelo jogo. Sem compra, extração de outros jogos ou licença de terceiros nova. Autoria assistida por IA para este projeto, sem apresentar estes arquivos como pacote CC0.

## Figuras e importação

Astral usa manopla de metal escuro no antebraço/mão, com canalização ciano. Domador usa condutor de campo em quitina oliva, com sensor verde/âmbar e gesto de comando; a fera continua separada e usa o sistema existente. Roupa inicial azul/laranja, carapaça básica com visor e reforçada com placas. Os dois gêneros mantêm a identidade do Batedor/Batedora.

Cada fonte tem 1448×1086, oito direções e seis poses por direção: repouso, contato A, passagem A, contato B, passagem B e ação. São **48 figuras autorais por folha, 576 no lote**. Atlas finais 1536×1536, células 192×192, 64 índices; o layout reutiliza contatos, não são 64 animações independentes.

`python scripts/prepare-scout-professions.py` usa Pillow/NumPy/OpenCV disponíveis na produção de arte. Recorta figuras completas, remove fragmentos desconectados, registra os pés em 183 e aplica uma escala por direção a toda a sequência. Não redesenha anatomia nem sintetiza membros/passos. O núcleo luminoso não define o tamanho do corpo. Mede oito emissores por folha sobre a manopla/condutor e exporta `src/visual/scoutEmitterAnchors.json`. Isso afeta somente emissão visual; a simulação conserva seus alcances e colisões.

[Medidas, transformações e hashes](measurements.json). `python scripts/verify-scout-professions.py` confere transparência, margens, quatro fases de pernas diferentes, oito direções e emissores sobre os instrumentos. [Resultado](../2d-refinement/qa/203/asset-geometry/report.json).

## Recursos

Os doze PNG finais somam 22.157.752 bytes (aproximadamente 21,13 MiB). Cada atlas decodificado ocupa 9.437.184 bytes RGBA; as três roupas de uma família ocupam 28.311.552 bytes como entradas CPU. Um personagem equipado usa um canvas/textura adicional de 9.437.184 bytes, antes de custos do driver/renderer. Esses números não medem o pico total do navegador. Tamanhos comprimidos por arquivo estão no relatório de medidas.

Somente as famílias efetivamente usadas entram no cache do jogo. Aliados que chegam depois do preload aguardam as fontes antes da criação de seus atores. Fontes compartilhadas são liberadas no encerramento do jogo; troca de equipamento faz bake e caminhada só troca o frame. Nenhum novo atlas/material é criado por frame, nenhuma inferência ou GPU dedicada é necessária para jogar.

QA técnico e publicação: [revisão 203](../2d-refinement/REVISION_203.md). Aprovação estética humana permanece separada.
