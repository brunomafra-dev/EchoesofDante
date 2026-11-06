# Revisão 0.1.200 — impacto, identidades e escala

Base `512a38f`, main, quatro classes 2D. O usuário gostou da 0.1.199, mas pediu dano no Q do Broto, explosão em grupo no Filhote, aparência independente por classe, cortes novos e correção de patinação/escala do Guerreiro. Progresso, regiões e 3D permanecem no estado anterior. Os diretórios `qa/199/public-*` já estavam não rastreados no início; não pertencem a este commit.

## Comandos

- **Broto — Abalo Guardião:** um evento de impacto centrado no jogador, raio 140. Dano 45–70 conforme carga, +6 por grau de potência. Protege os aliados vivos próximos por cinco segundos, 35–45% de redução sem acumular. O impacto usa a folha PixelFX `ground-impact` existente; um escudo raster acima do herói indica proteção enquanto durar. Paredes bloqueiam dano e proteção; não cura. Dano menor que o gelo/salto, pois conserva a utilidade defensiva.
- **Filhote — Sopro Glacial:** mantém projétil e colisão no primeiro alvo/obstáculo; a explosão passa de raio 68 para 100–132 conforme carga, +6 por grau de amplitude. Um único evento de dano por criatura dentro da explosão. O anel no chão e o efeito de gelo acompanham o mesmo centro/raio. Sem dano contínuo, cura ou atravessar paredes.
- Simbionte, custos, recarga, vitórias reais que liberam feras e snapshots antigos preservados. A mudança pedida de comportamento está no mesmo combate autoritativo de solo/anfitrião/convidado. Não há dano aplicado por efeitos visuais.

## Personagens

- Rascunho de rosto/corte, cabelo e pele separado por classe; alternar classe restaura seu rascunho. A tela de dificuldade e o botão voltar preservam o conjunto. Gênero continua mudando as quatro prévias, conforme pedido anterior. O personagem criado recebe apenas a aparência da classe selecionada. Editar personagem salvo continua individual; cancelar restaura a aparência anterior.
- Dois conjuntos realmente novos: **Cacheado curto** e **Coque baixo**, oito vistas nos dois corpos. São cabeças pintadas completas, não apenas outra cor do corte de uma classe existente. Os quatro conjuntos anteriores permanecem. Capacete cobre cabelo. Não se trata de edição livre de malha nem de escultura facial.
- Guerreiro: quatro poses laterais completas para cada lado, nos dois corpos e três roupas. Apoio e joelho levantado substituem as pernas quase fixas da folha anterior. Cadência por distância, ciclo 104 unidades. As outras direções mantêm as pinturas da 0.1.199. Poses compactas de ação nas oito vistas substituem a postura aberta que fazia o corpo parecer maior; escala de exibição permanece 128, sem `setScale` por ataque/Q. Capacete reforçado é preservado também ao andar de lado.
- Preparação e registro fora do loop do jogo; fontes CPU/cache e atlas composto preservados. Nenhuma montagem de membros. [Origem e prompts](source200/README.md). Importação em `scripts/prepare-2d-revision200.py`, métricas e hashes em `qa/200/import/report.json`.

## Revisão isolada

- Editor: `campaign-playtest.html?refinement=200&editor=1&v=0.1.200`.
- Movimento/ataque/Q: `character-cohesion.html?refinement=200&class=warrior&sex=female&kit=clothes&v=0.1.200`. A/B com `gait=199` nesse laboratório.
- Área do Broto: `character-playtest.html?refinement=200&class=xenobinder&pet=bulwark&targets=1&v=0.1.200`.
- Área do Filhote: mesmo acesso com `pet=frostling`.
- Esses ensaios só preparam **três alvos passivos de 500 PV e 100 de Vínculo**. Um botão prepara o grupo novamente; recarga de Q continua normal. Nenhuma vitória de boss é simulada nos acessos de impacto. As opções de fera são fixtures visuais do laboratório, sem liberar essas feras no jogo normal. Todos usam namespace 200 temporário na aba, sem leitura/escrita de personagens ou jornadas reais.
- O laboratório antigo de campanha mantém botão explícito de preparar vitórias anteriores para inspecionar opções de vínculo no menu. Isso não é evidência de ter vencido bosses.

## Rede e verificações

Protocolo 16 e `presentation:1`/`bonds:1` mantidos. Capacidades aditivas `cuts:1` (novas chaves do catálogo) e `bondImpact:1` identificam esta revisão; o cliente não permite que o relay anterior silenciosamente substitua um corte por Original. Perfis antigos continuam válidos. O relay transmite poses e o anfitrião calcula dano.

- [x] QA de combate: três alvos próximos, alvo distante, parede, carga mínima/máxima, um dano por alvo, proteção e expiração (`qa/200/powers`).
- [x] Editor: classes independentes, gênero global, rascunhos, cancelar/salvar/reload e saves reais isolados (`qa/200/editor`).
- [x] Caminhada/ataque/Q: quatro classes/dois corpos, três roupas do Guerreiro, 12 casos; novos cortes, escala/cache e capturas inspecionadas (`qa/200/motion`). Verificação independente dos pixels e bordas transparentes dos atlas (`qa/200/asset-geometry`).
- [x] Ensaio nativo de área na versão compilada: 70 de dano por alvo no Broto, 100 no Filhote, três alvos por comando e nenhum dano extra durante os efeitos (`qa/200/impact-lab`).
- [x] Coop compilado, dois navegadores: aparência e cabelos espelhados, Broto protege os dois integrantes, expiração e saves reais isolados (`qa/200/native-coop`). A leitura do estado precede as capturas, que podem demorar mais que os cinco segundos de proteção. Dano em área do Filhote foi verificado solo e no combate autoritativo; não houve playtest humano dessa habilidade em dupla.
- [x] Touch e gamepad emulados nas quatro classes, Q Astral por touch, editor em 844×390, 393×852, 1024×768 e 1920×1080 (`qa/200/input`).
- [x] Typecheck, build final de 329 módulos e `git diff --check`. Permanecem avisos de bundles acima de 500 kB, sem nova dependência.
- [ ] Commit/push e publicação confirmada.
- [ ] Aprovação humana de naturalidade, identidade e equilíbrio. Não substituída por automação.

Sem alegação de teste físico em iPhone, gamepad ou equipe humana de quatro. Os recursos adicionados não têm render offline pesado, luz dinâmica ou partículas permanentes. As fontes de arte em `source200` são de produção; só os atlas em `public` são servidos pelo jogo.

Os 22 atlas novos somam **15.260.366 bytes**: seis folhas do Guerreiro e dezesseis folhas de cabeças/máscaras, carregadas conforme classe/corpo. As pinturas dos corpos nos quadros verificados medem 158–170 pixels de altura, com apoio entre 178–184 no quadro de 192 pixels; o tamanho de exibição é constante. Isso verifica registro e custo de download, não garante naturalidade nem FPS no dispositivo do usuário. As capturas de editor mobile, Broto/Filhote, movimento e dupla foram inspecionadas. A naturalidade final e o equilíbrio dependem do playtest do usuário.

## Continuação pedida

O pedido seguinte é ampliar progressão e vida da colônia depois dessas correções. [Sequência concreta](NEXT_2D_CAMPAIGN.md). O limite continua 10 nesta revisão; novos níveis e capítulos ainda não foram entregues. Aguardar avaliação deste sprint, conforme AGENTS, antes de iniciar a expansão.
