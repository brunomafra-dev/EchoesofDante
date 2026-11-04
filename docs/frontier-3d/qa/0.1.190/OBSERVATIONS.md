# Inspeção do agente · mochila 0.1.190

Avaliação técnica local, sem aprovação estética humana e sem publicação. O usuário solicitou esta revisão da mochila; as capturas não substituem seu playtest.

Capturas representativas foram inspecionadas no compilado local, 1440×900, e nos três layouts estreitos do relatório de mochila. A comparação mantém armas atuais e troca somente mochila/alças, com iluminação e câmera comuns.

- [Costas masculinas](backpack/warrior-male-current-backpack.jpg): bolsos, fivelas e rolo de campo substituem o bloco liso. O rolo fica abaixo da cabeça; o conjunto acompanha o tronco.
- [Torso feminino](backpack/warrior-female-current-torso.jpg): módulo do peito removido; alças finas e curvas substituem os blocos rígidos. A primeira versão tinha folga visível, corrigida por medição da superfície e ajuste dos ombros antes do build final.
- [Disparo feminino](backpack/hunter-female-attack.jpg) e [corrida Astral](backpack/astral-male-run.jpg): mochila acompanha o esqueleto existente; rifle e manopla permanecem nas mãos corretas. A mudança não introduz física de tecido ou balanceamento de combate.
- [Comparação anterior](backpack/warrior-male-previous-torso.jpg): mantém o conjunto antigo para revisão sem trocar o armamento.

Relatório da mochila: 80 amostras, 67 capturas, quatro classes × dois gêneros × dois conjuntos, mais ataque/corrida/esquiva/salto. Em seis trocas adicionais, geometrias 37 → 37 e texturas 33 → 33: nenhum crescimento acumulado nessa amostra. A verificação de limites/âncora não certifica contato perfeito de tecido em todos os frames, estilos de cabelo ou futuras roupas.

As cinco suítes compiladas passaram: mochila, classes, entrada/recuperação, oficina/NPCs e desempenho. Typecheck/build passaram com 308 módulos. No Celeron N5105/Intel UHD, Chrome ANGLE D3D11, 1440×900/DPR1, Guerreiro parado, três amostras de dois segundos após oito segundos de aquecimento: base com cinco NPCs 40,0–40,2 FPS (149 chamadas, 311.699 triângulos); floresta com oito aranhas animadas 56,6–57,0 FPS (62 chamadas, 300.707 triângulos). Execuções sequenciais, sem outro QA/build concorrente. Não extrapolar para combate contínuo, outras máquinas ou aparelhos móveis.

Sem teste em iPhone físico ou aprovação humana. Não ampliar o cenário/campanha antes da avaliação do usuário.
