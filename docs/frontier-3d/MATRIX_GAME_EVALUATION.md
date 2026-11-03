# Matrix-Game 4.0 · avaliação para Dante

03/11/2026. O usuário confirmou o repositório [SkyworkAI/Matrix-Game](https://github.com/SkyworkAI/Matrix-Game) durante a implementação da cena 3D. A ideia é pertinente para comparar acabamento visual, com uma etapa de infraestrutura própria.

## Compatibilidade verificada

O modelo recebe frames simples; a engine continua responsável por jogo/física. A execução documentada requer Linux e GPU NVIDIA; o browser recebe vídeo. Há modelos publicados para castelo, Egito e corrida. [README oficial](https://github.com/SkyworkAI/Matrix-Game/blob/main/Matrix-Game-4/README.md).

O contrato mantém HUD/áudio fora da geração e associa-os ao frame apresentado. Portanto, um futuro adaptador precisaria manter controles, tempo e resultados de combate alinhados à imagem recebida. [Arquitetura](https://github.com/SkyworkAI/Matrix-Game/blob/main/Matrix-Game-4/docs/architecture.md).

Aqui a consulta ao Windows identificou **Intel UHD**, sem NVIDIA detectada. A cena Three.js foi exercitada nesse ambiente; inferência CUDA do Matrix não foi executada. Vercel e o relay atuais não fornecem essa GPU. Não há custo de servidor contratado, pesos baixados, inferência ou serviço remoto iniciado nesta entrega.

## Insumo concreto para comparação

O [roteiro de captura](../../scripts/capture-frontier-matrix-input.mjs) grava **somente o canvas 3D**, 1280×720, solicitando 24 FPS, por `captureStream`/MediaRecorder. Movimento e órbita são inputs reais. O HUD DOM permanece fora da gravação. [Vídeo limpo](matrix-input/clean-reference.webm), [metadados](matrix-input/capture.json), [tela original com HUD](matrix-input/source-with-hud.jpg).

[Decodificação e dimensões verificadas no Chrome](matrix-input/decode.json), [frame sem HUD](matrix-input/clean-frame.jpg). Isso valida o arquivo gravado, sem demonstrar compatibilidade ou resultado de inferência.

O fluxo offline oficial trabalha com imagem sem interface e compõe o HUD posteriormente. [Gravação/renderização offline](https://github.com/SkyworkAI/Matrix-Game/blob/main/Matrix-Game-4/docs/offline.md). Nosso vídeo é um **candidato de entrada**; não foi processado nem validado pelo modelo. A captura é em tempo real: 24 FPS solicitado não é garantia de cadência efetiva. Não é um filme de IA, uma captura de outro jogo ou evidência de renderização neural.

## Experimento proposto

1. Disponibilizar uma máquina Linux/GPU compatível, com teto de uso explícito. Isso ainda não está disponível nesta sessão.
2. Rodar o pipeline oficial com uma cena de referência para validar o ambiente; conferir licenças dos pesos/assets utilizados.
3. Processar nosso vídeo em modo offline e comparar a mesma sequência: personagem, mãos, objetos, posições de sombra, chão, câmera e continuidade. Os modelos fornecidos não demonstram fidelidade ao Organic Sci-Fi R3; isso precisa ser medido, não presumido.
4. Só depois de inspecionar A/B, decidir se há benefício para Dante. Uma demonstração interativa exigiria adaptar o transporte e medir atraso entre controle e imagem, consumo por sessão, estabilidade e iPhone físico. Nenhuma dessas medidas foi obtida aqui.

**Decisão desta entrega:** protótipo 3D jogável local ao navegador + gravação limpa + avaliação técnica. Integração neural permanece pendente de infraestrutura e comparação real; não é um botão de qualidade já implementado. Assets 3D, texturas, iluminação e animações continuam sendo caminhos para melhorar a versão que roda diretamente no aparelho. O experimento não altera saves, campanha ou co-op existentes.
