'use client';

import React from 'react';
import Sidebar from '@/app/components/shared/Sidebar';

export default function RevenueLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-screen flex overflow-hidden bg-gray-100">
      <Sidebar />
      
      <div className="flex flex-col w-0 flex-1 overflow-auto">
        <main className="flex-1 relative z-0 overflow-y-auto focus:outline-none">
          {children}
        </main>
      </div>
    </div>
  );
} 