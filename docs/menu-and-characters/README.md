# Entrada, menu e personagens · 0.1.63

Tela inicial sem conta/login: continuar a expedição, escolher/criar personagem e configurar áudio. Esc ou MENU pausa; Start abre o menu no controle quando o personagem está vivo. Voltar retoma a luta com o relógio de combate preservado. Registros/bestiário e escolhas de aperfeiçoamento continuam nos painéis existentes. Em morte, Start mantém a função de respawn.

Cada personagem possui nome, classe e jornada independente. Até seis perfis locais; nesta etapa o Guerreiro é a classe disponível. A segunda classe será habilitada depois de receber o descritivo oficial solicitado ao usuário. Não apagar o Guerreiro atual para experimentar outro personagem.

Compatibilidade: o Guerreiro anterior usa o mesmo `echoes-of-dante.journey.v1`; os demais usam chaves por ID. `LocalJourney` fixa sua chave ao carregar: o flush da página anterior nunca escreve no personagem recém-selecionado. Saves corrompidos ou armazenamento indisponível mantêm o jogo disponível; criação/troca falha com mensagem e preserva o personagem atual.

Volumes geral, música e efeitos usam o AudioManager existente, com preferências locais. Fundo reutiliza o terreno ilustrado das Dunas, sem assets novos ou login/backend. Ao pausar, gestos/charge são cancelados pelo mecanismo de modal existente; áudio de exploração fica contido. Menus têm navegação por teclado, controle padrão e touch.

## Validação

Typecheck e build passaram. [QA da interface](qa/report.json): save legado com XP, pausa/charge/relógio, criar personagem, investigar Eco, alternar e recuperar progressos distintos, volume, quatro viewports, gamepad mock e touch emulado. [Entrada](qa/entry.png).

[Regressão da jornada](journey-qa/report.json) passou: fluxo até o Vale, combate, três respawns estáveis, save/reset/corrupção/armazenamento bloqueado, registros e inputs emulados. Cerca de **58,5 FPS** na amostra do Vale; sem gravações contínuas de save em repouso.

Os QAs da jornada podem usar `?qa=play` **somente em DEV** para preparar a sessão diretamente; o QA de menu testa a entrada normal sem esse parâmetro. A build de produção sempre apresenta a tela inicial. Não houve teste físico nesta etapa; validar o menu em iPhone e gamepad reais e conferir o seu personagem já existente.

```text
node scripts/qa-menu-characters.mjs
node scripts/qa-dante-journey.mjs "http://localhost:5184/?qa=play" docs/menu-and-characters/journey-qa
```

Limites: dados permanecem no navegador; limpar armazenamento perde os perfis. Não há cross-save, dificuldade selecionável, segunda classe ou conexão multiplayer nesta etapa.
