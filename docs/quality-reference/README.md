# Referência jogável de qualidade — 0.1.47

## Abrir e comparar

Na mesma URL em que o jogo roda, abra **`/quality-reference.html`**.
Localmente: `npm run dev`, seguido desse caminho na porta indicada pelo Vite.

- **Referência:** piso ilustrado único, composição integrada, animação articulada e impactos reutilizados.
- **Original:** `/quality-reference.html?baseline=1`, com a primeira câmara e os rigs atuais.
- **Reiniciar:** restaura o teste e seus dois Hollows.
- **Voltar ao jogo:** retorna ao fluxo normal e ao seu registro local.

Teclado/mouse, gamepad e touch são os controles existentes. As duas opções
começam em `(630, 950)`, com os mesmos dois Hollows, escala, câmera e obstáculos
da primeira câmara. O progresso local do jogo não é lido, gravado ou apagado
pelo laboratório, inclusive ao reiniciar pelos Registros.

## Hipótese e escopo

Testar uma referência pequena **em movimento**, antes de elevar o acabamento
de todo o mundo. A inspiração é a integração e legibilidade de um action RPG;
nenhuma arte de outro jogo foi incorporada. Organic Sci-Fi R3, linguagem D
e World Shape Language continuam sendo as referências do projeto.

Não é uma promessa de equivalência com a produção 3D de Path of Exile 2.
É um experimento 2D usando a arquitetura e os personagens de Dante.

## Ambiente

Uma única primeira câmara de 1200×740 unidades. Piso original pintado com
estratos rasos, sedimento, raízes baixas e transições mineralizadas, sem padrão
repetido dentro da câmara. Luz difusa superior esquerda; âmbar junto à descida
e violeta discreto junto à estrutura. Contraste e tintas dos props foram
ajustados em conjunto com o piso.

As pinturas existentes `world-rock`, `rock-shelf`, `root-growth`,
`mineral-growth`, `ancient-frame`, `world-shadow` e `terrain-blend` são reutilizadas.
Sombras de contato e bases são capturadas na cache; três rochas e a face antiga
permanecem Images para ordenação e oclusão do Guerreiro. A face se torna
transparente quando a pintura realmente encobre o corpo, usando a solução atual.

## Personagens e combate

- Guerreiro: apoio alternado, pequeno levantamento dos pés, transferência de
  peso, postura de carga e avanço visual curto durante o golpe. As duas mãos
  permanecem no sabre; posição lógica e arco de dano não se deslocam.
- Hollow: quatro membros articulados por frames dos PNGs existentes, pares
  alternados, apoio mais baixo, preparação corporal e avanço visual na execução.
  Perseguição, telegraph, ataque e knockback continuam na IA existente.
- Impactos: quatro slots fixos com cinco Images e um número por slot; clarão
  curto, lascas direcionais e número discreto. Sem tweens ou timers nesse pool.
- HUD: utiliza a revisão compacta já aprovada. A barra de comparação é exclusiva
  do laboratório. Áudio, dano, HP, XP, habilidades e controles são os atuais.

Estas são animações por articulação dos assets atuais, **não** uma animação
esquelética completa nem novos ciclos pintados quadro a quadro. O resultado
precisa ser avaliado em movimento, especialmente durante deslocamento lateral.

## Asset e pipeline

Único asset novo: `public/assets/experiments/quality-reference/basin-floor.webp`,
**1536×1024, 436.296 bytes (~426 KiB)**. Origem: imagegen integrado, geração original
offline com `world-rock.png` do próprio projeto como guia de material.
[Prompt completo](image-prompt.md). Nenhuma imagem de outro jogo foi utilizada.

O PNG original foi apenas reduzido e comprimido offline com Pillow:

```powershell
python scripts/prepare-quality-reference.py "caminho/do/PNG-gerado.png"
```

O Phaser carrega o WebP somente no modo Referência. Uma Image estática cobre
2400×1600 unidades, incluindo toda a área que a câmera pode enxergar junto às
bordas da câmara; a cache de props permanece em 1500×1000, composta uma vez.
Isso evita a emenda retangular que apareceu na primeira captura em movimento.
O modo Original e o jogo normal não
solicitam esse asset. Os frames das patas selecionam pixels de texturas já
carregadas; não geram arte, geometria ou novos uploads por quadro.

## Física, sessão e reversão

