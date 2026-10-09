# Revisão atual

O piloto abaixo foi rejeitado no playtest humano por sobreposição de armaduras. A revisão 02 também foi rejeitada por deformações e encaixe. Use a [revisão 03](revision-03/README.md), com corpo vestido composto e três armas.

# Etapa 1 — Personagens modulares

**Estado: implementação técnica em avaliação; aprovação visual pendente.**

## Teste direto

- [Biblioteca de testes pública](https://echosofdante.vercel.app/test-library.html)
- [Testar personagens e equipamentos](https://echosofdante.vercel.app/character-playtest.html?class=warrior&sex=female&kit=pilot)
- Local: `http://localhost:5184/character-playtest.html` com `npm run dev -- --port 5184`.

O laboratório reutiliza o jogo e inicia uma jornada temporária na Floresta. Não registra personagens, lê jornadas reais, conecta uma sala ou grava progresso. Arma e torso piloto estão disponíveis para comparação; o botão Equipamentos também permite retirar cada peça separadamente. Alternar classe/sexo reinicia somente o teste.

## Entrega

- Masculino/feminino para Guerreiro e Hunter; mesmos atributos e kit por classe.
- Saves sem sexo preservam Guerreiro masculino e Hunter feminino. Campo aditivo no schema 1; nenhuma jornada é apagada.
- Registro das quatro classes: Guerreiro, Hunter, Astral e Vinculador. As duas últimas continuam indisponíveis.
- Um conjunto piloto de torso com frente/costas/lado e uma arma por classe. Os itens existentes dos três níveis reutilizam esse conjunto; ainda não há aparência única por tier.
- Corpo ilustrado, torso sobreposto, braços articulados e arma com pivôs existentes. Ordenação acompanha frente/costas/lado, conservando ambas as mãos.
- Itens equipados aparecem no jogo e nos atores cooperativos. A prévia de criação mostra o corpo básico; a comparação de equipamentos ocorre no laboratório e em jogo.
- Relay transmite o sexo como campo opcional. Protocolo de combate 2 preservado: extensão aditiva, defaults compatíveis. Frontend e relay devem receber este commit para exibir o sexo correto dos parceiros.

## Arte e preparação offline

Skill `imagegen`, ferramenta interna, assets originais; fontes e prompts neste diretório. Nenhum material baixado. `scripts/prepare-modular-characters.py` faz apenas recorte, escala e atlas com alpha preservado. Não gera arte em runtime.

Corpos: células 256×256; Guerreiro feminino em três atlas 1024×512, Hunter masculino em 1024×768. Torso até 224px; sabre 256×64; rifle 256×83. Medições em [asset-measurements.json](asset-measurements.json).

Um torso Image reutilizado por ator; nenhuma criação de tween, collider ou textura por troca. O preload atual carrega as duas classes e suas variantes para que parceiros possam aparecer imediatamente; aproximadamente 1,8 MB de PNG adicionais. Carregamento seletivo mais amplo fica para a expansão do catálogo.

## Validação humana necessária

1. Alterne classe, sexo e kit básico/piloto.
2. Caminhe de frente, lado e costas; confira pés e proporções.
3. Mire em todas as direções; confira encaixe do torso e ambas as mãos.
4. Ataque, use Dash e segure/solte Q.
5. Confira criação e seleção do personagem no menu principal.

Nenhum hardware físico foi validado nesta entrega. QA automatizado não aprova a qualidade da ilustração ou da animação. A próxima etapa (inventário/loot) aguarda aprovação humana.

## QA executado

- `npm run typecheck` e `npm run build`.
- `node scripts/qa-modular-characters.mjs`: quatro combinações classe/sexo, direções, mãos/mira, movimento, ataque, Dash, Q, retirar/recolocar equipamento, estabilidade de objetos, biblioteca e quatro resoluções.
- `node scripts/qa-modular-menu.mjs`: criação masculina/feminina, prévia, letras A/L, save e reload.
- `node scripts/qa-modular-campaign.mjs`: dois navegadores e relay local; Forest → Echoes → fissura → Cavern → Warden → Vale → Siroco → Dunas → Soterrado → Fratura Boreal → Galerias → Vesper. Equipamento e aparência transmitidos, recompensas, retorno, três mortes/respawns sem aumento de objetos. Boss HP reduzido e posições arranjadas via DEV para cobertura; não é playtest humano de dificuldade.
- `node scripts/qa-glacier-inputs.mjs docs/modular-characters/qa/input`: touch CDP e Gamepad API mock, movimento, mira, ataque, Dash e hold/release.
- Resultados em [qa/](qa/). Aproximadamente 54–55 FPS no teste solo e 56 FPS em dois navegadores simultâneos nesta máquina. Nenhum erro de JS/asset nos relatórios.

**Automação passou. Playtest humano necessário.**

Nota de execução: uma amostragem temporal do estado RELEASE no QA glacial falhou enquanto a compilação também consumia CPU. A repetição isolada passou por todo o teste touch/gamepad; nenhuma alteração de input ou combate foi feita para contornar o resultado. O build mantém o aviso conhecido sobre o tamanho do bundle Phaser.

## Verificação pública após push

Biblioteca e laboratório na Vercel: HTTP 200, Chrome carregou o jogo sem erros JS/assets e sem saves criados. O relay público respondeu ao teste real de criar/entrar em sala, mas ainda omitiu o campo de sexo; precisa receber a versão atual do backend. Cooperativo local passou, porém a apresentação masculino/feminino dos parceiros online ainda não está validada. Registro: [qa/public.json](qa/public.json).
