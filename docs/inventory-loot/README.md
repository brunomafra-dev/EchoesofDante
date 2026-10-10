# Etapa 2 — Mochila e drops — 0.1.83

A etapa 1 foi aprovada pelo usuário. Esta entrega cria o ciclo **derrotar → coletar → comparar → equipar**, no solo e na dupla.

[Teste reservado](https://echosofdante.vercel.app/inventory-playtest.html) · [Biblioteca](https://echosofdante.vercel.app/test-library.html)

## Playtest

O laboratório usa a cena e o combate reais, mas não lê/escreve jornadas nem cria personagens. Reload reinicia o teste. Coloque um conjunto no chão, feche o painel e use **E / COLETAR / A** perto das peças. Abra **I / MOCHILA**. No controle: Start → Mochila e equipamentos na campanha; Start abre diretamente no laboratório. Compare, equipe e retire. Confira caminhada, frente/costas, ataques e Q. Use a opção de mochila cheia. Na campanha, teste reload e uma dupla com amigo.

**QA técnico não é aprovação humana.** A etapa 3 aguarda seu playtest.

## Inventário e compatibilidade

- 24 itens na mochila; peças equipadas usam sete espaços separados: arma, capacete, torso, calça, botas, luvas e acessório.
- Catálogo fixo de 21 definições, raridades comum/aprimorado/raro. Os nove itens antigos conservam posse, nomes, slots e atributos. Foram adicionadas 12 peças regionais com bônus conservadores de vida.
- Cada cópia tem identidade própria; peças repetidas não se sobrescrevem. Sem afixos aleatórios.
- Armas e proteção são compatíveis com as duas classes; apresentação e ícone seguem a classe. Não transfere habilidades entre classes.
- Schema 2 dentro da jornada atual; migração determinística das nove peças, sem reset. `armor` permanece o identificador de torso para compatibilidade.
- Equipar não cura. Mochila cheia bloqueia coleta/retirada; substituir uma peça equipada continua possível.
- Falha de armazenamento desfaz a operação local. O item continua no chão quando a coleta não pode ser salva. Recibos cooperativos evitam repetição de recompensas; recompensa sem espaço fica pendente.

## Drops e dupla

Primeira criatura da região, depois uma em quatro; bosses deixam acessório regional. Seleção percorre o catálogo, permitindo cópias repetidas. Nada é equipado automaticamente.

Ícones e nomes discretos, com coleta contextual. Cada participante vê e coleta seus próprios drops. O anfitrião verifica proximidade e vagas informadas pelo visitante. Até 24 drops ativos por pessoa/região, com views reutilizadas. Itens não coletados desaparecem ao sair ou reconstruir a região no respawn. Coletados permanecem.

Abrir a mochila na dupla **não pausa o companheiro**; só bloqueia suas ações, então ainda é possível receber dano. Menus gerais mantêm seu comportamento.

Protocolo **3**: frontend Vercel e relay Render precisam estar atualizados. Incompatibilidade informa atualização necessária. Catálogo JSON compartilhado, recibos por cópia e sete slots. Duas pessoas; sem cloud save ou economia MMO.

## Visual e assets

Corpo vestido e braços aprovados reutilizados. Capacete/torso/pernas/botas substituem faixas na pintura; luvas usam o recorte articulado atual. Armas reutilizam os três visuais. Acessório é um pequeno detalhe raster.

`scripts/prepare-item-icons.py` produz offline 24 PNGs transparentes de **64×64, aproximadamente 59 KiB no total**, recortando pinturas, armas, manoplas e mineral existentes. Ícones das armas correspondem ao visual equipado. Todos os ícones foram verificados quanto a dimensões e conteúdo alpha não vazio. Sem arte externa. Famílias básica/reforçada permanecem; aprimorado/raro compartilham o visual reforçado.

## QA e performance

Evidências em `qa/`: capacidade, duplicatas, sete slots, saves antigos, falha de storage, reload, três respawns, classes/sexos, quatro resoluções, touch CDP, gamepad mock, WebSockets reais e campanha até os três bosses. Posições e HP controlados para cobertura; sem declaração de teste físico.

Typecheck e build passaram. QA de inventário, controles, protocolo, bônus antigos, jornada e campanha cooperativa passaram sem erros JS/carregamento. O build mantém o aviso anterior de tamanho do bundle Phaser. Capturas foram convertidas offline para WebP para reduzir o tamanho das evidências no repositório; os scripts de QA produzem PNGs ao executar novamente.

Sem redraw estático, novos tweens ou partículas. Texturas do corpo reutilizadas, recompostas somente ao mudar aparência. Drops limitados e agrupados em pool; DOM atualizado ao abrir/selecionar/trocar. Contagem de objetos/texturas estável nos respawns. QA da jornada: média de 57,8 FPS e zero escritas em storage durante o intervalo ocioso.

## Limitações

### Correção visual dos drops — 0.1.84

Drops mostram miniaturas das peças e armas correspondentes à classe, com escala de 44 unidades e sombra de contato baked. O acessório deixou de reutilizar um mineral ambiental: agora é um foco vestível com carcaça, suporte e núcleo mineral pequeno, também usado na mochila e no detalhe equipado. Os nomes e atributos continuam iguais.

O script offline produz mais 24 texturas de chão, 64×64, aproximadamente 76 KiB no total. Cada drop continua com uma imagem e um texto reutilizados; nenhum objeto, tween ou desenho por frame foi adicionado. Typecheck, build e Chrome desktop/mobile passaram: sete miniaturas carregadas, coleta manual e mochila sem erros. Capturas em `qa/drop-world.webp`, `qa/drop-mobile.webp` e `qa/drop-miniatures.webp`. Avaliação visual humana pendente.

Venda, desmontagem, materiais, moeda, cofre, poções e fabricação ficam para a base/economia. Sem descarte livre nesta etapa. Com sete slots e mochila ocupados, novas coletas ficam bloqueadas. Ícones e aparência mista precisam de avaliação humana, especialmente no celular. Persistência do laboratório é temporária; reload foi validado separadamente na campanha.
