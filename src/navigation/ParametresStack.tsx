import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { EtablissementsScreen } from '../screens/parametres/EtablissementsScreen';
import { UtilisateursScreen } from '../screens/parametres/UtilisateursScreen';
import { colors } from '../theme';

export type ParametresStackParamList = {
  ParametresHome: undefined;
  Etablissements: undefined;
};

const Stack = createNativeStackNavigator<ParametresStackParamList>();

export function ParametresStack(): React.JSX.Element {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
      }}
    >
      <Stack.Screen name="ParametresHome" component={UtilisateursScreen} />
      <Stack.Screen name="Etablissements" component={EtablissementsScreen} />
    </Stack.Navigator>
  );
}
