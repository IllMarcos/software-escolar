// js/supabase.js
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

// REEMPLAZA CON TUS PROPIAS CLAVES
const supabaseUrl = 'https://izmhgmxsangscaonvjbv.supabase.co'; // Pega tu URL aquí
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml6bWhnbXhzYW5nc2Nhb252amJ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2MzI4MDMsImV4cCI6MjA3NjIwODgwM30.gLGne6xYMaOE3lEPYtmSN20sKIwBW7L8a9PXrkH1A94';       // Pega tu Anon Key aquí

// Exportamos el cliente de Supabase para usarlo en otros archivos
export const supabase = createClient(supabaseUrl, supabaseKey);