# Observações da preparação e do QA

As evidências finais são os relatórios marcados `passed`; aprovação humana permanece separada. Os roteiros usam somente entradas normais e diagnóstico de leitura, exceto as fixtures iniciais descritas em cada relatório.

- As primeiras tentativas do roteiro escolheram pontos dentro dos volumes dos abrigos e de um marco de trilha. Os destinos de aproximação foram corrigidos. A navegação automática por teclas recebeu segmentos menores e margem física; isso não introduz teleportes ou setters no jogo. O percurso completo é refeito com os obstáculos reais.
- A rota inicial de Elisa apontava para a área ocupada pela oficina; foi corrigida para os dois canteiros acessíveis. Os marcos da saída leste passaram a ficar dos lados da trilha. Apoios dos toldos, casco, motores, bancadas e formações nativas têm colisão.
- Uma captura mostrou o casco com faces invertidas e copas no enquadramento de análise. O casco foi corrigido e o posicionamento procedural das árvores reserva a visão inicial das aproximações. Objetos continuam opacos; o jogador conserva órbita/zoom livres.
- A primeira aplicação do mapa escuro Rock035 sobre a carapaça escurecia demais a criatura. A cor mineral passou a usar textura procedural própria preparada uma vez; o relevo continua usando o mapa normal existente. Corpos derrotados ficam assentados acima do terreno.
- O teste geométrico originalmente encerrava com Death. Ao acrescentar Walk/Sword/Shoot/Cast, ele passou a medir a cabeça depois de Cast e falhou corretamente. A amostragem foi reordenada para verificar a cabeça no corpo caído, mantendo os doze clipes testados.
- O primeiro arrasto real do poder no Chrome touch foi cancelado como rolagem do navegador. `touch-action: none`, bloqueio de seleção/callout e contexto nos botões de ação corrigem esse defeito; o teste com contatos CDP reais foi repetido nas quatro classes.
- A amostra de FPS logo após reload pode incluir compilação/carregamento, e uma das primeiras medições coincidiu com preparação do build. O relatório `performance/report.json` usa aquecimento e amostras isoladas. Árvores secundárias usam a geometria reduzida já existente (144 triângulos; a detalhada tem 935), com as mesmas copas preparadas e materiais compartilhados. Não equivale a um teste em iPhone físico.
- As fixtures específicas de derrota, poção, dados inválidos, elementos e benchmark ficam somente em `dante.arrival3d.v1`. Não provam ter conquistado a pesquisa ou vencido moradores/bosses. O percurso completo sem fixtures de progresso tem relatório próprio.

Não houve alteração do protocolo, catálogo cooperativo, missões, recibos, bosses ou dados da campanha. A publicação será conferida contra o build e os 86 hashes da campanha preservada.
