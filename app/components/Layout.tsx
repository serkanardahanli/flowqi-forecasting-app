'use client';

import { ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { XMarkIcon, Bars3Icon } from '@heroicons/react/24/outline';
import { useState } from 'react';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Main content */}
      <main className="py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
} 