# Echoes of Dante

## Fundação do RPG — plano aprovado

[Plano de implementação e checklist](docs/RPG_FOUNDATION_ROADMAP.md): personagens modulares, equipamentos visíveis, inventário, base de pouso, economia, Astral, Vinculador, cooperativo de quatro jogadores e prólogo. **Etapa 0 concluída; próxima entrega: personagens modulares.** As funcionalidades futuras estão identificadas como planejadas.

## Expedição glacial · 0.1.76

A **Fratura Boreal** agora continua pelas **Galerias do Degelo**, com desvios e grupos glaciais, até o **Ninho da Geada** e o boss original **Vésper, o Sopro Branco**. Três fases, quatro padrões anunciados, checkpoint próximo e recompensa única de XP/aperfeiçoamento. Investigue o registro da Fratura e entre pelo portal da extremidade. As novas salas integram a campanha cooperativa desde a versão 0.1.78.

Também corrigida a captura de teclado que impedia letras como A e L no nome do personagem. [Arte, fluxo, testes e limitações](docs/glacier-expansion/).

**Campanha cooperativa e equipamento · 0.1.78:** todas as regiões e os três bosses aceitam a dupla. Nove itens, coleta compartilhada e slots pessoais de arma/armadura/acessório em **MENU → EQUIPAMENTO**. [Detalhes, QA e atualização do relay](docs/campaign-equipment/README.md).

