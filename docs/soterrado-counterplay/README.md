# Soterrado — carapaça, formação e contra-ataque · 0.1.151

[Enfrentar o Soterrado vivo](https://echosofdante.vercel.app/campaign-playtest.html?soterrado=1&v=0.1.151) · [Biblioteca](https://echosofdante.vercel.app/test-library.html)

## Autorização e escopo

Em 27/10/2026 o usuário aprovou a revisão 0.1.150 do Warden (“Aprovadissimo”) e pediu aplicar ao próximo boss. Esta entrega altera somente o Soterrado. A aprovação do Warden está registrada separadamente; não aprova automaticamente este combate ou a trilha. Aguardar o playtest desta revisão antes de Vésper, Incandescente ou outro capítulo.

## Como o encontro muda

A defesa mineral fecha os golpes comuns de todas as classes, inclusive do visitante. A investida trava a direção na preparação e percorre até 700 unidades a 740/s. Colidir com uma das formações físicas comprime o corpo e abre as placas dorsais; acertar o limite da arena ou o vestígio ancestral não substitui essa colisão. Desviar sem provocar choque evita o golpe, mas mantém a carapaça intacta. A solução é indicada pela reação física, arte e som; a interface não dá instruções de solução.

O choque dura 3600 ms: a abertura começa em 320 ms, fecha nos últimos 160 ms e multiplica o dano recebido por 1,65. Não há contador de colisões exigidas, aumento de HP ou destruição finita das formações. É possível aproveitar mais ou menos cada oportunidade com básico e técnica. A fase de 48% aguarda a abertura terminar e nunca cancela um golpe comprometido. As recuperações comuns são curtas e protegidas.

As quatro formações periféricas existentes permanecem. Duas bases baixas adicionais, em (820,590) e (1190,965), reutilizam a arte de rocha existente e têm o mesmo raio físico de 44. Há passagem pelos dois lados, sem deslocar entrada, subida ou vestígio. A pintura aprovada, limites 1800×1500 e faixa física original são preservados. A investida usa contato varrido com o primeiro círculo sólido e para na superfície; não usa o deslizamento de caminhada para contornar a rocha.

| Golpe | Aviso | Contato após iniciar a execução | Dano-base / normal solo sem resistência |
|---|---:|---:|---:|
| Varredura | 680 ms | 220 ms | 34 / 43 |
| Investida | 950 ms | contato físico no trajeto | 40 / 50 |
| Emersão | 1250 ms | 280 ms | 38 / 48 |
| Fissuras | 950 ms | 180, 600 e 1020 ms | 30 / 38 por marca |

Escala regional 1,25, dificuldade, resistência/equipamento, quantidade de integrantes, Dash e graça de dano existentes continuam aplicados. HP-base permanece **850**, ou **1233** com a escala regional 1,45 em normal solo. Não há adaptação ao equipamento do jogador. Primeiro padrão passa a incluir a investida; fase 2 acrescenta fissuras e mantém o retorno a ela.

## Arte, áudio e execução

[Prompt e modo integrado imagegen](art-prompt.md), [fonte, hashes, recortes e registro](art-source.json). Oito figuras inteiras para preparação, avanço, compressão, placas partidas, respiração e fechamento em `public/assets/visual/creature-finish/soterrado-crash-v1.webp`. Poses antigas de caminhada, escavação, fase e morte preservadas. As figuras foram registradas pelas margens transparentes reais para não cortar a garra entre colunas; nenhuma montagem de membros.

Poeira, lascas e trincas usam quatro Images fixas e duas texturas Canvas preparadas uma vez. Não há desenho estático por frame, criação de partículas, timers ou tweens por ataque. Os buracos e suas poeiras continuam reutilizados; a poeira da emersão acompanha o contato. Sons e tremor ocorrem na colisão/ativação, com o mesmo volume/mixagem aprovados tecnicamente na entrega anterior. Não há mudança musical nesta etapa.

O visitante recebe as poses completas, recorte de escavação, corredor e impactos no BossVisual existente. Os efeitos visíveis identificam o contato para reproduzir o som local, sem antecipá-lo à execução. Protocolo **15** preservado; não exige atualização do relay. Recompensa original de **180 XP + ponto de aperfeiçoamento**, recibo individual, escolha depois do colapso, pista com E e passagem ao frio permanecem no caminho original.

## Laboratório e dados

Namespace temporário por classe `dante-soterrado-combat-v1`, isolando localStorage e sessionStorage do jogo antes de importar seus sistemas. Reload mantém somente os dados desta aba. Personagens e configurações reais não são lidos ou alterados.

A chegada simula três Ecos, mecanismo, Primeiro Eco, vitória do Warden, Vale, Siroco, ruínas e descida das Dunas. Os quatro relatórios principais anteriores são entregues; os regionais ficam pendentes. Usa 950 XP, aperfeiçoamentos de chegada, equipamento normal e cinco poções disponíveis. **Não simula vitória, recibo, pista ou portal do Soterrado.** O personagem começa antes do gatilho do encontro. Troca de classe e recomeço no painel reservado. Na campanha oficial, todos os requisitos continuam necessários.

Coop: sair ao início pelo Esc, criar equipe, compartilhar convite do laboratório e iniciar com todos presentes. O anfitrião usa RECOMEÇAR SOTERRADO VIVO. O convite conserva o isolamento; nenhum atalho é adicionado ao jogo oficial.

## QA técnico e limites

- [Colisões, contato, quatro kits, tentativas estacionárias e respawn](qa/combat.json): fixtures de posição/estado isolam golpes; ataques básicos usam mouse real. Testes de abertura nas quatro classes prolongam a abertura somente para medir dano e obter capturas estáveis. Tentativas estacionárias usam IA, HP, dano e relógio normais, sem invulnerabilidade ou poções.
- [Tentativas estacionárias atrás de uma formação](qa/anchor-stationary/combat.json): mais quatro confrontos com IA/HP/dano normais. A posição inicial favorece provocar o choque; nenhuma classe venceu permanecendo parada com básico pressionado. Isso amplia a amostra de posições, sem provar ausência de toda estratégia estacionária possível.
- [Tentativa completa com movimento](qa/playthrough/playthrough.json): Guerreiro da chegada com 140 HP, boss normal de 1233 HP, WASD/Dash/Q/mouse reais, sem alterar posição, HP, IA, invulnerabilidade, poções ou relógio durante o combate. O controlador conhece os estados e a solução; não representa descoberta humana. Na amostra final passou pelas duas fases sem perder HP; a vitória cruza o nível 6 e aplica a recuperação de vida original para 145 HP. Andou até a pista, usou E e recarregou, mantendo 1130 XP e uma única vitória.
- [Dupla](qa/coop/coop.json): dois processos Chrome e relay local real. Convidado atrai a investida, recebe a animação e causa dano com projéteis reais. Contato causa 53 de dano no convidado com escala da dupla. Abertura prolongada no fixture para inspeção; HP final reduzido apenas para verificar o ciclo de morte/recibo, não para simular vitória no link. Cada integrante recebe 180 XP uma vez, música para, pista continua pendente e reconexão não repete recompensa.
- [Touch nas quatro classes e gamepad](qa/controls/controls.json): CDP multitouch, oito direções independentes, olhar sem disparar, carga/soltura/cancelamento, modal, resoluções compactas e três reconstruções da interface. Boss vivo congelado apenas para isolar controles.
- [Build compilada](qa/compiled/public.json): chegada real, reload, gatilho por teclado, carregamento da nova arte e da música, sentinelas de saves/configurações e biblioteca.
- [Save antigo e atlas](qa/legacy/legacy.json): schema 1 sem sistemas opcionais posteriores, reload conserva XP/Warden e um único Soterrado vivo. A interface do atlas mantém norte e regiões posteriores desabilitados.

Capturas de abertura e telas compactas inspecionadas visualmente. Poses diagnósticas usam pausa explícita; não representam tempo de reação humano. Touch/gamepad são emulados; não houve celular físico, controle físico ou grupo humano de quatro. A duração global da campanha continua sem medição humana. Os testes demonstram execução das regras, não aprovação da diversão, leitura ou dificuldade.

- [ ] Aprovação humana deste Soterrado.
- [ ] Após essa aprovação, iniciar Vésper em sprint separado.

Comandos: `npm run typecheck`, `npm run build`, `git diff --check`, `node scripts/qa-soterrado-counterplay.mjs`, `node scripts/qa-soterrado-playthrough-151.mjs`, `node scripts/qa-soterrado-coop.mjs`, `node scripts/qa-soterrado-controls.mjs`, `node scripts/qa-soterrado-anchor-stationary.mjs`, `node scripts/qa-soterrado-legacy.mjs`, `node scripts/qa-soterrado-public.mjs`. Todos passaram tecnicamente; aviso conhecido de tamanho do chunk Phaser permanece.
