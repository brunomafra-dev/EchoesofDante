# Perfis elementais por espécie — 0.1.93

Revisão solicitada pelo usuário após 0.1.92: **todas as criaturas**, incluindo bosses, devem possuir fraquezas e resistências. Esta entrega permanece na etapa 5 do plano RPG.

## Regra

Cada espécie possui uma fraqueza (**125% do dano**), uma resistência (**75%**) e dois elementos neutros (**100%**). Não há imunidade. O básico, o impacto do Q e os ticks de fogo seguem a mesma regra. A espécie mantém seu perfil mesmo em outro mapa; o elemento é capturado no lançamento, não consultado novamente quando a seleção muda.

| Espécie | Fraqueza +25% | Resistência −25% | Leitura de combate/material |
|---|---|---|---|
| Rastejante Hollow | Fogo | Terra | Tecido orgânico com carapaça apoiada no solo |
| Saltador | Terra | Fogo | Corpo leve, carapaça adaptada ao calor subterrâneo |
| Cuspidor | Energia | Água | Sacos de fluido condutivo |
| Casco Errante | Energia | Terra | Carapaça mineral densa |
| Espinhante | Fogo | Água | Tecido vegetal |
| O Warden | Terra | Energia | Placas antigas energizadas, suscetíveis a impacto mineral |
| Rasga-gelo | Fogo | Água | Anatomia glacial |
| Cuspidor Boreal | Fogo | Água | Anatomia glacial |
| Casco Glacial | Fogo | Água | Carapaça glacial |
| Vésper, o Sopro Branco | Fogo | Água | Organismo adaptado à geada |
| Rasga-areia | Água | Fogo | Anatomia adaptada ao calor árido |
| Cuspidor vítreo | Água | Fogo | Carapaça vítrea adaptada ao calor |
| O Soterrado | Água | Fogo | Escavador adaptado ao Siroco |

Esses perfis são decisões de balanceamento inicial, não uma explicação definitiva da origem das criaturas. Nenhuma etapa de lore foi adiantada.

## Cálculo e apresentação

O multiplicador é aplicado uma vez **por alvo**, após os bônus atuais de equipamento/carga. Arredondamento ao inteiro mais próximo; o número mostra HP realmente removido. Com dano base 20: **25 ↑** se vulnerável, **15 ↓** se resistente e **20** se neutro. As setas mantêm o tamanho discreto do número e não dependem apenas de cor. As quatro cores elementais continuam iguais.

A resistência reduz o dano; não anula a desaceleração de água ou o empurrão de terra. Bosses conservam sua proteção contra controle e suas janelas de vulnerabilidade. Guerreiro e Hunter mantêm o dano não elemental existente. Sem alteração de HP, XP, IA, recargas, custo de energia, drops, controle ou equipamento.

Configuração central em `src/config/elementalCombat.ts`, com `Record<SpeciesId, ...>` obrigatório: incluir uma nova espécie sem perfil causa erro no typecheck. O bestiário mostra fraqueza e resistência após observar uma criatura, sem adicionar textos flutuantes ao cenário.

## Teste reservado

[Comparar fogo/água no gelo](https://echosofdante.vercel.app/astral-playtest.html?region=frost&element=water&kit=basic&affinities=1&v=0.1.93) · [Hollow na Floresta](https://echosofdante.vercel.app/astral-playtest.html?region=forest&element=fire&kit=basic&affinities=1&v=0.1.93) · [Água/fogo no Siroco](https://echosofdante.vercel.app/astral-playtest.html?region=arid&element=water&kit=basic&affinities=1&v=0.1.93) · [Terra/energia no Warden](https://echosofdante.vercel.app/astral-playtest.html?region=warden&element=earth&kit=basic&affinities=1&v=0.1.93).

F/Y/botão troca elemento; Q mantém segurar/mirar/soltar. Recolha o painel e abra **Registros**. `affinities=1` marca todos os perfis como observados **somente no personagem temporário do laboratório**, permitindo consultar a tabela completa sem percorrer a campanha. Seus saves reais permanecem intactos; na campanha normal é necessário observar a espécie.

## Rede e performance

Mesmo cálculo autoritativo para Astral anfitrião e visitante. O snapshot replica dano real, cor e flags de vantagem/resistência; visitante não calcula dano novamente. `resisted` é opcional no protocolo 6, sem novo comando ou alteração do relay. Histórico já existente: máximo 24 impactos, deduplicação por ID, apresentação por 650 ms.

Nenhum asset novo, nenhum objeto extra por espécie ou redraw de cenário. O renderer normal conserva seu feedback curto e o de referência seu pool. QA usa Chrome headless, fixtures identificadas, WebSocket local real, touch emulado e gamepad mock. A validação humana do balanceamento permanece necessária; nenhuma nova etapa do plano será iniciada antes dela.

## Evidências

- **Typecheck/build passaram.** Sem novos avisos críticos; permanece o aviso existente do tamanho do bundle Phaser.
- [Matriz e WebSocket](qa/affinities.json): **13 espécies × 4 elementos = 52 combinações**, exatamente uma fraqueza/uma resistência/duas neutras por espécie; grupos mistos 25/15/20 no mesmo ataque, janela invulnerável de boss preservada, duas apresentações do número, cores e setas corretas, bestiário completo, básico/DOT após troca de seleção e resistência replicada ao visitante sem duplicação.
- [Regressão Astral](qa/regression/astral.json): teclado/mouse, apresentações/vestimentas, solo, ambos os papéis da dupla local, cancelamento de Q, gamepad mock e touch emulado passaram; quatro resoluções. Zero erros JS/assets.
- Três mortes/respawns mantiveram **400 objetos / 210 texturas / 25 tweens**. FPS headless na regressão: **60,2 anfitrião / 59,7 visitante**; no teste direcionado, média **57,0 / 56,1** depois do aquecimento. Sem crescimento contínuo.

Dados usam fixtures de posição/HP para verificar a aritmética, não uma aprovação humana de dificuldade ou uma partida física. Não houve teste físico de iPhone/gamepad. A dupla foi testada com relay local real, protocolo 6; isso não confirma atualização/disponibilidade do serviço Render público. Publicação e smoke da build Vercel serão registrados após o push.

**Aguardar playtest humano desta matriz antes da próxima etapa.** Os exemplos de material/anatomia justificam a escolha inicial; intensidade e perfis podem ser recalibrados conforme as partidas.
