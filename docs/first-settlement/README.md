# Primeiro núcleo habitável · 0.1.125

[Laboratório reservado](https://echosofdante.vercel.app/campaign-playtest.html?missions=1&settlement=1&v=0.1.125) · [Biblioteca](https://echosofdante.vercel.app/test-library.html)

Etapa 5 do [plano de colonização](../DANTE_COLONIZATION_PLAN.md), autorizada pelo usuário em 21/10/2026 junto da revisão do acampamento. Aprovação técnica e playtest humano são registrados separadamente.

## Exploração e missões

A campanha mantém as quatro missões da chegada. Após o relatório do Warden, Lia oferece **Água para permanecer**. A ramificação ao norte do Vale da Ressonância leva à **Bacia das Nascentes**, e a passagem oriental da bacia chega aos **Terraços do Amanhecer**. Cada região mede 2600 × 1500 unidades, com limites caminháveis mais estreitos, três pequenos encontros e intervalos de descanso. As margens das nascentes são caminháveis; círculos simples impedem atravessar seus núcleos profundos. Os terraços permitem contornar uma crista por cima ou por baixo.

| Missão nova | Responsável | Ação | Créditos pessoais |
| --- | --- | --- | --- |
| Água para permanecer | Dra. Lia | Analisar vazão e composição da nascente; retornar com o relatório | 45 |
| Uma rota segura | Ivo | Registrar os dois acessos dos terraços para o transporte da carga | 55 |
| O primeiro abrigo | Nara | Analisar solo e local, instalar o módulo reservado e entregar os resultados | 75 |

As sete missões somam 325 créditos, sendo 175 deste capítulo. Sem XP adicional de missão. O tracker, diário, marcadores sobre NPCs, análises e mapa usam os sistemas da entrega anterior. Serviços de cura, oficina e suprimentos continuam disponíveis. O atlas revela regiões conforme a exploração; não permite pular mapas desconhecidos. Retorno à base e retomada da expedição continuam disponíveis.

## Consequência no mundo

Depois de registrar solo e local, a interação **INSTALAR** assenta uma carga já trazida na nave: módulo habitável, reservatório e canteiro experimental integrados numa composição. Dois colonos aparecem no local. Essa primeira instalação não cobra materiais do inventário nem simula construção livre. Água ainda exige tratamento, e a horta é experimental; não há produção agrícola, cidade ou respostas definitivas sobre Dante.

`shelter-built` é evidência persistida da missão e controla a aparência do assentamento. Os três colisores da instalação são inseridos uma vez. Personagens que ocupam a nova estrutura são reposicionados para um ponto livre, incluindo aliados. Repetir a interação, viajar, morrer ou recarregar não duplica módulo, colonos ou recompensas.

## Fauna local e combate

| Espécie | Função e leitura | Base HP / dano | Fraqueza / resistência |
| --- | --- | --- | --- |
| Vigia das Margens | Anfíbio de seis patas e placas dorsais; aproximação, setor de preparação e golpe próximo | 112 / 14 | Energia / água |
| Fole dos Juncos | Corpo com bolsa de água, crista e probóscide; prepara três linhas antes de disparar | 78 / 10 | Energia / água |

Valores recebem o ajuste regional existente: Nascentes HP ×1,30, dano ×1,12, 23 XP; Terraços HP ×1,35, dano ×1,15, 25 XP, antes da dificuldade e equipe. Cada mapa tem seis residentes, distribuídos em três composições. O sistema cooperativo pode adicionar até três reservas conforme a equipe original. Renovação usa o sistema de habitats existente: 90 segundos e distância segura de 480 unidades. Não há geração infinita durante o encontro, novo framework de IA ou boss neste capítulo.

Os dois animais têm arte própria e oito poses completas; caminham sem montar membros separados ou girar a imagem de cabeça para baixo. Reutilizam o contrato `Enemy`, dano, feedback, XP, equipamentos, recursos, colisão e estados de `ValleyCreature`. Não foi alterado o kit das quatro classes.

## Acampamento e assets

A base recebeu uma clareira de terra/musgo, suprimentos, caixas e uma hierarquia mais quente de materiais. Foram removidas as grandes manchas claras. A sombra do Ivo foi corrigida para a base dos pés, com recorte raster justo; os três NPCs preservam posição, serviços e acesso. As sombras são estáticas, pequenas e baratas. Pods e módulo usam a oclusão ambiental existente quando encobrem o jogador.

Seis PNGs originais gerados offline com a ferramenta integrada de imagem: chão do acampamento, suprimentos, nascente, módulo e duas folhas de criaturas. Reutilizados piso contínuo da Floresta, rochas, raízes, copa, minerais, pods, nave e colonos existentes. [Dimensões, bytes, hashes e origem](assets.json), [direção dos prompts e preparo](prompts.md). Sem imagem externa ou arte gerada durante o jogo.

Cenário estático é composto em duas RenderTextures por novo mapa, reaproveitando bake/cache. Interações e colonos são conjuntos fixos, sem geração contínua de texturas ou tweens. Colisão é simples e independente do recorte da pintura. Sem pathfinding: uma criatura pode contornar mal obstáculos se perseguida deliberadamente contra uma borda.

## Áudio

Três arranjos originais de síntese offline: acampamento (128 s), Nascentes (~154 s) e Terraços (135 s). Transições usam o mixer existente. [Medições](audio-measurements.json); roteiro em `scripts/compose-region-scores.py`. Nenhum sample externo. O filme, suas vozes e a mixagem aprovada não foram alterados.

## Save e cooperativo

Save schema 1 ampliado com regiões, visitas, habitats e evidências opcionais. Saves antigos continuam válidos, preservam bosses e passagens e reconhecem descobertas existentes; não repetem Warden para iniciar este capítulo. O assentamento decorre da evidência compartilhada, sem um segundo save paralelo.

Protocolo **14**, cliente e relay atualizados juntos. Conexões Vale ↔ Nascentes ↔ Terraços validadas pelo relay; atalhos da base exigem regiões visitadas. Qualquer integrante pode aceitar, investigar, atravessar e entregar. O anfitrião valida cada ação e replica missões/instalação. Cada personagem recebe os créditos uma única vez, com recibos pessoais persistidos. Reconexão conserva a exigência da equipe original completa. Um servidor público antigo não é considerado compatível.

## Laboratório e validação

O link reservado usa `sessionStorage` em namespace próprio, separado tanto dos saves reais quanto do laboratório das quatro primeiras missões. Começa diante de Lia com um relatório pós-Warden simulado. É uma preparação de teste, não um combate automático contra o boss. Abra o painel inferior para preparar individualmente Lia, Ivo ou Nara; só o anfitrião pode fazê-lo numa sala. Convites mantêm os parâmetros de isolamento.

Scripts reproduzíveis e relatórios em [qa](qa/):

```powershell
npm run typecheck
npm run build
node scripts/qa-arrival-missions-model.mjs
node scripts/qa-arrival-missions-protocol.mjs
node scripts/qa-first-settlement.mjs
node scripts/qa-first-settlement-inputs.mjs
$env:QA_ROOM_SIZE='4'
node scripts/qa-first-settlement-coop.mjs
node scripts/qa-first-settlement-production.mjs
node scripts/qa-dante-journey.mjs 'http://localhost:5185/?qa=play' docs/first-settlement/qa/campaign
```

Os testes DEV usam 5185; o teste compilado usa o preview em 5184. `QA_BASE` e `QA_OUT` permitem escolher servidor e diretório sem alterar scripts. O QA usa Chrome local, posicionamento DEV para preparar objetivos e comandos reais para diálogos, análises, atlas e instalação. Não equivale a um playthrough humano caminhando a campanha inteira.

### Resultados técnicos · 21/10/2026

- Typecheck e build passaram. Permanece o aviso já existente sobre o tamanho do chunk do Phaser.
- Sete missões concluídas; teste de instalação antes de analisar o solo recusado; módulo/colonos/colisores não duplicam; reload e morte/respawn preservam o resultado. Recompensas únicas e saves reais protegidos.
- As quatro missões anteriores, indicadores, diálogos, serviços, Ecos, fissura e mecanismo passaram na regressão. Fluxo Floresta → cavernas → Primeiro Eco → Warden → Vale passou, com combate, retorno, reset e recuperação de save inválido. O QA encurta a vida do boss para testar o caminho de recompensa; não é um novo teste de balanceamento do Warden.
- Duas instâncias Chrome na **build compilada**, sem globals DEV: convidado aceita Lia, atravessa a Bacia por movimento normal, analisa a nascente, retorna com a equipe, entrega e chega aos Terraços. Chat e nomes preservados.
- Sala com **quatro participantes**: dois Chrome e dois clientes de protocolo enviando comandos a 25 Hz; anfitrião renderiza as quatro classes. Novas rotas, missões, instalação, remoção dos ocupantes de colisores, reconexão e conclusão chegam a todos. Os dois personagens de navegador recebem 175 créditos únicos; os clientes de protocolo verificam o estado compartilhado, não persistência pessoal nem renderização remota.
- A tentativa com **quatro jogos Chrome simultâneos nesta máquina não foi aprovada**: houve reconexões e snapshots estagnados. [Registro](qa/limitations/four-renderers.json). A causa não foi isolada; o teste com quatro amigos em aparelhos separados permanece obrigatório para aprovação humana do coop. Não tratar o teste de protocolo como quatro renderizações validadas.
- Ataques reais do Vigia e Fole, preparação e projéteis de água, básico do Guerreiro, Dash e Q. Touch emulado e gamepad mock percorrem conversa, atlas, passagem, análise e diário. Resoluções 1280×720, 1366×768, 1920×1080 e 844×390 conferidas. Sem erro JavaScript ou falha de assets nesses fluxos aprovados.

Medição local com uma janela, após aquecimento: **Nascentes 60,0 FPS**, **Terraços 59,8 FPS**. A regressão da base mediu **55,2 FPS** (amostra logo após viagens, subindo de ~51 para 57,6) e o Vale **57,7 FPS**. Não são garantias para todo hardware. Os seis PNGs somam 4.319.972 bytes (~11,1 MiB RGBA); as duas RenderTextures de cada nova região usam ~11,9 MiB, sem contar buffers do renderer.

Depois de três idas/voltas: base **64 objetos / 217 texturas / 0 tweens**; Terraços **104 / 217 / 0**, sem crescimento. Listeners mantêm as mesmas contagens, incluindo 10 keydown e 3 keyup. A amostra fria curta do teste solo consta no relatório; não foi confundida com a medição aquecida.

O cooperativo público só é compatível quando `https://echoes-of-dante-rooms.onrender.com/health` informa **protocolo 14**. A entrega final informa a confirmação dos deploys; não confundir o Render 13 da entrega anterior com esta versão. Dispositivos físicos touch/gamepad, ritmo de exploração e integração visual do acampamento continuam sujeitos à validação humana.

**Próximo gate:** jogar Nascentes → Terraços → instalação, avaliar grounding do Ivo e legibilidade do acampamento. Não iniciar outra expansão antes dessa avaliação.
