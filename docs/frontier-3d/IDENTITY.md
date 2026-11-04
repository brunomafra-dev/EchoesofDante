# Identidade visual da chegada · 0.1.186

## Escopo autorizado

Após jogar a 0.1.185, o usuário elogiou árvores, personagens humanos, pedras e terreno, pediu identidade/acabamento para armas, poderes, criaturas, NPCs e nave, e autorizou a proposta com “Então mete bala”. Esta revisão mantém **acampamento + floresta**. Siroco, migração da campanha e coop 3D não foram iniciados.

- [Oficina visual](https://echosofdante.vercel.app/arrival-workshop.html?v=0.1.186): escolher modelo, gênero e elemento, girar/aproximar e observar ação.
- [Trecho jogável](https://echosofdante.vercel.app/arrival-3d.html?v=0.1.186): conferir o acabamento na implantação, câmera, iluminação e combate reais do ensaio.

Ambos registrados na biblioteca. A oficina **não carrega progresso ou personagens**. O trecho conserva o namespace temporário `sessionStorage['dante.arrival3d.v1']`, compatível com a 0.1.185: personagem, vida/poções, mortes finitas e pesquisa permanecem. Não altera saves, inventário, recibos, rede ou servidores da campanha Phaser. Nenhum pré-requisito ou vitória de boss simulado; não há boss nesse trecho.

## Produção efetivamente implementada

Blender **4.5.15 LTS portátil oficial**, SHA-256 do ZIP conferido contra o arquivo oficial, executado em background dentro de `.local/`. Sem instalação global, serviço pago, geração online durante o jogo ou mudança para Godot. PixelFX foi pesquisado, mas nenhum código, efeito ou fonte desse repositório foi incorporado.

`scripts/asset-tools/author-arrival186.py` cria os modelos offline: perfis, lofts, curvas, superfícies, bordas e pequenos mapas de desgaste/rugosidade. `prepare-arrival186.mjs` aplica as cores dos materiais, agrega as pequenas peças de vestuário/ferramentas por cores de vértices, remove dados redundantes e converte os dois mapas de 256px para WebP. GLB e manifesto em `public/assets/arrival-3d/identity-186.*`. Fontes reproduzíveis no repositório; arquivo de trabalho `.blend`, ferramentas, ZIP e intermediários ficam ignorados em `.local/`.

Quatro armas têm perfis e peças próprios: lâmina afilada com guarda/empunhadura, arma estelar com receptor/cano/óptica, foco com gimbal e núcleo contido, instrumento do Domador com emissor protegido. Continuam presos à mão do mesmo rig completo, com orientação por classe. Modelos humanos, editor e arquivos GLB masculino/feminino anteriores preservados.

Hollow tem corpo contínuo, escudos sobrepostos, bordas, mandíbulas e seis pernas com coxa/canela/garra distintas. A fera tem focinho, orelhas, cauda, escudos dorsais e quatro patas. Malhas preparadas são instanciadas; atualização de movimento modifica matrizes, sem recriar geometria. Permanecem interpretações estilizadas para avaliação humana, sem promessa de realismo final.

Nos poderes: arco de lâmina e onda direcional; traçador fino e impacto do Caçador; energia com arcos orbitais, fogo com chamas deformadas em shader e brasas, água com ondas/spray e terra com fragmentos irregulares de pedra. Partículas usam um buffer limitado a 192 entradas e geometria compartilhada. Áreas de carga, alcance, danos, recursos e requisitos mantêm as regras da 0.1.185; esta é uma revisão da representação visual.

Lia, Ivo, Nara, Tio Gui e Elisa recebem roupa/acessórios e ferramenta por profissão. O corpo mantém o rig e a animação de respiração; braços alcançam alvos de trabalho com solução de dois segmentos, entrada/saída suaves e pausas. Bancadas aproximadas 0,17m para permitir alcance: ferramentas/tratamento/mapa/conexões realmente apoiados. Missão/entrega mantêm suas posições. Elisa visita pontos junto aos dois canteiros, com retorno pela passagem central; os demais trabalham sem passear. Canteiros têm substrato, caules e folhas.

Nave usa casco seccionado curvo, vidro acompanhando o cockpit, juntas, motores com estatores, hidráulica e apoios. Abrigos recebem casco arredondado, lona tensionada, ventilação e sinais de profissão. Caixas de suprimentos têm proteção, travas e alça; mecanismo mantém o ponto/requisito original e recebe dial radial. A rampa foi deslocada lateralmente de `x=14,75` para `x=16,55`, à frente do motor, com altura física correspondente. Apoios dianteiros afastados do acesso também têm a colisão reposicionada. Casco, motores, apoios, portais, obstáculos da floresta e interior fechado continuam sólidos.

Natureza, iluminação geral, enquadramentos, contorno, trilhas, três ecos e oito encontros originais preservados. Objetos permanecem opacos. Materiais são compartilhados; a biblioteca é carregada uma vez, e estruturas são agregadas por material/região. Não existe modelagem ou bake por frame.

## QA técnico e aprovação humana

- [x] Typecheck/build da versão final e comparação dos assets da campanha anterior.
- [x] Oficina: quatro armas nos dois gêneros, cinco profissões, duas criaturas, nave, ações, quatro elementos e telas estreitas; dados reais intactos.
- [x] Circuito compilado: NPCs, rampa acessível, colisões, portais, três ecos, origem/mecanismo, combate, retorno/reentrada/reload e mortes finitas.
- [x] Quatro classes por toque emulado, gamepad padrão emulado, cancelamento de carga, poção/derrota/reload e entrada anterior.
- [x] Inspeção visual das capturas e amostras comparáveis de custo/desempenho; sem garantia de 60 FPS ou iPhone físico por emulação.
- [x] Aplicação `fb50df0` em `origin/main`, Vercel success, 47 hashes e QA público de input/oficina passaram. Capturas públicas inspecionadas. [Publicação e limites](qa/0.1.186/publication.json).
- [ ] Aprovação estética humana desta revisão. Os elogios da 0.1.185 aos elementos preservados não aprovam automaticamente os novos assets.

Evidências desta entrega em `qa/0.1.186/`: [nove relatórios e comparação de build](qa/0.1.186/build-verification.json), [observações e correções](qa/0.1.186/OBSERVATIONS.md). Typecheck/build final de 306 módulos passaram. 86 hashes da campanha anterior permanecem idênticos, com 47 hashes preparados para conferir a publicação. A observação nativa confirmou Elisa nos dois canteiros e trabalho nos quatro postos fixos. A correção final de origem dos disparos foi reconferida em classes/layouts, input, elementos e oficina; a trajetória lógica continua separada da posição visual. Fixtures de região/estado usadas em testes são declaradas em cada relatório e não fazem parte das entradas normais. A oficina não simula uma campanha ou combate com resultado persistido.

## Reprodução

Com Blender 4.5 LTS disponível e as dependências de autoria instaladas conforme [asset-tools](../../scripts/asset-tools/README.md):

```powershell
& '<caminho-do-blender.exe>' --background --factory-startup --python scripts/asset-tools/author-arrival186.py
node scripts/asset-tools/prepare-arrival186.mjs
npm run typecheck
npm run build
$env:QA_BASE='http://127.0.0.1:5193'
$env:QA_OUT='docs/frontier-3d/qa/0.1.186/workshop'
node scripts/qa-arrival-workshop.mjs
# Ou executar a sequência completa de forma serial:
node scripts/qa-arrival186.mjs
python scripts/verify-arrival3d-build.py --version 0.1.186
```

Executar os demais roteiros da chegada com `QA_OUT` apontando às pastas desta versão. Não executar benchmarks em paralelo com Blender, builds ou outros navegadores de QA.

### Amostra de desempenho

base: 37.9–39.8 FPS, 153 chamadas e 308419 triângulos; forest: 45.6–47.1 FPS, 77 chamadas e 401781 triângulos. Amostras isoladas e aquecidas a 1440×900/DPR1 em Intel UHD/ANGLE; não representam combate contínuo, celular físico ou garantia de 60 FPS. A base anterior tinha cerca de 45 FPS e a floresta 47–48 FPS nas amostras da 0.1.185; o aumento de detalhe tem custo, especialmente nos postos.
