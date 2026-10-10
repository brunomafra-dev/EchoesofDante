# Créditos, receitas e recompensas — 0.1.87

Revisão solicitada após a aprovação dos NPCs e atlas. Parte da etapa 3; a revisão geral de dificuldade da etapa 4 ainda não começou.

[Teste reservado](https://echosofdante.vercel.app/base-playtest.html?v=0.1.87). Preserva personagens e progresso reais.

## O que mudou

- Saldo pessoal de **créditos** no topo, ao lado de mapa/poção, sem uma nova janela permanente. Atualiza após coleta, compra, fabricação, venda e recebimento cooperativo; DOM muda apenas quando o valor muda.
- As 21 receitas mostram nome, bônus, custo em créditos/material, estoque próprio, recursos faltantes e mochila cheia. Marcas ✓/× e texto comunicam disponibilidade, além da cor.
- Créditos sozinhos não permitem fabricar. Essa regra já existia; agora fica explícita. Custos permanecem 35/70/105 créditos e 6/8/10 materiais por tier.
- Criaturas continuam deixando **um material regional + 4 × tier créditos**. Coleta mostra o nome do material: Liga da floresta, Carapaça âmbar ou Núcleo boreal. Bosses conservam seis materiais + 25 × tier créditos.
- Drops de equipamento de criaturas comuns passam de primeira morte e depois uma a cada quatro para **um a cada doze mortes comuns**, sem item garantido no primeiro monstro de cada região. É uma cadência determinística do protótipo, não uma probabilidade aleatória. A contagem atravessa viagens/respawns na sessão; reload inicia nova contagem. Bosses mantêm seu drop garantido, sem contar como morte comum. Catálogo, raridades, atributos e itens possuídos não mudam.
- Loot permanece pessoal, equipamento é coletado manualmente e fabricação não equipa automaticamente. Materiais não ocupam espaços da mochila.

## Como avaliar

1. Feche as instruções e confira CRÉDITOS no topo.
2. Converse com Ivo. Compare custo e estoque nas receitas.
3. Use **Testar sem materiais · apenas créditos**, nas instruções. Mesmo com 300 créditos, a fabricação fica bloqueada e explica o material faltante.
4. Reabasteça os recursos de teste e fabrique: saldo e estoque diminuem imediatamente.
5. Saia para a Floresta e colete os materiais dos monstros. Equipamentos são menos frequentes. Volte à oficina para melhorar o personagem.

## Validação e limites

QA técnico e evidências em [qa](qa/), scripts `qa-economy-rewards.mjs`, `qa-base-economy.mjs`, `qa-base-coop.mjs`, `qa-base-inputs.mjs`, `qa-campaign-equipment.mjs` e `qa-dante-journey.mjs`. Fixtures de posição/dano/campanha são explícitas; a cadência é verificada com doze mortes pelo caminho de combate existente, incluindo respawn. A regressão de coleta cooperativa prepara a décima segunda morte, sem reintroduzir o drop garantido da primeira.

**Typecheck e build passaram.** QA de economia, recursos, dupla, touch/gamepad e regressão da campanha passou, sem erros JS ou assets quebrados. Campanha solo até Warden/Vale; cooperativo pelas dez regiões e os três bosses, com fixtures documentadas. A regressão foi ajustada para concluir escolhas de domínio que pausam o anfitrião e aguardar a vida replicada antes de usar a poção.

Medições de execução estável: base ≈55 FPS; Floresta ≈58 FPS após oito segundos de aquecimento; Vale ≈58 FPS. Contagens estáveis: base 53 objetos/180 texturas/0 tweens; Floresta 376/185/24 (efeitos existentes). Medições imediatamente após reinícios ficaram menores e não representam o trecho estabilizado. Nenhum asset novo, textura, entidade, tween ou listener foi acrescentado ao mundo. Crédito usa o painel existente; receitas são montadas ao abrir/operar. Protocolo 4 permanece compatível; não exige mudar o servidor de salas.

Sem teste físico de celular ou gamepad. **Playtest humano necessário** para avaliar conforto, legibilidade e frequência das recompensas. Dano, encontros, penalidade de morte, classes e outras etapas do plano permanecem para suas entregas específicas.


## Capturas

[Saldo durante o jogo](qa/balance-1280.webp) · [Receitas e estoque](qa/forge-1280.webp) · [Oficina em tela baixa](qa/forge-844.webp). Capturas exportadas em WebP para reduzir a documentação; os assets do jogo não foram alterados.
