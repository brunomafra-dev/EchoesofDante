# Revisão visual — 0.1.194

Publicação confirmada da aplicação `679a0db`: Vercel success e 102 hashes públicos iguais. Suítes públicas de aparência, input e entrada passaram sem erros registrados. `public/looks/gui-reference-loaded.jpg` foi inspecionada após `Image.decode()` da referência oficial: o sprite 2D aparece ao lado do modelo. A primeira captura de retrato foi feita antes de o background terminar de carregar; não foi tomada como evidência suficiente dessa referência. Aprovação estética humana e teste em telefone físico continuam pendentes.

Capturas inspecionadas diretamente; asserções de QA não representam aprovação humana.

- `looks/gui-portrait.jpg`: cabelo repartido/recuado e grisalho, bigode/barba cinza, camisa azul acinzentada e casaco marrom distinguem Tio Gui. Aparência permanece estilizada. O retrato 2D tem sobretudo bigode; a barba e idade mais evidente atendem ao pedido atual do usuário.
- `looks/ivo-portrait.jpg`: calvície, barba grisalha, óculos na testa e avental identificam o ferreiro. Usa a mesma identidade na oficina e no mundo.
- `looks/lia-portrait.jpg`: pele e cabelo próximos à referência vigente, cabelo curto cacheado, roupa médica clara e identificação laranja. A roupa-base ainda é estilizada e conserva sua geometria de mangas/ombros; não é uma reprodução fotográfica do jaleco pintado.
- `looks/nara-work.jpg`: coque único, lenço laranja, roupa de campo e tablet preservam os sinais da personagem e a tarefa. Figura não anda para outro ponto de missão.
- `looks/elisa-portrait.jpg`: cabelo ruivo ondulado e colete sobre camisa clara. A rotina continua ligada aos canteiros existentes.
- `looks/female-hair-8-back.jpg`: trança ligada à cabeça, visível acima da mochila. Não há física de fios; aproximações em poses extremas e entre mechas/roupas precisam do playtest humano.
- Tentativas iniciais com toucas lisas, mechas soltas no topo e linhas de rugas em alto relevo foram descartadas antes do build de QA. Roupas inicialmente rígidas foram ajustadas à superfície e passaram a compartilhar o skeleton do corpo; o rig humano original continua intacto.

QA local: oito suítes de navegador mais inspeção de assets/pesos. 24 combinações de penteado/corpo; visões frontal/traseira; corrida, salto e esquiva nas quatro classes; cinco NPCs em trabalho; referência 2D e igualdade mundo/oficina; recursos após trocas repetidas; criação/edição/fechamento de aba e save antigo com HP/poções/pesquisa preservados; teclado/mouse, toque e gamepad emulados; layouts da oficina e acesso pelo menu. A correção final das laterais do corte 4 é seguida de nova execução da suíte de aparência. Nenhum boss ou pré-requisito foi simulado nesses links de revisão.

Medição local em Chrome/Windows, Intel Celeron N5105 / UHD, 1440×900/DPR1: acampamento 37,9–38,2 FPS, 159 chamadas / 349.097 triângulos; floresta na entrada 55,0–56,0, 62 / 300.707. O benchmark usa jogador com cabelo antigo 1, cinco moradores no acampamento e oito residentes vivos na floresta. A mudança final do cabelo 4 não altera esse cenário medido. Não é comparação controlada entre sessões, promessa de 60 FPS nem teste em celular físico.

As referências completas usadas são os sprites 2D distribuídos no próprio jogo, exibidos pelo painel. Nenhuma arte 2D foi substituída. Não há avanço de território, mudança de IA/combate ou escrita em saves da campanha nesta revisão.

Build final: typecheck e Vite passaram (314 módulos); nove relatórios locais aprovados tecnicamente. A revisão final das laterais do corte 4 e o isolamento da opção Corrida ao trocar para um NPC foram seguidos de nova execução de aparência e oficina. Recursos da oficina antes/depois de oito trocas: 94 geometrias / 42 texturas → 94 / 42. A inspeção de arte conferiu 22 raízes, pesos normalizados com índices abaixo de 65, alterações faciais pequenas e hashes intactos dos humanos 0.1.193. GLB final: 1.509.188 bytes, quatro mapas compartilhados até 256 px. O build preservou 72 hashes do baseline 2D; importadores/menu recompilados são listados pelo validador, sem mudar fontes de cenas/sistemas/rede/servidor.
