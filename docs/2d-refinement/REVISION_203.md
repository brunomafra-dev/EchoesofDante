# 0.1.203 — lote completo do Batedor e da Batedora

O usuário pediu concluir um personagem nas quatro profissões antes de passar ao próximo. Esta autorização substitui o gate entre pares individuais do piloto. O lote inclui Batedor/Batedora como Guerreiro Galáctico, Caçador Estelar, Manipulador Astral e Domador de Feras. **Os nove cruzamentos dos outros três visuais continuam pendentes**, com criação bloqueada quando falta arte. A seleção aprovada continua com uma prévia e Gênero → Personagem → Profissão → Nome.

## Implementação

- Doze atlas completos novos: Astral e Domador, dois gêneros, três equipamentos; oito direções, quatro fases de passo e ação. Astral com manopla; Domador com condutor simbiótico. [Autoria, fontes, reprodução e custo](../scout-professions/README.md).
- Criação, demonstração, lista salva, mundo, capacetes e aliados compartilham a família correta. Construtores não Guerreiros agora recebem `visualPreset`; emissores ópticos medidos acompanham o instrumento e a direção apresentada. Animação de ação permanece disponível mesmo durante deslocamento.
- `classId` continua definindo combate, recursos, HP, XP e profissão da equipe. Não há alteração de dano, cadência, alcance, colisão, progressão, recompensas ou vitórias. IDs e chaves de save permanecem; perfis antigos sem `visualPreset` usam seu visual original. Não restaurar editor rejeitado.
- Cache CPU das fontes e uma textura equipada por ator. O coop carrega somente o elenco real. Novos integrantes depois do preload aguardam suas fontes antes de criar a figura; falha de download informa a necessidade de recarregar sem substituir o corpo.
- Protocolo permanece **16**. Relay anuncia `scouts:1` além de `identities:1`, para proteger os clientes 0.1.202, que ainda não possuem os dois novos pares. Create/join/resume verificam compatibilidade nos dois sentidos; salas originais continuam aceitas. O catálogo compartilhado evita aceitar um par sem pinturas.

## Testar

[Criar Batedora Astral e alternar as quatro profissões](https://echosofdante.vercel.app/campaign-playtest.html?refinement=203&presets=1&preset=hunter&class=astral&sex=female&v=0.1.203).

[Guerreiro](https://echosofdante.vercel.app/character-playtest.html?refinement=203&preset=hunter&class=warrior&sex=male&kit=clothes&v=0.1.203) · [Caçador](https://echosofdante.vercel.app/character-playtest.html?refinement=203&preset=hunter&class=hunter&sex=female&kit=clothes&v=0.1.203) · [Astral](https://echosofdante.vercel.app/character-playtest.html?refinement=203&preset=hunter&class=astral&sex=female&kit=clothes&v=0.1.203) · [Domador](https://echosofdante.vercel.app/character-playtest.html?refinement=203&preset=hunter&class=xenobinder&sex=male&kit=clothes&v=0.1.203).

Registrados em `test-library.html`. Dados temporários da aba; personagens reais preservados. Criação começa na base sem boss/requisito simulado. O laboratório de movimento prepara Floresta e equipamento indicado. `targets=1` é uma opção explícita exclusiva do laboratório: três Hollows passivos de 500 HP e recurso cheio para Astral/Domador. Escolher `pet=bulwark|frostling` nesse laboratório simula a disponibilidade da fera só ali; não libera os vínculos na campanha. Nenhum desses acessos concede vitória de boss.

## Verificações e limites

- [x] Pixels dos doze atlas: [geometria](qa/203/asset-geometry/report.json).
- [x] Movimento/básico/Q nos 24 pares de profissão/gênero/equipamento, escala 128 e bake estáveis: [movimento](qa/203/motion/report.json).
- [x] WebSocket real, catálogo, clientes antigos, reconexão e `scouts:1`: [relay](qa/203/relay/report.json).
- [x] 32 seleções (14 entradas jogáveis, 18 sem poses bloqueadas), criação/reload nos dois gêneros, legados, download ausente, redução de movimento e saves canônicos: [seleção](qa/203/selection/report.json). O teste confere `HTMLOptionElement.disabled` das feras, pois a consulta genérica `isDisabled()` não refletiu essa propriedade das opções neste ambiente.
- [x] Touch/gamepad emulados nas quatro profissões e layouts 844×390, 393×852, 1024×768 e 1920×1080: [input](qa/203/input/report.json).
- [x] Duas duplas nativas, Guerreiro/Astral e Domador/Caçador, todos Batedor/Batedora; identidade própria/remota, movimento, básico/Q, elenco tardio e protocolo 16/`scouts:1`: [coop](qa/203/coop/report.json). Quatro instâncias simultâneas não têm aprovação final; [diagnóstico inicial](qa/203/squad/README.md).
- [x] Seis roupas mistas, retirar/colocar capacete, comparação e trocas de família: [equipamentos](qa/203/mixed-gear/report.json).
- [x] Broto e Filhote causam impacto nos três alvos, escudo só no Broto e nenhum dano adicional de FX: [feras](qa/203/impact-lab/report.json). Desbloqueios reais continuam exigidos na campanha; fixtures só no laboratório.
- [ ] Quatro elementos do Astral, básico/Q em ambos os gêneros e comparação com visual original.
- [x] Capturas locais de seleção, base, armaduras, marcha, emissores, equipamentos mistos, efeitos, dupla e touch inspecionadas pelo agente. Isso não é aprovação estética humana.
- [x] `npm run typecheck`, `npm run build` (330 módulos) e `git diff --check`. Permanecem avisos de chunks grandes já existentes, inclusive do experimento 3D.
- [ ] Commit/push e publicação conferida.
- [ ] Playtest humano do lote completo. Aguardar antes de outro personagem, níveis, mapas ou civilização. 3D continua pausado; computador ligado.

Chrome automatizado no Windows. Touch e gamepad emulados não são iPhone ou controle físico. QA não aprova estética, não mede duração de campanha e não promete FPS.

Render público consultado ainda informa `512a38f`, protocolo 16, sem `identities:1` e `scouts:1`: [saúde anterior](qa/203/relay-public-before.json). Coop local passou; coop público deste lote depende de atualizar esse serviço e conferir novamente.
