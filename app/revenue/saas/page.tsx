"use client";

import { useState, useEffect } from 'react';
import { PencilIcon, TrashIcon, PlusIcon } from '@heroicons/react/24/outline';
import { getBrowserSupabaseClient } from '@/app/lib/supabase';
import type { Database } from '@/types/supabase';
import MainLayout from '@/app/components/MainLayout';
import { formatCurrency } from '@/lib/utils';

// Interface voor een SaaS product
interface SaasProduct {
  id: string;
  name: string;
  description?: string;
  price: number;
  gl_account_id?: string;
  is_required?: boolean;
}

// Interface voor een SaaS abonnement
interface SaasSubscription {
  id: string;
  product_id: string;
  product?: SaasProduct;
  client_name: string;
  number_of_users: number;
  start_date: string;
  end_date?: string;
  is_active: boolean;
  renewal_date?: string;
  created_at: string;
}

export default function SaasRevenuePage() {
  const [saasProducts, setSaasProducts] = useState<SaasProduct[]>([]);
  const [subscriptions, setSubscriptions] = useState<SaasSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Effect voor het laden van de producten en abonnementen
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const supabase = getBrowserSupabaseClient();
        
        // Ophalen van SaaS producten
        const { data: productsData, error: productsError } = await supabase
          .from('products')
          .select('*')
          .eq('type', 'saas');
        
        if (productsError) throw productsError;
        
        // Ophalen van SaaS abonnementen
        const { data: subscriptionsData, error: subscriptionsError } = await supabase
          .from('saas_subscriptions')
          .select('*, product:product_id(*)');
        
        if (subscriptionsError) throw subscriptionsError;
        
        setSaasProducts(productsData || []);
        setSubscriptions(subscriptionsData || []);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err instanceof Error ? err.message : 'Er is een fout opgetreden bij het ophalen van de gegevens');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  // Functie voor het berekenen van de maandelijkse inkomsten voor een abonnement
  const calculateMonthlyRevenue = (subscription: SaasSubscription) => {
    if (!subscription.product) return 0;
    return subscription.product.price * subscription.number_of_users;
  };
  
  // Functie voor het berekenen van de jaarlijkse inkomsten voor een abonnement
  const calculateYearlyRevenue = (subscription: SaasSubscription) => {
    return calculateMonthlyRevenue(subscription) * 12;
  };
  
  // Functie voor het berekenen van de totale jaarlijkse inkomsten
  const calculateTotalRevenue = () => {
    return subscriptions.reduce((total, subscription) => {
      return total + calculateYearlyRevenue(subscription);
    }, 0);
  };
  
  // Functie voor het verwijderen van een abonnement
  const handleDelete = async (id: string) => {
    if (!confirm('Weet je zeker dat je dit abonnement wilt verwijderen?')) return;
    
    try {
      const supabase = getBrowserSupabaseClient();
      
      const { error } = await supabase
        .from('saas_subscriptions')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      // Update de state
      setSubscriptions(subscriptions.filter(sub => sub.id !== id));
    } catch (err) {
      console.error('Error deleting subscription:', err);
      setError(err instanceof Error ? err.message : 'Er is een fout opgetreden bij het verwijderen van het abonnement');
    }
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-[#1E1E3F]">SaaS Abonnementen</h1>
          <button
            onClick={() => {/* Implementeer nieuwe abonnementen */}}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Nieuw abonnement
          </button>
        </div>
        
        {error && (
          <div className="mb-4 p-4 text-sm text-red-700 bg-red-100 rounded-lg">
            {error}
          </div>
        )}
        
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Overzicht SaaS Abonnementen</h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Totale jaarlijkse SaaS omzet: {formatCurrency(calculateTotalRevenue())}
            </p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Gebruikers
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Start Datum
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Verlenging
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Maandelijks
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Jaarlijks
                  </th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">Acties</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {subscriptions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                      Geen SaaS abonnementen gevonden. Klik op "Nieuw abonnement" om er een toe te voegen.
                    </td>
                  </tr>
                ) : (
                  subscriptions.map((subscription) => (
                    <tr key={subscription.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {subscription.product?.name || "Onbekend product"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {subscription.client_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {subscription.number_of_users}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(subscription.start_date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {subscription.renewal_date ? new Date(subscription.renewal_date).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatCurrency(calculateMonthlyRevenue(subscription))}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatCurrency(calculateYearlyRevenue(subscription))}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => {/* Implementeer bewerken */}}
                          className="text-indigo-600 hover:text-indigo-900 mr-3"
                        >
                          <PencilIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(subscription.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </MainLayout>
  );
} 