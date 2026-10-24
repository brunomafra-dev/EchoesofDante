# Percurso e ritmo — Base ao Warden · 0.1.141

> **Revisão 0.1.142:** o usuário explorou o laboratório e não percebeu diferença suficiente. A primeira entrega não foi aprovada visualmente. [Revisão 02](revision-02/README.md) substitui a apresentação discreta por terreno e marcos próprios, com links que chegam diretamente aos trechos novos. As evidências abaixo permanecem como histórico da 0.1.141.

[Laboratório reservado](https://echosofdante.vercel.app/campaign-playtest.html?route=1&v=0.1.141) · [Biblioteca](https://echosofdante.vercel.app/test-library.html)

## Escopo autorizado

Após aprovar a revisão das criaturas, o usuário autorizou iniciar **Entrega B — percurso e ritmo**. Este sprint aprofunda o primeiro arco, Base → Floresta → cavernas → Warden, usando os relatórios regionais existentes. A arte Organic Sci-Fi R3 / referência D e as criaturas da 0.1.140 são reutilizadas. Os capítulos de colonização continuam posteriores à avaliação desta entrega.

## Geografia e encontros

| Trecho | Mudança |
|---|---|
| Base | Continua sendo o ponto de partida, aceite e entrega dos relatórios de Nara, Lia e Ivo. Serviços e campanha principal preservados. |
| Floresta | Extensão oriental conectada à clareira mineral e circuito pela margem sul, com retorno ao trajeto existente. Envelope visual de 2200×1500 para 3100×1950; superfície caminhável irregular, sem tornar todo o retângulo chão. Quatro clareiras menores, cobertura baixa, plantas reativas e intervalos sem residentes. |
| Primeira caverna | Câmara de condensação ao sul, acessível antes do desmoronamento. A borda antiga abre junto com seu collider; o banco inferior acompanha o novo contorno. |
| Caverna profunda | Jardim mineral lateral, com rocha deslocada para a base da nova câmara, cobertura e investigação das raízes. Continua dependendo da abertura original. |
| Profundezas | Conduto soterrado num terceiro bolsão, antes da subida para o exterior. A antiga formação inferior dá lugar ao acesso, com composição e física consistentes. |
| Exterior, Primeiro Eco e Warden | O circuito principal conserva marcos, ordem, limiar, arena, apresentação, combate e consequências. Nenhum relatório abre essas passagens ou derrota o boss. |

Os três pontos de **Remédios entre as raízes** e os três de **O que corre sob a pedra** mantêm seus IDs, objetivos e recompensas; cinco mudam para a geografia ampliada. Conversas e observações explicam os desvios e sua relação com água e pesquisa médica para a humanidade. Quem já entregou esses relatórios não precisa repeti-los e não recebe créditos novamente.

Os seis residentes regionais existentes de cada região são redistribuídos com as descobertas. Nas cavernas, os pares variam: Hollow/Saltador, Cuspidor/Hollow e Cuspidor/Saltador. Há **quatro residentes finitos adicionais**, dois por região, com IDs 1972–1975, dentro do formato de save atual. As oito posições e IDs dos Hollows nativos da Floresta não foram renumeradas. Não há ondas, quotas de abates nem aumento de HP/dano para prolongar a duração.

Recompensas dos relatórios continuam **45 e 60 créditos**. Os quatro novos residentes usam o XP, materiais e drops regionais existentes, com recibos únicos. A população máxima possível da caverna, incluindo as três reservas de uma equipe de quatro, é **30 inimigos**, abaixo do limite de 32 do relay. Não mudou o protocolo 15.

## Física, leitura e composição

- Contornos autorais usam a infraestrutura existente de movimento com passos curtos para Dash/empurrão. O limite direito da caverna ainda restringe a primeira câmara até a abertura do desmoronamento.
- Minimap/rota e retorno seguro verificam o mesmo contorno e a posição dos pés do herói. Evitam indicar caminhos ou pousar fora das margens caminháveis.
- Bancos, raízes, rochas e pequenos contatos reutilizam raster e caches estáticos. As três câmaras usam três RenderTextures limitadas, criadas uma vez; não há desenho estático a cada frame.
- Faixas de profundidade da Floresta guardam somente intervalos ocupados e são subdivididas em até 1024 pixels de largura. Não alocam uma faixa transparente de 3100 pixels para guardar apenas as duas margens; a ordem de profundidade permanece igual.
- O terreno original conserva a escala de 2200×1500. Extensões sobrepõem painéis com alpha suave; ampliar o mapa não amplia folhas e minerais junto com ele. Novas bordas da Floresta evitam uma repetição espelhada imediata.
- Copas/plantas continuam usando o vento, contato e limites de partículas já existentes. Nenhum asset neural novo foi necessário.

## Laboratório e avaliação humana

O link começa **do zero na base**, sem Ecos, sem passagem e com Warden vivo. Usa armazenamento temporário da aba, separado dos personagens reais. Para equipe, volte ao menu e crie uma sala; o convite conserva os parâmetros do laboratório.

O painel oferece **SIMULAR CHEGADA AO TRECHO**, somente solo e com confirmação. Floresta simula reconhecimento entregue; caverna simula três Ecos e mecanismo. Nenhum boss é marcado como derrotado; desmoronamento, Primeiro Eco e limiar continuam por investigar. Reiniciar teste limpa apenas o namespace reservado.

A meta de aproximadamente 30 minutos para a campanha exploratória continua **sem medição humana**. Esta expansão não é uma declaração de que a campanha atingiu essa duração ou oito horas. Avaliar o circuito caminhando e lutando, se os desvios são identificáveis, se há descanso suficiente e se os relatórios justificam a exploração. Não adicionar o capítulo seguinte antes dessa avaliação.

## Validação

Fixtures aceleradas de posição, progresso ou dano usadas pelos scripts não representam uma campanha vencida em tempo real nem uma medição de balanceamento.

| Ensaio | Evidência |
|---|---|
| Typecheck e produção | `npm run typecheck` e `npm run build` passaram; aviso conhecido do tamanho do bundle Phaser continua. |
| Geometria | [Modelo](qa/geometry-model.json): 80 trajetórias de Dash/empurrão em alta velocidade, contorno dos pés, bloqueio da primeira câmara e retorno seguro. |
| Missões existentes | [Modelo regional](qa/model/model.json): 19 missões, 36 investigações, IDs antigos e recibos preservados; objetivos antecipados não entregam relatórios nem pagam sozinhos. |
| Expansão | [Browser](qa/browser.json): seis análises com E, acesso pelo grafo de navegação real, primeiro bloqueio da caverna intacto, novos residentes finitos, XP persistido pelo validador real de save, reload, quatro resoluções e quatro recriações por região. |
| Jornada original | [Regressão completa](qa/journey/report.json): três Ecos → mecanismo → desmoronamento → Primeiro Eco → limiar → Warden → Vale, com investigação/combate acelerados por fixtures declaradas. Menus, morte/respawn/reload, touch emulado e gamepad mock também passaram. |
| Coop | [Dois navegadores independentes](qa/coop/report.json): convidado aceita, investiga os seis pontos, viaja com o time, recebe novos inimigos replicados, entrega e reconecta sem repetir o pagamento. Contornos da caverna iguais nos dois clientes; relay 15. |
| Build compilado | [Chrome](qa/compiled/report.json): painel, prévias, bosses vivos e isolamento dos saves sem globals de desenvolvimento. A verificação adicional de WebKit tem a ressalva descrita abaixo. |

O QA cooperativo espera os dois jogos terminarem o carregamento da região antes de enviar E; esperar somente a variável `area` produzia uma falha do próprio ensaio durante o preload. Os testes não exigem que o jogador pressione durante uma tela de carregamento.

Na amostra individual de Chrome desktop, sem outro browser de QA simultâneo, foram observados **56,1 FPS na Floresta** e **59,7 FPS nas cavernas**. Quatro recriações mantiveram as mesmas contagens: Floresta 423 objetos, 246 texturas, 37 listeners de shutdown, 5 de resize e 19 tweens; primeira câmara 144/236/29/5/4. São amostras locais, não garantias para todo hardware ou sessões ilimitadas. Os caches somaram 16.767.804 pixels na Floresta e 9.788.108 na primeira câmara; isso mede área raster, não toda a memória do navegador/GPU.

Capturas comprimidas para documentação: [circuito oriental](qa/exp-forest-2.webp), [margem sul](qa/exp-forest-3.webp), [condensação](qa/exp-cavern-1.webp), [jardim mineral](qa/exp-cavern-2.webp), [conduto](qa/exp-cavern-3.webp). Não são novos assets do jogo.

**Limitações:** não houve equipe humana de quatro jogadores nem medição em celular físico. O WebKit Windows completou uma sequência Floresta → caverna sem captura, mas encerrou o processo com capturas e numa repetição mais longa. O mesmo ambiente também encerrou a página da versão pública anterior ao abrir a prévia da caverna; não foi estabelecida uma causa exclusiva da expansão. [Observações do ensaio](qa/webkit-observations.json). O resultado é parcial, não uma aprovação de Safari: conferir trocas repetidas no iPhone real continua necessário. O mapa reutiliza pinturas existentes: composição e orientação dos novos caminhos ainda precisam da avaliação do usuário.
