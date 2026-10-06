export const SPECIES = {
  crawler: { name: 'Rastejante Hollow', habitat: 'Floresta e cavernas', note: 'Persegue de perto. O brilho antes do golpe dá tempo para se afastar.',
    study: 'Afaste-se durante a preparação e volte para um golpe curto. Prepare a carga antes de deixá-lo chegar ao corpo.' },
  skitter: { name: 'Saltador', habitat: 'Profundezas e exterior', note: 'Avança rapidamente em uma direção preparada. Saia da linha da investida.',
    study: 'A investida segue a direção escolhida na preparação. Um deslocamento lateral deixa espaço para contra-atacar.' },
  spitter: { name: 'Cuspidor', habitat: 'Profundezas', note: 'Mantém distância e lança um projétil. Use movimento e obstáculos para se aproximar.',
    study: 'As rochas bloqueiam o disparo. Contorne a cobertura e aproxime-se pelo lado, preservando a esquiva para a próxima preparação.' },
  carapace: { name: 'Casco Errante', habitat: 'Vale da Ressonância', note: 'Sua carapaça resiste a vários golpes. Contorne a varredura e ataque na recuperação.',
    study: 'A varredura fica comprometida com a direção preparada. Saia do setor e aproveite a pausa para golpes curtos; prepare a carga com distância.' },
  thorn: { name: 'Espinhante', habitat: 'Desvios do Vale', note: 'Prepara um leque de três espinhos. Reposicione-se antes do disparo.',
    study: 'O leque não acompanha você após a preparação. Desloque-se de lado; as rochas interrompem os espinhos. Evite recuar pela linha central.' },
  warden: { name: 'O Warden', habitat: 'Domínio do Guardião', note: 'Observe as marcas no solo. A recuperação após cada ataque permite aproximar-se ou carregar a onda.',
    study: 'O guardião muda de padrão ao perder energia. Cada novo aviso ainda oferece reação; preserve a esquiva para sair da geometria marcada.' },
  dunePouncer: { name: 'Rasga-areia', habitat: 'Bacia do Siroco', note: 'Prepara o corpo baixo antes de saltar em linha reta. Desvie para o lado e ataque durante a recuperação.',
    study: 'A investida segue a direção anunciada. Evite recuar em linha reta; o flanco fica exposto quando ele aterrissa.' },
  glassSpitter: { name: 'Cuspidor vítreo', habitat: 'Bacia do Siroco', note: 'Carrega uma espora mineral e dispara à distância. Mude de direção após o aviso âmbar.',
    study: 'A criatura fixa a direção durante o preparo. Desloque-se lateralmente e use formações rochosas como cobertura.' },
} as const;

export type SpeciesId = keyof typeof SPECIES;
