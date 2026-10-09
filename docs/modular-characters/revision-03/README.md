# Revisão 03 — corpo vestido, anatomia e armas

**Versão 0.1.81 · QA técnico passou · aprovação humana pendente.**

As revisões anteriores foram rejeitadas pelo usuário. Esta entrega corrige a apresentação da etapa 1; não inicia o inventário, os novos drops ou a fabricação da etapa 2.

## Teste reservado

[Abrir Hunter equipado](https://echosofdante.vercel.app/character-playtest.html?class=hunter&sex=female&kit=basic&weapon=current) · [Biblioteca](https://echosofdante.vercel.app/test-library.html)

O painel permite trocar classe, sexo, cada peça e as três armas. Feche-o para caminhar e lutar. O laboratório não modifica personagens nem progresso reais.

Verifique principalmente:

- Frente, costas e perfil enquanto anda e mira.
- Torso equipado com as outras peças em roupa simples.
- Segurar Q, mudar a mira e soltar: o corpo deve continuar vestido.
- Tamanho dos braços, mãos nas armas e direção da saída do tiro.
- Arma inicial simples, equipamento atual e versão avançada.

## Auditoria e correções

1. **Deformação:** a montagem anterior encaixava recortes de equipamento em retângulos de proporção diferente e cortava pernas artificialmente. A nova preparação registra pinturas completas com escala uniforme em X/Y e apoio dos pés comum. Não divide a perna para animá-la.
2. **Aspecto colado:** o torso anterior era um overlay transparente sobre outra pintura. Agora cabeça, torso, pernas e botas substituem regiões da pintura em um atlas completo reutilizado por ator. O corpo sem proteção não fica renderizado sob a armadura. Um conjunto completo corresponde pixel a pixel à sua pintura intacta.
3. **Relance em Q:** as poses antigas de habilidade não correspondiam às peças. O Guerreiro permanece nos frames de postura compatíveis; braços e arma executam a preparação e golpe. O Hunter também mantém o atlas vestido durante disparo/feixe.
4. **Braços finos:** antes, a largura incluía a margem transparente do atlas. Frames nomeados recortam a área pintada; mangas, antebraços e luvas usam espessuras reais, com duas articulações e pegadas existentes.
5. **Arma invertida:** rifle inicial/avançado não é espelhado longitudinalmente ao olhar para trás. O rifle atual mantém seu frame específico de costas. Mira e origem do disparo permanecem iguais.
6. **Fragmentos do atlas:** pequenos componentes desconectados de células vizinhas eram contados no tamanho do corpo. A extração offline ignora esses fragmentos ao calcular o recorte, mantendo cabeça, pés e ombros.

## Três apresentações de arma

| Classe | Inicial | Atual | Avançada |
| --- | --- | --- | --- |
| Guerreiro | Espada de aço simples | Sabre de energia existente | Sabre tecnológico piloto |
| Hunter | Rifle utilitário simples | Rifle de pulso existente | Rifle tecnológico piloto |

No jogo principal, ausência de item usa a inicial; emissor da Floresta usa a atual; emissores de Siroco/Geada usam a avançada. Os nove itens existentes conservam posse, atributos e bônus. Não são três novas armas com estatísticas adicionais nesta entrega.

O slot persistente de armadura continua controlando o torso; demais slots completos são demonstrados no laboratório. Capacete, calça, botas e luvas persistentes aguardam a etapa 2. O visor/cabeça do Hunter mantém sua identidade atual; não foi criado um capacete fechado para essa classe.

## Assets e preparação

Pinturas originais criadas com `imagegen`, usando as próprias poses do projeto como referência. Fontes em [source-art](source-art/); prompts em [illustration-prompt.md](illustration-prompt.md). Nenhuma imagem externa ou material de outro jogo.

`python scripts/prepare-dressed-characters.py` executa recorte técnico, registro proporcional e empacotamento offline. Os assets antigos permanecem preservados para histórico, mas seus overlays de armadura deixaram a renderização ativa.

- 12 atlas de roupa/básica/reforçada: **1024×768**, frames **256×256**.
- 6 atlas de postura do Guerreiro: **1024×256**.
- 2 atlas de postura do Hunter: **1024×768**.
- Espada inicial: **256×64**; rifle inicial: **256×128**.
- 22 PNGs: aproximadamente **6,5 MB**; dimensões e bytes em [asset-measurements.json](asset-measurements.json). Aproximadamente 48 MiB RGBA para esse conjunto, além das texturas anteriores e sobrecarga do engine.

`ModularTorso` mantém a API usada pelos atores, mas seu container não possui imagens sobrepostas. A aparência é composta em `CanvasTexture` somente quando a seleção de peças muda: **3 MiB RGBA por ator**, três texturas direcionais no Guerreiro ou um atlas no Hunter. Os mesmos buffers são reutilizados e removidos no teardown. Não há pintura do corpo por frame nem crescimento de cache por combinação.

## Validação técnica

- `npm run typecheck` e `npm run build`: passaram. Aviso preexistente do tamanho do chunk Phaser permanece.
- `qa-dressed-characters.mjs`: quatro combinações de classe/sexo, igualdade entre conjunto completo e pintura original, oito direções, três armas, movimento/ataque/Dash/Q real, dimensões constantes, 30 trocas e três reinícios por combinação. Quatro resoluções: 1280×720, 1366×768, 1920×1080 e 844×390.
- `qa-dressed-views.mjs`: captura de frente/costas/perfis/diagonal, torso reforçado com roupa simples e Q. Sem invulnerabilidade artificial que faria o personagem piscar.
- Menu: criação masculina/feminina, letras A/L, seleção e reload passaram.
- Campanha cooperativa: dois contextos Chrome e WebSocket local; dez mapas, interações iniciais, três bosses, XP, equipamento, três ciclos de morte/respawn e preservação de saves passaram. Posicionamento e preparação de capítulos via DEV; não equivale a playtest humano contínuo.
- Touch via CDP e gamepad mock: movimento, ataque, Dash e hold/drag/release passaram. Nenhum teste físico de iPhone ou controle nesta revisão.
- Zero erros JavaScript/carregamento nas execuções registradas. Não houve crescimento de texturas por troca/reinício; objetos ficaram estáveis nas trocas. FPS observado no audit individual: aproximadamente **57–59**; dois contextos cooperativos: aproximadamente **57**. Medições de laboratório, não garantia para todos os dispositivos.

Evidências em [qa](qa/): relatórios, capturas, comparação de vistas e vídeo do audit.

## Limites e próxima decisão

QA técnico não determina se o personagem parece vestir a armadura de forma convincente. A revisão foi inspecionada por capturas, mas precisa do playtest humano andando, mirando e usando habilidades. Misturas de conjuntos usam regiões anatômicas registradas e ainda precisam de avaliação de costuras e transições no pescoço/cintura/tornozelo. A animação usa quatro poses pintadas por direção e braços articulados; não é uma animação esquelética completa.

Combate, controles, câmera, mapas, inimigos, progressão e atributos não foram alterados. **Aguardar a validação do usuário antes de continuar o plano.**
