'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: '📊' },
    { name: 'Budget', href: '/budget', icon: '💰' },
    { name: 'Omzet', href: '/omzet', icon: '💹' },
    { name: 'Uitgaven', href: '/uitgaven', icon: '📉' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-indigo-900 min-h-screen fixed">
        <div className="flex items-center justify-center h-16 px-4">
          <div className="text-white font-bold text-xl">FlowQi</div>
        </div>
        <nav className="mt-5 px-2 space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                  isActive
                    ? 'bg-indigo-800 text-white'
                    : 'text-indigo-100 hover:bg-indigo-800 hover:text-white'
                }`}
              >
                <span className="mr-3">{item.icon}</span>
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>
      
      {/* Main content */}
      <div className="flex-1 ml-64">
        <header className="bg-white shadow-sm p-4">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-semibold text-gray-800">
              {navigation.find(item => pathname === item.href)?.name || 'FlowQi'}
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