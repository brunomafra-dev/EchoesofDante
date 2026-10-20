# Abertura — desembarque e elenco de vozes · 0.1.118

[Filme completo](https://echosofdante.vercel.app/cinematic-review.html?take=film&v=0.1.118) · [Desembarque isolado](https://echosofdante.vercel.app/cinematic-review.html?take=landing&v=0.1.118) · [Ponte aprovada](https://echosofdante.vercel.app/cinematic-review.html?take=voices&v=0.1.118)

## Direção e entrega

O usuário aprovou a ponte da 0.1.117 e pediu corrigir o desembarque e variar as vozes por personagem. A imagem anterior do desembarque não foi aprovada. Esta revisão permanece na etapa 3; missões/mapas não foram iniciados.

- **Novo quadro inteiro:** nave industrial e quatro heróis com identidades atuais, vegetação organizada em massas, menos brilhos e formas concorrentes, espaço para os pés e gestos curtos. Guerreiro e Hunter primeiro; Astral e Domador atrás; civis no interior da nave.
- **Nova animação:** Wan2.2, oito passos pelo controle público do mesmo Space, em vez de quatro. Uma tomada de 81 quadros a 832×480/16 FPS, sem remontar membros. A continuação foi bloqueada pela cota gratuita: interrompidas novas solicitações. Não houve compra, troca de conta ou retries automáticos.
- **Corte final de 54,25 s:** oito cenas; desembarque de 4,75 s. A fala final foi condensada para “DANTE-01 em solo. Primeiro, o reconhecimento.”. Nenhum trecho antigo de desembarque foi misturado, repetido ou congelado para completar tempo. As outras sete cenas usam os intermediários conferidos por hashes, incluindo a ponte aprovada intacta.
- **Tratamento:** restauração offline x2 com 55% Real-ESRGAN + 45% fonte; interpolação integral 16→24 FPS, sem esticar. Saída 1280×720. A fonte continua em 480p; não é geração nativa HD.
- **Montagem e dublagem integral no Concat 0.2.8:** oito vídeos, ambiente original, onze falas e legendas. O arquivo público vem do export real do editor, com remux faststart. Um único vídeo nativo em runtime; nenhum modelo de IA roda no navegador.

## Voz fixa por personagem

| Papel que fala | Voz PT-BR | Continuidade |
| --- | --- | --- |
| Narrador | `pm_santa` | Quatro falas da partida até a descoberta |
| Ivo | `pm_alex` | Ponte e comunicação na descida |
| Nara | `pf_dora` | Ponte, orientação da equipe e pouso |

O [elenco e as falas](dialogue.json) são a referência única desta abertura. Cada personagem mantém a mesma voz, sem variações artificiais de pitch para fingir atores diferentes. As três falas já aprovadas da ponte foram reutilizadas com seus WAVs e hashes originais. O ganho é ajustado por fala para leitura clara junto do ambiente.

Os quatro heróis não têm diálogo neste roteiro; suas vozes futuras não foram inventadas nem atribuídas à voz de Nara. Vozes sintéticas do Kokoro ONNX local, sem clone de pessoa real, credenciais ou cobrança. Não há sincronização labial nova: os diálogos mantêm a atuação já existente; chamadas fora da ponte funcionam como comunicação da expedição.

O [VoiceStudio](https://github.com/debpalash/VoiceStudio) foi investigado, incluindo os guias de desempenho e Sherpa-ONNX. É uma opção para uma etapa futura de elenco; não foi instalado ou declarado como usado. Para esta entrega o motor PT-BR ONNX já validado nesta máquina foi reutilizado. O **Concat foi efetivamente usado** para edição, mixagem, legendas e exportação, não para gerar a animação.

## Fontes e reprodução

- [Imagem nova](../source/landing-heroes-v3.png), gerada com a ferramenta integrada `image_gen.imagegen`; referências inspecionadas: equipe atual, desembarque anterior e ponte aprovada. [Procedência](source.json) e [prompt](../prompts/landing-heroes-image-v3.txt).
- [Tomada nova e recibo](../source/landing-heroes-v3-01.json); [plano completo](../shots.json). Histórico da tentativa de continuação bloqueada em [generation-limit.json](generation-limit.json).
- `hf-cinematic.ps1 -Steps 8` usa a faixa pública de 1–30, conferida no config e no código oficial do Space em 20/10/2026; nenhum parâmetro oculto ou serviço pago. O padrão histórico de quatro passos foi preservado.
- `python scripts/remaster-opening-frames.py --revision revision-03 --shots landing`
- `python scripts/assemble-cinematic-opening.py --restored --reuse-unchanged --pictures-only --revision revision-03`
- `python scripts/assemble-cinematic-opening.py --audio-only`
- `.local/voice-venv/Scripts/python.exe scripts/generate-opening-voices.py`
- `node scripts/concat-opening.mjs` cria o projeto local; `node scripts/concat-opening.mjs --export` exporta; `python scripts/finalize-concat-opening.py` valida e publica os MP4s no workspace.

Modelos, programas, projetos de edição e intermediários grandes ficam em `.local`, fora do Git. Relatórios de fontes, elenco, restauração e exportação ficam nesta pasta. A comparação do laboratório mostra **duas composições diferentes**, não uma promessa de recuperação de detalhes no mesmo quadro.

## Validação e limites

**QA local passou:** `npm run typecheck`, `npm run build` (somente o aviso conhecido do chunk Phaser >500 kB) e `git diff --check`. [Mídia](qa/media/media-report.json): 1.302 quadros completos, zero duplicatas adjacentes, hashes das fontes corretos, onze legendas PT-BR e AAC estéreo sem saturação. [Vozes](qa/voice-report.json): cada uma das onze falas foi encontrada no áudio do MP4 renderizado, correlação 0,871–0,981 com os WAVs originais; todas terminam dentro da janela. O teste verifica conteúdo/tempo, não a qualidade da interpretação.

[Chrome/player](qa/player/report.json): reprodução natural integral, pausa, rever, pular, gamepad mock e transcrição touch nas quatro resoluções (1280×720, 1366×768, 1920×1080, 844×390). **Zero quadros descartados em 1.314 apresentados/consultados**, incluindo buscas; vídeo a 24 FPS. Não é uma medição de 60 FPS do combate, que não foi alterado.

[Laboratório](qa/review/report.json): três links diretos (54,25 / 4,75 / 12 s), dois trechos curtos reproduzidos até o fim, comparação carregando, oito alternâncias/replays sem crescimento do DOM ou duplicação de vídeo. Zero erros JS/assets e saves sentinela intactos. [Prólogo](qa/prologue/report.json): volume, pausa, configurações, som, conclusão única e liberação do vídeo. [Entrada compilada](qa/timeline/timeline-report.json): novo personagem “AL Cinemática” → dificuldade → filme → base; nome, dificuldade e `introSeen` preservados.

[Inspeção dos quadros](contact.jpg): figuras inteiras e leitura da cena final conferidas no começo/meio/fim; a geração ainda muda um pouco o enquadramento apesar do prompt fixo. O novo final mantém cabeças e botas visíveis. As sete cenas anteriores não foram regeneradas. Aprovação humana do novo desembarque e da dublagem integral permanece pendente. A aprovação da ponte não foi estendida automaticamente ao restante.

O modelo ainda pode alterar detalhes pequenos de mãos, roupa e direção do olhar. Inspeção de quadros não substitui assistir em movimento. A fonte 480p limita detalhe facial dos quatro heróis; restauração não recupera informação original inexistente. Não há lipsync ou interpretação dramática manual. Validar naturalidade/pronúncia do elenco, contato dos pés, legibilidade, ritmo e volume no dispositivo real.

Campanha, combate, personagem, coop, protocolo, mapas e saves preservados. Esta revisão não exige deploy novo do relay Render. Publicação Vercel precisa ser confirmada separadamente; push sozinho não comprova o deploy.
