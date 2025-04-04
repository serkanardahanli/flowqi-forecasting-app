'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  HomeIcon, 
  CurrencyDollarIcon, 
  CogIcon,
  BookOpenIcon,
  ArchiveBoxIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';

// Menustructuur definities
const menuStructure = [
  {
    id: 'home',
    label: 'Dashboard',
    icon: <HomeIcon className="h-5 w-5 mr-3" />,
    path: '/',
    type: 'standalone'
  },
  {
    id: 'products',
    label: 'Producten',
    icon: <ArchiveBoxIcon className="h-5 w-5 mr-3" />,
    type: 'expandable',
    submenu: [
      { path: '/products', label: 'Overzicht' },
      { path: '/products/manage', label: 'Beheer' }
    ]
  },
  {
    id: 'revenue',
    label: 'Omzet',
    icon: <ArrowTrendingUpIcon className="h-5 w-5 mr-3" />,
    type: 'expandable',
    submenu: [
      { path: '/revenue', label: 'Overzicht' },
      { path: '/actual/revenue', label: 'Registratie' },
      { path: '/budget/revenue', label: 'Begroting' }
    ]
  },
  {
    id: 'expenses',
    label: 'Uitgaven',
    icon: <ArrowTrendingDownIcon className="h-5 w-5 mr-3" />,
    type: 'expandable',
    submenu: [
      { path: '/expenses', label: 'Overzicht' },
      { path: '/actual/expenses', label: 'Registratie' },
      { path: '/budget/expenses', label: 'Begroting' }
    ]
  },
  {
    id: 'settings',
    label: 'Instellingen',
    icon: <CogIcon className="h-5 w-5 mr-3" />,
    type: 'expandable',
    submenu: [
      { path: '/settings', label: 'Algemeen' },
      { path: '/settings/gl-accounts', label: 'Grootboekrekeningen' },
      { path: '/settings/product-groups', label: 'Productgroepen' }
    ]
  }
];

const Sidebar = () => {
  const pathname = usePathname();
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [currentTime, setCurrentTime] = useState<string>('');

  // Automatisch relevante secties uitklappen op basis van de huidige URL
  useEffect(() => {
    const newExpandedSections = new Set<string>();
    
    menuStructure.forEach(item => {
      if (item.type === 'expandable' && item.submenu) {
        const shouldExpand = item.submenu.some(subItem => 
          pathname?.startsWith(subItem.path)
        );
        
        if (shouldExpand) {
          newExpandedSections.add(item.id);
        }
      }
    });
    
    setExpandedSections(newExpandedSections);
  }, [pathname]);

  // Client-side tijd bijwerken om hydration errors te voorkomen
  useEffect(() => {
    // Update tijd direct
    setCurrentTime(new Date().toLocaleTimeString());
    
    // Stel interval in om tijd elke seconde bij te werken
    const interval = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    
    // Clean up interval on unmount
    return () => clearInterval(interval);
  }, []);

  // Helper functie om te controleren of een link actief is
  const isActive = (path: string) => {
    if (path === '/') {
      return pathname === '/';
    }
    return pathname?.startsWith(path);
  };

  // Toggle sectie uitklappen
  const toggleSection = (section: string) => {
    const newExpandedSections = new Set(expandedSections);
    if (newExpandedSections.has(section)) {
      newExpandedSections.delete(section);
    } else {
      newExpandedSections.add(section);
    }
    setExpandedSections(newExpandedSections);
  };

  return (
    <div className="w-64 h-full bg-white border-r border-gray-200 flex flex-col shadow-sm">
      {/* Logo en app naam */}
      <div className="p-5 border-b border-gray-200">
        <h1 className="text-xl font-bold text-indigo-600">FlowQi</h1>
        <p className="text-xs text-gray-600">Financieel overzicht</p>
      </div>
      
      {/* Navigatie links */}
      <nav className="flex-1 overflow-y-auto p-4">
        <ul className="space-y-1">
          {menuStructure.map((item) => (
            <li key={item.id} className="mb-1.5">
              {item.type === 'standalone' ? (
                <Link 
                  href={item.path || '/'}
                  className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150 ease-in-out ${
                    isActive(item.path || '/') 
                      ? 'bg-indigo-50 text-indigo-700' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              ) : (
                <>
                  <button
                    onClick={() => toggleSection(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150 ease-in-out ${
                      item.submenu?.some(subItem => isActive(subItem.path))
                        ? 'bg-indigo-50 text-indigo-700' 
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center">
                      {item.icon}
                      <span>{item.label}</span>
                    </div>
                    {expandedSections.has(item.id) ? (
                      <ChevronDownIcon className="h-4 w-4" />
                    ) : (
                      <ChevronRightIcon className="h-4 w-4" />
                    )}
                  </button>
                  
                  {expandedSections.has(item.id) && item.submenu && (
                    <ul className="mt-1 mb-1 pl-8 border-l border-indigo-100 ml-4 space-y-0.5">
                      {item.submenu.map((subItem, index) => (
                        <li key={index}>
                          <Link 
                            href={subItem.path}
                            className={`block px-3 py-1.5 rounded-md text-sm transition-colors duration-150 ease-in-out ${
                              isActive(subItem.path)
                                ? 'bg-indigo-50 text-indigo-700 font-medium' 
                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
                            }`}
                          >
                            {subItem.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              )}
            </li>
          ))}
        </ul>
      </nav>
      
      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <p className="text-xs text-gray-500">
          ©{new Date().getFullYear()} FlowQi Finance
        </p>
      </div>
    </div>
  );
};

export default Sidebar; 