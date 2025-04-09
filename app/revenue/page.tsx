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
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/outline';
import { formatCurrency } from '@/lib/utils';
import DashboardFilter from '@/app/components/DashboardFilter';
import { Period } from '@/app/types/period';

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

interface RevenueMetrics {
  totalRevenue: number;
  plannedRevenue: number;
  revenueChange: number;
  periodRevenue: number;
  periodChange: number;
  yearToDateRevenue: number;
  yearToDateChange: number;
}

// Helper function to get the last day of a month
const getLastDayOfMonth = (year: number, month: number) => {
  // month should be 1-12, but Date constructor expects 0-11
  return new Date(year, month, 0).getDate();
};

// Helper function to format a date string for Supabase query
const formatDateString = (year: number, month: number, day: number) => {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
};

export default function RevenueOverview() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<Period>({
    label: 'Huidige maand',
    value: 'current',
    dateRange: {
      startMonth: new Date().getMonth() + 1,
      endMonth: new Date().getMonth() + 1
    }
  });
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [metrics, setMetrics] = useState<RevenueMetrics>({
    totalRevenue: 0,
    plannedRevenue: 0,
    revenueChange: 0,
    periodRevenue: 0,
    periodChange: 0,
    yearToDateRevenue: 0,
    yearToDateChange: 0
  });

  const handleFilterChange = (period: Period, year: number) => {
    setSelectedPeriod(period);
    setSelectedYear(year);
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const supabase = getBrowserSupabaseClient();
        
        // Get year-to-date actual revenue first
        const yearStartDate = formatDateString(selectedYear, 1, 1);
        const yearEndDate = formatDateString(selectedYear, 12, 31);
        
        const { data: yearToDateData } = await supabase
          .from('actual_entries')
          .select('*')
          .eq('entry_type', 'revenue')
          .gte('created_at', yearStartDate)
          .lte('created_at', yearEndDate);

        const yearToDateRevenue = yearToDateData?.reduce((sum, entry) => sum + (entry.amount || 0), 0) || 0;

        // Get selected period's actual revenue
        const periodStartDate = formatDateString(selectedYear, selectedPeriod.dateRange.startMonth, 1);
        const periodEndDate = formatDateString(
          selectedYear,
          selectedPeriod.dateRange.endMonth,
          getLastDayOfMonth(selectedYear, selectedPeriod.dateRange.endMonth)
        );
        
        const { data: actualRevenueData, error: actualRevenueError } = await supabase
          .from('actual_entries')
          .select('*')
          .eq('entry_type', 'revenue')
          .gte('created_at', periodStartDate)
          .lte('created_at', periodEndDate);
          
        if (actualRevenueError) throw new Error(`Error fetching actual revenue: ${actualRevenueError.message}`);
        
        // Get selected period's budgeted revenue
        const { data: budgetRevenueData, error: budgetRevenueError } = await supabase
          .from('budget_entries')
          .select('*')
          .eq('type', 'revenue')
          .eq('year', selectedYear)
          .gte('month', selectedPeriod.dateRange.startMonth)
          .lte('month', selectedPeriod.dateRange.endMonth);
          
        if (budgetRevenueError) throw new Error(`Error fetching budget revenue: ${budgetRevenueError.message}`);

        // Calculate metrics for the selected period
        const periodRevenue = actualRevenueData?.reduce((sum, entry) => sum + (entry.amount || 0), 0) || 0;
        const plannedRevenue = budgetRevenueData?.reduce((sum, entry) => sum + (entry.amount || 0), 0) || 0;

        // Calculate changes
        const periodChange = plannedRevenue > 0 ? ((periodRevenue - plannedRevenue) / plannedRevenue) * 100 : -100;

        // Get previous year's data for the same period for comparison
        const prevYearStartDate = formatDateString(selectedYear - 1, selectedPeriod.dateRange.startMonth, 1);
        const prevYearEndDate = formatDateString(
          selectedYear - 1,
          selectedPeriod.dateRange.endMonth,
          getLastDayOfMonth(selectedYear - 1, selectedPeriod.dateRange.endMonth)
        );

        const { data: prevYearData } = await supabase
          .from('actual_entries')
          .select('*')
          .eq('entry_type', 'revenue')
          .gte('created_at', prevYearStartDate)
          .lte('created_at', prevYearEndDate);

        const prevYearRevenue = prevYearData?.reduce((sum, entry) => sum + (entry.amount || 0), 0) || 0;
        const yearOverYearChange = prevYearRevenue > 0 ? ((yearToDateRevenue - prevYearRevenue) / prevYearRevenue) * 100 : 0;

        setMetrics({
          totalRevenue: periodRevenue, // This should show the period revenue
          plannedRevenue,
          revenueChange: periodChange, // This should show the period change
          periodRevenue, // This is for the selected period
          periodChange,
          yearToDateRevenue, // This remains the total for the year
          yearToDateChange: 0
        });

        // Fetch monthly data for the trend chart
        const monthlyData = await Promise.all(
          Array.from({ length: 12 }, async (_, index) => {
            const month = index + 1;
            const monthStart = formatDateString(selectedYear, month, 1);
            const monthEnd = formatDateString(
              selectedYear,
              month,
              getLastDayOfMonth(selectedYear, month)
            );

            // Get actual revenue for this month
            const { data: monthActual } = await supabase
              .from('actual_entries')
              .select('*')
              .eq('entry_type', 'revenue')
              .gte('created_at', monthStart)
              .lte('created_at', monthEnd);

            // Get planned revenue for this month
            const { data: monthPlanned } = await supabase
              .from('budget_entries')
              .select('*')
              .eq('type', 'revenue')
              .eq('year', selectedYear)
              .eq('month', month);

            return {
              actual: monthActual?.reduce((sum, entry) => sum + (entry.amount || 0), 0) || 0,
              planned: monthPlanned?.reduce((sum, entry) => sum + (entry.amount || 0), 0) || 0
            };
          })
        );

        // Update chart data
        const chartData = {
          labels: ['Jan', 'Feb', 'Mrt', 'Apr', 'Mei', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec'],
          datasets: [
            {
              label: 'Werkelijke Omzet',
              data: monthlyData.map(month => month.actual),
              borderColor: 'rgb(34, 197, 94)',
              backgroundColor: 'rgba(34, 197, 94, 0.5)',
            },
            {
              label: 'Geplande Omzet',
              data: monthlyData.map(month => month.planned),
              borderColor: 'rgb(59, 130, 246)',
              backgroundColor: 'rgba(59, 130, 246, 0.5)',
            }
          ]
        };

        // Update the chart
        const chartElement = document.querySelector('.revenue-trend-chart');
        if (chartElement) {
          const chart = new ChartJS(chartElement as HTMLCanvasElement, {
            type: 'line',
            data: chartData,
            options: {
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
            }
          });
        }

      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Er is een fout opgetreden bij het ophalen van de omzetgegevens');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [selectedPeriod, selectedYear]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Omzet Overzicht</h1>
        <DashboardFilter onFilterChange={handleFilterChange} initialPeriod={selectedPeriod} initialYear={selectedYear} />
      </div>
      
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Totale Omzet */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-sm font-medium text-gray-500">Totale Omzet</h3>
            <div className="flex items-center px-2 py-1 rounded-full text-xs font-semibold text-red-600 bg-red-100">
              <ArrowDownIcon className="h-4 w-4" />
              {Math.abs(metrics.revenueChange).toFixed(1)}%
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900">{formatCurrency(metrics.totalRevenue)}</div>
          <div className="mt-2 text-sm text-gray-600">Totaal omzet dit jaar</div>
        </div>

        {/* Omzet Period */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-sm font-medium text-gray-500">Omzet {selectedPeriod.label}</h3>
            <div className="flex items-center px-2 py-1 rounded-full text-xs font-semibold text-red-600 bg-red-100">
              <ArrowDownIcon className="h-4 w-4" />
              {Math.abs(metrics.periodChange).toFixed(1)}%
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900">{formatCurrency(metrics.periodRevenue)}</div>
          <div className="mt-2 text-sm text-gray-600">Omzet {selectedPeriod.label.toLowerCase()}</div>
        </div>

        {/* Omzet Dit Jaar */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-sm font-medium text-gray-500">Omzet Dit Jaar</h3>
            <div className="flex items-center px-2 py-1 rounded-full text-xs font-semibold text-green-600 bg-green-100">
              <ArrowUpIcon className="h-4 w-4" />
              0.0%
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900">{formatCurrency(metrics.yearToDateRevenue)}</div>
          <div className="mt-2 text-sm text-gray-600">Omzet dit jaar</div>
        </div>

        {/* Gepland vs Werkelijk */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-sm font-medium text-gray-500">Gepland vs Werkelijk</h3>
            <div className="flex items-center px-2 py-1 rounded-full text-xs font-semibold text-red-600 bg-red-100">
              <ArrowDownIcon className="h-4 w-4" />
              {Math.abs(metrics.periodChange).toFixed(1)}%
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
                  {metrics.revenueChange >= 0 ? <ArrowUpIcon className="h-4 w-4" /> : <ArrowDownIcon className="h-4 w-4" />}
                  {Math.abs(metrics.revenueChange).toFixed(1)}%
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
                <div className={`flex items-center px-2 py-1 rounded-full text-xs font-semibold ${metrics.periodChange >= 0 ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100'}`}>
                  {metrics.periodChange >= 0 ? <ArrowUpIcon className="h-4 w-4" /> : <ArrowDownIcon className="h-4 w-4" />}
                  {Math.abs(metrics.periodChange).toFixed(1)}%
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-500">Gepland</p>
                  <p className="text-lg font-semibold text-gray-900">{formatCurrency(metrics.plannedRevenue / 12)}</p>
                </div>
                <div className="bg-green-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-500">Werkelijk</p>
                  <p className="text-lg font-semibold text-gray-900">{formatCurrency(metrics.periodRevenue)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 