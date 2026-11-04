# Empunhadura e manopla Astral · 0.1.189 local

O playtest da 0.1.188 rejeitou o encaixe das armas: o osso do punho estava próximo do modelo, mas os dedos não envolviam os cabos. O usuário também pediu uma manopla para o Astral, substituindo o foco segurado na mão. Somente essa correção foi autorizada antes do próximo ponto. A restrição anterior de **não fazer push/deploy** continua vigente.

## Alterações

- `HandGrip.ts` mede o encaixe pela articulação dos dedos dos dois rigs existentes. Após o mixer, aplica uma pegada com falanges curvadas e polegar em oposição. As poses são calculadas uma vez por Avatar e reutilizadas; não há solução iterativa por frame. Arquivos humanos, esqueleto e animações de origem permanecem intactos.
- Guerreiro: cabo mais estreito e deslocado do punho para o centro da pegada; a lâmina e seu rastro continuam ligados aos mesmos pontos reais.
- Caçador: preserva o rifle. Direita segura o cabo com indicador menos curvado; esquerda apoia a peça sob o cano. Guarda-mato e gatilho revisados para acomodar os dedos. Braços e orientação das mãos recebem correção visual com transição amortecida em repouso/disparo; corrida, salto e esquiva continuam usando os clips existentes.
- Domador: mantém o ressonador de vínculo e sua função. Cabo ajustado à palma, com dedos e polegar ao redor, preservando os emissores e a companheira.
- Astral: manopla aberta nos dedos, com placa dorsal, emissor de palma e braçadeira no antebraço. A placa acompanha `hand_l`, usado pelo clip Cast; a braçadeira acompanha `lowerarm_l`, evitando um tubo rígido atravessando o pulso quando ele dobra. Ajuste longitudinal para o rig feminino. Mão relaxada no repouso, sem a pinça do foco removido; transição amortecida para o gesto de conjuração existente. Materiais energéticos das duas peças acompanham os quatro elementos. Não existe mais um foco de mão no conjunto atual.
- Editor, mundo e oficina compartilham `Avatar`; nenhum equipamento foi duplicado por página. Ferramentas e tarefas de NPCs continuam fora da pose de pegada do jogador.
- Oficina: comparação com os modelos/encaixes da 0.1.188 e vistas próximas dos dois lados. A câmera acompanha a mão durante a animação, mantendo rotação e zoom. Parâmetros `subject=astral&view=grip` abrem diretamente a inspeção solicitada.

## Recursos e reprodução

Geometria original Echoes of Dante, sem novos downloads, compras, áudio ou licença externa. Fonte editável: `scripts/asset-tools/author-arrival189.py`, que reutiliza os helpers estabelecidos. Exportação Blender 4.5.15 LTS em background, sem render offline; intermediários em `.local/grips189/`, ignorados. Preparação: `node scripts/asset-tools/prepare-arrival189-gauntlet.mjs`.

`gauntlet-189.glb` contém o rifle revisado e as duas peças da manopla, total **200.352 bytes**, sem texturas novas ou ossos próprios:

| Recurso | Triângulos | Materiais / chamadas por instância |
|---|---:|---:|
| Rifle | 3.264 | 3 |
| Placa e emissor da mão | 1.224 | 3 |
| Braçadeira | 2.184 | 3 |

Sabre e ressonador reutilizam a geometria da 0.1.188 (2.640 e 2.664 triângulos, três materiais cada), com encaixe/espessura corrigidos. O arquivo anterior continua compartilhado para os dois e para a comparação da oficina. Somente materiais energéticos por Avatar são clonados e descartados com ele; geometrias são compartilhadas. Sem luz dinâmica, pós-processamento, colisão ou evento de dano adicional. O manifesto `gauntlet-189.json` registra hash, contagens e âncoras reais.

## Testar

- [Manopla e empunhaduras no compilado local](http://127.0.0.1:5193/arrival-workshop.html?v=0.1.189&subject=astral&view=grip).
- [Trecho jogável local](http://127.0.0.1:5193/arrival-3d.html?v=0.1.189).
- [Biblioteca local](http://127.0.0.1:5193/test-library.html).

Oficina não lê/escreve saves. Mundo usa a sessão temporária já existente, sem simular pré-requisitos ou derrotar bosses. Progresso e personagens da campanha original permanecem preservados. A chegada 3D continua solo; não se declara coop 3D implementado.

## Validação

QA técnico concluído no compilado local: `npm run typecheck`, `npm run build` (308 módulos), `node scripts/qa-arrival189.mjs` e `python scripts/verify-arrival3d-build.py --version 0.1.189`. Sete relatórios passaram: [pegadas/A-B](qa/0.1.189/grips/report.json), [classes/editor/combate](qa/0.1.189/classes/report.json), [touch/gamepad/recuperação](qa/0.1.189/input/report.json), [quatro elementos](qa/0.1.189/elements/report.json), [oficina/NPCs](qa/0.1.189/workshop/report.json), [percurso/reload](qa/0.1.189/route/report.json) e [desempenho](qa/0.1.189/performance/report.json). [Preservação/build](qa/0.1.189/build-verification.json): 86 assets da campanha idênticos, configurações canônicas/humanos verificados, fonte de campanha e relay preservados. Avisos de tamanho dos chunks legados e do módulo Hollow continuam no build; não são erros de compilação nem foram tratados como mudança de escopo.

[Observações visuais e limitações](qa/0.1.189/OBSERVATIONS.md). O teste de pegada verifica pontas dos dedos ao redor do centro do cabo, além do encaixe, e mede o contato da palma esquerda com a âncora de apoio do rifle. Proximidade entre arma e osso do punho, isoladamente, não comprova uma empunhadura correta.

Medição pontual com Guerreiro parado, Chrome/ANGLE D3D11, Celeron N5105 + Intel UHD, 1440×900/DPR 1: base com cinco NPCs **40,5–41,2 FPS** (149 chamadas, 308.851 triângulos); floresta com oito aranhas vivas **56,5–57,5 FPS** (62 chamadas, 297.859 triângulos). Aquecimento de oito segundos, três amostras de dois segundos por cena; nenhuma compilação, Blender ou segundo QA em paralelo. Não mede combate contínuo nem todas as classes, não é teste em telefone físico e não garante desempenho em outra máquina.

**Aprovação estética humana pendente.** Não iniciar o próximo ponto antes do playtest desta correção. Nenhuma promessa de desempenho ou validação em iPhone físico.
