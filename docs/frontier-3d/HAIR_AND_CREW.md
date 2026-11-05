# Cabelos e tripulação — 0.1.194

O usuário aprovou a revisão 0.1.193 e pediu mais cabelos e NPCs reconhecíveis como as figuras já estabelecidas no 2D. Somente aparência/criação/oficina foram aprofundadas; posições, tarefas, diálogos, combate e requisitos continuam os mesmos. Aprovação visual desta nova revisão depende de playtest humano.

## Cabelos

Doze escolhas em cada corpo: sem cabelo, os três cortes anteriores e oito adicionais — laterais raspadas/penteado lateral, rabo de cavalo, cacheado curto, ondulado, trança, moicano curto, coque alto e entradas. Os IDs 0–3 preservam os cortes antigos; 4–11 são novos. A seleção permanece ao trocar gênero, editar, recarregar e fechar a aba, seguindo a persistência 3D existente.

Os modelos novos partem das mechas, UVs e mapas Quaternius CC0 já incorporados. O Blender adapta comprimento, ondulação, volume cacheado, recuo frontal e coque; caudas/trança adicionais são modeladas no mesmo fluxo. A primeira tentativa de superfícies lisas foi descartada na revisão visual por parecer uma touca. Nenhuma daquelas malhas provisórias é entregue.

Penteados usam o `Head` real, com conversão offline para a matriz de bind de cada corpo. Não alteram a altura normalizada do corpo, mãos, armas, manopla, mochila ou esqueleto. Oficina permite ver o cabelo de frente e de costas. São malhas rígidas ligadas à cabeça; não há simulação física de fios. Colares/mochila e poses extremas continuam pontos de avaliação visual, sem garantia de ausência absoluta de aproximações entre mechas e equipamento.

## Cinco identidades, uma configuração

`src/experiments/arrival-3d/looks.ts` é compartilhado pelo mundo e oficina:

| NPC | Referência 2D vigente | Tradução para 3D |
|---|---|---|
| Tio Gui | `caio-motion-r4.webp` | Cabelo repartido com entradas/grisalho, bigode e barba curta grisalha, casaco marrom e rosto mais maduro. A barba e o envelhecimento também seguem o pedido explícito atual; a pintura 2D tem sobretudo bigode. |
| Ivo | `ivo-work-r1.webp` | Calvo, barba grisalha, óculos de oficina na testa e avental de couro. |
| Dra. Lia | `lia-work-r1.webp` | Pele mais escura, cabelo curto cacheado, jaleco claro e identificação médica. |
| Nara | `nara-work-r1.webp` | Cabelo escuro preso em coque alto, roupa de campo e lenço laranja. |
| Elisa | `elisa-motion-r5.webp` | Cabelo ruivo ondulado, camisa clara e colete de campo; continua cuidando dos canteiros. |

A oficina exibe o sprite 2D original ao selecionar cada morador. A equivalência é uma adaptação estilizada, não reprodução idêntica da pintura. Mara/Choco e moradores de territórios ainda não migrados não foram inventados nesta cena.

Rostos recebem alterações conservadoras de rest-shape no Blender para Gui, Ivo e Lia. Ossos, pesos e animações humanos originais permanecem nos arquivos 0.1.193, sem substituição por corpos montados. Roupas novas foram ajustadas à superfície real e receberam pesos derivados da roupa-base. Em execução compartilham o skeleton do respectivo NPC, com mixers independentes entre pessoas. A paleta civil reaproveita os detalhes/UVs/normal maps da roupa-base sem aplicar uma única cor à pele e ao uniforme inteiro. Ferramentas e pontos de trabalho anteriores são preservados.

## Produção, licença e recursos

- `scripts/asset-tools/author-arrival194.py`: Blender 4.5.15 LTS em CPU, sem render offline. Fonte editável regenerável em `.local/crew194/Dante-hair-and-crew.blend`.
- `prepare-arrival194.mjs`: conversão das matrizes, mapas para WebP até 256 px, deduplicação e transferência de pesos; `verify-arrival194.mjs`: validação dos arquivos, pesos e preservação dos humanos anteriores.
- `looks-194.glb/json`: 22 raízes — 16 variações de cabelo, cinco roupas, óculos de Ivo. Quatro texturas compartilhadas; contagens, bytes e hash reais no manifesto. Só a opção escolhida é instanciada; geometria e mapas são compartilhados, materiais por pessoa são descartados com ela. Nenhuma geometria ou textura é criada por frame.
- `npc-age-194.json`: alterações pequenas de posição, aplicadas uma vez a cópias da geometria facial. A cache original não é editada. As cópias são descartadas ao trocar o sujeito.
- Fontes capilares: [Quaternius Universal Base Characters](https://quaternius.com/packs/universalbasecharacters.html), arquivos CC0 já verificados no projeto e licença em `public/assets/frontier-3d/Quaternius-UBC-CC0.txt`. Nenhum novo pacote, compra, conta, áudio, asset proprietário ou ferramenta paga. Texturas derivadas conservam essa licença; roupas/óculos/caudas complementares são autoria Echoes of Dante. Créditos no diretório público.

## Revisão direta

- [Tio Gui e demais NPCs](https://echosofdante.vercel.app/arrival-workshop.html?v=0.1.194&subject=gui&view=portrait).
- [Cabelos nos dois corpos](https://echosofdante.vercel.app/arrival-workshop.html?v=0.1.194&subject=hunter&gender=female&view=portrait&hair=7).
- [Trança por trás](https://echosofdante.vercel.app/arrival-workshop.html?v=0.1.194&subject=warrior&gender=female&view=hair-back&hair=8).
- [Criação, edição e acampamento](https://echosofdante.vercel.app/arrival-3d.html?v=0.1.194).

Sem simular pré-requisitos ou derrotas de boss. A oficina não lê saves. O jogo preserva os namespaces da campanha e do ensaio, inclusive personagens com penteados antigos. QA técnico em `qa/0.1.194/`. Nenhum teste em celular físico ou aprovação estética é presumido.

Publicação confirmada: aplicação `679a0db` em `origin/main`, Vercel success, 102 hashes públicos iguais ao build. Nove relatórios locais e três suítes públicas (aparência, input e entrada pelo menu) passaram. A referência 2D foi conferida também após decodificação da imagem pública. [Registro da publicação](qa/0.1.194/publication.json). Aprovação visual humana desta revisão permanece pendente; aguardar playtest antes de avançar territórios.
