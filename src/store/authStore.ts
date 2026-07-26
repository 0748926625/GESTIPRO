import { create } from 'zustand';
import type { User } from '../types';

interface AuthState {
  currentUser: User | null;
  login: (user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  currentUser: null,
  login: (user) => set({ currentUser: user }),
  logout: () => set({ currentUser: null }),
}));
