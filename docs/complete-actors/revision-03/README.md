# Equipamento consistente e prévias reais — 0.1.113

O usuário identificou capacete desaparecendo e mudanças de tamanho ao andar/atacar e girar a mira; também rejeitou a correspondência das demonstrações do seletor com o básico/Q da campanha. Manutenção das quatro classes nas duas apresentações, sem avançar o plano de conteúdo.

## Testar

- [Guerreiro equipado](https://echosofdante.vercel.app/character-cohesion.html?class=warrior&sex=male&kit=reinforced&v=0.1.113).
- [Hunter equipado](https://echosofdante.vercel.app/character-cohesion.html?class=hunter&sex=female&kit=reinforced&v=0.1.113).
- [Seletor reservado](https://echosofdante.vercel.app/campaign-playtest.html?v=0.1.113): Jogar → Novo jogo → escolher classe → Ver em ação. Repetir no Astral demonstra energia, fogo, água e terra.

Os laboratórios preservam os saves reais. A campanha, os aliados remotos e o seletor recebem a mesma correção de composição.

## Diagnóstico e correção

A faixa horizontal fixa usada para trocar capacetes não acompanhava o deslocamento da cabeça nas pinturas de ação. Algumas fontes também alternavam cobertura de cabeça entre poses. O registro pelo contorno inteiro ou pela ponta da arma não assegurava proporção e alinhamento entre essas pinturas.

- **768 referências de pescoço**, medidas offline por correspondência da pintura de repouso, com exceções revisadas para não confundir trança, ombro ou mão levantada com cabeça. `python scripts/prepare-actor-registration.py` gera `actorRegistration.json` e [auditoria](anchor-audit.json).
- A composição aplica **escala uniforme à figura inteira**, registrando pescoço e plano dos pés. Não estica ou articula membros individuais. A mira não altera a escala do Image durante o jogo.
- O slot de capacete usa uma referência estável por direção/vestimenta, com máscara limitada à cabeça. Não substitui mais uma faixa que atravessa o sprite inteiro e pode apagar mãos erguidas. Repouso, passos, básico e Q conservam a mesma cabeça equipada daquela vista.
- O resultado continua sendo **um Image com um atlas equipado fixo por ator**, reconstruído apenas ao mudar equipamento. Emissores visuais acompanham o registro da figura, apresentação e torso. Origem física, alcance, colisão e dano permanecem iguais.
- Mesmos 24 PNGs existentes: nenhum asset novo, novo tamanho de textura, rig visível de membros, geração de arte ou bake por frame.

**Decisões explícitas:** o Hunter básico e reforçado compartilham a referência fechada de capacete para evitar vistas básicas sem proteção; as demais peças continuam distintas. Na vista N do Domador reforçado, a cobertura completa da vista posterior adjacente substitui a fonte cortada. Isso evita a cabeça incompleta, mas o pequeno giro dessa cobertura ainda merece avaliação humana.

Se as pinturas forem regeneradas, executar primeiro o pipeline existente `prepare-complete-actors.py` e depois `prepare-actor-registration.py`. A medição requer Pillow, NumPy e OpenCV no ambiente de arte; o browser/build apenas consome os PNGs e o JSON já preparados.

## Seletor

As figuras e efeitos desenhados à parte foram substituídos por cenas pequenas, isoladas e sem input, usando **CompleteActorArt, SaberAttack, KineticCharge, EnergySaber, HunterCombat, AstralCombat e XenobinderCombat**. O Hollow de demonstração usa a apresentação existente.

- Guerreiro: dois básicos reais, carregamento e onda cinética.
- Hunter: projéteis do kit, carregamento e feixe perfurante real.
- Astral: projétil e campo raster do elemento demonstrado; replays manuais alternam os quatro elementos.
- Domador: básico que marca o alvo, assistência da criatura, investida e pulso de recuperação de um aliado ferido de demonstração.

Cada demonstração dura até 5,6 s, termina, esconde alvo/efeitos e adormece seu loop. A câmera **somente do mostruário** enquadra o ataque e volta ao retrato; a câmera da campanha não muda. Recurso, HP e limites do palco são temporários para mostrar o kit. Não se trata de uma arena jogável nem de uma alteração no balanceamento.

As cenas carregam apenas o traje inicial da apresentação exibida e os efeitos necessários. Aliases de vestimentas compartilham a mesma imagem nesse contexto sem equipamento; não são carregadas as outras proteções para o mostruário. Cenas e texturas são destruídas ao sair/trocar apresentação. Áudio/input desativados; não recebem nome digitado, ações, progresso, rede ou saves do jogador. A criação duplicada de prévias ao selecionar uma classe também foi removida.

## Verificações

O QA de personagens verifica 3.072 combinações e agora compara os pixels da cabeça entre as quatro poses de cada vista, incluindo equipamento misto. Assim, quadro não vazio/escala constante não bastam para aprovar um capacete que desaparece.

Evidências técnicas em [qa](qa/) e [preview-qa](preview-qa/). O teste específico executa os componentes reais, observa básico/carregamento/soltura, feixe, onda, campos, estados da criatura e recuperação; também confere fim das demonstrações e limpeza do seletor.

- **Automação passou:** 3.072 combinações com igualdade local/remoto e cabeça estável; movimento, básico, Dash e segurar/soltar Q reais nas quatro classes; quatro resoluções, touch emulado e gamepad mock. Zero erros JS/assets e warnings de browser nesses relatórios.
- Três mortes/respawns por classe sem crescimento das contagens monitoradas de objetos, texturas, tweens e listeners. Um atlas equipado por ator.
- Oito demonstrações (classe/apresentação), quatro campos Astrais, pulso e recuperação da criatura; escrita de nome com acentos durante a prévia. Fim das demos com loop adormecido e alvo oculto. Três entradas/saídas do seletor destroem os quatro motores e conservam os listeners do jogo; excluem-se somente os interceptadores identificados do próprio Playwright. Baseline coletada após terminar o carregamento da cena principal.
- Amostra individual na Floresta: **53,45 FPS**; 386 objetos, 207 texturas, 24 tweens, um atlas de ator. É uma amostra de Chrome automatizado, não benchmark completo nem promessa de 60 FPS. Os mesmos 24 PNGs de runtime permanecem inalterados. Atlas composto 768×1536, aproximadamente 4,5 MiB RGBA por ator; bake somente na troca de roupa.
- O mostruário usa até quatro pequenas cenas Canvas, 30 FPS durante demonstração e loops adormecidos em repouso. Descarrega cenas/texturas na saída. Não adiciona entidades na campanha.

**Typecheck e build passaram.** A [regressão compilada](production-qa/report.json) passou: criar Astral com nome, escolher dificuldade, pular a abertura existente e entrar diretamente na campanha; navegação de menu com gamepad mock, touch emulado e entrada oficial sem criar personagem automaticamente. Zero erros JS/assets. Relay público e campanha cooperativa longa não foram revalidados nesta manutenção; a comparação local/remoto foi feita no QA visual. O aviso conhecido de chunk grande do Phaser permanece.

## Limites e avaliação humana

Continuam dois apoios pintados e oito orientações, com variações de silhueta entre ilustrações. O registro reduz oscilações de tamanho, mas não produz uma animação final com intermediários. Misturas extremas ainda podem mostrar transições na roupa ou diferenças de empunhadura; algumas pontas de arma ficam limitadas pela célula existente. Nenhum teste automático comprova anatomia/fluidez perfeita.

O mostruário não reproduz dificuldade, upgrades ou uma luta completa. Durante a demonstração há enquadramento próprio para caber o kit na carta. Não modifica câmera, habilidades ou inimigos da campanha.

**Playtest humano necessário:** caminhar/atacar enquanto gira a mira, usar Q, trocar capacete sem trocar torso, conferir frente/costas/diagonais, masculino/feminino e comparar seletor/campanha. QA touch/gamepad emulado não equivale a dispositivo físico. A pendência histórica da campanha cooperativa longa não é declarada resolvida por esta manutenção visual.
