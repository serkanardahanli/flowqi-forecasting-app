'use client';

import React from 'react';
import { formatCurrency, formatPercentage } from '@/lib/utils';

interface KPICardsProps {
  totalRevenue: number;
  totalExpenses: number;
  previousYearRevenue?: number;
  previousYearExpenses?: number;
  year: number;
}

export default function BudgetKPICards({
  totalRevenue,
  totalExpenses,
  previousYearRevenue,
  previousYearExpenses,
  year
}: KPICardsProps) {
  const result = totalRevenue - totalExpenses;
  const marginPercentage = totalRevenue > 0 ? (result / totalRevenue) * 100 : 0;
  
  // Bereken groei percentages als vorig jaar beschikbaar is
  const revenueGrowth = previousYearRevenue && previousYearRevenue > 0
    ? ((totalRevenue - previousYearRevenue) / previousYearRevenue) * 100
    : null;
    
  const expensesGrowth = previousYearExpenses && previousYearExpenses > 0
    ? ((totalExpenses - previousYearExpenses) / previousYearExpenses) * 100
    : null;
    
  const resultGrowth = previousYearRevenue && previousYearExpenses
    ? (((result) - (previousYearRevenue - previousYearExpenses)) / Math.abs(previousYearRevenue - previousYearExpenses)) * 100
    : null;

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {/* Omzet KPI */}
      <div className="overflow-hidden rounded-lg bg-white shadow">
        <div className="p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dt className="truncate text-sm font-medium text-gray-500">Begrote Omzet {year}</dt>
              <dd className="flex items-baseline">
                <div className="text-2xl font-semibold text-gray-900">{formatCurrency(totalRevenue)}</div>
                {revenueGrowth !== null && (
                  <div className={`ml-2 flex items-baseline text-sm font-semibold ${revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {revenueGrowth >= 0 ? '↑' : '↓'} {formatPercentage(Math.abs(revenueGrowth))}
                  </div>
                )}
              </dd>
            </div>
          </div>
        </div>
      </div>

      {/* Uitgaven KPI */}
      <div className="overflow-hidden rounded-lg bg-white shadow">
        <div className="p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dt className="truncate text-sm font-medium text-gray-500">Begrote Uitgaven {year}</dt>
              <dd className="flex items-baseline">
                <div className="text-2xl font-semibold text-gray-900">{formatCurrency(totalExpenses)}</div>
                {expensesGrowth !== null && (
                  <div className={`ml-2 flex items-baseline text-sm font-semibold ${expensesGrowth <= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {expensesGrowth >= 0 ? '↑' : '↓'} {formatPercentage(Math.abs(expensesGrowth))}
                  </div>
                )}
              </dd>
            </div>
          </div>
        </div>
      </div>

      {/* Resultaat KPI */}
      <div className="overflow-hidden rounded-lg bg-white shadow">
        <div className="p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dt className="truncate text-sm font-medium text-gray-500">Begroot Resultaat {year}</dt>
              <dd className="flex items-baseline">
                <div className={`text-2xl font-semibold ${result >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(result)}
                </div>
                {resultGrowth !== null && (
                  <div className={`ml-2 flex items-baseline text-sm font-semibold ${resultGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {resultGrowth >= 0 ? '↑' : '↓'} {formatPercentage(Math.abs(resultGrowth))}
                  </div>
                )}
              </dd>
            </div>
          </div>
        </div>
      </div>

      {/* Marge KPI */}
      <div className="overflow-hidden rounded-lg bg-white shadow">
        <div className="p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-6 w-6 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dt className="truncate text-sm font-medium text-gray-500">Begrote Marge {year}</dt>
              <dd>
                <div className={`text-2xl font-semibold ${marginPercentage >= 15 ? 'text-green-600' : marginPercentage >= 0 ? 'text-yellow-600' : 'text-red-600'}`}>
                  {formatPercentage(marginPercentage)}
                </div>
              </dd>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 