'use client';

import { useState, useEffect } from 'react';
import { getBrowserSupabaseClient } from '@/app/lib/supabase';
import Link from 'next/link';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/components/ui/tabs';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';

export default function ForecastsPage() {
  const [year, setYear] = useState(2025);
  const [budgetData, setBudgetData] = useState({
    revenue: [],
    expenses: [],
    totals: {
      revenue: 0,
      expenses: 0,
      profit: 0
    }
  });
  const [kpis, setKpis] = useState({
    plannedRevenue: 0,
    saasPercentage: 0,
    plannedExpenses: 0,
    personnelPercentage: 0,
    rdPercentage: 0,
    marketingSpent: 0,
    marketingTarget: 80000,
    expectedProfit: 0,
    burnRate: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  // Helper functie om data per maand te groeperen
  const processMonthlyData = (data, type) => {
    // Maak een array voor elke maand
    const monthlyData = Array(12).fill().map(() => []);
    let total = 0;
    
    // Verwerk de data per maand
    data?.forEach(entry => {
      const monthIdx = entry.month - 1; // 0-indexed array
      const amount = parseFloat(entry.amount || 0);
      
      if (amount > 0) {
        monthlyData[monthIdx].push({
          id: entry.id,
          code: entry.gl_account?.code || '-',
          description: entry.gl_account ? entry.gl_account.name : (entry.description || '-'),
          amount: amount,
          category: entry.category || 'other'
        });
        total += amount;
      }
    });
    
    return { monthlyData, total };
  };

  // Helper functie om totalen te berekenen
  const calculateTotals = (revenueData, expenseData) => {
    const totalRevenue = revenueData.reduce((sum, entry) => sum + parseFloat(entry.amount || 0), 0);
    const totalExpenses = expenseData.reduce((sum, entry) => sum + parseFloat(entry.amount || 0), 0);
    
    const totalSaas = revenueData
      .filter(entry => entry.category === 'saas')
      .reduce((sum, entry) => sum + parseFloat(entry.amount || 0), 0);
      
    const totalConsultancy = revenueData
      .filter(entry => entry.category === 'consultancy')
      .reduce((sum, entry) => sum + parseFloat(entry.amount || 0), 0);
    
    return {
      revenue: totalRevenue,
      expenses: totalExpenses,
      profit: totalRevenue - totalExpenses,
      saas: totalSaas,
      consultancy: totalConsultancy
    };
  };

  useEffect(() => {
    const fetchForecastData = async () => {
      try {
        const supabase = getBrowserSupabaseClient();
        
        // Haal inkomsten data op inclusief grootboekrekening info
        const { data: incomeData, error: incomeError } = await supabase
          .from('budget_entries')
          .select(`
            *,
            gl_account:gl_account_id(code, name)
          `)
          .eq('type', 'revenue')
          .eq('year', year)
          .order('month', { ascending: true });

        if (incomeError) throw incomeError;

        // Haal uitgaven data op inclusief grootboekrekening info
        const { data: expenseData, error: expenseError } = await supabase
          .from('budget_entries')
          .select(`
            *,
            gl_account:gl_account_id(code, name)
          `)
          .eq('type', 'expense')
          .eq('year', year)
          .order('month', { ascending: true });

        if (expenseError) throw expenseError;

        // Verwerk de data
        const { monthlyData: monthlyRevenue, total: totalRevenue } = processMonthlyData(incomeData, 'revenue');
        const { monthlyData: monthlyExpenses, total: totalExpenses } = processMonthlyData(expenseData, 'expense');
        
        const totals = calculateTotals(incomeData || [], expenseData || []);

        // Update de state met de nieuwe data
        setBudgetData({
          revenue: monthlyRevenue,
          expenses: monthlyExpenses,
          totals: totals
        });

        // Bereken KPIs
        const saasPercentage = totals.revenue > 0 ? Math.round((totals.saas / totals.revenue) * 100) : 0;
        
        const personnelExpenses = (expenseData || [])
          .filter(entry => entry.category === 'personnel')
          .reduce((sum, entry) => sum + parseFloat(entry.amount || 0), 0);

        const rdExpenses = (expenseData || [])
          .filter(entry => entry.category === 'rd')
          .reduce((sum, entry) => sum + parseFloat(entry.amount || 0), 0);

        const marketingExpenses = (expenseData || [])
          .filter(entry => entry.category === 'marketing')
          .reduce((sum, entry) => sum + parseFloat(entry.amount || 0), 0);

        setKpis({
          plannedRevenue: totals.revenue,
          saasPercentage: saasPercentage,
          plannedExpenses: totals.expenses,
          personnelPercentage: Math.round((personnelExpenses / totals.expenses) * 100) || 0,
          rdPercentage: Math.round((rdExpenses / totals.expenses) * 100) || 0,
          marketingSpent: marketingExpenses,
          marketingTarget: 80000, // This could also come from a settings table
          expectedProfit: totals.profit,
          burnRate: Math.round(totals.expenses / 12)
        });

      } catch (error) {
        console.error('Fout bij ophalen van forecast data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchForecastData();
  }, [year]);

  // Helper om status-indicator te tonen
  const getStatusIndicator = (value, target, type = 'standard') => {
    if (type === 'inverse') {
      // Voor metrics waar lager beter is
      return value <= target ? '✅' : value <= target * 1.1 ? '⚠️' : '🔴';
    } else {
      // Voor metrics waar hoger beter is
      return value >= target ? '✅' : value >= target * 0.9 ? '⚠️' : '🔴';
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-[500px]">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
    </div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight text-indigo-800">Forecast & Begroting</h1>
        <div className="flex gap-4">
          <Link 
            href="/forecasts/strategic" 
            className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Strategische Voorspelling
          </Link>
          <select 
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value))}
            className="px-3 py-2 bg-white border border-gray-300 rounded-md text-sm shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value={2024}>2024</option>
            <option value={2025}>2025</option>
            <option value={2026}>2026</option>
          </select>
          <button
            className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Export
          </button>
        </div>
      </div>

      {/* KPI Overzicht */}
      <div className="grid grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Geplande omzet</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">€{(kpis.plannedRevenue/1000).toFixed(0)}K</div>
            <div className="mt-1 flex items-center text-xs text-green-700">
              <span className="inline-block mr-1">+12%</span> t.o.v. vorig jaar
            </div>
            <div className="mt-3">
              <div className="flex justify-between text-xs text-gray-700 mb-1">
                <span>SaaS: {kpis.saasPercentage}%</span>
                <span>Consultancy: {100-kpis.saasPercentage}%</span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500" style={{ width: `${kpis.saasPercentage}%` }}></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Geplande uitgaven</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">€{(kpis.plannedExpenses/1000).toFixed(0)}K</div>
            <div className="mt-1 flex items-center text-xs text-gray-700">
              <span className="inline-block mr-1">Target: max €400K</span>
              <span className="ml-1">{getStatusIndicator(kpis.plannedExpenses, 400000, 'inverse')}</span>
            </div>
            <div className="mt-3">
              <div className="flex justify-between text-xs text-gray-700 mb-1">
                <span>Personeelskosten: {kpis.personnelPercentage}%</span>
                <span>Target: max 40%</span>
              </div>
              <div 
                className={`w-full h-2 rounded-full overflow-hidden ${kpis.personnelPercentage <= 40 ? "bg-green-100" : "bg-red-100"}`}
              >
                <div 
                  className="h-full bg-blue-500" 
                  style={{ width: `${kpis.personnelPercentage}%` }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Marketing & R&D</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-3">
              <div className="flex justify-between text-xs text-gray-800 mb-1">
                <span>Marketing: €{(kpis.marketingSpent/1000).toFixed(0)}K</span>
                <span>Target: €{(kpis.marketingTarget/1000).toFixed(0)}K {getStatusIndicator(kpis.marketingSpent, kpis.marketingTarget)}</span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500" 
                  style={{ width: `${(kpis.marketingSpent/kpis.marketingTarget)*100}%` }}
                ></div>
              </div>
            </div>
            <div className="mb-1">
              <div className="flex justify-between text-xs text-gray-800 mb-1">
                <span>R&D: {kpis.rdPercentage}%</span>
                <span>Target: 15% {getStatusIndicator(kpis.rdPercentage, 15)}</span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500" 
                  style={{ width: `${kpis.rdPercentage/20*100}%` }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Verwacht resultaat</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700">€{(kpis.expectedProfit/1000).toFixed(0)}K</div>
            <div className="text-xs text-gray-700 mt-1">Marge: {((kpis.expectedProfit/kpis.plannedRevenue)*100).toFixed(1)}%</div>
            <div className="mt-3">
              <div className="flex justify-between text-xs text-gray-800 mb-1">
                <span>Burn rate:</span>
                <span>€{(kpis.burnRate/1000).toFixed(0)}K/maand</span>
              </div>
              <div className="flex justify-between text-xs text-gray-800">
                <span>Break-even:</span>
                <span className="text-green-700">✅ Bereikt</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs voor Planned vs Realized */}
      <Tabs defaultValue="planned" className="mt-6">
        <TabsList className="mb-4">
          <TabsTrigger value="planned" className="text-gray-800">📈 Geplande Begroting</TabsTrigger>
          <TabsTrigger value="realized" className="text-gray-800">📊 Realisatie vs Planning</TabsTrigger>
        </TabsList>
        
        <TabsContent value="planned" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-indigo-800">Inkomsten Planning</CardTitle>
              <CardDescription className="text-gray-700">
                Plan je inkomsten per maand, opgesplitst naar Consultancy en SaaS abonnementen
              </CardDescription>
              <div className="flex justify-end">
                <Link 
                  href="/budget/revenue" 
                  className="text-sm text-indigo-600 hover:text-indigo-800"
                >
                  Beheer in Omzetbeheer
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b">
                      <th className="text-left p-2 text-gray-800">Type</th>
                      {Array(12).fill(0).map((_, i) => (
                        <th key={i} className="text-right p-2 text-gray-800">
                          {new Date(0, i).toLocaleString('nl-NL', { month: 'short' })}
                        </th>
                      ))}
                      <th className="text-right p-2 text-gray-800">Totaal</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="p-2 font-medium text-gray-800">Consultancy</td>
                      {Array(12).fill(0).map((_, i) => {
                        const monthData = budgetData.revenue[i] || [];
                        const consultancyAmount = monthData
                          .filter(entry => entry.category === 'consultancy')
                          .reduce((sum, entry) => sum + (entry.amount || 0), 0);
                        return (
                          <td key={i} className="text-right p-2 text-gray-800">
                            {consultancyAmount > 0 ? `€${consultancyAmount.toLocaleString('nl-NL')}` : ''}
                          </td>
                        );
                      })}
                      <td className="text-right p-2 font-medium text-gray-800">
                        €{((budgetData.totals.revenue * (100 - kpis.saasPercentage)) / 100).toLocaleString('nl-NL')}
                      </td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-2 font-medium text-gray-800">SaaS</td>
                      {Array(12).fill(0).map((_, i) => {
                        const monthData = budgetData.revenue[i] || [];
                        const saasAmount = monthData
                          .filter(entry => entry.category === 'saas')
                          .reduce((sum, entry) => sum + (entry.amount || 0), 0);
                        return (
                          <td key={i} className="text-right p-2 text-gray-800">
                            {saasAmount > 0 ? `€${saasAmount.toLocaleString('nl-NL')}` : ''}
                          </td>
                        );
                      })}
                      <td className="text-right p-2 font-medium text-gray-800">
                        €{((budgetData.totals.revenue * kpis.saasPercentage) / 100).toLocaleString('nl-NL')}
                      </td>
                    </tr>
                    <tr className="font-bold bg-gray-50">
                      <td className="p-2 text-gray-800">Totaal</td>
                      {Array(12).fill(0).map((_, i) => {
                        const monthData = budgetData.revenue[i] || [];
                        const monthTotal = monthData.reduce((sum, entry) => sum + (entry.amount || 0), 0);
                        return (
                          <td key={i} className="text-right p-2 text-gray-800">
                            {monthTotal > 0 ? `€${monthTotal.toLocaleString('nl-NL')}` : ''}
                          </td>
                        );
                      })}
                      <td className="text-right p-2 text-gray-800">
                        €{budgetData.totals.revenue.toLocaleString('nl-NL')}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-indigo-800">Uitgaven Planning</CardTitle>
              <CardDescription className="text-gray-700">
                Plan je uitgaven per maand, opgesplitst naar verschillende kostenposten
              </CardDescription>
              <div className="flex justify-end">
                <Link 
                  href="/budget/expenses" 
                  className="text-sm text-indigo-600 hover:text-indigo-800"
                >
                  Beheer in Uitgavenbeheer
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b">
                      <th className="text-left p-2 text-gray-800">Code</th>
                      <th className="text-left p-2 text-gray-800">Omschrijving</th>
                      {Array(12).fill(0).map((_, i) => (
                        <th key={i} className="text-right p-2 text-gray-800">
                          {new Date(0, i).toLocaleString('nl-NL', { month: 'short' })}
                        </th>
                      ))}
                      <th className="text-right p-2 text-gray-800">Totaal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {budgetData.expenses.some(month => month && month.length > 0) ? (
                      budgetData.expenses.flatMap((month, monthIdx) => 
                        (month || []).map((entry, entryIdx) => (
                          <tr key={`${entry.id}-${monthIdx}-${entryIdx}`} className="border-b">
                            <td className="p-2 text-gray-800">{entry.code || '-'}</td>
                            <td className="p-2 text-gray-800">{entry.description || '-'}</td>
                            {Array(12).fill(0).map((_, i) => (
                              <td key={i} className="text-right p-2 text-red-700">
                                {i === monthIdx && entry.amount ? `-€${entry.amount.toLocaleString('nl-NL')}` : ''}
                              </td>
                            ))}
                            <td className="text-right p-2 text-red-700">
                              {entry.amount ? `-€${entry.amount.toLocaleString('nl-NL')}` : '-'}
                            </td>
                          </tr>
                        ))
                      )
                    ) : (
                      <tr>
                        <td colSpan={14} className="p-4 text-center text-gray-500">
                          Geen uitgaven gevonden voor dit jaar
                        </td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot>
                    <tr className="font-bold bg-gray-50">
                      <td colSpan={2} className="p-2 text-gray-800">Totaal</td>
                      {Array(12).fill(0).map((_, i) => {
                        const monthData = budgetData.expenses[i] || [];
                        const monthTotal = monthData.reduce((sum, entry) => sum + (entry.amount || 0), 0);
                        return (
                          <td key={i} className="text-right p-2 text-red-700">
                            {monthTotal > 0 ? `-€${monthTotal.toLocaleString('nl-NL')}` : ''}
                          </td>
                        );
                      })}
                      <td className="text-right p-2 text-red-700">
                        -€{budgetData.totals.expenses.toLocaleString('nl-NL')}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="realized" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-indigo-800">Realisatie vs Planning</CardTitle>
              <CardDescription className="text-gray-700">
                Vergelijk de geplande begroting met de gerealiseerde resultaten
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b">
                      <th className="text-left p-2 text-gray-800">Maand</th>
                      <th className="text-right p-2 text-gray-800">Geplande Inkomsten</th>
                      <th className="text-right p-2 text-gray-800">Geplande Uitgaven</th>
                      <th className="text-right p-2 text-gray-800">Resultaat</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array(12).fill(0).map((_, i) => {
                      const monthRevenue = budgetData.revenue[i]?.amount || 0;
                      const monthExpenses = budgetData.expenses[i]?.amount || 0;
                      const monthResult = monthRevenue - monthExpenses;
                      
                      return (
                        <tr key={i} className="border-b">
                          <td className="p-2 text-gray-800">
                            {new Date(0, i).toLocaleString('nl-NL', { month: 'long' })}
                          </td>
                          <td className="text-right p-2 text-gray-800">
                            €{monthRevenue.toLocaleString('nl-NL')}
                          </td>
                          <td className="text-right p-2 text-red-700">
                            -€{monthExpenses.toLocaleString('nl-NL')}
                          </td>
                          <td className={`text-right p-2 ${monthResult >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                            {monthResult >= 0 ? '€' : '-€'}{Math.abs(monthResult).toLocaleString('nl-NL')}
                          </td>
                        </tr>
                      );
                    })}
                    <tr className="font-bold bg-gray-50">
                      <td className="p-2 text-gray-800">Totaal</td>
                      <td className="text-right p-2 text-gray-800">
                        €{budgetData.totals.revenue.toLocaleString('nl-NL')}
                      </td>
                      <td className="text-right p-2 text-red-700">
                        -€{budgetData.totals.expenses.toLocaleString('nl-NL')}
                      </td>
                      <td className={`text-right p-2 ${budgetData.totals.profit >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                        {budgetData.totals.profit >= 0 ? '€' : '-€'}{Math.abs(budgetData.totals.profit).toLocaleString('nl-NL')}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="mt-8 grid grid-cols-2 gap-8">
                <div>
                  <h3 className="text-lg font-medium mb-4 text-indigo-800">Inkomsten Vergelijking</h3>
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 text-gray-800">Categorie</th>
                        <th className="text-right py-2 text-gray-800">Gepland</th>
                        <th className="text-right py-2 text-gray-800">Gerealiseerd</th>
                        <th className="text-right py-2 text-gray-800">Verschil</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b">
                        <td className="py-2 text-gray-800">Consultancy</td>
                        <td className="text-right py-2 text-gray-800">
                          €{budgetData.totals.revenue.toLocaleString('nl-NL')}
                        </td>
                        <td className="text-right py-2 text-gray-800">-</td>
                        <td className="text-right py-2 text-gray-800">-</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2 text-gray-800">SaaS</td>
                        <td className="text-right py-2 text-gray-800">
                          €{(budgetData.totals.revenue * (kpis.saasPercentage / 100)).toLocaleString('nl-NL')}
                        </td>
                        <td className="text-right py-2 text-gray-800">-</td>
                        <td className="text-right py-2 text-gray-800">-</td>
                      </tr>
                      <tr className="font-medium">
                        <td className="py-2 text-gray-800">Totaal</td>
                        <td className="text-right py-2 text-gray-800">
                          €{budgetData.totals.revenue.toLocaleString('nl-NL')}
                        </td>
                        <td className="text-right py-2 text-gray-800">-</td>
                        <td className="text-right py-2 text-gray-800">-</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-4 text-indigo-800">Uitgaven Vergelijking</h3>
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 text-gray-800">Categorie</th>
                        <th className="text-right py-2 text-gray-800">Gepland</th>
                        <th className="text-right py-2 text-gray-800">Gerealiseerd</th>
                        <th className="text-right py-2 text-gray-800">Verschil</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b">
                        <td className="py-2 text-gray-800">Personeelskosten</td>
                        <td className="text-right py-2 text-gray-800">
                          €{(budgetData.totals.expenses * (kpis.personnelPercentage / 100)).toLocaleString('nl-NL')}
                        </td>
                        <td className="text-right py-2 text-gray-800">-</td>
                        <td className="text-right py-2 text-gray-800">-</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2 text-gray-800">Marketing</td>
                        <td className="text-right py-2 text-gray-800">
                          €{kpis.marketingSpent.toLocaleString('nl-NL')}
                        </td>
                        <td className="text-right py-2 text-gray-800">-</td>
                        <td className="text-right py-2 text-gray-800">-</td>
                      </tr>
                      <tr className="font-medium">
                        <td className="py-2 text-gray-800">Totaal</td>
                        <td className="text-right py-2 text-gray-800">
                          €{budgetData.totals.expenses.toLocaleString('nl-NL')}
                        </td>
                        <td className="text-right py-2 text-gray-800">-</td>
                        <td className="text-right py-2 text-gray-800">-</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-indigo-800">KPI Prestaties</CardTitle>
              <CardDescription className="text-gray-700">
                Overzicht van de belangrijkste KPI's en hun prestaties
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <h3 className="text-lg font-medium mb-4 text-indigo-800">Omzet Targets</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-800">SaaS Omzet %</span>
                        <span className="text-gray-800">38% / 40%</span>
                      </div>
                      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-500" 
                          style={{ width: `${kpis.saasPercentage}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-800">Gemiddelde uurprijs Consultancy</span>
                        <span className="text-gray-800">€95 / €100</span>
                      </div>
                      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-500" 
                          style={{ width: `${kpis.rdPercentage/20*100}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-800">Recurring Revenue %</span>
                        <span className="text-gray-800">45% / 50%</span>
                      </div>
                      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-500" 
                          style={{ width: `${(kpis.marketingSpent/kpis.marketingTarget)*100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-4 text-indigo-800">Kosten Targets</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-800">Personeelskosten %</span>
                        <span className="text-gray-800">39% / 40%</span>
                      </div>
                      <div 
                        className={`w-full h-2 rounded-full overflow-hidden ${kpis.personnelPercentage <= 40 ? "bg-green-100" : "bg-red-100"}`}
                      >
                        <div 
                          className="h-full bg-blue-500" 
                          style={{ width: `${kpis.personnelPercentage}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-800">R&D Investering %</span>
                        <span className="text-gray-800">14% / 15%</span>
                      </div>
                      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-500" 
                          style={{ width: `${kpis.rdPercentage/20*100}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-800">Marketing Budget Gebruik</span>
                        <span className="text-gray-800">€75K / €80K</span>
                      </div>
                      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-500" 
                          style={{ width: `${(kpis.marketingSpent/kpis.marketingTarget)*100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 