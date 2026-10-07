# Fratura Boreal

Etapa 3 da sequência autorizada. Depois de vencer o Soterrado, investigue a passagem revelada e entre no portal. O retorno leva à mesma bacia com o boss derrotado.

## Composição

Região de 3000 × 1800 unidades: chegada segura, neve sobre geologia exposta, desvio do Veio Morno, rota das Raízes Fossilizadas, registro ancestral e fratura indicando continuidade futura. Sem nova chave, equipamento ou boss. O registro responde à assinatura conhecida sem explicar sua origem.

Oito habitats: Rasga-gelo (investida anunciada) e Cuspidor Boreal (disparo comprometido). Cada espécie usa oito poses pintadas, mantendo anatomia em pé e pés ancorados. Reutilizam os contratos existentes de dano, colisão, XP e renovação. 15 XP por criatura; 20 por desvio, uma vez.

## Arte e som

Fontes originais e prompts preservados. Preparação offline em `scripts/prepare-frost-assets.py`: chão WebP 1536 × 1024, dois atlas PNG 1024 × 512, frames 256 × 256. Reutilização seletiva de rochas, raízes, minerais e rele ancestral aprovados; quatro bandas estáticas baked. Nenhuma geração de arte por frame.

Trilha original de 160 segundos, 54 BPM, sintetizada offline pelo compositor existente. MP3 de aproximadamente 2,24 MB; volume/loop/autoplay usam AudioManager.

## Estado e testes

Flags da região e XP permanecem por personagem. Respawn no início ou ponto seguro após o registro. Saves anteriores continuam compatíveis; nova sessão não ganha acesso antecipado.

`qa-frozen-reach.mjs`: portal pela ação E, dois desvios, descoberta única, fronteira, esquiva/carga, morte das duas espécies com XP, respawn, retorno, reload, quatro resoluções, estabilidade. Chrome headless: aproximadamente 59,3 FPS; zero erros de asset/JS. Preparação de capítulo/posições e mortes controladas via DEV são explícitas. Não é playtest físico.

Relatórios em `qa/` e regressão em `journey-qa/`. Typecheck/build passam; permanece o aviso conhecido de tamanho do chunk Phaser.

## Limitações

Não há boss gelado nesta etapa. A fratura termina em indicação de continuidade. IA conserva perseguição direta; não há pathfinding novo. Arte, dificuldade e clareza da rota ainda precisam de playtest humano, especialmente no celular real.
