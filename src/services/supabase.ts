import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Aviso no console caso o .env não tenha sido carregado corretamente
if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Faltam variáveis de ambiente do Supabase. Verifique o arquivo .env na raiz do projeto.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);