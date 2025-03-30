import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/types/supabase'

// Helper function to get the browser client for Supabase
export function getBrowserSupabaseClient() {
  return createClientComponentClient<Database>()
}

export type { Database }; 