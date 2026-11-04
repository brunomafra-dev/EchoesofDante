# Observações e limites · 0.1.187

Dois GLB de arte Flare, licenças por arquivo preservadas, fontes/revisão/SHA256 em provenance.json e no downloader. Não foi importado código do motor Flare, nem arquivos de WoW/PoE/Diablo.

Os dez relatórios atuais são do compilado. O teste inicial da oficina em DEV foi substituído pelo relatório compilado. A tentativa do circuito que apontava à rampa antiga está preservada em observations/ramp-coordinate; corrigido o roteiro, sem ajustar portais, colisões ou requisitos do jogo para passar.

Oficina usa seletores nativos e inspeciona limites/ossos reais do skin. Não simula campanha, pré-requisitos, recompensas ou boss. Percurso normal não injeta posição/progresso; navegação por pulsos DOM com keyup cronometrado no navegador, E/H/Q/R/F e ponteiro nativos. Input separado usa CDP touch real emulado e gamepad padrão mock. Desempenho/elementos/casos de recuperação declaram fixtures nos relatórios. Nenhum teste usa os personagens reais do usuário.

O benchmark não mede combate contínuo nem telefone físico. Capturas inspecionadas pelo agente; aprovação estética humana e iPhone físico pendentes. Cena permanece solo, sem migração da campanha/relay/coop 3D ou início de Siroco.

base: 40.2–40.7 FPS, 153 chamadas; forest: 57.5–58.0 FPS, 65 chamadas
