import { db, getMeta, setMeta } from '../db/client';
import { supabase } from '../lib/supabase';
import { useSyncErrorStore } from '../store/syncErrorStore';
import { useSyncSignalStore } from '../store/syncSignalStore';

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
  { nom: 'laveurs', champsBooleens: ['actif'] },
  { nom: 'mouvements_stock' },
  { nom: 'ventes' },
  { nom: 'vente_lignes' },
  { nom: 'operations_caisse' },
  { nom: 'notifications', champsBooleens: ['lue'] },
  { nom: 'clotures', champsJson: ['top_produits', 'repartition_paiement'] },
  { nom: 'fournisseurs', champsBooleens: ['actif'] },
];

async function pousserTable(config: TableSyncConfig, depuisISO: string | null): Promise<void> {
  // Ne repousse que ce qui a été modifié localement depuis le dernier envoi réussi : un envoi
  // aveugle de toutes les lignes à chaque cycle permettait à un appareil resté en retard de
  // republier sa copie périmée d'une ligne et de "gagner" la course simplement parce qu'il
  // synchronisait plus tard dans le temps réel (le trigger Postgres republie updated_at à
  // now() sur toute écriture, même une donnée obsolète) — ce qui faisait reculer le stock.
  const rows = depuisISO
    ? await db.getAllAsync<Record<string, unknown>>(
        `SELECT * FROM ${config.nom} WHERE updated_at > ?`,
        [depuisISO]
      )
    : await db.getAllAsync<Record<string, unknown>>(`SELECT * FROM ${config.nom}`);
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
    .select('nom, secteur, essai_fin, abonnement_actif, updated_at')
    .eq('id', etablissementId)
    .maybeSingle();
  if (error || !data) return;

  const local = await db.getFirstAsync<{ nom: string; secteur: string; updated_at: string }>(
    'SELECT nom, secteur, updated_at FROM etablissement WHERE id = ?',
    [etablissementId]
  );
  if (!local) return;

  // secteur / essai_fin / abonnement_actif sont fixés à la création ou gérés à la main côté
  // serveur (Supabase) : on les récupère toujours, sans jamais les renvoyer depuis l'appareil.
  await db.runAsync(
    'UPDATE etablissement SET secteur = ?, essai_fin = ?, abonnement_actif = ? WHERE id = ?',
    [data.secteur ?? 'maquis', data.essai_fin ?? null, data.abonnement_actif ? 1 : 0, etablissementId]
  );

  if (new Date(data.updated_at) > new Date(local.updated_at)) {
    await db.runAsync('UPDATE etablissement SET nom = ?, updated_at = ? WHERE id = ?', [
      data.nom,
      data.updated_at,
      etablissementId,
    ]);
  } else if (data.nom !== local.nom) {
    await supabase.from('etablissements').update({ nom: local.nom }).eq('id', etablissementId);
  }
}

export async function synchroniser(etablissementId: string): Promise<void> {
  const depuisDernierEnvoi = await getMeta('last_push_at');
  await synchroniserEtablissement(etablissementId);
  // Chaque table est isolée : un problème sur l'une (ex: policy RLS mal configurée sur une
  // table récente) ne doit jamais empêcher la synchro des autres tables (ex: le stock). Les
  // erreurs sont quand même collectées pour être remontées à la fin : les avaler entièrement
  // rendait les pannes de synchro invisibles, y compris sur le bouton "Synchroniser maintenant".
  const erreurs: string[] = [];
  for (const table of TABLES) {
    await tirerTable(table, etablissementId).catch((e) => {
      erreurs.push(e instanceof Error ? e.message : String(e));
    });
  }
  const maintenant = new Date().toISOString();
  let envoiReussi = true;
  for (const table of TABLES) {
    await pousserTable(table, depuisDernierEnvoi).catch((e) => {
      envoiReussi = false;
      erreurs.push(e instanceof Error ? e.message : String(e));
    });
  }
  // Le repère "dernier envoi" n'avance que si tout est parti : sinon, une ligne dont l'envoi a
  // échoué serait considérée comme déjà envoyée au prochain cycle et ne serait jamais réessayée.
  if (envoiReussi) {
    await setMeta('last_push_at', maintenant);
  }
  await setMeta('last_sync_at', maintenant);
  // Signale aux écrans déjà affichés (qui ne se rafraîchissent normalement qu'à la navigation)
  // que des données ont potentiellement changé, pour qu'ils se mettent à jour sans qu'il soit
  // nécessaire de quitter puis revenir sur l'écran.
  useSyncSignalStore.getState().bump();

  if (erreurs.length > 0) {
    const message = erreurs.join(' | ');
    useSyncErrorStore.getState().set(message);
    throw new Error(message);
  }
  useSyncErrorStore.getState().set(null);
}

export async function getDerniereSynchro(): Promise<string | null> {
  return getMeta('last_sync_at');
}
