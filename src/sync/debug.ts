import { db, getMeta } from '../db/client';

export interface DiagnosticSync {
  dernierEnvoi: string | null;
  produitsMaxUpdatedAt: string | null;
  produitsNombreTotal: number;
  produitsAPousser: number;
}

// Diagnostic ponctuel pour comprendre pourquoi une modification de stock ne part pas :
// compare l'horodatage du dernier envoi réussi à ce qu'il y a réellement en local, sans
// passer par le réseau.
export async function diagnostiquerSyncProduits(): Promise<DiagnosticSync> {
  const dernierEnvoi = await getMeta('last_push_at');

  const global = await db.getFirstAsync<{ m: string | null; c: number }>(
    'SELECT MAX(updated_at) as m, COUNT(*) as c FROM produits'
  );

  const aPousser = dernierEnvoi
    ? await db.getFirstAsync<{ c: number }>(
        'SELECT COUNT(*) as c FROM produits WHERE updated_at > ?',
        [dernierEnvoi]
      )
    : null;

  return {
    dernierEnvoi,
    produitsMaxUpdatedAt: global?.m ?? null,
    produitsNombreTotal: global?.c ?? 0,
    produitsAPousser: dernierEnvoi ? (aPousser?.c ?? 0) : global?.c ?? 0,
  };
}
