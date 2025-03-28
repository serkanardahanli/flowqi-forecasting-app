import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/app/lib/database.types'

export function useSupabase() {
  const [supabase] = useState(() => 
    createBrowserClient<Database>(
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
          set(name: string, value: string, options: any) {
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
          remove(name: string, options: any) {
            if (typeof window === 'undefined') return
            document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=${options?.path || '/'}`
          },
        },
        auth: {
          flowType: 'pkce',
          detectSessionInUrl: true,
          persistSession: true,
          autoRefreshToken: true,
          storage: {
            getItem: (key) => {
              if (typeof window === 'undefined') return null
              const value = document.cookie
                .split('; ')
                .find((row) => row.startsWith(`${key}=`))
                ?.split('=')[1]
              try {
                return value ? JSON.parse(decodeURIComponent(value)) : null
              } catch (e) {
                return null
              }
            },
            setItem: (key, value) => {
              if (typeof window === 'undefined') return
              document.cookie = `${key}=${encodeURIComponent(JSON.stringify(value))}; path=/; max-age=31536000; samesite=lax`
            },
            removeItem: (key) => {
              if (typeof window === 'undefined') return
              document.cookie = `${key}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`
            },
          },
        }
      }
    )
  )

  useEffect(() => {
    const initializeSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error) throw error
        if (!session) {
          // If no session, redirect to sign in
          window.location.href = '/auth/signin'
        }
      } catch (error) {
        console.error('Error initializing session:', error)
        window.location.href = '/auth/signin'
      }
    }

    // Only run on client-side
    if (typeof window !== 'undefined') {
      initializeSession()
    }
  }, [supabase])

  return { supabase }
} 