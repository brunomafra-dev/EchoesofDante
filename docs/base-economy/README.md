# Etapa 3 — Base de pouso e economia

Versão **0.1.85**. [Teste reservado](https://echosofdante.vercel.app/base-playtest.html?v=0.1.85). O laboratório usa recursos temporários e não altera personagens ou saves reais. A aprovação humana ainda é necessária antes da etapa 4.

## Ciclo jogável

Base → preparar → Floresta/região descoberta → combater → coletar → terminal de retorno → base → melhorar equipamento. Novos personagens começam na base com três poções; saves anteriores mantêm sua região e progressão. Nenhum combate, classe, dano, XP, câmera ou IA foi rebalanceado nesta etapa.

Base caminhável, nave DANTE-01, três abrigos e tripulantes:

- **Dra. Lia:** restaura vida gratuitamente e vende poções.
- **Ivo:** fabrica, compra e desmonta equipamentos da mochila. Peças equipadas ficam protegidas.
- **Nara:** destinos descobertos e cofre pessoal de 48 espaços.

Os abrigos e a nave têm footprints simples; NPCs são pinturas estáticas reaproveitadas dos personagens e braços existentes. Dois refugiados aparecem após o Warden como presença visual, sem novas missões ou diálogos.

## Regras econômicas

Cada criatura deixa créditos e material regional pessoais: 4 × tier créditos e um material; bosses, 25 × tier créditos e seis materiais. Coleta por aproximação, raio 48. Floresta/cavernas/vale: liga; Siroco/dunas: carapaça âmbar; gelo: núcleo boreal. Equipamentos continuam com coleta manual e miniatura própria.

Fabricação garantida: 35 × tier créditos e 4 + 2 × tier materiais da família correspondente. Sem filas ou falhas aleatórias. Venda: 10 × tier créditos. Desmontagem: dois materiais regionais. Transferir para o cofre conserva UID e atributos; retiradas exigem espaço na mochila. Nenhuma peça é equipada automaticamente.

Poção custa 12 créditos, cura 35% da vida máxima, tem recarga de oito segundos e limite de 20 unidades. Vida cheia, morte, recarga ou falta de poções impedem o consumo. **H**, botão touch ou **Y** do gamepad padrão. Recarga usa prazo persistido, sem reset por reload.

Compras, fabricação, venda, desmontagem, cofre e consumo operam em um draft e uma gravação. Falta de recurso/espaço ou erro de storage preserva o estado anterior. Cofre, moeda e materiais são por personagem. Não há comércio entre jogadores.

## Mapa e viagens

**M**, botão MAPA ou menu de pausa abrem o mapa de destinos e ligações. Mantém o minimapa. Na base, o anfitrião/solo escolhe um destino descoberto. Fora dela, retorno exige proximidade do terminal na entrada/checkpoint da região; E / COLETAR contextual / A no terminal também retorna. Boss ativo impede a retirada, tanto no jogo quanto no relay.

Descobertas da campanha continuam pertencendo ao anfitrião. Ao voltar ao solo, destinos respeitam os marcos do próprio personagem, evitando pular suas portas por ter visitado outra campanha.

## Solo, dupla e persistência

Dados econômicos opcionais adicionados ao save atual, sem reset: saves antigos ganham contadores vazios e destinos coerentes com seus flags. Novos personagens recebem três poções. Equipamentos existentes e bônus permanecem.

Protocolo **4** inclui base, viagens, recompensas de materiais/créditos e solicitações de cura. Frontend e Render precisam atualizar juntos; versões incompatíveis informam atualização pendente. Serviços e inventário pessoais não pausam a dupla. O anfitrião aplica a cura do visitante; recibos cumulativos salvam consumo e recompensas uma vez. IDs de equipamento já recebidos impedem que um recibo repetido recrie uma peça vendida, desmontada ou guardada.

Sem save em nuvem, economia MMO ou novo sistema de autenticação. Recibos usam a reconexão e armazenamento local existentes; indisponibilidade do storage é informada e mantém recompensas pendentes.

## Assets e execução

`scripts/prepare-base-assets.py` prepara assets offline. Nave e abrigo originais gerados com a ferramenta imagegen; prompts em [asset-prompts.md](asset-prompts.md). NPCs reutilizam roupa e braços aprovados; minerais existentes ilustram os materiais. Arquivos em `public/assets/base/`.

Chão, marcas e rochas baked uma vez em uma RenderTexture de 1400×1050. Nave, três abrigos e NPCs são imagens estáticas. Nenhum novo tween contínuo ou desenho por frame. Recursos usam pool limitado a 32 drops ativos por participante/região. Valores de economia atualizam DOM somente ao abrir/operar; contador de poções muda apenas quando seu valor muda.

## Validação e limites

QA específico: `scripts/qa-base-economy.mjs`, `scripts/qa-base-coop.mjs`; evidências em `qa/`. Testes incluem serviços, custos, poções, equipamento fabricado, venda, desmontagem, cofre cheio, viagens, storage rejeitado, reload, três reinícios, quatro resoluções e dupla com WebSockets reais.

Regressão: campanha existente, bosses, kit, Echoes, passagem, respawn, protocolo, touch e gamepad emulados. O teste de jornada passou a distinguir o novo modal de serviços do diário, sem enfraquecer a verificação de duplicação de UI.

Não houve teste físico de celular/gamepad. Custos, prazer do ciclo econômico, visual dos NPCs e conforto dos serviços precisam do playtest humano. Aprimorado/raro mantêm a família visual reforçada existente.

A **etapa 4** revisará dificuldade/recompensas e aplicará a penalidade de 10% de créditos na morte. Esta entrega não aumenta nível máximo, não implementa novas classes, não amplia a equipe para quatro e não cria o prólogo.

### Roteiro de playtest

1. Abra o laboratório e feche o painel de instruções.
2. Visite Lia, compre uma poção; visite Ivo, fabrique uma peça e equipe pela mochila.
3. Venda/desmonte outra peça; guarde e retire um item com Nara.
4. Saia para a Floresta, lute e colete materiais/créditos.
5. Use uma poção ferido; volte ao terminal da entrada e retorne à base.
6. Avalie se preparar e voltar à base melhora a expedição.

### Resultado técnico desta entrega

- Typecheck e build passaram. Apenas o aviso de tamanho do bundle Phaser já existente.
- Serviços, persistência, rollback de storage, equipamento vendido sem recriação por recibo, protocolo 4 e campanha cooperativa até Vésper passaram.
- Touch CDP: poção, atendimento, mapa e terminal contextual. Gamepad API mock: Y, A, direcional, B e mapa pelo menu de pausa. Corrigida a reutilização do A de abertura como confirmação no mesmo toque.
- Base: média **55,4 FPS** em amostra de seis segundos após estabilizar; 53 objetos, 178 texturas carregadas no jogo e zero tweens, sem crescimento. A jornada de regressão registrou aproximadamente **58 FPS**. São medições headless nesta máquina, não garantia em hardware móvel.
- Oito PNGs somam **496.384 bytes**: nave 640×427, abrigo 256×183, três NPCs 79×160 e três ícones 48×48. Uma RenderTexture estática da base; nada gerado durante o gameplay.
- Capturas e relatórios: [serviços](qa/report.json), [inputs e estabilidade](qa/inputs-performance.json), [dupla](qa/coop.json), [proteção do relay](qa/base-protocol.json), [campanha](qa/campaign/campaign.json), [jornada](qa/journey/report.json). Capturas de documentação compactadas em WebP.

**Automação passou. Playtest humano necessário.** O teste reservado usa exclusivamente recursos temporários. Esta entrega encerra a implementação da etapa 3, mas a etapa 4 aguarda aprovação do usuário.
