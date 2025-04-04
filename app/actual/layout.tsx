'use client';

import React from 'react';

export default function ActualLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-full">
      <main className="p-6">
        {children}
      </main>
    </div>
  );
} 