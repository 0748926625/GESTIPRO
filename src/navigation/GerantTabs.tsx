import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { DashboardScreen } from '../screens/dashboard/DashboardScreen';
import { StockStack } from './StockStack';
import { VentesStack } from './VentesStack';
import { RapportsStack } from './RapportsStack';
import { UtilisateursScreen } from '../screens/parametres/UtilisateursScreen';
import { colors } from '../theme';

const Tab = createBottomTabNavigator();

const ICONES: Record<string, keyof typeof Ionicons.glyphMap> = {
  Dashboard: 'home-outline',
  Stock: 'cube-outline',
  Ventes: 'cash-outline',
  Rapports: 'bar-chart-outline',
  Parametres: 'people-outline',
};

export function GerantTabs(): React.JSX.Element {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarIcon: ({ color, size }) => (
          <Ionicons name={ICONES[route.name]} color={color} size={size} />
        ),
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ title: 'Accueil' }} />
      <Tab.Screen name="Stock" component={StockStack} options={{ title: 'Stock' }} />
      <Tab.Screen name="Ventes" component={VentesStack} options={{ title: 'Ventes' }} />
      <Tab.Screen name="Rapports" component={RapportsStack} options={{ title: 'Rapports' }} />
      <Tab.Screen name="Parametres" component={UtilisateursScreen} options={{ title: 'Paramètres' }} />
    </Tab.Navigator>
  );
}
