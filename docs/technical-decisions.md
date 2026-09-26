# Decisões técnicas — Sprint 01

- **Phaser 3 + TypeScript + Vite:** o repositório estava vazio. A cena única e o loop do Phaser bastam para o protótipo 2D de navegador.
- **Responsabilidades pequenas:** `Controls` lê input; `Movement` resolve limites e rochas; `SaberAttack` usa `HitDetection`; `Damage` aplica dano em `Health`; entidades cuidam de estado e apresentação; `GameScene` coordena a ordem do loop e efeitos.
- **Acerto do sabre:** teste geométrico de distância e ângulo com raio do alvo. O clique dispara no evento `pointerdown`, evitando perder cliques curtos entre frames. Segurar o botão repete apenas após o cooldown.
- **Dash:** velocidade fixa por um intervalo curto, direção do input ou da mira, cooldown e invulnerabilidade durante o deslocamento e por 80 ms adicionais.
- **Crawler:** máquina de estados pequena (`IDLE`, `DETECT`, `CHASE`, `ATTACK`, `HURT`, `DEAD`). A preparação do ataque é marcada por um círculo. Entidades mortas saem da lista ativa e seus objetos visuais são destruídos após o efeito.
- **Arte e áudio:** formas vetoriais desenhadas em runtime evitam dependência de arquivos pesados. Web Audio gera sinais curtos; se o navegador bloquear áudio, o combate visual continua.
- **Câmera:** acompanha o jogador com interpolação e respeita os limites da arena; o mouse é convertido de coordenadas da tela para o mundo antes de calcular a mira.
- **Teste de navegador:** um smoke test local com Chrome headless verificou WASD, dash/cooldown, acerto, dano recebido, morte, respawn e remoção de inimigo. O teste usou teleporte e redução de HP apenas para alcançar estados específicos rapidamente. Não substitui avaliação humana de sensação de jogo.

## Sprint 01.5 — arte e game feel

- O visual continua procedural e usa `Graphics` e formas do Phaser. Isso evita arquivos grandes e mantém a arte substituível sem tocar em hitboxes.
- A floresta tem solo, clareira e marcas antigas no fundo; vegetação, minerais e estruturas no meio; entidades e efeitos no plano de combate; luzes ambientais discretas em primeiro plano. Algumas copas balançam por tween.
- Galactic Warrior e Hollow Crawler ganharam silhuetas distintas, detalhes de traje/biomecânica e estados visuais. Suas posições, raios de colisão, IA e regras de combate não mudaram.
- O sabre agora usa uma trajetória com núcleo claro e borda suave. Acertos geram flash, quatro faíscas curtas e número de dano; a morte do Hollow inclui colapso e poucos fragmentos. O dash ganhou um marcador de término.
- HUD mantém as informações existentes em painéis compactos. O canvas permanece em 1280×720 e escala com `Phaser.Scale.FIT`.
- Smoke test local em Chrome headless passou em 1280×720, 1366×768 e 1920×1080, sem erros de JavaScript. Em 1280×720 também verificou WASD, mira, ataque, dano, dash, morte, respawn pelo botão e pela tecla R, e remoção do inimigo. A medição pontual do loop foi de cerca de 49 FPS no ambiente headless; ela não representa FPS garantido em outras máquinas.
