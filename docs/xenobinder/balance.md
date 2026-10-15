# Domador de feras — valores iniciais, etapa 6

Registro antes da implementação do kit. Reutilizar dano, equipamento, movimento, Health, Enemy e Q existentes; os valores abaixo pertencem somente à nova classe.

- Movimento 250; vida base 90% do Guerreiro; Dash 175 ms, recarga 1750 ms.
- Básico: pulso do condutor, 16 de dano, intervalo 460 ms, alcance 420, velocidade 720. Acerto marca a assistência por 2,2 s e concede 8 de Vínculo.
- Companheiro: raio 14, tamanho visual 94; segue a 70 unidades, velocidade 230; assistência a alvos marcados próximos, mordida 20, intervalo 850 ms, alcance de contato 45; acerto concede 10 de Vínculo. Sem dano passivo ilimitado, tanque, barra de HP ou captura de criaturas.
- Vínculo máximo 100; inicial 35; sem recuperação passiva fora do combate. Estado de combate reinicia na criação da cena, como os recursos atuais. Q custa 35 somente no release; cancelamento preserva recurso.
- Q usa o mesmo hold/mira/release, com recarga própria de 6000 ms; investida 540 de velocidade, alcance 150–380 conforme carga, largura 24; dano 60–100, bônus atuais de equipamento/aperfeiçoamento.
- Impacto produz um pulso único de 8–14% da vida máxima para cada aliado vivo a até 112 unidades, com linha desobstruída. Vida limitada ao máximo, sem reviver, sem cura contínua e sem cura global. Fora de alcance não recebe cura.
- Solo usa o mesmo kit e pode receber o pulso. Na dupla, o anfitrião calcula dano/recurso/cura; o visitante apresenta snapshots, sem executar outra simulação.
- Seguir → assistir → executar comando → retornar. Desvio local de obstáculos; recuperação de distância somente fora do combate. Companheiro recolhe ao morrer o dono e reaparece uma vez no respawn.

Valores são base técnica inicial, sujeitos ao playtest de dificuldade. Não alterar as três classes existentes ou aumentar a sala para quatro nesta etapa.
