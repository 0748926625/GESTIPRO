import { create } from 'zustand';

// Dernière erreur de synchro rencontrée, quel que soit le déclencheur (bouton manuel,
// minuteur, retour réseau, ou l'écoute temps réel) : ces derniers avalent tous l'erreur
// silencieusement (.catch(() => {})) pour ne jamais bloquer l'app, donc sans ce store
// une synchro qui échoue en tâche de fond serait totalement invisible.
interface SyncErrorState {
  derniereErreur: string | null;
  set: (erreur: string | null) => void;
}

export const useSyncErrorStore = create<SyncErrorState>((set) => ({
  derniereErreur: null,
  set: (derniereErreur) => set({ derniereErreur }),
}));
