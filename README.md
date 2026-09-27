# Echoes of Dante — Sprint 01.7 Hotfix

Repositório: https://github.com/brunomafra-dev/EchoesofDante

Protótipo de combate em arena para navegador. A hotfix da Sprint 01.7 restaura a orientação do torso e capacete pelo mouse, mantendo as botas apoiadas no chão e a passada ligada ao deslocamento real.

## Stack

- TypeScript, Phaser 3 e Vite
- Arte 2D criada com formas do Phaser; sons curtos sintetizados pelo navegador
- Barlow Condensed e DM Sans carregadas via Google Fonts, com fallback local
- Sem backend, persistência ou multiplayer

## Instalar e executar

Requer Node.js com npm.

```bash
npm install
npm run dev
```

Abra a URL local indicada pelo Vite. Para validar o pacote de produção:

```bash
npm run build
npm run preview
```

## Controles

| Ação | Controle |
| --- | --- |
| Mover | W A S D |
| Mirar | Mouse |
| Saber Strike | Clique esquerdo; segure para repetir após o cooldown |
| Void Dash | Espaço; segue a direção de movimento ou da mira se parado |
| Respawn após morrer | R ou botão na tela |

## Escopo implementado

- Arena única com câmera suave, limites, vegetação alienígena em camadas, marcas minerais, ruínas e rochas com colisão.
- Galactic Warrior com silhueta de traje espacial, capacete, mochila de campo, torso orientado pela mira, botas alternadas pela distância e direção percorridas, sombra no chão, Energy Saber separada do corpo, HP, movimento, dash e invulnerabilidade breve.
- Oito Hollow Crawlers biomecânicos com núcleo luminoso, membros articulados, detecção, perseguição, preparação visível do ataque, reação ao dano e morte.
- Golpe com preparação, varredura e recuperação; arco e trail ligados à posição da lâmina; dano aplicado durante a varredura. Flash e fragmentos de impacto, números de dano, efeito de início/fim do dash, HUD de exploração, sons opcionais e tela de respawn.

## Limitações conhecidas

- Controles voltados a desktop com teclado e mouse; sem suporte dedicado a toque.
- Os inimigos derrotados só retornam ao reiniciar a arena.
- A vegetação é decorativa; apenas as rochas principais bloqueiam movimento.
- A câmera e a arte usam visão superior 2D, sem profundidade isométrica real.
- O ciclo de passos usa transformações de formas 2D; a articulação das botas ainda é simples e precisa de avaliação humana em movimento.
- As fontes web dependem de conexão; o jogo usa fonte alternativa do sistema se não carregarem.
- O build inclui o Phaser em um único bundle grande; o Vite avisa sobre tamanho do chunk, embora a saída seja válida.

## Próximos passos

Avaliar com jogadores a leitura da caminhada corrigida e dos efeitos. Os valores de combate da Sprint 01 permanecem inalterados. Sistemas de progressão e mundo ficam para sprints posteriores.

As decisões técnicas desta sprint estão em [docs/technical-decisions.md](docs/technical-decisions.md).
