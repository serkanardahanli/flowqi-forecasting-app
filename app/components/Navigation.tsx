'use client';

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ChartBarIcon, 
  Cog6ToothIcon, 
  HomeIcon, 
  CurrencyEuroIcon,
  ShoppingBagIcon, 
  ClipboardDocumentListIcon,
  UsersIcon,
  CalculatorIcon
} from '@heroicons/react/24/outline';
import { getBrowserSupabaseClient } from '@/app/lib/supabase';

export default function Navigation() {
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
    { name: 'Omzet', href: '/omzet', icon: CurrencyEuroIcon },
    { name: 'Uitgaven', href: '/uitgaven', icon: ClipboardDocumentListIcon },
    { name: 'Producten', href: '/products', icon: ShoppingBagIcon },
    { name: 'Team', href: '/team', icon: UsersIcon },
    { name: 'Instellingen', href: '/settings', icon: Cog6ToothIcon },
  ];

  return (
    <div className="w-64 bg-[#002652] min-h-screen fixed">
      <div className="flex items-center justify-center h-16 px-4">
        <div className="flex-shrink-0">
          <img src="/logo.svg" alt="FlowQi Logo" className="h-12 w-auto" />
        </div>
      </div>
      <nav className="mt-5 px-2 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                isActive
                  ? 'bg-[#003b7a] text-white'
                  : 'text-gray-300 hover:bg-[#003b7a] hover:text-white'
              }`}
            >
              <item.icon
                className={`mr-3 flex-shrink-0 h-6 w-6 ${
                  isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-300'
                }`}
              />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* User profile section */}
      <div className="mt-auto pb-4 px-4 absolute bottom-0 w-full">
        <button
          onClick={handleSignOut}
          className="w-full flex items-center px-4 py-2 text-sm text-gray-300 hover:bg-[#003b7a] hover:text-white rounded-md"
        >
          <span>Uitloggen</span>
        </button>
      </div>
    </div>
  );
} 