"use client";

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { getBrowserSupabaseClient } from '@/app/lib/supabase';
import type { Database } from '@/types/supabase';
import { GlAccount } from '@/types/models';
import { formatCurrency, getMonthName } from '@/lib/utils';
import BudgetKPICards from '@/app/components/budget/BudgetKPICards';
import BudgetMonthlyChart from '@/app/components/budget/BudgetMonthlyChart';
import BudgetCategoryTable from '@/app/components/budget/BudgetCategoryTable';
import BudgetComparisonChart from '@/app/components/budget/BudgetComparisonChart';
import PeriodSelector from '@/app/components/dashboard/PeriodSelector';
import MainLayout from '@/app/components/MainLayout';

// Interface voor budget entries met GL account gegevens
interface BudgetEntryWithGlAccount {
  id: string;
  gl_account_id: string;
  gl_accounts?: GlAccount;
  month: number;
  year: number;
  amount: number;
  type: string;
  organization_id: string;
  created_at: string;
  updated_at: string;
}

// Interface voor gegroepeerde budget data
interface GroupedBudget {
  [code: string]: {
    name: string;
    level: number;
    code: string;
    values: number[];
    total: number;
  };
}

// Interface voor categorie-hiërarchie
interface Category {
  id: string;
  code: string;
  name: string;
  amount: number;
  level: number;
  children?: Category[];
  parent_code?: string;
}

