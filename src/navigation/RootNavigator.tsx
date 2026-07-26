import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import NetInfo from '@react-native-community/netinfo';
import { ActivityIndicator, AppState, type AppStateStatus, View } from 'react-native';
import { migrate } from '../db/client';
import { ensureEtablissementLocal } from '../db/etablissement';
import { ensureDefaultGerant } from '../db/users';
import { synchroniser } from '../sync';
import { useAuthStore } from '../store/authStore';
import { useEtablissementStore } from '../store/etablissementStore';
import { useSessionStore } from '../store/sessionStore';
import { ConnexionEtablissementScreen } from '../screens/auth/ConnexionEtablissementScreen';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { GerantTabs } from './GerantTabs';
import { ServeurTabs } from './ServeurTabs';
import { colors } from '../theme';

const Stack = createNativeStackNavigator();

export function RootNavigator(): React.JSX.Element {
  const currentUser = useAuthStore((s) => s.currentUser);
  const chargerEtablissement = useEtablissementStore((s) => s.charger);
  const session = useSessionStore((s) => s.session);
  const etablissementId = useSessionStore((s) => s.etablissementId);
  const sessionPrete = useSessionStore((s) => s.pret);
  const initialiserSession = useSessionStore((s) => s.initialiser);
  const [ready, setReady] = useState(false);
  const [localPret, setLocalPret] = useState(false);

  useEffect(() => {
    (async () => {
      await migrate();
      await initialiserSession();
      setReady(true);
    })();
  }, [initialiserSession]);

  useEffect(() => {
    if (!etablissementId) {
      setLocalPret(false);
      return;
    }
    (async () => {
      await ensureEtablissementLocal(etablissementId, 'Mon établissement');
      try {
        await synchroniser(etablissementId);
      } catch {
        // Pas de réseau au démarrage : on continue avec les données locales existantes.
      }
      await ensureDefaultGerant(etablissementId);
      await chargerEtablissement(etablissementId);
      setLocalPret(true);
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

const styles = {
  loading: {
    flex: 1,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: colors.background,
  },
};