**Playtest direto:** [galerias](https://echosofdante.vercel.app/glacier-playtest.html) ou [boss](https://echosofdante.vercel.app/glacier-playtest.html?area=icenest). Guerreiro/Hunter temporários no nível 6, com reinício pelo menu OPÇÕES; sua campanha permanece intacta.

Repositório: https://github.com/brunomafra-dev/EchoesofDante

## Personagem do convite e saída da sala · 0.1.75

Abrir um convite mostra seus personagens antes de conectar: escolha um existente ou crie outro e confirme **ENTRAR NA SALA**. Se o dono encerrar/sair, o visitante recebe um menu **Sala encerrada**, com **INICIAR JOGO SOLO** e **VOLTAR AO MENU**. O retorno restaura a própria jornada e conserva o XP da dupla. [Fluxo e verificações](docs/regional-coop/).

## Salas públicas · 0.1.74

A API da Vercel utiliza o serviço `echoes-of-dante-rooms.onrender.com` publicado pelo responsável, sem exigir outra configuração manual. Convites mantêm o fluxo **criar → enviar link → abrir e jogar**. Dois perfis Chrome validaram convite, entrada automática, snapshots/movimento e saída pela URL pública com Render real. Desenvolvimento local continua com jogo/salas no mesmo processo. [Hospedagem, verificações e limitações](docs/regional-coop/).

## Convide um amigo por link · 0.1.73

**JOGAR COM AMIGO → CRIAR SALA E CONVIDAR → COPIAR LINK DE CONVITE**. Quem recebe abre o link e entra; a dupla começa automaticamente. Criação de personagem mantém o convite, código continua como alternativa e seu progresso solo é preservado. Integração da URL Vercel com serviço central preparada, com configuração somente na hospedagem; **ativação pública ainda pendente**. [Fluxo, publicação e testes](docs/regional-coop/).

## Cooperativo sem configuração de servidor · 0.1.72

`npm run dev` inicia jogo e salas juntos. No menu: **CRIAR SALA → COPIAR CÓDIGO**; seu amigo abre a mesma URL e usa **ENTRAR NA SALA**. Não há endereço de servidor para preencher nem segundo comando. A build também pode ser servida junto com as salas por `npm start` após o build; hospedagem pública precisa aceitar WebSocket. [Instruções e testes](docs/regional-coop/).

A dupla pode viajar sem encerrar a sala. O visitante mantém o XP ganho em sua jornada própria, sem copiar a campanha do anfitrião. Reconexão automática, código copiável, estado do menu e resistência moderada para encontros em dupla. A limitação anterior a **Vale ↔ Siroco ↔ Dunas** foi removida em 0.1.78: cavernas, gelo e bosses também integram a sala. [Como jogar, limites e testes](docs/regional-coop/).

## Mostruário de personagens · 0.1.70

**PERSONAGENS → CRIAR NOVO** apresenta Guerreiro e Star Hunter em um mostruário iluminado, com demonstrações curtas do kit, escolha de nome e dois espaços futuros. Personagens salvos possuem prévia antes de confirmar a jornada. O Dash do Hunter agora alcança aproximadamente 37% mais distância, preservando a recarga. [Apresentação, capturas e testes](docs/character-showcase/).

A prévia agora permite **excluir personagens com confirmação**, inclusive o último, preservando as demais jornadas. O Hunter aparece de frente para o jogador na criação e na seleção.

Protótipo de action RPG sci-fi para navegador. O jogador explora Dante Forest, combate Hollows e investiga três Echoes. Depois de sincronizar os sinais, pode ativar a passagem antiga, explorar a Cavern e seguir o sinal além do desabamento. A direção Organic Sci-Fi segue a [Art Bible](docs/art-bible/).

A [World Shape Language](docs/WORLD_SHAPE_LANGUAGE.md) complementa a Art Bible com regras de massas, silhuetas e composição ambiental. É uma base documental para um futuro microprotótipo visual da Cavern; não altera o jogo atual.

O [Visual Prototype 02](docs/visual-prototype-02/) registrou o experimento que testa uma formação orgânica de cerca de 180×170 unidades na primeira Cavern, em (885, 595). A representação geométrica foi rejeitada no playtest; o experimento permanece como controle no laboratório.

O [Visual Rendering Prototype 01](docs/visual-rendering-prototype-01/) compara Graphics, raster, ilustração e composição híbrida em uma única rocha. Abra `/rendering-lab.html` na mesma build web para ver o laboratório isolado. O usuário aprovou **D — Hybrid** como referência: assets ilustrados, materialidade, sombra de contato e integração ambiental. A aplicação ao mundo será incremental, preservando Organic Sci-Fi R3 e gameplay.

## Expansão 04 — Bacia do Siroco · 0.1.53

Depois de concluir a Escarpa da Ressonância, o jogador recebe **MISSÃO CONCLUÍDA** e atravessa um portal para uma área árida independente. A Bacia do Siroco tem terreno, habitantes e relé ancestral próprios; dois novos arquétipos usam a IA, o combate, o bestiário e o XP existentes. A expedição pode ser interrompida e retomada pelo portal, com progresso salvo no navegador. [Visão geral, arte e QA](docs/expansion-sprint-04/).

## XP dos habitantes do Siroco · 0.1.55

Cada criatura derrotada concede **15 XP**, indicado por um texto curto sobre ela. Os habitantes retornam após **90 segundos**, quando o Guerreiro estiver a pelo menos **480 unidades** do habitat; o intervalo persiste após recarga, morte e travessia do portal. Assim, criaturas reaparecidas continuam recompensando a luta sem surgir ao lado do jogador.

## Feedback contextual de XP · 0.1.57

Todo ganho de XP — derrotas, Ecos e descobertas de rota — agora aparece como `+XP` flutuante junto ao inimigo, Eco ou ponto que concedeu a recompensa. A notificação fixa no centro foi removida; o total e a barra continuam no HUD compacto.

## Progressão e especializações · 0.1.54

O limite agora é **nível 10**. Os níveis 4, 6, 8 e 10 concedem uma escolha entre aperfeiçoar Sabre, Dash ou Carga Cinética; cada opção tem dois graus e modifica uma propriedade do kit existente. Saves anteriores são mantidos e recebem pontos compatíveis com o XP atual. [Regras, compatibilidade e QA](docs/progression-specializations/).

## Expansão 05 — Margem Leste da Bacia do Siroco · 0.1.58

A Bacia continua até uma margem oriental com piso ilustrado próprio e um desvio opcional na Prateleira das Agulhas. Mapear o relé aponta o sinal para leste. A rota opcional concede 20 XP uma vez pelo mesmo feedback flutuante usado nos demais ganhos. Habitantes podem ser contornados, e o checkpoint preserva a progressão local. O destino do portal foi ampliado na atualização seguinte. [Arte, fluxo e QA](docs/expansion-sprint-05/).

## Dunas Interiores e trilhas regionais · 0.1.59

O portal oriental do Siroco agora avança para **Dunas Interiores**: terreno aberto, dois desvios opcionais, sete habitantes, ruínas soterradas e uma depressão de areia que prepara um encontro futuro. Investigar as ruínas registra um checkpoint seguro; o retorno à Bacia fica no portal de entrada. Nenhum novo boss foi implementado.

Todas as regiões possuem música própria: nove composições instrumentais originais de **120–173 segundos**, com frases espaçadas e transições suaves. [Composição, assets e validação](docs/sirocco-interior-and-sound/).

## O Soterrado · 0.1.60

Na depressão das **Dunas Interiores**, use **DESCER** para entrar na Bacia Soterrada. O novo boss escavador tem duas fases, quatro ataques anunciados no solo e janelas para Sabre/Carga Cinética. Morrer reinicia somente a tentativa, na entrada segura da bacia. Vencer concede **180 XP + um ponto extra de aperfeiçoamento** do kit atual, uma vez; a passagem exposta revela uma leitura de frio ao norte. A região gelada ainda não é jogável. [Arte, música, regras e QA](docs/soterrado-boss/).

## Escavação do Soterrado · 0.1.61

O Soterrado agora emerge de um buraco ilustrado na apresentação e no ataque de emersão. Borda de areia, corpo parcialmente oculto e poeira breve tornam a escavação visível, preservando os tempos, o dano e o alvo fixado do encontro. [Vídeo, assets e validação](docs/soterrado-boss/burrow-pass/).

## Orientação visual · 0.1.62

Minimapa local e seta discreta indicam a aproximação ao próximo ponto da jornada. O terreno é revelado conforme a exploração; M ou MAPA recolhe o painel. O guia considera as colisões existentes, preservando as condições de descoberta e o combate. [Funcionamento e QA](docs/navigation-foundation/) · [Sequência das próximas etapas](docs/next-adventure/).

## Expedições em dupla · 0.1.66

MENU → **COOPERATIVO · 2 PESSOAS** permite criar/entrar em uma sala por código; as salas usam automaticamente o servidor do jogo. Guerreiro e Star Hunter podem explorar, combater e investigar juntos nas regiões abertas, com estado simulado pelo anfitrião. A campanha solo do visitante fica preservada e recebe somente o XP ganho na visita. Vale, Siroco e Dunas mantêm a mesma sala nas travessias; chefes e cavernas de campanha permanecem solo. [Como jogar, publicar o serviço e limites reais](docs/regional-coop/).

## Hunter: mira, carga e corpo inteiro · 0.1.68

O Q/LT/FEIXE agora dispara luz instantânea através dos inimigos alinhados, com dano base de 90–137, respeitando obstáculos sólidos. Mantém segurar → mirar → soltar e a recarga existente. Corpo e pernas agora usam poses inteiras ilustradas; rifle e braços acompanham a mira independentemente. O Q mostra prontidão, anel de carregamento, porcentagem e recarga; Momentum fica separado. Cano, projéteis e feixe permanecem alinhados em todas as direções. A apresentação também é sincronizada no cooperativo. [Kit, arte e QA](docs/star-hunter/).

## Entrada e personagens · 0.1.63

Tela inicial sem login, menu Esc/MENU/Start e volumes geral, música e efeitos. Escolha ou crie personagens com progressos locais independentes; o Guerreiro existente conserva seu save. A classe disponível nesta etapa é Guerreiro Galáctico. [Funcionamento, compatibilidade e QA](docs/menu-and-characters/).

## Stack

A [referência jogável de qualidade](docs/quality-reference/) isola a primeira câmara da Cavern em `/quality-reference.html`: ambiente pintado contínuo, apresentação articulada do Hollow e impactos curtos. Os botões **Warrior novo / Warrior anterior** comparam o [Guerreiro pintado 0.1.48](docs/warrior-quality-reference/) no mesmo cenário; **Câmara original** conserva a comparação ambiental. O Guerreiro novo também está aplicado ao jogo principal, conforme autorização do usuário. O laboratório não altera o progresso local.

A [correção de chão, escala e oclusão](docs/environment-cohesion/correction/) mantém a linguagem D e os dados físicos, com solo contínuo na Cavern, monumentos mais baixos e transparência de formações que escondem o Guerreiro. Os comparativos registram a tentativa anterior rejeitada e esta revisão para playtest visual.

A [revisão de integração ambiental 0.1.41](docs/environment-cohesion/grounding-revision/) acrescenta transições suaves de sedimento nas caches existentes e troca os limiares frontais por apoios baixos, com abertura transparente. A oclusão considera a pintura visível, preservando a opacidade quando o Guerreiro está no vão. Física, controles e gameplay permanecem; a aprovação perceptual depende do playtest.

- TypeScript, Phaser 3 e Vite
- PNGs pintados em `public/assets/visual/characters/` para personagens e em `public/assets/visual/environment/` para cenários; composição estática baked/cacheada
- Loops musicais autorais de protótipo em `public/assets/audio/`; efeitos curtos são sintetizados com Web Audio
- Barlow Condensed e DM Sans carregadas via Google Fonts, com fallback local
- Progresso local no navegador; sem backend ou multiplayer

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

A [integração da linguagem D nos ambientes](docs/environment-art-pass/) aplica texturas pintadas a Forest, Cavern e área profunda: pedra, raízes, minerais, vegetação e bases antigas, com comparativos antes/depois. Cenário estático continua baked, e os mesmos colisores, rotas, interações e sistemas de gameplay permanecem. A nova aplicação ainda precisa de playtest visual humano.

A [passagem de arte do Warrior e Hollow](docs/character-art-pass/) aplica o tratamento pintado aprovado no cenário aos personagens. Preserva o Warrior em pé, as duas mãos no sabre e os rigs existentes. Os comparativos incluem oito direções de mira, caminhada, ataque, carga e Dash; a aprovação visual desta passagem depende do playtest do usuário.

A [expansão Deep Cavern](docs/expansion-deep-cavern/) transforma o antigo bolso profundo em uma região curta com descida, bifurcação, bacia mineral, dois Hollows adicionais, estrutura ancestral e indicação de continuação. Usa a pintura D aprovada, permanece conectada à mesma Cavern e não exige limpar inimigos. Depois de entrar, o respawn usa um ponto seguro no início da região.

A [Expansion Sprint 02](docs/expansion-sprint-02/) continua esse túnel por habitats de Skitters, Spitters e Crawlers, com um desvio mineral e uma subida para um exterior rochoso iluminado. Um fragmento investigável sugere uma resposta de transmissão. Nenhuma passagem exige eliminar inimigos.

A [preparação para o Warden](docs/warden-preparation/) acrescenta o **Primeiro Eco** logo além do arco exterior. Um arquivo ancestral contém uma assinatura humana já registrada, sem data ou origem legíveis. Sua resposta acende inscrições até um limiar monumental. A sequência mantém o controle, não concede XP e permanece registrada após respawn.

O [Warden](docs/warden-boss/) ocupa uma nova área **depois do limiar do guardião**. Investigar e atravessar a passagem leva à sua bacia mineral. O primeiro boss possui três fases, cinco padrões com avisos e janelas de recuperação, retorno seguro após morrer e uma transmissão fragmentada após a vitória. Usa as armas, controles e progressão existentes; a recompensa é narrativa.

Após a vitória, o portal do sinal leva ao [Vale da Ressonância](docs/resonance-valley/). A [Expansão 03](docs/expansion-sprint-03/) prolonga essa mesma travessia até a Escarpa da Ressonância: um desvio em duas rotas, novos encontros com os habitantes do Vale e uma resposta que aponta para além de Dante. Não exige limpar inimigos; o progresso e o checkpoint local persistem. O caminho oriental marca o limite atual, não o fim do mundo.

Os nomes acima das criaturas usam o estilo aprovado no vale: Rastejante Hollow, Saltador e Cuspidor também são identificados ao preparar um ataque ou receber dano. O Warden possui nome sobre o corpo durante o encontro, além de sua barra existente. Textos acompanham a posição sem girar com a criatura e desaparecem na morte.

## Jornada persistente e expedições — 0.1.45

A [revisão de HUD 0.1.46](docs/hud-clarity/) reduz painéis, bordas e textos permanentes. Vida/progresso ficam compactos no canto; ganho aparece apenas como `+20 XP`. A ajuda inicial desaparece após 10 segundos e permanece consultável em Registros → Controles. O objetivo preserva uma indicação local curta, com recargas e avisos do Warden legíveis.

O progresso é salvo automaticamente **neste navegador**: XP, nível, especializações escolhidas, Ecos, passagens, Primeiro Eco, vitória sobre o Warden, exploração do Vale e bestiário. Reabrir a mesma URL retoma a região em seu ponto seguro, com a vida registrada. Morrer continua restaurando a vida no respawn. A posição exata, vida dos inimigos e ataques em andamento não são salvos; um Warden ainda não derrotado reinicia seu encontro.

Abra **REGISTROS** pelo botão na tela, **B** no teclado ou **Voltar/Select** do gamepad padrão. A consulta pausa o jogo, registra as seis espécies encontradas e conta suas derrotas. A primeira derrota libera uma observação tática adicional. **NOVO PERCURSO** permite recomeçar após confirmação. Limpar os dados do site remove o save; ele não sincroniza entre dispositivos.

No Vale, a passagem entre cristas, o desvio mineral e a bacia enraizada concedem **20 XP por primeira descoberta**, com bônus único salvo. Saves anteriores conservam visitas e podem receber o bônus ao revisitar. Os doze habitats renovam seus moradores **90 segundos após a derrota**, quando você está a pelo menos **480 unidades** da posição de origem. Reload, morte e travessia do portal mantêm esse intervalo. Cada novo morador derrotado concede os mesmos 15 XP; nenhum trecho exige matar criaturas.

Os níveis 4 e 5 continuam exigindo **360 e 660 XP acumulados**, com **130 e 140 PV máximos**; a progressão atual segue até o nível 10. O HUD mostra quanto falta, ganho de vida e XP recebido. A passagem tem uma criatura isolada, os desvios têm duplas e a margem leste tem um trio, com espaço para contornar e retornar. Depois de conhecer o Vale, o guia indica **EXPEDIÇÃO LIVRE**. [Histórico de progressão e encontros](docs/dante-expeditions/) · [Fundação original do save](docs/dante-journey/) · [Especializações atuais](docs/progression-specializations/).

A [correção de animação e orientação em português](docs/playtest-readability/) mantém os novos inimigos apoiados no chão, com quadros de passada, preparação, ataque e reação. A interface agora usa português e mostra o próximo passo desde 0/3 Ecos, com pistas de direção, identificação próxima dos locais e orientação da fissura ao mecanismo e à entrada. O fluxo continua sem chave, kill count ou recompensa adicional.

## Controles

| Ação | Teclado e mouse | Gamepad padrão | Touch em landscape |
| --- | --- | --- | --- |
| Mover | W A S D | Analógico esquerdo | Controle esquerdo |
| Mirar | Mouse | Analógico direito | Arraste a partir de GOLPE ou CARGA |
| Golpe de sabre | Clique esquerdo; segure para repetir | RT/R2 | Toque GOLPE ou arraste e solte |
| Esquiva do vazio | Espaço | RB/R1 | ESQUIVA |
| Carga cinética | Segure Q; solte para disparar | Segure LT/L2; solte | Segure CARGA, arraste para mirar e solte |
| Investigar quando próximo | E | A/Cross | INVESTIGAR contextual |
| Renascer | R ou botão na tela | Start ou botão na tela | RENASCER |
| Registros / bestiário | B ou botão na tela | Voltar/Select (botão 8 padrão) | REGISTROS |

A entrada ativa muda conforme o dispositivo usado, sem recarregar a página. Gamepad usa o mapeamento `standard` da Gamepad API e deadzone nos analógicos; a mira conserva a última direção quando o analógico direito volta ao centro. A mesma build web é usada em todos os casos; não há aplicativo nativo nem suporte oficial a Xbox ou mobile físico nesta etapa.

No touch, o joystick esquerdo move e os botões da direita controlam o combate, sem joystick permanente de mira. GOLPE dispara uma vez ao soltar: um toque usa a última direção de combate; um arrasto de pelo menos 12 pixels CSS escolhe outra direção e mostra a área aproximada do golpe. CARGA inicia a preparação ao pressionar, permite mirar por arrasto e dispara ao soltar. Sem uma direção touch escolhida, usa a mira já disponível. ESQUIVA conserva a regra existente: direção de movimento ou mira quando parado. INVESTIGAR e RENASCER aparecem apenas no contexto apropriado.

Os gestos capturam o ponteiro até o release, inclusive fora do botão. Cancelamento do ponteiro, perda de foco, mudança de orientação ou método de entrada interrompem a preparação sem disparar a onda. Em portrait, uma indicação pede rotação para landscape; botões respeitam safe areas. O canvas e os controles consomem gestos de zoom/scroll/seleção, incluindo double-tap e pinch; a prevenção não é aplicada ao documento inteiro nem usa `user-scalable=no`.

### Playtest pendente no iPhone

A emulação de touch no Chrome não comprova o comportamento do Safari em hardware real. Na mesma URL, em landscape, verificar: taps rápidos e repetidos; movimento junto com STRIKE arrastado; CHARGE segurado, arrastado e solto; DASH; investigação e respawn; pinch e arrastos verticais sem mudar o zoom ou rolar a página. Girar para portrait durante um gesto deve cancelá-lo e mostrar a orientação de rotação. Conferir também notch e área segura inferior.

## Áudio

A música usa nove composições instrumentais originais para Forest, Cavern, Deep Cavern, Deeper Cavern, Exterior, Vale, Siroco, Dunas Interiores e Warden. Os MP3s estéreo de 120–173 segundos são produzidos **offline** por `python scripts/compose-region-scores.py`, sem samples ou gravações de terceiros. O navegador carrega a faixa da região atual, após um gesto do jogador; não há síntese musical durante gameplay. O `AudioManager` mantém uma voz musical e, somente durante a transição de 1,6 segundo, uma voz de saída. MUSIC e SFX continuam separados, com MASTER/MUSIC/SFX em `src/config/audio.ts`. Os efeitos existentes continuam com Web Audio. Falha de áudio ou bloqueio de autoplay não impedem jogar; a vitória do Warden mantém seu encerramento e silêncio.

## Escopo implementado

- Fundação web multiplataforma: `Controls` traduz teclado/mouse, gamepad padrão e interface touch em movimento, mira, ataque, Dash, Kinetic Charge e investigação. A cena continua a usar as mesmas regras de Player, combate, colisão e progressão.
- The Signal: após o terceiro Echo, os três locais pulsam em violeta e uma fissura antiga no fim da trilha norte começa a emitir sinal. Investigar a fissura revela `SIGNAL SOURCE: BELOW / PASSAGE: SEALED` e torna o mecanismo próximo responsivo.
- The Sealed Passage: investigar o mecanismo depois de 3/3 Echoes faz um sinal violeta percorrer a pedra até a fissura; em seguida as placas se abrem e a colisão é removida. Caminhar pela abertura leva à Cavern. HP atual, XP, nível e Echoes acompanham a travessia; o respawn ocorre na Cavern e conserva o estado da sessão.
- Cavern Depths: a área de aproximadamente 1200×740 unidades possui descida de entrada, bacia mineral lateral, caminho principal, face antiga e um corredor curto até um desabamento visível. Dois Hollow Crawlers habitam zonas diferentes; é possível avançar sem derrotá-los. Aproximar-se da segunda abertura indica que o sinal continua abaixo, sem iniciar outra região ou conceder recompensa.
- The Deep Signal: ao chegar ao desabamento, inscrições violetas acendem e duas placas deslocam-se, revelando uma passagem curta. Além dela há um bolso subterrâneo de cerca de 700 unidades, onde raízes e minerais cobrem uma estrutura antiga parcialmente enterrada. O sinal se intensifica sem conceder XP ou explicar sua origem. A travessia, o ponto de interesse e o retorno não exigem derrotar Hollows; o acesso permanece aberto após morrer na mesma sessão.
- Três Echoes de sessão: ruína norte, sinal mineral a leste e vestígio antigo no desvio oeste. Aproximar-se mostra `[ E ] INVESTIGATE`; cada descoberta exibe um pulso e uma mensagem curta, atualiza o contador e concede 40 XP apenas uma vez por sessão. A mensagem original da ruína permanece.
- Progressão curta: cada Hollow derrotado pela primeira vez em seu ponto de spawn concede 15 XP. Nível 2 aos 60 XP e nível 3 aos 140 XP; cada nível concede +10 de HP máximo e restaura o HP. O HUD mostra nível, XP e Echoes 0–3. Morte/respawn preserva esse progresso; atualizar a página inicia uma nova sessão.
- Kinetic Charge: segurar Q carrega energia sem deslocar o Warrior; soltar lança uma onda de corte ciano/branco na direção atual da mira. Ela começa à frente do Warrior, tem 120 unidades de largura e avança 133 unidades, a distância percorrida pelo Void Dash em terreno livre. Carga de até 800 ms, dano de 50 a 76, recuo de 500 unidades/s e cooldown de 3,2 s. Cada Hollow recebe no máximo um impacto por onda. A carga não concede invulnerabilidade; LMB, movimento e Dash voltam após o gesto de 200 ms, mesmo enquanto a onda ainda avança.
- Energy Saber: a mão principal e a mão de apoio acompanham dois pontos do mesmo cabo no `bodyRig`. O braço de apoio dobra no cotovelo para manter as duas mãos legíveis em todas as direções, sem alterar alcance, arco, dano ou janela do Saber Strike.
- Quatro Hollows, em dois pares, percorrem rotas curtas nas clareiras central e leste. Ao perceber o jogador, usam a perseguição e o combate existentes; ao perder contato, voltam ao ponto inicial e retomam a patrulha. Os demais continuam em seus postos.
- A formação mineral a leste continua emitindo um pulso breve e discreto; o Echo no local adiciona investigação sem interromper o fenômeno.
- First Discovery: estrutura parcialmente soterrada nas ruínas do norte, inscrições, fragmentos e vegetação. Investigar produz um pulso, som opcional e a mensagem temporária “SIGNAL DETECTED / SOURCE: UNKNOWN”. As inscrições permanecem acesas após o respawn na mesma sessão.
- Dante Forest de 2200×1500 unidades: entrada ao sudoeste, trilha principal rumo às ruínas ao norte e desvios para uma árvore maior a oeste e uma formação mineral a leste. Clareiras conectadas, vegetação em camadas e bancos de rochas delimitam o espaço; câmera suave e zoom preservados.
- O solo e os desenhos estáticos da floresta são renderizados uma vez em camadas. Copas e troncos usam PNGs compartilhados; rochas, sombra de contato e raízes pintadas são capturadas nas camadas estáticas. Profundidade e animações existentes foram preservadas.
- Galactic Warrior com capacete destacado, torso, braços e duas pernas visíveis. O corpo permanece ereto em vistas frontal, lateral e traseira; o sabre continua seguindo a mira e as pernas mantêm o ciclo de passos. Sombra, HP, movimento, dash e invulnerabilidade breve permanecem.
- Oito Hollow Crawlers distribuídos em quatro pares ao longo da exploração, com carapaça e membros orgânicos pintados em PNG e núcleo quente. Detecção, perseguição, preparação do ataque, reação ao dano e morte continuam iguais. A entrada fica fora do alcance inicial de detecção.
- Golpe com preparação, varredura e recuperação; arco e trail ligados à posição da lâmina; dano aplicado durante a varredura. Contato curto orientado pelo sabre, contração e recuo visual do Hollow, números de dano, efeito de início/fim do dash, HUD de exploração, sons opcionais e tela de respawn.

## Limitações conhecidas

- O percurso agora continua do Vale até a Escarpa da Ressonância. O sinal aponta além do limite oriental, que permanece fechado para expansão futura.
- O nível está limitado a 5. O save pertence ao navegador/dispositivo, sem conta, nuvem ou recuperação após limpar os dados do site. Quando o armazenamento está indisponível, o jogo continua e os Registros informam a falha.
- A onda usa uma faixa frontal móvel e não tem interação especial com rochas. Seus valores e a naturalidade das poses do braço ainda precisam de avaliação humana em combate.
- HUD e Energy Saber receberam apenas o feedback necessário para a habilidade; sua arte base, Mineral Pulse, First Discovery e parte do terreno ainda são provisórios.
- Touch e gamepad foram validados em emulação de navegador; conforto e compatibilidade em dispositivos físicos ainda exigem playtest. Não há suporte oficial a navegadores de console, builds nativas, remapeamento de botões ou menu de volume.
- Os temas musicais são protótipos instrumentais. Vocal atmosférico, mixagem final e camadas adaptativas de combate/descoberta permanecem para avaliação futura.
- Forest e Cavern mantêm moradores reconstruídos ao reiniciar a cena, com XP único por habitat salvo. Os doze habitats do Vale e da Escarpa têm renovação por intervalo e XP por novo morador.
- Troncos, totens e bases estruturais possuem colisores circulares simples; copas, vegetação baixa, raízes e pequenos detalhes continuam atravessáveis. A classificação e a auditoria estão em [Environmental Collision Audit](docs/ENVIRONMENT_COLLISION_AUDIT.md).
- A IA mantém perseguição direta, sem navegação por caminhos; Hollows podem ficar presos em rochas ao perseguir fora das trilhas.
- A câmera e a arte usam visão superior 2D, sem profundidade isométrica real.
- O ciclo de passos usa transformações de formas 2D; a articulação das botas ainda é simples e precisa de avaliação humana em movimento.
- As fontes web dependem de conexão; o jogo usa fonte alternativa do sistema se não carregarem.
- O build inclui o Phaser em um único bundle grande; o Vite avisa sobre tamanho do chunk, embora a saída seja válida.
- O carregamento inicial ainda precisa preparar as texturas da cena; a auditoria mediu cerca de 1,8 segundo até a cena ficar disponível no Chrome headless testado. A composição em faixas de 100 unidades pode mudar levemente a sobreposição de rochas e pequenos elementos em relação ao desenho original.

## Próximos passos

Fazer playtest físico com gamepad e aparelhos touch em landscape para ajustar ergonomia, legibilidade e mixagem antes de declarar suporte oficial. O desempenho em outra GPU pode ser diferente do Chrome headless medido nos testes.

As decisões técnicas desta sprint estão em [docs/technical-decisions.md](docs/technical-decisions.md).

## Fratura Boreal

A passagem do Soterrado conduz à região gelada. [Arte e QA](docs/frozen-reach/README.md). [Classes oficiais](docs/classes/README.md).

## Star Hunter

Segunda classe disponível no menu de personagens: rifle, Momentum e feixe de luz perfurante. [Kit, arte e QA](docs/star-hunter/README.md).
