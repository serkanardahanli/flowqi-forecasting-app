"use client";

import { useState, useEffect } from 'react';
import { getBrowserSupabaseClient } from '@/app/lib/supabase';
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
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

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

interface RevenueMetrics {
  totalRevenue: number;
  plannedRevenue: number;
  revenueChange: number;
  monthlyRevenue: number;
  monthlyChange: number;
  yearlyRevenue: number;
  yearlyChange: number;
}

export default function RevenueOverview() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<RevenueMetrics>({
    totalRevenue: 0,
    plannedRevenue: 0,
    revenueChange: 0,
    monthlyRevenue: 0,
    monthlyChange: 0,
    yearlyRevenue: 0,
    yearlyChange: 0
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const supabase = getBrowserSupabaseClient();
        
        // Haal werkelijke omzet op
        const { data: actualRevenueData, error: actualRevenueError } = await supabase
          .from('actual_entries')
          .select('*')
          .eq('entry_type', 'revenue')
          .order('created_at', { ascending: false });
          
        if (actualRevenueError) throw new Error(`Error fetching actual revenue: ${actualRevenueError.message}`);
        
        // Haal begrote omzet op
        const { data: budgetRevenueData, error: budgetRevenueError } = await supabase
          .from('budget_entries')
          .select('*')
          .eq('type', 'revenue')
          .order('created_at', { ascending: false });
          
        if (budgetRevenueError) throw new Error(`Error fetching budget revenue: ${budgetRevenueError.message}`);

        // Bereken metrics
        const totalRevenue = actualRevenueData?.reduce((sum, entry) => sum + (entry.amount || 0), 0) || 0;
        const plannedRevenue = budgetRevenueData?.reduce((sum, entry) => sum + (entry.amount || 0), 0) || 0;
        const revenueChange = plannedRevenue > 0 ? ((totalRevenue - plannedRevenue) / plannedRevenue) * 100 : 0;

        // Bereken maandelijkse en jaarlijkse metrics
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth() + 1;
        const currentYear = currentDate.getFullYear();

        const monthlyRevenue = actualRevenueData?.filter(entry => {
          const entryDate = new Date(entry.created_at || '');
          return entryDate.getMonth() + 1 === currentMonth && entryDate.getFullYear() === currentYear;
        }).reduce((sum, entry) => sum + (entry.amount || 0), 0) || 0;

        const yearlyRevenue = actualRevenueData?.filter(entry => {
          const entryDate = new Date(entry.created_at || '');
          return entryDate.getFullYear() === currentYear;
        }).reduce((sum, entry) => sum + (entry.amount || 0), 0) || 0;

        setMetrics({
          totalRevenue,
          plannedRevenue,
          revenueChange,
          monthlyRevenue,
          monthlyChange: 0, // Bereken dit op basis van vorige maand
          yearlyRevenue,
          yearlyChange: 0 // Bereken dit op basis van vorig jaar
        });
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Er is een fout opgetreden bij het ophalen van de omzetgegevens');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-gray-900">Omzet Overzicht</h1>
      
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Revenue KPI */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-sm font-medium text-gray-500">Totale Omzet</h3>
            <div className={`flex items-center px-2 py-1 rounded-full text-xs font-semibold ${metrics.revenueChange >= 0 ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100'}`}>
              {metrics.revenueChange >= 0 ? <ArrowUpIcon /> : <ArrowDownIcon />}
              {Math.abs(metrics.revenueChange)}%
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900">{formatCurrency(metrics.totalRevenue)}</div>
          <div className="mt-2 text-sm text-gray-600">Totaal omzet dit jaar</div>
        </div>

        {/* Monthly Revenue KPI */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-sm font-medium text-gray-500">Omzet Deze Maand</h3>
            <div className={`flex items-center px-2 py-1 rounded-full text-xs font-semibold ${metrics.monthlyChange >= 0 ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100'}`}>
              {metrics.monthlyChange >= 0 ? <ArrowUpIcon /> : <ArrowDownIcon />}
              {Math.abs(metrics.monthlyChange)}%
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900">{formatCurrency(metrics.monthlyRevenue)}</div>
          <div className="mt-2 text-sm text-gray-600">Omzet deze maand</div>
        </div>

        {/* Yearly Revenue KPI */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-sm font-medium text-gray-500">Omzet Dit Jaar</h3>
            <div className={`flex items-center px-2 py-1 rounded-full text-xs font-semibold ${metrics.yearlyChange >= 0 ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100'}`}>
              {metrics.yearlyChange >= 0 ? <ArrowUpIcon /> : <ArrowDownIcon />}
              {Math.abs(metrics.yearlyChange)}%
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900">{formatCurrency(metrics.yearlyRevenue)}</div>
          <div className="mt-2 text-sm text-gray-600">Omzet dit jaar</div>
        </div>

        {/* Planned vs Actual KPI */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-sm font-medium text-gray-500">Gepland vs Werkelijk</h3>
            <div className={`flex items-center px-2 py-1 rounded-full text-xs font-semibold ${metrics.revenueChange >= 0 ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100'}`}>
              {metrics.revenueChange >= 0 ? <ArrowUpIcon /> : <ArrowDownIcon />}
              {Math.abs(metrics.revenueChange)}%
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900">{formatCurrency(metrics.plannedRevenue)}</div>
          <div className="mt-2 text-sm text-gray-600">Geplande omzet</div>
        </div>
      </div>

      {/* Financial Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Revenue Trend Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Omzet Trend</h2>
          <div className="h-64">
            <Line
              data={{
                labels: ['Jan', 'Feb', 'Mrt', 'Apr', 'Mei', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec'],
                datasets: [
                  {
                    label: 'Werkelijke Omzet',
                    data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // Vul dit met echte data
                    borderColor: 'rgb(34, 197, 94)',
                    backgroundColor: 'rgba(34, 197, 94, 0.5)',
                  },
                  {
                    label: 'Geplande Omzet',
                    data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // Vul dit met echte data
                    borderColor: 'rgb(59, 130, 246)',
                    backgroundColor: 'rgba(59, 130, 246, 0.5)',
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
                }
              }}
            />
          </div>
        </div>

        {/* Planned vs Actual Comparison */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Gepland vs Werkelijk</h2>
          <div className="space-y-6">
            <div>
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-medium text-gray-500">Totale Omzet</h3>
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
                  <p className="text-lg font-semibold text-gray-900">{formatCurrency(metrics.totalRevenue)}</p>
                </div>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-medium text-gray-500">Maandelijkse Omzet</h3>
                <div className={`flex items-center px-2 py-1 rounded-full text-xs font-semibold ${metrics.monthlyChange >= 0 ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100'}`}>
                  {metrics.monthlyChange >= 0 ? <ArrowUpIcon /> : <ArrowDownIcon />}
                  {Math.abs(metrics.monthlyChange)}%
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-500">Gepland</p>
                  <p className="text-lg font-semibold text-gray-900">{formatCurrency(metrics.plannedRevenue / 12)}</p>
                </div>
                <div className="bg-green-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-500">Werkelijk</p>
                  <p className="text-lg font-semibold text-gray-900">{formatCurrency(metrics.monthlyRevenue)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Formatteer valuta voor weergave
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(amount);
}; 