# História do 2D no 3D: auditoria mapa a mapa

Escrito em 27/11/2026. Compara a jornada do 2D (`src/config/missions.ts`, `missionJourney.ts`, `regional-expeditions.json`, `permanence.ts`, atlas e prólogo) com o 3D novo (`src/three/`). Serve para decidir o que trazer a seguir sem perder a lore.

## 1. O mapa

O atlas do 2D (`public/assets/base/dante-expedition-atlas.webp`) tem 16 áreas numa cadeia. O 3D junta essas áreas em 7 regiões:

| Região do 3D | Áreas do 2D que ela representa | Guardião |
|---|---|---|
| Acampamento da Chegada (`camp`) | base, floresta | — |
| Profundezas do Guardião (`domain`) | caverna, profundezas, limiar do Warden | Warden |
| Bacia do Siroco (`dunes`) | Siroco (arid), Dunas, bacia do Soterrado (sandpit) | Soterrado |
| Fratura Boreal (`frost`) | Fratura, Galerias do Degelo, Ninho da Geada | Vésper |
| Caldeira de Dante (`caldera`) | Costa das Cinzas, Garganta de Obsidiana, Caldeira | Incandescente (Titan) |
| Bacia das Nascentes (`springs`) | Nascentes, Terraços do Amanhecer | — |
| Vale da Ressonância (`valley`) | Vale e seus desvios | — |

**Ordem das regiões:**
- **2D:** base → floresta → caverna → Warden → Vale → Siroco → Dunas → Soterrado → Fratura → Galerias → Ninho → Cinzas → Obsidiana → Caldeira. Nascentes e Terraços saem do Vale.
- **3D (aprovada pelo usuário):** Warden → Siroco → Fratura → Caldeira → Nascentes → Vale.
- O Vale e as Nascentes ficam por último. A razão narrativa é a mesma do 2D: com energia garantida, procurar água e rota para as famílias.

**No jogo:** o **Atlas de Dante** (tecla M) mostra essa correspondência sobre a arte do 2D, com névoa nas regiões fechadas.

## 2. Momento a momento

| Momento do 2D | No 3D | Situação |
|---|---|---|
| Prólogo em filme: evacuação da Terra e pouso da DANTE-01 | O mesmo filme e a mesma legenda, na primeira entrada de um personagem novo; dá para rever pelo menu | ✓ igual |
| Nara: "Primeiro reconhecimento" (clareira e trilha das raízes) | Mesmo texto, no acampamento | ✓ igual |
| Lia: "Condições de sobrevivência" (umidade e atividade biológica) | Mesmo texto; as leituras ficam nas Profundezas | ✓ adaptado ao mapa |
| Ivo: "Energia desconhecida" (3 Ecos e o mecanismo da fissura) | Mesmo texto; os Ecos e o mecanismo ficam no círculo de pedra das Profundezas | ✓ adaptado |
| Nara: "Além da fissura" (Primeiro Eco e limiar do Warden) | Mesmo texto; o arquivo ancestral e o Warden ficam nas Profundezas | ✓ adaptado |
| Vale, relé e portal para o Siroco | No 3D, o caminho vai do Warden direto para o Siroco | ✓ decisão aprovada |
| Siroco, Dunas e Soterrado | Missão "Sob a pele das dunas", texto da expedição regional `exp-dunes`, com o Soterrado | ✓ adaptado |
| Fratura, Galerias, Ninho e Vésper | Missão "Um abrigo contra a geada", texto de `exp-frost`, com Vésper | ✓ adaptado |
| Cinzas, Obsidiana, Caldeira e Titan | Missão "Antes de acender as forjas", texto de `exp-caldera`, com o Incandescente | ✓ adaptado |
| Lia: "Água para permanecer" (nascente) | Mesmo texto, nas Nascentes | ✓ igual |
| "Uma caravana atravessa o vale" | Mesmo texto, no Vale | ✓ igual |
| Ivo: "Uma rota segura" (Terraços) | — | ✗ falta |
| Nara: "O primeiro abrigo" (instalar o módulo) | — | ✗ falta |
| 12 expedições regionais | 4 viraram missões da história; **as outras 8 entraram nesta etapa** como expedições paralelas, com os achados originais | ✓ novo |
| 13 missões de permanência (`settle-*`) | — | ✗ falta: dependem de mecânicas (estrado puxado, válvulas, circuito de pulsos, mira do receptor, escolha de terreno) |
| Nara, Lia e Ivo com serviços (cofre, enfermaria, oficina) | Iguais, com as regras do 2D | ✓ igual |
| Elisa e Tio Gui no acampamento | Mesmas falas | ✓ igual |
| Mara e Choco, a segunda equipe | — | ✗ falta: chegam com `settle-arrivals` |
| Coop de 2 a 4 jogadores (protocolo 16) | Salas do 3D por código ou link: os jogadores se veem e veem os equipamentos uns dos outros | ◐ primeiro passo |

## 3. O que entrou nesta etapa

1. **8 expedições regionais**, com oferta, relatório e achados copiados de `regional-expeditions.json`:
   - floresta e caverna;
   - Siroco;
   - Galerias;
   - Cinzas e Obsidiana;
   - Nascentes e Terraços.

   Como funcionam:
   - Correm junto com a história, uma de cada vez.
   - Cada achado é guardado por criaturas da região.
   - Cada achado vira um **Registro de Dante** no diário.
   - A entrega paga créditos e uma peça de equipamento da região.
2. **Atlas de Dante** com a arte do 2D.
3. **Prólogo** do 2D.
4. **Coop, primeiro passo:** salas do 3D (`server/relay3d.mjs`, caminho `/coop3d`) no mesmo serviço do Render, sem tocar no protocolo 16 do 2D.

## 4. Próximos passos sugeridos, na ordem

1. **Terraços e o primeiro abrigo** ("Uma rota segura" e "O primeiro abrigo"):
   - fecham a história principal do 2D;
   - instalar o módulo pode ser uma construção visível nas Nascentes, com moradores chegando.
2. **Permanência, começando pelas missões mais simples de portar:**
   - `settle-water`: coletar, comparar, recuperar, isolar e instalar, quase tudo leitura e entrega;
   - `settle-food`: escolha entre dois lotes;
   - `settle-arrivals`: chegada de Mara e Choco.
   - Depois vêm as que pedem mecânica nova:
     - estrado puxado: `settle-transport` e `settle-outpost`;
     - válvulas: `settle-frost`;
     - circuito de pulsos: `settle-echo`;
     - mira do receptor: `settle-signal`.
3. **Coop, segundo passo:**
   - o anfitrião decide criaturas e chefes;
   - os convidados enviam acertos;
   - o saque é individual, como no 2D;
   - a missão do anfitrião vale para a sala.
4. **Melhorias de habilidade por nível** (`abilityUpgrades.ts`) e **vida das feras**, como já previsto no HANDOFF.
