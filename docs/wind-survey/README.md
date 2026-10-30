# O que o vento encobre · 0.1.171

Continuação autorizada em 30/10/2026 após o fechamento da 0.1.170. Lia precisa separar ruído do vento e frequência antes de planejar instrumentos/suprimentos mais longe. Um capítulo; não inicia outro posto, região ou lote de sprints.

## Jornada e interação

Requer `settle-echo` entregue. Seis objetivos: kit reservado na base; relé **original** do Siroco; instalação; empurrar a plataforma até a posição protegida; registrar a leitura; comparar no arquivo existente do Posto das Nascentes. Lia recebe o relatório e paga **160 créditos por integrante, uma vez**, sem XP/material adicional ou consumo de itens pessoais.

O relé novo não substitui o original: `pv-relay` apenas observa `aridSignalSeen` depois de retirar o kit. Quem já investigou esse relé não precisa repetir. A pesquisa não altera sinais, portais, atlas, bosses ou seus requisitos. Os encontros restantes continuam finitos; nenhuma onda, quota ou respawn novo.

Instalação por E/toque/A. Empurre caminhando contra o suporte com WASD/joystick/stick esquerdo; contorne para mudar a direção. O corpo tem colisão e respeita as pedras. Ataque, Dash, ator morto ou movimento afastando-se não empurram o instrumento. Uma dupla não multiplica sua velocidade. Só o encaixe físico na posição marcada registra `pv-dock`; E sozinho não conclui essa etapa. Leitura no vento exposto não pode ser registrada.

O curso de trabalho fica marcado no chão. Plataforma solta é transitória: viajar, morrer/reiniciar ou recarregar a cena recolhe o suporte ao início sem custo. Objetivos já registrados ficam salvos; após encaixar, a posição fica permanente. O anfitrião simula e publica a posição; convidado usa os mesmos controles e coliders. Arte existente inteira, marcações rasterizadas uma vez e transformações simples; nada estático é redesenhado por frame.

O contato limita a caminhada à velocidade do suporte (100 px/s); entrada analógica abaixo desse limite conserva sua velocidade. Fora do contato o passo normal retorna; Dash não recebe esse limite e não empurra. A direção acompanha a caminhada, evitando que um contato levemente fora do centro desvie o suporte e faça o personagem escorregar ao redor do colisor circular. Esse ajuste surgiu no teste compilado com aproximação por caminhada comum.

O instrumento continua alimentado pela nave. A comparação atualiza o rótulo do arquivo de frequências no posto, sem duplicar o estojo, moradores, recibos ou redes de água/energia. A leitura indica continuidade na direção das Dunas; não traduz as estruturas nem determina a origem da assinatura humana.

## Teste reservado

