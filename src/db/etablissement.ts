import { db } from './client';
import type { Secteur } from '../types';

export interface Etablissement {
  nom: string;
  logoUri: string | null;
  secteur: Secteur;
  essaiFin: string | null;
  abonnementActif: boolean;
}

export async function ensureEtablissementLocal(
  etablissementId: string,
  nomParDefaut: string,
  secteur: Secteur = 'maquis'
): Promise<void> {
  const row = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM etablissement WHERE id = ?',
    [etablissementId]
  );
  if (row && row.count > 0) return;
  // updated_at volontairement très ancien : cette ligne est un simple placeholder en attendant
  // le premier sync, qui doit toujours ramener le vrai nom/secteur distants sans être bloqué
  // par la comparaison "le plus récent gagne".
  await db.runAsync(
    'INSERT INTO etablissement (id, nom, logo_uri, secteur, updated_at) VALUES (?, ?, NULL, ?, ?)',
    [etablissementId, nomParDefaut, secteur, new Date(0).toISOString()]
  );
}

export async function getEtablissement(etablissementId: string): Promise<Etablissement> {
  const row = await db.getFirstAsync<{
    nom: string;
    logo_uri: string | null;
    secteur: string;
    essai_fin: string | null;
    abonnement_actif: number;
  }>('SELECT nom, logo_uri, secteur, essai_fin, abonnement_actif FROM etablissement WHERE id = ?', [
    etablissementId,
  ]);
  return {
    nom: row?.nom ?? 'GestiPro',
    logoUri: row?.logo_uri ?? null,
    secteur: (row?.secteur as Secteur) ?? 'maquis',
    essaiFin: row?.essai_fin ?? null,
    abonnementActif: row?.abonnement_actif === 1,
  };
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
