# Dante — correções visuais, comunicação cooperativa e primeira colonização

**Próxima direção autorizada · 0.1.133:** aprofundar territórios existentes, missões e encontros; nome visível **Caçador estelar**. [Plano de expansão](DANTE_EXPANSION_ROADMAP.md) mantém colonização e progressão original, com 12 relatórios regionais opcionais na primeira entrega. Meta de 30 minutos sujeita a playtest; oito horas exigem novos capítulos futuros. [Teste reservado](regional-expeditions/README.md). Aguardar validação humana antes de outra expansão.

**Manutenção · 0.1.132:** [jornada e HUD de desktop](journey-hud/README.md). A captura do usuário revelou a preparação automática pós-Warden no laboratório do assentamento. Removida a simulação automática, com escolha explícita e aviso persistente; destinos também exigem seus marcos reais. Missões orientam a rota existente. HUD de PC agrupado nas bordas e viewport proporcional sem faixas. Mobile 0.1.131 aprovado pelo usuário em 22/10/2026. Esta revisão aguarda playtest; sem nova etapa de conteúdo.


**Manutenção · 0.1.128:** corrigir caminhada relatada no Guerreiro masculino com roupa inicial antes de avançar. [Assets completos, animação por distância e QA](warrior-walk/README.md). Não considerar correções anteriores uma garantia de animação aprovada; esta revisão aguarda teste humano.

**Manutenção · 0.1.127:** falhas da abertura em mobile/Brave motivaram fontes H.264 Baseline e WebM, reprodução por toque com som, recuperação e solicitação de tela cheia/horizontal. [Entrega e limitações dos navegadores](cinematic-compatibility/README.md). Sem avanço de etapa; fase 5 continua aguardando playtest humano.

**Correção da entrega · 0.1.126:** confirmado Render no protocolo 14. Consulta de endereço passa a ser compartilhada entre inspeção do convite e entrada após criação, evitando uma nova requisição que podia expirar e anunciar indisponibilidade indevida. Falhas não são armazenadas. Manutenção da etapa 5; continua aguardando validação humana. [Detalhes](first-settlement/README.md).

**Etapa atual · 0.1.125:** em 21/10/2026 o usuário autorizou avançar à fase 5 e pediu corrigir o Ivo flutuando e as manchas brancas da base. [Primeiro assentamento](first-settlement/README.md): dois mapas ramificados após o Warden, três missões finais, fauna local e instalação da carga habitável. Acampamento revisto. QA técnico e aprovação humana permanecem separados; não iniciar outra etapa antes do playtest desta entrega. A abertura aprovada e a mixagem vigente foram preservadas; a proposta isolada 0.1.123 não entrou no filme. Registros sonoros abaixo são históricos.

**Ajuste · 0.1.121:** trilha/fundo 0.1.120 aprovados pelo usuário; reforçar aceleração e propulsores sem alterar o restante. [Revisão dos motores](cinematic-opening/revision-06/README.md), ainda sujeita à escuta humana antes da etapa 4.

**Atualização · 20/10/2026 · 0.1.120:** usuário aprovou o visual/Nara da 0.1.119 e autorizou finalizar o áudio. [Trilha e efeitos](cinematic-opening/revision-05/README.md) com prioridade à dublagem; vídeo e vozes aprovados preservados. **Aguardar avaliação sonora desta entrega antes da etapa 4 — missões.**

Plano aprovado em 16/10/2026. Complementa o [plano da fundação RPG](RPG_FOUNDATION_ROADMAP.md). Organic Sci-Fi R3 / referência D, Art Bible e World Shape Language permanecem oficiais.

## Regra de execução

| Ordem | Entrega | Estado |
| --- | --- | --- |
| 1 | Personagens completos + início pelo clique na dificuldade | [0.1.103](character-cohesion/revision-03/README.md) validada para avançar; pente fino visual posterior |
| 2 | Nomes e chat da equipe | [0.1.104](party-chat/README.md) validada pelo usuário: “Deu certo perfeito irmão”; Render/Vercel e chat público conferidos |
| 3 | Piloto de cinemática; abertura completa após aprovação | Abertura completa aprovada pelo usuário, incluindo vozes e trilha. Revisão sonora encerrada a pedido dele, preservando a mixagem vigente; sem integrar a proposta isolada 0.1.123 |
| 4 | Missões, diálogos e diário desde a chegada | [0.1.124: quatro missões](arrival-missions/README.md), indicadores, tracker e progresso da equipe. Usuário autorizou avanço à fase 5 em 21/10/2026 |
| 5 | Dois mapas e primeiro núcleo habitável | [0.1.125: Nascentes e Terraços](first-settlement/README.md), três relatórios finais, módulo e colonos; revisão do acampamento incluída. Validação humana pendente |

