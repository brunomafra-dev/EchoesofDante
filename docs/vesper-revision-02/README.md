# Vésper — revisão da retaguarda · 0.1.153

[Testar o Vésper revisado](https://echosofdante.vercel.app/campaign-playtest.html?vesper=1&v=0.1.153) · [Biblioteca](https://echosofdante.vercel.app/test-library.html)

Em 27/10/2026 o usuário rejeitou a dificuldade da 0.1.152: venceu atrás do dragão segurando auto attack. A revisão anterior passou tecnicamente, mas seus testes estacionários eram frontais e não cobriam essa estratégia. Esta correção continua no Vésper; Incandescente aguarda nova aprovação humana.

## Causa e revisão

Antes da cauda, tanto o repouso quanto o início do ataque voltavam o corpo para o jogador. O ataque somava meia volta a essa nova direção: quem estava atrás passava imediatamente a estar do lado seguro. A reprodução anterior registrou a direção mudando de π para zero, jogador em 1620/960 e nenhum dano.

A cauda agora conserva a orientação do ataque anterior, inclusive no intervalo entre sopro e cauda. Faz uma varredura atrás e outra à frente. A primeira tem aviso de 800 ms e contato 300 ms depois de iniciar a execução; a volta é anunciada assim que a primeira toca o chão e atinge 750 ms depois. Os dois setores ficam fixos, sem seguir o jogador durante o aviso. Cada contato tem som, arco de impacto e pose de corpo inteiro. Os setores se sobrepõem nas laterais para não deixar uma posição estacionária entre eles.

Cada contato de cauda passa de 36 para **42 de dano-base**, ou **59 HP no normal solo sem resistência**. Sopro, investida, erupções e crostas conservam seus danos. O intervalo de 750 ms entre as caudadas permite dois contatos reais separados pela graça normal de 650 ms; Dash continua usando sua invulnerabilidade original.

Quebrar crostas durante a sequência só expõe o peito depois da volta, se nenhum golpe de cauda tiver causado dano real a um participante. Contato rejeitado por Dash/graça não invalida a abertura. Se a cauda acerta, o gelo ainda quebra e limpa o chão, mas o dragão se recompõe protegido. A abertura existente de 3500 ms, os multiplicadores 0,22/1,6 e os limiares de fase são preservados. Uma fase não consome a abertura conquistada.

**Mesmo HP-base 1100 / 1760 no normal solo**, mesmos 220 XP e aperfeiçoamento único, registro com E antes do portal e requisitos da campanha. Pinturas, colisões, dimensões, enquadramento das Galerias e trilha permanecem. Reutiliza as figuras completas e os pools da 0.1.152; nenhum desenho estático por frame ou novo objeto por golpe. Protocolo 15; anfitrião resolve dano e abertura, convidado replica avisos/contatos e reconhece abertura pela pose real, não apenas pela presença de fragmentos.

## Laboratório

Namespace novo `dante-vesper-combat-v2`, separado por classe e dos testes rejeitados. Personagens e configurações reais são preservados. Reload mantém apenas o teste desta aba. Quatro classes e coop pelo painel.

Simula os três Ecos, mecanismo, Primeiro Eco, Warden, Siroco, Soterrado e sua pista, sinais da Fratura e das Galerias e quatro relatórios principais anteriores. Chegada com 1250 XP, equipamento normal, aperfeiçoamentos de chegada e cinco poções disponíveis; regionais pendentes. **Vésper começa vivo: sua vitória, recibo e registro não são simulados.**

## QA técnico e avaliação humana

Fixtures isolam contatos; a vitória completa e as tentativas de auto attack usam entradas reais e IA/HP/dano normais. A descoberta da solução e a diversão ainda dependem do usuário.

- [Mecânica](qa/combat.json): sopro, crostas persistentes e intervalo compartilhado; cauda traseira, aviso de volta fixo, dois contatos laterais de 59 HP e negação da abertura após dano real, mesmo quebrando gelo. Quatro kits atingem a abertura com mouse real (janela prolongada só para essa medição). Quatro tentativas frontais paradas perdem; R restaura um único boss vivo. Pool permanece em 101 filhos da cena e 25 objetos cooperativos.
- [Retaguarda](qa/rear-auto/rear-auto.json): oito tentativas, quatro classes em posição traseira fixa e seguindo as costas com WASD, segurando o ataque básico. Todas terminam em derrota, com Vésper ainda em 1557–1663 de seus 1760 HP. Uma posição e um sopro inicial são preparados para representar a chegada atrás da direção já marcada; depois, nenhuma alteração de HP, posição, IA ou tempo, nem poções ou Dash. O controlador que segue a retaguarda evita obstáculos/gelo, mas não reage aos avisos de ataque. [Reprodução da falha na 0.1.152](qa/rear-before-152.json).
- [Vitória completa](qa/playthrough/playthrough.json): Guerreiro de chegada com 145 HP, Vésper com 1760, entradas reais WASD/Dash/Q/mouse e IA normal. Sem mutações de combate ou poções. Três fases e quatro aberturas, menor HP amostrado 100; a subida de nível original recupera para 150 após a vitória. Registro com E e reload preservam 1470 XP, uma vitória e o desbloqueio original. O controlador conhece os estados e planeja caminhos; não equivale a um jogador descobrindo a mecânica.
- [Ciclo e Dash](qa/lifecycle/lifecycle.json): fixtures de 1 HP isolam contatos letais de cauda/sopro. A mesma atualização que suspende o boss não pode recriar aviso ou névoa depois de limpar os efeitos. Morte não dá vitória/XP; R restaura o encontro. Um Dash real evita a primeira caudada e permite a abertura depois da volta quebrar gelo, conservando 145/145 HP.
- [Dupla](qa/coop/coop.json): dois Chrome e relay local real. Convidado recebe 62 HP de cauda na escala existente da dupla, quebra de gelo não abre depois de acerto, sequência limpa abre e aumenta dano dos projéteis reais. Duas advertências sonoras por sequência e só uma indicação de abertura conquistada; não confundir fragmentos com vulnerabilidade. Vitória por golpe real do convidado, 220 XP por integrante uma vez e reconexão sem repetir recibo. Preparações de posição/HP e recuperação prolongada isolam a inspeção; HP do boss é reduzido somente na prova final de recibo, sem simular vitória. A recuperação curta também é prolongada no fixture para capturas não perderem o estado de 320 ms.
- [Controles](qa/controls/controls.json): quatro classes com CDP multitouch, movimento/mira independentes em oito direções, ataque para trás, carga/soltura/cancelamento, modal e gamepad mock. Quatro layouts (568×320, 844×390, 1024×768, 1600×530), três reconstruções sem duplicar HUD. Boss vivo congelado para isolar entradas; não é prova de vencer a luta no celular físico.
- [Save antigo e atlas](qa/legacy/legacy.json): schema 1 sem sistemas opcionais, reload conserva XP/recibos anteriores e exatamente um Vésper vivo com 1760 HP. Registro e destinos vulcânicos continuam bloqueados pelos requisitos originais.
- [Build compilada](qa/compiled/public.json): Chrome sem globais DEV, chegada isolada/reload, movimento real até o gatilho de encontro, arte e trilha carregadas, volumes independentes e biblioteca atualizada. Personagens/configurações sentinela preservados.
- [Primeira conferência de publicação](qa/publication-attempt.json): commit `42ddb408` sincronizado com `origin/main`, mas sem status Vercel ou deployment registrado após o push; biblioteca pública ainda anterior. Protocolo público 15 confirmado. Este registro não aprova publicação. Novo push documental permite outra tentativa da integração; sem credencial local da Vercel para acionar deploy diretamente.

As imagens de aviso e abertura foram inspecionadas no desktop e viewport compacto. Arte reaproveitada da 0.1.152, sem recorte novo ou montagem por membros. Testes emulados não representam celular ou gamepad físico, grupo humano de quatro ou aprovação de dificuldade. Nenhuma duração global de campanha foi medida.

- [x] Mecânica, ida/volta, ausência de perseguição após aviso, quebra com/sem dano, quatro kits e pool.
- [x] Auto attack na retaguarda, parado e seguindo o corpo, quatro classes.
- [x] Vitória com movimento, três fases, registro com E e reload.
- [x] Anfitrião/convidado, dano e abertura, recompensas/reconexão.
- [x] Touch/gamepad emulados, resoluções, saves antigos/atlas.
- [x] Build compilada.
- [x] Typecheck/build/diff.
- [x] Sincronização do commit de gameplay com `origin/main`.
- [ ] Conferência pública: aguarda a integração GitHub/Vercel iniciar o deploy.
- [ ] Playtest humano desta revisão; não iniciar Incandescente antes dele.

Scripts: `qa-vesper-revision-153.mjs`, `qa-vesper-rear-auto-153.mjs`, `qa-vesper-playthrough-153.mjs`, `qa-vesper-lifecycle-153.mjs`, `qa-vesper-coop-153.mjs` e `qa-vesper-public-153.mjs`. Controles/save reutilizam `qa-vesper-controls.mjs` e `qa-vesper-legacy.mjs` com `QA_OUT` neste diretório. `npm run typecheck` e `npm run build` passaram; único aviso conhecido é o tamanho do chunk Phaser.
