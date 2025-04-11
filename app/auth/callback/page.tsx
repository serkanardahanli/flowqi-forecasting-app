'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getBrowserSupabaseClient } from '@/app/lib/supabase';

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = getBrowserSupabaseClient();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get the auth code from the URL
        const code = searchParams.get('code');
        
        if (!code) {
          console.error('No code found in URL');
          router.push('/auth/login');
          return;
        }

        // Exchange the code for a session
        const { error } = await supabase.auth.exchangeCodeForSession(code);

        if (error) {
          console.error('Error exchanging code for session:', error);
          router.push('/auth/login');
          return;
        }

        // Get the return URL from the query parameters or default to the test page
        const returnUrl = searchParams.get('returnUrl') || '/settings/exact/test';
        console.log('Authentication successful, redirecting to:', returnUrl);
        
        // Redirect back to the original page
        router.push(returnUrl);
      } catch (err) {
        console.error('Unexpected error in callback:', err);
        router.push('/auth/login');
      }
    };

    handleCallback();
  }, [router, searchParams, supabase]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-black mb-4">
          Even geduld...
        </h2>
        <p className="text-black">
          We verwerken je inlog gegevens.
        </p>
      </div>
    </div>
  );
} 