# Abertura — trilha e efeitos · 0.1.120

[Filme completo](https://echosofdante.vercel.app/cinematic-review.html?take=film&v=0.1.120) · [Desembarque](https://echosofdante.vercel.app/cinematic-review.html?take=landing&v=0.1.120) · [Conversa na ponte](https://echosofdante.vercel.app/cinematic-review.html?take=voices&v=0.1.120)

## Pedido e escopo

O usuário aprovou a imagem e Nara na 0.1.119. Pediu música espacial suave e efeitos ligados à ação, mantendo o volume anterior e a dublagem em primeiro plano. Esta revisão troca somente o áudio dos três vídeos e atualiza o laboratório/biblioteca. Personagens, cenas, legendas, duração, combate, saves e protocolo cooperativo permanecem os mesmos.

## Trilha e efeitos

**Um lugar para recomeçar:** composição MIDI original de 54,25 s, piano suave, cordas sustentadas e camada espacial. Harmonia passa da perda à descoberta e termina aberta. Sem bateria, alarmes ou repetição de um loop musical curto. O MIDI está nesta pasta; a renderização instrumental usa FluidSynth 2.6.1 e GeneralUser GS 2.0.3 de S. Christian Collins. [Fonte e licença do soundfont](https://github.com/mrbumpy409/GeneralUser-GS), com cópia integral da licença nesta pasta. Ferramenta e banco instrumental ficam apenas na máquina de produção, fora do jogo.

Oito efeitos originais gerados no modelo `sound-effects` do Runway: motor, cabine, descida, apoio do módulo, passos, floresta, vento seco e equipamento. O plano Free disponibilizou essa ferramenta; oito gerações consumiram 55 créditos gratuitos, sem compra. MP3s, prompts, IDs e hashes estão em [sfx-sources.json](sfx-sources.json).

| Trecho | Som principal |
| --- | --- |
| Terra · 0–6 s | Vento seco contido |
| Evacuação · 6–12 s | Motor ganhando impulso |
| Viagem · 12–18 s | Ventilação e propulsão abafada |
| Dante em órbita · 18–24 s | Propulsão distante |
| Ponte · 24–36 s | Cabine, fundo discreto |
| Pioneiros · 36–40,5 s | Equipamento e cabine |
| Descida · 40,5–49,5 s | Motor, atmosfera e desaceleração |
| Desembarque · 49,5–54,25 s | Peso do módulo, passos, folhas e água distante |

Os efeitos acompanham eventos visuais amplos. Não houve nova animação labial nem sonorização individual de cada articulação. As camadas separadas podem ser ouvidas no laboratório.

## Mixagem

- Onze arquivos de voz aprovados, com os mesmos ganhos e horários. Narrador, Ivo e Nara conservam seu elenco.
- Música e efeitos recuam antes das falas: antecipação de 180 ms e retorno de 550 ms. Medição por fala, sobre amostras ativas da voz: margem mínima de 16 dB para o fundo combinado. Isso não equivale a garantir inteligibilidade em todos os aparelhos.
- Filtros suaves reduzem graves excessivos e frequências agudas do fundo. Sem o ruído/ambiência sintética da montagem anterior.
- Volume integrado medido: **−24,4 LUFS**, anterior **−23,8 LUFS**; diferença de **−0,6 LU**. Pico verdadeiro **−7,2 dBFS**, sem clipping.

A montagem e a mistura efetiva foram feitas no Concat 0.2.8: duas camadas sonoras novas e as onze vozes. O projeto usa uma prévia de trabalho 320×180; **essa imagem não é publicada**. O finalizador aproveita apenas o áudio exportado pelo Concat e copia os streams H.264 aprovados, sem recodificação. Hashes dos pacotes de vídeo confirmam preservação exata nos três arquivos publicados: filme 1280×720/24 FPS, 1302 quadros; ponte 288; desembarque 114. Filme final: 44.447.402 bytes.

## Reprodução da produção

Pré-requisitos locais: Python com numpy/imageio-ffmpeg/OpenCV, FluidSynth e GeneralUser nos caminhos registrados em `scripts/compose-opening-soundtrack.py`, Concat e os arquivos de voz das revisões anteriores. Recuperar do commit `21711db4375e0975e092aac1ef0bfd5c03b1135c` os três vídeos aprovados para `.local/cinematic-opening/revision-05/approved-{film,bridge,landing}.mp4`. Não usar o vídeo já atualizado como referência da versão anterior.

```powershell
python scripts/compose-opening-soundtrack.py
$env:CINEMATIC_REVISION='revision-05'
node scripts/concat-opening.mjs
node scripts/concat-opening.mjs --export
python scripts/finalize-opening-sound.py
python scripts/qa-opening-sound.py
$env:QA_REVISION='revision-05'
python scripts/qa-opening-voices.py
```

As camadas WAV e os projetos de trabalho ficam em `.local`, ignorados pelo Git. O navegador baixa somente MP4/AAC prontos; nenhum modelo, sintetizador ou geração roda em runtime. Os recibos Concat, arranjo, cues, fontes e hashes estão nesta pasta.

## Validação

[Som](qa/sound-report.json), [onze falas](qa/voice-report.json) e [quadros/mídia](qa/media/media-report.json): passaram. Correlação entre mixagem esperada e áudio final: 0,99997. Nenhuma fala truncada ou fonte de voz alterada; 1302 quadros válidos, sem quadros consecutivos duplicados.

- `npm run typecheck` e `npm run build`: passaram; somente o aviso já existente sobre tamanho do chunk Phaser.
- [Player](qa/player/report.json): reprodução natural dos 54,25 s, pausa/replay, cinco repetições sem crescimento do DOM, quatro resoluções (1280×720, 1366×768, 1920×1080, 844×390), touch, gamepad mock e saves de controle preservados. Chrome contabilizou 29 descartes em 1.314 apresentações de quadros, incluindo navegação/replay (2,2%). Arquivo a 24 FPS; não se trata de uma medição de FPS do combate.
- [Laboratório](qa/review/report.json): três trechos, oito ciclos de troca/replay com um único vídeo, imagens comparativas e biblioteca; zero erros JS/assets.
- [Prólogo](qa/prologue/report.json): pausa/configurações/volume, final natural/pular com conclusão única e liberação da mídia. Mantido o volume de reprodução atual do jogo (0,2).
- [Início da campanha compilada](qa/timeline/timeline-report.json): novo personagem temporário, clique na dificuldade, filme, final e entrada na base; nome/dificuldade/introSeen preservados, sem erros. Testes usam perfis isolados.

Esta alteração não redesenha cenário nem adiciona objetos Phaser; áudio é um único stream AAC já misturado. Não foi repetido o benchmark de combate, pois o renderer, os assets do jogo e o código de gameplay não mudaram.

**Aprovação técnica não substitui escuta humana.** Conferir com fones e alto-falantes: conforto dos motores, presença da música, ausência de aspereza, clareza das onze falas e sincronismo percebido no pouso. A nova mixagem aguarda esse playtest. Missões e mapas não foram iniciados.
