# Observações da revisão 0.1.198

Defeitos reais encontrados durante o trabalho, corrigidos antes da entrega:

1. **Máscara de cabelo invadia o rosto e gerava uma tampa cinza.** Rejeitada visualmente (`observations/rejected-head-mask.jpg`); preparação CPU passou a usar máscaras semânticas e referências de luminosidade por face. Cabeças ajustadas ao pescoço real de cada classe/corpo, em vez do corte genérico y55.
2. **Laboratório de corpo podia inicializar um registro legado real inválido.** Capturado em `legacy-registration-write-detected.json`; todas as chaves do jogo agora são redirecionadas para sessão isolada antes de inicializar os perfis. Sentinelas verificadas novamente nos oito casos de movimento.
3. **Mundo carregava atrás do menu de revisão e atualizava o timestamp da jornada.** `menu-world-autoload.json`; laboratório passou a usar o boot de menu existente, liberando o mundo só na entrada. Cancelar/salvar aparência agora preserva o texto integral da jornada nesse teste.
4. **Bota traseira do Caçador cortada pelo optical flow.** `intermediate-feet-clipping.json`; deformação vertical termina suavemente no plano dos pés, sem recortar a sola. Os 2.112 quadros finais foram rechecados.
5. **A mistura de calça/botas Astral feminina deixava um vão entre tronco e pernas.** `mixed-outfit-alpha-gap.json`; substituir material passou a preservar a silhueta de uma pintura completa (`source-atop`), sem apagar a figura. Os mesmos 2.112 quadros passaram em conectividade e igualdade local/remoto.
6. **Callback de imagem depois de destruir preview.** Vida do cache vinculada ao Phaser.Game, não à cena antiga; bitmaps decodificados tarde são fechados e não tocam o loader destruído. Doze trocas com atraso de rede e três entradas/saídas passaram sem erro.
7. **Troca de classe no laboratório de boss saía da revisão e reutilizava a sessão da outra classe.** Links agora preservam `refinement=198` e versão, e o namespace inclui a classe. Quatro chegadas compiladas verificam personagem/arena corretos, HP real positivo do boss e ausência de vitória.

Ajustes dos testes, sem mudanças de comportamento do jogo:

- `option.isDisabled()` não verifica a opção individual como esperado; passou a ler a propriedade real `option.disabled`.
- Reload no laboratório de menu retorna corretamente ao menu; o teste agora continua pelas ações nativas.
- Gamepad oculta botões touch por decisão existente; teste desconecta o mock e usa toque real antes de avaliar Q touch.
- Na viewport em pé, o teste aguardava/clicava Play antes do modal de orientação carregar; agora aguarda o menu e toca `CONTINUAR NO NAVEGADOR`.
- O processo preview antigo mantinha o relay carregado antes da edição (`stale-preview-relay.json`). Reiniciado o processo de teste pertencente a esta sessão; sem mudança de protocolo.
- O teste de convite consultava um botão removido pelo rerender automático do lobby; passou a aguardar atomicamente o campo de convite. O fluxo nativo completo depois passou, incluindo saída e continuação da equipe original.
- Verificação de publicação normaliza CRLF, linhas HTML vazias e somente a quebra de linha entre tags: o serializer Windows/Linux juntava `</nav>` e `</body>`. Conteúdo, scripts, atributos e tags continuam integralmente no hash. Assets binários usam hash exato.

Capturas de prévias, editor estreito/horizontal, campos, mundo e contato de roupas foram inspecionadas pelo agente. A aprovação visual e a sensação de movimento continuam pendentes do usuário.
