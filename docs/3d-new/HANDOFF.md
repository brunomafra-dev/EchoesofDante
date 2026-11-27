# Passagem do projeto: Echoes of Dante (3D novo)

Escrito em 27/11/2026, na troca do Claude Code para o Antigravity. Serve para o próximo agente continuar sem perder o fio. Leia este arquivo, depois `AGENTS.md` e [PLAN.md](PLAN.md). Na dúvida, o código e o histórico do Git valem mais que este texto.

## 1. O que é o projeto

- **Jogo:** Echoes of Dante, um ARPG. A Terra ficou sem recursos e uma expedição vai colonizar o planeta Dante, escolhido porque **se parece com a Terra**.
- **Direção de arte:**
  - Biomas terrestres e naturais (floresta, campo, rios, neve, deserto, vulcão), com luz de dia.
  - Criaturas alienígenas.
  - Equipamento de nave e de expedição, com cara de ficção científica.
  - Nada de vegetação alienígena brilhante: o usuário pediu para tirar.
- **Repositório:** https://github.com/brunomafra-dev/EchoesofDante (branch `main`).
- **Site:** https://echosofdante.vercel.app. A Vercel publica sozinha a cada push na `main`.
- **Dois jogos no mesmo repositório:**
  - **2D (Phaser):** é o produto atual. Fica em `src/scenes`, `src/systems`, `src/config` e `src/ui`.
  - **3D novo (Three.js 0.187 + Vite + TypeScript):** página `3d.html`, código em `src/three/`.
  - Decisão do usuário: o 3D **substitui o 2D só quando estiver extremamente maduro** (veja o "Portão de maturidade" no PLAN.md). Até lá, não mexa no 2D sem pedido.
- **Protótipo 3D antigo:** `src/experiments/arrival-3d` é só referência. Não continue esse código nem reaproveite os personagens ou as armas dele.

## 2. Regras de trabalho do usuário (obrigatórias, de `AGENTS.md`)

1. **Uma etapa por vez.** Ao fim de cada etapa:
   - entregue um **link direto para testar** a mudança;
   - registre esse link no topo de `test-library.html`;
   - **espere o usuário validar** antes de começar a próxima etapa.
2. Informe **QA técnico** (o que você testou) e **aprovação humana** (o playtest do usuário) **separados**. Nunca declare algo visual aprovado só porque o teste automático passou.
3. Os testes devem **preservar os personagens e o progresso reais** do usuário.
4. Depois de cada atualização:
   - rode o typecheck e o build;
   - revise os arquivos alterados, sem incluir `node_modules/` nem `dist/`;
   - faça um commit descritivo;
   - dê `push` para `origin/main`, **nunca `push --force`**;
   - confira se o commit local é igual ao remoto antes de dizer que publicou.
5. Registre cada etapa no diário de [PLAN.md](PLAN.md): data, o que foi pedido, o que foi feito, o QA e as limitações.
6. **Comunicação:** responda em português, de forma direta e informal (o usuário chama de "irmão"). Explique o que mudou na prática do jogo, não no código.

## 3. Estado atual (fim de 27/11/2026)

Último commit aprovado: `deba61f` ("ficou ótimo"). Depois disso, ainda no Claude Code, foi entregue o passo 1 abaixo (**equipamento visível no herói**, 27/11 (6) no PLAN.md), que **aguarda o playtest do usuário**. Confira o `git log` e o topo da `test-library.html`.

O que já existe no 3D novo:

- **Personagens salvos** (`save.ts`):
  - lista "Seus personagens", com nome, aparência, classe (fixa depois de criada), fera e progresso próprio;
  - tudo salvo no `localStorage` do aparelho: `dante3d.heroes`, `dante3d.missions.<id>` e `dante3d.gear.<id>`.
- **Criador** (`character.ts`, `outfit.ts`):
  - corpo, pele, cabelo, sobrancelha, roupa do 2D e capacete;
  - 4 classes do 2D (`classes.ts`): Guerreiro Galáctico, Caçador Estelar, Manipulador Astral e Domador de Feras.
