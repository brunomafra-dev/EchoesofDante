# Animação das criaturas e orientação em português — 0.1.36

## Problemas corrigidos

- Skitter e Spitter usavam uma imagem única girada pelo ângulo da mira. A anatomia lateral rolava junto da direção, inclusive de cabeça para baixo; o pequeno pulsar de escala não comunicava passada.
- Os textos do jogador estavam em inglês, o objetivo só aparecia depois de 3/3 e a transição fissura → mecanismo não identificava claramente o próximo local.

## Movimento e postura

Dois atlas pintados preservam a identidade das criaturas aprovadas. Cada um tem oito poses: repouso, quatro passadas, preparação, ataque e reação ao dano. Os quadros de passada avançam pela distância **realmente percorrida**, não pelo tempo nem pela intenção de velocidade. Ao encostar em uma barreira sem se deslocar, a criatura para de caminhar visualmente.

O corpo permanece de pé: a orientação lateral usa espelhamento horizontal; telegraph, projétil e investida continuam usando o ângulo de combate real. O ponto de contato das patas é normalizado a y=244 em cada quadro de 256px, com a mesma sombra no chão. Não há rotação integral do corpo, bob de flutuação ou loop de criação de objetos. Preparação e disparo/investida possuem poses próprias; dano usa a pose de reação.

Os oito quadros são poses de ação, **não oito vistas direcionais**. Para movimento vertical, conserva a última orientação lateral válida. Um conjunto completo de vistas é uma possível melhoria futura, após playtest. IA, detecção, velocidade, HP, dano, cooldowns, XP e colisão permanecem os mesmos.

## Português e orientação

HUD, objetivos, descobertas, morte, nível, nomes das regiões, controles touch, dicas de hold/drag/release e títulos de página passam a português. O nome próprio **Echoes of Dante**, identificadores internos e nomes de botões físicos do gamepad permanecem.

Um painel curto, visível desde a primeira entrada, informa o próximo passo, o local relevante e sua direção relativa. Próximo do local, uma etiqueta ambiental identifica o objeto e mostra `[E] INVESTIGAR`, `[A] INVESTIGAR` ou o botão INVESTIGAR do touch.

1. **Investigue os Ecos 0/3:** indica o vestígio ainda não descoberto mais próximo e a luz/inscrição que o distingue. Qualquer ordem continua válida.
2. **Siga o sinal ao norte:** depois de 3/3, identifica a fissura ancestral.
3. **Ative o mecanismo:** investigar a fissura revela o próximo passo e identifica a estrutura ao lado. Um único pulso violeta reutiliza o objeto existente enquanto o mecanismo está pronto.
4. **Entre na caverna:** a orientação só apresenta a passagem como aberta depois da remoção do bloqueio; mostra que a entrada acontece caminhando.
5. Na Cavern, indica o sinal no desabamento, o túnel profundo, a saída para o exterior e o fragmento.

Ao investigar o mecanismo antes da sequência correta, aparece uma resposta curta: primeiro os três Ecos, ou primeiro a fissura, conforme o estado. Não altera condições de abertura, recompensas, lore ou interações. A descoberta e o combate continuam livres; não há tutorial obrigatório, cutscene, minimapa ou sistema de quests.

Os controles touch conservam gestos, captura, safe areas e proteção contra zoom/scroll. Somente os rótulos e a quebra de linha das dicas mudam. O laboratório de rochas também recebe rótulos em português; continua isolado.

## Assets e geração

[Prompts completos e fontes](art-sources.json). Ferramenta utilizada: **imagegen integrada**, com os PNGs anteriores como referência de identidade. `scripts/prepare-creature-motion.py` recorta as células e normaliza escala/contato offline; não desenha nova anatomia nem gera arte em runtime.

| Asset salvo | Atlas | Quadros | Tamanho |
| --- | --- | --- | --- |
| `public/assets/visual/characters/dante-skitter-motion.png` | 1024×512 | 8 de 256×256 | 526.585 bytes |
| `public/assets/visual/characters/dante-spitter-motion.png` | 1024×512 | 8 de 256×256 | 547.793 bytes |

Phaser carrega os atlas com `load.spritesheet`. O runtime troca o quadro de uma Image já existente por criatura. Os PNGs de referência originais são preservados. O cenário continua baked/cacheado.

## Verificação

```powershell
npm run typecheck
npm run build
node scripts/qa-playtest-readability.mjs http://localhost:5176/
node scripts/qa-cavern-exterior.mjs http://localhost:5176/ docs/playtest-readability/regression
node scripts/qa-cavern-exterior-combat.mjs http://localhost:5176/ docs/playtest-readability/combat
node scripts/qa-cavern-exterior-production.mjs http://localhost:5175/ docs/playtest-readability/production
```

**Automação passou.** [Verificação específica](checks.json): postura nas oito direções, quatro passadas, parada visual contra limite, preparação/ataque/dano, sequência guiada 0/3 → fissura → mecanismo → entrada, tentativas fora de ordem, português, limites do HUD e interação touch. Resoluções: 1280×720, 1366×768, 1920×1080 e 844×390; orientação portrait emulada também verificada.

[Regressão completa](regression/measurements.json): Forest → Ecos → passagem → Cavern → Deep Cavern → profundezas → exterior; retorno, ataques, mortes, XP, projétil bloqueado/esquivado, Dash, checkpoints, não duplicação de XP, gamepad mock, touch emulado e três reinícios estáveis. O teste usa setup DEV e eventos de entrada reais, com invulnerabilidade apenas na travessia sem limpeza de inimigos.

[Combate misto](combat/combat-checks.json): sabre, onda, mortes dos três tipos e 45 XP; IA ativa. [Produção](production/production-checks.json): os novos atlas carregam sem erros e o hook DEV está ausente. Não há `npm test` configurado; esses scripts usam o Playwright/Chrome já disponível.

Zero erros JavaScript/carregamento nas execuções. Typecheck e build passaram, mantendo o aviso anterior de tamanho do chunk Phaser. Aproximadamente **60,2 FPS** na exploração e **59,6 FPS** com combate ativo em Chrome headless nesta máquina. A cena completa estabiliza em 182 objetos raiz, 7 RenderTextures, 59 chaves de textura e 4 tweens ambientes, sem crescimento contínuo nos reinícios.

## Capturas e teste humano

[Início](inicio-pt.png) · [Eco próximo](eco-pt.png) · [Fissura → mecanismo](fissura-pt.png) · [Criaturas apoiadas](criaturas-apoiadas.png) · [Touch](touch-pt.png).

**Playtest humano necessário.** As capturas foram inspecionadas, mas não houve teste físico de iPhone/gamepad nem avaliação de um jogador novo nesta correção. O objetivo do teste com o amigo é verificar se ele consegue encontrar/investigar os três Ecos e abrir a passagem sem instruções externas, e se reconhece passada/preparação/ataque dos novos inimigos.

Perseguição direta sem pathfinding continua sendo uma limitação: criaturas podem prender-se em obstáculos. As pistas indicam direção do local, não calculam uma rota navegável. Não houve alteração na geometria, combate do Player, progressão, câmera ou áudio.
