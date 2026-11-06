# Warden — preparação do teste Tripo

**06/11/2026 · Estado real:** o usuário rejeitou o acabamento do Warden 3D 0.1.196 e pediu um teste com Tripo. A referência foi produzida e inspecionada; **nenhum modelo foi gerado no Tripo, importado, animado ou validado**. O usuário informou que ainda não tem conta. Não há chave Tripo configurada, e o plugin fal encontrado não está conectado. Nenhuma compra, assinatura ou conta foi criada.

## Referência pronta

- [Baixar a imagem de entrada](https://echosofdante.vercel.app/assets/arrival-3d/warden-tripo-reference-v1.png).
- [Comparar com o Warden atual na oficina](https://echosofdante.vercel.app/arrival-workshop.html?v=0.1.196&subject=warden).
- Arquivo: `public/assets/arrival-3d/warden-tripo-reference-v1.png`.
- Origem: geração de imagem pela ferramenta integrada, usando a arte existente `public/assets/visual/creature-finish/warden-v1.webp` como referência de identidade. Não é uma saída do Tripo, render da malha do jogo ou nova licença de asset externo. Prompt completo em `image-prompt.txt`.

Preservar a coroa anular oca, ombros largos, pernas compactas, garras integradas, placas minerais claras com articulações violetas escuras e núcleo violeta contido. A revisão procura recuperar essa identidade e evitar o aspecto de pedras agrupadas do modelo atual. Aprovação visual humana da proposta está pendente.

## Como realizar a geração gratuita

1. O usuário cria/acessa sua conta no [Tripo Studio oficial](https://studio.tripo3d.ai/).
2. Escolher imagem para 3D e enviar somente a referência acima, não a folha com várias poses.
3. Verificar os créditos exibidos antes de gerar. Para exportação gratuita, a página de preços consultada anuncia **H2.5**; não escolher uma opção que exija assinatura para baixar. Não comprar créditos para este teste.
4. Gerar o modelo com texturas e conferir todos os lados no visualizador. Verificar principalmente o interior da coroa, separação de braços/pernas e espessura das garras. Os detalhes posteriores à imagem não foram especificados visualmente e precisam de revisão.
5. Exportar **GLB com texturas**. Se o arquivo for ZIP, manter o pacote completo. Guardar também a versão usada e os termos/licença apresentados na conta. Não pressupor direito de redistribuição do arquivo bruto: a página comercial e a documentação consultadas divergem sobre uso comercial no plano gratuito.
6. Colocar o GLB em `C:\Users\1\Desktop\Bruno Mafra\Echoes of Dante\.local\warden-tripo\warden-tripo.glb` (criar a pasta se necessário), ou enviar o arquivo nesta conversa. Fontes recebidas ficam inicialmente fora de `public/` e do Git.

## Integração pendente após receber o GLB

- [x] Inspeção da arte 2D, malha atual, pontos de integração e acesso ao serviço.
- [x] Imagem de referência e instruções de teste, registradas na biblioteca.
- [ ] Geração real no Tripo e confirmação da licença aplicável.
- [ ] Inspeção de geometria, materiais, texturas, tamanho e rig reais; nada disso pode ser medido pela imagem.
- [ ] Escala/orientação/chão e alinhamento com o raio físico existente.
- [ ] Preparação de pesos/esqueleto no Blender se o modelo vier estático. Auto-rig não garante compatibilidade com o guardião.
- [ ] Comparação atual/candidato na oficina e animações guiadas pelos eventos reais.
- [ ] Dano, colisão, fases, morte/reload e salvamento preservados; teste no jogo e desempenho no hardware disponível.
- [ ] Aprovação humana antes de substituir o visual padrão.

`Warden.ts` carrega a malha em `loadWarden()`, clona o esqueleto e usa os ossos Root, Torso, Crown, ArmL/R, ClawL/R e LegL/R para as poses. Não basta trocar o arquivo GLB sem preparar essa compatibilidade. O encontro mantém seus dados canônicos; nenhuma alteração de IA, alcance, dano, drops, progressão ou saves faz parte desta preparação.

## Fontes consultadas

- [Tripo Studio](https://studio.tripo3d.ai/): geração exige acesso à conta.
- [Preços oficiais](https://www.tripo3d.ai/pricing): 200 créditos mensais gratuitos, exportação H2.5 limitada, modelos públicos e indicação de uso não comercial.
- [Documentação de créditos](https://www.tripo3d.ai/product-doc/getting-started/pricing-credits): custos adicionais por operação e condições que precisam ser conciliadas com os termos da conta antes de publicar um GLB.
- [Studio e API têm cobrança independente](https://www.tripo3d.ai/help/api-plugins/tripo-studiotripo-api).
- [Tripo no fal](https://fal.ai/models/tripo3d/tripo/v2.5/image-to-3d/api): alternativa encontrada, não conectada nem utilizada. Não usa os créditos gratuitos do Studio.

## QA desta preparação

[Registro técnico](qa.json) e [captura da biblioteca](library.jpg). Build de produção passou, incluindo TypeScript (319 módulos; aviso de tamanho de chunks já existente). Chromium abriu o link da biblioteca e conferiu a imagem completa pelo hash/dimensões; o retorno preservou um marcador de armazenamento em contexto isolado, sem erros de página. Comparação do build confirmou 108 arquivos anteriores idênticos ao baseline 0.1.196; somente biblioteca/créditos mudaram, além da imagem nova. A malha do Warden, código, regras e saves não foram alterados. A imagem foi inspecionada visualmente; isso não valida malha, animação, desempenho ou aprovação estética humana.

A versão jogável continua **0.1.196**. Esta preparação não representa um novo boss integrado nem um teste de desempenho aprovado.
