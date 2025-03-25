import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

// Haal de Supabase URL en anonymous key uit de environment variabelen
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase credentials missing! Check your .env.local file.');
}

// Singleton instance
let browserClient: ReturnType<typeof createClient<Database>> | null = null;

export function getBrowserSupabaseClient() {
  if (!browserClient) {
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Supabase credentials missing. Check your environment variables.');
    }
    
    console.log('Creating new Supabase client instance');
    browserClient = createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
        debug: process.env.NODE_ENV === 'development', // Debug alleen in development mode
        storage: localStorage, // Expliciet localStorage gebruiken
        storageKey: 'sb-auth-token', // Consistent gebruik van storage key
      },
    });
  }
  return browserClient;
}

export type { Database }; 