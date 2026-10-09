# Fontes e prompts — revisão 03

Ferramenta: `imagegen`, geração/edição original durante desenvolvimento. Assets produzidos offline, sem serviço externo em runtime. Referências são as próprias pinturas do Guerreiro/Hunter do projeto, em `source-art/*-reference.png`; roupa simples reaproveita as fontes da revisão 02.

## Carapaças reforçadas — quatro variantes

Editar a grade de quatro colunas e três linhas, preservando as 12 células, poses, escala, frente/costas/perfil e apoio dos pés. Mesmo adulto masculino/feminino da referência, sem braços abaixo dos ombros ou armas. Criar um corpo inteiramente vestido com proteção reforçada Organic Sci-Fi: peitoral ajustado ao torso, colar e ombros integrados, proteção de coxas/canelas e botas. Guerreiro: marfim/carvão/laranja industrial, capacete funcional. Hunter: proteção ágil, placas marfim/carvão, cabeça/visor reconhecível, canelas e ombreiras integradas. Não criar robô, membros finos, capa ou acessórios desconectados. Pintura estilizada, materialidade, volume e iluminação coerentes. Fundo transparente.

Saídas: `warrior-{male,female}-reinforced.png` e `hunter-{male,female}-reinforced.png`. Todas foram inspecionadas antes do registro técnico.

## Armas iniciais

Imagem original de dois itens em duas linhas, vista lateral horizontal. Linha superior: rifle de expedição utilitário simples, coronha à esquerda, boca à direita, empunhadura aproximadamente a 30% e apoio a 60% do comprimento; aço escuro gasto, sem adereços, clarões ou texto. Linha inferior: espada simples de aço para duas mãos, lâmina à direita e cabo nos primeiros 30%; sem energia, ornamentação ou sombra de chão. Ambos compatíveis com tecnologia humana Organic Sci-Fi, pintura estilizada e volume. Fundo transparente.

Saída: `starter-weapons.png`. Recorte e registro das duas armas em `scripts/prepare-dressed-characters.py`. Armas atuais e tecnológicas reutilizam assets originais já existentes.
