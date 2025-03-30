"use client";

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
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
}

interface FinancialData {
  id?: string;
  created_at?: string;
  gl_account_id?: string;
  amount?: number;
  month?: number;
  year?: number;
}

// Dashboard component
export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
    marginChange: 0
  });
  
  useEffect(() => {
    console.log('Dashboard page loading...');
    
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const supabase = createClientComponentClient();
        
        // Gebruik getUser voor betere beveiliging
        const { data: userData, error: userError } = await supabase.auth.getUser();
        
        if (userError || !userData.user) {
          console.error("Auth error:", userError);
          setError("Kon niet authenticeren met Supabase");
          setLoading(false);
          return;
        }
        
        console.log("Authenticated as:", userData.user.email);
        
        // Haal de laatste 10 revenue entries op
        const { data: revenueEntries, error: revenueError } = await supabase
          .from('budget_entries')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10);
          
        if (revenueError) {
          console.error("Revenue fetch error:", revenueError);
          setError("Kon omzetgegevens niet ophalen");
          setLoading(false);
          return;
        }
        
        // Haal de laatste 10 expense entries op
        const { data: expenseEntries, error: expenseError } = await supabase
          .from('expenses')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10);
          
        if (expenseError) {
          console.error("Expenses fetch error:", expenseError);
          console.log("Attempting to fetch from budget_entries table instead...");
          
          // Fallback: probeer budget_entries te gebruiken voor uitgaven
          const { data: fallbackExpenses, error: fallbackError } = await supabase
            .from('budget_entries')
            .select('*')
            .eq('type', 'Planned')
            .order('created_at', { ascending: false })
            .limit(10);
            
          if (fallbackError) {
            console.error("Fallback expenses fetch error:", fallbackError);
            setError("Kon uitgavegegevens niet ophalen");
            setLoading(false);
            return;
          }
          
          setExpensesData(fallbackExpenses || []);
        } else {
          setExpensesData(expenseEntries || []);
        }
        
        setRevenueData(revenueEntries || []);
        
        // Bereken de totale inkomsten en uitgaven voor de dashboard metrics
        const totalRevenue = revenueEntries?.reduce((sum, entry) => sum + (entry.amount || 0), 0) || 0;
        const totalExpenses = expensesData?.reduce((sum, entry) => sum + (entry.amount || 0), 0) || 0;
        const profit = totalRevenue - totalExpenses;
        const margin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;
        
        setMetrics({
          revenue: totalRevenue,
          expenses: totalExpenses,
          profit: profit,
          margin: margin,
          revenueChange: 12, // Voorbeeld waarden
          expensesChange: 8,
          profitChange: 15,
          marginChange: 3
        });
        
        setLoading(false);
      } catch (err) {
        console.error("Dashboard data loading error:", err);
        setError("Er is een fout opgetreden bij het laden van de gegevens");
        setLoading(false);
      }
    };
    
    loadData();
  }, []);
  
  // Formatteer valuta voor weergave
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(amount);
  };
  
  return (
    <div className="p-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          <p>{error}</p>
        </div>
      )}
      
      <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
        <div className="px-4 py-5 sm:px-6">
          <h1 className="text-xl font-semibold">Dashboard</h1>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Welkom op het dashboard van FlowQi
          </p>
        </div>
        
        <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
          {loading ? (
            <p className="text-center text-gray-600">Gegevens laden...</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="text-lg font-medium text-gray-900">Omzet</h3>
                <p className="mt-1 text-3xl font-semibold text-gray-900">{formatCurrency(metrics.revenue)}</p>
                <div className="mt-1 flex items-center text-sm text-green-600">
                  <ArrowUpIcon />
                  <span>{metrics.revenueChange}% t.o.v. vorige maand</span>
                </div>
              </div>
              
              <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="text-lg font-medium text-gray-900">Uitgaven</h3>
                <p className="mt-1 text-3xl font-semibold text-gray-900">{formatCurrency(metrics.expenses)}</p>
                <div className="mt-1 flex items-center text-sm text-red-600">
                  <ArrowUpIcon />
                  <span>{metrics.expensesChange}% t.o.v. vorige maand</span>
                </div>
              </div>
              
              <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="text-lg font-medium text-gray-900">Winst</h3>
                <p className="mt-1 text-3xl font-semibold text-gray-900">{formatCurrency(metrics.profit)}</p>
                <div className="mt-1 flex items-center text-sm text-green-600">
                  <ArrowUpIcon />
                  <span>{metrics.profitChange}% t.o.v. vorige maand</span>
                </div>
              </div>
              
              <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="text-lg font-medium text-gray-900">Marge</h3>
                <p className="mt-1 text-3xl font-semibold text-gray-900">{metrics.margin.toFixed(1)}%</p>
                <div className="mt-1 flex items-center text-sm text-green-600">
                  <ArrowUpIcon />
                  <span>{metrics.marginChange}% t.o.v. vorige maand</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h2 className="text-lg font-medium text-gray-900">Recente activiteit</h2>
          </div>
          <div className="border-t border-gray-200">
            <ul className="divide-y divide-gray-200">
              {loading ? (
                <li className="px-4 py-3">
                  <p className="text-sm text-gray-500">Laden...</p>
                </li>
              ) : revenueData.length > 0 ? (
                revenueData.slice(0, 3).map((entry, index) => (
                  <li key={entry.id || index} className="px-4 py-3">
                    <p className="text-sm font-medium text-gray-900">Omzet geregistreerd</p>
                    <p className="text-sm text-gray-500">
                      {formatCurrency(entry.amount || 0)} - {entry.month}/{entry.year}
                    </p>
                  </li>
                ))
              ) : (
                <li className="px-4 py-3">
                  <p className="text-sm text-gray-500">Geen recente activiteit</p>
                </li>
              )}
            </ul>
          </div>
        </div>
        
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h2 className="text-lg font-medium text-gray-900">Snelle links</h2>
          </div>
          <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link href="/budget/revenue" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700">
                Omzet begroting
                <ArrowRightIcon />
              </Link>
              <Link href="/budget/expenses" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700">
                Uitgaven begroting
                <ArrowRightIcon />
              </Link>
              <Link href="/actual/revenue" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700">
                Actuele omzet
                <ArrowRightIcon />
              </Link>
              <Link href="/actual/expenses" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700">
                Actuele uitgaven
                <ArrowRightIcon />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 