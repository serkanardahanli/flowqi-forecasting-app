"use client";

import { useState, useEffect } from 'react';
import { getBrowserSupabaseClient } from '@/app/lib/supabase';
import MainLayout from '@/app/components/MainLayout';

interface GlAccount {
  id: string;
  code: string;
  name: string;
  type: string;
  parent_id: string | null;
}

interface ExpenseEntry {
  id: string;
  description: string;
  amount: number;
  entry_date: string;
  entry_type: string;
  created_at: string;
  organization_id: string;
  gl_account_id: string;
  gl_account?: GlAccount;
  number_of_users?: number;
}

export default function ActualExpensesPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [glAccounts, setGlAccounts] = useState<GlAccount[]>([]);
  const [expenseEntries, setExpenseEntries] = useState<ExpenseEntry[]>([]);
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  
  // Form state
  const [selectedGlAccountId, setSelectedGlAccountId] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
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
        
        // Haal bestaande uitgaven op
        const { data: entriesData, error: entriesError } = await supabase
          .from('actual_entries')
          .select('*')
          .eq('entry_type', 'expense')
          .gte('entry_date', `${filterYear}-01-01`)  // Vanaf 1 januari van het geselecteerde jaar
          .lte('entry_date', `${filterYear}-12-31`)  // Tot 31 december van het geselecteerde jaar
          .order('entry_date', { ascending: false });
          
        if (entriesError) {
          console.error("Error fetching expense entries:", entriesError);
          setError(`Fout bij het ophalen van uitgaven: ${entriesError.message}`);
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
        console.log("Geladen uitgaven:", enrichedEntries?.length);

        setGlAccounts(accountsData || []);
        setExpenseEntries(enrichedEntries);
        
        if (accountsData && accountsData.length > 0 && !selectedGlAccountId) {
          setSelectedGlAccountId(accountsData[0].id);
        }
      } catch (err) {
        console.error("Onverwachte fout:", err);
        const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
        setError(`Onverwachte fout: ${errorMessage}`);
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
      if (!description || !amount || !date || !selectedGlAccountId) {
        throw new Error('Vul alle verplichte velden in');
      }
      
      const supabase = getBrowserSupabaseClient();
      
      // Maak nieuwe entry
      const { error } = await supabase
        .from('actual_entries')
        .insert([{
          description,
          amount: parseFloat(amount),
          entry_date: date,
          gl_account_id: selectedGlAccountId,
          entry_type: 'expense',
          organization_id: defaultOrganizationId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          // Voeg jaar en maand toe voor eventuele filtering
          year: new Date(date).getFullYear(),
          month: new Date(date).getMonth() + 1
        }]);
        
      if (error) {
        console.error("Insert error:", error);
        throw new Error(`Fout bij toevoegen uitgave: ${error.message}`);
      }
      
      setSuccess('Uitgave succesvol geregistreerd');
      
      // Reset formulier
      resetForm();
      
      // Herlaad data voor het geselecteerde jaar
      fetchFilteredData(filterYear);
      
    } catch (err) {
      console.error('Error:', err);
      setError(err.message || 'Er is een fout opgetreden bij het registreren van de uitgave');
    } finally {
      setSubmitting(false);
    }
  };
  
  // Filter data opnieuw ophalen
  const fetchFilteredData = async (year) => {
    try {
      const supabase = getBrowserSupabaseClient();
      
      // Haal gefilterde uitgaven op
      const { data: entriesData, error: entriesError } = await supabase
        .from('actual_entries')
        .select('*')
        .eq('entry_type', 'expense')
        .gte('entry_date', `${year}-01-01`)
        .lte('entry_date', `${year}-12-31`)
        .order('entry_date', { ascending: false });
        
      if (entriesError) {
        console.error("Error refreshing data:", entriesError);
        return;
      }
      
      // Verrijk de data met grootboekinformatie
      const enrichedEntries = entriesData?.map(entry => {
        const matchingAccount = glAccounts?.find(acc => acc.id === entry.gl_account_id);
        return {
          ...entry,
          gl_account: matchingAccount || null
        };
      }) || [];
      
      setExpenseEntries(enrichedEntries);
    } catch (err) {
      console.error("Error fetching filtered data:", err);
    }
  };
  
  // Reset formulier
  const resetForm = () => {
    setDescription('');
    setAmount('');
    setDate(new Date().toISOString().split('T')[0]);
    setError('');
    setSuccess('');
    // Laat de geselecteerde grootboekrekening staan als gemak voor de gebruiker
  };
  
  // Opties voor jaar filter
  const yearOptions = [];
  const currentYear = new Date().getFullYear();
  for (let i = 0; i < 4; i++) {
    yearOptions.push(currentYear - i);  // Toon huidige en voorgaande jaren
  }
  
  // Formatteer datum voor weergave
  const formatDate = (dateString) => {
    const options = { day: '2-digit', month: '2-digit', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('nl-NL', options);
  };

  return (
    <MainLayout>
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-6 text-black">Werkelijke Uitgaven</h1>
        
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
        
        {/* Formulier voor het toevoegen van werkelijke uitgaven */}
        <div className="bg-white rounded shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-black">Nieuwe Uitgave Registreren</h2>
          
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
                  required
                />
              </div>
              
              <div>
                <label htmlFor="date" className="block text-sm font-medium text-black">
                  Datum
                </label>
                <input
                  type="date"
                  id="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-black"
                  required
                />
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
        
        {/* Tabel met bestaande uitgaven */}
        <div className="bg-white rounded shadow overflow-hidden">
          <h2 className="text-xl font-semibold p-4 border-b text-black">Geregistreerde Uitgaven</h2>
          
          {loading ? (
            <div className="p-4 text-center">
              <p className="text-black">Gegevens laden...</p>
            </div>
          ) : expenseEntries.length === 0 ? (
            <div className="p-4 text-center">
              <p className="text-black">Geen uitgaven gevonden voor {filterYear}. Gebruik het formulier hierboven om uitgaven te registreren.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">Datum</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">Uitgavencategorie</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">Omschrijving</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-black uppercase tracking-wider">Bedrag</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {expenseEntries.map((entry) => (
                    <tr key={entry.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-black">
                        {formatDate(entry.entry_date)}
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
                      €{expenseEntries.reduce((sum, entry) => sum + parseFloat(entry.amount || 0), 0).toFixed(2)}
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