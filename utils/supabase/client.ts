import { createBrowserClient } from '@supabase/ssr'

export const createClient = () => {
  console.log('Creating browser Supabase client');
  
  // Controleer de beschikbaarheid van de env vars
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('Supabase configuratie ontbreekt in browser client', {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseKey
    });
  } else {
    console.log('Browser using Supabase URL:', supabaseUrl);
    console.log('Browser using Supabase key length:', supabaseKey.length);
  }
  
  return createBrowserClient(
    supabaseUrl!,
    supabaseKey!,
    {
      cookies: {
        get(name) {
          // For client-side only
          const cookie = document.cookie
            .split('; ')
            .find((c) => c.startsWith(`${name}=`))
            ?.split('=')[1];
          console.log(`Getting cookie ${name} from browser:`, cookie ? 'found' : 'not found');
          return cookie;
        },
        getAll() {
          // Return all cookies as key-value pairs
          console.log('Getting all cookies from browser');
          return Object.fromEntries(
            document.cookie
              .split('; ')
              .map(c => {
                const [key, ...v] = c.split('=')
                return [key, v.join('=')]
              })
          )
        },
        set(name, value, options) {
          // Set a single cookie
          console.log(`Setting cookie ${name} in browser with length:`, value?.length || 0);
          let cookie = `${name}=${value}`
          if (options?.expires) {
            cookie += `; expires=${options.expires.toUTCString()}`
          }
          if (options?.path) {
            cookie += `; path=${options.path}`
          } else {
            cookie += `; path=/`
          }
          if (options?.domain) {
            cookie += `; domain=${options.domain}`
          }
          if (options?.sameSite) {
            cookie += `; samesite=${options.sameSite}`
          } else {
            cookie += `; samesite=lax`
          }
          if (options?.secure) {
            cookie += '; secure'
          }
          document.cookie = cookie
          console.log('Cookie set complete');
        },
        setAll(cookieStrings) {
          // Set multiple cookies from strings
          console.log(`Setting ${cookieStrings.length} cookies in browser`);
          for (const cookieString of cookieStrings) {
            document.cookie = cookieString
          }
        },
        remove(name, options) {
          // Remove a cookie by setting it with an expired date
          console.log(`Removing cookie ${name} from browser`);
          const cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=${options?.path || '/'}`
          document.cookie = cookie
        }
      },
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
        debug: true,
        storageKey: 'sb-auth-token'
      }
    }
  )
} 