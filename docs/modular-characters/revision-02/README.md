# Revisão 02 — roupa de expedição e proteção separada

**Rejeitada no playtest humano:** Hunter deformado, peças com aspecto de sobreposição e relance sem equipamento durante Q. Implementação substituída pela [revisão 03](../revision-03/README.md). Evidências abaixo são históricas.

O piloto anterior foi rejeitado pelo usuário: sua armadura pintada no corpo permanecia sob o torso novo. Esta revisão mantém a identidade Organic Sci-Fi D e separa a base sem proteção dos equipamentos.

## Testar

[Link direto](https://echosofdante.vercel.app/character-playtest.html?class=warrior&sex=female&kit=clothes) · [Biblioteca](https://echosofdante.vercel.app/test-library.html)

Compare roupa, carapaça básica e reforçada. Cada opção pode ser alterada separadamente: capacete, torso, calça, botas, luvas. Teste Guerreiro/Hunter e masculino/feminino; caminhe, mire de costas e perfil, ataque, use Dash e segure/solte Q. O laboratório não salva nem altera personagens reais.

## Implementação

- Quatro corpos pintados em roupa simples, sem armadura/helmet integrado; mangas e mãos em atlas separado.
- Proteção básica recortada tecnicamente das ilustrações originais, com capacete do mesmo conjunto para Hunter.
- Reforçada usa torso piloto existente e novo atlas original de capacete, pernas, botas e luvas.
- Peças montadas offline em frames alinhados à pose. Uma peça substitui a textura de seu slot; nunca existem básica e reforçada simultâneas nele.
- Pernas/botas seguem os frames e espelhamento do corpo. Ordenação com braços e arma preservada.
- No jogo principal, roupa simples é a base; armadura existente apresenta torso básico (Floresta) ou reforçado (Siroco/Geada). Arma equipada mantém a troca visual anterior. Posse, saves e atributos preservados.
- Sete slots previstos no plano, incluindo luvas. Esta é a fundação visual: drops, inventário e persistência dos novos slots aguardam a etapa 2.

## Assets e origem

Imagens originais produzidas pelo `imagegen`, sem imagem externa. Fontes e referências preservadas em `source-art/`. Prompt-base: editar a grade e poses originais, substituir toda proteção rígida por camisa/calça de expedição, botas simples e cabeça descoberta, manter projeção e transparência. Duas primeiras variantes apresentaram sexo inconsistente e foram corrigidas antes de uso. Equipamento reforçado: atlas original de peças industriais marfim/carvão/laranja, frente/costas/perfil.

`python scripts/prepare-expedition-clothes.py` faz apenas recorte, registro, redimensionamento e empacotamento offline. PNG com alpha; corpos 256 px por frame, equipamentos 128 px por frame, braços 128 px. Dimensões e bytes em `asset-measurements.json`. Nenhuma geração de arte em runtime.

## Validação e limites

QA técnico em `qa/`; aprovação visual depende do usuário. O alinhamento de peças às poses é aproximado, sem animação esquelética; misturas entre conjuntos precisam ser avaliadas caminhando, especialmente em poses de ataque. Não há novo inventário nem estatísticas de luvas/capacete nesta etapa. O cooperativo usa as peças do torso atual, sem novo protocolo; a disponibilidade pública do relay depende de sua hospedagem.

## Resultado técnico — 0.1.80

Typecheck e build passaram (aviso preexistente do tamanho do chunk Phaser). QA Chrome das quatro combinações, peças, poses, habilidades, preservação de saves e quatro resoluções passou. Menu/criação/reload passou. Regressão cooperativa percorreu Floresta, Cavern, Warden, vale, Siroco, dunas, Soterrado, geada, galerias e ninho glacial; três bosses e ciclos de morte/respawn passaram. Touch emulado e gamepad mock passaram. Zero erros JS/assets nessas execuções. FPS observado no teste de peças: aproximadamente 52–57; contagem de objetos/tweens permaneceu estável nas trocas. Sem teste físico desta revisão.

74 PNGs novos, 4.16 MB compactados e 54.75 MiB RGBA estimados antes da sobrecarga do engine. Equipamentos usam imagens reutilizadas; cenário, física, IA e valores de combate não foram alterados.

**QA técnico passou. Playtest humano pendente.**
