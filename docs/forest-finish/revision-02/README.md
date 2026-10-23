# Clareira: terreno físico e Hollow completo · 0.1.135

[Testar a revisão](https://echosofdante.vercel.app/forest-finish.html?v=0.1.135) · [Comparar com o renderer atual](https://echosofdante.vercel.app/forest-finish.html?mode=current&v=0.1.135) · [Biblioteca](https://echosofdante.vercel.app/test-library.html)

## Pedido e escopo

O usuário aprovou o acabamento ambiental da 0.1.134, mas encontrou árvores atravessáveis e pediu elevar os monstros ao mesmo acabamento. Esta revisão mantém a composição aprovada, corrige a superfície caminhável e apresenta um Hollow inteiro. **Continua na referência solo, com personagens temporários e saves reais protegidos.** A migração para os mapas da campanha aguarda este playtest; não é uma nova etapa de expansão.

## Terreno com presença física

Os dez círculos aproximados foram substituídos por um contorno autoral, traçado em coordenadas da pintura sobre as bases reais de água, árvores, raízes elevadas e afloramentos. O miolo e as margens baixas da trilha continuam livres; folhas acima do caminho são copa, sem parede artificial sob suas pontas.

A clareira, a trilha sul, os dois braços ao norte e o pequeno acesso à margem formam uma superfície conectada. Os limites antigos cortavam os caminhos antes da borda da composição; agora o contorno acompanha a extensão pintada. Não há viagens para outras regiões nesta câmara.

`MovementBounds.walkable` é opcional. Somente esta referência fornece o contorno; os mapas atuais continuam usando o caminho anterior de círculos/limites, sem mudança de resultados. A resolução segue o deslocamento por eixos, com passos curtos para impedir atravessar um banco durante Dash/empurrão. O ponto de apoio considera a projeção dos pés: +39 no jogador, +18 no Hollow. Não há consulta de pixels, leitura de GPU ou desenho de máscara a cada frame. Companheiro usa o mesmo contorno pelo resolvedor comum, com seu centro físico existente.

Diagnóstico reservado DEV: `?terrain=1` mostra uma linha estática sobre o contorno. Não aparece na build pública, nem é uma camada visual permanente. [Captura do contorno](qa/authored-contour.png).

## Hollow no mesmo mundo

Uma folha original de seis **criaturas completas** substitui a arte por partes neste modo: quatro apoios de caminhada, preparação e investida. Carapaça cinza/oliva, juntas orgânicas, mineral violeta e cavidade âmbar preservam a identidade do Hollow. As patas têm volume, apoio e silhueta mais legíveis.

`ForestCrawlerArt` altera apenas apresentação: poses inteiras, respiração de até 1,2% na preparação, ausência do salto vertical antigo e sombra suave de contato. Partes antigas ficam ocultas; flash de impacto, nome, telegraph e feedback de HP continuam comuns. A fase da passada depende da distância percorrida. Estado de preparação/golpe acompanha os estados e tempos existentes, sem novo sistema de combate.

Mesmos três residentes, HP 68, velocidade 115, raio 18, alcance 42, dano 14 e preparação de 330 ms. Detecção, perseguição, decisões da IA, recompensas e morte continuam existentes. O tamanho de desenho da célula é fixo em 112×112; o corpo ocupa parte dessa célula transparente, sem alterar hitbox. [Captura em combate](qa/combat.png).

## Asset e orçamento

| Arquivo | Dimensões | Tamanho | Uso |
|---|---|---:|---|
| `public/assets/experiments/forest-finish/hollow-v2.webp` | 768×512 RGBA | 140.314 bytes | 3×2 células de 256×256 |

Original: 1536×1024 RGBA, alpha real 0–254, gerado offline com imagegen integrada. Preparação: redução de 50% com Lanczos, WebP qualidade 94/method 6; sem remover fundo por chave de cor nem recortar membros. [Prompt e procedência](art-prompt.md). Memória de pixels do atlas: aproximadamente 1,5 MiB, compartilhada pelos três Hollows. Terreno e copa da 0.1.134 reutilizados, assim como personagens, equipamentos, áudio, efeitos e componentes de interface.

Uma sombra pequena adicional por Hollow; seis poses não são seis entidades. Sombras são destruídas após a morte e ao encerrar a cena. Nenhuma geração de arte em runtime ou coleção crescente de partículas/tweens. O atlas novo só carrega no modo novo da referência; campanha não o carrega. Protocolo cooperativo permanece 15, sem mudança de servidor.

## QA e limites de aprovação

- [Terreno e Hollow](qa/grounding.json): seis perigos pintados × pés de jogador/Hollow × caminhada/Dash/empurrão, 4.320 deslocamentos com verificação de círculo dentro do chão; rotas conectadas, Dash real das quatro classes e poses de passo/preparação/golpe sem partes antigas visíveis.
- [Referência](qa/report.json): classes/apresentações/equipamentos existentes, mira, Q, dano real, morte/respawn, pausa, comparação e isolamento de saves; contagens e FPS registrados no relatório.
- [Entradas](qa/inputs.json): multitouch com movimento/mira independentes, Q, opções, gamepad mock e WebKit emulado. Sem aparelho físico.
- [Campanha](qa/campaign/report.json): jornada existente até o Warden/Vale, combate, morte/respawn e entradas, com posicionamento DEV explícito. Não é uma campanha humana cronometrada.

Scripts: `qa-forest-grounding.mjs`, `qa-forest-finish.mjs`, `qa-forest-finish-inputs.mjs`, `qa-forest-finish-public.mjs` e `qa-dante-journey.mjs`. `QA_OUT` seleciona pasta; `QA_BASE` seleciona servidor para os quatro primeiros. `npm run typecheck` e `npm run build` passaram; permanece o aviso conhecido do chunk Phaser. [Smoke da build compilada](qa/compiled/report.json) passou com navegação/classe/apresentação/kit/comparação reais, sem globals DEV ou alterações dos saves reais. Todos os relatórios acima passaram, sem erros JS.

Três reinícios adicionais mantiveram 61 objetos de cena, 220 texturas e contagens de listeners constantes (4 resize / 24 shutdown). A referência registrou média de **57,95 FPS** no Chrome desktop; a regressão da campanha ficou em cerca de 57,7 FPS neste ambiente. A resolução do contorno acrescenta trabalho somente neste modo. As amostras estão nos relatórios; não é garantia de FPS em qualquer aparelho. A publicação pública será registrada após o deploy.

Revisão visual: contorno inspecionado por cima da pintura; massas altas ficam fora da área caminhável, rotas têm espaço para reposicionar e atacar, sombra apoia a criatura e a escala preserva o Guerreiro como referência. Pequenas pedras baixas e grama continuam sendo terreno caminhável, deliberadamente. O contorno é desenhado à mão, não detecta automaticamente futuras mudanças da pintura. São seis poses de uma mesma criatura, com orientação top-down por rotação; não são oito vistas pintadas distintas. Avaliar no playtest principalmente o contorno da margem, o apoio nos cantos e a leitura do novo Hollow no celular. QA técnico não substitui aprovação visual.
