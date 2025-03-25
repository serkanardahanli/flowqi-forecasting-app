'use client';

import { ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { getBrowserSupabaseClient } from '@/app/lib/supabase';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const router = useRouter();
  const pathname = usePathname();

  const handleSignOut = async () => {
    const supabase = getBrowserSupabaseClient();
    await supabase.auth.signOut();
    router.push('/auth/signin');
  };

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: '📊' },
    { name: 'Budget', href: '/budget', icon: '💰' },
    { name: 'Omzet', href: '/omzet', icon: '💹' },
    { name: 'Uitgaven', href: '/uitgaven', icon: '📉' },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50">
      <div className="w-64 bg-[#6366F1] min-h-screen fixed">
        <div className="flex items-center justify-center h-16 px-4">
          <div className="text-white font-bold text-xl">FlowQi</div>
        </div>
        <nav className="mt-5 px-2 space-y-1">
          {navigation.map((item) => {
            const isCurrentPath = pathname?.startsWith(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                  isCurrentPath 
                    ? 'bg-[#4F46E5] text-white'
                    : 'text-white hover:bg-[#4F46E5] hover:text-white'
                }`}
              >
                <span className="mr-3">{item.icon}</span>
                {item.name}
              </Link>
            );
          })}
        </nav>
        <div className="absolute bottom-0 w-full p-4">
          <button
            onClick={handleSignOut}
            className="w-full flex items-center px-2 py-2 text-sm font-medium rounded-md text-white hover:bg-[#4F46E5]"
          >
            <span className="mr-3">🚪</span>
            Uitloggen
          </button>
        </div>
      </div>

      <div className="flex-1 ml-64">
        <header className="bg-white shadow-sm p-4">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-semibold text-[#6366F1]">
              FlowQi
            </h1>
          </div>
        </header>
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
} 