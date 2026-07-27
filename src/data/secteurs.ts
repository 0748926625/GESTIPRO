import type { Ionicons } from '@expo/vector-icons';
import type { Secteur } from '../types';
import { CATEGORIES_BOISSONS, PRODUITS_SUGGERES, type ProduitSuggere } from './catalogueBoissons';

export interface SecteurConfig {
  value: Secteur;
  label: string;
  description: string;
  icone: keyof typeof Ionicons.glyphMap;
  stockActif: boolean;
  libelleArticle: string;
  libelleArticlePluriel: string;
  categories: string[];
  suggestions: ProduitSuggere[];
}

export const SECTEURS: SecteurConfig[] = [
  {
    value: 'maquis',
    label: 'Maquis / bar',
    description: 'Boissons et snacks au verre ou à la bouteille',
    icone: 'beer-outline',
    stockActif: true,
    libelleArticle: 'produit',
    libelleArticlePluriel: 'produits',
    categories: CATEGORIES_BOISSONS,
    suggestions: PRODUITS_SUGGERES,
  },
  {
    value: 'restaurant',
    label: 'Restaurant',
    description: 'Plats, boissons et menu du jour',
    icone: 'restaurant-outline',
    stockActif: true,
    libelleArticle: 'plat',
    libelleArticlePluriel: 'plats',
    categories: ['Entrées', 'Plats', 'Accompagnements', 'Desserts', 'Boissons', 'Autre'],
    suggestions: [
      { nom: 'Riz sauce graine', categorie: 'Plats', unite: 'assiette' },
      { nom: 'Riz sauce arachide', categorie: 'Plats', unite: 'assiette' },
      { nom: 'Attiéké poisson', categorie: 'Plats', unite: 'assiette' },
      { nom: 'Attiéké poulet', categorie: 'Plats', unite: 'assiette' },
      { nom: 'Garba', categorie: 'Plats', unite: 'assiette' },
      { nom: 'Foutou sauce claire', categorie: 'Plats', unite: 'assiette' },
      { nom: 'Poulet braisé', categorie: 'Plats', unite: 'portion' },
      { nom: 'Poisson braisé', categorie: 'Plats', unite: 'portion' },
      { nom: 'Alloco', categorie: 'Accompagnements', unite: 'portion' },
      { nom: 'Frites', categorie: 'Accompagnements', unite: 'portion' },
      { nom: 'Salade composée', categorie: 'Entrées', unite: 'assiette' },
      { nom: 'Jus de bissap', categorie: 'Boissons', unite: 'verre' },
      { nom: 'Eau minérale', categorie: 'Boissons', unite: 'bouteille' },
    ],
  },
  {
    value: 'lavage_auto',
    label: 'Lavage auto',
    description: 'Services de lavage véhicules et motos (sans gestion de stock)',
    icone: 'car-outline',
    stockActif: false,
    libelleArticle: 'service',
    libelleArticlePluriel: 'services',
    categories: [
      'Lavage moto',
      'Lavage voiture',
      'Lavage 4x4 / SUV',
      'Intérieur & pressing',
      'Autre',
    ],
    suggestions: [
      { nom: 'Lavage simple moto', categorie: 'Lavage moto', unite: 'service' },
      { nom: 'Lavage complet moto', categorie: 'Lavage moto', unite: 'service' },
      { nom: 'Lavage extérieur voiture', categorie: 'Lavage voiture', unite: 'service' },
      { nom: 'Lavage complet voiture', categorie: 'Lavage voiture', unite: 'service' },
      { nom: 'Lavage 4x4 / SUV', categorie: 'Lavage 4x4 / SUV', unite: 'service' },
      { nom: 'Nettoyage intérieur', categorie: 'Intérieur & pressing', unite: 'service' },
      { nom: 'Cirage & lustrage', categorie: 'Intérieur & pressing', unite: 'service' },
    ],
  },
  {
    value: 'commerce',
    label: 'Commerce divers',
    description: 'Boutique, épicerie, quincaillerie...',
    icone: 'storefront-outline',
    stockActif: true,
    libelleArticle: 'article',
    libelleArticlePluriel: 'articles',
    categories: [
      'Alimentation',
      'Hygiène & beauté',
      'Quincaillerie',
      'Électronique',
      'Vêtements',
      'Autre',
    ],
    suggestions: [
      { nom: 'Riz (sac 25kg)', categorie: 'Alimentation', unite: 'sac' },
      { nom: 'Huile végétale (bidon 5L)', categorie: 'Alimentation', unite: 'bidon' },
      { nom: 'Sucre en poudre (kg)', categorie: 'Alimentation', unite: 'kg' },
      { nom: 'Savon de toilette', categorie: 'Hygiène & beauté', unite: 'pièce' },
      { nom: 'Pâte dentifrice', categorie: 'Hygiène & beauté', unite: 'pièce' },
      { nom: 'Ampoule électrique', categorie: 'Quincaillerie', unite: 'pièce' },
      { nom: 'Pile (AA/AAA)', categorie: 'Quincaillerie', unite: 'pièce' },
    ],
  },
];

export function getSecteurConfig(secteur: Secteur | string | undefined): SecteurConfig {
  return SECTEURS.find((s) => s.value === secteur) ?? SECTEURS[0];
}
