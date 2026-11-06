# Retorno ao 2D — revisão integrada 0.1.198

Autorização atual: pausar a evolução 3D e trabalhar o 2D. O usuário pediu efeitos PixelFX nas magias/classes/bosses, correção de escala e engasgos nas quatro classes, Hollow atual nas prévias, personalização e mais de uma espécie de companheiro para o Domador.

Base: `f6a2b1b`, 0.1.197, árvore limpa. Runtime e pacote: 0.1.198. Publicação é registrada separadamente do QA local e da aprovação humana.

## Decisões

- Preservar figuras completas, terrenos aprovados, controles, combate, progressão, requisitos e saves existentes. Nenhuma modificação do protótipo 3D.
- Estabilizar o registro e a transição entre poses; preparar os quadros adicionais fora do loop de jogo. Evitar montar membros, reescalar corpos por frame ou usar transparência para esconder falhas.
- PixelFX: fonte oficial `patch-gg/pixelfx`, licença MIT e NOTICE preservados. Selecionar efeitos, exportar folhas finitas offline, adaptar paleta/pivô/tempo aos eventos reais existentes. Sem NPCs de demonstração embutidos, danos extras ou desenho estático por frame.
- Editor: aparência opcional por personagem, aplicada no mesmo compositor da seleção/campanha/coop. Defaults mantêm os personagens antigos. Salvar só a identidade visual; não alterar a jornada.
- Domador: uma fera ativa por vez; preservar o kit, colisão e orçamento de entidades. Segundo vínculo após pesquisa existente da fauna, sem capturar bosses ou simular mortes/requisitos. Troca em preparação, fora de combate; espécies identificadas de forma explícita.
- Validar especialmente iPhone emulado, teclado/mouse/gamepad, hospedeiro/convidado, reload e isolamento de saves. Medidas técnicas não representam aprovação humana ou celular físico.

## Implementação

