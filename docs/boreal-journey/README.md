# Percurso Boreal — Fratura ao Vésper · 0.1.147

**25/10/2026:** após receber esta entrega, o usuário pediu continuar ao [arco vulcânico 0.1.148](../embers-journey/README.md). Essa autorização substitui a espera operacional abaixo; não acrescenta medição humana de duração ou uma avaliação visual por automação.

[Começar na Fratura](https://echosofdante.vercel.app/campaign-playtest.html?boreal=1&arrival=frost&v=0.1.147) · [Galerias do Degelo](https://echosofdante.vercel.app/campaign-playtest.html?boreal=1&arrival=icecave&v=0.1.147) · [Vésper vivo](https://echosofdante.vercel.app/campaign-playtest.html?boreal=1&arrival=icenest&v=0.1.147) · [Biblioteca](https://echosofdante.vercel.app/test-library.html)

## Autorização e escopo

Em 25/10/2026 o usuário informou que testou e aprovou o percurso Siroco 0.1.146 (`0a0c5b2`) e autorizou continuar a entrega B com **Fratura Boreal → Galerias do Degelo → Ninho de Vésper**. Esta entrega aprofunda esses três mapas existentes. Preserva Organic Sci-Fi R3 / referência D, suas pinturas aprovadas, dimensões, personagens completos e sistemas de combate. Não inicia o arco vulcânico nem o capítulo C. Trinta minutos e oito horas continuam metas sem medição humana.

## Percurso e encontros

| Região | Exploração |
|---|---|
| Fratura Boreal | Três contornos de dobras baixas: olho de água morna abrigado, líquens para localizar fissuras e comparação com a encosta exposta. Lia distingue coleta, repouso e ancoragem dos suprimentos. |
| Galerias do Degelo | Margem rasa ao sul para coleta, bifurcação de pedra seca sob a coluna e retorno pela margem do canal. Ivo compara apoio das cargas e preservação das estruturas; marcas largas e vibração anunciam o ninho. |
| Ninho de Vésper | Três grupos de sulcos paralelos no gelo do vestíbulo, antes do limiar original. São vestígios planos; não adicionam objetivos, colliders ou residentes à arena. |

Seis coberturas baixas têm colisões correspondentes e duas aproximações abertas. Entradas, análises e retornos são verificáveis no grafo real de navegação. Não há passagens novas entre regiões. O enquadramento das Galerias permanece **groundY −300 / groundHeight 2300**, com mapa físico **3100×1800**, mantendo os canais profundos fora da faixa caminhável.

Os seis pares das investigações variam pressão de aproximação e distância, usando Rasga-gelo, Cuspidor Boreal e Casco Glacial. Seis habitats nativos são reposicionados; IDs, espécies e renovação desses habitats permanecem. **Quatro residentes finitos adicionais, 1982–1985**, usam IA, XP, materiais e drops existentes. Máximo potencial com todas as reservas de quatro jogadores: **19 em cada região de exploração**, abaixo de 32 no relay. Nenhuma quota de mortes, onda ou alteração de HP/dano.

## Missões, progressão e saves

A inspeção encontrou **dois relatórios e seis análises existentes**, suficientes para este arco. `exp-frost` continua com Lia, 80 créditos; `exp-icecave` continua com Ivo, 85. IDs, nomes das análises, pré-requisitos, assuntos dos objetos e recibos permanecem. As observações e instruções agora explicam água, abrigo e transporte. Não há missão extra no ninho.

Descobrir antes de aceitar continua registrando evidência sem pagar ou entregar automaticamente. Quem já entregou não precisa refazer nem recebe novo pagamento. Os novos residentes usam o intervalo finito 0–1999 do save. Saves sem seus IDs continuam válidos.

Relatórios não alteram `frostSignalSeen`, `icecaveSignalSeen`, a vitória de Vésper nem o registro final. O caminho exige os sinais, portais e encontro originais. O atlas conserva os bloqueios da campanha. Cooperativo mantém autoridade do anfitrião, evidência compartilhada e recompensa individual única. O convite conserva o laboratório, sem copiar a chegada simulada. **Protocolo 15**, sem alteração de relay.

## Composição e custo

Reutiliza pisos e raster existentes de rocha, raiz, sedimento e vestígio antigo. Sulcos do vestíbulo são desenhados uma vez e gravados no cache; o Graphics temporário é destruído imediatamente. Nenhum asset gerado, pacote ou desenho estático por frame.

Fratura/Galerias usam três caches de 512×360 cada: **552.960 pixels / ~2,11 MiB RGBA** adicionais durante cada região. Ninho usa um cache de 512×300: **153.600 pixels / ~0,59 MiB RGBA**. Sem listeners, tweens ou sombras dinâmicas novos; descarte pelo ciclo de cena do Phaser.

## Laboratório

Os links de chegada direta simulam **Warden, Soterrado e apenas os marcos anteriores à região selecionada**, com os dois relatórios aceitos e ainda por investigar/entregar. Vésper permanece vivo, sem recibo de vitória ou registro final. Fratura ainda exige seu registro; Galerias ainda exigem seu mecanismo. A chegada ao ninho simula esses dois acessos anteriores, preservando o encontro.

Sem `arrival`, `?boreal=1` começa do zero na base. O seletor exige confirmação para preparar apenas o personagem temporário. Reload conserva a sessão em namespace próprio de sessionStorage; personagens e progresso reais não são alterados. Para coop humano pelo menu, volte ao início e crie a equipe; a campanha segue o caminho completo. A preparação rápida é solo.

## QA técnico e aprovação humana

- [Modelo](qa/model/model.json): dezenove missões, 36 análises, requisitos e recibos únicos.
- [Compatibilidade](qa/model/compatibility.json): conteúdo das outras regiões intacto, seis coberturas bloqueiam Dash, 86 IDs finitos únicos no conjunto, quatro novos recibos e população máxima 19/19.
- [Solo](qa/browser.json): seis acessos/retornos, seis análises por E, registros e portais originais até Vésper vivo; entregas por diálogo, 165 créditos, reload e save de relatórios concluídos sem IDs novos.
- Mesmo ensaio: movimento/Dash, quatro resoluções e três recriações medidas após aquecimento. Fratura estável em **153 objetos / 236 texturas / 26 listeners shutdown / 5 resize / 3 coberturas**. Amostras locais: **55,8 FPS Fratura / 59,2 FPS Galerias**.
- [Controles](qa/controls/controls.json): CDP multitouch nas quatro classes, movimento e mira independentes, oito direções, Q/cancelamento, menus, quatro layouts e gamepad mock. Não é ensaio em aparelho físico.
- [Dupla](qa/coop/coop.json): dois Chrome independentes com relay local, análises e registros do convidado, viagens adjacentes, física compartilhada, pagamentos pessoais e reconexão.
- [Vésper](qa/boss/boss.json): quatro avisos, morte/respawn, aproximação pelo limiar real, vitória e registro por E, recibo único após reload. Fixtures de posição/dano aceleram o teste; não avaliam dificuldade humana.
- [Build compilado](qa/compiled/public.json): chegadas, seletor, reload, arte original, ausência de globals DEV e save real sentinela.
- [Atlas e entrada limpa](qa/access/access.json): mesmo uma lista de regiões visitadas contaminada não libera destinos futuros na interface nem na ação de viagem. Laboratório sem `arrival` começa na base sem vitórias; captura final dos sulcos no vestíbulo.

O health público do Render confirmou protocolo **15**, capacidade quatro e missões habilitadas durante a revisão. Não existe incompatibilidade que exija intervenção no serviço. As fixtures aguardam o diálogo de aprimoramento antes de acionar a prévia: ele pausa a cena e bloqueia cliques legitimamente.

`npm run typecheck` e `npm run build` passam, com aviso conhecido do tamanho do chunk Phaser. As capturas são inspecionadas visualmente; navegação conectada sozinha não comprova que o personagem está visível. Sem alegação de teste físico de celular, Safari/iPhone, equipe humana de quatro ou duração de campanha.

**QA técnico é separado da aprovação humana. Aguardar o playtest desta versão antes do arco vulcânico.**
