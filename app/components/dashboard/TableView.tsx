'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { formatCurrency } from '@/lib/utils';

// Definieer de types
interface FinancialCategory {
  code: string;
  name: string;
  planned: number;
  actual: number;
  previousYear?: number;
  monthlyData?: {
    [key: number]: {
      planned: number;
      actual: number;
    }
  };
  subcategories?: FinancialCategory[];
}

interface FinancialData {
  revenue: {
    planned: number;
    actual: number;
    previousYear?: number;
    categories: FinancialCategory[];
  };
  expenses: {
    planned: number;
    actual: number;
    previousYear?: number;
    categories: FinancialCategory[];
  };
}

interface TableViewProps {
  data: FinancialData;
  year: number;
  period: 'month' | 'quarter' | 'half-year' | 'year';
  month: number;
  onCategoryClick: (type: 'revenue' | 'expenses', code: string, month?: number) => void;
}

export default function TableView({ data, year, period, month, onCategoryClick }: TableViewProps) {
  const [expandedRevenue, setExpandedRevenue] = useState<Set<string>>(new Set());
  const [expandedExpenses, setExpandedExpenses] = useState<Set<string>>(new Set());
  const [showMonthlyColumns, setShowMonthlyColumns] = useState<boolean>(true);

  // Genereer maandkolommen op basis van de geselecteerde periode
  const monthColumns = useMemo(() => {
    const columns = [];
    
    if (period === 'month') {
      columns.push({ month, label: getMonthName(month) });
    } 
    else if (period === 'quarter') {
      const startMonth = Math.floor((month - 1) / 3) * 3 + 1;
      for (let m = startMonth; m < startMonth + 3; m++) {
        columns.push({ month: m, label: getMonthName(m) });
      }
    }
    else if (period === 'half-year') {
      const startMonth = Math.floor((month - 1) / 6) * 6 + 1;
      for (let m = startMonth; m < startMonth + 6; m++) {
        columns.push({ month: m, label: getMonthName(m) });
      }
    }
    else if (period === 'year') {
      for (let m = 1; m <= 12; m++) {
        columns.push({ month: m, label: getMonthName(m) });
      }
    }
    
    return columns;
  }, [period, month]);
  
  // Helper functie voor het verkrijgen van maandnamen
  function getMonthName(monthNum: number) {
    return new Date(2000, monthNum - 1, 1).toLocaleString('nl-NL', { month: 'short' });
  }

  // Toggle functie voor de uitklapbare categorieën
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

  // Bereken de variatie en geef de juiste kleurklasse terug
  const getVarianceClass = (actual: number, planned: number, inverseColors = false) => {
    const variance = actual - planned;
    if (Math.abs(variance) < 0.01) return 'text-gray-800';
    
    if (inverseColors) {
      // Voor uitgaven is lager dan gepland goed
      return variance < 0 ? 'text-green-800' : 'text-red-800';
    }
    
    // Voor inkomsten is hoger dan gepland goed
    return variance > 0 ? 'text-green-800' : 'text-red-800';
  };

  // Render een categorie rij in de tabel
  const renderCategoryRow = (
    category: FinancialCategory, 
    type: 'revenue' | 'expenses', 
    depth = 0,
    isLastInGroup = false
  ) => {
    const isExpanded = type === 'revenue' 
      ? expandedRevenue.has(category.code) 
      : expandedExpenses.has(category.code);
    
    const hasSubcategories = category.subcategories && category.subcategories.length > 0;
    const indentClass = `pl-${depth * 6 + 4}`;
    
    // Bepaal rij achtergrondkleur op basis van categorietype en diepte
    const getBgClass = () => {
      if (type === 'revenue') {
        return depth === 0 ? 'hover:bg-green-100' : 'hover:bg-green-50';
      } else {
        return depth === 0 ? 'hover:bg-red-100' : 'hover:bg-red-50';
      }
    };

    return (
      <React.Fragment key={category.code}>
        <tr 
          className={`
            ${getBgClass()} 
            ${depth === 0 ? 'font-medium text-gray-900' : 'text-gray-800'}
            ${isLastInGroup && depth > 0 ? 'border-b border-gray-300' : 'border-b border-gray-200'}
          `}
        >
          {/* Categorie cel */}
          <td className={`py-2 pr-1 whitespace-nowrap ${indentClass}`}>
            <div className="flex items-center">
              {hasSubcategories ? (
                <button 
                  onClick={() => toggleCategory(type, category.code)}
                  className="p-1 mr-1 rounded-full hover:bg-gray-200 focus:outline-none"
                >
                  {isExpanded ? (
                    <ChevronDownIcon className={`h-4 w-4 text-${type === 'revenue' ? 'green' : 'red'}-700`} />
                  ) : (
                    <ChevronRightIcon className={`h-4 w-4 text-${type === 'revenue' ? 'green' : 'red'}-700`} />
                  )}
                </button>
              ) : (
                <span className="w-6"></span>
              )}
              <span 
                className={`cursor-pointer font-medium hover:text-${type === 'revenue' ? 'green' : 'red'}-800 hover:underline`}
                onClick={() => onCategoryClick(type, category.code)}
              >
                {category.name}
              </span>
            </div>
          </td>

          {/* Totaal gepland */}
          <td className="py-2 px-2 text-right whitespace-nowrap font-medium">
            {formatCurrency(category.planned)}
          </td>

          {/* Totaal werkelijk */}
          <td className="py-2 px-2 text-right whitespace-nowrap font-medium">
            {formatCurrency(category.actual)}
          </td>

          {/* Totaal verschil */}
          <td className={`py-2 px-2 text-right whitespace-nowrap font-medium ${
            getVarianceClass(category.actual, category.planned, type === 'expenses')
          }`}>
            {formatCurrency(category.actual - category.planned)}
          </td>

          {/* Maandelijkse kolommen (indien van toepassing) */}
          {showMonthlyColumns && monthColumns.map(col => (
            <td 
              key={col.month}
              className="py-2 px-2 text-right whitespace-nowrap cursor-pointer hover:bg-gray-100 font-medium"
              onClick={() => onCategoryClick(type, category.code, col.month)}
            >
              {formatCurrency(category.actual || 0)}
            </td>
          ))}
        </tr>

        {/* Subcategorieën (indien uitgevouwen) */}
        {isExpanded && hasSubcategories && category.subcategories!.map((subcategory, index) => 
          renderCategoryRow(
            subcategory, 
            type, 
            depth + 1, 
            index === category.subcategories!.length - 1
          )
        )}
      </React.Fragment>
    );
  };

  return (
    <div className="space-y-8">
      {/* Tabelfiltering opties */}
      <div className="flex justify-end mb-4">
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-800 font-medium">Toon maandkolommen:</span>
          <button 
            onClick={() => setShowMonthlyColumns(!showMonthlyColumns)}
            className={`px-3 py-1 rounded-md text-sm font-medium ${
              showMonthlyColumns 
                ? 'bg-indigo-200 text-indigo-900' 
                : 'bg-gray-200 text-gray-900'
            }`}
          >
            {showMonthlyColumns ? 'Aan' : 'Uit'}
          </button>
        </div>
      </div>

      {/* Inkomsten tabel */}
      <div className="bg-white shadow-lg rounded-lg overflow-hidden border border-green-300">
        <div className="px-5 py-4 bg-green-100 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-green-900">Inkomsten</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr className="bg-green-100">
                <th scope="col" className="py-3 px-4 text-left text-xs font-medium text-gray-900 uppercase tracking-wider sticky left-0 bg-green-100">
                  Categorie
                </th>
                <th scope="col" className="py-3 px-2 text-right text-xs font-medium text-gray-900 uppercase tracking-wider">
                  Begroot
                </th>
                <th scope="col" className="py-3 px-2 text-right text-xs font-medium text-gray-900 uppercase tracking-wider">
                  Werkelijk
                </th>
                <th scope="col" className="py-3 px-2 text-right text-xs font-medium text-gray-900 uppercase tracking-wider">
                  Verschil
                </th>
                
                {showMonthlyColumns && monthColumns.map(col => (
                  <th 
                    key={col.month} 
                    scope="col" 
                    className="py-3 px-2 text-right text-xs font-medium text-gray-900 uppercase tracking-wider"
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.revenue.categories.map((category, index) => 
                renderCategoryRow(
                  category, 
                  'revenue', 
                  0, 
                  index === data.revenue.categories.length - 1
                )
              )}
              
              {/* Totaalrij */}
              <tr className="bg-green-200 font-bold text-green-900">
                <td className="py-3 px-4 text-left">Totaal Inkomsten</td>
                <td className="py-3 px-2 text-right">{formatCurrency(data.revenue.planned)}</td>
                <td className="py-3 px-2 text-right">{formatCurrency(data.revenue.actual)}</td>
                <td className={`py-3 px-2 text-right ${
                  getVarianceClass(data.revenue.actual, data.revenue.planned)
                }`}>
                  {formatCurrency(data.revenue.actual - data.revenue.planned)}
                </td>
                
                {showMonthlyColumns && monthColumns.map(col => (
                  <td key={col.month} className="py-3 px-2 text-right">
                    {formatCurrency(0)} {/* Placeholder - echte data nodig */}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Uitgaven tabel */}
      <div className="bg-white shadow-lg rounded-lg overflow-hidden border border-red-300 mt-8">
        <div className="px-5 py-4 bg-red-100 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-red-900">Uitgaven</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr className="bg-red-100">
                <th scope="col" className="py-3 px-4 text-left text-xs font-medium text-gray-900 uppercase tracking-wider sticky left-0 bg-red-100">
                  Categorie
                </th>
                <th scope="col" className="py-3 px-2 text-right text-xs font-medium text-gray-900 uppercase tracking-wider">
                  Begroot
                </th>
                <th scope="col" className="py-3 px-2 text-right text-xs font-medium text-gray-900 uppercase tracking-wider">
                  Werkelijk
                </th>
                <th scope="col" className="py-3 px-2 text-right text-xs font-medium text-gray-900 uppercase tracking-wider">
                  Verschil
                </th>
                
                {showMonthlyColumns && monthColumns.map(col => (
                  <th 
                    key={col.month} 
                    scope="col" 
                    className="py-3 px-2 text-right text-xs font-medium text-gray-900 uppercase tracking-wider"
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.expenses.categories.map((category, index) => 
                renderCategoryRow(
                  category, 
                  'expenses', 
                  0, 
                  index === data.expenses.categories.length - 1
                )
              )}
              
              {/* Totaalrij */}
              <tr className="bg-red-200 font-bold text-red-900">
                <td className="py-3 px-4 text-left">Totaal Uitgaven</td>
                <td className="py-3 px-2 text-right">{formatCurrency(data.expenses.planned)}</td>
                <td className="py-3 px-2 text-right">{formatCurrency(data.expenses.actual)}</td>
                <td className={`py-3 px-2 text-right ${
                  getVarianceClass(data.expenses.actual, data.expenses.planned, true)
                }`}>
                  {formatCurrency(data.expenses.actual - data.expenses.planned)}
                </td>
                
                {showMonthlyColumns && monthColumns.map(col => (
                  <td key={col.month} className="py-3 px-2 text-right">
                    {formatCurrency(0)} {/* Placeholder - echte data nodig */}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Resultaat tabel (optioneel) */}
      <div className="bg-white shadow-lg rounded-lg overflow-hidden border border-blue-300 mt-8">
        <div className="px-5 py-4 bg-blue-100 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-blue-900">Resultaat</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr className="bg-blue-100">
                <th scope="col" className="py-3 px-4 text-left text-xs font-medium text-gray-900 uppercase tracking-wider sticky left-0 bg-blue-100">
                  Omschrijving
                </th>
                <th scope="col" className="py-3 px-2 text-right text-xs font-medium text-gray-900 uppercase tracking-wider">
                  Begroot
                </th>
                <th scope="col" className="py-3 px-2 text-right text-xs font-medium text-gray-900 uppercase tracking-wider">
                  Werkelijk
                </th>
                <th scope="col" className="py-3 px-2 text-right text-xs font-medium text-gray-900 uppercase tracking-wider">
                  Verschil
                </th>
                
                {showMonthlyColumns && monthColumns.map(col => (
                  <th 
                    key={col.month} 
                    scope="col" 
                    className="py-3 px-2 text-right text-xs font-medium text-gray-900 uppercase tracking-wider"
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {/* Rij voor totale inkomsten */}
              <tr className="hover:bg-blue-50">
                <td className="py-2 px-4 text-left font-medium">Totaal Inkomsten</td>
                <td className="py-2 px-2 text-right">{formatCurrency(data.revenue.planned)}</td>
                <td className="py-2 px-2 text-right">{formatCurrency(data.revenue.actual)}</td>
                <td className={`py-2 px-2 text-right ${
                  getVarianceClass(data.revenue.actual, data.revenue.planned)
                }`}>
                  {formatCurrency(data.revenue.actual - data.revenue.planned)}
                </td>
                
                {showMonthlyColumns && monthColumns.map(col => (
                  <td key={col.month} className="py-2 px-2 text-right">
                    {formatCurrency(0)} {/* Placeholder - echte data nodig */}
                  </td>
                ))}
              </tr>
              
              {/* Rij voor totale uitgaven */}
              <tr className="hover:bg-blue-50">
                <td className="py-2 px-4 text-left font-medium">Totaal Uitgaven</td>
                <td className="py-2 px-2 text-right">{formatCurrency(data.expenses.planned)}</td>
                <td className="py-2 px-2 text-right">{formatCurrency(data.expenses.actual)}</td>
                <td className={`py-2 px-2 text-right ${
                  getVarianceClass(data.expenses.actual, data.expenses.planned, true)
                }`}>
                  {formatCurrency(data.expenses.actual - data.expenses.planned)}
                </td>
                
                {showMonthlyColumns && monthColumns.map(col => (
                  <td key={col.month} className="py-2 px-2 text-right">
                    {formatCurrency(0)} {/* Placeholder - echte data nodig */}
                  </td>
                ))}
              </tr>
              
              {/* Resultaatrij */}
              <tr className="bg-blue-200 font-bold text-blue-900">
                <td className="py-3 px-4 text-left">Resultaat</td>
                <td className="py-3 px-2 text-right">
                  {formatCurrency(data.revenue.planned - data.expenses.planned)}
                </td>
                <td className="py-3 px-2 text-right">
                  {formatCurrency(data.revenue.actual - data.expenses.actual)}
                </td>
                <td className={`py-3 px-2 text-right ${
                  getVarianceClass(
                    data.revenue.actual - data.expenses.actual, 
                    data.revenue.planned - data.expenses.planned
                  )
                }`}>
                  {formatCurrency(
                    (data.revenue.actual - data.expenses.actual) - 
                    (data.revenue.planned - data.expenses.planned)
                  )}
                </td>
                
                {showMonthlyColumns && monthColumns.map(col => (
                  <td key={col.month} className="py-3 px-2 text-right">
                    {formatCurrency(0)} {/* Placeholder - echte data nodig */}
                  </td>
                ))}
              </tr>
              
              {/* Marge rij */}
              <tr className="bg-blue-100 text-blue-900 font-medium">
                <td className="py-2 px-4 text-left">Marge %</td>
                <td className="py-2 px-2 text-right">
                  {data.revenue.planned 
                    ? ((data.revenue.planned - data.expenses.planned) / data.revenue.planned * 100).toFixed(1) 
                    : '0.0'}%
                </td>
                <td className="py-2 px-2 text-right">
                  {data.revenue.actual 
                    ? ((data.revenue.actual - data.expenses.actual) / data.revenue.actual * 100).toFixed(1) 
                    : '0.0'}%
                </td>
                <td className="py-2 px-2 text-right text-gray-900">
                  {data.revenue.planned && data.revenue.actual 
                    ? (
                        ((data.revenue.actual - data.expenses.actual) / data.revenue.actual * 100) - 
                        ((data.revenue.planned - data.expenses.planned) / data.revenue.planned * 100)
                      ).toFixed(1) 
                    : '0.0'}%
                </td>
                
                {showMonthlyColumns && monthColumns.map(col => (
                  <td key={col.month} className="py-2 px-2 text-right">
                    0.0% {/* Placeholder - echte data nodig */}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 