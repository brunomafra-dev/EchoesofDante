# Incandescente — basalto e descarga · 0.1.154

[Enfrentar o Incandescente vivo](https://echosofdante.vercel.app/campaign-playtest.html?titan=1&v=0.1.154)

Em 27/10/2026 o usuário pediu seguir após a revisão 0.1.153 do Vésper. Esta autorização encerra a espera anterior e inicia somente o Incandescente, sem novo capítulo. A dificuldade e a apresentação desta entrega aguardam playtest humano.

## Mecânica

Três blocos caem nas posições anunciadas e viram abrigos físicos de basalto. O golpe no chão tem contato local e depois uma frente de pressão em expansão. A frente destrói os blocos, mas não alcança sua sombra: o anel visível também perde esses setores. A absorção da pressão provoca uma abertura do peito após a descarga. Sem absorção, há apenas recuperação protegida curta. As fissuras e golpes seguintes impedem permanecer no mesmo abrigo durante todo o encontro.

Cada fase mantém um ciclo de formação de basalto e descarga; as últimas intercalam fissuras e varredura antes da descarga. Os avisos fixam suas posições; não perseguem o jogador depois de marcados. Dano ocorre no contato, com queda das pedras, pose de impacto, anel, fragmentos e som. Nenhum texto ensina a solução no combate.

HP-base **950 / 1710 no normal solo**, mesmos 260 XP e aperfeiçoamento único. Placas fechadas recebem 18% do dano; peito aberto recebe 1,7×. A recuperação longa dura 3400 ms, com abertura de 240 a 3160 ms. Fases em 65%/30% só mudam no repouso, preservando a abertura conquistada.

| Golpe | Aviso | Contatos desde EXECUTE | Dano-base / normal solo |
|---|---:|---:|---:|
| Varredura | 900 ms | 280 ms | 38 / 53 |
| Golpe no piso | 1250 ms | 240 ms | 40 / 56 |
| Frente de pressão | mesmo golpe | inicia em 950 ms; 1050 px/s | 46 / 64 |
| Blocos | 1050 ms | 240, 540, 840 ms | 34 / 48 |
| Fissuras | 1100 ms | 220, 940, 1660 ms | 32 / 45 |

Três abrigos e quatro impactos são reutilizados. Texturas derivadas do basalto pintado existente são preparadas uma vez; arco desenhado ao iniciar a onda e quando ela encontra cada bloco, escalado durante a propagação. Sem desenho estático por frame ou criação de objetos por golpe. Figuras completas existentes: preparação, golpe, varredura e peito aberto. Pintura, terreno, dimensões e rochas originais preservados.

Anfitrião resolve colisões/dano; convidado apresenta as mesmas pedras, setores e impactos. Obstáculos temporários do convidado vêm das imagens de basalto ativas do contrato existente. **Protocolo 15**. Música e mixagem aprovadas preservadas.

## Laboratório isolado

Namespace `dante-titan-combat-v1`, separado por classe e dos saves/configurações reais. Simula três Ecos, mecanismo, Primeiro Eco, Warden/Soterrado/Vésper e pistas, sinais da Costa/Obsidiana e registro de basalto das Forjas. Quatro relatórios principais anteriores entregues; regionais pendentes. Chegada com 1800 XP, equipamento normal, aperfeiçoamentos de chegada e cinco poções disponíveis. **Incandescente vivo, vitória/recibo/registro térmico pendentes**. Nenhuma preparação existe como atalho na campanha.

## QA e aprovação

- [x] Mecânica, dano/abrigos, colisões e Dash, limites da arena, quatro classes, pools.
- [x] Tentativas de auto attack na frente/atrás e acompanhando o boss; vitória com movimento.
- [x] Solo/dupla, registro com E, recibos/reload e saves antigos.
- [x] Touch/gamepad emulados, resoluções e inspeção visual.
- [x] Typecheck, build e diff.
- [ ] Commit/push, sincronização e publicação.
- [ ] Playtest humano; não iniciar outra etapa antes dele.

[Mecânica](qa/combat/combat.json): caminho comum de dano (100 vira 18 fechado e 170 aberto), três blocos físicos após queda, Dash bloqueado pelo basalto, onda/sombra/dano real, dois contatos do golpe de piso e dois contatos de fissura separados. Dash real atravessa a frente; limiar de fase não consome abertura. Trinta e duas disposições nos cantos mantêm pedras distintas e fora de corpo/rochas. Pool permanece em **192 objetos de cena / 20 de apresentação cooperativa**, sem crescimento ao repetir ataques. Janelas de inspeção são prolongadas por fixture; não medem tempo de reação humano.

[Vitória completa](qa/playthrough/playthrough.json): Guerreiro de chegada (1800 XP, 155 HP), boss normal com 1710 HP, WASD/Dash/Q/mouse reais. Três fases e cinco aberturas; nenhum ajuste de HP, posição, IA, tempo, invulnerabilidade ou poções durante o combate. Menor HP amostrado 155. O controlador lê estados e planeja caminhos, conhecendo a solução; não equivale a descoberta humana. A escolha original de aperfeiçoamento é resolvida antes de caminhar até o registro com E; reload conserva 2060 XP, uma vitória e registro térmico recuperado.

[Doze tentativas de auto attack](qa/auto/rear-auto.json): quatro classes, em posição frontal fixa, traseira fixa e seguindo a retaguarda com WASD. Todas perdem com o boss vivo; sem Dash/poções ou alterações de combate após a colocação inicial e primeiro ataque. Seguir as costas considera obstáculos, mas não reage aos avisos dos golpes. Não garante dificuldade contra todo equipamento ou nível.

[Ciclo, contato e save antigo](qa/lifecycle/lifecycle.json): figura inteira permanece na preparação antes do contato e passa ao golpe ao aplicar dano, inclusive no golpe letal. Duas mortes por ataques distintos limpam blocos, pedras em queda, onda, marcas e aviso; R restaura um único boss vivo com HP original. Fixture schema 1 é injetada antes dos imports para o flush da página anterior não sobrescrevê-la; parser preserva XP e três recibos anteriores, mantendo registro de basalto pendente. Teclado real para no limiar selado (x=1962); E no registro térmico não conclui um boss vivo.

[Coop](qa/coop/coop.json): dois Chrome e relay local real, convite isolado, três círculos físicos iguais entre host/convidado com tolerância de 0,001 px da matriz Float32, movimento/Dash real do convidado e comandos exatos do arco replicados. Convidado recebe 68 HP sem abrigo e mantém HP real na sombra; projéteis reais aproveitam abertura. Recibo de 260 XP por membro uma vez e reconexão sem repetição. São provas isoladas com posições/HP preparados, anfitrião invulnerável para inspeção, recuperação prolongada e HP do boss reduzido somente no teste final de recibo; vitória vem de projétil real do convidado. Não representam uma luta completa balanceada de duas pessoas.

[Controles](qa/controls/controls.json): quatro classes com CDP multitouch, oito direções independentes, ataque para trás, giro sem disparo, carga/soltura/cancelamento e modal. Layouts 568×320, 844×390, 1024×768 e 1600×530, três reconstruções sem duplicar HUD e gamepad mock. Boss vivo congelado para isolar entradas; não substitui teste em aparelho físico.

[Build compilada](qa/compiled/public.json): Chrome sem globais DEV, chegada/reload, teclado até o gatilho real, arte pintada e trilha original do Incandescente, controles de audição e saves/configurações sentinela preservados. `npm run typecheck`, `npm run build` e `git diff --check` passaram. Aviso conhecido do chunk Phaser permanece.

Capturas inspecionadas durante a implementação: chão/basaltos físicos, anel com lacunas e personagem na sombra. Textura da pedra reaproveita a pintura inteira existente dentro dos seus limites transparentes, sem acrescentar membros ou trocar terreno. A leitura móvel e o convidado recebem inspeção separada.

Automação não aprova diversão, celular/gamepad físico ou grupo humano de quatro. Duração da campanha continua sem medição humana.

Scripts reproduzíveis: `scripts/qa-titan-counterplay-154.mjs`, `qa-titan-auto-154.mjs`, `qa-titan-playthrough-154.mjs`, `qa-titan-lifecycle-154.mjs`, `qa-titan-coop-154.mjs`, `qa-titan-controls-154.mjs` e `qa-titan-public-154.mjs`.
