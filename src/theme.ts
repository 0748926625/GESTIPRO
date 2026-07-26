export const colors = {
  background: '#FAF6F6',
  surface: '#FFFFFF',
  primary: '#9A1B2F',
  primaryDark: '#5C0F1C',
  primaryLight: '#D6394C',
  text: '#251518',
  textMuted: '#8C7376',
  border: '#F0E1E3',
  danger: '#EA580C',
  dangerBg: '#FFF3EC',
  success: '#15803D',
  successBg: '#EEFBF3',
  accentRouge: '#D6394C',
  accentBleu: '#2563EB',
  accentVert: '#0D9488',
  accentViolet: '#7C3AED',
  accentBordeaux: '#6B2140',
  accentJaune: '#D97706',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export function withOpacity(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export const cardShadow = {
  shadowColor: '#3B1116',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.08,
  shadowRadius: 8,
  elevation: 2,
};
