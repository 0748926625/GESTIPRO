import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NouvelleVenteScreen } from '../screens/ventes/NouvelleVenteScreen';
import { HistoriqueVentesScreen } from '../screens/ventes/HistoriqueVentesScreen';
import { NouvelleRecetteScreen } from '../screens/ventes/NouvelleRecetteScreen';

export type VentesStackParamList = {
  NouvelleVente: undefined;
  HistoriqueVentes: undefined;
  NouvelleRecette: undefined;
};

const Stack = createNativeStackNavigator<VentesStackParamList>();

export function VentesStack(): React.JSX.Element {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="NouvelleVente" component={NouvelleVenteScreen} />
      <Stack.Screen name="HistoriqueVentes" component={HistoriqueVentesScreen} />
      <Stack.Screen name="NouvelleRecette" component={NouvelleRecetteScreen} />
    </Stack.Navigator>
  );
}
