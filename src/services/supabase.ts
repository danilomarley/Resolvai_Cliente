import { createClient } from '@supabase/supabase-js';
import { demoMode } from './appMode';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Aviso no console caso o .env não tenha sido carregado corretamente
if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Faltam variáveis de ambiente do Supabase. Verifique o arquivo .env na raiz do projeto.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, demoMode
  ? { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
  : undefined);
