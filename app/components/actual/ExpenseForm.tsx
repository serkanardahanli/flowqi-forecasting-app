'use client';

import React, { useState, useEffect } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import GlAccountSelector from '../GlAccountSelector';

interface GLAccount {
  id: string;
  code: string;
  name: string;
  type: string;
  parent_id?: string;
  level: number;
}

interface ExpenseFormData {
  gl_account_id: string;
  month: number;
  year: number;
  amount: number;
  description?: string;
  payment_date?: string;
  invoice_number?: string;
  supplier?: string;
}

interface ExpenseFormProps {
  glAccounts: GLAccount[];
  currentYear: number;
  currentMonth: number;
  editEntry?: {
    id?: string;
    gl_account_id: string;
    type: 'Planned' | 'Actual';
    year: number;
    month: number;
    amount: number;
    description?: string;
    payment_date?: string;
    invoice_number?: string;
    supplier?: string;
  } | null;
  onSubmit: (data: ExpenseFormData) => void;
  onCancel: () => void;
}

export default function ActualExpenseForm({
  glAccounts,
  currentYear,
  currentMonth,
  editEntry,
  onSubmit,
  onCancel
}: ExpenseFormProps) {
  // Console logging voor debugging
  console.log('ActualExpenseForm received glAccounts:', glAccounts);
  console.log('ActualExpenseForm received glAccounts count:', glAccounts?.length || 0);
  
  // React Hook Form setup
  const { 
    register, 
    handleSubmit, 
    formState: { errors, isSubmitting },
    reset,
    setValue
  } = useForm<ExpenseFormData>({
    defaultValues: {
      gl_account_id: editEntry?.gl_account_id || '',
      month: editEntry?.month || currentMonth,
      year: editEntry?.year || currentYear,
      amount: editEntry?.amount || 0,
      description: editEntry?.description || '',
      payment_date: editEntry?.payment_date || new Date().toISOString().split('T')[0],
      invoice_number: editEntry?.invoice_number || '',
      supplier: editEntry?.supplier || ''
    }
  });
  
  // Filter GL accounts op level 3 (het meest gedetailleerde niveau) en alleen type 'expense'  
  const eligibleAccounts = glAccounts
    .filter(acc => acc.level === 3 && acc.type === 'expense')
    .sort((a, b) => a.code.localeCompare(b.code));
  
  // Debug logging voor eligibleAccounts
  console.log('ActualExpenseForm filtered eligibleAccounts:', eligibleAccounts);
  console.log('ActualExpenseForm filtered eligibleAccounts count:', eligibleAccounts?.length || 0);
  
  // Lijst van maanden voor dropdown
  const months = [
    { value: 1, label: 'Januari' },
    { value: 2, label: 'Februari' },
    { value: 3, label: 'Maart' },
    { value: 4, label: 'April' },
    { value: 5, label: 'Mei' },
    { value: 6, label: 'Juni' },
    { value: 7, label: 'Juli' },
    { value: 8, label: 'Augustus' },
    { value: 9, label: 'September' },
    { value: 10, label: 'Oktober' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' },
  ];
  
  // Jaren voor dropdown (huidige jaar -1 tot huidige jaar +3)
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 1 + i);
  
  // Submit handler
  const handleFormSubmit: SubmitHandler<ExpenseFormData> = async (data) => {
    try {
      onSubmit({
        ...data,
        amount: parseFloat(data.amount.toString())
      });
      reset();
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };
  
  // Zorgen dat form velden gevuld worden bij bewerken
  useEffect(() => {
    if (editEntry) {
      setValue('gl_account_id', editEntry.gl_account_id);
      setValue('month', editEntry.month);
      setValue('year', editEntry.year);
      setValue('amount', editEntry.amount);
      setValue('description', editEntry.description || '');
      setValue('payment_date', editEntry.payment_date || new Date().toISOString().split('T')[0]);
      setValue('invoice_number', editEntry.invoice_number || '');
      setValue('supplier', editEntry.supplier || '');
    }
  }, [editEntry, setValue]);

  const [selectedGlAccountId, setSelectedGlAccountId] = useState<string | null>(editEntry?.gl_account_id || null);

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* GL Account Selectie */}
        <div className="col-span-1 md:col-span-2">
          <label htmlFor="gl_account_id" className="block text-sm font-medium text-gray-700">
            Uitgavencategorie
          </label>
          <GlAccountSelector
            glAccounts={glAccounts}
            onSelect={(accountId) => {
              setSelectedGlAccountId(accountId);
            }}
            allowedLevels={[1, 2, 3]} // Alle niveaus voor uitgaven
            accountType="Uitgaven" // Filter op uitgavenrekeningen
            initialSelectedCode={null}
            className="w-full"
          />
        </div>
        
        {/* Leverancier */}
        <div>
          <label htmlFor="supplier" className="block text-sm font-medium text-gray-700">
            Leverancier
          </label>
          <input
            type="text"
            id="supplier"
            {...register('supplier')}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        
        {/* Factuurnummer */}
        <div>
          <label htmlFor="invoice_number" className="block text-sm font-medium text-gray-700">
            Factuurnummer
          </label>
          <input
            type="text"
            id="invoice_number"
            {...register('invoice_number')}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        
        {/* Betaaldatum */}
        <div>
          <label htmlFor="payment_date" className="block text-sm font-medium text-gray-700">
            Betaaldatum
          </label>
          <input
            type="date"
            id="payment_date"
            {...register('payment_date')}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        
        {/* Maand Selectie */}
        <div>
          <label htmlFor="month" className="block text-sm font-medium text-gray-700">
            Maand
          </label>
          <select
            id="month"
            {...register('month', { required: 'Selecteer een maand' })}
            className={`mt-1 block w-full border ${errors.month ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500`}
          >
            {months.map(month => (
              <option key={month.value} value={month.value}>
                {month.label}
              </option>
            ))}
          </select>
          {errors.month && (
            <p className="mt-1 text-sm text-red-600">{errors.month.message}</p>
          )}
        </div>
        
        {/* Jaar Selectie */}
        <div>
          <label htmlFor="year" className="block text-sm font-medium text-gray-700">
            Jaar
          </label>
          <select
            id="year"
            {...register('year', { required: 'Selecteer een jaar' })}
            className={`mt-1 block w-full border ${errors.year ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500`}
          >
            {years.map(year => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
          {errors.year && (
            <p className="mt-1 text-sm text-red-600">{errors.year.message}</p>
          )}
        </div>
        
        {/* Bedrag */}
        <div className="col-span-1 md:col-span-2">
          <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
            Bedrag (€)
          </label>
          <input
            type="number"
            id="amount"
            step="0.01"
            min="0"
            {...register('amount', { 
              required: 'Voer een bedrag in',
              min: { value: 0, message: 'Bedrag moet positief zijn' },
              valueAsNumber: true
            })}
            className={`mt-1 block w-full border ${errors.amount ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500`}
          />
          {errors.amount && (
            <p className="mt-1 text-sm text-red-600">{errors.amount.message}</p>
          )}
        </div>
        
        {/* Omschrijving */}
        <div className="col-span-1 md:col-span-2">
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            Omschrijving
          </label>
          <textarea
            id="description"
            rows={3}
            {...register('description')}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Optionele toelichting bij deze uitgave"
          />
        </div>
      </div>
      
      {/* Formulier buttons */}
      <div className="flex justify-end space-x-3 pt-3">
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Annuleren
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
        >
          {isSubmitting ? 'Bezig...' : editEntry?.id ? 'Bijwerken' : 'Toevoegen'}
        </button>
      </div>
    </form>
  );
} 