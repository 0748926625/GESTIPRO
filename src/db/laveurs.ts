import * as Crypto from 'expo-crypto';
import { db } from './client';
import type { Laveur } from '../types';

interface LaveurRow {
  id: string;
  nom: string;
  taux_commission: number;
  actif: number;
}

function mapLaveur(row: LaveurRow): Laveur {
  return {
    id: row.id,
    nom: row.nom,
    tauxCommission: row.taux_commission,
    actif: row.actif === 1,
  };
}

export async function getLaveurs(activeOnly = true): Promise<Laveur[]> {
  const rows = activeOnly
    ? await db.getAllAsync<LaveurRow>('SELECT * FROM laveurs WHERE actif = 1 ORDER BY nom ASC')
    : await db.getAllAsync<LaveurRow>('SELECT * FROM laveurs ORDER BY nom ASC');
  return rows.map(mapLaveur);
}

export async function getLaveur(id: string): Promise<Laveur | null> {
  const row = await db.getFirstAsync<LaveurRow>('SELECT * FROM laveurs WHERE id = ?', [id]);
  return row ? mapLaveur(row) : null;
}

export async function createLaveur(
  etablissementId: string,
  nom: string,
  tauxCommission: number
): Promise<string> {
  const id = Crypto.randomUUID();
  await db.runAsync(
    `INSERT INTO laveurs (id, etablissement_id, nom, taux_commission, actif, updated_at)
     VALUES (?, ?, ?, ?, 1, ?)`,
    [id, etablissementId, nom, tauxCommission, new Date().toISOString()]
  );
  return id;
}

export async function updateLaveur(id: string, nom: string, tauxCommission: number): Promise<void> {
  await db.runAsync(
    'UPDATE laveurs SET nom = ?, taux_commission = ?, updated_at = ? WHERE id = ?',
    [nom, tauxCommission, new Date().toISOString(), id]
  );
}

export async function setLaveurActif(id: string, actif: boolean): Promise<void> {
  await db.runAsync('UPDATE laveurs SET actif = ?, updated_at = ? WHERE id = ?', [
    actif ? 1 : 0,
    new Date().toISOString(),
    id,
  ]);
}
