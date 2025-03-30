'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function DashboardPage() {
  const router = useRouter();
  
  useEffect(() => {
    const checkSession = async () => {
      try {
        const supabase = createClientComponentClient();
        const { data, error } = await supabase.auth.getSession();
        
        console.log('Dashboard session check:', {
          hasSession: !!data.session,
          error: error ? true : false
        });
        
        if (error || !data.session) {
          router.push('/auth/signin');
          return;
        }
      } catch (err) {
        console.error('Session check error:', err);
        router.push('/auth/signin');
      }
    };
    
    checkSession();
  }, [router]);

  return (
    <div className="p-6">
      <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
        <div className="px-4 py-5 sm:px-6">
          <h1 className="text-xl font-semibold">Dashboard</h1>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Welkom op het dashboard van FlowQi
          </p>
        </div>
        <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
          <p className="text-center text-gray-600">
            De dashboard wordt vereenvoudigd weergegeven om CSS problemen op te lossen.
          </p>
        </div>
      </div>
    </div>
  );
} 