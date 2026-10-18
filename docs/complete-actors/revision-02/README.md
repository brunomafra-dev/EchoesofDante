# Passada e identidade — 0.1.112

O usuário aprovou a representação de corpo inteiro da 0.1.111, mas apontou caminhada semelhante a saltos no Guerreiro/Hunter e identidades muito parecidas entre eles. Revisão visual de manutenção; não avança as etapas de conteúdo.

## Testar

- [Hunter](https://echosofdante.vercel.app/character-cohesion.html?class=hunter&sex=male&v=0.1.112).
- [Guerreiro](https://echosofdante.vercel.app/character-cohesion.html?class=warrior&sex=male&v=0.1.112).
- [Seletor](https://echosofdante.vercel.app/campaign-playtest.html?v=0.1.112).

No painel, alterne masculino/feminino, roupa inicial, básica, reforçada e peças mistas. Caminhe para frente, costas e diagonais, mantendo e mudando a mira; use básico, Dash e Q. Laboratório separado dos saves reais. A campanha e os aliados cooperativos também usam a revisão.

## Alterações

- **Passada:** novas pinturas de pessoas completas nos dois apoios de caminhada, com alternância de suporte. Retirada da postura parada aberta entre os contatos do Guerreiro/Hunter. O ciclo visual passa de 104 para 144/152 unidades percorridas, respectivamente; velocidade física, Dash e cooldowns permanecem iguais.
- **Registro:** redimensionamento uniforme da figura inteira e eixo da cabeça registrado na mesma posição dos quadros de locomoção. A posição do pé de apoio não desloca mais o torso lateralmente. Sem oscilação vertical acrescentada, rotação do corpo ou estiramento de membros em runtime.
- **Hunter:** identidade humana própria, pele escura, cabelo prateado, roupa azul-marinho, arnês âmbar, proteção leve escura e capacete angular com visor âmbar. Masculino/feminino e três vestimentas. Contrasta com o Guerreiro de cabelo castanho e armadura clara mais volumosa.
- Seletor, jogador local e `PartyActor` compartilham a seleção dos mesmos quadros. Astral e Domador conservam os PNGs e o ciclo anterior. Nenhuma regra de combate, progressão, input, save, rede ou cenário foi alterada.

## Arte e custo

[Fontes originais](source/), [dimensões, tamanhos e hashes](sources.json), [orientação de produção](prompts/production.md). Mesma ferramenta `image_gen.imagegen`, produção offline com transparência real. Não há remontagem de braços/pernas. Fontes corretivas contêm pessoas completas para vistas omitidas ou cortadas; o script seleciona a figura inteira correspondente. Nenhum novo espelhamento de membros ou figuras foi introduzido nesta revisão.

`python scripts/prepare-complete-actors.py` extrai células inteiras, remove fragmentos de figuras vizinhas e registra/redimensiona uniformemente. Os 12 atlas de Guerreiro/Hunter são substituídos; permanecem 24 atlas de 768×1536, 32 quadros de 192×192 por atlas. Download total aproximado: **21,63 MiB**; memória RGBA dos 24 atlas permanece **108 MiB**, além dos compostos e demais recursos. Um Image/atlas equipado por ator, sem novos tweens, texturas ou desenho de membros por quadro.

## Verificação

Evidências em [qa](qa/). `scripts/qa-complete-registration.py` verifica eixo da cabeça, alternância do apoio frontal nas 12 vestimentas revisadas e igualdade binária dos 12 PNGs de Astral/Domador com a versão anterior. O maior desvio lateral medido do eixo foi **1,496 pixel** no atlas (menos de uma unidade na escala de exibição).

O QA de browser verifica poses, equipamento misto, correspondência local/remoto, ações reais, seletor, resoluções e inputs. Resultados desta execução:

### Resultado técnico

- `npm run typecheck`: passou. `npm run build`: passou; permanece o aviso conhecido de chunk Phaser >500 kB.
- [Chrome: personagens](qa/report.json): **3.072 casos**, oito apresentações, 32 quadros, três armas e peças mistas; pixels local/remoto iguais, um Image visível, uma textura equipada reutilizada; básico, Q, Dash e movimento reais; seletor masculino/feminino; 1280×720, 1366×768, 1920×1080 e 844×390; touch emulado/gamepad mock. Zero erros JS/assets/warnings nessa execução.
- [Registro e fontes preservadas](qa/registration.json): 12 atlas revisados, apoio frontal alternado e desvio lateral da cabeça <1,5 pixel; 12 PNGs de Astral/Domador idênticos à 0.1.111.
- [Ciclo de vida](qa/lifecycle.json): três mortes/respawns por classe, contagens estáveis de objetos, texturas, tweens, listeners e controles; um atlas equipado por personagem.
- [Build compilado](production-qa/report.json): nome, dificuldade, entrada solo, apresentação do prólogo ativo, menu gamepad/touch e entrada oficial passaram. Relay excluído deliberadamente desse teste; nenhuma alegação de campanha cooperativa integral.
- Amostra individual de browser: **54,56 FPS**, 386 objetos, 207 texturas, 24 tweens de cenário e um atlas equipado. A amostra anterior tinha 55,18 FPS; diferença pequena nessa máquina/automação, sem crescimento dos recursos. Não é benchmark de todas as regiões nem de aparelho físico.

[Comparativo animado de quadros antes/depois](qa/gait-compare.gif): montagem técnica dos atlas frontais com a mesma velocidade percorrida, não captura de gameplay. As capturas do jogo e seletor estão na pasta de QA.

**Automação passou. Playtest humano necessário para avaliar a passada e a identidade.**

## Limitações e playtest

Ainda são **dois quadros de caminhada**, não uma animação final com intermediários; podem existir mudanças de volume, empunhadura ou pequenos saltos de desenho entre pinturas e nas transições repouso/ação. Mira física continua contínua, orientação pintada em oito vistas. Limitações de peças mistas e arma do atlas anterior continuam documentadas no [relatório original](../README.md).

**Automações técnicas não aprovam a fluidez. Playtest humano necessário**, especialmente costas, diagonais, strafing, mudanças rápidas de mira e combinações extremas de equipamento. A pendência histórica do QA cooperativo longo permanece separada; igualdade visual local/remoto não equivale à aprovação da campanha cooperativa inteira. Não foi usado celular físico nesta revisão.
