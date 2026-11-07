# Pinturas do primeiro cruzamento — 0.1.202

Família `hunter` (Batedor/Batedora) com profissão `warrior` (Guerreiro Galáctico). Produção original com **imagegen integrado**, usando como referência os personagens completos já apresentados pelo jogo. Sem extração de personagens de outros jogos, assets comprados, API externa, montagem de membros ou retorno ao editor de cabelo/cabeça.

## Fontes e reprodução

As seis fontes RGBA estão em `source/hunter-warrior-{female|male}-{none|basic|reinforced}.png`. [Prompt base](prompt.txt). Variantes: gênero e identidade da referência original; roupa inicial azul com arnês laranja; básica com carapaça/visor âmbar; reforçada com placas de ombro/peito/canelas, conservando a mesma pessoa e as poses. Cada variante foi produzida em uma chamada própria, a partir da referência correspondente e da folha anterior do mesmo gênero para manter o gesto.

Arquivos gerados foram copiados do diretório `C:\Users\1\.codex\generated_images\01a173c1-3677-75b2-89b6-2f3640ffad61` para este projeto. Nomes originais, em ordem feminino inicial, masculino inicial, feminino básico, masculino básico, feminino reforçado, masculino reforçado:

- `exec-73385349-f691-428e-9083-1478cd9e3d41.png`
- `exec-ceaf1a1f-a6f5-4142-84de-4bf1644d1478.png`
- `exec-42e9bbed-691c-40ff-9d80-a2ba352466ae.png`
- `exec-ee310b3c-a2d6-4920-a09a-ffe17c475b34.png`
- `exec-597956da-efe7-4215-a929-185de81c0f9b.png`
- `exec-04cd68fd-721e-4e3b-80bb-2c2c3cb77f00.png`

Importação: `python scripts/prepare-preset-pilot.py`. Usa Pillow, NumPy e OpenCV já disponíveis no ambiente de produção de arte; não são dependências do jogo/build/Vercel. Recorta células completas, remove fragmentos soltos fora da figura, registra escala por direção a partir do repouso e o apoio no chão, sem desenhar anatomia ou sintetizar passos. O brilho não determina o tamanho do corpo. Há uma escala por direção para toda a sequência; flexão de joelho mantém sua altura pintada. Movimento reduzido na UI é respeitado.

Cada fonte possui 1448×1086, oito colunas/seis linhas: repouso, contato A, passagem A, contato B, passagem B, ação. São 48 figuras pintadas por arquivo, 288 no total. O atlas final tem 1536×1728, células 192×192 e 72 índices compatíveis com o Guerreiro; os índices de repouso/contato são referenciados novamente pelo layout existente, não são alegadas 72 animações distintas.

Saídas finais: `public/assets/visual/complete-actors/cross/hunter-warrior-{female|male}-{none|basic|reinforced}-v1.png`. [Medidas reais, hashes, caixas e transformações](measurements.json). Validação: `python scripts/verify-preset-pilot.py`.

## Recursos

Seis PNG finais somam 12.911.060 bytes (aproximadamente 12,31 MiB). Uma família ativa carrega três fontes (6,24 MB feminino / 6,67 MB masculino) apenas para bake, 31.850.496 bytes RGBA decodificados, mais o canvas/textura equipado de 10.616.832 bytes antes de custos do renderer/driver. Isso não é medida do pico total do navegador. Prévia usa somente roupa inicial e aliases; coop não baixa os seis novos atlas indiscriminadamente. Nenhum material/atlas é criado a cada frame.

O novo cruzamento mantém a mesma estrutura de textura única por personagem. Os pares originais e suas fontes não foram regravados. Recursos compartilhados continuam sob o ciclo de vida de `CompleteActorSources`; uma mudança de equipamento faz bake e o movimento só seleciona o frame.

Autoria assistida por IA para Echoes of Dante; não se apresenta como um pacote de terceiros CC0. Não há nova licença externa a atribuir. Referências e saída foram mantidas no repositório para revisão; nenhum arquivo-fonte é carregado pelo jogo.
