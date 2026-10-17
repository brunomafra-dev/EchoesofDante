# Revisão 02 — personagens inteiros · 0.1.106

**Atualização 17/10/2026:** [teste curto 0.1.107](../revision-03/README.md) gerado gratuitamente no Hugging Face ZeroGPU. Esta revisão preserva o quadro-base e o histórico de preparação; o piloto final de 12 segundos ainda não está concluído.

**A 0.1.105 foi rejeitada pelo usuário. O novo filme ainda não foi produzido.** Esta revisão entrega o quadro-base inteiro e corrige o estado do laboratório; não encerra a etapa 3.

[Referência atual](https://echosofdante.vercel.app/cinematic-pilot.html?v=0.1.106)

## Correção de abordagem

O render anterior recortou cabeça, torso, mãos e pernas para articulá-los por código. A anatomia, as junções e o movimento ficaram inaceitáveis. Os testes de duração, formato e reprodução não comprovaram qualidade visual. O pedido atual é explícito: **personagens desenhados inteiros, sem montagem por membros**.

- Criada uma cena completa com Nara e Ivo, corpos contínuos, mãos de Ivo apoiadas no console e pés integrados ao piso. **image_gen.imagegen**, usando a ponte original e os dois civis inteiros como referências; nenhum atlas de membros foi usado.
- [Fonte PNG](source/bridge-whole-characters.png), **1672×941**, e [prompt exato](image-prompt.txt). Exportação WebP em `public/assets/cinematic-pilot/bridge-whole-characters.webp`. Somente conversão de formato, sem recortes ou montagem dos personagens.
- Laboratório mostra explicitamente **imagem estática, ainda não é o novo filme**. O MP4 antigo aparece apenas como histórico rejeitado. O script que gerava recortes está desativado; o QA antigo do player também recusa execução como teste atual.
- Campanha, personagens jogáveis, coop, câmera e saves não foram alterados. O prólogo provisório do jogo não foi substituído por outra falsa cinemática.

## Pesquisa de ferramentas — 16/10/2026

| Opção | Capacidade verificada | Decisão |
| --- | --- | --- |
| [MoneyPrinterTurbo](https://github.com/harry0703/MoneyPrinterTurbo/blob/main/README-en.md) | Orquestra roteiro, mídia, legendas, áudio e edição; integra provedores de geração de vídeo que exigem configuração/API | Pode montar o filme; instalar sozinho não fornece acesso ao gerador. Nenhum pacote foi instalado |
| [Wan2.2 / Wan-Animate](https://github.com/Wan-Video/Wan2.2) | Image-to-video e animação a partir de imagem de personagem + vídeo de movimento; TI2V-5B documenta GPU de pelo menos 24 GB para o comando oficial | Alternativa aberta com execução em GPU apropriada. Esta máquina expõe Intel UHD integrada; não é um ambiente adequado para esse comando |
| [ComfyUI](https://github.com/Comfy-Org/ComfyUI) | Interface de execução de modelos; não substitui pesos nem capacidade de inferência | Útil em um ambiente com o modelo e hardware necessários |
| Runway | Integração encontrada na descoberta de plugins: geração de vídeo a partir de imagem | Caminho direto proposto. **Disponível, porém não instalado/conectado nesta sessão**. Solicitação de conexão enviada ao usuário |

Não há ferramenta de geração de vídeo já conectada. Adobe disponível nesta sessão monta/edita clipes; as ferramentas expostas não oferecem geração de atuação. Não há credenciais dos provedores de vídeo pesquisados no ambiente. Não foi solicitado que o usuário cole chaves no chat e não houve assinatura/compra automática.

O usuário perguntou sobre custo antes de conectar. Preços oficiais consultados: Free com 125 créditos únicos, modelos limitados e marca d'água; Standard US$ 15/mês ou equivalente a US$ 12/mês com cobrança anual. [Preço](https://runway.com/pricing) · [Limites gratuitos](https://help.runwayml.com/hc/en-us/articles/50404627334547-Free-plan-details). A [integração ChatGPT](https://runway.com/mcp/chatgpt) usa os créditos da conta Runway, sem chave de API; modelos disponíveis dependem do plano. Nenhuma geração foi solicitada. Conferir acesso/saldo antes de estimar o piloto; não presumir que o plano gratuito disponibiliza o modelo desejado.

## Próximo trabalho dependente da conexão

**Caminho atual autorizado:** teste único de cerca de 5 s com **Wan2.2 5B na fal.ai**, antes de produzir o piloto completo. [Configuração local, comandos, limite consultado de US$ 0,15 e QA](wan-test.md). Chave local e autenticação confirmadas em 17/10/2026 por GET de preços: HTTP 200, USD 0,15 por vídeo; controle sem chave HTTP 401. Usuário ainda não adicionou créditos; nenhuma geração paga foi enviada. Runway foi conectado pelo usuário, que informou plano Free com 500 créditos, mas nenhum modelo de imagem para vídeo liberado nessa integração.

1. Gerar movimento contínuo usando **a cena completa** como referência, preservando rostos, anatomia, figurino e contato com o cenário. Câmera fixa e ações contidas no console/conversa.
2. Inspecionar o vídeo e amostras de mãos, braços, pernas e rostos ao longo de todo o movimento. Rejeitar deformações, membros extras, pessoas deslizando ou cortes incoerentes. Não regenerar automaticamente; avaliar o teste antes de decidir novo gasto.
3. Montar os 12 s com legendas em português e áudio ambiente; exportar H.264/AAC 1280×720/24 FPS. Não substituir atuação por zoom, paralaxe, dissolução de poses ou deformação do quadro-base.
4. Só então reativar o player com **o clipe novo** e executar QA de reprodução, pausa, replay, mobile e gamepad. Publicar sem confundir aprovação técnica com visual.
5. Aguardar aprovação humana antes dos 55 s completos ou de missões/mapas.

## QA desta revisão

`npm run typecheck`, `npm run build`, `git diff --check` e `node scripts/qa-cinematic-reference.mjs`. O teste verifica carregamento da imagem inteira, quatro viewports, rótulo estático, ausência de player atual, histórico rejeitado e saves intactos. **Não testa um filme novo**, porque ele não existe ainda.

O roteiro curto permanece: Ivo detecta água/atmosfera compatível; Nara percebe uma chance de abrigo e ordena preparar o reconhecimento. Sem antecipar respostas sobre Dante, Sinal ou arquivo ancestral.

**Resultado técnico:** typecheck, build e QA local da referência passaram, sem erros JS/assets nas quatro viewports. Apenas o aviso conhecido de bundle Phaser grande. Nenhum resultado deste QA é aprovação de um vídeo novo: `videoGenerated: false` fica explícito no relatório. A execução do antigo render agora falha antes de gerar quadros, informando a rejeição.
