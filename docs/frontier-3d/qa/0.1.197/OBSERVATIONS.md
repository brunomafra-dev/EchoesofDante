# Revisão técnica e visual · 0.1.197

Esta entrega é uma cena de avaliação, com o mesmo herói e encontro atual. Proposta visual humana ainda pendente. Nenhum modelo Tripo foi usado e nenhum serviço de geração 3D foi comprado.

## Verificação

Build inclui TypeScript e passou com 320 módulos; permanece o aviso conhecido de tamanho de chunks. Os dois GLBs passaram na ferramenta oficial glTF Validator (via glTF Transform CLI 4.5.1), sem erros ou avisos; há informações sobre atributos não utilizados por alguns materiais sem normal/textura. Os UVs do piso são usados pelo material compartilhado atribuído no jogo.

Sete relatórios locais cobrem a cena, estado/saves, poses/oficina, confronto, input, acesso ao jogo e desempenho. A migração/estado reutiliza os checks da jornada 0.1.196; o campo `asset` desse relatório é intencionalmente o boss original preservado. O modelo proposto tem sua própria auditoria em `build-verification.json`.

As quatro vitórias usam botões/eixos de um gamepad padrão emulado e o estado exposto somente para leitura. Não há comandos de dano, teleporte, cura ou vitória. O fixture de pré-requisitos é isolado e a vida do boss começa em 900. Depois da vitória, reload mantém o boss vencido e deixa o relatório pronto. Isso verifica funcionamento; não representa equilíbrio ou aprovação por quatro jogadores humanos.

Na comparação, os dois modelos usam a mesma arena, câmera e iluminação. O link normal da pausa não expõe diagnóstico. O teste navega pelo link e reabre a mesma URL com `inspect=1` para continuar a leitura; o primeiro timeout por ausência dessa flag está preservado em `observations/scene-missing-inspect-query.json`.

O primeiro percurso automatizado do Astral perdeu depois de escolher um destino livre cujo segmento atravessava uma rocha nativa. O driver passou a verificar também o segmento e permitir saída da margem de uma formação. Não houve redução de dano, vida, colisão ou mudança dos padrões do boss. Tentativa original em `observations/bot-crossed-native-obstacle.json`; vitórias reais finais no relatório `boss/`.

## Inspeção visual

Foram conferidos modelo frontal/lateral/traseiro, preparações e execuções dos cinco movimentos, derrota sem reinício, herói e boss na arena e modos de comparação. Na produção, foram corrigidos o fator de cor perdido pelo exportador, UVs de fechamento, tangentes e o sentido da face do chão. O resultado é uma proposta de malha original, sem alegação de reproduzir integralmente a imagem de referência.

A primeira captura em retrato revelou o herói fora do quadro; mantida em `observations/portrait-before-camera-correction.jpg`. A câmera da cena recebe um enquadramento próprio em retrato. A troca de orientação também revelou o canvas antigo ampliando o viewport mobile; a superfície de desenho agora respeita o contêiner e não transborda. O QA verifica a largura real do viewport e a projeção da cabeça/pés, além das capturas. Não foi usado fade de objetos nem alterada a câmera de árvores da jornada normal.

## Recursos e limites

Uma malha de personagem com seis grupos de material, nove ossos e mapas de 512 px. Piso/incisões originais compartilham os mapas existentes; rochas Poly Haven são instanciadas, com geometrias/mapas compartilhados e um material próprio de revisão. Estática preparada uma vez; nenhum bake/desenho de cenário por frame. Uma luz direcional adicional sem sombra; a principal mantém a sombra existente. Sem bloom obrigatório, luz por inimigo ou simulação de tecido nova.

Medição em `performance/report.json`: Chrome headless 156, ANGLE D3D11, Intel UHD 0x4E61 / Celeron N5105, 1440×900 DPR 1. Cena parada com boss vivo/dormente, oito segundos de aquecimento e três amostras de dois segundos, em série e sem build/autoria/QA paralelo. Não extrapolar para combate, celular físico ou outro computador. Toque e gamepad são emulados. 3D permanece solo.

Fontes canônicas de gameplay/rede 2D, métodos de colisão/movimento do mundo e métodos de combate/poses do Warden são conferidos sem mudanças no verificador. O menu 2D altera apenas a versão do acesso 3D. Builds, modelos e dependências públicos serão conferidos por hash após o push. Avaliação estética e adoção como padrão dependem do playtest do usuário.

## Publication gate

Application `738d815` is synchronized with `origin/main`. The first Vercel deployment failed; GitHub exposes no underlying build error, and Vercel CLI requires unavailable login. Private build logs were requested. A clean official Hollow input download/preparation passed independently. Public hash comparison correctly rejected the still-previous `/arrival-3d.html`; no publication or public QA is claimed. Local scene QA was repeated against the final production preview, including the 44 px comparison controls and orientation changes, and passed.

The next evidence commit `8cf8b51` deployed successfully without runtime/build edits. All 138 public hashes match the local build. Public scene, art and boss reports passed, including all four real class victories and reload. Public screenshots of the proposal and portrait orientation were inspected. The original failure remains unexplained; no speculative workaround was introduced. The private-log request is no longer needed. Technical QA is complete; visual approval remains pending.
