import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Session } from '@supabase/supabase-js';
import { create } from 'zustand';
import { viderDonneesEtablissement } from '../db/client';
import { ensureEtablissementLocal } from '../db/etablissement';
import { importerProduitsDepuis } from '../db/importProduits';
import { ensureDefaultGerant } from '../db/users';
import { supabase } from '../lib/supabase';
import { synchroniser } from '../sync';
import type { Secteur } from '../types';
import { useAuthStore } from './authStore';

const CLE_ETABLISSEMENT_ACTIF = 'gestipro_etablissement_actif_id';

export interface EtablissementMembre {
  etablissementId: string;
  nom: string;
  secteur: Secteur;
}

interface SessionState {
  session: Session | null;
  etablissementId: string | null;
  etablissements: EtablissementMembre[];
  changementEnCours: boolean;
  pret: boolean;
  initialiser: () => Promise<void>;
  inscrire: (email: string, motDePasse: string) => Promise<{ confirmationRequise: boolean }>;
  connecter: (email: string, motDePasse: string) => Promise<void>;
  completerEtablissement: (nomMaquis: string, secteur: Secteur) => Promise<void>;
  creerEtablissement: (nom: string, secteur: Secteur) => Promise<string>;
  creerEtablissementEtBasculer: (
    nom: string,
    secteur: Secteur,
    sourceEtablissementIdPourImport?: string
  ) => Promise<string>;
  changerEtablissement: (etablissementId: string) => Promise<void>;
  deconnecter: () => Promise<void>;
}

async function chargerMemberships(userId: string): Promise<EtablissementMembre[]> {
  const { data: memberships } = await supabase
    .from('memberships')
    .select('etablissement_id')
    .eq('user_id', userId);
  if (!memberships || memberships.length === 0) return [];

  const ids = memberships.map((m) => m.etablissement_id as string);
  const { data: etablissements } = await supabase
    .from('etablissements')
    .select('id, nom, secteur')
    .in('id', ids);
  return (etablissements ?? []).map((e) => ({
    etablissementId: e.id as string,
    nom: e.nom as string,
    secteur: (e.secteur as Secteur) ?? 'maquis',
  }));
}

async function determinerEtablissementActif(liste: EtablissementMembre[]): Promise<string | null> {
  if (liste.length === 0) return null;
  const sauvegarde = await AsyncStorage.getItem(CLE_ETABLISSEMENT_ACTIF);
  const correspond = liste.find((e) => e.etablissementId === sauvegarde);
  return (correspond ?? liste[0]).etablissementId;
}

