import { db } from './client';
import type { ModePaiement } from '../data/modesPaiement';
import type { CommissionLaveur, ProduitVendu, RepartitionModePaiement } from '../types';

export async function getChiffreAffaires(depuisISO: string, jusquISO?: string): Promise<number> {
  const row = await db.getFirstAsync<{ total: number | null }>(
    `SELECT SUM(total) as total FROM ventes WHERE date >= ? ${jusquISO ? 'AND date < ?' : ''}`,
    jusquISO ? [depuisISO, jusquISO] : [depuisISO]
  );
  return row?.total ?? 0;
}

export async function getNombreVentes(depuisISO: string, jusquISO?: string): Promise<number> {
  const row = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM ventes WHERE date >= ? ${jusquISO ? 'AND date < ?' : ''}`,
    jusquISO ? [depuisISO, jusquISO] : [depuisISO]
  );
  return row?.count ?? 0;
}

export async function getMargeTotale(depuisISO: string, jusquISO?: string): Promise<number> {
  const row = await db.getFirstAsync<{ marge: number | null }>(
    `SELECT SUM(vl.quantite * (vl.prix_unitaire_vente - p.prix_achat)) as marge
     FROM vente_lignes vl
     JOIN ventes v ON v.id = vl.vente_id
     JOIN produits p ON p.id = vl.produit_id
     WHERE v.date >= ? ${jusquISO ? 'AND v.date < ?' : ''}`,
    jusquISO ? [depuisISO, jusquISO] : [depuisISO]
  );
  return row?.marge ?? 0;
}

export async function getRepartitionParModePaiement(
  depuisISO: string,
  jusquISO?: string
): Promise<RepartitionModePaiement[]> {
  const rows = await db.getAllAsync<{ mode_paiement: string; total: number; nombre_ventes: number }>(
    `SELECT mode_paiement, SUM(total) as total, COUNT(*) as nombre_ventes
     FROM ventes
     WHERE date >= ? ${jusquISO ? 'AND date < ?' : ''}
     GROUP BY mode_paiement
     ORDER BY total DESC`,
    jusquISO ? [depuisISO, jusquISO] : [depuisISO]
  );
  return rows.map((r) => ({
    modePaiement: r.mode_paiement as ModePaiement,
    total: r.total,
    nombreVentes: r.nombre_ventes,
  }));
}

export async function getCommissionsParLaveur(
  depuisISO: string,
  jusquISO?: string
): Promise<CommissionLaveur[]> {
  const rows = await db.getAllAsync<{
    laveur_id: string;
    nom: string;
    nombre_ventes: number;
    chiffre_affaires: number;
    commission: number;
  }>(
    `SELECT
       l.id as laveur_id,
       l.nom as nom,
       COUNT(v.id) as nombre_ventes,
       SUM(v.total) as chiffre_affaires,
       SUM(COALESCE(v.commission_montant, 0)) as commission
     FROM ventes v
     JOIN laveurs l ON l.id = v.laveur_id
     WHERE v.laveur_id IS NOT NULL AND v.date >= ? ${jusquISO ? 'AND v.date < ?' : ''}
     GROUP BY l.id
     ORDER BY commission DESC`,
    jusquISO ? [depuisISO, jusquISO] : [depuisISO]
  );
  return rows.map((r) => ({
    laveurId: r.laveur_id,
    nom: r.nom,
    nombreVentes: r.nombre_ventes,
    chiffreAffaires: r.chiffre_affaires,
    commission: r.commission,
  }));
}

export async function getProduitsTopVentes(
  depuisISO: string,
  limit = 10,
  jusquISO?: string
): Promise<ProduitVendu[]> {
  const rows = await db.getAllAsync<{
    produit_id: string;
    nom: string;
    quantite_vendue: number;
    chiffre_affaires: number;
    marge: number;
  }>(
    `SELECT
       p.id as produit_id,
       p.nom as nom,
       SUM(vl.quantite) as quantite_vendue,
       SUM(vl.quantite * vl.prix_unitaire_vente) as chiffre_affaires,
       SUM(vl.quantite * (vl.prix_unitaire_vente - p.prix_achat)) as marge
     FROM vente_lignes vl
     JOIN ventes v ON v.id = vl.vente_id
     JOIN produits p ON p.id = vl.produit_id
     WHERE v.date >= ? ${jusquISO ? 'AND v.date < ?' : ''}
     GROUP BY p.id
     ORDER BY quantite_vendue DESC
     LIMIT ?`,
    jusquISO ? [depuisISO, jusquISO, limit] : [depuisISO, limit]
  );
  return rows.map((r) => ({
    produitId: r.produit_id,
    nom: r.nom,
    quantiteVendue: r.quantite_vendue,
    chiffreAffaires: r.chiffre_affaires,
    marge: r.marge,
  }));
}
