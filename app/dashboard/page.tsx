"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { getBrowserSupabaseClient } from '@/app/lib/supabase';
import type { Database } from '@/types/supabase';
import type { Forecast, BudgetScenario } from '@/types/forecast';
import { useRouter } from 'next/navigation';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import PeriodFilter from '@/app/components/PeriodFilter';

// Registreer Chart.js componenten
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

// Simple SVG icons instead of HeroIcons
const ArrowUpIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
    <polyline points="18 15 12 9 6 15"></polyline>
  </svg>
);

const ArrowDownIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
    <polyline points="6 9 12 15 18 9"></polyline>
  </svg>
);

const ArrowRightIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-1">
    <line x1="5" y1="12" x2="19" y2="12"></line>
    <polyline points="12 5 19 12 12 19"></polyline>
  </svg>
);

interface FinancialMetrics {
  revenue: number;
  expenses: number;
  profit: number;
  margin: number;
  revenueChange: number;
  expensesChange: number;
  profitChange: number;
  marginChange: number;
  plannedRevenue: number;
  plannedExpenses: number;
  plannedProfit: number;
}

interface FinancialData {
  id?: string;
  created_at?: string;
  gl_account_id?: string;
  amount?: number;
  month?: number;
  year?: number;
  type?: string;
  description?: string;
  budget_type?: string;
  product_id?: string;
}

// Helper functie om inkomsten/uitgaven te consolideren vanuit verschillende bronnen
const consolidateFinancialData = (entries: any[], type: 'revenue' | 'expense'): FinancialData[] => {
  if (!entries || entries.length === 0) return [];
  
  // Zorg ervoor dat alle vereiste velden aanwezig zijn
  return entries.map(entry => {
    const result: FinancialData = {
      id: entry.id || `generated-${Math.random().toString(36).substring(2, 9)}`,
      created_at: entry.created_at || new Date().toISOString(),
      gl_account_id: entry.gl_account_id || '',
      amount: typeof entry.amount === 'number' ? entry.amount : 0,
      month: entry.month || (new Date().getMonth() + 1),
      year: entry.year || new Date().getFullYear(),
      type: entry.type || (type === 'revenue' ? 'revenue' : 'expense'),
      description: entry.description || (type === 'revenue' ? 'Omzet' : 'Uitgave')
    };
    
    return result;
  });
};

