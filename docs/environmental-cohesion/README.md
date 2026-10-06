# Coes?o ambiental ? 0.1.51

## Objetivo

Estender por todas as regi?es a integra??o de ch?o, composi??o e materiais usada na C?mara de Refer?ncia e na entrada da Cavern. A gram?tica visual ? compartilhada; o material muda com cada bioma.

## Aplica??o por regi?o

| Regi?o | Integra??o aplicada |
| --- | --- |
| Forest | Solo ilustrado mais presente no bake existente, mantendo clareiras, caminhos e vegeta??o. |
| Entrada da Cavern | Bacia ilustrada preservada; borda direita suavizada para misturar com a ?rea profunda. |
| Cavern, Deep Cavern e t?neis | Substrato ilustrado de pedra cont?nuo sob todas as composi??es e bakes. |
| Sa?da e Exterior | Solo vegetal aplicado pela silhueta do plat? e integrado ? composi??o est?tica. |
| Warden Approach | Continua??o do solo exterior sob a regi?o j? composta. |
| Vale da Resson?ncia | Mesmo material de solo exterior, com tonalidade adequada ao Vale. |
| Arena do Warden | Substrato de pedra antiga com tonalidade mais escura. |

Assim, a mesma l?gica de grounding atravessa o jogo sem pintar cada bioma da mesma cor. A Forest continua aberta e vegetal; a Cavern continua mineral, com ra?zes e tecnologia antiga; o Exterior e o Vale s?o mais vivos; a arena preserva uma leitura subterr?nea.

## Implementa??o e custo

`createEnvironmentGround` adiciona uma `TileSprite` estacion?ria usando texturas j? carregadas. A Forest continua sendo bakeada uma vez. O piso vegetal do Exterior ? aplicado ? m?scara do plat? existente, evitando um ret?ngulo sobre a sa?da rochosa. Props, sombras e detalhes continuam nos bakes/RenderTextures j? existentes.

O piso da entrada ? o asset aprovado preparado offline; seu fade foi ampliado na borda que encontra as regi?es profundas. N?o foram gerados assets novos. Colis?es, footprints, limites, spawns, c?mera e gameplay n?o mudaram.

## Revis?o visual

`map-review.png` re?ne capturas do Chrome headless em 1280?720 da Forest, entrada da Cavern, duas regi?es profundas, Exterior, Approach, Vale e arena do Warden. A navega??o visual das cenas foi conferida e n?o houve erros de JavaScript ou de console durante as capturas.

As capturas confirmam carregamento, materiais e continuidade visual em cada mapa; n?o substituem playtest humano em movimento. Ainda vale observar no jogo a repeti??o do tile em percursos longos e a mistura da sa?da da Cavern com o Exterior.
