import { supabase } from '../lib/supabase';
import { useRealtimeStatusStore } from '../store/realtimeStatusStore';
import { synchroniser } from './index';

// Tables métier écoutées en temps réel : dès qu'une ligne change côté serveur (peu importe
// l'appareil ou l'utilisateur à l'origine), on relance la synchro existante au lieu d'attendre
// le cycle habituel (jusqu'à 4 minutes). La base locale reste la source de vérité hors-ligne :
// ceci n'est qu'un déclencheur qui rapproche la propagation du temps réel.
const TABLES_TEMPS_REEL = [
  'users',
  'produits',
  'laveurs',
  'mouvements_stock',
  'ventes',
  'vente_lignes',
  'operations_caisse',
  'notifications',
  'clotures',
  'fournisseurs',
];

const DELAI_DEBOUNCE_MS = 800;

export function demarrerEcouteTempsReel(etablissementId: string): () => void {
  let minuteur: ReturnType<typeof setTimeout> | null = null;

  // Plusieurs tables changent souvent ensemble pour une seule action (ex: une recharge de
  // stock touche produits + mouvements_stock + notifications) : on regroupe ces évènements
  // rapprochés en un seul cycle de synchro au lieu d'en déclencher un par table.
  const resynchroniserBientot = (): void => {
    useRealtimeStatusStore.getState().noterEvenement();
    if (minuteur) clearTimeout(minuteur);
    minuteur = setTimeout(() => {
      synchroniser(etablissementId).catch(() => {});
    }, DELAI_DEBOUNCE_MS);
  };

  useRealtimeStatusStore.getState().set('connexion');
  const canal = supabase.channel(`realtime-${etablissementId}`);
  for (const table of TABLES_TEMPS_REEL) {
    canal.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'gestipro',
        table,
        filter: `etablissement_id=eq.${etablissementId}`,
      },
      resynchroniserBientot
    );
  }
  canal.subscribe((statut, err) => {
    if (statut === 'SUBSCRIBED') {
      useRealtimeStatusStore.getState().set('connecte');
    } else if (statut === 'CHANNEL_ERROR' || statut === 'TIMED_OUT') {
      useRealtimeStatusStore.getState().set('erreur', err?.message ?? statut);
    } else if (statut === 'CLOSED') {
      useRealtimeStatusStore.getState().set('ferme');
    }
  });

  return () => {
    if (minuteur) clearTimeout(minuteur);
    supabase.removeChannel(canal);
    useRealtimeStatusStore.getState().set('inactif');
  };
}
