'use server';

import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/app/lib/database.types'

export async function createServerSupabaseClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
} 