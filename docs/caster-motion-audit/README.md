# Astral e Domador de feras — auditoria de movimento · 0.1.97

**Rejeitada em playtest humano:** o usuário apontou braços fragmentados na captura de 14/10/2026. Os testes geométricos não validavam a anatomia da pintura. [Revisão 02 — 0.1.98](revision-02/README.md).

O usuário gostou do kit, mas rejeitou braços e caminhada dos dois personagens mais recentes. Esta é uma revisão das apresentações das etapas 5/6; a equipe de quatro permanece para a etapa 7.

## Testar diretamente

- [Astral / roupa inicial](https://echosofdante.vercel.app/astral-playtest.html?motion=1&kit=initial&v=0.1.97)
- [Domador de feras / roupa inicial](https://echosofdante.vercel.app/xenobinder-playtest.html?motion=1&kit=initial&v=0.1.97)

O mesmo rig está no jogo principal. Os laboratórios isolam as chaves de saves e permitem trocar região, apresentação e equipamento. Recolha o painel para jogar.

## Problemas encontrados e correções

| Achado | Correção |
| --- | --- |
| Cotovelo invertido e comprimentos variáveis | Dois segmentos de comprimento constante, cotovelo voltado para baixo/lateral conforme a mira e alcance visual limitado. |
| Manga genérica verde no Astral azul | Pinturas próprias de braços/mãos por classe e proteção, com volume de antebraço humano. |
| Braço livre terminava na manga | Mão própria registrada no punho, com versões frente/costas. |
| Instrumento preso pelo centro da imagem | Origem medida no punho; eixo do disparo registrado na ponta, inclusive ao mirar à esquerda. |
| Braços dianteiros sobre o torso de costas | Ordenação específica frente/costas/perfil, atualizada ao mudar de direção ou equipamento. |
| Encaixe único para todas as armaduras | Ombros registrados em cada vestimenta e apresentação. |
| Pernas recortadas no meio e deslocadas poucos pixels | Poses completas de cintura até os pés: contato, passagem e apoio alternado. |
| Pintura da cintura vazava atrás do torso | Área superior limpa antes de compor o torso original; cabeças e tórax mantêm os pixels originais. |
| Mostruário usava a apresentação antiga | Menu passa a usar o mesmo cálculo de braços, instrumentos e novos atlases. |

Dano, alcance físico, velocidade, Dash, cooldowns, recursos, IA, mapas, câmera, controles, áudio e protocolo permanecem iguais. O deslocamento visual do disparo corrige a saída do instrumento; a colisão do projétil continua começando no jogador.

## Arte e composição

Arte original produzida com a ferramenta imagegen e preparada **offline** com Pillow. [Prompts das pernas](illustration-prompts.md) e [braços/mãos](arm-prompts.md). As primeiras propostas de personagens completos foram descartadas por poses truncadas/inconsistentes; não entraram no jogo.

- 12 corpos de **1280×768**, 15 frames: três direções × uma postura parada e quatro passadas.
- Seis kits de braços de **384×256**, seis peças: braço, antebraço e mão, frente/costas.
- PNGs de runtime: **4.44 MB decimais** no total (medidas em [assets.json](assets.json)).
- Um atlas modular reutilizável por ator; equipamento é composto ao mudar as peças. Sem sobreposição de armadura sobre outro corpo.
- Frente possui pinturas masculina/feminina próprias. Pernas técnicas de costas/perfil são compartilhadas e ajustadas à cintura; frente/costas usam contato/passagem e suas contrapartes espelhadas. Cabeça/torso não são espelhados durante a passada.
- Fontes e posturas paradas anteriores arquivadas em `source-art/`; exportação reproduzível com `python scripts/prepare-caster-motion.py`.

A representação continua ilustrada Organic Sci-Fi/D. Guerreiro e Hunter não receberam alterações nos seus rigs.

## Evidência visual

[Prancha de frente/costas/perfil](review-board.jpg) · [Capturas das poses](qa/) · [Estado anterior](before/).

Gravações com teclado/mouse reais em Chrome:

- [Astral: caminhar, recuar, atacar, mirar e carregar](visual/astral-motion.webm)
- [Domador de feras: caminhar, recuar, atacar, mirar e carregar](visual/xenobinder-motion.webm)

As capturas anteriores incluem a oscilação de transparência de uma fixture de invulnerabilidade; as novas usam apresentação opaca. São evidência anatômica, não comparação pixel a pixel de opacidade.

A revisão das capturas mostra continuidade entre ombro/braço/antebraço e instrumentos presos à mão; as passadas possuem mudança visível de apoio. **Isso não substitui aprovação humana da animação em movimento.**

## QA técnico

- `npm run typecheck`: passou.
- `npm run build`: passou; permanece o aviso conhecido do tamanho do bundle Phaser.
- `qa-caster-motion.mjs`: **2.304 combinações de pose** e quatro conjuntos mistos. Ombros dentro da pintura, ossos com 18/15 unidades, punhos conectados, ponta na direção da mira, tórax/cabeças preservados em todos os frames. WASD, recuo, parada, Space e Q imobilizado. [Relatório](qa/report.json).
- `qa-caster-visual.mjs`: captura/gravação dos quatro personagens e quatro mostruários, sem erros JS. [Relatório](visual/report.json).
- `qa-astral.mjs`: básicos/campos elementais, custo, cancelamento, colisão, host/visitante, morte/respawn, gamepad mock, touch CDP e quatro resoluções. [Relatório](astral-regression/astral.json).
- `qa-xenobinder.mjs`: assistência, investida/pulso, cobertura, cura, recurso, host/visitante em dupla real por WebSocket local, touch/gamepad e três ciclos de morte/respawn. [Relatório](xeno-regression/report.json).
- Resoluções: **1280×720, 1366×768, 1920×1080 e 844×390**.
- Saves reais preservados; nenhum erro JS ou de carregamento detectado nesses testes.
- Build de produção servida localmente: quatro personagens jogáveis e todos os 12 atlases carregaram corretamente, sem hooks DEV. [Verificação](production-local/report.json).

As fixtures de posição/dano permitem exercitar casos específicos. Não se trata de playtest humano nem de teste físico em celular/gamepad.

## Performance

Amostras isoladas com dez segundos de aquecimento, Floresta/Cavern/Caldeira e comparação com Guerreiro na mesma build:

- FPS suavizado: **59.13–59.38**.
- Atualizações efetivamente contadas: aproximadamente **59.8–60.25 FPS**.
- Objetos/tweens estáveis durante cada amostra.
- Três respawns cooperativos: **397 objetos, 244 texturas, 25 tweens e um companheiro** em todos os ciclos do teste do Domador de feras.
- Um objeto adicional por rig para a mão livre; seis texturas pequenas novas. Atlas do corpo aumenta de quatro para cinco colunas. Nenhuma textura é criada por passada, nenhum tween de braço é acumulado e nenhum desenho de roupa acontece por frame.

[Benchmark atual](performance/report.json) · [Benchmark anterior](../xenobinder/world/performance.json). FPS de QA com múltiplas janelas e carregamento não é usado como benchmark isolado.

## Limites e validação humana

Animação raster discreta de quatro passadas, não animação esquelética completa. Perfil usa pintura espelhada para a esquerda. A qualidade de recuo/diagonais, transições rápidas de mira e equipamento misto deve ser avaliada jogando.

Checklist curto:

1. Andar e recuar mirando em todas as direções.
2. Atacar andando; verificar ombro, cotovelo, mão e saída do disparo.
3. Segurar Q, girar a mira e soltar.
4. Comparar roupa inicial, básica e avançada; testar as duas apresentações.
5. Na dupla, observar o parceiro andando e carregando.

Cooperativo validado com relay local **protocolo 9**. Em 14/10/2026, o serviço público do Render ainda respondeu **protocolo 4**; essa pendência de hospedagem anterior impede declarar a dupla pública atual validada. Esta revisão não altera rede nem protocolo.

**Automação passou. Playtest humano necessário. Aguardar esta avaliação antes da etapa 7.**
