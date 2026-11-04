# Criaturas importadas · 0.1.187

O usuário pediu importar criaturas com acabamento de outros projetos, usando WoW, Path of Exile e Diablo como referências. Esta correção permanece no protótipo solo de acampamento e floresta. A 0.1.186 foi publicada e passou no QA público, mas isso não representa aprovação estética humana.

[Predador de quitina](https://echosofdante.vercel.app/arrival-workshop.html?v=0.1.187&subject=hollow) · [Companheira alada](https://echosofdante.vercel.app/arrival-workshop.html?v=0.1.187&subject=pet) · [Jogar chegada e floresta](https://echosofdante.vercel.app/arrival-3d.html?v=0.1.187) · [Biblioteca](https://echosofdante.vercel.app/test-library.html)

## Escolha e adaptação

Dois modelos completos do **Flare**, RPG de ação aberto, substituem os corpos/segmentos procedurais do ensaio. O antlion de Clint Bellanger assume os oito Hollow existentes, mantendo IDs, posições, 68 HP, dano, alcance, colisão, preparação de 0,33 s e mortes finitas. A earth wyvern de Clint Bellanger, com textura pintada de Justin Nichol, acompanha o Domador. Marcação, auxílio, investida, cura, vínculo e requisitos conservam suas regras; o voo é uma representação visual e não concede travessia de obstáculos.

São imports de malha, rig, pesos e poses, não extrações dos jogos proprietários citados. [Fontes e créditos por arquivo](https://github.com/flareteam/flare-game-art-src/blob/8830c68b420b631e09a459e5b0bf87c0e068a558/CREDITS.txt): antlion em **CC BY 3.0** e wyvern em **CC BY-SA 3.0**. Derivados mantêm essas licenças, incluindo ShareAlike da wyvern, com créditos/links e alterações descritas no [arquivo distribuído](../../public/assets/arrival-3d/CREDITS.md). Não foi incorporado código do motor Flare. Ryzom foi consultado como alternativa, sem arquivos incorporados.

Conversão offline no Blender 4.5 LTS, fontes fixadas por revisão/SHA256. Removidas apenas curvas antigas para ossos de tornozelo ausentes; vínculo de parent explícito conserva a pose de bind. Cor procedural do antlion rasterizada em atlas 512 px sem a normal de pedra externa indisponível, quitina marrom e normais suavizadas. Textura earth original reduzida para 512 px/WebP. Cada criatura tem um material e uma malha com skin, sem peças de membros recompostas por frame. Geometria/texturas são compartilhadas; cada indivíduo tem seu esqueleto e mixer. Os dois GLB somam aproximadamente **423 kB**, carregados uma vez. [Manifesto](../../public/assets/arrival-3d/creatures-187.json), [reprodução](../../scripts/asset-tools/README.md).

Repouso, deslocamento, ataque e derrota usam poses importadas com transições curtas. Golpe do predador acompanha a preparação existente; cadáver segura a última pose, inclusive após reload. A companheira alterna hover/voo/ataque. Oficina permite escolher movimento e derrota, girar e aproximar; links diretos selecionam cada criatura. Em paisagem estreita, a área do modelo fica ao lado do painel para evitar encobri-lo.

Humanos, armas, poderes, NPCs, nave, natureza, iluminação geral, terreno, rotas e requisitos permanecem. Arquivos legados da identidade 0.1.186 continuam distribuídos para as outras peças, mas suas criaturas antigas não são instanciadas. Não há novo mapa, boss, economia, coop 3D ou alteração do relay.

## Isolamento e QA

A oficina não carrega ou escreve personagens/progresso. A entrada jogável usa o ensaio temporário da aba; nenhum pré-requisito ou boss vencido é simulado na entrada normal. Fixtures de QA são explícitas nos respectivos relatórios; a campanha anterior deve permanecer idêntica.

- [x] Typecheck/build, hashes das fontes/modelos e 86 arquivos da campanha anterior.
- [x] Poses completas, ataque/derrota, limites do skin, cadáver, reload e companheira.
- [x] Percurso, quatro classes, touch/gamepad emulados, oficina e layouts.
- [x] Desempenho isolado e inspeção visual das capturas.
- [ ] Commit/push, sincronização e publicação dos arquivos/acessos.
- [ ] Playtest e aprovação estética humana. iPhone físico e coop 3D não validados.

Evidências em `qa/0.1.187/`. **QA técnico não aprova a estética por conta do usuário.** Aguardar avaliação antes de Siroco ou ampliação do mundo 3D.

Amostras aquecidas a 1440×900/DPR1, três janelas de dois segundos por cena: base: 40.2–40.7 FPS, 153 chamadas; forest: 57.5–58.0 FPS, 65 chamadas. Sem build, Blender ou outro QA de navegador em paralelo; não representam combate contínuo ou iPhone físico. Dez relatórios compilados passaram e as capturas foram inspecionadas pelo agente. O primeiro roteiro de percurso ainda escolhia a rampa antiga quando a versão deixava de ser 0.1.186; tentativa preservada em `observations/ramp-coordinate/`, corrigida a seleção da coordenada no teste sem alterar física ou acessos do jogo.
