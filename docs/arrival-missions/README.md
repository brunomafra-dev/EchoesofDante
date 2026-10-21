# Missões da chegada · 0.1.124

[Teste reservado](https://echosofdante.vercel.app/campaign-playtest.html?missions=1&v=0.1.124) · [Biblioteca](https://echosofdante.vercel.app/test-library.html)

## Entrega e narrativa

Primeiro ciclo da etapa 4 do [plano de colonização](../DANTE_COLONIZATION_PLAN.md). A expedição passa a investigar condições para receber mais humanos, usando a campanha existente. Sem novos mapas nesta entrega. As três missões nas futuras Nascentes/Terraços e a instalação do abrigo pertencem à etapa 5, após validação humana deste ciclo.

| Ordem | Responsável | Objetivos | Créditos por personagem |
| --- | --- | --- | --- |
| Primeiro reconhecimento | Nara | Clareira e trilha das raízes na Floresta | 20 |
| Condições de sobrevivência | Dra. Lia | Análises de umidade e atividade biológica, com E/Investigar | 30 |
| Energia desconhecida | Ivo | Três Ecos e mecanismo da fissura | 40 |
| Além da fissura | Nara | Primeiro Eco e segurança após o Warden | 60 |

As conversas são curtas, têm aceite e entrega, e preservam os serviços dos NPCs. As análises encontram água superficial nas raízes; não confirmam potabilidade nem substituem a busca futura por uma nascente estável. O relatório final reconhece a assinatura humana do arquivo, sem explicar a origem do planeta ou do sinal.

## Leitura e controles

- **! âmbar acima do NPC:** missão disponível. **✓ verde:** relatório pronto. A indicação também usa formas distintas, sem depender apenas da cor.
- Tracker compacto com uma missão, próximo objetivo e acesso ao diário. Substitui o bloco antigo de orientação durante o acompanhamento; não duplica textos no HUD.
- **J / L3 / toque no tracker:** diário; **E / A / botão contextual:** conversar/analisar. Diário permite escolher qual missão disponível ou ativa acompanhar.
- Minimap/seta usam a navegação existente. Atlas marca a região do objetivo com **◇ MISSÃO**, sem revelar nem desbloquear regiões desconhecidas.
- Solo pausa durante a conversa. No coop, somente os comandos do autor ficam bloqueados; abrir diálogo cancela cargas sem disparar.

## Coop, save e recompensas

Protocolo **13**, cliente e relay atualizados juntos. Missões pertencem à campanha original da equipe. Qualquer integrante pode aceitar, contribuir e entregar. O relay identifica a conexão; o anfitrião verifica missão, pré-requisito, objetivos, personagem vivo, região e proximidade do NPC. Pedidos têm nonce, época da região, limite de frequência e timeout, sem fila persistente.

Objetivos confirmados são monotônicos e replicados nos snapshots já existentes. Entregas simultâneas só concluem uma vez. Cada personagem mantém recibos locais de crédito por missão, no mesmo save da recompensa. Reconectar ou repetir a entrega não concede créditos novamente; falhas de armazenamento permitem nova tentativa. Não há XP adicional de missão nem nova moeda.

Saves anteriores mantêm passagens, equipamentos, XP e bosses. Ecos, mecanismo, Primeiro Eco e Warden já descobertos são reconhecidos; não exigem repetir combate. Uma campanha antiga com Ecos também reconhece a exploração inicial. As análises novas ainda precisam ser feitas. Aceites e relatórios continuam passando pelos NPCs.

## Laboratório e assets

O link começa na base com um Pioneiro temporário. Usa namespace próprio em **sessionStorage**, sem ler ou sobrescrever personagens, configurações ou saves reais. Fechar a aba descarta o teste; recarregar conserva os dados temporários e permite continuar pelo menu. Reiniciar teste apaga somente esse namespace.

Abra o painel inferior para simular a chegada a Lia, Ivo ou ao relatório final do Warden. Esses botões são exclusivos do laboratório; a simulação final não é um playthrough do boss. No coop só o anfitrião prepara etapas. Convites preservam o isolamento e o parâmetro de missões.

Nenhum asset novo gerado. Reutilizados `root-growth` e `world-shadow/ground-contact`, pequenos e sem colisores estruturais; amostras não obstruem caminhos. Três indicadores fixos na base e dois conjuntos fixos na Floresta, sem geração de texturas nem tweens contínuos. Bake, colisões funcionais, áudio e filme aprovados preservados.

## QA e limites

Scripts reproduzíveis:

```powershell
npm run typecheck
npm run build
node scripts/qa-arrival-missions-model.mjs
node scripts/qa-arrival-missions-protocol.mjs
node scripts/qa-arrival-missions-browser.mjs
node scripts/qa-arrival-missions-coop.mjs
```

Os dois últimos usam o servidor DEV em 5185; posições/preparação de encontros são explicitamente automatizadas. Modelo/save verificam pré-requisitos, descobertas anteriores, recompensa única e falha de armazenamento. Relay verifica autor, época, limites e equipe original. Browser verifica exploração, análises reais, diário, serviços, reload, viagens, resoluções 1280×720/1366×768/1920×1080/844×390, touch emulado e gamepad mock. Quatro contextos Chrome verificam colaboração, diálogo local, entrega simultânea, reconexão e preservação das missões.

[Relatórios e capturas](qa/). Separar medição local de FPS, teste de rede pública e aprovação perceptual. Hardware mobile/gamepad reais e o ritmo das conversas ainda exigem playtest humano. As posições DEV e a simulação do relatório final não provam o balanceamento da campanha inteira.

### Resultado técnico desta entrega

Typecheck/build, modelo/save, protocolo de missões, regressão de campanhas e chat passaram. Chrome DEV completou as missões, o fluxo Floresta → cavernas → Primeiro Eco → Warden → Vale, combate, morte/respawn, reload e recuperação de saves inválidos. Quatro contextos Chrome passaram por aceite, objetivos divididos entre convidados, entrega simultânea, análises com E, reconexão e respawn. Build compilada conferida em duas instâncias Chrome separadas, com movimento normal do convidado até Nara, aceite remoto e chat.

Amostras locais: **55,2 FPS médios na base**, chegando a 57,8; **57,7 FPS médios no Vale**. Após três viagens de ida/volta: 60 objetos, 210 texturas e nenhum tween na base, sem crescimento; listeners de janela mantiveram as mesmas contagens (10 keydown, 3 keyup). São medições headless nesta máquina, não garantia de desempenho em todos os dispositivos. O aviso de chunk grande do Phaser já existia.

**21/10/2026:** usuário autorizou avançar à fase 5 e pediu corrigir o grounding do Ivo e transformar a base em um acampamento coerente. Essa autorização permite a próxima entrega, sem tratar os seus problemas visuais da base como resolvidos nesta versão.

**Atualização do gate:** o usuário autorizou a fase 5 em 21/10/2026. Os dois mapas e o primeiro núcleo habitável estão documentados na [entrega 0.1.125](../first-settlement/README.md); sua validação humana permanece pendente.
