# Expedições em dupla · 0.1.74

Duas pessoas, mesma build web, Guerreiro ou Star Hunter, sem login. Esta etapa melhora a continuidade regional e a retenção de XP; não implementa campanha inteira ou chefes em dupla.

## Como jogar — fluxo do jogador

1. Abra [Echoes of Dante](https://echosofdante.vercel.app/).
2. **JOGAR COM AMIGO → CRIAR SALA E CONVIDAR**.
3. **COPIAR LINK DE CONVITE** e envie ao seu amigo; compartilhar nativo aparece quando o navegador oferece essa opção.
4. Ele abre o link e entra com seu personagem ativo. A dupla começa automaticamente quando ele conecta. Se não houver personagem, a criação preserva o convite até entrar.

Também é possível colar o link completo ou o código em **ENTRAR NA SALA**. Não há login, comando, porta ou endereço de servidor na interface dos jogadores. Seu personagem/progresso solo continuam locais.

**Publicação validada automaticamente:** o responsável criou `echoes-of-dante-rooms` no Render. Em 08/10/2026, a API publicada da Vercel respondeu 200 com `ready: true` e o endereço WSS real. Dois perfis Chrome acessaram a URL pública, criaram/abriram o convite, entraram automaticamente e trocaram snapshots/movimento via Render. Saída/restauração solo e encerramento passaram, sem erros JS/assets. [Resultado e capturas públicos](public-qa/). O teste usa esta máquina e a internet real, sem mock de API; não substitui dois aparelhos físicos em redes diferentes.

Convites levam somente `?sala=CODIGO`, sem credencial de reconexão, nome ou save. O parâmetro é removido após entrar/cancelar; sair/recarregar não reentra automaticamente. Salas cheias, encerradas e convites inválidos permitem voltar ou tentar outro convite. Se clipboard não estiver disponível, o link é selecionado para cópia manual.

## Serviço público — responsável pelo jogo

O jogo continua em `https://echosofdante.vercel.app/`. As salas estão em `wss://echoes-of-dante-rooms.onrender.com/coop`. O endereço público está em `api/coop-config.js`; não é credencial. `render.yaml` prepara **um relay Node** no plano Free, usando a implementação existente, sem banco de dados ou assets do jogo.

O serviço já foi criado pelo responsável. A implantação da branch `main` na Vercel passa a retornar `ready: true` e o endereço real em `/api/coop-config`. Não é necessário adicionar variável de ambiente para esse serviço. Depois valide também dois aparelhos em redes diferentes criando e abrindo um convite.

Se a hospedagem mudar, `COOP_RELAY_URL` na Vercel permite substituir o endereço WSS sem editar o código, seguido de Redeploy. Configuração explícita inválida continua sendo rejeitada. O [blueprint de publicação](https://render.com/deploy?repo=https://github.com/brunomafra-dev/EchoesofDante) permanece disponível para outra instalação; seu endereço gerado precisará ser conectado à API.

Esses passos são da publicação; nenhum jogador repete essa configuração. O navegador busca a configuração em `/api/coop-config` antes de criar/entrar na sala. A Vercel tem o endereço público padrão; dev/preview/Node integrado conservam seu `/coop` local. Uma configuração inválida não pede endereço ao jogador.

Escolhemos um processo central para preservar salas e credenciais em memória. [Vercel documenta que conexões novas podem alcançar instâncias diferentes e que salas em Functions precisam de armazenamento/coordenação externos](https://vercel.com/docs/functions/websockets). Não adaptamos o relay a esse modelo distribuído nesta etapa. [Render oferece conexões WebSocket públicas](https://render.com/docs/websocket); no [plano Free, a retomada após inatividade pode levar aproximadamente um minuto](https://render.com/docs/free). A primeira conexão espera até 60 s, pode ser cancelada e as reconexões existentes mantêm seus limites. O Free é uma opção de playtest, sem promessa de disponibilidade imediata.

O relay usa uma única instância. `COOP_ORIGINS` inclui a URL pública informada; outras URLs de preview/customizadas precisam ser autorizadas na hospedagem. Reiniciar/publicar o relay encerra suas salas. Não há migração de instância ou persistência remota.

## Desenvolvimento local

`npm run dev` inicia jogo e salas juntos. Na rede local, abra `http://IP-DO-COMPUTADOR:PORTA` nos dois aparelhos, usando a porta mostrada pelo Vite. Um convite com `localhost` só abre no computador que o gerou; isso não substitui a hospedagem pública. O computador precisa permitir a conexão pela rede local.

### Build e hospedagem

`npm run preview` também inclui as salas. Para servir a build em um processo Node, execute `npm run build` e depois **`npm start`**: jogo e salas ficam em `http://localhost:8080` (ou na variável `PORT` da hospedagem). Ambos os jogadores usam a mesma URL.

Para acesso pela internet, esse processo precisa estar publicado em uma hospedagem Node com HTTPS e upgrade WebSocket habilitado. Publicar somente os arquivos estáticos não disponibiliza as salas. O serviço público desta instalação foi provisionado pelo responsável no Render. Essa configuração é da hospedagem, não dos jogadores.

Salas disponíveis em **Floresta, Vale da Ressonância, Bacia do Siroco, Dunas Interiores e Fratura Boreal**. A dupla viaja pelos portais **Vale ↔ Siroco ↔ Dunas**, na mesma sala. Qualquer participante pode iniciar a travessia; ambos chegam à nova região. Os requisitos de exploração/ativação dos portais continuam os mesmos.

**Cavernas de campanha, Warden e Soterrado permanecem solo.** Tentar uma dessas passagens mostra um aviso e mantém a dupla na região atual. Para continuar a campanha sozinho, saia da sala pelo menu. Floresta e Fratura Boreal aceitam expedições locais, mas suas ligações à campanha ainda são solo.

## XP e jornadas individuais

- O anfitrião simula personagens, criaturas, colisões e recompensas. O visitante envia ações; não executa outra IA.
- Cada ganho de XP da expedição é concedido ao anfitrião pelo sistema existente e ao visitante pelo total cumulativo conferido no relay. **Entrar em uma sala não copia o XP anterior do anfitrião.**
- O XP do visitante é gravado em sua jornada própria durante a visita, mesmo se abrir o menu. Ao sair, seu nível é recalculado pela progressão existente e os pontos de aperfeiçoamento correspondentes ficam disponíveis.
- Durante a visita, o kit usa temporariamente nível/resistência/aprimoramentos da campanha do anfitrião. O HUD compartilhado mostra esse kit; a linha da dupla e os registros identificam o **XP pessoal ganho**. Escolhas de aperfeiçoamento ainda são do anfitrião.
- **Ecos, flags, portais, chefe derrotado, área, HP, habitats, bestiário e aprimoramentos solo do visitante não são copiados da campanha visitada.** Ao sair, ele volta à sua região solo.
- Recibo e XP são persistidos juntos em uma única escrita. Repetir um snapshot ou reconectar não concede a mesma recompensa outra vez. Os últimos 32 recibos são preservados também pelos saves solo seguintes.
- Se o armazenamento falhar, o XP fica pendente e a aplicação tenta novamente nos snapshots. Sair mostra um aviso e mantém a visita aberta até conseguir salvar. Recibos respeitam a proteção de personagem excluído. Não há save em nuvem.
- A entrada pelo menu exige salvar a jornada solo primeiro. Se essa escrita falhar, a conexão não começa; após liberar o armazenamento, é possível tentar novamente.

## Encontros e respawn

- Com uma segunda vaga ocupada, criaturas regionais têm **40% mais HP** (arredondado). Dano, velocidade, ataques, IA, quantidade e XP permanecem iguais. O percentual de HP restante é mantido ao entrar/sair da dupla; não há cura grátis.
- A resistência volta ao valor solo quando o visitante sai ou o anfitrião encerra a sala. A vaga reservada durante uma reconexão conserva o ajuste.
- Criaturas escolhem o participante conectado e vivo mais próximo. Renovação de habitats respeita a distância dos dois participantes, conservando os espaços entre encontros.
- Visitante morto reaparece perto do anfitrião vivo. Se o anfitrião morrer, qualquer participante pode pedir o reinício regional. A sala e a progressão da sessão permanecem.
- Menu do anfitrião pausa a simulação; a outra tela informa **ANFITRIÃO NO MENU**. Menu do visitante cancela suas ações.

## Rede, reconexão e limites

`server/relay.mjs` conecta as salas ao servidor web existente em `/coop`, usando `ws`. Vite dev, preview e `server/web.mjs` compartilham a mesma implementação. `/coop/health` informa o estado para diagnóstico. O navegador usa WebSocket nativo e escolhe WS/WSS automaticamente a partir da URL do jogo. Snapshots a 10 Hz, ações até 25 Hz. Pools de apresentação e os sistemas de personagem existentes são reutilizados. O relay separado (`npm run coop:server`) permanece disponível somente para instalações anteriores/avançadas.

- Mudanças de região são autorizadas pelo anfitrião e confirmadas pelo relay antes da troca local. Uma geração de região (`epoch`) descarta ações/snapshots anteriores à travessia. A lista de ligações permitidas é explícita nos dois lados.
- Queda de transporte conserva a vaga por **20 s**. O cliente tenta recuperar a sessão por até **15 s**, com credencial secreta em memória. Tanto anfitrião quanto visitante podem recuperar a conexão. Não é necessário digitar o código novamente nessa janela.
- Na queda do anfitrião, a simulação para de avançar; o visitante aguarda. Na queda do visitante, suas ações/carga são canceladas, o ator permanece e deixa de ser alvo preferencial. Ao retomar, não há ataque enfileirado do gesto anterior.
- Saída pelo menu libera a vaga imediatamente; encerrar pelo anfitrião restaura a jornada solo do visitante. Ao expirar o prazo de reconexão do anfitrião, a sala encerra. **Reload/fechar a página não recupera credenciais**, e reiniciar o relay perde as salas. Não há migração de anfitrião.
- Limites: 2 vagas, 64 salas, 128 conexões, mensagens de 64 KB, 60 mensagens/s por cliente e fila de envio limitada. Heartbeat a cada 5 s. Vetores, perfis, autoridade, sequência e região são conferidos. O anfitrião continua sendo confiável; isso não é anticheat/MMO.

| Variável | Uso |
| --- | --- |
| `PORT` | Porta do servidor integrado de produção; padrão 8080 |
| `COOP_RELAY_URL` | Override opcional da URL WSS; Vercel já tem o serviço publicado como padrão, e servidor integrado local usa `/coop` |
| `COOP_PORT` | Apenas relay separado opcional; padrão 5190 |
| `COOP_ORIGINS` | Origens autorizadas, separadas por vírgula |
| `VITE_COOP_URL` | Override opcional na build para hospedagem com relay separado |

Produção integrada HTTPS usa **WSS** com proxy TLS encaminhando `/coop`; nesta instalação, Vercel consulta a API e conecta ao WSS do Render. Hospedar somente `dist/` não publica o serviço. As verificações locais históricas abaixo não representam aparelhos físicos; o QA público tem registro separado.

Reiniciar o servidor do jogo encerra as salas em memória; crie uma nova sala depois da atualização.

## Verificações

### Publicação · 0.1.74

```text
npm run typecheck
npm run build
node scripts/qa-coop-config.mjs
node scripts/qa-coop-public.mjs
```

Configuração verifica serviço padrão sem variável manual, override e rejeição de valores inválidos. O QA público acessa Vercel/Render reais com desktop 1280×720 e viewport touch 844×390; não simula um relay local nem uma resposta de configuração. Não valida iPhone físico, redes móveis diferentes, desempenho de longa duração ou retomada do Free após inatividade.

### Convite direto · 0.1.73

```text
npm run typecheck
npm run build
node scripts/qa-coop-invitation.mjs dev
node scripts/qa-coop-invitation.mjs production
node scripts/qa-coop-config.mjs
node scripts/qa-coop-continuity.mjs docs/regional-coop/invitation-qa/continuity
```

O QA de convites abre a URL real da sala em outro perfil Chrome e verifica entrada automática, início das duas telas, cópia/fallback, sala cheia/encerrada, convite inválido, link colado no menu, saída sem reentrada e criação de Hunter mantendo o convite através de reload. A build de produção também verifica cancelamento antes da resposta de configuração e clique duplicado sem criar salas extras. A configuração é testada com HTTP real, `PORT` da plataforma, política de origens e dois clientes do relay. Resultados: [invitation-qa](invitation-qa/). Não representam dispositivos físicos, serviço Render publicado ou partida pela internet.

Typecheck, build, convites dev/produção, configuração e continuidade regional passaram. Na continuidade, três idas/voltas conservaram 157 objetos no anfitrião, 235 no visitante e quatro tweens em cada tela; XP, reconexão, morte/respawn e jornada solo foram preservados. A amostra final foi de 57,8/57,3 FPS; durante travessias houve amostras de 34–41 FPS, portanto não é uma garantia de 60 FPS contínuos. Uma execução final de convites excedeu o timeout de carregamento de página; a repetição completa passou sem erros JS/assets e terminou com zero salas/jogadores.

### Entrada simplificada · 0.1.72

```text
npm run typecheck
npm run build
node scripts/qa-coop-easy-entry.mjs dev
node scripts/qa-coop-easy-entry.mjs preview
node scripts/qa-coop-easy-entry.mjs production
node scripts/qa-coop-protocol.mjs ws://localhost:5184/coop docs/regional-coop/easy-entry-qa/protocol
node scripts/qa-coop-continuity.mjs docs/regional-coop/easy-entry-qa/continuity
node scripts/qa-regional-coop.mjs docs/regional-coop/easy-entry-qa/regression
```

Cada QA de entrada inicia somente um processo web em uma porta alternativa, sem relay separado. Dois contextos Chrome criam/entram por código, verificam snapshots reais, encerram três salas, simulam uma conexão recusada e voltam a conectar pelo menu. O teste de desenvolvimento também verifica que o socket HMR permanece disponível. Capturas e resultados: [easy-entry-qa](easy-entry-qa/).

Typecheck/build, entrada nos três modos, protocolo, continuidade e regressão regional passaram sem erros JS/assets. A continuidade conserva XP individual, respawn, menus e três viagens de ida/volta Vale ↔ Siroco ↔ Dunas; mediu aproximadamente **57,7/57,3 FPS** (anfitrião/visitante) nessa execução. Objetos/tweens permaneceram estáveis nos ciclos. A regressão também cobre movimento, colisão, combate, Ecos, cinco regiões, quatro resoluções, touch hold/drag/release e gamepad mock; na amostra da Floresta, a dupla mediu **54,7/50,9 FPS**, ainda abaixo da meta no visitante, conforme limitação já conhecida. Nenhuma mudança em combate, câmera, controles, arte ou simulação do jogo. Não houve teste físico ou de hospedagem pública.

### Regressão de continuidade · 0.1.71

```text
npm run typecheck
npm run build
node scripts/qa-coop-protocol.mjs
node scripts/qa-coop-continuity.mjs
node scripts/qa-regional-coop.mjs
node scripts/qa-coop-warrior.mjs docs/regional-coop/continuity-qa/warrior
node scripts/qa-hunter-beam-coop.mjs docs/regional-coop/continuity-qa/beam
node scripts/qa-dante-journey.mjs http://localhost:5184/?qa=play docs/regional-coop/continuity-qa/solo
```

Resultados e capturas da versão 0.1.71: [continuity-qa](continuity-qa/). A pasta [qa](qa/) conserva os resultados históricos da fundação 0.1.66.

QA usa Chrome headless em contextos independentes, relay real, teclado/mouse, touch emulado e Gamepad API mock. Posicionamento, campanha concluída e mortes controladas usam hooks DEV explicitamente. Não representa playtest em dois dispositivos físicos ou pela internet. Cenário estático continua baked/cacheado; nenhum asset, câmera, controle ou arquitetura de combate foi substituído.

Typecheck/build e os seis scripts acima passaram; nenhum erro JS ou asset foi registrado. Continuidade cobre três viagens de ida/volta, interrupção durante a própria travessia, cancelamento de carga na queda, reconexão dos dois papéis, reserva/expiração de vaga, repetição de recibo e falha de armazenamento. A regressão solo percorre Floresta → Ecos → Cavern → First Echo → Warden → Vale, com três respawns e dados locais inválidos/indisponíveis.

No Vale, dois clientes locais atingiram aproximadamente **56–57 FPS** cada; a jornada solo registrou **58,5 FPS**, 149 objetos e 3 tweens estáveis nos respawns. Na amostra pareada da Floresta, baseline solo **55,9/51,9 FPS** e cooperativo **55,7/48,4 FPS** (anfitrião/visitante), próximo à limitação já registrada em 0.1.66. O visitante nessa região continua abaixo da meta de 55–60 FPS no mesmo computador. Não há crescimento contínuo de objetos nos ciclos medidos; dispositivos separados precisam de medição própria. O aviso já conhecido do chunk Phaser acima de 500 KB permanece.

## Playtest necessário

Em dois aparelhos reais, validar: convite por código, kit de cada classe, combate misto, carga/release, portal Vale → Siroco → Dunas e volta, menu do anfitrião, queda curta de conexão, morte/respawn e XP pessoal ao sair. A resistência de 40% é uma primeira calibragem e precisa de avaliação humana.

Próxima etapa proposta: **Astral Manipulator**, depois da aprovação do ritmo cooperativo. Chefes/cavernas em dupla, progresso compartilhado de campanha, terceira vaga, matchmaking e save remoto ficam para etapas posteriores.
