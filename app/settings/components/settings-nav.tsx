'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const navItems = [
  {
    title: 'Grootboekrekeningen',
    href: '/settings/gl-accounts',
  },
  {
    title: 'Productgroepen',
    href: '/settings/product-groups',
  },
  {
    title: 'Exact Online',
    href: '/settings/exact',
  },
];

export function SettingsNav() {
  const pathname = usePathname();

  return (
    <nav className="flex space-x-4 lg:flex-col lg:space-x-0 lg:space-y-1">
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            'justify-start px-3 py-2 text-sm font-medium rounded-md hover:bg-gray-100 dark:hover:bg-gray-800',
            pathname === item.href
              ? 'bg-gray-100 dark:bg-gray-800'
              : 'transparent'
          )}
        >
          {item.title}
        </Link>
      ))}
    </nav>
  );
} 