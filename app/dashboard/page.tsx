'use client';

import { useState } from 'react';
import Layout from '@/app/components/Layout';

export default function DashboardPage() {
  const [activeYear, setActiveYear] = useState(2025);
  
  // Demo data voor het financieel overzicht
  const financialSummary = {
    revenue: 313000,
    expenses: 13000,
    profit: 300000,
    margin: 96.0,
    growthRevenue: 1568.5,
    growthExpenses: 0.0,
    growthProfit: 1501.8,
    growthMargin: -4.0
  };

  // Demo data voor maandelijks overzicht
  const monthlyData = {
    revenue: {
      consultancy: [43920, 45360, 45360, 45360, 45360, 45360, 14040, 14040, 14040, 0, 0, 0],
      saas: [0, 0, 0, 0, 0, 0, 0, 0, 0, 1200, 4798, 9596]
    },
    expenses: {
      personnel: [12500, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      marketing: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      customerSupport: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      rnd: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      office: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      travel: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-[#6366F1]">Financial Dashboard</h1>
        <div className="flex gap-4">
          <select 
            value={activeYear}
            onChange={(e) => setActiveYear(parseInt(e.target.value))}
            className="px-3 py-2 bg-white border border-gray-300 rounded-md text-sm"
          >
            <option value={2024}>2024</option>
            <option value={2025}>2025</option>
            <option value={2026}>2026</option>
          </select>
          <a 
            href="/uitgavenbeheer" 
            className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm text-[#6366F1] hover:bg-gray-50 inline-flex items-center"
          >
            Ga naar uitgavenbeheer →
          </a>
        </div>
      </div>

      <div className="mb-2 text-gray-600">
        Overzicht van belangrijke financiële indicatoren
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
          <div className="text-sm font-medium text-gray-500 mb-2">Omzet</div>
          <div className="text-2xl font-bold text-gray-800">€{(financialSummary.revenue/1000).toFixed(0)}K</div>
          <div className="mt-1 text-sm text-green-600">↑ {financialSummary.growthRevenue.toFixed(1)}% t.o.v. vorig jaar</div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
          <div className="text-sm font-medium text-gray-500 mb-2">Uitgaven</div>
          <div className="text-2xl font-bold text-gray-800">€{(financialSummary.expenses/1000).toFixed(0)}K</div>
          <div className="mt-1 text-sm text-red-600">↑ {financialSummary.growthExpenses.toFixed(1)}% t.o.v. vorig jaar</div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
          <div className="text-sm font-medium text-gray-500 mb-2">Winst</div>
          <div className="text-2xl font-bold text-gray-800">€{(financialSummary.profit/1000).toFixed(0)}K</div>
          <div className="mt-1 text-sm text-green-600">↑ {financialSummary.growthProfit.toFixed(1)}% t.o.v. vorig jaar</div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
          <div className="text-sm font-medium text-gray-500 mb-2">Marge</div>
          <div className="text-2xl font-bold text-gray-800">{financialSummary.margin.toFixed(1)}%</div>
          <div className="mt-1 text-sm text-red-600">↓ {Math.abs(financialSummary.growthMargin).toFixed(1)}% t.o.v. vorig jaar</div>
        </div>
      </div>

      {/* Monthly Overview */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-5 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-medium text-[#6366F1]">Maandelijks Financieel Overzicht</h2>
            <button className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm text-[#6366F1] hover:bg-gray-50">
              Exporteren
            </button>
          </div>
        </div>
        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-3 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Categorie
                  </th>
                  {['Jan', 'Feb', 'Mrt', 'Apr', 'Mei', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec'].map(month => (
                    <th key={month} className="px-3 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {month}
                    </th>
                  ))}
                  <th className="px-3 py-3 bg-gray-100 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Totaal
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {/* Inkomsten rijen */}
                <tr className="bg-gray-50">
                  <td colSpan={14} className="px-3 py-3 text-left text-sm font-medium text-[#6366F1]">
                    Inkomsten
                  </td>
                </tr>
                {/* Consultancy rij */}
                <tr>
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">Consultancy</td>
                  {monthlyData.revenue.consultancy.map((amount, index) => (
                    <td key={index} className="px-3 py-4 whitespace-nowrap text-right text-sm text-gray-500">
                      €{amount.toLocaleString('nl-NL')}
                    </td>
                  ))}
                  <td className="px-3 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900 bg-gray-50">
                    €{monthlyData.revenue.consultancy.reduce((a, b) => a + b, 0).toLocaleString('nl-NL')}
                  </td>
                </tr>
                {/* SaaS rij */}
                <tr>
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">SaaS</td>
                  {monthlyData.revenue.saas.map((amount, index) => (
                    <td key={index} className="px-3 py-4 whitespace-nowrap text-right text-sm text-gray-500">
                      €{amount.toLocaleString('nl-NL')}
                    </td>
                  ))}
                  <td className="px-3 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900 bg-gray-50">
                    €{monthlyData.revenue.saas.reduce((a, b) => a + b, 0).toLocaleString('nl-NL')}
                  </td>
                </tr>

                {/* Uitgaven rijen */}
                <tr className="bg-gray-50">
                  <td colSpan={14} className="px-3 py-3 text-left text-sm font-medium text-red-600">
                    Uitgaven
                  </td>
                </tr>
                {Object.entries(monthlyData.expenses).map(([category, amounts]) => (
                  <tr key={category}>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                      {category}
                    </td>
                    {amounts.map((amount, index) => (
                      <td key={index} className="px-3 py-4 whitespace-nowrap text-right text-sm text-red-600">
                        {amount > 0 ? `-€${amount.toLocaleString('nl-NL')}` : '€0'}
                      </td>
                    ))}
                    <td className="px-3 py-4 whitespace-nowrap text-right text-sm font-medium text-red-600 bg-gray-50">
                      -€{amounts.reduce((a, b) => a + b, 0).toLocaleString('nl-NL')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}