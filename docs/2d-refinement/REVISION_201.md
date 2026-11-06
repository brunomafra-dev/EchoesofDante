# 0.1.201 — personagens completos e uma prévia

O usuário rejeitou os cortes e toda a edição por partes da 0.1.200: quer os quatro personagens prontos e uniformes, sem mudar cabelo, rosto ou pele. Pediu um personagem em destaque em vez de quatro colunas. Confirmou a direção **Gênero → Personagem → Profissão → Nome**, com qualquer visual podendo usar qualquer profissão.

## Correção efetiva

- Controles de edição retirados da criação, da lista salva e dos laboratórios. Composição de cabeças/cores removida do runtime; os atlas de customização não são mais requisitados. Os arquivos históricos ficam preservados, sem carregamento.
- Os dados `appearance` antigos continuam legíveis e guardados no perfil, sem migração destrutiva. O corpo exibido usa as pinturas originais da classe/gênero/equipamento; coop anuncia a apresentação original. Nenhum cabelo antigo é aplicado a aliados.
- A criação usa uma única prévia por vez, com formulário e detalhes de profissão ao lado, responsivos. Escolher um par existente demonstra a profissão automaticamente; o botão permite repetir. A demonstração reaproveita combate, arma, básico e Q da classe; movimento reduzido é respeitado fora do botão explícito. Não reutiliza assets de Warcraft/Diablo.
- O Domador mantém **Escolher fera**, com bloqueios pelas vitórias originais, cancelar/salvar e demonstração. Outras classes não mostram esse botão. Broto/Filhote, progressão, IDs, recompensas e protocolo permanecem.

## Limite da proposta independente

**Não estão implementadas as poses dos 12 cruzamentos entre um visual original e outra profissão.** Hoje cada um dos quatro corpos já possui arma e poses pintadas. Nenhuma combinação incompatível é liberada usando arma errada, outro corpo ou colagem de cabeça.

No jogo principal continuam os quatro pares originais, escolhidos por profissão com uma só prévia. O laboratório `campaign-playtest.html?refinement=201&presets=1` mostra os quatro campos e permite revisar todas as escolhas independentes; mantém o corpo selecionado e explica/bloqueia os pares sem arte. Não cria perfil incompatível e não grava visual independente no schema atual. O trabalho solicitado de qualquer visual com qualquer profissão **continua pendente**, além desta correção/protótipo. Não declarar a direção entregue no jogo principal.

Produção seguinte: definir IDs de identidades fixas, preparar figuras completas de repouso/caminhada/esquiva/básico/Q com cada arma, manter identidade e apoio nos dois gêneros/roupas, então desacoplar persistência/relay sem alterar a classe de gameplay. Verificar visualmente uma identidade nas quatro profissões antes de multiplicar as fontes. Não voltar ao editor por partes nem mascarar a falta de poses.

Referência de composição: [explicação oficial do redesenho da criação de WoW](https://news.blizzard.com/en-gb/article/23737992/shadowlands-an-inside-look-at-the-character-creation-ui-redesign). Usada como referência de hierarquia e foco num personagem; cores, interface e assets são de Dante.

## QA e publicação

- [x] Typecheck/build de 327 módulos (dois módulos de edição retirados) e revisão do diff. Avisos de bundles grandes preexistentes continuam.
- [x] Prévia única, ordem dos campos, gênero, rascunho/voltar, quatro pares existentes e bloqueio dos 12 sem poses (`qa/201/selection`). A matriz testou 32 seleções contando dois gêneros: oito pares originais jogáveis e 24 entradas sem poses bloqueadas.
- [x] Perfil antigo personalizado preservado, aparência original no render, reload e isolamento dos saves reais; zero requisições aos atlas de customização (`qa/201/selection`).
- [x] Movimento, armas/básico/Q em 12 casos nativos (quatro classes/dois gêneros, três roupas no Guerreiro), escala de exibição 128 constante e sem rebake por frame (`qa/201/motion`). Touch/gamepad emulados nas quatro classes e formulário em 844×390, 393×852, 1024×768 e 1920×1080 (`qa/201/input`). Capturas inspecionadas; no retrato, o ensaio fecha o aviso de orientação antes de conferir a tela.
- [x] Escolha de fera e dupla anfitrião/convidado compilados (`qa/201/native-coop`): apresentação original espelhada, Broto protege ambos e efeito expira. Fixture registra vitórias anteriores somente no namespace do ensaio para permitir a escolha da fera; não é playthrough de boss.
- [x] Ensaio nativo de três alvos confirma dano em grupo dos dois Q sem repetições do efeito (`qa/201/impact`); combate das feras não foi alterado nesta revisão.
- [x] Aplicação `f104900` e ajuste de demonstração `65a2681` enviados e confirmados na Vercel. Local/remoto conferidos; registro de evidências posterior não altera o runtime. [Publicação](qa/201/publication.json).
- [x] Site público: seletor principal/origem dos personagens, fluxo isolado, demonstração automática e movimento reduzido, perfil antigo/reload e três alvos dos dois Q (`qa/201/public-selection`, `public-impact`). Convite, criação nativa de dois jogadores, início e aparência original espelhada passaram com o Render real (`qa/201/public-formation`), sem simular vitórias.
- [ ] Q das novas feras no coop público: Render ainda confirmou `512a38f`, sem `bondImpact:1`/`cuts:1`; a atualização já foi solicitada e o usuário informou que irá acioná-la. A formação com Simbionte funciona; o comando do Broto só foi validado nesta revisão no coop compilado local. Não é necessário protocolo novo para a retirada do editor.
- [ ] Avaliação humana de composição e personagens uniformes. Os 12 cruzamentos seguem pendentes.

3D continua pausado. Sem novas artes, compras, geração paga ou uso do Blender nesta revisão. Progressão além de 10 e civilização ficam depois da revisão de personagens; não foram implementadas aqui.
