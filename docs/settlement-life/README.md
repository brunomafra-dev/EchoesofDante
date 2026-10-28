# Dante — assentamento vivo e memória da exploração

Sprint 0.1.161, solicitado em 28/10/2026. A solicitação atual autoriza esta manutenção do mundo após os capítulos da permanência. Playtest humano continua separado do QA técnico.

- Minimap guarda a descoberta por personagem e região em coordenadas do mundo. Viajar, recarregar ou reconstruir a geometria não apaga o histórico. Salvamento periódico a cada 2,5 segundos, além dos flushes existentes.
- Inimigos comuns usam o registro de derrotas único que já acompanha a campanha e o coop. Reentrar na região ou morrer não repõe os derrotados nem concede XP repetido. Monstros não derrotados continuam presentes; encontros de reserva do tamanho da equipe continuam condicionados ao tamanho original.
- Ivo trabalha com martelo/espada/bancada, Lia com bandeja médica/frascos e Nara com mapas. Âncoras originais de missão fixas, seis figuras completas por atividade e volumes físicos para as mesas.
- **Tio Gui**, o senhor de cabelo escuro e bigode, e Elisa percorrem trajetos curtos, param para trabalhar e respondem a E/A/touch. Ao instalar o primeiro abrigo, saem da base e passam aos Terraços. Não existem simultaneamente nos dois locais.
- Mara e Tomás têm figuras próprias, diferentes dos primeiros colonos, e pequenas rotinas após a chegada já prevista na missão. Mudas trazidas da nave representam cuidado cotidiano; não produzem comida nem antecipam o capítulo de pesquisa.
- Animação troca quadros inteiros; chão e pintura continuam em raster/bake. NPCs móveis têm colisão, mas não invalidam o cache estático do minimapa. No coop, o anfitrião decide as rotinas e envia as poses aos convidados pelo protocolo 16 existente.

## Teste direto

[Assentamento vivo](https://echosofdante.vercel.app/campaign-playtest.html?settlement-life=1&v=0.1.161), também registrado na biblioteca. Começa na base; visite Terraços pelo atlas do teste. Na campanha normal, as mesmas mudanças respeitam seus requisitos reais.

Laboratório isolado por aba/classe, com namespace próprio em sessionStorage. Simula Warden e os sete relatórios até o abrigo, com Nascentes/Terraços descobertos. Os cinco capítulos posteriores continuam pendentes; Soterrado, Vésper e Incandescente vivos. Nenhum save/configuração real é lido ou alterado. Reload conserva a jornada do teste; fechar a aba descarta os personagens temporários. No coop, reúna a equipe original e use o preparo explícito somente no anfitrião.

## Compatibilidade e limites

Schema de save 1 e protocolo 16 mantidos. XP, equipamentos, moedas, recibos, requisitos e bosses existentes preservados. Cooldowns de habitats ainda registrados em saves antigos são migrados para derrotas permanentes, mesmo expirados, sem novo prêmio. Derrotas já registradas no progresso também permanecem.

Versões anteriores não gravavam os pixels descobertos do minimapa nem todas as derrotas de habitantes que já tinham renascido. Esse histórico ausente não pode ser reconstruído: a memória vale a partir desta atualização, somada aos registros antigos disponíveis. Sessões em andamento na versão antiga devem recarregar para receber a regra nova.

Construir casas após limpar outros mapas fica como proposta futura: reconhecer terreno seguro, levar materiais e instalar um abrigo por missão, com consequências visíveis. Este sprint não constrói novas colônias automaticamente, abre atalhos ou muda os requisitos dos relatórios.

## QA técnico

Scripts reproduzíveis:

- `node scripts/qa-settlement-life-model.mjs`: validação/limites da memória, isolamento por personagem e migração dos habitats antigos sem moeda/XP extra.
- `node scripts/qa-settlement-life.mjs`: serviços/falas/figuras, migração, cache, viagem/reload e derrotas nos caminhos de spawn existentes. DEV usa posições, dano letal e flags explícitas para inspecionar regiões; não mede dificuldade.
- `node scripts/qa-settlement-life-controls.mjs`: quatro classes, multitouch CDP, mira independente, interação e gamepad padrão simulado; quatro resoluções.
- `node scripts/qa-settlement-life-coop.mjs`: dois Chrome independentes, relay real, poses do anfitrião, conversa pelo convidado, memória pessoal e derrotas compartilhadas/reconexão.
- `node scripts/qa-settlement-life-migration.mjs`: instalação real do abrigo por E, saída dos colonos da base, amostras de trajetos com colisão, reload de derrotas dos IDs 3000+, morte/respawn por R e atlas bloqueado.

Modelo, solo, migração/morte, controles e dupla local passaram. Regressão completa do capítulo da água também passou com E/portais/atlas, entrega de créditos uma vez, reload, três retornos com contagens estáveis de objetos/texturas/colisões e diário em quatro resoluções. `npm run typecheck`, `npm run build` (252 módulos) e `git diff --check` passaram; aviso de chunks grandes já existente. Evidências em [qa/](qa/). Capturas da oficina, enfermaria, mesa de Nara, Tio Gui, Elisa, migração e layout 568×320 inspecionadas visualmente pelo agente; aprovação estética pertence ao usuário. Não representa celular físico, controle físico ou quatro pessoas jogando. As falhas iniciais do laboratório/preparo foram corrigidas; a preparação do QA da dupla usa conexões regionais válidas e invulnerabilidade de inspeção, sem alterar o jogo publicado.

Verificação de publicação e amostras compiladas/públicas são registradas separadamente após o envio. Render respondeu em protocolo 16/revisão `3a5481f`; nenhum deploy de backend é necessário neste sprint.

Preview compilado 5193 passou sem globals DEV: laboratório isolado, aceite por diálogo, reload e sentinelas de saves/configurações. Duas instâncias Chrome também passaram por criação da equipe, convite, preparo explícito, caminhada até Lia, aceite pelo convidado, quadros de trabalho compartilhados, reload/reentrada e encerramento normal da sala. Essa amostra compilada não representa o percurso completo dos cinco capítulos.

Arte e proveniência: [ASSET_PROMPTS.md](ASSET_PROMPTS.md).
