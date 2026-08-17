import { create } from 'zustand';
import { getEtablissement } from '../db/etablissement';
import type { Secteur } from '../types';

interface EtablissementState {
  nom: string;
  logoUri: string | null;
  secteur: Secteur;
  essaiFin: string | null;
  abonnementActif: boolean;
  charger: (etablissementId: string) => Promise<void>;
  set: (nom: string, logoUri: string | null) => void;
}

export const useEtablissementStore = create<EtablissementState>((set) => ({
  nom: 'GestiPro',
  logoUri: null,
  secteur: 'maquis',
  essaiFin: null,
  abonnementActif: false,
  charger: async (etablissementId) => {
    const e = await getEtablissement(etablissementId);
    set({
      nom: e.nom,
      logoUri: e.logoUri,
      secteur: e.secteur,
      essaiFin: e.essaiFin,
      abonnementActif: e.abonnementActif,
    });
  },
  set: (nom, logoUri) => set({ nom, logoUri }),
}));

export function estAbonnementValide(_essaiFin: string | null, _abonnementActif: boolean): boolean {
  return true;
}
