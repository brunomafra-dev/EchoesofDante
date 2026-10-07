# Expedições em dupla · 0.1.66

Etapa 5: fundação cooperativa regional para **duas pessoas**, usando a mesma build web e os personagens Guerreiro/Star Hunter. Sem login ou conta.

## Jogar

1. Execute `npm run coop:server` e mantenha o servidor de salas ligado.
2. Abra o jogo. No MENU/Esc, escolha **COOPERATIVO · 2 PESSOAS** e **CRIAR SALA**.
3. Compartilhe o código. A outra pessoa abre a mesma URL, escolhe seu personagem, informa o mesmo servidor e usa **ENTRAR NA SALA**.
4. Ambos escolhem **VOLTAR À EXPEDIÇÃO**. O visitante entra próximo ao anfitrião.

Disponível em Floresta, Vale da Ressonância, Bacia do Siroco, Dunas Interiores e Fratura Boreal. As cavernas de campanha e os chefes continuam solo nesta etapa. Uma travessia de região encerra a sala; o anfitrião segue a campanha e o visitante retorna à própria jornada. Para a próxima expedição regional, crie outra sala.

Na rede local, os dispositivos precisam alcançar o computador que executa o jogo/servidor: por exemplo, jogo em `http://IP-DO-COMPUTADOR:5184` e salas em `ws://IP-DO-COMPUTADOR:5190`. `localhost` no celular aponta para o próprio celular.

## Estado e combate

- Anfitrião simula os dois personagens, inimigos, colisões, dano e recompensas. O servidor encaminha mensagens e concede os papéis; o visitante não executa uma segunda IA.
- Ambos podem atacar, mover, usar esquiva/carga e investigar. Inimigos perseguem o participante vivo mais próximo, conservando sua IA atual.
- A renovação de habitats considera a distância dos **dois** participantes; não reaparece uma criatura em cima do visitante. Rotas e aproximações regionais podem ser descobertas por qualquer membro da dupla.
- XP e descobertas pertencem à jornada compartilhada do anfitrião. Cada derrota/discovery concede recompensa uma vez. Nível e aperfeiçoamentos dessa jornada são aplicados ao kit de cada classe durante a expedição; o anfitrião faz as escolhas de aperfeiçoamento.
- **O save solo do visitante permanece intacto.** O XP temporário da dupla não é importado para esse save ao sair. Os registros indicam essa condição e impedem apagar a jornada durante a visita.
- Visitante morto pode reaparecer perto do anfitrião vivo. Se o anfitrião morrer, a tentativa regional reinicia pelos controles existentes de qualquer participante. Ecos, XP e descobertas já registradas permanecem.
- Menu do visitante cancela sua entrada; menu/aprimoramento do anfitrião pausa a simulação. A outra tela indica que aguarda o anfitrião.
- Desconexão do visitante libera a vaga; desconexão do anfitrião encerra a sala e restaura o save solo do visitante. Sem migração de anfitrião.

## Rede e publicação

`server/coop.mjs` é um serviço Node separado dos arquivos estáticos. Usa `ws`; o cliente usa WebSocket nativo. O host envia snapshots a 10 Hz; visitante envia ações até 25 Hz. Gestos de ação ficam enfileirados entre frames. Poses recebidas são interpoladas; membros pintados dos Hollows conservam seus frames e apoio.

Relay: duas vagas/sala, até 64 salas/128 conexões, mensagem limitada a 64 KB, 60 mensagens/s por conexão, sem compressão, fila de envio limitada e heartbeat. Perfis e vetores de entrada são validados, papéis/região conferidos. Limites evitam crescimento sem controle; **não constituem uma infraestrutura de MMO ou anticheat**. A simulação ainda confia no anfitrião.

Configuração:

| Variável | Uso |
| --- | --- |
| `COOP_PORT` | Porta do serviço; padrão 5190 |
| `COOP_ORIGINS` | Origens autorizadas, separadas por vírgula; configurar no serviço público |
| `VITE_COOP_URL` | Endereço de salas padrão na build web |

Em produção HTTPS é necessário **WSS**: publicar o serviço e encaminhar o upgrade WebSocket por um proxy TLS, por exemplo em `/coop`. Hospedar apenas `dist/` não publica esse serviço. O campo de servidor permite informar outra URL sem reconstruir o jogo. **Nenhum servidor público foi provisionado nesta etapa.** A validação foi local.

## Performance e QA

Sem novos assets, bakes ou sistema de combate. Segundo personagem e projéteis reutilizam os contratos atuais. Pools e espelhos visuais permanecem limitados aos habitantes regionais; saídas/respawns descartam os objetos associados à cena.

```text
node scripts/qa-regional-coop.mjs
node scripts/qa-coop-protocol.mjs
node scripts/qa-coop-warrior.mjs
npm run typecheck
npm run build
```

Relatórios e capturas em [qa](qa/). O QA usa dois clientes Chrome independentes e um relay WebSocket real, com posições/alvos/capítulos controlados via DEV explicitamente. Cobre dano/XP únicos, investigação, colisão, morte/respawn, restauração do save, ciclos de conexão, cinco regiões, quatro resoluções, gamepad mock e touch emulado. O teste de protocolo verifica capacidade, papéis, normalização, região, JSON inválido e encerramento.

Regressões solo do Guerreiro, Hunter e região gelada são executadas separadamente. Medições do cooperativo com dois clientes no mesmo computador devem ser comparadas com o baseline de dois clientes solo, não com a execução de um navegador só. Números finais constam dos relatórios; não representam teste em dois aparelhos físicos.

Regressão solo: jornada **58,5 FPS**, Hunter **59,5 FPS**, Fratura Boreal **59,2 FPS**; três respawns com contagem estável e nenhum erro JS/asset. Typecheck/build passaram; o aviso conhecido do chunk Phaser acima de 500 KB permanece. Auditoria npm sem vulnerabilidades.

Na primeira amostra pareada da Floresta, dois clientes solo atingiram médias **58,0/52,3 FPS**; conectados, **56,1/48,8 FPS** para anfitrião/visitante. Portanto, o visitante ficou abaixo da meta de 55–60 FPS nessas condições. A fundação precisa de medição/playtest em máquinas separadas e revisão do custo da apresentação remota antes de expandir a quantidade de jogadores. O relatório atual de `qa/report.json` registra a repetição final do cenário.

Hunter como anfitrião/Guerreiro visitante também passou: dano do sabre, carga com direção fixada no release, esquiva, registros pelo teclado, bloqueio de reset do save visitante e cancelamento da carga pelo menu do anfitrião. Capturas e resultados solo finais ficam em `journey-qa`, `hunter-qa`, `frost-qa`, `menu-qa` e `warrior-qa`.

## Limitações e playtest

Validar em dois computadores/celulares reais, com latência de rede, especialmente mira, release da carga, clareza do papel de anfitrião e retomada após menu. Não houve teste físico de iPhone/gamepad nem teste público pela internet.

Sem chefes cooperativos, continuidade de sala entre mapas, persistência do visitante, lobby público, dificuldade selecionável ou terceira classe jogável. Astral Manipulator permanece documentado como próxima classe, com Astral Gauntlet e Astral Energy; não é um reskin implementado nesta etapa.
