import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { DashboardScreen } from '../screens/dashboard/DashboardScreen';
import { NotificationsScreen } from '../screens/notifications/NotificationsScreen';

export type DashboardStackParamList = {
  Dashboard: undefined;
  Notifications: undefined;
};

const Stack = createNativeStackNavigator<DashboardStackParamList>();

export function DashboardStack(): React.JSX.Element {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Dashboard" component={DashboardScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
    </Stack.Navigator>
  );
}
