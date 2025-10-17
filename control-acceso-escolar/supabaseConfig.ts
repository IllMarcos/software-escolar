// supabaseConfig.ts
import 'react-native-url-polyfill/auto'; // Necesario para que Supabase funcione en React Native
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://izmhgmxsangscaonvjbv.supabase.co'; // Tu URL de Supabase
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml6bWhnbXhzYW5nc2Nhb252amJ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2MzI4MDMsImV4cCI6MjA3NjIwODgwM30.gLGne6xYMaOE3lEPYtmSN20sKIwBW7L8a9PXrkH1A94'; // Tu Anon Key

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage, // Usa AsyncStorage para guardar la sesión
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});