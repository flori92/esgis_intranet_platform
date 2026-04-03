/**
 * Configuration Supabase pour l'application
 * Ce fichier réexporte simplement les éléments de supabase.js
 * pour maintenir la compatibilité avec les anciens imports.
 * 
 * @deprecated Utiliser directement import { supabase } from './supabase' 
 */
export { supabase, checkSupabaseConnection } from './supabase';

export const supabaseConfig = {
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
  supabaseKey: import.meta.env.VITE_SUPABASE_ANON_KEY
};
