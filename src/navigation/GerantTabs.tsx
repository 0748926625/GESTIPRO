import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { getSecteurConfig } from '../data/secteurs';
import { DashboardScreen } from '../screens/dashboard/DashboardScreen';
import { useEtablissementStore } from '../store/etablissementStore';
import { StockStack } from './StockStack';
import { VentesStack } from './VentesStack';
import { RapportsStack } from './RapportsStack';
import { ParametresStack } from './ParametresStack';
import { colors } from '../theme';

const Tab = createBottomTabNavigator();

const ICONES: Record<string, keyof typeof Ionicons.glyphMap> = {
  Dashboard: 'home-outline',
  Ventes: 'cash-outline',
  Rapports: 'bar-chart-outline',
  Parametres: 'people-outline',
};

export function GerantTabs(): React.JSX.Element {
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
      <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ title: 'Accueil' }} />
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
      <Tab.Screen name="Ventes" component={VentesStack} options={{ title: 'Ventes' }} />
      <Tab.Screen name="Rapports" component={RapportsStack} options={{ title: 'Rapports' }} />
      <Tab.Screen name="Parametres" component={ParametresStack} options={{ title: 'Paramètres' }} />
    </Tab.Navigator>
  );
}
