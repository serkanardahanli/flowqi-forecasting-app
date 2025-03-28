'use client';

import { useState, useEffect } from 'react';
import { useSupabase } from '@/app/hooks/useSupabase';
import MainLayout from '@/app/components/MainLayout';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Product, ProductType } from '@/types/models';
import { getOrganizationId, ensureClientUserProfile } from '@/app/utils/auth';

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState<Omit<Product, 'id' | 'organization_id' | 'created_at' | 'updated_at'>>({
    type: 'SaaS',
    name: '',
    price: 0,
    is_required: false
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { supabase } = useSupabase();

  // Producten ophalen
  const fetchProducts = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        console.error('Session error:', sessionError);
        window.location.href = '/auth/signin';
        return;
      }

      try {
        // Ensure user profile is properly set up
        await ensureClientUserProfile(session.user.id);
      } catch (profileError) {
        console.error('Error setting up user profile:', profileError);
        setError(profileError instanceof Error 
          ? `Fout bij gebruikersprofiel: ${profileError.message}` 
          : 'Fout bij het instellen van het gebruikersprofiel');
        setIsLoading(false);
        return;
      }
      
      const organizationId = await getOrganizationId();
      if (!organizationId) {
        setError('Geen organisatie gevonden. Log opnieuw in of neem contact op met ondersteuning.');
        setIsLoading(false);
        return;
      }
      
      console.log('Fetching products for organization:', organizationId);

      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('organization_id', organizationId)
        .order('type', { ascending: true })
        .order('name', { ascending: true });
      
      if (error) {
        console.error('Database error in fetchProducts:', error.message, error);
        throw new Error(`Database fout: ${error.message}`);
      }
      
      setProducts(data || []);
    } catch (error) {
      console.error('Error in fetchProducts:', error);
      setError(error instanceof Error ? error.message : 'Er is een onverwachte fout opgetreden');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Reset form helper
  const resetForm = () => {
    setFormData({
      type: 'SaaS',
      name: '',
      price: 0,
      is_required: false
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
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        console.error('Session error:', sessionError);
        window.location.href = '/auth/signin';
        return;
      }

      try {
        // Ensure user profile is properly set up
        await ensureClientUserProfile(session.user.id);
      } catch (profileError) {
        console.error('Error setting up user profile:', profileError);
        setError(profileError instanceof Error 
          ? `Fout bij gebruikersprofiel: ${profileError.message}` 
          : 'Fout bij het instellen van het gebruikersprofiel');
        return;
      }
      
      const organizationId = await getOrganizationId();
      if (!organizationId) {
        setError('Geen organisatie gevonden. Log opnieuw in of neem contact op met ondersteuning.');
        return;
      }
      
      console.log('Saving product for organization:', organizationId);
      
      if (isEditing && editId) {
        const { error } = await supabase
          .from('products')
          .update({...formData})
          .eq('id', editId);
        
        if (error) {
          console.error('Database error in update:', error.message, error);
          throw new Error(`Database fout bij bijwerken: ${error.message}`);
        }
      } else {
        const productData = {
          ...formData, 
          organization_id: organizationId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        console.log('Inserting product data:', productData);
        
        const { error, data } = await supabase
          .from('products')
          .insert([productData]);
        
        if (error) {
          console.error('Database error in insert:', error.message, error);
          throw new Error(`Database fout bij toevoegen: ${error.message}`);
        }
        
        console.log('Product inserted successfully:', data);
      }
      
      resetForm();
      await fetchProducts();
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      setError(error instanceof Error ? error.message : 'Er is een onverwachte fout opgetreden');
    }
  };

  // Bewerken
  const handleEdit = (product: Product) => {
    setFormData({
      type: product.type as ProductType,
      name: product.name,
      price: product.price,
      is_required: product.is_required || false
    });
    setIsEditing(true);
    setEditId(product.id);
    setShowModal(true);
  };

  // Verwijderen
  const handleDelete = async (id: string) => {
    if (window.confirm('Weet je zeker dat je dit product wilt verwijderen?')) {
      try {
        const { error } = await supabase
          .from('products')
          .delete()
          .eq('id', id);
        
        if (error) throw error;
        
        await fetchProducts();
      } catch (error) {
        console.error('Error deleting product:', error);
        setError(error instanceof Error ? error.message : 'Er is een onverwachte fout opgetreden');
      }
    }
  };

  // Form field handler
  const handleFormChange = (
    field: keyof Omit<Product, 'id' | 'organization_id' | 'created_at' | 'updated_at'>,
    value: string | number | boolean
  ) => {
    setFormData(prev => {
      if (field === 'price' && typeof value === 'string') {
        return { ...prev, [field]: parseFloat(value) || 0 };
      }
      return { ...prev, [field]: value };
    });
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-[#1E1E3F]">Producten</h1>
          <button
            onClick={() => {
              setFormData({
                type: 'SaaS',
                name: '',
                price: 0,
                is_required: false
              });
              setIsEditing(false);
              setEditId(null);
              setShowModal(true);
            }}
            className="px-4 py-2 bg-[#1E1E3F] text-white rounded-md hover:bg-[#3B3B7C] inline-flex items-center"
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            Nieuw product
          </button>
        </div>

        {/* Products Table */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-5 border-b border-gray-200">
            <h2 className="text-lg font-medium text-[#1E1E3F]">Productoverzicht</h2>
          </div>
          <div className="p-6">
            {error && (
              <div className="mb-4 p-4 text-sm text-red-700 bg-red-100 rounded-lg">
                {error}
              </div>
            )}
            
            {isLoading ? (
              <div className="text-center py-10">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#1E1E3F] border-r-transparent"></div>
                <p className="mt-4 text-gray-500">Producten laden...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Naam
                      </th>
                      <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Prijs
                      </th>
                      <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Verplicht
                      </th>
                      <th className="px-6 py-3 bg-gray-50 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acties
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
                        <tr key={product.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {product.type}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {product.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            € {product.price.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {product.is_required ? 'Ja' : 'Nee'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
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
            )}
          </div>
        </div>

        {/* Modal for adding/editing products */}
        {showModal && (
          <div className="fixed inset-0 overflow-y-auto z-50 flex items-center justify-center">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>
            <div className="relative bg-[#1E1E3F] text-white rounded-lg max-w-lg w-full mx-auto p-6 shadow-xl">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-white">
                  {isEditing ? 'Product bewerken' : 'Nieuw product'}
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-300 hover:text-white"
                >
                  <span className="sr-only">Sluiten</span>
                  &times;
                </button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label htmlFor="type" className="block text-sm font-medium text-gray-200 mb-1">
                    Type
                  </label>
                  <select
                    id="type"
                    value={formData.type}
                    onChange={(e) => handleFormChange('type', e.target.value as ProductType)}
                    className="w-full px-3 py-2 border border-gray-600 bg-[#2D2D5F] text-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  >
                    <option value="SaaS">SaaS</option>
                    <option value="Consultancy">Consultancy</option>
                  </select>
                </div>
                <div className="mb-4">
                  <label htmlFor="name" className="block text-sm font-medium text-gray-200 mb-1">
                    Naam
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleFormChange('name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-600 bg-[#2D2D5F] text-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label htmlFor="price" className="block text-sm font-medium text-gray-200 mb-1">
                    Prijs
                  </label>
                  <div className="relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-300 sm:text-sm">€</span>
                    </div>
                    <input
                      type="number"
                      id="price"
                      value={formData.price}
                      onChange={(e) => handleFormChange('price', e.target.value)}
                      className="w-full pl-7 pr-3 py-2 border border-gray-600 bg-[#2D2D5F] text-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                </div>
                <div className="mb-6">
                  <div className="flex items-center">
                    <input
                      id="is_required"
                      type="checkbox"
                      checked={formData.is_required}
                      onChange={(e) => handleFormChange('is_required', e.target.checked)}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-600 rounded"
                    />
                    <label htmlFor="is_required" className="ml-2 block text-sm text-gray-200">
                      Verplicht product
                    </label>
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm text-sm font-medium text-white hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 mr-3"
                  >
                    Annuleren
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
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