Os 37 footprints relevantes da primeira câmara e seus limites são iguais
nas duas versões; a diferença foi verificada no browser. Física e animação
continuam independentes. Não há nova descoberta, missão, habilidade ou inimigo.
O teste termina na primeira câmara: as transições narrativas posteriores não
disparam. O fluxo normal permanece disponível na URL principal.

O ponto de entrada isolado passa uma opção explícita a `GameScene`.
Sem essa opção, Player e Hollow usam a apresentação anterior. Os arquivos de
Forest, Cavern, progressão, colisões, input, câmera, HUD e áudio não foram
reescritos. A expansão da proposta depende de aprovação humana.

## Avaliação humana necessária

1. Alterne **Original / Referência** e caminhe pelo mesmo trecho.
2. Observe o contato dos pés e patas, em vez de avaliar somente a captura parada.
3. Ataque, esquive e carregue a habilidade perto dos minerais e rochas.
4. Verifique se o piso comunica superfície rasa navegável, sem sugerir paredes.
5. Avalie se chão, Guerreiro, Hollow e estrutura pertencem ao mesmo espaço.

Pontos ainda em avaliação: densidade do piso, encaixe entre os props antigos
e a pintura nova, clareza das quatro patas na escala atual e movimento lateral
do Guerreiro. Aprovação automatizada não determina a qualidade perceptual.
Não houve acesso a PC, gamepad ou iPhone físico para um playtest humano.

## Evidências e testes

- [Original](original.png) e [Referência](reference.png): mesma resolução
  1280×720, posição `(1080, 820)`, câmera centrada em `(1070, 750)` e zoom atual.
- [Percurso em movimento](reference-walk.webm): entrada, deslocamento, combate,
  esquiva e carga, via inputs de browser; invulnerabilidade somente no registro
  para manter a demonstração, sem simular aprovação humana.
- `npm run typecheck` e `npm run build`: aprovados. O aviso conhecido do tamanho
  do chunk Phaser permanece, sem novo aviso crítico ou erro de carregamento.
- `qa-quality-reference.mjs`: quatro resoluções, footprints/limites iguais,
  cobertura do chão nos quatro cantos da câmera, armas/mãos, movimento, colisão,
  sabre, carga/release, 15 XP atuais, esquiva, morte/respawn três vezes, mock de
  gamepad, touch CDP e isolamento do save, inclusive reset pelos Registros.
- `qa-dante-journey.mjs`: fluxo Forest → Echoes → mecanismo → Cavern → Deep →
  Exterior → First Echo → Warden → Vale, com posições DEV e HP do boss abreviado
  pelo QA existente; save, pausas, progressão, morte/reload e controles.
- `qa-touch-movement.mjs`: diagonais, movimento/ataque, movimento/esquiva,
  hold/drag/release, cancelamento, orientação, gestos e interação no jogo normal.
- Produção: jogo principal, Original e Referência abrem sem erros; o hook DEV
  não existe na build e o piso novo só é solicitado na Referência.

Relatórios: [referência](qa-reference.json), [jornada](qa-journey.json),
[touch existente](qa-touch.json), [produção](qa-production.json) e
[percurso gravado](qa-motion.json).

### Performance observada

No Chrome headless deste ambiente, a cadência RAF ficou próxima de 60 FPS
nos dois modos; o QA da jornada registrou cerca de 59 FPS médios no Vale.
Durante o percurso com movimento, perseguição, golpes, esquiva e carga,
a média do loop Phaser foi **56,9 FPS**, incluindo gravação de vídeo.
Não é medição em iPhone ou promessa para todo hardware.

| Medida em repouso | Original | Referência |
| --- | ---: | ---: |
| Objetos na raiz da cena | 104 | 83 |
| Texturas gerenciadas, incluindo texto/defaults | 64 | 67 |
| Graphics na raiz | 11 | 7 |
| RenderTextures | 8 | 1 |
| Tweens ativos | 4 | 0 |

A redução de objetos/caches ocorre porque o laboratório compõe **somente a
primeira câmara**; não representa uma otimização das regiões posteriores.
As quatro patas adicionais por Hollow estão dentro do Container, fora da
contagem de raiz. O pool de impactos reutiliza 24 objetos. Não houve crescimento
de objetos, texturas, tweens ou listeners nos três ciclos de morte/respawn.
O piso ocupa aproximadamente 6 MiB sem compressão; a cache RGBA ocupa cerca de
5,7 MiB, fora dos buffers internos do renderer e das demais texturas.

**Automação passou. Playtest humano necessário.** A decisão de expandir a
abordagem ao mundo permanece em aberto.
