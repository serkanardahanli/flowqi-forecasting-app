'use client';

import { useState, useEffect } from 'react';
import { getBrowserSupabaseClient } from '@/app/lib/supabase';
import { ArrowDownTrayIcon, ArrowUpTrayIcon } from '@heroicons/react/24/outline';

interface GLAccount {
  id: string;
  code: string;
  name: string;
  type: 'Inkomsten' | 'Uitgaven';
  level: number;
  category?: string;
  parent_code?: string;
  debet_credit: string;
  is_blocked: boolean;
  is_compressed: boolean;
  created_at: string;
  balans_type: 'Winst & Verlies' | 'Balans';
}

// Helper function to generate CSV content
const generateCSVTemplate = () => {
  const headers = [
    'code',
    'name',
    'type',
    'level',
    'category',
    'parent_code',
    'debet_credit',
    'balans_type'
  ].join(',');
  
  const exampleRow = [
    '8000',
    'Omzet',
    'Inkomsten',
    '1',
    'Omzet',
    '',
    'Credit',
    'Winst & Verlies'
  ].join(',');
  
  return `${headers}\n${exampleRow}`;
};

// Helper function to download CSV
const downloadCSV = () => {
  const csvContent = generateCSVTemplate();
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.setAttribute('download', 'grootboekrekeningen_template.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Helper function to parse CSV content
const parseCSV = (content: string) => {
  const [headers, ...rows] = content.trim().split('\n');
  const headerArray = headers.split(',').map(h => h.trim());
  
  return rows.map(row => {
    const values = row.split(',').map(v => v.trim());
    const record: any = {};
    headerArray.forEach((header, index) => {
      record[header] = values[index];
    });
    return record;
  });
};

// Helper function to validate CSV data
const validateCSVData = (data: any[]) => {
  const errors: string[] = [];
  
  data.forEach((row, index) => {
    if (!row.code) errors.push(`Rij ${index + 1}: Code is verplicht`);
    if (!row.name) errors.push(`Rij ${index + 1}: Naam is verplicht`);
    if (!['Inkomsten', 'Uitgaven'].includes(row.type)) {
      errors.push(`Rij ${index + 1}: Type moet 'Inkomsten' of 'Uitgaven' zijn`);
    }
    if (![1, 2, 3].includes(Number(row.level))) {
      errors.push(`Rij ${index + 1}: Niveau moet 1, 2 of 3 zijn`);
    }
    if (!['Debet', 'Credit'].includes(row.debet_credit)) {
      errors.push(`Rij ${index + 1}: Debet/Credit moet 'Debet' of 'Credit' zijn`);
    }
    if (!['Winst & Verlies', 'Balans'].includes(row.balans_type)) {
      errors.push(`Rij ${index + 1}: Balans Type moet 'Winst & Verlies' of 'Balans' zijn`);
    }
  });
  
  return errors;
};

export default function GLAccountsPage() {
  const [glAccounts, setGLAccounts] = useState<GLAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editingAccount, setEditingAccount] = useState<GLAccount | null>(null);
  
  // Form state
  const [accountName, setAccountName] = useState('');
  const [accountCode, setAccountCode] = useState('');
  const [accountType, setAccountType] = useState('Inkomsten');
  const [accountLevel, setAccountLevel] = useState(1);
  const [accountCategory, setAccountCategory] = useState('');
  const [accountDebetCredit, setAccountDebetCredit] = useState('Credit');
  const [accountBalansType, setAccountBalansType] = useState<'Winst & Verlies' | 'Balans'>('Winst & Verlies');
  
  // Import state
  const [importError, setImportError] = useState<string[]>([]);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);
  
  // Reset form
  const resetForm = () => {
    setAccountName('');
    setAccountCode('');
    setAccountType('Inkomsten');
    setAccountLevel(1);
    setAccountCategory('');
    setAccountDebetCredit('Credit');
    setAccountBalansType('Winst & Verlies');
    setEditingAccount(null);
  };

  // Set form data for editing
  const setFormData = (account: GLAccount) => {
    setAccountName(account.name);
    setAccountCode(account.code);
    setAccountType(account.type);
    setAccountLevel(account.level);
    setAccountCategory(account.category || '');
    setAccountDebetCredit(account.debet_credit);
    setAccountBalansType(account.balans_type);
    setEditingAccount(account);
  };

  // Fetch GL accounts
  const fetchGLAccounts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const supabase = getBrowserSupabaseClient();
      console.log('Fetching GL accounts...');
      
      const { data, error } = await supabase
        .from('gl_accounts')
        .select('*')
        .order('code', { ascending: true });
        
      if (error) {
        console.error('Error fetching GL accounts:', error);
        throw new Error(`Database error: ${error.message}`);
      }
      
      console.log('Fetched GL accounts:', data);
      
      if (!data || data.length === 0) {
        // Create default accounts if none exist
        console.log('No GL accounts found, creating default accounts...');
        const defaultAccounts = [
          {
            code: '8000',
            name: 'Omzet',
            type: 'Inkomsten',
            level: 1,
            category: 'Omzet',
            debet_credit: 'Credit',
            is_blocked: false,
            is_compressed: false,
            balans_type: 'Winst & Verlies'
          },
          {
            code: '8010',
            name: 'Omzet Consultancy',
            type: 'Inkomsten',
            level: 2,
            category: 'Omzet',
            debet_credit: 'Credit',
            is_blocked: false,
            is_compressed: false,
            balans_type: 'Winst & Verlies'
          },
          {
            code: '4000',
            name: 'Kosten',
            type: 'Uitgaven',
            level: 1,
            category: 'Kosten',
            debet_credit: 'Debet',
            is_blocked: false,
            is_compressed: false,
            balans_type: 'Winst & Verlies'
          },
          {
            code: '4400',
            name: 'Marketing',
            type: 'Uitgaven',
            level: 2,
            category: 'Kosten',
            debet_credit: 'Debet',
            is_blocked: false,
            is_compressed: false,
            balans_type: 'Winst & Verlies'
          }
        ];

        const { error: insertError } = await supabase
          .from('gl_accounts')
          .insert(defaultAccounts);

        if (insertError) {
          console.error('Error creating default accounts:', insertError);
          throw new Error(`Error creating default accounts: ${insertError.message}`);
        }

        console.log('Default accounts created successfully');
        setGLAccounts(defaultAccounts);
      } else {
        setGLAccounts(data);
      }
    } catch (err) {
      console.error('Error in fetchGLAccounts:', err);
      setError(
        err instanceof Error 
          ? err.message 
          : 'Er is een fout opgetreden bij het ophalen van de grootboekrekeningen.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchGLAccounts();
  }, []);
  
  // Handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    
    try {
      if (!accountName || !accountCode) {
        throw new Error('Vul alle verplichte velden in.');
      }
      
      const supabase = getBrowserSupabaseClient();
      console.log('Checking for existing account with code:', accountCode);
      
      // Check if account code already exists
      const { data: existing, error: existingError } = await supabase
        .from('gl_accounts')
        .select('id')
        .eq('code', accountCode);

      if (existingError) {
        console.error('Error checking existing account:', existingError);
        throw new Error(`Fout bij controleren bestaande rekening: ${existingError.message}`);
      }
        
      if (existing && existing.length > 0) {
        throw new Error('Er bestaat al een grootboekrekening met deze code.');
      }

      console.log('Creating new GL account with data:', {
        name: accountName,
        code: accountCode,
        type: accountType,
        level: accountLevel,
        category: accountCategory,
        debet_credit: accountDebetCredit,
        balans_type: accountBalansType
      });
      
      // Insert new GL account
      const { data: insertData, error: insertError } = await supabase
        .from('gl_accounts')
        .insert([{
          name: accountName,
          code: accountCode,
          type: accountType as 'Inkomsten' | 'Uitgaven',
          level: accountLevel,
          category: accountCategory,
          debet_credit: accountDebetCredit,
          is_blocked: false,
          is_compressed: false,
          balans_type: accountBalansType
        }])
        .select();
        
      if (insertError) {
        console.error('Error inserting GL account:', insertError);
        throw new Error(`Database fout bij toevoegen: ${insertError.message}`);
      }

      console.log('Successfully created GL account:', insertData);
      
      setSuccess('Grootboekrekening succesvol toegevoegd.');
      resetForm();
      fetchGLAccounts();
      
    } catch (err) {
      console.error('Error creating GL account:', err);
      setError(err instanceof Error ? err.message : 'Er is een onverwachte fout opgetreden bij het aanmaken van de grootboekrekening.');
    }
  };
  
  // Handle edit
  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    
    if (!editingAccount) return;
    
    try {
      if (!accountName || !accountCode) {
        throw new Error('Vul alle verplichte velden in.');
      }
      
      const supabase = getBrowserSupabaseClient();
      
      // Check if account code already exists (excluding current account)
      const { data: existing } = await supabase
        .from('gl_accounts')
        .select('id')
        .eq('code', accountCode)
        .neq('id', editingAccount.id);
        
      if (existing && existing.length > 0) {
        throw new Error('Er bestaat al een grootboekrekening met deze code.');
      }
      
      // Update GL account
      const { error: updateError } = await supabase
        .from('gl_accounts')
        .update({
          name: accountName,
          code: accountCode,
          type: accountType,
          level: accountLevel,
          category: accountCategory,
          debet_credit: accountDebetCredit,
          balans_type: accountBalansType
        })
        .eq('id', editingAccount.id);
        
      if (updateError) throw updateError;
      
      setSuccess('Grootboekrekening succesvol bijgewerkt.');
      resetForm();
      fetchGLAccounts();
      
    } catch (err) {
      console.error('Error updating GL account:', err);
      setError(err instanceof Error ? err.message : 'Er is een fout opgetreden.');
    }
  };
  
  // Handle delete
  const handleDelete = async (id: string) => {
    if (!confirm('Weet je zeker dat je deze grootboekrekening wilt verwijderen?')) {
      return;
    }
    
    try {
      const supabase = getBrowserSupabaseClient();
      const { error } = await supabase
        .from('gl_accounts')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      setSuccess('Grootboekrekening succesvol verwijderd.');
      fetchGLAccounts();
      
    } catch (err) {
      console.error('Error deleting GL account:', err);
      setError('Er is een fout opgetreden bij het verwijderen van de grootboekrekening.');
    }
  };

  // Handle CSV import
  const handleCSVImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImportError([]);
    setImportSuccess(null);
    
    try {
      const content = await file.text();
      const data = parseCSV(content);
      
      // Validate data
      const validationErrors = validateCSVData(data);
      if (validationErrors.length > 0) {
        setImportError(validationErrors);
        return;
      }
      
      // Insert data into Supabase
      const supabase = getBrowserSupabaseClient();
      
      // Process each row
      for (const row of data) {
        const { data: existing } = await supabase
          .from('gl_accounts')
          .select('id')
          .eq('code', row.code);
          
        if (existing && existing.length > 0) {
          setImportError(prev => [...prev, `Grootboekrekening met code ${row.code} bestaat al`]);
          continue;
        }
        
        const { error: insertError } = await supabase
          .from('gl_accounts')
          .insert([{
            code: row.code,
            name: row.name,
            type: row.type,
            level: Number(row.level),
            category: row.category,
            parent_code: row.parent_code || null,
            debet_credit: row.debet_credit,
            is_blocked: false,
            is_compressed: false,
            balans_type: row.balans_type
          }]);
          
        if (insertError) {
          setImportError(prev => [...prev, `Fout bij importeren van rij met code ${row.code}: ${insertError.message}`]);
        }
      }
      
      if (importError.length === 0) {
        setImportSuccess('Grootboekrekeningen succesvol geïmporteerd');
        fetchGLAccounts();
      }
      
    } catch (error) {
      setImportError(['Er is een fout opgetreden bij het verwerken van het CSV bestand']);
      console.error('CSV import error:', error);
    }
    
    // Reset file input
    event.target.value = '';
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-black">Grootboekrekeningen</h1>
        <div className="flex gap-4">
          <button
            onClick={downloadCSV}
            className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600"
          >
            <ArrowDownTrayIcon className="h-5 w-5" />
            Download Template
          </button>
          <label className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 cursor-pointer">
            <ArrowUpTrayIcon className="h-5 w-5" />
            Importeer CSV
            <input
              type="file"
              accept=".csv"
              onChange={handleCSVImport}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {importError.length > 0 && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          <p className="font-medium">Import fouten:</p>
          <ul className="list-disc list-inside">
            {importError.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      {importSuccess && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-6">
          <p>{importSuccess}</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          <p className="font-medium">Fout</p>
          <p>{error}</p>
          <p className="mt-2 text-sm">
            Mogelijk bent u niet ingelogd of heeft u geen toegang tot deze gegevens.
            Probeer <button 
              className="underline hover:text-red-800" 
              onClick={() => window.location.reload()}
            >
              de pagina te vernieuwen
            </button> of
            <a 
              href="/dashboard" 
              className="underline hover:text-red-800 ml-1"
            >
              terug te gaan naar het dashboard
            </a>.
          </p>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-6">
          <p>{success}</p>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-600">Gegevens worden geladen...</p>
        </div>
      ) : (
        <>
          {/* Add/Edit GL account form */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4 text-black">
              {editingAccount ? 'Grootboekrekening Bewerken' : 'Nieuwe Grootboekrekening'}
            </h2>
            <form onSubmit={editingAccount ? handleEdit : handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-black">
                    Code
                  </label>
                  <input
                    type="text"
                    value={accountCode}
                    onChange={(e) => setAccountCode(e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-black"
                    placeholder="Bijv. 8000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-black">
                    Naam
                  </label>
                  <input
                    type="text"
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-black"
                    placeholder="Bijv. Omzet Consultancy"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-black">
                    Type
                  </label>
                  <select
                    value={accountType}
                    onChange={(e) => setAccountType(e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-black"
                  >
                    <option value="Inkomsten">Inkomsten</option>
                    <option value="Uitgaven">Uitgaven</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-black">
                    Niveau
                  </label>
                  <select
                    value={accountLevel}
                    onChange={(e) => setAccountLevel(Number(e.target.value))}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-black"
                  >
                    <option value={1}>Hoofdgroep</option>
                    <option value={2}>Subgroep</option>
                    <option value={3}>Invoerpost</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-black">
                    Categorie
                  </label>
                  <input
                    type="text"
                    value={accountCategory}
                    onChange={(e) => setAccountCategory(e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-black"
                    placeholder="Bijv. Omzet"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-black">
                    Debet/Credit
                  </label>
                  <select
                    value={accountDebetCredit}
                    onChange={(e) => setAccountDebetCredit(e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-black"
                  >
                    <option value="Debet">Debet</option>
                    <option value="Credit">Credit</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-black">
                    Balans Type
                  </label>
                  <select
                    value={accountBalansType}
                    onChange={(e) => setAccountBalansType(e.target.value as 'Winst & Verlies' | 'Balans')}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-black"
                  >
                    <option value="Winst & Verlies">Winst & Verlies</option>
                    <option value="Balans">Balans</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                {editingAccount && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
                  >
                    Annuleren
                  </button>
                )}
                <button
                  type="submit"
                  className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
                >
                  {editingAccount ? 'Bijwerken' : 'Toevoegen'}
                </button>
              </div>
            </form>
          </div>
          
          {/* GL accounts list */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                    Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                    Naam
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                    Niveau
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                    Categorie
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                    Balans Type
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-black uppercase tracking-wider">
                    Acties
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {glAccounts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-black">
                      Geen grootboekrekeningen gevonden
                    </td>
                  </tr>
                ) : (
                  glAccounts.map((account) => (
                    <tr key={account.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-black">
                        {account.code}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-black">
                        {account.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-black">
                        {account.type}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-black">
                        {account.level === 1 ? 'Hoofdgroep' : account.level === 2 ? 'Subgroep' : 'Invoerpost'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-black">
                        {account.category}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-black">
                        {account.balans_type}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right space-x-2">
                        <button
                          onClick={() => setFormData(account)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Bewerken
                        </button>
                        <button
                          onClick={() => handleDelete(account.id)}
                          className="text-red-600 hover:text-red-900 ml-2"
                        >
                          Verwijderen
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
} 