# Abertura completa — produção

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
- Parser PowerShell e `node --check` dos autores passaram. A credencial real e a geração autenticada ainda aguardam a configuração local.
- `npm run typecheck`, `npm run build` e `git diff --check` passaram. O build mantém somente o aviso conhecido do chunk Phaser maior que 500 kB; os bundles do jogo continuam iguais. Essas verificações não validam a geração/renderização de cenas ainda ausentes.

**Estado: produção em andamento, abertura completa ainda não gerada.** O prólogo ativo permanece intacto. Versão do jogo continua 0.1.108; não publicar a preparação como se fosse uma nova cinemática concluída. Após obter as tomadas: revisão visual, exportação, laboratório, integração, QA de início/coop/pausa/mobile, versão e publicação. Missões/mapas continuam fora desta entrega.
