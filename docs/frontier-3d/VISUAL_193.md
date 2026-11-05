# Visibilidade, plasma, elementos e identidade — 0.1.193

O playtest da 0.1.192 rejeitou o encurtamento da câmera junto às árvores, o plasma arredondado, a estrutura de Energia/Fogo e parte da aparência humana. Esta revisão responde a esse retorno. QA técnico não constitui aprovação estética; aguardar novo playtest antes de abrir o próximo sprint de território.

## Implementação

- Câmera conserva a posição/distância dos controles. Somente materiais de árvores — troncos e copas já agrupados — recortam um corredor entre câmera e herói. Borda com dithering; sem transparência ordenada, alterações nas colisões ou desaparecimento de rochas/edifícios. Sombras das árvores preservadas. Nenhuma malha estática é reconstruída por frame.
- Caçador: plasma de núcleo axial branco, trilhos separados e rastro muito curto; sem cápsula/gota ou partículas grandes de água. Emissor, velocidade, cadência, alcance e dano existentes preservados; Q mantém o feixe.
- Energia Q: seis variantes de raios bifurcados, com pulsos locais breves alternados. Não há clarão global, luz dinâmica ou dano secundário. Fogo Q: nove instâncias de um conjunto de cinco línguas de chama volumétricas, com deformação, variação quente/fria e brasas. Água/Terra continuam distintas.
- Humanos: escultura conservadora de mandíbula/perfil e sobrancelhas no Blender, mantendo os olhos alinhados; normais transformadas pelo Jacobiano da escultura. Sem remodelar mãos, esqueleto, equipamento ou corpos por membros. Cabeças continuam estilizadas, não são uma substituição realista completa. Oficina oferece Figura atual/anterior e enquadramento Rosto com iluminação equivalente.
- Primeira ponte de identidade: selecionar um personagem existente no navegador conserva nome, classe e gênero; cabelos/cores e exploração do ensaio ficam no namespace 3D. Leitura das identidades e do requisito das Cavernas sem construir o serviço que inicializa saves legados, e sem escrever nos saves da campanha.
- Ensaio 3D persiste após fechar a aba, com arquivos próprios por identidade e opção independente. Sessões antigas são aceitas. A identidade original não é editada pela aparência do laboratório.

## Recursos e custo

Blender 4.5.15 LTS, geometria e exportação em CPU; nenhum render offline, conta, compra ou serviço pago. Modelos de efeitos originais em `combat-fx-193.glb`: 141.616 bytes, 16 raízes, zero texturas. Plasma 172 triângulos; cada variante de raio 160; conjunto de cinco chamas 630 (nove instâncias = 5.670 triângulos, uma chamada de desenho). Outras raízes reaproveitam o desenho 0.1.192. Contagens não garantem desempenho.

Figuras derivadas Quaternius: masculino 1.724.720 bytes / 14.079 triângulos, feminino 1.736.808 bytes / 13.880 triângulos, contando todas as alternativas de cabelo presentes, inclusive ocultas. Cada skin conserva 65 joints e os 12 clipes anteriores. Dados exatos em `public/assets/arrival-3d/crew-193.json`; texturas anteriores não foram aumentadas. Downloads das figuras são armazenados em cache por gênero/revisão; comparação carrega o antigo apenas quando solicitado. Geometria de chamas compartilhada, mixers/skeletons independentes.

Fontes reprodutíveis: `author-arrival193.py`, `prepare-arrival193-fx.mjs`, `author-arrival193-crew.py`, `prepare-arrival193-crew.mjs`, em `scripts/asset-tools/`. Arquivos Blender editáveis ficam em `.local/combat193/` e `.local/crew193/`, regeneráveis pelos scripts. Nenhum ZIP ou fonte licenciado desnecessário foi publicado.

## Fontes externas verificadas

Reutilizada a base [Quaternius Universal Base Characters](https://quaternius.com/packs/universalbasecharacters.html), CC0 conforme licença dos arquivos já incorporados. Sobrancelhas/mandíbula modificadas, rig/clipes/texturas preservados. Roupas/animações/arte do mundo conservam os créditos anteriores. Nenhuma extração de Perfect World, MU, Diablo ou Path of Exile.

Foi pesquisado também [MPFB/MakeHuman](https://github.com/makehumancommunity/mpfb2/blob/master/LICENSE.md): código GPLv3 e assets centrais CC0 são licenciados separadamente. **Não incorporado** nesta revisão: mudança de topologia, retargeting, roupas e todos os encaixes exigiriam avaliação própria; não é uma troca automática compatível com o rig existente. Falhas de acesso direto a páginas da documentação foram registradas; não se afirma teste de execução do MPFB.

## Próximos territórios: sequência da mesma campanha

O pedido atual autoriza preparar a convergência 2D/3D e substitui as antigas limitações históricas sobre discutir expansão. A entrega atual inicia identidade e persistência, **não declara paridade de sistemas ou novos mapas 3D jogáveis**.

1. Cavernas: usar `CAVERN_ENTRY`, `CAVERN_DEPTH_OPENING`, contorno/desvios de `earlyJourney.ts` e requisitos originais dos três ecos → fonte → mecanismo. Migrar a entrada e os primeiros encontros sem abrir a passagem profunda automaticamente.
2. Profundezas → Fragmento → Primeiro Eco → aproximação do Warden. Reutilizar IDs e flags canônicos, moradores finitos, drops e recibos por integrante; Warden vivo até combate real.
3. Integrar inventário, missões, recompensas únicas, exploração e checkpoints ao mesmo `JourneySnapshot`, com migração transacional validada antes de habilitar escrita. A ponte atual somente lê identidade e requisito; não sobrescreve um save completo com o modelo parcial `Trial`.
4. Coop da mesma campanha: servidor autoritativo e catálogo vigente, não sessões 3D paralelas com progresso incompatível. Ainda não implementado; não requer deploy do Render nesta revisão.
5. Depois dos gates originais: Vale → Siroco → Dunas → Soterrado; então Boreal e vulcânico. Pinturas/aprovações 2D orientam a adaptação sem trocar a direção Organic Sci-Fi R3 / D.

## Revisão direta

- [Mundo/câmera e personagem](https://echosofdante.vercel.app/arrival-3d.html?v=0.1.193).
- [Plasma básico](https://echosofdante.vercel.app/arrival-workshop.html?v=0.1.193&subject=hunter&view=combat).
- [Energia Q](https://echosofdante.vercel.app/arrival-workshop.html?v=0.1.193&subject=astral&view=combat&effect=power&element=0).
- [Fogo Q](https://echosofdante.vercel.app/arrival-workshop.html?v=0.1.193&subject=astral&view=combat&effect=power&element=1).
- [Rosto feminino e comparação](https://echosofdante.vercel.app/arrival-workshop.html?v=0.1.193&subject=astral&gender=female&view=portrait).

Nenhum pré-requisito é simulado nesses acessos. A oficina não carrega saves. A seleção de identidade no jogo é opcional e somente lê a campanha. Relatórios em `qa/0.1.193/`; publicação só será confirmada após hash público e QA.
