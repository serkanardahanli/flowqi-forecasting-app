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

interface RevenueEntry {
  id: string;
  description: string;
  amount: number;
  entry_date: string;
  product_id?: string;
  entry_type: string;
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

export default function ActualRevenuePage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [revenueEntries, setRevenueEntries] = useState<RevenueEntry[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [tableStructure, setTableStructure] = useState<any>(null);
  const [defaultOrganizationId, setDefaultOrganizationId] = useState("c79beb17-aad3-4903-94d1-a0849667dbf6");
  const [defaultSaasGlAccountId, setDefaultSaasGlAccountId] = useState<string | null>(null);
  const [defaultConsultancyGlAccountId, setDefaultConsultancyGlAccountId] = useState<string | null>(null);
  const [numberOfUsers, setNumberOfUsers] = useState('');
  const [isSaasProduct, setIsSaasProduct] = useState(false);
  const [isConsultancyProduct, setIsConsultancyProduct] = useState(false);
  const [calculatedTotal, setCalculatedTotal] = useState('');
  
  // Form state
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [submitting, setSubmitting] = useState(false);
  
  // Remove GL accounts state and hierarchy
  const [glAccounts, setGlAccounts] = useState<GlAccount[]>([]);
  
  // Add useEffect for total calculation
  useEffect(() => {
    if (amount && numberOfUsers) {
      const pricePerUnit = parseFloat(amount);
      const total = pricePerUnit * parseInt(numberOfUsers);
      setCalculatedTotal(`${numberOfUsers} × €${pricePerUnit.toFixed(2)} = €${total.toFixed(2)}`);
    } else {
      setCalculatedTotal('');
    }
  }, [amount, numberOfUsers]);
  
  // Simplified useEffect for initial data loading
  useEffect(() => {
    // Log the values we're using
    console.log("Organization ID:", defaultOrganizationId);
    console.log("GL Account ID:", defaultSaasGlAccountId);
    
    // Just fetch the data
    fetchData();
  }, [defaultOrganizationId, defaultSaasGlAccountId]);

  useEffect(() => {
    const getInitialData = async () => {
      try {
        const supabase = getBrowserSupabaseClient();
        
        // Haal een bestaande rij op om de structuur te zien
        const { data: entriesData } = await supabase
          .from('actual_entries')
          .select('*')
          .limit(1);
          
        if (entriesData && entriesData.length > 0) {
          console.log('Bestaande entry structuur:', entriesData[0]);
          setTableStructure(entriesData[0]);
          
          // Als er een organization_id veld is, sla deze op voor later gebruik
          if (entriesData[0].organization_id) {
            setDefaultOrganizationId(entriesData[0].organization_id);
            console.log('Found organization_id:', entriesData[0].organization_id);
          }
        } else {
          console.log('Geen bestaande entries gevonden om de structuur te bepalen');
        }
        
        // Haal nu normale data op
        fetchData();
      } catch (err) {
        console.error('Error getting initial data:', err);
        setError('Kon de initiële data niet ophalen. Controleer de console voor details.');
        setLoading(false);
      }
    };
    
    getInitialData();
  }, []);
  
    const fetchData = async () => {
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
      
      // Haal revenue entries op uit actual_entries
      const { data: entriesData, error: entriesError } = await supabase
        .from('actual_entries')
        .select('*')
        .eq('entry_type', 'revenue')
        .order('created_at', { ascending: false });
        
      if (entriesError) {
        throw new Error(`Error fetching revenue entries: ${entriesError.message}`);
      }
      
      const enrichedEntries = entriesData?.map(entry => {
        const matchingProduct = productsData?.find(prod => prod.id === entry.product_id);
        return {
          ...entry,
          product: matchingProduct || null
        };
      }) || [];
      
      setProducts(productsData || []);
      setRevenueEntries(enrichedEntries);
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
          console.log(`Product geselecteerd: ${selectedProduct.name} met prijs: ${selectedProduct.price}`);
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
    setSubmitting(true);
    setError('');
    setSuccess('');
    
    try {
      if (!amount || !date) {
        throw new Error('Vul alle verplichte velden in');
      }
      
      if (isSaasProduct && !numberOfUsers) {
        throw new Error('Vul het aantal gebruikers in voor SaaS producten');
      }
      
      if (isConsultancyProduct && !numberOfUsers) {
        throw new Error('Vul het aantal uren in voor consultancy producten');
      }
      
      // Kies de juiste gl_account_id op basis van het product type
      let glAccountIdToUse;
      
      if (isConsultancyProduct) {
        if (!defaultConsultancyGlAccountId) {
          throw new Error('Geen grootboekrekening voor consultancy gevonden. Klik op "Zoek GL Accounts" om er een te vinden.');
        }
        glAccountIdToUse = defaultConsultancyGlAccountId;
        console.log("Gebruik consultancy gl_account_id:", glAccountIdToUse);
      } else {
        if (!defaultSaasGlAccountId) {
          throw new Error('Geen grootboekrekening voor SaaS gevonden. Klik op "Zoek GL Accounts" om er een te vinden.');
        }
        glAccountIdToUse = defaultSaasGlAccountId;
        console.log("Gebruik SaaS gl_account_id:", glAccountIdToUse);
      }
      
      const supabase = getBrowserSupabaseClient();
      
      // Calculate total amount
      const totalAmount = parseFloat(amount) * (numberOfUsers ? parseInt(numberOfUsers) : 1);
      
      // Log the exact data we're going to send
      const entryData = {
        description: selectedProductId ? products.find(p => p.id === selectedProductId)?.name || 'Onbekend product' : 'Handmatige invoer',
        amount: totalAmount,
        entry_date: date,
        product_id: selectedProductId || null,
        entry_type: 'revenue',
        organization_id: defaultOrganizationId,
        gl_account_id: glAccountIdToUse,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        year: new Date(date).getFullYear(),
        month: new Date(date).getMonth() + 1,
        type: 'revenue'
      };
      
      // Add number of users if present
      if (numberOfUsers) {
        entryData.number_of_users = parseInt(numberOfUsers);
      }
      
      console.log('Submitting entry with data:', entryData);
      
      const { error } = await supabase
        .from('actual_entries')
        .insert([entryData]);
        
      if (error) {
        console.error("Supabase error details:", error);
        throw new Error(`Error adding revenue: ${error.message}`);
      }
      
      // Success
      setSuccess('Omzet succesvol geregistreerd');
      resetForm();
      fetchData();
      
    } catch (err) {
      console.error('Error:', err instanceof Error ? err.message : String(err));
      setError(err instanceof Error ? err.message : 'Er is een fout opgetreden bij het toevoegen van omzet');
    } finally {
      setSubmitting(false);
    }
  };
  
  const resetForm = () => {
    setAmount('');
    setDate(new Date().toISOString().split('T')[0]);
    setSelectedProductId('');
    setNumberOfUsers('');
    setIsSaasProduct(false);
    setIsConsultancyProduct(false);
    setError('');
    setSuccess('');
  };

  useEffect(() => {
    const getInitialData = async () => {
      try {
        const supabase = getBrowserSupabaseClient();
        
        // Fetch GL accounts
        const { data: glAccountsData, error: glAccountsError } = await supabase
          .from('gl_accounts')
          .select('*')
          .order('code');

        if (glAccountsError) throw glAccountsError;
        
        if (glAccountsData) {
          setGlAccounts(glAccountsData);
          
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
        
        // ... rest of the existing getInitialData code ...
      } catch (err) {
        console.error('Error getting initial data:', err);
        setError('Kon de initiële data niet ophalen. Controleer de console voor details.');
        setLoading(false);
      }
    };

    getInitialData();
  }, []);

  return (
    <MainLayout>
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-6 text-gray-900">Werkelijke Inkomsten</h1>
        
        {/* Tabelstructuur debugging info */}
        {tableStructure && (
          <div className="mb-4 p-2 bg-white border border-gray-200 rounded text-sm text-gray-800">
            <p><strong>Tabelstructuur gevonden:</strong> {Object.keys(tableStructure).join(', ')}</p>
            {defaultOrganizationId && <p><strong>Organization ID:</strong> {defaultOrganizationId}</p>}
        </div>
        )}

        {/* Foutmelding of succes bericht */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-800 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-100 border border-green-400 text-green-800 px-4 py-3 rounded mb-4">
            {success}
          </div>
        )}
        
        {/* Formulier voor het toevoegen van omzet */}
        <div className="bg-white rounded shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">Nieuwe Omzet Registreren</h2>
          
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="product" className="block text-sm font-medium text-gray-900">
                  Product (optioneel)
                </label>
                <select
                  id="product"
                  value={selectedProductId}
                  onChange={(e) => handleProductSelect(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-gray-900"
                >
                  <option value="">-- Selecteer een product --</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.gl_account?.code} - {product.name} - €{parseFloat(product.price.toString()).toFixed(2)}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-sm text-gray-700">
                  Selecteer een product om automatisch de prijs in te vullen
                </p>
              </div>
              
              <div>
                <label htmlFor="amount" className="block text-sm font-medium text-gray-900">
                  Bedrag (€)
                </label>
                <input
                  type="number"
                  id="amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-gray-900"
                  min="0"
                  step="0.01"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="date" className="block text-sm font-medium text-gray-900">
                  Datum
                </label>
                <input
                  type="date"
                  id="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-gray-900"
                  required
                />
              </div>

              <div>
                <label htmlFor="number_of_users" className="block text-sm font-medium text-gray-900">
                  {isConsultancyProduct ? 'Aantal uren' : 'Aantal gebruikers (alleen voor SaaS)'}
                </label>
                <input
                  type="number"
                  id="number_of_users"
                  value={numberOfUsers}
                  onChange={(e) => setNumberOfUsers(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-gray-900"
                  min="1"
                  placeholder={isConsultancyProduct ? "Vul aantal uren in" : "Vul in voor SaaS producten"}
                />
              </div>
            </div>
            
            {/* Add total calculation display */}
            {amount && numberOfUsers && (
              <div className="col-span-2 mt-3 p-3 bg-gray-50 rounded border border-gray-200">
                <p className="text-gray-900 font-medium">Totaal: {calculatedTotal}</p>
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
                className="bg-gray-200 hover:bg-gray-300 text-gray-900 py-2 px-4 rounded shadow transition"
              >
                Annuleren
              </button>
            </div>
          </form>
        </div>
        
        {/* Tabel met bestaande omzet */}
        <div className="bg-white rounded shadow overflow-hidden">
          <h2 className="text-xl font-semibold p-4 border-b text-gray-900">Geregistreerde Omzet</h2>
          
          {loading ? (
            <div className="p-4 text-center">
              <p className="text-gray-900">Gegevens laden...</p>
            </div>
          ) : revenueEntries.length === 0 ? (
            <div className="p-4 text-center">
              <p className="text-gray-900">Geen omzet gevonden. Gebruik het formulier hierboven om omzet te registreren.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">Datum</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">Omschrijving</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">Product</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">Aantal gebruikers</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">Bedrag</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {revenueEntries.map((entry) => (
                    <tr key={entry.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                        {new Date(entry.entry_date).toLocaleDateString('nl-NL')}
                      </td>
                      <td className="px-6 py-4 text-gray-900">
                        {entry.description}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                        {entry.product ? entry.product.name : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                        {entry.number_of_users || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                        €{parseFloat(entry.amount.toString()).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td colSpan={4} className="px-6 py-4 text-right font-medium text-gray-900">
                      Totaal:
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-bold text-gray-900">
                      €{revenueEntries.reduce((sum, entry) => sum + parseFloat(entry.amount.toString() || '0'), 0).toFixed(2)}
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