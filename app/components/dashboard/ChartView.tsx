'use client';

import React, { useState } from 'react';

interface FinancialCategory {
  code: string;
  name: string;
  planned: number;
  actual: number;
  previousYear?: number;
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

interface ChartViewProps {
  data: FinancialData;
  year: number;
  period: 'month' | 'quarter' | 'half-year' | 'year';
  month: number;
  onCategoryClick: (type: 'revenue' | 'expenses', code: string) => void;
}

export default function ChartView({ data, year, period, month, onCategoryClick }: ChartViewProps) {
  const [chartType, setChartType] = useState<'bar' | 'pie' | 'line'>('bar');
  const [dataType, setDataType] = useState<'revenue' | 'expenses' | 'profit'>('revenue');
  
  return (
    <div className="space-y-8">
      {/* Grafiekbediening */}
      <div className="flex flex-col sm:flex-row justify-between space-y-4 sm:space-y-0 sm:space-x-4 bg-white p-4 rounded-lg shadow">
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2">Grafiektype</h3>
          <div className="inline-flex rounded-md shadow-sm">
            <button
              type="button"
              onClick={() => setChartType('bar')}
              className={`px-3 py-1.5 text-sm font-medium rounded-l-md ${
                chartType === 'bar'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              } border border-gray-300 transition-colors`}
            >
              Staafdiagram
            </button>
            <button
              type="button"
              onClick={() => setChartType('pie')}
              className={`px-3 py-1.5 text-sm font-medium ${
                chartType === 'pie'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              } border-t border-b border-gray-300 transition-colors`}
            >
              Taartdiagram
            </button>
            <button
              type="button"
              onClick={() => setChartType('line')}
              className={`px-3 py-1.5 text-sm font-medium rounded-r-md ${
                chartType === 'line'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              } border border-gray-300 transition-colors`}
            >
              Lijndiagram
            </button>
          </div>
        </div>
        
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2">Gegevenstype</h3>
          <div className="inline-flex rounded-md shadow-sm">
            <button
              type="button"
              onClick={() => setDataType('revenue')}
              className={`px-3 py-1.5 text-sm font-medium rounded-l-md ${
                dataType === 'revenue'
                  ? 'bg-green-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              } border border-gray-300 transition-colors`}
            >
              Inkomsten
            </button>
            <button
              type="button"
              onClick={() => setDataType('expenses')}
              className={`px-3 py-1.5 text-sm font-medium ${
                dataType === 'expenses'
                  ? 'bg-red-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              } border-t border-b border-gray-300 transition-colors`}
            >
              Uitgaven
            </button>
            <button
              type="button"
              onClick={() => setDataType('profit')}
              className={`px-3 py-1.5 text-sm font-medium rounded-r-md ${
                dataType === 'profit'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              } border border-gray-300 transition-colors`}
            >
              Resultaat
            </button>
          </div>
        </div>
      </div>

      {/* Grafiekvisualisatie */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="w-full h-80 flex items-center justify-center">
          {/* Hier zou de daadwerkelijke grafiek rendering komen met een bibliotheek als Chart.js of ReCharts */}
          <div className="text-center">
            <p className="text-gray-700 mb-4">
              {chartType === 'bar' && 'Staafdiagram voor '}
              {chartType === 'pie' && 'Taartdiagram voor '}
              {chartType === 'line' && 'Lijndiagram voor '}
              
              {dataType === 'revenue' && 'inkomsten'}
              {dataType === 'expenses' && 'uitgaven'}
              {dataType === 'profit' && 'resultaat'}
            </p>
            <div className="p-8 bg-gray-100 rounded-lg text-gray-500 flex flex-col items-center">
              <svg className="h-16 w-16 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <p>
                Deze functionaliteit is in ontwikkeling. <br />
                Implementeer hier een grafiekbibliotheek zoals Chart.js of ReCharts.
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Datapunten legenda */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Legenda</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {dataType === 'revenue' && (
            <div className="space-y-2">
              <h4 className="font-medium text-green-800">Inkomsten categorieën</h4>
              <ul className="space-y-1">
                {data.revenue.categories.map(category => (
                  <li key={category.code} className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                    <span 
                      className="cursor-pointer hover:text-green-700 hover:underline"
                      onClick={() => onCategoryClick('revenue', category.code)}
                    >
                      {category.name} ({((category.actual / data.revenue.actual) * 100).toFixed(1)}%)
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {dataType === 'expenses' && (
            <div className="space-y-2">
              <h4 className="font-medium text-red-800">Uitgaven categorieën</h4>
              <ul className="space-y-1">
                {data.expenses.categories.map(category => (
                  <li key={category.code} className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
                    <span 
                      className="cursor-pointer hover:text-red-700 hover:underline"
                      onClick={() => onCategoryClick('expenses', category.code)}
                    >
                      {category.name} ({((category.actual / data.expenses.actual) * 100).toFixed(1)}%)
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {dataType === 'profit' && (
            <div className="space-y-2">
              <h4 className="font-medium text-blue-800">Resultaatoverzicht</h4>
              <ul className="space-y-1">
                <li className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                  <span>Inkomsten: {((data.revenue.actual / (data.revenue.actual + data.expenses.actual)) * 100).toFixed(1)}%</span>
                </li>
                <li className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
                  <span>Uitgaven: {((data.expenses.actual / (data.revenue.actual + data.expenses.actual)) * 100).toFixed(1)}%</span>
                </li>
                <li className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
                  <span>Marge: {((data.revenue.actual - data.expenses.actual) / data.revenue.actual * 100).toFixed(1)}%</span>
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 