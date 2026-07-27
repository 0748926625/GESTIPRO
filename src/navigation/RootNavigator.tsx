import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import NetInfo from '@react-native-community/netinfo';
import { ActivityIndicator, AppState, type AppStateStatus, StyleSheet, Text, View } from 'react-native';
import { migrate } from '../db/client';
import { ensureEtablissementLocal } from '../db/etablissement';
import { ensureDefaultGerant } from '../db/users';
import { synchroniser } from '../sync';
import { supabaseConfigOk } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { estAbonnementValide, useEtablissementStore } from '../store/etablissementStore';
import { useSessionStore } from '../store/sessionStore';
import { AbonnementExpireScreen } from '../screens/auth/AbonnementExpireScreen';
import { ConnexionEtablissementScreen } from '../screens/auth/ConnexionEtablissementScreen';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { GerantTabs } from './GerantTabs';
import { ServeurTabs } from './ServeurTabs';
import { colors, spacing } from '../theme';

const Stack = createNativeStackNavigator();

export function RootNavigator(): React.JSX.Element {
  const currentUser = useAuthStore((s) => s.currentUser);
  const chargerEtablissement = useEtablissementStore((s) => s.charger);
  const essaiFin = useEtablissementStore((s) => s.essaiFin);
  const abonnementActif = useEtablissementStore((s) => s.abonnementActif);
  const session = useSessionStore((s) => s.session);
  const etablissementId = useSessionStore((s) => s.etablissementId);
  const sessionPrete = useSessionStore((s) => s.pret);
  const initialiserSession = useSessionStore((s) => s.initialiser);
  const [ready, setReady] = useState(false);
  const [localPret, setLocalPret] = useState(false);
  const [erreurDemarrage, setErreurDemarrage] = useState<string | null>(null);

  useEffect(() => {
    if (!supabaseConfigOk) {
      setErreurDemarrage(
        "Configuration manquante : l'application n'a pas pu se connecter au serveur. Merci de contacter le support."
      );
      return;
    }
    (async () => {
      try {
        await migrate();
        await initialiserSession();
        setReady(true);
      } catch (e) {
        setErreurDemarrage(
          e instanceof Error ? e.message : "Une erreur inattendue est survenue au démarrage."
        );
      }
    })();
  }, [initialiserSession]);

  useEffect(() => {
    if (!etablissementId) {
      setLocalPret(false);
      return;
    }
    (async () => {
      try {
        await ensureEtablissementLocal(etablissementId, 'Mon établissement');
        try {
          await synchroniser(etablissementId);
        } catch {
          // Pas de réseau au démarrage : on continue avec les données locales existantes.
        }
        await ensureDefaultGerant(etablissementId);
        await chargerEtablissement(etablissementId);
        setLocalPret(true);
      } catch (e) {
        setErreurDemarrage(
          e instanceof Error ? e.message : "Une erreur inattendue est survenue au démarrage."
        );
      }
    })();
  }, [etablissementId, chargerEtablissement]);

  useEffect(() => {
    if (!etablissementId || !localPret) return;
    const desabonner = NetInfo.addEventListener((state) => {
      if (state.isConnected) {
        synchroniser(etablissementId).catch(() => {});
      }
    });
    return desabonner;
  }, [etablissementId, localPret]);

  useEffect(() => {
    if (!etablissementId || !localPret) return;

    const intervalle = setInterval(
      () => {
        synchroniser(etablissementId).catch(() => {});
      },
      4 * 60 * 1000
    );

    const abonnement = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        synchroniser(etablissementId).catch(() => {});
      }
    });

    return () => {
      clearInterval(intervalle);
      abonnement.remove();
    };
  }, [etablissementId, localPret]);

  if (erreurDemarrage) {
    return (
      <View style={styles.erreur}>
        <Text style={styles.erreurTitre}>Impossible de démarrer GestiPro</Text>
        <Text style={styles.erreurTexte}>{erreurDemarrage}</Text>
      </View>
    );
  }

  if (!ready || !sessionPrete || (etablissementId && !localPret)) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!session || !etablissementId ? (
          <Stack.Screen name="ConnexionEtablissement" component={ConnexionEtablissementScreen} />
        ) : !estAbonnementValide(essaiFin, abonnementActif) ? (
          <Stack.Screen name="AbonnementExpire" component={AbonnementExpireScreen} />
        ) : !currentUser ? (
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : currentUser.role === 'gerant' ? (
          <Stack.Screen name="GerantTabs" component={GerantTabs} />
        ) : (
          <Stack.Screen name="ServeurTabs" component={ServeurTabs} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  erreur: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    padding: spacing.lg,
  },
  erreurTitre: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  erreurTexte: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
