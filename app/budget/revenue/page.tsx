"use client";

import { useState, useEffect } from 'react';
import { getBrowserSupabaseClient } from '@/app/lib/supabase';
import MainLayout from '@/app/components/MainLayout';

interface Product {
  id: string;
  name: string;
  price: number;
  description?: string;
  gl_account_id: string;
  type: 'saas' | 'consultancy';
  gl_account?: {
    code: string;
    level: number;
  };
}

interface BudgetEntry {
  id: string;
  description: string;
  amount: number;
  year: number;
  month: number;
  product_id?: string;
  type: string;
  created_at: string;
  organization_id: string;
  product?: Product;
  number_of_users?: number;
}

interface GlAccount {
  id: string;
  code: string;
  name: string;
  type: string;
  parent_id: string | null;
}

export default function BudgetRevenuePage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [budgetEntries, setBudgetEntries] = useState<BudgetEntry[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<BudgetEntry[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [defaultOrganizationId, setDefaultOrganizationId] = useState("c79beb17-aad3-4903-94d1-a0849667dbf6");
  const [defaultSaasGlAccountId, setDefaultSaasGlAccountId] = useState<string | null>(null);
  const [defaultConsultancyGlAccountId, setDefaultConsultancyGlAccountId] = useState<string | null>(null);
  const [numberOfUsers, setNumberOfUsers] = useState('');
  const [isSaasProduct, setIsSaasProduct] = useState(false);
  const [isConsultancyProduct, setIsConsultancyProduct] = useState(false);
  const [calculatedTotal, setCalculatedTotal] = useState('');
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  const [productTypeFilter, setProductTypeFilter] = useState('all'); // 'all', 'saas', 'consultancy'
  
  // Form state
  const [amount, setAmount] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1); // 1-12
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [submitting, setSubmitting] = useState(false);
  
  // Bereken het totaalbedrag wanneer aantal of prijs wijzigt
  useEffect(() => {
    if (amount && numberOfUsers) {
      const total = parseFloat(amount) * parseInt(numberOfUsers);
      setCalculatedTotal(`${numberOfUsers} × €${parseFloat(amount).toFixed(2)} = €${total.toFixed(2)}`);
    } else {
      setCalculatedTotal('');
    }
  }, [amount, numberOfUsers]);
  
  // Filter entries wanneer jaar of producttype wijzigt
  useEffect(() => {
    if (budgetEntries.length > 0) {
      let filtered = budgetEntries.filter(entry => entry.year === filterYear);
      
      if (productTypeFilter !== 'all') {
        filtered = filtered.filter(entry => {
          const product = entry.product;
          if (!product) return false;
          
          if (productTypeFilter === 'saas') {
            return product.name?.toLowerCase().includes('saas') || 
                   product.description?.toLowerCase().includes('saas');
          } else if (productTypeFilter === 'consultancy') {
            return product.name?.toLowerCase().includes('consultancy') || 
                   product.description?.toLowerCase().includes('consultancy');
          }
          
          return true;
        });
      }
      
      setFilteredEntries(filtered);
    }
  }, [budgetEntries, filterYear, productTypeFilter]);
  
  // Initiële data ophalen
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const supabase = getBrowserSupabaseClient();
        
        // Haal GL accounts op
        const { data: glAccountsData, error: glAccountsError } = await supabase
          .from('gl_accounts')
          .select('*')
          .order('code');
          
        if (glAccountsError) {
          console.error("Error fetching GL accounts:", glAccountsError);
        } else if (glAccountsData) {
          // Set default accounts
          const revenueAccount = glAccountsData.find(acc => acc.code === '8000');
          const saasAccount = glAccountsData.find(acc => acc.code === '8020');
          const consultancyAccount = glAccountsData.find(acc => acc.code === '8010');
          
          if (revenueAccount) {
            setDefaultSaasGlAccountId(revenueAccount.id);
            setDefaultConsultancyGlAccountId(revenueAccount.id);
          }
          
          if (saasAccount) {
            setDefaultSaasGlAccountId(saasAccount.id);
          }
          
          if (consultancyAccount) {
            setDefaultConsultancyGlAccountId(consultancyAccount.id);
          }
        }
        
        // Haal bestaande data op
        fetchData();
        
      } catch (err) {
        console.error("Error loading initial data:", err);
        setError("Er is een fout opgetreden bij het laden van de pagina.");
      }
    };
    
    fetchInitialData();
  }, []);
  
  const fetchData = async () => {
    setLoading(true);
    try {
      const supabase = getBrowserSupabaseClient();
      
      // Haal producten op
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .order('name');
        
      if (productsError) {
        throw new Error(`Error fetching products: ${productsError.message}`);
      }
      
      // Haal budget entries op
      const { data: entriesData, error: entriesError } = await supabase
        .from('budget_entries')
        .select('*')
        .eq('type', 'revenue')
        .order('created_at', { ascending: false });
        
      if (entriesError) {
        throw new Error(`Error fetching budget entries: ${entriesError.message}`);
      }
      
      // Verrijk de data
      const enrichedEntries = entriesData?.map(entry => {
        const matchingProduct = productsData?.find(prod => prod.id === entry.product_id);
        return {
          ...entry,
          product: matchingProduct || null
        };
      }) || [];
      
      setProducts(productsData || []);
      setBudgetEntries(enrichedEntries);
      
      // Filter entries op basis van huidige jaar
      const filtered = enrichedEntries.filter(entry => entry.year === filterYear);
      setFilteredEntries(filtered);
      
    } catch (err) {
      console.error('Error:', err instanceof Error ? err.message : String(err));
      setError(err instanceof Error ? err.message : 'Er is een fout opgetreden bij het ophalen van gegevens');
    } finally {
      setLoading(false);
    }
  };
  
  const fetchProducts = async () => {
    try {
      const supabase = getBrowserSupabaseClient();
      
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          gl_account:gl_account_id(name, code, level)
        `)
        .order('name');
      
      if (error) throw error;
      
      // Filter alleen niveau 3 grootboekrekeningen (eindrekeningen)
      const filteredProducts = data?.filter(product => 
        product.gl_account && 
        product.gl_account.level === 3 && 
        ['8011', '8012', '8021', '8022', '8023'].includes(product.gl_account.code)
      ) || [];
      
      setProducts(filteredProducts);
      return filteredProducts;
    } catch (err) {
      console.error('Error fetching products:', err);
      throw err;
    }
  };
  
  const handleProductSelect = (productId: string) => {
    setSelectedProductId(productId);
    
    if (productId) {
      const selectedProduct = products.find(p => p.id === productId);
      if (selectedProduct) {
        // Zet het bedrag indien beschikbaar
        if (selectedProduct.price) {
          setAmount(selectedProduct.price.toString());
        }
        
        // Check of het een SaaS product is
        const isSaas = selectedProduct.name?.toLowerCase().includes('saas') || 
                     selectedProduct.description?.toLowerCase().includes('saas');
        
        // Check of het een consultancy product is
        const isConsultancy = selectedProduct.name?.toLowerCase().includes('consultancy') || 
                            selectedProduct.description?.toLowerCase().includes('consultancy');
        
        setIsSaasProduct(isSaas);
        setIsConsultancyProduct(isConsultancy);
        
        // Reset het aantal veld als het geen SaaS of consultancy product is
        if (!isSaas && !isConsultancy) {
          setNumberOfUsers('');
        }
      }
    } else {
      setIsSaasProduct(false);
      setIsConsultancyProduct(false);
      setAmount('');
      setNumberOfUsers('');
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    
    setSubmitting(true);
    setError('');
    setSuccess('');
    
    try {
      if (!defaultOrganizationId) {
        throw new Error('Geen organisatie geselecteerd.');
      }
      
      let glAccountIdToUse: string;
      
      if (isConsultancyProduct) {
        if (!defaultConsultancyGlAccountId) {
          throw new Error('Geen grootboekrekening voor consultancy gevonden.');
        }
        glAccountIdToUse = defaultConsultancyGlAccountId;
      } else {
        if (!defaultSaasGlAccountId) {
          throw new Error('Geen grootboekrekening voor SaaS gevonden.');
        }
        glAccountIdToUse = defaultSaasGlAccountId;
      }
      
      const supabase = getBrowserSupabaseClient();
      
      // Bereken het totaalbedrag
      const totalAmount = parseFloat(amount) * (numberOfUsers ? parseInt(numberOfUsers) : 1);
      
      // Zoek eerst de exacte entry die we willen bijwerken
      const { data: existingEntries, error: fetchError } = await supabase
        .from('budget_entries')
        .select('*')
        .eq('organization_id', defaultOrganizationId)
        .eq('gl_account_id', glAccountIdToUse)
        .eq('year', selectedYear)
        .eq('month', selectedMonth)
        .eq('type', 'revenue');
        
      if (fetchError) {
        console.error("Fetch error:", fetchError);
        throw new Error(`Error bij zoeken naar bestaande begrotingspost: ${fetchError.message}`);
      }
      
      // Log voor debugging
      console.log("Checking existing entries for:", {
        organization_id: defaultOrganizationId,
        gl_account_id: glAccountIdToUse,
        year: selectedYear,
        month: selectedMonth,
        type: 'revenue'
      });
      console.log("Found entries:", existingEntries);
      
      const entryData = {
        description: selectedProductId ? products.find(p => p.id === selectedProductId)?.name || 'Onbekend product' : 'Handmatige invoer',
        amount: totalAmount,
        product_id: selectedProductId || null,
        number_of_users: numberOfUsers ? parseInt(numberOfUsers) : null,
        updated_at: new Date().toISOString()
      };
      
      if (existingEntries && existingEntries.length > 0) {
        // Update de bestaande entry
        const { error: updateError } = await supabase
          .from('budget_entries')
          .update(entryData)
          .eq('id', existingEntries[0].id);
          
        if (updateError) {
          console.error("Update error:", updateError);
          throw new Error(`Error bij bijwerken begroting: ${updateError.message}`);
        }
        
        setSuccess('Omzetbegroting succesvol bijgewerkt');
      } else {
        // Voeg een nieuwe entry toe
        const { error: insertError } = await supabase
          .from('budget_entries')
          .upsert([{
            ...entryData,
            year: selectedYear,
            month: selectedMonth,
            type: 'revenue',
            organization_id: defaultOrganizationId,
            gl_account_id: glAccountIdToUse,
            created_at: new Date().toISOString()
          }], {
            onConflict: 'organization_id,gl_account_id,year,month',
            ignoreDuplicates: false
          });
          
        if (insertError) {
          console.error("Insert error:", insertError);
          if (insertError.code === '23505') { // Postgres unique violation code
            throw new Error(`Er bestaat al een begroting voor ${getMonthName(selectedMonth)} ${selectedYear}`);
          } else {
            throw new Error(`Error bij toevoegen nieuwe begroting: ${insertError.message}`);
          }
        }
        
        setSuccess('Nieuwe omzetbegroting succesvol toegevoegd');
      }
      
      resetForm();
      fetchData();
      
    } catch (err) {
      console.error('Error:', err instanceof Error ? err.message : String(err));
      setError(err instanceof Error ? err.message : 'Er is een fout opgetreden bij het opslaan van de begroting');
    } finally {
      setSubmitting(false);
    }
  };
  
  const resetForm = () => {
    setSelectedProductId('');
    setAmount('');
    setNumberOfUsers('');
    setIsSaasProduct(false);
    setIsConsultancyProduct(false);
    setError('');
    setSuccess('');
  };
  
  // Helper function voor maandnamen
  const getMonthName = (monthNumber: number) => {
    const months = [
      'Januari', 'Februari', 'Maart', 'April', 'Mei', 'Juni', 
      'Juli', 'Augustus', 'September', 'Oktober', 'November', 'December'
    ];
    return months[monthNumber - 1];
  };
  
  // Opties voor jaar filter
  const yearOptions = [];
  const currentYear = new Date().getFullYear();
  for (let i = 0; i < 4; i++) {
    yearOptions.push(currentYear + i);
  }
  
  return (
    <MainLayout>
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-6 text-black">Omzet Begroting</h1>
        
        {/* Jaar filter en type filter */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-4">
            <span className="text-black font-medium">Filter op jaar:</span>
            <select
              value={filterYear}
              onChange={(e) => setFilterYear(parseInt(e.target.value))}
              className="border border-gray-300 rounded-md shadow-sm p-2 text-black"
            >
              {yearOptions.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
          
          <div className="flex items-center space-x-4">
            <span className="text-black font-medium">Filter op type:</span>
            <select
              value={productTypeFilter}
              onChange={(e) => setProductTypeFilter(e.target.value)}
              className="border border-gray-300 rounded-md shadow-sm p-2 text-black"
            >
              <option value="all">Alle producten</option>
              <option value="saas">SaaS</option>
              <option value="consultancy">Consultancy</option>
            </select>
          </div>
        </div>
        
        {/* Foutmelding of succes bericht */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-black px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        {success && (
          <div className="bg-green-100 border border-green-400 text-black px-4 py-3 rounded mb-4">
            {success}
          </div>
        )}
        
        {/* Formulier voor het toevoegen van omzet begroting */}
        <div className="bg-white rounded shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-black">Nieuwe Omzet Begroting</h2>
          
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="product" className="block text-sm font-medium text-black">
                  Product (optioneel)
                </label>
                <select
                  id="product"
                  value={selectedProductId}
                  onChange={(e) => handleProductSelect(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-black"
                >
                  <option value="">-- Selecteer een product --</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.gl_account?.code} - {product.name} - €{parseFloat(product.price.toString()).toFixed(2)}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-sm text-black">
                  Selecteer een product om automatisch de prijs in te vullen
                </p>
              </div>
              
              <div>
                <label htmlFor="month-year" className="block text-sm font-medium text-black">
                  Maand
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    id="month"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-black"
                    required
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                      <option key={month} value={month}>
                        {getMonthName(month)}
                      </option>
                    ))}
                  </select>
                  
                  <select
                    id="year"
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-black"
                    required
                  >
                    {yearOptions.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div>
                <label htmlFor="amount" className="block text-sm font-medium text-black">
                  Bedrag (€)
                </label>
                <input
                  type="number"
                  id="amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-black"
                  min="0"
                  step="0.01"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="number_of_users" className="block text-sm font-medium text-black">
                  {isConsultancyProduct ? 'Aantal uren' : 'Aantal gebruikers (alleen voor SaaS)'}
                </label>
                <input
                  type="number"
                  id="number_of_users"
                  value={numberOfUsers}
                  onChange={(e) => setNumberOfUsers(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-black"
                  min="1"
                  placeholder={isConsultancyProduct ? "Vul aantal uren in" : "Vul in voor SaaS producten"}
                />
              </div>
            </div>
            
            {/* Totaalberekening */}
            {amount && numberOfUsers && (
              <div className="mt-4 p-3 bg-gray-50 rounded border border-gray-200">
                <p className="text-black font-medium">Totaal: {calculatedTotal}</p>
              </div>
            )}
            
            <div className="mt-6 flex space-x-3">
              <button
                type="submit"
                disabled={submitting}
                className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded shadow transition"
              >
                {submitting ? 'Bezig met opslaan...' : 'Opslaan'}
              </button>
              
              <button
                type="button"
                onClick={resetForm}
                className="bg-gray-200 hover:bg-gray-300 text-black py-2 px-4 rounded shadow transition"
              >
                Annuleren
              </button>
            </div>
          </form>
        </div>
        
        {/* Tabel met bestaande begrotingsposten */}
        <div className="bg-white rounded shadow overflow-hidden">
          <h2 className="text-xl font-semibold p-4 border-b text-black">Omzet Begroting Overzicht</h2>
          
          {loading ? (
            <div className="p-4 text-center">
              <p className="text-black">Gegevens laden...</p>
            </div>
          ) : filteredEntries.length === 0 ? (
            <div className="p-4 text-center">
              <p className="text-black">Geen begrotingsposten gevonden voor {filterYear}. Gebruik het formulier hierboven om een begroting toe te voegen.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">Maand</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">Omschrijving</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">Product</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">Aantal</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">Bedrag</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredEntries.map((entry) => (
                    <tr key={entry.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-black">
                        {getMonthName(entry.month)} {entry.year}
                      </td>
                      <td className="px-6 py-4 text-black">
                        {entry.description}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-black">
                        {entry.product ? entry.product.name : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-black">
                        {entry.number_of_users ? 
                          `${entry.number_of_users} ${
                            entry.product && (
                              entry.product.name?.toLowerCase().includes('consultancy') || 
                              entry.product.description?.toLowerCase().includes('consultancy')
                            ) ? 'uren' : 'gebruikers'
                          }` 
                          : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-black">
                        €{parseFloat(entry.amount.toString()).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td colSpan={4} className="px-6 py-4 text-right font-medium text-black">
                      Totaal:
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-bold text-black">
                      €{filteredEntries.reduce((sum, entry) => sum + parseFloat(entry.amount.toString() || '0'), 0).toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
} 