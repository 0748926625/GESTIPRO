import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

export const supabaseConfigOk = Boolean(supabaseUrl && supabaseAnonKey);

if (!supabaseConfigOk) {
  console.warn(
    'EXPO_PUBLIC_SUPABASE_URL et EXPO_PUBLIC_SUPABASE_ANON_KEY ne sont pas définis. ' +
      "L'application affichera un écran de configuration manquante."
  );
}

export const supabase = createClient(
  supabaseConfigOk ? supabaseUrl : 'https://placeholder.supabase.co',
  supabaseConfigOk ? supabaseAnonKey : 'placeholder-anon-key',
  {
    db: { schema: 'gestipro' },
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);
