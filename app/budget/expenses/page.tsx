'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/types/supabase';
import { GlAccount, BudgetEntry } from '@/types/models';
import { PencilIcon, TrashIcon, PlusIcon } from '@heroicons/react/24/outline';
import GlAccountSelector from '@/app/components/GlAccountSelector';
import { formatCurrency, getMonthOptions, getYearOptions } from '@/lib/utils';
import { useSupabase } from '@/app/hooks/useSupabase';
import { useRouter, usePathname } from 'next/navigation';
import { getBrowserSupabaseClient } from '@/app/lib/supabase';
import UserMenu from '@/app/components/UserMenu';
import { PlusIcon as PlusIconOutline, PencilIcon as PencilIconOutline, TrashIcon as TrashIconOutline, XMarkIcon, Bars3Icon } from '@heroicons/react/24/outline';
import { ensureClientUserProfile } from '@/app/utils/auth';

export default function BudgetExpensesPage() {
  const supabase = createClientComponentClient<Database>();
  const router = useRouter();
  const pathname = usePathname();
  const [glAccounts, setGlAccounts] = useState<GlAccount[]>([]);
  const [budgetEntries, setBudgetEntries] = useState<BudgetEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState<Partial<BudgetEntry>>({
    gl_account_id: '',
    month: new Date().getMonth() + 1, // Current month
    year: new Date().getFullYear(), // Current year
    amount: 0,
    type: 'expense',
  });
  const [editing, setEditing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedGlAccountCode, setSelectedGlAccountCode] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const monthOptions = getMonthOptions();
  const yearOptions = getYearOptions();

  const { supabase: supabaseHook } = useSupabase();

  const getOrganizationId = async (): Promise<string | null> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return null;

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', session.user.id)
      .single();

    if (error || !profile?.organization_id) {
      console.error('Error getting organization ID:', error?.message || 'No organization found');
      return null;
    }

    return profile.organization_id;
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        window.location.href = '/auth/signin';
        return;
      }

      // Ensure user profile is properly set up
      await ensureClientUserProfile(session.user.id);

      const organizationId = await getOrganizationId();
      if (!organizationId) {
        setError('Geen organisatie gevonden. Log opnieuw in of neem contact op met ondersteuning.');
        setLoading(false);
        return;
      }

      // Fetch GL accounts
      const { data: accountsData, error: accountsError } = await supabase
        .from('gl_accounts')
        .select('*')
        .eq('organization_id', organizationId)
        .order('code');

      if (accountsError) {
        throw new Error(`Error fetching GL accounts: ${accountsError.message}`);
      }

      // Fetch budget entries
      const { data: entriesData, error: entriesError } = await supabase
        .from('budget_entries')
        .select('*, gl_accounts(*)')
        .eq('organization_id', organizationId)
        .eq('type', 'expense');

      if (entriesError) {
        throw new Error(`Error fetching budget entries: ${entriesError.message}`);
      }

      setGlAccounts(accountsData || []);
      setBudgetEntries(entriesData || []);
    } catch (err) {
      console.error('Error:', err);
      setError(err instanceof Error ? err.message : 'Er is een fout opgetreden bij het ophalen van gegevens');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const resetForm = () => {
    setFormData({
      gl_account_id: '',
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
      amount: 0,
      type: 'expense',
    });
    setSelectedGlAccountCode(null);
    setEditing(null);
    setError(null);
  };

  const handleOpenModal = () => {
    resetForm();
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        window.location.href = '/auth/signin';
        return;
      }

      // Ensure user profile is properly set up
      await ensureClientUserProfile(session.user.id);

      if (!formData.gl_account_id) {
        setError('Selecteer een grootboekrekening');
        return;
      }

      const organizationId = await getOrganizationId();
      if (!organizationId) {
        setError('Geen organisatie gevonden. Log opnieuw in of neem contact op met ondersteuning.');
        return;
      }

      const newEntry = {
        ...formData,
        organization_id: organizationId,
      } as BudgetEntry;

      // Check if an entry already exists for this account, month, year, and type
      const { data: existingEntries, error: checkError } = await supabase
        .from('budget_entries')
        .select('id')
        .eq('gl_account_id', formData.gl_account_id)
        .eq('month', formData.month)
        .eq('year', formData.year)
        .eq('type', 'expense')
        .eq('organization_id', organizationId);

      if (checkError) {
        throw new Error(`Error checking existing entries: ${checkError.message}`);
      }

      // If we're editing and there's an existing entry that's not the one we're editing
      if (editing && existingEntries && existingEntries.some(entry => entry.id !== editing)) {
        setError('Er bestaat al een budgetpost voor deze grootboekrekening, maand, en jaar');
        return;
      }

      // If we're creating a new entry and there's already one
      if (!editing && existingEntries && existingEntries.length > 0) {
        setError('Er bestaat al een budgetpost voor deze grootboekrekening, maand, en jaar');
        return;
      }

      if (editing) {
        // Update existing entry
        const { error } = await supabase
          .from('budget_entries')
          .update(newEntry)
          .eq('id', editing);

        if (error) throw new Error(`Error updating entry: ${error.message}`);
      } else {
        // Create new entry
        const { error } = await supabase
          .from('budget_entries')
          .insert([newEntry]);

        if (error) throw new Error(`Error creating entry: ${error.message}`);
      }

      // Refresh data
      await fetchData();
      handleCloseModal();
    } catch (err) {
      console.error('Error:', err);
      setError(err instanceof Error ? err.message : 'Er is een fout opgetreden');
    }
  };

  const handleEdit = (entry: BudgetEntry) => {
    setFormData({
      gl_account_id: entry.gl_account_id,
      month: entry.month,
      year: entry.year,
      amount: entry.amount,
      type: entry.type,
    });
    
    // Set selected GL account code for the selector
    const glAccount = glAccounts.find(acc => acc.id === entry.gl_account_id);
    if (glAccount) {
      setSelectedGlAccountCode(glAccount.code);
    }
    
    setEditing(entry.id);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Weet je zeker dat je deze budgetpost wilt verwijderen?')) return;

    try {
      const { error } = await supabase
        .from('budget_entries')
        .delete()
        .eq('id', id);

      if (error) throw new Error(`Error deleting entry: ${error.message}`);

      // Refresh data
      await fetchData();
    } catch (err) {
      console.error('Error:', err);
      setError(err instanceof Error ? err.message : 'Er is een fout opgetreden bij het verwijderen');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }));
  };

  const handleGlAccountSelect = (accountId: string) => {
    setFormData(prev => ({
      ...prev,
      gl_account_id: accountId
    }));
    
    // Set the selected code for display purposes
    const selectedAccount = glAccounts.find(acc => acc.id === accountId);
    if (selectedAccount) {
      setSelectedGlAccountCode(selectedAccount.code);
    }
  };

  // Get the GL account name from the ID
  const getGlAccountName = (id: string): string => {
    const account = glAccounts.find(acc => acc.id === id);
    return account ? `${account.code} - ${account.name}` : 'Onbekend';
  };

  // Get the month name from the month number
  const getMonthName = (month: number): string => {
    const monthOption = monthOptions.find(opt => opt.value === month);
    return monthOption ? monthOption.label : 'Onbekend';
  };

  const handleSignOut = async () => {
    const supabase = getBrowserSupabaseClient();
    await supabase.auth.signOut();
    router.push('/auth/signin');
  };

  const navigationItems = [
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'Grootboekrekeningen', href: '/gl-accounts' },
    { name: 'Producten', href: '/products' },
    {
      name: 'Omzet',
      href: '#',
      children: [
        { name: 'SaaS', href: '/revenue/saas' },
        { name: 'Consultancy', href: '/revenue/consultancy' }
      ]
    },
    {
      name: 'Begroting',
      href: '#',
      children: [
        { name: 'Uitgaven', href: '/budget/expenses' },
        { name: 'Overzicht', href: '/budget' }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-[#1E1E3F]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <span className="text-white font-bold text-lg">FlowQi</span>
              </div>
              <div className="hidden md:block">
                <div className="ml-10 flex items-baseline space-x-4">
                  {navigationItems.map((item) => 
                    item.children ? (
                      <div key={item.name} className="relative group">
                        <button className="text-gray-300 hover:bg-[#3B3B7C] hover:text-white px-3 py-2 rounded-md text-sm font-medium group">
                          {item.name}
                          <svg className="w-5 h-5 ml-1 inline-block" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </button>
                        <div className="hidden group-hover:block absolute left-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 z-10">
                          {item.children.map(child => (
                            <a
                              key={child.name}
                              href={child.href}
                              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                              {child.name}
                            </a>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <a
                        key={item.name}
                        href={item.href}
                        className={`${
                          pathname === item.href
                            ? 'bg-[#3B3B7C] text-white'
                            : 'text-gray-300 hover:bg-[#3B3B7C] hover:text-white'
                        } px-3 py-2 rounded-md text-sm font-medium`}
                      >
                        {item.name}
                      </a>
                    )
                  )}
                </div>
              </div>
            </div>
            <div className="hidden md:block">
              <div className="ml-4 flex items-center md:ml-6">
                <UserMenu />
              </div>
            </div>
            <div className="-mr-2 flex md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="bg-[#3B3B7C] inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-[#4B4BAC] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#3B3B7C] focus:ring-white"
              >
                <span className="sr-only">Open main menu</span>
                {mobileMenuOpen ? (
                  <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
                ) : (
                  <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              {navigationItems.map((item) => (
                <div key={item.name}>
                  {item.children ? (
                    <>
                      <p className="text-gray-300 px-3 py-2 text-sm font-medium">
                        {item.name}
                      </p>
                      <div className="pl-4">
                        {item.children.map(child => (
                          <a
                            key={child.name}
                            href={child.href}
                            className="block text-gray-300 hover:bg-[#3B3B7C] hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                          >
                            {child.name}
                          </a>
                        ))}
                      </div>
                    </>
                  ) : (
                    <a
                      href={item.href}
                      className={`${
                        pathname === item.href
                          ? 'bg-[#3B3B7C] text-white'
                          : 'text-gray-300 hover:bg-[#3B3B7C] hover:text-white'
                      } block px-3 py-2 rounded-md text-sm font-medium`}
                    >
                      {item.name}
                    </a>
                  )}
                </div>
              ))}
            </div>
            <div className="pt-4 pb-3 border-t border-gray-700">
              <div className="px-2">
                <UserMenu />
              </div>
            </div>
          </div>
        )}
      </nav>

      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-800">Uitgaven Planning</h1>
            <button
              onClick={handleOpenModal}
              className="bg-[#1E1E3F] text-white px-4 py-2 rounded flex items-center"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Budgetpost toevoegen
            </button>
          </div>
        </div>
      </header>

      <main>
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}

            {loading ? (
              <div className="flex justify-center py-8">
                <svg className="animate-spin h-8 w-8 text-[#1E1E3F]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
            ) : (
              <div className="bg-white shadow overflow-hidden rounded-lg">
                {budgetEntries.length === 0 ? (
                  <div className="py-8 text-center text-gray-500">
                    Geen budgetposten gevonden. Voeg een budgetpost toe om te beginnen.
                  </div>
                ) : (
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Grootboekrekening
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Maand
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Jaar
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Bedrag
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Acties
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {budgetEntries.map((entry) => (
                        <tr key={entry.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {entry.gl_accounts ? `${entry.gl_accounts.code} - ${entry.gl_accounts.name}` : 'Onbekend'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {getMonthName(entry.month)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {entry.year}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency(entry.amount)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => handleEdit(entry)}
                              className="text-indigo-600 hover:text-indigo-900 mr-4"
                            >
                              <PencilIcon className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => handleDelete(entry.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <TrashIcon className="h-5 w-5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {/* Modal for adding/editing budget entries */}
            {showModal && (
              <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                  <h2 className="text-xl font-semibold mb-4">
                    {editing ? 'Budgetpost bewerken' : 'Nieuwe budgetpost toevoegen'}
                  </h2>
                  
                  <form onSubmit={handleSubmit}>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Grootboekrekening</label>
                        <GlAccountSelector
                          glAccounts={glAccounts}
                          onSelect={handleGlAccountSelect}
                          allowedLevels={[3]} // Only allow level 3 (cost entries)
                          initialSelectedCode={selectedGlAccountCode}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Maand</label>
                          <select
                            name="month"
                            value={formData.month}
                            onChange={handleChange}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            required
                          >
                            {monthOptions.map(option => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Jaar</label>
                          <select
                            name="year"
                            value={formData.year}
                            onChange={handleChange}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            required
                          >
                            {yearOptions.map(option => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Bedrag (€)</label>
                        <input
                          type="number"
                          name="amount"
                          value={formData.amount || ''}
                          onChange={handleChange}
                          min="0"
                          step="0.01"
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          required
                        />
                      </div>
                    </div>
                    
                    {error && (
                      <div className="mt-4 text-sm text-red-600">
                        {error}
                      </div>
                    )}
                    
                    <div className="mt-6 flex justify-end space-x-3">
                      <button
                        type="button"
                        onClick={handleCloseModal}
                        className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        Annuleren
                      </button>
                      <button
                        type="submit"
                        className="bg-[#1E1E3F] py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-[#2D2D5F] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        {editing ? 'Opslaan' : 'Toevoegen'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
} 