# Expansão 05 — Margem Leste da Bacia do Siroco

## Objetivo

Dar continuidade física à Bacia do Siroco e transformar a visita curta ao relé em uma pequena expedição: registrar o sinal, explorar um desvio opcional e alcançar um portal de retorno para o Vale.

## Experiência

- A Bacia foi prolongada cerca de 2.250 unidades para leste, mantendo o mesmo mapa, câmera, piso e controles.
- O relé agora comunica que foi mapeado e aponta o sinal para leste. A expedição só termina quando o jogador alcança o novo portal.
- A Prateleira das Agulhas é um desvio opcional. Descobri-la concede 20 XP uma vez, usando o feedback flutuante de XP já usado por inimigos e outros marcos.
- Quatro habitantes adicionais reutilizam os arquétipos existentes. Eles podem ser evitados; não existe requisito de eliminar inimigos para abrir o portal.
- Ao chegar à margem leste, o jogador recebe um checkpoint seguro. O portal final retorna ao portal do Vale, enquanto o portal oeste continua voltando ao checkpoint anterior do Vale.
- Sinal, descoberta, recompensa, visita à margem e progresso dos habitats continuam no save local já existente. Não foi criado um novo sistema de save.

## Arte e renderização

O piso oriental é uma ilustração original de terreno, gerada para continuar a paleta e materialidade do Siroco. A imagem-fonte de 1536×1024 fica em `source-art/`; `scripts/prepare-sirocco-expansion.py` a converte offline em WebP para o navegador. A imagem final tem 294.452 bytes e é exibida em 2250×1500 unidades.

Formações, raízes e minerais estáticos são compostos uma vez em três bandas de profundidade por trecho. Com a expansão, a Bacia usa seis RenderTextures estáticas no total. Portais, relés e os dois pequenos pulsos de descoberta permanecem como objetos de runtime.

## Validação técnica

O roteiro de `qa/report.json` percorre a entrada, o relé, o desvio, a margem, morte/respawn, reload, portais de ida/volta e uso touch. A travessia foi feita em Chrome headless com teclas reais do navegador e Gamepad API mock; touch foi emulado. Foram cobertos 1280×720, 1366×768, 1920×1080 e 844×390.

Na Bacia expandida, a execução observou média de 60,2 FPS e mínimo de 60,1 FPS, com 116 objetos, 6 RenderTextures e 4 tweens no fim da medição. Após viajar para o Vale, a média foi de 57,2 FPS e o mínimo de 55,5 FPS. São medições do Chrome headless, não garantia de desempenho em hardware físico.

Capturas:

- [Entrada da Bacia](qa/sirocco-entry.png)
- [Relé mapeado](qa/sirocco-relay.png)
- [Desvio opcional](qa/sirocco-needle-shelf.png)
- [Expedição concluída e portal leste](qa/sirocco-expedition-complete.png)
- [Layout touch em landscape](qa/sirocco-mobile-landscape.png)

## Limitações e validação humana

Não foi feito playtest físico nesta execução. O usuário ainda precisa validar se a distância da nova rota, o volume de combate e a leitura do objetivo ficam bons jogando normalmente. Os habitantes podem perseguir o jogador segundo a IA existente; não foi introduzido pathfinding.

## Arquivos de referência

- Arte-fonte: `source-art/sirocco-east-ground-source.png`
- Dimensões e hash: `asset-measurements.json`
- Relatório do navegador: `qa/report.json`
- Brief de geração: `illustration-prompt.md`
