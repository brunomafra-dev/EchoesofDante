# Hollow: leitura e separação do terreno · 0.1.136

[Testar pintura refinada](https://echosofdante.vercel.app/forest-finish.html?v=0.1.136) · [Hollow anterior no mesmo ambiente](https://echosofdante.vercel.app/forest-finish.html?hollow=previous&v=0.1.136) · [Biblioteca](https://echosofdante.vercel.app/test-library.html)

## Feedback e correção

O usuário gostou da revisão física, mas o Hollow se misturava ao ambiente e cansava a vista. O atlas anterior tinha verdes/cinzas e pequenas manchas com valores parecidos aos de pedras, raízes e folhas. A nova pintura agrupa melhor as massas: carapaça em violeta escuro, bordas naturais claras de osso, juntas quentes escuras e núcleo âmbar. Menos fragmentos de cor e pequenos brilhos em toda a superfície; não há pulso luminoso ou contorno animado adicional.

As seis criaturas continuam inteiras, na grade 3×2: quatro passos, preparação e ataque. Célula de desenho 112×112, temporização da animação, sombra, hitbox, HP/dano/IA e terreno físico mantidos. Nenhuma alteração de movimento ou combate nesta revisão. A opção `hollow=previous` carrega o atlas anterior no mesmo renderizador e nos mesmos caminhos; o link em Opções alterna preservando classe/apresentação/kit. Recarrega e reinicia o encontro, sem pretender comparar o mesmo instante de uma luta em andamento.

Continua no laboratório solo, isolado dos personagens/jornadas reais. A aplicação do acabamento aos mapas da campanha aguarda o playtest. Não inicia outra expansão.

## Comparação visual

Capturas com posições DEV idênticas, cena pausada e câmera normal: um Hollow na terra iluminada e dois junto às margens sombreadas. [Configuração e valores](qa/comparison.json). São comparativos visuais, não medição de conforto ocular.

| Tela | Anterior | Refinado |
|---|---|---|
| Desktop 1366×768 | [Captura](qa/previous-1366.png) | [Captura](qa/refined-1366.png) |
| Viewport móvel 844×390 | [Captura](qa/previous-844.png) | [Captura](qa/refined-844.png) |

Revisão crítica: a cor separa a criatura da paleta verde/marrom do terreno e as bordas claras ajudam sobre sombra. A textura interna ficou mais quieta. O núcleo continua quente e os poderes cyan do jogador permanecem distintos. A orientação ainda usa rotação top-down das seis poses; a cena e seus detalhes continuam os mesmos. Confirmar a leitura e o conforto durante movimento no celular real; capturas e QA não certificam ausência de cansaço visual.

## Arte, procedência e custo

Um atlas editado offline pela imagegen integrada, usando `hollow-v2.webp` como alvo. [Prompt completo](art-prompt.md). Fonte `exec-f1e34702-9744-4acb-baa0-45d0af5ff6dc.png`: 1536×1024 RGBA, alpha real 0–254. Redução uniforme para 768×512 por Lanczos e WebP qualidade 94/method 6; sem separar membros ou normalizar poses individualmente.

Final: `public/assets/experiments/forest-finish/hollow-v3.webp`, **127.678 bytes**, aproximadamente **1,5 MiB** de pixels RGBA. Substitui a textura carregada no modo padrão, sem duplicar sprites ou adicionar camadas por inimigo. O atlas v2 permanece para comparação explícita. Terreno, copa, personagens, áudio e efeitos reutilizados. Sem geração em runtime.

## Verificações

- `npm run typecheck` e `npm run build` passaram; apenas o aviso conhecido de tamanho do chunk Phaser.
- [QA físico e poses](qa/grounding.json): 4.320 deslocamentos nos perigos existentes, rotas, Dash das quatro classes e seis poses completas. Arte antiga por partes permanece oculta.
- [Entradas](qa/inputs.json): movimento e mira multitouch, carga Q, pausa, gamepad mock e WebKit móvel emulado passaram. Não houve teste em aparelho físico.
- [Build compilada](qa/compiled/report.json): atlas v3 carregado, movimento/ataque/Q, troca v2/v3 na mesma clareira, classe/apresentação/kit e reinício passaram, sem erros JS/assets ou alteração da sentinela de personagens reais.
- [Amostra isolada de desempenho](qa/performance.json): um Chrome desktop 1366×768, variantes sequenciais e aquecimento de 8 s. Anterior **58,40 FPS**, refinada **58,61 FPS**, ambas com 61 objetos/220 texturas. Não se atribui ganho à diferença pequena. A amostra inicial com duas instâncias de QA em paralelo ficou em 51,42 FPS e foi [preservada](qa/performance-concurrent.json); o teste isolado verifica o risco de queda sob aquela carga concorrente.
- Comparativo de valores do cenário pausado confirmou HP, dano, limites e tamanhos iguais entre as duas pinturas; posições explícitas constam em `qa/comparison.json`.

Não foi repetida uma campanha completa nesta edição de arte; a regressão até o Warden da [revisão 02](../revision-02/qa/campaign/report.json) fica como histórico, não como uma nova execução. Os sistemas de campanha/combate/física não foram alterados. O resultado público será registrado após o deploy. **Playtest humano da nova leitura pendente.**
