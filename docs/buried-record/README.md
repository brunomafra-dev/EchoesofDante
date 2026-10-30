# O que a areia guardou / memória do minimapa · 0.1.174

Durante o sprint das Dunas, usuário pediu concluir/publicar e seguir imediatamente o próximo passo do plano, incluindo guardar o minimapa já revelado. Este capítulo continua a descida e o registro do Soterrado, com as regras originais; não antecipa outra região ou uma colônia. Após esta etapa, aguardar avaliação humana.

## Campanha

Nara pede distinguir o movimento da criatura e o intervalo regular enterrado. Após o perfil das Dunas: descida original, confirmação da segurança pelo confronto, leitura do registro original e testemunho vitrificado da parede. **180 créditos por integrante, uma vez**, sem XP novo ou consumo de equipamento pessoal. A vitória e o registro anteriores contam, sem exigir repetir o boss. A missão observa fatos; não marca vitória ou abre passagem. XP/recompensa/mecânica/HP do Soterrado e acesso original à Fratura preservados. Uma figura nova representa o testemunho; depois da entrega, a amostra isolada permanece junto de Lia. Seu collider só existe depois do confronto/registro, preservando a arena durante a luta.

[Capítulo isolado](https://echosofdante.vercel.app/campaign-playtest.html?permanence=buried&v=0.1.174), namespace `dante-permanence-v1.buried.<classe>.`. Simula Warden, sete relatórios originais, dez capítulos anteriores, Bacia conquistada, análises/ruínas das Dunas e chegada com **950 XP**, como o laboratório do Soterrado aprovado. Não simula chegada à Bacia Soterrada, vitória desse boss, registro, amostra, entrega ou recompensa. Vésper/Incandescente também vivos. Personagens/settings reais protegidos. Coop requer catálogo `buried:1`, protocolo 16 mantido; botão de preparo só no anfitrião.

## Descoberta persistente

[Revisar a memória do minimapa](https://echosofdante.vercel.app/campaign-playtest.html?permanence=buried&map-memory=1&v=0.1.174), namespace `dante-map-memory-v1.<classe>.`, com os mesmos pré-requisitos explícitos acima e memória própria. Ande, viaje, retorne e recarregue. A descoberta é por personagem/região, independente de qual missão está acompanhada; manter uma região conhecida não revela vizinhas bloqueadas.

Os laboratórios são temporários por aba: fechá-la descarta apenas o teste. Na campanha normal, a memória fica no save permanente do personagem neste navegador. Não substituem ou apagam personagens reais.

O sistema anterior já gravava a descoberta. Foi reproduzida uma gravação posterior de checkpoint antigo apagando as células recentes: [antes da correção](qa/memory-model/before-fix.json). `LocalJourney.save` agora reúne as células já gravadas e as recebidas antes da escrita, sem substituir valores novos por histórico ausente de um escritor antigo. Créditos, missões, recibos e flags não são mesclados por essa regra. Células gravadas têm prioridade sob os limites existentes. Personagens separados e reset explícito continuam separados; não inventa um histórico que nunca foi salvo. Não afirma que esse foi o único gatilho visto pelo usuário.

## Arte e custo

Ferramenta **image_gen integrada**, uma geração nova RGBA, sem CLI/API externa. [Fonte](source/vitrified-core-generated.png), [asset e hash](source/asset.json), destino `public/assets/buried-record/vitrified-core-v1.png`. `python scripts/prepare-buried-record.py` só recorta pelo alpha, redimensiona e empacota com margem; não pinta ou remove fundo. Prompt set: objeto inteiro isométrico Organic Sci-Fi R3, núcleo irregular âmbar/preto com camadas minerais e estrias orgânicas num pequeno apoio científico de metal oliva/bronze gasto, grampos/cobre e tubo de pó ocre; câmera elevada a 40°, luz superior esquerda, legível a 72 px, transparência e margens. Sem fundo/piso/texto/UI, mala, prisma neon ou pessoa. Não altera personagens ou terrenos aprovados.

Sprite carregado uma vez e compartilhado no mapa/base; nenhum desenho estático por frame. Memória mantém schema 1, células de 48 e limites anteriores. Colisões transitórias da amostra não modificam o terreno da arena antes da vitória.

## QA / entrega

- [x] [Modelo/save antigo](qa/model/report.json): dependência do perfil das Dunas, capacidade nova, aceitação sem vitória inventada, vitória/registro históricos preservados, amostra ainda exigida e recompensa única de 180.
- [x] [Memória no modelo/save real](qa/memory-model/report.json): checkpoint antigo/omitido, união de regiões, limites, validação de dados, isolamento por personagem e reset explícito passaram após reproduzir a perda.
- [x] [Minimapa solo em oito regiões](qa/memory-solo/report.json): movimento real, viagens, morte/R/pagehide/reload e todos os conjuntos descobertos preservados. [Dupla/reconexão](qa/coop/coop.json): células de Base/Dunas/Bacia Soterrada de cada integrante comparadas integralmente, sem perda; saves reais e bloqueios futuros preservados.
- [x] [Capítulo solo](qa/solo/report.json) e [dupla completa](qa/coop/coop.json), com confronto integral por inputs normais contra HP/IA originais (1233 solo/2034 dupla), movimento/Dash/Q/auto attack e poções normais. Nenhum HP, invulnerabilidade, posição, IA ou tempo alterado durante a luta. Aproximações antes/depois são fixtures de cobertura. Registro original pendente após a vitória, amostra/colisão/remoção/entrega, créditos/XP/recibos/reload/reconexão passaram; controle automatizado conhece a solução, não é avaliação humana da dificuldade.
- [x] [Touch/gamepad nas quatro classes](qa/controls/report.json), joystick/stick realmente avançam e respeitam o collider, registro e coleta reais, 568×320, 844×390, 1024×768 e 1920×1080. Usam o [checkpoint exportado da vitória solo real](qa/solo/post-boss-fixture.json), antes de ler/coletar; o laboratório normal continua com o boss vivo.
- [x] [Compatibilidade com relay anterior](qa/compatibility/report.json): Dunas 173 conecta; novo capítulo recusa ausência de catálogo sem descartar progresso, inclusive em URL normal. Capturas inspecionadas pelo agente. A revisão ajustou o apoio da figura ao piso e moveu o arquivo da vegetação para chão livre junto da enfermaria.
- [x] Typecheck/build de 266 módulos. [Registro/coleta/entrega compilados](qa/compiled/report.json), sem globais DEV: checkpoint exportado da vitória real, caminhada/E até o registro e amostra, retorno/entrega por UI e reload conservaram 180 créditos únicos, XP, vitórias e descoberta. [Três capítulos compilados](qa/compiled-chapters/public.json) passaram por chegada/aceite/reload, com saves reais preservados.
- [x] [Minimapa compilado](qa/compiled-memory/report.json): laboratório novo, WASD/atlas, duas regiões e dois reloads sem injetar descoberta; 109 células na Base e 91 nas Dunas conservadas, bosses/futuras regiões intactos. Capturas compiladas inspecionadas pelo agente.
- [x] [Dupla compilada](qa/compiled-coop/report.json): aceite real pelo convidado, nova missão compartilhada com boss/coleta ainda pendentes, reload/reentrada por personagem original e encerramento normal, sem globais DEV. Capturas inspecionadas pelo agente. Confronto/entrega integrais estão no QA DEV acima; esta amostra compilada cobre o início.
- [ ] Typecheck/build, laboratório compilado/público, commit/push/sincronização/publicação.
- [ ] Playtest humano. QA automatizado não mede duração/diversão ou substitui celular físico/equipe humana de quatro.
