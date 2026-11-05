# Experiência 3D pelo menu · 0.1.191

Autorização explícita de 05/11/2026: publicar as revisões locais e oferecer um botão “Experiência 3D” dentro do Echoes. Substitui a restrição anterior de push/deploy; não é aprovação estética ou autorização para ampliar regiões/coop.

O menu inicial abre o editor e o mesmo acampamento/floresta solo em navegação normal, na mesma aba. Editor e pausa 3D oferecem “Voltar ao Echoes”. Não exige iniciar/criar campanha 2D, nem carrega o mundo Phaser antes de entrar na experiência. Sessão 3D mantém chave própria; personagens/saves reais não são importados, alterados ou apagados. Sem pré-requisitos ou boss vencido simulado.

Inclui as revisões locais já testadas: aranha Hollow/armas 0.1.188, empunhaduras/manopla 0.1.189 e mochila/alças 0.1.190. Arte/câmera/balanceamento preservados nesta publicação; quatro classes e dois corpos existentes.

## Build limpo e licença

O build da Vercel não tem o diretório ignorado `.local`. `ensure-arrival-hollow.mjs` obtém o pacote gratuito pelo botão oficial Easyforge, com a mesma requisição pública da página, sem conta/pagamento ou contorno de bloqueios. Confere SHA256 do ZIP e GLB já inspecionados, extrai somente quatro entradas conhecidas para `.local`, instala as ferramentas de preparação com lockfile se necessário e usa a conversão 0.1.188 existente. Licença continua sendo Giant Monster Spiders Asset Licence 1.0, não CC0. Somente o payload incorporado ao módulo compilado do jogo é publicado; ZIP/GLB fonte e derivado não entram em Git nem `public`.

Em Vercel, ausência do modelo exige preparação bem-sucedida; alteração no pacote, bloqueio ou erro interrompe o build, preservando o deploy anterior. Não publicar silenciosamente um visual diferente. Build local sem modelo continua usando o fallback identificado, como antes. `--fetch` prepara a fonte oficial localmente; `DANTE_ARRIVAL_ART_DIR` permite testar em diretório ignorado independente.

## Verificação

- [x] Download/conversão em diretório vazio e correspondência ao modelo previamente validado: [hash e resultado](qa/0.1.191/clean-art-build.json), 4.346.140 bytes idênticos à preparação anterior.
- [x] Menu por mouse, teclado, touch e gamepad emulado; retorno; saves preservados: [relatório de acesso](qa/0.1.191/entry/report.json). Cinco percursos, mesma aba; retorno pelo editor e, com mouse, pela pausa no mundo. Em retrato usa a ação existente “Continuar no navegador”.
- [x] Input/mundo e oficina no compilado: [touch das quatro classes, gamepad, derrota/poção/reload](qa/0.1.191/input/report.json), [oficina/NPCs/modelos](qa/0.1.191/workshop/report.json). Capturas representativas inspecionadas pelo agente; não representam aprovação humana.
- [x] Typecheck/build 308 módulos; 83 dos 86 hashes da campanha preservados: [verificação](qa/0.1.191/build-verification.json). Três bundles que importam o menu foram recompilados pelo botão novo; somente `ApplicationShell.ts` mudou na UI da campanha, sem alterações de cenas, sistemas ou relay. Nenhum original/GLB Easyforge em Git ou como arquivo público separado.
- [ ] Sincronização Git, Vercel e QA público.

Evidências: `qa/0.1.191/`. Aprovação visual humana e iPhone físico permanecem pendentes. Nenhum benchmark adicional ou garantia de FPS nesta mudança de acesso/publicação.

Links de revisão: [menu](https://echosofdante.vercel.app/?v=0.1.191), [experiência 3D](https://echosofdante.vercel.app/arrival-3d.html?v=0.1.191), [oficina](https://echosofdante.vercel.app/arrival-workshop.html?v=0.1.191&subject=warrior&view=backpack). A disponibilidade só será confirmada após conferir o deploy e seus arquivos.
