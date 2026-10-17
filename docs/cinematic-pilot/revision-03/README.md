# Teste de movimento gratuito — 0.1.107

[Abrir a prévia](https://echosofdante.vercel.app/cinematic-motion-test.html?v=0.1.107) · [MP4](https://echosofdante.vercel.app/assets/cinematic-pilot/bridge-hf-motion-test.mp4) · [Quadros amostrados](contact-sheet.jpg)

**Teste curto aprovado visualmente pelo usuário em 17/10/2026: “iradoooooooooo aprovado”. Ainda não é o piloto final de 12 segundos.** A aprovação valida a direção de movimento com corpos inteiros desta amostra; a etapa 3 continua aberta. Nenhuma missão, mapa ou abertura completa foi antecipada.

## Alternativa verificada na prática

Runway Free foi reportado pelo usuário sem modelo de vídeo liberado. A fal.ai exigiu recarga mínima de US$ 10 no checkout do usuário; os dois cupons pesquisados foram inválidos. A tentativa pelo Sandbox da fal.ai mostrou cota grátis e estimativa zero, mas falhou com conta bloqueada por saldo esgotado. Nenhuma dessas rotas produziu o filme; não foram usados créditos pagos.

Em 17/10/2026 foi testado o Space público [Wan2.2 14B Fast](https://huggingface.co/spaces/zerogpu-aoti/wan2-2-fp8da-aoti-faster), no Hugging Face **ZeroGPU**, com a imagem inteira da revisão 02. Painel público acessível e runtime informado como RUNNING; envio pelo formulário normal em navegador Chrome isolado, **anônimo, sem chave, sem cartão, sem conta com cobrança**. Uma única geração, concluída e baixada. A [documentação do ZeroGPU](https://huggingface.co/docs/hub/spaces-zerogpu) descreve cotas gratuitas e fila compartilhada; acesso e espera variam. Não prometer geração ilimitada nem repetir requisições para contornar cota.

## Arte, parâmetros e resultado

- Entrada: `bridge-whole-characters.webp`, 1672×941, 465.088 bytes. Cena inteira original com Ivo e Nara; nenhum atlas ou recorte de membros.
- Prompt exato: [wan-test-prompt.txt](../revision-02/wan-test-prompt.txt), já preparado para o teste curto. Negative prompt padrão do Space; guidance high/low 1; 4 passos; seed 106; randomização desligada; duração solicitada 5 s.
- Saída original, sem reencode/interpolação/loop: **832×480, 81 quadros, 16 FPS, 5,0625 s**, MP4 de **1.041.995 bytes**. Sem áudio, legendas ou dublagem. [Metadados e SHA-256](media.json).
- Geração offline durante o desenvolvimento; runtime do jogo não gera arte. O laboratório apenas reproduz um MP4 com controles nativos, playsinline, sem autoplay ou loop, e permite baixar/comparar o quadro inicial.
- [Recibo da tentativa](generation.json): horários e estado final. Não inclui credenciais/cookies. Custos de fal.ai/Runway: nenhum pedido pago realizado por esta execução.

## Revisão crítica inicial

Seis quadros ao longo dos cinco segundos mostram mudanças de pose: Ivo deixa o console e olha para Nara; ela muda o olhar e gesticula. Os corpos foram gerados continuamente a partir da cena inteira. Não há montagem local de membros ou movimento de câmera aplicado por código.

O modelo **não seguiu integralmente** os pés plantados/movimentos contidos do prompt: há deslocamento dos personagens e alteração do enquadramento. Essas limitações foram registradas antes do playtest; o usuário aprovou a direção do teste curto. Resolução e cadência continuam inferiores ao alvo final de 1280×720/24 FPS; não converter FPS por repetição de quadros e declarar essa meta cumprida.

## QA técnico

- Decodificação local do MP4 e seis amostras: dimensões, FPS, duração e tamanho medidos no arquivo, não estimados pelo formulário.
- `npm run typecheck`, `npm run build`, `git diff --check`.
- `node scripts/qa-cinematic-motion.mjs`: carregamento/decodificação, controles nativos por teclado, pausa, fim/replay, quatro resoluções, toque no painel, ausência de erros JS/assets, sentinelas de save e link da biblioteca.
- `node scripts/qa-cinematic-reference.mjs`: referência estática anterior preservada em rota separada.
- Não foi alterado código de campanha, personagem, coop, combate, câmera, input ou saves. Não foi necessário repetir o percurso até bosses para uma página isolada de mídia.

Os resultados de execução ficam nos relatórios de QA. Passar nesses testes **não valida anatomia, atuação ou autenticidade**. A aprovação posterior veio do playtest explícito do usuário. O roteiro de 12 s, legendas e ambiente sonoro permanecem para a sequência da etapa.

**Resultado local:** typecheck/build passaram; aviso conhecido do chunk Phaser maior que 500 kB. [Chrome da prévia](qa/report.json) passou com zero erros nas quatro resoluções, teclado e toque no painel. Referência estática também passou, com evidência temporária em `%TEMP%\dante-hf-motion-reference-qa`. FFmpeg decodificou os 81 quadros: H.264 High, yuv420p, nenhuma faixa de áudio. O QA publicado também passou; evidência em `%TEMP%\dante-010107-public-motion-qa`. Os campos `visualApproval: pending` nos relatórios de geração/QA são históricos, anteriores à avaliação do usuário.

## Aprovação humana e sequência

Em 17/10/2026 o usuário assistiu à prévia publicada e aprovou o teste: **“iradoooooooooo aprovado”**. Arquivo aprovado: SHA-256 `81b8f0d17466c19a16c506804fd3b94634ac08cf6fa0d7be5e2fc7a60802cd79`, sem alteração do MP4 após o playtest.

Próxima entrega da etapa 3: piloto completo de aproximadamente 12 segundos, mantendo os personagens inteiros, continuidade entre takes, legendas em português e áudio ambiente original. Essa entrega terá avaliação própria antes da abertura de 55 segundos. A aprovação desta amostra não encerra a etapa 3 nem aprova antecipadamente cenas ainda não produzidas. Créditos pagos não foram autorizados por este playtest; manter a rota gratuita e respeitar suas cotas.
