'use client';

import React, { useState, useEffect } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { format } from 'date-fns';

interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
}

interface GLAccount {
  id: string;
  code: string;
  name: string;
  type: string;
  parent_id?: string;
  level: number;
}

interface SaasRevenueFormData {
  gl_account_id: string;
  product_id: string;
  number_of_users: number;
  month: number;
  year: number;
  amount: number;
  description?: string;
}

interface ConsultancyRevenueFormData {
  gl_account_id: string;
  client_name: string;
  project_name: string;
  hourly_rate: number;
  hours: number;
  start_date: string;
  end_date: string;
  month: number;
  year: number;
  amount: number;
  description?: string;
}

type RevenueFormData = SaasRevenueFormData | ConsultancyRevenueFormData;

interface RevenueFormProps {
  type: 'saas' | 'consultancy';
  products: Product[];
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
    product_id?: string;
    client_name?: string;
    project_name?: string;
    number_of_users?: number;
    hours?: number;
    start_date?: string;
    end_date?: string;
    hourly_rate?: number;
  } | null;
  onSubmit: (data: RevenueFormData) => void;
  onCancel: () => void;
}

export default function ActualRevenueForm({
  type,
  products,
  glAccounts,
  currentYear,
  currentMonth,
  editEntry,
  onSubmit,
  onCancel
}: RevenueFormProps) {
  const [autoCalculateAmount, setAutoCalculateAmount] = useState<boolean>(
    editEntry ? false : true
  );
  
  // React Hook Form setup
  const { 
    register, 
    handleSubmit, 
    watch,
    setValue,
    formState: { errors, isSubmitting },
    reset
  } = useForm<RevenueFormData>({
    defaultValues: {
      gl_account_id: editEntry?.gl_account_id || '',
      month: editEntry?.month || currentMonth,
      year: editEntry?.year || currentYear,
      amount: editEntry?.amount || 0,
      description: editEntry?.description || '',
      // SaaS specifieke velden
      product_id: editEntry?.product_id || '',
      number_of_users: editEntry?.number_of_users || 1,
      // Consultancy specifieke velden
      client_name: editEntry?.client_name || '',
      project_name: editEntry?.project_name || '',
      hourly_rate: editEntry?.hourly_rate || 95,
      hours: editEntry?.hours || 0,
      start_date: editEntry?.start_date || format(new Date(), 'yyyy-MM-dd'),
      end_date: editEntry?.end_date || format(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0), 'yyyy-MM-dd')
    }
  });
  
  // Filter GL accounts op level 3 (de meest gedetailleerde niveau)
  const eligibleAccounts = glAccounts.filter(acc => acc.level === 3);
  
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
  
  // Automatisch bedrag berekenen
  const watchProductId = watch('product_id');
  const watchNumberOfUsers = watch('number_of_users');
  const watchHourlyRate = watch('hourly_rate');
  const watchHours = watch('hours');
  
  useEffect(() => {
    if (autoCalculateAmount) {
      if (type === 'saas' && watchProductId) {
        const selectedProduct = products.find(p => p.id === watchProductId);
        if (selectedProduct) {
          const amount = selectedProduct.price * (watchNumberOfUsers || 1);
          setValue('amount', amount);
        }
      } else if (type === 'consultancy') {
        const amount = (watchHourlyRate || 0) * (watchHours || 0);
        setValue('amount', amount);
      }
    }
  }, [type, watchProductId, watchNumberOfUsers, watchHourlyRate, watchHours, products, autoCalculateAmount, setValue]);
  
  // Submit handler
  const handleFormSubmit: SubmitHandler<RevenueFormData> = async (data) => {
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
      setAutoCalculateAmount(false);
      setValue('gl_account_id', editEntry.gl_account_id);
      setValue('month', editEntry.month);
      setValue('year', editEntry.year);
      setValue('amount', editEntry.amount);
      setValue('description', editEntry.description || '');
      
      if (type === 'saas') {
        setValue('product_id', editEntry.product_id || '');
        setValue('number_of_users', editEntry.number_of_users || 1);
      } else if (type === 'consultancy') {
        setValue('client_name', editEntry.client_name || '');
        setValue('project_name', editEntry.project_name || '');
        setValue('hourly_rate', editEntry.hourly_rate || 95);
        setValue('hours', editEntry.hours || 0);
        setValue('start_date', editEntry.start_date || format(new Date(), 'yyyy-MM-dd'));
        setValue('end_date', editEntry.end_date || format(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0), 'yyyy-MM-dd'));
      }
    }
  }, [editEntry, setValue, type]);

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* GL Account Selectie (voor beide types) */}
        <div className="col-span-1 md:col-span-2">
          <label htmlFor="gl_account_id" className="block text-sm font-medium text-gray-700">
            Inkomstencategorie
          </label>
          <select
            id="gl_account_id"
            {...register('gl_account_id', { required: 'Kies een categorie' })}
            className={`mt-1 block w-full border ${errors.gl_account_id ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500`}
          >
            <option value="">-- Selecteer categorie --</option>
            {eligibleAccounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.code} - {account.name}
              </option>
            ))}
          </select>
          {errors.gl_account_id && (
            <p className="mt-1 text-sm text-red-600">{errors.gl_account_id.message}</p>
          )}
        </div>
        
        {/* SaaS specifieke velden */}
        {type === 'saas' && (
          <>
            <div>
              <label htmlFor="product_id" className="block text-sm font-medium text-gray-700">
                Product
              </label>
              <select
                id="product_id"
                {...register('product_id', { required: 'Selecteer een product' })}
                className={`mt-1 block w-full border ${errors.product_id ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500`}
              >
                <option value="">-- Selecteer product --</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name} (€{product.price}/gebruiker)
                  </option>
                ))}
              </select>
              {errors.product_id && (
                <p className="mt-1 text-sm text-red-600">{errors.product_id.message}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="number_of_users" className="block text-sm font-medium text-gray-700">
                Aantal gebruikers
              </label>
              <input
                type="number"
                id="number_of_users"
                min="1"
                {...register('number_of_users', { 
                  required: 'Voer het aantal gebruikers in',
                  min: { value: 1, message: 'Minimaal 1 gebruiker' },
                  valueAsNumber: true
                })}
                className={`mt-1 block w-full border ${errors.number_of_users ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500`}
              />
              {errors.number_of_users && (
                <p className="mt-1 text-sm text-red-600">{errors.number_of_users.message}</p>
              )}
            </div>
          </>
        )}
        
        {/* Consultancy specifieke velden */}
        {type === 'consultancy' && (
          <>
            <div>
              <label htmlFor="client_name" className="block text-sm font-medium text-gray-700">
                Klantnaam
              </label>
              <input
                type="text"
                id="client_name"
                {...register('client_name', { required: 'Voer een klantnaam in' })}
                className={`mt-1 block w-full border ${errors.client_name ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500`}
              />
              {errors.client_name && (
                <p className="mt-1 text-sm text-red-600">{errors.client_name.message}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="project_name" className="block text-sm font-medium text-gray-700">
                Projectnaam
              </label>
              <input
                type="text"
                id="project_name"
                {...register('project_name', { required: 'Voer een projectnaam in' })}
                className={`mt-1 block w-full border ${errors.project_name ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500`}
              />
              {errors.project_name && (
                <p className="mt-1 text-sm text-red-600">{errors.project_name.message}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="hourly_rate" className="block text-sm font-medium text-gray-700">
                Uurtarief (€)
              </label>
              <input
                type="number"
                id="hourly_rate"
                step="0.01"
                min="0"
                {...register('hourly_rate', { 
                  required: 'Voer een uurtarief in',
                  min: { value: 0, message: 'Tarief moet positief zijn' },
                  valueAsNumber: true
                })}
                className={`mt-1 block w-full border ${errors.hourly_rate ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500`}
              />
              {errors.hourly_rate && (
                <p className="mt-1 text-sm text-red-600">{errors.hourly_rate.message}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="hours" className="block text-sm font-medium text-gray-700">
                Aantal uren
              </label>
              <input
                type="number"
                id="hours"
                step="0.5"
                min="0"
                {...register('hours', { 
                  required: 'Voer het aantal uren in',
                  min: { value: 0, message: 'Uren moet positief zijn' },
                  valueAsNumber: true
                })}
                className={`mt-1 block w-full border ${errors.hours ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500`}
              />
              {errors.hours && (
                <p className="mt-1 text-sm text-red-600">{errors.hours.message}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="start_date" className="block text-sm font-medium text-gray-700">
                Startdatum
              </label>
              <input
                type="date"
                id="start_date"
                {...register('start_date', { required: 'Selecteer een startdatum' })}
                className={`mt-1 block w-full border ${errors.start_date ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500`}
              />
              {errors.start_date && (
                <p className="mt-1 text-sm text-red-600">{errors.start_date.message}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="end_date" className="block text-sm font-medium text-gray-700">
                Einddatum
              </label>
              <input
                type="date"
                id="end_date"
                {...register('end_date', { required: 'Selecteer een einddatum' })}
                className={`mt-1 block w-full border ${errors.end_date ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500`}
              />
              {errors.end_date && (
                <p className="mt-1 text-sm text-red-600">{errors.end_date.message}</p>
              )}
            </div>
          </>
        )}
        
        {/* Gemeenschappelijke velden voor beide types */}
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
        
        <div className="col-span-1 md:col-span-2">
          <div className="flex items-center justify-between">
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
              Bedrag (€)
            </label>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="autoCalculate"
                checked={autoCalculateAmount}
                onChange={(e) => setAutoCalculateAmount(e.target.checked)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="autoCalculate" className="ml-2 block text-sm text-gray-700">
                Automatisch berekenen
              </label>
            </div>
          </div>
          <input
            type="number"
            id="amount"
            step="0.01"
            min="0"
            disabled={autoCalculateAmount}
            {...register('amount', { 
              required: 'Voer een bedrag in',
              min: { value: 0, message: 'Bedrag moet positief zijn' },
              valueAsNumber: true
            })}
            className={`mt-1 block w-full border ${errors.amount ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${autoCalculateAmount ? 'bg-gray-100' : ''}`}
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
            placeholder="Optionele toelichting bij deze inkomsten"
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