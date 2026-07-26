import * as Crypto from 'expo-crypto';
import { db } from './client';
import {
  getChiffreAffaires,
  getMargeTotale,
  getNombreVentes,
  getProduitsTopVentes,
  getRepartitionParModePaiement,
} from './rapports';
import { getTotalParType } from './operations';
import type { Cloture } from '../types';

interface ClotureRow {
  id: string;
  periode_debut: string;
  periode_fin: string;
  chiffre_affaires: number;
  nombre_ventes: number;
  marge: number;
  recettes_diverses: number;
  depenses: number;
  resultat_net: number;
  top_produits: string;
  repartition_paiement: string;
  user_id: string;
}

function mapCloture(row: ClotureRow): Cloture {
  return {
    id: row.id,
    periodeDebut: row.periode_debut,
    periodeFin: row.periode_fin,
    chiffreAffaires: row.chiffre_affaires,
    nombreVentes: row.nombre_ventes,
    marge: row.marge,
    recettesDiverses: row.recettes_diverses,
    depenses: row.depenses,
    resultatNet: row.resultat_net,
    topProduits: JSON.parse(row.top_produits),
    repartitionPaiement: JSON.parse(row.repartition_paiement),
    userId: row.user_id,
  };
}

export async function getDerniereClotureFin(): Promise<string | null> {
  const row = await db.getFirstAsync<{ periode_fin: string }>(
    'SELECT periode_fin FROM clotures ORDER BY periode_fin DESC LIMIT 1'
  );
  return row?.periode_fin ?? null;
}

export async function getClotures(): Promise<Cloture[]> {
  const rows = await db.getAllAsync<ClotureRow>('SELECT * FROM clotures ORDER BY periode_fin DESC');
  return rows.map(mapCloture);
}

export async function creerCloture(etablissementId: string, userId: string): Promise<Cloture> {
  const periodeDebut = (await getDerniereClotureFin()) ?? new Date(0).toISOString();
  const periodeFin = new Date().toISOString();

  const [chiffreAffaires, nombreVentes, marge, recettesDiverses, depenses, topProduits, repartitionPaiement] =
    await Promise.all([
      getChiffreAffaires(periodeDebut, periodeFin),
      getNombreVentes(periodeDebut, periodeFin),
      getMargeTotale(periodeDebut, periodeFin),
      getTotalParType(periodeDebut, 'recette', periodeFin),
      getTotalParType(periodeDebut, 'depense', periodeFin),
      getProduitsTopVentes(periodeDebut, 50, periodeFin),
      getRepartitionParModePaiement(periodeDebut, periodeFin),
    ]);

  const resultatNet = marge + recettesDiverses - depenses;
  const id = Crypto.randomUUID();
  const updatedAt = new Date().toISOString();

  await db.runAsync(
    `INSERT INTO clotures (
      id, etablissement_id, periode_debut, periode_fin, chiffre_affaires, nombre_ventes,
      marge, recettes_diverses, depenses, resultat_net, top_produits, repartition_paiement,
      user_id, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      etablissementId,
      periodeDebut,
      periodeFin,
      chiffreAffaires,
      nombreVentes,
      marge,
      recettesDiverses,
      depenses,
      resultatNet,
      JSON.stringify(topProduits),
      JSON.stringify(repartitionPaiement),
      userId,
      updatedAt,
    ]
  );

  return {
    id,
    periodeDebut,
    periodeFin,
    chiffreAffaires,
    nombreVentes,
    marge,
    recettesDiverses,
    depenses,
    resultatNet,
    topProduits,
    repartitionPaiement,
    userId,
  };
}
