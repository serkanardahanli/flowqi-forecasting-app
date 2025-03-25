'use client';

import { useState } from 'react';

export default function BudgetPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-[#6366F1] mb-6">Budget Planning</h1>
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-600">
          Hier kunt u uw budget beheren en plannen maken voor uw financiën.
        </p>
      </div>
    </div>
  );
} 