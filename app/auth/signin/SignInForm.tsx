'use client';

import { useEffect, useState } from 'react';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/app/lib/supabase';
import { useRouter } from 'next/navigation';

interface SignInFormProps {
  redirectTo: string;
}

export default function SignInForm({ redirectTo }: SignInFormProps) {
  const [supabase, setSupabase] = useState<ReturnType<typeof createClient<Database>> | null>(null);
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const client = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          persistSession: true,
          storageKey: 'supabase-auth'
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
          setIsLoggedIn(true);
          router.push(redirectTo || '/dashboard');
        } else {
          console.log('No active session found');
          setIsLoggedIn(false);
        }
      } catch (error) {
        console.error('Error checking auth status:', error);
      } finally {
        setLoading(false);
      }
    };
    
    checkUser();

    // Set up auth state change listener
    const { data: authListener } = client.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, session?.user?.email);
      if (event === 'SIGNED_IN' && session) {
        setIsLoggedIn(true);
        router.push(redirectTo || '/dashboard');
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [redirectTo, router]);

  if (loading) {
    return <div className="p-4 text-center">Loading...</div>;
  }

  if (isLoggedIn) {
    return <div className="p-4 text-center">Redirecting to dashboard...</div>;
  }

  if (!supabase) return null;

  return (
    <div className="rounded-lg border bg-white p-6 shadow-sm">
      <Auth
        supabaseClient={supabase}
        view="sign_in"
        appearance={{
          theme: ThemeSupa,
          variables: {
            default: {
              colors: {
                brand: '#6C40FF',
                brandAccent: '#8966FF',
                inputText: '#333333',
              },
              borderWidths: {
                buttonBorderWidth: '1px',
                inputBorderWidth: '1px',
              },
              radii: {
                borderRadiusButton: '0.375rem',
                buttonBorderRadius: '0.375rem',
                inputBorderRadius: '0.375rem',
              },
            },
          },
        }}
        providers={['google']}
        redirectTo={`${window.location.origin}${redirectTo}`}
        onlyThirdPartyProviders={false}
      />
    </div>
  );
} 