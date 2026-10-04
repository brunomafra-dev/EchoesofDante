export const SPECIES = {
  crawler: { name: 'Rastejante Hollow', habitat: 'Floresta e cavernas', note: 'Persegue de perto. O brilho antes do golpe dá tempo para se afastar.' },
  skitter: { name: 'Saltador', habitat: 'Profundezas e exterior', note: 'Avança rapidamente em uma direção preparada. Saia da linha da investida.' },
  spitter: { name: 'Cuspidor', habitat: 'Profundezas', note: 'Mantém distância e lança um projétil. Use movimento e obstáculos para se aproximar.' },
  carapace: { name: 'Casco Errante', habitat: 'Vale da Ressonância', note: 'Sua carapaça resiste a vários golpes. Contorne a varredura e ataque na recuperação.' },
  thorn: { name: 'Espinhante', habitat: 'Desvios do Vale', note: 'Prepara um leque de três espinhos. Reposicione-se antes do disparo.' },
  warden: { name: 'O Warden', habitat: 'Domínio do Guardião', note: 'Observe as marcas no solo. A recuperação após cada ataque permite aproximar-se ou carregar a onda.' },
} as const;

export type SpeciesId = keyof typeof SPECIES;
