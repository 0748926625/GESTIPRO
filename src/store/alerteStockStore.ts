import { create } from 'zustand';
import type { AlerteStock } from '../types';

interface AlerteStockState {
  produitEnAlerte: AlerteStock | null;
  declencher: (produit: AlerteStock) => void;
  fermer: () => void;
}

export const useAlerteStockStore = create<AlerteStockState>((set) => ({
  produitEnAlerte: null,
  declencher: (produit) => set({ produitEnAlerte: produit }),
  fermer: () => set({ produitEnAlerte: null }),
}));
