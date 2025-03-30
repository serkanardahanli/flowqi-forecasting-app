'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowPathIcon } from '@heroicons/react/24/outline';

console.log('Expenses page loading - expenses/page.tsx');

export default function ExpensesOverviewPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Uitgaven Overzicht</h1>
        <button
          onClick={() => setIsLoading(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <ArrowPathIcon className={`-ml-1 mr-2 h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
          Vernieuwen
        </button>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Uitgaven Navigatie
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Kies een van de onderstaande opties om naar de betreffende pagina te gaan.
          </p>
        </div>
        <div className="border-t border-gray-200">
          <dl>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">
                Uitgaven Registratie
              </dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                <button
                  onClick={() => router.push('/actual/expenses')}
                  className="text-indigo-600 hover:text-indigo-900"
                >
                  Ga naar uitgaven registratie →
                </button>
              </dd>
            </div>
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">
                Uitgaven Begroting
              </dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                <button
                  onClick={() => router.push('/budget/expenses')}
                  className="text-indigo-600 hover:text-indigo-900"
                >
                  Ga naar uitgaven begroting →
                </button>
              </dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Uitgaven Samenvatting
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Dit is een placeholder voor de uitgaven samenvatting.
          </p>
        </div>
        <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
          <p className="text-center text-gray-500 italic">
            Gedetailleerde uitgaven overzichten zijn beschikbaar in de specifieke secties.
          </p>
        </div>
      </div>
    </div>
  );
} 