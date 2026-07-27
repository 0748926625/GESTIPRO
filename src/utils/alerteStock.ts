import { Vibration } from 'react-native';
import { useAlerteStockStore } from '../store/alerteStockStore';
import { notifierStockBas } from './notificationsStock';
import type { AlerteStock } from '../types';

export function declencherAlerteStock(produit: AlerteStock): void {
  Vibration.vibrate([0, 500, 250, 500, 250, 500]);
  notifierStockBas(produit.nom, produit.quantiteStock, produit.unite).catch(() => {});
  useAlerteStockStore.getState().declencher(produit);
}
