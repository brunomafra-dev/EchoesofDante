# Braços do Astral e Vinculador — revisão 02 · 0.1.98

A captura do usuário rejeitou os braços da 0.1.97. As posições matemáticas se encontravam, mas a pintura apresentava punhos/cortes artificiais, mãos comprimidas e cotovelos muito abertos. A validação anterior não verificava esses defeitos.

## Teste reservado

[Astral](https://echosofdante.vercel.app/astral-playtest.html?motion=1&kit=initial&v=0.1.98) · [Vinculador](https://echosofdante.vercel.app/xenobinder-playtest.html?motion=1&kit=initial&v=0.1.98).

Mesma correção no jogo principal, menu e dupla. O painel abre recolhido; clique no resumo para trocar apresentação, roupa e região. Saves reais preservados.

## Correções

- Seis atlases repintados: manga curta, antebraço contínuo e mão relaxada na roupa inicial; proteções próprias por classe.
- Articulações medidas nas seções opacas do PNG, incluindo a inclinação real do eixo ombro/cotovelo/punho.
- Escala uniforme: nenhuma compressão independente da largura/altura.
- Mão proporcional, registrada pelo punho, com polegar orientado para o corpo.
- Braço livre próximo ao corpo; antebraço de lançamento e manopla no mesmo eixo.
- Elevação interpolada ao girar a mira, sem salto de limiar.
- Manga sob o torso, evitando duplicar a ombreira já pintada.
- Origem do condutor do Vinculador movida da manga para o punho.
- Mesmas proporções e pontos no mostruário.

Corpos, passadas, cabeças, kit, dano, recursos, controles, IA, mapas, câmera e protocolo preservados. Instrumentos conservam a pintura; corrigimos seu encaixe. O offset do projétil continua exclusivamente visual.

## Comparação e arte

[Antes/depois](comparison.jpg) · [Frente/costas/perfil e Q](qa/).

[Movimento do Astral](visual/astral-motion.webm) · [Movimento do Vinculador](visual/xenobinder-motion.webm).

Arte original com imagegen integrado; [prompts](illustration-prompts.md), fontes em `source-art/`, preparação offline com `scripts/prepare-caster-motion.py`. Seis atlases **384×256**, seis frames por textura. Corpos mantêm 1280×768. Nenhum objeto, tween ou processo de geração acrescentado em runtime.

## QA técnico

- Typecheck/build passam; permanece o aviso conhecido do bundle Phaser.
- [QA da pintura](qa/report.json): 2.304 poses e quatro conjuntos mistos; pixels opacos nas articulações (alpha mínimo 251), escala uniforme, eixos alinhados, comprimentos constantes e torso preservado.
- Giro contínuo com ombro fixo: máximo de 1.67 unidades do punho por grau, sem salto de limiar.
- WASD, recuo, parada, Space, básico e Q segurar/mirar/soltar; jogador imóvel durante Q.
- [Gravações e menu](visual/report.json): ambas as apresentações das duas classes.
- [Dupla real por WebSocket local](coop/report.json): anfitrião/visitante nos dois sentidos, recurso/cura/cancelamento, equipamentos, touch CDP, gamepad mock e três ciclos de morte/respawn.
- Resoluções: 1280×720, 1366×768, 1920×1080 e 844×390.
- Sem erros JS/assets nos testes concluídos; saves reais intactos.

Uma execução cooperativa foi descartada após um reload do laboratório durante o teste. A repetição com arquivos estáveis passou; seu relatório substitui a execução interrompida.

## Performance e limites

[Benchmark](performance/report.json): aproximadamente **59–60 FPS** após aquecimento, comparando Guerreiro/Astral/Vinculador na Floresta. Objetos/tweens estáveis. Nos três respawns cooperativos: 397 objetos, 244 texturas, 25 tweens e um companheiro em todos os ciclos.

Sprites articulados com três vistas; não é um esqueleto 3D. Sem teste físico em celular/gamepad. Dupla validada no relay local protocolo 9; a pendência anterior do Render não é resolvida por esta alteração visual.

**Automação passou; aprovação visual humana ainda pendente.** Compare a postura frontal da captura original, lados/costas, ataque/Q e equipamentos antes da etapa 7.
