# Braços, mãos e sabre do Warrior — 0.1.49

## Correção visual

O teste humano encontrou uma falha que os testes anteriores de encaixe
não detectavam: o corpo mudava para costas, mas os braços usavam os mesmos
ombros, materiais e ordem de desenho da frente. A pegada ficava muito
deslocada para a direita e as luvas eram círculos sem relação com a pintura.

Agora os ombros e a projeção da pegada acompanham frente, costas e laterais.
Na vista de costas, tronco e mochila encobrem braços, mãos e cabo que ficam
à frente do corpo. Nas laterais, o braço distante fica atrás e o próximo
permanece à frente. Ambos os braços possuem cotovelo articulado; a manga
não é mais uma única imagem esticada do ombro até a mão.

Um atlas pintado original contém manga superior, antebraço e luva em duas
vistas. As costas usam placas externas e dorso das luvas; a frente usa os
respectivos outros quadros. As duas mãos seguem os pontos reais do cabo,
inclusive durante golpe, carga, release e Dash. As luvas giram com a arma
e as mangas terminam no punho.

## Sabre

O Energy Saber ganha uma imagem pintada com cabo de tecido, emissor marfim,
metal desgastado, detalhe industrial laranja e lâmina ciano com núcleo claro.
A pegada dominante continua em `(0,0)` e a de apoio em `(-10,0)` no rig.
O pivot é registrado offline dentro do cabo, não no centro da imagem.

Esta revisão está no jogo principal e na câmara de referência. Os modos
**Warrior anterior / Câmara original** preservam a arte antiga. Ataque,
arco de dano, alcance, cooldown, movimento, colisões, IA, controles,
progressão, câmera e save não mudam. Os trails e indicadores existentes
continuam sendo os VFX do combate.

## Assets e custo

| Asset original | Dimensão | Conteúdo | Bytes |
| --- | --- | --- | ---: |
| `warrior-arm-kit.png` | 384×256 | 6 quadros de 128×128 | 95.917 |
| `warrior-saber-painted.png` | 256×64 | Sabre e pivot do cabo | 14.657 |

Total novo: **110.574 bytes (~108 KiB)** e ~448 KiB RGBA decodificados.
Origem: **imagegen integrado**, usando apenas o Warrior do projeto como
referência de identidade e o kit novo como referência de materiais do sabre.
[Prompts completos](sources.json) e [medidas/hashes](asset-measurements.json).

```powershell
python scripts/prepare-warrior-arm-kit.py "diretório/dos/PNGs-gerados"
```

O script só recorta alpha, registra componentes e pivots, redimensiona e
comprime offline. Não pinta ou gera poses. O Phaser carrega duas texturas
uma vez, reutiliza imagens e troca a ordem do Container ao mudar de vista.
São dois objetos adicionais dentro do rig, sem tweens, timers, listeners,
novos Graphics ou geração de texturas por frame.

## Comparação

- [Costas antes](back-before.png) / [costas depois](back-after.png): mesma
  câmera, zoom, posição `(1080,820)` e resolução 1280×720.
- [Frente](front-after.png) e [carga de costas](back-charge.png).
- [Demonstração em movimento](motion.webm): inputs de browser; invulnerabilidade
  apenas na gravação, sem representar teste humano de dificuldade.

Abra `/quality-reference.html` ou o jogo normal. Observe as costas, gire a
mira, faça golpes diagonais e segure/solte a carga. A sobreposição dos membros
é parte do teste visual; confirmar apenas a posição matemática da luva não
é suficiente.

## Verificação — 0.1.49

- `npm run typecheck` e `npm run build`: passaram. O build conserva o aviso
  conhecido de tamanho do bundle Phaser; não surgiram erros de compilação.
- [Poses e oito direções](qa-poses.json): frente, costas, laterais, caminhada,
  golpe, carga/release e Dash. As luvas acompanham os dois pivots, com erro
  máximo de ~0,000124 world units. O jogo normal carrega a mesma arte.
- [Câmara de referência](qa-reference.json): dano de Saber, carga, XP,
  colisão/desvio, Dash, touch emulado, gamepad mock e três respawns. Sem
  crescimento de objetos, tweens ou listeners; footprints preservados.
- [Fluxo normal](qa-journey.json): Forest → Echoes → Cavern → First Echo →
  Warden → Vale, estado de sessão/save, morte/respawn, Registros e touch.
  Posicionamentos e expiração de cooldowns usam os helpers DEV existentes;
  não é uma avaliação humana de dificuldade ou percurso.
- O QA de touch agora espera o evento nativo de fechamento do diálogo
  antes de afirmar que a cena voltou a rodar. Registros e controles não
  precisaram de mudanças.
- FPS observado: **56,4** no teste de poses gravado, **60,2** na câmara e
  **59,2** no Vale. A câmara manteve 83 objetos raiz, 72 entradas de textura,
  7 Graphics, 1 RenderTexture e 0 tweens após três respawns. O novo kit soma
  duas texturas e dois objetos internos ao rig em relação à versão 0.1.48.
- [Build de produção](qa-production.json): jogo normal, câmara nova, Warrior
  anterior, baseline e laboratório de rochas. Sem hook DEV, erros JS ou
  assets quebrados; as duas texturas adicionais só carregam nos modos novos.

Os testes são automatizados em Chrome headless, com teclado/mouse do browser,
touch via CDP e Gamepad API simulada. **Playtest humano necessário**, sobretudo
para avaliar naturalidade das costas e transições durante os golpes.

## Limitações

O corpo continua com os setores e poses pintados de 0.1.48. Braços utilizam
articulação visual simples, sem animação esquelética completa. A ordem de
desenho é determinada pela vista do corpo. Encaixes nos ombros de poses
extremas e transições de setor ainda devem ser avaliados jogando.
Não houve playtest em PC, iPhone ou gamepad físico neste ambiente.
