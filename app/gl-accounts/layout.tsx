'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { getBrowserSupabaseClient } from '@/app/lib/supabase';
import Sidebar from '@/app/components/shared/Sidebar';

export default function GLAccountsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkSession() {
      try {
        const supabase = getBrowserSupabaseClient();
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error checking auth session:', error);
          router.push('/auth/signin');
          return;
        }
        
        if (!session) {
          router.push('/auth/signin');
          return;
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Unexpected error in auth check:', error);
        router.push('/auth/signin');
      }
    }
    
    checkSession();
  }, [router]);

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-[#1E1E3F]"></div>
          <p className="text-xl font-medium text-gray-500">Laden...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
} 