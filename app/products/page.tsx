"use client";

import { useState, useEffect } from 'react';
import MainLayout from '@/app/components/MainLayout';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Product, ProductType } from '@/types/models';
import { getBrowserSupabaseClient } from '@/app/lib/supabase';
import type { Database } from '@/types/supabase';

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState<Omit<Product, 'id'>>({
    name: '',
    description: '',
    price: 0,
    type: 'saas' as ProductType,
    gl_account_id: '',
    is_required: false,
    organization_id: '00000000-0000-0000-0000-000000000000' // Default organization ID
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  // Producten ophalen
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const supabase = getBrowserSupabaseClient();
        
        // Haal alle producten op
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .order('name');
        
        if (error) throw error;
        
        setProducts(data || []);
      } catch (err) {
        console.error('Error fetching products:', err);
        setError(err instanceof Error ? err.message : 'Er is een fout opgetreden bij het ophalen van de producten');
      } finally {
        setLoading(false);
      }
    };
    
    fetchProducts();
  }, []);

  // Reset form helper
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: 0,
      type: 'saas',
      gl_account_id: '',
      is_required: false,
      organization_id: '00000000-0000-0000-0000-000000000000' // Ensure organization_id is reset properly
    });
    setShowModal(false);
    setIsEditing(false);
    setEditId(null);
  };

  // Formulier versturen
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    try {
      const supabase = getBrowserSupabaseClient();
      
      // Ensure formData has organization_id
      const dataToSubmit = {
        ...formData,
        organization_id: formData.organization_id || '00000000-0000-0000-0000-000000000000'
      };
      
      if (isEditing && editId) {
        // Update product
        const { error } = await supabase
          .from('products')
          .update(dataToSubmit)
          .eq('id', editId);
        
        if (error) throw error;
      } else {
        // Create new product
        const { error } = await supabase
          .from('products')
          .insert([dataToSubmit]);
        
        if (error) throw error;
      }
      
      // Refresh product list and reset form
      resetForm();
      
      // Refresh product list
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('name');
      
      if (error) throw error;
      
      setProducts(data || []);
    } catch (err) {
      console.error('Error saving product:', err);
      setError(err instanceof Error ? err.message : 'Er is een fout opgetreden bij het opslaan van het product');
    }
  };

  // Bewerking starten
  const handleEdit = (product: Product) => {
    setFormData({
      name: product.name,
      description: product.description || '',
      price: product.price,
      type: product.type,
      gl_account_id: product.gl_account_id || '',
      is_required: product.is_required || false,
      organization_id: product.organization_id || '00000000-0000-0000-0000-000000000000'
    });
    setIsEditing(true);
    setEditId(product.id);
    setShowModal(true);
  };

  // Product verwijderen
  const handleDelete = async (id: string) => {
    if (window.confirm('Weet je zeker dat je dit product wilt verwijderen?')) {
      try {
        const supabase = getBrowserSupabaseClient();
        
        const { error } = await supabase
          .from('products')
          .delete()
          .eq('id', id);
        
        if (error) throw error;
        
        // Update state
        setProducts(products.filter(product => product.id !== id));
      } catch (err) {
        console.error('Error deleting product:', err);
        setError(err instanceof Error ? err.message : 'Er is een fout opgetreden bij het verwijderen van het product');
      }
    }
  };

  // Form field handler
  const handleFormChange = (
    field: keyof Omit<Product, 'id'>,
    value: string | number | boolean
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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
          <h1 className="text-2xl font-bold text-[#1E1E3F]">Producten</h1>
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Nieuw product
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 text-sm text-red-700 bg-red-100 rounded-lg">
            {error}
          </div>
        )}

        <div className="bg-white shadow rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Naam
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Prijs
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Verplicht
                </th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Acties</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {products.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                    Geen producten gevonden. Klik op "Nieuw product" om er een toe te voegen.
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {product.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        product.type === 'saas' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {product.type === 'saas' ? 'SaaS' : 'Consultancy'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      €{product.price.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {product.is_required ? 'Ja' : 'Nee'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEdit(product)}
                        className="text-indigo-600 hover:text-indigo-900 mr-3"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
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

        {/* Modal for adding/editing products */}
        {showModal && (
          <div className="fixed inset-0 overflow-y-auto z-50 flex items-center justify-center">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>
            <div className="relative bg-white rounded-lg max-w-lg w-full mx-auto p-6 shadow-xl">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {isEditing ? 'Product bewerken' : 'Nieuw product'}
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <span className="sr-only">Sluiten</span>
                  &times;
                </button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                      Naam
                    </label>
                    <input
                      type="text"
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleFormChange('name', e.target.value)}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                      Omschrijving
                    </label>
                    <textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => handleFormChange('description', e.target.value)}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      rows={3}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="price" className="block text-sm font-medium text-gray-700">
                        Prijs
                      </label>
                      <div className="mt-1 relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <span className="text-gray-500 sm:text-sm">€</span>
                        </div>
                        <input
                          type="number"
                          id="price"
                          min="0"
                          step="0.01"
                          value={formData.price}
                          onChange={(e) => handleFormChange('price', parseFloat(e.target.value) || 0)}
                          className="mt-1 block w-full pl-7 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          required
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                        Type
                      </label>
                      <select
                        id="type"
                        value={formData.type}
                        onChange={(e) => handleFormChange('type', e.target.value as ProductType)}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      >
                        <option value="saas">SaaS</option>
                        <option value="consultancy">Consultancy</option>
                      </select>
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="gl_account_id" className="block text-sm font-medium text-gray-700">
                      Grootboekrekening ID
                    </label>
                    <input
                      type="text"
                      id="gl_account_id"
                      value={formData.gl_account_id}
                      onChange={(e) => handleFormChange('gl_account_id', e.target.value)}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="is_required"
                      checked={formData.is_required}
                      onChange={(e) => handleFormChange('is_required', e.target.checked)}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label htmlFor="is_required" className="ml-2 block text-sm text-gray-700">
                      Is verplicht product
                    </label>
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="mr-3 inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Annuleren
                  </button>
                  <button
                    type="submit"
                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    {isEditing ? 'Opslaan' : 'Toevoegen'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
} 