# Jornada inicial 3D · 0.1.196

Autorização atual: após aprovar a correção das roupas/ferramentas 0.1.195, o usuário pediu missões claras no primeiro mapa, continuação pelas cavernas até o primeiro boss e commit/push depois de finalizar e verificar tudo. Em 06/11, pediu a conclusão e revogou o desligamento anteriormente solicitado: manter o computador ligado. Este sprint termina no Warden e no relatório a Nara; não autoriza iniciar o Vale/Siroco antes do playtest.

## Conteúdo e requisitos

O primeiro boss é **O Warden**, o mesmo guardião da campanha original. `Journey.ts` reutiliza os dados e o motor `Missions` existentes: Primeiro reconhecimento (20), Condições de sobrevivência (30), Energia desconhecida (40), Além da fissura (60), Remédios entre as raízes (45) e O que corre sob a pedra (60 créditos). Não há novos recibos duplicando esses relatórios. As seis recompensas são únicas no save 3D de cada personagem.

Diário J / botão Missões / View do gamepad, seleção explícita do relatório, objetivos concluídos e pendentes, NPC de entrega e direção/distância até o acesso original. Sem missão selecionada, acompanha a exploração normal. Interagir e entregar não abre gates nem registra boss vencido. Lia oferece a restauração gratuita existente e poções pelo preço canônico de 12 créditos, limitado à reserva de três do protótipo.

Geografia subterrânea compartilha `cavern.ts`, `earlyJourney.ts`, `expansion.ts`, `wardenPreparation.ts` e `wardenArena.ts`. Abertura das profundezas → sinal sob a pedra → fragmento → Primeiro Eco → limiar → domínio. Investigações opcionais nas três câmaras retornam à rota original. Residentes finitos conservam os IDs 0–26, 1900–1911 e 1972–1975; nenhum gate depende de uma quota de mortes. Visual de crawler/aranha, skitter menor e antlion para o cuspidor reutiliza as licenças existentes. Misturadores/esqueletos independentes; representação animada limitada aos residentes próximos.

## Warden

Dados de dano, alcance, preparação, execução, recuperação, padrões e transições vêm de `config/warden.ts`, convertidos de pixels/milissegundos para unidades/segundos. Guarda frontal, pressão com contra-ataque, golpes com direção travada, varredura de ida/volta, investida, impacto com onda atrasada, duas salvas de sinal e três marcas de eco. Errar um golpe abre o núcleo para o multiplicador canônico 1,6; conectar um golpe fecha essa abertura. Nenhum efeito visual causa dano adicional.

Modelo original no Blender, inspirado na carapaça mineral estabelecida no Dante 2D, sem extração de franquias. Malha completa com pesos e nove ossos; poses seguem os eventos reais do encontro, sem root motion ou alegação de clipes importados. `warden-196.json` registra geometria, materiais, texturas, tamanho e hash reais; gerador reproduzível em `scripts/asset-tools/author-arrival196.py`. Sem render offline, compra, conta ou novo download externo. Créditos/licença CC0 em `public/assets/arrival-3d/CREDITS.md`. Oficina inclui Warden e movimentos efetivamente implementados.

## Saves e limites

Migração aditiva dos saves 0.1.195 mantém personagem, HP, poções, mortes e três descobertas existentes. Relatórios/evidências, recibos, gasto em poções, tracker, gates e posição ficam no namespace 3D já estabelecido, independente ou vinculado ao ID do personagem. A morte nas cavernas retoma do marco seguro; o Warden reinicia vivo e com vida completa se não foi vencido. Vitória real persiste e não ressuscita no reload.

Não há escrita parcial do `JourneySnapshot` 2D. Os mesmos conteúdos/requisitos foram reproduzidos neste trecho 3D; inventário completo, XP/equipamentos, conquistas 2D e coop 3D ainda não são sincronizados. Nenhuma atualização no relay/Render é necessária. A versão 2D permanece disponível e suas fontes de gameplay não são alteradas.

## Acessos de revisão

- [Jornada normal](https://echosofdante.vercel.app/arrival-3d.html?v=0.1.196): nenhum requisito simulado.
- [Cavernas isoladas](https://echosofdante.vercel.app/arrival-3d.html?v=0.1.196&lab=cavern): três Ecos, relatórios iniciais e fissura simulados; pesquisas subterrâneas e Warden pendentes.
- [Warden vivo](https://echosofdante.vercel.app/arrival-3d.html?v=0.1.196&lab=warden): também simula profundezas, fragmento, Primeiro Eco e limiar; nunca inicia com vitória do boss.
- [Oficina do Warden](https://echosofdante.vercel.app/arrival-workshop.html?v=0.1.196&subject=warden): nenhuma leitura/escrita de progresso.

Os dois laboratórios usam `dante.arrival3d.review196.<trecho>`, sem substituir os saves de jogo. Estão registrados em `test-library.html`. Diagnósticos somente com `?inspect=1`, sem comandos para mover personagens, causar dano ou conceder progresso.

## Validação

Evidências em `qa/0.1.196/`. Quinze relatórios locais e seis públicos passaram; a aprovação humana permanece separada do QA técnico:

- [x] Migração, validação de gates, recibos e saldo/gastos: `state/report.json`.
- [x] Typecheck e build finais; `git diff --check`.
- [x] Percurso nativo, seis relatórios, seleção do tracker, colisões, gates e reload.
- [x] Warden vivo, dano, morte/retomada e vitória pelas quatro classes.
- [x] Touch/gamepad emulados, layouts e navegação por teclado.
- [x] Criação/edição, identidades e roupas/ferramentas sem regressão.
- [x] Inspeção visual de capturas e amostra de desempenho isolada.
- [x] Aplicação `30bb7c3` sincronizada em `origin/main`; Vercel success, 110 hashes e seis relatórios públicos conferidos.
- [ ] Playtest e aprovação humana desta etapa.

QA técnico não representa aprovação estética humana, teste em iPhone físico ou equipe cooperativa 3D.
