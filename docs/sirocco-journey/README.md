# Percurso e ritmo — Vale ao Soterrado · 0.1.146

**25/10/2026:** usuário confirmou que testou e aprovou esta entrega (`0a0c5b2`) e autorizou o [percurso Boreal 0.1.147](../boreal-journey/README.md). A espera pelo Boreal abaixo é histórica; diversão/duração medidas não foram declaradas.

[Começar no Vale](https://echosofdante.vercel.app/campaign-playtest.html?sirocco=1&arrival=valley&v=0.1.146) · [Siroco](https://echosofdante.vercel.app/campaign-playtest.html?sirocco=1&arrival=arid&v=0.1.146) · [Dunas](https://echosofdante.vercel.app/campaign-playtest.html?sirocco=1&arrival=dunes&v=0.1.146) · [Soterrado vivo](https://echosofdante.vercel.app/campaign-playtest.html?sirocco=1&arrival=sandpit&v=0.1.146) · [Biblioteca](https://echosofdante.vercel.app/test-library.html)

## Escopo e avaliação

Em 25/10/2026 o usuário aprovou os terrenos 0.1.143–145 e autorizou continuar a **Entrega B — percurso e ritmo**, aprofundando Vale → Siroco → Soterrado. Esta entrega aplica geografia de cobertura, distribuição e narrativa ao espaço existente. Não cria mapas, espécies, sistema de combate ou capítulo de colonização; não declara trinta minutos ou oito horas atingidos. Diversão e duração precisam do playtest humano antes do próximo arco.

## O que muda ao jogar

| Trecho | Exploração e função |
|---|---|
| Vale | Abrigo atrás das raízes, contorno inferior da crista e retorno alto pela escarpa. Nara explica onde uma caravana poderia parar sem bloquear a passagem ou ocupar a margem das criaturas. |
| Siroco | Fibras no leito sul, borda norte da salina e sombra antes do portal. Lia diferencia umidade de água potável e sal de gelo; os desvios retornam ao caminho. |
| Dunas | Aproximação alta das ruínas e canal sul com nervuras expostas. Ivo compara a sustentação do terreno. Analisar os rastros da depressão faz a areia vibrar, usando a resposta existente; não ativa nem derrota o boss. |
| Bacia Soterrada | Arena, apresentação, ataques, fases, respawn e registro posterior preservados. A chegada ainda exige investigar as ruínas e usar a descida. |

Os **três relatórios e nove descobertas já existentes** recebem novas observações, instruções de aproximação e posições. Há nove formações baixas com colliders correspondentes e dois lados livres; entradas/retornos são verificados pelo grafo real de navegação. Os nove acessos não são nove mapas novos. Os envelopes e as pinturas aprovadas permanecem os mesmos.

**Seis residentes finitos adicionais** (1976–1981), dois por região, usam espécies, IA, XP, materiais e equipamentos existentes. As duplas variam entre aproximação, pressão à distância e cobertura; seis habitats nativos são reposicionados para não acumular as mesmas criaturas nos pontos de análise. Espécies, IDs dos habitats e renovação anteriores preservados. A maior população potencial deste arco, com todas as reservas de uma equipe de quatro, é 23, abaixo de 32 no relay. Nenhuma quota de mortes, onda ou aumento de HP/dano.

Os pontos foram revistos nas capturas: a primeira composição escondia o herói atrás de paredes decorativas. As análises do Vale/Siroco e seus residentes foram trazidos para margens visíveis. A física conectada, sozinha, não validou essa apresentação.

## Missões, recompensas e compatibilidade

- IDs, NPCs, pré-requisitos e pagamentos mantidos: `exp-valley` **65**, `exp-arid` **70**, `exp-dunes` **75 créditos** por integrante, uma vez por relatório.
- Descobertas antecipadas continuam registradas. Saves que entregaram esses relatórios não precisam refazê-los e não recebem um segundo pagamento.
- Os seis novos inimigos usam os recibos finitos existentes, compatíveis com o intervalo 0–1999 do save. A derrota não vira habitat renovável.
- Relatórios não alteram `valleyFrontierSignalSeen`, `aridSignalSeen`, `dunesRuinsSeen`, a descida ou a vitória do Soterrado. O caminho crítico continua independente das entregas.
- Cooperativo segue autoridade do anfitrião; convidado pode analisar e entregar, com recibo pessoal. Mesmos colliders nos dois clientes. Sem mudança do protocolo **15** nem novo serviço.

## Composição e custo

Reutiliza todas as pinturas 0.1.143 e os raster `world-rock`, `root-growth`, `ancient-remnant`, contato e sedimento, além dos objetos de investigação existentes. **Nenhum asset novo gerado**, pacote ou framework adicional.

Cada região recebe três caches estáticos de 512×360: **552.960 pixels / ~2,11 MiB RGBA** adicionais durante a região, sem redesenho por frame, listener, tween ou sombra dinâmica por formação. Cache/cena seguem o descarte do Phaser. Ventos e plantas reativas anteriores preservados.

## Laboratório e limites

Os links diretos começam depois do Warden e simulam somente marcos anteriores à região escolhida. Os três relatórios estão aceitos para facilitar o teste, mas as nove análises e entregas permanecem por fazer. O **Soterrado continua vivo** e nenhum recibo de vitória dele é criado. Abrir `?sirocco=1` sem `arrival` começa na base, do zero. O seletor exige confirmação para reiniciar apenas o personagem temporário. Reload preserva essa sessão; personagens reais ficam em outro namespace.

Para equipe pelo menu, o convite mantém o laboratório e a campanha percorre a rota habitual; o seletor de prévias é solo. A automação cooperativa usa uma preparação pós-Warden declarada e duas instâncias independentes, sem alegar que uma equipe humana completou a campanha.

## Evidências

- [Modelo regional](qa/model/model.json): dezenove missões, 36 descobertas, IDs anteriores, condições de boss e recibos únicos conservados; descobrir antes de aceitar não paga nem entrega sozinho.
- [Compatibilidade](qa/model/compatibility.json): comparação com o commit 0.1.145 preserva IDs, condições, valores e conteúdo das outras regiões; 82 IDs finitos únicos no conjunto, seis novos recibos sem pagamento repetido. As nove coberturas bloqueiam Dash na velocidade normal. Máximos potenciais: Vale 23, Siroco 21, Dunas 18.
- [Browser solo](qa/browser.json): navegação dos nove acessos/retornos, nove E, percurso original por sinais/portais até o Soterrado vivo, seis novos residentes e recibos de XP; três entregas pelos diálogos pagam exatamente 210; reload conserva evidências/pagamentos.
- Mesmo ensaio: quatro resoluções, movimento/Dash e três recriações medidas após aquecimento. Siroco permanece em 173 objetos / 240 texturas / 26 listeners de shutdown / 5 de resize / três novas composições.
- FPS na amostra local: **54,7 Vale, 59,8 Siroco, 58,9 Dunas**. Amostragem com todos os residentes encontrados, sem prometer esse resultado em qualquer aparelho.
- [Dupla cooperativa](qa/coop/coop.json): nove análises reais pelo convidado, terrenos/física iguais, chegada ao Soterrado vivo, entrega dos três relatórios e 210 créditos para cada integrante, reconexão sem duplicar recompensa.
- [Controles](qa/controls/controls.json): CDP multitouch nas quatro classes, oito direções de mira, tiro para trás com movimento independente, Q/cancelamento e menus; gamepad mock com movimento, mira, ataque, esquiva e carga. Quatro layouts móveis/tablet sem sobreposição e três recriações sem duplicar HUD/controles/tracker. O ensaio espera DOM e prontidão do jogo; aguardar o evento global `load` expirou numa tentativa apesar de o jogo já estar renderizado.
- [Soterrado](qa/boss/boss.json): quatro avisos de ataque, duas mortes/respawns por R, XP/evidência conservados e um boss por tentativa. Vitória, análise por E e reload mantêm o recibo único; não recria boss vivo após vencer.
- [Produção compilada](qa/compiled/public.json): quatro chegadas diretas, seletor explícito e reload funcionam; sem globais DEV nem alteração do save real sentinela.

`npm run typecheck` e `npm run build` passaram; aviso existente do bundle Phaser maior que 500 kB preservado. Fixtures aceleram posição e combate; não medem duração humana. Celular físico, Safari/iPhone real, equipe humana de quatro e aprovação de ritmo permanecem avaliações humanas.