export default function Dashboard() {
  const router = useRouter();
  const [forecasts, setForecasts] = useState<Forecast[]>([]);
  const [scenarios, setScenarios] = useState<BudgetScenario[]>([]);
  const [loading, setLoading] = useState(true);
  const [revenueData, setRevenueData] = useState<FinancialData[]>([]);
  const [expensesData, setExpensesData] = useState<FinancialData[]>([]);
  const [metrics, setMetrics] = useState<FinancialMetrics>({
    revenue: 0,
    expenses: 0,
    profit: 0,
    margin: 0,
    revenueChange: 0,
    expensesChange: 0,
    profitChange: 0,
    marginChange: 0,
    plannedRevenue: 0,
    plannedExpenses: 0,
    plannedProfit: 0
  });
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState({
    startMonth: 1,
    endMonth: 3,
    year: new Date().getFullYear()
  });
  const [periodFilter, setPeriodFilter] = useState('q1');

  const handlePeriodChange = (value: string) => {
    console.log('Period changed:', value);
    setPeriodFilter(value);
    
    // Bereken de juiste maanden op basis van de geselecteerde periode
    let startMonth = 1;
    let endMonth = 12;
    
    switch (value) {
      case 'q1':
        startMonth = 1;
        endMonth = 3;
        break;
      case 'q2':
        startMonth = 4;
        endMonth = 6;
        break;
      case 'q3':
        startMonth = 7;
        endMonth = 9;
        break;
      case 'q4':
        startMonth = 10;
        endMonth = 12;
        break;
      case 'h1':
        startMonth = 1;
        endMonth = 6;
        break;
      case 'h2':
        startMonth = 7;
        endMonth = 12;
        break;
      case 'year':
        startMonth = 1;
        endMonth = 12;
        break;
      default:
        // Voor individuele maanden (m1-m12)
        if (value.startsWith('m')) {
          const month = parseInt(value.substring(1));
          startMonth = month;
          endMonth = month;
        }
    }
    
    setSelectedPeriod({
      startMonth,
      endMonth,
      year: new Date().getFullYear()
    });
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const supabase = getBrowserSupabaseClient();
        
        // Haal werkelijke inkomsten op
        const { data: actualRevenueData, error: actualRevenueError } = await supabase
          .from('actual_entries')
          .select('*')
          .eq('entry_type', 'revenue')
          .eq('year', selectedPeriod.year)
          .gte('month', selectedPeriod.startMonth)
          .lte('month', selectedPeriod.endMonth)
          .order('created_at', { ascending: false });
          
        if (actualRevenueError) {
          throw new Error(`Error fetching actual revenue: ${actualRevenueError.message}`);
        }
        
        // Haal werkelijke uitgaven op
        const { data: actualExpensesData, error: actualExpensesError } = await supabase
          .from('actual_entries')
          .select('*')
          .eq('entry_type', 'expense')
          .eq('year', selectedPeriod.year)
          .gte('month', selectedPeriod.startMonth)
          .lte('month', selectedPeriod.endMonth)
          .order('created_at', { ascending: false });
          
        if (actualExpensesError) {
          throw new Error(`Error fetching actual expenses: ${actualExpensesError.message}`);
        }
        
        // Haal begrote inkomsten op
        const { data: budgetRevenueData, error: budgetRevenueError } = await supabase
          .from('budget_entries')
          .select('*')
          .eq('type', 'revenue')
          .eq('year', selectedPeriod.year)
          .gte('month', selectedPeriod.startMonth)
          .lte('month', selectedPeriod.endMonth)
          .order('created_at', { ascending: false });
          
        if (budgetRevenueError) {
          throw new Error(`Error fetching budget revenue: ${budgetRevenueError.message}`);
        }
        
        // Haal begrote uitgaven op
        const { data: budgetExpensesData, error: budgetExpensesError } = await supabase
          .from('budget_entries')
          .select('*')
          .eq('type', 'expense')
          .eq('year', selectedPeriod.year)
          .gte('month', selectedPeriod.startMonth)
          .lte('month', selectedPeriod.endMonth)
          .order('created_at', { ascending: false });
          
        if (budgetExpensesError) {
          throw new Error(`Error fetching budget expenses: ${budgetExpensesError.message}`);
        }
        
        // Verwerk de gegevens voor het dashboard
        const processedRevenueData = consolidateFinancialData(actualRevenueData || [], 'revenue');
        const processedExpensesData = consolidateFinancialData(actualExpensesData || [], 'expense');
        
        setRevenueData(processedRevenueData);
        setExpensesData(processedExpensesData);
        
        // Bereken de totale inkomsten en uitgaven voor de dashboard metrics
        const totalRevenue = processedRevenueData.reduce((sum, entry) => sum + (entry.amount || 0), 0);
        const totalExpenses = processedExpensesData.reduce((sum, entry) => sum + (entry.amount || 0), 0);
        const profit = totalRevenue - totalExpenses;
        const margin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;

        // Bereken de geplande waarden
        const plannedRevenue = budgetRevenueData?.reduce((sum, entry) => sum + (entry.amount || 0), 0) || 0;
        const plannedExpenses = budgetExpensesData?.reduce((sum, entry) => sum + (entry.amount || 0), 0) || 0;
        const plannedProfit = plannedRevenue - plannedExpenses;
        
        // Bereken de veranderingen ten opzichte van gepland
        const revenueChange = plannedRevenue > 0 ? ((totalRevenue - plannedRevenue) / plannedRevenue) * 100 : 0;
        const expensesChange = plannedExpenses > 0 ? ((totalExpenses - plannedExpenses) / plannedExpenses) * 100 : 0;
        const profitChange = plannedProfit !== 0 ? ((profit - plannedProfit) / Math.abs(plannedProfit)) * 100 : 0;
        const marginChange = margin - (plannedRevenue > 0 ? (plannedProfit / plannedRevenue) * 100 : 0);
        
        setMetrics({
          revenue: totalRevenue,
          expenses: totalExpenses,
          profit: profit,
          margin: margin,
          revenueChange: revenueChange,
          expensesChange: expensesChange,
          profitChange: profitChange,
          marginChange: marginChange,
          plannedRevenue: plannedRevenue,
          plannedExpenses: plannedExpenses,
          plannedProfit: plannedProfit
        });
      } catch (error) {
        console.error('Error fetching data:', error instanceof Error ? error.message : String(error));
        setError('Er is een fout opgetreden bij het ophalen van gegevens voor het dashboard');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [selectedPeriod]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <PeriodFilter onChange={handlePeriodChange} />
      </div>
      
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Revenue KPI */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-sm font-medium text-gray-500">Omzet</h3>
            <div className={`flex items-center px-2 py-1 rounded-full text-xs font-semibold ${metrics.revenueChange >= 0 ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100'}`}>
              {metrics.revenueChange >= 0 ? <ArrowUpIcon /> : <ArrowDownIcon />}
              {Math.abs(metrics.revenueChange)}%
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900">{formatCurrency(metrics.revenue)}</div>
          <div className="mt-2 text-sm text-gray-600">Totaal omzet dit jaar</div>
        </div>

        {/* Expenses KPI */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-sm font-medium text-gray-500">Uitgaven</h3>
            <div className={`flex items-center px-2 py-1 rounded-full text-xs font-semibold ${metrics.expensesChange <= 0 ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100'}`}>
              {metrics.expensesChange <= 0 ? <ArrowDownIcon /> : <ArrowUpIcon />}
              {Math.abs(metrics.expensesChange)}%
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900">{formatCurrency(metrics.expenses)}</div>
          <div className="mt-2 text-sm text-gray-600">Totaal uitgaven dit jaar</div>
        </div>

        {/* Profit KPI */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-sm font-medium text-gray-500">Resultaat</h3>
            <div className={`flex items-center px-2 py-1 rounded-full text-xs font-semibold ${metrics.profitChange >= 0 ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100'}`}>
              {metrics.profitChange >= 0 ? <ArrowUpIcon /> : <ArrowDownIcon />}
              {Math.abs(metrics.profitChange)}%
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900">{formatCurrency(metrics.profit)}</div>
          <div className="mt-2 text-sm text-gray-600">Netto resultaat dit jaar</div>
        </div>

        {/* Margin KPI */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-sm font-medium text-gray-500">Marge</h3>
            <div className={`flex items-center px-2 py-1 rounded-full text-xs font-semibold ${metrics.marginChange >= 0 ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100'}`}>
              {metrics.marginChange >= 0 ? <ArrowUpIcon /> : <ArrowDownIcon />}
              {Math.abs(metrics.marginChange)}%
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900">{metrics.margin.toFixed(1)}%</div>
          <div className="mt-2 text-sm text-gray-600">Operationele marge</div>
        </div>
      </div>

      {/* Financial Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Revenue vs Expenses Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Omzet vs Uitgaven</h2>
          <div className="relative h-[300px] w-full">
            <Bar
              data={{
                labels: ['Omzet', 'Uitgaven', 'Resultaat'],
                datasets: [
                  {
                    label: 'Bedrag in €',
                    data: [metrics.revenue, metrics.expenses, metrics.profit],
                    backgroundColor: [
                      'rgba(34, 197, 94, 0.5)',
                      'rgba(239, 68, 68, 0.5)',
                      'rgba(59, 130, 246, 0.5)'
                    ],
                    borderColor: [
                      'rgb(34, 197, 94)',
                      'rgb(239, 68, 68)',
                      'rgb(59, 130, 246)'
                    ],
                    borderWidth: 1
                  }
                ]
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: {
                      callback: (value) => formatCurrency(Number(value))
                    }
                  }
                },
                plugins: {
                  legend: {
                    position: 'top' as const,
                    align: 'end' as const
                  }
                }
              }}
            />
          </div>
        </div>

        {/* Planned vs Actual Comparison */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Gepland vs Werkelijk</h2>
          <div className="space-y-6">
            {/* Revenue Comparison */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-medium text-gray-500">Omzet</h3>
                <div className={`flex items-center px-2 py-1 rounded-full text-xs font-semibold ${metrics.revenueChange >= 0 ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100'}`}>
                  {metrics.revenueChange >= 0 ? <ArrowUpIcon /> : <ArrowDownIcon />}
                  {Math.abs(metrics.revenueChange)}%
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-500">Gepland</p>
                  <p className="text-lg font-semibold text-gray-900">{formatCurrency(metrics.plannedRevenue)}</p>
                </div>
                <div className="bg-green-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-500">Werkelijk</p>
                  <p className="text-lg font-semibold text-gray-900">{formatCurrency(metrics.revenue)}</p>
                </div>
              </div>
            </div>

            {/* Expenses Comparison */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-medium text-gray-500">Uitgaven</h3>
                <div className={`flex items-center px-2 py-1 rounded-full text-xs font-semibold ${metrics.expensesChange <= 0 ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100'}`}>
                  {metrics.expensesChange <= 0 ? <ArrowDownIcon /> : <ArrowUpIcon />}
                  {Math.abs(metrics.expensesChange)}%
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-500">Gepland</p>
                  <p className="text-lg font-semibold text-gray-900">{formatCurrency(metrics.plannedExpenses)}</p>
                </div>
                <div className="bg-red-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-500">Werkelijk</p>
                  <p className="text-lg font-semibold text-gray-900">{formatCurrency(metrics.expenses)}</p>
                </div>
              </div>
            </div>

            {/* Profit Comparison */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-medium text-gray-500">Resultaat</h3>
                <div className={`flex items-center px-2 py-1 rounded-full text-xs font-semibold ${metrics.profitChange >= 0 ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100'}`}>
                  {metrics.profitChange >= 0 ? <ArrowUpIcon /> : <ArrowDownIcon />}
                  {Math.abs(metrics.profitChange)}%
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-500">Gepland</p>
                  <p className="text-lg font-semibold text-gray-900">{formatCurrency(metrics.plannedProfit)}</p>
                </div>
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-500">Werkelijk</p>
                  <p className="text-lg font-semibold text-gray-900">{formatCurrency(metrics.profit)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Recente Activiteit</h2>
        <div className="space-y-4">
          {revenueData.length > 0 ? (
            revenueData.slice(0, 5).map((entry, index) => (
              <div key={entry.id || index} className="flex items-center justify-between py-2 border-b">
                <div>
                  <p className="text-sm font-medium text-gray-900">Omzet geregistreerd</p>
                  <p className="text-xs text-gray-500">
                    {entry.month}/{entry.year}
                  </p>
                </div>
                <p className="text-sm font-medium text-gray-900">
                  {formatCurrency(entry.amount || 0)}
                </p>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-500">Geen recente activiteit</p>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Snelle Acties</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link href="/budget/revenue" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700">
            Omzet begroting
            <ArrowRightIcon className="ml-2 h-4 w-4" />
          </Link>
          <Link href="/budget/expenses" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700">
            Uitgaven begroting
            <ArrowRightIcon className="ml-2 h-4 w-4" />
          </Link>
          <Link href="/actual/revenue" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700">
            Actuele omzet
            <ArrowRightIcon className="ml-2 h-4 w-4" />
          </Link>
          <Link href="/actual/expenses" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700">
            Actuele uitgaven
            <ArrowRightIcon className="ml-2 h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}

// Formatteer valuta voor weergave
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(amount);
}; 