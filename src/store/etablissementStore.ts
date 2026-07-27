import { create } from 'zustand';
import { getEtablissement } from '../db/etablissement';
import type { Secteur } from '../types';

interface EtablissementState {
  nom: string;
  logoUri: string | null;
  secteur: Secteur;
  charger: (etablissementId: string) => Promise<void>;
  set: (nom: string, logoUri: string | null) => void;
}

export const useEtablissementStore = create<EtablissementState>((set) => ({
  nom: 'GestiPro',
  logoUri: null,
  secteur: 'maquis',
  charger: async (etablissementId) => {
    const e = await getEtablissement(etablissementId);
    set({ nom: e.nom, logoUri: e.logoUri, secteur: e.secteur });
  },
  set: (nom, logoUri) => set({ nom, logoUri }),
}));