export const useSessionStore = create<SessionState>((set, get) => ({
  session: null,
  etablissementId: null,
  etablissements: [],
  changementEnCours: false,
  pret: false,

  initialiser: async () => {
    const { data } = await supabase.auth.getSession();
    const session = data.session;
    const etablissements = session ? await chargerMemberships(session.user.id) : [];
    const etablissementId = await determinerEtablissementActif(etablissements);
    set({ session, etablissements, etablissementId, pret: true });

    supabase.auth.onAuthStateChange(async (_event, nouvelleSession) => {
      set({ session: nouvelleSession });
      if (nouvelleSession) {
        const liste = await chargerMemberships(nouvelleSession.user.id);
        const actif = await determinerEtablissementActif(liste);
        set({ etablissements: liste, etablissementId: actif });
      } else {
        set({ etablissements: [], etablissementId: null });
      }
    });
  },

  inscrire: async (email, motDePasse) => {
    const { data, error } = await supabase.auth.signUp({ email, password: motDePasse });
    if (error) throw error;
    if (data.session) {
      set({ session: data.session, etablissements: [], etablissementId: null });
    }
    return { confirmationRequise: !data.session };
  },

  connecter: async (email, motDePasse) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: motDePasse });
    if (error) throw error;
    const etablissements = await chargerMemberships(data.user.id);
    const etablissementId = await determinerEtablissementActif(etablissements);
    if (etablissementId) await AsyncStorage.setItem(CLE_ETABLISSEMENT_ACTIF, etablissementId);
    set({ session: data.session, etablissements, etablissementId });
  },

  creerEtablissement: async (nom, secteur) => {
    const userId = get().session?.user.id;
    if (!userId) throw new Error('Aucune session active.');

    const essaiFin = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data: etablissement, error: errEtablissement } = await supabase
      .from('etablissements')
      .insert({ nom, owner_id: userId, secteur, essai_fin: essaiFin })
      .select()
      .single();
    if (errEtablissement) throw errEtablissement;

    const { error: errMembership } = await supabase
      .from('memberships')
      .insert({ user_id: userId, etablissement_id: etablissement.id, nom, role: 'gerant' });
    if (errMembership) throw errMembership;

    const nouveau: EtablissementMembre = { etablissementId: etablissement.id, nom, secteur };
    set((s) => ({ etablissements: [...s.etablissements, nouveau] }));
    return etablissement.id as string;
  },

  completerEtablissement: async (nomMaquis, secteur) => {
    const id = await get().creerEtablissement(nomMaquis, secteur);
    await AsyncStorage.setItem(CLE_ETABLISSEMENT_ACTIF, id);
    set({ etablissementId: id });
  },

  creerEtablissementEtBasculer: async (nom, secteur, sourceEtablissementIdPourImport) => {
    const actuel = get().etablissementId;
    set({ changementEnCours: true });
    try {
      const nouvelId = await get().creerEtablissement(nom, secteur);

      if (actuel) {
        try {
          await synchroniser(actuel);
        } catch {
          // Pas de réseau : on bascule quand même, la synchro reprendra plus tard.
        }
      }
      await viderDonneesEtablissement();
      // Bootstrap local fait ici (avant d'exposer le nouvel etablissementId) pour pouvoir
      // importer les produits tout de suite après ; l'effet de RootNavigator rejouera ces
      // mêmes étapes ensuite sans effet de bord (ensureEtablissementLocal/synchroniser sont
      // idempotents).
      await ensureEtablissementLocal(nouvelId, nom, secteur);
      try {
        await synchroniser(nouvelId);
      } catch {
        // Pas de réseau : le nouvel établissement reste utilisable hors-ligne.
      }
      await ensureDefaultGerant(nouvelId);

      if (sourceEtablissementIdPourImport) {
        await importerProduitsDepuis(sourceEtablissementIdPourImport, nouvelId);
        try {
          await synchroniser(nouvelId);
        } catch {
          // Les produits importés restent en local, le push se fera à la prochaine synchro.
        }
      }

      await AsyncStorage.setItem(CLE_ETABLISSEMENT_ACTIF, nouvelId);
      useAuthStore.getState().logout();
      set({ etablissementId: nouvelId });
      return nouvelId;
    } finally {
      set({ changementEnCours: false });
    }
  },

  changerEtablissement: async (etablissementId) => {
    const actuel = get().etablissementId;
    if (actuel === etablissementId) return;
    set({ changementEnCours: true });
    try {
      if (actuel) {
        try {
          await synchroniser(actuel);
        } catch {
          // Pas de réseau : on bascule quand même, les changements locaux non
          // synchronisés de l'établissement quitté attendront la prochaine connexion.
        }
      }
      await viderDonneesEtablissement();
      await AsyncStorage.setItem(CLE_ETABLISSEMENT_ACTIF, etablissementId);
      useAuthStore.getState().logout();
      set({ etablissementId });
    } finally {
      set({ changementEnCours: false });
    }
  },

  deconnecter: async () => {
    await supabase.auth.signOut();
    await AsyncStorage.removeItem(CLE_ETABLISSEMENT_ACTIF);
    await viderDonneesEtablissement();
    set({ session: null, etablissementId: null, etablissements: [] });
  },
}));
