# Folhas de movimento — origens e briefs

Modo: `imagegen` integrado, edição das folhas anteriores já inspecionadas. Fundo transparente. Referências: `public/assets/settlement-life/{caio-motion-r2,elisa-motion-r3,mara-motion-r1,tomas-motion-r1}.webp`. Sem CLI externa ou geração de arte por frame.

Brief comum resumido: mesma pessoa, rosto/roupa/escala/câmera Organic Sci-Fi R3, folha quadrada 4×4 com dezesseis figuras completas, células iguais e apoio dos pés constante, sem cenário, texto ou membros separados. Oito etapas cronológicas de caminhada relaxada com transferência de peso/passagens, quadro neutro e três etapas intermediárias até a tarefa, seguidas de quatro pequenos gestos de trabalho. Ritmo/pivôs e deslocamento são controlados pelo jogo. A aparência não é uma aprovação humana da animação.

| Morador | Direção específica | WebP final em `public/assets/settlement-life/` | PNG selecionado |
| --- | --- | --- | --- |
| Tio Gui | Cabelo liso escuro/grisalho, bigode, casaco marrom, bolsa de ferramentas. Abaixa a bolsa e confere ferramentas agachado. | `caio-motion-r3.webp` | `exec-b4c91588-91c1-4955-ad9c-ed61c1c49aff.png` |
| Elisa | Ruiva, colete verde e regador seguro durante a caminhada. Abaixa e cuida das mudas sem trocar o objeto abruptamente de mão. | `elisa-motion-r4.webp` | `exec-744611b7-3185-4a38-8118-6e6c0d99a838.png` |
| Mara | Cabelo curto grisalho, uniforme azul, chave e conector. Prepara e realiza manutenção agachada. | `mara-motion-r2.webp` | `exec-fd0f157a-2ffb-4c7c-aa84-c0586367a88c.png` |
| Tomás | Jovem negro, colete ocre e bolsa. Para, abre a bolsa e confere manifesto em pé. | `tomas-motion-r2.webp` | `exec-3a9c086d-f4ab-4e8a-b32f-40dc1dd98e8c.png` |

Origens em `C:/Users/1/.codex/generated_images/01a173c1-3677-75b2-89b6-2f3640ffad61/`, cada PNG 1254×1254 RGBA. `scripts/pack-settlement-motion.mjs` empacota cada célula para 256×256 em folhas 1024×1024 WebP. O runtime depende somente dos caminhos finais no projeto e de `frames-r2.json`. As folhas anteriores permanecem no projeto; as pinturas das três bancadas foram mantidas e seus pivôs registrados novamente nos metadados.
