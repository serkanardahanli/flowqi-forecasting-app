'use client';

import { useState } from 'react';
import Layout from '@/app/components/Layout';

export default function BudgetPage() {
  const [activeTab, setActiveTab] = useState('planned');
  const [activeYear, setActiveYear] = useState(2025);
  
  // Demo data voor inkomsten per maand
  const monthlyRevenue = {
    consultancy: [45000, 45000, 45000, 45000, 45000, 45000, 20000, 20000, 20000, 5000, 5000, 5000],
    saas: [0, 0, 0, 0, 0, 0, 0, 0, 0, 25000, 50000, 75000]
  };

  // Demo data voor uitgaven per categorie
  const monthlyExpenses = {
    '4000': { description: 'Personeelskosten', values: [25000, 25000, 25000, 25000, 25000, 25000, 25000, 25000, 25000, 25000, 25000, 25000] },
    '4400': { description: 'Marketing', values: [7500, 7500, 7500, 7500, 7500, 7500, 7500, 7500, 7500, 5000, 5000, 5000] },
    '4600': { description: 'R&D', values: [4000, 4000, 4000, 4000, 4000, 4000, 4000, 4000, 4000, 4000, 4000, 4000] },
    '4700': { description: 'Kantoorkosten', values: [2500, 2500, 2500, 2500, 2500, 2500, 2500, 2500, 2500, 2500, 2500, 2500] },
    '4800': { description: 'Reiskosten', values: [1500, 1500, 1500, 1500, 1500, 1500, 1500, 1500, 1500, 1500, 1500, 1500] }
  };

  // Maanden Array
  const months = [
    'Jan', 'Feb', 'Mrt', 'Apr', 'Mei', 'Jun', 
    'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec'
  ];
  
  // Functie om een nieuwe kostenpost toe te voegen
  const handleAddExpense = () => {
    alert('Functie "Voeg kostenpost toe" is aangeroepen!');
    // In een echte implementatie zou je hier een nieuwe kostenpost toevoegen
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-[#6366F1]">Budget Planning</h1>
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
            <button className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm text-[#6366F1] hover:bg-gray-50">
              Exporteren
            </button>
          </div>
        </div>

        {/* KPI Kaarten */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
            <div className="text-sm font-medium text-gray-500 mb-2">Geplande omzet 2025</div>
            <div className="flex justify-between items-center">
              <div className="text-2xl font-bold text-gray-800">€425K</div>
              <span className="text-green-500">✓</span>
            </div>
            <div className="mt-1 text-xs text-gray-500">
              SaaS 38%, Consultancy 62%
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
            <div className="text-sm font-medium text-gray-500 mb-2">Geplande kosten 2025</div>
            <div className="flex justify-between items-center">
              <div className="text-2xl font-bold text-gray-800">€350K</div>
              <span className="text-green-500">✓</span>
            </div>
            <div className="mt-1 text-xs text-gray-500">
              Personeel 39%, R&D 14%
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
            <div className="text-sm font-medium text-gray-500 mb-2">Verwacht resultaat 2025</div>
            <div className="flex justify-between items-center">
              <div className="text-2xl font-bold text-gray-800">€75K</div>
              <span className="text-green-500">✓</span>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
            <div className="text-sm font-medium text-gray-500 mb-2">Marketing target</div>
            <div className="flex justify-between items-center">
              <div className="text-2xl font-bold text-gray-800">€75K/80K</div>
              <span className="text-yellow-500">⚠</span>
            </div>
            <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
              <div className="bg-[#6366F1] h-2 rounded-full" style={{ width: '94%' }}></div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('planned')}
              className={`
                py-4 px-1 border-b-2 font-medium text-sm
                ${activeTab === 'planned' 
                  ? 'border-[#6366F1] text-[#6366F1]' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
              `}
            >
              📈 Geplande Budget
            </button>
            <button
              onClick={() => setActiveTab('realized')}
              className={`
                py-4 px-1 border-b-2 font-medium text-sm
                ${activeTab === 'realized' 
                  ? 'border-[#6366F1] text-[#6366F1]' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
              `}
            >
              📊 Realisatie vs Planning
            </button>
          </nav>
        </div>

        {/* Tab content */}
        {activeTab === 'planned' && (
          <div className="space-y-6">
            {/* Inkomsten */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-5 border-b border-gray-200">
                <h2 className="text-lg font-medium text-[#6366F1]">Inkomsten Planning</h2>
              </div>
              <div className="p-6">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr>
                        <th className="px-3 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Type
                        </th>
                        {months.map((month) => (
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
                      <tr>
                        <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          Consultancy
                        </td>
                        {monthlyRevenue.consultancy.map((amount, index) => (
                          <td key={index} className="px-3 py-4 whitespace-nowrap text-right text-sm text-gray-500">
                            <input
                              type="text"
                              defaultValue={`€${amount.toLocaleString('nl-NL')}`}
                              className="w-24 text-right border-b border-dashed border-gray-300 focus:outline-none focus:border-[#6366F1]"
                            />
                          </td>
                        ))}
                        <td className="px-3 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900 bg-gray-50">
                          €{monthlyRevenue.consultancy.reduce((sum, amount) => sum + amount, 0).toLocaleString('nl-NL')}
                        </td>
                      </tr>
                      <tr>
                        <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          SaaS
                        </td>
                        {monthlyRevenue.saas.map((amount, index) => (
                          <td key={index} className="px-3 py-4 whitespace-nowrap text-right text-sm text-gray-500">
                            <input
                              type="text"
                              defaultValue={`€${amount.toLocaleString('nl-NL')}`}
                              className="w-24 text-right border-b border-dashed border-gray-300 focus:outline-none focus:border-[#6366F1]"
                            />
                          </td>
                        ))}
                        <td className="px-3 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900 bg-gray-50">
                          €{monthlyRevenue.saas.reduce((sum, amount) => sum + amount, 0).toLocaleString('nl-NL')}
                        </td>
                      </tr>
                      <tr className="bg-gray-50">
                        <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          Totaal
                        </td>
                        {months.map((_, index) => {
                          const total = monthlyRevenue.consultancy[index] + monthlyRevenue.saas[index];
                          return (
                            <td key={index} className="px-3 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                              €{total.toLocaleString('nl-NL')}
                            </td>
                          );
                        })}
                        <td className="px-3 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900 bg-gray-100">
                          €{
                            [...monthlyRevenue.consultancy, ...monthlyRevenue.saas]
                              .reduce((sum, amount) => sum + amount, 0)
                              .toLocaleString('nl-NL')
                          }
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Uitgaven */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-5 border-b border-gray-200">
                <h2 className="text-lg font-medium text-[#6366F1]">Uitgaven Planning</h2>
                <div className="mt-4">
                  <button 
                    onClick={handleAddExpense}
                    className="px-3 py-1.5 bg-[#6366F1] text-white rounded hover:bg-[#4F46E5] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#6366F1] text-sm"
                  >
                    + Voeg kostenpost toe
                  </button>
                </div>
              </div>
              <div className="p-6">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr>
                        <th className="px-3 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Code
                        </th>
                        <th className="px-3 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Omschrijving
                        </th>
                        {months.map((month) => (
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
                      {Object.entries(monthlyExpenses).map(([code, { description, values }]) => (
                        <tr key={code}>
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                            {code}
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {description}
                          </td>
                          {values.map((amount, index) => (
                            <td key={index} className="px-3 py-4 whitespace-nowrap text-right text-sm text-red-600">
                              <input
                                type="text"
                                defaultValue={`-€${amount.toLocaleString('nl-NL')}`}
                                className="w-24 text-right border-b border-dashed border-gray-300 focus:outline-none focus:border-[#6366F1] text-red-600"
                              />
                            </td>
                          ))}
                          <td className="px-3 py-4 whitespace-nowrap text-right text-sm font-medium text-red-600 bg-gray-50">
                            -€{values.reduce((sum, amount) => sum + amount, 0).toLocaleString('nl-NL')}
                          </td>
                        </tr>
                      ))}
                      <tr className="bg-gray-50">
                        <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-900" colSpan={2}>
                          Totaal
                        </td>
                        {months.map((_, monthIndex) => {
                          const total = Object.values(monthlyExpenses).reduce(
                            (sum, { values }) => sum + values[monthIndex], 
                            0
                          );
                          return (
                            <td key={monthIndex} className="px-3 py-4 whitespace-nowrap text-right text-sm font-medium text-red-600">
                              -€{total.toLocaleString('nl-NL')}
                            </td>
                          );
                        })}
                        <td className="px-3 py-4 whitespace-nowrap text-right text-sm font-medium text-red-600 bg-gray-100">
                          -€{
                            Object.values(monthlyExpenses)
                              .flatMap(({ values }) => values)
                              .reduce((sum, amount) => sum + amount, 0)
                              .toLocaleString('nl-NL')
                          }
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Realisatie tab content */}
        {activeTab === 'realized' && (
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-5 border-b border-gray-200">
              <h2 className="text-lg font-medium text-[#6366F1]">Realisatie vs Planning</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <div className="text-sm text-gray-500">KPI Score</div>
                  <div className="text-2xl font-bold mt-1">82%</div>
                  <div className="mt-1 text-xs text-gray-500">
                    Hoe goed presteren we t.o.v. plan
                  </div>
                  <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-[#6366F1] h-2 rounded-full" style={{ width: '82%' }}></div>
                  </div>
                </div>
                
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <div className="text-sm text-gray-500">Burn Rate</div>
                  <div className="text-2xl font-bold mt-1">€20K/mnd</div>
                  <div className="mt-1 text-xs text-gray-500">
                    Huidige uitgaven tempo
                  </div>
                </div>
                
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <div className="text-sm text-gray-500">Top Performer</div>
                  <div className="text-2xl font-bold mt-1">SaaS omzet</div>
                  <div className="mt-1 text-xs text-gray-500">
                    +22% boven verwachting
                  </div>
                </div>
              </div>
              
              <h3 className="font-medium text-lg mb-4 text-[#6366F1]">Omzet Vergelijking</h3>
              <div className="overflow-x-auto mb-6">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categorie</th>
                      <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Gepland</th>
                      <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Werkelijk</th>
                      <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Verschil</th>
                      <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">% Verschil</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    <tr>
                      <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Consultancy</td>
                      <td className="px-3 py-4 whitespace-nowrap text-right text-sm text-gray-500">€345.000</td>
                      <td className="px-3 py-4 whitespace-nowrap text-right text-sm text-gray-500">€312.840</td>
                      <td className="px-3 py-4 whitespace-nowrap text-right text-sm text-red-600">-€32.160</td>
                      <td className="px-3 py-4 whitespace-nowrap text-right text-sm text-red-600">-9.3%</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
} 