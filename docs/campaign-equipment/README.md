# Campanha cooperativa e primeiros equipamentos

## Experiência

A mesma sala acompanha as dez regiões: Floresta → Cavern (incluindo Deep/Deeper/Exterior/First Echo) → Warden → Vale → Siroco → Dunas → Soterrado → Fratura Boreal → Galerias do Degelo → Ninho da Geada / Vésper. As passagens mantêm suas condições de exploração. Qualquer participante pode investigar e iniciar a travessia; ambos mudam de região.

O anfitrião conserva a simulação de combate e sua campanha. O visitante envia ações, recebe movimentos, fases, telegraphs, projéteis, emersão do Soterrado, portas e sequências de morte. Não executa outra IA. Cada ataque de boss avalia os dois jogadores e tem um orçamento de um acerto por participante por ativação. Resistência de inimigos continua em 140% com a dupla, sem multiplicar dano, velocidade ou reduzir avisos. As fases de Vésper usam porcentagens da vida máxima ajustada.

## Loot e equipamento

- Nove itens fixos, distribuídos entre Floresta/Cavern, Siroco e gelo.
- Três slots: **arma, armadura, acessório**, acessíveis em **MENU → EQUIPAMENTO**. Compatível com teclado, direcional/A/B e toque.
- Primeiro inimigo derrotado na região e depois a cada quatro derrotas podem deixar um item ainda não adquirido. Na dupla, reaparecem opções também para o visitante; não há stacks de duplicatas.
- Coleta automática a 55 unidades. Qualquer participante coleta; ambos recebem uma cópia própria. Sem disputa de loot.
- Warden: Emissor de ressonância; Soterrado: Prisma soterrado; Vésper: Coração do degelo. Recompensas de boss entram diretamente na coleção, para não se perderem em morte/travessia antes de alcançar o corpo.
- Emissores aprimoram a arma da classe (+10/16/22% de dano); não trocam a identidade ou aparência do sabre/rifle. Armaduras: +12/20/28 HP e 3/5/7% de redução de dano. Acessórios: +10/16/22% ao Q carregado. Sem alteração de controles, ataques, cooldowns ou upgrades existentes.
- Equipar é uma decisão manual e não cura. Cada personagem conserva seus itens e slots; não há equipamentos globais entre personagens.

Não há raridades aleatórias, affixes, venda, descarte, crafting, inventário de pilhas ou novas armas animadas nesta etapa. Itens de chão não coletados desaparecem ao reiniciar/sair da região; recompensas de boss e itens coletados ficam salvos.

## Persistência e dupla

Saves anteriores continuam válidos: equipamento ausente é coleção vazia, sem reset de campanha. IDs e slots são validados. Equipamentos/XP recebidos pelo visitante são escritos em sua jornada própria com recibo cumulativo; repetir pacote/reconectar não duplica recompensas. Uma falha de armazenamento mantém o aviso existente e permite tentar salvar novamente. Flags e região da campanha visitada continuam pertencendo ao anfitrião.

O kit base de nível/aprimoramentos segue temporariamente o anfitrião durante a visita; equipamentos são pessoais. Ao sair, o visitante recupera sua região e seu kit base, conservando XP e itens ganhos. Se apenas o visitante morrer, R o traz de volta perto do anfitrião. Morte do anfitrião mantém o comportamento de reinício compartilhado: os dois recomeçam o encontro no checkpoint. Não há migração de anfitrião, save remoto ou anticheat; o relay valida papéis/região/época e confia na simulação do anfitrião.

## Renderização e limites

Arte, bake de cenário e controles existentes foram reutilizados. Nenhum asset novo. Até nove drops reutilizados por cena; um espelho de boss limitado a quarenta objetos (os bosses atuais usam menos). Presentation packets a 10 Hz; telegraphs copiam comandos numéricos dos Graphics já existentes, sem reconstruir cenário nem simular ataques no visitante. Pools limitados e cleanup no shutdown. A latência da rede ainda afeta a resposta do visitante; playtest em aparelhos distintos é necessário.

## Publicação

O relay novo anuncia `protocol: 2` e `campaign: true` em `/coop/health`. O cliente detecta servidor anterior e informa que aguarda atualização, em vez de permitir uma travessia que ele rejeitaria. `render.yaml` solicita deploy automático por commit; a configuração precisa estar sincronizada no Blueprint do serviço existente. [Referência oficial do Render](https://render.com/docs/blueprint-spec#autodeploytrigger).

O serviço público ainda deve ser conferido após a publicação. Se continuar com o código anterior, abrir **echoes-of-dante-rooms → Manual Deploy → Deploy latest commit**. Isso é uma atualização da hospedagem; os jogadores continuam usando apenas **JOGAR COM AMIGO**, convite e seleção de personagem.

## QA

`npm run typecheck`, `npm run build`, `scripts/qa-campaign-equipment.mjs`, `scripts/qa-coop-protocol.mjs`, regressão de convites/continuidade e jornada solo. O QA da campanha usa dois contextos Chrome independentes e WebSockets reais locais; posições/pré-requisitos/HP de bosses são controlados em DEV para cobertura, sem declarar um playtest físico. Artefatos em [qa](qa/). Teste humano com dois dispositivos/redes é necessário para avaliar ritmo, dificuldade e latência.

Resultados medidos em Chrome headless nesta máquina:

- Jornada solo: aproximadamente 59 FPS, zero erros JS, 149 objetos/3 tweens estáveis em três respawns.
- Continuidade em dupla: aproximadamente 58/58 FPS; três viagens de ida/volta, reconexão, salvamento após falha de armazenamento e reinício compartilhado passaram.
- Campanha/bosses em dois contextos: aproximadamente 56/55 FPS; os dez destinos, tiros do Hunter nos três bosses, fases, sequências de morte e equipamento pessoal passaram. Um sweep real do Warden atingiu ambos uma única vez. Três reinícios glaciais mantiveram 136 objetos/2 tweens.
- Dano/equipamento: ataque controlado de 20 → 22 com emissor, 24 com acessório no Q; armadura elevou HP máximo sem curar, reduziu dano e persistiu após reload. Save antigo sem campo de equipamento e recibos repetidos com zero XP passaram.
- Convites na build de produção: criação/cópia, seleção/criação de personagem, sala cheia, cancelamento, convite inválido, saída do anfitrião e retorno solo passaram, com zero erros JS/assets. Protocolo: papéis, dez regiões, épocas de travessia, recibos e slots inválidos passaram.
- Gelo: joystick, ataque, Dash e hold/drag/release do Q passaram por CDP touch; movimento/mira/ataque/Dash/Q passaram com Gamepad API mock. Resoluções cobertas: 1280×720, 1366×768, 1920×1080 e 844×390. Nenhum teste físico foi realizado nesta etapa.

Esses números são amostras locais, não garantias de FPS em aparelhos distintos. Há um aviso de build já existente para o tamanho do bundle Phaser. A apresentação do boss visitante acompanha snapshots a 10 Hz, sem interpolação dedicada; avaliar suavidade/latência em rede real antes de ampliar a quantidade de entidades.
