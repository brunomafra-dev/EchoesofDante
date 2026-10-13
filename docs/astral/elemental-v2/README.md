# Astral — manifestações elementais · 0.1.91

Revisão solicitada após o primeiro playtest: o básico usava sempre energia e os Qs tinham a mesma forma circular em cores diferentes. A estrutura da classe foi bem recebida; esta revisão dá identidade visual ao elemento escolhido, mantendo os controles e a economia do recurso.

## Teste direto

[Fogo](https://echosofdante.vercel.app/astral-playtest.html?element=fire&kit=basic&v=0.1.91) · [Água](https://echosofdante.vercel.app/astral-playtest.html?element=water&kit=basic&v=0.1.91) · [Terra](https://echosofdante.vercel.app/astral-playtest.html?element=earth&kit=basic&v=0.1.91) · [Energia](https://echosofdante.vercel.app/astral-playtest.html?element=energy&kit=basic&v=0.1.91).

Personagens temporários; saves reais preservados. O painel permite escolher elemento inicial e região. F/Y/botão continuam alternando durante o combate.

| Elemento | Básico | Q |
|---|---|---|
| Energia | Raio projetado com ramificações | Malha de descarga no chão, nós e arcos; um impacto de dano, manifestação visual de 1,35 s |
| Fogo | Bola de fogo com cauda | Brasas e chamas surgem do terreno; mesma zona de dano de 3 s |
| Água | Bolha/rajada com espuma | Onda emerge no ponto escolhido, avança visualmente e deixa água/ripples; mesma desaceleração de 2,5 s |
| Terra | Pedra mineral com pequenos fragmentos | Rocha emerge em 160 ms e aplica o impacto/empurrão; manifestação de 0,85 s |

Cada projétil guarda seu elemento no disparo. Trocar F não recolore o que já está voando. Dano básico, velocidade, alcance, cadência, recarga e recuperação de energia não foram alterados. A terra troca a imobilização artificial por **HURT + empurrão existente**, força 420, aplicado uma vez de forma radial; no centro exato, a direção do lançamento define o empurrão. O atraso sincroniza o impacto com a emergência da pedra. Não há collider permanente novo.

Bosses continuam recebendo dano, mas resistem ao controle/empurrão desta manifestação. Água não congela; não foram acrescentados novos status ou combinações elementais. A onda é a apresentação da zona atual, sem adicionar dano fora de seu alcance físico. A rede descarrega uma vez; o efeito visual remanescente não causa dano extra.

## Arte e renderização

Três atlas originais via ferramenta interna de imagens, com alpha real: projéteis e manifestações de fogo, água e terra. [Prompts exatos](illustration-prompts.md) e fontes em `source-art/`. Raio/rede são desenhos nativos preparados offline, sem runas medievais ou símbolos mágicos.

`python scripts/prepare-astral-elements.py` recorta/otimiza as pinturas, monta quatro frames curtos e prepara sombras/pisos suaves. A rocha é revelada acima de um ponto fixo no chão, sem esticar sua forma. Doze atlas novos: projéteis 512×96, manifestações 768×192 e pisos 512×128, aproximadamente 666 KB compactados. [Medidas](asset-measurements.json).

Runtime: **16 imagens reutilizadas por Astral**, oito de projéteis, quatro de piso e quatro de manifestação. Somente quatro imagens a mais que a versão anterior. Sem partículas infinitas, novos tweens, Graphics estáticos por frame ou geração procedural no browser. Pisos abaixo do gameplay, volumes ordenados por posição; contato alinhado às sombras dos atores. Cenários, corpos e equipamentos não foram refeitos.

## Cooperativo

Elementos, frames, idade e direção dos campos seguem nos snapshots existentes. O visitante só apresenta; dano, controle, energia e XP continuam autoritativos. Protocolo **6 preservado**, sem nova ação ou serviço de rede. O relato do protocolo 4 no Render da entrega anterior continua sendo uma pendência separada até publicar o relay atualizado.

## Validação

**Automação local passou. Playtest humano necessário.**

`npm run typecheck`, `npm run build` e `git diff --check` passaram em 0.1.91. O aviso preexistente de tamanho do bundle Phaser permanece; nenhuma dependência nova foi instalada.

- [Elementos e física](qa/elements.json): quatro texturas de básico distintas, elemento preservado em voo, quatro manifestações, dano e empurrão real do Hollow (aproximadamente 34 unidades), sem crescimento dos pools em 60 limpezas/lançamentos.
- [Integração solo/dupla](qa/integration/astral.json): Astral como dono e visitante, básico de fogo e campo ilustrado visíveis pela rede, carga/cancelamento, energia, três ciclos de morte/respawn, masculino/feminino, equipamento, teclado, gamepad mock e touch CDP. Resoluções 1280×720, 1366×768, 1920×1080 e 844×390.
- [Warden com terra](qa/full-warden/qa-report.json): HP normal, três fases e cinco padrões; vitória por driver automatizado em aproximadamente 48 s, sem invulnerabilidade ou ataques forçados. Não é aprovação humana de dificuldade.
- Sem erros de JavaScript/assets. Cerca de **58–60 FPS**, host/visitante em dois contextos locais; objetos e texturas estáveis nos respawns.

Aprovação perceptual permanece para o próximo playtest humano: conferir a leitura das formas em movimento, principalmente água/terra, e a clareza em tela de celular. Não houve teste físico de iPhone ou gamepad nesta revisão. Cenários, controles e os kits de Guerreiro/Hunter permanecem preservados; o QA completo da campanha da entrega anterior continua registrado em `docs/astral/qa/`.

Capturas: [fogo](qa/fire-q.webp), [água](qa/water-q.webp), [terra](qa/earth-q.webp), [rede](qa/energy-q.webp).

## Publicação

Implementação `a6b907df9754dffb679f4274c8561d591d74c884`, versão 0.1.91, enviada a `origin/main`. O [teste da URL pública](qa/public/solo.json) passou nos quatro elementos, com Q consumindo 30 de energia, os doze atlas novos carregados, quatro resoluções, saves preservados e nenhum erro JS/asset. Script reproduzível: `node scripts/qa-astral-elements-public.mjs`.

Cooperativo validado localmente nesta revisão. A consulta ao Render ainda respondeu com protocolo 4; sua atualização para protocolo 6 permanece necessária para testar a dupla pela internet. Esta revisão não altera o protocolo nem exige outra configuração de servidor.
