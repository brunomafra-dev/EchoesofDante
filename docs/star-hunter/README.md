# Star Hunter — segunda classe jogável

Escolha **Star Hunter** ao criar um personagem no menu. Jornada e XP ficam separados do Guerreiro.

## Kit

- Rifle de pulso: clique/RT/DISPARO lança um projétil mirando livremente, 22 de dano base, 700 de alcance, 340 ms entre tiros. Rochas e estruturas bloqueiam; não há auto-aim.
- Momentum: movimentação real perto de ameaças gera até 100. Parar deixa o recurso decair. Disparos consomem 9; tiro concentrado consome 35. O recurso concede até 35% de dano adicional, aplicado no lançamento.
- Passo de fase: mesma semântica direcional de esquiva, recarga base 1450 ms.
- Tiro concentrado: segure Q/LT/TIRO, arraste/mire e solte. Reutiliza o ciclo existente de carga, mas lança um projétil estreito de 980 unidades em vez da onda melee.

Movimento 275, vida 80% do Guerreiro no mesmo nível. Resistência menor exige controle de distância. Saber e valores do Guerreiro permanecem iguais. Upgrades existentes possuem apresentação e efeito próprios no rifle, alcance e tiro concentrado.

## Arte

Asset original pintado: frente, costas e perfil, com duas poses de caminhada e disparo por vista. Atlas 1024 × 768, doze frames 256 × 256. Fonte e prompt preservados; preparação técnica offline em `prepare-hunter-art.py`. Pés seguem o mesmo apoio do Guerreiro; anatomia nunca gira de cabeça para baixo.

## QA

Typecheck/build passam. `qa-star-hunter.mjs`: menu real, save separado, tiro/dano/XP, cobertura, Momentum, bloqueio de movimento durante carga, release, esquiva, respawn, quatro resoluções, gamepad mock e touch CDP com hold/drag/release. Zero erros JS/assets. Aproximadamente 59,6 FPS no Chrome headless.

Regressão completa do Guerreiro em `warrior-regression/`: Forest → Ecos → passagem → Cavern → First Echo → Warden → Vale, persistência, registros, três respawns, gamepad/touch. Aproximadamente 59,1 FPS.

## Limitações

Não houve playtest físico desta classe. Balanceamento e animação precisam de avaliação humana. Oito projéteis reutilizados; Momentum reinicia no respawn/pausa para impedir disparos pendentes. Sem crítico aleatório ou marcação nesta primeira versão.

Astral Manipulator está documentado como classe oficial futura; não é anunciado como jogável nesta etapa.
