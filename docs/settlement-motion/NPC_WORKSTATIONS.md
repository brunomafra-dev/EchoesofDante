# Tarefas dos moradores e recorte das figuras — 0.1.165

Durante a publicação ainda pendente da 0.1.164, o usuário encontrou botas sobre a cabeça de Tio Gui/Elisa/Mara e pediu Tio Gui/Mara parados, trabalhando em objetos concretos. Pediu também renomear Tomás para **Choco**. Esta correção continua a entrega do acesso aos NPCs; os mesmos atalhos permitem inspecionar cada personagem.

O empacotamento anterior tratava uma pintura 4×4 como células exatas, mas algumas figuras ultrapassavam essas divisões. O novo `scripts/pack-settlement-isolated.mjs` identifica dezesseis silhuetas completas por folha antes de empacotar. Núcleos alpha separam desenhos adjacentes e recuperam até quatro pixels de antialias; cada pose recebe margem transparente. Não há composição por membros nem nova geração artística. Os arquivos r4/r5/r3 e `frames-r3.json` têm nomes novos para evitar cache da folha defeituosa. Fontes são as quatro folhas da 0.1.162; origem artística e prompts continuam em `ASSET_PROMPTS.md`.

Tio Gui e Mara mantêm posições fixas e ajustam um kit de conexões/equipamento visível à frente. O gesto de ferramenta ocorre ali, com pausas; conversar usa a transição para levantar e voltar à tarefa. Elisa mantém a rota aprovada de cuidar das plantas. Choco percorre dois lotes visíveis de suprimentos, com seu manifesto. Ivo, Lia e Nara conservam os ritmos existentes. Objetos são instanciados uma vez e têm colisão; moradores fixos e equipamento permanecem na navegação física.

A renomeação de Choco preserva o ID interno `tomas`, saves, recibos e protocolo 16. Não muda requisitos ou boss da campanha. [Acessos e preparação do laboratório](NPC_REVIEW.md); personagens reais protegidos.

## QA e aprovação

`npm run typecheck`, `npm run build` (254 módulos) e `git diff --check` passaram. [QA de figuras e tarefas](qa/workstations/report.json): 64 células com margens alpha completamente transparentes, posições fixas durante 9 s, kits físicos sem sobreposição, conversa com E e retorno à tarefa. Tio Gui usa duas poses que conservam a bolsa/ferramenta; Mara usa quatro poses de ajuste da peça. Choco mantém o ID original, três pontos de rota e dois lotes visíveis. Capturas ampliadas de reparo e a folha de Elisa inspecionadas pelo agente.

[Nove aproximações](qa/npc-review/report.json) passaram novamente com as figuras/objetos novos, incluindo colisões, reload e saves reais protegidos. [Dupla compilada](qa/workstations-compiled-coop/report.json), dois Chrome/relay 16: anfitrião e convidado recebem as posições fixas e gestos de Tio Gui/Mara; convite, diálogo, reload/reentrada, quatro situações, viagem pelo atlas e encerramento passaram. Nenhuma alteração de backend.

**Avaliação humana aprovada em 28/10/2026:** após a entrega, o usuário respondeu “Gostei”. Aprovação dos recortes, tarefas e objetos desta correção, separada do QA técnico. Não equivale a teste em celular físico, equipe humana de quatro ou avaliação integral dos capítulos da campanha.

## Publicação conferida

Aplicação `261f9670668fa2be0e1fa2fd5a4e5f63b940c886` publicada na [Vercel](https://vercel.com/brunomafra-devs-projects/echosofdante/E7F4UmQwf1Z4s8vh4fxBBUNJSyeM), com status GitHub `success`. [56 hashes](qa/publication/0.1.165/hashes.json) correspondem à build local: 38 JavaScript e 18 arquivos de arte/metadados, incluindo as quatro folhas corrigidas e `frames-r3.json`. Relay público continua no protocolo 16/revisão `3a5481ff25a20f4313287d2715129bc811b2fb83`.

[Solo público](qa/workstations-public/report.json): quatro acessos diretos, bosses posteriores vivos, reload, sentinelas de saves/configurações reais e navegação por touch em 844×390 e 568×320 passaram. [Dupla pública](qa/workstations-public-coop/report.json): dois Chrome independentes passaram por diálogo, reload/reentrada, posições fixas e gestos de Tio Gui/Mara nos dois participantes, rejeição de preparo pelo convidado, quatro situações de ocupação, viagem pelo atlas e encerramento da sala. Capturas públicas dos dois acampamentos inspecionadas pelo agente; nenhuma aprovação humana inferida desses resultados.

A 0.1.164 terminou de publicar enquanto esta correção era testada; a entrega final e os links atuais apontam para a 0.1.165. Para o coop, ambos os participantes devem recarregar o jogo para receber as folhas novas. [Todos os acessos e pré-requisitos simulados](NPC_REVIEW.md).
