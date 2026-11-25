# Echoes of Dante 3D (novo) · plano de partida

Estado: **proposta para aprovação**. Nada implementado. Nenhum arquivo de jogo foi alterado por este plano.

## Decisões do usuário
- O 3D novo **substitui o 2D no futuro**, mas só quando estiver **extremamente maduro**. Até lá o 2D continua sendo o produto.
- **Recomeçar do zero.** O protótipo 3D atual (`src/experiments/arrival-3d`, feito em outra ferramenta) não é continuado; permanece intocado como arquivo de referência.
- **Não reaproveitar personagens nem armas** do protótipo: ficaram rígidos, com formas que não agradaram, e as armas foram rejeitadas. Reaproveitam-se apenas assets de cenário com licença conferida (árvores, rochas, terreno).
- Visual alvo: ARPG sombrio (Diablo, Path of Exile). Cada passo visual passa por teste lado a lado antes de entrar.

## Arquitetura
1. **Núcleo compartilhado** (`src/core/`, sem Phaser nem Three): regras, dados, combate, missões, economia, progressão e saves. Os 55 arquivos de `src/config` já são independentes de motor; os sistemas dependentes do Phaser (28 de 43) são separados por etapas, preservando o 2D.
2. **Renderizador 3D novo** (`src/three/`, entrada própria `3d.html`): consome o núcleo. Código legível, sem linhas minificadas.
3. **Coop** reutiliza o `server/relay.mjs` (protocolo 16); o 3D só entra com capacidade negociada, sem quebrar clientes 2D.
4. **2D intocado** até o portão de maturidade.

## Personagens e armas (partida do zero)
Candidatos avaliados em prévia lado a lado, na câmera do jogo, antes de qualquer escolha:
- Humanos de pacotes livres com **biblioteca de animação grande** (caminhada natural, idles variados, golpes, magia).
- Humanos montados no Blender (add-on livre, saída CC0), com animações livres compatíveis.
- Personagens do Mixamo (gratuito, exige conta Adobe; o usuário baixaria).
Critérios: formas naturais, rig compatível com muitas animações, **troca de armadura e equipamento por peças**, licença clara.
Armas novas: sabre, carabina, manopla e luva modeladas no Blender por script, com materiais pintados e partes emissivas, ou pacotes livres de armas de ficção científica. Testadas na mão do personagem antes de aprovar.

## Fatias (cada uma termina com link de teste e espera sua validação)
- **S0 Fundação:** esqueleto do projeto 3D, extração do núcleo (primeiro `config`, depois movimento e combate), orçamento de desempenho, harness de QA.
- **S1 Herói:** personagem novo, andar, câmera, visual sombrio.
- **S2 Combate:** quatro profissões com os números do 2D, armas novas, efeitos.
- **S3 Mundo:** acampamento, floresta, cavernas, bestiário.
- **S4 Jogo:** missões, inventário, progressão, saves.
- **S5 Coop.**
- **S6 Paridade:** auditoria contra o 2D, desempenho em máquina fraca e celular.

## Portão de maturidade (para substituir o 2D)
Paridade de conteúdo e sistemas com o 2D, coop funcionando, desempenho aceitável em máquina fraca e celular, QA automatizado completo e **aprovação visual e de jogabilidade do usuário**. Sem todos os itens, o 2D permanece.

## Processo
Cada fatia: QA técnico e aprovação humana informados separadamente; link em `test-library.html`; aguardar validação antes da próxima; sem commit ou publicação sem autorização.

## Estado em 24/11/2026
- **Armas:** quatro armas novas modeladas por script (`scripts/asset-tools/3d-new/make_weapons.py`, GLB em `public/assets/3d-new/weapons/`). Sabre e carabina aprovados pelo usuário; manopla Astral grossa e luva do Domador fraca, a refazer.
- **Criador de personagem:** caminho escolhido (cabelo, sobrancelha, rosto, pele, roupa, como Diablo e Path of Exile) com MPFB2 e pacotes CC0 do MakeHuman (`install_packs.py`, `make_human.py`, `patch_glb.py`). Prova com seis humanos variados: rostos, peles, cabelos e armaduras funcionam. Ajustes de gênero são assados na malha antes da exportação; materiais de exportação corrigidos para recorte e opaco.
- **Pendente:** rig e biblioteca de animações (Mixamo, baixada pelo usuário, ou retarget), camada de roupa de base menos casual, sliders de rosto e corpo em tempo de execução, equipamento por peças, e a fundação do núcleo compartilhado.
- **Visual:** modo opt-in `?look=arpg` no 3D atual (`src/experiments/arrival-3d/ArpgLook.ts`) como referência de clima; o 3D novo não depende dele.

