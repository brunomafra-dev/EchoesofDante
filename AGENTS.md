# Instruções para atualizações

## Biblioteca de testes

Ao final de cada sprint, entregue um link direto para testar especificamente a mudança e registre-o em `test-library.html`. O teste deve preservar personagens e progresso reais. Aguarde a validação do usuário antes de iniciar a etapa seguinte. Informe separadamente QA técnico e aprovação humana.

## Fundação do RPG

Para trabalhos da evolução RPG, leia `docs/RPG_FOUNDATION_ROADMAP.md` antes de implementar. Esse é o plano aprovado: siga a ordem das etapas, preserve suas decisões e atualize o checklist com evidências e limitações a cada entrega. Não declare uma etapa visual aprovada somente com QA automatizado. Correções de regressão e manutenção continuam permitidas fora dessa sequência.

Este projeto deve manter a versão mais recente em https://github.com/brunomafra-dev/EchoesofDante.

Depois de concluir qualquer atualização solicitada pelo usuário:

1. Execute as verificações aplicáveis.
2. Revise os arquivos alterados e não inclua `node_modules/` nem `dist/`.
3. Crie um commit descritivo e envie para `origin/main`.
4. Confira se o commit local corresponde ao remoto antes de informar que a atualização foi publicada.

Não use `push --force`. Se autenticação ou rede impedirem o envio, explique o bloqueio e mantenha o commit local.
