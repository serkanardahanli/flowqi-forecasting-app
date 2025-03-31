"use client";

import { useState } from 'react';
import { getBrowserSupabaseClient } from '@/app/lib/supabase';
import type { Database } from '@/types/supabase';
import { GlAccount } from '@/types/models';
import { formatCurrency } from '@/lib/utils';

interface RevenueFormProps {
  type: 'saas' | 'consultancy';
  products: any[];
  glAccounts: GlAccount[];
  currentYear: number;
  currentMonth: number;
  editEntry?: any;
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

export default function RevenueForm({
  type,
  products,
  glAccounts,
  currentYear,
  currentMonth,
  editEntry,
  onSubmit,
  onCancel
}: RevenueFormProps) {
  const [formData, setFormData] = useState({
    gl_account_id: editEntry?.gl_account_id || '',
    year: editEntry?.year || currentYear,
    month: editEntry?.month || currentMonth,
    amount: editEntry?.amount || 0,
    description: editEntry?.description || '',
    product_id: editEntry?.product_id || '',
    client_name: editEntry?.client_name || '',
    project_name: editEntry?.project_name || '',
    number_of_users: editEntry?.number_of_users || 0,
    hours: editEntry?.hours || 0,
    start_date: editEntry?.start_date || '',
    end_date: editEntry?.end_date || '',
    hourly_rate: editEntry?.hourly_rate || 0
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Product
          </label>
          <select
            value={formData.product_id}
            onChange={(e) => setFormData({ ...formData, product_id: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            required
          >
            <option value="">Selecteer een product</option>
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Bedrag
          </label>
          <input
            type="number"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            required
            min="0"
            step="0.01"
          />
        </div>

        {type === 'consultancy' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Klant
              </label>
              <input
                type="text"
                value={formData.client_name}
                onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Project
              </label>
              <input
                type="text"
                value={formData.project_name}
                onChange={(e) => setFormData({ ...formData, project_name: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Uren
              </label>
              <input
                type="number"
                value={formData.hours}
                onChange={(e) => setFormData({ ...formData, hours: parseFloat(e.target.value) })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                min="0"
                step="0.5"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Uurtarief
              </label>
              <input
                type="number"
                value={formData.hourly_rate}
                onChange={(e) => setFormData({ ...formData, hourly_rate: parseFloat(e.target.value) })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                min="0"
                step="0.01"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Startdatum
              </label>
              <input
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Einddatum
              </label>
              <input
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
          </>
        )}

        {type === 'saas' && (
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Aantal Gebruikers
            </label>
            <input
              type="number"
              value={formData.number_of_users}
              onChange={(e) => setFormData({ ...formData, number_of_users: parseInt(e.target.value) })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              min="0"
            />
          </div>
        )}

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700">
            Omschrijving
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            rows={3}
          />
        </div>
      </div>

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Annuleren
        </button>
        <button
          type="submit"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          {editEntry ? 'Bijwerken' : 'Toevoegen'}
        </button>
      </div>
    </form>
  );
} 