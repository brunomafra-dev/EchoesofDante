# Caldeira de Dante + O Incandescente — 0.1.94

Interlúdio 5A autorizado pelo usuário antes do Vinculador. Uma região vulcânica caminhável após Vésper, com exploração e um boss original. Mantém Organic Sci-Fi R3/referência D, classes, controles, câmera, economia e nível máximo 10.

## Teste reservado

[Explorar a Caldeira](https://echosofdante.vercel.app/caldera-playtest.html?kit=advanced&v=0.1.94) · [Começar perto do boss](https://echosofdante.vercel.app/caldera-playtest.html?boss=1&kit=basic&v=0.1.94) · [Astral/água](https://echosofdante.vercel.app/caldera-playtest.html?boss=1&kit=basic&class=astral&element=water&v=0.1.94).

Painel permite mudar região, classe, apresentação e equipamento. Map-backed storage temporário preserva os saves reais. Convites usam a mesma página/região e personagens temporários. O laboratório começa no ponto seguro anterior ao boss, não dentro de um ataque. Recolha o painel para jogar.

## Campanha e espaços

**Vésper derrotado → registro do ninho → portal térmico → Caldeira → desvios → registro de basalto → limiar → Incandescente → registro térmico.**

- Área 3400×1800, na mesma GameScene e com a mesma câmera. Piso ilustrado contínuo, entrada com vapor e resíduo glacial, basalto e cinzas, lava nos limites e um amplo espaço seco à direita.
- Dois desvios: Prateleira de Obsidiana e Terraço das Cinzas. Cada registro de exploração concede 20 XP uma única vez, pelo sistema atual.
- Seis habitantes térmicos, em encontros separados: Rasga-areia e Cuspidor vítreo reutilizados do ecossistema existente, adaptados ao calor. Água é vantagem; fogo é resistência. Sem novo framework de IA ou novas habilidades.
- Registro de basalto responde ao Signal e abre o limiar. Não exige matar todos os inimigos, chave ou item.
- Checkpoint antes da arena, com spawn fora de colliders/detecção inicial dos habitantes. A estação de base está separada do portal da entrada. M mantém retorno/retomada no lugar da expedição.
- Portais ida/volta conectam Ninho e Caldeira; atlas, minimapa, guia e destino de base incluem a região.
- Lava funciona como margem geográfica; o jogador combate sobre basalto. Não há sistema de calor, stamina, travessia nadando ou dano contínuo global.

## O Incandescente

Criatura mineral antiga, com membros pesados, núcleo âmbar e crosta de basalto. Não é humano/mecha. Oito poses originais registradas: repouso, dois apoios de caminhada, preparo, impacto, varredura, arremesso e colapso. Mantém corpo em pé e alterna apoio; não gira o sprite de cabeça para baixo. Sombra de contato reutilizada.

Estado explícito: DORMANT → INTRO → IDLE → TELEGRAPH → EXECUTE → RECOVER, com PHASE e DEATH. Introdução de 2,2 s, controle do jogador preservado. Três fases a 65% e 30% do HP; padrões previsíveis e pausas para sabre/Q. Água +25%, fogo −25%; energia/terra neutros. Controle de água/terra não desloca o boss, seguindo a regra atual de corpos grandes.

| Ataque | Aviso | Execução | Recuperação | Dano base |
|---|---:|---:|---:|---:|
| Varredura de basalto | 950 ms | 240 ms | 1450 ms | 20 |
| Impacto circular | 1200 ms | 300 ms | 1900 ms | 24 |
| Fissuras em sequência | 1400 ms | 1050 ms | 1650 ms | 22 |
| Blocos incandescentes | 1250 ms | 1800 ms | 1650 ms | 18 |

Avisos possuem contorno, setas/linhas/cruzes e preparação corporal. Direções/marcas ficam comprometidas antes da execução. Três projéteis e três marcas reutilizados; cada ataque atinge cada participante no máximo uma vez. Dash/hurt grace continuam no dano atual. Boss não abandona a arena, e não existem invocações infinitas.

HP inicial 950 × fator regional 1,8 = **1710 solo**; dupla usa o fator existente 1,4 = **2394**. Dano regional 1,4 antes da resistência do equipamento. Moradores recebem HP/dano/XP pelo tuning regional fixo; não sobem automaticamente quando o jogador equipa uma peça.

## Recompensa e consequência

Vitória concede **260 XP e um ponto de domínio único**, usando bossRewards; material âmbar/créditos e acessório pessoal garantido do catálogo atual. Nenhum conjunto novo foi criado. Corpo colapsa, energia se perde e o registro térmico responde: o Signal atravessa a crosta e outras câmaras respondem. Não revela a origem de Dante nem inicia o Vinculador.

Morte cobra os 10% atuais dos créditos e preserva XP/equipamento/materiais. Reinício retorna ao checkpoint; HP/fase/ataques/timers/VFX do boss são reconstruídos uma vez. Após vitória, ele não reaparece na sessão/save. Na dupla, um sobrevivente mantém o combate; ambos caídos reiniciam, e vitória recupera aliados caídos.

## Arte, áudio e performance

Fontes/prompts em [illustration-prompts.md](illustration-prompts.md). Piso WebP 1536×1024 (~557 KB), atlas PNG 1024×512 (~557 KB), oito frames 256². Rochas, raízes, minerais, remanescentes, portais e máscaras de contato existentes foram reutilizados. Cenário estático composto em três RenderTextures; apenas estruturas selecionadas mantêm ordenação por pés/oclusão. Não há geração de arte em runtime.

Duas composições originais offline: **144 s de exploração**, **117 s de combate**, respectivamente ~2,0/1,6 MB MP3. Arranjos desenvolvidos por compassos, RMS ~0,06, pico 0,3, limites sem descontinuidade. Mesmo AudioManager/autoplay/MUSIC-SFX; assinaturas de impacto ancestrais existentes reutilizadas. [Métricas](audio-measurements.json).

## Persistência e cooperativo

Schema local 1 preservado; seis flags novas ausentes em saves antigos assumem false. Rotas/habitats/destino de base e reward `titan` reconhecidos; dependências garantem acesso após o registro de Vésper. Personagens/inventários não são resetados.

Frontend/relay **protocolo 7** incluem a região, conexões e recompensa do boss. Anfitrião continua autoritativo; visitantes operam mecanismo/portais, veem poses/avisos, levam seus próprios kits e recebem seus próprios recibos. Coop permanece com duas pessoas. Esta atualização requer deploy coordenado do serviço de salas; o endpoint público consultado durante desenvolvimento ainda respondia protocolo 4. Testar localmente não confirma publicação no Render.

## QA e limitações

Resultados em [QA da região](qa/report.json), [combates completos](normal-fights/report.json) e [regressão da campanha](qa/campaign-regression/campaign.json).

- Região: portais ida/volta, bifurcações alcançáveis, relay, checkpoint, base/retomada, quatro ataques, três fases, recompensa única, save e três mortes/respawns. **118 objetos, 209 texturas e um tween** estáveis nos três ciclos; uma única instância do boss.
- Dupla com WebSockets locais: visitante investiga, move, usa Dash/Q, acompanha a arena, recebe **260 XP e domínio uma única vez**. Um sobrevivente mantém a luta; ambos caídos reiniciam. Touch via CDP: movimento, arrasto/hold/release e zoom da página preservado.
- Combate com HP normal, equipamento básico e driver Gamepad API: Guerreiro venceu em **61,9 s**, Hunter em **37,3 s**, Astral/água em **54,0 s**. Sem HP reduzido, invulnerabilidade ou padrões forçados nessas lutas. O driver lê os avisos; esses tempos não representam dificuldade humana.
- Campanha anterior: Forest, Cavern, Warden, Vale, Siroco, Dunas, Soterrado, Fratura, Galerias e Vésper; inventário, visitantes, dano, viagem e persistência. As fixtures de posicionamento/HP usadas nesta regressão estão declaradas no relatório.
- Viewports 1280×720, 1366×768, 1920×1080 e 844×390; nenhum erro JS/carregamento nos relatórios. Caldeira em dupla, após limpeza do atlas: **59,3/58,9 FPS**; campanha anterior **58,1/60,0 FPS**, no mesmo computador. `npm run typecheck`, `npm run build` e `git diff --check` passaram; permanece o aviso já existente sobre o tamanho do chunk Phaser.

Sem teste físico de iPhone/gamepad. Movimento de perseguição direta permanece: habitantes podem ficar junto de rochas, sem pathfinding novo. A câmera continua seguindo o jogador; kiting muito distante pode deixar parte do corpo do boss fora da tela, mantendo barra e avisos dirigidos ao jogador. Os habitantes permanecem nos limites do mapa durante a luta, sem serem puxados para a arena pela restrição do jogador.

**Automação não aprova diversão, autenticidade visual ou dificuldade. Playtest humano necessário.** Após esta expansão validada, retornar à etapa 6 — Vinculador; não iniciar a próxima classe nesta entrega.

## Publicação e arquivos

Implementação: `a3104150ffabc40fc0a7e4d4206602ac6bb5e7fe`, versão 0.1.94. Deploy Vercel concluído. [Smoke público](qa/public/public.json): os três kits, hold/release Q, quatro viewports, quatro assets novos e isolamento dos saves passaram em Chrome. Sem erros JS/carregamento. **Cooperativo público não validado:** o Render ainda informou protocolo 4 em 13/10/2026; precisa publicar o código atual de `origin/main`, protocolo 7. A validação completa da dupla desta entrega utiliza o relay local real.

Arquivos principais:

- `src/config/caldera.ts`, `src/systems/CalderaRegion.ts`, `src/entities/CalderaTitan.ts`: região, composição e encontro.
- `src/scenes/GameScene.ts`, `GlacierRegion.ts`: conexão à campanha, interações e respawn.
- `LocalJourney.ts`, `Progression.ts`, configurações de ameaça/economia/bestiário/elementos: persistência, recompensas e regras existentes.
- `CoopSession.ts`, `PartyExpedition.ts`, `server/relay.mjs`: área e boss na dupla; atlas e barra do boss reconhecem a expansão.
- `caldera-playtest.html`, `src/experiments/threat-playtest/main.ts`, `vite.config.ts`, `test-library.html`: teste reservado.
- `scripts/prepare-caldera-art.py`, compositor regional, QA da região/combates/publicação; dois raster assets e duas faixas em `public/assets/`.

Validar humanamente: caminhos de basalto versus bordas de lava, escala/apoio do gigante, clareza dos quatro avisos, oportunidades de aproximação/Q, dificuldade com equipamento básico e retorno ao registro após vitória. Testes físicos de touch/gamepad continuam pendentes.
