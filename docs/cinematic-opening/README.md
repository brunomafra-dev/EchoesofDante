# Abertura completa — produção

**Revisão atual: [0.1.120 — trilha espacial e efeitos com prioridade à dublagem](revision-05/README.md).** [Ouvir no filme](https://echosofdante.vercel.app/cinematic-review.html?take=film&v=0.1.120). Visual e vozes da 0.1.119 aprovados; nova mixagem aguarda escuta do usuário. Registros abaixo são históricos.

**Entrega atual: [0.1.116 — filme completo, 59,25 s](completion/README.md).** Em 18/10/2026 a cota gratuita voltou a funcionar. Equipe com identidades atuais, descida e desembarque gerados, montados e integrados ao início solo/cooperativo. [Assistir ao corte completo](https://echosofdante.vercel.app/cinematic-opening.html?v=0.1.116). Piloto aprovado e corte anterior preservados; **avaliação visual do filme completo pendente**. Os estados de bloqueio e preparação abaixo são históricos.

## Adição solicitada — apresentação da equipe

Em 17/10/2026 o usuário pediu uma cena dos heróis designados para desbravar Dante. [Roteiro da equipe pioneira](pioneer-team.md): Guerreiro, Hunter, Astral e Domador, quatro pessoas inteiras no hangar depois da ponte e antes da descida. Acrescenta aproximadamente 4,5 s; total previsto passa a ~59 s. Não há criatura nativa a bordo antes do primeiro reconhecimento. **Quadro-base estático gerado e salvo na 0.1.110; animação ainda pendente e fora da prévia.** Restam agora a animação da equipe e as duas cenas finais. O corte publicado e seu manifesto de 36 s permanecem intactos; roteiro executável, som e legendas serão atualizados juntos ao produzir a cena.

## Prévia parcial · 0.1.109

[Assistir aos primeiros 36 segundos](https://echosofdante.vercel.app/cinematic-opening.html?v=0.1.109) · [MP4](https://echosofdante.vercel.app/assets/cinematic-opening/opening-workprint.mp4) · [Quadros do corte](workprint-contact.jpg) · [Biblioteca](https://echosofdante.vercel.app/test-library.html)

**Filme completo ainda pendente.** Foram geradas oito tomadas autenticadas gratuitas para Terra, evacuação, viagem e descoberta. Junto com os 12 segundos aprovados da ponte, compõem uma prévia de **36 segundos**. Não substitui o prólogo ativo nem encerra a etapa 3. Faltam **descida e desembarque: 18,75 segundos**. A aprovação humana do piloto não aprova automaticamente estas quatro cenas novas.

Em 17/10/2026 o token local foi validado com GET 200, sem cobrança. As oito gerações terminaram com vídeo baixado. A tentativa seguinte, de descida, falhou com erro opaco no stream simplificado do Gradio; o transporte foi corrigido para conservar `output.error` do mesmo evento. Uma tentativa de desembarque confirmou: **“You have exceeded your ZeroGPU runs limit.”** Nenhum vídeo dessas duas cenas foi produzido. [Registro de bloqueio](source/authenticated-limit.json). Interrompidas novas gerações após a confirmação; sem compra, retries automáticos ou rotação de contas. Retomar com a mesma conta após renovação da cota, sem prometer um horário de liberação.

### Corte, mídia e continuidade

- **Arquivo:** `opening-workprint.mp4`, 11.851.719 bytes (~11,3 MiB), H.264/YUV420p, **864 quadros, 1280×720/24 FPS**, AAC estéreo 48 kHz. [Manifesto, hashes e intervalos de origem](workprint-media.json).
- **Geração:** Wan2.2 no mesmo Space gratuito, fonte 832×480/16 FPS. Duas tomadas por cena nova: 5 s e 1,25 s solicitados. A continuação recebe o quadro inteiro 79; o primeiro quadro repetido de referência não entra na montagem. Usados 100 quadros reais por cena para fornecer margem à interpolação, cortando a 6 s. A ponte usa as três fontes aprovadas, não o MP4 já interpolado.
- **Tratamento offline:** interpolação de movimento 16→24 FPS; ampliação proporcional para 1248×720 com margens laterais de 16 px. Não estica a arte. Não é geração nativa em 720p. Sem loops, imagem congelada, zoom aplicado às pinturas ou montagem independente de membros.
- **Som:** recorte inicial de 36 s do mix original de 54,75 s, com saída suave de 1,4 s. Legendas PT-BR incorporadas no alto para evitar os controles nativos; [VTT](../../public/assets/cinematic-opening/workprint.pt-BR.vtt) e transcrição no laboratório. Sem dublagem.
- **Runtime:** um elemento HTML Video nativo; nenhum Phaser, relay, objeto de combate, textura de jogo ou timer de cenário instanciado pelo laboratório. Teclado, touch e gamepad usam o player já existente. O vídeo só carrega metadados antes de reproduzir; não inicia sozinho.
- **Assets reutilizados:** quatro ilustrações originais de `public/assets/prologue`, três fontes da ponte aprovada e CSS/player do piloto. Nenhuma arte nova nesta revisão; a imagem original de descida já preparada continua aguardando animação.
- **Reprodução da montagem:** `python scripts/assemble-cinematic-opening.py --workprint`. O modo padrão continua exigindo as sete cenas e recusa um filme completo com fontes faltantes. `scripts/import-opening-take.py` verifica recibo/hash, metadados e prepara quadros de inspeção antes de importar uma tomada.

### Validação desta revisão

- **Automatizado:** `npm run typecheck`, `npm run build` e QA de transporte passaram. Build conserva o aviso conhecido do chunk Phaser >500 kB, sem dependências novas.
- `QA_FILM=workprint python scripts/qa-bridge-media.py`: [864 quadros decodificados](qa/media-report.json), zero duplicatas adjacentes, hashes corretos, sete legendas UTF-8 e áudio sem clipping (pico 0,1614; RMS 0,0297). Isso não aprova anatomia ou atuação.
- [QA Chrome/player](qa/player/report.json): passou em 1280×720, 1366×768, 1920×1080 e 844×390, quadro completo sem rolagem horizontal. Reprodução natural dos 36 s, pausa/rever/pular, transcrição touch, gamepad emulado, cinco replays com DOM estável e um único vídeo. Zero erros JS/assets e **zero quadros descartados em 876 apresentados/consultados**, incluindo buscas. São 24 FPS do vídeo; não uma medição de FPS do combate. Save sentinela preservado.
- [Regressão do piloto de 12 s](qa/pilot-regression.json) passou com os mesmos controles/resoluções; hashes dos dois MP4s aprovados permanecem intactos. [Guarda da montagem](qa/delivery.json): o modo completo recusa fontes ausentes e não cria um filme falso.
- **Publicação conferida em 17/10/2026:** Vercel publicou `285e1519830d5dea601f6ceed1b6e9685a9efcd0` (`feat: publish cinematic opening workprint`). [Página/player públicos](qa/public-player.json) passaram nas quatro resoluções, teclado, touch e gamepad emulado, sem erros JS/assets; zero quadros descartados em 875 apresentados/consultados. [MP4 público](qa/public-media.json): HTTP 200, `video/mp4`, 11.851.719 bytes e SHA-256 igual ao local. Relatórios técnicos não aprovam o filme visualmente.
- **Inspeção visual pelo agente:** quadros dos oito takes e da montagem conferidos. Há movimento de pessoas/naves, propulsão e névoa; não são apenas mudanças locais de enquadramento. O modelo também move a câmera em algumas cenas apesar do prompt fixo. Diferenças de detalhe e continuidade entre tomadas persistem e devem ser julgadas no vídeo.
- **Playtest humano necessário:** ritmo, autenticidade visual, rostos/mãos, continuidade, áudio e passagem para a ponte. Não declarar uma nova aprovação visual por causa do QA.
- **Escopo:** campanha, combate, classes, menus, coop, protocolo e saves não foram modificados. O fluxo completo de campanha não foi reexecutado nesta revisão isolada. Nenhuma missão ou mapa novo antecipado.

## Histórico da preparação · 0.1.108

## Autorização e direção

Em 17/10/2026 o usuário aprovou o piloto 0.1.108: **“irmão muito bom! vamos produzir a abertura completa”**. A aprovação libera a abertura prevista na etapa 3; missões e mapas permanecem para as etapas seguintes.

Preservar Organic Sci-Fi R3 / referência D e personagens inteiros. Não remontar membros, substituir atuação por zoom em pinturas, repetir trechos ou congelar quadros para preencher duração. O piloto aprovado permanece intacto e fornece a conversa de Ivo/Nara. Texto em português, áudio original sem dublagem. Fonte gratuita em 480p/16 FPS; exportação 720p/24 FPS por ampliação/interpolação explicitadas.

## Roteiro de montagem (~55 segundos)

| Tempo previsto | Cena | Informação |
| --- | --- | --- |
| 0–6 s | Terra inabitável | O lar deixou de sustentar a humanidade; causa permanece indefinida |
| 6–12 s | Evacuação | Sobreviventes partem nas naves |
| 12–18 s | Viagem | Anos procurando um lugar para recomeçar |
| 18–24 s | Dante visto da órbita | Um candidato a novo lar, sem garantir segurança |
| 24–36 s | Ponte: Ivo e Nara | Conversa de reconhecimento do piloto aprovado |
| 36–45 s | Descida | Equipe pioneira se aproxima da Floresta |
| 45–54,75 s | Pouso / desembarque | DANTE-01 inicia reconhecimento; humanidade ainda depende dos resultados |

Não revelar Sinal, Primeiro Eco, origem de Dante ou tecnologia ancestral. Não mostrar colonização consolidada antes das descobertas jogáveis.

## Produção e limites

As cinco ilustrações originais de `public/assets/prologue` foram inspecionadas como fontes inteiras. A rejeição anterior foi da montagem estática com zoom; reutilizar o desenho como entrada de vídeo não reutiliza aquela técnica. Novas imagens só serão criadas para lacunas concretas (por exemplo, descida atmosférica).

Geração gratuita pelo formulário público Wan2.2/Hugging Face ZeroGPU, um pedido por tomada, sem pagamentos ou retries automáticos. Respeitar cota e fila; se houver bloqueio, registrar a resposta e continuar o trabalho independente. Nenhum gasto novo autorizado. Não apresentar uma montagem incompleta como abertura final.

## Trabalho preparado em 17/10/2026

- [Roteiro técnico](shots.json): sete cenas, 54,75 s, onze legendas curtas. Piloto original de 12 s preservado; a montagem usa suas três fontes originais, sem reanimar os personagens por partes.
- [Storyboard de fontes inteiras](storyboard.jpg), explicitamente estático, **não é uma prévia do filme**.
- [Imagem original de descida](source/descent.png), 1672×941, gerada offline com `image_gen.imagegen`. Referências: nave de `landing.webp` e paleta de `dante.webp`, inspecionadas antes da geração. [Prompt completo](prompts/descent-image.txt) e [procedência/hash](source/descent.json). Os cinco desenhos anteriores são reutilizados como entrada de vídeo; o antigo MP4 de pinturas com zoom não será usado.
- Mix original de **54,75 s**: ambiente da Terra, partida, nave, descida e Floresta; frase musical esparsa composta por síntese NumPy, sem amostras externas ou loop. [Relatório](audio.json); arquivo preparado em `public/assets/cinematic-opening/expedition-mix.m4a`. É áudio de produção, não comprova que o vídeo esteja pronto.
- `scripts/prepare-opening-take.py`: lista fontes faltantes, prepara prompts e extrai o quadro **inteiro** 79 para continuidade. Não acessa serviços. `scripts/assemble-cinematic-opening.py`: exige todas as tomadas, processa quadros completos, interpola 16→24 FPS, amplia sem esticar, incorpora legendas e mixa o áudio. **Recusa produzir um filme se faltarem vídeos**. `--audio-only` prepara somente o mix/legendas.

## Bloqueio observado e acesso gratuito

A tentativa anônima da Terra encerrou sem resultado após 240 s; não há vídeo recuperado, portanto não conta como cena pronta. Outra tomada, de evacuação, respondeu explicitamente que a cota anônima de chamadas ZeroGPU foi excedida e pediu autenticação. Não foram feitas novas tentativas anônimas, pagamentos ou rotações de conta. [Registro resumido](source/anonymous-attempts.json).

O usuário respondeu **“Vou criar uma conta gratuita”**. A [documentação oficial ZeroGPU](https://huggingface.co/docs/hub/spaces-zerogpu#usage-tiers) informa 2 min/dia anônimos e 5 min/dia para conta Free, sujeitos à fila; isso não garante toda a produção numa única cota. Se esgotar, interromper e preservar as tomadas concluídas.

Configuração: `powershell -NoProfile -STA -ExecutionPolicy Bypass -File .\scripts\hf-cinematic.ps1 -Configure`. Abre um campo protegido, com colagem por Ctrl+V. Criar um token **Read** em [Access Tokens](https://huggingface.co/settings/tokens); não enviar pelo chat. Salvar cifrado por DPAPI em `%LOCALAPPDATA%/EchoesOfDante/authoring/hf-token.dpapi`, fora do repositório. `-Check` faz apenas GET de autenticação; não gera nem compra nada.

Com a conta configurada, `-Generate -InputImage ARQUIVO -PromptFile PROMPT -Seconds N -Seed N -OutputDirectory .local/PASTA` usa a API REST documentada do **mesmo Space gratuito**, não Inference Providers pagos. O token fica só em memória, restrito ao host exato e com redirecionamentos HTTP proibidos; não entra em vídeo, recibos, jogo, logs ou Git. Uma geração POST por chamada, sem retries. Recibo exclusivo por pasta impede reenviar silenciosamente. Erro/timeout exige inspecionar o evento antes de qualquer nova submissão.

## Verificações da preparação

- `node scripts/qa-hf-cinematic-api.mjs`: cinco cenários **sintéticos locais**, sem GPU: sucesso, cota recusada, redirecionamento, API alterada e resultado em host estranho. Verifica POST único e ausência de vazamento do token simulado. [Resultado](qa/hf-transport.json). Isso não comprova geração autenticada real.
- [Preparação de áudio/legendas](qa/preparation.json): 54,75 s (+padding AAC), áudio sem clipping, onze legendas UTF-8 e guarda que impede fabricar vídeo sem fontes. Nenhuma chamada ao provedor por esses testes.
- Parser PowerShell e `node --check` dos autores passaram. Na preparação 0.1.108, a credencial real e a geração autenticada ainda aguardavam a configuração local; ambas foram confirmadas na revisão 0.1.109 acima.
- `npm run typecheck`, `npm run build` e `git diff --check` passaram. O build mantém somente o aviso conhecido do chunk Phaser maior que 500 kB; os bundles do jogo continuam iguais. Essas verificações não validam a geração/renderização de cenas ainda ausentes.

**Estado atual: produção em andamento, abertura completa ainda não gerada.** O prólogo ativo permanece intacto. A 0.1.109 publica exclusivamente a prévia parcial, identificada como tal. Após obter as tomadas finais: revisão visual, exportação completa, laboratório, integração, QA de início/coop/pausa/mobile, versão e publicação. Missões/mapas continuam fora desta entrega.
