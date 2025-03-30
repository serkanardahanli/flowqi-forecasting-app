'use client';

import { useState } from 'react';
import { formatCurrency } from '@/lib/utils';
import { ChevronDownIcon, ChevronRightIcon, ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

// Types
type Period = 'month' | 'quarter' | 'half-year' | 'year';
type ComparisonType = 'budget' | 'previous-year';

interface FinancialData {
  revenue: {
    planned: number;
    actual: number;
    previousYear?: number;
    categories: {
      code: string;
      name: string;
      planned: number;
      actual: number;
      previousYear?: number;
      subcategories?: {
        code: string;
        name: string;
        planned: number;
        actual: number;
        previousYear?: number;
      }[];
    }[];
  };
  expenses: {
    planned: number;
    actual: number;
    previousYear?: number;
    categories: {
      code: string;
      name: string;
      planned: number;
      actual: number;
      previousYear?: number;
      subcategories?: {
        code: string;
        name: string;
        planned: number;
        actual: number;
        previousYear?: number;
      }[];
    }[];
  };
}

interface FinancialOverviewProps {
  data: FinancialData;
  year: number;
  month: number;
  onPeriodChange: (period: Period) => void;
  onComparisonChange: (type: ComparisonType) => void;
  onCategoryClick: (type: 'revenue' | 'expenses', code: string) => void;
  onExport: (format?: 'excel' | 'pdf') => void;
}

export default function FinancialOverview({
  data,
  year,
  month,
  onPeriodChange,
  onComparisonChange,
  onCategoryClick,
  onExport
}: FinancialOverviewProps) {
  const [period, setPeriod] = useState<Period>('month');
  const [comparison, setComparison] = useState<ComparisonType>('budget');
  const [expandedRevenue, setExpandedRevenue] = useState<Set<string>>(new Set());
  const [expandedExpenses, setExpandedExpenses] = useState<Set<string>>(new Set());

  // Calculate values
  const profit = {
    planned: data.revenue.planned - data.expenses.planned,
    actual: data.revenue.actual - data.expenses.actual,
    previousYear: data.revenue.previousYear && data.expenses.previousYear 
      ? data.revenue.previousYear - data.expenses.previousYear 
      : undefined
  };

  const margin = {
    planned: data.revenue.planned ? (profit.planned / data.revenue.planned) * 100 : 0,
    actual: data.revenue.actual ? (profit.actual / data.revenue.actual) * 100 : 0,
    previousYear: data.revenue.previousYear 
      ? ((data.revenue.previousYear - (data.expenses.previousYear || 0)) / data.revenue.previousYear) * 100 
      : undefined
  };

  // Helper functions
  const getVariancePercentage = (actual: number, planned: number) => {
    if (!planned) return 0;
    return ((actual - planned) / planned) * 100;
  };

  const getVarianceClass = (actual: number, planned: number, inverseColors = false) => {
    const variance = actual - planned;
    if (Math.abs(variance) < 0.01) return 'text-gray-600';
    
    if (inverseColors) {
      // For expenses, lower than planned is good
      return variance < 0 ? 'text-green-600' : 'text-red-600';
    }
    
    // For revenue, higher than planned is good
    return variance > 0 ? 'text-green-600' : 'text-red-600';
  };

  const toggleCategory = (type: 'revenue' | 'expenses', code: string) => {
    if (type === 'revenue') {
      const newExpanded = new Set(expandedRevenue);
      if (newExpanded.has(code)) {
        newExpanded.delete(code);
      } else {
        newExpanded.add(code);
      }
      setExpandedRevenue(newExpanded);
    } else {
      const newExpanded = new Set(expandedExpenses);
      if (newExpanded.has(code)) {
        newExpanded.delete(code);
      } else {
        newExpanded.add(code);
      }
      setExpandedExpenses(newExpanded);
    }
  };

  const handlePeriodChange = (newPeriod: Period) => {
    setPeriod(newPeriod);
    onPeriodChange(newPeriod);
  };

  const handleComparisonChange = (newComparison: ComparisonType) => {
    setComparison(newComparison);
    onComparisonChange(newComparison);
  };

  // Get the month name
  const getMonthName = (m: number) => {
    return new Date(2000, m - 1, 1).toLocaleString('nl-NL', { month: 'long' });
  };

  // Get period display
  const getPeriodDisplay = () => {
    switch (period) {
      case 'month':
        return getMonthName(month) + ' ' + year;
      case 'quarter':
        return `Q${Math.ceil(month / 3)} ${year}`;
      case 'half-year':
        return `H${Math.ceil(month / 6)} ${year}`;
      case 'year':
        return `${year}`;
      default:
        return '';
    }
  };

  return (
    <div className="space-y-8">
      {/* Controls are moved to the dashboard component */}
      
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Revenue KPI */}
        <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl shadow-md border border-green-200">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-sm font-medium text-green-700">Omzet</h3>
            <div className={`flex items-center px-2 py-1 rounded-full text-xs font-semibold ${getVarianceClass(data.revenue.actual, data.revenue.planned)} bg-opacity-20 ${data.revenue.actual > data.revenue.planned ? 'bg-green-100' : 'bg-red-100'}`}>
              {data.revenue.actual > data.revenue.planned ? (
                <ArrowUpIcon className="h-3 w-3 mr-1" />
              ) : (
                <ArrowDownIcon className="h-3 w-3 mr-1" />
              )}
              {Math.abs(getVariancePercentage(data.revenue.actual, data.revenue.planned)).toFixed(1)}%
            </div>
          </div>
          <div className="mt-1 text-3xl font-bold text-green-900">
            {formatCurrency(data.revenue.actual)}
          </div>
          <div className="mt-4 flex justify-between text-sm">
            <div>
              <span className="text-green-700">Begroot:</span>
              <span className="ml-1 font-medium text-green-800">{formatCurrency(data.revenue.planned)}</span>
            </div>
            <div>
              <span className="text-green-700">Verschil:</span>
              <span 
                className={`ml-1 font-medium ${getVarianceClass(data.revenue.actual, data.revenue.planned)}`}
              >
                {formatCurrency(data.revenue.actual - data.revenue.planned)}
              </span>
            </div>
          </div>
          <div className="mt-3 text-xs text-green-700">
            {period === 'month' ? getMonthName(month) : ''} {period === 'quarter' ? `Q${Math.ceil(month / 3)}` : ''} {period === 'half-year' ? `H${Math.ceil(month / 6)}` : ''} {year}
          </div>
        </div>

        {/* Expenses KPI */}
        <div className="bg-gradient-to-br from-red-50 to-red-100 p-6 rounded-xl shadow-md border border-red-200">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-sm font-medium text-red-700">Uitgaven</h3>
            <div className={`flex items-center px-2 py-1 rounded-full text-xs font-semibold ${getVarianceClass(data.expenses.actual, data.expenses.planned, true)} bg-opacity-20 ${data.expenses.actual < data.expenses.planned ? 'bg-green-100' : 'bg-red-100'}`}>
              {data.expenses.actual < data.expenses.planned ? (
                <ArrowDownIcon className="h-3 w-3 mr-1" />
              ) : (
                <ArrowUpIcon className="h-3 w-3 mr-1" />
              )}
              {Math.abs(getVariancePercentage(data.expenses.actual, data.expenses.planned)).toFixed(1)}%
            </div>
          </div>
          <div className="mt-1 text-3xl font-bold text-red-900">
            {formatCurrency(data.expenses.actual)}
          </div>
          <div className="mt-4 flex justify-between text-sm">
            <div>
              <span className="text-red-700">Begroot:</span>
              <span className="ml-1 font-medium text-red-800">{formatCurrency(data.expenses.planned)}</span>
            </div>
            <div>
              <span className="text-red-700">Verschil:</span>
              <span 
                className={`ml-1 font-medium ${getVarianceClass(data.expenses.actual, data.expenses.planned, true)}`}
              >
                {formatCurrency(data.expenses.actual - data.expenses.planned)}
              </span>
            </div>
          </div>
          <div className="mt-3 text-xs text-red-700">
            {period === 'month' ? getMonthName(month) : ''} {period === 'quarter' ? `Q${Math.ceil(month / 3)}` : ''} {period === 'half-year' ? `H${Math.ceil(month / 6)}` : ''} {year}
          </div>
        </div>

        {/* Profit KPI */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl shadow-md border border-blue-200">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-sm font-medium text-blue-700">Resultaat</h3>
            <div className={`flex items-center px-2 py-1 rounded-full text-xs font-semibold ${getVarianceClass(profit.actual, profit.planned)} bg-opacity-20 ${profit.actual > profit.planned ? 'bg-green-100' : 'bg-red-100'}`}>
              {profit.actual > profit.planned ? (
                <ArrowUpIcon className="h-3 w-3 mr-1" />
              ) : (
                <ArrowDownIcon className="h-3 w-3 mr-1" />
              )}
              {profit.planned !== 0 
                ? Math.abs(((profit.actual - profit.planned) / Math.abs(profit.planned)) * 100).toFixed(1) 
                : '0.0'}%
            </div>
          </div>
          <div className="mt-1 text-3xl font-bold text-blue-900">
            {formatCurrency(profit.actual)}
          </div>
          <div className="mt-4 flex justify-between text-sm">
            <div>
              <span className="text-blue-700">Begroot:</span>
              <span className="ml-1 font-medium text-blue-800">{formatCurrency(profit.planned)}</span>
            </div>
            <div>
              <span className="text-blue-700">Verschil:</span>
              <span 
                className={`ml-1 font-medium ${getVarianceClass(profit.actual, profit.planned)}`}
              >
                {formatCurrency(profit.actual - profit.planned)}
              </span>
            </div>
          </div>
          <div className="mt-3 text-xs text-blue-700">
            {period === 'month' ? getMonthName(month) : ''} {period === 'quarter' ? `Q${Math.ceil(month / 3)}` : ''} {period === 'half-year' ? `H${Math.ceil(month / 6)}` : ''} {year}
          </div>
        </div>

        {/* Margin KPI */}
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl shadow-md border border-purple-200">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-sm font-medium text-purple-700">Marge</h3>
            <div className={`flex items-center px-2 py-1 rounded-full text-xs font-semibold ${getVarianceClass(margin.actual, margin.planned)} bg-opacity-20 ${margin.actual > margin.planned ? 'bg-green-100' : 'bg-red-100'}`}>
              {margin.actual > margin.planned ? (
                <ArrowUpIcon className="h-3 w-3 mr-1" />
              ) : (
                <ArrowDownIcon className="h-3 w-3 mr-1" />
              )}
              {Math.abs(margin.actual - margin.planned).toFixed(1)}%
            </div>
          </div>
          <div className="mt-1 text-3xl font-bold text-purple-900">
            {margin.actual.toFixed(1)}%
          </div>
          <div className="mt-4 flex justify-between text-sm">
            <div>
              <span className="text-purple-700">Begroot:</span>
              <span className="ml-1 font-medium text-purple-800">{margin.planned.toFixed(1)}%</span>
            </div>
            <div>
              <span className="text-purple-700">Verschil:</span>
              <span 
                className={`ml-1 font-medium ${getVarianceClass(margin.actual, margin.planned)}`}
              >
                {(margin.actual - margin.planned).toFixed(1)}%
              </span>
            </div>
          </div>
          <div className="mt-3 text-xs text-purple-700">
            {period === 'month' ? getMonthName(month) : ''} {period === 'quarter' ? `Q${Math.ceil(month / 3)}` : ''} {period === 'half-year' ? `H${Math.ceil(month / 6)}` : ''} {year}
          </div>
        </div>
      </div>

      {/* Period Display */}
      <div className="flex justify-center">
        <h2 className="text-xl font-semibold text-gray-800">
          Financieel Overzicht - {getPeriodDisplay()}
        </h2>
      </div>

      {/* Financial Detail Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Revenue Table */}
        <div className="bg-white shadow-lg overflow-hidden rounded-lg border border-green-200">
          <div className="px-5 py-4 border-b border-gray-200 bg-green-50 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-green-800">Omzet Overzicht</h3>
            <span className="text-sm font-medium text-green-600">
              Totaal: {formatCurrency(data.revenue.planned)} / {formatCurrency(data.revenue.actual)}
            </span>
          </div>
          <div className="px-4 py-3 border-b border-gray-200 bg-green-50 flex justify-between text-xs font-medium text-gray-700">
            <div className="w-6/12">Categorie</div>
            <div className="w-2/12 text-right">Begroot</div>
            <div className="w-2/12 text-right">Werkelijk</div>
            <div className="w-2/12 text-right">Verschil</div>
          </div>
          <div className="overflow-y-auto max-h-96 bg-white">
            {data.revenue.categories.map((category) => (
              <div key={category.code} className="hover:bg-green-50 transition-colors duration-150">
                {/* Category row */}
                <div 
                  className="px-4 py-3 border-b border-gray-200 flex justify-between items-center cursor-pointer"
                  onClick={() => toggleCategory('revenue', category.code)}
                >
                  <div className="w-6/12 flex items-center">
                    {category.subcategories?.length ? (
                      expandedRevenue.has(category.code) ? (
                        <ChevronDownIcon className="h-4 w-4 mr-2 text-green-600" />
                      ) : (
                        <ChevronRightIcon className="h-4 w-4 mr-2 text-green-600" />
                      )
                    ) : (
                      <span className="w-4 mr-2" />
                    )}
                    <span 
                      className="font-medium cursor-pointer hover:text-green-700 hover:underline"
                      onClick={(e) => {
                        e.stopPropagation();
                        onCategoryClick('revenue', category.code);
                      }}
                    >
                      {category.code} {category.name}
                    </span>
                  </div>
                  <div className="w-2/12 text-right font-medium">{formatCurrency(category.planned)}</div>
                  <div className="w-2/12 text-right font-medium">{formatCurrency(category.actual)}</div>
                  <div className={`w-2/12 text-right font-medium ${getVarianceClass(category.actual, category.planned)}`}>
                    {formatCurrency(category.actual - category.planned)}
                  </div>
                </div>

                {/* Subcategories (if expanded) */}
                {expandedRevenue.has(category.code) && category.subcategories?.map((sub) => (
                  <div 
                    key={sub.code}
                    className="px-4 py-2 pl-10 border-b border-gray-200 flex justify-between items-center text-sm bg-green-50/30"
                  >
                    <div 
                      className="w-6/12 cursor-pointer hover:text-green-700 hover:underline"
                      onClick={() => onCategoryClick('revenue', sub.code)}
                    >
                      {sub.code} {sub.name}
                    </div>
                    <div className="w-2/12 text-right">{formatCurrency(sub.planned)}</div>
                    <div className="w-2/12 text-right">{formatCurrency(sub.actual)}</div>
                    <div className={`w-2/12 text-right ${getVarianceClass(sub.actual, sub.planned)}`}>
                      {formatCurrency(sub.actual - sub.planned)}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
          <div className="px-4 py-3 bg-green-100 border-t border-gray-200 flex justify-between font-bold text-green-900">
            <div className="w-6/12">Totaal Omzet</div>
            <div className="w-2/12 text-right">{formatCurrency(data.revenue.planned)}</div>
            <div className="w-2/12 text-right">{formatCurrency(data.revenue.actual)}</div>
            <div className={`w-2/12 text-right ${getVarianceClass(data.revenue.actual, data.revenue.planned)}`}>
              {formatCurrency(data.revenue.actual - data.revenue.planned)}
            </div>
          </div>
        </div>

        {/* Expenses Table */}
        <div className="bg-white shadow-lg overflow-hidden rounded-lg border border-red-200">
          <div className="px-5 py-4 border-b border-gray-200 bg-red-50 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-red-800">Uitgaven Overzicht</h3>
            <span className="text-sm font-medium text-red-600">
              Totaal: {formatCurrency(data.expenses.planned)} / {formatCurrency(data.expenses.actual)}
            </span>
          </div>
          <div className="px-4 py-3 border-b border-gray-200 bg-red-50 flex justify-between text-xs font-medium text-gray-700">
            <div className="w-6/12">Categorie</div>
            <div className="w-2/12 text-right">Begroot</div>
            <div className="w-2/12 text-right">Werkelijk</div>
            <div className="w-2/12 text-right">Verschil</div>
          </div>
          <div className="overflow-y-auto max-h-96 bg-white">
            {data.expenses.categories.map((category) => (
              <div key={category.code} className="hover:bg-red-50 transition-colors duration-150">
                {/* Category row */}
                <div 
                  className="px-4 py-3 border-b border-gray-200 flex justify-between items-center cursor-pointer"
                  onClick={() => toggleCategory('expenses', category.code)}
                >
                  <div className="w-6/12 flex items-center">
                    {category.subcategories?.length ? (
                      expandedExpenses.has(category.code) ? (
                        <ChevronDownIcon className="h-4 w-4 mr-2 text-red-600" />
                      ) : (
                        <ChevronRightIcon className="h-4 w-4 mr-2 text-red-600" />
                      )
                    ) : (
                      <span className="w-4 mr-2" />
                    )}
                    <span 
                      className="font-medium cursor-pointer hover:text-red-700 hover:underline"
                      onClick={(e) => {
                        e.stopPropagation();
                        onCategoryClick('expenses', category.code);
                      }}
                    >
                      {category.code} {category.name}
                    </span>
                  </div>
                  <div className="w-2/12 text-right font-medium">{formatCurrency(category.planned)}</div>
                  <div className="w-2/12 text-right font-medium">{formatCurrency(category.actual)}</div>
                  <div className={`w-2/12 text-right font-medium ${getVarianceClass(category.actual, category.planned, true)}`}>
                    {formatCurrency(category.actual - category.planned)}
                  </div>
                </div>

                {/* Subcategories (if expanded) */}
                {expandedExpenses.has(category.code) && category.subcategories?.map((sub) => (
                  <div 
                    key={sub.code}
                    className="px-4 py-2 pl-10 border-b border-gray-200 flex justify-between items-center text-sm bg-red-50/30"
                  >
                    <div 
                      className="w-6/12 cursor-pointer hover:text-red-700 hover:underline"
                      onClick={() => onCategoryClick('expenses', sub.code)}
                    >
                      {sub.code} {sub.name}
                    </div>
                    <div className="w-2/12 text-right">{formatCurrency(sub.planned)}</div>
                    <div className="w-2/12 text-right">{formatCurrency(sub.actual)}</div>
                    <div className={`w-2/12 text-right ${getVarianceClass(sub.actual, sub.planned, true)}`}>
                      {formatCurrency(sub.actual - sub.planned)}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
          <div className="px-4 py-3 bg-red-100 border-t border-gray-200 flex justify-between font-bold text-red-900">
            <div className="w-6/12">Totaal Uitgaven</div>
            <div className="w-2/12 text-right">{formatCurrency(data.expenses.planned)}</div>
            <div className="w-2/12 text-right">{formatCurrency(data.expenses.actual)}</div>
            <div className={`w-2/12 text-right ${getVarianceClass(data.expenses.actual, data.expenses.planned, true)}`}>
              {formatCurrency(data.expenses.actual - data.expenses.planned)}
            </div>
          </div>
        </div>
      </div>

      {/* Export button at the bottom */}
      <div className="flex justify-end mt-6">
        <button
          onClick={() => onExport()}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Exporteren
        </button>
      </div>
    </div>
  );
} 