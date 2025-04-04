"use client";

import { useState, useEffect } from 'react';
import MainLayout from '@/app/components/MainLayout';
import { PlusIcon } from '@heroicons/react/24/outline';
import { Product, ProductType } from '@/types/models';
import { getBrowserSupabaseClient } from '@/app/lib/supabase';

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
  const [success, setSuccess] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  // Producten ophalen bij eerste render
  useEffect(() => {
    fetchProducts();
  }, []); // Lege dependency array zorgt ervoor dat dit slechts één keer wordt uitgevoerd

  // Producten ophalen
  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const supabase = getBrowserSupabaseClient();
      
      // Eenvoudige query zonder complexe joins om eerst te controleren of dit werkt
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('name');
      
      if (error) {
        console.error('Error fetching products:', error);
        throw error;
      }
      
      console.log('Products loaded:', data?.length || 0);
      setProducts(data || []);
    } catch (err) {
      console.error('Error in fetchProducts:', err);
      setError(err instanceof Error ? err.message : 'Er is een fout opgetreden bij het ophalen van de producten');
    } finally {
      setLoading(false);
    }
  };

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
    try {
      setLoading(true);
      setError(null);
      
      const supabase = getBrowserSupabaseClient();
      
      // Alleen velden meesturen die in de database bestaan
      const productData = {
        name: formData.name,
        description: formData.description || null,
        price: formData.price ? parseFloat(formData.price.toString()) : 0,
        type: formData.type,
        gl_account_id: formData.gl_account_id || null,
        is_required: Boolean(formData.is_required),
        organization_id: formData.organization_id
      };
      
      if (isEditing && editId) {
        // Update product
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', editId);
        
        if (error) throw error;
      } else {
        // Create new product
        const { error } = await supabase
          .from('products')
          .insert([productData]);
        
        if (error) throw error;
      }
      
      // Reset form
      resetForm();
      
      // Refresh product list
      fetchProducts();
      
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Error in handleSubmit:', err);
      setError(err instanceof Error ? err.message : 'Er is een fout opgetreden bij het opslaan van het product');
    } finally {
      setLoading(false);
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
    // For price field, handle empty string case to avoid NaN
    if (field === 'price') {
      setFormData(prev => ({ 
        ...prev, 
        [field]: value === '' ? '' : parseFloat(value.toString()) 
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  // Synchroniseer grootboekrekeningen met producten
  const handleSyncGLAccounts = async () => {
    try {
      setLoading(true);
      setError(null);
      setSyncMessage(null);
      
      const supabase = getBrowserSupabaseClient();
      
      // Haal alle inkomsten grootboekrekeningen op
      const { data: glAccounts, error: glError } = await supabase
        .from('gl_accounts')
        .select('id, code, name, category')
        .eq('type', 'Inkomsten');
        
      if (glError) {
        console.error('Error fetching GL accounts:', glError);
        throw new Error(`Fout bij ophalen grootboekrekeningen: ${glError.message}`);
      }
      
      if (!glAccounts || glAccounts.length === 0) {
        setSyncMessage('Geen inkomsten grootboekrekeningen gevonden.');
        return;
      }
      
      console.log('Found GL accounts:', glAccounts.length);
      
      // Controleer welke al bestaan als product
      const { data: existingProducts, error: checkError } = await supabase
        .from('products')
        .select('code');
        
      if (checkError) {
        console.error('Error checking existing products:', checkError);
        throw new Error(`Fout bij controleren bestaande producten: ${checkError.message}`);
      }
      
      const existingCodes = existingProducts?.map(p => p.code) || [];
      console.log('Existing product codes:', existingCodes);
      
      // Filter alleen nieuwe rekeningen
      const newAccounts = glAccounts.filter(acc => !existingCodes.includes(acc.code));
      
      if (newAccounts.length === 0) {
        setSyncMessage('Alle grootboekrekeningen zijn al gesynchroniseerd.');
        return;
      }
      
      console.log('New accounts to add:', newAccounts.length);
      
      // Maak eenvoudige producten aan met alleen de verplichte velden
      let successCount = 0;
      let errorCount = 0;
      
      for (const account of newAccounts) {
        try {
          // Alleen verplichte velden + enkele extra's
          const productData = {
            code: account.code,
            name: account.name,
            price: 29.99,
            category: account.category || 'Overig',
            type: account.category || 'Overig',
            gl_account_id: account.id
          };
          
          console.log('Adding product:', productData);
          
          const { error: insertError } = await supabase
            .from('products')
            .insert([productData]);
            
          if (insertError) {
            console.error(`Error adding product ${account.name}:`, insertError);
            errorCount++;
          } else {
            successCount++;
          }
        } catch (err) {
          console.error(`Exception when adding product ${account.name}:`, err);
          errorCount++;
        }
      }
      
      if (errorCount > 0) {
        setSyncMessage(`${successCount} producten succesvol aangemaakt, ${errorCount} fouten.`);
      } else {
        setSyncMessage(`${successCount} nieuwe producten aangemaakt.`);
      }
      
      // Refresh product list
      fetchProducts();
    } catch (err) {
      console.error('Error in handleSyncGLAccounts:', err);
      setError(err instanceof Error ? err.message : 'Er is een fout opgetreden bij het synchroniseren van grootboekrekeningen');
    } finally {
      setLoading(false);
    }
  };

  // Handmatige toevoegmethode voor Support Tool
  const handleAddSupportTool = async () => {
    try {
      setLoading(true);
      setError(null);
      setSyncMessage(null);
      
      const supabase = getBrowserSupabaseClient();
      
      // Controleer of Support Tool al bestaat
      const { data: existing, error: checkError } = await supabase
        .from('products')
        .select('*')
        .eq('code', '8022');
        
      if (checkError) {
        console.error('Error checking existing Support Tool:', checkError);
        throw new Error(`Fout bij controleren bestaand Support Tool product: ${checkError.message}`);
      }
      
      if (existing && existing.length > 0) {
        setSyncMessage('Support Tool product bestaat al!');
        return;
      }
      
      // Haal de GL-rekening op voor Support Tool
      const { data: glAccount, error: glError } = await supabase
        .from('gl_accounts')
        .select('id')
        .eq('code', '8022')
        .single();
        
      if (glError) {
        if (glError.code === 'PGRST116') { // Niet gevonden
          console.log('GL account for Support Tool not found, creating product without GL link');
          
          // Maak het product zonder GL-koppeling
          const basicProduct = {
            code: '8022',
            name: 'Support Tool',
            price: 39.99,
            type: 'saas',
            category: 'SaaS'
          };
          
          const { error: insertError } = await supabase
            .from('products')
            .insert([basicProduct]);
            
          if (insertError) {
            console.error('Error inserting Support Tool product:', insertError);
            throw new Error(`Fout bij toevoegen Support Tool product: ${insertError.message}`);
          }
          
          setSyncMessage('Support Tool product aangemaakt (zonder GL-koppeling)');
        } else {
          console.error('Error fetching GL account for Support Tool:', glError);
          throw new Error(`Fout bij ophalen grootboekrekening voor Support Tool: ${glError.message}`);
        }
      } else {
        console.log('GL account found for Support Tool, creating product with GL link');
        
        // Maak het product met GL-koppeling
        const productWithGL = {
          code: '8022',
          name: 'Support Tool',
          price: 39.99,
          type: 'saas',
          category: 'SaaS',
          gl_account_id: glAccount.id
        };
        
        const { error: insertError } = await supabase
          .from('products')
          .insert([productWithGL]);
          
        if (insertError) {
          console.error('Error inserting Support Tool product with GL link:', insertError);
          throw new Error(`Fout bij toevoegen Support Tool product: ${insertError.message}`);
        }
        
        setSyncMessage('Support Tool product aangemaakt en gekoppeld aan GL-rekening');
      }
      
      // Refresh product list
      fetchProducts();
    } catch (err) {
      console.error('Error in handleAddSupportTool:', err);
      setError(err instanceof Error ? err.message : 'Er is een fout opgetreden bij het toevoegen van Support Tool');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-[#1E1E3F]">Producten</h1>
          <div className="flex space-x-2">
            <button
              onClick={handleSyncGLAccounts}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700"
              disabled={loading}
            >
              Sync GL Rekeningen
            </button>
            <button
              onClick={handleAddSupportTool}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
              disabled={loading}
            >
              Support Tool Toevoegen
            </button>
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
        </div>

        {error && (
          <div className="mb-4 p-4 text-sm text-red-700 bg-red-100 rounded-lg">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 text-sm text-green-700 bg-green-100 rounded-lg">
            Product succesvol opgeslagen!
          </div>
        )}

        {syncMessage && (
          <div className="mb-4 p-4 text-sm text-blue-700 bg-blue-100 rounded-lg">
            {syncMessage}
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
                  Grootboekrekening
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
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
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
                        product.type === 'saas' ? 'bg-blue-100 text-blue-800' : 
                        product.type === 'hardware' ? 'bg-green-100 text-green-800' : 
                        product.type === 'service' ? 'bg-purple-100 text-purple-800' : 
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {product.type === 'saas' ? 'SaaS' : 
                         product.type === 'hardware' ? 'Hardware' : 
                         product.type === 'service' ? 'Service' : 
                         product.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      €{product.price.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {product.gl_account_id ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                          {product.gl_account_id}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {product.is_required ? 'Ja' : 'Nee'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEdit(product)}
                        className="text-indigo-600 hover:text-indigo-900 mr-3"
                      >
                        Bewerken
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Verwijderen
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
                          value={formData.price === 0 ? '' : formData.price}
                          onChange={(e) => handleFormChange('price', e.target.value)}
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
                        <option value="hardware">Hardware</option>
                        <option value="service">Service</option>
                        <option value="other">Overig</option>
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