export type ModePaiement = 'especes' | 'wave' | 'orange_money' | 'momo';

export interface ModePaiementInfo {
  value: ModePaiement;
  label: string;
  couleur: string;
}

export const MODES_PAIEMENT: ModePaiementInfo[] = [
  { value: 'especes', label: 'Espèces', couleur: '#57534E' },
  { value: 'wave', label: 'Wave', couleur: '#1DA1F2' },
  { value: 'orange_money', label: 'Orange Money', couleur: '#FF7900' },
  { value: 'momo', label: 'MoMo', couleur: '#FFCC00' },
];

export function getModePaiementInfo(value: ModePaiement): ModePaiementInfo {
  return MODES_PAIEMENT.find((m) => m.value === value) ?? MODES_PAIEMENT[0];
}
