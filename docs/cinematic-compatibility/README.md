# Abertura em navegadores e mobile · 0.1.127

[Teste reservado](https://echosofdante.vercel.app/cinematic-compatibility.html?v=0.1.127) · [Biblioteca](https://echosofdante.vercel.app/test-library.html)

Manutenção autorizada em 21/10/2026 após falhas no celular e Brave. Não avança o plano. O laboratório abre somente o player da campanha, sem Phaser, salas ou acesso aos saves.

## Reprodução

O player anterior tratava qualquer rejeição de `play()` como erro de carregamento após uma tentativa muda. Confundia permissão de autoplay, pausa/navegação e falha de mídia, orientando apenas pular. Não foi possível inspecionar os aparelhos do relato; não atribuir todos os casos a um único código de erro.

Agora autoplay negado pede **ASSISTIR COM SOM**, com gesto real. Não silencia a dublagem automaticamente. Rede permite uma recuperação automática por formato; falha de formato/decodificação tenta outra fonte. Se ambas falham, **TENTAR NOVAMENTE** permanece disponível. Conexão lenta permite aguardar, sem descartar o download por timeout. Recuperação conserva a posição disponível; tentativas antigas são invalidadas ao pausar, mudar fonte ou destruir. Pular é opcional e a chegada só conclui uma vez.

Campanha, abertura avulsa, revisão do filme e laboratório compartilham o controlador. Preservados pausa, configurações, som, visibilidade e descarte de mídia/listeners. Sem serviço externo ou DRM.

## Mídia

Master aprovado intacto: 44.446.248 bytes, 1280×720, 24 FPS, 54,25 s. Novas cópias de entrega:

| Arquivo | Formato | Bytes | Redução |
| --- | --- | ---: | ---: |
| arrival-compatible-v1.mp4 | H.264 Constrained Baseline 3.1, yuv420p, AAC-LC, faststart e keyframes regulares | 17.275.271 | 61% |
| arrival-compatible-v1.webm | VP9, yuv420p, Opus | 12.573.002 | 72% |

Mesmas cenas, legendas presentes na imagem e mixagem. Transcodificação com perdas para distribuição mantendo 720p; sem nova geração. O navegador carrega a fonte escolhida; nomes próprios evitam o cache do master. [Hashes/dimensões](media.json); preparo em `scripts/prepare-compatible-cinematic.py`. Node passa a servir MIME correto, HEAD, Range 206/416 e cancelamento de streams. Vercel serve esses arquivos diretamente.

## Tela horizontal

Touch em retrato oferece **ENTRAR EM TELA CHEIA**: o gesto solicita fullscreen no documento inteiro, incluindo menu/filme/jogo, e `screen.orientation.lock('landscape')`. Em paisagem, uma ação normal solicita o modo sem outro passo. Sem rotação CSS, que desalinharia touch/canvas.

Navegadores podem recusar fullscreen ou orientação, especialmente iPhone e navegadores incorporados. A interface orienta virar e permite **CONTINUAR NO NAVEGADOR**, inclusive assistir em pé. Uma página não consegue garantir rotação física automática em todo aparelho. [MDN: autoplay](https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/play), [orientação](https://developer.mozilla.org/en-US/docs/Web/API/ScreenOrientation/lock).

## Validação

Typecheck/build; `qa-cinematic-http.mjs`, `qa-cinematic-compatibility.mjs`, regressão de Novo jogo e convite cooperativo. Parâmetros: `QA_BASE`, `QA_OUT`, `QA_BRAVE` (executável), `QA_WEBKIT=1`, `QA_FIREFOX=1`.

Chrome/Brave reais no Windows e Firefox/WebKit do Playwright: vídeo decodificado, som não silenciado, dimensões/duração, pausa/configurações, retomada, fim natural, replay e pular. WebKit não equivale a iPhone físico. Falha de MP4, das duas fontes, autoplay e interrupção no meio são simulados. Erros de rede intencionais são esperados; erros JavaScript não. Touch emulado verifica orientação permitida/recusada e controles em 1280×720, 1366×768, 1920×1080, 844×390 e retrato 390×844. [Relatório/capturas](qa/report.json), [HTTP](qa/http.json).

Validar nos aparelhos do usuário/amigo, com rede móvel e economia de dados. Não prometer disponibilidade offline, com mídia bloqueada pelo usuário ou sem decodificador. Gameplay, filme/mixagem aprovados e protocolo 14 preservados; aviso preexistente de tamanho do chunk Phaser permanece. QA técnico não substitui aprovação humana.
