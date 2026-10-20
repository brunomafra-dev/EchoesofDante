# Abertura — heróis à frente, imagem e vozes · 0.1.117

[Novo desembarque](https://echosofdante.vercel.app/cinematic-review.html?take=landing&v=0.1.117) · [Ponte dublada](https://echosofdante.vercel.app/cinematic-review.html?take=voices&v=0.1.117) · [Filme completo](https://echosofdante.vercel.app/cinematic-opening.html?v=0.1.117).

## Pedido e entrega

O usuário autorizou testar o Concat, melhorar a imagem e fazer os quatro heróis desembarcarem antes da tripulação. Revisão dentro da etapa 3; missões, mapas e dublagem integral aguardam avaliação humana.

- Novo quadro completo do desembarque e duas tomadas contínuas. Guerreiro, Hunter, Astral e Domador à frente; tripulação atrás. Hunter mantém pele escura, cabelo prateado, uniforme azul e arnês âmbar. Nenhuma criatura nativa a bordo e nenhum assentamento já instalado na chegada.
- Ponte e desembarque com restauração offline moderada: Real-ESRGAN x2, mistura de 55% restaurado + 45% original. Demais cenas reutilizadas. Menor compressão no arquivo final (CRF 18, antes 21).
- Prova separada de 12 s: duas vozes locais PT-BR, três falas, legendas e ambiente. Edição e exportação reais pelo Concat 0.2.8/MCP; não é apenas um projeto vazio ou roteiro.
- Laboratório com acesso direto aos três vídeos, comparação de nitidez, baixar/reproduzir/rever, teclado, touch e gamepad. Nenhum acesso à campanha ou aos saves.
- A campanha usa o filme revisado com legendas e ambiente. A prova de vozes permanece no laboratório até aprovação.

## Imagem e continuidade

[Quadro-base novo](../source/landing-heroes-v2.png) · [prompt e referências](../prompts/landing-heroes-image-v2.txt). Gerado com `image_gen.imagegen`; arquivo original copiado para o repositório. [Metadados](../source/landing-heroes-v2.json).

As duas novas tomadas usam a mesma conta gratuita HF/Wan2.2 e credencial local cifrada. Sem compra, retries automáticos ou troca de conta. Prompts e recibos: `landing-heroes-v2-01` e `-02` nas pastas `prompts/` e `source/`. A continuação recebe o quadro inteiro 79; o primeiro quadro repetido não entra novamente na montagem. Fontes antigas preservadas como histórico, fora deste corte.

Fonte real **832×480 / 16 FPS**. Restauração não cria uma filmagem originalmente HD; preserva parte da textura e reduz o aspecto borrado da ampliação. Saída **1280×720 / 24 FPS**, proporcional, com margens laterais e interpolação. [Fontes, contagens e hashes do filme](../media.json) · [Restaurador e escopo](restoration.json).

Na inspeção dos [quadros do filme exportado](film-contact.jpg), os quatro heróis permanecem distintos e à frente. A tripulação começa a sair atrás deles. O modelo acompanha levemente a caminhada com a câmera, aproxima os corpos e muda pequenos detalhes de roupa/mãos. Alguns pés ficam perto do limite inferior. A nitidez e a continuidade ainda precisam de avaliação vendo o movimento; não são aprovadas automaticamente pelos testes.

[Dimensões e hashes finais](exports.json): filme **41.923.942 bytes / 59,25 s**; desembarque isolado **11.089.530 bytes / 9,75 s**; ponte dublada **5.920.154 bytes / 12 s**. O arquivo completo anterior tinha 25.027.247 bytes: a menor compressão aumenta o download. Todos continuam em H.264/AAC, 720p24, com metadados de carregamento antecipado e controles nativos. Restauração levou aproximadamente 22 min offline neste Celeron/UHD; nenhum modelo de IA é executado no navegador.

## Vozes e Concat

Ivo: `pm_alex`. Nara: `pf_dora`. Kokoro-82M, ONNX int8/CPU, frontend eSpeak PT-BR. Vozes padrão, sem clonar pessoas e sem conta/serviço pago. [Texto e horários](dialogue.json) · [WAVs, duração, picos e hashes](voice-report.json).

`kokoro-onnx` 0.5.0 enviava `speed` int32 para um export que declara float. O runner respeita o tipo declarado pelo ONNX, sem alterar o pacote instalado. Ambiente Python, executáveis e modelos ficam somente em `.local/`, sem dependências ou modelos no jogo.

Concat 0.2.8 foi obtido do [release oficial](https://github.com/jub0t/Concat/releases/tag/v0.2.8), com SHA-256 conferido contra `SHA256SUMS`, e extraído localmente do MSI. Não altera a instalação de aplicativos do Windows. Ponte, ambiente e WAVs são faixas separadas, com legendas editáveis e volume da fala acima do ambiente. [Edição MCP](concat-edit.json) · [Exportação MCP](concat-export.json).

A atuação original foi preservada: **não há sincronização labial nova**. Pronúncia, timbre, interpretação e volume dependem do teste humano. Não se aplicou a voz a todo o filme sem validar esta prova.

Referências: [Concat/MCP](https://github.com/jub0t/Concat/blob/main/docs/MCP.md), [Kokoro ONNX](https://github.com/thewh1teagle/kokoro-onnx), [vozes PT-BR](https://huggingface.co/hexgrad/Kokoro-82M/blob/main/VOICES.md), [Real-ESRGAN](https://github.com/xinntao/Real-ESRGAN). Executáveis/modelos não são redistribuídos no runtime. Concat: AGPL-3.0; Kokoro-82M: Apache-2.0; Kokoro ONNX/ncnn wrapper: MIT; Real-ESRGAN: BSD-3-Clause.

## Reprodução local

1. Restaurar quadros: `python scripts/remaster-opening-frames.py` (binário e modelos locais necessários).
2. Montar filme: `python scripts/assemble-cinematic-opening.py --restored --reuse-unchanged`. A reutilização exige fontes com hashes idênticos; faltas de fonte/restauração interrompem a montagem.
3. Vozes: `.local/voice-venv/Scripts/python.exe scripts/generate-bridge-voices.py`.
4. Preparar ambiente da ponte: extrair os 12 s iniciando em 24 s do mix original para `.local/cinematic-opening/revision-02/bridge-ambience.wav`.
5. Editar projeto: `node scripts/concat-bridge-pilot.mjs`; exportar: `node scripts/concat-bridge-pilot.mjs --export`. `CONCAT_EXE` permite apontar para outra instalação. A criação recusa duplicar uma edição não vazia.

## QA e revisão humana

- `npm run typecheck` e `npm run build`: passaram. Somente o aviso conhecido do chunk Phaser >500 kB.
- [Mídia](qa/media/media-report.json): 1.422 quadros, nenhuma duplicata adjacente, 12 legendas PT-BR, fontes/resultado conferidos por SHA-256, AAC estéreo 48 kHz sem clipping.
- [Vozes](qa/voice-report.json): as três falas geradas estão efetivamente presentes no MP4 nos horários previstos; correlação com os WAVs >0,93, pico 0,664, sem corte de palavras. Não valida interpretação ou pronúncia. [Imagem do Concat](qa/concat-picture.json): o export usa a ponte restaurada, e não um intermediário antigo.
- [Player completo](qa/player/report.json): filme inteiro, teclado, pause/replay, touch, gamepad mock, cinco replays, quatro resoluções e zero erros JS/assets. **0 descartes em 1.434 quadros consultados**, incluindo buscas/replay; reprodução a 24 FPS. Não é benchmark novo da campanha em 60 FPS.
- [Laboratório novo](qa/review/report.json): três acessos diretos, dois curtas reproduzidos integralmente, quatro resoluções para cada modo, oito trocas/replays, gamepad e touch. Um vídeo e DOM estáveis, imagens comparativas carregadas, saves sentinela intactos.
- [Componente de prólogo](qa/prologue/report.json): volume mestre × música, pausa/continuar/configurações, som, término/pular uma única vez e liberação de mídia. [Novo jogo compilado](qa/timeline/timeline-report.json): personagem/dificuldade → filme correto → base, `introSeen` e nome preservados.

Nenhuma mudança de combate, personagens, salas, protocolo ou formato de save. Não foi repetido um benchmark da campanha inteira para esta troca de mídia. **QA técnico concluído; aprovação humana da imagem/vozes pendente.** Não iniciar missões/mapas nem dublagem integral antes dessa avaliação.
