# Missão acompanhada e objetos reconhecíveis · 0.1.172

O usuário jogou a 0.1.171 e gostou, mas identificou orientação seguindo a descoberta de regiões em vez da missão escolhida e repetição das maletas/prisma. Autorizou corrigir ambos e **em seguida continuar nas Dunas**, confirmado pela resposta “Sim, continuar a campanha nas Dunas”. Essa autorização dispensa espera operacional entre a correção e esse capítulo; não registra aprovação visual da arte nova ou medição de duração. Outro sprint após as Dunas exige sua avaliação.

## Orientação

Missão acompanhada determina o próximo objetivo, guia no cenário e minimapa. Quando o objetivo está em outra região, a indicação segue a passagem original apropriada ou o retorno/atlas para uma região já acessível. Não altera descoberta, bloqueios, portais ou bosses. Sem missão acompanhada, volta à exploração normal. Escolhas de lote/terreno continuam exigindo observação; não entregam a resposta pelo marcador.

“Parar de acompanhar” grava `trackedMission: null`, mantendo o schema 1. Saves anteriores sem esse valor conservam o comportamento inicial. Aceitar/entregar uma missão do convidado não substitui a seleção pessoal do anfitrião. Cada integrante preserva sua escolha, inclusive sem acompanhamento, após reload.

## Objetos

32 figuras completas em dois atlas RGBA: instrumentos de pesquisa, arquivo, mapa, medidor de vento sobre patins, filtro/válvula, recipientes lacrados, reserva de alimentos, ferramentas, transporte e energia. Três colares próprios também aparecem no inventário, oficina/cofre e drop. As estações permanentes e tarefas dos moradores usam o objeto pertinente. Investigar uma pessoa ou construção existente não cria mais um item genérico para representá-la. Formações naturais aprovadas preservadas.

Sistemas de interação, IDs, requisitos, créditos, XP, posse, recibos, espécies e colisores preservados. Sprites carregados uma vez e atualizados por transformação; nenhum desenho estático por frame. Protocolo 16/catálogos atuais preservados: esta correção não exige outro deploy do Render.

[Laboratório isolado](https://echosofdante.vercel.app/campaign-playtest.html?mission-identity=1&permanence=wind&v=0.1.172), registrado na biblioteca. Namespace `dante-mission-identity-v1.<capítulo>.<classe>.`, separado dos personagens/settings reais e dos laboratórios anteriores. Painel contém links dos nove capítulos; cada um informa seus próprios pré-requisitos simulados. No vento: Warden, sete relatórios, oito capítulos anteriores, Bacia conquistada e chegada ao Siroco; relé original/seis objetivos/160 créditos pendentes. Bosses posteriores vivos.

## Produção de arte

Ferramenta: **image_gen integrada**, duas gerações de atlas com alpha, sem CLI/API externa. Fontes em [source](source); prompt set abaixo. `python scripts/prepare-mission-identity.py` isola componentes inteiros na fonte, preserva alpha, redimensiona e empacota deterministicamente; não pinta ou remove fundo. A revisão visual identificou peças ultrapassando a grade nominal: o isolamento por componentes impede fragmentos vizinhos e preserva os instrumentos completos. Destino [public/assets/mission-identity](../../public/assets/mission-identity), [hashes](assets.json) e [limites por componente](source/components.json). Personagens e terrenos não foram redesenhados.

Prompt comum usado: atlas RGBA quadrado 4×4, objetos completos independentes, margens transparentes, sem grade/legendas/fundo; pintura realista Organic Sci-Fi com metal oliva/bronze/cobre gasto, lona ocre, câmera elevada a 40°, luz superior esquerda e silhuetas legíveis a 70 px. Sem pilhas de maletas ou prismas usados como máquinas. Ordem research: emissor de diapasão, receptor direcional em tripé, terminal de arquivo com bobinas, mesa de mapa, anemômetro, anemômetro sobre patins, kit desmontado do vento, testemunho de rocha/furadeira, hidrofone/bobina, descontaminação de folhas sob redoma, manifesto/papéis, ferramentas abertas, colar de ferro/cordão, medalhão âmbar/corrente, colar de opala/crescente, rádio de retorno com três antenas. Ordem survival: cartucho cerâmico, válvula de desvio, dois recipientes de água lacrados, cesto com amostras de alimento, suporte de suprimentos, estrado sobre patins, aterramento, célula/regulador, isolador cerâmico, luz/bateria, captação com tela, bandeja de mudas, raízes contaminadas azuis, amostra limpa em frasco âmbar, régua de cheia, tripé/roda/fita de medição.

## QA

- [x] [Modelo/save 0.1.166](qa/model/report.json), escolhas independentes, ausência de alteração de progressão/recompensas.
- [x] [Orientação solo](qa/browser/report.json) e [dupla completa](qa/coop/coop.json), seleção/parada/reload, rota entre regiões e bosses vivos. Relé, instalação, empurrão, leitura, entrega e recibos reais; posições/preparação de capítulos anteriores e invulnerabilidade são fixtures explícitas.
- [x] [32 figuras isoladas](qa/assets/report.json), [inventário/drop/coleta/equipar/reload](qa/items/report.json); capturas inspecionadas pelo agente, incluindo base, posto e colares. Nomes de pingente/medalhão coerentes com a figura; IDs/atributos preservados.
- [x] [Quatro classes touch/gamepad emulados](qa/controls/report.json), 568×320, 844×390, 1024×768 e 1920×1080; typecheck/build de 264 módulos. Não representa celular físico ou equipe humana de quatro.
- [x] [Plataforma compilada](qa/compiled/report.json): caminhada WASD, contorno e encaixe reais, sem globais DEV, leitura/arquivo/vitória posterior não inventados.
- [x] [Três capítulos compilados](qa/compiled-chapters/public.json) e [dupla compilada no relay público 16](qa/compiled-coop/report.json): aceite/coleta pelo convidado, reload/reentrada, recibos e saves reais preservados. Capturas inspecionadas pelo agente. O percurso completo e escolhas pessoais estão cobertos no QA DEV; esta amostra compilada não representa playtest integral pela internet.
- [x] Aplicação `da14d95` em `origin/main`, sincronização exata conferida; Vercel success e [67 hashes publicados](../outpost/qa/publication/0.1.172/hashes.json). [Três capítulos solo públicos](qa/public-chapters/public.json) e [dupla pública](qa/public-coop/report.json) passaram: aceite/coleta pelo convidado, reload/reentrada original, saldos/recibos/bosses e saves reais preservados. Render 16, `wind:1` e capacidades anteriores, revisão `0f0ed6a`; nenhum deploy adicional solicitado para a correção. Capturas públicas inspecionadas pelo agente.
- [ ] Avaliação visual humana da correção (separada da autorização para continuar nas Dunas).
