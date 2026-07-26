import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { VentesStack } from './VentesStack';
import { StockStack } from './StockStack';
import { colors } from '../theme';

const Tab = createBottomTabNavigator();

const ICONES: Record<string, keyof typeof Ionicons.glyphMap> = {
  Ventes: 'cash-outline',
  Stock: 'cube-outline',
};

export function ServeurTabs(): React.JSX.Element {
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
      <Tab.Screen name="Ventes" component={VentesStack} options={{ title: 'Ventes' }} />
      <Tab.Screen name="Stock" component={StockStack} options={{ title: 'Stock' }} />
    </Tab.Navigator>
  );
}
