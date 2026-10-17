# Uma chance de abrigo — piloto de 12 segundos · 0.1.108

[Assistir ao piloto](https://echosofdante.vercel.app/cinematic-bridge-pilot.html?v=0.1.108) · [MP4](https://echosofdante.vercel.app/assets/cinematic-pilot/bridge-whole-scene-pilot.mp4) · [Biblioteca](https://echosofdante.vercel.app/test-library.html) · [Quadros](contact-sheet.jpg)

**Playtest humano necessário.** A amostra de cinco segundos foi aprovada em 17/10/2026; esta montagem completa tem avaliação própria. Não foi iniciada a abertura de 55 segundos nem a etapa de missões/mapas. O prólogo ativo continua provisório.

## Cena e narrativa

Ivo opera o console, volta-se para Nara e informa condições de sobrevivência. Ela reage, gesticula e prepara o reconhecimento; ao final ambos voltam a atenção ao planeta. Não revela o Sinal ou a assinatura humana ancestral.

| Tempo | Legenda |
| --- | --- |
| 0,5–3,8 s | **Ivo:** Água líquida. Atmosfera compatível. |
| 4,1–6,8 s | **Nara:** Então existe uma chance. |
| 7,2–11,6 s | **Nara:** Prepare o reconhecimento. Ninguém desce sozinho. |

Legendas incorporadas ao vídeo para download/mobile, com transcrição na página e [VTT separado](../../../public/assets/cinematic-pilot/bridge-whole-scene-pilot.pt-BR.vtt). Faixa superior para permanecer legível quando os controles nativos aparecem na parte inferior, inclusive ao pausar. Sem dublagem ou sincronização labial prometida. Ambiente original: motor grave, ar da cabine e bipes discretos, sintetizados offline; nenhum sample ou trilha protegida.

## Produção e procedência

1. Mantido intacto o [clipe aprovado](../revision-03/README.md), SHA-256 `81b8f0d17466c19a16c506804fd3b94634ac08cf6fa0d7be5e2fc7a60802cd79`.
2. Extraído o quadro **79 inteiro**, 832×480, como entrada da continuação de cinco segundos, seed 108.
3. Extraído o quadro **80 inteiro** dessa continuação para o fechamento de **2,25 segundos**, seed 109. O prompt descreve um gesto curto de dois segundos; os 0,25 s extras fornecem quadros reais de apoio à interpolação.
4. Cada geração foi enviada uma única vez pelo formulário público normal do [Space Wan2.2 Fast](https://huggingface.co/spaces/zerogpu-aoti/wan2-2-fp8da-aoti-faster), anônimo, quatro passos, sem credenciais pagas ou compra de créditos. Acesso e cota dependem do serviço. Sem rotação de contas, evasão de cota ou retries automáticos.
5. Fontes originais de continuação em [source](source/), com recibos, horários, hashes e prompts completos. [Prompt 02](take-02-prompt.txt) e [prompt 03](take-03-prompt.txt). Imagem inicial inteira e origem registradas na revisão 02; nenhum novo asset de personagem ou recorte de membro.

Autor de tomadas: `node scripts/generate-hf-cinematic-take.mjs --input ARQUIVO --prompt PROMPT --seconds 0.5..5 --seed NUMERO --out .local/PASTA`. Usa Chrome/Playwright já instalados. Cada pasta aceita um único recibo; falha exige inspeção, nunca nova submissão automática. Reproduzir a montagem **não chama** esse serviço.

Montagem reproduzível com os arquivos versionados: `python scripts/assemble-bridge-pilot.py`, usando NumPy, OpenCV e imageio-ffmpeg existentes no ambiente de autoria. O jogo não recebe essas dependências.

## Formato e limites técnicos

- **Fonte real:** 832×480, **16 FPS**, 81 + 81 + 37 quadros nos três clipes.
- Seleção: `[0,80)`, `[1,81)`, `[1,37)`. Não repetir os quadros usados como condicionamento das continuações. Total: **196 quadros reais / 12,25 s**, incluindo apoio ao processamento final.
- Compensação de movimento FFmpeg `minterpolate` para 24 FPS; ampliação Lanczos para 1248×720 e margens laterais de 16 px, sem esticar os corpos. Corte final exato em 12 s. **Não é fonte nativa 720p/24 FPS** e a interpolação não inventa detalhe óptico ausente.
- Não há loop, câmera animada localmente, câmera lenta, frame congelado ou transformação independente de braços/pernas.
- **Exportação:** H.264/yuv420p, **1280×720, 24 FPS, 288 quadros, 12 s**, AAC estéreo 48 kHz/128 kbps, faststart. **4.865.134 bytes (~4,87 MB)**. [Metadados, áudio e hashes](media.json).
- Custo runtime: um elemento nativo de vídeo + UI pequena. Metadados/poster carregados antes de reproduzir; nenhuma geração de arte, Phaser, cenário, relay ou save importado. Gamepad faz polling somente conectado e com aba visível.

## Revisão crítica

Quadros amostrados mostram ação ao longo de toda a duração: operação do console, troca de olhar, gesto e virada para o planeta. Personagens continuam inteiros; não foram remontados por articulações. A inspeção de quadros não equivale a aprovação visual do filme em movimento.

**Resíduos para playtest:** enquadramento deriva apesar do prompt de câmera fixa; rosto/mãos e proporções podem variar entre quadros. A continuação mantém a pose inicial como referência, mas não é captura real da mesma atuação. Interpolação pode produzir suavização/ghosting em movimentos de mão. O som é ambiente, sem fala. A fonte é menor que o alvo final; 720p é formato de entrega ampliado. Avaliar se esses limites são aceitáveis antes de produzir mais cenas.

## Validação

**Automação passou; playtest humano necessário.**

- `npm run typecheck` e `npm run build`: passaram. Somente aviso já conhecido de chunk Phaser acima de 500 kB.
- `python scripts/qa-bridge-media.py`: [relatório](qa/media-report.json). Todos os 288 quadros decodificados, zero pares adjacentes idênticos, hashes das fontes/saída conferidos. Áudio AAC estéreo sem clipping (pico ~0,145 e RMS ~0,038), três legendas UTF-8. O AAC contém ~0,011 s de padding; o vídeo tem 12 s exatos.
- `node scripts/qa-bridge-pilot.mjs`: [relatório](qa/report.json), Chrome local compilado. Reprodução integral, pausa estável, replay, pular, cinco replays sem crescimento do DOM, uma única instância de vídeo; teclado, touch emulado e gamepad mock. Quatro resoluções: 1280×720, 1366×768, 1920×1080, 844×390. Zero erros JS/assets; sentinelas de armazenamento intactas.
- Regressão aplicável: `qa-cinematic-motion.mjs` e `qa-cinematic-reference.mjs` passaram, preservando a amostra aprovada e o quadro-base. Evidências temporárias em `%TEMP%/dante-010108-motion-regression` e `%TEMP%/dante-010108-reference-regression`.
- `git diff --check`: sem erros. Sem alterações em combate, controles do jogo, classes, campanhas, protocolo de salas, mapas ou saves. Não foi repetido o percurso da campanha: esta entrega é mídia isolada e a entrada principal não importa seu player/MP4.

Não medir FPS de gameplay neste laboratório: a mídia tem cadência de 24 FPS. A medição de reprodução do Chrome fica no relatório e não representa um benchmark do jogo. Touch/gamepad são emulados; aparelhos físicos e avaliação da atuação/áudio continuam para o playtest.

**Publicação conferida em 17/10/2026:** Vercel publicou a 0.1.108; página e MP4 responderam 200, SHA-256 público igual ao local. [QA público completo](qa/public-report.json) passou nas quatro resoluções, incluindo teclado, touch e saída pelo gamepad, com zero erros JS/assets e zero quadros descartados no trecho medido (300 apresentados/consultados, incluindo buscas). A primeira execução pública revelou uma corrida no próprio helper de QA ao soltar B durante a navegação; o helper passou a aguardar a mudança de página sem tentar escrever no documento anterior. Não foi uma falha do player.

**Próximo gate:** usuário assistir à montagem com som e avaliar atuação, anatomia, continuidade, leitura das legendas e ritmo. Só depois avançar para a abertura completa; missões e mapas seguem o plano arquivado.
