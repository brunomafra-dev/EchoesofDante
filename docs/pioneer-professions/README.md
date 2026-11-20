# Pioneiro/Pioneira nas quatro profissões — 0.1.204

Este lote preserva a figura original do Guerreiro e acrescenta a identidade do Pioneiro/Pioneira às profissões de Caçador, Manipulador Astral e Domador de Feras. A escolha de profissão continua controlando combate, recursos, equipamentos, companheiro e progresso. Não há editor de rosto, cabelo ou anatomia, e cada personagem permanece uma pintura completa.

## Conteúdo e autoria

Dezoito folhas de origem novas: três profissões, dois gêneros e três equipamentos (`none`, `basic`, `reinforced`). Cada folha contém 48 figuras completas em oito direções, com repouso, quatro fases distintas de caminhada e ação. Não são assets externos: a arte foi produzida com o gerador de imagem integrado usando referências do próprio Echoes. Nenhuma franquia ou pacote de terceiros foi copiado; não há nova licença externa.

As referências e seis folhas base estão em [generation.json](generation.json). Os oito outputs restantes e seu mapeamento de entrada estão em [variant-output-map.json](variant-output-map.json). As fontes RGBA ficam em `source/`; os atlas publicados e hashes estão em [measurements.json](measurements.json). Os oito outputs de armadura foram recuperados de uma geração em lote já iniciada antes desta retomada; os prompts literais dessas oito chamadas não foram arquivados. O mapa registra a correspondência que foi inspecionada e usada na importação.

## Importação e runtime

`python scripts/prepare-scout-professions.py --preset warrior` extrai cada figura inteira, remove fragmentos desconectados, alinha a sola em y=183 e aplica uma escala uniforme por direção. A caminhada já está desenhada; o script não interpola nem monta membros. O resultado é 18 atlas de 1536×1536, células de 192×192 e 64 frames endereçáveis. As oito origens visuais do instrumento são registradas por outfit e direção em `src/visual/pioneerEmitterAnchors.json`; esses pontos só alinham o desenho do disparo. Dano, alcance, física e colisão continuam usando a simulação existente.

`CompleteActorFrames.ts` escolhe a família `warrior-*` para o Pioneiro/Pioneira com Caçador, Astral ou Domador. Se um asset falhar, a seleção não troca silenciosamente para outro corpo. O preload da campanha usa somente os membros da equipe; o laboratório de criação mantém apenas a prévia necessária. Saves antigos continuam sem alteração e usam o visual da profissão original.

## Tamanho e limites

Os 18 atlas somam **31.571.784 bytes** (30,11 MiB comprimidos). Cada imagem decodificada ocupa 9.437.184 bytes RGBA; as três fontes de um personagem ocupam 27 MiB de memória de origem, antes do canvas equipado e dos custos do navegador/renderer. Isso não é uma medição do pico total de RAM. A configuração de elenco limita o preload aos corpos efetivamente usados. A checagem de performance em máquina integrada e de equipes completas depende do QA abaixo; nenhuma promessa de FPS é inferida do tamanho dos PNGs.

## Reproduzir

1. Instale Pillow, NumPy e OpenCV no ambiente de produção de arte.
2. Execute `python scripts/prepare-scout-professions.py --preset warrior`.
3. Confira as dimensões, transparência, frames, âncoras e hashes em `measurements.json`.
4. Rode `npm run typecheck`, `npm run build` e as verificações registradas em `../2d-refinement/REVISION_204.md`.

As ferramentas Python não são dependências do jogo nem do build web. Os PNGs finais já estão versionados; gerar arte de novo não ocorre durante o jogo.
