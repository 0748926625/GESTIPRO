import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

const CANAL_STOCK_BAS = 'stock-bas';

let initialise = false;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function initialiserNotificationsStock(): Promise<void> {
  if (initialise) return;
  initialise = true;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CANAL_STOCK_BAS, {
      name: 'Alerte stock bas',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 500, 250, 500, 250, 500],
      sound: 'default',
      enableVibrate: true,
      lightColor: '#9A1B2F',
    });
  }

  try {
    await Notifications.requestPermissionsAsync();
  } catch {
    // Permission refusée : la vibration locale et le modal restent actifs sans notification.
  }
}

export async function notifierStockBas(nomProduit: string, quantite: number, unite: string): Promise<void> {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Stock bas ⚠️',
        body: `${nomProduit} : il ne reste que ${quantite} ${unite}. Pensez à réapprovisionner.`,
        sound: true,
        vibrate: [0, 500, 250, 500, 250, 500],
      },
      trigger: Platform.OS === 'android' ? { channelId: CANAL_STOCK_BAS } : null,
    });
  } catch {
    // La notification système est un bonus ; le modal + la vibration in-app suffisent en secours.
  }
}
