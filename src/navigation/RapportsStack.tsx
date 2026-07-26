import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RapportsScreen } from '../screens/rapports/RapportsScreen';
import { OperationsScreen } from '../screens/rapports/OperationsScreen';
import { ArchivesScreen } from '../screens/rapports/ArchivesScreen';
import { colors } from '../theme';

export type RapportsStackParamList = {
  Rapports: undefined;
  Operations: undefined;
  Archives: undefined;
};

const Stack = createNativeStackNavigator<RapportsStackParamList>();

export function RapportsStack(): React.JSX.Element {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
      }}
    >
      <Stack.Screen name="Rapports" component={RapportsScreen} options={{ title: 'Rapports' }} />
      <Stack.Screen name="Operations" component={OperationsScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Archives" component={ArchivesScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}
