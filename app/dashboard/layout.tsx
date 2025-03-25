'use client';

import { ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getBrowserSupabaseClient } from '@/app/lib/supabase';
import Logo from '@/app/components/Logo';
import Link from 'next/link';
import { 
  ChartBarIcon, 
  Cog6ToothIcon, 
  HomeIcon, 
  ShoppingBagIcon, 
  ClipboardDocumentListIcon,
  UsersIcon,
  CalculatorIcon
} from '@heroicons/react/24/outline';

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();

  const handleSignOut = async () => {
    const supabase = getBrowserSupabaseClient();
    await supabase.auth.signOut();
    router.push('/auth/signin');
  };

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
    { name: 'Budget', href: '/budget', icon: CalculatorIcon },
    { name: 'Forecasts', href: '/forecasts', icon: ChartBarIcon },
    { name: 'Products', href: '/products', icon: ShoppingBagIcon },
    { name: 'Team', href: '/team', icon: UsersIcon },
    { name: 'Settings', href: '/settings', icon: Cog6ToothIcon },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top navigation */}
      <div className="flex justify-between items-center p-4 bg-white shadow-sm">
        <div className="flex-shrink-0 flex items-center pl-4">
          <Logo />
        </div>
        
        <div className="pr-4">
          <button
            onClick={handleSignOut}
            className="bg-white px-4 py-2 rounded-md text-gray-600 hover:text-gray-800 hover:bg-gray-100 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#6366F1]"
          >
            Uitloggen
          </button>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-white shadow-sm h-[calc(100vh-4rem)] fixed">
          <nav className="mt-5 px-2">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-600'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <item.icon
                    className={`mr-3 flex-shrink-0 h-6 w-6 ${
                      isActive ? 'text-indigo-600' : 'text-gray-400 group-hover:text-gray-500'
                    }`}
                  />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Main content */}
        <main className="flex-1 ml-64 py-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
} 