- **Figuras completas:** as 24 pinturas de classe/corpo/equipamento foram registradas offline; 72 quadros no Guerreiro e 64 nas outras classes. A marcha usa seis fases. Quatro intermediários por direção deformam a parte inferior de uma pintura com optical flow CPU; não são seis poses novas pintadas. Braços, arma e reflexos ficam protegidos. O repouso do Guerreiro usa a pose de passagem correspondente; atirar correndo nas classes de distância mantém a marcha, sem alternar para o disparo plantado. Histerese de direção e fase por distância evitam oscilação em mudanças mínimas da mira. Escala de exibição permanece 128.
- **Equipamento:** o mesmo compositor local/remoto preserva a silhueta completa; misturar botas/pernas não apaga mais partes do corpo. Fonte, pés, pescoço e transparência foram revisados.
- **Editor:** `Editar aparência` na criação e `Editar aparência / vínculo` nos personagens salvos. Rosto/corte Original, Explorador, Astral e Estelar; original + três tons de pele e original + quatro cores de cabelo. São cabeças completas derivadas das pinturas existentes, ajustadas aos oito ângulos de cada classe/corpo; não há escultura facial ou cabelo 3D. Capacetes cobrem as opções. Default original conserva a pintura. Cancelar preserva o perfil; salvar altera só campos opcionais do registro v1. O editor não muda a jornada.
- **Prévias:** `finish-hollow` atual, inteiro e orientado corretamente, com enquadramento para combate; não o Hollow aposentado. Preview, mundo e ator remoto usam o mesmo compositor e catálogo de aparência.
- **Domador:** Simbionte de Dante e Hollow vinculado. O segundo exige **entregar a missão existente de sobrevivência/fauna à Lia** (`survival` concluída). Escolha no editor antes de entrar na campanha. Uma fera ativa; mesmo dano, raio físico, velocidade, comando e recuperação. Hollow usa somente suas seis poses disponíveis, com indicador de aliado e escala própria. Não foram criadas captura livre, coleção extensa ou habilidades exclusivas por espécie.
- **PixelFX:** nove folhas finitas animadas: energia aérea/solo, fogo, água aérea/solo, terra, quebra de gelo, impacto no chão e faísca de acerto. Campos Astral, impactos de Vésper/Soterrado e acertos confirmados usam os eventos e pools existentes. Nada cria dano extra, luz dinâmica ou áudio. Origem oficial: [Patch PixelFX](https://github.com/patch-gg/pixelfx), MIT; LICENSE/NOTICE e revisão/hashes preservados em `public/assets/visual/pixelfx/`. A fonte tipográfica da galeria e os atores de demonstração **não** foram incorporados. [Manifesto das adaptações](../../public/assets/visual/pixelfx/source-manifest.json).
- **Coop:** campos opcionais de apresentação validados pelo relay e propagados aos atores/mirrors. Protocolo **16 mantido**; capacidade aditiva `presentation:1`. Servidor antigo continua aceitando jogadores no visual original; personagens personalizados/Hollow recebem mensagem de atualização necessária, preservando o save.

## Recursos e limites

As folhas de movimento somam **39.843.074 bytes**; nove folhas PixelFX somam **1.047.504 bytes**. Quadros são preparados por scripts CPU, sem geração paga, dependência nova em runtime ou desenho estático por frame. Três fontes da classe/corpo em solo somam aproximadamente 4,5–6,3 MB de download; a decodificação RGBA estimada é 27 MiB nas classes de distância e 30,4 MiB no Guerreiro. Em coop, o preload conservador de todos os 24 figurinos soma **222,8 MiB RGBA estimados**, além das texturas do mundo e dos atlas vestidos. As fontes não são registradas como texturas no renderer Phaser; o armazenamento interno do navegador e o pico real de RAM/VRAM não foram medidos. Não tratar esta estimativa como consumo físico medido.

Só o atlas vestido de cada ator vai para o renderer, atualizado na mudança de aparência/equipamento; movimento/ataque não refazem o bake. Previews possuem caches por jogo, destruídos ao sair; callbacks tardios descartam bitmaps. Efeitos usam folhas compartilhadas e pools finitos. Não foi realizado benchmark FPS desta revisão, nem teste em iPhone físico; não há garantia de 60 FPS. As fases interpoladas e os cortes derivados precisam do julgamento visual do usuário.

## Teste e preservação

[Revisão isolada](https://echosofdante.vercel.app/campaign-playtest.html?refinement=198&v=0.1.198), também em `test-library.html`. Crie um personagem temporário, confira as quatro prévias, personalize e entre na campanha. O laboratório usa sessionStorage com namespace próprio; personagens, configurações e jornadas reais não são lidos nem escritos. Reload preserva o teste na mesma aba; fechar a aba descarta o teste.

O botão **SIMULAR PESQUISA DA FAUNA · TESTE** conclui explicitamente só reconhecimento e sobrevivência nesse personagem temporário, sem boss vencido. Depois, volte ao menu, continue o personagem e edite o vínculo. Os acessos de corpo/roupa mostram fixtures de classe/equipamento/fera, sem liberar nada na campanha. Os acessos de Vésper e Soterrado simulam requisitos e vitórias **anteriores** necessários, mantendo o boss escolhido vivo; usam namespaces separados. Convites preservam o laboratório e o isolamento. Diagnósticos de produção são somente leitura e limitados aos acessos `refinement=198`.

### QA técnico

Relatórios e capturas em [qa](qa/), scripts `scripts/qa-2d-refinement198-*.mjs`:

- `atlas`: **2.112** quadros, oito combinações classe/corpo e quatro combinações de equipamento; continuidade/pés e igualdade pixel a pixel local/remoto.
- `poses`: teclado/mouse reais nas quatro classes/dois corpos, tiros andando, fases e ausência de rebake; sentinelas de saves reais preservadas.
- `menu`, `compiled-menu`: criação, controles, voltar, reload e persistência no mundo; saves reais preservados.
- `companion`: bloqueio antes da pesquisa, cancelar/salvar/reload; fixture DEV compara dano de assistência/comando e cura entre as duas espécies, sem alterar kit.
- `effects`, `compiled-effects`: quatro elementos por replay nativo; frames avançam e Hollow atual correto. A fixture DEV de impactos de boss valida apresentação, não uma vitória ou balanceamento.
- `coop`: dois navegadores, alvo DEV explicitamente preparado e convidado criado pela UI; pesquisa, Hollow remoto, Q e saves protegidos.
- `input`: toque CDP real, gamepad mock nas quatro classes, Q Astral e quatro resoluções; controles de aparência com 44 px/16 px, sem overflow; opções bloqueadas respeitadas.
- `lifecycle`: doze trocas rápidas de gênero com rede atrasada e três retornos ao seletor; sem erro de loader destruído.
- `compiled-companion`, `native-coop`: versão compilada, sem comandos DEV; criação/convites, retorno da equipe original, edição/reentrada do Domador e Hollow realmente renderizado no convidado; Q nativo visível nas duas telas. Pesquisa simulada pelo botão explícito, sem boss vencido.
- `vesper-controls`, `soterrado-controls`: suítes existentes, toque nas quatro classes, mira independente em oito ângulos, Q/cancelamento, menus, gamepad, quatro viewports e três reinícios sem duplicar HUD. Boss vivo congelado por fixture DEV para isolar controles; não constitui avaliação de dificuldade ou vitória.
- `boss-labs`: quatro chegadas compiladas, Astral/Caçador em Soterrado/Vésper; HP real do boss positivo, sem morte/vitória, personagem correto e troca nativa de classe preservando o laboratório. Cada classe de arena tem sessão própria.
- `build-verification`: hashes de assets/efeitos, métodos de combate preservados, missões/colisão/progressão e fontes/arte 3D sem alteração. Modelos 3D não foram retrabalhados; bundles compartilhados recompilam normalmente.

As capturas foram inspecionadas pelo agente. [Falhas encontradas e correções](qa/OBSERVATIONS.md). Testes com fixtures têm seus pré-requisitos explícitos nos próprios relatórios. QA técnico não substitui playtest humano, controle físico ou celular físico.

## Entrega

- [x] Figuras e movimento.
- [x] Hollow das prévias.
- [x] Efeitos e origem/licenças.
- [x] Editor e persistência.
- [x] Espécies e troca do Domador.
- [x] Laboratório específico e biblioteca.
- [x] Typecheck/build, QA, capturas e revisão. Build 327 módulos; aviso preexistente de chunks grandes mantido.
- [ ] Commit/push, sincronização e publicação.
- [ ] Playtest humano; aguardar antes de outro sprint.
