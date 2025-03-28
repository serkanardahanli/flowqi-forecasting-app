import { createBrowserClient } from '@supabase/ssr'
import { type CookieOptions } from '@supabase/ssr'

// Type for the database - adjust according to your project
import type { Database } from '@/types/supabase'

// Helper for browser-only client
export function getBrowserSupabaseClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          if (typeof window === 'undefined') return null
          const cookie = document.cookie
            .split('; ')
            .find((row) => row.startsWith(`${name}=`))
            ?.split('=')[1]
          return cookie
        },
        set(name: string, value: string, options: CookieOptions) {
          if (typeof window === 'undefined') return
          let cookie = `${name}=${value}`
          if (options?.expires) {
            cookie += `; expires=${options.expires.toUTCString()}`
          }
          if (options?.path) {
            cookie += `; path=${options.path}`
          } else {
            cookie += `; path=/`
          }
          if (options?.sameSite) {
            cookie += `; samesite=${options.sameSite}`
          } else {
            cookie += `; samesite=lax`
          }
          if (options?.secure || process.env.NODE_ENV === 'production') {
            cookie += `; secure`
          }
          document.cookie = cookie
        },
        remove(name: string, options: CookieOptions) {
          if (typeof window === 'undefined') return
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=${options?.path || '/'}`
        },
      },
    }
  )
}

export type { Database }; 