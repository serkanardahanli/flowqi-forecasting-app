'use client';

import { useEffect, useState } from 'react';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/app/lib/database.types';
import { useRouter, useSearchParams } from 'next/navigation';

interface SignInFormProps {
  redirectTo: string;
}

export default function SignInForm({ redirectTo }: SignInFormProps) {
  const [supabase, setSupabase] = useState<ReturnType<typeof createBrowserClient<Database>> | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(searchParams.get('error'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const client = createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            const cookie = document.cookie
              .split('; ')
              .find((row) => row.startsWith(`${name}=`))
              ?.split('=')[1]
            return cookie
          },
          set(name: string, value: string, options: any) {
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
            document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=${options?.path || '/'}`
          },
        },
        auth: {
          flowType: 'pkce',
          detectSessionInUrl: true,
          persistSession: true,
          autoRefreshToken: true
        }
      }
    );
    
    setSupabase(client);
    
    // Check if user is already logged in
    const checkUser = async () => {
      try {
        setLoading(true);
        const { data: { session } } = await client.auth.getSession();
        if (session) {
          console.log('User is logged in, redirecting to dashboard...');
          router.push(redirectTo || '/dashboard');
        }
      } catch (error) {
        console.error('Error checking auth status:', error);
        setError('Er is een fout opgetreden bij het controleren van je login status.');
      } finally {
        setLoading(false);
      }
    };
    
    checkUser();

    // Set up auth state change listener
    const { data: authListener } = client.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, session?.user?.email);
      if (event === 'SIGNED_IN' && session) {
        router.push(redirectTo || '/dashboard');
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [redirectTo, router, searchParams]);

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center py-2">
        <div className="w-full max-w-md space-y-8">
          <div className="flex justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!supabase) return null;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-2">
      <div className="w-full max-w-md space-y-8">
        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Er is een fout opgetreden</h3>
                <div className="mt-2 text-sm text-red-700">{error}</div>
              </div>
            </div>
          </div>
        )}
        
        <Auth
          supabaseClient={supabase}
          view="sign_in"
          appearance={{ theme: ThemeSupa }}
          theme="light"
          showLinks={true}
          providers={['google']}
          redirectTo={`${window.location.origin}/auth/callback`}
          localization={{
            variables: {
              sign_in: {
                email_label: 'E-mailadres',
                password_label: 'Wachtwoord',
                button_label: 'Inloggen',
                loading_button_label: 'Inloggen...',
                social_provider_text: 'Inloggen met {{provider}}',
                link_text: 'Heb je al een account? Log in'
              },
              sign_up: {
                email_label: 'E-mailadres',
                password_label: 'Wachtwoord',
                button_label: 'Account aanmaken',
                loading_button_label: 'Account aanmaken...',
                social_provider_text: 'Aanmelden met {{provider}}',
                link_text: 'Nog geen account? Maak er een aan'
              }
            }
          }}
        />
      </div>
    </div>
  );
} 