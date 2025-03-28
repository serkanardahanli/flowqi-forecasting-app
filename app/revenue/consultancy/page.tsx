'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/types/supabase';
import { Product, PlannedConsultancyRevenue } from '@/types/models';
import { PencilIcon, TrashIcon, PlusIcon } from '@heroicons/react/24/outline';
import { formatCurrency } from '@/lib/utils';

export default function ConsultancyRevenuePage() {
  const supabase = createClientComponentClient<Database>();
  const [products, setProducts] = useState<Product[]>([]);
  const [plannedRevenue, setPlannedRevenue] = useState<PlannedConsultancyRevenue[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState<Partial<PlannedConsultancyRevenue>>({
    client_name: '',
    project_name: '',
    start_date: '',
    end_date: '',
    hourly_rate: 0,
    hours_per_month: 0,
  });
  const [editing, setEditing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const getOrganizationId = async (): Promise<string | null> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return null;

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', session.user.id)
      .single();

    if (error || !profile?.organization_id) {
      console.error('Error getting organization ID:', error?.message || 'No organization found');
      return null;
    }

    return profile.organization_id;
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const organizationId = await getOrganizationId();
      if (!organizationId) {
        setError('Geen organisatie gevonden. Log opnieuw in of neem contact op met ondersteuning.');
        setLoading(false);
        return;
      }

      // Fetch products (consultancy type)
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('type', 'Consultancy');

      if (productsError) {
        throw new Error(`Error fetching products: ${productsError.message}`);
      }

      // Fetch planned consultancy revenue
      const { data: revenueData, error: revenueError } = await supabase
        .from('planned_consultancy_revenue')
        .select('*')
        .eq('organization_id', organizationId);

      if (revenueError) {
        throw new Error(`Error fetching planned revenue: ${revenueError.message}`);
      }

      setProducts(productsData || []);
      setPlannedRevenue(revenueData || []);
    } catch (err) {
      console.error('Error:', err);
      setError(err instanceof Error ? err.message : 'Er is een fout opgetreden bij het ophalen van gegevens');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const resetForm = () => {
    setFormData({
      client_name: '',
      project_name: '',
      start_date: '',
      end_date: '',
      hourly_rate: 0,
      hours_per_month: 0,
    });
    setEditing(null);
    setError(null);
  };

  const handleOpenModal = () => {
    resetForm();
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const organizationId = await getOrganizationId();
      if (!organizationId) {
        setError('Geen organisatie gevonden. Log opnieuw in of neem contact op met ondersteuning.');
        return;
      }

      const newEntry = {
        ...formData,
        organization_id: organizationId,
      } as PlannedConsultancyRevenue;

      if (editing) {
        // Update existing entry
        const { error } = await supabase
          .from('planned_consultancy_revenue')
          .update(newEntry)
          .eq('id', editing);

        if (error) throw new Error(`Error updating entry: ${error.message}`);
      } else {
        // Create new entry
        const { error } = await supabase
          .from('planned_consultancy_revenue')
          .insert([newEntry]);

        if (error) throw new Error(`Error creating entry: ${error.message}`);
      }

      // Refresh data
      await fetchData();
      handleCloseModal();
    } catch (err) {
      console.error('Error:', err);
      setError(err instanceof Error ? err.message : 'Er is een fout opgetreden');
    }
  };

  const handleEdit = (entry: PlannedConsultancyRevenue) => {
    setFormData({
      client_name: entry.client_name,
      project_name: entry.project_name,
      start_date: entry.start_date,
      end_date: entry.end_date,
      hourly_rate: entry.hourly_rate,
      hours_per_month: entry.hours_per_month,
    });
    setEditing(entry.id);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Weet je zeker dat je deze geplande omzet wilt verwijderen?')) return;

    try {
      const { error } = await supabase
        .from('planned_consultancy_revenue')
        .delete()
        .eq('id', id);

      if (error) throw new Error(`Error deleting entry: ${error.message}`);

      // Refresh data
      await fetchData();
    } catch (err) {
      console.error('Error:', err);
      setError(err instanceof Error ? err.message : 'Er is een fout opgetreden bij het verwijderen');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }));
  };

  // Calculate monthly revenue for the duration of a consultancy project
  const calculateMonthlyRevenue = (entry: PlannedConsultancyRevenue) => {
    return entry.hourly_rate * entry.hours_per_month;
  };

  // Calculate total value for a consultancy project
  const calculateTotalValue = (entry: PlannedConsultancyRevenue) => {
    const startDate = new Date(entry.start_date);
    const endDate = new Date(entry.end_date);
    
    // Calculate months difference (including partial months)
    const months = (endDate.getFullYear() - startDate.getFullYear()) * 12 + 
                   (endDate.getMonth() - startDate.getMonth()) + 1;
    
    return Math.max(1, months) * entry.hourly_rate * entry.hours_per_month;
  };

  const calculateFormTotal = () => {
    if (!formData.start_date || !formData.end_date) return 0;
    
    const startDate = new Date(formData.start_date);
    const endDate = new Date(formData.end_date);
    
    // Calculate months difference (including partial months)
    const months = (endDate.getFullYear() - startDate.getFullYear()) * 12 + 
                   (endDate.getMonth() - startDate.getMonth()) + 1;
    
    return Math.max(1, months) * (formData.hourly_rate || 0) * (formData.hours_per_month || 0);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Consultancy Omzetplanning</h1>
        <button
          onClick={handleOpenModal}
          className="bg-[#1E1E3F] text-white px-4 py-2 rounded flex items-center"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Project toevoegen
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-8">
          <svg className="animate-spin h-8 w-8 text-[#1E1E3F]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden rounded-lg">
          {plannedRevenue.length === 0 ? (
            <div className="py-8 text-center text-gray-500">
              Geen consultancy projecten gevonden. Voeg een project toe om te beginnen.
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Project
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Periode
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Uurtarief
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Uren per maand
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Maandelijkse omzet
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Totale waarde
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acties
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {plannedRevenue.map((entry) => (
                  <tr key={entry.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {entry.client_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {entry.project_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(entry.start_date).toLocaleDateString()} - {new Date(entry.end_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(entry.hourly_rate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {entry.hours_per_month}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(calculateMonthlyRevenue(entry))}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(calculateTotalValue(entry))}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEdit(entry)}
                        className="text-indigo-600 hover:text-indigo-900 mr-4"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(entry.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Modal for adding/editing planned revenue */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-semibold mb-4">
              {editing ? 'Project bewerken' : 'Nieuw project toevoegen'}
            </h2>
            
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Klantnaam</label>
                  <input
                    type="text"
                    name="client_name"
                    value={formData.client_name || ''}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Projectnaam</label>
                  <input
                    type="text"
                    name="project_name"
                    value={formData.project_name || ''}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    required
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Startdatum</label>
                    <input
                      type="date"
                      name="start_date"
                      value={formData.start_date || ''}
                      onChange={handleChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Einddatum</label>
                    <input
                      type="date"
                      name="end_date"
                      value={formData.end_date || ''}
                      onChange={handleChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Uurtarief (€)</label>
                  <input
                    type="number"
                    name="hourly_rate"
                    value={formData.hourly_rate || ''}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Uren per maand</label>
                  <input
                    type="number"
                    name="hours_per_month"
                    value={formData.hours_per_month || ''}
                    onChange={handleChange}
                    min="0"
                    step="1"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Totale waarde</label>
                  <div className="mt-1 block w-full border border-gray-200 bg-gray-50 rounded-md shadow-sm py-2 px-3 text-gray-700 sm:text-sm">
                    {formatCurrency(calculateFormTotal())}
                  </div>
                </div>
              </div>
              
              {error && (
                <div className="mt-4 text-sm text-red-600">
                  {error}
                </div>
              )}
              
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Annuleren
                </button>
                <button
                  type="submit"
                  className="bg-[#1E1E3F] py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-[#2D2D5F] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  {editing ? 'Opslaan' : 'Toevoegen'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 