# Etapa 6 — Vinculador de Dante · 0.1.96

[Teste reservado](https://echosofdante.vercel.app/xenobinder-playtest.html?kit=basic&v=0.1.96) · [Equipamento feminino inicial](https://echosofdante.vercel.app/xenobinder-playtest.html?sex=female&kit=initial&v=0.1.96) · [Incandescente](https://echosofdante.vercel.app/xenobinder-playtest.html?region=caldera&boss=1&kit=basic&v=0.1.96).

O usuário autorizou explicitamente encerrar a revisão vulcânica e avançar a esta classe. A revisão vulcânica terminou em `83cf3a6`, após `95f9bfa`, ambos publicados. Não registrar autorização de avanço como aprovação visual automática. Etapa 7 e prólogo não foram iniciados.

## Identidade e kit

Humano de expedição com condutor simbiótico, equipamento funcional e um **Simbionte de Dante** permanente: quadrúpede compacto, carapaça vegetal/mineral, tecido orgânico, olhos âmbar e barbatanas violetas. Criatura própria, sem reutilizar a pintura do Hollow. O humano compartilha o rig de ombros/braços já validado, com pinturas próprias de corpo e armas. Organic Sci-Fi R3 / D preservado.

- **Básico / RT / DISPARO:** pulso direcional de médio alcance. Somente acertar marca assistência durante 2,2 s. O simbionte aproxima-se desse alvo e morde quando está ao alcance e sem parede entre ambos. Não escolhe outro inimigo automaticamente. +8 Vínculo pelo básico confirmado, +10 pela assistência confirmada.
- **Q / LT / COMANDO:** segurar → mirar → soltar. O humano fica imóvel durante o carregamento existente; o simbionte prepara a investida. Release custa 35 Vínculo e inicia recarga de 6 s. Cancelar pelo menu ou registros não consome recurso. Sem Vínculo, o comando não começa.
- **Investida:** percorre a direção indicada, respeita obstáculos/limites e atinge cada alvo no máximo uma vez. Ao chegar/parar, emite um pulso curto: aliados vivos em 112 unidades e com linha de visão recuperam 8–14% de sua vida máxima, conforme a carga, sem ultrapassar o máximo. A cura acontece **na chegada do companheiro**, não globalmente; a direção importa. Não revive nem substitui as poções.
- **Vínculo:** 0–100, começa em 35, cresce por acertos em combate; sem geração passiva. Recurso de combate reinicia em 35 quando o ator é recriado na troca de região/respawn, como estado local do kit; não é uma nova moeda persistente.
- **Esquiva:** mesmos controles e semântica de movimento; valores próprios conservadores. HP 90% da referência do Guerreiro antes dos equipamentos. [Valores completos](balance.md).

Os seis aprimoramentos existentes continuam pessoais; títulos e descrições correspondem ao kit do Vinculador. Inventário, receitas, custos, atributos e IDs de equipamentos são compartilhados com a infraestrutura atual. Condutor de campo / simbiótico / ressonância têm miniaturas próprias no chão e na mochila. Capacete, torso, pernas, botas, luvas e acessório continuam visíveis sem colar uma armadura sobre outra.

O dano do kit usa o verde Natureza e permanece não elemental: não assume fraquezas/resistências do Astral. Nenhum valor das três classes anteriores foi alterado.

## Companheiro e integração

Estados explícitos **FOLLOW → ASSIST → COMMAND → RETURN**. Oito poses pintadas: repouso, dois apoios de caminhada, mordida, preparação, investida, pouso e retorno. Troca de apoio depende da distância percorrida, com sombra de contato; nunca gira o corpo de cabeça para baixo. Collider circular de 14 unidades, sem física por pixel, HP/aggro próprios, captura ou novo framework de IA.

Desvio local simples usa obstáculos existentes. Se ficar muito longe, reposiciona-se numa posição livre próxima somente em travessia silenciosa, sem inimigos próximos; não teleporta através de um combate. Na morte do dono, deixa de atacar/curar e é recolhido. Respawn recria apenas um companheiro. Limitação: não existe pathfinding global; formações complexas ainda podem atrasar o retorno.

## Solo e cooperativo

No solo, o sistema usa os mesmos alvos, resolução de dano, XP, drops e progressão da campanha. Na dupla, o anfitrião simula o companheiro de cada ator; o visitante apresenta poses/projéteis/pulso e vida recebidos, sem um segundo cálculo de dano, Vínculo ou cura. Os equipamentos e aprimoramentos continuam pessoais.

**Protocolo 9** aceita a quarta classe e suas poses. A sala continua limitada a **dois participantes**. A etapa 7 será a mudança para quatro classes sem repetição. Mudança necessária de identificação: nome + classe + sexo recriam o kit remoto quando a apresentação muda, evitando manter a classe antiga sob o mesmo nome.

## Arte e custo

Quatro folhas originais produzidas offline com imagegen, sem assets baixados: duas de vestimentas, uma do simbionte e uma de condutores. [Prompts](illustration-prompts.md), originais em `source-art/`, registro por `scripts/prepare-xenobinder-art.py`.

| Runtime | Dimensão | Uso |
| --- | --- | --- |
| 6 atlas de corpo | 1024×768 cada | 12 poses, células 256×256; masculino/feminino × roupa/básico/reforçado |
| 1 atlas do simbionte | 1024×512 | 8 poses, células 256×256 |
| 3 condutores | 128×96 | Armas inicial/atual/avançada |
| 6 miniaturas | 96×96 | Inventário e chão |
| Pulso | 256×256 | Recuperação localizada |
| Pulso básico / vínculo | 64×32 / 96×16 | Texturas reutilizadas |

19 PNGs runtime, **1.651.503 bytes (~1,58 MiB)**; sockets JSON adicionais. [Medidas](asset-measurements.json). Escala proporcional única, pés registrados; sem esticar pintura por eixo. Vestimenta composta/baked somente quando o equipamento muda. Os cenários e suas texturas não foram alterados.

Uma instância usa 13 objetos fixos de apresentação: corpo, sombra, ligação, marca, pulso, seis disparos e dois rótulos de cura. Sem tweens próprios, criação de objetos por frame, partículas contínuas ou geração de arte em runtime. Os sons atuais de carga/disparo são reutilizados; não foi adicionada uma trilha para a classe.

## Validação

QA técnico e aprovação humana são separados. `npm run typecheck` e `npm run build`, testes Chrome específicos da classe, seleção real, regressão de campanha e luta normal: relatórios em `qa/`, `campaign-regression/` e `normal-fight/`. Fixtures de posicionamento/dano são identificadas nos relatórios; luta normal não modifica HP nem dá invulnerabilidade. Touch por CDP e controle por Gamepad API mock, **nenhum teste físico de iPhone/gamepad**.

QA local: ambas as apresentações, três conjuntos, quatro resoluções (1280×720, 1366×768, 1920×1080, 844×390); segurar/soltar, cancelamento, assistência, recurso, dano único, cura limitada, ausência de revival/cura através de parede; anfitrião e visitante com WebSockets reais locais. Três mortes/respawns: 397 objetos, 238 texturas e 25 tweens existentes em cada ciclo da dupla, exatamente um simbionte. Medidas sob automações simultâneas/capturas oscilaram em ~49–53 FPS na dupla; não confundir com teste isolado nem aprovação humana de performance.

- [QA da classe](qa/report.json): todos os checks passaram, zero erros JS/assets. Botão mobile COMANDO e guia correto; nenhuma mudança nas regras de gesto/aim/gamepad.
- [Seleção real](qa/menu.json): quatro classes, masculino/feminino, prévias, nome com A/L, criação/reload e condutor equipado. Personagens novos continuam sem armadura; o item do teste de inventário é uma fixture explícita.
- [Regressão anterior](campaign-regression/campaign.json): Ecos e passagem pelo visitante, Cavern, Warden, Vale, Siroco, Dunas, Soterrado, Fratura, Galerias e Vésper; dano, loot, equipamento, saves e respawn, sem erros.
- [Regressão Astral](astral-regression/astral.json): quatro elementos, roupa, manopla, controle, recurso, campo, solo/dupla/touch/gamepad. Passou. Uma execução concorrente perdeu um prazo de réplica do elemento; execução isolada passou sem alterar a lógica do Astral.
- [Incandescente com HP normal](normal-fight/report.json): kit básico no nível regional, três fases, quatro ataques; vitória em 46,7 s, cinco comandos, três esquivas e dano recebido. Driver lê avisos; sem teleporte, invulnerabilidade ou edição de HP durante a luta. Não equivale a avaliação humana de dificuldade.
- [Convite pelo menu](qa/invite/public.json): criação real, convite mantido no laboratório, confirmação de personagem e visitante Vinculador; protocolo 9 local, sem gravar saves reais. Convites da Caldeira também preservam seu laboratório.
- [Campanha e colisão do companheiro](world/world.json): carregamento/movimento e posição livre em 14 destinos, da Base à Caldeira. Fixtures regionais declaradas, sem afirmar percurso manual completo. Três respawns solo conservaram 15 XP e restauraram HP: 391 objetos, 234 texturas, um simbionte em todos os ciclos.
- [Performance estabilizada](world/performance.json): comparação Guerreiro/Vinculador na mesma build, uma janela, 10 s de aquecimento por região. Floresta/Cavern/Caldeira: média suavizada **59,1–59,4 FPS**, contagem real **59,8–60,0 FPS** em ambas as classes; objetos constantes. As amostras regionais curtas de 47–50 FPS incluíam a recuperação da média suavizada após carregamento, portanto não representam o regime estabilizado.

## Limites e playtest humano

Balanceamento, sensação de simbiose, clareza das poses/vestimentas e ritmo de cura precisam do seu playtest. Avaliar básico + movimentação, Q curto/cheio, companheiro ao contornar pedra, troca de equipamentos, morte/retorno e dupla com aliado ferido. O teste reservado usa armazenamento temporário e não altera seus personagens reais.

Cooperativo **público** depende da implantação do relay protocolo 9 no Render; passar o teste local não comprova que o serviço remoto está atualizado. Estado público e resultados adicionais serão registrados na entrega. Não declarar quatro jogadores implementados ou avançar à etapa 7 antes da validação humana desta classe.

## Entrega técnica

`npm run typecheck`, `npm run build` e revisão de `git diff --check` passaram. Permanece somente o aviso conhecido de tamanho do bundle Phaser. Código novo: `XenobinderCombat`, `XenobinderArt`, `XenobinderPanel`; integrações pequenas em Player/GameScene/PartyActor/PartyExpedition, perfis, equipamento, HUD/seleção/aprimoramentos e apresentação touch. Nenhum mapa, narrativa, áudio, inimigo ou valor das classes anteriores foi modificado. Os testes e registro offline ficam em `scripts/*xenobinder*`; versão em package/lock, plano/README e biblioteca atualizados.

**Automação passou. Playtest humano necessário.**

## Publicação — 14/10/2026

Implementação `3e95f2b9d72ca67ba8f94044be5a47d6a6884aa5`, versão **0.1.96**. Push para origin/main e deploy Vercel confirmados. [QA publicado](qa/public/public.json): masculino/feminino, Q consumindo Vínculo, kit avançado na Garganta, imagens carregadas e armazenamento real preservado; zero erros JS/assets. `soloPassed: true`.

**Pendência externa de salas:** o Render ainda respondeu **protocolo 4**, enquanto esta versão exige **9**. O teste público registra `coop: blocked-relay-deployment`; não confundir com a dupla WebSocket local validada. Sem acesso autenticado ao painel do Render, não foi possível atualizar esse serviço. Publicar o origin/main atual em `echoes-of-dante-rooms` é necessário para validar a dupla online. A avaliação humana da classe também permanece pendente; etapa 7 não iniciada.
