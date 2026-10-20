# Nara no desembarque — revisão final de imagem · 0.1.119

[Nara e os pioneiros · 4,75 s](https://echosofdante.vercel.app/cinematic-review.html?take=landing&v=0.1.119) · [Filme completo · 54,25 s](https://echosofdante.vercel.app/cinematic-review.html?take=film&v=0.1.119)

## Pedido e continuidade

O usuário aprovou a abertura e as vozes da 0.1.118, pedindo **Nara visível durante o desembarque** e mais uma revisão dos frames. Correção restrita à etapa 3; nenhuma missão, mapa ou regra de jogo foi adicionada.

Nara agora aparece **na rampa, atrás dos quatro pioneiros**, orientando a equipe durante “DANTE-01 em solo. Primeiro, o reconhecimento.”. Mantém rosto, cabelo preso, jaqueta bege, calça oliva e lenço laranja da ponte. O Guerreiro, Hunter, Astral e Domador continuam na frente. São cinco pessoas inteiras, na mesma cena animada.

A fala, a voz de Nara, os outros dez WAVs, as legendas e os tempos foram preservados. O filme mantém **54,25 s**, oito cenas e três vozes fixas. A presença/atuação de Nara foi animada, sem um processo separado de sincronização fonética dos lábios.

## Arte e tratamento

- [Quadro novo](../source/landing-nara-v4.png), **1672×941**, editado com `image_gen.imagegen` a partir do desembarque aprovado e da Nara inteira da ponte. [Prompt exato](../prompts/landing-nara-image-v4.txt) e [procedência/hash](source.json).
- [Nova tomada/recibo](../source/landing-nara-v4-01.json): mesmo Space Wan2.2/Hugging Face, conta atual, controles públicos, seis passos e cinco segundos solicitados. **81 quadros, 832×480/16 FPS**. Uma geração, sem retry, troca de conta ou cobrança. Não foi alegada renovação da cota anterior: este novo pedido coube na cota disponível.
- Uso de 4,75 s com margem de quadros para interpolação. Somente o desembarque foi regenerado. As sete outras cenas usam os mesmos intermediários aprovados, conferidos por SHA-256.
- Restauração offline de quadros inteiros: x2, mistura de 55% Real-ESRGAN + 45% fonte, seguida de interpolação para 24 FPS. **Não é geração nativa HD**. Materialidade e detalhe original são preservados sem remontar membros.
- **Concat 0.2.8:** montagem, legendas e mixagem mantidas; exportação H.264 **CRF 16**, antes 18, para reduzir perdas de compressão. Remux faststart; trecho isolado também CRF 16. A redução de compressão não cria detalhe ausente na fonte.

## Revisão e testes

**QA local passou:** `npm run typecheck`, `npm run build` e `git diff --check`. Build mantém apenas o aviso conhecido do chunk Phaser >500 kB. [Mídia](qa/media/media-report.json): 1.302 quadros decodificados, zero duplicatas adjacentes, onze legendas e AAC estéreo sem saturação. [Vozes](qa/voice-report.json): as onze falas estão presentes no áudio renderizado, completas nas janelas originais; WAVs aprovados preservados.

[Revisão dos frames](qa/picture/report.json): início/meio/fim das **oito cenas**, mais seis vistas do desembarque. [Primeiras quatro cenas](qa/picture/film-1.jpg), [últimas quatro](qa/picture/film-2.jpg) e [Nara em movimento](qa/picture/nara-motion.jpg), inspecionadas pelo agente. Nara identificável pelo rosto/roupa/lenço; cinco corpos completos dentro do enquadramento. Nas **sete cenas inalteradas**, o PSNR médio versus os mesmos intermediários passou de **38,16 para 38,75 dB** (+0,60 dB), indicando menor erro de compressão nas amostras. PSNR não aprova qualidade artística, anatomia ou naturalidade. Não é feita uma comparação de fidelidade entre as duas artes diferentes do desembarque.

[Chrome/player](qa/player/report.json): abertura inteira reproduzida naturalmente, **zero quadros descartados em 1.314 apresentados/consultados**, incluindo buscas; saída de vídeo a 24 FPS. Quatro resoluções (1280×720, 1366×768, 1920×1080, 844×390), touch emulado, gamepad mock, pausa/rever/pular. [Laboratório](qa/review/report.json): três links, trechos curtos até o fim, oito trocas/replays sem crescimento do DOM ou duplicação de vídeo; saves sentinela preservados e zero erros JS/assets. [Prólogo](qa/prologue/report.json): volume, configurações, som, conclusão única e limpeza. [Entrada na campanha](qa/timeline/timeline-report.json): personagem → dificuldade → filme → base, com nome, dificuldade e `introSeen` preservados. Não foi reexecutada a campanha inteira de combate, que não foi alterada.

Filme: **44.451.526 bytes**, trecho: **6.097.856 bytes**. O aumento acompanha a redução de compressão; o player carrega metadados antes da reprodução e usa streaming/Range. Um único vídeo HTML, sem modelo de geração/restauração em runtime. Aprovação visual da mudança permanece com o usuário: conferir presença de Nara, rosto/mãos/pés, naturalidade e continuidade com a ponte.

## Reprodução offline

1. `python scripts/remaster-opening-frames.py --revision revision-04 --shots landing`
2. `python scripts/assemble-cinematic-opening.py --restored --reuse-unchanged --pictures-only --revision revision-04`
3. PowerShell: `$env:CINEMATIC_REVISION='revision-04'`; `node scripts/concat-opening.mjs`; `node scripts/concat-opening.mjs --export`.
4. `python scripts/finalize-concat-opening.py --revision revision-04`
5. `python scripts/qa-cinematic-picture-review.py` — usa o MP4 anterior em `.local/cinematic-opening/revision-04/previous-film.mp4` como comparação; não faz rede.

[Elenco/tempos](dialogue.json), [WAVs reutilizados e hashes](voice-report.json), [restauração](restoration.json), [intermediários](picture-manifest.json) e [exports](exports.json). Os WAVs continuam nos caminhos da revisão 03; não foram duplicados ou regenerados. Ferramentas, modelos e projeto Concat ficam em `.local`, fora do Git.

## Limites

Fonte 480p com detalhe facial limitado, sobretudo no plano com cinco pessoas. O modelo pode alterar gestos e detalhes de roupa, com pequeno movimento de enquadramento apesar do prompt fixo. Não há promessa de lipsync exato. O resultado novo ainda requer avaliação humana; o restante aprovado foi preservado.

Combate, controles, coop, saves e narrativa jogável não foram alterados. Não precisa atualizar o relay Render. Confirmar a publicação Vercel por página, hash do MP4 e teste público antes de declarar a versão online.
