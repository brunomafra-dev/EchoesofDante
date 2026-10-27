# Warden — consequência, contato e recuperação · 0.1.150

**27/10/2026:** usuário testou e aprovou esta revisão (“Aprovadissimo”) e autorizou o próximo boss, [Soterrado](../soterrado-counterplay/README.md). As pendências de aprovação abaixo são o registro histórico da entrega; não equivalem a uma avaliação separada da trilha sonora.

[Enfrentar o Warden vivo](https://echosofdante.vercel.app/campaign-playtest.html?warden=1&v=0.1.150) · [Biblioteca](https://echosofdante.vercel.app/test-library.html)

## Correção solicitada

O usuário rejeitou a mecânica da 0.1.149: golpes fracos, impacto em área sem animação suficiente e tempo para segurar auto attack entre preparações. A revisão continua restrita ao Warden. A aprovação dos percursos não aprova este combate; a música da 0.1.149 é preservada e a avaliação humana continua separada do QA.

## Mudança no combate

O golpe em área tem oito quadros inteiros novos de agachar, levantar garras, descer, contato, compressão e retomada. Poeira, fragmentos e onda são dois sprites de efeitos reutilizados; suas texturas são preparadas uma vez. Dano central ocorre no contato, 280 ms após o começo da execução; a onda sai em 980 ms, atravessando os raios 70–350 em 520 ms. O jogador pode sair da queda e atravessar a onda com Dash. Não é dano em todo o círculo a cada frame.

Varredura passa a ter ida e retorno, com ambos os setores visíveis desde a preparação. A descarga tem duas rajadas, e as marcas do chão têm manifestações no instante de ativação. A investida é mais firme. Intervalos menores de repouso/fase reduzem as pausas entre ações; fases de HP não interrompem um golpe já comprometido.

O Warden se protege durante a execução. Uma recuperação longa com núcleo exposto só acontece quando o ataque completo não causa dano real a nenhum integrante vivo. Acertar alguém deixa recuperação protegida de 420 ms; o próximo ataque continua com seu aviso completo. Dash e invulnerabilidade rejeitados pelo caminho real de dano não contam como acerto do boss. Flancos continuam atacáveis durante repouso/preparação, e a abertura limpa recebe multiplicador de 1,6. Não há instrução de solução na interface.

A marca frontal passa a anel completo durante a proteção de todas as direções; ambas desaparecem na abertura. A forma visível acompanha a regra de dano. A geometria das duas marcas é desenhada uma vez e reutilizada.

| Golpe | Dano-base atual | Dano contra personagem sem resistência em normal solo |
|---|---:|---:|
| Varredura | 30 por contato distinto | 35 |
| Investida | 38 | 44 |
| Queda das garras | 40 | 46 |
| Onda após queda | 28 | 32 |
| Descarga | 26 por rajada | 30 |
| Ecos | 36 por marca | 41 |

A escala regional existente de 1,15, dificuldade, equipamento e quantidade de participantes continuam aplicados. A graça de dano existente de 650 ms é preservada; contatos durante essa proteção não causam dano adicional. HP-base continua 900, ou 1125 após a escala regional em normal solo. Não há aumento de HP, quota de golpes ou nova recompensa.

Som e tremor do impacto acompanham o contato em vez do início da preparação. O visitante identifica a mesma manifestação no BossVisual existente; abertura protegida não dispara som de núcleo aberto. Nova textura e efeitos usam o protocolo 15, sem exigir mudança do relay. Mapas, colisões, requisitos, personagens, música, saves e recibos anteriores são preservados.

## Arte e execução

[Prompt, ferramenta e registro](art-prompt.md), [hashes/base/escala](art-source.json). A folha nova é usada só na sequência de impacto/recuperação correspondente; repouso, caminhada e demais poses aprovadas são preservados. Não há desenho estático por frame, agendamento de animações que cresça a cada ataque, luz dinâmica ou partículas acumuladas.

## Laboratório

O mesmo laboratório direto agora usa namespace temporário `dante-warden-combat-v2`, separado da tentativa anterior e de personagens reais. Simula somente os três Ecos, mecanismo, percurso subterrâneo, Primeiro Eco, portão e entrega dos três relatórios anteriores. “Além da fissura” continua aberto, Warden vivo, portal e recibo de vitória pendentes. Nenhuma vitória é simulada pelo link. O painel permite trocar classe e reiniciar; a campanha oficial não recebe esse atalho.

Para coop, criar uma equipe pelo início do laboratório, compartilhar o convite e, com todos presentes, usar RECOMEÇAR WARDEN VIVO no anfitrião. Convidado usa a mesma chegada e visual; nenhum requisito original do jogo foi removido.

## QA e limites

- [Combate e tentativas estacionárias](qa/combat.json): captura dos frames no relógio real, dano apenas no contato, queda/onda, Dash, abertura ganha, troca de fase sem cancelar ataque, cinco ataques e quatro classes segurando básico com IA viva. Posições/estado são preparados apenas nos testes isolados dos golpes; tentativas estacionárias preservam IA, HP e dano reais.
- [Vitória com movimento](qa/playthrough/playthrough.json): Guerreiro inicial, 120 HP, boss normal com 1125 HP, IA viva, sem reduzir HP, sem invulnerabilidade e sem poções; controlador escolhe movimento/Dash usando estado interno para exercitar o encontro. Vitória, 120 XP único, portal e reload reais. Esse controlador conhece as regras e não representa um humano descobrindo a luta.
- [Cooperativo](qa/coop/coop.json): dois processos Chrome e relay local real, dano no convidado determina recuperação, nova folha/onda/avisos replicados, abertura após erro do boss, vitória única, portal e reconexão.
- Controles touch emulados nas quatro classes, gamepad mock e capturas de resoluções permanecem distintos de teste físico em celular/controle.

Resultados técnicos: as quatro tentativas estacionárias terminaram em derrota, com os 1125 HP do boss intactos; R reconstruiu o encontro vivo em cada classe. O controlador com movimento venceu com 47/120 HP, sem poções ou invulnerabilidade, atravessando as três fases. O portal é aguardado após o golpe letal e o recibo é conferido após reload. Capturas diagnósticas de poses usam pausa explícita após a execução; o vídeo registra os golpes vivos antes dessa pausa. Na dupla, a recuperação é prolongada somente no fixture para estabilizar capturas e inspeção; a decisão de acerto/abertura permanece real.

Evidências adicionais: [controles](qa/controls/controls.json) e [build compilada](qa/compiled/public.json). `npm run typecheck`, `npm run build` e `git diff --check` compõem a entrega. O aviso conhecido do chunk Phaser permanece. Aprovação humana da luta continua pendente.

O teste funcional confirma que as regras são executadas; não declara a dificuldade, a animação ou a diversão aprovadas. A duração global de campanha continua sem medição humana. A avaliação de volume/música anterior também não é inferida desta revisão.

- [x] Playtest humano da revisão aprovado pelo usuário em 27/10/2026.
- [x] Usuário autorizou seguir ao Soterrado após a aprovação.
