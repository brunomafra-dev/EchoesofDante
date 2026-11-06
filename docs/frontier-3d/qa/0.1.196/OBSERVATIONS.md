# QA técnico · 0.1.196

Quinze relatórios locais passaram. `npm run typecheck`, `npm run build` (319 módulos), `git diff --check` e verificação de build/assets executados. O aviso conhecido de tamanho dos chunks permanece, incluindo o módulo incorporado da aranha licenciada; não há GLB/ZIP restrito exposto separadamente.

## Jornada e combate

`campaign/report.json` começa com criação real no navegador isolado, sem conceder descobertas, relatórios, mortes ou gates. Aceita/entrega os relatórios de Nara/Lia/Ivo, percorre a floresta e os três desvios subterrâneos, ativa os requisitos na ordem original e chega ao Warden vivo. O snapshot anterior ao boss é reutilizado nos testes das quatro classes, com classe/gênero/vida/reserva de poções explicitamente configurados apenas como fixture de combate; nenhuma vitória é simulada. `return/report.json` retoma o save que efetivamente venceu, retorna pelos acessos originais e confere os recibos únicos de Nara (+60) e Ivo (+60), cura e compra na enfermaria.

`boss/report.json` registra vitórias pelas quatro classes e três fases, com os cinco ataques exercitados no conjunto dos confrontos; reload conserva a vitória. `guard/report.json` confirma que ficar parado segurando ataque perde o combate, deixa o Warden vivo e não concede recibo. O respawn nativo retoma o marco seguro e restaura o boss ainda não vencido.

Problema real encontrado/corrigido: a investida podia sobrepor o círculo do herói e impedir a saída. O contato agora é resolvido contra o piso caminhável, permitindo afastamento e mantendo posição visual/física juntas. Outro problema corrigido: um limite fixo de representações podia omitir residentes em um agrupamento cheio; o pool agora cresce sob demanda e só anima os residentes próximos. `residents/report.json` exercita mais de oito representações e verifica que todo inimigo vivo dentro do alcance observado tem seu modelo. Esqueletos/mixers continuam independentes; geometria/texturas compartilhadas.

## UX e revisão visual

Sete resoluções entre 568×320 e 1440×900, incluindo 844×390 e 393×852; seleção/remoção do tracker, caminho para o objetivo remoto, diário com gamepad e preservação dos namespaces. Retângulos dos controles de combate têm pelo menos 44 px. Sobreposição entre tracker e botão do diário foi corrigida e reconferida.

Oito capturas de aproximação foram feitas **antes** do diálogo, para inspecionar herói, piso, objetos, colisões e o contexto de E sem a janela encobrir a cena. Raízes subterrâneas são petrificadas, não vegetação verde reutilizada. Água, fibras minerais, conduto reparado e vestígios ancestrais têm representações diferentes. Piso e formações compartilham o material de pedra adaptado, sem troca dos terrenos da floresta/acampamento.

Oficina: modelo do Warden visível, nove ossos, cinco movimentos de ataque e derrota mantida na pose final; trocas repetidas mantêm contagens estáveis de geometria/texturas. Regressão das roupas/ferramentas verifica cinquenta amostras de pose, encaixe, antebraço e contato do martelo. Criação/identidade, quatro classes touch, gamepad e acesso pelo menu passaram. Capturas inspecionadas pelo agente; **não representam aprovação estética do usuário**.

Tentativas de desenvolvimento preservadas em `observations/`: um teste iniciado no DEV foi invalidado pelo hot reload; o movimento quantizado do roteiro e uma fixture aplicada antes do `pagehide` também precisaram de correção no harness. O percurso final usa entradas de controle e diagnósticos somente de leitura; não há setters de progresso/posição/dano na aplicação. Testes de aparência/estresse identificam separadamente seus pontos de entrada simulados.

## Desempenho observado

Intel Celeron N5105, Intel UHD (0x4E61), Windows/Chrome com ANGLE Direct3D11. 1440×900, DPR 1, Guerreiro, oito segundos de aquecimento e três amostras de dois segundos por cena, sequenciais e sem build/Blender/outro QA em paralelo:

| Cena | FPS observado | Chamadas | Triângulos renderizados | Condição |
|---|---:|---:|---:|---|
| Base | 39,2 | 223 | 318.549 | Cinco NPCs; nenhum residente da floresta animado ocultamente |
| Floresta | 54,5–55,0 | 71 | 314.605 | Dezesseis residentes vivos no mapa, sete representações visíveis na entrada |
| Primeira caverna | 59,5–60,0 | 43 | 78.092 | Laboratório de acesso; 27 residentes vivos, quatro representações próximas |
| Domínio do Warden | 59,5–60,0 | 51 | 66.184 | Laboratório, boss vivo/dormente; não é benchmark de combate |

Contagens de render incluem os passes usados pelo renderer; não equivalem apenas à geometria de cada arquivo. O Warden tem 6.004 triângulos, nove ossos, cinco materiais e três mapas de 128 px; GLB de 1.020.752 bytes. Pedra adaptada: 512 px/91.652 bytes. Dados/hashes nos manifestos distribuídos.

Não há promessa de FPS em celular ou notebook de terceiros. Não foi feito teste em iPhone físico nem coop 3D. Combate foi validado funcionalmente pelos controles, mas a tabela acima é de cenas ociosas.

## Preservação e publicação

Fontes de gameplay/configuração/rede/relay 2D permanecem intactas; somente o link do menu aponta para a versão nova. Sessenta e quatro arquivos do baseline mantêm o mesmo hash; 22 chunks importadores foram reparticionados pelo Vite ao compartilhar as configurações/motor de missões, com suas fontes canônicas conferidas sem mudanças. Manifesto de publicação contém 110 arquivos. Modelos humanos, armas, mochila, efeitos e uniformes anteriores mantêm os hashes verificados.

QA técnico local e público concluído: aplicação `30bb7c3`, Vercel success, 110 hashes correspondentes e seis relatórios públicos passaram. Missão inicial sem fixture, Warden pelas quatro classes, oficina, layouts, touch e menu conferidos no site. Evidências em `publication.json`, `publication-hashes.json` e `public/`. Aprovação humana da etapa 0.1.196 permanece pendente; não iniciar o próximo território antes do playtest.
