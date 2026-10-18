# Equipe pioneira — adição ao roteiro

**Atualização 18/10/2026 · 0.1.116:** [quadro v2](source/pioneer-team-v2.png) aprovado pelo usuário, com Hunter atualizada a partir dos personagens completos. A animação está concluída e ocupa 36–40,5 s do [filme de 59,25 s](completion/README.md). A tomada anterior à correção foi preservada como substituída e não entra na edição. Os itens pendentes no relato abaixo descrevem a preparação histórica.

Solicitada pelo usuário em 17/10/2026: mostrar os heróis designados para desbravar Dante. Complementa a abertura autorizada e o [descritivo oficial das classes](../classes/README.md); não cria nomes canônicos para os personagens personalizáveis.

**Estado: quadro-base inteiro gerado, animação ainda pendente.** [Imagem original](source/pioneer-team.png), [metadados](source/pioneer-team.json) e [prompt](prompts/pioneer-team-image.txt) preservados. A geração foi interrompida antes de incorporar o arquivo; ele foi salvo na revisão 0.1.110. A [prévia de 36 segundos](https://echosofdante.vercel.app/cinematic-opening.html?v=0.1.109) não contém esta cena. Não registrar o quadro estático como filme concluído ou aprovado visualmente.

## Encaixe e duração

Inserir **4,5 segundos depois da ponte e antes da descida**. A ordem passa a ser Terra → evacuação → viagem → Dante → ponte → equipe pioneira → descida → desembarque. Duração estimada: **59,25 segundos**, mantendo os 36 segundos existentes e os 18,75 segundos finais previstos. O roteiro executável `shots.json` continua representando a montagem original até preparar as fontes da nova cena; atualizar junto com tempos das legendas e áudio, nunca silenciosamente sobre o corte publicado.

| Intervalo proposto | Conteúdo |
| --- | --- |
| 0–36 s | Cinco cenas existentes, preservadas |
| 36–40,5 s | Equipe recebe a missão e se prepara no hangar |
| 40,5–49,5 s | Descida, com legendas existentes deslocadas +4,5 s |
| 49,5–59,25 s | Desembarque e reconhecimento, com legendas deslocadas +4,5 s |

Legenda curta proposta, **Nara**, 36,5–40 s: **“Vocês reconhecem o terreno. A frota aguarda.”** Mantém a missão de preparar condições para trazer os demais humanos. Texto e ritmo ainda serão avaliados na montagem.

## Ação e identidade

Plano único no hangar da nave de expedição, com quatro pessoas inteiras em escala comparável, espaço entre silhuetas e câmera estável. As quatro classes devem ser reconhecíveis pelo equipamento e postura, não por textos sobrepostos. Não repetir os rostos ou trajes de Nara e Ivo.

- **Guerreiro:** equipamento de proteção funcional; verifica a empunhadura da arma e assume a frente. Movimento contido com peso, sem golpe de combate ou pose medieval.
- **Star Hunter:** roupa de exploração e arma de energia compacta; confere a arma, baixa o cano e olha para a saída. Sem tiro dentro da nave.
- **Manipulador Astral:** verifica a manopla tecnológica com a outra mão; pequeno indicador funcional, sem conjurar quatro elementos ou iluminar a cena inteira.
- **Domador de feras:** condutor e equipamento de campo próprios; prende uma bolsa ou ajusta o instrumento e acompanha a equipe. **Sem criatura nativa a bordo antes do primeiro reconhecimento de Dante.** A origem do vínculo permanece para desenvolvimento narrativo posterior, sem inventar uma relação já estabelecida.

Apresentações masculinas/femininas devem fazer parte da equipe; não limitar a identidade de nenhuma classe a um sexo. A composição do filme ilustra uma expedição, sem impor classe, nome ou aparência ao save de quem joga. Não adicionar aqui uma missão jogável, seleção extra ou sistema de companheiro na nave.

## Produção e critérios

1. Preparar **uma ilustração inteira do hangar e dos quatro personagens**, usando as referências visuais atuais. Não copiar sprites articulados ou recortar membros para formar atores.
2. Animar a imagem completa offline. Uma tomada de 5 segundos pode fornecer os 4,5 segundos úteis e a margem de interpolação; isso é uma previsão técnica, não garantia de disponibilidade ou qualidade.
3. Limitar a ação simultânea para evitar anatomia instável: um pequeno gesto legível por personagem, sem cruzar corpos, armas ou mãos. Nenhum disparo, explosão ou invocação.
4. Conferir continuidade de uniforme, mãos, arma, manopla, apoio dos pés e quatro identidades distintas. Se a geração não sustentar as quatro pessoas, reavaliar o enquadramento antes de gastar novas tomadas. Não aceitar um resultado quebrado só para cumprir duração.
5. Fonte e exportação seguem a produção atual: 832×480/16 FPS → 1280×720/24 FPS com ampliação/interpolação explicitadas. Rever áudio, legendas e transição; não repetir material para preencher tempo.

Ainda faltam esta cena, a descida e o desembarque. A estimativa anterior de quatro tomadas faltantes dizia respeito somente às duas cenas finais. Com a equipe, o mínimo planejado passa a **cinco novas tomadas**, sujeito a revisão visual e limites do serviço. Não prometer conclusão com uma ou duas contas adicionais. A autorização para produzir o filme continua válida; geração gratuita aguarda disponibilidade legítima, sem compra de créditos autorizada.
