import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StockListScreen } from '../screens/stock/StockListScreen';
import { ProduitFormScreen } from '../screens/stock/ProduitFormScreen';
import { MouvementStockScreen } from '../screens/stock/MouvementStockScreen';
import { colors } from '../theme';

export type StockStackParamList = {
  StockList: undefined;
  ProduitForm: { produitId?: string };
  MouvementStock: { produitId: string; nomProduit: string };
};

const Stack = createNativeStackNavigator<StockStackParamList>();

export function StockStack(): React.JSX.Element {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
      }}
    >
      <Stack.Screen name="StockList" component={StockListScreen} options={{ title: 'Stock' }} />
      <Stack.Screen name="ProduitForm" component={ProduitFormScreen} options={{ headerShown: false }} />
      <Stack.Screen
        name="MouvementStock"
        component={MouvementStockScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}
