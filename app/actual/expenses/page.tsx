'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { PlusIcon, ArrowPathIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import PeriodSelector, { Period } from '@/app/components/dashboard/PeriodSelector';
import { formatCurrency } from '@/lib/utils';
import ExpenseForm from '@/app/components/budget/ExpenseForm';

// Definieer interface voor GL Account
interface GLAccount {
  id: string;
  code: string;
  name: string;
  type: string;
  parent_id?: string;
  level: number;
}

// Definieer interface voor budget (uitgaven) entry
interface BudgetEntry {
  id?: string;
  gl_account_id: string;
  type: 'Planned' | 'Actual';
  year: number;
  month: number;
  amount: number;
  description?: string;
  category_code?: string;
  gl_account?: GLAccount;
}

// Definieer interface voor uitgavecategorie (hiërarchisch)
interface ExpenseCategory {
  code: string;
  name: string;
  actual: number;
  planned?: number;
  subcategories?: ExpenseCategory[];
  level: number;
  gl_account_id?: string;
}

export default function ActualExpensesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const yearParam = searchParams?.get('year');
  const monthParam = searchParams?.get('month');
  const categoryParam = searchParams?.get('category');

  // State
  const [year, setYear] = useState<number>(yearParam ? parseInt(yearParam) : new Date().getFullYear());
  const [month, setMonth] = useState<number>(monthParam ? parseInt(monthParam) : new Date().getMonth() + 1);
  const [period, setPeriod] = useState<Period>('month');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [glAccounts, setGLAccounts] = useState<GLAccount[]>([]);
  const [budgetEntries, setBudgetEntries] = useState<BudgetEntry[]>([]);
  const [hierarchicalExpenses, setHierarchicalExpenses] = useState<ExpenseCategory[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [showForm, setShowForm] = useState<boolean>(false);
  const [editingEntry, setEditingEntry] = useState<BudgetEntry | null>(null);
  
  const supabase = createClientComponentClient();

  // Datumbereik berekenen
  const getDateRange = () => {
    let startMonth = month;
    let endMonth = month;
    let startYear = year;
    let endYear = year;
    
    if (period === 'quarter') {
      startMonth = Math.floor((month - 1) / 3) * 3 + 1;
      endMonth = startMonth + 2;
    } else if (period === 'half-year') {
      startMonth = month <= 6 ? 1 : 7;
      endMonth = month <= 6 ? 6 : 12;
    } else if (period === 'year') {
      startMonth = 1;
      endMonth = 12;
    }
    
    return { startMonth, endMonth, startYear, endYear };
  };

  // Data ophalen
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const { startMonth, endMonth, startYear, endYear } = getDateRange();
        
        // Gebruiker sessie controleren
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.push('/auth/signin');
          return;
        }
        
        // Organisatie ID ophalen
        const { data: profile } = await supabase
          .from('profiles')
          .select('organization_id')
          .eq('id', session.user.id)
          .single();
        
        if (!profile?.organization_id) {
          setError('Geen organisatie gevonden. Log opnieuw in of neem contact op met ondersteuning.');
          setIsLoading(false);
          return;
        }
        
        const organizationId = profile.organization_id;
        
        // GL accounts ophalen
        const { data: glAccountsData, error: glAccountsError } = await supabase
          .from('gl_accounts')
          .select('*')
          .eq('organization_id', organizationId)
          .eq('type', 'expense');
        
        if (glAccountsError) throw new Error('Error fetching GL accounts: ' + glAccountsError.message);
        
        console.log('Actual Expenses - Opgehaalde GL rekeningen:', glAccountsData);
        console.log('Actual Expenses - Aantal GL rekeningen:', glAccountsData?.length || 0);
        console.log('Actual Expenses - GL rekeningen niveau 3:', glAccountsData?.filter(acc => acc.level === 3).length || 0);
        
        // Actual entries ophalen
        let expensesQuery = supabase
          .from('actual_entries')
          .select('*, gl_account:gl_account_id(*)')
          .eq('organization_id', organizationId)
          .eq('year', year)
          .eq('type', 'Actual');
        
        if (period === 'month') {
          expensesQuery = expensesQuery.eq('month', month);
        } else {
          expensesQuery = expensesQuery.gte('month', startMonth).lte('month', endMonth);
        }
        
        const { data: entriesData, error: entriesError } = await expensesQuery;
        
        if (entriesError) throw new Error('Error fetching actual entries: ' + entriesError.message);
        
        setGLAccounts(glAccountsData || []);
        setBudgetEntries(entriesData || []);
        
        // Hiërarchische structuur bouwen van uitgaven
        const hierarchical = buildHierarchicalExpenses(glAccountsData || [], entriesData || []);
        setHierarchicalExpenses(hierarchical);
        
        // Categorieën uitvouwen als er een specifieke categorie is doorgegeven
        if (categoryParam) {
          expandCategoryPath(categoryParam);
        }
        
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [year, month, period, categoryParam]);
  
  // Bouw hiërarchische structuur van uitgaven
  const buildHierarchicalExpenses = (accounts: GLAccount[], entries: BudgetEntry[]): ExpenseCategory[] => {
    // Maak een kaart van accounts op code
    const accountMap = new Map<string, GLAccount>();
    accounts.forEach(account => {
      accountMap.set(account.code, account);
    });
    
    // Bereken actuele bedragen voor elke rekening
    const categorySums = new Map<string, number>();
    entries.forEach(entry => {
      const account = entry.gl_account;
      if (!account) return;
      
      const currentSum = categorySums.get(account.code) || 0;
      categorySums.set(account.code, currentSum + entry.amount);
    });
    
    // Vind level 1 categorieën (hoofdcategorieën)
    const level1Categories = accounts.filter(acc => acc.level === 1);
    
    // Bouw de hiërarchie
    const buildCategory = (account: GLAccount): ExpenseCategory => {
      // Vind subcategorieën
      const subcategories = accounts
        .filter(acc => acc.level === account.level + 1 && acc.code.startsWith(account.code))
        .map(buildCategory);
      
      const actual = categorySums.get(account.code) || 0;
      
      return {
        code: account.code,
        name: account.name,
        actual,
        subcategories: subcategories.length > 0 ? subcategories : undefined,
        level: account.level,
        gl_account_id: account.id
      };
    };
    
    return level1Categories.map(buildCategory);
  };
  
  // Breid het pad uit naar een specifieke categorie
  const expandCategoryPath = (categoryCode: string) => {
    const newExpanded = new Set<string>(expandedCategories);
    
    // Voor elk niveau in de code, voeg de corresponderende categorie toe aan expanded
    for (let i = 4; i <= categoryCode.length; i += 2) {
      const parentCode = categoryCode.substring(0, i);
      newExpanded.add(parentCode);
    }
    
    setExpandedCategories(newExpanded);
  };
  
  // Toggle uitgeklapte categorie
  const toggleCategory = (code: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(code)) {
      newExpanded.delete(code);
    } else {
      newExpanded.add(code);
    }
    setExpandedCategories(newExpanded);
  };
  
  // Event handlers
  const handlePeriodChange = (newPeriod: Period) => {
    setPeriod(newPeriod);
    router.push(`/actual/expenses?year=${year}&month=${month}&period=${newPeriod}`);
  };
  
  const handleDateChange = (newYear: number, newMonth: number) => {
    setYear(newYear);
    setMonth(newMonth);
    router.push(`/actual/expenses?year=${newYear}&month=${newMonth}&period=${period}`);
  };
  
  const handleAddExpense = async (data: BudgetEntry) => {
    try {
      const { data: result, error } = await supabase
        .from('budget_entries')
        .insert([{
          gl_account_id: data.gl_account_id,
          type: 'Actual',
          year: data.year,
          month: data.month,
          amount: data.amount,
          description: data.description
        }])
        .select('*, gl_account:gl_account_id(*)');
      
      if (error) throw error;
      
      // Update lokale state
      if (result) {
        setBudgetEntries([...budgetEntries, ...result]);
        
        // Hiërarchie opnieuw opbouwen
        const hierarchical = buildHierarchicalExpenses(glAccounts, [...budgetEntries, ...result]);
        setHierarchicalExpenses(hierarchical);
      }
      
      setShowForm(false);
      setEditingEntry(null);
      
    } catch (err) {
      console.error('Fout bij toevoegen uitgave:', err);
      setError(err instanceof Error ? err.message : 'Fout bij toevoegen uitgave');
    }
  };
  
  const handleEditExpense = (entry: BudgetEntry) => {
    setEditingEntry(entry);
    setShowForm(true);
  };
  
  const handleUpdateExpense = async (data: BudgetEntry) => {
    if (!editingEntry?.id) return;
    
    try {
      const { data: result, error } = await supabase
        .from('budget_entries')
        .update({
          gl_account_id: data.gl_account_id,
          year: data.year,
          month: data.month,
          amount: data.amount,
          description: data.description
        })
        .eq('id', editingEntry.id)
        .select('*, gl_account:gl_account_id(*)');
      
      if (error) throw error;
      
      // Update lokale state
      if (result) {
        const updatedEntries = budgetEntries.map(entry => 
          entry.id === editingEntry.id ? result[0] : entry
        );
        
        setBudgetEntries(updatedEntries);
        
        // Hiërarchie opnieuw opbouwen
        const hierarchical = buildHierarchicalExpenses(glAccounts, updatedEntries);
        setHierarchicalExpenses(hierarchical);
      }
      
      setShowForm(false);
      setEditingEntry(null);
      
    } catch (err) {
      console.error('Fout bij bijwerken uitgave:', err);
      setError(err instanceof Error ? err.message : 'Fout bij bijwerken uitgave');
    }
  };
  
  const handleDeleteExpense = async (entryId: string) => {
    if (!window.confirm('Weet je zeker dat je deze uitgave wilt verwijderen?')) return;
    
    try {
      const { error } = await supabase
        .from('budget_entries')
        .delete()
        .eq('id', entryId);
      
      if (error) throw error;
      
      // Update lokale state
      const updatedEntries = budgetEntries.filter(entry => entry.id !== entryId);
      setBudgetEntries(updatedEntries);
      
      // Hiërarchie opnieuw opbouwen
      const hierarchical = buildHierarchicalExpenses(glAccounts, updatedEntries);
      setHierarchicalExpenses(hierarchical);
      
    } catch (err) {
      console.error('Fout bij verwijderen uitgave:', err);
      setError(err instanceof Error ? err.message : 'Fout bij verwijderen uitgave');
    }
  };
  
  // Hulpfunctie om de entries te vinden bij een specifieke GL rekening code
  const findEntriesForGLCode = (code: string): BudgetEntry[] => {
    // Filter op exacte code of op codes die beginnen met deze code (voor subcategorieën)
    const accounts = glAccounts.filter(acc => 
      acc.code === code || (acc.level > 1 && acc.code.startsWith(code))
    );
    
    const accountIds = accounts.map(acc => acc.id);
    
    return budgetEntries.filter(entry => accountIds.includes(entry.gl_account_id));
  };
  
  // Rendercomponent voor een categorie rij
  const renderCategoryRow = (
    category: ExpenseCategory, 
    depth: number = 0,
    isLastInGroup: boolean = false
  ) => {
    const isExpanded = expandedCategories.has(category.code);
    const hasSubcategories = category.subcategories && category.subcategories.length > 0;
    const indentClass = `pl-${depth * 6 + 4}`;
    
    // Entries voor deze categorie
    const categoryEntries = category.level === 3 ? findEntriesForGLCode(category.code) : [];
    
    return (
      <React.Fragment key={category.code}>
        <tr className={`${depth === 0 ? 'font-medium text-gray-900 bg-gray-50' : 'text-gray-700'} hover:bg-gray-50`}>
          <td className={`py-2 ${indentClass}`}>
            <div className="flex items-center">
              {hasSubcategories ? (
                <button 
                  onClick={() => toggleCategory(category.code)}
                  className="p-1 mr-1 rounded-full hover:bg-gray-200 focus:outline-none"
                >
                  {isExpanded ? (
                    <ChevronDownIcon className="h-4 w-4 text-gray-500" />
                  ) : (
                    <ChevronRightIcon className="h-4 w-4 text-gray-500" />
                  )}
                </button>
              ) : (
                <span className="w-6"></span>
              )}
              <span>{category.name}</span>
            </div>
          </td>
          <td className="py-2 px-4 text-right font-medium">
            {formatCurrency(category.actual)}
          </td>
          <td className="py-2 px-4 text-center">
            {category.level === 3 && (
              <button
                onClick={() => {
                  setEditingEntry({
                    gl_account_id: category.gl_account_id || '',
                    type: 'Actual',
                    year: year,
                    month: month,
                    amount: 0,
                    description: category.name
                  });
                  setShowForm(true);
                }}
                className="text-indigo-600 hover:text-indigo-900"
              >
                <PlusIcon className="h-5 w-5" />
              </button>
            )}
          </td>
        </tr>
        
        {/* Subcategorieën renderen als uitgeklapt */}
        {isExpanded && hasSubcategories && category.subcategories!.map((subcat, index) => 
          renderCategoryRow(
            subcat, 
            depth + 1, 
            index === category.subcategories!.length - 1
          )
        )}
        
        {/* Entries renderen voor level 3 categorieën als uitgeklapt */}
        {isExpanded && category.level === 3 && categoryEntries.map((entry) => (
          <tr key={entry.id} className="bg-gray-50 text-gray-600 hover:bg-gray-100">
            <td className={`py-2 pl-${depth * 6 + 10}`}>
              <div className="flex items-center">
                <span className="text-sm italic">{entry.description || 'Geen omschrijving'}</span>
              </div>
            </td>
            <td className="py-2 px-4 text-right text-sm">
              {formatCurrency(entry.amount)}
            </td>
            <td className="py-2 px-4 text-center">
              <div className="flex justify-center space-x-2">
                <button
                  onClick={() => handleEditExpense(entry)}
                  className="text-indigo-600 hover:text-indigo-900"
                >
                  <PencilIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={() => entry.id && handleDeleteExpense(entry.id)}
                  className="text-red-600 hover:text-red-900"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            </td>
          </tr>
        ))}
      </React.Fragment>
    );
  };
  
  // Loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }
  
  // Error state
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
  
  // Bereken totaal van alle uitgaven
  const totalExpenses = hierarchicalExpenses.reduce((total, category) => total + category.actual, 0);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 space-y-4 md:space-y-0">
        <h1 className="text-2xl font-bold text-gray-900">Actueel - Uitgaven</h1>
        
        <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
          <PeriodSelector 
            period={period}
            year={year}
            month={month}
            onPeriodChange={handlePeriodChange}
            onDateChange={handleDateChange}
          />
        </div>
      </div>
      
      <div className="bg-white shadow rounded-lg mb-8">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-medium text-gray-900">Actuele uitgaven</h2>
          <div className="flex space-x-2">
            <button
              onClick={() => {
                setEditingEntry(null);
                setShowForm(!showForm);
              }}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {showForm ? 'Annuleren' : <><PlusIcon className="h-4 w-4 mr-1" /> Toevoegen</>}
            </button>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-gray-700 bg-gray-100 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              <ArrowPathIcon className="h-4 w-4 mr-1" />
              Vernieuwen
            </button>
          </div>
        </div>
        
        {showForm && (
          <div className="mb-6 bg-white shadow rounded-lg">
            <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                {editingEntry ? 'Uitgave Bewerken' : 'Nieuwe Uitgave Toevoegen'}
              </h3>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <button
                  type="button"
                  onClick={() => {
                    console.log('Actual Page - Huidige glAccounts:', glAccounts);
                    console.log('Actual Page - Aantal accounts:', glAccounts.length);
                    console.log('Actual Page - Niveau 3 accounts:', glAccounts.filter(acc => acc.level === 3).length);
                    console.log('Actual Page - Type expense accounts:', glAccounts.filter(acc => acc.type === 'expense').length);
                    console.log('Actual Page - Niveau 3 & type expense:', glAccounts.filter(acc => acc.level === 3 && acc.type === 'expense').length);
                    alert(`Accounts geladen: ${glAccounts.length}\nNiveau 3 accounts: ${glAccounts.filter(acc => acc.level === 3).length}\nType expense: ${glAccounts.filter(acc => acc.type === 'expense').length}\nNiveau 3 & expense: ${glAccounts.filter(acc => acc.level === 3 && acc.type === 'expense').length}`);
                  }}
                  className="px-2 py-1 bg-gray-100 text-xs text-gray-500 rounded hover:bg-gray-200"
                >
                  Debug GL Accounts
                </button>
              </div>
              <ExpenseForm 
                glAccounts={glAccounts}
                currentYear={year}
                currentMonth={month}
                editEntry={editingEntry}
                onSubmit={editingEntry ? handleUpdateExpense : handleAddExpense}
                onCancel={() => {
                  setShowForm(false);
                  setEditingEntry(null);
                }}
              />
            </div>
          </div>
        )}
        
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Categorie
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Bedrag
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                  Acties
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {hierarchicalExpenses.map((category, index) => 
                renderCategoryRow(
                  category, 
                  0, 
                  index === hierarchicalExpenses.length - 1
                )
              )}
              <tr className="bg-gray-100 font-bold">
                <td className="px-4 py-3 text-gray-900">Totaal Uitgaven</td>
                <td className="px-4 py-3 text-right text-gray-900">{formatCurrency(totalExpenses)}</td>
                <td></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 