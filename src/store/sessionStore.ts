import type { Session } from '@supabase/supabase-js';
import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { Secteur } from '../types';

interface SessionState {
  session: Session | null;
  etablissementId: string | null;
  pret: boolean;
  initialiser: () => Promise<void>;
  inscrire: (email: string, motDePasse: string) => Promise<{ confirmationRequise: boolean }>;
  connecter: (email: string, motDePasse: string) => Promise<void>;
  completerEtablissement: (nomMaquis: string, secteur: Secteur) => Promise<void>;
  deconnecter: () => Promise<void>;
}

async function chargerEtablissementId(userId: string): Promise<string | null> {
  const { data } = await supabase
    .from('profils')
    .select('etablissement_id')
    .eq('id', userId)
    .maybeSingle();
  return data?.etablissement_id ?? null;
}

export const useSessionStore = create<SessionState>((set, get) => ({
  session: null,
  etablissementId: null,
  pret: false,

  initialiser: async () => {
    const { data } = await supabase.auth.getSession();
    const session = data.session;
    const etablissementId = session ? await chargerEtablissementId(session.user.id) : null;
    set({ session, etablissementId, pret: true });

    supabase.auth.onAuthStateChange((_event, nouvelleSession) => {
      set({ session: nouvelleSession });
      if (nouvelleSession) {
        chargerEtablissementId(nouvelleSession.user.id).then((id) => set({ etablissementId: id }));
      } else {
        set({ etablissementId: null });
      }
    });
  },

  inscrire: async (email, motDePasse) => {
    const { data, error } = await supabase.auth.signUp({ email, password: motDePasse });
    if (error) throw error;
    if (data.session) {
      set({ session: data.session, etablissementId: null });
    }
    return { confirmationRequise: !data.session };
  },

  connecter: async (email, motDePasse) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: motDePasse });
    if (error) throw error;
    const etablissementId = await chargerEtablissementId(data.user.id);
    set({ session: data.session, etablissementId });
  },

  completerEtablissement: async (nomMaquis, secteur) => {
    const userId = get().session?.user.id;
    if (!userId) throw new Error('Aucune session active.');

    const { data: etablissement, error: errEtablissement } = await supabase
      .from('etablissements')
      .insert({ nom: nomMaquis, owner_id: userId, secteur })
      .select()
      .single();
    if (errEtablissement) throw errEtablissement;

    const { error: errProfil } = await supabase
      .from('profils')
      .insert({ id: userId, etablissement_id: etablissement.id, nom: nomMaquis, role: 'gerant' });
    if (errProfil) throw errProfil;

    set({ etablissementId: etablissement.id });
  },

  deconnecter: async () => {
    await supabase.auth.signOut();
    set({ session: null, etablissementId: null });
  },
}));
