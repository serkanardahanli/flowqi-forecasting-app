'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { createClient } from '@/utils/supabase/client';
import { PlusIcon, ClipboardDocumentListIcon } from '@heroicons/react/24/outline';

type Expense = {
  id: string;
  description: string;
  amount: number;
  expense_date: string;
  category: string;
  organization_id: string;
  created_at: string;
};

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchExpenses() {
      try {
        const supabase = createClient();
        
        // Eerst de huidige gebruiker ophalen
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError) {
          throw new Error(userError.message);
        }
        
        if (!user) {
          throw new Error('Je moet ingelogd zijn om uitgaven te bekijken');
        }
        
        // Dan de organisatie van de gebruiker opvragen
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('organization_id')
          .eq('id', user.id)
          .single();
        
        if (profileError) {
          throw new Error(profileError.message);
        }
        
        if (!profileData?.organization_id) {
          throw new Error('Geen organisatie gevonden');
        }
        
        // En dan alle uitgaven van die organisatie ophalen
        const { data, error: expensesError } = await supabase
          .from('expenses')
          .select('*')
          .eq('organization_id', profileData.organization_id)
          .order('expense_date', { ascending: false });
        
        if (expensesError) {
          throw new Error(expensesError.message);
        }
        
        setExpenses(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Er is een fout opgetreden');
        console.error('Error fetching expenses:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchExpenses();
  }, []);

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-secondary-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-500">Uitgaven laden...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800">Fout: {error}</p>
        </div>
      </div>
    );
  }

  // Bereken totaalbedrag van alle uitgaven
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Uitgaven</h1>
          <p className="mt-1 text-sm text-gray-500">
            Totaal: <span className="font-medium">€{totalExpenses.toFixed(2)}</span>
          </p>
        </div>
        <Link 
          href="/dashboard/expenses/new" 
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-secondary-600 hover:bg-secondary-700"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Uitgave toevoegen
        </Link>
      </div>
      
      {expenses.length === 0 ? (
        <div className="text-center py-10 bg-white rounded-lg border shadow-sm">
          <ClipboardDocumentListIcon className="h-12 w-12 mx-auto text-gray-400" />
          <h3 className="mt-2 text-sm font-semibold text-gray-900">Geen uitgaven</h3>
          <p className="mt-1 text-sm text-gray-500">Begin met het registreren van je uitgaven.</p>
          <div className="mt-6">
            <Link
              href="/dashboard/expenses/new"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-secondary-700 bg-secondary-50 hover:bg-secondary-100"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Uitgave toevoegen
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-white shadow-sm rounded-lg overflow-hidden border">
          <ul className="divide-y divide-gray-200">
            {expenses.map((expense) => (
              <li key={expense.id} className="hover:bg-gray-50">
                <Link href={`/dashboard/expenses/${expense.id}`} className="block px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{expense.description}</p>
                      <div className="flex text-sm text-gray-500 mt-1 gap-2">
                        <span>{format(new Date(expense.expense_date), 'd MMMM yyyy', { locale: nl })}</span>
                        {expense.category && (
                          <>
                            <span>•</span>
                            <span>{expense.category}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">€{expense.amount.toFixed(2)}</p>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
} 