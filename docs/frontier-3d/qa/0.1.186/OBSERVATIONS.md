# Observações do acabamento · 0.1.186

## Problemas encontrados e corrigidos

- A inspeção inicial no editor mostrou empunhaduras/motores desalinhados: definir a rotação do cilindro antes de trocar seu modo de rotação no Blender descartava a orientação. O gerador agora define o modo primeiro, e a inspeção offline limita a altura da nave. Não foi corrigido mascarando todas as faces como DoubleSide.
- O primeiro vidro plano do cockpit atravessava o casco curvo. A superfície agora acompanha os segmentos do casco, com moldura e pequena separação externa, verificada na oficina e na nave dentro do mapa.
- A antiga rampa coincidia com o motor lateral. Hatch/rampa passam à frente do motor; os apoios dianteiros foram afastados desse acesso, com colisões correspondentes. O percurso nativo sobe a rampa e verifica altura superior a 0,4m antes do salto.
- Chapas/lona/folhas com faces duplicadas geravam avisos de exportação. As superfícies finas receberam espessura de malha; a exportação final não depende de faces coincidentes.
- Materiais separados para cada pequena peça do vestuário aumentavam o número de chamadas. Uniformes e ferramentas de mão foram reunidos por cores de vértices. Curvas excessivas e juntas completas repetidas nos dois lados da nave foram reduzidas/removidas. Amostra anterior em `observations/performance-before-curve-optimization/` é diagnóstica, não o benchmark final.
- Fragmentos de terra tinham faces voltadas para dentro e pareciam recortes. A direção das faces foi corrigida e o volume fechado. O arco direcional foi alinhado à frente do ator e à abertura do ataque.
- A primeira oficina procurava uma bancada inexistente para Elisa antes de selecionar o canteiro. A escolha agora ocorre antes de carregar o prop. Toque/seletores e telas estreitas foram reconferidos.
- As capturas mostraram um traçador que podia aparecer acima do cano durante a animação. O feixe passa a acompanhar um ponto do modelo da arma; projéteis saem visualmente do instrumento e convergem rapidamente à trajetória lógica original. Posição lógica, alcance, colisão, dano e recursos são separados dessa correção visual. Efeitos ancorados são atualizados após a pose do personagem, para acompanhar a mão no mesmo frame. Feixe cuja origem ultrapasse o obstáculo não desenha uma linha para trás.

## Verificação e limites

O circuito completo usa WASD/E e combate normais, sem teleportes/setters de progresso. Visita cinco NPCs, rampa, formação sólida, três ecos, origem/mecanismo e portais, com retorno, reload e encontros finitos. A observação do acampamento começa com um personagem novo e verifica os quatro residentes fixos trabalhando e Elisa junto aos dois canteiros reais.

Classes/layouts, toque real via CDP e gamepad emulado, quatro elementos, poção/derrota/reload, isolamento e a entrada anterior têm roteiros separados. A oficina não carrega progresso e verifica modelos/ações/seletores e dados sentinela intactos. Estado preparado para elementos, derrota, poção, sanitização e benchmark fica somente no armazenamento temporário do laboratório, conforme cada relatório. Nenhum boss é simulado.

Após o circuito completo, a correção final da origem visual dos disparos recebe nova passagem de classes/combate/layouts, input/isolamento, elementos e oficina no novo compilado. A alteração não muda layout, rotinas, rig original ou regras de progressão. Os roteiros completos continuam reproduzíveis por `node scripts/qa-arrival186.mjs`.

As capturas exigem inspeção visual, além dos asserts. QA técnico não aprova estética. Os modelos e clipes são uma interpretação estilizada para este ensaio; não constituem a produção final de todos os equipamentos/animações de uma campanha migrada. Não há coop 3D, teste físico em iPhone ou garantia de FPS a partir da emulação.

### Margem do roteiro de navegação

Na repetição final de classes, Astral pressionou E ainda na base, sem contexto de portal: posição `(28,767; 20,767)`, cerca de 2,36m do centro, além do raio de 2,25m. Não houve erro de carregamento ou entrada indevida. O navegador automatizado aceitava o contexto na borda antes de terminar de soltar as teclas. Passou a exigir aproximação de 0,4m do alvo do percurso e reconferir o contexto depois de parar. O relatório e captura dessa ocorrência ficam em `observations/portal-boundary/`; não representam o resultado final. Nenhum alcance de interação, portal ou requisito do jogo foi ampliado para fazer o teste passar.

A tentativa apenas com margem ainda oscilou no caminho. Um diagnóstico separado confirmou controles físicos ausentes e eventos corretos; a tecla S pedida por 500ms ficou pressionada por cerca de 1,95s enquanto o roteiro aguardava a leitura CDP antes de soltá-la. A navegação automatizada passou a usar pulsos DOM com liberação pelo timer do próprio navegador, sem setters de posição/progresso. E/H/Q/R/F e ponteiro continuam nativos; toque CDP e gamepad têm testes próprios. Essa diferença consta no método do relatório de classes e no script, sem atribuir o problema ao jogo ou a um controle físico.
