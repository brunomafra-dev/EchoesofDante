# Identidade dos assets da chegada · 04/11/2026

## Resultado do playtest da 0.1.185

O usuário confirmou a publicação e jogou o ensaio. Elogiou árvores, personagens, pedras e terreno. Apontou armas sem acabamento, poderes e criaturas sem identidade suficiente, NPCs parecidos com personagens jogáveis e nave/materiais com aparência de caixas. Isso é aceitação visual parcial; não é aprovação estética integral, do editor completo, do balanceamento ou do desempenho em iPhone.

Esta avaliação permanece no **acampamento + floresta**, em [arrival-3d.html?v=0.1.185](https://echosofdante.vercel.app/arrival-3d.html?v=0.1.185), já registrado na biblioteca. A pesquisa abaixo não altera essa aplicação. Siroco, migração da campanha e coop 3D não começaram.

## Diagnóstico no código e nas capturas

- `Avatar.ts/equip`: lâmina e arma de disparo são compostas principalmente por caixas; foco e bastão usam cilindros, toro e icosaedro. Há distinção funcional, mas faltam perfil, encaixes, empunhadura e superfícies que expliquem fabricação e uso.
- `Avatar.ts/create` e `World.ts/NPCS`: os moradores reutilizam os mesmos corpos/roupas, mudando cabelo, cor e animação de trabalho. O rig completo pode ser mantido; roupas, ferramentas e postura devem comunicar cada profissão sem depender do rótulo.
- `Creatures.ts`: placas, corpo e pernas procedurais dão uma primeira silhueta, mas o acabamento ainda não convence o usuário como espécie de Dante. A fera aliada também precisa de identidade própria.
- `World.ts` e `Art.ts`: nave e abrigos usam volumes simples e material compartilhado. Ruído superficial não substitui desenho de casco, junções, espessura, suportes e função dos componentes.
- `Combat.ts`: as áreas de carga e o resultado funcional já existem. A revisão precisa sincronizar preparação, disparo, impacto e dissipação com a animação, preservando a leitura de alcance e perigo. Um círculo luminoso genérico não resolve todas as classes.

As capturas públicas confirmam a diferença entre a natureza texturizada e esses equipamentos simples. Inspeção pelo agente e elogios do usuário são evidências distintas.

## Ferramentas pesquisadas e decisão recomendada

| Ferramenta / fonte primária | Aplicação proposta |
|---|---|
| [Blender: modelagem e UV](https://www.blender.org/features/modeling/), [formatos GLB/glTF documentados no pipeline Godot/Blender](https://docs.godotengine.org/en/stable/tutorials/assets_pipeline/importing_3d_scenes/available_formats.html) | Prioridade para modelar e preparar equipamentos, criaturas e estruturas: silhueta, bordas, UV e texturas. Exportar malhas, materiais e animações em GLB para o carregador já usado neste ensaio. A produção deve ser offline e reproduzível; Blender não precisa rodar no navegador. |
| [Godot: formatos 3D](https://docs.godotengine.org/en/stable/tutorials/assets_pipeline/importing_3d_scenes/available_formats.html) | É outro motor/editor. Seu importador recomenda glTF e também converte `.blend` chamando Blender. Minha avaliação é que uma troca de motor agora não resolve o acabamento dos assets; manter o ensaio em Three enquanto avaliamos arte. Nenhum projeto Godot ou migração foi criado. |
| [PixelFX da patch-gg](https://github.com/patch-gg/pixelfx), [galeria](https://patch-gg.github.io/pixelfx/) | Biblioteca de efeitos em pixel art, com código e exportação de spritesheets PNG/JSON. Útil para estudar ritmo, camadas e reação ao impacto; não fornece os modelos 3D de armas, nave ou fauna. Avaliar um efeito adaptado ao material/paleta de Dante antes de incorporar um pacote. Esta é a correspondência encontrada para o nome citado; nenhum download/importação foi feito. |
| [PixelFX LICENSE](https://github.com/patch-gg/pixelfx/blob/main/LICENSE) e [NOTICE](https://github.com/patch-gg/pixelfx/blob/main/NOTICE.md) | Código e efeitos sob MIT, com avisos de Patch, Hugo Duprez e partes adaptadas de Hollow Crown. Preservar avisos nos derivados efetivamente usados. A fonte `gallery/fonts` está fora dessa licença e não faz parte da seleção. Nenhuma skill/plugin desse repositório foi instalada ou executada. |

Consulta local não encontrou `blender` no PATH nem instalação em `C:\Program Files\Blender Foundation`; isso não exclui instalação em outro caminho. Não houve instalação, compra ou contratação de renderização remota. A ferramenta de produção não garante resultado artístico: comparar o asset exportado dentro da câmera/luz do jogo é parte obrigatória da seleção.

## Sequência proposta para o acabamento

Proposta de produção para revisão do mesmo trecho, ainda sem implementação:

1. **Armas e poderes das quatro classes:** lâmina com fio, guarda e empunhadura legíveis; arma estelar com receptor/cano/coronha reconhecíveis; foco astral como instrumento de canalização; ferramenta do Domador com emissor e pega próprios. Cada uma deve ser distinguível pela silhueta, antes da cor. Vincular gesto, origem do efeito e impacto ao equipamento correto; separar os quatro elementos astrais também por forma/movimento.
2. **Hollow e fera aliada:** anatomia e locomoção coerentes, carapaça/tecido com transições e apoio real dos membros, identidade diferente entre inimigo e companheiro. Começar por uma espécie bem acabada e validar em movimento antes de ampliar a fauna.
3. **NPCs e estações:** preservar corpos/rostos aprovados, diferenciar roupa de trabalho, acessórios e ferramentas. Lia manipula material clínico numa estação própria; Ivo trabalha numa peça realmente apoiada; Nara usa instrumentos/mapas de expedição; Tio Gui permanece no reparo; Elisa cuida dos canteiros existentes. Missão/entrega mantêm pontos fixos. Ciclos leves com pausas, mãos e ferramentas acompanhando a tarefa.
4. **Nave e infraestrutura:** conservar implantação, escala, rampas, acessos e colisões; refinar casco, cockpit, motores, apoios e juntas com materiais de metal/pintura/vidro distinguíveis. Abrigos devem mostrar montagem, função e contato com o solo. Desgaste localizado e coerente, sem cobrir tudo com ruído ou acrescentar caixas para representar qualquer função.

## Critérios de avaliação da revisão

- [ ] Comparações antes/depois sob a mesma câmera e iluminação, de perto e na distância normal de jogo; vistas e movimento dos assets, não apenas render de produção.
- [ ] Armas reconhecíveis em mãos nos dois gêneros e sem interpenetração; efeitos acompanham a mão/cano e não escondem os avisos do combate.
- [ ] Criatura reconhecível em repouso, aproximação, ataque e morte; sem efeito de brinquedo formado por peças desconexas.
- [ ] Cada NPC comunica sua função sem ler o nome, com ação conectada ao objeto correto e sem andar para locais vazios.
- [ ] Nave/estações com silhueta, espessura e materiais convincentes; sombras/apoios integram os objetos ao terreno. Solidez visual e física concordam. Opacidade preservada.
- [ ] Medir custo dos novos modelos/texturas, carregamento, triângulos, draw calls e desempenho nas mesmas cenas; comparar com as amostras da 0.1.185. Não aumentar detalhe indiscriminadamente nem prometer 60 FPS/iPhone sem medição física.
- [ ] Preservar árvores, personagens humanos, pedras e terreno elogiados, salvo ajustes pontuais necessários ao encaixe; preservar controles, editor, requisitos, progresso temporário e isolamento dos saves reais.
- [ ] Typecheck/build e regressão aplicável; laboratório direto registrado e QA técnico separado da aprovação visual humana antes de Siroco.

Não há novo asset, mudança de motor, revisão visual concluída ou nova versão de jogo nesta pesquisa. [Publicação técnica da 0.1.185](qa/0.1.185/publication.json).
