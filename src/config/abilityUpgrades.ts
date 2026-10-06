export const ABILITY_UPGRADE_MILESTONES = [4, 6, 8, 10] as const;

export const ABILITY_UPGRADES = {
  saberArc: {
    id: 'saberArc', ability: 'SABRE', title: 'Arco de ressonância', maxRank: 2,
    description: 'Cada grau amplia o arco do Energy Saber em 0,06 rad.',
  },
  saberReach: {
    id: 'saberReach', ability: 'SABRE', title: 'Lâmina alongada', maxRank: 2,
    description: 'Cada grau acrescenta 10 unidades ao alcance do corte.',
  },
  dashCooldown: {
    id: 'dashCooldown', ability: 'DASH', title: 'Recarga de fase', maxRank: 2,
    description: 'Cada grau reduz a recarga do Void Dash em 120 ms.',
  },
  dashDuration: {
    id: 'dashDuration', ability: 'DASH', title: 'Passo prolongado', maxRank: 2,
    description: 'Cada grau prolonga a travessia do Void Dash em 20 ms.',
  },
  chargeWidth: {
    id: 'chargeWidth', ability: 'CARGA CINÉTICA', title: 'Onda ampla', maxRank: 2,
    description: 'Cada grau alarga a faixa de impacto em 12 unidades.',
  },
  chargePower: {
    id: 'chargePower', ability: 'CARGA CINÉTICA', title: 'Núcleo denso', maxRank: 2,
    description: 'Cada grau acrescenta 4 ao dano mínimo e 6 ao máximo.',
  },
} as const;

export type AbilityUpgradeId = keyof typeof ABILITY_UPGRADES;
export type AbilityUpgradeRanks = Record<AbilityUpgradeId, number>;
