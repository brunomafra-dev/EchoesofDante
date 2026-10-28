# Figuras completas — origem e briefs

Ferramenta integrada `imagegen`, modo padrão, fundo transparente. Sem CLI/API externa. Referências de identidade: `public/assets/base/base-smith-civilian.png`, `base-medic-civilian.png`, `base-expedition-civilian.png`, `base-refugee-a.png` e `base-refugee-b.png`, inspecionadas antes das gerações. Os terrenos aprovados não foram substituídos.

Conjunto de prompts usado, resumido para reprodução: estética Organic Sci-Fi R3/referência D, pintura de RPG isométrico, vista do jogo, corpo inteiro em cada quadro, mesma pessoa/roupa/iluminação/escala nos seis quadros, folha 3×2 sem linhas/texto, fundo transparente e pés completos. Não montar membros separados. Identidade das três figuras de serviço e dos dois primeiros colonos preservada das referências. Mara/Tomás devem ser distintos dos demais.

| Destino final em `public/assets/settlement-life/` | Direção de cada sequência |
| --- | --- |
| `ivo-work-r1.webp` | Ferreiro da referência trabalhando em espada sobre bigorna/bancada de metal, martelo ergue, aproxima, toca, recua; seis figuras completas com a bancada. |
| `lia-work-r1.webp` | Médica da referência à mesa com frascos, bandeja, seringa e esterilização; inspeciona, prepara e organiza instrumentos. |
| `nara-work-r1.webp` | Nara da referência em mesa de mapas/registros, consulta tablet, aponta rota e escreve. |
| `caio-motion-r2.webp` | Senhor de cabelo escuro liso e bigode, casaco marrom/bolsa: quatro passadas legíveis e duas poses agachadas de reparo com ferramentas. Nome final no jogo: **Tio Gui**; identificador técnico estável. |
| `elisa-motion-r3.webp` | Ruiva de colete verde: quatro passadas levando o regador com ambas as mãos e duas poses completas cuidando das plantas. Revisão para continuidade das mãos e objeto. |
| `mara-motion-r1.webp` | Mulher madura asiática, cabelo curto grisalho e uniforme azul, quatro passadas e duas poses de manutenção de conexão com chave. |
| `tomas-motion-r1.webp` | Jovem negro de colete ocre/bolsa, quatro passadas e duas poses conferindo manifesto/suprimentos. |

Origens selecionadas na pasta de geração `01a173c1-3677-75b2-89b6-2f3640ffad61` em `C:/Users/1/.codex/generated_images/`:

- Ivo `exec-6717700d-cc23-458f-956f-982dd3345b19.png`.
- Lia `exec-88789c75-d72d-49ac-9b74-8203bf5d4818.png`.
- Nara `exec-43cbe4eb-6fa5-47a9-a168-bbc5e25f22ea.png`.
- Tio Gui `exec-480a4adc-38ec-49ca-81ae-135136788243.png`.
- Elisa `exec-ee56b956-5326-4618-914d-9428a68a7326.png`.
- Mara `exec-e7755076-7972-4a13-9643-53777c47275a.png`.
- Tomás `exec-27ddffa8-ddaf-44dd-91cf-47df9bc114cd.png`.

PNG selecionados copiados para `.local/settlement-life/raw/` (ignorado). `scripts/pack-settlement-life.mjs` redimensiona/empacota deterministicamente por Canvas para WebP 768×512, quadros 256×256, preservando alpha; `frames.json` registra pivôs dos pés e escala por figura. Cerca de 770 KB de imagens finais. O runtime usa os arquivos do projeto; não depende da pasta de geração. Avaliação estética final pendente do usuário.
