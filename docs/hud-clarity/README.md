# HUD compacto — 0.1.46

Revisão de apresentação após o usuário considerar a tela carregada de texto,
painéis azuis e bordas. Organic Sci-Fi, arte, câmera e gameplay permanecem.

## Direção

Inspiração de hierarquia: recursos concentrados nas bordas, notificações
breves e espaço central reservado à ação. As capturas oficiais de
[Path of Exile 2](https://www.playstation.com/en-us/games/path-of-exile-2/)
serviram como referência de distribuição; nenhum asset ou ornamento foi copiado.

- Vida, nível, Ecos e XP ocupam um bloco pequeno à esquerda. A barra fina de
  XP representa progresso dentro do nível; valores completos continuam nos
  Registros. Não há logo ou nome do Guerreiro repetido durante a partida.
- Esquiva/carga mostram tecla, disponibilidade, recarga ou percentual em duas
  linhas compactas à direita. Saem os títulos grandes e instruções repetidas.
- Objetivo: título e uma linha de apoio; ao se aproximar, a instrução local
  substitui a direção distante. A indicação de investigação continua contextual.
- Ganho de experiência: **`+20 XP`**, sem caixa, borda ou origem. Ganhos próximos
  são somados no mesmo texto; desaparece após 1,2 s. Subida de nível tem uma
  linha breve. Mensagens narrativas preservam conteúdo/duração, com texto menor
  e sombra discreta, sem painel azul.
- A ajuda de controles aparece por 10 s, sem faixa de fundo, e pode ser
  consultada em **Registros → Controles**. Trocar teclado/gamepad reapresenta
  a ajuda; touch usa seus botões existentes. Gamepad navega também até a ajuda.
- Barra do Warden no alto, com menos largura/altura e sem moldura. Nome,
  fase, vida e aviso de ataque permanecem disponíveis.
- Touch mantém áreas de ação de 72 px na viewport 844×390; apenas fundo,
  contraste e rótulos secundários mudam. Captura, gestos e safe areas permanecem.
  Fontes essenciais aumentam quando o canvas FIT fica abaixo de 500 px de altura,
  evitando reduzir toda a interface indiscriminadamente no celular.

## Custo e limites

Dois pequenos apoios neutros translúcidos substituem os painéis grandes.
Texto usa sombra leve para leitura sobre pedra/vegetação. Graphics estáticos
são desenhados uma vez; não há animação, listener ou efeito por ganho de XP.
Timers de XP/ajuda são substituídos; ajuste de tipografia só ocorre quando a
categoria de tamanho muda. Nenhuma textura ou dependência nova.

Pista distante usa direção curta; instruções mais detalhadas aparecem perto
do destino ou nos Registros. Conforto de leitura e preferência de densidade
precisam de avaliação humana, principalmente em touch físico. As mensagens
do Primeiro Eco e da vitória continuam intencionalmente maiores que o HUD.

## Validação

QA dedicado: `node scripts/qa-hud-clarity.mjs URL PASTA_DE_RESULTADOS`.
Chrome headless, áreas/cenários DEV explícitos, entrada de teclado/mouse,
touch emulado e gamepad mock. Compara Forest, Cavern, Vale e Warden em
1280×720, 1366×768, 1920×1080 e 844×390, incluindo espaço entre textos,
ganho real de um Eco, expiração de avisos, ajuda consultável e portrait.

### Resultado técnico — 2026-10-04

- Typecheck e build passaram. Permanece o aviso conhecido de bundle Phaser.
- QA do HUD passou nas 16 combinações de região/resolução. O Eco concedeu
  seus 40 XP reais e exibiu `+40 XP`, sem fundo. Ajuda expirou; textos ficaram
  dentro do canvas, sem sobreposição entre nível/XP ou progresso/barra.
- Teclado/mouse, rótulos gamepad, consulta da ajuda, touch e portrait passaram.
  Os três alvos de ação touch continuaram com 72×72 px em 844×390.
- Regressão de jornada passou: Forest → Ecos → mecanismo → Cavern → First
  Echo → Warden → Vale, com posicionamento DEV e HP do boss encurtado apenas
  no teste. Três ciclos de morte/respawn/reload preservaram progresso e
  contagens; storage indisponível, reinício e pausas do combate passaram.
- Zero erros JavaScript ou carregamento. Touch/gamepad foram emulados;
  teste físico não foi realizado nesta atualização.
- Smoke da build de produção passou: sessão nova, teclado, save legado
  restaurado no nível 4 preservando HP, Registros nas quatro resoluções e
  UI touch emulada. A build não expõe o global de debug DEV.

A amostra da jornada mediu **59,43 FPS**, com **104 objetos, dois tweens e
uma única raiz de controles e de Registros**, estáveis nos três ciclos.
O mesmo estado de sete moradores no teste 0.1.45 tinha 116 objetos. Não se
atribui toda a variação de FPS à interface; são amostras de Chrome headless.

Como comparação de ocupação, os retângulos de apoio do HUD comum passaram
de aproximadamente **21,7% para 3,9%** da área lógica 1280×720. Essa conta
exclui texto, barra do boss, botões touch e modal de morte/Registros.

[Antes](before-valley.png) · [Depois](after-valley.png) · [Touch](touch.png) ·
[QA de layout](qa-report.json) · [Resumo da regressão](regression-summary.json)

**Automação passou. Avaliação humana de clareza e tamanho ainda necessária.**
Teste especialmente se as pistas curtas continuam suficientes para um jogador
novo e se os avisos do Warden permanecem legíveis no seu aparelho.
