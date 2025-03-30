'use client';

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';

// Type definities
interface Product {
  id: string;
  name: string;
  description?: string;
  price_monthly?: number;
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
  product_id: string;
  gl_account_id: string;
  year: number;
  month: number;
  amount: number;
  users: number;
  notes?: string;
}

interface ConsultancyRevenueFormData {
  client_name: string;
  project_name: string;
  start_date: string;
  end_date: string;
  hourly_rate: number;
  hours_per_month: number;
  notes?: string;
}

type RevenueFormProps = {
  type: 'saas' | 'consultancy';
  products?: Product[];
  glAccounts?: GLAccount[];
  currentYear: number;
  currentMonth: number;
  onSubmit: (data: any) => void;
  onCancel: () => void;
};

export default function RevenueForm({ 
  type, 
  products = [], 
  glAccounts = [],
  currentYear, 
  currentMonth, 
  onSubmit, 
  onCancel 
}: RevenueFormProps) {
  // State voor het tonen van verschillende formulieropties
  const [showMonthlyHours, setShowMonthlyHours] = useState<boolean>(false);
  
  // React Hook Form setup voor SaaS type
  const saasForm = useForm<SaasRevenueFormData>({
    defaultValues: {
      year: currentYear,
      month: currentMonth,
      amount: 0,
      users: 1,
      gl_account_id: '',
      product_id: ''
    }
  });

  // React Hook Form setup voor Consultancy type
  const consultancyForm = useForm<ConsultancyRevenueFormData>({
    defaultValues: {
      hourly_rate: 0,
      hours_per_month: 0,
      start_date: new Date().toISOString().split('T')[0],
      end_date: new Date(currentYear, currentMonth, 0).toISOString().split('T')[0],
    }
  });

  // Gebruik het juiste form op basis van het type
  const { formState, reset } = type === 'saas' ? saasForm : consultancyForm;
  const { isSubmitting } = formState;
  
  // Maanden array voor selecties
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
    { value: 12, label: 'December' }
  ];
  
  // Jaar opties genereren (huidig jaar +/- 5 jaar)
  const years = Array.from({ length: 10 }, (_, i) => currentYear - 3 + i);
  
  // Submit handler
  const handleFormSubmit = (data: any) => {
    // Voeg extra velden toe voor SaaS data om aan te sluiten bij wat de pagina verwacht
    if (type === 'saas') {
      onSubmit({
        gl_account_id: data.gl_account_id,
        year: data.year,
        month: data.month,
        amount: data.amount,
        product_id: data.product_id,
        number_of_users: data.users,
        description: data.notes
      });
    } else {
      onSubmit(data);
    }
    reset();
  };
  
  return (
    <form onSubmit={type === 'saas' ? saasForm.handleSubmit(handleFormSubmit) : consultancyForm.handleSubmit(handleFormSubmit)} className="space-y-6">
      {type === 'saas' ? (
        // SaaS Omzet Formulier
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="product_id" className="block text-sm font-medium text-gray-700">
                Product
              </label>
              <select
                id="product_id"
                {...saasForm.register('product_id', { required: 'Product is verplicht' })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                <option value="">Selecteer een product</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </select>
              {saasForm.formState.errors.product_id && (
                <p className="mt-1 text-sm text-red-600">{saasForm.formState.errors.product_id.message}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="gl_account_id" className="block text-sm font-medium text-gray-700">
                GL Account
              </label>
              <select
                id="gl_account_id"
                {...saasForm.register('gl_account_id', { required: 'GL Account is verplicht' })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                <option value="">Selecteer een GL account</option>
                {glAccounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.code} - {account.name}
                  </option>
                ))}
              </select>
              {saasForm.formState.errors.gl_account_id && (
                <p className="mt-1 text-sm text-red-600">{saasForm.formState.errors.gl_account_id.message}</p>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="users" className="block text-sm font-medium text-gray-700">
                Aantal gebruikers
              </label>
              <input
                type="number"
                id="users"
                min="1"
                {...saasForm.register('users', { 
                  required: 'Aantal gebruikers is verplicht',
                  valueAsNumber: true,
                  min: { value: 1, message: 'Aantal gebruikers moet minimaal 1 zijn' }
                })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
              {saasForm.formState.errors.users && (
                <p className="mt-1 text-sm text-red-600">{saasForm.formState.errors.users.message}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
                Prijs per gebruiker (€)
              </label>
              <input
                type="number"
                id="amount"
                step="0.01"
                {...saasForm.register('amount', { 
                  required: 'Prijs is verplicht',
                  valueAsNumber: true,
                  min: { value: 0, message: 'Prijs mag niet negatief zijn' }
                })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
              {saasForm.formState.errors.amount && (
                <p className="mt-1 text-sm text-red-600">{saasForm.formState.errors.amount.message}</p>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label htmlFor="month" className="block text-sm font-medium text-gray-700">
                Maand
              </label>
              <select
                id="month"
                {...saasForm.register('month', { required: 'Maand is verplicht', valueAsNumber: true })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                {months.map((month) => (
                  <option key={month.value} value={month.value}>
                    {month.label}
                  </option>
                ))}
              </select>
              {saasForm.formState.errors.month && (
                <p className="mt-1 text-sm text-red-600">{saasForm.formState.errors.month.message}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="year" className="block text-sm font-medium text-gray-700">
                Jaar
              </label>
              <select
                id="year"
                {...saasForm.register('year', { required: 'Jaar is verplicht', valueAsNumber: true })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
              {saasForm.formState.errors.year && (
                <p className="mt-1 text-sm text-red-600">{saasForm.formState.errors.year.message}</p>
              )}
            </div>
          </div>
        </>
      ) : (
        // Consultancy Omzet Formulier
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="client_name" className="block text-sm font-medium text-gray-700">
                Klantnaam
              </label>
              <input
                type="text"
                id="client_name"
                {...consultancyForm.register('client_name', { required: 'Klantnaam is verplicht' })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
              {consultancyForm.formState.errors.client_name && (
                <p className="mt-1 text-sm text-red-600">{consultancyForm.formState.errors.client_name.message}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="project_name" className="block text-sm font-medium text-gray-700">
                Projectnaam
              </label>
              <input
                type="text"
                id="project_name"
                {...consultancyForm.register('project_name', { required: 'Projectnaam is verplicht' })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
              {consultancyForm.formState.errors.project_name && (
                <p className="mt-1 text-sm text-red-600">{consultancyForm.formState.errors.project_name.message}</p>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="start_date" className="block text-sm font-medium text-gray-700">
                Startdatum
              </label>
              <input
                type="date"
                id="start_date"
                {...consultancyForm.register('start_date', { required: 'Startdatum is verplicht' })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
              {consultancyForm.formState.errors.start_date && (
                <p className="mt-1 text-sm text-red-600">{consultancyForm.formState.errors.start_date.message}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="end_date" className="block text-sm font-medium text-gray-700">
                Einddatum
              </label>
              <input
                type="date"
                id="end_date"
                {...consultancyForm.register('end_date', { required: 'Einddatum is verplicht' })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
              {consultancyForm.formState.errors.end_date && (
                <p className="mt-1 text-sm text-red-600">{consultancyForm.formState.errors.end_date.message}</p>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="hourly_rate" className="block text-sm font-medium text-gray-700">
                Uurtarief (€)
              </label>
              <input
                type="number"
                id="hourly_rate"
                step="0.01"
                {...consultancyForm.register('hourly_rate', { 
                  required: 'Uurtarief is verplicht',
                  valueAsNumber: true,
                  min: { value: 0, message: 'Uurtarief mag niet negatief zijn' }
                })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
              {consultancyForm.formState.errors.hourly_rate && (
                <p className="mt-1 text-sm text-red-600">{consultancyForm.formState.errors.hourly_rate.message}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="hours_per_month" className="block text-sm font-medium text-gray-700">
                Uren per maand
              </label>
              <input
                type="number"
                id="hours_per_month"
                {...consultancyForm.register('hours_per_month', { 
                  required: 'Uren per maand is verplicht',
                  valueAsNumber: true,
                  min: { value: 0, message: 'Uren mogen niet negatief zijn' }
                })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
              {consultancyForm.formState.errors.hours_per_month && (
                <p className="mt-1 text-sm text-red-600">{consultancyForm.formState.errors.hours_per_month.message}</p>
              )}
            </div>
          </div>
        </>
      )}
      
      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
          Opmerkingen
        </label>
        <textarea
          id="notes"
          rows={3}
          {...(type === 'saas' ? saasForm.register('notes') : consultancyForm.register('notes'))}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        />
      </div>
      
      <div className="flex justify-end space-x-3">
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
          className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {isSubmitting ? 'Bezig met opslaan...' : 'Opslaan'}
        </button>
      </div>
    </form>
  );
} 