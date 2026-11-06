# Revisão 0.1.199 — editor, apoios e vínculos

Feedback atual: o usuário não encontrou o editor, rejeitou a sensação flutuante da marcha e o Hollow aliado com Q idêntico. Pediu referências na Feiticeira de Perfect World e no Hunter de WoW. Forneceu o log real da Vercel: o download obrigatório da página do Hollow 3D falhava com `Official asset page unavailable`. Base desta revisão: `9c6f54a`; 3D permanece pausado. Esta correção não inicia território novo nem substitui aprovação estética por QA.

## Direção e referências verificadas

- [Hunter — Blizzard](https://worldofwarcraft.blizzard.com/en-gb/game/classes/hunter): combate coordenado entre personagem e animal, mobilidade e apoio no solo/party.
- [Notas oficiais BfA — Hunter](https://worldofwarcraft.blizzard.com/en-us/news/21959894/battle-for-azeroth-patch-notes): referência histórica explícita de comando diferente conforme a especialização da fera; não apresentada como guia do patch atual.
- [PWI — apresentação oficial da Venomancer no Steam](https://store.steampowered.com/news/posts/?appids=442110&enddate=1458941486&feed=steam_community_announcements): pets com utilidades de combate e proteção. Consultados também os guias comunitários para contexto; decisões desta entrega não dependem de números de balanceamento de terceiros.

Aplicação a Dante: escolha funcional, uma fera ativa, Q/comando e descrição próprios. Nenhum modelo, sprite ou áudio dessas franquias foi copiado. Não foram implementados catálogo extenso, alimentação, lealdade, captura livre, tanque com agro/vida próprios ou árvore de talentos da fera.

## Implementação

- Editor aberto por padrão na criação; botão destacado **PERSONALIZAR PERSONAGEM** na criação e nos personagens salvos. Alterar aparência interrompe o replay para mostrar o corpo em repouso. Continua usando três conjuntos derivados de rosto/corte, opções de cor de cabelo e tom de pele; não se trata de escultura facial ou de novos cabelos gerados. Link direto abre a criação com os controles expostos.
- Marcha: retirar as deformações intermediárias que sustentavam dois contatos abertos; quatro fases com pinturas completas de contato/passagem/contato oposto/passagem. Há três poses pintadas distintas, com a passagem reutilizada. Cadência por distância e passos ajustados à mesma sequência; marcas de passo localizadas nos pixels da sola, calculados só no bake. O corpo segue o deslocamento quando não está atacando; mira, projéteis e controles continuam independentes. Uma retenção da orientação evita alternância de direção a cada cooldown de autoataque. Não são animações novas de oito quadros pintados nem uma garantia de naturalidade: A/B e playtest humano continuam necessários.
- **Simbionte:** Q Salto Simbiótico, trajetória física bloqueada por sólidos, arco visual, dano único na aterrissagem e recuperação limitada dos aliados no pouso.
- **Broto Guardião:** miniatura das pinturas originais do Warden; Q Couraça Viva, 5 s e 35–45% de redução do dano em você/aliados próximos, sem dano nem cura. Não acumula reduções. Disponível após vitória real do Warden.
- **Filhote de Vésper:** miniatura das pinturas originais de Vésper; Q Sopro Glacial, projétil com impacto em área no primeiro alvo/obstáculo, sem cura e sem atravessar cobertura. Disponível após vitória real de Vésper. Não foi acrescentado slow ou dano elemental separado.
- O Hollow aliado foi retirado. Perfis antigos que o selecionaram voltam ao Simbionte, sem liberar uma miniatura de boss indevidamente nem alterar a jornada. Os inimigos Hollow e suas prévias continuam existentes.
- Mesmo catálogo/configuração e recursos para seleção, mundo, ator autoritativo e visitante. Protocolo 16 mantido; `presentation:1` continua, capacidade aditiva `bonds:1` identifica os novos comandos/perfis. Campos temporários de proteção são sincronizados e não persistem no save.
- Build: preparação normal não depende mais do site do autor. Usa entrada privada validada, cache privado ou módulo do jogo já publicado, fixado por SHA-256. Se tudo estiver indisponível, o fallback 3D identificado permite finalizar o build 2D. Obtenção da fonte oficial continua explícita via `--fetch`; arquivo GLB/ZIP fonte não foi colocado no Git/public. O plugin usa o mesmo diretório configurável da preparação. O 3D normal mantém o modelo revisado quando recuperado/cacheado.

## Laboratórios e precondições

- Editor: `campaign-playtest.html?refinement=199&editor=1&v=0.1.199`.
- Movimento e A/B: `character-cohesion.html?refinement=199&class=warrior&kit=clothes&v=0.1.199`; comparação antiga restrita ao laboratório.
- Comandos: mesmo laboratório de corpo, classe `xenobinder`, `pet=symbiont`, `bulwark` ou `frostling`. São fixtures explícitas de apresentação/comando, sem desbloqueio real.
- Botão de revisão dos vínculos: simulação **solo** da jornada anterior completa até Vésper derrotado, via preparação canônica existente, para revisar o menu de seleção. Não é um teste de vitória desses bosses. Oculto nos laboratórios que testam um boss vivo. O coop normal exige as vitórias da campanha; QA com flags antigas preparadas declara essa fixture expressamente.
- Sessão `199` própria; personagens, jornadas, configurações e recibos reais não são lidos nem alterados. Fechar a aba descarta só o teste. Não usar a simulação como evidência de campanha vencida.

## Verificação e entrega

- [x] `npm run build` (typecheck incluso; Vite compilou 329 módulos) e preparação limpa em quatro cenários: cache, rede bloqueada, recurso publicado e modo offline.
- [x] Dano, um acerto, paredes, cura, Couraça não cumulativa/expiração, seleção e migração do Hollow antigo sem liberar bosses.
- [x] Editor visível, testar/cancelar/salvar/reload, duas vitórias reais como gate e sessão temporária isolada.
- [x] Figuras/equipamentos: teclado e mouse, marcha sem atacar e tiro andando nas oito combinações classe/corpo, 3 bakes de entrada sem novo bake durante movimento, touch simulado nas quatro classes, gamepad emulado, 4 resoluções e cargas/trocas repetidas das prévias; capturas inspecionadas.
- [x] Host/convidado local: convite de personagens reais de teste; o anfitrião ativa a Couraça, convidado recebe a mesma espécie e proteção temporária; protocolo 16 e `bonds:1` recebidos. O projétil do Filhote de Vésper foi executado no mundo solo; coop de quatro jogadores e dispositivos físicos não foram testados.
- [x] Links de revisão, oficina de comandos e comparação adicionados ao `test-library.html` local.
- [ ] Commit/push, Vercel/Render sincronizados e publicação pública.
- [ ] Playtest humano de marcha, editor, habilidades e equilíbrio.

Os 24 atlas v4 somam **43.416.618 bytes**; os 24 atlas v3 (**39.843.074 bytes**) permanecem para a comparação do laboratório. As três pinturas fonte decodificadas ocupam aproximadamente **27–30,4 MiB RGBA**, conforme a classe; a tela do jogo exibe o atlas composto a 128 px. As duas novas miniaturas de fera usam folhas originais de Echoes, derivadas de Warden e Vésper, e somam **443.388 bytes**. Essas medidas descrevem os arquivos/bitmaps, não RAM física ou FPS.
- [ ] Avaliação humana da marcha, aparência, feras e balanceamento; aguardar antes de outra etapa.

Relatórios em `qa/199`. Não afirmar FPS, RAM física, celular ou controle físico sem medir/testar. RGBA calculado de dimensões é só uma estimativa. Capturas de assets WebP devem ser compostas respeitando o canal alpha: RGB colorido em pixels totalmente transparentes não é um retângulo renderizado no jogo.
