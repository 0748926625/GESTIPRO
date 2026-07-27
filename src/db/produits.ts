import * as Crypto from 'expo-crypto';
import { db } from './client';
import type { AlerteStock, Produit, TypeMouvement } from '../types';

interface ProduitRow {
  id: string;
  nom: string;
  categorie: string;
  unite: string;
  quantite_stock: number;
  seuil_alerte: number;
  prix_achat: number;
  prix_vente: number;
  actif: number;
}

function mapProduit(row: ProduitRow): Produit {
  return {
    id: row.id,
    nom: row.nom,
    categorie: row.categorie,
    unite: row.unite,
    quantiteStock: row.quantite_stock,
    seuilAlerte: row.seuil_alerte,
    prixAchat: row.prix_achat,
    prixVente: row.prix_vente,
    actif: row.actif === 1,
  };
}

export async function getProduits(activeOnly = true): Promise<Produit[]> {
  const rows = activeOnly
    ? await db.getAllAsync<ProduitRow>('SELECT * FROM produits WHERE actif = 1 ORDER BY nom ASC')
    : await db.getAllAsync<ProduitRow>('SELECT * FROM produits ORDER BY nom ASC');
  return rows.map(mapProduit);
}

export async function getProduitsStockBas(): Promise<Produit[]> {
  const rows = await db.getAllAsync<ProduitRow>(
    'SELECT * FROM produits WHERE actif = 1 AND quantite_stock <= seuil_alerte ORDER BY nom ASC'
  );
  return rows.map(mapProduit);
}

export async function getProduit(id: string): Promise<Produit | null> {
  const row = await db.getFirstAsync<ProduitRow>('SELECT * FROM produits WHERE id = ?', [id]);
  return row ? mapProduit(row) : null;
}

export interface ProduitInput {
  nom: string;
  categorie: string;
  unite: string;
  seuilAlerte: number;
  prixAchat: number;
  prixVente: number;
  quantiteStockInitiale?: number;
}

export async function createProduit(etablissementId: string, input: ProduitInput): Promise<string> {
  const id = Crypto.randomUUID();
  await db.runAsync(
    `INSERT INTO produits (id, etablissement_id, nom, categorie, unite, quantite_stock, seuil_alerte, prix_achat, prix_vente, actif, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`,
    [
      id,
      etablissementId,
      input.nom,
      input.categorie,
      input.unite,
      input.quantiteStockInitiale ?? 0,
      input.seuilAlerte,
      input.prixAchat,
      input.prixVente,
      new Date().toISOString(),
    ]
  );
  return id;
}

export async function updateProduit(id: string, input: ProduitInput): Promise<void> {
  await db.runAsync(
    `UPDATE produits SET nom = ?, categorie = ?, unite = ?, seuil_alerte = ?, prix_achat = ?, prix_vente = ?, updated_at = ?
     WHERE id = ?`,
    [
      input.nom,
      input.categorie,
      input.unite,
      input.seuilAlerte,
      input.prixAchat,
      input.prixVente,
      new Date().toISOString(),
      id,
    ]
  );
}

export async function setProduitActif(id: string, actif: boolean): Promise<void> {
  await db.runAsync('UPDATE produits SET actif = ?, updated_at = ? WHERE id = ?', [
    actif ? 1 : 0,
    new Date().toISOString(),
    id,
  ]);
}

export async function enregistrerMouvementStock(
  etablissementId: string,
  produitId: string,
  type: TypeMouvement,
  quantite: number,
  motif: string,
  userId: string
): Promise<AlerteStock | null> {
  const date = new Date().toISOString();
  let alerte: AlerteStock | null = null;
  await db.withTransactionAsync(async () => {
    const delta = type === 'sortie' ? -quantite : quantite;
    const avant = await db.getFirstAsync<ProduitRow>('SELECT * FROM produits WHERE id = ?', [
      produitId,
    ]);
    await db.runAsync(
      'UPDATE produits SET quantite_stock = quantite_stock + ?, updated_at = ? WHERE id = ?',
      [delta, date, produitId]
    );
    await db.runAsync(
      `INSERT INTO mouvements_stock (id, etablissement_id, produit_id, type, quantite, motif, user_id, date, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [Crypto.randomUUID(), etablissementId, produitId, type, quantite, motif, userId, date, date]
    );
    if (avant && delta < 0) {
      const quantiteApres = avant.quantite_stock + delta;
      if (quantiteApres <= avant.seuil_alerte && avant.quantite_stock > avant.seuil_alerte) {
        alerte = {
          produitId,
          nom: avant.nom,
          quantiteStock: quantiteApres,
          seuilAlerte: avant.seuil_alerte,
          unite: avant.unite,
        };
      }
    }
  });
  return alerte;
}