[Laboratório](https://echosofdante.vercel.app/campaign-playtest.html?permanence=wind&v=0.1.171), registrado na biblioteca. Namespace `dante-permanence-v1.wind.<classe>.` em sessionStorage, separado de personagens/configurações reais. Simula Warden, sete relatórios originais, oito capítulos anteriores, Bacia conquistada e percurso do Vale até a entrada do Siroco. O relé original do Siroco **não** é simulado; seis objetivos/plataforma/160 créditos pendentes. Criaturas ainda não derrotadas preservadas; Soterrado, Vésper e Incandescente vivos. Só o anfitrião prepara a equipe original reunida.

Protocolo 16 preservado, catálogo com seis novas evidências e capacidade `wind:1`. Cliente com esse laboratório/save recusa relay antigo preservando objetivos; capítulos anteriores continuam disponíveis. Verificar incompatibilidade pública real antes de solicitar atualização externa.

## QA e publicação

- [x] [Modelo](qa/model/report.json): movimento/colisão reais, mortos/Dash/afastamento/NaN recusados, forças opostas anuladas, dois aliados não dobram velocidade e stick lento limita o passo. Contato fora do centro mantém a direção da caminhada, sem amplificar desvio lateral. Serializer real 0.1.166, pré-requisito, catálogo opcional e rollback/retry pagam 160 uma vez, sem XP/material/boss adicional.
- [x] [Solo completo](qa/wind/solo.json) e [dupla completa](qa/coop/coop.json): aceite/entrega por diálogo, relé original por E, instalação, empurrão real em dois eixos, leitura/comparação e 160 por integrante sem repetição. Dois Chrome independentes; convidado empurra, host valida, poses concordam e reconexão preserva recibo. Fixtures de posição/invulnerabilidade declaradas; não representam tempo/dificuldade humana.
- [x] [Mundo](qa/world/report.json): seis aproximações/retorno/saída originais conectadas, WASD/Dash bloqueado pelo corpo, plataforma solta recolhida por viagem/reload/morte/R sem perder montagem e plataforma realmente encaixada persistente após morte/reload. Save com relé original já descoberto não exige repeti-lo. Visitas contaminadas não liberam gelo/caldeira ou bosses. Solo também verifica três retornos com contagens de objetos/texturas/colisores estáveis; arquivo existente apenas recebe novo rótulo.
- [x] [Controles](qa/controls/report.json): quatro classes com instalação/leitura por toque e empurrão em dois eixos pelo joystick CDP, sem disparar; stick esquerdo/A de gamepad padrão emulado. 568×320, 844×390, 1024×768 e 1920×1080. Capturas inspecionadas pelo agente: figura e aproximação livres da formação; criaturas nativas não derrotadas podem atravessar a cena. Fixtures de derrotas existentes para revisão de controles não concedem XP/drop.
- [x] [Compatibilidade](qa/compatibility/report.json): cliente atual contra relay/catálogo históricos exatos `b167984`, protocolo 16. Capítulo anterior conecta; novo laboratório/save recusa ausência de `wind:1` sem descartar evidências. Relay atualizado reconecta com os mesmos objetivos.
- [x] Typecheck/build de 262 módulos, com aviso preexistente de chunks maiores que 500 kB. [Plataforma compilada](qa/compiled/report.json), sem globais DEV: fixture explícita do serializer antigo prepara capítulos anteriores, relé/kit/montagem e derrotas já existentes do Siroco, sem XP/drop. Caminhada desde checkpoint original, empurrão horizontal, volta ao redor do corpo, correção diagonal e reload gravam somente o encaixe. Leitura/arquivo/recompensa/bosses posteriores ficam pendentes; sentinelas reais preservadas. O teste lê o marcador normal do minimapa para corrigir os pulsos de teclado; não move personagem/plataforma por API.
- [x] [Capítulos compilados](qa/compiled-chapters/public.json): pesquisa nova, Primeiro Eco e posto aceitos por diálogo/recarregados, preservando personagens/configurações reais.
- [x] [Dupla compilada local](qa/compiled-coop/report.json), preview 5197: dois Chrome sem globais DEV, convite/preparo explícito da equipe pelo fluxo normal, aceite com Lia e coleta do kit por caminhada/E do convidado. Reload/reentrada preservam objetivos, saldo, recibos e bosses posteriores; sentinelas reais intactas. É uma amostra do início; percurso e entrega completos cobertos na dupla DEV acima.
- [ ] Publicação/hashes/capacidade real, commit/push sincronizado.
- [ ] Playtest humano antes de outro sprint.

Fixtures, limites e evidências serão registrados separadamente da aprovação humana. Automação não mede diversão/duração nem substitui celular físico ou equipe humana de quatro.

Reprodução: `node scripts/qa-wind-survey-model.mjs`, `qa-wind-survey-solo.mjs`, `qa-wind-survey-world.mjs`, `qa-wind-survey-controls.mjs`, `qa-wind-survey-compatibility.mjs` e `qa-wind-survey-coop.mjs` (arquivos em `scripts/`, DEV 5185). Rodar os navegadores sequencialmente para evitar suspensão de frames pelo Chrome. Compilado: `qa-wind-survey-compiled.mjs`, `qa-wind-survey-compiled-chapters.mjs` e `qa-wind-survey-public-coop.mjs`, preview novo 5197; `QA_BASE`/`QA_OUT` selecionam publicação e diretório quando suportados. Publicação: `python scripts/verify-outpost-publication.py capture 0.1.171`, depois `verify 0.1.171`; hashes da Vercel e capacidade do Render são gates separados.