## S1 — criador + primeira fatia jogável (25/11/2026)
- Página `3d.html` + `src/three/` (character.ts, world.ts, main.ts, style.css), independente do 3D antigo e do 2D.
- Personagens: `public/assets/3d-new/characters/{male,female}.glb` (MPFB2, CC0), um esqueleto por sexo com partes separadas (cabelo ×6, sobrancelhas ×3, roupas ×4, cílios); pele e cor de cabelo/roupa por tinta de material. Gerados por `scripts/asset-tools/3d-new/build_character.py` (a versão de trabalho fica em `.local/blender/`).
- Animações: Universal Animation Library (Quaternius, CC0), retarget para o rig game_engine; 18 clipes (parado, andar, correr, sprint, espada, pistola, magia, soco, rolar, dano, morte).
- Jogo: mover (WASD/clique), atacar (J/clique/botão direito), onda (Q), rolar (Espaço), correr (Shift); armas presas na mão direita; inimigos provisórios (carcaças).
- Limitações: monstros provisórios; roupas "Herói"/armadura sci-fi descartadas (feias/quebradas); desempenho medido só em SwiftShader (sem GPU); sem salvar progresso nem coop; ajustar pegada de carabina/condutor por olho.
- 25/11: pegada anatômica (`src/three/grip.ts`): quadro da mão a partir dos ossos dos dedos, dedos fecham por arma, carabina apoiada no ombro com as duas mãos por IK, manopla/condutor divididos entre antebraço e dorso da mão. Ajuste fino por olho ainda pendente de playtest.
- 25/11 (2): desempenho — removidas luzes dinâmicas de inimigos/projéteis (recompilavam todos os shaders a cada tiro/inimigo = travadas), pré-compilação de materiais, bloom em meia resolução, HUD a 10 Hz, qualidade adaptativa (resolução → sem pós-processo/sombras) com contador de fps e botão de qualidade. Roupas: ficam Nórdico e Monge (as que o usuário aprovou) + Encapuzado e Manto (robe + capuz); Viajante/Sombrio removidas (vazavam e bota estranha). Carabina: menor (82%), coronha no ombro, mão direita na empunhadura e esquerda apoiando por baixo, metade da torção do pulso passada ao antebraço.
- 25/11 (3): classes do 2D no 3D (`src/three/classes.ts`): Guerreiro (sabre, Esquiva do vazio, Carga cinética segurar/soltar), Caçador (rifle de pulso, Passo de fase, Feixe perfurante), Astral (manopla, 4 elementos com E, Campo direcional no cursor), Domador (condutor marca alvo, fera companheira que morde, Investida + cura). Vida, velocidade, recurso e esquiva por classe. Tiros saem do cano/emissor da arma. Carabina: braço direito mantém a animação (sem IK no braço), arma no punho apontando para frente, só o pulso gira; mão esquerda por IK.
- 25/11 (4): efeitos (`src/three/vfx.ts`): partículas em GPU (brilho aditivo + fumaça), estilhaços de pedra, raios, arcos de corte com shader, feixe e domo com fresnel, decalques no chão. Guerreiro: corte de vento (crescente + lâmina que voa) e Q = giro estilo Twisting Slash (segurar/soltar, multi-acerto). Caçador: tiro de pulso com rastro e Q = carga + feixe gigante estilo "Final Spark". Astral: bola de fogo com chamas e fumaça, orbe d'água com gotas e respingo, pedra girando com estilhaços e poeira, orbe elétrico com raios; campos: chão em chamas, gêiseres, espinhos de pedra, domo elétrico. Domador: filamento verde com esporos, investida com rastro e cura. Status visível nos inimigos (queimando, molhado, marcado), tremor de câmera. Relógio de jogo único (`now()` = tempo simulado) e gancho de QA `advance()`.
- 25/11 (5): manopla Astral refeita (bracelete fino, placa fina no dorso, protetor dos dedos, cristal na palma e 3 anéis astrais girando no pulso que mudam de cor com o elemento). Domador deixa de usar luva: bastão condutor simbiótico (haste orgânica com veias verdes e núcleo vivo engaiolado na ponta), segurado na mão esquerda para acompanhar o braço que conjura; disparo sai da ponta.
- 25/11 (6): cenário com modelos escaneados do Poly Haven (CC0): árvores mortas, tocos, troncos caídos, galhos secos, pedras e rochedos (instanciados, 8 MB) e chão queimado com textura PBR. Fogo real por shader (chamas turbulentas instanciadas): bola de fogo, explosão, chão pegando fogo com rachaduras em brasa, inimigo queimando, fogueira e tochas.
