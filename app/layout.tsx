import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Sidebar from '@/app/components/shared/Sidebar';
import { Toaster } from '@/app/components/ui/toaster';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'FlowQi Finance',
  description: 'Financieel overzicht en planning',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="flex h-screen bg-gray-100">
          <Sidebar />
          <div className="flex-1 overflow-y-auto">
            <main className="p-6">
              {children}
            </main>
          </div>
        </div>
        <Toaster />
      </body>
    </html>
  );
} 