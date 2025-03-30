import { Inter } from 'next/font/google';
import type { Metadata } from 'next';
import './globals.css';
import { UserCircleIcon, CurrencyDollarIcon, ChartBarIcon, 
  TableCellsIcon, HomeIcon, CogIcon, CreditCardIcon, 
  DocumentTextIcon, ArrowTrendingUpIcon, ClipboardDocumentCheckIcon } from '@heroicons/react/24/outline';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'FlowQi - Financial Forecasting SaaS',
  description: 'Powerful SaaS solution for financial forecasting and management',
};

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { 
    name: 'Begroting', 
    icon: DocumentTextIcon,
    children: [
      { name: 'Overzicht', href: '/budget/overview' },
      { name: 'Omzet', href: '/budget/revenue' },
      { name: 'Uitgaven', href: '/budget/expenses' },
    ]
  },
  { 
    name: 'Actueel', 
    icon: ClipboardDocumentCheckIcon,
    children: [
      { name: 'Overzicht', href: '/actual/overview' },
      { name: 'Omzet', href: '/actual/revenue' },
      { name: 'Uitgaven', href: '/actual/expenses' },
    ]
  },
  {
    name: 'Omzet',
    icon: CurrencyDollarIcon,
    children: [
      { name: 'Overzicht', href: '/revenue' },
      { name: 'SaaS', href: '/revenue/saas' },
      { name: 'Consultancy', href: '/revenue/consultancy' },
    ]
  },
  { name: 'Financiën', href: '/finances', icon: ChartBarIcon },
  { name: 'Producten', href: '/products', icon: CreditCardIcon },
  { name: 'Klanten', href: '/customers', icon: UserCircleIcon },
  { name: 'Instellingen', href: '/settings', icon: CogIcon },
];

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="nl">
      <body>
        {children}
      </body>
    </html>
  );
} 