# Echoes of Dante — Sprint 02.3

Repositório: https://github.com/brunomafra-dev/EchoesofDante

Protótipo de action RPG sci-fi para navegador. Kinetic Charge lança uma onda de corte de energia ao soltar Q; o Galactic Warrior segura o Energy Saber com as duas mãos. A silhueta segue a direção Organic Sci-Fi da [Art Bible](docs/art-bible/). Hollow Crawler, Dante Forest, movimento, combate, exploração e descoberta nas ruínas permanecem disponíveis.

## Stack

- TypeScript, Phaser 3 e Vite
- SVGs autorais em `public/assets/visual/` para personagens e árvores; terreno, efeitos e sons curtos continuam gerados em código
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
| Kinetic Charge | Segure Q para carregar; solte para lançar a onda na direção da mira |
| Respawn após morrer | R ou botão na tela |
| Investigar as ruínas | E quando o prompt aparecer perto da estrutura |

## Escopo implementado

- Kinetic Charge: segurar Q carrega energia sem deslocar o Warrior; soltar lança uma onda de corte ciano/branco na direção atual da mira. Ela começa à frente do Warrior, tem 120 unidades de largura e avança 133 unidades, a distância percorrida pelo Void Dash em terreno livre. Carga de até 800 ms, dano de 50 a 76, recuo de 500 unidades/s e cooldown de 3,2 s. Cada Hollow recebe no máximo um impacto por onda. A carga não concede invulnerabilidade; LMB, movimento e Dash voltam após o gesto de 200 ms, mesmo enquanto a onda ainda avança.
- Energy Saber: a mão principal e a mão de apoio acompanham dois pontos do mesmo cabo no `bodyRig`. O braço de apoio dobra no cotovelo para manter as duas mãos legíveis em todas as direções, sem alterar alcance, arco, dano ou janela do Saber Strike.
- Quatro Hollows, em dois pares, percorrem rotas curtas nas clareiras central e leste. Ao perceber o jogador, usam a perseguição e o combate existentes; ao perder contato, voltam ao ponto inicial e retomam a patrulha. Os demais continuam em seus postos.
- A formação mineral a leste emite um pulso breve e discreto de tempos em tempos. O fenômeno não exige interação, não cria missão e reutiliza os mesmos objetos visuais.
- First Discovery: estrutura parcialmente soterrada nas ruínas do norte, inscrições, fragmentos e vegetação. Investigar produz um pulso, som opcional e a mensagem temporária “SIGNAL DETECTED / SOURCE: UNKNOWN”. As inscrições permanecem acesas; a descoberta reinicia com o respawn, sem persistência ou recompensa.
- Dante Forest de 2200×1500 unidades: entrada ao sudoeste, trilha principal rumo às ruínas ao norte e desvios para uma árvore maior a oeste e uma formação mineral a leste. Clareiras conectadas, vegetação em camadas e bancos de rochas delimitam o espaço; câmera suave e zoom preservados.
- O solo e os desenhos estáticos da floresta são renderizados uma vez em camadas. Copas e troncos usam três SVGs compartilhados; rochas têm facetas irregulares. Profundidade e animações existentes foram preservadas.
- Galactic Warrior com capacete destacado, torso, braços e duas pernas visíveis. O corpo permanece ereto em vistas frontal, lateral e traseira; o sabre continua seguindo a mira e as pernas mantêm o ciclo de passos. Sombra, HP, movimento, dash e invulnerabilidade breve permanecem.
- Oito Hollow Crawlers distribuídos em quatro pares ao longo da exploração, agora com carapaça e membros orgânicos em SVG e núcleo quente. Detecção, perseguição, preparação do ataque, reação ao dano e morte continuam iguais. A entrada fica fora do alcance inicial de detecção.
- Golpe com preparação, varredura e recuperação; arco e trail ligados à posição da lâmina; dano aplicado durante a varredura. Contato curto orientado pelo sabre, contração e recuo visual do Hollow, números de dano, efeito de início/fim do dash, HUD de exploração, sons opcionais e tela de respawn.

## Limitações conhecidas

- A onda usa uma faixa frontal móvel e não tem interação especial com rochas. Seus valores e a naturalidade das poses do braço ainda precisam de avaliação humana em combate.
- HUD e Energy Saber receberam apenas o feedback necessário para a habilidade; sua arte base, Mineral Pulse, First Discovery e parte do terreno ainda são provisórios.
- Controles voltados a desktop com teclado e mouse; sem suporte dedicado a toque.
- Os inimigos derrotados só retornam ao reiniciar a arena.
- A vegetação comum é decorativa; rochas, tronco da árvore maior e base da ruína bloqueiam movimento.
- A IA mantém perseguição direta, sem navegação por caminhos; Hollows podem ficar presos em rochas ao perseguir fora das trilhas.
- A câmera e a arte usam visão superior 2D, sem profundidade isométrica real.
- O ciclo de passos usa transformações de formas 2D; a articulação das botas ainda é simples e precisa de avaliação humana em movimento.
- As fontes web dependem de conexão; o jogo usa fonte alternativa do sistema se não carregarem.
- O build inclui o Phaser em um único bundle grande; o Vite avisa sobre tamanho do chunk, embora a saída seja válida.
- O carregamento inicial ainda precisa preparar as texturas da cena; a auditoria mediu cerca de 1,8 segundo até a cena ficar disponível no Chrome headless testado. A composição em faixas de 100 unidades pode mudar levemente a sobreposição de rochas e pequenos elementos em relação ao desenho original.

## Próximos passos

Avaliar manualmente a leitura da onda em movimento, seu alcance e a integração com o sabre. O desempenho em outra GPU ou resolução pode ser diferente do Chrome headless medido nos testes.

As decisões técnicas desta sprint estão em [docs/technical-decisions.md](docs/technical-decisions.md).
