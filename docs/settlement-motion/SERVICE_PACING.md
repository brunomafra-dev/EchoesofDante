# Ritmo de Dra. Lia e Nara — 0.1.163

O usuário aprovou Ivo na 0.1.162, mas relatou que Lia/Nara pareciam um vídeo acelerado. As três usavam o mesmo ciclo de marteladas de 2,12 segundos, com poses de apenas 90 ms. Esta correção separa o ritmo das tarefas, preservando exatamente a sequência e os tempos aprovados de Ivo.

Lia prepara, ergue, examina e retorna o material antes de buscar outro. Ciclo de 10,7 s, com poses de 700–1600 ms; a preparação entre ciclos dura 3,1 s. Nara consulta o comunicador/mapa, aponta a rota, usa o tablet, anota e observa a base. Ciclo de 12,75 s, com poses de 850–2000 ms; a observação entre ciclos dura 3,4 s. Ambas conservam as seis pinturas de corpo inteiro e os apoios das bancadas existentes; nenhuma arte nova ou montagem de membros.

As sequências continuam sob autoridade do anfitrião e o convidado recebe as poses pelo protocolo 16. Não muda posições de serviço, colisões, diálogos, controles, missões, saves ou recompensas. Não começa outro capítulo.

[Teste direto na base](https://echosofdante.vercel.app/campaign-playtest.html?settlement-motion=1&v=0.1.163), registrado na biblioteca. Reutiliza o namespace temporário `dante-settlement-motion-v1`, isolado dos personagens reais. Simula Warden e sete relatórios até o primeiro abrigo; Nascentes/Terraços descobertos, capítulos seguintes pendentes e três bosses posteriores vivos. Observe um ciclo completo de cada profissional; os serviços continuam disponíveis em suas posições originais.

## Verificação

`npm run typecheck`, `npm run build` (253 módulos) e `git diff --check` passaram. [QA de ritmo](qa/service-pacing/report.json), em 32 segundos do relógio real da cena: ciclo observado de Lia 10699,9 ms, menor pose completa 700 ms; Nara 12750 ms e 850 ms. Ivo coincidiu com a sequência e os tempos da 0.1.162 em todas as amostras. As três âncoras permanecem fixas; E abre Lia/Nara e reload preserva descoberta, sentinelas de saves/configurações reais e bosses posteriores vivos. Capturas de Lia/Nara em poses distintas inspecionadas pelo agente.

[Dupla compilada 5193](qa/service-pacing-compiled-coop/report.json): dois Chrome independentes com relay real 16, sem globals DEV, passaram por diálogo do convidado, ciclos lentos de Lia/Nara enviados pelo relay, reload/reentrada, viagem pelo atlas e poses móveis do acampamento. Recibos, créditos, saves reais e bosses posteriores preservados nessa amostra. Nenhuma mudança de backend. Capturas e medição técnica não substituem a avaliação humana da naturalidade.

Publicação será conferida após o push. **Avaliação humana de Lia/Nara pendente**. Ivo já aprovado pelo usuário; a aprovação não se estende automaticamente às outras animações. Controles não foram alterados; não houve novo teste em aparelho físico neste ajuste de ritmo.
