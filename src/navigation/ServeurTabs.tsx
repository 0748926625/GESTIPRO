import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { getSecteurConfig } from '../data/secteurs';
import { useEtablissementStore } from '../store/etablissementStore';
import { VentesStack } from './VentesStack';
import { StockStack } from './StockStack';
import { CaisseStack } from './CaisseStack';
import { colors } from '../theme';

const Tab = createBottomTabNavigator();

const ICONES: Record<string, keyof typeof Ionicons.glyphMap> = {
  Ventes: 'cash-outline',
  Operations: 'swap-vertical-outline',
};

export function ServeurTabs(): React.JSX.Element {
  const secteur = useEtablissementStore((s) => s.secteur);
  const config = getSecteurConfig(secteur);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarIcon: ({ color, size }) => (
          <Ionicons
            name={route.name === 'Stock' ? config.icone : ICONES[route.name]}
            color={color}
            size={size}
          />
        ),
      })}
    >
      <Tab.Screen name="Ventes" component={VentesStack} options={{ title: 'Ventes' }} />
      <Tab.Screen
        name="Stock"
        component={StockStack}
        options={{
          title: config.stockActif
            ? 'Stock'
            : config.libelleArticlePluriel.charAt(0).toUpperCase() +
              config.libelleArticlePluriel.slice(1),
        }}
      />
      <Tab.Screen name="Operations" component={CaisseStack} options={{ title: 'Opérations' }} />
    </Tab.Navigator>
  );
}
