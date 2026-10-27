# Vésper — gelo persistente e retaguarda · 0.1.152

[Enfrentar Vésper vivo](https://echosofdante.vercel.app/campaign-playtest.html?vesper=1&v=0.1.152) · [Biblioteca](https://echosofdante.vercel.app/test-library.html)

## Autorização

Em 27/10/2026 o usuário aprovou o Soterrado 0.1.151 (“muito bom”) e autorizou o próximo boss. Esta revisão é restrita ao Vésper. A aprovação anterior encerra a espera do Soterrado, sem aprovar automaticamente o combate atual. Aguardar este playtest antes de Incandescente ou outro capítulo.

## Combate

O sopro fixa a direção na preparação, tem dois contatos e deixa seis crostas perigosas no chão. Elas sobrevivem aos ataques e às trocas de fase, duram até onze segundos e são renovadas pelo próximo sopro, sem acumular mais de seis. São gelo fino sobre o piso, sem bloqueio físico ou lentidão no jogador. Cada participante recebe no máximo um contato do chão por intervalo de 1100 ms, mesmo na sobreposição de várias crostas; Dash, graça e resistência continuam no caminho normal de dano.

A cauda varre a retaguarda, oposta à direção para a qual o dragão se volta antes do aviso. Não é uma segunda versão do sopro frontal. Se a varredura alcança as crostas, quebra o gelo coberto pelo setor e faz as placas do peito se separarem. O jogador pode usar o posicionamento para mudar a direção do corpo e essa relação com o piso. Não há instrução da solução durante o combate.

A reação dura 3500 ms: o peito fica vulnerável de 240 a 3260 ms, com multiplicador 1,6 do dano-base. Fora dela, as placas recebem 22% do dano-base; há dano parcial sem exigir colisões contadas ou uma classe específica. Uma caudada sem gelo não cria a mesma recuperação longa. Os limiares de 65%/30% são verificados ao voltar ao repouso, preservando o golpe comprometido e a abertura ganha; as três fases ocorrem em sequência. As recuperações comuns são mais curtas.

| Ação | Aviso | Contato após a execução começar | Dano-base / normal solo sem resistência |
|---|---:|---:|---:|
| Sopro | 1050 ms | 200 e 940 ms | 38 / 53 por pulso |
| Cauda | 800 ms | 300 ms | 36 / 50 |
| Investida | 850 ms | contato no trajeto | 40 / 56 |
| Erupções | 1000 ms | 200, 670 e 1140 ms | 32 / 45 por marca |
| Crosta no piso | criada no contato do sopro | intervalo individual de 1100 ms | 16 / 22 |

HP-base continua **1100**, ou **1760** na escala regional normal de 1,6. A escala de dano existente do Ninho é 1,4. Dificuldade, participantes, elementos, equipamentos e recompensas originais continuam aplicados. Não há quota, aumento de HP ou cura artificial do boss.

## Arte e execução

[Prompt completo e imagegen integrado](art-prompt.md) · [fonte, hashes e registro](art-source.json). Oito figuras completas de inalar, soprar, preparar cauda, varrer, reagir, expor e recompor o peito em `public/assets/visual/creature-finish/vesper-reaction-v1.webp`. Recorte nas margens transparentes reais, sem juntar membros ou recortar garras entre colunas. Caminhada, investida, fase e morte conservam as poses anteriores.

As crostas usam a textura pintada do piso existente com trincas irregulares; fragmentos e arcos são preparados uma vez em texturas Canvas. A primeira tentativa geométrica foi refinada na inspeção visual. A crosta intacta fica numa camada de chão, sempre abaixo dos personagens; fragmentos breves podem passar à frente. Seis quads de crosta, quatro de contato e nove de névoa são reutilizados. Junto do corpo, sombra e avisos, a apresentação permanece abaixo dos quarenta objetos do contrato cooperativo. Não há desenho estático por frame, emitters, timers ou tweens por ataque.

Sons e tremores acompanham os contatos, em vez de começar todo o dano na entrada de EXECUTE. O visitante reconhece os mesmos efeitos e a quebra. Trilha e mixagem da 0.1.149 preservadas; nenhum pacote, música ou mudança de protocolo. **Protocolo 15**, sem necessidade de atualização do relay.

Pinturas, dimensões, chão caminhável, rochas, limiar do Ninho, retorno, registro e portal térmico são preservados. As Galerias continuam com enquadramento −300/2300 e mapa físico 3100×1800. Missões não concluem o boss. Vitória continua concedendo **220 XP e o aperfeiçoamento original**, uma vez por integrante; o registro com E permanece necessário para ativar a saída.

## Laboratório isolado

Namespace temporário por classe `dante-vesper-combat-v1`. localStorage e sessionStorage do jogo são isolados antes de importar os sistemas; reload conserva só os dados desta aba. Personagens e configurações reais não são lidos ou alterados.

A chegada simula três Ecos, mecanismo, Primeiro Eco, Warden, percurso do Siroco, Soterrado e sua pista, sinais da Fratura e das Galerias. Os quatro relatórios principais anteriores são entregues; regionais ficam pendentes. O personagem recebe 1250 XP, os aperfeiçoamentos de chegada, equipamento normal e cinco poções disponíveis. **Nenhuma vitória, recibo ou registro de Vésper é simulado.** Começa no checkpoint anterior ao limiar, com o dragão vivo.

O painel permite trocar classe e recomeçar. Coop: Esc → início, criar equipe, compartilhar convite, iniciar com todos presentes; o anfitrião usa RECOMEÇAR VÉSPER VIVO. O convite preserva o namespace. Essa preparação existe só no laboratório, sem atalho para a campanha real.

## QA técnico e limites

- [Mecânica e tentativas estacionárias](qa/combat.json): caminho real de dano, sopro sem dano antecipado, dois pulsos, persistência, cauda traseira, quebra/abertura, Dash real, erupções/investida, sobreposição das seis crostas e pool estável. Posição/estado são preparados apenas para isolar regras. Quatro classes atingem a abertura com mouse real; nesses testes a janela é prolongada para medição. As quatro tentativas estacionárias usam IA/HP/dano normais e terminam em derrota; R limpa o gelo e restaura um único boss.
- [Vitória com movimento](qa/playthrough/playthrough.json): Guerreiro da chegada, 145 HP, Vésper normal com 1760 HP, WASD/Dash/Q/mouse reais. Nenhuma mudança de posição, HP, IA, invulnerabilidade, relógio ou poção durante a luta. O controlador lê estado e planeja caminhos, conhecendo a solução; não representa descoberta humana. A amostra passou pelas três fases e três aberturas, com menor HP amostrado de 100. A vitória cruza o nível 7 e aplica a recuperação original para 150 HP. O registro com E e reload conservam 1470 XP e uma vitória.
- [Dupla](qa/coop/coop.json): dois processos Chrome, relay local real, setor idêntico, gelo persistente e dano real no convidado, cauda limpando a mesma área e abertura aumentando dano de projéteis reais. Janela prolongada para inspeção e HP final reduzido somente no fixture de recibo; a vitória vem do golpe real do convidado. Cada integrante ganha 220 XP uma vez, música para, registro continua pendente e reconexão não repete o recibo.
- [Controles](qa/controls/controls.json): touch CDP nas quatro classes, oito direções independentes, olhar sem disparar, carregar/soltar/cancelar, modal, quatro layouts compactos, três reconstruções e gamepad mock. Boss vivo congelado para isolar entradas.
- [Saves antigos e atlas](qa/legacy/legacy.json): schema 1 sem sistemas opcionais posteriores, reload conserva XP/recibos e um Vésper vivo; regiões vulcânicas continuam bloqueadas.
- [Build compilada](qa/compiled/public.json): chegada, reload, gatilho por teclado, nova arte, música do encontro, proteção de saves/configurações e biblioteca.

Capturas inspecionadas visualmente; os retratos diagnósticos de abertura usam pausa explícita e não medem reação humana. QA técnico não aprova dificuldade, animação ou diversão. Touch e gamepad são emulados; não houve celular físico, controle físico ou grupo humano de quatro. A duração global da campanha continua sem medição humana.

- [ ] Playtest humano do Vésper.
- [ ] Somente depois dessa aprovação, iniciar Incandescente em sprint separado.

Verificação: `npm run typecheck`, `npm run build`, `git diff --check`, `node scripts/qa-vesper-counterplay.mjs`, `node scripts/qa-vesper-playthrough-152.mjs`, `node scripts/qa-vesper-coop.mjs`, `node scripts/qa-vesper-controls.mjs`, `node scripts/qa-vesper-legacy.mjs`, `node scripts/qa-vesper-public.mjs`. Verificações passaram tecnicamente. Aviso conhecido de tamanho do chunk Phaser permanece.
