# Astral — cor do dano e fraquezas · 0.1.92

O usuário aprovou as manifestações elementais de 0.1.91 e pediu números com a cor do ataque e vantagens conforme a criatura. Esta revisão permanece na etapa 5; nenhuma próxima classe foi iniciada.

## Teste reservado

[Fogo na Fratura Boreal](https://echosofdante.vercel.app/astral-playtest.html?region=frost&element=fire&kit=basic&v=0.1.92) · [Água no Siroco](https://echosofdante.vercel.app/astral-playtest.html?region=arid&element=water&kit=basic&v=0.1.92).

Personagens temporários, saves reais intactos. Compare o mesmo tipo de criatura com F/Y/botão de elemento. Básico e Q mantêm o elemento escolhido na emissão; chamas já lançadas não viram água quando a seleção muda. Recolha o painel para jogar. As fraquezas aparecem nos Registros após observar a espécie.

## Regra inicial

| Ataque | Cor do número | Vantagem |
|---|---|---|
| Energia | Ciano `#5fe6d8` | Neutro |
| Fogo | Vermelho alaranjado `#ff6a4a` | +25% contra Rasga-gelo, Cuspidor Boreal, Casco Glacial e Vésper |
| Água | Azul claro `#83ccd8` | +25% contra Rasga-areia, Cuspidor vítreo e O Soterrado |
| Terra | Âmbar `#ffbd54` | Neutro |

A fraqueza pertence à **espécie**, não à posição do jogador ou ao mapa. Outras combinações conservam 100% do dano; não há imunidades, resistências adicionais ou reações encadeadas nesta entrega. Valores conservadores para incentivar escolhas sem inviabilizar um elemento preferido.

O multiplicador é aplicado uma vez por alvo, depois dos bônus existentes de equipamento/carga, com arredondamento ao inteiro mais próximo. Exemplo: 20 → **25 ↑**; 18 → **23 ↑**. O número mostra vida realmente removida, portanto pode ser menor no golpe final. `↑` comunica vantagem sem depender somente de cor, com o mesmo tamanho discreto de texto.

Guerreiro/Hunter não recebem afinidade por usarem um VFX de cor semelhante. É necessário um ataque identificado como elemental. Dano recebido conserva vermelho próprio. HP, recargas, custos, controle dos bosses, loot, XP e inimigos não foram alterados.

## Cooperativo e execução

O anfitrião calcula o dano usando a espécie e o elemento capturado do visitante. Feedback de dano é enviado no snapshot existente com ID monotônico; o visitante apresenta números exatos e não reaplica dano. Histórico limitado a 24 impactos e 650 ms; snapshots repetidos não duplicam números. Campo opcional compatível com protocolo 6, sem novo tipo de comando no relay.

Não há assets novos, shaders, partículas contínuas ou geração de texturas. O renderer de referência conserva seu pool de quatro impactos; o renderer normal conserva suas animações curtas com destruição ao final. Cenários e controles preservados.

## Validação

Evidências em [qa/](qa/). `scripts/qa-astral-affinities.mjs` verifica cálculo real no GameScene para as 14 espécies × quatro elementos, cores dos dois renderers, dano recebido, ataque não elemental, projétil/DOT após troca de elemento, bestiário, feedback através de WebSocket real e limite/deduplicação do histórico. Fixtures de posição/HP são identificadas como automação, não playtest humano.

Typecheck e build passaram, sem novos erros de JavaScript/assets nos browsers. Matriz de 56 combinações, Q/DOT, bestiário e WebSocket passaram. Regressão `qa-astral.mjs`: apresentações/vestimentas, teclado, cancelamento de Q, Astral anfitrião/visitante, gamepad mock, touch CDP e quatro resoluções passaram. Três mortes/respawns mantiveram **400 objetos, 210 texturas e 25 tweens**, com penalidade de créditos existente preservada.

FPS headless na regressão: **59,3 anfitrião / 58,4 visitante**. No teste direcionado de impactos, média após aquecimento **56,7 / 54,8**, com objetos/tweens estáveis. A rajada artificial de 80 impactos em um frame não representa gameplay e foi descartada da medição estável. Captura [fogo no gelo](qa/fire-frost.png); dados [afinidades](qa/affinities.json) e [regressão](qa/regression/astral.json).

Publicação Vercel confirmada após o push de `7e0cc7f`. QA da build pública passou: quatro elementos, básico, hold/release Q, energia consumida, 12 atlas carregados, 1280×720 / 1366×768 / 1920×1080 / 844×390, saves reais intactos e zero erros JS/assets. [Evidência publicada](qa/public/solo.json). A matriz numérica foi validada no Chrome local com fixtures; o smoke público verifica a build/controles/carregamento, sem acesso aos hooks DEV.

**A vantagem de 25% exige avaliação humana de dificuldade; não constitui balanceamento definitivo.** Sem teste físico de iPhone/gamepad neste ambiente. Cooperativo público depende do serviço de salas estar atualizado para protocolo 6; QA local não substitui esse deploy. A consulta pública de saúde nesta entrega expirou após 30 s; a verificação anterior de 0.1.91 ainda indicava protocolo 4. Não houve validação pública da dupla nesta revisão.
