'use client';

import { useEffect } from 'react';
import { supabase } from '@/app/lib/supabase-client';

export default function AuthCheck({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        console.log('Auth check:', data, error);
        // No redirect for testing purposes
      } catch (err) {
        console.error('Auth check error:', err);
      }
    };
    
    checkAuth();
  }, []);

  // Always render children, even if not logged in
  return <>{children}</>;
} 