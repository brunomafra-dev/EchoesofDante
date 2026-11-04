# Revisão visual do agente · 0.1.189

QA técnico e aprovação estética do usuário são coisas diferentes. O usuário rejeitou a empunhadura da 0.1.188; esta correção ainda aguarda seu playtest. Sem push ou deploy.

Inspeção no Chrome/Windows, compilado local em `127.0.0.1:5193`, desktop 1440×900/DPR 1, mais capturas em 844×390, 568×320 e 393×852. Foram inspecionadas capturas representativas das quatro classes e dos dois gêneros, A/B, vistas próximas e movimentos. O rig humano completo e seus arquivos GLB permanecem iguais; não houve remodelagem de personagens.

- [Sabre masculino](grips/warrior-male-current-grip.jpg) e [feminino](grips/warrior-female-current-grip.jpg): cabo abaixo da guarda, dedos curvados ao redor e polegar oposto. A comparação anterior conserva os modelos e encaixes iniciais da 0.1.188, usando a animação de origem sem a nova pose de pegada.
- [Rifle feminino](grips/hunter-female-current-grip.jpg): mão direita ao redor do cabo, segunda mão apoiando a peça sob o corpo/cano. O apoio foi aproximado após a inspeção detectar que o alvo anterior excedia o alcance do braço. A confirmação agora mede a palma contra a âncora real, além da orientação das falanges.
- [Manopla em repouso](grips/astral-male-current-reverse.jpg) e [conjuração feminina](grips/astral-female-attack-grip.jpg): dedos expostos e relaxados, sem a antiga pinça do foco; placa dorsal e braçadeira separadas no pulso. Emissor de palma acompanha a mão esquerda que conjura; cor dos componentes acompanha o elemento. Após esse último refinamento de falanges, o build e os testes de empunhaduras/elementos foram repetidos. Os demais checks da rodada completa não tiveram suas áreas alteradas por esse refinamento visual.
- [Ressonador feminino](grips/xenobinder-female-current-grip.jpg): mesma identidade da arma, com cabo entre palma e dedos, sem mudar a companheira ou a habilidade.
- [Oficina horizontal](grips/layout-844x390.jpg) e [vertical](grips/layout-393x852.jpg): painel mantém rolagem própria para os controles inferiores. Novos enquadramentos não alteram a UI do mundo. A rotação manual permite observar regiões ocultas pelo corpo em um dos ângulos automáticos.

O relatório de empunhaduras contém 208 amostras e 87 capturas. Contato estável da palma de apoio no rifle: erro máximo medido de aproximadamente **0,35 mm**, nos pontos amostrados e nos dois rigs. Esse número verifica o alcance do braço/encaixe; não é garantia de ausência de qualquer contato entre triângulos da mão e do cabo em todos os frames ou futuros equipamentos. Pontas dos dedos, polegar, encaixe e movimentos também foram verificados. Trocas repetidas: geometrias 42 → 42, texturas 33 → 31, sem crescimento acumulado nesse teste.

Testes não substituem avaliação humana de naturalidade nem teste em aparelho físico. Não há aprovação de Siroco, novo capítulo ou migração geral nesta entrega.
