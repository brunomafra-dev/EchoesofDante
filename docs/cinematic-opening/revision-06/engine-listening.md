# Escuta isolada no celular · 0.1.122

[Abrir os dois players](https://echosofdante.vercel.app/engine-audio-test.html?v=0.1.122)

O usuário ainda percebe cliques/tiques, sem propulsão, e pediu ouvir as fontes num site no celular. A presença perceptual dos motores **não está aprovada**. Esta entrega publica os dois MP3s originais da revisão 06 sem filtros, alteração de volume, música ou vozes, com controles nativos, botões grandes e download. Reproduzir um efeito pausa o outro; não há autoplay/loop ou carregamento de campanha/saves.

Arquivos copiados sem conversão para `public/assets/cinematic-opening/engine-isolated/`, página estática `public/engine-audio-test.html` e acesso pela biblioteca. O filme e a mixagem permanecem nesta rodada na 0.1.121. Nenhuma geração ou consumo de créditos.

Typecheck/build passaram (aviso pré-existente de tamanho do chunk Phaser). [QA Chrome com touch emulado](qa/isolated/report.json): os dois arquivos conferem com as fontes por SHA-256, carregam como áudio MPEG e reproduzem até o fim. Replay, pausa, exclusão de reprodução simultânea, teclado, biblioteca e quatro resoluções passaram (390×844, 844×390, 1280×720, 1920×1080), sem overflow ou erros JS/assets; armazenamento de controle preservado. Isso não substitui o teste em Safari/iPhone ou a avaliação perceptual. Aguardar escuta humana antes de trocar fontes ou refazer a mixagem.
