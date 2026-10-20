# Motores mais presentes · 0.1.121

[Testar o filme](https://echosofdante.vercel.app/cinematic-review.html?take=film&v=0.1.121)

O usuário aprovou a trilha e o fundo da 0.1.120, mas não percebeu aceleração/propulsão. Correção restrita à **decolagem (6–12 s)** e **descida (40,5–49,5 s)**. Não amplia o conteúdo da campanha.

## Ajuste

- Duas novas fontes originais: turbina acelerando até potência de voo; propulsores de descida e frenagem. Prompts, IDs, hashes e MP3s em [sfx-sources.json](sfx-sources.json); 15 créditos gratuitos, sem compra.
- Mais harmônicos na faixa audível em caixas pequenas (100–2900 Hz), sem depender apenas de subgrave. Aceleração cresce durante a decolagem; fades evitam entradas bruscas.
- Prioridade dinâmica só nesses motores. Recuam durante as falas e retornam nas pausas. Trilha instrumental aprovada copiada sem alterar um byte; efeitos fora dessas duas janelas preservados em PCM.
- Ganho medido na faixa 250–2000 Hz: decolagem +16,49 dB e descida +6,14 dB em relação aos motores anteriores. Isso mede presença espectral, não certifica percepção em todos os dispositivos. Dublagem permanece pelo menos 13 dB acima do fundo combinado nas medições por fala.
- Onze WAVs e todos os quadros aprovados preservados. Montagem sonora no Concat; somente seu áudio é aproveitado, com vídeo 1280×720/24 FPS copiado sem recodificação. Mesmo arquivo na campanha solo/coop.

## Produção e verificação

`scripts/refine-opening-engines.py` parte das camadas locais da revisão 05; preserva a música e substitui exclusivamente os dois intervalos de motor. Referências `approved-{film,bridge,landing}.mp4` nesta revisão vêm do commit `5176ae5`. As fontes e camadas da revisão 05 não são sobrescritas. Nenhum modelo roda no navegador.

```powershell
python scripts/refine-opening-engines.py
$env:CINEMATIC_REVISION='revision-06'
node scripts/concat-opening.mjs
node scripts/concat-opening.mjs --export
python scripts/finalize-opening-sound.py
python scripts/qa-opening-sound.py
$env:QA_REVISION='revision-06'
python scripts/qa-opening-voices.py
```

## Resultado técnico

- `npm run typecheck` e `npm run build`: passaram. Somente o aviso anterior de tamanho do chunk Phaser.
- [Mixagem](qa/sound-report.json): correlação 0,99997 com as camadas esperadas, pico verdadeiro −7 dBFS, sem clipping; volume integrado −22,8 LUFS (anterior −24,4). Esse aumento de 1,6 LU vem das duas passagens de motor. O volume da música e das vozes não foi aumentado.
- Música WAV e M4A aprovadas verificadas por igualdade/hash; efeitos PCM fora das duas janelas idênticos. [Onze falas](qa/voice-report.json) nos mesmos horários e fontes; nenhuma truncada. Streams H.264 dos três vídeos preservados por hash, [exports.json](exports.json).
- [Chrome](qa/player/report.json): 54,25 s reproduzidos até o fim, pausa/replay, cinco reinícios com DOM estável, teclado, touch e gamepad mock. Quatro resoluções: 1280×720, 1366×768, 1920×1080 e 844×390. Zero erros JS/assets e saves de controle preservados. Um quadro descartado entre 1.314 contabilizados, incluindo replay/seek; vídeo a 24 FPS.
- Sem mudança de gameplay, controles, protocolo ou lógica do prólogo; não foi repetida a campanha inteira nem um benchmark de combate nesta correção sonora.

A confirmação perceptual dos motores depende da escuta do usuário. Trilha, fundo, vozes e imagem já aprovados; missões e mapas continuam aguardando o fechamento da abertura.
