import type { ModePaiement } from '../data/modesPaiement';

export type Role = 'gerant' | 'serveur';

export type Secteur = 'maquis' | 'restaurant' | 'lavage_auto' | 'commerce';

export interface User {
  id: string;
  nom: string;
  pinHash: string;
  role: Role;
  actif: boolean;
}

export interface Produit {
  id: string;
  nom: string;
  categorie: string;
  unite: string;
  quantiteStock: number;
  seuilAlerte: number;
  prixAchat: number;
  prixVente: number;
  actif: boolean;
}

export type TypeMouvement = 'entree' | 'sortie' | 'ajustement';

export interface MouvementStock {
  id: string;
  produitId: string;
  type: TypeMouvement;
  quantite: number;
  motif: string;
  userId: string;
  date: string;
}

export interface Vente {
  id: string;
  userId: string;
  date: string;
  total: number;
  modePaiement: ModePaiement;
}

export interface VenteLigne {
  id: string;
  venteId: string;
  produitId: string;
  quantite: number;
  prixUnitaireVente: number;
}

export interface VenteLigneInput {
  produitId: string;
  nom: string;
  quantite: number;
  prixUnitaireVente: number;
}

export interface VenteAvecLignes extends Vente {
  lignes: (VenteLigne & { nomProduit: string })[];
  nomUser: string;
}

export interface ProduitVendu {
  produitId: string;
  nom: string;
  quantiteVendue: number;
  chiffreAffaires: number;
  marge: number;
}

export type TypeOperation = 'recette' | 'depense';

export interface OperationCaisse {
  id: string;
  type: TypeOperation;
  categorie: string;
  montant: number;
  description: string;
  userId: string;
  nomUser: string;
  date: string;
}

export interface RepartitionModePaiement {
  modePaiement: ModePaiement;
  total: number;
  nombreVentes: number;
}

export interface Fournisseur {
  id: string;
  nom: string;
  telephone: string;
  actif: boolean;
}

export interface AlerteStock {
  produitId: string;
  nom: string;
  quantiteStock: number;
  seuilAlerte: number;
  unite: string;
}

export interface Cloture {
  id: string;
  periodeDebut: string;
  periodeFin: string;
  chiffreAffaires: number;
  nombreVentes: number;
  marge: number;
  recettesDiverses: number;
  depenses: number;
  resultatNet: number;
  topProduits: ProduitVendu[];
  repartitionPaiement: RepartitionModePaiement[];
  userId: string;
}
