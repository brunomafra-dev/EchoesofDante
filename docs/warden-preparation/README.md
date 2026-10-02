# Warden Preparation — Primeiro Eco e limiar

Versão: **0.1.37**. Continuação imediata do exterior, na mesma cena. O Warden continua reservado para a Boss Sprint.

## Experiência e localização

O trecho aprovado termina no arco em (5310,680). A extensão segue pelo lado norte da pedra da passagem, chega ao **arquivo ancestral em (5530,735)** e acompanha três inscrições até o **limiar em (6100,740)**. O limite navegável é 6180: aproximadamente 830 unidades além do exterior anterior. A caminhada frontal para na pedra visível, perto de x=6132. O modelo de câmera, zoom e follow permanecem; seu limite horizontal acompanha o cenário ampliado.

Não há novos encontros. Skitter (4750,1090) e Crawler (4900,1095) ocupam o desvio sul do exterior, afastados da rota direta de descoberta; IA e valores permanecem. Os demais moradores continuam nos próprios habitats; nenhuma morte é requisito de acesso. O trecho oferece silêncio, um ponto de descoberta e uma aproximação monumental, sem construir a arena do boss. Uma criatura atraída deliberadamente ainda pode seguir o jogador.

## Primeiro Eco

1. Investigar o fragmento exterior existente continua sendo o primeiro passo.
2. Aproximar-se do arquivo produz uma resposta violeta curta e reduz a música.
3. **E / A / INVESTIGAR** ativa a resposta pelo sistema de ações existente.
4. Surge uma informação concreta: **“ASSINATURA HUMANA: JÁ REGISTRADA / DATA DO REGISTRO: ILEGÍVEL”**.
5. A confirmação acrescenta **“COMPATIBILIDADE CONFIRMADA / ORIGEM DO REGISTRO: DESCONHECIDA”**.
6. As inscrições do chão respondem em sequência, e o objetivo muda para seguir até o limiar.

A resposta dura 5,2 segundos e mantém movimento, mira e combate disponíveis. A revelação fica por 3 segundos; a confirmação ocupa os 2,2 segundos seguintes. Um pequeno registro permanece visível quando o jogador volta ao arquivo.

### Limites da revelação

O arquivo contém um registro compatível com uma assinatura humana. Isso **não confirma** sua idade, quem o produziu, quando humanos chegaram, os responsáveis por Dante ou a identidade do Signal. Não são definidos nomes de civilização, missão anterior ou cronologia de DANTE-01. A relação fica deliberadamente em aberto.

O Primeiro Eco é um estado narrativo local. Não é um quarto colecionável da Forest: **Ecos 3/3, XP, nível e recompensas anteriores permanecem**. Não existe recompensa adicional.

## Reação ambiental e aproximação

O arquivo ganha contraste, três inscrições violeta/âmbar acendem e a superfície do limiar responde. O caminho já é fisicamente acessível; investigar não funciona como uma chave de inventário nem libera uma porta por combate.

No final, um deslocamento muito breve da pedra e o som ancestral sugerem pressão do outro lado. A mensagem diz **“LIMIAR DO GUARDIÃO / ALGO SE MOVE DO OUTRO LADO / PASSAGEM INTERDITADA”**. O portão permanece fechado. Não existe corpo, alvo, HP, hitbox, ataque, IA, recompensa ou design completo do Warden.

## Arte e áudio

Dois PNGs originais pintados com `imagegen` complementam o kit D: `first-echo-archive` e `sealed-threshold`, ambos 512×512 com alpha. Pedra desgastada, raízes e mineralização envolvem placas ancestrais. Violeta e âmbar pertencem ao mundo; ciano continua reservado ao jogador.

Veja [prompt e preparo](art-prompt.md). A extração e redução são feitas offline por `scripts/prepare-warden-art.py`, usando Pillow já disponível. Não há geração de arte durante gameplay.

