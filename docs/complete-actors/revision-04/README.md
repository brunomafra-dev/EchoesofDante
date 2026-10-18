# Guerreira e diagonais do Hunter — 0.1.114

O usuário aprovou a revisão geral 0.1.113, mas apontou cabeça quebrada na **Guerreira** e impressão de zoom no **Star Hunter** próximo da orientação frontal. Correção visual restrita; nenhuma etapa nova do plano de conteúdo.

## Testar

- [Guerreira equipada](https://echosofdante.vercel.app/character-cohesion.html?class=warrior&sex=female&kit=reinforced&v=0.1.114).
- [Hunter: frente e diagonais](https://echosofdante.vercel.app/character-cohesion.html?class=hunter&sex=male&kit=clothes&v=0.1.114).
- [Seletor reservado](https://echosofdante.vercel.app/campaign-playtest.html?v=0.1.114): Jogar → Novo jogo → escolher classe/apresentação → Ver em ação.

O painel permite trocar apresentação, traje, capacete e arma. Os testes preservam os personagens reais.

## Correções

**Guerreira:** algumas cabeças de repouso continham traços da célula vizinha. A máscara anterior também era estreita para alguns contornos de cabelo. As referências E/N agora vêm das pinturas completas de apoio já existentes, com cabeça íntegra. Uma máscara técnica identifica a região contínua da cabeça e descarta fragmentos; a cobertura se afunila antes do pescoço para preservar o antebraço levantado. Não se gera ou articula um novo membro em runtime.

`python scripts/prepare-warrior-head-masks.py` prepara 24 máscaras a partir dos PNGs existentes, usando Pillow, NumPy e OpenCV. Regenerar após alterações no pipeline de arte/registro. O build consome somente `warriorFemaleHeads.json`; as dependências Python não são carregadas no jogo.

**Hunter:** as pinturas frontais em três quartos tinham maior massa aparente, especialmente sem proteção. A figura inteira dessas vistas recebe calibração uniforme em torno do contato dos pés, uma vez no bake: masculino 0,97/0,92, feminino 0,94/0,88. O mesmo fator vale para repouso, passos e ação da vista. A emissão visual do rifle acompanha a transformação. Não se modifica escala da câmera ou do Image durante a mira. Pequenos fragmentos nas margens superiores vazias também são descartados.

Cada quadro inteiro é composto nas mesmas coordenadas locais de um canvas temporário de 192×192 e copiado para o atlas fixo. Isso evita diferenças de arredondamento subpixel entre colunas. Um único Image e atlas equipado continuam sendo usados por ator; o canvas temporário é reutilizado nos 32 quadros do bake e não fica no cenário. Não há desenho de arte por frame.

Os mesmos 24 PNGs de origem/runtime permanecem inalterados. As correções são compartilhadas por campanha, seletor e apresentação dos aliados. Combate, controles, colisões, saves e protocolo de rede não recebem alterações.

## Evidências

`node scripts/qa-head-scale.mjs` compara o compositor anterior (`6ad679e`) com o atual. Nas imagens em [qa](qa/), as três colunas da esquerda são anteriores e as três da direita são atuais; linhas alternam as quatro poses. Hunter: frente e duas diagonais; Guerreira: E, N e SW.

- Nove combinações de classe/apresentação/traje verificadas. Na Guerreira, cabeça e torso pertencem à mesma silhueta conectada nas 96 poses dos três trajes; a faixa de céu sobre as referências E/N não contém os antigos traços.
- A área alfa da parte superior da cabeça é um **indicador técnico de massa aparente**, não uma aprovação estética: a maior razão diagonal/frente sem proteção cai de 1,26 para 1,11 no Hunter masculino e de 1,42 para 1,18 no feminino. É uma medida de área, não de zoom da câmera. [Relatório](qa/head-scale.json).
- Regressão de 3.072 combinações: quatro classes, duas apresentações, oito direções, quatro poses, equipamento misto e três armas. Cabeça estável entre poses e igualdade local/remoto, um Image visível e um atlas por ator. Movimento, básico, Dash, Q, touch emulado, gamepad mock e quatro resoluções. [Relatório](qa/actors.json).
- Amostra de Chrome na Floresta: **53,36 FPS**, 386 objetos, 207 texturas, 24 tweens e um atlas equipado. As contagens verificadas permanecem estáveis durante trocas. O canvas de preparação acrescenta aproximadamente 144 KiB temporários por bake, sem uma textura de runtime adicional.

**Automação passou:** typecheck, build e [regressão compilada de entrada/menu](production-qa/report.json), incluindo criação/início solo, touch e gamepad emulados. Zero erros JS/assets nesses relatórios. O aviso conhecido de chunk grande do Phaser continua. A verificação de entrada aguarda o menu real, sem depender do evento `load` de uma fonte externa, que causou timeout na primeira execução do smoke.

## Limites

**Playtest humano necessário.** A calibração reduz a diferença perceptual; as pinturas ainda possuem oito vistas e poucos apoios, com perspectiva e silhueta próprias. A passagem frente/diagonais deve ser avaliada em movimento, com cursor girando, roupa inicial e proteção, nas duas apresentações. Conferir a Guerreira de costas e ao levantar o braço. Testes automáticos de conexão/área não comprovam anatomia ou animação perfeitas.

QA visual local/remoto não equivale a uma campanha pública completa com quatro pessoas. Nenhuma nova validação física de touch/gamepad ou aprovação da etapa seguinte é declarada nesta manutenção.
