import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { getSecteurConfig } from '../data/secteurs';
import { StockListScreen } from '../screens/stock/StockListScreen';
import { ProduitFormScreen } from '../screens/stock/ProduitFormScreen';
import { MouvementStockScreen } from '../screens/stock/MouvementStockScreen';
import { HistoriqueMouvementsScreen } from '../screens/stock/HistoriqueMouvementsScreen';
import { useEtablissementStore } from '../store/etablissementStore';
import { colors } from '../theme';

export type StockStackParamList = {
  StockList: undefined;
  ProduitForm: { produitId?: string };
  MouvementStock: { produitId: string; nomProduit: string };
  HistoriqueMouvements: undefined;
};

const Stack = createNativeStackNavigator<StockStackParamList>();

export function StockStack(): React.JSX.Element {
  const secteur = useEtablissementStore((s) => s.secteur);
  const config = getSecteurConfig(secteur);
  const titre = config.stockActif
    ? 'Stock'
    : config.libelleArticlePluriel.charAt(0).toUpperCase() + config.libelleArticlePluriel.slice(1);

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
      }}
    >
      <Stack.Screen name="StockList" component={StockListScreen} options={{ title: titre }} />
      <Stack.Screen name="ProduitForm" component={ProduitFormScreen} options={{ headerShown: false }} />
      <Stack.Screen
        name="MouvementStock"
        component={MouvementStockScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="HistoriqueMouvements"
        component={HistoriqueMouvementsScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}
