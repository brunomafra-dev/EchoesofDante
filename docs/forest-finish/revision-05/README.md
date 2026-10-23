# Movimento ambiental natural · 0.1.138

[Testar caminhando](https://echosofdante.vercel.app/forest-finish.html?v=0.1.138) · [Biblioteca](https://echosofdante.vercel.app/test-library.html)

Correção solicitada pelo usuário: a interação desejada é vento nas folhas e resposta à proximidade/contato dos pés. Os pontos acionados com E da revisão 04 não correspondem ao pedido e foram removidos, incluindo avisos, ondas comandadas, pulso ancestral e som dedicado. Missões/interações reais da campanha continuam usando seus controles existentes.

## Resultado para avaliar

- Vento lento e de pequena amplitude nas copas e plantas baixas. Sombras acompanham suavemente as copas.
- Plantas cedem ao contato do jogador ou de criaturas, considerando posição dos pés e movimento. Rotação acontece em torno da raiz, que permanece fixa. Uma resposta com mola amortecida acomoda as folhas depois da passagem, em vez de repetir uma vibração artificial.
- Pequenas folhas levantam somente ao roçar a vegetação. Caminhar no corredor limpo não produz folhas em cada passo. Seis imagens reutilizadas e duração de 800 ms; nenhum objeto novo a cada contato.
- Água conserva movimento ambiente discreto, com a margem imóvel. Estrutura ancestral permanece parte do cenário, sem novo gatilho automático ou botão.
- Nomes/HP sempre visíveis, cruz na vida e atalhos por ícones da 0.1.137 preservados.

Nenhuma arte nova: reutilizados chão, copas, atlas de plantas e Hollow aprovados. Seis plantas baixas, seis folhas e uma superfície de água; removidos seis objetos dos efeitos acionados. Memória de posições anteriores limitada aos atores vivos do frame. Cálculo da resposta usa tempo limitado por frame para evitar saltos após pausa. Preferência de movimento reduzido congela vento/água e desativa folhas no ar.

## Verificação

`scripts/qa-forest-natural.mjs` testa ausência de interação nos antigos pontos, vento, raízes fixas, contato do jogador/criaturas, acomodação, caminhada real e folhas limitadas à vegetação, reconstrução e movimento reduzido. O posicionamento e a passagem de tempo controlada estão explicitados no relatório. O antigo comando `qa-forest-life.mjs` encaminha para este QA; evidências da revisão anterior permanecem arquivadas.

`npm run typecheck`, `npm run build` e `git diff --check` passaram. Permanece apenas o aviso conhecido do tamanho do chunk Phaser.

- [Ambiente](qa/natural.json): ausência dos gatilhos antigos, vento, contato/acomodação, criaturas, caminhada real, folhas, chão integral, três reconstruções e movimento reduzido passaram sem erro JS. **69 objetos, 222 texturas, 25 listeners de shutdown e quatro de resize** permaneceram estáveis. Amostra aquecida: **57,9 FPS** em Chrome desktop neste ambiente.
- [Touch/gamepad/WebKit](qa/inputs.json): entradas existentes verificadas com emulação/mock; não foi necessário adicionar botão de ambiente.
- [Build compilada](qa/compiled/report.json): navegação real sem globals DEV, exploração/Q, ícones, layouts 1366×768 e 844×390 e saves protegidos. Capturas locais também registram 1280×720 e 1920×1080.

[Checagem do endereço público](qa/public/report.json) passou na Vercel com a revisão 05: carregamento, exploração/Q, ícones, layouts e isolamento de saves; sem erro JS/HTTP. Os resultados não garantem a mesma taxa de quadros em todo aparelho.

## Limites e aprovação

Ambiente ainda reservado a esta referência solo, com saves reais isolados. A vegetação pintada no chão permanece estática; copas separadas e seis plantas respondem. Sem deformar toda a imagem, novo sistema de física ou mudança de colisões. A intensidade do vento e a integração das plantas precisam de avaliação humana caminhando. QA técnico não representa aprovação visual ou teste em aparelho físico.

## Publicação · 23/10/2026

Implementação `3d80f2e`, **0.1.138**, enviada a origin/main; Vercel confirmou deploy concluído e o teste público passou. Sem alteração do protocolo 15/servidor de salas. **Aguardar playtest humano antes da próxima etapa.**
