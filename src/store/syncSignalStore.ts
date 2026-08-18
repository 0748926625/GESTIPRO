import { create } from 'zustand';

// Compteur incrémenté à chaque synchro terminée (par sondage ou déclenchée par le temps
// réel). Les écrans qui affichent des données partagées (stock, opérations, notifications...)
// s'y abonnent pour se rafraîchir tout seuls même s'ils restent affichés sans navigation,
// ce que useFocusEffect seul ne permet pas (il ne se déclenche qu'au focus de l'écran).
interface SyncSignalState {
  version: number;
  bump: () => void;
}

export const useSyncSignalStore = create<SyncSignalState>((set) => ({
  version: 0,
  bump: () => set((s) => ({ version: s.version + 1 })),
}));