- **Combate:**
  - computador: botão esquerdo ataca na direção do cursor, botão direito ou Q usa a habilidade, Espaço é a esquiva, Shift corre, WASD anda;
  - celular: joystick e botões.
  - Cada classe tem o próprio kit. O Guerreiro tem a Investida do vazio.
- **Domador** (`pets.ts`): três feras com os papéis do 2D (Simbionte, Broto Guardião, Filhote da Geada). A escolha é feita no criador e pode ser trocada no abrigo das feras do acampamento.
- **Regiões** (`biomes.ts`, `world.ts`), na ordem aprovada:
  - Acampamento → Profundezas do Guardião (Warden) → Siroco (Soterrado) → Fratura Boreal (Vésper) → Caldeira (Incandescente) → Nascentes → Vale.
  - O portal norte fica selado até o chefe da região cair. `?livre=1` abre tudo para testes.
- **Criaturas** (`creatures.ts`):
  - habitats fixos como no 2D, com barras de vida;
  - modelos prontos e animados: Quaternius Ultimate Monsters (CC0) e arte do Flare (CC BY);
  - a aranha do acampamento vem do pacote Easyforge, pago e privado. **Nunca publique esse arquivo como asset público.** Ele entra pelo `virtual:arrival-hollow` e por `scripts/asset-tools/ensure-arrival-hollow.mjs`.
  - Bestiário isolado em `3d.html?bestiario`.
- **Missões** (`missions.ts`, `camp.ts`):
  - 9 missões com os textos do 2D, dadas por Nara, Lia e Ivo no acampamento;
  - seta guia, painel de missão e diário.
- **Nível, saque e equipamento** (`gear.ts`), a última etapa:
  - Reaproveita **direto** as regras do 2D: `src/config/progression.ts`, `equipment.ts`, `equipment-catalog.json` e `economy.ts`, mais `src/systems/Equipment.ts` e `BaseEconomy.ts`.
  - XP por criatura e por chefe, níveis 1 a 10 com mais vida a cada nível.
  - Material da região a cada abate, uma peça a cada 12 abates e um acessório na primeira vitória sobre cada chefe.
  - Ficha de equipamento na tecla I, com 7 encaixes e mochila de 24 espaços.
  - Poção na tecla R.
  - No acampamento: Lia vende poções e cura, Ivo fabrica, vende e desmonta, Nara guarda até 48 peças no cofre.
- **Som** (`audio.ts`): Tone.js e as músicas do 2D por região.

### Atualização de 27/11/2026 (noite): lote "pronto para teste"

Ainda **aguarda o playtest** do usuário. Veja 27/11 (8) no PLAN.md e o topo da `test-library.html`. O que entrou:
- conjuntos redesenhados;
- 8 expedições regionais com Registros de Dante;
- fim da história nos Terraços (rota segura e primeiro abrigo);
- Atlas de Dante (M) e prólogo do 2D;
- poção em frasco e celular deitado;
- coop, primeiro passo: salas `/coop3d`, `net.ts` e `server/relay3d.mjs`.

A comparação completa com o 2D está em [STORY_AUDIT.md](STORY_AUDIT.md).

Novos parâmetros de URL:
- `?teste=fim&cls=<classe>`: personagem temporário, com a história concluída até a caravana;
- `?sala=CÓDIGO`: entra numa sala;
- `?relay=ws://…`: troca o endereço do serviço de salas.

## 4. Próximos passos possíveis

O usuário ainda não escolheu. Pergunte qual seguir. Esta é a ordem sugerida:

1. ~~**Equipamento visível no herói**~~: entregue (`outfit.ts` por partes, `Character.setArmour`), aguardando aprovação. O que sobrou: visual da arma por nível (`weaponStyle` do 2D) e a cor da raridade na camuflagem do Domador.
2. **Melhorias de habilidade por nível:** `src/config/abilityUpgrades.ts`, com os marcos dos níveis 4, 6, 8 e 10 e os pontos ganhos com chefes. No 2D, isso fica em `src/systems/Progression.ts`.
3. **Vida própria das feras:** elas recebem dano, caem e voltam depois de um tempo.
4. **Fatias maiores do PLAN.md:**
   - extrair o núcleo compartilhado para `src/core/`;
   - S5, coop: reaproveitar `server/relay.mjs`, protocolo 16;
   - S6, paridade: auditar o 3D contra o 2D e medir o desempenho em máquina fraca e no celular.

