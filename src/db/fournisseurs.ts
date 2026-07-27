import * as Crypto from 'expo-crypto';
import { db } from './client';
import type { Fournisseur } from '../types';

interface FournisseurRow {
  id: string;
  nom: string;
  telephone: string;
  actif: number;
}

function mapFournisseur(row: FournisseurRow): Fournisseur {
  return {
    id: row.id,
    nom: row.nom,
    telephone: row.telephone,
    actif: row.actif === 1,
  };
}

export async function getFournisseurs(activeOnly = true): Promise<Fournisseur[]> {
  const rows = activeOnly
    ? await db.getAllAsync<FournisseurRow>(
        'SELECT * FROM fournisseurs WHERE actif = 1 ORDER BY nom ASC'
      )
    : await db.getAllAsync<FournisseurRow>('SELECT * FROM fournisseurs ORDER BY nom ASC');
  return rows.map(mapFournisseur);
}

export async function createFournisseur(
  etablissementId: string,
  nom: string,
  telephone: string
): Promise<string> {
  const id = Crypto.randomUUID();
  await db.runAsync(
    `INSERT INTO fournisseurs (id, etablissement_id, nom, telephone, actif, updated_at)
     VALUES (?, ?, ?, ?, 1, ?)`,
    [id, etablissementId, nom, telephone, new Date().toISOString()]
  );
  return id;
}

export async function setFournisseurActif(id: string, actif: boolean): Promise<void> {
  await db.runAsync('UPDATE fournisseurs SET actif = ?, updated_at = ? WHERE id = ?', [
    actif ? 1 : 0,
    new Date().toISOString(),
    id,
  ]);
}