Cada entrega termina com laboratório reservado que protege saves reais, QA, documentação, versão, commit e push. **A etapa seguinte aguarda validação humana.** Aprovação técnica e visual são registradas separadamente.

## Rejeição da 0.1.101

O usuário rejeitou a apresentação visual: o MP4 apenas animava pinturas estáticas com zoom, sem atuação; braços do seletor continuavam desconectados e iniciar ainda exigia confirmar a dificuldade. Compilar ou exportar MP4 não cumpriu os requisitos perceptuais. O registro anterior de “pose pintada completa” era incorreto: os corpos possuem mangas/cortes preparados para articulação separada. Não remover braços para esconder problemas de encaixe.

A abertura anterior fica como recurso legado até substituir pelo piloto aprovado; esta primeira entrega não a declara corrigida. Não repetir pinturas estáticas com pan/zoom como solução de cinemática.

## 1 — Personagens e começo imediato

- Auditar Guerreiro, Star Hunter, Manipulador Astral e **Domador de feras**, masculino/feminino, no seletor, jogador e aliados remotos.
- Compartilhar referências anatômicas, pontos de encaixe e cálculo de poses entre Canvas do menu e Phaser. Ligar torso, manga, braço, cotovelo, punho e mãos; preservar pegada/proporções/ordenação frente, costas e perfil.
- Manter mira contínua, caminhada e ações. Comparar roupa inicial, básica, avançada, armas e peças misturadas; nenhuma ação deve duplicar, alongar ou separar os membros.
- Solo: **Novo jogo → criar personagem → clicar na dificuldade → abertura → jogar**. Não selecionar dificuldade e depois confirmar.
- Coop: personagem → tamanho original da equipe (2–4) → dificuldade → abertura → lobby. O início da expedição continua esperando a equipe completa.
- Dificuldades mostram somente **Fezes puríssima**, **Marromenos**, **Chama 🔥**. Sem descrições de cada nível.
- Preservar rascunho de nome/apresentação ao voltar/configurar; proteger criação contra cliques repetidos.

## 2 — Comunicação cooperativa

### Nomes

Usar somente `profile.name` salvo: **Guilherme**, sem classe nem prefixo de anfitrião. Auditar preenchimento, convidados e reconexão. Mesmo componente para os quatro, inclusive o próprio no coop. Texto compacto, sombra discreta acima da cabeça, acompanhando animação; sem caixa/borda azul. Classes seguem no seletor/lobby.

### Chat

- Enter abre/envia; Escape cancela e retorna controle. Touch: botão discreto, campo, Enviar. Gamepad acessa o mesmo botão e o teclado disponível.
- Histórico `Guilherme: mensagem`; balão acima do autor por **5 segundos**, até **3 linhas**, substituindo o anterior. Abreviar somente no balão, manter texto completo no histórico.
- Até **200 caracteres**, histórico recolhível de **100 mensagens por sala**, somente em memória.
- Funciona no lobby, gameplay, personagem caído e espera de reconexão.
- Digitar bloqueia somente ações do autor, cancela carga sem disparo; não pausa a equipe. Letras/espaços/atalhos não podem mover, atacar, gastar poção ou abrir menu.
- Relay autentica autor pela conexão. Cliente envia somente texto. Renderizar como texto, nunca HTML.
- Intervalo mínimo de **1 segundo no servidor**. Rejeitadas não entram em fila.
- Eventos separados dos snapshots de combate: identificador único, autor e horário do relay.
- Reconectar recupera histórico sem duplicação ou balões antigos; viagem preserva histórico; fechar sala descarta.
- Atualizar protocolo e cliente juntos. Só declarar chat público funcional após confirmar **Vercel e Render**.

## 3 — Cinemática real

**Adição solicitada em 17/10/2026:** apresentar as quatro classes como equipe pioneira designada para reconhecer Dante. [Cena planejada de 4,5 s no hangar](cinematic-opening/pioneer-team.md), após a ponte e antes da descida; total previsto ~59 s. Sem criatura nativa a bordo antes de conhecer a fauna do planeta. Cena ainda não gerada, fora da prévia 0.1.109. Não avançar missões/mapas por causa desta atualização documental.

Piloto [0.1.108](cinematic-pilot/revision-04/README.md) aprovado pelo usuário em 17/10/2026, liberando a [abertura completa](cinematic-opening/README.md). Manter cenas inteiras e a técnica aprovada, com ampliação/interpolação explicitadas; sem remontagem de membros ou preenchimento de duração com quadros parados. A [preparação fal.ai](cinematic-pilot/revision-02/wan-test.md) permanece histórica, sem recarga/geração paga. Missões e mapas aguardam a avaliação da abertura completa.

Primeiro validar **12 segundos na ponte da nave**: pessoas operam equipamentos, caminham, olham e gesticulam numa conversa, com atuação perceptível mesmo com câmera parada. Não é carrossel ou zoom em pinturas.

