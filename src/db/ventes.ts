import * as Crypto from 'expo-crypto';
import { db } from './client';
import type { ModePaiement } from '../data/modesPaiement';
import type { AlerteStock, VenteAvecLignes, VenteLigneInput } from '../types';

interface VenteRow {
  id: string;
  user_id: string;
  date: string;
  total: number;
  mode_paiement: string;
  laveur_id: string | null;
  commission_montant: number | null;
}

interface VenteLigneRow {
  id: string;
  vente_id: string;
  produit_id: string;
  quantite: number;
  prix_unitaire_vente: number;
  nom_produit: string;
}

export async function creerVente(
  etablissementId: string,
  userId: string,
  lignes: VenteLigneInput[],
  modePaiement: ModePaiement,
  laveurId?: string | null
): Promise<{ id: string; produitsEnAlerte: AlerteStock[] }> {
  if (lignes.length === 0) {
    throw new Error('Une vente doit contenir au moins un produit');
  }

  const total = lignes.reduce((sum, l) => sum + l.quantite * l.prixUnitaireVente, 0);
  const date = new Date().toISOString();
  const venteId = Crypto.randomUUID();
  const produitsEnAlerte: AlerteStock[] = [];

  let commissionMontant: number | null = null;
  if (laveurId) {
    const laveur = await db.getFirstAsync<{ taux_commission: number }>(
      'SELECT taux_commission FROM laveurs WHERE id = ?',
      [laveurId]
    );
    if (laveur) {
      commissionMontant = (total * laveur.taux_commission) / 100;
    }
  }

  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `INSERT INTO ventes (id, etablissement_id, user_id, date, total, mode_paiement, laveur_id, commission_montant, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [venteId, etablissementId, userId, date, total, modePaiement, laveurId ?? null, commissionMontant, date]
    );

    for (const ligne of lignes) {
      const produit = await db.getFirstAsync<{
        quantite_stock: number;
        seuil_alerte: number;
        unite: string;
      }>('SELECT quantite_stock, seuil_alerte, unite FROM produits WHERE id = ?', [
        ligne.produitId,
      ]);
      if (!produit || produit.quantite_stock < ligne.quantite) {
        throw new Error(`Stock insuffisant pour ${ligne.nom}`);
      }

      await db.runAsync(
        `INSERT INTO vente_lignes (id, etablissement_id, vente_id, produit_id, quantite, prix_unitaire_vente, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [Crypto.randomUUID(), etablissementId, venteId, ligne.produitId, ligne.quantite, ligne.prixUnitaireVente, date]
      );
      await db.runAsync(
        'UPDATE produits SET quantite_stock = quantite_stock - ?, updated_at = ? WHERE id = ?',
        [ligne.quantite, date, ligne.produitId]
      );
      await db.runAsync(
        `INSERT INTO mouvements_stock (id, etablissement_id, produit_id, type, quantite, motif, user_id, date, updated_at)
         VALUES (?, ?, ?, 'sortie', ?, 'Vente', ?, ?, ?)`,
        [Crypto.randomUUID(), etablissementId, ligne.produitId, ligne.quantite, userId, date, date]
      );

      const quantiteApres = produit.quantite_stock - ligne.quantite;
      if (quantiteApres <= produit.seuil_alerte && produit.quantite_stock > produit.seuil_alerte) {
        produitsEnAlerte.push({
          produitId: ligne.produitId,
          nom: ligne.nom,
          quantiteStock: quantiteApres,
          seuilAlerte: produit.seuil_alerte,
          unite: produit.unite,
        });
      }
    }
  });

  return { id: venteId, produitsEnAlerte };
}

async function chargerVenteAvecLignes(v: VenteRow): Promise<VenteAvecLignes> {
  const lignes = await db.getAllAsync<VenteLigneRow>(
    `SELECT vl.*, p.nom as nom_produit FROM vente_lignes vl
     JOIN produits p ON p.id = vl.produit_id
     WHERE vl.vente_id = ?`,
    [v.id]
  );
  const user = await db.getFirstAsync<{ nom: string }>('SELECT nom FROM users WHERE id = ?', [
    v.user_id,
  ]);
  const laveur = v.laveur_id
    ? await db.getFirstAsync<{ nom: string }>('SELECT nom FROM laveurs WHERE id = ?', [v.laveur_id])
    : null;
  return {
    id: v.id,
    userId: v.user_id,
    date: v.date,
    total: v.total,
    modePaiement: v.mode_paiement as ModePaiement,
    laveurId: v.laveur_id,
    commissionMontant: v.commission_montant,
    nomUser: user?.nom ?? 'Inconnu',
    nomLaveur: laveur?.nom ?? null,
    lignes: lignes.map((l) => ({
      id: l.id,
      venteId: l.vente_id,
      produitId: l.produit_id,
      quantite: l.quantite,
      prixUnitaireVente: l.prix_unitaire_vente,
      nomProduit: l.nom_produit,
    })),
  };
}

export async function getHistoriqueVentes(
  limit = 100,
  depuisISO?: string,
  jusquISO?: string
): Promise<VenteAvecLignes[]> {
  const conditions: string[] = [];
  const params: (string | number)[] = [];
  if (depuisISO) {
    conditions.push('date >= ?');
    params.push(depuisISO);
  }
  if (jusquISO) {
    conditions.push('date <= ?');
    params.push(jusquISO);
  }
  const clauseOu = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const ventes = await db.getAllAsync<VenteRow>(
    `SELECT * FROM ventes ${clauseOu} ORDER BY date DESC LIMIT ?`,
    [...params, limit]
  );
  const result: VenteAvecLignes[] = [];
  for (const v of ventes) {
    result.push(await chargerVenteAvecLignes(v));
  }
  return result;
}
