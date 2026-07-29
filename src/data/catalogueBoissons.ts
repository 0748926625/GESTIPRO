import { colors } from '../theme';

export interface ProduitSuggere {
  nom: string;
  categorie: string;
  unite: string;
  icone?: number;
  // Estimation du prix d'achat unitaire (F CFA), calculée à partir du prix par
  // casier/carton affiché sur la boutique en ligne officielle Solibra (achat en
  // gros par unité de conditionnement). À ajuster selon le dépôt réel du gérant.
  prixAchatEstime?: number;
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
  {
    nom: 'Castel',
    categorie: 'Bières',
    unite: 'bouteille',
    icone: require('../../assets/boissons/castel.png'),
    prixAchatEstime: 365, // casier 33cl x24 : 8 800 F
  },
  {
    nom: 'Beaufort',
    categorie: 'Bières',
    unite: 'bouteille',
    icone: require('../../assets/boissons/beaufort.png'),
    prixAchatEstime: 420, // casier 33cl x24 : 10 000 F
  },
  {
    nom: 'Guinness Foreign Extra',
    categorie: 'Bières',
    unite: 'bouteille',
    icone: require('../../assets/boissons/guinness-foreign-extra.png'),
    prixAchatEstime: 615, // casier 33cl x24 : 14 800 F
  },
  { nom: 'Heineken', categorie: 'Bières', unite: 'bouteille' },
  { nom: 'Desperados', categorie: 'Bières', unite: 'bouteille' },
  {
    nom: 'Bock',
    categorie: 'Bières',
    unite: 'bouteille',
    icone: require('../../assets/boissons/bock.png'),
    prixAchatEstime: 285, // casier 33cl x24 : 6 800 F
  },
  {
    nom: 'Budweiser',
    categorie: 'Bières',
    unite: 'bouteille',
    icone: require('../../assets/boissons/budweiser.png'),
    prixAchatEstime: 625, // carton 33cl x24 : 15 000 F
  },
  {
    nom: 'Corona Extra',
    categorie: 'Bières',
    unite: 'bouteille',
    icone: require('../../assets/boissons/corona-extra.png'),
    prixAchatEstime: 665, // carton 33cl x24 : 16 000 F
  },
  {
    nom: 'Doppel Munich',
    categorie: 'Bières',
    unite: 'bouteille',
    icone: require('../../assets/boissons/doppel-munich.png'),
    prixAchatEstime: 265, // casier 33cl x24 : 6 300 F
  },
  {
    nom: 'Sombreros',
    categorie: 'Bières',
    unite: 'bouteille',
    icone: require('../../assets/boissons/sombreros.png'),
    prixAchatEstime: 265, // casier 33cl x24 : 6 300 F
  },
  {
    nom: 'Chill Citron',
    categorie: 'Bières',
    unite: 'bouteille',
    icone: require('../../assets/boissons/chill-citron.png'),
    prixAchatEstime: 375, // casier 50cl x12 : 4 500 F
  },
  {
    nom: 'Racines',
    categorie: 'Bières',
    unite: 'bouteille',
    icone: require('../../assets/boissons/racines.png'),
    prixAchatEstime: 295, // casier 33cl x24 : 7 100 F
  },
  {
    nom: 'Racines Fort',
    categorie: 'Bières',
    unite: 'bouteille',
    icone: require('../../assets/boissons/racines-fort.png'),
    prixAchatEstime: 475, // casier 50cl x12 : 5 700 F
  },

  // Sodas & jus industriels
  { nom: 'Coca-Cola', categorie: 'Sodas & jus industriels', unite: 'bouteille' },
  { nom: 'Fanta Orange', categorie: 'Sodas & jus industriels', unite: 'bouteille' },
  { nom: 'Fanta Citron', categorie: 'Sodas & jus industriels', unite: 'bouteille' },
  { nom: 'Sprite', categorie: 'Sodas & jus industriels', unite: 'bouteille' },
  { nom: 'Top Pamplemousse', categorie: 'Sodas & jus industriels', unite: 'bouteille' },
  { nom: 'Top Ananas', categorie: 'Sodas & jus industriels', unite: 'bouteille' },
  { nom: 'Youki Pomme', categorie: 'Sodas & jus industriels', unite: 'bouteille' },
  {
    nom: 'Youki Orange',
    categorie: 'Sodas & jus industriels',
    unite: 'bouteille',
    icone: require('../../assets/boissons/youki-orange.png'),
    prixAchatEstime: 165, // casier VC 30cl x24 : 3 900 F
  },
  { nom: 'Djino', categorie: 'Sodas & jus industriels', unite: 'bouteille' },
  {
    nom: 'Orangina',
    categorie: 'Sodas & jus industriels',
    unite: 'bouteille',
    icone: require('../../assets/boissons/orangina.png'),
    prixAchatEstime: 290, // casier VC 30cl x24 : 7 000 F
  },
  {
    nom: 'YouZou',
    categorie: 'Sodas & jus industriels',
    unite: 'bouteille',
    icone: require('../../assets/boissons/youzou.png'),
    prixAchatEstime: 165, // casier VC 30cl x24 : 3 900 F
  },
  {
    nom: 'World Cola',
    categorie: 'Sodas & jus industriels',
    unite: 'bouteille',
    icone: require('../../assets/boissons/world-cola.png'),
    prixAchatEstime: 165, // casier VC 30cl x24 : 3 900 F
  },

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
  {
    nom: 'Malta Guinness',
    categorie: 'Malt & énergisants',
    unite: 'bouteille',
    icone: require('../../assets/boissons/malta-guinness.png'),
    prixAchatEstime: 385, // casier 30cl x24 : 9 200 F
  },
  { nom: 'Red Bull', categorie: 'Malt & énergisants', unite: 'canette' },
  {
    nom: 'XXL Energy',
    categorie: 'Malt & énergisants',
    unite: 'canette',
    icone: require('../../assets/boissons/xxl-energy.png'),
    prixAchatEstime: 355, // carton canette 33cl x24 : 8 500 F
  },
  {
    nom: 'Doppel Energy Malt',
    categorie: 'Malt & énergisants',
    unite: 'canette',
    icone: require('../../assets/boissons/doppel-energy-malt.png'),
    prixAchatEstime: 355, // carton canette 33cl x24 : 8 500 F
  },

  // Vins & spiritueux
  { nom: 'Pastis 51', categorie: 'Vins & spiritueux', unite: 'bouteille' },
  { nom: 'Whisky', categorie: 'Vins & spiritueux', unite: 'bouteille' },
  { nom: 'Vin rouge', categorie: 'Vins & spiritueux', unite: 'bouteille' },
  { nom: 'Vin rosé', categorie: 'Vins & spiritueux', unite: 'bouteille' },
  {
    nom: 'Valpierre',
    categorie: 'Vins & spiritueux',
    unite: 'bouteille',
    icone: require('../../assets/boissons/valpierre.png'),
  },
];

export const ICONES_PRODUITS: Record<string, number> = PRODUITS_SUGGERES.reduce(
  (acc, p) => {
    if (p.icone) acc[p.nom] = p.icone;
    return acc;
  },
  {} as Record<string, number>
);
