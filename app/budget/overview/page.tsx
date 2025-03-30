'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/types/supabase';
import { GlAccount } from '@/types/models';
import { formatCurrency, getMonthName } from '@/lib/utils';
import BudgetKPICards from '@/app/components/budget/BudgetKPICards';
import BudgetMonthlyChart from '@/app/components/budget/BudgetMonthlyChart';
import BudgetCategoryTable from '@/app/components/budget/BudgetCategoryTable';
import BudgetComparisonChart from '@/app/components/budget/BudgetComparisonChart';
import PeriodSelector from '@/app/components/dashboard/PeriodSelector';

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
  
  const supabase = createClientComponentClient<Database>();
  const [glAccounts, setGlAccounts] = useState<GlAccount[]>([]);
  const [revenueEntries, setRevenueEntries] = useState<BudgetEntryWithGlAccount[]>([]);
  const [expenseEntries, setExpenseEntries] = useState<BudgetEntryWithGlAccount[]>([]);
  const [previousYearRevenueEntries, setPreviousYearRevenueEntries] = useState<BudgetEntryWithGlAccount[]>([]);
  const [previousYearExpenseEntries, setPreviousYearExpenseEntries] = useState<BudgetEntryWithGlAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<number>(
    yearParam ? parseInt(yearParam) : new Date().getFullYear()
  );
  const [period, setPeriod] = useState<'month' | 'quarter' | 'half-year' | 'year'>('month');
  
  const previousYear = selectedYear - 1;

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        router.push('/auth/signin');
        return;
      }
      
      // Haal gebruikersorganisatie op
      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', session.user.id)
        .single();
      
      if (!profile?.organization_id) {
        setError('Geen organisatie gevonden. Log opnieuw in of neem contact op met ondersteuning.');
        setLoading(false);
        return;
      }
      
      const organizationId = profile.organization_id;

      // Fetch GL accounts
      const { data: accountsData, error: accountsError } = await supabase
        .from('gl_accounts')
        .select('*')
        .eq('organization_id', organizationId)
        .order('code');

      if (accountsError) {
        throw new Error(`Error fetching GL accounts: ${accountsError.message}`);
      }

      // Fetch huidige jaar revenue entries
      const { data: revenueData, error: revenueError } = await supabase
        .from('budget_entries')
        .select('*, gl_account:gl_account_id(*)')
        .eq('organization_id', organizationId)
        .eq('year', selectedYear)
        .eq('type', 'revenue');

      if (revenueError) {
        throw new Error(`Error fetching revenue entries: ${revenueError.message}`);
      }

      // Fetch huidige jaar expense entries
      const { data: expenseData, error: expenseError } = await supabase
        .from('budget_entries')
        .select('*, gl_account:gl_account_id(*)')
        .eq('organization_id', organizationId)
        .eq('year', selectedYear)
        .eq('type', 'expense');

      if (expenseError) {
        throw new Error(`Error fetching expense entries: ${expenseError.message}`);
      }
      
      // Fetch vorige jaar revenue entries
      const { data: prevRevenueData, error: prevRevenueError } = await supabase
        .from('budget_entries')
        .select('*, gl_account:gl_account_id(*)')
        .eq('organization_id', organizationId)
        .eq('year', previousYear)
        .eq('type', 'revenue');

      if (prevRevenueError) {
        console.error(`Error fetching previous year revenue: ${prevRevenueError.message}`);
        // Niet fataal, we gaan door
      }

      // Fetch vorige jaar expense entries
      const { data: prevExpenseData, error: prevExpenseError } = await supabase
        .from('budget_entries')
        .select('*, gl_account:gl_account_id(*)')
        .eq('organization_id', organizationId)
        .eq('year', previousYear)
        .eq('type', 'expense');

      if (prevExpenseError) {
        console.error(`Error fetching previous year expenses: ${prevExpenseError.message}`);
        // Niet fataal, we gaan door
      }

      setGlAccounts(accountsData || []);
      setRevenueEntries(revenueData || []);
      setExpenseEntries(expenseData || []);
      setPreviousYearRevenueEntries(prevRevenueData || []);
      setPreviousYearExpenseEntries(prevExpenseData || []);
    } catch (err) {
      console.error('Error:', err);
      setError(err instanceof Error ? err.message : 'Er is een fout opgetreden bij het ophalen van gegevens');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedYear]);

  // KPI berekeningen
  const totalRevenue = useMemo(() => 
    revenueEntries.reduce((sum, entry) => sum + (entry.amount || 0), 0),
    [revenueEntries]
  );
  
  const totalExpenses = useMemo(() => 
    expenseEntries.reduce((sum, entry) => sum + (entry.amount || 0), 0),
    [expenseEntries]
  );
  
  const previousYearTotalRevenue = useMemo(() => 
    previousYearRevenueEntries.reduce((sum, entry) => sum + (entry.amount || 0), 0),
    [previousYearRevenueEntries]
  );
  
  const previousYearTotalExpenses = useMemo(() => 
    previousYearExpenseEntries.reduce((sum, entry) => sum + (entry.amount || 0), 0),
    [previousYearExpenseEntries]
  );

  // Maandelijkse data voor grafieken
  const monthlyChartData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec'];
    const monthlyData = months.map((month, index) => {
      const monthNumber = index + 1;
      
      const monthlyRevenue = revenueEntries
        .filter(entry => entry.month === monthNumber)
        .reduce((sum, entry) => sum + (entry.amount || 0), 0);
        
      const monthlyExpenses = expenseEntries
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
  }, [revenueEntries, expenseEntries]);

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
    buildCategoryHierarchy(revenueEntries, glAccounts.filter(a => a.type === 'revenue')),
    [revenueEntries, glAccounts]
  );
  
  const expenseCategories = useMemo(() => 
    buildCategoryHierarchy(expenseEntries, glAccounts.filter(a => a.type === 'expense')),
    [expenseEntries, glAccounts]
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
      revenueEntries, 
      previousYearRevenueEntries, 
      glAccounts.filter(a => a.type === 'revenue')
    ),
    [revenueEntries, previousYearRevenueEntries, glAccounts]
  );
  
  const expenseComparisonData = useMemo(() => 
    buildComparisonData(
      expenseEntries, 
      previousYearExpenseEntries, 
      glAccounts.filter(a => a.type === 'expense')
    ),
    [expenseEntries, previousYearExpenseEntries, glAccounts]
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
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg mt-6">
        <h3 className="text-lg font-medium text-red-800">Er is een fout opgetreden</h3>
        <p className="mt-2 text-red-700">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-red-100 text-red-800 rounded-md hover:bg-red-200"
        >
          Probeer opnieuw
        </button>
      </div>
    );
  }

  return (
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
  );
} 