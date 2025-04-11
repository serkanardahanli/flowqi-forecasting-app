'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getBrowserSupabaseClient } from '@/app/lib/supabase';
import { Button } from '@/app/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/app/components/ui/card';

// Helper function to get the base URL
function getBaseUrl() {
  // Als we een NEXT_PUBLIC_BASE_URL hebben (voor ngrok), gebruik die
  if (process.env.NEXT_PUBLIC_BASE_URL) {
    return process.env.NEXT_PUBLIC_BASE_URL;
  }
  // Anders, gebruik window.location.origin
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  // Fallback voor server-side
  return 'http://localhost:3000';
}

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = getBrowserSupabaseClient();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get the return URL from the query parameters or default to /settings/exact/test
  const returnUrl = searchParams.get('returnUrl') || '/settings/exact/test';

  useEffect(() => {
    // Check if already logged in
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        console.log('Already logged in, redirecting to:', returnUrl);
        router.push(returnUrl);
      }
    };
    checkSession();
  }, [returnUrl, router, supabase]);

  const handleLogin = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const baseUrl = getBaseUrl();
      console.log('Using base URL for callback:', baseUrl);

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${baseUrl}/auth/callback?returnUrl=${encodeURIComponent(returnUrl)}`
        }
      });

      if (error) {
        throw error;
      }

      if (!data.url) {
        throw new Error('Geen OAuth URL ontvangen van Supabase');
      }

      console.log('Redirecting to OAuth URL:', data.url);
      window.location.href = data.url;
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Er is een fout opgetreden tijdens het inloggen');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center text-2xl font-bold text-black">
            Inloggen bij FlowQi
          </CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 border-l-4 border-red-500 bg-red-50 p-4">
              <p className="text-black">{error}</p>
            </div>
          )}
          
          <div className="space-y-4">
            <p className="text-center text-black">
              Log in om toegang te krijgen tot de Exact Online integratie.
            </p>
            
            <Button
              onClick={handleLogin}
              disabled={isLoading}
              className="w-full bg-white hover:bg-gray-50 border border-gray-200"
              variant="outline"
            >
              <span className="text-black">
                {isLoading ? 'Bezig met inloggen...' : 'Inloggen met Google'}
              </span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 