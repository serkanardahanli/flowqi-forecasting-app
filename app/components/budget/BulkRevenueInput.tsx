'use client';

import React, { useState, useEffect } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { formatCurrency } from '@/lib/utils';

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

interface BulkRevenueInputProps {
  products: Product[];
  glAccounts: GLAccount[];
  year: number;
  onSubmit: (entries: BulkRevenueEntry[]) => Promise<void>;
  onCancel: () => void;
}

interface BulkRevenueFormData {
  gl_account_id: string;
  product_id: string;
  start_month: number;
  end_month: number;
  number_of_users: number[];
  price_per_user?: number;
  description?: string;
}

export interface BulkRevenueEntry {
  gl_account_id: string;
  product_id: string;
  month: number;
  year: number;
  number_of_users: number;
  amount: number;
  description?: string;
}

export default function BulkRevenueInput({ 
  products, 
  glAccounts,
  year,
  onSubmit,
  onCancel
}: BulkRevenueInputProps) {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { 
    register, 
    handleSubmit, 
    watch,
    setValue,
    formState: { errors } 
  } = useForm<BulkRevenueFormData>({
    defaultValues: {
      gl_account_id: '',
      product_id: '',
      start_month: 1,
      end_month: 12,
      number_of_users: Array(12).fill(0),
      price_per_user: 0,
      description: ''
    }
  });
  
  // Filter GL accounts op level 3 en type revenue
  const eligibleAccounts = glAccounts.filter(acc => acc.level === 3 && acc.type === 'revenue');
  
  // Lijst van maanden
  const months = [
    'Januari', 'Februari', 'Maart', 'April', 'Mei', 'Juni',
    'Juli', 'Augustus', 'September', 'Oktober', 'November', 'December'
  ];
  
  // Reactief kijken naar product selectie
  const watchProductId = watch('product_id');
  const watchStartMonth = watch('start_month');
  const watchEndMonth = watch('end_month');
  const watchNumberOfUsers = watch('number_of_users');
  
  // Update geselecteerd product wanneer product_id verandert
  useEffect(() => {
    const product = products.find(p => p.id === watchProductId);
    setSelectedProduct(product || null);
    if (product) {
      setValue('price_per_user', product.price);
    }
  }, [watchProductId, products, setValue]);
  
  // Update range van actieve maanden
  const activeMonths = Array.from({ length: 12 }, (_, i) => {
    const monthIndex = i + 1;
    return monthIndex >= watchStartMonth && monthIndex <= watchEndMonth;
  });
  
  // Bereken totalen per maand
  const calculateMonthlyAmount = (monthIndex: number) => {
    if (!selectedProduct) return 0;
    return (watchNumberOfUsers[monthIndex] || 0) * selectedProduct.price;
  };
  
  // Bereken totaal voor alle maanden
  const calculateTotalAmount = () => {
    if (!selectedProduct) return 0;
    return Array.from({ length: 12 }, (_, i) => {
      if (i + 1 >= watchStartMonth && i + 1 <= watchEndMonth) {
        return calculateMonthlyAmount(i);
      }
      return 0;
    }).reduce((sum, amount) => sum + amount, 0);
  };
  
  // Form submission handler
  const handleFormSubmit: SubmitHandler<BulkRevenueFormData> = async (data) => {
    try {
      setIsSubmitting(true);
      
      // Converteer formulierdata naar individuele entries per maand
      const entries: BulkRevenueEntry[] = [];
      
      for (let i = data.start_month - 1; i < data.end_month; i++) {
        if (data.number_of_users[i] > 0) {
          const selectedProduct = products.find(p => p.id === data.product_id);
          if (!selectedProduct) continue;
          
          entries.push({
            gl_account_id: data.gl_account_id,
            product_id: data.product_id,
            month: i + 1,
            year,
            number_of_users: data.number_of_users[i],
            amount: data.number_of_users[i] * selectedProduct.price,
            description: data.description
          });
        }
      }
      
      await onSubmit(entries);
    } catch (error) {
      console.error('Error submitting bulk revenue:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-lg font-medium text-gray-900 mb-4">Bulk Omzet Invoer voor {year}</h2>
      
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* GL Account Selectie */}
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
          
          {/* Product Selectie */}
          <div className="col-span-1 md:col-span-2">
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
          
          {/* Maand Range Selectie */}
          <div>
            <label htmlFor="start_month" className="block text-sm font-medium text-gray-700">
              Start Maand
            </label>
            <select
              id="start_month"
              {...register('start_month', { 
                required: 'Selecteer een startmaand',
                valueAsNumber: true
              })}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            >
              {months.map((month, idx) => (
                <option key={`start-${idx}`} value={idx + 1}>
                  {month}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label htmlFor="end_month" className="block text-sm font-medium text-gray-700">
              Eind Maand
            </label>
            <select
              id="end_month"
              {...register('end_month', { 
                required: 'Selecteer een eindmaand',
                valueAsNumber: true
              })}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            >
              {months.map((month, idx) => (
                <option key={`end-${idx}`} value={idx + 1}>
                  {month}
                </option>
              ))}
            </select>
          </div>
          
          {/* Omschrijving */}
          <div className="col-span-1 md:col-span-2">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Omschrijving
            </label>
            <textarea
              id="description"
              {...register('description')}
              rows={2}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Optionele toelichting voor alle omzet items"
            />
          </div>
        </div>
        
        {/* Tabel voor maandelijkse aantallen */}
        {selectedProduct && (
          <div className="mt-6">
            <h3 className="text-md font-medium text-gray-900 mb-2">
              Aantal gebruikers per maand voor {selectedProduct.name}
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Prijs per gebruiker: {formatCurrency(selectedProduct.price)}
            </p>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Maand
                    </th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Aantal Gebruikers
                    </th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Maandbedrag
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {months.map((month, idx) => (
                    <tr 
                      key={idx} 
                      className={!activeMonths[idx] ? 'bg-gray-100 opacity-50' : 'hover:bg-gray-50'}
                    >
                      <td className="px-3 py-2 whitespace-nowrap text-sm">
                        {month}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <input
                          type="number"
                          min="0"
                          {...register(`number_of_users.${idx}` as const, { 
                            valueAsNumber: true,
                            disabled: !activeMonths[idx]
                          })}
                          className={`w-full text-right border ${!activeMonths[idx] ? 'bg-gray-100' : 'border-gray-300'} rounded-md shadow-sm py-1 px-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500`}
                          disabled={!activeMonths[idx]}
                        />
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-right text-sm">
                        {formatCurrency(calculateMonthlyAmount(idx))}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-gray-50 font-medium">
                    <td colSpan={2} className="px-3 py-2 text-right text-sm">
                      Totaal:
                    </td>
                    <td className="px-3 py-2 text-right text-sm">
                      {formatCurrency(calculateTotalAmount())}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        {/* Formulier buttons */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Annuleren
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !selectedProduct}
            className={`px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
              (isSubmitting || !selectedProduct) ? 'opacity-70 cursor-not-allowed' : ''
            }`}
          >
            {isSubmitting ? 'Bezig met opslaan...' : 'Opslaan'}
          </button>
        </div>
      </form>
    </div>
  );
} 