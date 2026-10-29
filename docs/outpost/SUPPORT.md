# Apoio de campo no Posto das Nascentes · 0.1.167

Em 29/10/2026, após publicar o Render da 0.1.166, o usuário pediu seguir ao próximo passo. O sprint escolhido dá utilidade prática ao posto já instalado: recuperação, suprimentos e acesso ao cofre. Não cria outra colônia ou relatório, nem agricultura produtiva. A continuação é autorizada; não é inferida aprovação visual expressa da versão anterior.

## Comportamento

Após **entregar o relatório do posto a Nara**, aproxime-se do depósito na Bacia e use E, toque ou A. O painel oferece cura gratuita, compra de poção por 12 créditos e o mesmo cofre pessoal de 48 espaços da base. Poções respeitam o limite de 20; mochila, IDs de itens, equipamento vestido e recibos conservam suas regras. Oficina, fabricação, venda e desmontagem continuam com Ivo na base.

O apoio exige personagem vivo, presença física no depósito, posto concluído e equipe original reunida no coop. Uma ameaça viva próxima bloqueia a recuperação; morte não é revertida. A operação revalida as condições e o painel fecha ao sair do alcance. O atlas conserva suas regras e nenhum destino novo é liberado. Valores são pessoais: no coop, o convidado compra/guarda seus próprios itens e a cura é validada pelo anfitrião pela posição real do solicitante.

Reutiliza transações e armazenamento existentes, com rollback se a escrita falhar. Não há recompensa nova, XP, missões/recibos adicionais, migração de save ou mudança no catálogo do relay. **Protocolo 16 e capacidade `outposts:1` mantidos**; o Render `a49fad7` da 0.1.166 é suficiente para o cliente novo. Ambos os integrantes precisam recarregar a aplicação atualizada.

## Laboratório isolado

[Teste direto](https://echosofdante.vercel.app/campaign-playtest.html?outpost-support=1&v=0.1.167), registrado na biblioteca. Namespace próprio `dante-outpost-support-v1.<classe>.`, separado da campanha e do laboratório de construção do posto.

Simula Warden, sete relatórios originais, cinco capítulos da permanência, Bacia conquistada e posto entregue. Saldo e recibos são preparados para o teste; não representam créditos ganhos na campanha. Chegada no depósito com vida reduzida, 60 créditos, duas poções e uma peça sobressalente para experimentar o cofre. Soterrado, Vésper e Incandescente continuam vivos; saves reais protegidos.

Na equipe, o anfitrião prepara o posto pelo botão habitual; cada integrante recebe seu kit temporário ao chegar ao depósito. O botão **REPOR KIT PESSOAL DE TESTE** repõe apenas seus recursos de teste. **SIMULAR FERIMENTOS DA EQUIPE** permite testar a cura, somente pelo anfitrião e em personagens vivos. Esses auxiliares só funcionam nesta página/flag isoladas; não existem no fluxo da campanha.

O reload solo recoloca somente o personagem temporário perto do depósito, preservando suas compras e itens. Na preparação cooperativa, o anfitrião publica as descobertas simuladas pelo snapshot normal antes de solicitar a viagem; o relay mantém sua validação habitual de destinos e equipe. Nenhuma alteração de servidor é necessária.

## QA e aprovação

- [x] Typecheck/build de 255 módulos e revisão do diff. Aviso já existente de chunks acima de 500 kB.
- [x] Solo: cura, compra, cofre compartilhado com a base, limites, rollback e reload ([relatório](qa/support-solo/report.json)). Save serializado pela aplicação pública 0.1.166 importado, com requisito de posto concluído preparado explicitamente, sem kit novo ([fixture](qa/support-legacy/fixture-0.1.166.json), [relatório](qa/support-legacy/report.json)). Não é um save humano.
- [x] Guardas: relatório pendente, distância, ameaça, morte e operações de oficina recusadas. Capacidade e falha de armazenamento verificadas com fixtures explícitas.
- [x] Dupla: operações pessoais, cura autorizada, pedido remoto fora do alcance recusado e reconexão ([relatório DEV](qa/support-coop/report.json)). Dois Chrome independentes na build compilada, com UI, movimentos, relay 16 e reload real do convidado, sem globais DEV ([relatório](qa/support-compiled/report.json)).
- [x] Touch emulado nas quatro classes e gamepad padrão simulado ([relatório](qa/support-controls/report.json)); resoluções 568×320, 844×390, 1024×768, 1366×768, 1600×900 e 1920×1080 em amostras complementares. Capturas inspecionadas: painel, scroll, depósito e NPCs visíveis. Texto do Astral conferido na build compilada: poção em X.
- [x] Aplicação `6afa0f6` em `origin/main`, Vercel [success](https://vercel.com/brunomafra-devs-projects/echosofdante/F1Pw36AAioTonQGMEFW9cCwM8wCR), [62 hashes conferidos](qa/publication/0.1.167/hashes.json). Render `a49fad7`, protocolo 16 / `outposts:1`, compatível sem novo deploy. [Solo e dupla públicos](qa/support-public/report.json) passaram com UI/movimento, cura individual, compras/cofres separados e reload/reentrada do convidado no personagem original, preservando os mesmos saldos/UIDs/recibos/XP e sentinelas de saves reais. Capturas públicas inspecionadas pelo agente; bosses posteriores vivos. Evidências e ajuste de whitespace do script registrados em commit de auditoria, sem alterar a aplicação publicada.
- [ ] Playtest humano antes de outra etapa.

QA técnico não representa aparelho físico, equipe humana de quatro, avaliação de naturalidade ou duração de campanha.
