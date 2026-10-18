# Figuras inteiras sem cortes de importação — 0.1.115

As cinco capturas do usuário revelaram erros que a revisão 0.1.114 não resolveu: antebraço/mão e espada cortados na Guerreira, cabeça interrompida e bota ampliada em um passo do Hunter. A revisão anterior não está aprovada visualmente. Esta é manutenção da representação completa existente; não avança o plano de conteúdo.

## Testar

- [Guerreira, roupa inicial](https://echosofdante.vercel.app/character-cohesion.html?class=warrior&sex=female&kit=clothes&v=0.1.115).
- [Hunter, roupa inicial](https://echosofdante.vercel.app/character-cohesion.html?class=hunter&sex=male&kit=clothes&v=0.1.115).
- [Seletor e prévias](https://echosofdante.vercel.app/campaign-playtest.html?v=0.1.115).

Caminhe continuamente mudando a mira entre frente, diagonais e perfil. Na Guerreira, confira ambos os braços, mãos, espada e cabeça. No Hunter, confira a alternância dos pés sem bota gigante ou salto de escala. Troque roupa inicial/básica/reforçada e peças mistas; ataque, Dash e segure/solte Q. Saves reais preservados pelo laboratório existente. Mesmos assets/compositor na campanha, seletor e aliados.

## Causa e correção

O importador dividia folhas de contato em terços iguais apesar das margens laterais desiguais. O primeiro personagem atravessava esse limite e perdia um punho. Algumas linhas também sobrepunham pés/cabeça; normalizar a figura incompleta aumentava o restante do corpo. Medir apenas cabeça estável e quadro não vazio não detectava esses defeitos.

- Colunas agora seguem as massas reais de personagens inteiros. Linhas problemáticas recebem limites revisados e fontes com intervalos seguros.
- Três folhas novas de **pessoas completas**, geradas offline: Guerreira nos oito apoios direitos e Hunter masculino/feminino no apoio SW. [Prompts, origem e preparação](source/prompts.md). Sem braços ou pernas montados em runtime.
- Registro usa a posição efetiva da cabeça e a altura importada, ancorando os pés no mesmo plano. Removida a redução por direção da 0.1.114; ela mascarava um recorte errado.
- Máscaras da cabeça feminina são medidas após esse registro, preservando a referência íntegra usada entre ações.
- A seta de navegação agora percorre uma elipse fora do corpo; antes cruzava punhos/torso nas capturas. Objetivo e navegação não mudam.

Mantidos 24 atlases de 768×1536, um Image e um atlas equipado por ator. Onze PNGs de Guerreiro/Hunter mudam; os 12 de Astral/Domador são idênticos byte a byte à 0.1.114. As três fontes novas são ferramentas de produção, não downloads adicionais do jogo. Sem alteração de combate, controles, HP, colisores, progressão, saves ou protocolo de rede.

## Evidência e reprodução

- `python scripts/qa-complete-source-import.py`: 30 recortes novos com margem opaca segura, 768 âncoras, dimensões e igualdade dos assets das outras duas classes. [Relatório e hashes](source-audit.json).
- `node scripts/qa-whole-pose-import.mjs`: 18 comparativos reais de compositor/assets 0.1.114 vs 0.1.115. As quatro vistas da Guerreira e SW dos dois Hunters nos três trajes. Verifica também que composição de roupa não remove a silhueta do corpo abaixo da cabeça. [Resultados e PNGs](pose-qa/).
- `node scripts/qa-complete-actors.mjs`: quatro classes, duas apresentações, três armas, quatro combinações de roupa, oito vistas e quatro poses; 3.072 casos. Igualdade visual local/remoto, capacete estável, recursos estáveis nas trocas, ações reais, seletor, touch emulado, gamepad mock e quatro resoluções. [Relatório](actors.json).
- `qa-head-scale.mjs` passa a encaminhar ao teste do corpo inteiro. O antigo critério de área da cabeça aceitava os corpos cortados mostrados pelo usuário; seus resultados históricos permanecem na revisão 04.
- `npm run typecheck`, `npm run build` e QA compilado de entrada/menu: [relatório](production-qa/report.json).

Os comparativos usam o código e PNGs congelados do commit `c57d61f`, sem reconstruir artificialmente a imagem anterior. Esquerda = 0.1.114; direita = 0.1.115.

## Limites e aprovação

A composição continua preparada somente quando equipamento/apresentação muda, com o mesmo custo por frame. Não há novas entidades, partículas ou animação de membros. A amostra automatizada em Chrome registrou **52,75 FPS**, 386 objetos, 207 texturas, 24 tweens e um atlas equipado; contagens estáveis nas trocas. A revisão anterior registrou 53,36 FPS nesse roteiro. Essa amostra não atinge a meta de 55–60 FPS nem equivale a um benchmark de combate cooperativo público. [Dados](actors.json).

Oito direções e dois apoios pintados ainda produzem transições discretas. Equipamento misto preserva a limitação existente de revestimento da empunhadura, e o espelhamento pode trocar a mão dominante. Automações e inspeção dos comparativos não substituem avaliar a marcha jogando. **Aguardar validação humana antes da próxima entrega.**
