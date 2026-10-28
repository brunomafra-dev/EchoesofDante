# Visita aos mapas com NPCs — 0.1.165

Pedido do usuário: acesso a todos os mapas com NPCs para conferir cada um. Os sete humanos estão na Base e nos Terraços do Amanhecer. O laboratório oferece quatro situações nesses dois mapas e aproximações individuais; não cria novas regiões nem muda as animações aprovadas/em avaliação.

| Visita | NPCs em foco | Preparação temporária |
| --- | --- | --- |
| [Base](https://echosofdante.vercel.app/campaign-playtest.html?npc-review=base&v=0.1.165) | Ivo, Dra. Lia, Nara | Warden e sete relatórios até o primeiro abrigo |
| [Base antes da mudança](https://echosofdante.vercel.app/campaign-playtest.html?npc-review=departure&v=0.1.165) | Tio Gui e Elisa | Warden e seis relatórios; primeiro abrigo pendente |
| [Primeiro abrigo](https://echosofdante.vercel.app/campaign-playtest.html?npc-review=camp&v=0.1.165) | Tio Gui e Elisa | Warden e sete relatórios; abrigo instalado |
| [Segundo alojamento](https://echosofdante.vercel.app/campaign-playtest.html?npc-review=arrivals&v=0.1.165) | Mara e Choco; Tio Gui/Elisa continuam no primeiro abrigo | Warden, sete relatórios, quatro capítulos da permanência e baliza/manifesto/alojamento/recepção; confirmação final e relatório da chegada pendentes |

Abra o painel **NPCs** para visitar outro grupo ou chegar perto de um personagem. Links também abrem diretamente com `npc=ivo`, `lia`, `nara`, `caio` (nome exibido Tio Gui), `elisa`, `mara` ou `tomas`, conforme o grupo. Reload mantém a visita/progresso temporário; reabrir uma visita prepara novamente somente este cenário. As bancadas mantêm seus lugares e os moradores continuam em suas rotinas normais.

Namespace próprio `dante-npc-review-v1.<classe>.`, em sessionStorage da aba; nenhum personagem, configuração ou save real é lido/alterado. Os três bosses posteriores continuam vivos. O cenário da segunda equipe não concede o recibo/créditos do relatório final. Os atalhos estão restritos ao laboratório `campaign-playtest.html?npc-review=…`; não liberam o atlas da campanha real.

Encontros comuns dos Terraços, inclusive reforços da equipe, ficam suprimidos apenas neste laboratório para observar os moradores sem ataques. Isso não registra derrotas nem concede XP, drops ou créditos. Terreno, colisões, rotinas e posições dos serviços são os mesmos do jogo.

Coop: volte ao início, crie uma equipe original e compartilhe o convite do laboratório. Somente o anfitrião, com a equipe reunida, pode preparar visitas; o convidado acompanha a área e as poses. Protocolo 16 mantido, sem mudança de backend. O painel informa os pré-requisitos simulados de cada grupo.

## Verificação e aprovação

**28/10/2026 · Aprovação humana da entrega final 0.1.165:** usuário respondeu “Gostei” após receber os acessos e as correções de figuras/tarefas. A pendência descrita no registro original abaixo é histórica; não representa aprovação automática do percurso completo dos capítulos da permanência.

`npm run typecheck`, `npm run build` (254 módulos) e `git diff --check` passaram. [Solo DEV](qa/npc-review/report.json): nove aproximações individuais, sete NPCs nas quatro situações corretas, chegada fora das colisões, ausência de encontros nos Terraços, diálogo com E, reload sem novo preparo/recibo e sentinelas de saves/configurações reais intactas. A entrada de produção com o parâmetro de visita não carrega o laboratório.

[Solo compilado](qa/npc-review-compiled/report.json), sem globals DEV: quatro links diretos, reload e troca por touch real do Chrome em 844×390 e 568×320. [Dupla compilada](qa/npc-review-compiled-coop/report.json): dois Chrome independentes/relay 16, convite isolado, diálogo do convidado, reload/reentrada, rejeição de preparo pelo convidado e visita às quatro situações pelo anfitrião. A troca de mapas usa a transição normal da equipe, com confirmação do relay. Viagem pelo atlas e encerramento da sala também passaram. Bosses posteriores, sentinelas e recibos do relatório final preservados na amostra.

Capturas da base antes da mudança, primeiro abrigo, segundo alojamento e painel 568×320 inspecionadas pelo agente. Nenhuma avaliação visual automatizada aprova a naturalidade. Publicação será conferida após o push. **Aprovação humana das animações continua pendente**. Ivo já aprovado pelo usuário; os ritmos e figuras não foram alterados nesta entrega. Não representa teste em aparelho físico ou equipe humana de quatro.
