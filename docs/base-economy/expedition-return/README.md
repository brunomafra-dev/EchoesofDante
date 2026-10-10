# Retorno à base e retomada da expedição

Revisão da etapa 3 — **0.1.88**.

[Testar especificamente este sprint](https://echosofdante.vercel.app/base-playtest.html?test=return&v=0.1.88) · [Biblioteca de testes](https://echosofdante.vercel.app/test-library.html).

## Como usar

1. Durante a exploração, abra **M / MAPA** ou o mapa pelo menu de pausa.
2. Escolha **VOLTAR À BASE**, sem precisar caminhar até um terminal.
3. Reabasteça, fabrique, equipe ou use o cofre.
4. Na base, abra o mapa e escolha **RETOMAR EXPEDIÇÃO**.

O destino guarda a região e a posição do personagem no momento do pedido. O retorno usa esse ponto; se houver um obstáculo, procura espaço próximo. Se nenhum ponto próximo couber, usa a entrada/checkpoint normal da região. A retomada consome o destino. Escolher outra região no atlas ou sair pela trilha da base inicia uma nova expedição, descartando a retomada anterior.

O laboratório começa diretamente no meio da Floresta, com recursos temporários. Não cria, seleciona ou altera personagens e saves reais. Recarregar o laboratório reinicia o teste. Na campanha, o ponto pessoal permanece salvo ao fechar/reabrir o jogo **na base**, quando o armazenamento local está disponível.

## Regras e cooperativo

- Boss ativo, personagem caído ou conexão da sala indisponível bloqueiam a viagem. Os controles de movimento e combate permanecem iguais.
- Terminais existentes continuam disponíveis; também guardam o ponto de saída.
- Na dupla, ambos viajam juntos. O visitante pode solicitar a retirada; o anfitrião valida e guarda sua posição como destino do grupo.
- Apenas o anfitrião escolhe **Retomar expedição** ou outra região. O companheiro reaparece próximo dele, usando o posicionamento seguro já existente.
- Inventário, compras e cofre continuam pessoais. A retomada da campanha do anfitrião não sobrescreve a jornada solo do visitante.
- Campo opcional `expeditionReturn` no save schema 1 e no snapshot cooperativo. Saves antigos continuam válidos; o relay protocolo 4 já encaminha campos opcionais. **Não exige configuração nova nem deploy manual do Render.**

## Implementação e limites

Reutiliza a transição entre regiões, o mapa e o som ancestral existentes. `ExpeditionReturn.ts` valida o destino e verifica colisores apenas na chegada. Não cria checkpoint novo, arte, partícula, timer periódico ou listener de viagem.

Guarda **um destino**, não um histórico de portais. Preserva localização e progressão; não congela o estado transitório do mapa. Inimigos e objetos no chão seguem a recriação de região já existente. Falha de armazenamento mantém o destino nesta sessão, mas não garante recuperá-lo após reload. O visitante volta perto do anfitrião, não necessariamente à posição individual de onde saiu.

## Validação

Evidências em [qa/](qa/). Testes usam Chrome headless, emulação touch, gamepad padrão simulado e duas conexões WebSocket reais locais. Não equivalem a teste físico de iPhone/controle nem a playtest humano.

- `npm run typecheck` e `npm run build`: passaram. Aviso já existente sobre o tamanho do bundle Phaser permanece.
- `qa-expedition-return.mjs`: 13 verificações passaram — ponto exato, colisores, todas as regiões, bloqueio durante introdução real do Warden, morte/respawn, reload pessoal, destinos alternativos, saves isolados, touch, gamepad e viagem da dupla.
- `qa-return-layout.mjs`: passou nas quatro resoluções. Botão de viagem e posição atual do atlas permanecem visíveis; apenas o mapa interno é centralizado. Revisão visual das capturas corrigiu a rolagem externa que escondia o botão no celular.
- QA existente da base/economia, base cooperativa e inputs: passou, com recibos, compras, cofre, fabricação, poções, touch e controle simulado preservados.
- `qa-campaign-equipment.mjs`: passou — dez regiões, ataques do visitante nos três bosses, fases, mortes, XP/equipamentos, Dash/Charge, três respawns e restauração da jornada pessoal ao sair da dupla. Sem erros JS/assets.
- Três viagens completas mantiveram os mesmos objetos/texturas/tweens e uma única barra/dialog de serviços. Amostra isolada de dez segundos: **57,1 FPS**, 53 objetos, 180 texturas, zero tweens. A medição durante compilação foi 53,7 FPS; não é uma medição isolada de desempenho.

O roteiro de campanha usa capítulos preparados e dano abreviado nos bosses para cobertura técnica. A automação espera a fase realmente replicada e posiciona o visitante numa linha de tiro livre; não pressupõe que esperar poucos milissegundos basta ou que um tiro atravessa cobertura. Esses ajustes pertencem apenas ao QA, sem alteração de IA, hitboxes ou ataques.

## Arquivos

`ExpeditionReturn.ts`, `LocalJourney.ts` e `GameScene.ts` guardam/validam o destino e reutilizam as transições. `BasePanel.ts`, `ExpeditionAtlas.ts` e `style.css` apresentam a viagem. `CoopSession.ts`/`PartyExpedition.ts` compartilham o destino pelo snapshot existente. Laboratório, biblioteca, versão, scripts de QA e documentação foram atualizados. Nenhum asset novo ou modificação de combate/controles.

**Playtest humano pendente:** sair de um ponto reconhecível, visitar a oficina e retomar; repetir em outra região e em dupla. Verificar conforto do mapa, posição de chegada e bloqueio de retirada durante boss. A próxima etapa do plano aguarda essa validação.
