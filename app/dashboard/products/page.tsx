'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getBrowserSupabaseClient } from '@/app/lib/supabase';
import { PlusIcon, ShoppingBagIcon } from '@heroicons/react/24/outline';

type Product = {
  id: string;
  name: string;
  price: number;
  description: string;
  created_at: string;
};

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProducts() {
      try {
        const supabase = getBrowserSupabaseClient();
        
        // Get all products
        const { data, error: productsError } = await supabase
          .from('products')
          .select('*')
          .order('name', { ascending: true });
        
        if (productsError) {
          throw new Error(productsError.message);
        }
        
        setProducts(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        console.error('Error fetching products:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, []);

  return (
    <>
      {loading ? (
        <div className="p-6 flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-gray-500">Loading products...</p>
          </div>
        </div>
      ) : error ? (
        <div className="p-6">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-800">Error: {error}</p>
          </div>
        </div>
      ) : (
        <div className="p-6 space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">Products</h1>
            <Link 
              href="/dashboard/products/new" 
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Add Product
            </Link>
          </div>
          
          {products.length === 0 ? (
            <div className="text-center py-10 bg-white rounded-lg border shadow-sm">
              <ShoppingBagIcon className="h-12 w-12 mx-auto text-gray-400" />
              <h3 className="mt-2 text-sm font-semibold text-gray-900">No products</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by adding your first product.</p>
              <div className="mt-6">
                <Link
                  href="/dashboard/products/new"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-50 hover:bg-indigo-100"
                >
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Add Product
                </Link>
              </div>
            </div>
          ) : (
            <div className="bg-white shadow-sm rounded-lg overflow-hidden border">
              <ul className="divide-y divide-gray-200">
                {products.map((product) => (
                  <li key={product.id} className="hover:bg-gray-50">
                    <Link href={`/dashboard/products/${product.id}`} className="block px-6 py-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{product.name}</p>
                          <p className="text-sm text-gray-500 mt-1 line-clamp-1">{product.description || 'No description'}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">€{product.price.toFixed(2)}</p>
                        </div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </>
  );
} 