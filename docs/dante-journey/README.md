# Jornada persistente e expedições — 0.1.44

Primeira base para revisitar Dante: save local, habitats renováveis no Vale e
um bestiário de observação. A geografia, arte, colisões, câmera, dano, velocidade,
habilidades e IA existentes permanecem. Não acrescenta regiões ou criaturas.

## Jogar e continuar

O arquivo `echoes-of-dante.journey.v1` em localStorage registra XP, Ecos,
recompensas anteriores, acesso às passagens, Primeiro Eco, vitória do Warden,
região, HP, checkpoints narrativos, visitas no Vale, bestiário e intervalos dos
habitats. O nível é recalculado pelos limiares existentes; o máximo permanece 3.

Reabrir a mesma URL nesse navegador restaura a região em um ponto seguro já
existente, com o HP salvo. Morrer conserva progresso e restaura HP. O boss ainda
vivo reinicia HP/fases no retorno; o boss derrotado permanece derrotado. Posição
exata, ataques em curso, projéteis e HP dos moradores não são serializados.

Gravações ocorrem em descobertas, dano recebido, derrotas, checkpoints,
travessias, abertura dos Registros e ao ocultar/fechar a página. Não há loop de
gravação por frame. Flags incompletas são normalizadas pelas dependências de
acesso; dados corrompidos ou versões desconhecidas iniciam uma sessão segura.
Falha de leitura/gravação não bloqueia o jogo. O painel informa a disponibilidade.

Save local não é conta/nuvem/cross-save. Limpar dados do site remove progresso;
outra origem, navegador ou dispositivo possui outro arquivo. A versão anterior
não tinha save durável e não pode ter sua sessão antiga recuperada depois de fechada.

## Expedições no Vale

Três zonas existentes recebem registro de visita: Passagem entre cristas
(rota central), Desvio mineral (norte) e Bacia enraizada (sul). Depois da resposta
ancestral, o guia sugere trechos ainda não visitados. Visitas não concedem XP
nem condicionam qualquer passagem.

Os seis habitats mantêm posições, espécies e ataques existentes. Ao morrer,
um morador deixa um intervalo de **90 segundos** registrado pelo relógio local.
O próximo só nasce quando o jogador está a pelo menos **480 unidades** da origem,
fora do alcance de detecção original. Nunca existem mais de seis moradores vivos.
Respawn, reload e retorno pelo portal preservam intervalos. O tempo continua
passando com o jogo fechado; ao voltar, a regra de distância permanece.

Cada novo morador derrotado concede **15 XP**, usando a progressão atual.
Forest/Cavern conservam a recompensa única por habitat, agora persistida.
Não há kill gate, loot, novos níveis, escalonamento ou pathfinding. XP pode
continuar acumulando no nível 3; ampliar progressão é uma decisão posterior.

## Registros e bestiário

Botão **REGISTROS**, teclado **B** ou gamepad padrão **botão 8 / Voltar**.
O bestiário registra as seis espécies ao aproximar-se (320 unidades); o Warden
só é registrado após despertar. Cada registro contém nome, habitat, uma pista
de combate e contagem de derrotas. Dados desconhecidos continuam ocultos.

A consulta pausa a cena e cancela gestos/carga em preparação. Fechar devolve
foco ao canvas, sem ataque por release acidental. O relógio de combate desconta
o tempo de consulta: telegraphs e cooldowns não saltam ao voltar. Botões do
gamepad usados no painel precisam ser soltos antes de voltar a gerar ações.
Gamepad usa analógico esquerdo
para rolar, direcional para escolher botões, A para ativar e B/Voltar para fechar.
Touch usa botão e rolagem normal no painel, fora da superfície protegida de gameplay.
**NOVO PERCURSO** exige confirmação; cancelar preserva tudo. A limpeza impede
que pagehide regrave o percurso apagado.

## Performance e validação

Sem novas texturas, RenderTextures, tweens, arte ou redraw de cenário. O painel
DOM e seus seis cartões existem uma vez por cena; conteúdo só muda na abertura.
Identificação usa WeakMap; habitats são mapas limitados a seis IDs. Listeners
de página/jornal são removidos no shutdown.

QA reproduzível: `node scripts/qa-dante-journey.mjs URL PASTA_DE_RESULTADOS`.
Chrome headless usa posições DEV para avançar e a cadeia real de interações/
dano. A expiração do intervalo usa timestamp DEV explícito, sem fingir espera
real de 90 segundos. Os QA existentes de Vale, preparação e boss foram ajustados
para o novo comportamento de reload/renovação. Testes de controles usam emulação
touch e Gamepad API mock; não validam hardware.

Resultado de 04/10/2026: typecheck e build passaram. O QA da jornada percorreu
Floresta → Ecos → mecanismo → Cavernas → Primeiro Eco → Warden → Vale, com
interações reais e posicionamento DEV. Verificou reload dos marcos, intervalo
persistente, duas derrotas do mesmo habitat, três ciclos de morte/respawn/reload,
reset confirmado, arquivo inválido, armazenamento indisponível e consulta por
teclado/gamepad/touch. Duas pausas durante telegraph do Warden preservaram sua
janela e o cooldown do Dash; abrir Registros com um segundo dedo cancelou a carga.
Rolagem touch nativa e layouts 1280×720, 1366×768, 1920×1080 e 844×390 passaram.

Amostra de cinco segundos no Vale: **59,58 FPS médios**, **zero gravações durante
ociosidade**, arquivo de **898 caracteres**; **99 objetos**, **2 tweens** e um
único painel/raiz touch mantidos nos três ciclos. Valores são uma medição local
Chrome headless, não garantia em aparelhos físicos. Nenhum erro JS ou de asset
foi detectado no QA da jornada. Capturas e relatório resumido acompanham este documento.

Regressões de Vale, preparação e boss passaram; a build de produção também
restaurou HP/XP/Ecos/bestiário de um arquivo controlado, sem o hook DEV.
Quatro reinícios mantiveram cinco listeners de update, um de pointerdown e um
de teclado, com um painel e uma raiz touch. Detalhes: [QA resumido](qa-summary.json).

[Registros no desktop](records-desktop.png) · [Rolagem touch emulada](records-touch.png)

### Playtest humano

1. Fechar e reabrir a mesma URL após Eco, passagem, Primeiro Eco e vitória.
2. Explorar os três trechos do Vale; derrotar um morador, afastar-se e voltar
   depois de 90 segundos. Não deve nascer na sua frente.
3. Abrir Registros durante uma carga, fechar e continuar sem disparo involuntário.
4. Conferir leitura/rolagem em iPhone e ergonomia com gamepad físico.
5. Usar Novo percurso, cancelar e confirmar somente quando desejar apagar.

O conforto e o interesse de revisitar esses habitats dependem desse playtest.
Esta etapa estabelece a continuidade; novos objetivos/recompensas de médio
prazo permanecem para expansão posterior.
