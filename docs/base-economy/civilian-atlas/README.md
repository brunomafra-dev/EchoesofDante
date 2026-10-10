# Tripulação própria e atlas de Dante — 0.1.86

Revisão da etapa 3, solicitada após o playtest. Não inicia a etapa 4.

[Teste reservado](https://echosofdante.vercel.app/base-playtest.html?v=0.1.86): caminhe até a tripulação e abra **M / MAPA**. Preserva personagens e saves reais.

## NPCs

- **Dra. Lia:** médica de meia-idade, jaleco, bolsa e scanner diagnóstico.
- **Ivo:** técnico robusto, barba grisalha, avental de trabalho, ferramentas e óculos de proteção.
- **Nara:** coordenadora de expedições, jaqueta, lenço, bolsa de campo e tablet.
- Dois refugiados distintos aparecem após o marco já existente do Warden.

Cinco ilustrações originais, transparentes, geradas offline com imagegen. Não reutilizam corpos, equipamento ou sprites dos heróis. Proporção da pintura preservada ao dimensionar por altura: NPCs 96 unidades; refugiados 86. Posições, footprints, serviços e progressão não mudam. Personagens permanecem estáticos nesta revisão; não têm IA ou diálogos novos.

## Atlas

O mapa deixa de ser uma grade de destinos. Uma pintura cartográfica original representa florestas, montanhas, deserto e gelo da **região conhecida da expedição**. Não define continentes ou a geografia definitiva de todo Dante.

Onze destinos existentes em um overlay SVG leve; caminhos descobertos em dourado, trajetos desconhecidos tracejados, áreas não exploradas encobertas e localização atual com losango/legenda. Rótulos das regiões não visitadas ficam ocultos. O atlas expressa as conexões da campanha, não é um mapa tático de cada sala. O minimapa permanece.

Viagens preservam as regras anteriores: na base, apenas destinos descobertos; fora dela, retorno próximo ao terminal; boss ativo bloqueia retirada; na dupla, anfitrião escolhe o destino. Touch permite percorrer o atlas; foco de teclado/gamepad acompanha o item selecionado. Em telas baixas o mapa abre na localização atual. Não se aplica zoom à página ou à câmera.

## Produção e runtime

Prompts em [prompts.json](prompts.json). `scripts/prepare-expedition-visuals.py` recorta o alpha dos personagens, conserva proporção e reduz cada pintura para até 180×240. Atlas até 1120×748, WebP qualidade 87. Dimensões/tamanhos finais em [assets.json](qa/assets.json).

As pinturas antigas ficam arquivadas para rollback, mas não são carregadas pelo jogo. O preparador antigo deixa de reconstruir NPCs com os heróis. Cinco imagens estáticas substituem as anteriores; chão baked e colisões permanecem. O atlas carrega uma imagem apenas na interface, com SVG criado ao abrir, sem polling visual, tweens ou redesenho do cenário.

## Validação

Typecheck/build e QA de serviços, dupla e inputs passaram. Chrome headless: 1280×720, 1366×768, 1920×1080 e 844×390. Três NPCs com aspecto preservado, interações, onze regiões, restrições de viagem, dois refugiados e laboratório sem gravação no save real.

Touch CDP e gamepad mock: poção, interação, menu, navegação e retorno. Base: aproximadamente **55–56 FPS**, 53 objetos, 180 texturas totais do jogo e zero tweens, sem crescimento na amostra. Não houve teste físico de dispositivo.

[Relatório visual/técnico](qa/report.json) · [inputs e estabilidade](../qa/inputs-performance.json) · [dupla](../qa/coop.json).

**Automação passou. Aprovação visual depende do playtest humano.** Legibilidade dos marcadores, conforto do mapa em aparelho real e identidade da tripulação precisam da avaliação do usuário antes da etapa 4.
