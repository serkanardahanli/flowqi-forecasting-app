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
import { Line } from 'react-chartjs-2';
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

interface ExpenseMetrics {
  totalExpenses: number;
  plannedExpenses: number;
  expenseChange: number;
  periodExpenses: number;
  periodChange: number;
  yearToDateExpenses: number;
  yearToDateChange: number;
}

// Helper function to get the last day of a month
const getLastDayOfMonth = (year: number, month: number) => {
  return new Date(year, month, 0).getDate();
};

// Helper function to format a date string for Supabase query
const formatDateString = (year: number, month: number, day: number) => {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
};

export default function ExpensesOverview() {
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
  const [metrics, setMetrics] = useState<ExpenseMetrics>({
    totalExpenses: 0,
    plannedExpenses: 0,
    expenseChange: 0,
    periodExpenses: 0,
    periodChange: 0,
    yearToDateExpenses: 0,
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
        
        // Get year-to-date actual expenses first
        const yearStartDate = formatDateString(selectedYear, 1, 1);
        const yearEndDate = formatDateString(selectedYear, 12, 31);
        
        const { data: yearToDateData } = await supabase
          .from('actual_entries')
          .select('*')
          .eq('entry_type', 'expense')
          .gte('created_at', yearStartDate)
          .lte('created_at', yearEndDate);

        const yearToDateExpenses = yearToDateData?.reduce((sum, entry) => sum + (entry.amount || 0), 0) || 0;

        // Get selected period's actual expenses
        const periodStartDate = formatDateString(selectedYear, selectedPeriod.dateRange.startMonth, 1);
        const periodEndDate = formatDateString(
          selectedYear,
          selectedPeriod.dateRange.endMonth,
          getLastDayOfMonth(selectedYear, selectedPeriod.dateRange.endMonth)
        );
        
        const { data: actualExpensesData, error: actualExpensesError } = await supabase
          .from('actual_entries')
          .select('*')
          .eq('entry_type', 'expense')
          .gte('created_at', periodStartDate)
          .lte('created_at', periodEndDate);
          
        if (actualExpensesError) throw new Error(`Error fetching actual expenses: ${actualExpensesError.message}`);
        
        // Get selected period's budgeted expenses
        const { data: budgetExpensesData, error: budgetExpensesError } = await supabase
          .from('budget_entries')
          .select('*')
          .eq('type', 'expense')
          .eq('year', selectedYear)
          .gte('month', selectedPeriod.dateRange.startMonth)
          .lte('month', selectedPeriod.dateRange.endMonth);
          
        if (budgetExpensesError) throw new Error(`Error fetching budget expenses: ${budgetExpensesError.message}`);

        // Calculate metrics for the selected period
        const periodExpenses = actualExpensesData?.reduce((sum, entry) => sum + (entry.amount || 0), 0) || 0;
        const plannedExpenses = budgetExpensesData?.reduce((sum, entry) => sum + (entry.amount || 0), 0) || 0;

        // Calculate changes
        const periodChange = plannedExpenses > 0 ? ((periodExpenses - plannedExpenses) / plannedExpenses) * 100 : -100;

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
          .eq('entry_type', 'expense')
          .gte('created_at', prevYearStartDate)
          .lte('created_at', prevYearEndDate);

        const prevYearExpenses = prevYearData?.reduce((sum, entry) => sum + (entry.amount || 0), 0) || 0;

        setMetrics({
          totalExpenses: periodExpenses,
          plannedExpenses,
          expenseChange: periodChange,
          periodExpenses,
          periodChange,
          yearToDateExpenses,
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

            // Get actual expenses for this month
            const { data: monthActual } = await supabase
              .from('actual_entries')
              .select('*')
              .eq('entry_type', 'expense')
              .gte('created_at', monthStart)
              .lte('created_at', monthEnd);

            // Get planned expenses for this month
            const { data: monthPlanned } = await supabase
              .from('budget_entries')
              .select('*')
              .eq('type', 'expense')
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
              label: 'Werkelijke Uitgaven',
              data: monthlyData.map(month => month.actual),
              borderColor: 'rgb(239, 68, 68)',
              backgroundColor: 'rgba(239, 68, 68, 0.5)',
            },
            {
              label: 'Geplande Uitgaven',
              data: monthlyData.map(month => month.planned),
              borderColor: 'rgb(59, 130, 246)',
              backgroundColor: 'rgba(59, 130, 246, 0.5)',
            }
          ]
        };

        // Update the chart
        const chartElement = document.querySelector('.expenses-trend-chart');
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
        setError('Er is een fout opgetreden bij het ophalen van de uitgavengegevens');
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
        <h1 className="text-3xl font-bold text-gray-900">Uitgaven Overzicht</h1>
        <DashboardFilter onFilterChange={handleFilterChange} initialPeriod={selectedPeriod} initialYear={selectedYear} />
      </div>
      
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Totale Uitgaven */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-sm font-medium text-gray-500">Totale Uitgaven</h3>
            <div className="flex items-center px-2 py-1 rounded-full text-xs font-semibold text-red-600 bg-red-100">
              <ArrowDownIcon className="h-4 w-4" />
              {Math.abs(metrics.expenseChange).toFixed(1)}%
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900">{formatCurrency(metrics.totalExpenses)}</div>
          <div className="mt-2 text-sm text-gray-600">Totaal uitgaven dit jaar</div>
        </div>

        {/* Uitgaven Period */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-sm font-medium text-gray-500">Uitgaven {selectedPeriod.label}</h3>
            <div className="flex items-center px-2 py-1 rounded-full text-xs font-semibold text-red-600 bg-red-100">
              <ArrowDownIcon className="h-4 w-4" />
              {Math.abs(metrics.periodChange).toFixed(1)}%
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900">{formatCurrency(metrics.periodExpenses)}</div>
          <div className="mt-2 text-sm text-gray-600">Uitgaven {selectedPeriod.label.toLowerCase()}</div>
        </div>

        {/* Uitgaven Dit Jaar */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-sm font-medium text-gray-500">Uitgaven Dit Jaar</h3>
            <div className="flex items-center px-2 py-1 rounded-full text-xs font-semibold text-green-600 bg-green-100">
              <ArrowUpIcon className="h-4 w-4" />
              0.0%
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900">{formatCurrency(metrics.yearToDateExpenses)}</div>
          <div className="mt-2 text-sm text-gray-600">Uitgaven dit jaar</div>
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
          <div className="text-2xl font-bold text-gray-900">{formatCurrency(metrics.plannedExpenses)}</div>
          <div className="mt-2 text-sm text-gray-600">Geplande uitgaven</div>
        </div>
      </div>

      {/* Financial Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Expenses Trend Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Uitgaven Trend</h2>
          <div className="h-64">
            <Line
              data={{
                labels: ['Jan', 'Feb', 'Mrt', 'Apr', 'Mei', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec'],
                datasets: [
                  {
                    label: 'Werkelijke Uitgaven',
                    data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                    borderColor: 'rgb(239, 68, 68)',
                    backgroundColor: 'rgba(239, 68, 68, 0.5)',
                  },
                  {
                    label: 'Geplande Uitgaven',
                    data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
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
                <h3 className="text-sm font-medium text-gray-500">Totale Uitgaven</h3>
                <div className={`flex items-center px-2 py-1 rounded-full text-xs font-semibold ${metrics.expenseChange <= 0 ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100'}`}>
                  {metrics.expenseChange <= 0 ? <ArrowDownIcon className="h-4 w-4" /> : <ArrowUpIcon className="h-4 w-4" />}
                  {Math.abs(metrics.expenseChange).toFixed(1)}%
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-500">Gepland</p>
                  <p className="text-lg font-semibold text-gray-900">{formatCurrency(metrics.plannedExpenses)}</p>
                </div>
                <div className="bg-red-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-500">Werkelijk</p>
                  <p className="text-lg font-semibold text-gray-900">{formatCurrency(metrics.totalExpenses)}</p>
                </div>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-medium text-gray-500">Maandelijkse Uitgaven</h3>
                <div className={`flex items-center px-2 py-1 rounded-full text-xs font-semibold ${metrics.periodChange <= 0 ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100'}`}>
                  {metrics.periodChange <= 0 ? <ArrowDownIcon className="h-4 w-4" /> : <ArrowUpIcon className="h-4 w-4" />}
                  {Math.abs(metrics.periodChange).toFixed(1)}%
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-500">Gepland</p>
                  <p className="text-lg font-semibold text-gray-900">{formatCurrency(metrics.plannedExpenses)}</p>
                </div>
                <div className="bg-red-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-500">Werkelijk</p>
                  <p className="text-lg font-semibold text-gray-900">{formatCurrency(metrics.periodExpenses)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 