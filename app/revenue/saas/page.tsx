'use client';

import { useState, useEffect } from 'react';
import { useSupabase } from '@/app/hooks/useSupabase';
import MainLayout from '@/app/components/MainLayout';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { PlannedSaasRevenue, Product } from '@/types/models';
import { getOrganizationId, ensureClientUserProfile } from '@/app/utils/auth';

export default function SaasRevenuePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [plannedRevenue, setPlannedRevenue] = useState<PlannedSaasRevenue[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState<Omit<PlannedSaasRevenue, 'id' | 'organization_id' | 'created_at' | 'updated_at'>>({
    product_id: '',
    month: new Date().getMonth() + 1, // Huidige maand (1-12)
    year: new Date().getFullYear(),
    users: 1,
    amount: 0
  });
  const [selectedProductPrice, setSelectedProductPrice] = useState<number>(0);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { supabase } = useSupabase();

  // Data ophalen
  const fetchData = async () => {
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
      
      console.log('Fetching SaaS revenue data for organization:', organizationId);

      // Producten ophalen (alleen SaaS)
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('type', 'SaaS')
        .order('name');
      
      if (productsError) {
        console.error('Error fetching products:', productsError.message, productsError);
        throw new Error(`Fout bij ophalen producten: ${productsError.message}`);
      }
      
      setProducts(productsData || []);

      // Geplande omzet ophalen
      const { data: revenueData, error: revenueError } = await supabase
        .from('planned_saas_revenue')
        .select('*')
        .eq('organization_id', organizationId)
        .order('year', { ascending: true })
        .order('month', { ascending: true });
      
      if (revenueError) {
        console.error('Error fetching revenue:', revenueError.message, revenueError);
        throw new Error(`Fout bij ophalen omzetplanning: ${revenueError.message}`);
      }
      
      setPlannedRevenue(revenueData || []);
    } catch (error) {
      console.error('Error in fetchData:', error);
      setError(error instanceof Error ? error.message : 'Er is een onverwachte fout opgetreden');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Reset form helper
  const resetForm = () => {
    setFormData({
      product_id: '',
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
      users: 1,
      amount: 0
    });
    setSelectedProductPrice(0);
    setShowModal(false);
    setIsEditing(false);
    setEditId(null);
  };

  // Update het bedrag op basis van product en aantal gebruikers
  useEffect(() => {
    if (formData.product_id && formData.users) {
      const product = products.find(p => p.id === formData.product_id);
      if (product) {
        setSelectedProductPrice(product.price);
        setFormData(prev => ({
          ...prev,
          amount: product.price * formData.users
        }));
      }
    }
  }, [formData.product_id, formData.users, products]);

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
      
      console.log('Saving SaaS revenue for organization:', organizationId);
      
      if (isEditing && editId) {
        const { error } = await supabase
          .from('planned_saas_revenue')
          .update({...formData})
          .eq('id', editId);
        
        if (error) {
          console.error('Error updating revenue:', error.message, error);
          throw new Error(`Fout bij bijwerken omzetplanning: ${error.message}`);
        }
      } else {
        // Check of er al een entry is voor deze product_id, month, year
        const { data: existingData, error: checkError } = await supabase
          .from('planned_saas_revenue')
          .select('id')
          .eq('product_id', formData.product_id)
          .eq('month', formData.month)
          .eq('year', formData.year)
          .eq('organization_id', organizationId);
          
        if (checkError) {
          console.error('Error checking existing data:', checkError.message, checkError);
          throw new Error(`Fout bij controleren duplicaten: ${checkError.message}`);
        }
        
        if (existingData && existingData.length > 0) {
          throw new Error('Er bestaat al een planning voor dit product in deze maand en jaar');
        }

        const revenueData = {
          ...formData, 
          organization_id: organizationId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        console.log('Inserting revenue data:', revenueData);
        
        const { error } = await supabase
          .from('planned_saas_revenue')
          .insert([revenueData]);
        
        if (error) {
          console.error('Error inserting revenue:', error.message, error);
          throw new Error(`Fout bij toevoegen omzetplanning: ${error.message}`);
        }
      }
      
      resetForm();
      await fetchData();
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      setError(error instanceof Error ? error.message : 'Er is een onverwachte fout opgetreden');
    }
  };

  // Bewerken
  const handleEdit = (item: PlannedSaasRevenue) => {
    const product = products.find(p => p.id === item.product_id);
    setFormData({
      product_id: item.product_id,
      month: item.month,
      year: item.year,
      users: item.users,
      amount: item.amount
    });
    setSelectedProductPrice(product?.price || 0);
    setIsEditing(true);
    setEditId(item.id);
    setShowModal(true);
  };

  // Verwijderen
  const handleDelete = async (id: string) => {
    if (window.confirm('Weet je zeker dat je deze planning wilt verwijderen?')) {
      try {
        const { error } = await supabase
          .from('planned_saas_revenue')
          .delete()
          .eq('id', id);
        
        if (error) throw error;
        
        await fetchData();
      } catch (error) {
        console.error('Error deleting planned revenue:', error);
        setError(error instanceof Error ? error.message : 'Er is een onverwachte fout opgetreden');
      }
    }
  };

  // Form field handler
  const handleFormChange = (
    field: keyof Omit<PlannedSaasRevenue, 'id' | 'organization_id' | 'created_at' | 'updated_at'>,
    value: string | number
  ) => {
    setFormData(prev => {
      if (field === 'users' && typeof value === 'string') {
        const users = parseInt(value) || 0;
        return { 
          ...prev, 
          users,
          amount: selectedProductPrice * users
        };
      }
      return { ...prev, [field]: value };
    });
  };

  // Helper om maandnaam te krijgen
  const getMonthName = (month: number) => {
    const monthNames = [
      'Januari', 'Februari', 'Maart', 'April', 'Mei', 'Juni',
      'Juli', 'Augustus', 'September', 'Oktober', 'November', 'December'
    ];
    return monthNames[month - 1];
  };

  // Helper om productnaam te krijgen
  const getProductName = (productId: string) => {
    const product = products.find(p => p.id === productId);
    return product ? product.name : 'Onbekend product';
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-[#1E1E3F]">SaaS Omzetplanning</h1>
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="px-4 py-2 bg-[#1E1E3F] text-white rounded-md hover:bg-[#3B3B7C] inline-flex items-center"
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            Nieuwe planning toevoegen
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 text-sm text-red-700 bg-red-100 rounded-lg">
            {error}
          </div>
        )}

        {products.length === 0 && !isLoading && (
          <div className="mb-4 p-4 text-sm text-yellow-700 bg-yellow-100 rounded-lg">
            Je hebt nog geen SaaS-producten. Ga naar de <a href="/products" className="underline">producten pagina</a> om eerst producten toe te voegen.
          </div>
        )}

        {/* Planned Revenue Table */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-5 border-b border-gray-200">
            <h2 className="text-lg font-medium text-[#1E1E3F]">Geplande SaaS omzet</h2>
          </div>
          <div className="p-6">
            {isLoading ? (
              <div className="text-center py-10">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#1E1E3F] border-r-transparent"></div>
                <p className="mt-4 text-gray-500">Gegevens laden...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Product
                      </th>
                      <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Maand
                      </th>
                      <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Jaar
                      </th>
                      <th className="px-6 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Gebruikers
                      </th>
                      <th className="px-6 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Prijs per gebruiker
                      </th>
                      <th className="px-6 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Bedrag
                      </th>
                      <th className="px-6 py-3 bg-gray-50 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acties
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {plannedRevenue.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                          Geen planningen gevonden. Klik op "Nieuwe planning" om er een toe te voegen.
                        </td>
                      </tr>
                    ) : (
                      plannedRevenue.map((item) => {
                        const product = products.find(p => p.id === item.product_id);
                        const pricePerUser = product ? product.price : 0;
                        
                        return (
                          <tr key={item.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {getProductName(item.product_id)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {getMonthName(item.month)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {item.year}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                              {item.users}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                              € {pricePerUser.toFixed(2)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium text-right">
                              € {item.amount.toFixed(2)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                              <button
                                onClick={() => handleEdit(item)}
                                className="text-indigo-600 hover:text-indigo-900 mr-3"
                              >
                                <PencilIcon className="h-5 w-5" />
                              </button>
                              <button
                                onClick={() => handleDelete(item.id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                <TrashIcon className="h-5 w-5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Modal for adding/editing */}
        {showModal && (
          <div className="fixed inset-0 overflow-y-auto z-50 flex items-center justify-center">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>
            <div className="relative bg-[#1E1E3F] text-white rounded-lg max-w-lg w-full mx-auto p-6 shadow-xl">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-white">
                  {isEditing ? 'Planning bewerken' : 'Nieuwe planning'}
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
                <div className="space-y-4">
                  <div>
                    <label htmlFor="product_id" className="block text-sm font-medium text-gray-200">
                      Product
                    </label>
                    <select
                      id="product_id"
                      value={formData.product_id}
                      onChange={(e) => handleFormChange('product_id', e.target.value)}
                      className="mt-1 block w-full px-3 py-2 border border-gray-600 bg-[#2D2D5F] text-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      required
                    >
                      <option value="">Selecteer een product</option>
                      {products.map(product => (
                        <option key={product.id} value={product.id}>
                          {product.name} (€{product.price.toFixed(2)} per gebruiker)
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="month" className="block text-sm font-medium text-gray-200">
                        Maand
                      </label>
                      <select
                        id="month"
                        value={formData.month}
                        onChange={(e) => handleFormChange('month', parseInt(e.target.value))}
                        className="mt-1 block w-full px-3 py-2 border border-gray-600 bg-[#2D2D5F] text-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        required
                      >
                        {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                          <option key={month} value={month}>
                            {getMonthName(month)}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label htmlFor="year" className="block text-sm font-medium text-gray-200">
                        Jaar
                      </label>
                      <select
                        id="year"
                        value={formData.year}
                        onChange={(e) => handleFormChange('year', parseInt(e.target.value))}
                        className="mt-1 block w-full px-3 py-2 border border-gray-600 bg-[#2D2D5F] text-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        required
                      >
                        {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() + i).map(year => (
                          <option key={year} value={year}>{year}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="users" className="block text-sm font-medium text-gray-200">
                      Aantal gebruikers
                    </label>
                    <input
                      type="number"
                      id="users"
                      min="1"
                      value={formData.users}
                      onChange={(e) => handleFormChange('users', e.target.value)}
                      className="mt-1 block w-full px-3 py-2 border border-gray-600 bg-[#2D2D5F] text-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-200">
                      Bedrag (automatisch berekend)
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-300 sm:text-sm">€</span>
                      </div>
                      <input
                        type="text"
                        value={formData.amount.toFixed(2)}
                        className="block w-full pl-7 pr-3 py-2 border border-gray-600 bg-[#2D2D5F] text-white rounded-md shadow-sm focus:outline-none sm:text-sm"
                        readOnly
                      />
                    </div>
                    <p className="mt-1 text-sm text-gray-300">
                      {formData.users} gebruikers x € {selectedProductPrice.toFixed(2)} per gebruiker
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
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