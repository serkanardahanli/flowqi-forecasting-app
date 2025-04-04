"use client";

import { useEffect, useState } from 'react';
import { getBrowserSupabaseClient } from '@/app/lib/supabase';
import MainLayout from '@/app/components/MainLayout';

export default function ProductsTestPage() {
  const [message, setMessage] = useState('Pagina laden...');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const testSupabase = async () => {
      try {
        setLoading(true);
        const supabase = getBrowserSupabaseClient();
        
        // Test basis query
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .order('name');
        
        if (error) throw error;
        
        setProducts(data || []);
        setMessage(`Verbinding met Supabase geslaagd. ${data?.length || 0} producten gevonden.`);
      } catch (error) {
        console.error('Error in testSupabase:', error);
        setMessage(`Fout bij verbinden met Supabase: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };
    
    testSupabase();
  }, []);

  return (
    <MainLayout>
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Producten Test Pagina</h1>
        
        <div className="bg-white p-4 rounded shadow mb-4">
          {message}
        </div>

        {loading ? (
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : products.length > 0 ? (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Naam</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Prijs</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {products.map((product) => (
                  <tr key={product.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{product.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.type}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">€{product.price?.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-white p-4 rounded shadow text-center text-gray-500">
            Geen producten gevonden
          </div>
        )}
      </div>
    </MainLayout>
  );
} 