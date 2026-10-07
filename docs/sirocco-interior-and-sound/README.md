# Dunas Interiores e identidade musical regional · 0.1.59

## Continuação do Siroco

O portal oriental da Bacia avança para Dunas Interiores, em vez de encerrar a exploração voltando ao Vale. O portal oeste da Bacia conserva o retorno anterior; nas Dunas, o portal de entrada permite voltar à margem leste da Bacia.

A área de 3200×2200 unidades reúne entrada tranquila, uma crista central contornável pelo norte ou pelo sul, dois desvios, ruínas soterradas e uma depressão natural no leste. A crista cria escolhas e reencontro dos caminhos; não há chave ou exigência de eliminar habitantes.

- **Crista dos Ventos:** vestígio exposto no caminho norte; descoberta opcional de 20 XP.
- **Veio Soterrado:** formação mineral no caminho sul; descoberta opcional de 20 XP.
- **Ruínas:** investigação pelo INTERACT existente; resposta curta do sinal e checkpoint em (1940,1020), sem recompensa adicional ou explicação da origem.
- **Depressão de areia:** o sinal continua sob a superfície. É preparação ambiental para um futuro boss, sem entidade, arena fechada ou combate de boss nesta atualização.

Sete habitantes reutilizam Salteador das Dunas e Cuspidor de Vidro, com IA e valores existentes. Concedem 15 XP por derrota e usam o retorno de habitats já existente. Dez colisores circulares representam bases estruturais; pequenas raízes e detalhes continuam decorativos. O kit do jogador, controles, câmera, áudio de efeitos e regras anteriores de progressão permanecem.

Flags de visita, investigação e chegada à depressão, recompensas dos desvios e cooldowns usam o save local existente. Saves antigos continuam válidos. Morte e reload preservam avanço; a investigação registra o ponto seguro, enquanto uma visita inicial retorna à entrada das Dunas.

## Arte e execução

O piso é uma ilustração original gerada offline, com referência ao piso árido já aprovado. [Prompt](illustration-prompt.md), fonte em `source-art/` e [medidas/hash](asset-measurements.json). `scripts/prepare-dunes-art.py` exporta WebP de 1513×1039 pixels, cerca de 245 KB. O terreno e a arte elevada estão separados.

Reutilizamos estratos, minerais, raízes, vestígios e relé do kit D. Sedimento e contato são desenhados uma vez nas quatro faixas de RenderTexture; as formações elevadas conservam o sistema de oclusão. Não há geração de terreno, desenho estático por frame ou partículas novas. O relé tem apenas uma resposta de tweens finitos.

## Nove trilhas originais

| Região | Duração | Intenção musical |
| --- | ---: | --- |
| Forest | 144 s | Madeira suave, espaço e sinal distante |
| Cavern | 148 s | Grave contido, pedra e ecos |
| Deep Cavern | 160 s | Vidro, silêncio e presença ancestral |
| Deeper Cavern | 137 s | Pulsação e tensão subterrânea |
| Exterior | 135 s | Ar, abertura e descoberta |
| Vale da Ressonância | 141 s | Movimento e espaço aberto |
| Bacia do Siroco | 149 s | Madeira seca, calor e deslocamento |
| Dunas Interiores | 173 s | Vento grave, distância e areia |
| Warden | 120 s | Tensão, percussão e escalada |

`scripts/compose-region-scores.py` contém frases, harmonias e arranjos escritos para cada região. Timbres sintetizados offline combinam camadas sustentadas, madeira/vidro, baixo, ruído filtrado e percussão discreta. Frases curtas aparecem com pausas e variações ao longo de composições maiores. Não usamos Suno, amostras externas, gravações protegidas nem geração musical durante o jogo. Não há voz humana gravada.

Para reproduzir a autoria: Python com `numpy`, `imageio-ffmpeg` e, para preparar o piso, Pillow. Essas ferramentas são de desenvolvimento; não são dependências da build web. A saída é MP3 estéreo, 22050 Hz, 112 kbps, 1,68–2,42 MB por faixa, aproximadamente 18,3 MB no conjunto. [Medições e hashes](audio-measurements.json).

O final do arranjo retorna à harmonia inicial. Uma suavização de 12 ms nas bordas evita descontinuidade abrupta; o encoder escreve metadados para reprodução contínua. O teste de browser verifica decodificação e retorno do loop, mas não substitui escuta prolongada no aparelho do jogador.

O AudioManager usa carregamento sob demanda após interação, no máximo duas vozes durante crossfade de 1,6 s e libera a voz anterior ao terminar. MASTER/MUSIC/SFX continuam independentes. Mudanças rápidas descartam vozes supersedidas. O encerramento do Warden pode parar a música sem que um novo gesto volte a iniciá-la. Dentro do mapa subterrâneo, a geografia seleciona Cavern, Deep, Deeper ou Exterior.

## Validação e limites

[QA de Dunas e música](qa/report.json) cobre desbloqueio de autoplay, nove arquivos e loops, crossfade, seleção regional, caminhada com IA ativa pelos dois desvios até a depressão, investigação, XP, combate, gamepad mock, touch emulado, reload e três ciclos de morte/respawn. As capturas na pasta `qa/` registram entrada, ruínas, desvios e depressão.

Os testes de capítulos utilizam preparação DEV do progresso anterior; a rota dentro das Dunas usa teclado real no Chrome headless. Os testes isolados de ações congelam inimigos depois dessa travessia para evitar dependência do timing da IA. A [regressão do Siroco](sirocco-qa/report.json) cobre os dois arquétipos, XP, escolha de especialização, renovação de habitats, margem oriental e portais por teclado e touch. Não houve teste físico de iPhone, controle ou console nesta atualização. O controle continua genérico.

Typecheck e build passaram; o build mantém o aviso conhecido de tamanho do chunk Phaser. Nas medições de Chrome headless, Dunas teve média de **56,1 FPS** (mínimo amostrado 54,3); Siroco registrou médias de **57,3–60,2 FPS** nos dois trechos medidos. As três reconstruções após morte nas Dunas mantiveram **104 objetos, 1 tween e os mesmos listeners**. Não são medições de hardware mobile.

A [regressão do Warden](warden-qa/qa-report.json) passou: introdução, três mortes/reinícios, vitória única, transmissão, retorno, persistência, touch emulado e gamepad mock. O silêncio de encerramento permaneceu ativo após a vitória; não há duplicação do boss ou de recompensa.

A [jornada original](journey-qa/report.json) também passou, investigando os três Ecos, fissura, mecanismo, passagem profunda e Primeiro Eco com os inputs existentes, e verificando Warden, Vale, save, menu, morte/respawn e controles emulados. Preparação de posições e HP do boss é explícita no QA, sem afirmar um playthrough físico integral. Média de 58,8 FPS no Vale, sem gravações de save durante o período ocioso.

Comandos executados:

```text
npm run typecheck
npm run build
node scripts/qa-dunes-and-music.mjs
node scripts/qa-sirocco-expansion.mjs http://localhost:5184/ docs/sirocco-interior-and-sound/sirocco-qa
node scripts/qa-warden-boss.mjs http://localhost:5184/ docs/sirocco-interior-and-sound/warden-qa
node scripts/qa-dante-journey.mjs http://localhost:5184/ docs/sirocco-interior-and-sound/journey-qa
git diff --check
```

Aprovação estética de música e região depende da experiência do jogador. A perseguição direta dos habitantes conserva sua limitação junto a obstáculos; nenhum pathfinding foi criado. O futuro boss da areia permanece fora do escopo.
