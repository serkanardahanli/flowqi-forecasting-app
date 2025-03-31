import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/app/lib/database.types'

export function useSupabase() {
  const [supabase] = useState(() => 
    createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  )

  return { supabase }
} 