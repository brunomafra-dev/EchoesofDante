# Expansão 03 — Escarpa da Ressonância

**Versão:** 0.1.52

**Estado:** implementação conectada ao Vale; playtest humano pendente.

## Objetivo

Continuar a aventura depois da primeira região pós-Warden. A pista “O sinal segue além das rochas” agora tem uma continuação explorável, mantendo o Vale da Ressonância e a Escarpa como uma travessia contínua.

## Extensão e orientação

A área do Vale cresceu de 3000 para 5500 unidades de câmera. A passagem leste fica entre a formação terminal do Vale e a crista superior. Na Escarpa, uma crista larga divide a exploração em dois desvios — mineral ao norte e enraizado ao sul — que voltam a se aproximar junto à estrutura de escuta. O limite oriental forma um novo horizonte bloqueado para uma expansão futura.

## Ponto de interesse e sinal

A estrutura de escuta responde uma vez à interação. O eco é recente e aponta para além da Escarpa, mas não identifica origem ou destino. Ao alcançar o horizonte, a resposta confirma que o sinal continua sem resolver o mistério.

## Encontros

Quatro Casco Errante e Espinhante existentes compõem dois encontros espaçados. Seus atributos, IA e ataques não mudaram. Os encontros não abrem passagens e podem ser evitados. Não há novos inimigos, recompensas especiais ou sistemas de missão.

## Colisões, checkpoint e retorno

As cristas, minerais, estrutura de escuta e borda leste usam obstáculos simples alinhados à arte. O limite de movimento deixa o caminho livre entre os desvios. Ao entrar na Escarpa, um checkpoint seguro é registrado; morte e recarga retornam à sua entrada sem apagar o progresso. O portal oeste ainda permite voltar ao Domínio do Guardião e reaparecer junto à entrada do Vale.

As flags opcionais `valleyFrontierReached`, `valleyFrontierSignalSeen` e `valleyFrontierEndSeen` estendem o save local existente, mantendo compatibilidade com os registros anteriores. Nenhum save permanente novo foi criado.

## Arte e performance

A composição utiliza os PNGs ambientais já carregados — estratos, minerais, raízes e restos ancestrais — distribuídos em quatro RenderTextures estáticas. O terreno ilustrado é a base contínua existente do Vale. Não foram gerados assets novos nem criados objetos ambientais por frame. Sombras, câmera, HUD base e materiais do jogo permanecem.

## Validação

- `npm run typecheck`: aprovado.
- `npm run build`: aprovado; Vite mantém o aviso já existente sobre o chunk Phaser acima de 500 kB.
- Chrome headless: entrada no Vale, passagem leste por movimento contínuo, rotas norte/sul, interação com o POI, horizonte, estado de sessão, recarga/checkpoint e retorno pelo portal foram percorridos. Nenhum erro de JavaScript ou asset foi registrado.
- [Capturas da expansão](preview.png).
- **Playtest humano ainda necessário** para avaliar o ritmo de exploração e combate em movimento.

## Limites atuais

A Escarpa termina numa crista bloqueada; a continuação além dela não foi construída. Os dois arquétipos do Vale são reutilizados. O mapa ainda não é um mundo aberto sem costuras entre Forest, Cavern, Vale e outros capítulos: as conexões existentes entre regiões preservam suas transições atuais.
