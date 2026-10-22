# Expedições regionais · 0.1.133

[Testar expansão](https://echosofdante.vercel.app/campaign-playtest.html?missions=1&depth=1&class=hunter&v=0.1.133) · [Biblioteca](https://echosofdante.vercel.app/test-library.html)

## Como avaliar

O link inicia um Caçador estelar temporário na base, com a campanha original intacta. Converse com Nara; os demais relatórios ficam disponíveis conforme os relatórios principais e as travessias são concluídos. J abre o diário e permite alternar Campanha / Expedições regionais. Uma missão pode ser acompanhada; as demais continuam aceitas.

Para revisar apenas as áreas alteradas, abra o painel reservado, escolha uma região e clique em **Simular exploração nesta região**. A confirmação explica que essa prévia solo considera campanha/bosses concluídos somente nesta aba. O jogo oficial não possui esse atalho. Reiniciar teste apaga apenas a sessão do laboratório. No cooperativo, use a campanha normal e compartilhe o convite do laboratório; a simulação rápida regional é exclusiva do solo.

## Conteúdo

| Região | Relatório | Responsável | Crédito pessoal |
|---|---|---|---:|
| Floresta | Remédios entre as raízes | Lia | 45 |
| Cavernas | O que corre sob a pedra | Ivo | 60 |
| Vale | Uma caravana atravessa o vale | Nara | 65 |
| Siroco | Sobreviver ao Siroco | Lia | 70 |
| Dunas | Sob a pele das dunas | Ivo | 75 |
| Geada | Um abrigo contra a geada | Lia | 80 |
| Galerias | Água sob o gelo | Ivo | 85 |
| Costa das Cinzas | Calor que pode servir | Ivo | 90 |
| Obsidiana | As paredes guardam pulsos | Nara | 95 |
| Caldeira | Antes de acender as forjas | Ivo | 100 |
| Nascentes | A nascente não está sozinha | Lia | 70 |
| Terraços | Lugar para mais alguém | Nara | 80 |

Cada relatório possui três locais e observações específicas; 36 descobertas no total. Há 72 habitantes adicionais, seis por região em duplas, aproveitando as espécies próprias de cada ambiente. Não há quota de mortes nem objetivo repetível. A Floresta ganha clareiras/caminhos; os demais mapas ganham composições menores dentro dos limites existentes. Arenas dos bosses não foram ampliadas ou removidas. Os três locais da Caldeira ficam antes do limiar do Incandescente.

## Regras e compatibilidade

As sete missões centrais e os portões originais permanecem. Novos relatórios exigem o relatório anterior correspondente; regiões glaciais exigem a vitória no Soterrado e regiões vulcânicas a vitória em Vésper. O atlas exige acesso legítimo e descoberta prévia. Nenhuma missão altera flags de boss ou marca novas regiões visitadas.

Investigações contam mesmo antes do aceite. Entregar rende créditos pessoais uma vez, usando os recibos existentes; os doze relatórios somam 915 créditos adicionais. Sem novo item obrigatório, material ou aumento global de HP. Residentes novos recebem IDs estáveis 1900–1971, abaixo do limite do save, e concedem XP/drops pelas regras regionais existentes; após mortos não reaparecem nesse save. Não alterar a ordem do catálogo sem migração desses IDs.

Missões e evidências usam o save schema 1 existente com catálogo ampliado; saves antigos mantêm seu progresso. No coop, os locais são validados no anfitrião pelo input/posição real de qualquer integrante, e o snapshot distribui a descoberta. Aceite/entrega usa solicitação autenticada e recompensa pessoal com recibo. Relay e cliente precisam do **protocolo 15**.

## Arte e desempenho

Sem novos PNGs ou geração de arte. Reutilizados: `world-rock`, `ancient-remnant`, `deep-mineral` e props de água, biologia e solo. Cada mapa tem até três composições estáticas 512×384, aproximadamente 2,25 MiB RGBA no total, além de sprites existentes. No máximo três legendas locais, mostradas por proximidade, sem placas grandes. RenderTextures são descartadas no reinício da cena. Novos habitantes aparecem uma vez ao aproximar a equipe; durante um boss ativo não nascem nem podem ser analisados locais.

## Validação e limites

Resultados técnicos e capturas ficam em `qa/`. Os scripts informam explicitamente o uso de posicionamento/fixture; não equivalem a uma travessia humana de 30 minutos nem aprovação visual. **30 minutos é uma meta de ritmo, ainda não medida. Oito horas é a direção futura**, arquivada em [plano de expansão](../DANTE_EXPANSION_ROADMAP.md).

Avaliar caminhando e combatendo: clareza dos desvios, leitura das descobertas, dificuldade do acúmulo de moradores e retorno à base. A entrega reutiliza as espécies atuais, sem arte de monstro nova; cavernas inteiras compartilham um único relatório, distribuído entre seus setores. Geografia maior dos demais mapas e novos capítulos aguardam esse playtest.

### Resultados locais

- `npm run typecheck` e `npm run build`: passaram; aviso habitual do tamanho do chunk Phaser permanece.
- [Modelo](qa/model.json): catálogo, pré-requisitos, evidências antecipadas, 325 créditos centrais + 915 opcionais, persistência e XP único.
- [Doze regiões](qa/browser.json): 36 análises por E, navegação de aproximação em grid com raio do jogador, seis moradores adicionais por região e XP na morte. NPC/entrega real e abas do diário em 1280×720, 1366×768, 1920×1080 e 844×390. Posições aceleradas explicitamente; não é medição da duração.
- [Campanha original](qa/journey/report.json): Floresta → Ecos → mecanismo → cavernas → Primeiro Eco → Warden → Vale, ataque/recompensa, pausas, morte/respawn, reload e gamepad mock. Média local de 57,0 FPS no trecho amostrado.
- [Controles](qa/mobile/controls.json): quatro classes, oito direções de mira, duas mãos, Q, cancelamento, HUD em quatro tamanhos e WebKit emulado.
- [Dupla compilada](qa/compiled-mobile/report.json): telefone anfitrião e tablet visitante, convites, espera, chat, movimentação/mira remota; sem globals DEV. Dispositivos físicos não testados.
- [Relay](qa/regression/mission-protocol.json): quatro conexões, catálogo de 19 missões/36 descobertas, autor autenticado, viagens e equipe original. Regressões de campanha/chat também passaram em Node.
- [Estabilidade](qa/stability.json): três recriações adicionais de cena, sempre 3 locais, 6 novos residentes, 18 RenderTextures totais, 234 texturas compartilhadas, um controller/tracker, 5 listeners de resize e 26 de shutdown. Após aquecimento, Floresta a **59,8 FPS**; nenhuma captura durante essa amostra. As amostras curtas durante a varredura variaram de 53,7 a 59,9 FPS. Morte/respawn mantém a descoberta.

- [Contribuição regional em dupla](qa/coop/report.json): dois Chrome independentes, relay real, visitante aceita, analisa os três locais e entrega; anfitrião valida e replica. Ambos recebem exatamente 45 créditos e a interrupção/reconexão do transporte mantém os recibos. Fixture de história e posicionamento DEV estão descritos no relatório; não é um playthrough humano.

Reprodução: `node scripts/qa-regional-model.mjs`, `node scripts/qa-regional-expeditions.mjs`, `node scripts/qa-regional-stability.mjs` e `node scripts/qa-expeditions-coop.mjs` (este usa Vite com relay atualizado na porta 5186 por padrão). `QA_BASE`/`QA_OUT` permitem escolher servidor e pasta de resultados. Reiniciar Vite após mudança no relay; os módulos do servidor são carregados no início do processo.

### Publicação verificada · 22/10/2026

Implementação `d1b8dc9`, versão 0.1.133, enviada a origin/main. GitHub confirmou a publicação da Vercel. [Smoke público](qa/public/smoke.json): biblioteca, build sem globals DEV, início com portões bloqueados, simulação regional explícita e diário com 12 + 7 relatórios passaram; sem erro JS ou asset ausente.

**Pendente externo:** o mesmo smoke terminou com falha de alinhamento do relay: Render permaneceu no protocolo **14**, revisão `edc583e0aaba2b9ff43209e6723ac0084b188dad`, após doze consultas. Esta entrega requer **15**. Isso impede declarar o cooperativo público funcional, embora o relay atualizado e os dois clientes locais tenham passado. É necessário publicar `d1b8dc9` ou posterior no serviço `echoes-of-dante-rooms`; solicitado ao usuário o estado no painel privado. O teste público completo poderá ser repetido com `node scripts/qa-expeditions-public.mjs` após o deploy. O solo está publicado e disponível no link acima.

Aprovação visual, ritmo e duração humana continuam pendentes. Aguardar esse playtest antes do próximo capítulo.
