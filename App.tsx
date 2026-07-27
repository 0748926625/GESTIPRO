import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AlerteStockModal } from './src/components/AlerteStockModal';
import { RootNavigator } from './src/navigation/RootNavigator';
import { initialiserNotificationsStock } from './src/utils/notificationsStock';

export default function App(): React.JSX.Element {
  useEffect(() => {
    initialiserNotificationsStock().catch(() => {});
  }, []);

  return (
    <SafeAreaProvider>
      <RootNavigator />
      <AlerteStockModal />
      <StatusBar style="auto" />
    </SafeAreaProvider>
  );
}
