"use client";

import { useState, useEffect } from 'react';
import { getBrowserSupabaseClient } from '@/app/lib/supabase';
import MainLayout from '@/app/components/MainLayout';

export default function BudgetExpensesPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [glAccounts, setGlAccounts] = useState([]);
  const [budgetEntries, setBudgetEntries] = useState([]);
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  
  // Form state
  const [selectedGlAccountId, setSelectedGlAccountId] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1); // 1-12
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [submitting, setSubmitting] = useState(false);
  
  // Organizatie ID (hard-coded voor nu)
  const defaultOrganizationId = "c79beb17-aad3-4903-94d1-a0849667dbf6";
  
  // Data ophalen
  useEffect(() => {
    const fetchData = async () => {
      console.log("Data ophalen gestart");
      setLoading(true);
      
      try {
        const supabase = getBrowserSupabaseClient();
        
        // Haal kostenrekeningen op
        const { data: accountsData, error: accountsError } = await supabase
          .from('gl_accounts')
          .select('*')
          .like('code', '4%')  // Alleen rekeningen die met 4 beginnen
          .order('code');

        if (accountsError) {
          console.error("Error fetching GL accounts:", accountsError);
          setError(`Fout bij het ophalen van categorieën: ${accountsError.message}`);
          return;
        }
        
        // Haal bestaande begrotingsposten op
        const { data: entriesData, error: entriesError } = await supabase
          .from('budget_entries')
          .select('*')
          .eq('type', 'expense')
          .eq('year', filterYear)
          .order('month', { ascending: true });
          
        if (entriesError) {
          console.error("Error fetching budget entries:", entriesError);
          setError(`Fout bij het ophalen van begrotingsposten: ${entriesError.message}`);
          return;
        }
        
        // Verrijk de data met grootboekinformatie
        const enrichedEntries = entriesData?.map(entry => {
          const matchingAccount = accountsData?.find(acc => acc.id === entry.gl_account_id);
          return {
            ...entry,
            gl_account: matchingAccount || null
          };
        }) || [];
        
        console.log("Geladen grootboekrekeningen:", accountsData?.length);
        console.log("Geladen begrotingsposten:", entriesData?.length);

        setGlAccounts(accountsData || []);
        setBudgetEntries(enrichedEntries);
        
        if (accountsData && accountsData.length > 0 && !selectedGlAccountId) {
          setSelectedGlAccountId(accountsData[0].id);
        }
      } catch (err) {
        console.error("Onverwachte fout:", err);
        setError(`Onverwachte fout: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [filterYear]); // Herlaad wanneer het geselecteerde jaar wijzigt
  
  // Formulier verzending
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');
    
    try {
      if (!description || !amount || !selectedGlAccountId) {
        throw new Error('Vul alle verplichte velden in');
      }
      
      const supabase = getBrowserSupabaseClient();
      
      // Controleer of er al een entry bestaat voor deze combinatie
      const { data: existingEntries, error: checkError } = await supabase
        .from('budget_entries')
        .select('id')
        .eq('organization_id', defaultOrganizationId)
        .eq('gl_account_id', selectedGlAccountId)
        .eq('year', selectedYear)
        .eq('month', selectedMonth)
        .eq('type', 'expense');
        
      if (checkError) {
        console.error("Check error:", checkError);
        throw new Error(`Fout bij controle voor dubbele entries: ${checkError.message}`);
      }
      
      let result;
      
      if (existingEntries && existingEntries.length > 0) {
        // Update bestaande entry
        result = await supabase
        .from('budget_entries')
        .update({
            description,
            amount: parseFloat(amount),
            updated_at: new Date().toISOString()
          })
          .eq('id', existingEntries[0].id);
          
        if (result.error) {
          throw new Error(`Fout bij bijwerken begroting: ${result.error.message}`);
        }
        
        setSuccess('Uitgavenbegroting succesvol bijgewerkt');
      } else {
        // Maak nieuwe entry
        result = await supabase
          .from('budget_entries')
          .insert([{
            description,
            amount: parseFloat(amount),
            year: selectedYear,
            month: selectedMonth,
            gl_account_id: selectedGlAccountId,
            type: 'expense',
            organization_id: defaultOrganizationId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }]);
          
        if (result.error) {
          throw new Error(`Fout bij toevoegen begroting: ${result.error.message}`);
        }
        
        setSuccess('Uitgavenbegroting succesvol toegevoegd');
      }
      
      // Reset formulier
      resetForm();
      
      // Herlaad data voor het geselecteerde jaar
      const supabaseRefresh = getBrowserSupabaseClient();
      const { data: refreshData, error: refreshError } = await supabaseRefresh
        .from('budget_entries')
        .select('*')
        .eq('type', 'expense')
        .eq('year', filterYear)
        .order('month', { ascending: true });
        
      if (refreshError) {
        console.error("Error refreshing data:", refreshError);
      } else {
        // Verrijk de data met grootboekinformatie
        const refreshedEntries = refreshData?.map(entry => {
          const matchingAccount = glAccounts?.find(acc => acc.id === entry.gl_account_id);
          return {
            ...entry,
            gl_account: matchingAccount || null
          };
        }) || [];
        
        setBudgetEntries(refreshedEntries);
      }
    } catch (err) {
      console.error('Error:', err);
      setError(err.message || 'Er is een fout opgetreden bij het opslaan van de begroting');
    } finally {
      setSubmitting(false);
    }
  };
  
  // Reset formulier
  const resetForm = () => {
    setDescription('');
    setAmount('');
    setError('');
    setSuccess('');
    // Laat de geselecteerde grootboekrekening staan als gemak voor de gebruiker
  };
  
  // Helper function voor maandnamen
  const getMonthName = (monthNumber) => {
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
        <h1 className="text-2xl font-bold mb-6 text-black">Uitgaven Begroting</h1>
        
        {/* Jaar filter */}
        <div className="mb-6">
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
        
        {/* Formulier voor het toevoegen van uitgaven begroting */}
        <div className="bg-white rounded shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-black">Nieuwe Uitgave Begroting</h2>
          
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="gl_account" className="block text-sm font-medium text-black">
                  Uitgavencategorie
                </label>
                <select
                  id="gl_account"
                  value={selectedGlAccountId}
                  onChange={(e) => setSelectedGlAccountId(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-black"
                  required
                >
                  <option value="">-- Selecteer categorie --</option>
                  {glAccounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.code} - {account.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-black">
                  Omschrijving
                </label>
                <input
                  type="text"
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-black"
                  placeholder="Optionele toelichting"
                  required
                />
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
            </div>
            
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
          <h2 className="text-xl font-semibold p-4 border-b text-black">Uitgaven Begroting Overzicht</h2>
          
          {loading ? (
            <div className="p-4 text-center">
              <p className="text-black">Gegevens laden...</p>
              </div>
          ) : budgetEntries.length === 0 ? (
            <div className="p-4 text-center">
              <p className="text-black">Geen begrotingsposten gevonden voor {filterYear}. Gebruik het formulier hierboven om een begroting toe te voegen.</p>
            </div>
          ) : (
          <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">Maand</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">Uitgavencategorie</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">Omschrijving</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-black uppercase tracking-wider">Bedrag</th>
                </tr>
              </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {budgetEntries.map((entry) => (
                    <tr key={entry.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-black">
                        {getMonthName(entry.month)} {entry.year}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-black">
                        {entry.gl_account ? `${entry.gl_account.code} - ${entry.gl_account.name}` : '-'}
                      </td>
                      <td className="px-6 py-4 text-black">
                        {entry.description}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-black text-right">
                        €{parseFloat(entry.amount).toFixed(2)}
                      </td>
                </tr>
                  ))}
              </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td colSpan={3} className="px-6 py-4 text-right font-medium text-black">
                      Totaal:
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-bold text-black text-right">
                      €{budgetEntries.reduce((sum, entry) => sum + parseFloat(entry.amount || 0), 0).toFixed(2)}
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