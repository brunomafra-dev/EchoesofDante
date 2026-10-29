# O rastro do Primeiro Eco · 0.1.170

Autorizado em 29/10/2026 após aprovação expressa da 0.1.169. Um capítulo após a frequência: Nara e Ivo comparam o registro antigo para distinguir retorno local de possível resposta. Não prova origem humana ou traduz toda a estrutura.

## Escopo

Nara oferece somente após `settle-signal` entregue. Cinco objetivos: cópia isolada na base, comparação diante do Primeiro Eco, condução do pulso por dois desviadores, leitura lateral e arquivo na base. Entrega a Nara concede **150 créditos por integrante, uma vez**, sem XP/material novo ou consumo de equipamento pessoal.

Cada desviador tem três posições. E/toque/A gira; a nervura mostra o destino. O emissor lança um pulso visível pela ligação atual, que pode voltar ou terminar numa extremidade sem registro. Apenas alcançar a superfície lateral valida `pr-flow`. Durante a propagação os desviadores ficam ocupados; não há quota, sequência cronometrada ou espera de produção. Qualquer integrante pode ajustar/emitir; o anfitrião decide e replica o estado. Direções ficam no save; pulso em curso é transitório e pode ser emitido novamente após viagem/reload sem custo.

O circuito ocupa o corredor já acessível das cavernas antes do limiar do Warden. Não move portões, abre atalhos, altera requisitos, repete bosses ou renova criaturas. Reutiliza relés/objetos completos existentes. A ligação é rasterizada/cacheada e atualiza transformações, sem desenho estático por frame. A base recebe um arquivo físico de retornos, independente da água/energia do assentamento; moradores e serviços não são transferidos.

## Laboratório

[Teste direto](https://echosofdante.vercel.app/campaign-playtest.html?permanence=echo&v=0.1.170), registrado em `test-library.html`. Namespace `dante-permanence-v1.echo.<classe>.`, em sessionStorage; personagens/configurações reais preservados. Simula Warden, sete relatórios originais, sete capítulos anteriores e Bacia conquistada, sem XP/drops das derrotas simuladas. Novo circuito, cinco objetivos/entrega/150 créditos pendentes. Criaturas ainda não derrotadas das cavernas permanecem. Soterrado, Vésper e Incandescente vivos. Somente o anfitrião prepara a equipe original no coop.

Protocolo 16 mantido; capacidade opcional `circuits:1` e nove IDs de evidência no catálogo. Capítulos antigos continuam no relay anterior; save/laboratório do circuito recusa catálogo antigo preservando o progresso. Conferir incompatibilidade real antes de pedir deploy externo.

## QA e publicação

- [x] Typecheck/build de 260 módulos, com aviso preexistente de chunks acima de 500 kB. [Modelo](qa/model/report.json): nove combinações, direções reversíveis sem completar relatório, catálogo opcional e serializer real 0.1.166; falha de escrita/rollback/retry e recibo de 150 uma vez, sem XP/material/boss adicional.
- [x] [Solo completo](qa/echo/solo.json): aceite/entrega reais por diálogo, cinco objetivos por E, rota errada, chegada real do pulso e direções após reload. [Dupla completa](qa/coop/coop.json): dois Chrome, convidado ajusta/emite/lê/entrega, host valida chegada, pulso em trânsito compartilhado e 150 por integrante sem repetição na reconexão. Posicionamento/invulnerabilidade são fixtures declaradas; não medem duração humana.
- [x] [Mundo](qa/world/report.json): nove aproximações/acessos originais conectados; WASD/Dash respeitam relé; dano letal/R/reload mantém direção/parcial sem inventar chegada; três retornos com contagens estáveis e um arquivo. Visitas contaminadas não liberam frio/bosses posteriores. Capturas inspecionadas pelo agente: circuito afastado da arquitetura antiga e leitura afastada do paredão sul; figuras visíveis e rótulos duplicados removidos.
- [x] [Controles](qa/controls/report.json): quatro classes por toque e A do gamepad padrão emulado; rota errada recusada, giros/emissão reais sem disparar. 568×320, 844×390, 1024×768 e 1920×1080; capturas inspecionadas pelo agente.
- [x] [Compatibilidade](qa/compatibility/report.json): relay histórico exato `e968e07`, protocolo 16, mantém capítulo da frequência; novo laboratório/save recusa ausência de `circuits:1` sem descartar objetivos. Relay atualizado reconecta preservando o mesmo estado.
- [x] [Circuito compilado](qa/compiled/report.json), sem globais DEV: fixture explícita prepara frequência anterior, cópia e comparação; giros/chegada/leitura/arquivo/recompensa ficam pendentes. Caminhada real desde checkpoint original, recusa do circuito rompido, ajustes por WASD/E, chegada e reload parcial passaram. Não simula novas derrotas das cavernas. O teste lê a disponibilidade real da interação para compensar variação de frames; não move o personagem por API.
- [x] [Dupla compilada local](qa/compiled-coop/report.json), `http://localhost:5196`: dois Chrome sem globais DEV, sala/convite/preparo pelo fluxo normal, aceite com Nara e cópia por caminhada/E do convidado; reload/reentrada original mantém saldo/recibos e bosses posteriores. É amostra do início; o circuito/entrega completos foram cobertos na dupla DEV acima.
- [x] [Capítulos compilados locais](qa/compiled-chapters/public.json): novo circuito, frequência anterior e posto por aceite/reload reais, com sentinelas dos personagens/configurações preservadas; links registrados na biblioteca.
- [ ] Compilado local/público, hashes, capacidade real do relay e commit/push sincronizado.
- [ ] Playtest humano antes de outro capítulo.

Automação não mede diversão, duração ou naturalidade humana; não equivale a celular físico ou equipe humana de quatro.

Conferência externa antes do push: Render respondeu revisão `e968e07`, 16 / `outposts:1` / `signals:1`, sem `circuits:1`. O novo capítulo cooperativo aguarda deploy do catálogo; não confundir build local aprovada com publicação pública.
