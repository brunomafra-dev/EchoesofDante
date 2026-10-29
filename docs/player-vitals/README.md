# Vida sobre o personagem e confirmação da poção · 0.1.168

Em 29/10/2026, após “Boa vamos para o próximo”, o usuário pediu animação ao usar poção e sugeriu uma barra sobre a cabeça. Este sprint atende a legibilidade de combate; não inicia outra etapa da colonização. A continuação e o comentário positivo do apoio ficam registrados separadamente do playtest desta apresentação.

A barra acompanha cada personagem vivo enquanto falta vida. Dano e recuperação a revelam; com a vida cheia, permanece por cerca de três segundos e desaparece suavemente. Com 30% ou menos, muda de cor e pulsa discretamente. Mantém tamanho mínimo legível considerando câmera e escala do canvas nas telas menores. Não substitui o HUD e não altera cura, dano, recarga, velocidade, equipamentos ou figuras completas. Nomes/falas preservam suas posições acima da barra.

Uma poção consumida mostra um frasco ao lado do corpo, partículas suaves e um anel breve nos pés, por aproximadamente 1,15 s. Não exige parar para uma pose nova. Vida cheia, falta de estoque e recarga impedem o consumo e seu efeito. Se a transação solo falhar ao salvar, vida/estoque voltam e o efeito não aparece. No coop, o efeito depende da confirmação do anfitrião. A cura da enfermaria/apoio não se apresenta como consumo de poção.

No coop, os contadores `potionUsed` já existentes distinguem o consumo confirmado pelo anfitrião de um pedido do convidado. A primeira amostra recebida vira a referência, evitando repetir efeitos ao entrar/reconectar/trocar região. Protocolo 16 mantido; nenhuma alteração no relay ou pedido de deploy do Render. Quem estiver com cliente antigo deve recarregar para ver os novos efeitos.

Texturas pequenas compartilhadas são rasterizadas uma vez por gerenciador de texturas. Durante a apresentação só mudam posição, escala, cor e transparência. Sem desenho de cenário estático por frame; objetos/eventos removidos ao encerrar a cena.

## Laboratório

[Teste direto](https://echosofdante.vercel.app/campaign-playtest.html?outpost-support=1&vitals=1&v=0.1.168), registrado na biblioteca, com namespace `dante-vitals-v1.<classe>.`. Reutiliza a preparação isolada do apoio: Warden, relatórios/capítulos anteriores, Bacia conquistada e posto entregue; 60 créditos, duas poções, peça sobressalente e vida reduzida. Bosses posteriores vivos; personagens reais não são lidos ou escritos. Botão explícito de ferimentos atua só em personagens vivos neste laboratório; não aplica dano na campanha real. Coop exige preparar a equipe original pelo anfitrião; convidados mantêm seus recursos pessoais.

## Evidências

- [x] `npm run typecheck`, `npm run build` (256 módulos) e revisão. Aviso preexistente de chunks maiores que 500 kB.
- [x] [Solo DEV](qa/solo/report.json): uso real, cura de 35%, estoque/recarga, vida cheia, ausência de estoque, rollback de armazenamento, movimento, vida crítica, morte/revive/reload e contagem estável de texturas/objetos. Dano, recarga e quota são fixtures explícitas no laboratório; personagens reais preservados por sentinelas.
- [x] [Dois Chrome DEV](qa/coop/report.json): anfitrião/convidado veem consumo confirmado no ator correto, apenas um estoque diminui, mesmo pacote não repete o efeito e reentrada não reapresenta usos antigos. Fixture adicional de contador repetido/decrescente declarada no relatório.
- [x] Quatro classes com toque e gamepad emulados; X para Astral e Y para as demais. Amostras 568×320, 844×390, 1024×768, 1366×768 e 1920×1080. Após ajuste de escala, [Astral compilado em 568](qa/mobile-compiled/report.json) e [solo/dupla compilados](qa/compiled/report.json) passaram sem globais DEV, com UI/movimento, consumo, compras/cofres separados, recibos/XP/bosses preservados e reload/reentrada reais. Capturas finais inspecionadas pelo agente; nomes, personagem e barra visíveis. Não aprova a estética pelo usuário.
- [x] Aplicação `290b17c` enviada a `origin/main`, [Vercel success](https://vercel.com/brunomafra-devs-projects/echosofdante/J2WR5SpfA7q9Z9XJBDrmCx4YL9eD) e [62 hashes públicos](../outpost/qa/publication/0.1.168/hashes.json) iguais à build. Render `a49fad7` continua compatível (16 / `outposts:1`), sem novo deploy necessário. [Solo/dupla públicos](qa/public/report.json) confirmam um consumo por integrante, recarga recusada, cura nos atores corretos, saldo/cofre separados, reload e reentrada do personagem original com mesmos recibos/XP/estoque. [Astral touch público em 568](qa/mobile-public/report.json) passou. Capturas públicas inspecionadas: frasco/barra legíveis, efeitos na pessoa certa e sem reapresentação na reentrada. Sentinelas reais protegidas e bosses posteriores vivos. Auditoria final só acrescenta documentos/evidências; não muda a aplicação verificada.
- [x] Playtest humano em 29/10/2026: usuário respondeu “ficou muito bom”, confirmou a leitura dos aliados e pediu voltar ao plano. Aprova esta apresentação; não mede a duração da campanha.

Automação e inspeção do agente não constituem aprovação estética humana, teste em aparelho físico ou equipe humana de quatro.
