# Percurso vulcânico — Costa ao Incandescente · 0.1.148

[Costa das Cinzas](https://echosofdante.vercel.app/campaign-playtest.html?embers=1&arrival=cinder&v=0.1.148) · [Obsidiana](https://echosofdante.vercel.app/campaign-playtest.html?embers=1&arrival=obsidian&v=0.1.148) · [Forjas](https://echosofdante.vercel.app/campaign-playtest.html?embers=1&arrival=caldera&v=0.1.148) · [Biblioteca](https://echosofdante.vercel.app/test-library.html)

Em 25/10/2026, após a entrega Boreal `db25d83`, o usuário respondeu “boa vamo pro proximo agora é oq”, autorizando continuar a entrega B no arco vulcânico. A autorização de avanço é registrada separadamente de duração medida ou aprovação visual automatizada. Não inicia o capítulo C nem cria mapas novos.

## Percurso

| Região | Descobertas e retorno |
|---|---|
| Costa das Cinzas | Margem de condensação atrás do basalto, crosta pelo desvio sul e veio térmico antes da garganta. Ivo compara água, apoio da carga e troca indireta para aquecer os abrigos. |
| Garganta de Obsidiana | Fragmentos ao pé do vidro, braço sul do canal e divisor dos pulsos. Nara distingue o transporte pelos apoios secos da circulação das estruturas antigas. |
| Forjas da Caldeira | Margem interna do pátio, contorno sul do depósito e marcas no conduto antes do limiar. Ivo prepara isolamento, coleta e retorno. Os três desvios ficam antes da arena. |

Nove coberturas baixas possuem colisão correspondente e dois lados de aproximação/retorno. O grafo de navegação verifica cada par entrada/análise/saída. Pinturas próprias 0.1.145, dimensões e Organic Sci-Fi R3 / referência D preservados. Lava permanece fora do piso caminhável; nenhum dano ambiental, lentidão ou espera novo.

Nove pares diferentes usam Rasga-brasa, Fole de Magma e Dorso de Basalto existentes. Nove habitats nativos são reposicionados sem alterar seus IDs, espécies ou renovação. Seis residentes finitos adicionais usam **1986–1991**, com IA, XP, materiais e drops atuais. Populações máximas potenciais com reservas de quatro jogadores e boss: **18 Costa / 19 Obsidiana / 18 Caldeira**, abaixo do limite 32 do relay. Nenhum aumento de HP, quota ou onda.

## Relatórios e caminho crítico

A inspeção encontrou três relatórios e nove análises existentes: `exp-cinder` com Ivo (**90**), `exp-obsidian` com Nara (**95**) e `exp-caldera` com Ivo (**100 créditos**). Mantém IDs, nomes, assuntos dos objetos, requisitos, valores e recibos. Apenas posições, orientações e observações são revistas. Não adiciona outra missão ou pagamento.

Descobrir antes do aceite continua registrando evidência sem concluir ou pagar sozinho. Saves que entregaram os relatórios não precisam refazê-los e não recebem outro pagamento. Os novos residentes cabem no intervalo finito 0–1999; schema e validação dos saves permanecem.

Análises opcionais não alteram `cinderSignalSeen`, `obsidianSignalSeen`, `calderaRelaySeen`, `titanReached`, vitória ou registro final. Inscrições da Costa, registro da garganta, registro de basalto e limiar originais continuam obrigatórios. Arena, padrões, morte/respawn e recompensa única do Incandescente preservados. O atlas não libera regiões apenas por missão ou lista de visitados.

Solo e coop compartilham terreno/física e autoridade do anfitrião; evidência compartilhada e pagamento pessoal. Protocolo **15**, sem mudança de servidor. Convites conservam `embers=1`, sem copiar a chegada simulada.

## Laboratório e composição

Chegadas diretas simulam **Warden, Soterrado, Vésper e somente os marcos anteriores à região selecionada**, com os três relatórios aceitos e ainda por investigar/entregar. **Incandescente vivo, sem recibo de vitória ou registro final. Mesmo a prévia das Forjas exige investigar o registro de basalto e atravessar o limiar.** Sem `arrival`, começa do zero na base. Seletor de prévia exige confirmação e é solo; coop humano pelo menu percorre a jornada original.

Namespace próprio em sessionStorage protege personagens/progresso reais; reload conserva o teste nesta aba. Há três caches 512×360 por região: **552.960 pixels / ~2,11 MiB RGBA** adicionais por mapa ativo. Reutiliza rocha, sedimento e vestígios raster existentes. Sem asset gerado, pacote, listener, tween ou desenho estático novo por frame; descarte pelo ciclo da cena.

## Evidências e limites

- [Modelo](qa/model/model.json) e [compatibilidade](qa/model/compatibility.json): dezenove missões/36 análises, IDs/requisitos/recibos anteriores, conteúdo dos outros arcos intacto, 92 IDs finitos únicos e nove coberturas bloqueando Dash.
- [Solo](qa/browser.json): nove análises por E, caminhos conectados, inscrições/portais originais e movimento pelo limiar até boss vivo; três entregas por diálogo pagam 285. Saves/recibos/reload e registro concluído sem IDs novos permanecem válidos.
- Mesmo ensaio: quatro resoluções e três recriações após aquecimento. Costa em 150–151 objetos / 235–236 texturas / 26 listeners shutdown / 5 resize / três coberturas. FPS local amostrado: **57,5 Costa / 59,7 Obsidiana / 59,7 Forjas**, sem garantia para outros aparelhos.
- [Coop](qa/coop/coop.json): dois Chrome independentes, relay local, nove análises e três registros originais acionados pelo convidado; física igual, Incandescente vivo, 285 por pessoa e reconexão sem duplicação.
- [Boss](qa/boss/boss.json): quatro avisos, duas mortes/respawns, aproximação pelo limiar real, vitória/registro por E e recibo único após reload. Fixtures de posição/dano aceleram o combate; não medem balanceamento humano.
- [Controles](qa/controls/controls.json): CDP multitouch nas quatro classes, movimento/mira independentes, Q/cancelamento, menus, quatro layouts e gamepad mock.
- [Acesso](qa/access/access.json): destinos posteriores continuam bloqueados no atlas/viagem apesar de uma lista de visitados contaminada; prévia da Caldeira conserva o limiar selado e boss vivo. Entrada sem `arrival` não simula vitórias.
- [Build compilado](qa/compiled/public.json): três chegadas, seletor e reload, arte correta, sem globals DEV ou alteração do save sentinela real.
- [Capturas de aproximação](qa/visibility/visibility.json): personagem perto da análise, sem ficar sobre o objeto. Combate desativado apenas na fixture para revisar cenário; não substitui as capturas com encontros do ensaio solo.

Typecheck e build passam; aviso conhecido do bundle Phaser maior que 500 kB permanece. Testes não representam celular físico, Safari/iPhone real, equipe humana de quatro ou duração humana. As capturas precisam de inspeção visual; automação não aprova a estética.

**QA técnico separado da aprovação humana. Aguardar o playtest antes de outro arco ou capítulo. Trinta minutos e oito horas continuam metas sem medição.**
