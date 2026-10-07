# Orientação visual · 0.1.62

O minimapa local mostra o Guerreiro, terreno explorado durante a sessão e o destino atual do guia. A linha violeta e uma seta discreta perto dos pés indicam uma aproximação; não é necessário interpretar pontos cardeais. M ou o botão MAPA recolhe a visualização. O mapa reduz no celular e respeita as áreas seguras.

O guia mantém as condições originais: Ecos, fissura, mecanismo, desabamento, arquivos, portais e pistas. Nas lutas dos bosses a indicação de exploração é retirada. Nenhum segredo adicional, monstro ou recompensa foi adicionado ao mapa.

`WorldNavigator` usa uma grade de 48 unidades derivada dos limites e círculos de colisão existentes. Calcula um percurso cardinal e aponta para o próximo trecho; não controla movimento nem IA. Alvos dentro de uma estrutura usam a célula acessível mais próxima. É uma aproximação visual, não uma garantia de navegação automática. Mudanças de limites e quantidade de obstáculos atualizam a grade.

Runtime: uma seta Phaser reutilizada e um SVG local com cinco elementos reutilizados. Atualização limitada a cerca de seis vezes por segundo; o SVG só é atualizado quando posição, direção ou destino mudam. Sem Graphics do cenário redesenhados, novas texturas ou tweens. O relevo real é mais rico que a grade; passagens muito estreitas podem não produzir uma rota. A exploração do minimapa recomeça ao reconstruir a região, sem alterar o save da jornada.

## Validação

Typecheck/build e [regressão da jornada](journey-qa/report.json): Ecos → fissura → caverna → Primeiro Eco → Warden → Vale, registros, persistência, três respawns, teclado/mouse, touch emulado e gamepad mock. Amostra no Vale: cerca de 59,6 FPS.

[QA específico](qa/report.json): destino e caminho em Forest, Cavern, Vale, Siroco, Dunas e Bacia Soterrada; pontos da rota fora dos colliders; seta ocultada na aproximação; recolhimento por teclado/touch; quatro resoluções; objetos estáveis. Não houve teste físico nesta etapa. Playtest humano deve avaliar se alguém novo chega aos três Ecos e à caverna sem explicação verbal.

```text
node scripts/qa-navigation.mjs
node scripts/qa-dante-journey.mjs http://localhost:5184/ docs/navigation-foundation/journey-qa
```
