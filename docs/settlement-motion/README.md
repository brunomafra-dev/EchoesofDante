# Movimento mais leve dos NPCs — 0.1.162

28/10/2026: usuário aprovou o conjunto da 0.1.161 e pediu movimento menos robótico, mais natural e leve. Esta revisão trata das rotinas e apresentação dos NPCs; não inicia colonização de novos mapas ou outro capítulo.

- Moradores aceleram e freiam gradualmente. Curvas dos pontos intermediários conservam movimento; as paradas de trabalho ficam nos extremos da rotina. Passada acompanha a distância realmente percorrida, sem pedalar parado contra uma colisão.
- Tio Gui, Elisa, Mara e Tomás usam folhas de dezesseis figuras completas: caminhada, repouso/preparação e gestos de trabalho. O ciclo seleciona as passadas curtas; duas poses de joelho exageradamente alto foram excluídas após inspeção visual. Abaixar, levantar e interromper a tarefa para conversar passam por poses intermediárias. Tomás prepara e consulta o manifesto em pé. Ritmos e esperas são diferentes por morador.
- Ivo, Lia e Nara conservam suas posições e serviços. A sequência de trabalho tem retorno entre os gestos; a antiga pausa inicial de 1,4 s foi reduzida. Metadados novos registram o apoio das mesas para evitar o salto da bancada entre quadros.
- No convidado, posições são apresentadas entre amostras do anfitrião com buffer de 90 ms e relógio local, em vez de saltarem a cada pacote. Isso é só apresentação: física, rotinas e interações continuam sob autoridade do anfitrião. Perda prolongada de conexão congela a amostra, sem inventar caminhada indefinida.
- Colisões, âncoras de missão, falas, migração base/abrigo, minimapa, derrotas permanentes, recompensas e requisitos originais preservados. Protocolo 16 e schema de saves mantidos. Ambos os participantes devem atualizar a página para ver as mesmas folhas novas.

## Acesso específico

[Laboratório do movimento](https://echosofdante.vercel.app/campaign-playtest.html?settlement-motion=1&v=0.1.162). Começa na base; visite Terraços pelo atlas e observe um ciclo de caminhar, trabalhar e conversar com E/A/touch. O painel explica o preparo da dupla.

Namespace próprio `dante-settlement-motion-v1`, isolado dos personagens reais e do laboratório 0.1.161. Simula Warden e os sete relatórios até o primeiro abrigo; Nascentes/Terraços descobertos. Os cinco capítulos seguintes permanecem pendentes, assim como Soterrado, Vésper e Incandescente. Reload conserva o teste na mesma aba; fechar a aba descarta o save temporário. Nenhum save real é apagado ou reiniciado.

## Arte e reprodução

Imagem gerada com ferramenta integrada `imagegen`, a partir das quatro folhas aprovadas da 0.1.161, preservando corpo inteiro, identidade, roupas e direção Organic Sci-Fi R3. [Briefs, origens e caminhos finais](ASSET_PROMPTS.md). Sem montagem de membros. WebP de moradores 4×4, quadros 256×256: cerca de 1,16 MB no total; as folhas antigas permanecem disponíveis sem serem carregadas para esses moradores.

`scripts/pack-settlement-motion.mjs` copia os PNG originais para `.local/settlement-motion/raw/` (ignorado), empacota/redimensiona as células por Canvas e grava pivôs em `frames-r2.json`. Não gera arte a cada frame. Mesas, chão e pinturas continuam em raster/bake/cache; o cache do minimapa ignora somente os volumes móveis dos moradores.

## QA e limites

Scripts: `qa-settlement-motion-model.mjs`, `qa-settlement-motion.mjs`, `qa-settlement-motion-coop.mjs`, `qa-settlement-motion-controls.mjs`, `qa-settlement-motion-public.mjs` e `qa-settlement-motion-public-coop.mjs`. Evidências em [qa/](qa/).

Modelo passou: aceleração/frenagem, invariância da passada a 30/60 Hz, desvio de sólido, apresentação contínua de pacotes a cada 100 ms, retenção segura quando os pacotes param e recuperação sem salto após interrupção simulada de 400 ms. A revisão limita o avanço do relógio de apresentação e não o deixa passar da amostra disponível. Solo passou com seis quadros de Ivo, três serviços fixos, caminhada/preparação/trabalho/retorno dos dois moradores, colisões, cache estável, conversa com E e reload do minimapa sem alterar saves reais ou derrotar bosses posteriores. Uma amostra de 36 s registrou aproximadamente 60 FPS no desktop; não representa teste em celular físico, equipe humana de quatro ou garantia de desempenho.

Dupla local passou por poses compartilhadas, conversa pelo convidado, viagem, minimapa, derrota permanente salva pelos dois integrantes e reconexão. Quatro classes passaram em Chrome com multitouch CDP, mira traseira independente, conversa por touch e gamepad padrão simulado; quatro resoluções. Mara e Tomás também passaram nas rotinas completas com pelo menos doze poses distintas, sem invadir sólidos, em uma chegada preparada somente pelo QA (`qa-settlement-motion-arrivals.mjs`).

Capturas da oficina em poses diferentes, moradores e controle 568×320 inspecionadas pelo agente. Essa inspeção e o QA técnico não aprovam a naturalidade por você. **Playtest humano da 0.1.162 pendente** antes de outra etapa.

`npm run typecheck`, `npm run build` (253 módulos) e `git diff --check` passaram. Preview compilado 5193, sem globals DEV: laboratório isolado/diálogo/reload do minimapa, mais dupla com convite, preparo explícito, caminhada até Lia, aceite pelo convidado, poses de trabalho compartilhadas, reload/reentrada com créditos/recibos/bosses preservados e viagem normal dos dois ao acampamento pelo atlas. A dupla recebe as poses móveis de Tio Gui/Elisa e encerra a sala pelo menu. A inspeção próxima das animações usa o laboratório local; a amostra compilada não equivale à campanha humana completa. Publicação é registrada após o push e conferência.
