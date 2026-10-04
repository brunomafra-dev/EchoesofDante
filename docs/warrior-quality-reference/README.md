# Warrior pintado — 0.1.48

## O que mudou

O piso da câmara de referência foi aprovado, mas o Guerreiro ainda usava a
mesma arte anterior. Esta revisão muda a unidade visual do personagem:
corpo e pernas são poses pintadas completas, com articulação de quadris,
joelhos, botas e tronco. A identidade continua sendo um explorador humano
com armadura funcional marfim/sálvia, tecido escuro, tiras laranja e visor
físico ciano. Proporções mais alongadas e volumes mais claros substituem a
leitura anterior de peças curtas empilhadas.

**O usuário autorizou a aplicação também no jogo principal.** A URL normal
já usa o Guerreiro novo em todas as regiões, incluindo o Warden e o Vale.
O ambiente aprovado da câmara continua isolado; não foi aplicado como um
piso genérico aos outros mapas.

## Abrir e comparar

Abra **`/quality-reference.html`** na mesma URL/build do jogo:

- **Warrior novo:** arte nova no cenário aprovado.
- **Warrior anterior:** `?warrior=original`, mesmo cenário, inimigos,
  câmera, física e posição inicial; somente o Guerreiro muda.
- **Câmara original:** `?baseline=1`, preserva a comparação anterior de
  ambiente e personagens.
- **Voltar ao jogo:** experiência normal, com o Guerreiro novo e seu save.

O laboratório continua sem ler, gravar ou apagar o progresso local.

## Poses e encaixe

Três direções pintadas: frente, costas e vista lateral em três quartos.
A lateral esquerda espelha a direita; o corpo permanece ereto, sem girar
para ficar de cabeça para baixo. Cada direção possui oito quadros:
pronto, três passadas, preparação do golpe, avanço do golpe, carga e Dash.
Recuperação reutiliza a preparação; release da carga reutiliza o avanço.

O ciclo seleciona quadros pela distância realmente percorrida. Parar ou
pressionar uma parede interrompe a caminhada. Movimento para trás inverte
a sequência. A altura das poses agachadas permanece diferente da altura
em pé; não se estica cada pose para parecer do mesmo tamanho.

As mangas pintadas existentes e o rig contínuo do sabre continuam sendo
usados para mirar livremente e manter as duas mãos no cabo. A altura dos
ombros acompanha cada pose; os braços são mais estreitos para se encaixar
na nova anatomia. Botas antigas ficam ocultas. O ponto de apoio continua
em `player.y + 39`; posição lógica, raio e arco de dano não mudam.

## Origem e pipeline

Arte original criada offline com **imagegen integrado**, usando o antigo
`warrior-body.png` exclusivamente como referência de identidade. As folhas
seguintes usam a primeira pintura como referência de continuidade.
Nenhuma arte de outro jogo foi utilizada.

[Prompts completos e arquivos de origem](sources.json).
[Dimensões, footprints alpha e hashes](asset-measurements.json).

```powershell
python scripts/prepare-warrior-poses.py "diretório/dos/PNGs-gerados"
```

O script apenas recorta as células, redimensiona, registra a linha dos pés
e salva PNGs transparentes. Não desenha nem inventa poses. Uma escala por
direção preserva as proporções das oito pinturas. Os originais permanecem
no diretório de imagens geradas do Codex; os assets finais estão no repo.

| Asset | Dimensão | Quadros | Bytes |
| --- | --- | ---: | ---: |
| `warrior-poses-front.png` | 1024×512 | 8 de 256×256 | 240.971 |
| `warrior-poses-side.png` | 1024×512 | 8 de 256×256 | 264.491 |
| `warrior-poses-back.png` | 1024×512 | 8 de 256×256 | 251.046 |

Total: **756.508 bytes (~739 KiB)**, aproximadamente **6 MiB RGBA**
decodificados, sem contar buffers internos do renderer. O Phaser carrega
spritesheets uma vez e muda o frame da Image existente. Não há geração de
arte, upload de textura, novos objetos ou tweens por frame nesta apresentação.
Os modos de comparação antiga não carregam as três folhas novas.

## Limites da revisão

É uma apresentação 2D com poucas poses, não um personagem 3D ou uma animação
esquelética completa. Há quatro setores de direção; não oito vistas pintadas
independentes. Os braços ainda articulam mangas existentes. Não há novo
golpe, morte pintada ou equipamento. As transições entre poses têm poucos
quadros e precisam ser avaliadas em movimento, especialmente o deslocamento
lateral e a caminhada enquanto se mira em outra direção.

Ataques, dano, timings, movimento, colisões, câmera, HUD, áudio, inimigos,
progressão e save mantêm suas regras. A integração tem seleção explícita
da apresentação, preservando os PNGs antigos para comparação/reversão.

## Validação humana

Compare os dois Warriors no mesmo chão. Caminhe para os quatro lados,
mire enquanto caminha, faça golpes consecutivos, esquive e segure/solte
a carga. Observe proporção do capacete, apoio das botas, encaixe das mãos,
materialidade e continuidade entre poses. Depois percorra o jogo normal.

Não houve acesso a um dispositivo físico para um playtest humano.
**A aprovação perceptual depende do seu teste em movimento.**

## Evidências e resultado técnico

- [Antes](before.png) / [depois](after.png): mesmo piso, câmera, zoom,
  resolução 1280×720 e posição `(1080, 820)`; o Hollow usa a mesma apresentação.
- [Movimento, golpe, carga e Dash](motion.webm): inputs de browser com
  invulnerabilidade apenas para gravar a demonstração, sem playtest humano.
- [Postura de carga](charge.png): pintura com joelhos flexionados e apoio amplo.
- `npm run typecheck` e `npm run build`: passaram em 0.1.48. Permanece o
  aviso já conhecido do tamanho do chunk Phaser.
- [QA de poses](qa-poses.json): quatro direções, pés no mesmo plano, corpo
  ereto, quadros 0–7 observados pelas ações reais, arma nas duas mãos
  (erro máximo ~0,000115 unidade), mesma geometria e novo Warrior no jogo normal.
- [QA da câmara](qa-reference.json): quatro resoluções, 37 footprints
  iguais, navegação/colisão, sabre, dano, hold/release, 15 XP atuais,
  Dash, três mortes/respawns, save isolado, gamepad mock e touch CDP.
- [QA da jornada](qa-journey.json): Forest → três Echoes → mecanismo →
  Cavern → Deep → Exterior → First Echo → Warden → Vale, save/reload,
  três mortes/respawns, Registros, cancelamento de carga e controles.
  Usa posicionamento DEV e abrevia HP do boss; não mede dificuldade humana.
- [Build de produção](qa-production.json): jogo, câmara nova, Guerreiro
  anterior, câmara original e laboratório A/B/C/D. Sem hook DEV em produção;
  as folhas novas são solicitadas somente pelo jogo e pela câmara nova.

Sem erros JS ou de carregamento nos QA. Em repouso a câmara conserva
**83 objetos na raiz, 7 Graphics, 1 RenderTexture e 0 tweens ativos**;
texturas passam de 67 para 70. Nenhum crescimento nos três respawns.
O loop Phaser registrou **~60,1 FPS médios** no teste de poses e **~59,3 FPS**
no Vale durante a regressão. São medidas em Chrome headless deste ambiente,
não validação física de PC, gamepad ou iPhone.

**Automação passou. Playtest humano necessário para a avaliação visual.**
