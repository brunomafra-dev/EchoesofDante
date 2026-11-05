# Roupas e ferramentas do acampamento — 0.1.195

Retorno do usuário: avental afastado do corpo, martelo no braço e peças sem acabamento na 0.1.194. Correção dos cinco moradores existentes, sem nova região, missão ou personagem. A revisão anterior não recebeu aprovação visual integral.

## Correção estrutural

- Os casacos/coletes e o peitilho do avental agora integram a superfície completa da roupa-base, com os pesos originais. A roupa antiga sob essa superfície fica oculta. Retiradas as sobreposições que produziam retalhos, recortes e partes afastadas do corpo. O avental conserva uma aba curta abaixo do cinto, com transição para os pesos da cintura.
- Pele dos ombros que atravessava as mangas foi removida apenas nas cópias dos NPCs. Cabeças, cabelos, barbas, corpos dos heróis e arquivos humanos originais permanecem intactos. Mantidas as identidades da 0.1.194, incluindo Tio Gui mais velho e grisalho.
- Cinco ferramentas foram refeitas no Blender com origem no cabo: martelos de Ivo/Gui, injetor de Lia, tablet de Nara e regador de Elisa. Mãos usam a pose de empunhadura e o centro real da palma. A tarefa orienta o punho, preservando a ferramenta dentro dos dedos. A inclinação do tronco permite alcançar a bancada sem alongar os braços. Ivo bate na lâmina sobre a bigorna; o retorno ao repouso conserva a empunhadura.
- Texturas UV pequenas de tecido tramado, couro, madeira e aço escovado, com cores e rugosidade por superfície. Normais compatíveis da roupa original foram reaproveitadas. Sem luz por objeto, bloom obrigatório, física de tecido ou criação de textura por frame.
- Mundo e oficina usam os mesmos recursos/configuração. A oficina ganhou o enquadramento **Roupa e ferramenta**. Amostragem determinística de fases é restrita a `?inspect=1`, para capturas e medições; não interfere no jogo normal.

## Produção, licença e custo

`scripts/asset-tools/author-arrival195.py` produz os complementos e ferramentas no Blender 4.5.15 em CPU. Fonte editável regenerável em `.local/crew195/Dante-fitted-crew.blend`. `prepare-arrival195.mjs` conserva a malha/pesos da roupa original e separa os materiais civis; `verify-arrival195.mjs` confere correspondência dos vértices, pesos, UVs, marcadores e hashes.

Uniformes derivados dos Quaternius Universal Base Characters CC0 já incorporados no projeto. Ferramentas, aba complementar e mapas de superfície novos são autoria Echoes of Dante. Crédito/licença preservados em `public/assets/arrival-3d/CREDITS.md` e `public/assets/frontier-3d/Quaternius-UBC-CC0.txt`. Nenhuma nova fonte externa, compra, áudio ou ferramenta paga.

Especificações reais em `public/assets/arrival-3d/crew-work-195.json`: 1.181.068 bytes, onze raízes, cinco texturas até 256 px, 32 materiais no pacote completo; 2.252 triângulos nos óculos ajustados à cabeça, 432 por martelo, 576 no injetor, 684 no tablet, 252 no regador. Uniformes completos substituem a roupa visível anterior: Ivo 6.380, Lia/Nara/Elisa 5.441 cada, Gui 5.500 triângulos. Não são adições sobre a roupa antiga renderizada. Nenhum novo skeleton; cada NPC usa seu rig/mixer independente, geometria/texturas compartilhadas e materiais por instância descartados com ela. Contagem de triângulos isolada não garante desempenho.

## Revisão

- [Ivo: roupa e martelo](https://echosofdante.vercel.app/arrival-workshop.html?v=0.1.195&subject=ivo&view=task).
- [Lia](https://echosofdante.vercel.app/arrival-workshop.html?v=0.1.195&subject=lia&view=task), [Nara](https://echosofdante.vercel.app/arrival-workshop.html?v=0.1.195&subject=nara&view=task), [Tio Gui](https://echosofdante.vercel.app/arrival-workshop.html?v=0.1.195&subject=gui&view=task), [Elisa](https://echosofdante.vercel.app/arrival-workshop.html?v=0.1.195&subject=elisa&view=task).
- [Acampamento e floresta](https://echosofdante.vercel.app/arrival-3d.html?v=0.1.195).

Use **Ver ação**, gire para os lados e compare repouso/trabalho. A oficina não lê saves; o mundo mantém os namespaces existentes. Nenhum requisito ou boss é simulado nesses links. QA técnico registrado em `qa/0.1.195/`; aprovação visual humana permanece pendente. Roupa é estilizada e segue o rig, sem simulação de colisão de tecido. Não prometer ausência de qualquer aproximação em todas as poses nem validação em telefone físico.

QA local concluído: typecheck/build e nove relatórios passaram; 50 fases, ciclo real e retorno ao repouso, cinco postos/ambos os canteiros, empunhadura, 24 combinações de cabelo/corpo, criação/edição/reload/save antigo, input e biblioteca/oficina. Capturas inspecionadas, inclusive lateral do coque após reforçar a base dos penteados presos. Medidas e limites em [OBSERVATIONS.md](qa/0.1.195/OBSERVATIONS.md). Publicação será conferida antes de declarar disponível; aguardar playtest humano desta correção.
