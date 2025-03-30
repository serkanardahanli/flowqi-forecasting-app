'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { PlusIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import RevenueForm from '@/app/components/budget/RevenueForm';
import BulkRevenueInput, { BulkRevenueEntry } from '@/app/components/budget/BulkRevenueInput';
import PeriodSelector from '@/app/components/dashboard/PeriodSelector';
import { formatCurrency } from '@/lib/utils';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

console.log('Budget Revenue page loading - budget/revenue/page.tsx');

// Interfaces
interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
}

interface GLAccount {
  id: string;
  code: string;
  name: string;
  type: string;
  parent_id?: string;
  level: number;
}

interface BudgetRevenueEntry {
  id?: string;
  gl_account_id: string;
  gl_account?: GLAccount;
  product_id?: string;
  product?: Product;
  year: number;
  month: number;
  amount: number;
  number_of_users?: number;
  description?: string;
  type: 'Planned' | 'Actual';
}

export default function BudgetRevenuePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const yearParam = searchParams?.get('year');
  const monthParam = searchParams?.get('month');
  
  // State
  const [year, setYear] = useState<number>(yearParam ? parseInt(yearParam) : new Date().getFullYear());
  const [month, setMonth] = useState<number>(monthParam ? parseInt(monthParam) : new Date().getMonth() + 1);
  const [period, setPeriod] = useState<'month' | 'quarter' | 'half-year' | 'year'>('month');
  const [view, setView] = useState<'table' | 'bulk'>('table');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  const [showRevenueForm, setShowRevenueForm] = useState<boolean>(false);
  const [showBulkInput, setShowBulkInput] = useState<boolean>(false);
  const [editEntry, setEditEntry] = useState<BudgetRevenueEntry | null>(null);
  
  const [entries, setEntries] = useState<BudgetRevenueEntry[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [glAccounts, setGlAccounts] = useState<GLAccount[]>([]);
  
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
        
        console.log("Budget/revenue/page: Laden van data gestart");
        
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
        
        // Producten ophalen
        const { data: productsData, error: productsError } = await supabase
          .from('products')
          .select('*')
          .eq('organization_id', organizationId);
        
        if (productsError) throw new Error('Error fetching products: ' + productsError.message);
        
        // GL accounts ophalen
        const { data: glAccountsData, error: glAccountsError } = await supabase
          .from('gl_accounts')
          .select('*')
          .eq('organization_id', organizationId)
          .eq('type', 'revenue');
        
        if (glAccountsError) throw new Error('Error fetching GL accounts: ' + glAccountsError.message);
        
        // Budget entries ophalen
        let revenueQuery = supabase
          .from('budget_entries')
          .select('*, gl_account:gl_account_id(*), products(*)')
          .eq('organization_id', organizationId)
          .eq('year', year)
          .eq('type', 'Planned');
        
        if (period === 'month') {
          revenueQuery = revenueQuery.eq('month', month);
        } else {
          revenueQuery = revenueQuery.gte('month', startMonth).lte('month', endMonth);
        }
        
        const { data: entriesData, error: entriesError } = await revenueQuery;
        
        if (entriesError) throw new Error('Error fetching budget entries: ' + entriesError.message);
        
        setProducts(productsData || []);
        setGlAccounts(glAccountsData || []);
        setEntries(entriesData || []);
        
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [year, month, period]);
  
  // Event handlers
  const handlePeriodChange = (newPeriod: 'month' | 'quarter' | 'half-year' | 'year') => {
    setPeriod(newPeriod);
    router.push(`/budget/revenue?year=${year}&month=${month}&period=${newPeriod}`);
  };
  
  const handleDateChange = (newYear: number, newMonth: number) => {
    setYear(newYear);
    setMonth(newMonth);
    router.push(`/budget/revenue?year=${newYear}&month=${newMonth}&period=${period}`);
  };
  
  const handleAddRevenue = async (data: any) => {
    try {
      console.log("Trying to add revenue with data:", JSON.stringify(data, null, 2));
      
      // Controleer of alle benodigde velden aanwezig zijn
      if (!data.gl_account_id) {
        console.error("MISSING FIELD: gl_account_id is required but missing");
      }
      if (!data.year) {
        console.error("MISSING FIELD: year is required but missing");
      }
      if (!data.month) {
        console.error("MISSING FIELD: month is required but missing");
      }
      if (!data.amount) {
        console.error("MISSING FIELD: amount is required but missing");
      }
      if (!data.product_id) {
        console.error("MISSING FIELD: product_id is required but missing");
      }
      
      // Haal het organizationId op (nodig voor de insert)
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        console.error("Auth session error:", sessionError);
        throw sessionError;
      }
      
      if (!sessionData.session) {
        console.error("No active session found");
        throw new Error("Not authenticated");
      }
      
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', sessionData.session.user.id)
        .single();
      
      if (profileError) {
        console.error("Profile fetch error:", profileError);
        throw profileError;
      }
      
      if (!profileData?.organization_id) {
        console.error("No organization_id found in user profile");
        throw new Error("Organization ID not found");
      }
      
      const organizationId = profileData.organization_id;
      console.log("Using organization_id:", organizationId);
      
      // Bereid de entry voor met alle velden
      const newEntry = {
        gl_account_id: data.gl_account_id,
        year: data.year,
        month: data.month,
        amount: data.amount,
        product_id: data.product_id,
        number_of_users: data.number_of_users || 0,
        description: data.description || '',
        type: 'Planned',
        organization_id: organizationId
      };
      
      console.log("Prepared entry for insert:", JSON.stringify(newEntry, null, 2));
      
      // Probeer de database-insert
      console.log("Attempting to insert into budget_entries...");
      const { data: result, error } = await supabase
        .from('budget_entries')
        .insert([newEntry])
        .select('*, gl_account:gl_account_id(*), products(*)');
      
      if (error) {
        console.error("Supabase error details:", error);
        console.error("Error code:", error.code);
        console.error("Error message:", error.message);
        console.error("Error details:", error.details);
        console.error("Error hint:", error.hint);
        throw error;
      }
      
      console.log("Revenue added successfully, result:", JSON.stringify(result, null, 2));
      
      // Update local state
      if (result) {
        setEntries([...entries, ...result]);
      }
      
      setShowRevenueForm(false);
      
    } catch (err: any) {
      console.error('Complete error object:', err);
      console.error('Error adding revenue:', err instanceof Error ? err.message : String(err));
      console.error('Error stack:', err instanceof Error ? err.stack : 'No stack trace available');
      setError(err instanceof Error ? err.message : 'Failed to add revenue');
    }
  };
  
  const handleEditEntry = (entry: BudgetRevenueEntry) => {
    setEditEntry(entry);
    setShowRevenueForm(true);
  };
  
  const handleUpdateRevenue = async (data: any) => {
    if (!editEntry?.id) {
      console.error("Cannot update entry: No editEntry.id available");
      return;
    }
    
    try {
      console.log("Trying to update revenue with data:", JSON.stringify(data, null, 2));
      console.log("Editing entry with ID:", editEntry.id);
      
      // Controleer of alle benodigde velden aanwezig zijn
      if (!data.gl_account_id) {
        console.error("MISSING FIELD: gl_account_id is required but missing");
      }
      if (!data.year) {
        console.error("MISSING FIELD: year is required but missing");
      }
      if (!data.month) {
        console.error("MISSING FIELD: month is required but missing");
      }
      if (!data.amount) {
        console.error("MISSING FIELD: amount is required but missing");
      }
      if (!data.product_id) {
        console.error("MISSING FIELD: product_id is required but missing");
      }
      
      const updateObj = {
        gl_account_id: data.gl_account_id,
        year: data.year,
        month: data.month,
        amount: data.amount,
        product_id: data.product_id,
        number_of_users: data.number_of_users || 0,
        description: data.description || ''
      };
      
      console.log("Prepared update object:", JSON.stringify(updateObj, null, 2));
      console.log("Attempting to update budget_entries record...");
      
      const { data: result, error } = await supabase
        .from('budget_entries')
        .update(updateObj)
        .eq('id', editEntry.id)
        .select('*, gl_account:gl_account_id(*), products(*)');
      
      if (error) {
        console.error("Supabase error details:", error);
        console.error("Error code:", error.code);
        console.error("Error message:", error.message);
        console.error("Error details:", error.details);
        console.error("Error hint:", error.hint);
        throw error;
      }
      
      console.log("Revenue updated successfully, result:", JSON.stringify(result, null, 2));
      
      // Update local state
      if (result && result[0]) {
        setEntries(entries.map(e => e.id === editEntry.id ? result[0] : e));
      } else {
        console.warn("No results returned after update, which is unexpected");
      }
      
      setShowRevenueForm(false);
      setEditEntry(null);
      
    } catch (err: any) {
      console.error('Complete error object:', err);
      console.error('Error updating revenue:', err instanceof Error ? err.message : String(err));
      console.error('Error stack:', err instanceof Error ? err.stack : 'No stack trace available');
      setError(err instanceof Error ? err.message : 'Failed to update revenue');
    }
  };
  
  const handleDeleteEntry = async (entryId: string) => {
    try {
      const { error } = await supabase
        .from('budget_entries')
        .delete()
        .eq('id', entryId);
      
      if (error) throw error;
      
      // Update local state
      setEntries(entries.filter(e => e.id !== entryId));
      
    } catch (err) {
      console.error('Error deleting entry:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete entry');
    }
  };
  
  const handleBulkSubmit = async (bulkEntries: BulkRevenueEntry[]) => {
    try {
      const formattedEntries = bulkEntries.map(entry => ({
        gl_account_id: entry.gl_account_id,
        product_id: entry.product_id,
        year: entry.year,
        month: entry.month,
        amount: entry.amount,
        number_of_users: entry.number_of_users,
        description: entry.description,
        type: 'Planned' as const
      }));
      
      const { data, error } = await supabase
        .from('budget_entries')
        .insert(formattedEntries)
        .select('*, gl_account:gl_account_id(*), products(*)');
      
      if (error) throw error;
      
      if (data) {
        setEntries([...entries, ...data]);
      }
      
      setShowBulkInput(false);
      
    } catch (err) {
      console.error('Error adding bulk revenue:', err);
      setError(err instanceof Error ? err.message : 'Failed to add bulk revenue');
    }
  };
  
  // Bereken totale omzet
  const calculateTotalRevenue = () => {
    return entries.reduce((sum, entry) => sum + (entry.amount || 0), 0);
  };
  
  // Groepeer entries per product
  const groupedByProduct = () => {
    const grouped: { [key: string]: BudgetRevenueEntry[] } = {};
    
    entries.forEach(entry => {
      const productId = entry.product_id || 'unknown';
      if (!grouped[productId]) {
        grouped[productId] = [];
      }
      grouped[productId].push(entry);
    });
    
    return Object.entries(grouped).map(([productId, entries]) => {
      const productName = entries[0].product?.name || 'Onbekend product';
      const totalAmount = entries.reduce((sum, entry) => sum + (entry.amount || 0), 0);
      const totalUsers = entries.reduce((sum, entry) => sum + (entry.number_of_users || 0), 0);
      
      return {
        productId,
        productName,
        entries,
        totalAmount,
        totalUsers
      };
    }).sort((a, b) => b.totalAmount - a.totalAmount);
  };
  
  if (isLoading) {
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
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 space-y-4 md:space-y-0">
        <h1 className="text-2xl font-bold text-gray-900">Begroting - Omzet</h1>
        
        <div className="flex flex-wrap gap-2">
          <PeriodSelector 
            period={period}
            year={year}
            month={month}
            onPeriodChange={handlePeriodChange}
            onDateChange={handleDateChange}
          />
          
          <Tabs value={view} onValueChange={(value) => setView(value as 'table' | 'bulk')} className="w-[200px]">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="table">Tabel</TabsTrigger>
              <TabsTrigger value="bulk">Bulk</TabsTrigger>
            </TabsList>
          </Tabs>
          
          <button
            onClick={() => view === 'table' ? setShowRevenueForm(!showRevenueForm) : setShowBulkInput(!showBulkInput)}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            {(view === 'table' && showRevenueForm) || (view === 'bulk' && showBulkInput) ? (
              'Annuleren'
            ) : (
              <><PlusIcon className="h-4 w-4 mr-1" /> {view === 'table' ? 'Toevoegen' : 'Bulk Invoer'}</>
            )}
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
      
      {view === 'table' && showRevenueForm && (
        <div className="mb-6 bg-white shadow rounded-lg">
          <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              {editEntry ? 'Omzet Bewerken' : 'Nieuwe Omzet Toevoegen'}
            </h3>
          </div>
          <div className="p-6">
            <RevenueForm 
              type="saas"
              products={products}
              glAccounts={glAccounts}
              currentYear={year}
              currentMonth={month}
              onSubmit={editEntry ? handleUpdateRevenue : handleAddRevenue}
              onCancel={() => {
                setShowRevenueForm(false);
                setEditEntry(null);
              }}
            />
          </div>
        </div>
      )}
      
      {view === 'bulk' && showBulkInput && (
        <div className="mb-6">
          <BulkRevenueInput
            products={products}
            glAccounts={glAccounts}
            year={year}
            onSubmit={handleBulkSubmit}
            onCancel={() => setShowBulkInput(false)}
          />
        </div>
      )}
      
      {/* Omzet Tabel */}
      <div className="bg-white shadow rounded-lg overflow-hidden mb-8">
        <div className="px-4 py-5 border-b border-gray-200 sm:px-6 flex justify-between items-center">
          <h2 className="text-lg font-medium text-gray-900">Begrote Omzet {year}</h2>
          <span className="text-lg font-medium text-indigo-600">{formatCurrency(calculateTotalRevenue())}</span>
        </div>
        
        {entries.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            Geen begrote omzet gevonden voor deze periode. Gebruik de knop 'Toevoegen' om te beginnen.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categorie</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Gebruikers</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Prijs per Gebruiker</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Bedrag</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Periode</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acties</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {entries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap text-sm">{entry.product?.name || 'N/A'}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">{entry.gl_account?.name || 'N/A'}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right">{entry.number_of_users || 'N/A'}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right">
                      {entry.product?.price ? formatCurrency(entry.product.price) : 'N/A'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-medium">{formatCurrency(entry.amount)}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">{`${entry.month}/${entry.year}`}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEditEntry(entry)}
                        className="text-indigo-600 hover:text-indigo-900 mr-3"
                      >
                        Bewerken
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm('Weet je zeker dat je dit item wilt verwijderen?')) {
                            handleDeleteEntry(entry.id!);
                          }
                        }}
                        className="text-red-600 hover:text-red-900"
                      >
                        Verwijderen
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {/* Overzicht per Product */}
      {entries.length > 0 && (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
            <h2 className="text-lg font-medium text-gray-900">Samenvatting per Product</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {groupedByProduct().map(group => (
                <div key={group.productId} className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-2">{group.productName}</h3>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-gray-500">Gebruikers:</span>
                    <span className="text-sm font-medium">{group.totalUsers}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Omzet:</span>
                    <span className="text-sm font-medium">{formatCurrency(group.totalAmount)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 