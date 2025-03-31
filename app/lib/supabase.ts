import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

// Helper function to get the browser client for Supabase
export function getBrowserSupabaseClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export type { Database }; 