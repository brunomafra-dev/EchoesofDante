# Personagens completos — 0.1.111

**Revisão atual:** [0.1.114 — Guerreira e diagonais do Hunter](revision-04/README.md). [Revisão 0.1.113](revision-03/README.md). [Revisão 0.1.112](revision-02/README.md). O texto abaixo preserva o relatório da entrega original; links antigos do laboratório carregam os assets atuais.

O usuário aprovou a prova do Astral feminino e autorizou expandir a mesma técnica às quatro classes. Esta entrega aplica **poses pintadas de pessoas inteiras** ao Guerreiro, Hunter, Astral e Domador de feras, masculino/feminino, na seleção, na campanha e nos aliados cooperativos. Organic Sci-Fi R3 / D preservado.

## Testar

- [Movimento, quatro classes, apresentações e equipamento](https://echosofdante.vercel.app/character-cohesion.html?class=warrior&sex=male&v=0.1.111).
- [Seleção e início de jornada temporária](https://echosofdante.vercel.app/campaign-playtest.html?v=0.1.111).
- [Cooperativo reservado](https://echosofdante.vercel.app/party-playtest.html?region=forest&kit=basic&v=0.1.111).
- [Biblioteca](https://echosofdante.vercel.app/test-library.html).

Os laboratórios mantêm o isolamento de saves existente. A campanha principal também recebe a nova representação. O [comparativo original](../whole-body-actors/README.md) continua disponível; sua versão A histórica não foi substituída.

## Representação

Cada personagem visível é **um Image com uma pose completa**: cabeça, torso, ombros, braços, mãos, instrumento e pernas já pintados juntos. O menu seleciona os mesmos quadros, usando Canvas. Não há cotovelos reposicionados, braços alongados ou rotação do corpo inteiro para acompanhar a mira.

São 24 atlases: quatro classes × duas apresentações × três vestimentas. Cada atlas tem **768×1536**, com 32 células de **192×192**: oito vistas, repouso, dois apoios de caminhada e ação. Exibição de 128 unidades, pés registrados na mesma referência de chão usada pelo Player. A marcha responde ao deslocamento real, inclusive para trás; parar contra um obstáculo interrompe a passada. Ataques e Q selecionam a pose de ação; Dash preserva o corpo inteiro e a apresentação do sistema existente.

`CompleteActorFrames.ts` compartilha direção, quadro e referência visual de emissão entre menu/jogo. `CompleteActorArt.ts` aplica a representação nas cenas locais e em `PartyActor`; o Guerreiro é integrado no próprio `Player`. O Domador continua usando a criatura e as animações originais. Nenhum HP, dano, XP, cooldown, movimento, controle, progressão, save ou protocolo do relay foi alterado. Hunter recebe apenas uma referência óptica para tiros/feixe: colisão, alcance e resolução de dano continuam no raio original.

## Equipamento

Os slots existentes continuam independentes. Capacete, torso, calça e botas substituem regiões das pinturas registradas em **um atlas fixo por ator**, reconstruído somente quando a aparência muda. Luvas e detalhes da arma alteram o material dentro da silhueta pintada: não apagam dedos nem acrescentam outro punho. O corpo final permanece uma imagem completa; não são cinco sprites sobrepostos durante a animação.

Roupa inicial, proteção básica e reforçada possuem pinturas próprias. Peças mistas permanecem possíveis. O atlas é reutilizado em trocas sucessivas e removido ao destruir o personagem. Os rigs anteriores permanecem disponíveis para os comparativos históricos; não são a representação visível da campanha atual.

**Limite deliberado:** em combinações mistas, a forma da empunhadura pertence à pose do torso; a variação independente da arma/luvas muda principalmente revestimento e emissor, sem reconstruir mãos. Isso preserva continuidade anatômica, mas não fornece uma silhueta inteiramente nova para cada combinação de arma e proteção. Verificar também possíveis transições visíveis na cintura e no pescoço de combinações extremas.

## Arte e preparação offline

As pinturas originais foram produzidas com **`image_gen.imagegen`**, a mesma ferramenta usada na prova aprovada. Sem HF, fal, Runway, conta externa ou geração dentro do jogo. Referências: roupas/identidades existentes, a equipe pioneira e os quadros do Astral aprovados. A fonte feminina inicial do Astral reúne suas duas pranchas já aprovadas, sem remontagem de membros.

- [Fontes](source/), [orientação de layout](prompts/layout.txt), [vestimentas](prompts/equipment.txt), [manifesto técnico](assets.json).
- `python scripts/prepare-complete-actors.py`: Pillow, NumPy e OpenCV, usados apenas offline para identificar células/figuras inteiras, remover fragmentos isolados de células vizinhas, recortar, redimensionar uniformemente e registrar os pés. A morfologia serve para localizar a figura; não desenha nem reconstrói anatomia.
- Algumas folhas geradas vieram com espaçamento irregular ou última linha incompleta. Pranchas corretivas contêm **poses completas**, não peças. As correções SW de Guerreiro/Hunter são espelhadas como figuras inteiras; por isso a mão dominante pode variar nessa transição. Dimensões/hashes efetivos e caixas de recorte estão no manifesto; o tamanho solicitado à ferramenta não é apresentado como resolução efetivamente recebida.
- `npm run build` consome os assets prontos. Não executa geração de arte nem requer Python.

## Custo

Um atlas RGBA equivale a **4,5 MiB** sem compressão. As 24 fontes carregadas pelo jogo somam **108 MiB**, além dos outros assets da campanha. Cada participante visível acrescenta um atlas equipado de 4,5 MiB; quatro participantes somam 18 MiB desses compostos. Esses valores descrevem pixels RGBA, não uma medição completa da memória do navegador/GPU. Os 24 PNGs somam aproximadamente **21,4 MiB de download** nesta revisão. Tamanhos individuais dos arquivos constam em `assets.json`.

As fontes das quatro classes são pré-carregadas para permitir entradas/reconexões sem textura ausente; os antigos atlases de vestimentas e braços não são mais pré-carregados pela campanha. Um Image e uma guia reutilizada por ator, sem tweens de membros, novos objetos por quadro ou bake por quadro. O cenário conserva seu cache/bake.

## Verificações

Evidências automatizadas: [QA de personagens](qa/report.json), [regressão cooperativa](party-qa/report.json). `npm run typecheck` e `npm run build` passaram; permanece o aviso conhecido do chunk Phaser >500 kB. O QA final dos personagens passou com zero erros JavaScript, assets ou warnings de textura. Amostra individual: **55,18 FPS**, 386 objetos, 207 texturas, 24 tweens do cenário e um atlas equipado. As doze trocas por apresentação mantiveram as contagens estáveis; o ator remoto de teste liberou seu atlas ao ser destruído. Isso não é uma medição da campanha inteira nem de um celular físico.

`scripts/qa-complete-actors.mjs` verifica oito apresentações, 384 casos por apresentação (3.072 no total), 32 quadros, peças mistas e três armas, igualdade dos pixels local/remoto, escala uniforme, ancoragem dos pés, ausência de deformação, reutilização e destruição do atlas. Também exercita ações reais do kit, seleção, quatro resoluções, touch emulado, gamepad mock e preservação de save sentinela.

### Respawn, compilação e cooperativo

- [Ciclo de vida](qa/lifecycle.json): três mortes/tecla R/respawns por classe; um atlas por personagem, contagens estáveis de objetos, texturas, listeners e controles touch. HP restaurado e mesma classe/apresentação.
- [Campanha compilada solo/menu](production-qa/report.json): personagem nomeado, dificuldade, entrada na campanha, prólogo ativo preservado, navegação gamepad e touch passaram.
- [Comparativo original preservado](original-lab-qa/report.json): passou, com ~59 atualizações/s, 32 quadros, seis ciclos A/B, mesmas contagens e zero erros; não representa a performance da campanha expandida.
- A [regressão longa com quatro navegadores](party-qa/report.json) confirmou quatro classes/mirrors, movimento, ataque, Dash, Q, dano, poções e recibos pessoais de equipamento/XP, mas **não terminou**: timeout numa viagem. Tentativas também observaram desconexões pelo limite de mensagens do relay. Não afirmar campanha inteira/bosses/reconexões aprovados nesta entrega. Os ajustes no script aguardam recuperação de ações e abrem o diálogo de aprimoramento existente; não alteram o jogo.
- No [teste cooperativo compilado](production-coop-qa/report.json), convites reais formaram quatro participantes com protocolo 12 e snapshots nos quatro navegadores, sem erros JS/assets. A verificação de ações **falhou ao observar o Dash do anfitrião**; sua causa não foi estabelecida. Não equivale a um teste cooperativo completo aprovado. Revisar essa pendência num playtest com pessoas/dispositivos separados.

**Automação de personagens, ciclo de vida e menu solo passou. A regressão cooperativa longa permanece parcial. Playtest humano necessário.**

## Limites e avaliação humana

**A aprovação humana anterior é da prova do Astral, não de todas estas novas pinturas.** O agente inspecionou folhas e capturas, mas o elenco expandido precisa do playtest do usuário caminhando e lutando, em especial costas/diagonais, troca rápida de mira e peças mistas.

Há dois apoios de caminhada e uma pose de ação, não uma animação final com muitos intermediários. A mira do combate é contínua; a orientação pintada muda a cada 45°. Podem existir diferenças de rosto, volume, mão dominante e visibilidade da arma entre vistas; algumas armas ficam parcialmente ocultas em poses de costas. Os pontos de emissão são aproximações ópticas, comuns às duas apresentações, e merecem revisão em todas as direções. Touch/gamepad automatizados não substituem teste em dispositivo físico. Não se afirma fluidez/anatomia perfeita apenas porque o QA passou.

A cinemática completa continua pendente da geração de vídeo. Esta entrega não inicia missões, mapas ou outra etapa do plano.