O AudioManager continua usando Forest no exterior e os SFX `signal`/`ancient`. Um fator local de foco reduz apenas MUSIC durante a aproximação e resposta; MASTER/SFX permanecem. O jogo continua funcionando com autoplay bloqueado ou sem áudio. Não há nova trilha nem voz do boss.

## Física, sessão e retorno

- Oito footprints circulares simples cobrem bases de estruturas e formações novas; a pedra da passagem antiga continua visível e sólida.
- A rota pode ser percorrida nos dois sentidos. O portão final bloqueia caminhada e Dash; não existe interação de abertura.
- A descoberta é registrada imediatamente. Morrer durante a resposta não permite outra ativação.
- Depois do Primeiro Eco, o respawn local usa **(5430,740)**, livre de obstáculos e fora dos habitats. HP restaura; XP, nível, os três Ecos, passagens e estados narrativos permanecem.
- Recarregar a página inicia uma sessão nova. Não foi criado save nem sistema genérico de checkpoints.

## Renderização e performance

Uma RenderTexture adicional de **1400×1000** captura solo e detalhes estáticos uma vez. O custo nominal RGBA do novo alvo é aproximadamente **5,34 MiB**, sem contar overhead do driver. A atmosfera reutiliza uma textura existente; arquivo e portão são Images para profundidade. Três inscrições são Graphics desenhados uma vez e alteram somente alpha. Não há redraw ambiental por frame.

As animações novas são finitas e pertencem à cena; o trecho não adiciona tween infinito, partículas contínuas ou listeners. `showRecord` altera visibilidade somente quando necessário. Medições reais e contagens estão no [relatório de QA](qa-report.json); a regressão anterior está em [regression/measurements.json](regression/measurements.json).

## Testes

```sh
npm run typecheck
npm run build
node scripts/qa-cavern-exterior.mjs http://localhost:5176/ docs/warden-preparation/regression
node scripts/qa-warden-preparation.mjs http://localhost:5176/
node scripts/qa-cavern-exterior-combat.mjs http://localhost:5176/ docs/warden-preparation/regression
node scripts/qa-cavern-exterior-production.mjs http://localhost:5175/ docs/warden-preparation
```

Chrome headless usa montagem de estado DEV onde indicado e teclas/mouse reais para deslocamento e ações. O teste completo anterior percorre Forest → Ecos → fissura → Cavern → Deep → Deeper → exterior, com combate, XP e respawn. O novo teste atravessa o arco nos dois sentidos, verifica a revelação, ausência de repetição/XP, controle durante resposta, portão, morte durante a sequência, três mortes/respawns, estabilidade, reload, gamepad mock e touch emulado. Capturas cobrem 1280×720, 1366×768, 1920×1080 e 844×390.

## Limitações e validação humana

**Automação passou:** typecheck, build, fluxo e regressão em Chrome, gamepad mock e touch emulado. No trecho final, a amostra registrou aproximadamente **60,2 FPS**; combate misto anterior, **58,9 FPS**. Após resposta e três respawns, ficaram estáveis **191 objetos, 62 texturas, 8 RenderTextures, 4 tweens e 122 footprints**, com 19 inimigos e nenhum boss. Não houve erro JS/asset nem crescimento contínuo. O build preserva o aviso anterior sobre o tamanho do bundle Phaser.

Não houve teste físico de PC, iPhone ou gamepad neste ambiente. A inspeção visual de capturas não substitui playtest humano.

**Playtest humano necessário:** avaliar se a revelação é compreensível, se o arquivo se destaca, se as inscrições conduzem naturalmente ao portão e se a escala/silêncio criam vontade de atravessar. Testar também voltar ao arquivo para reler o registro e morrer durante a resposta.

A IA existente continua com perseguição direta e pode encostar em obstáculos; não foi criado pathfinding. A idade do registro, a origem do Signal, a identidade do Warden, sua arena, comportamento, fases e recompensa ficam para decisões posteriores.
