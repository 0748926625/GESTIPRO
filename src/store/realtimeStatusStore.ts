import { create } from 'zustand';

export type StatutTempsReel = 'inactif' | 'connexion' | 'connecte' | 'erreur' | 'ferme';

interface RealtimeStatusState {
  statut: StatutTempsReel;
  derniereErreur: string | null;
  dernierEvenement: string | null;
  set: (statut: StatutTempsReel, derniereErreur?: string | null) => void;
  noterEvenement: () => void;
}

export const useRealtimeStatusStore = create<RealtimeStatusState>((set) => ({
  statut: 'inactif',
  derniereErreur: null,
  dernierEvenement: null,
  set: (statut, derniereErreur = null) => set({ statut, derniereErreur }),
  noterEvenement: () => set({ dernierEvenement: new Date().toISOString() }),
}));
