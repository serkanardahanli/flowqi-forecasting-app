'use client';

import { ReactNode, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getBrowserSupabaseClient } from '@/app/lib/supabase';
import { PlusIcon, PencilIcon, TrashIcon, XMarkIcon, Bars3Icon } from '@heroicons/react/24/outline';
import UserMenu from '@/app/components/UserMenu';

interface MainLayoutProps {
  children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleSignOut = async () => {
    const supabase = getBrowserSupabaseClient();
    await supabase.auth.signOut();
    router.push('/auth/signin');
  };

  const navigationItems = [
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'Grootboekrekeningen', href: '/gl-accounts' },
    { name: 'Producten', href: '/products' },
    {
      name: 'Omzet',
      href: '#',
      children: [
        { name: 'SaaS', href: '/revenue/saas' },
        { name: 'Consultancy', href: '/revenue/consultancy' }
      ]
    },
    {
      name: 'Begroting',
      href: '#',
      children: [
        { name: 'Uitgaven', href: '/budget/expenses' },
        { name: 'Overzicht', href: '/budget' }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-[#1E1E3F]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 relative">
                <button 
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="text-white font-bold text-lg flex items-center"
                >
                  <span>FlowQi</span>
                  <svg className="w-5 h-5 ml-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>

                {/* Desktop dropdown menu */}
                {dropdownOpen && (
                  <div className="absolute left-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-20">
                    <div className="py-1" role="menu" aria-orientation="vertical">
                      {navigationItems.map((item) => 
                        item.children ? (
                          <div key={item.name} className="relative group">
                            <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 focus:outline-none">
                              {item.name}
                            </button>
                            <div className="absolute left-full mt-0 top-0 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 z-10 hidden group-hover:block">
                              {item.children.map(child => (
                                <a
                                  key={child.name}
                                  href={child.href}
                                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                >
                                  {child.name}
                                </a>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <a
                            key={item.name}
                            href={item.href}
                            className={`block px-4 py-2 text-sm ${
                              pathname === item.href
                                ? 'bg-gray-100 text-gray-900'
                                : 'text-gray-700 hover:bg-gray-100'
                            }`}
                          >
                            {item.name}
                          </a>
                        )
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="hidden md:block">
              <div className="ml-4 flex items-center md:ml-6">
                <UserMenu />
              </div>
            </div>
            <div className="-mr-2 flex md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="bg-[#3B3B7C] inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-[#4B4BAC] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#3B3B7C] focus:ring-white"
              >
                <span className="sr-only">Open main menu</span>
                {mobileMenuOpen ? (
                  <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
                ) : (
                  <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              {navigationItems.map((item) => (
                <div key={item.name}>
                  {item.children ? (
                    <>
                      <p className="text-gray-300 px-3 py-2 text-sm font-medium">
                        {item.name}
                      </p>
                      <div className="pl-4">
                        {item.children.map(child => (
                          <a
                            key={child.name}
                            href={child.href}
                            className="block text-gray-300 hover:bg-[#3B3B7C] hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                          >
                            {child.name}
                          </a>
                        ))}
                      </div>
                    </>
                  ) : (
                    <a
                      href={item.href}
                      className={`${
                        pathname === item.href
                          ? 'bg-[#3B3B7C] text-white'
                          : 'text-gray-300 hover:bg-[#3B3B7C] hover:text-white'
                      } block px-3 py-2 rounded-md text-sm font-medium`}
                    >
                      {item.name}
                    </a>
                  )}
                </div>
              ))}
            </div>
            <div className="pt-4 pb-3 border-t border-gray-700">
              <div className="px-2">
                <UserMenu />
              </div>
            </div>
          </div>
        )}
      </nav>

      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          {/* Page header wordt gerenderd in elke page component */}
        </div>
      </header>

      <main>
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
} 