## 5. Como rodar e testar

- **Servidor de desenvolvimento:** `npx vite --port 5199 --strictPort`, depois abra http://localhost:5199/3d.html.
- **Build:** `npm run build`, que roda o typecheck e o `vite build`. Só o typecheck: `npx tsc --noEmit -p .`.
- **Parâmetros de URL úteis:**

  | Parâmetro | O que faz |
  |---|---|
  | `?auto=1&cls=warrior&nome=Teste&fera=bulwark` | cria um personagem direto |
  | `?livre=1` | abre todos os portais |
  | `?biome=dunes` | começa numa região |
  | `?bestiario` | abre o bestiário isolado |
  | `?q=low` | qualidade leve |

- **QA automatizado:**
  - Use Playwright com o Chrome em SwiftShader: `--use-gl=angle --use-angle=swiftshader --enable-unsafe-swiftshader`. **Este PC não tem GPU**, então os tempos medidos são lentos e variam muito.
  - Os scripts ficam em `.local/looks/*.mjs`. A pasta `.local/` está no `.gitignore` e só existe neste computador. Exemplos: `sprint-gear.mjs`, `sprint-order.mjs`, `sprint-pets*.mjs`.
  - Ganchos de teste em `window.__d3`: `state`, `advance(s)`, `tp(x,z)`, `spawn(x,z,kind)`, `list()`, `goBiome`, `bossNow()`, `beat(boss)`, `journal()`, `gear()`, `xp(n)`, `give(id)`, `hurt(d)`, `openGear`, `openService(npc)`, `talkTo(npc)`, `perf()`, `cam(...)`.
  - Antes de testar, faça `localStorage.setItem('dante3d.help','1')` para pular a ajuda inicial.
- **Ver se o deploy saiu:** o `gh` não está instalado. Use `curl https://api.github.com/repos/brunomafra-dev/EchoesofDante/commits/<sha>/status` e espere `"state": "success"`. Depois confira se o JS publicado contém a mudança.
- **Ambiente:** Windows 11, com Git Bash e PowerShell.

## 6. Assets e lições aprendidas

- **Créditos e licenças:** `public/assets/3d-new/creatures/CREDITS.md`. Toda arte nova precisa de licença conferida e de crédito registrado.
- **Pipelines em Blender:** o Blender 4.5 fica em `.local/blender`; os scripts em `scripts/asset-tools/3d-new/`:
  - humanos MPFB2/MakeHuman: `make_human.py`, `build_character.py`;
  - natureza da Poly Haven: `fetch_earth.py`, `decimate_earth.py`;
  - Flare: `make_flare.py`;
  - Warden: `make_warden.py`;
  - armas: `make_weapons.py`.
- **Desempenho:**
  - As luzes pontuais eram o maior custo: o acampamento caiu de 140 ms para 13 ms sem elas. Use brilho pintado no chão (`World.fakeLight`).
  - Criaturas longe do herói não são desenhadas: mais de 30 m para monstros comuns e mais de 45 m para chefes.
- **Personagem:**
  - O GLB do herói tem o corpo inteiro; a pele só some sob a peça vestida, por meio das máscaras `_H_<peça>`.
  - Na redução de árvores, separe tronco e folhas, senão o tronco some.
- **Geração de imagem:** uma tentativa anterior de gerar folhas de sprite 2D com ImageGen e Gemini falhou no contrato de grade 8×6: só 5 de 36 folhas saíram corretas (registrado em `docs/RPG_FOUNDATION_ROADMAP.md`).
  - Se for usar o Gemini para imagens, prefira concept art, texturas, retratos e ícones de itens. Peça sempre uma prova pequena e a aprovação do usuário antes de produzir em lote.
- **Preferências já expressas pelo usuário:**
  - prefere modelos prontos e bem animados a corpos montados por código;
  - quer cada região com monstros próprios, sem repetir de um mapa para outro;
  - não quer apagar documentos antigos nem o 3D antigo ("deixa quieto").
