# Etapa 3 — cena piloto da ponte · 0.1.105

> **REJEITADA PELO USUÁRIO.** Anatomia e movimento por recortes ficaram quebrados. A automação abaixo não validou o resultado visual. O script de render foi desativado. [Revisão atual: corpos inteiros](revision-02/README.md). O novo filme ainda não foi gerado; o laboratório mostra somente o quadro-base, explicitamente estático. O restante desta página é histórico da tentativa rejeitada.

[Assistir ao piloto](https://echosofdante.vercel.app/cinematic-pilot.html?v=0.1.105) · [Biblioteca](https://echosofdante.vercel.app/test-library.html)

## Entrega e gate humano

O usuário validou nomes/chat e autorizou esta etapa. **Somente o piloto de 12 segundos.** A abertura de aproximadamente 55 segundos, sua substituição na campanha, missões e mapas aguardam as validações previstas no [plano](../DANTE_COLONIZATION_PLAN.md).

A 0.1.101 foi rejeitada por exportar pinturas com pan/zoom. Aqui a câmera não se move: os atores possuem partes pintadas independentes, com poses, passos, apoio, cotovelos, mãos, gestos e mudanças de olhar ao longo da tomada. É **animação 2D por recortes articulados**; não é captura de atuação humana, geração de vídeo por IA nem animação facial completa. O laboratório declara essa técnica e suas limitações.

## Cena — Uma chance de abrigo

| Tempo | Atuação | Conversa |
| --- | --- | --- |
| 0–3 s | Ivo opera o console; Nara entra pela direita e cruza a ponte | Ivo: “Água líquida. Atmosfera compatível.” |
| 3–4,5 s | Ivo retira as mãos e se volta para Nara; ela termina a caminhada | Pausa curta |
| 4,5–7,7 s | Nara responde com gesto aberto e acomodação de peso; Ivo acompanha | Nara: “Então existe uma chance.” |
| 8–11,8 s | Nara olha e indica o planeta; Ivo volta à operação | Nara: “Prepare o reconhecimento. Ninguém desce sozinho.” |
| 11,8–12 s | A ação assenta, com o motor da nave | Encerramento do piloto |

Não define a causa da perda da Terra, a origem do Sinal ou o registro ancestral. O diálogo comunica a possibilidade de abrigo, sem confirmar segurança definitiva para colonização.

## Produção

- Três fontes raster originais criadas com **image_gen.imagegen**: ponte vazia, partes de Ivo e partes de Nara. Os civis existentes foram referências de identidade, vistos antes da edição. [Prompts exatos e ferramenta](prompts.json).
- [Fontes](source/): ponte 1672×941 RGB; Ivo/Nara 1448×1086 RGBA cada. Não entram no `public` nem no download do jogo. O atlas gerado não respeitou células perfeitamente iguais e repetiu a direção dos rostos: registro explícito por retângulo e vista espelhada são documentados no script.
- [Autor offline](../../scripts/render-bridge-pilot.py): composição com Pillow/OpenCV, transformações com alpha premultiplicado, articulações por IK, projeção do cotovelo ao retirar a mão, pernas com alcance limitado, fases de apoio com pés fixos no mundo e levantamento alternado. Os segmentos sobrepõem raízes e são ordenados entre corpo e membros. Joelhos excessivamente dobrados e polos de cotovelo que saltavam foram corrigidos durante a revisão dos quadros.
- Fundo permanece fixo. A varredura dos monitores é local. Som original sintetizado offline: motor, passos alinhados às aterrissagens e bipes de operação, sem samples externos, dublagem ou música nova.
- Regenerar: `python scripts/render-bridge-pilot.py`. Usa **Pillow, numpy, OpenCV e imageio-ffmpeg já disponíveis no ambiente de autoria**. Nenhuma dependência foi adicionada ao jogo. `--stills-only` atualiza os quadros de inspeção e o poster sem exportar filme.
- `public/assets/cinematic-pilot/bridge-pilot.mp4`: **H.264/yuv420p, 1280×720, 24 FPS, 288 quadros, 12 segundos**, AAC estéreo 48 kHz/128 kbps, faststart. Aproximadamente **1,64 MB**. Poster WebP e legendas VTT em português acompanham o vídeo.

## Runtime e isolamento

Página dedicada `cinematic-pilot.html`, registrada como entrada Vite. Reproduz um único vídeo, sem Phaser, entidades, texturas do mundo, relay, geração de arte ou acesso a saves. Carrega metadados/poster; inicia som por ação do usuário. Controles nativos + Assistir/Pausar, Rever, Som e Pular. Aba oculta pausa a reprodução; retorno retoma somente se estava tocando. Back/forward cache retoma o polling único do gamepad.

Touch usa os controles normais. Gamepad: direcional percorre controles e A confirma, com teclado conforme o foco do navegador. Não há novo input no jogo. Legendas podem ser ajustadas pelos controles nativos e o roteiro completo está disponível abaixo do player.

O filme toca a **24 FPS**, não 60: é o formato aprovado. Não altera o custo de renderização da campanha, pois a página do jogo não importa o piloto. Abertura antiga permanece explicitamente provisória até aprovação e produção do filme completo.

## QA

- `python scripts/qa-cinematic-media.py`: decodifica os 288 quadros, confere 1280×720/24 FPS e verifica movimento dos atores com região do visor praticamente fixa. Verifica alcance das pernas. É verificação estrutural, não aprovação da qualidade da atuação.
- `node scripts/qa-cinematic-pilot.mjs`: reprodução real em Chrome, pausa, som, replay touch, duração completa, legendas, gamepad mock, quatro resoluções (1280×720, 1366×768, 1920×1080, 844×390), Pular, ausência de mutações nos saves e de carregamento de Phaser.
- `npm run typecheck`, `npm run build`, `git diff --check` e smoke de regressão do fluxo de novo jogo/menu aplicáveis.
- Evidências: [quadros, manifest e relatórios](qa/). Capturas são momentos da animação; somente assistir ao vídeo permite avaliar seu movimento.

### Resultado técnico desta entrega

Passaram typecheck, build, validação dos 288 quadros e do áudio AAC, Chrome do piloto e smoke compilado de novo jogo/menu. Sem erros JavaScript ou de carregamento nas duas baterias. O build mantém somente o aviso conhecido de bundle Phaser acima de 500 kB. O player foi reduzido para que imagem e controles caibam juntos nas quatro viewports, sem cortar o topo da cena.

O relatório do player registrou 542 quadros apresentados/consultados durante reprodução e buscas, com 4 descartados; não é benchmark de gameplay. O filme mantém 24 FPS de autoria. Não houve alteração em combate, mundo, animação dos heróis, protocolo cooperativo ou prólogo ativo. O smoke desta etapa não repetiu a campanha cooperativa completa: o chat público da 0.1.104 já estava validado e não foi modificado.

## Limitações e avaliação

Animação de recortes, com projeção 2D limitada, duas vistas pintadas por cabeça e mãos em poses discretas; não oferece articulação facial, dedos contínuos, dublagem ou sincronização labial. Os giros e a caminhada precisam especialmente de julgamento humano. A composição e o naturalismo **não são declarados aprovados pela automação**. Não produzir a sequência de 55 s se esta atuação não atingir a expectativa do usuário.

Mobile e gamepad foram emulados; não substituem aparelhos físicos. O laboratório preserva a campanha e não pretende validar combates ou balanceamento novamente.

**Aguardar o playtest visual do usuário antes da abertura completa ou das missões.**
