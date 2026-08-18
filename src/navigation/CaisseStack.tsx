import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { OperationsScreen } from '../screens/rapports/OperationsScreen';

export type CaisseStackParamList = {
  Operations: undefined;
};

const Stack = createNativeStackNavigator<CaisseStackParamList>();

export function CaisseStack(): React.JSX.Element {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Operations" component={OperationsScreen} />
    </Stack.Navigator>
  );
}
