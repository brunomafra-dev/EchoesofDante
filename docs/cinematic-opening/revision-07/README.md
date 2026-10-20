# Nova propulsão · 0.1.123

[Ouvir no celular](https://echosofdante.vercel.app/engine-audio-test.html?v=0.1.123)

O usuário rejeitou as fontes isoladas da 0.1.122: cliques/tiques e pouca sensação de motor. Esta entrega substitui a proposta do laboratório por **outros sons**, com gravação de lançamento e rotação de turbina. A abertura, trilha e dublagem aprovadas não foram remisturadas; é necessário validar a fonte antes.

## Fonte e produção

Gravação-base: **NASA, Discovery STS-131: Sound of Launch**, disponibilizada em [Historical Sounds](https://www.nasa.gov/historical-sounds/). [MP3 original](https://www.nasa.gov/wp-content/uploads/2015/01/590189main_ringtone_131_launchNats.mp3) preservado em `source/`, com hash em [production.json](production.json). Uso conforme [orientações de mídia da NASA](https://www.nasa.gov/nasa-brand-center/images-and-media/); crédito da gravação separado do desenho sonoro final.

`python scripts/design-spacecraft-propulsion.py` produz offline:

- **Partida e aceleração · 6 s:** ronco contínuo de lançamento, crescimento de potência e harmônicos de eixo passando de 72 a 220 Hz, com múltiplos até 1.320 Hz.
- **Propulsores e frenagem · 9 s:** duas variações prolongadas de potência, rotação acompanhando o esforço e desaceleração final.
- A gravação é a camada dominante. Saturação suave controla transientes; as camadas de turbina usam fase contínua. Não há bipes ou cliques sintetizados adicionados, música ou dublagem.
- Normalização offline alvo −16 LUFS, teto −2 dBTP; MP3 192 kbps/48 kHz. Nenhuma geração por API, compra ou gasto de créditos. Não há síntese em runtime.

## Diagnóstico técnico

Na fonte anterior de decolagem, 99,6% da potência espectral estava abaixo de 180 Hz; apenas 0,4% em 180–1.800 Hz. Isso explica uma provável perda de corpo em caixas pequenas, mas não substitui a escuta. Na nova proposta, aproximadamente 48,5% está em 180–1.800 Hz. **Volume total maior não é o critério de aceitação.**

O script verifica continuidade em janelas de 100 ms, energia nos médios e ausência de clipping após codificação. [Métricas, fonte e hashes](production.json). A identificação como propulsão, o peso e o conforto precisam ser avaliados no celular/fones pelo usuário; não foram aprovados automaticamente.

## Publicação e testes

Novos caminhos `public/assets/cinematic-opening/propulsion-v2/` evitam reproduzir os MP3s rejeitados por cache. O player existente continua exclusivo por faixa, sem autoplay, com touch, controles nativos e download.

Typecheck/build passaram (apenas o aviso anterior do chunk Phaser). [QA em Chrome com touch emulado](qa/report.json): os dois MP3s conferem por hash, carregam como áudio e reproduzem naturalmente até o fim; replay/pausa, exclusão de reprodução simultânea, teclado e biblioteca passaram. Quatro resoluções (390×844, 844×390, 1280×720, 1920×1080) sem overflow; zero erros JS/assets, armazenamento de controle preservado. Não substitui Safari/dispositivo físico ou a avaliação perceptual.

Sem mudanças de saves, campanha, coop, trilha ou filme. Não há nova validação de FPS de combate nesta revisão de áudio isolado. A publicação é conferida pelo HTML e hashes dos arquivos, seguida de reprodução no endereço público.
