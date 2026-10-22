# Piloto — Vibe Coding Toolkit

22/10/2026. O usuário solicitou avaliar o [Vibe Coding Toolkit](https://github.com/soumatheusgomes/vibe-coding-toolkit). Revisão inspecionada: `790a895304e0c08b70a5b215c9d334f1c86b816c`.

## Adoção

Teste modular do componente [RTK](https://github.com/soumatheusgomes/vibe-coding-toolkit/blob/790a895304e0c08b70a5b215c9d334f1c86b816c/docs/tools/03-rtk-token-proxy.md), que filtra saídas do terminal. O toolkit também oferece prompts, organização de contexto e outras integrações; esta entrega não representa instalação completa delas.

RTK **1.0.1 OSS**, Apache-2.0, Windows x64, disponível localmente em `.local/toolkit-evaluation/rtk/rtk.exe`. Uso explícito, sem hooks globais ou mudança de modelo, login, provedor, permissões ou dependências do jogo. Binário de 15.021.568 bytes ignorado pelo Git; métricas em `.local/toolkit-evaluation/history.db`. A telemetria da versão inspecionada requer consentimento explícito, não concedido neste piloto. Nenhum proxy de tráfego de IA foi ativado.

## Resultado observado

[Relatório reproduzível](report.json), medido sobre o commit `7d9a21b`. São bytes UTF-8 de saídas pareadas, não tokens faturados. O estado do Git muda entre execuções.

| Comando | Original | RTK | Redução |
| --- | ---: | ---: | ---: |
| Histórico de 12 commits | 2.669 B | 1.203 B | 54,9% |
| Git status | 253 B | 54 B | 78,7% |
| Typecheck válido | 63 B | 15 B | 76,2% |
| Build | 4.891 B | 4.846 B | 0,9% |
| Erro TypeScript intencional | 126 B | 157 B | −24,6% |
| **Total da amostra** | **8.002 B** | **6.275 B** | **21,6%** |

Typecheck e build do jogo passaram nas duas rotas. O aviso existente de chunk acima de 500 kB permaneceu visível. A fixture inválida retornou **exit 2** nas duas rotas, mantendo **TS2322** e o arquivo afetado. Os 12 identificadores de commits sobreviveram à compactação. `bypass git log -12` reproduziu exatamente a saída original.

## Decisão

Usar seletivamente em consultas rotineiras de Git; ler saída integral em revisões e diagnósticos. O ganho do typecheck é pequeno em bytes absolutos. O build não justifica filtro adicional neste projeto, e o diagnóstico testado ficou maior. Esta amostra não demonstra redução do consumo total da sessão nem garante economia de créditos/assinatura. O histórico já enviado à conversa não é removido por instalar RTK.

AGENTS mantém um índice curto para este acordo. Os documentos canônicos continuam nos caminhos existentes, carregados conforme a tarefa. Nenhuma migração de Phaser/Vite, configuração automática completa ou novo serviço foi introduzido.

## Reproduzir no Windows

1. Baixar `rtk-oss-x86_64-pc-windows-msvc.zip` e `checksums.txt` da [release oficial v1.0.1](https://github.com/rtk-ai/rtk/releases/tag/v1.0.1).
2. Conferir SHA-256 do ZIP: `0e53e2eca471e15fbd3636e64e6bc0b182cbc278ed0339c80450a2dd03f4cd6b`, também comparado ao manifesto publicado na instalação. Extrair somente para `.local/toolkit-evaluation/rtk/`.
3. Na raiz do Dante, executar `node scripts/qa-toolkit-output.mjs`. `DANTE_RTK` aceita outro caminho explícito do executável.
4. Conferir relatório e saídas originais/filtradas em `.local/toolkit-evaluation/results/`. A fixture inválida fica nessa pasta ignorada e não entra no jogo.

Para remover o piloto, basta retirar a seção correspondente de AGENTS e o diretório local do RTK. Não há serviço ou hook para desinstalar.

## Entrega

Versão do jogo preservada em **0.1.131**, pois a mudança é de ferramentas/documentação. Nenhum comportamento de gameplay foi alterado; não há novo laboratório jogável. A biblioteca aponta para esta avaliação. A aprovação mobile recebida nesta conversa é registrada separadamente da validação deste piloto.
