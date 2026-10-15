# Etapa 7 — Expedição de quatro

## Escopo

Uma sala comporta **Guerreiro, Hunter, Astral e Domador de feras**, sem repetir classes. Mesma campanha e build web; sem login, matchmaking, servidor de mundo persistente ou save em nuvem. O anfitrião continua simulando o combate.

Teste reservado: [abrir laboratório](https://echosofdante.vercel.app/party-playtest.html?region=base&kit=basic&v=0.1.99). `Esc → Jogar com amigo → Criar sala`, copiar convite e abrir nos outros aparelhos. Cada convidado confirma um personagem próprio. O laboratório fornece quatro personagens temporários; equipamentos, créditos, XP e progresso reais ficam preservados. Escolher região/classe no painel antes de criar a sala. Para testar um boss diretamente, escolha sua região antes de abrir a sala: o encontro atual permanece vivo e os acessos anteriores são preparados somente no laboratório.

**A publicação do frontend não comprova a atualização do relay.** O serviço público precisa responder `protocol: 10` e `capacity: 4` em `/coop/health`; versões antigas são recusadas com uma mensagem, preservando o solo.

## Participantes e campanha

- Identidade estável por vaga; o token de reconexão nunca entra no convite nem na consulta pública do lobby.
- Quatro slots mostram classe, nome e conexão. Classe ocupada fica indisponível na seleção; o relay repete a validação atomicamente para impedir corridas entre convites.
- Cada participante mantém nível, equipamento, consumíveis, recursos de classe, cooldowns, morte e recompensas próprios. A campanha, descobertas e portas seguem o anfitrião.
- Todos podem investigar, coletar seus itens e ativar passagens físicas. O anfitrião escolhe destinos no atlas da base. Retornar à base leva a equipe e continua proibido durante boss ativo.
- Anfitrião usa um mapa de atores; visitantes apresentam os outros três jogadores e o mundo recebido. Não há uma segunda simulação de IA, dano ou companheiros nos visitantes.
- Os 14 destinos atuais continuam ligados à mesma expedição: Base, Floresta, Cavernas/Exterior, Warden, Vale, Siroco, Dunas, Soterrado, Fratura Boreal, Galerias, Vésper, Costa das Cinzas, Obsidiana e Caldeira.

## Combate, dificuldade e morte

Resistência inicial por tamanho da equipe: **1 pessoa = 100%; 2 = 140%; 3 = 180%; 4 = 220% da vida original**. Preserva a proporção de HP ao entrar/sair alguém. Dano, velocidade, IA, telegraphs, ataques e valores do solo continuam iguais; não escala com equipamento. É uma primeira calibragem, sujeita ao playtest.

Inimigos consideram todos os participantes vivos/conectados. Zonas do Astral contribuem para o controle; o pulso do Domador de feras considera todos os aliados vivos próximos e possui quatro posições de feedback. Não revive aliados e mantém custo, cura e alcance anteriores.

Durante boss, mortos aguardam enquanto existir alguém vivo. Derrota coletiva permite reiniciar um único encontro; vitória recupera os caídos. A penalidade existente de 10% dos créditos usa um recibo individual por morte; XP, materiais e equipamento permanecem. Nenhum boss novo ou alteração nos kits.

## Recompensas, menus e reconexão

- Loot e recursos são endereçados ao ID do dono; cada visitante recebe somente seus drops. XP adquirido e recompensas de boss usam recibos pessoais cumulativos.
- Relay confirma entregas antes de retirar as filas do anfitrião. Recibos impedem duplicação em repetição/reconexão; limites de inventário e armazenamento continuam válidos.
- Poção usa contagem e recarga individuais, inclusive nas travessias. Equipamento, espaço da mochila e consumíveis atualizam o perfil enviado ao anfitrião.
- No gamepad do Astral, **Y troca elemento e X usa poção**; nas demais classes a poção continua em Y. H permanece igual para todos.
- Travessias preservam o HP dos vivos e recuperam caídos em local seguro. Um visitante vivo pode acionar portal ou retorno à base mesmo se o anfitrião tiver caído fora de um boss. Descobertas compartilhadas não sobrescrevem o atlas da jornada pessoal.
- Menus, registros, aperfeiçoamentos e mochila pessoais não pausam a equipe. **Abrir menu não concede invulnerabilidade**: faça a preparação em local seguro. Solo conserva sua pausa.
- Queda curta reserva a classe/vaga por 20 segundos após a desconexão detectada. Comandos antigos são cancelados nas travessias. Reconectar recupera a mesma identidade e recibos.
- O heartbeat aceita atividade como prova de vida e tolera pong atrasado; a limitação de mensagens admite rajadas curtas sem remover o controle de taxa média.
- Sob congestionamento, snapshots antigos podem ser descartados, mas mensagens de passagem, vagas e recibos permanecem confiáveis. Ações breves ficam retidas até envio/consumo. Um hold já iniciado tolera até 1,5 s sem pacote, mantendo movimento parado; cancelamento/desconexão vence e não dispara a habilidade automaticamente.
- Avisos de coleta e moeda permanecem pessoais; descobertas narrativas seguem compartilhadas mesmo quando a tela local do anfitrião mostra morte ou outro aviso.
- Saída do anfitrião encerra a sala para todos, com escolha explícita entre jornada solo e menu. Não há migração de anfitrião nem recuperação da sala após reiniciar o serviço.

## Publicação

`render.yaml` usa `autoDeployTrigger: commit`. Esse campo depende da integração Git do serviço no painel do Render. A [documentação oficial](https://render.com/docs/deploys) informa que URLs públicas de repositório sem provedor Git conectado exigem deploy manual. Não incluir deploy hooks ou credenciais no jogo, no convite ou no Git.

O health passa a informar protocolo, capacidade e `RENDER_GIT_COMMIT`, quando disponível. Atualizar frontend e relay juntos; confirmar o health antes de declarar cooperativo público validado.

### Validação pública — 14/10/2026

Frontend Vercel e relay Render confirmados na entrega **0.1.99**, commit `c529cbf345046f6b4fdc360aea03757a7fbb4f6a`: health informa **protocolo 10, capacidade 4 e classes exclusivas**. O usuário concluiu o deploy pelo painel após um incidente do Render que atrasava builds; essa publicação manual não comprova o funcionamento do gatilho automático dos próximos commits.

[QA público](public-qa/report.json): passou com quatro contextos Chrome independentes na URL real, sem relay local, mocks de rede ou hooks DEV. Convites com confirmação, bloqueio de classe ocupada, escolha de Astral, criação de Domadora de feras feminina, quatro participantes recebendo snapshots enquanto o anfitrião usa o menu, encerramento para os três visitantes e retomada da jornada própria. Zero erros JS/assets; ao terminar, o serviço informou zero salas e zero conexões. [Captura das quatro vagas](public-qa/four-slots.png).

Esse ensaio valida conexão e fluxo público do lobby; não substitui a campanha humana em quatro aparelhos. O laboratório está disponível para esse playtest. Aguardar aprovação antes do prólogo.

## QA e avaliação humana

Scripts desta etapa:

```text
npm run typecheck
npm run build
node scripts/qa-party-protocol.mjs
node scripts/qa-party-four.mjs
node scripts/qa-party-production.mjs
node scripts/qa-party-performance.mjs
node scripts/qa-dante-journey.mjs http://localhost:5184/?qa=play docs/party-four/solo-qa
```

Os relatórios JSON distinguem testes de protocolo, menus, simulação, fixtures DEV e apresentação. Quatro contextos Chrome compartilham uma máquina: a câmera visível é alternada no QA funcional e o relógio de foco é mantido ativo por fixture, mantendo as quatro simulações e conexões. Isso não representa uma medição de quatro computadores físicos. Resoluções: 1280×720, 1366×768, 1920×1080 e 844×390; touch emulado e Gamepad API mock. O teste de produção usa a build compilada em `http://localhost:5190`, menus reais e frames WebSocket, sem acesso aos hooks DEV.

[QA funcional](qa/report.json) e [QA do protocolo](protocol-qa/report.json): passaram. Quatro kits, controle individual, poções, XP, equipamento, materiais, dano, mortes e reinício; introdução/fases/morte/recompensa dos quatro bosses; 14 destinos; portal por cada visitante e retorno com anfitrião caído; quatro resoluções; reconexão e encerramento da sala. Fixtures de posicionamento/dano aceleram a campanha: isso não comprova balanceamento nem representa uma luta humana completa.

Três reinícios coletivos da Floresta: **440 objetos, 250 texturas, 25 tweens, 3 atores remotos** em todos os ciclos. Zero erros JS/HTTP de assets no relatório. Com quatro Chromes na mesma máquina, o anfitrião mediu cerca de **37 FPS** no fim do ensaio, e visitantes cerca de 58–59 FPS; não anunciar 60 FPS de quatro aparelhos a partir disso. O [ensaio separado do anfitrião](performance-qa/report.json) usa uma câmera visível e três clientes Node de rede para distinguir esse custo.

Ensaio separado: aproximadamente **54–58 FPS**, cinco amostras aquecidas por região, em Floresta, Cavernas, Warden, Siroco, Fratura Boreal e Caldeira; três kits remotos usando básicos/Q. Registra o custo da simulação do anfitrião, não latência pela internet, quatro GPUs ou balanceamento de lutas completas. Arenas foram medidas sem forçar todas as fases dos bosses.

[Menus na build de produção](production-qa/report.json): passaram com quatro Chromes, sem hooks DEV. Confirmação de personagem, classe duplicada bloqueada, escolha explícita de Astral após reload, criação de Domadora de feras feminina com nome contendo A/L, snapshots durante menu do anfitrião e restauração da jornada pessoal após encerramento. Captura: [quatro vagas](production-qa/four-slots.png).

O QA histórico da jornada foi atualizado para escolher os aprimoramentos já existentes antes de enviar teclas de gameplay e esperar os **22 XP** regionais do Vale introduzidos na etapa 4. Não foram alterados mapa, recompensas ou a curva para adequar o teste.

[Regressão solo](solo-qa/report.json): passou. Floresta → três Echoes → fissura/mecanismo → Cavernas → Primeiro Eco → Warden → Vale; diário pausa/recompõe o relógio, habitantes renovam sem duplicar, três mortes/reloads mantêm estado e objetos estáveis, reset confirmado, armazenamento indisponível, gamepad mock e touch com cancelamento de Q ao abrir registros. **Typecheck e build passaram**; permanece o aviso já existente de tamanho do bundle Phaser, sem dependências novas.

Arquivos de implementação: `server/relay.mjs`, `CoopSession`, `PartyExpedition`, `PartyActor`, `PartyLobby`, `CoopInvitation`, `GameScene`, `ApplicationShell`, `CharacterSelection`, `BasePanel`, `Hud`, `EquipmentDrops`, `ResourceDrops` e o pool de feedback de cura do `XenobinderCombat`. Laboratório: `party-playtest.html`, entrada compartilhada de threat-playtest, CSS, Vite e biblioteca de testes. Documentação/versão e scripts QA completam a entrega; assets, mapas, física, câmera, Player e controles permanecem intactos.

**Playtest humano necessário:** quatro aparelhos, convite e escolha de classe, combate misto, cura em grupo, portais pelo visitante, morte individual/coletiva, bosses e retomada solo. Avaliar justiça, ritmo, legibilidade e latência reais. A etapa 8, prólogo, permanece aguardando essa validação.

## Arquitetura e limites

Cenário estático e assets raster/bake permanecem intactos. No máximo três atores remotos no anfitrião e três apresentações nos visitantes; pools de criaturas e projéteis são reutilizados. Nenhum asset novo foi necessário. As filas de entrega são confirmadas e esvaziadas; históricos possuem limites.

Não há autoridade de servidor para a simulação completa: um anfitrião modificado ainda pode adulterar o mundo. Perfil, inventário e progresso continuam locais a cada navegador. Serviço gratuito pode hibernar e reinícios encerram salas; reconexão não substitui persistência de servidor. Desempenho e balanceamento em dispositivos reais precisam de playtest.

O anfitrião deve manter a aba do jogo ativa durante a sessão; o navegador pode limitar sua simulação em segundo plano. A reconexão recupera transporte/identidade, não migra a simulação para outro jogador.
