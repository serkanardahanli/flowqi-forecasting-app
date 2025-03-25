'use client';

import { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/app/lib/supabase';

interface NewIncomeModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  year: number;
  scenarioId: string | null;
  onIncomeCreated: () => void;
}

export default function NewIncomeModal({ open, setOpen, year, scenarioId, onIncomeCreated }: NewIncomeModalProps) {
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1);
  const [type, setType] = useState<'consultancy' | 'saas'>('consultancy');
  const [client, setClient] = useState('');
  const [project, setProject] = useState('');
  const [hours, setHours] = useState<string>('');
  const [rate, setRate] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Update amount when hours or rate changes, for consultancy type
  const updateAmount = () => {
    if (type === 'consultancy' && hours && rate) {
      const calculatedAmount = parseFloat(hours) * parseFloat(rate);
      setAmount(calculatedAmount.toFixed(2));
    }
  };

  // Handle hours and rate changes
  const handleHoursChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setHours(e.target.value);
    updateAmount();
  };

  const handleRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRate(e.target.value);
    updateAmount();
  };

  // Handle type change
  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newType = e.target.value as 'consultancy' | 'saas';
    setType(newType);
    
    // Reset consultancy-specific fields if switching to SaaS
    if (newType === 'saas') {
      setHours('');
      setRate('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scenarioId) {
      setError('Please select or create a scenario first');
      return;
    }
    
    setLoading(true);
    setError(null);

    const supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    try {
      // Get the current user's organization ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not found');

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;
      if (!profile?.organization_id) throw new Error('No organization found');

      // Create the new income item
      const { error: insertError } = await supabase
        .from('budget_income')
        .insert({
          year,
          month,
          type,
          client: client || null,
          project: project || null,
          hours: hours ? parseFloat(hours) : null,
          rate: rate ? parseFloat(rate) : null,
          amount: parseFloat(amount),
          notes: notes || null,
          organization_id: profile.organization_id
        });

      if (insertError) throw insertError;

      // Reset form and close modal
      setMonth(new Date().getMonth() + 1);
      setType('consultancy');
      setClient('');
      setProject('');
      setHours('');
      setRate('');
      setAmount('');
      setNotes('');
      setOpen(false);
      onIncomeCreated();
    } catch (err: any) {
      console.error('Error creating income:', err);
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
                      Add New Income - {year}
                    </Dialog.Title>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Add a new income item to your budget.
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
                  <div className="grid grid-cols-2 gap-4">
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
                      <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                        Type
                      </label>
                      <div className="mt-1">
                        <select
                          id="type"
                          name="type"
                          value={type}
                          onChange={handleTypeChange}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                        >
                          <option value="consultancy">Consultancy</option>
                          <option value="saas">SaaS / Product</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="client" className="block text-sm font-medium text-gray-700">
                      Client
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        name="client"
                        id="client"
                        value={client}
                        onChange={(e) => setClient(e.target.value)}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                        placeholder={type === 'consultancy' ? "Client Name" : "Product/Service Name"}
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="project" className="block text-sm font-medium text-gray-700">
                      Project
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        name="project"
                        id="project"
                        value={project}
                        onChange={(e) => setProject(e.target.value)}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                        placeholder={type === 'consultancy' ? "Project Name" : "Description"}
                      />
                    </div>
                  </div>

                  {type === 'consultancy' && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="hours" className="block text-sm font-medium text-gray-700">
                          Hours
                        </label>
                        <div className="mt-1">
                          <input
                            type="number"
                            name="hours"
                            id="hours"
                            min="0"
                            step="0.01"
                            value={hours}
                            onChange={handleHoursChange}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                            placeholder="0.00"
                          />
                        </div>
                      </div>
                      <div>
                        <label htmlFor="rate" className="block text-sm font-medium text-gray-700">
                          Rate (€)
                        </label>
                        <div className="mt-1">
                          <input
                            type="number"
                            name="rate"
                            id="rate"
                            min="0"
                            step="0.01"
                            value={rate}
                            onChange={handleRateChange}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                            placeholder="0.00"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <div>
                    <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
                      {type === 'consultancy' && hours && rate ? 'Calculated Amount (€)' : 'Amount (€)'}
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
                        className={`block w-full rounded-md shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm ${
                          type === 'consultancy' && hours && rate 
                            ? 'bg-gray-100 border-gray-300' 
                            : 'border-gray-300'
                        }`}
                        placeholder="0.00"
                        readOnly={type === 'consultancy' && !!hours && !!rate}
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