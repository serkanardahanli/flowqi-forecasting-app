'use client';

import { useState, useEffect, useMemo } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/types/supabase';
import { GlAccount } from '@/types/models';
import { formatCurrency, getMonthName, getYearOptions } from '@/lib/utils';
import MainLayout from '@/app/components/MainLayout';
import { ensureClientUserProfile } from '@/app/utils/auth';

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

export default function BudgetOverviewPage() {
  const supabase = createClientComponentClient<Database>();
  const [glAccounts, setGlAccounts] = useState<GlAccount[]>([]);
  const [budgetEntries, setBudgetEntries] = useState<BudgetEntryWithGlAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  
  const yearOptions = getYearOptions();
  const months = Array.from({ length: 12 }, (_, i) => getMonthName(i + 1));

  const getOrganizationId = async (): Promise<string | null> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return null;

    // Use maybeSingle instead of single to prevent errors with multiple or no rows
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', session.user.id)
      .maybeSingle();

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
        .eq('year', selectedYear)
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
  }, [selectedYear]);

  // Groepeer budget entries per GL account en bereken maandelijkse totalen
  const groupedBudget = useMemo(() => {
    // Creëer een gegroepeerde object per GL account niveau
    const level1Data: GroupedBudget = {};
    const level2Data: GroupedBudget = {};
    const level3Data: GroupedBudget = {};

    // Functie om het totaal voor een entry aan een groep toe te voegen
    const addToGroup = (group: GroupedBudget, code: string, name: string, level: number, amount: number, month: number) => {
      if (!group[code]) {
        group[code] = {
          name,
          level,
          code,
          values: Array(12).fill(0),
          total: 0
        };
      }
      group[code].values[month - 1] += amount;
      group[code].total += amount;
    };

    // Verwerk budget entries
    budgetEntries.forEach(entry => {
      if (!entry.gl_accounts) return;

      const account = entry.gl_accounts;
      const amount = entry.amount || 0;
      const month = entry.month;

      // Voeg toe aan het juiste niveau
      if (account.level === 3) {
        // Niveau 3 (Cost Entry)
        addToGroup(level3Data, account.code, account.name, account.level, amount, month);

        // Voeg ook toe aan niveau 2 (parent)
        if (account.parent_code) {
          const parent = glAccounts.find(a => a.code === account.parent_code);
          if (parent) {
            addToGroup(level2Data, parent.code, parent.name, parent.level, amount, month);

            // Voeg ook toe aan niveau 1 (grandparent)
            if (parent.parent_code) {
              const grandparent = glAccounts.find(a => a.code === parent.parent_code);
              if (grandparent) {
                addToGroup(level1Data, grandparent.code, grandparent.name, grandparent.level, amount, month);
              }
            }
          }
        }
      } else if (account.level === 2) {
        // Niveau 2 (Subgroup)
        addToGroup(level2Data, account.code, account.name, account.level, amount, month);

        // Voeg ook toe aan niveau 1 (parent)
        if (account.parent_code) {
          const parent = glAccounts.find(a => a.code === account.parent_code);
          if (parent) {
            addToGroup(level1Data, parent.code, parent.name, parent.level, amount, month);
          }
        }
      } else if (account.level === 1) {
        // Niveau 1 (Main group)
        addToGroup(level1Data, account.code, account.name, account.level, amount, month);
      }
    });

    return {
      level1: Object.values(level1Data).sort((a, b) => a.code.localeCompare(b.code)),
      level2: Object.values(level2Data).sort((a, b) => a.code.localeCompare(b.code)),
      level3: Object.values(level3Data).sort((a, b) => a.code.localeCompare(b.code)),
    };
  }, [glAccounts, budgetEntries]);

  // Bereken maandelijkse totalen
  const monthlyTotals = useMemo(() => {
    const totals = Array(12).fill(0);
    
    budgetEntries.forEach(entry => {
      if (entry.month >= 1 && entry.month <= 12) {
        totals[entry.month - 1] += entry.amount || 0;
      }
    });
    
    return totals;
  }, [budgetEntries]);

  // Bereken jaartotaal
  const yearTotal = useMemo(() => {
    return monthlyTotals.reduce((sum, val) => sum + val, 0);
  }, [monthlyTotals]);

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedYear(parseInt(e.target.value));
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-[#1E1E3F]">Budget Overzicht</h1>
          <div className="flex items-center">
            <label htmlFor="yearSelector" className="mr-2">Jaar:</label>
            <select
              id="yearSelector"
              value={selectedYear}
              onChange={handleYearChange}
              className="border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
              {yearOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 text-sm text-red-700 bg-red-100 rounded-lg">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-10">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#1E1E3F] border-r-transparent"></div>
            <p className="mt-4 text-gray-500">Gegevens laden...</p>
          </div>
        ) : budgetEntries.length === 0 ? (
          <div className="bg-white shadow rounded-lg p-6 text-center text-gray-500">
            Geen budgetposten gevonden voor {selectedYear}. Voeg budgetposten toe via de uitgavenpagina.
          </div>
        ) : (
          <div className="bg-white shadow rounded-lg">
            <div className="space-y-8">
              {/* Niveau 1: Hoofdgroepen */}
              <div className="bg-white shadow overflow-hidden rounded-lg">
                <div className="px-4 py-5 bg-gray-50 border-b border-gray-200">
                  <h2 className="text-lg font-medium text-gray-700">Uitgaven per hoofdgroep</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Code
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Naam
                        </th>
                        {months.map((month, i) => (
                          <th key={i} scope="col" className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {month.substring(0, 3)}
                          </th>
                        ))}
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Totaal
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {groupedBudget.level1.map((item, i) => (
                        <tr key={item.code} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {item.code}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                            {item.name}
                          </td>
                          {item.values.map((value, i) => (
                            <td key={i} className="px-3 py-4 whitespace-nowrap text-sm text-right text-gray-700">
                              {formatCurrency(value)}
                            </td>
                          ))}
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-gray-900">
                            {formatCurrency(item.total)}
                          </td>
                        </tr>
                      ))}
                      {/* Totaalrij */}
                      <tr className="bg-gray-100">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                          Totaal
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap"></td>
                        {monthlyTotals.map((total, i) => (
                          <td key={i} className="px-3 py-4 whitespace-nowrap text-sm text-right font-semibold text-gray-900">
                            {formatCurrency(total)}
                          </td>
                        ))}
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-gray-900">
                          {formatCurrency(yearTotal)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Niveau 2: Subgroepen */}
              {groupedBudget.level2.length > 0 && (
                <div className="bg-white shadow overflow-hidden rounded-lg">
                  <div className="px-4 py-5 bg-gray-50 border-b border-gray-200">
                    <h2 className="text-lg font-medium text-gray-700">Uitgaven per subgroep</h2>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Code
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Naam
                          </th>
                          {months.map((month, i) => (
                            <th key={i} scope="col" className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                              {month.substring(0, 3)}
                            </th>
                          ))}
                          <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Totaal
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {groupedBudget.level2.map((item, i) => (
                          <tr key={item.code} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {item.code}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                              {item.name}
                            </td>
                            {item.values.map((value, i) => (
                              <td key={i} className="px-3 py-4 whitespace-nowrap text-sm text-right text-gray-700">
                                {formatCurrency(value)}
                              </td>
                            ))}
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-gray-900">
                              {formatCurrency(item.total)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Niveau 3: Kostenposten */}
              {groupedBudget.level3.length > 0 && (
                <div className="bg-white shadow overflow-hidden rounded-lg">
                  <div className="px-4 py-5 bg-gray-50 border-b border-gray-200">
                    <h2 className="text-lg font-medium text-gray-700">Uitgaven per kostenpost</h2>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Code
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Naam
                          </th>
                          {months.map((month, i) => (
                            <th key={i} scope="col" className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                              {month.substring(0, 3)}
                            </th>
                          ))}
                          <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Totaal
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {groupedBudget.level3.map((item, i) => (
                          <tr key={item.code} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {item.code}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                              {item.name}
                            </td>
                            {item.values.map((value, i) => (
                              <td key={i} className="px-3 py-4 whitespace-nowrap text-sm text-right text-gray-700">
                                {formatCurrency(value)}
                              </td>
                            ))}
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-gray-900">
                              {formatCurrency(item.total)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
} 