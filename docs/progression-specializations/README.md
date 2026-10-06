# Progressão e especializações — 0.1.54

O limite de nível passa de 5 para **10**. Os cinco marcos já existentes são
preservados; os próximos são 960, 1300, 1680, 2100 e 2560 XP acumulados.
Subir de nível continua restaurando a vida. O ganho de vida é +10 por nível
até o nível 5 e +5 nos níveis seguintes, chegando a 165 PV no nível 10.
Inimigos não escalam com o nível.

Nos níveis **4, 6, 8 e 10**, o jogador escolhe uma especialização entre Sabre,
Dash e Carga Cinética. Cada uma pode chegar a dois graus. As quatro escolhas
alteram propriedades do kit atual: arco ou alcance do Sabre; recarga ou duração
do Dash; largura ou força da onda cinética. Não são armas ou habilidades novas,
e não mudam o dano básico, a IA ou os controles.

| Escolha | Efeito por grau |
| --- | --- |
| Arco de ressonância | +0,06 rad ao arco do Sabre |
| Lâmina alongada | +10 unidades ao alcance do corte |
| Recarga de fase | −120 ms à recarga do Dash |
| Passo prolongado | +20 ms à duração do Dash |
| Onda ampla | +12 unidades à largura da Carga Cinética |
| Núcleo denso | +4 dano mínimo e +6 dano máximo à Carga Cinética |

O painel de escolha é curto, pausa o jogo enquanto está aberto e aceita teclado,
gamepad e touch. A escolha fica no mesmo save local já usado pela jornada. O
campo novo é opcional: saves antigos continuam válidos, derivam o primeiro
ponto não gasto do XP/nível e recebem a primeira escolha no nível 4. As escolhas
permanecem após reload, morte e travessia de portal. Não há sincronização entre
navegadores/dispositivos.

## Validação

- `npm run typecheck` e `npm run build`.
- `node scripts/qa-progression-specializations.mjs`: save legado, níveis 4/6/8/10,
  escolha e persistência por teclado, gamepad mock e touch emulado.
- [Relatório browser](qa/report.json), [seletor por teclado](qa/level-4-choice.png)
  e [seletor touch emulado](qa/level-8-touch-choice.png).
- Regressão de jornada, Vale e HUD: `qa-dante-expeditions`, `qa-sirocco-expansion`
  e `qa-hud-clarity`.
- Hardware físico de gamepad e celular não faz parte desta validação.

## Limites desta etapa

Esta é a primeira camada de builds do personagem, não uma árvore de talentos.
Não há resets de escolha, itens, novas armas nem save em servidor. O equilíbrio
dos bônus e o ritmo de XP precisam de playtest humano durante uma expedição mais
longa antes de expandir o sistema.
