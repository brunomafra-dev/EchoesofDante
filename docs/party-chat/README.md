# Etapa 2 — nomes e comunicação da equipe · 0.1.104

Continuação autorizada pelo usuário após validar a 0.1.103 com ressalvas visuais para um pente fino posterior. Esta entrega mantém o gate humano antes da cena piloto da cinemática.

## Uso

- **Enter** abre a escrita e envia; **Escape** cancela sem abrir o menu.
- Botão **CHAT** em touch. No gamepad, **R3** abre o mesmo campo; direcional percorre campo/Enviar/Cancelar e B cancela. Digitação depende do teclado disponível no dispositivo: o navegador não oferece uma API universal para invocar teclado de console.
- Histórico recolhível, no formato **Guilherme: mensagem**, com até 100 falas e texto completo. Sem caixa ou borda azul nos nomes.
- Cada personagem, inclusive o local, usa somente seu nome salvo sobre a cabeça. O balão substitui a fala anterior do autor, dura 5 segundos e limita a apresentação a três linhas. Abreviações não alteram o histórico.
- Funciona no lobby, em jogo, caído e enquanto a equipe aguarda reconexão. Sem conexão, enviar informa o problema; não guarda uma fila para disparar depois.
- O campo só fecha após o eco de confirmação do relay. Recusa, perda de conexão ou timeout de 8 segundos mantêm o rascunho e avisam o autor. Não há retry automático. Se a conexão cair depois da entrega e antes da confirmação, confira o histórico recuperado antes de repetir: sem um nonce enviado pelo cliente, esse caso é ambíguo.

## Implementação

`CoopChat` é uma única interface DOM que acompanha o menu/lobby sem ser recriada em viagens. `CoopNames` usa o mesmo componente para jogador local, atores autoritativos e espelhos remotos. Há no máximo quatro nomes e quatro balões reutilizados por cena, com quatro pequenos conectores de contato quando as falas precisam ser separadas. O evento de atualização é removido no shutdown.

Digitar ativa um bloqueio pessoal já consultado pela cena; cancela a carga sem soltá-la, limpa teclas/gestos e envia cancelamento imediato quando o autor é visitante. Os snapshots e a simulação dos demais continuam. Atalhos e navegação dos menus por gamepad respeitam esse bloqueio. Abrir chat não chama pausa coletiva.

O relay **protocolo 12** aceita `{type:'chat',text}` fora do canal de combate, inclusive antes do início da campanha. Identifica autor pela conexão autenticada; gera ID e horário. Ignora autor/nome/ID fornecidos pelo remetente. Impõe até 200 caracteres Unicode e intervalo de pelo menos 1 segundo por integrante; a restrição permanece na reconexão.

As últimas 100 mensagens ficam somente na memória da sala. `joined` recupera o histórico na entrada/reconexão; esse histórico não cria balões. Mensagens ao vivo são deduplicadas pelo ID. Viagens não limpam o histórico. Encerrar a sala o descarta; ele não é salvo no personagem ou na campanha.

Texto é apresentado com `textContent` no DOM e texto literal no Phaser, sem interpretação de HTML. Chat não transporta comandos, itens, recompensas ou dados de missões.

## Teste reservado

[Abrir nomes e chat da equipe](https://echosofdante.vercel.app/campaign-playtest.html?chat=1&v=0.1.104). Crie uma sala e envie o convite a amigos; o laboratório mantém personagens/progresso reais intactos e usa dados temporários desta aba. Teste também pelo jogo oficial, onde os mesmos componentes são usados.

## QA

- `qa-party-chat-protocol.mjs`: relay real, quatro conexões, autenticação, acentos/HTML literal, Unicode, limite, intervalo, simultaneidade, viagem, equipe incompleta, reconexão e descarte. O preenchimento do histórico avança o relógio do teste; não remove o rate limit de produção.
- `qa-campaign-protocol.mjs`: regressão das campanhas de 2, 3 e 4 integrantes com protocolo 12.
- `qa-party-chat-browser.mjs`: quatro contextos Chrome, fluxo UI real, nomes/balões, digitação e cancelamento de Q, outros jogadores ativos, retorno de conexão, viagem, morte/respawn, touch/gamepad emulados e quatro resoluções. Posições seguras, morte e travessia usam fixtures DEV explicitamente registradas no relatório.
- A execução com quatro renderizadores simultâneos sobrecarregou esta estação (amostra anterior: 23,8 FPS e quedas de transporte). A bateria final estaciona dois renderizadores visitantes após conferir os nomes nos quatro contextos; anfitrião e Hunter continuam ativos para o teste de movimento durante a digitação. Os quatro clientes continuam usando chat e relay reais. Isso não substitui quatro aparelhos físicos.
- `qa-party-chat-performance.mjs`: um navegador renderizando com três clientes de rede, cerca de **59,9 FPS** na amostra de 6 segundos. Três idas e voltas Base/Floresta mantiveram **449 objetos, 255 texturas, 24 tweens, 2 listeners poststep, 4 nomes, 4 balões e 1 chat DOM**; listeners da janela também ficaram estáveis. A amostra não é benchmark de boss nem medição de latência de quatro dispositivos.
- `qa-party-chat-production.mjs`: build/publicação sem exports DEV, convite real, protocolo 12, fala em lobby e gameplay, nomes com acentos, histórico e saída do anfitrião.

Os relatórios ficam em [qa](qa/). A publicação pública depende de **Vercel e Render no protocolo 12**; push sozinho não comprova que o servidor de salas foi atualizado. Aprovação perceptual e teste com quatro pessoas dependem do usuário.

### Resultado técnico

- Passaram: [protocolo do chat](qa/chat-protocol.json), [campanhas 2–4](qa/protocol-report.json), [quatro clientes](qa/browser/report.json), [build compilado e falha controlada de envio](qa/production/report.json), [solo/menu](qa/solo/report.json) e [ciclos de performance](qa/performance.json).
- `npm run typecheck`, `npm run build` e `git diff --check` passaram. Apenas o aviso conhecido do bundle Phaser acima de 500 kB.
- Sem erros JavaScript/assets nas baterias Chrome. Quatro resoluções e uma viewport reduzida de 160 px de altura mantiveram campo e Enviar acessíveis. Teclado virtual real, rede móvel e quatro aparelhos físicos ainda precisam de playtest.
- [Captura compilada](qa/production/team-chat.png) e [balões agrupados](qa/browser/team-chat.png). Autenticidade, conforto de leitura e posição das falas precisam de avaliação humana; automação não os aprova.

**Aguardar a validação do usuário antes da etapa 3.** O refinamento visual dos braços da etapa 1 continua reservado ao pente fino posterior autorizado.

## Escopo preservado

Sem alterações em dano, HP, dificuldade, recursos das classes, IA, mapas, câmera, narrativa, equipamentos ou cenário baked. Sem dependências novas, chat persistente, comandos de chat ou sistema de missões nesta etapa.
