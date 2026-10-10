# Etapa 4 — Progressão, ameaça e dupla

Última etapa da base/retorno aprovada pelo usuário. Esta entrega revisa a campanha para equipamentos e poções e corrige diferenças de funcionamento do visitante. **QA técnico e playtest humano são avaliações separadas.** Astral permanece para a etapa seguinte, após validação.

## Teste reservado

[Abrir laboratório](https://echosofdante.vercel.app/threat-playtest.html?region=forest&kit=basic&v=0.1.89) · [Warden](https://echosofdante.vercel.app/threat-playtest.html?region=warden&kit=basic&v=0.1.89) · [Biblioteca](https://echosofdante.vercel.app/test-library.html)

Selecione região, classe e equipamento inicial/básico/avançado. O nível da região fica constante entre comparações. Recolha o painel para jogar. Cada tentativa começa com 237 créditos e seis poções; recarregar reinicia o teste. Somente neste laboratório, chaves de save de Dante são redirecionadas para memória: personagens e campanha reais permanecem intactos. Convites criados aqui abrem o mesmo laboratório para o amigo, com personagem temporário da outra classe. Não use uma alteração de região no painel durante a sala; atravesse os portais normalmente.

## Curva fixa

Multiplicadores sobre os valores próprios de cada espécie/boss; não dependem de equipamento, nível ou poções. Velocidade, IA, composição dos encontros, telegraphs e janelas de reação continuam existentes.

| Região | Vida | Dano | XP por criatura comum |
| --- | ---: | ---: | ---: |
| Floresta | 1,00 | 1,00 | 15 |
| Cavern inicial | 1,12 | 1,08 | 18 |
| Deep Cavern | 1,22 | 1,10 | 20 |
| Deeper Cavern / Exterior | 1,35 | 1,15 | 22 |
| Vale | 1,30 | 1,12 | 22 |
| Siroco | 1,40 | 1,20 | 25 |
| Dunas | 1,55 | 1,25 | 28 |
| Fratura Boreal | 1,60 | 1,30 | 30 |
| Galerias | 1,75 | 1,35 | 34 |

O Vale oferece um pequeno respiro depois do primeiro boss. Bosses: Warden **1125 HP / 120 XP**, Soterrado **1233 HP / 180 XP**, Vésper **1760 HP / 220 XP**; dano ×1,15 / ×1,25 / ×1,40, respectivamente. Todos concedem seu ponto de domínio uma única vez por personagem. Saves antigos com Warden derrotado reconhecem o marco sem conceder XP retroativo. Na dupla, permanece o ajuste anterior de **+40% de HP**, mantendo o percentual de vida ao entrar/sair; dano não ganha multiplicador cooperativo adicional.

O limite atual, conferido no código, é **nível 10**. Permanece para avaliar a curva antes de ampliá-lo.

## Economia revisada

Regras da etapa 3 mantidas após revisão: cada morte comum produz **4/8/12 créditos + 1 material** regional; equipamento aparece a cada **12 mortes comuns** na sessão. Bosses mantêm item garantido, **25/50/75 créditos + 6 materiais**. Cada jogador precisa recolher seus recursos e equipamento; são pessoais.

Fabricação por peça: **35 créditos + 6 materiais**, **70 + 8**, **105 + 10**. Uma receita corresponde aproximadamente a 9/9/10 mortes comuns da respectiva família, sem venda, boss ou gastos concorrentes. Forja oferece uma alternativa previsível ao drop ocasional. Poção custa **12 créditos**, cura **35% do HP máximo**, recarga **8 s**, limite **20**. A cura não foi fortalecida para compensar dificuldade.

Morte: perde **10% dos créditos carregados, arredondado para baixo**. Não desconta XP, materiais, itens, cofre nem poções. Exemplo: 237 → 214; nova morte: 214 → 193. No visitante, identificação única da morte e desconto são persistidos na mesma escrita; repetir snapshot/recibo não cobra novamente. Falha de armazenamento deixa a operação pendente para repetir, sem escrita parcial.

## Cooperativo auditado

- Visitante usa **seu nível, HP, equipamento e aprimoramentos**. Antes, herdava temporariamente o nível/aprimoramentos do anfitrião. Pode investir seus próprios pontos; recompensas dos bosses presentes na visita são pessoais, sem copiar flags da campanha solo.
- Dash usa a mira atual antes de iniciar. Recargas de Dash/Q enviam duração e disponibilidade reais para o HUD.
- Perfil atualizado pela subida de nível/equipamento não cancela mais o input/carga em andamento.
- Mira apresentada localmente, interpolação e extrapolação visual limitada a 120 ms entre snapshots; movimento/dano permanecem autoritativos no anfitrião. Poses reais de preparação, corte e release são replicadas; cues de Dash, carga e dano chegam ao visitante.
- Visitante aciona portais por **E/A/touch** e pode clicar no portal ativo quando está próximo, usando a mesma ação de interação. Condições de desbloqueio continuam iguais. Saída da base não consome mais a interação do visitante antes do envio.
- Durante boss, um caído aguarda o aliado vivo. Só a derrota da dupla permite reiniciar; o botão de renascer também fica oculto no touch enquanto aguarda. Vitória recupera o caído no ponto seguro do encontro. Fora de boss, visitante pode renascer perto do anfitrião; anfitrião pode reiniciar a região.
- **Relay e frontend precisam do protocolo 5**. Blueprint mantém deploy automático por commit. Reiniciar o serviço encerra as salas em memória; crie uma sala nova após atualização.

## Validação

Scripts e evidências em [qa/](qa/). Chrome headless, contextos independentes, relay WebSocket real local; touch CDP e Gamepad API mock. Fixtures DEV de posição, capítulo, morte e HP reduzido são explicitamente usadas no QA de cobertura da campanha. Tentativa separada do Warden usa HP normal e o kit comum, sem invulnerabilidade ou redução de HP durante a luta.

Typecheck e build passaram; permanece o aviso anterior sobre o tamanho do bundle Phaser. [Campanha](qa/campaign/campaign.json): Floresta/Ecos/passagem/Cavern, regiões posteriores e três bosses com dano, fases, XP/itens pessoais, recargas, morte/respawn e retorno à jornada solo; sem erros JS/assets. [Comparação de poder](qa/balance.json): quatro regiões × três conjuntos, dano/XP reais e recibos de morte sob falha de armazenamento. [Economia](qa/economy/rewards.json): 21 receitas, cobrança de materiais e créditos, 12 mortes/respawn e frequência de drops conservada. [Cooperativo](qa/coop.json): duas conexões reais, portais por clique/E, Dash/Q, derrota individual/dupla, vitória e troca de visitante; keyboard/mouse, touch CDP e Gamepad API mock. Resoluções 1280×720, 1366×768, 1920×1080 e 844×390.

[Warden com HP normal](qa/warden-playthrough/qa-report.json): equipamento avançado, três fases/cinco padrões, vitória em aproximadamente 33 s, sem redução de HP ou invulnerabilidade durante a luta. É um motorista automatizado que consulta os telegraphs; não representa a dificuldade para uma pessoa.

Desempenho local: cerca de **58–60 FPS** nos contextos pareados da campanha e **57–59 FPS** na Floresta do teste de economia. Três respawns do visitante conservaram 153 objetos, 185 texturas e três tweens no anfitrião. Cenário, bake/cache e assets preservados. Os números são amostras de Chrome headless nesta máquina, sem garantia em hardware móvel. Nenhum teste em aparelho físico foi realizado neste ambiente.

## Limitações e checklist humano

Arquivos: `src/config/threat.ts`, economia/progressão/LocalJourney, integração no GameScene, Player/Hud e disponibilidade de respawn touch; CoopSession/PartyActor/PartyExpedition, convites e relay; entrada `threat-playtest.html`, Vite, biblioteca, QA, versão e documentação. Nenhum asset de jogo foi criado ou alterado.

Rede continua dependente da latência e do navegador do anfitrião, com snapshots a 10 Hz; extrapolação visual não elimina atraso de dano. Sem novo anticheat, migração de anfitrião, pathfinding ou save em nuvem. Sem novos mapas, assets, classes ou habilidades.

Com seu amigo: conferir movimento, mira, ataque, Dash, segurar/soltar Q, portais por clique e interação, poção, queda de um aliado, derrota da dupla e vitória com aliado caído. Comparar equipamento básico/avançado nas mesmas regiões e avaliar se a progressão é justa e se vale fabricar/coletar. **Aguardando validação humana antes da etapa 5.**
