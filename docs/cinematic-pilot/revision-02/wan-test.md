# Wan2.2 — teste único de atuação

**Estado: execução preparada; nenhum vídeo gerado, nenhum pedido pago enviado.** O laboratório continua sendo um quadro estático. Esta preparação não encerra a etapa 3 nem aprova o piloto anterior.

## O que falta para executar

1. Entrar/criar sua conta em [fal.ai](https://fal.ai/). O provedor usa créditos pré-pagos: confira o saldo e as condições na sua conta. Não foi feita compra nem confirmada uma recarga mínima.
2. Criar uma chave com preset **API** em [Dashboard → Keys](https://fal.ai/dashboard/keys), conforme a [documentação oficial](https://fal.ai/docs/documentation/setting-up/authentication).
3. No PowerShell, dentro da pasta do projeto, executar:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\wan-pilot.ps1 -Configure
```

Cole a chave **somente no campo oculto desse comando**, nunca no chat. A configuração cifra a chave com Windows DPAPI para seu usuário, fora do repositório: `%LOCALAPPDATA%\EchoesOfDante\authoring\fal-key.dpapi`. Não inicia geração. A opção de execução vale somente para esse processo; não muda a política permanente do Windows.

**Se Ctrl+V parecer não funcionar:** a entrada segura não mostra os caracteres colados. Aperte Enter para confirmar. Como alternativa, cancele com Ctrl+C e execute:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\wan-pilot.ps1 -Configure -FromClipboard
```

Quando o comando pedir, **volte à fal.ai e copie a chave novamente** (copiar o próprio comando pode ter substituído a chave). Retorne ao terminal e aperte apenas **Enter**. O configurador lê a área de transferência diretamente, sem imprimir a chave. Não cole a chave no chat ou na linha de comando. Área vazia, comandos e texto com espaços são recusados antes de gravar; uma configuração anterior permanece intacta nesses casos.

Depois basta informar ao Codex **“acesso configurado”**. Ele poderá enviar o teste autorizado e retomar a consulta. Não precisa instalar Wan, baixar pesos, abrir Render ou colocar chave na Vercel. `FAL_KEY` já configurada no processo também é aceita. Não usar `VITE_FAL_KEY`.

## Teste proposto

- Modelo: [Wan2.2 5B image-to-video](https://fal.ai/models/fal-ai/wan/v2.2-5b/image-to-video), GPU do provedor.
- Uma imagem inteira: [quadro-base público](https://echosofdante.vercel.app/assets/cinematic-pilot/bridge-whole-characters.webp), 1672×941, WebP de 465.088 bytes. Seu hash deve ser igual ao arquivo local antes do envio.
- Um pedido, **121 quadros a 24 FPS**, resolução solicitada 720p, 16:9: cerca de **5 segundos**. A duração e resolução efetivas precisam ser medidas no arquivo recebido.
- [Prompt curto](wan-test-prompt.txt): Ivo opera o console e olha para Nara; Nara escuta e gesticula de forma contida. Corpos completos, pés apoiados, câmera fixa, sem cortes. A geração pode falhar visualmente mesmo com esse direcionamento.
- Sem interpolação, expansão automática do prompt, loop, câmera animada ou repetição de quadros para simular atuação. Este teste não tenta comprimir a conversa inteira de 12 segundos.
- **Preço anunciado em 16/10/2026: US$ 0,15 por vídeo.** O script consulta a [API de preços](https://fal.ai/docs/documentation/model-apis/pricing) e só envia se confirmar USD, unidade `video` ou `videos`, preço positivo de até 0,15. Mudança de tarifa/unidade ou falha nessa consulta bloqueia o POST. É uma verificação antes do envio, não um contrato de preço do provedor nem autorização para recarregar a conta.

## Comandos

Inspecionar parâmetros **offline, sem cobrança e sem credencial**:

```powershell
node scripts/generate-wan-pilot.mjs --dry-run
```

Enviar **uma vez** o teste autorizado:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\wan-pilot.ps1 -Generate
```

Consultar/baixar **o mesmo pedido**, sem gerar novamente:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\wan-pilot.ps1 -Resume
```

Cada `-Resume` consulta uma vez. Se ainda estiver na fila ou processando, pode executar novamente depois; fechar o terminal não cancela o trabalho remoto. Não há loop de espera nem reenvio automático.

Recibo e resultado ficam em `.local/cinematic-pilot/wan-test-01/`, ignorado pelo Git. O arquivo será `bridge-wan-unreviewed.mp4`; ainda não será o vídeo publicado. A chave não é gravada no recibo. Somente pedidos HTTPS para `queue.fal.run` recebem autenticação de fila; o download da mídia não recebe a chave. Redirecionamentos são recusados.

### Interrupção ou erro

- O recibo é criado com exclusão mútua **antes** do POST; dois terminais não enviam duas gerações. O cabeçalho oficial [`X-Fal-No-Retry: 1`](https://fal.ai/docs/documentation/model-apis/inference/queue) também desativa retries do provedor.
- Se o envio cair antes de devolver o identificador, o estado fica **incerto**: conferir o histórico da conta. O comando bloqueia novo envio; não apague o recibo para tentar outra vez.
- Se já houver identificador, `-Resume` reutiliza as URLs devolvidas pelo serviço; não supõe caminhos derivados do nome do modelo.
- Resultado com erro, filtro ou anatomia ruim não aciona regeneração, troca de modelo ou compra de créditos. Qualquer novo teste pago precisa ser decidido depois de inspecionar o primeiro.
- O download tem limite de 100 MiB e valida cabeçalho MP4. Isso não comprova movimento, qualidade, duração ou codec: o arquivo precisa ser decodificado e revisado.

## Próxima validação

1. Receber o vídeo e conferir formato, resolução, duração e quadros reais com as ferramentas locais já disponíveis.
2. Rever em movimento e amostrar mãos, cotovelos, ombros, pés e rostos ao longo do clipe. Rejeitar anatomia quebrada, deslize ou cena essencialmente parada. Não declarar sucesso pela existência de um MP4.
3. Se promissor, publicar esse teste na biblioteca com estado explícito para avaliação humana. Não transformar 5 segundos em 12 por câmera, congelamento ou loop.
4. Só após validar a representação, planejar os trechos restantes do piloto de 12 s, legendas em português e ambiente original. A abertura de 55 s e missões continuam aguardando a aprovação do piloto completo.

## QA da preparação

Executado em 16/10/2026, sem credencial ou chamadas reais ao provedor:

- `node --check scripts/generate-wan-pilot.mjs`.
- `node --test scripts/qa-wan-pilot.mjs`: **15 testes passaram**, HTTP inteiramente simulado. Cobrem preço maior/unidade diferente, imagem pública divergente, credencial ausente, concorrência, timeout ambíguo, retomada, domínio da fila, download sem chave e HTML inválido.
- Wrapper PowerShell em modo padrão: apenas simulação, sem gravação de credencial ou envio. Em 17/10/2026, `powershell -NoProfile -ExecutionPolicy Bypass -File scripts/qa-wan-config.ps1` validou importação da área de transferência simulada e cifragem/decifragem DPAPI com chave fictícia num diretório temporário. Quatro entradas inválidas preservaram o arquivo anterior; `-FromClipboard` sem `-Configure` foi recusado. O QA não lê o clipboard real, não usa a conta e não gera vídeo. A chave real ainda precisa ser configurada pelo usuário.
- `npm run typecheck` e `npm run build`: passaram; apenas o aviso já conhecido do bundle Phaser maior que 500 kB.
- `node scripts/qa-cinematic-reference.mjs`: Chrome local, quatro resoluções, touch e sentinelas de save preservadas; zero erros JS/assets. Evidência temporária em `%TEMP%\dante-wan-preparation-qa`. O teste confirma somente o quadro estático, com `videoGenerated: false`.
- `git diff --check`.

Sem dependências novas, mudanças na campanha, saves, controles ou relay. Versão do jogo preservada em **0.1.106**: somente ferramentas offline e documentação. A etapa continua em andamento, não é uma entrega de filme.

### Credencial validada — 17/10/2026

Configuração local concluída pelo usuário. Consulta **GET**, sem geração: API de preços autenticada retornou **HTTP 200**, endpoint Wan2.2 5B, **USD 0,15**, unidade real **`videos`**. Controle sem autenticação retornou **HTTP 401**. A chave foi decifrada somente em memória, enviada ao domínio oficial e não foi impressa ou gravada no repositório. Nenhuma consulta de saldo foi feita; o usuário informou que ainda não adicionou créditos.

O retorno real revelou a unidade no plural, enquanto o exemplo documental e os mocks usavam `video`. Ajustado o guard para aceitar somente as duas grafias por vídeo, mantendo teto, moeda, bloqueio de unidades por segundo e proteção contra reenvio. QA atualizado: **16 testes simulados passaram**. Nenhum POST de geração ou compra foi realizado nesta validação.
