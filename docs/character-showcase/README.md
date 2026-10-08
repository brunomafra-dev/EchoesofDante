# Mostruário de personagens · 0.1.69

Abra a mesma URL do jogo e escolha **PERSONAGENS → CRIAR NOVO**. Guerreiro e Star Hunter aparecem em bases iluminadas; os dois espaços adicionais são **Manipulador Astral — Em breve** e **Espaço futuro — Em breve**. Não são classes jogáveis.

## Experiência

1. Selecione uma classe: a ilustração apresenta ataque, Dash e carga/disparo em uma demonstração de aproximadamente 3,8 segundos.
2. Digite o nome e comece a expedição. Trocar a classe preserva o nome digitado; Enter também confirma o formulário pronto.
3. Na lista de personagens salvos, selecionar apenas mostra a prévia. **CONTINUAR JORNADA** confirma a troca. Voltar mantém o personagem atual.

Há até seis personagens locais, com jornadas independentes. O Guerreiro anterior e sua chave de save continuam preservados. Criar novo fica visível no cabeçalho; ao atingir o limite, fica desabilitado com explicação. Um bloqueio de dupla ativação impede dois perfis durante o mesmo carregamento. Ao criar/trocar, um marcador de sessão consumido uma vez inicia a jornada diretamente após o reload. Reabrir a URL depois apresenta o menu habitual. Se sessionStorage estiver bloqueado, o menu inicial continua disponível.

## Apresentação e custo

`CharacterSelection` monta a interface DOM; `CharacterShowcase` reproduz os atlas ilustrados existentes em Canvas 2D. Luz superior, base e sombra usam CSS/composição local. Não há segunda instância Phaser, simulação de dano, novos assets ou sons no menu.

- Até dois canvas simultâneos na criação, um na seleção de personagens salvos.
- Resolução lógica 320×360, DPR limitado a 2; até aproximadamente 3,5 MiB de buffers dos dois canvas, além das imagens compartilhadas.
- Atlas de corpo, braços, luvas e armas carregados uma vez e reutilizados. Metadados do rifle são carregados quando necessários.
- Só a classe selecionada anima; pintura limitada a 30 FPS durante a demonstração. Ao terminar, permanece estática. Trocar de página/fechar cancela o RAF; callbacks de carregamento respeitam o descarte.
- Preferência por movimento reduzido impede autoplay, com repetição manual opcional.
- Teclado (Tab/Enter), d-pad/A e touch utilizam os mesmos botões. O nome usa o campo nativo; não há teclado virtual próprio para gamepad.
- Landscape 844×390 mantém nome, confirmação e Voltar visíveis; portrait usa duas colunas e rolagem do menu. Safe areas preservadas.

As animações são demonstrações visuais do kit, sem precisão de alcance/tempo de gameplay nem alvo fictício. A navegação, HUD, áudio, inimigos e mapas mantêm a implementação existente.

## Dash do Hunter

Passo de fase passa de 175 para **240 ms**, mantendo velocidade 760 e recarga base **1450 ms**. Distância em campo livre com input normalizado: aproximadamente **182,4 unidades**, contra 133 anteriores (+37%). Guerreiro permanece em 175 ms/1700 ms. Aperfeiçoamentos de duração continuam acrescentando 20 ms por nível; colisões e direção de movimento/mira usam o sistema existente, também no ator cooperativo.

A invulnerabilidade acompanha o Dash e mantém sua margem de 80 ms; portanto o Hunter também ganha 65 ms nessa janela. Não houve aumento de velocidade nem alteração de ataque, feixe, HP ou Momentum.

## Verificação

- Typecheck e build passaram; permanece o aviso já existente do bundle Phaser acima de 500 kB.
- [QA do mostruário](qa/report.json): quatro espaços, nome, sequência finita, criação direta, dupla ativação, prévia sem trocar save, confirmação, reaberturas estáveis, movimento reduzido, teclado, gamepad mock, touch emulado e seis viewports. Integração controlada do Dash confirma distância, duração, recarga, upgrade e interrupção por obstáculo.
- [Menu e saves](qa/menu-regression/report.json): XP legado, perfis independentes, Eco, pausa/relógio/cancelamento de carga, volumes, touch e gamepad mock.
- [Hunter](qa/hunter-regression/report.json): disparo/dano, cobertura, Momentum, hold/release do feixe, XP, Dash, morte/respawn, gamepad mock e touch emulado. Amostra ~60 FPS.
- [Jornada](qa/journey-regression/report.json): Forest → Echoes → passagem → Cavern → First Echo → Warden → Vale, combate, três respawns estáveis, armazenamento corrompido/indisponível e inputs emulados. Amostra ~58,7 FPS, 149 objetos/3 tweens estáveis no Vale.
- [Cooperativo](qa/coop-regression/report.json): dois Chrome com relay local, Hunter anfitrião e Guerreiro visitante; combate, carga, Dash, cancelamento, XP e separação dos saves.

Não houve teste físico de iPhone ou gamepad nesta etapa. Conferir conforto e apresentação em aparelhos reais; avaliar visualmente a demonstração e o alcance adicional do Hunter. Classes futuras, login e novos sistemas de combate não fazem parte desta atualização.

### Capturas

- [Criação desktop](qa/creation-1280x720.png), [mobile landscape](qa/creation-844x390.png), [portrait](qa/creation-390x844.png).
- [Personagens salvos](qa/saved-characters.png), [Hunter demonstrando o rifle](qa/hunter-attack.png).

```text
node scripts/qa-character-showcase.mjs
node scripts/qa-menu-characters.mjs docs/character-showcase/qa/menu-regression
node scripts/qa-star-hunter.mjs docs/character-showcase/qa/hunter-regression
node scripts/qa-dante-journey.mjs "http://localhost:5184/?qa=play" docs/character-showcase/qa/journey-regression
node scripts/qa-coop-warrior.mjs docs/character-showcase/qa/coop-regression
```
