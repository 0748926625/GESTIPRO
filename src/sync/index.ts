import { db, getMeta, setMeta } from '../db/client';
import { supabase } from '../lib/supabase';

interface TableSyncConfig {
  nom: string;
  champsBooleens?: string[];
  champsJson?: string[];
}

// Colonnes présentes côté Supabase mais pas dans le schéma local (non utilisées par l'app).
const CHAMPS_IGNORES_LOCAL = new Set(['created_at']);

const TABLES: TableSyncConfig[] = [
  { nom: 'users', champsBooleens: ['actif'] },
  { nom: 'produits', champsBooleens: ['actif'] },
  { nom: 'mouvements_stock' },
  { nom: 'ventes' },
  { nom: 'vente_lignes' },
  { nom: 'operations_caisse' },
  { nom: 'clotures', champsJson: ['top_produits', 'repartition_paiement'] },
  { nom: 'fournisseurs', champsBooleens: ['actif'] },
];

async function pousserTable(config: TableSyncConfig): Promise<void> {
  const rows = await db.getAllAsync<Record<string, unknown>>(`SELECT * FROM ${config.nom}`);
  if (rows.length === 0) return;

  const rowsConverties = rows.map((r) => {
    const copie: Record<string, unknown> = { ...r };
    for (const champ of config.champsBooleens ?? []) {
      copie[champ] = copie[champ] === 1;
    }
    for (const champ of config.champsJson ?? []) {
      copie[champ] = JSON.parse(copie[champ] as string);
    }
    return copie;
  });

  const { error } = await supabase.from(config.nom).upsert(rowsConverties, { onConflict: 'id' });
  if (error) throw new Error(`Envoi ${config.nom} : ${error.message}`);
}

async function tirerTable(config: TableSyncConfig, etablissementId: string): Promise<void> {
  const { data, error } = await supabase
    .from(config.nom)
    .select('*')
    .eq('etablissement_id', etablissementId);
  if (error) throw new Error(`Réception ${config.nom} : ${error.message}`);
  if (!data || data.length === 0) return;

  for (const remoteRow of data as Record<string, unknown>[]) {
    const copie: Record<string, unknown> = {};
    for (const [cle, valeur] of Object.entries(remoteRow)) {
      if (!CHAMPS_IGNORES_LOCAL.has(cle)) {
        copie[cle] = valeur;
      }
    }
    for (const champ of config.champsBooleens ?? []) {
      copie[champ] = copie[champ] ? 1 : 0;
    }
    for (const champ of config.champsJson ?? []) {
      copie[champ] = JSON.stringify(copie[champ] ?? []);
    }
    const colonnes = Object.keys(copie);
    const placeholders = colonnes.map(() => '?').join(', ');
    const misesAJour = colonnes
      .filter((c) => c !== 'id')
      .map((c) => `${c} = excluded.${c}`)
      .join(', ');

    await db.runAsync(
      `INSERT INTO ${config.nom} (${colonnes.join(', ')}) VALUES (${placeholders})
       ON CONFLICT(id) DO UPDATE SET ${misesAJour}
       WHERE excluded.updated_at > ${config.nom}.updated_at`,
      colonnes.map((c) => copie[c] as string | number | null)
    );
  }
}

async function synchroniserEtablissement(etablissementId: string): Promise<void> {
  const { data, error } = await supabase
    .from('etablissements')
    .select('nom, secteur, updated_at')
    .eq('id', etablissementId)
    .maybeSingle();
  if (error || !data) return;

  const local = await db.getFirstAsync<{ nom: string; secteur: string; updated_at: string }>(
    'SELECT nom, secteur, updated_at FROM etablissement WHERE id = ?',
    [etablissementId]
  );
  if (!local) return;

  if (new Date(data.updated_at) > new Date(local.updated_at)) {
    await db.runAsync('UPDATE etablissement SET nom = ?, secteur = ?, updated_at = ? WHERE id = ?', [
      data.nom,
      data.secteur ?? 'maquis',
      data.updated_at,
      etablissementId,
    ]);
  } else if (data.nom !== local.nom) {
    await supabase.from('etablissements').update({ nom: local.nom }).eq('id', etablissementId);
  }
}

export async function synchroniser(etablissementId: string): Promise<void> {
  await synchroniserEtablissement(etablissementId);
  for (const table of TABLES) {
    await tirerTable(table, etablissementId);
  }
  for (const table of TABLES) {
    await pousserTable(table);
  }
  await setMeta('last_sync_at', new Date().toISOString());
}

export async function getDerniereSynchro(): Promise<string | null> {
  return getMeta('last_sync_at');
}
