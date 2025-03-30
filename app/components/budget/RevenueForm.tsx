'use client';

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { 
  FormInput, 
  FormSelect, 
  FormTextarea, 
  FormGroup, 
  FormRow 
} from '@/app/components/ui/FormComponents';

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
  
  // Filter eligibleAccounts voor beter debug inzicht
  const eligibleAccounts = glAccounts.filter(acc => acc.level === 3 && acc.type === 'revenue');

  // Debug informatie loggen bij het laden van de component
  useEffect(() => {
    console.log('RevenueForm: Geladen GL accounts details:');
    console.log('Totaal aantal GL Accounts:', glAccounts.length);
    console.log('Inkomstenrekeningen:', glAccounts.filter(acc => acc.type === 'revenue').length);
    console.log('Niveau 3 rekeningen:', glAccounts.filter(acc => acc.level === 3).length);
    console.log('Bruikbare rekeningen (niveau 3 + inkomsten):', eligibleAccounts.length);
    console.log('GL Accounts details:', eligibleAccounts);
  }, [glAccounts]);
  
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
    { value: '1', label: 'Januari' },
    { value: '2', label: 'Februari' },
    { value: '3', label: 'Maart' },
    { value: '4', label: 'April' },
    { value: '5', label: 'Mei' },
    { value: '6', label: 'Juni' },
    { value: '7', label: 'Juli' },
    { value: '8', label: 'Augustus' },
    { value: '9', label: 'September' },
    { value: '10', label: 'Oktober' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' }
  ];
  
  // Jaar opties genereren (huidig jaar +/- 5 jaar)
  const years = Array.from({ length: 10 }, (_, i) => currentYear - 3 + i)
    .map(year => ({ value: year.toString(), label: year.toString() }));
  
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
  
  // Convert product array to options format for FormSelect
  const productOptions = products.map(product => ({
    value: product.id,
    label: product.name
  }));

  // Convert GL accounts to options format
  const glAccountOptions = [
    {
      value: "99e0f11f-e683-43f8-957e-e702aec3ba3c", 
      label: "8000 - Omzet"
    },
    ...eligibleAccounts.map(account => ({
      value: account.id,
      label: `${account.code} - ${account.name}`
    }))
  ];

  return (
    <form onSubmit={type === 'saas' ? saasForm.handleSubmit(handleFormSubmit) : consultancyForm.handleSubmit(handleFormSubmit)} className="space-y-6">
      {type === 'saas' ? (
        // SaaS Omzet Formulier
        <>
          <FormGroup>
            <FormRow>
              <Controller
                control={saasForm.control}
                name="product_id"
                rules={{ required: 'Product is verplicht' }}
                render={({ field, fieldState }) => (
                  <FormSelect
                    id="product_id"
                    label="Product"
                    placeholder="Selecteer een product"
                    options={productOptions}
                    error={fieldState.error?.message}
                    required
                    {...field}
                  />
                )}
              />
              
              <Controller
                control={saasForm.control}
                name="gl_account_id"
                rules={{ required: 'GL Account is verplicht' }}
                render={({ field, fieldState }) => (
                  <FormSelect
                    id="gl_account_id"
                    label="GL Account"
                    placeholder="Selecteer een GL account"
                    options={glAccountOptions}
                    error={fieldState.error?.message}
                    required
                    {...field}
                  />
                )}
              />
            </FormRow>
            
            <FormRow>
              <Controller
                control={saasForm.control}
                name="users"
                rules={{ 
                  required: 'Aantal gebruikers is verplicht',
                  min: { value: 1, message: 'Aantal gebruikers moet minimaal 1 zijn' }
                }}
                render={({ field, fieldState }) => (
                  <FormInput
                    id="users"
                    type="number"
                    min="1"
                    label="Aantal gebruikers"
                    error={fieldState.error?.message}
                    required
                    {...field}
                  />
                )}
              />
              
              <Controller
                control={saasForm.control}
                name="amount"
                rules={{ 
                  required: 'Prijs is verplicht',
                  min: { value: 0, message: 'Prijs mag niet negatief zijn' }
                }}
                render={({ field, fieldState }) => (
                  <FormInput
                    id="amount"
                    type="number"
                    step="0.01"
                    label="Prijs per gebruiker (€)"
                    error={fieldState.error?.message}
                    required
                    {...field}
                  />
                )}
              />
            </FormRow>
            
            <FormRow>
              <Controller
                control={saasForm.control}
                name="month"
                rules={{ required: 'Maand is verplicht' }}
                render={({ field, fieldState }) => (
                  <FormSelect
                    id="month"
                    label="Maand"
                    options={months}
                    error={fieldState.error?.message}
                    required
                    {...field}
                  />
                )}
              />
              
              <Controller
                control={saasForm.control}
                name="year"
                rules={{ required: 'Jaar is verplicht' }}
                render={({ field, fieldState }) => (
                  <FormSelect
                    id="year"
                    label="Jaar"
                    options={years}
                    error={fieldState.error?.message}
                    required
                    {...field}
                  />
                )}
              />
            </FormRow>
            
            <Controller
              control={saasForm.control}
              name="notes"
              render={({ field, fieldState }) => (
                <FormTextarea
                  id="notes"
                  label="Toelichting (optioneel)"
                  rows={3}
                  error={fieldState.error?.message}
                  {...field}
                />
              )}
            />
          </FormGroup>
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
      
      <div className="flex justify-end space-x-3 pt-5">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Annuleren
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {isSubmitting ? 'Bezig...' : 'Toevoegen'}
        </button>
      </div>
    </form>
  );
} 