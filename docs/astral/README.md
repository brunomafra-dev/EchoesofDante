# Etapa 5 — Manipulador Astral

Terceira classe jogável do plano RPG. A identidade é **controlar o campo de batalha**, usando uma manopla tecnológica e ataques de médio alcance. Guerreiro e Hunter conservam seus kits. Não há combinações elementais em cadeia nesta primeira versão.

O usuário autorizou explicitamente a execução desta etapa durante sua viagem, sem esperar a validação humana da etapa 4. Isso autoriza avançar o trabalho; **não constitui aprovação visual ou de balanceamento** de nenhuma das duas etapas. Vinculador e cooperativo de quatro participantes continuam planejados.

## Teste reservado

[Abrir o Astral](https://echosofdante.vercel.app/astral-playtest.html?region=forest&kit=basic&sex=female&v=0.1.90) · [Warden](https://echosofdante.vercel.app/astral-playtest.html?region=warden&kit=basic&v=0.1.90) · [Vésper](https://echosofdante.vercel.app/astral-playtest.html?region=icenest&kit=advanced&v=0.1.90).

O painel permite mudar região, apresentação e equipamento. Personagens temporários e armazenamento isolado: o laboratório não sobrescreve sua campanha. Convites mantêm a região de teste. A classe também estará disponível na criação normal de personagens.

## Kit e valores iniciais

| Ação | Comportamento sem aprimoramentos/equipamento |
|---|---|
| Clique / RT / DISPARO | Pulso de energia, alcance 480, dano 18, intervalo 420 ms; recupera 10 de energia ao atingir um alvo |
| F / Y / botão de elemento | Energia → fogo → água → terra; bloqueado durante carga/liberação |
| Q / LT / CAMPO | Segurar → mirar → soltar; custa 30 de Energia Astral na liberação |
| Energia Astral | 100 máximo, regeneração passiva 3/s fora do carregamento; sem custo para Dash |
| Movimento / Dash | Velocidade 250, Dash 185 ms, recarga 1650 ms; mesmos comandos e colisões existentes |
| Resistência | 85% do HP de progressão, mais os bônus de equipamento |

Q reutiliza a preparação de 80–800 ms e a recarga de 3200 ms do sistema existente. O jogador não anda enquanto carrega. A distância de colocação varia de 140 a 380; raio de 52 a 76. A guia acompanha direção e carga, e as paredes limitam a colocação. Cancelar pelo menu não gasta energia.

| Elemento | Resposta do Q no nível de carga mínimo/máximo |
|---|---|
| Energia | Explosão direta, 56–86 de dano |
| Fogo | 18–34 inicial, mais 12 a cada 0,5 s numa zona de 3 s |
| Água | 30–52 inicial, zona de 2,5 s que reduz o movimento de criaturas comuns a 55% |
| Terra | 40–66 inicial e interrupção de movimento de 350 ms em criaturas comuns |

Os três bosses recebem dano, mas resistem à desaceleração e interrupção. Campos não atravessam cobertura para atingir alvos do outro lado. Bônus de dano/carga dos equipamentos continuam aplicados pelo sistema comum. Os IDs de aprimoramento existentes recebem nomes próprios: pulso, alcance, Dash, área e potência; sem nova árvore de progressão.

## Aparência e equipamentos

Corpos originais masculino/feminino, roupa simples e proteção básica/reforçada, frente/costas/lado. Braços articulados com encaixes registrados, manopla orientada para a mira e corpo vertical; sem girar o personagem de cabeça para baixo. A proteção substitui regiões da roupa na textura do ator, usando a infraestrutura modular existente.

Os três níveis de arma usam o catálogo/receitas já existentes, com nomes e miniaturas de manopla para esta classe. Materiais, fabricação, mochila e drops permanecem compatíveis; nenhum slot adicional. [Origem, prompts resumidos e preparação](illustration-prompts.md).

23 PNGs de runtime, aproximadamente 1 MB no total: seis atlas 1024×768, três manoplas 128×96, seis miniaturas 96×96 e oito efeitos de 256×256/64×32. As fontes de geração ficam somente na documentação. O Phaser carrega os assets existentes; não há geração de arte no browser.

## Solo e cooperativo

`AstralCombat` é compartilhado pela simulação solo e pelo ator autoritativo da sala. O visitante envia ações e renderiza snapshots, incluindo energia, elemento, disparos e campos; não aplica dano ou recompensa novamente. Duas pessoas, agora escolhidas entre três kits. A expansão para quatro e a restrição de uma classe de cada ficam para a etapa 7; o relay atual permite repetição, preservando o comportamento anterior.

Frontend e relay precisam de **protocolo 6**. Na consulta de 13/10/2026 anterior ao push, o serviço público Render ainda respondeu com protocolo 4. O protocolo antigo impede a validação pública, mesmo com o frontend atualizado. O laboratório solo e o relay local são independentes desse deploy. O responsável precisa publicar a versão atual de `main` no serviço `echoes-of-dante-rooms`; este ambiente não possui credenciais do painel Render.

Morte preserva progressão, itens e materiais, com a penalidade de créditos da etapa 4. Campos/disparos são limpos ao morrer ou cancelar menus. A energia é um recurso de combate, reiniciado ao recriar o ator/entrar em região; não há save permanente de energia.

## Performance e validação

Pool fixo por Astral: oito imagens de pulso e quatro de campo. As imagens são reutilizadas, sem tweens ou partículas extras por campo. O cenário baked não foi alterado. A guia de carga usa um único Graphics pequeno; a interface de energia só muda quando seu valor inteiro/estado muda.

**Automação local passou. Playtest humano necessário.**

`npm run typecheck` e `npm run build` passaram em 0.1.90. O build mantém o aviso preexistente de tamanho do bundle Phaser; nenhuma dependência nova foi instalada.

| Verificação | Evidência |
|---|---|
| Quatro elementos, recurso, cobertura e resistência dos bosses ao controle | [astral.json](qa/astral.json) |
| Teclado/mouse, gamepad simulado, touch CDP e quatro resoluções | [astral.json](qa/astral.json) |
| Criação masculina/feminina, letras A/L e persistência | [menu.json](qa/menu.json) |
| Menu de Guerreiro/Hunter preservado | [legacy-menu.json](qa/legacy-menu.json) |
| Astral anfitrião, campanha, portais iniciais e três bosses | [campaign-host](qa/campaign-host/campaign.json) |
| Astral visitante, dano nos três bosses, XP, equipamento e respawn | [campaign-guest](qa/campaign-guest/campaign.json) |
| Warden solo com HP normal, três fases e cinco padrões, sete esquivas; vitória em aproximadamente 40 s | [full-warden](qa/full-warden/qa-report.json) |
| Protocolo, reconexão, recibos e viagem | [protocol.json](qa/protocol.json), [base-protocol.json](qa/base-protocol.json) |

Campanha cooperativa testada em dois contextos Chrome independentes, com WebSockets reais locais. O QA de cobertura usa posicionamento/flags de desenvolvimento e HP reduzido para percorrer os três bosses; isso não é teste humano de dificuldade. O driver solo do Warden usa HP normal, sem invulnerabilidade ou ataques forçados durante a luta. Aproximadamente **58–60 FPS** nas medições da dupla local; respawns mantiveram objetos/texturas estáveis. Sem erros JS ou de carregamento nos relatórios.

Não houve teste físico de iPhone ou gamepad nesta etapa. Arte, caminhada, clareza dos campos e dificuldade precisam de playtest humano. Os atlas acrescentam cerca de 19 MB de dados RGBA descomprimidos antes dos caches do driver, apesar do download total de assets ser perto de 1 MB; desempenho/memória em aparelhos reais permanecem para avaliação.

Capturas: [masculino básico](qa/male-basic.webp), [feminino básico](qa/female-basic.webp), [touch](qa/guest-844.webp), [vitória solo](qa/full-warden/final.webp).

### Checklist humano quando retornar

- Criar um Astral masculino/feminino e conferir frente, costas, roupa e manopla durante movimento/Q.
- Alternar os quatro elementos e sentir diferenças contra grupos, com energia baixa e alta.
- Jogar um trecho da campanha e um boss; avaliar alcance, janelas e tempo de combate.
- Na dupla, testar Astral como dono e visitante: Dash, campos, energia, portais e respawn.
- No iPhone, conferir o botão de elemento e movimento + segurar/arrastar/soltar CAMPO.

Não avançar ao Vinculador nem a quatro jogadores sem a avaliação das etapas 4/5.
