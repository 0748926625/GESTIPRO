import { colors } from '../theme';

export interface ProduitSuggere {
  nom: string;
  categorie: string;
  unite: string;
}

export const CATEGORIES_BOISSONS: string[] = [
  'Bières',
  'Sodas & jus industriels',
  'Eaux',
  'Boissons locales',
  'Malt & énergisants',
  'Vins & spiritueux',
  'Autre',
];

const COULEURS_CATEGORIES: Record<string, string> = {
  Bières: colors.accentJaune,
  'Sodas & jus industriels': colors.accentRouge,
  Eaux: colors.accentBleu,
  'Boissons locales': colors.accentVert,
  'Malt & énergisants': colors.accentViolet,
  'Vins & spiritueux': colors.accentBordeaux,
};

const PALETTE_FALLBACK: string[] = [
  colors.accentRouge,
  colors.accentBleu,
  colors.accentVert,
  colors.accentViolet,
  colors.accentBordeaux,
  colors.accentJaune,
];

export function getCategorieColor(categorie: string): string {
  if (COULEURS_CATEGORIES[categorie]) return COULEURS_CATEGORIES[categorie];
  if (!categorie) return colors.textMuted;
  let hash = 0;
  for (let i = 0; i < categorie.length; i += 1) {
    hash = (hash * 31 + categorie.charCodeAt(i)) >>> 0;
  }
  return PALETTE_FALLBACK[hash % PALETTE_FALLBACK.length];
}

export const PRODUITS_SUGGERES: ProduitSuggere[] = [
  // Bières
  { nom: 'Flag', categorie: 'Bières', unite: 'bouteille' },
  { nom: 'Ivoire', categorie: 'Bières', unite: 'bouteille' },
  { nom: 'Castel', categorie: 'Bières', unite: 'bouteille' },
  { nom: 'Beaufort', categorie: 'Bières', unite: 'bouteille' },
  { nom: 'Guinness Foreign Extra', categorie: 'Bières', unite: 'bouteille' },
  { nom: 'Heineken', categorie: 'Bières', unite: 'bouteille' },
  { nom: 'Desperados', categorie: 'Bières', unite: 'bouteille' },

  // Sodas & jus industriels
  { nom: 'Coca-Cola', categorie: 'Sodas & jus industriels', unite: 'bouteille' },
  { nom: 'Fanta Orange', categorie: 'Sodas & jus industriels', unite: 'bouteille' },
  { nom: 'Fanta Citron', categorie: 'Sodas & jus industriels', unite: 'bouteille' },
  { nom: 'Sprite', categorie: 'Sodas & jus industriels', unite: 'bouteille' },
  { nom: 'Top Pamplemousse', categorie: 'Sodas & jus industriels', unite: 'bouteille' },
  { nom: 'Top Ananas', categorie: 'Sodas & jus industriels', unite: 'bouteille' },
  { nom: 'Youki Pomme', categorie: 'Sodas & jus industriels', unite: 'bouteille' },
  { nom: 'Djino', categorie: 'Sodas & jus industriels', unite: 'bouteille' },

  // Eaux
  { nom: 'Awa', categorie: 'Eaux', unite: 'bouteille' },
  { nom: 'Eau en sachet (pure water)', categorie: 'Eaux', unite: 'sachet' },

  // Boissons locales
  { nom: 'Bissap', categorie: 'Boissons locales', unite: 'sachet' },
  { nom: 'Gnamakoudji', categorie: 'Boissons locales', unite: 'sachet' },
  { nom: 'Jus de gingembre', categorie: 'Boissons locales', unite: 'sachet' },
  { nom: 'Tchapalo', categorie: 'Boissons locales', unite: 'litre' },
  { nom: 'Bandji (vin de palme)', categorie: 'Boissons locales', unite: 'litre' },

  // Malt & énergisants
  { nom: 'Booster', categorie: 'Malt & énergisants', unite: 'bouteille' },
  { nom: 'Malta Guinness', categorie: 'Malt & énergisants', unite: 'bouteille' },
  { nom: 'Red Bull', categorie: 'Malt & énergisants', unite: 'canette' },

  // Vins & spiritueux
  { nom: 'Pastis 51', categorie: 'Vins & spiritueux', unite: 'bouteille' },
  { nom: 'Whisky', categorie: 'Vins & spiritueux', unite: 'bouteille' },
  { nom: 'Vin rouge', categorie: 'Vins & spiritueux', unite: 'bouteille' },
  { nom: 'Vin rosé', categorie: 'Vins & spiritueux', unite: 'bouteille' },
];
