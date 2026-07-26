import { create } from 'zustand';
import { getEtablissement } from '../db/etablissement';

interface EtablissementState {
  nom: string;
  logoUri: string | null;
  charger: (etablissementId: string) => Promise<void>;
  set: (nom: string, logoUri: string | null) => void;
}

export const useEtablissementStore = create<EtablissementState>((set) => ({
  nom: 'GestiPro',
  logoUri: null,
  charger: async (etablissementId) => {
    const e = await getEtablissement(etablissementId);
    set({ nom: e.nom, logoUri: e.logoUri });
  },
  set: (nom, logoUri) => set({ nom, logoUri }),
}));
