'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  HomeIcon, 
  ChartBarIcon, 
  CurrencyDollarIcon,
  ReceiptPercentIcon,
  UsersIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Forecasts', href: '/dashboard/forecasts', icon: ChartBarIcon },
  { name: 'Products', href: '/dashboard/products', icon: CurrencyDollarIcon },
  { name: 'Expenses', href: '/dashboard/expenses', icon: ReceiptPercentIcon },
  { name: 'Team', href: '/dashboard/team', icon: UsersIcon },
  { name: 'Settings', href: '/dashboard/settings', icon: Cog6ToothIcon },
];

export default function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <div className="flex w-64 flex-col bg-white border-r">
      <div className="flex h-0 flex-1 flex-col overflow-y-auto pt-5 pb-4">
        <nav className="mt-5 flex-1 space-y-1 px-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href || (pathname && pathname.startsWith(`${item.href}/`));
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`group flex items-center rounded-md px-2 py-2 text-sm font-medium ${
                  isActive
                    ? 'bg-primary-100 text-primary-600'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <item.icon
                  className={`mr-3 h-5 w-5 flex-shrink-0 ${
                    isActive ? 'text-primary-500' : 'text-gray-400 group-hover:text-gray-500'
                  }`}
                  aria-hidden="true"
                />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
} 