Após aprovação humana: aproximadamente **55 segundos** com evacuação da Terra, viagem, descoberta de Dante, descida e pouso. Texto em português, ambiente/efeitos, sem dublagem nesta entrega. Animação produzida **offline**, **MP4 1280×720, 24 FPS**; manter pular, rever, pausa e mobile. Não prometer geração de filme a partir da mera exportação de imagens.

## 4 — Missões desde a chegada

Conversas curtas, aceite, acompanhamento e entrega:

| Missão | NPC | Resultado |
| --- | --- | --- |
| Primeiro reconhecimento | Nara | Reconhecer a Floresta |
| Condições de sobrevivência | Lia | Analisar água/atividade biológica |
| Energia desconhecida | Ivo | Investigar Ecos e mecanismo |
| Além da fissura | Nara | Descobertas até Primeiro Eco/Warden |
| Água para permanecer | Lia | Validar nascente na região nova |
| Uma rota segura | Ivo | Confirmar acesso aos terraços |
| O primeiro abrigo | Nara | Entregar resultados e instalar módulo |

Diário compacto, uma missão no HUD, marcas no minimapa/atlas; preservar serviços dos NPCs. Missões pertencem à campanha do time: qualquer integrante solicita aceite/contribui/entrega; anfitrião valida e replica. Diálogo local sem pausa coletiva. Recompensa pessoal única com recibo recuperável na reconexão.

## 5 — Mapas e consequência

Ramificação no **Vale da Ressonância após Warden**, sem repetir boss:

- **Bacia das Nascentes:** margens caminháveis, investigação e desvios.
- **Terraços do Amanhecer:** rota alternativa, solo investigável e abrigo.

Três pequenos encontros por mapa e espaços de descanso. Duas espécies locais com arte própria, usando comportamentos existentes. Sem boss neste capítulo.

Conclusão instala módulo habitável, reservatório e canteiro experimental em local fixo, com pequeno grupo de colonos. Usar carga da expedição. Sem construção livre nem agricultura produtiva nesta entrega.

Ampliar save/sincronização para missões/assentamento. Campanhas antigas preservam passagens, reconhecem descobertas anteriores e não repetem bosses ou recompensas.

## Validação obrigatória por entrega aplicável

- Quatro classes × duas apresentações × equipamentos × oito direções × ações; comparar menu/local/remoto.
- Clique único na dificuldade, voltar entre telas, duplicação e armazenamento.
- Chat em quatro navegadores: acentos, simultaneidade, limite, histórico, balões, morte, menus, viagem, reconexão e isolamento do input.
- Missões fora de ordem, entregas simultâneas, recibos únicos, reload, saves antigos, equipe original.
- Typecheck, build e QA aplicável; teclado/mouse, touch emulado e gamepad, 1280×720, 1366×768, 1920×1080 e 844×390.
- Preservar bake/cache. Medir FPS, objetos, texturas, listeners e balões após viagens/respawns.
- Links específicos na biblioteca. Automação não aprova autenticidade visual, ritmo ou diversão.

## Limites permanentes

Não substituir combate, controles, câmera ou direção D. Não revelar origem do Signal, da assinatura humana ancestral ou de Dante. Não antecipar fases posteriores sem o gate humano. Não criar geração de arte em runtime, redraw de cenário estático ou infraestrutura genérica desnecessária.


### Manutenção autorizada: personagens inteiros — 17/10/2026

Protótipo feminino aprovado pelo usuário; autorizada aplicação nas quatro classes, menu e cooperativo. [Arte e verificações](complete-actors/README.md). Isso não inicia missões nem encerra a abertura pendente.

### Revisão da abertura — 20/10/2026 · 0.1.118

Ponte aprovada; desembarque 0.1.117 não aprovado. Usuário autorizou variar vozes e corrigir a cena. [Revisão 03](cinematic-opening/revision-03/README.md): novo desembarque inteiro, abertura de 54,25 s montada/dublada no Concat, narrador/Ivo/Nara com vozes fixas. Essa autorização substitui a restrição anterior de ausência de dublagem nesta entrega. Sem vozes de heróis ou lipsync inventados. **Etapa 3 continua aguardando o teste humano; etapas 4 e 5 não iniciadas.**

### Aprovação e ajuste final — 0.1.119

Filme/vozes 0.1.118 aprovados pelo usuário. Solicitada Nara visível na saída dos heróis e revisão dos frames. [Revisão 04](cinematic-opening/revision-04/README.md): Nara inteira na rampa, mesma identidade/voz, pioneiros à frente, menor compressão e inspeção das oito cenas. **Este ajuste aguarda avaliação humana antes de iniciar a etapa 4 — missões.**
