# Abertura completa — 0.1.116

[Assistir sem alterar saves](https://echosofdante.vercel.app/cinematic-opening.html?v=0.1.116) · [Filme MP4](https://echosofdante.vercel.app/assets/cinematic-opening/arrival-whole-scene.mp4) · [Quadros do corte](film-contact.jpg).

## Entrega

**59,25 segundos**, oito cenas: Terra → evacuação → viagem → Dante → ponte → equipe pioneira → descida → desembarque. A abertura acompanha novas expedições solo/cooperativas e pode ser revista pelas configurações. Quem já viu a chegada mantém o progresso; o laboratório reproduz o mesmo MP4 sem carregar a campanha.

O piloto aprovado e suas três tomadas originais foram preservados. As quatro cenas do corte anterior também são reutilizadas. Em 18/10/2026 a mesma conta gratuita HF voltou a gerar: equipe atualizada, duas tomadas de descida e duas de desembarque. Sem pagamento, rotação de conta ou retries automáticos. Uma tomada da equipe antiga já havia sido enviada quando o usuário corrigiu a referência; está registrada como [substituída](../source/pioneers-superseded.json) e não entra no filme.

O usuário aprovou o novo quadro da equipe e autorizou animá-lo. A aprovação do quadro e do piloto não equivale à aprovação visual dos 59 segundos finais.

## Continuidade e produção

- [Quadro novo](../source/pioneer-team-v2.png), [prompt/referências](../prompts/pioneer-team-image-v2.txt), [dimensões/hash](../source/pioneer-team-v2.json). Original produzido offline com `image_gen.imagegen`; Hunter atual de pele escura, cabelo prateado, uniforme azul e arnês âmbar. Demais classes usam suas referências completas atuais. Sem criatura nativa a bordo antes de chegar ao planeta.
- Vídeo: Wan2.2 no Space gratuito já utilizado, com a mesma credencial local cifrada. Recibos, prompts e fontes nas pastas `source/` e `prompts/`. Credencial não é incluída no jogo/Git.
- Continuações recebem o quadro inteiro 79 da tomada anterior. O quadro de entrada repetido não é incluído novamente na montagem. Não há loop, quadro congelado de preenchimento ou movimento separado de braços/pernas.
- Fonte real **832×480/16 FPS**; FFmpeg interpola movimento a 24 FPS, amplia proporcionalmente para 1248×720 e completa margens laterais de 16 px. Saída **1280×720, 1.422 quadros**, H.264/YUV420p + AAC estéreo 48 kHz. Não é geração nativa em 720p/24 FPS.
- Arquivo final **25.027.247 bytes (~23,9 MiB)**; [SHA-256, trechos e áudio](../media.json). Mix original por síntese offline, sem samples externos ou dublagem; áudio e 12 legendas PT-BR deslocados para acomodar os 4,5 s da equipe.
- `python scripts/assemble-cinematic-opening.py` exige todas as fontes e recusa preenchê-las com imagens. `prepare-opening-take.py` suporta cenas curtas com uma tomada; `import-opening-take.py --from-directory` preserva recibos de tentativas anteriores.
- Corte de 36 s preservado com o mesmo hash em [cinematic-workprint.html](https://echosofdante.vercel.app/cinematic-workprint.html?v=0.1.109). Os relatos anteriores nesta pasta são históricos.

## Reprodução e áudio

`Prologue.ts` usa um único vídeo com o mix do próprio filme, substituindo a versão de pinturas com zoom. Sem música da caverna sobreposta. Volume segue mestre × música; o mix cinematográfico é estéreo único, portanto o controle de efeitos separado continua restrito ao gameplay. Pausar, continuar, configurações, visibilidade da aba, pular, encerramento e rever preservam o fluxo existente. Em navegador que bloqueia reprodução com som após navegação, o vídeo inicia mudo com **Ativar som** disponível. Destruir a abertura libera a mídia e remove seus listeners. Não muda câmera, combate, save ou protocolo de salas.

## Auditoria dos Hunters solicitada durante a produção

O link enviado abria a Guerreira feminina em roupa inicial. Também foram verificadas as duas apresentações do Hunter diretamente no painel. Existia uma diferença real entre **referência ilustrada básica** e **rosto da folha inicial usado no render sem capacete**. Agora o rosto sem capacete é sempre o da referência básica da mesma apresentação, independentemente de roupa/torso, nas oito direções. Capacetes continuam usando sua pintura de proteção; não se remove o equipamento para disfarçar o rosto.

[Hunter feminina](https://echosofdante.vercel.app/character-cohesion.html?class=hunter&sex=female&kit=basic&helmet=none&v=0.1.116) · [Hunter masculino](https://echosofdante.vercel.app/character-cohesion.html?class=hunter&sex=male&kit=basic&helmet=none&v=0.1.116).

Nas pranchas [feminina](hunter-female-current.png) e [masculina](hunter-male-current.png), colunas = inicial/básica/reforçada; linha superior = capacete do conjunto, inferior = sem capacete. São quadros do compositor real, não conceitos novos. A cinemática usa perspectiva e proporções de ilustração narrativa; ela não é um recorte ampliado dos sprites. Rosto, cabelo, pele e vestimenta compartilham a identidade; igualdade fotográfica de cada traço entre ilustrações geradas não é prometida.

## Verificações

- [Mídia](qa/media-report.json): 1.422 quadros decodificados, nenhuma duplicata adjacente, 12 legendas UTF-8, áudio sem clipping, hashes de todas as fontes e resultado conferidos.
- [Player](qa/player/report.json): reprodução integral, pausa/rever/pular, touch e gamepad emulados, quatro resoluções, DOM estável e saves sentinela preservados. 3 quadros descartados em 1.434 apresentados/consultados, incluindo buscas e replay (~0,21%).
- [Identidade](identity-qa/report.json): 48 combinações de rosto/traje/vista nas duas apresentações. A diferença média RGB máxima do núcleo denso ficou abaixo de um nível de 8 bits; a folha inicial anterior difere cerca de 25–28 níveis do rosto de referência frontal. O teste usa essa referência anterior como controle negativo e tolera o arredondamento de alfa do Canvas, sem afirmar igualdade dos contornos semitransparentes.
- [Personagens](actors.json): 3.072 combinações das quatro classes/apresentações/equipamentos/ações, correspondência local/remoto e estabilidade de recursos. Amostra Chrome: 53,24 FPS, 386 objetos, 207 texturas, 24 tweens e um atlas equipado. Sem crescimento nas trocas; a amostra permanece abaixo da meta de 55–60 FPS e não representa benchmark cooperativo.
- [Prólogo](qa/prologue/report.json): fonte de 59,25 s, volume do mix, pausa/continuar/configurações, som, término natural/pular com conclusão única e liberação da mídia. `node scripts/qa-cinematic-prologue.mjs` usa o servidor DEV; não é teste de exportações internas no build público.
- Typecheck e build passaram, com o aviso conhecido do chunk Phaser >500 kB. [Campanha compilada](qa/campaign/report.json): quatro classes por convites reais no relay local, início da equipe, saída do anfitrião, menu gamepad/touch e entrada oficial. Não equivale a quatro amigos testando o relay público. QA técnico não é aprovação estética.
- [Novo jogo até o encerramento da abertura](qa/timeline/timeline-report.json): cria um único personagem, confere fonte/duração de 59,25 s, chega ao fim do MP4 e entra na base com dificuldade/nome preservados e `introSeen` salvo. `scripts/qa-prologue-timeline.mjs` foi atualizado para conferir o filme novo em vez do placeholder de 20 s.

## Limites e próxima validação

O modelo move a câmera em algumas tomadas apesar do pedido de câmera fixa. Há pequenas variações de material e rostos; os exploradores no desembarque são pequenos na fonte de 480p. Interpolação não cria detalhe nativo novo. Rever a continuidade, mãos, atuação, ritmo, legibilidade das legendas e volume assistindo ao filme inteiro. Nenhuma cena é apresentada como isenta de artefatos apenas porque decodificou corretamente.

Próxima etapa do plano: missões/diálogos desde a chegada, **somente após a validação humana desta abertura**. Não foi iniciada nesta entrega.
