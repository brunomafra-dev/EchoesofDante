# 0.1.204 — Pioneiro/Pioneira nas quatro profissões

## Autorização e sequência

O usuário pediu repetir o lote completo do Batedor para o Pioneiro: terminar este personagem nas quatro profissões antes de avaliar o próximo. Manter uma figura por gênero, pronta, sem editor de cabelo/rosto/pele; preservar o seletor, a arte dos quatro personagens originais e o Guerreiro Pioneiro/Pioneira já existente. A publicação do Render foi adiada pelo usuário até que o lote esteja pronto para seu teste no jogo.

## Implementação

- [x] Manter o Guerreiro original e incluir Caçador, Manipulador Astral e Domador de Feras no corpo Pioneiro/Pioneira.
- [x] Criar 18 atlas inteiros: 3 profissões × 2 gêneros × 3 equipamentos. O atlas tem 8 direções, 4 fases próprias de caminhada, repouso e ação.
- [x] Registrar emissores por profissão, gênero, equipamento e direção. O ponto visual da arma não altera raycast, hitbox ou alcance de gameplay.
- [x] Usar a mesma fonte em seleção, demonstração, mundo, equipamento e representação dos aliados. Saves anteriores mantêm `classId`, IDs e jornada; `visualPreset` continua sendo metadado de apresentação.
- [x] Anunciar capacidade negociada `pioneers:1` sem subir do protocolo 16. Clientes que não suportam as novas combinações não criam, entram ou retomam uma sala incompatível.
- [x] Registrar o laboratório em `test-library.html`: [selecionar Pioneira e testar o Astral](../../test-library.html).

Origens, limites de prompts e importação: [documentação do lote](../pioneer-professions/README.md). A correspondência dos oito outputs de armadura foi revista e registrada em `docs/pioneer-professions/variant-output-map.json`; seus prompts literais não tinham sido arquivados pelo processo anterior.

## QA técnico — local concluído

- [x] `npm run typecheck` e `npm run build`.
- [x] Geometria/transparência/escala e oito emissores nos 18 atlas; 64 quadros por folha, quatro fases de caminhada diferentes e silhueta consistente.
- [x] Seletor de gênero/personagem/profissão: matriz 20/32 disponível e 12 combinações sem poses bloqueadas. Pioneiro e Pioneira criam/recarregam como Caçador, Astral e Domador; Guerreiro continua original.
- [x] As 18 combinações novas de gênero/profissão/equipamento passaram movimento, básico e Q. A figura mantém 128×128 e o contador de bake não muda durante movimento/ataques (roupas: 1; básico: 3; reforçado: 4); touch e gamepad emulados passaram para as quatro profissões.
- [x] Anfitrião e convidado criaram e jogaram em três duplas: Caçador + Astral, Caçador + Domador, Astral + Domador. Ambos moveram, trocaram estados e viram os dois corpos. Relay local confirma protocolo 16/`pioneers:1`; a suíte bloqueia clientes antigos ao criar, entrar e retomar.
- [x] Quatro viewports (844×390, 393×852, 1024×768, 1920×1080): um canvas, controles com pelo menos 44 px e sem overflow horizontal. Touch/gamepad são emulados; não equivalem a iPhone ou controle físico.
- [x] Perfis salvos, IDs, aparência e jornadas sentinela preservados. Perfil legado sem `visualPreset` usa seu visual original; falha de asset não substitui corpo silenciosamente. Nenhuma vitória, desbloqueio ou recompensa foi simulada.
- [x] O link registrado em `test-library.html` abre Pioneira + Manipuladora Astral e não cria perfil nem altera progresso.
- [x] `git diff --check`.
- [x] Commit `e294965c502dcb870a1c2b8cd27cad4d7f3d33c` está em `origin/main`; Vercel marcou esse SHA como produção `READY` e associou o alias `echosofdante.vercel.app`. O catálogo público contém o acesso Pioneira + Manipuladora Astral; a biblioteca e a rota direta responderam HTTP 200.
- [ ] Coop público no Render: adiado pelo usuário até o lote estar pronto para o playtest; o QA coop acima usa o relay local. O protocolo continua 16.

### Recursos medidos

Os 18 atlas somam 31.571.784 bytes (30,11 MiB) comprimidos. As 18 grades de fonte ocupam outros 32.707.099 bytes (31,19 MiB) no repositório; elas não são servidas no jogo. Cada atlas RGBA decodificado ocupa 9.437.184 bytes; três roupas de um personagem representam 27 MiB de entrada para o bake CPU. A captura automatizada de uma dupla Pioneiro/Pioneira registrou 6 entradas e 54 MiB decodificados compartilhados no navegador. Não foi medido FPS nem pico de RAM; isso não é garantia para celular ou GPU integrada. O build passou com o aviso já existente do chunk de Hollow acima de 500 kB.

## Avaliação humana — pendente

QA automatizado não aprova aparência. O usuário ainda precisa revisar Pioneiro/Pioneira nas quatro profissões no [link público da biblioteca](https://echosofdante.vercel.app/test-library.html) — o acesso direto abre [Pioneira como Manipuladora Astral](https://echosofdante.vercel.app/campaign-playtest.html?refinement=204&presets=1&preset=warrior&class=astral&sex=female&v=0.1.204). A publicação solo está conferida. O coop público aguarda o deploy do Render que o usuário fará para seu playtest; não avançar para outro personagem, níveis, mapas ou civilização até receber essa avaliação.
