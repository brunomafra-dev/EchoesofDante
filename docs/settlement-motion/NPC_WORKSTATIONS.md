# Tarefas dos moradores e recorte das figuras — 0.1.165

Durante a publicação ainda pendente da 0.1.164, o usuário encontrou botas sobre a cabeça de Tio Gui/Elisa/Mara e pediu Tio Gui/Mara parados, trabalhando em objetos concretos. Pediu também renomear Tomás para **Choco**. Esta correção continua a entrega do acesso aos NPCs; os mesmos atalhos permitem inspecionar cada personagem.

O empacotamento anterior tratava uma pintura 4×4 como células exatas, mas algumas figuras ultrapassavam essas divisões. O novo `scripts/pack-settlement-isolated.mjs` identifica dezesseis silhuetas completas por folha antes de empacotar. Núcleos alpha separam desenhos adjacentes e recuperam até quatro pixels de antialias; cada pose recebe margem transparente. Não há composição por membros nem nova geração artística. Os arquivos r4/r5/r3 e `frames-r3.json` têm nomes novos para evitar cache da folha defeituosa. Fontes são as quatro folhas da 0.1.162; origem artística e prompts continuam em `ASSET_PROMPTS.md`.

Tio Gui e Mara mantêm posições fixas e ajustam um kit de conexões/equipamento visível à frente. O gesto de ferramenta ocorre ali, com pausas; conversar usa a transição para levantar e voltar à tarefa. Elisa mantém a rota aprovada de cuidar das plantas. Choco percorre dois lotes visíveis de suprimentos, com seu manifesto. Ivo, Lia e Nara conservam os ritmos existentes. Objetos são instanciados uma vez e têm colisão; moradores fixos e equipamento permanecem na navegação física.

A renomeação de Choco preserva o ID interno `tomas`, saves, recibos e protocolo 16. Não muda requisitos ou boss da campanha. [Acessos e preparação do laboratório](NPC_REVIEW.md); personagens reais protegidos.

## QA e aprovação

`npm run typecheck`, `npm run build` (254 módulos) e `git diff --check` passaram. [QA de figuras e tarefas](qa/workstations/report.json): 64 células com margens alpha completamente transparentes, posições fixas durante 9 s, kits físicos sem sobreposição, conversa com E e retorno à tarefa. Tio Gui usa duas poses que conservam a bolsa/ferramenta; Mara usa quatro poses de ajuste da peça. Choco mantém o ID original, três pontos de rota e dois lotes visíveis. Capturas ampliadas de reparo e a folha de Elisa inspecionadas pelo agente.

[Nove aproximações](qa/npc-review/report.json) passaram novamente com as figuras/objetos novos, incluindo colisões, reload e saves reais protegidos. [Dupla compilada](qa/workstations-compiled-coop/report.json), dois Chrome/relay 16: anfitrião e convidado recebem as posições fixas e gestos de Tio Gui/Mara; convite, diálogo, reload/reentrada, quatro situações, viagem pelo atlas e encerramento passaram. Nenhuma alteração de backend.

Publicação da 0.1.165 será conferida após o push. A 0.1.164 terminou de publicar enquanto esta correção era testada; a entrega final aponta para esta revisão. **Avaliação humana dos recortes, tarefas e objetos pendente.** Não equivale a teste em celular físico ou equipe humana de quatro.
