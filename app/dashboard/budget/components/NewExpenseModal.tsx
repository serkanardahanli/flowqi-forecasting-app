'use client';

import { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { getBrowserSupabaseClient } from '@/app/lib/supabase';

interface NewExpenseModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  year: number;
  scenarioId: string | null;
  onExpenseCreated: () => void;
}

export default function NewExpenseModal({ open, setOpen, year, scenarioId, onExpenseCreated }: NewExpenseModalProps) {
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1);
  const [costCategory, setCostCategory] = useState('');
  const [subCategory, setSubCategory] = useState('');
  const [amount, setAmount] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Common expense categories
  const commonCategories = [
    'Personeelskosten',
    'Huisvesting',
    'Marketing',
    'Verkoop',
    'R&D',
    'IT & Software',
    'Administratie',
    'Verzekeringen',
    'Reiskosten',
    'Kantoorkosten',
    'Training & Ontwikkeling',
    'Overige kosten'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scenarioId) {
      setError('Please select or create a scenario first');
      return;
    }
    
    setLoading(true);
    setError(null);

    const supabase = getBrowserSupabaseClient();

    try {
      // Create the new expense item
      const { error: insertError } = await supabase
        .from('budget_expenses')
        .insert({
          year,
          month,
          cost_category: costCategory,
          sub_category: subCategory || null,
          amount: parseFloat(amount),
          notes: notes || null
        });

      if (insertError) throw insertError;

      // Reset form and close modal
      setMonth(new Date().getMonth() + 1);
      setCostCategory('');
      setSubCategory('');
      setAmount('');
      setNotes('');
      setOpen(false);
      onExpenseCreated();
    } catch (err: any) {
      console.error('Error creating expense:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={setOpen}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
                  <button
                    type="button"
                    className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                    onClick={() => setOpen(false)}
                  >
                    <span className="sr-only">Close</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>
                <div>
                  <div className="mt-3 text-center sm:mt-0 sm:text-left">
                    <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900">
                      Add New Expense - {year}
                    </Dialog.Title>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Add a new expense item to your budget.
                      </p>
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="mt-4 rounded-md bg-red-50 p-4">
                    <div className="flex">
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-red-800">An error occurred</h3>
                        <div className="mt-2 text-sm text-red-700">
                          <p>{error}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                  <div>
                    <label htmlFor="month" className="block text-sm font-medium text-gray-700">
                      Month
                    </label>
                    <div className="mt-1">
                      <select
                        id="month"
                        name="month"
                        value={month}
                        onChange={(e) => setMonth(parseInt(e.target.value))}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                      >
                        <option value={1}>January</option>
                        <option value={2}>February</option>
                        <option value={3}>March</option>
                        <option value={4}>April</option>
                        <option value={5}>May</option>
                        <option value={6}>June</option>
                        <option value={7}>July</option>
                        <option value={8}>August</option>
                        <option value={9}>September</option>
                        <option value={10}>October</option>
                        <option value={11}>November</option>
                        <option value={12}>December</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="cost_category" className="block text-sm font-medium text-gray-700">
                      Cost Category
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        name="cost_category"
                        id="cost_category"
                        list="common_categories"
                        value={costCategory}
                        onChange={(e) => setCostCategory(e.target.value)}
                        required
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                        placeholder="e.g. Personeelskosten"
                      />
                      <datalist id="common_categories">
                        {commonCategories.map((category) => (
                          <option key={category} value={category} />
                        ))}
                      </datalist>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="sub_category" className="block text-sm font-medium text-gray-700">
                      Sub-Category (optional)
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        name="sub_category"
                        id="sub_category"
                        value={subCategory}
                        onChange={(e) => setSubCategory(e.target.value)}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                        placeholder="e.g. Salarissen"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
                      Amount (€)
                    </label>
                    <div className="mt-1">
                      <input
                        type="number"
                        name="amount"
                        id="amount"
                        min="0"
                        step="0.01"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        required
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                      Notes (optional)
                    </label>
                    <div className="mt-1">
                      <textarea
                        id="notes"
                        name="notes"
                        rows={3}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                        placeholder="Additional details..."
                      />
                    </div>
                  </div>

                  <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
                    <button
                      type="submit"
                      disabled={loading}
                      className="inline-flex w-full justify-center rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 sm:col-start-2"
                    >
                      {loading ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setOpen(false)}
                      className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:col-start-1 sm:mt-0"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
} 