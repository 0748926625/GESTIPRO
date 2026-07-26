import { db } from './client';

export interface Etablissement {
  nom: string;
  logoUri: string | null;
}

export async function ensureEtablissementLocal(etablissementId: string, nomParDefaut: string): Promise<void> {
  const row = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM etablissement WHERE id = ?',
    [etablissementId]
  );
  if (row && row.count > 0) return;
  await db.runAsync('INSERT INTO etablissement (id, nom, logo_uri, updated_at) VALUES (?, ?, NULL, ?)', [
    etablissementId,
    nomParDefaut,
    new Date().toISOString(),
  ]);
}

export async function getEtablissement(etablissementId: string): Promise<Etablissement> {
  const row = await db.getFirstAsync<{ nom: string; logo_uri: string | null }>(
    'SELECT nom, logo_uri FROM etablissement WHERE id = ?',
    [etablissementId]
  );
  return { nom: row?.nom ?? 'GestiPro', logoUri: row?.logo_uri ?? null };
}

export async function saveEtablissement(
  etablissementId: string,
  nom: string,
  logoUri: string | null
): Promise<void> {
  await db.runAsync('UPDATE etablissement SET nom = ?, logo_uri = ?, updated_at = ? WHERE id = ?', [
    nom,
    logoUri,
    new Date().toISOString(),
    etablissementId,
  ]);
}