export default function BudgetOverviewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const yearParam = searchParams?.get('year');
  
  const [glAccounts, setGlAccounts] = useState<GlAccount[]>([]);
  const [budgetEntries, setBudgetEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<number>(
    yearParam ? parseInt(yearParam) : new Date().getFullYear()
  );
  const [period, setPeriod] = useState<'month' | 'quarter' | 'half-year' | 'year'>('month');
  
  const previousYear = selectedYear - 1;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const supabase = getBrowserSupabaseClient();
        
        // Fetch GL accounts without org_id filtering
        const { data: accountsData, error: accountsError } = await supabase
          .from('gl_accounts')
          .select('*')
          .order('code');

        if (accountsError) throw accountsError;

        // Fetch budget entries without org_id filtering
        const { data: entriesData, error: entriesError } = await supabase
          .from('budget_entries')
          .select('*, gl_account:gl_account_id(*)')
          .order('created_at', { ascending: false });

        if (entriesError) throw entriesError;

        setGlAccounts(accountsData || []);
        setBudgetEntries(entriesData || []);
      } catch (err) {
        console.error('Error:', err);
        setError(err instanceof Error ? err.message : 'Er is een fout opgetreden bij het ophalen van gegevens');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // KPI berekeningen
  const totalRevenue = useMemo(() => 
    budgetEntries.reduce((sum, entry) => sum + (entry.amount || 0), 0),
    [budgetEntries]
  );
  
  const totalExpenses = useMemo(() => 
    budgetEntries.reduce((sum, entry) => sum + (entry.amount || 0), 0),
    [budgetEntries]
  );
  
  const previousYearTotalRevenue = useMemo(() => 
    budgetEntries.reduce((sum, entry) => sum + (entry.amount || 0), 0),
    [budgetEntries]
  );
  
  const previousYearTotalExpenses = useMemo(() => 
    budgetEntries.reduce((sum, entry) => sum + (entry.amount || 0), 0),
    [budgetEntries]
  );

  // Maandelijkse data voor grafieken
  const monthlyChartData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec'];
    const monthlyData = months.map((month, index) => {
      const monthNumber = index + 1;
      
      const monthlyRevenue = budgetEntries
        .filter(entry => entry.month === monthNumber)
        .reduce((sum, entry) => sum + (entry.amount || 0), 0);
        
      const monthlyExpenses = budgetEntries
        .filter(entry => entry.month === monthNumber)
        .reduce((sum, entry) => sum + (entry.amount || 0), 0);
        
      return {
        month,
        revenue: monthlyRevenue,
        expenses: monthlyExpenses,
        result: monthlyRevenue - monthlyExpenses
      };
    });
    
    return monthlyData;
  }, [budgetEntries]);

  // Bouw hiërarchische categorie structuur
  const buildCategoryHierarchy = (
    entries: BudgetEntryWithGlAccount[],
    accounts: GlAccount[]
  ): Category[] => {
    // Creëer een map van GL accounts voor eenvoudige verwijzing
    const accountMap = new Map<string, GlAccount>();
    accounts.forEach(account => {
      accountMap.set(account.id, account);
    });
    
    // Aggregeer bedragen per account
    const aggregatedAmounts = new Map<string, number>();
    entries.forEach(entry => {
      const account = entry.gl_accounts;
      if (!account) return;
      
      const currentAmount = aggregatedAmounts.get(account.id) || 0;
      aggregatedAmounts.set(account.id, currentAmount + (entry.amount || 0));
      
      // Ook toevoegen aan parent accounts
      let currentParent = account.parent_code;
      while (currentParent) {
        const parentAccount = accounts.find(a => a.code === currentParent);
        if (parentAccount) {
          const parentAmount = aggregatedAmounts.get(parentAccount.id) || 0;
          aggregatedAmounts.set(parentAccount.id, parentAmount + (entry.amount || 0));
          currentParent = parentAccount.parent_code;
        } else {
          break;
        }
      }
    });
    
    // Bouw level 1 categorieën (hoogste niveau)
    const level1Categories = accounts
      .filter(account => account.level === 1)
      .map(account => ({
        id: account.id,
        code: account.code,
        name: account.name,
        amount: aggregatedAmounts.get(account.id) || 0,
        level: account.level,
        children: [] as Category[]
      }));
      
    // Voeg level 2 categorieën toe
    accounts
      .filter(account => account.level === 2)
      .forEach(account => {
        const parent = level1Categories.find(cat => cat.code === account.parent_code);
        if (parent) {
          parent.children?.push({
            id: account.id,
            code: account.code,
            name: account.name,
            amount: aggregatedAmounts.get(account.id) || 0,
            level: account.level,
            parent_code: account.parent_code,
            children: [] as Category[]
          });
        }
      });
      
    // Voeg level 3 categorieën toe
    accounts
      .filter(account => account.level === 3)
      .forEach(account => {
        level1Categories.forEach(level1 => {
          level1.children?.forEach(level2 => {
            if (level2.code === account.parent_code) {
              level2.children?.push({
                id: account.id,
                code: account.code,
                name: account.name,
                amount: aggregatedAmounts.get(account.id) || 0,
                level: account.level,
                parent_code: account.parent_code
              });
            }
          });
        });
      });
      
    return level1Categories;
  };
  
  const revenueCategories = useMemo(() => 
    buildCategoryHierarchy(budgetEntries.filter(e => e.type === 'revenue'), glAccounts.filter(a => a.type === 'revenue')),
    [budgetEntries, glAccounts]
  );
  
  const expenseCategories = useMemo(() => 
    buildCategoryHierarchy(budgetEntries.filter(e => e.type === 'expense'), glAccounts.filter(a => a.type === 'expense')),
    [budgetEntries, glAccounts]
  );
  
  // Data voor jaarlijkse vergelijkingsgrafieken
  const buildComparisonData = (
    currentYearEntries: BudgetEntryWithGlAccount[],
    previousYearEntries: BudgetEntryWithGlAccount[],
    accounts: GlAccount[]
  ) => {
    // Filter op level 2 accounts voor een goede vergelijking
    const level2Accounts = accounts.filter(a => a.level === 2);
    
    // Aggregeer per level 2 account
    return level2Accounts.map(account => {
      const currentYearAmount = currentYearEntries
        .filter(entry => {
          const entryAccount = entry.gl_accounts;
          return entryAccount && (
            entryAccount.code === account.code || 
            entryAccount.parent_code === account.code
          );
        })
        .reduce((sum, entry) => sum + (entry.amount || 0), 0);
        
      const previousYearAmount = previousYearEntries
        .filter(entry => {
          const entryAccount = entry.gl_accounts;
          return entryAccount && (
            entryAccount.code === account.code || 
            entryAccount.parent_code === account.code
          );
        })
        .reduce((sum, entry) => sum + (entry.amount || 0), 0);
        
      const growth = previousYearAmount !== 0 
        ? ((currentYearAmount - previousYearAmount) / previousYearAmount) * 100 
        : 0;
      
      return {
        category: account.name,
        currentYear: currentYearAmount,
        previousYear: previousYearAmount,
        growth
      };
    }).filter(item => item.currentYear > 0 || item.previousYear > 0)
      .sort((a, b) => b.currentYear - a.currentYear);
  };
  
  const revenueComparisonData = useMemo(() => 
    buildComparisonData(
      budgetEntries.filter(e => e.type === 'revenue'), 
      budgetEntries.filter(e => e.type === 'revenue'), 
      glAccounts.filter(a => a.type === 'revenue')
    ),
    [budgetEntries, glAccounts]
  );
  
  const expenseComparisonData = useMemo(() => 
    buildComparisonData(
      budgetEntries.filter(e => e.type === 'expense'), 
      budgetEntries.filter(e => e.type === 'expense'), 
      glAccounts.filter(a => a.type === 'expense')
    ),
    [budgetEntries, glAccounts]
  );
  
  const handlePeriodChange = (newPeriod: 'month' | 'quarter' | 'half-year' | 'year') => {
    setPeriod(newPeriod);
    router.push(`/budget/overview?year=${selectedYear}&period=${newPeriod}`);
  };
  
  const handleYearChange = (newYear: number) => {
    setSelectedYear(newYear);
    router.push(`/budget/overview?year=${newYear}&period=${period}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-[#1E1E3F]">Budget Overzicht</h1>
        </div>

        {error && (
          <div className="mb-4 p-4 text-sm text-red-700 bg-red-100 rounded-lg">
            {error}
          </div>
        )}

        <div className="bg-white shadow rounded-lg">
          <div className="container mx-auto px-4 py-8 max-w-7xl">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold text-gray-900">Begroting Overzicht</h1>
              <div className="flex space-x-4">
                <PeriodSelector
                  period={period}
                  year={selectedYear}
                  month={new Date().getMonth() + 1}
                  onPeriodChange={handlePeriodChange}
                  onDateChange={(year) => handleYearChange(year)}
                />
                <button
                  onClick={() => window.location.reload()}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-gray-700 bg-gray-100 hover:bg-gray-200"
                >
                  <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Vernieuwen
                </button>
              </div>
            </div>

            {/* KPI Cards */}
            <div className="mb-8">
              <BudgetKPICards
                totalRevenue={totalRevenue}
                totalExpenses={totalExpenses}
                previousYearRevenue={previousYearTotalRevenue}
                previousYearExpenses={previousYearTotalExpenses}
                year={selectedYear}
              />
            </div>

            {/* Monthly Chart */}
            <div className="mb-8">
              <BudgetMonthlyChart
                data={monthlyChartData}
                year={selectedYear}
              />
            </div>

            {/* Revenue & Expense Tables */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              <BudgetCategoryTable
                title="Begrote Inkomsten"
                categories={revenueCategories}
                year={selectedYear}
              />
              <BudgetCategoryTable
                title="Begrote Uitgaven"
                categories={expenseCategories}
                year={selectedYear}
              />
            </div>

            {/* Year Comparison Charts */}
            {(previousYearTotalRevenue > 0 || previousYearTotalExpenses > 0) && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <BudgetComparisonChart
                  data={revenueComparisonData}
                  currentYear={selectedYear}
                  previousYear={previousYear}
                  type="revenue"
                />
                <BudgetComparisonChart
                  data={expenseComparisonData}
                  currentYear={selectedYear}
                  previousYear={previousYear}
                  type="expenses"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
} 