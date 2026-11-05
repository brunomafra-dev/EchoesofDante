# Combate legível e movimento · 0.1.192

Pedido de 05/11/2026 após playtest da 0.1.191. Mesmo protótipo solo de acampamento/floresta: disparos com identidade, Q do Caçador como feixe concentrado, Guerreiro visível, Água/Energia diferentes, cambalhota após dash, câmera sem copas na lente e números de dano. Sem novos mapas, classes, migração de coop ou alteração dos saves reais. Publicação segue a autorização vigente; não equivale a aprovação estética humana.

## Implementação

- Dez modelos originais de efeitos produzidos em **Blender 4.5.15**, apenas modelagem/exportação, sem render ou GPU dedicada. Fonte reproduzível `author-arrival192.py`, `.blend` ignorado em `.local/combat192/`; GLB e manifesto em `public/assets/arrival-3d/combat-fx-192.*`. Sem arte/áudio externo novo. Modelos de personagens, armas, manopla, mochila e criaturas preservados.
- Caçador: cápsula de plasma, núcleo e filamentos, boca do rifle como origem e feixe Q volumétrico breve com núcleo claro e halo contido. Mesmo alcance, faixa de acerto, cadência, dano, custo e bloqueio em obstáculos anteriores; referência do usuário orienta a leitura de um feixe concentrado, sem incorporar arte de outra franquia.
- Astral: lente/orbitais violetas para Energia, gota/esteira azul para Água, brasa para Fogo e lasca mineral para Terra. Campos Energia/Água com volumes próprios. Elemento visual é guardado no projétil; trocar R não altera tiros em voo. Domador usa semente/tentáculos de vínculo.
- Guerreiro: arco volumétrico de contato e rastro curto da parte externa da lâmina real. Corrigido o reinício de um ataque que fazia a animação aplicar fade-out a si mesma. Clips completos são ajustados à janela da ação; não interromper Sword de 1,53 s aos 0,28 s sem executar o golpe.
- Rolamento de 1,47 s normalizado para 0,50 s com transição final para corrida/repouso. Deslocamento rápido e invulnerabilidade mantêm 0,175 s (0,24 s Caçador); recuperação visual termina antes de novo ataque/salto/poder, sem estender invulnerabilidade. Movimento segurado continua durante a recuperação. Não é root motion duplicado.
- Números de dano partem exclusivamente da redução confirmada de HP, inclusive ticks e fera; herói em vermelho, criaturas em claro, arredondados para exibição. Sem dano extra. Pool limitado a 28 elementos, expiração 0,85 s e posições projetadas acima do alvo; nenhuma textura nova por acerto.
- Câmera: rig de órbita separado da câmera renderizada; braço encurta diante de volumes conservadores de copas/troncos/rochas e se recupera suavemente. Colisões de gameplay e terreno não mudam. Árvores/objetos continuam opacos, sem ocultação, transparência ou substituição de terreno. Volumes são aproximações, sujeitos ao playtest em outros ângulos.

Geometrias/materiais/texturas são compartilhados; pool por arquétipo de projétil, partículas limitadas a 192. Materiais temporários de efeitos são descartados sem descartar as geometrias compartilhadas. Sem luz dinâmica por efeito ou bloom global. Contagens/hash reais no manifesto, não garantia isolada de FPS.

## Revisão e evidências

[Oficina: feixe Q e efeitos](https://echosofdante.vercel.app/arrival-workshop.html?v=0.1.192&subject=hunter&view=combat&effect=power) · [Jogar](https://echosofdante.vercel.app/arrival-3d.html?v=0.1.192). Ambos registrados na biblioteca. Oficina não lê/escreve progresso; mundo usa a mesma sessão 3D isolada e não simula requisitos/bosses. Fixtures de QA serão declaradas nos relatórios.

- [x] Typecheck/build 310 módulos, modelos/fontes e preservação: [verificação](qa/0.1.192/build-verification.json). 83 hashes da campanha idênticos; três bundles do menu recompilados pela versão do acesso. Configuração, cenas, sistemas e relay sem alterações.
- [x] [28 casos de efeitos e oito poses de rolamento](qa/0.1.192/visual/report.json), quatro classes/dois corpos/quatro elementos, recursos estáveis em oito ciclos adicionais: geometrias 57 → 57, texturas 34 → 34. Expiração natural dos efeitos verificada antes de parar a reprodução. Capturas representativas inspecionadas.
- [x] [Movimento/dano/câmera](qa/0.1.192/motion-damage/report.json): quatro classes, 133 amostras por frame, rolamento avança além de 70% do clip e termina em corrida com movimento segurado, recuperação visual não estende a janela de invulnerabilidade. Ataque no vazio sem números; HP real perdido 136 e soma exibida 136; dano do herói 14 confirmado. Pool de 28 e expiração verificados. A condição de esquiva continua no evento de combate original, sem novo caminho de dano.
- [x] [Percurso completo/reload/requisitos](qa/0.1.192/route/report.json), [touch nas quatro classes/gamepad/recuperação](qa/0.1.192/input/report.json), [efeitos mecânicos dos elementos](qa/0.1.192/elements/report.json), [NPCs/oficina/layouts](qa/0.1.192/workshop/report.json), [entrada/retorno pelo menu](qa/0.1.192/entry/report.json) e [desempenho](qa/0.1.192/performance/report.json) passaram. [Inspeção e limites](qa/0.1.192/OBSERVATIONS.md).
- [ ] Sincronização, Vercel e QA público.
- [ ] Aprovação visual humana / iPhone físico.

Catálogo novo: **115.444 bytes, dez modelos, 4.994 triângulos somados, zero texturas**. Projétil isolado: 56–436 triângulos; feixe 596; arco 456; vórtice de água 1.756; estrutura de energia 816. Só os efeitos ativos são desenhados. Materiais e geometrias dos modelos são compartilhados; duas primitivas por modelo.

No Celeron N5105/Intel UHD (Chrome ANGLE D3D11), 1440×900/DPR1, Guerreiro parado: base com cinco NPCs 46,6–47,1 FPS, floresta com oito aranhas animadas 55,5–56,0 FPS. Oito segundos de aquecimento e três amostras de dois segundos, sem build/Blender/outro QA concorrente. A câmera mudou a visibilidade na base; não interpretar a diferença como benchmark controlado ou ganho geral. Não é combate contínuo, notebook do usuário ou iPhone físico. Não declarar 60 FPS ou aprovação humana a partir de emulação.
