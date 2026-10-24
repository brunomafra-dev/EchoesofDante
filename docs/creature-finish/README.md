# Criaturas no mesmo mundo — 0.1.140

Revisão visual autorizada em 24/10/2026, após a aplicação dos ambientes. O Hollow já tinha sua pintura aprovada; as demais espécies e os bosses ainda não tinham recebido tratamento equivalente.

## Teste reservado

[Escolher criatura](https://echosofdante.vercel.app/creature-finish.html?species=skitter&v=0.1.140) · [Warden](https://echosofdante.vercel.app/creature-finish.html?species=warden&v=0.1.140) · [Vésper](https://echosofdante.vercel.app/creature-finish.html?species=vesper&v=0.1.140)

O painel recolhível oferece as 19 espécies existentes, incluindo os quatro bosses, comparação com a pintura anterior, classe, apresentação e equipamento **visual**. Os atributos continuam sendo os do preset temporário; trocar a aparência no painel não equipa itens com novos bônus. Caminhe, contorne, ataque e use Q/esquiva/poção. Nos bosses, a aproximação inicia a apresentação e o encontro normal.

As duas superfícies de armazenamento `echoes-of-dante.*` são redirecionadas para `sessionStorage` com prefixo próprio antes de importar perfis/campanha. A cena usa o caminho já existente de playtest sem persistência real. Nas cavernas, aproxima-se de um habitat real e chama o spawner existente, sem duplicar residentes. Na Caldeira, o mecanismo fica liberado somente neste laboratório. O Hollow mantém a pintura aprovada nas duas opções, conforme aviso do painel.

## Pintura e identidade

18 folhas originais novas, produzidas offline pela ferramenta integrada imagegen; 14 espécies e quatro bosses. O Hollow é reutilizado. Nenhuma imagem externa, API paga ou geração em runtime. [Comparação anterior/nova](comparison.jpg), [prompts finais](art-prompts.json), [fontes geradas](sources.json), [dimensões, quadros e bytes](assets.json).

| Região | Criaturas revisadas |
| --- | --- |
| Cavernas | Saltador e Cuspidor: placas legíveis, tecido nas juntas e olhos/reservatório quentes. Saltador com shale violeta para se separar do verde. |
| Vale | Casco Errante e Espinhante: placas com volume, pinças/quilhas distintas, cabeça e apoios legíveis. |
| Nascentes/Terraços | Vigia das Margens e Fole dos Juncos: pele úmida, guelras e reservatório de água, pés sustentando o corpo. |
| Siroco/Dunas | Rasga-areia e Cuspidor Vítreo: material ocre/marfim, articulações escuras, vidro orgânico e foco âmbar. |
| Gelo | Rasga-gelo, Cuspidor Boreal e Casco Glacial: placas claras, tecido azul/violeta escuro e foco quente contra neve. |
| Lava | Rasga-brasa, Fole de Magma e Dorso de Basalto: crosta, volume muscular e fendas subordinadas à silhueta. |
| Bosses | Warden com carapaça mineral ancestral e núcleo no peito; Soterrado com placas de escavação; Vésper com gelo/tecido/asas; Incandescente com crosta e núcleo térmico. |

Cada quadro contém a criatura inteira. A folha original de cada espécie foi usada como referência principal para preservar anatomia, identidade e sequência de ações. Uma tentativa inicial copiou excessivamente a identidade do Hollow e foi descartada. As pinturas finais mantêm Organic Sci-Fi R3 / referência D, luz superior esquerda, materiais táteis e contornos legíveis. Não são recolorações automáticas dos PNGs anteriores.

## Integração e movimento

`scripts/prepare-creature-finish.py` realiza apenas preparação técnica: recorta células, conserva alpha, aplica **uma escala uniforme por espécie a todas as poses**, registra o plano dos pés e exporta WebP. Não remonta membros nem pinta anatomia. Os tamanhos de mundo e de atlas, contratos `Enemy`, colisões, ataques, avisos, dano, HP, recompensas, fases e checkpoints foram preservados.

O carregamento troca a URL de cada folha mantendo as chaves e os índices de quadros usados pela rede. A campanha não carrega uma cópia antiga e outra nova da mesma textura. Visitantes usam os mesmos quadros enviados pelo anfitrião. Os bosses continuam enviando as apresentações completas pelo `BossPresentation`, incluindo crop de emergência do Soterrado.

Sombras de contato usam uma textura radial de 128×128, gerada uma única vez e compartilhada. Substituem o objeto anterior, sem criar uma pilha adicional de sombras por inimigo. Réplicas cooperativas usam a mesma solução. O bob vertical externo do Warden/Soterrado e a deformação vertical contínua de Vésper/Incandescente foram removidos: a mudança de peso vem das poses pintadas. O brilho elíptico antigo do peito do Warden fica oculto na arte nova, pois descolava do núcleo durante ataques; as poses de Signal já contêm o núcleo aceso.

Nomes e HP permanentemente visíveis continuam funcionando. Avisos geométricos de chão, projéteis, janelas e efeitos de ataque continuam usando as regras existentes.

## Peso e limites

- 18 WebPs: **3.519.026 bytes** no total, contra 11.174.109 bytes dos PNGs substituídos. São 138 poses completas novas.
- Atlas RGBA decodificados: **43 MiB**, mesma geometria das folhas substituídas; sombra compartilhada: 64 KiB.
- Comuns: 256 px/célula; Warden: 512; Soterrado: 384. Seis poses nas três espécies vulcânicas; oito nas outras folhas.
- Nenhum novo sistema de partículas, IA, iluminação, listener ou timer de animação por criatura.
- A animação continua sendo de poses completas discretas, com perfil espelhado; não são modelos 3D com direção contínua. A aprovação de silhueta, contraste e sensação de peso depende do playtest humano, especialmente em telefone real.

## Validação

| Verificação | Resultado |
| --- | --- |
| `npm run typecheck` / `npm run build` | Passaram; permanece o aviso conhecido do tamanho do bundle Phaser. |
| `qa-creature-finish.mjs` | 18 espécies/138 quadros carregados. Stats, tamanhos de mundo, limites e obstáculos iguais na comparação anterior/nova. Atualizações aceleradas dos atores reais exercitam preparos, execução e recuperação; todos os padrões e fases dos quatro bosses, morte com pose colapsada e proteção contra sequência duplicada. |
| Reinícios | Quatro reconstruções do Ninho: 81 objetos, 220 texturas, 23 listeners de shutdown, cinco de resize e um tween em todas. Sem crescimento na amostra. |
| `qa-creature-coop.mjs` | Dois navegadores Chrome e relay local: apresentação de espécies em oito regiões e dos quatro bosses, com sombras e quadros recebidos pelo visitante. Nomes/HP e Hollow aprovado permanecem visíveis. |
| `qa-creature-inputs.mjs` | Touch emulado com movimento/mira independentes em oito direções, Q, mochila e atlas; gamepad mock; WebKit mobile com Astral feminino na lava. |
| QA legado `qa-dante-journey.mjs` | Floresta → Ecos → mecanismo → cavernas → Primeiro Eco → Warden → Vale. Vitória, exploração, menus, cancelamento de carga, morte/respawn/reload, persistência e recuperação de save. Três ciclos estáveis, sem escritas durante idle. |
| Resoluções | 1280×720, 1366×768, 1920×1080 e 844×390. |
| Build compilado | `qa-creature-public.mjs` em servidor estático local: 18 arquivos conferidos byte a byte e requisitados pelo jogo, escolha real de espécies/classes, quatro bosses, comparação, ataque/Q e saves intactos, sem globals de DEV. |
| Site público | O mesmo QA passou na Vercel: 18 folhas byte a byte e requisitadas pelo jogo publicado, quatro bosses, comparação, controles, quatro resoluções e sentinelas de local/sessionStorage preservadas, sem erros JS/HTTP. |
| Performance | Chrome desktop, uma página ativa, oito segundos de aquecimento e cinco de amostra por encontro: **58,4–58,9 FPS**; **59,9–60,1 updates reais/s**. Amostras em Saltador, Cuspidor Vítreo, Casco Glacial, Fole de Magma e nos quatro bosses ativos. |

Relatórios e capturas: [espécies](qa/report.json), [coop](qa/coop/coop.json), [entradas](qa/inputs/report.json), [campanha](qa/campaign/report.json). Fixtures de posição/clock são explícitas nos scripts. O teste de coop encerra amostras de apresentação por fixture antes de viajar, respeitando o bloqueio real de retorno à base durante boss ativo; não representa uma campanha inteira vencida pela dupla. As mortes e fases são verificadas no ensaio individual e a vitória do Warden no QA da campanha.

[Medição individual de performance](qa/performance.json): nenhum browser de QA paralelo durante o benchmark. Na regressão longa da campanha, a amostra separada foi de 57,5 FPS. As contagens estáveis nos reinícios não equivalem a uma promessa de ausência de vazamento em sessões ilimitadas. Smartphones reais e uma equipe pública de quatro participantes não foram medidos nesta revisão visual.

## Arquivos principais

`src/visual/CreatureArt.ts`, carregamento em `GameScene`/`ColonizationArea`, sombras em `DanteCreature`/`ValleyCreature`/`VolcanicCreature` e nos quatro bosses, réplicas em `PartyExpedition`, laboratório `creature-finish.html`/`src/experiments/creature-finish`, `test-library.html`, Vite, versão do pacote e plano arquivado. Pinturas em `public/assets/visual/creature-finish`; scripts de preparação e QA em `scripts/*creature*`.

Não houve mudança de protocolo ou servidor: permanece o protocolo 15. A validação visual do usuário e o teste em aparelhos físicos continuam pendentes; QA técnico não os substitui. Não iniciar outra etapa sem avaliação humana desta entrega.

## Publicação

Versão **0.1.140**, commit de implementação [`e2f1752`](https://github.com/brunomafra-dev/EchoesofDante/commit/e2f1752631aa58fe93d53badde5ae0f7a3b43874), enviado para `origin/main`. Vercel confirmou sucesso; [QA público de 24/10/2026](qa/public/report.json) confirmou os arquivos, o laboratório e a renderização sem flags de desenvolvimento. Evidências do build local: [relatório compilado](qa/compiled/report.json). A publicação não equivale à aprovação visual humana.
