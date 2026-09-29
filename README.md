# Echoes of Dante — Sprint 02.0

Repositório: https://github.com/brunomafra-dev/EchoesofDante

Protótipo de action RPG sci-fi para navegador. A Sprint 02.0 transforma as ruínas do norte em uma descoberta ambiental: uma estrutura antiga reage à investigação e emite um sinal de origem desconhecida.

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
| Investigar as ruínas | E quando o prompt aparecer perto da estrutura |

## Escopo implementado

- First Discovery: estrutura parcialmente soterrada nas ruínas do norte, inscrições, fragmentos e vegetação. Investigar produz um pulso, som opcional e a mensagem temporária “SIGNAL DETECTED / SOURCE: UNKNOWN”. As inscrições permanecem acesas; a descoberta reinicia com o respawn, sem persistência ou recompensa.
- Dante Forest de 2200×1500 unidades: entrada ao sudoeste, trilha principal rumo às ruínas ao norte e desvios para uma árvore maior a oeste e uma formação mineral a leste. Clareiras conectadas, vegetação em camadas e bancos de rochas delimitam o espaço; câmera suave e zoom preservados.
- Galactic Warrior com silhueta de traje espacial, capacete, mochila de campo, torso e pernas orientados pela mira, botas alternadas pela distância e direção percorridas, sombra no chão, Energy Saber separada do corpo, HP, movimento, dash e invulnerabilidade breve.
- Oito Hollow Crawlers distribuídos em quatro pares ao longo da exploração, com núcleo luminoso, membros articulados, detecção, perseguição, preparação visível do ataque, reação ao dano e morte. A entrada fica fora do alcance inicial de detecção.
- Golpe com preparação, varredura e recuperação; arco e trail ligados à posição da lâmina; dano aplicado durante a varredura. Contato curto orientado pelo sabre, contração e recuo visual do Hollow, números de dano, efeito de início/fim do dash, HUD de exploração, sons opcionais e tela de respawn.

## Limitações conhecidas

- Controles voltados a desktop com teclado e mouse; sem suporte dedicado a toque.
- Os inimigos derrotados só retornam ao reiniciar a arena.
- A vegetação comum é decorativa; rochas, tronco da árvore maior e base da ruína bloqueiam movimento.
- A IA mantém perseguição direta, sem navegação por caminhos; Hollows podem ficar presos em rochas ao perseguir fora das trilhas.
- A câmera e a arte usam visão superior 2D, sem profundidade isométrica real.
- O ciclo de passos usa transformações de formas 2D; a articulação das botas ainda é simples e precisa de avaliação humana em movimento.
- As fontes web dependem de conexão; o jogo usa fonte alternativa do sistema se não carregarem.
- O build inclui o Phaser em um único bundle grande; o Vite avisa sobre tamanho do chunk, embora a saída seja válida.

## Próximos passos

Avaliar manualmente se a estrutura desperta curiosidade ao chegar às ruínas e se o prompt, o pulso e a mensagem são percebidos durante a exploração. Refinar esse momento conforme o feedback antes de expandir o conteúdo.

As decisões técnicas desta sprint estão em [docs/technical-decisions.md](docs/technical-decisions.md).
