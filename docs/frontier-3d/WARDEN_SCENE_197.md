# Cena de revisão do Warden · 0.1.197

O usuário pediu uma cena acabada para avaliar o refinamento visual, após rejeitar o Warden 0.1.196 e discutir o processo do Sumiro. Escopo fechado: o herói atual, um novo modelo do Warden e sua arena. Não ampliar campanha, trocar engine ou comprar ferramentas/geração. Computador deve continuar ligado.

## Acessos

- [Jogar a proposta](https://echosofdante.vercel.app/arrival-3d.html?v=0.1.197&lab=warden&scene=197).
- [Mesmo ambiente com o modelo anterior](https://echosofdante.vercel.app/arrival-3d.html?v=0.1.197&lab=warden&scene=197&model=previous).
- [Oficina: modelo, giro, aproximação e movimentos](https://echosofdante.vercel.app/arrival-workshop.html?v=0.1.197&subject=warden&model=proposal).

Entradas registradas em `test-library.html`. A cena usa `dante.arrival3d.review197.warden`, independente da campanha 2D, da jornada 3D e dos laboratórios 0.1.196. Simula os requisitos de acesso originais: três Ecos, relatórios iniciais, fissura, profundezas, fragmento, Primeiro Eco e limiar. O Warden inicia vivo no primeiro acesso; vitórias reais persistem no teste. O botão da pausa reinicia somente esse laboratório. Escolha classe/aparência no editor; a oficina não lê ou escreve progresso.

## Produção e implementação

Modelo original criado com Blender 4.5.15 em CPU, sem render offline: volumes fechados contínuos, placas com espessura/borda, garras curvas, pernas e dedos de apoio, coroa anular com interior recuado, região abdominal articulada e núcleo violeta. Mapas minerais periódicos de cor, normal e rugosidade produzidos matematicamente, UVs e tangentes exportados. Cor do material registrada como fator glTF explícito para evitar perda de tintas no exportador. Fonte reproduzível: `scripts/asset-tools/author-warden197.py`; editável em `.local/warden197/Dante-Warden197.blend`.

`warden-197.glb`: 10.938 triângulos, nove ossos, seis materiais e mapas de 512 px. Contagens, tamanho e hash finais em `public/assets/arrival-3d/warden-197.json`. Não há clipes importados: o mesmo código de poses recebe os eventos reais de preparação, execução, recuperação e morte do encontro. Não há root motion nem dano novo.

`warden-arena-197.glb`: chão e incisões autorais, 2.320 triângulos e dois materiais sem imagens embutidas. Usa os mapas existentes da caverna. Rochas fotogramétricas Poly Haven Rock Moss Set 02 já presentes são instanciadas com geometrias e texturas compartilhadas; os treze volumes físicos nativos são preservados. Formações adicionais ficam além dos limites caminháveis; borda próxima baixa e caverna sem teto. Um preenchimento direcional sem sombra complementa a luz principal existente; nenhuma luz por monstro ou pós-processamento pesado. A câmera inicial deste laboratório enquadra herói e boss; giro e aproximação continuam disponíveis.

`WardenScene.ts` aplica a apresentação apenas com `lab=warden&scene=197`. Entrada normal mantém o modelo/ambiente anterior e não baixa os dois GLBs da proposta. Na pausa, alternar modelo conserva ambiente, iluminação e save do laboratório. Oficina usa o mesmo recurso e permite comparar os dois modelos. Falha de carregamento mantém o modelo/arena original com mensagem explícita.

Combate, HP, dano, alcances, fases, colisão, missões e recompensas permanecem nos dados/código atuais. O herói, classes, roupas, armas, controles e efeitos existentes são reutilizados. Nenhum código/modelo do Sumiro foi incorporado. Nenhuma conta, assinatura, serviço de geração 3D ou compra foi usada.

## Licenças

Warden, mapas matemáticos e chão/incisões: originais Echoes of Dante, CC0-1.0. Rochas: Poly Haven Rock Moss Set 02, Kless Gyzen, CC0-1.0; reutilização do derivado otimizado já incorporado, com tintura/material para a arena. Texturas da caverna: adaptação já existente de ambientCG Rock035, CC0-1.0. Herói e equipamentos conservam seus créditos. Ver `public/assets/arrival-3d/CREDITS.md` e `public/assets/frontier-3d/CREDITS.md`.

## Validação e limites

- [x] Inspeção visual intermediária na oficina e na câmera real; ajustes de tintas, materiais, chão e enquadramento.
- [x] Validação glTF final dos dois modelos.
- [x] Typecheck/build e revisão de diff.
- [x] Comparação, movimentos, falhas de carregamento e trocas repetidas.
- [x] Combate real pelas quatro classes, fases, morte/vitória e reload.
- [x] Touch/gamepad emulados, resoluções e armazenamento protegido.
- [x] Medição local de desempenho em condições registradas.
- [ ] Commit/push sincronizados e publicação verificada.
- [ ] Avaliação visual humana.

Evidências finais em `qa/0.1.197/`: sete relatórios locais passaram. Amostra parada em Celeron N5105 / Intel UHD, Chrome 156, 1440×900 DPR 1: proposta em aproximadamente 59,5–60 FPS, 60 chamadas/102.600 triângulos contabilizados pelo renderer incluindo sombras; anterior no mesmo ambiente em 58 chamadas/92.732 triângulos. Não é medição de combate. Veja `performance/report.json`, `build-verification.json` e `OBSERVATIONS.md`. QA técnico não é aprovação estética, teste em iPhone físico ou garantia de FPS em outro equipamento. O 3D continua solo; esta cena não adiciona inventário ou coop sincronizado com o 2D. A proposta é uma malha real revisável, não uma reprodução garantida da imagem de referência. Aguardar o playtest antes de adotar o visual como padrão ou seguir para outro território.
